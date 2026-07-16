import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import crypto from 'node:crypto';
import { secureEqual } from './security.js';

const defaultWebAuthn = {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
};

export class PasskeyError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'PasskeyError';
    this.status = status;
  }
}

function normalizeUsername(value) {
  const username = String(value || '').trim().toLowerCase();
  if (!/^[a-z0-9._@+-]{3,64}$/.test(username)) {
    throw new PasskeyError('Användarnamnet måste vara 3–64 tecken och får bara innehålla bokstäver, siffror, punkt, bindestreck, plus, @ och understreck.');
  }
  return username;
}

function normalizeDisplayName(value) {
  const displayName = String(value || '').trim();
  if (displayName.length < 2 || displayName.length > 100) {
    throw new PasskeyError('Namnet måste vara mellan 2 och 100 tecken.');
  }
  return displayName;
}

function requireObject(value, message = 'Ogiltigt svar från webbläsaren.') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PasskeyError(message);
  return value;
}

function credentialForVerification(credential) {
  return {
    id: credential.id,
    publicKey: new Uint8Array(credential.public_key),
    counter: credential.counter,
    transports: credential.transports,
  };
}

export function createPasskeyService(store, config, webauthn = defaultWebAuthn) {
  async function registrationOptions(input) {
    if (!config.signupEnabled) throw new PasskeyError('Registrering med passkey är inte aktiverad.', 403);
    if (!secureEqual(input.signupCode || '', config.signupCode)) {
      throw new PasskeyError('Registreringskoden är fel.', 403);
    }
    const username = normalizeUsername(input.username);
    const displayName = normalizeDisplayName(input.displayName);
    if (username === config.adminUsername.toLowerCase()) {
      throw new PasskeyError('Användarnamnet är reserverat för systemadministratören.', 409);
    }
    if (store.getCmsUserByUsername(username)) throw new PasskeyError('Användarnamnet är redan registrerat.', 409);

    const userHandle = crypto.randomBytes(32);
    const options = await webauthn.generateRegistrationOptions({
      rpName: config.passkeyRpName,
      rpID: config.passkeyRpId,
      userName: username,
      userID: userHandle,
      userDisplayName: displayName,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'required',
      },
    });
    const flow = store.createWebAuthnChallenge({
      type: 'registration',
      challenge: options.challenge,
      username,
      displayName,
      userHandle,
    });
    return { flow, options };
  }

  async function verifyRegistration(input) {
    if (!config.signupEnabled) throw new PasskeyError('Registrering med passkey är inte aktiverad.', 403);
    const body = requireObject(input);
    const response = requireObject(body.response);
    const challenge = store.getWebAuthnChallenge(String(body.flow || ''), 'registration');
    if (!challenge) throw new PasskeyError('Registreringen har gått ut. Börja om och skapa din passkey igen.', 410);
    if (store.getCmsUserByUsername(challenge.username)) throw new PasskeyError('Användarnamnet är redan registrerat.', 409);

    let verification;
    try {
      verification = await webauthn.verifyRegistrationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: config.passkeyOrigin,
        expectedRPID: config.passkeyRpId,
        requireUserVerification: true,
      });
    } catch {
      throw new PasskeyError('Passkey kunde inte verifieras. Försök igen.');
    }
    if (!verification.verified || !verification.registrationInfo) {
      throw new PasskeyError('Passkey kunde inte verifieras. Försök igen.');
    }

    const info = verification.registrationInfo;
    try {
      return store.registerCmsUser(body.flow, challenge, {
        id: info.credential.id,
        publicKey: info.credential.publicKey,
        counter: info.credential.counter,
        transports: info.credential.transports || response.response?.transports || [],
        deviceType: info.credentialDeviceType,
        backedUp: info.credentialBackedUp,
      });
    } catch (error) {
      if (String(error.message).includes('UNIQUE constraint failed')) {
        throw new PasskeyError('Användaren eller denna passkey är redan registrerad.', 409);
      }
      throw error;
    }
  }

  async function authenticationOptions(input) {
    if (!config.passkeyConfigured) throw new PasskeyError('Inloggning med passkey är inte konfigurerad.', 503);
    const username = normalizeUsername(input.username);
    const user = store.getCmsUserByUsername(username);
    const credentials = user ? store.listPasskeysForUser(user.id) : [];
    if (!user || !credentials.length) {
      throw new PasskeyError('Ingen passkey hittades för användarnamnet.');
    }
    const options = await webauthn.generateAuthenticationOptions({
      rpID: config.passkeyRpId,
      allowCredentials: credentials.map((credential) => ({
        id: credential.id,
        transports: credential.transports,
      })),
      userVerification: 'required',
    });
    const flow = store.createWebAuthnChallenge({
      type: 'authentication',
      challenge: options.challenge,
      userId: user.id,
    });
    return { flow, options };
  }

  async function verifyAuthentication(input) {
    if (!config.passkeyConfigured) throw new PasskeyError('Inloggning med passkey är inte konfigurerad.', 503);
    const body = requireObject(input);
    const response = requireObject(body.response);
    if (typeof response.id !== 'string' || !response.id) throw new PasskeyError('Ogiltig passkey.');
    const challenge = store.getWebAuthnChallenge(String(body.flow || ''), 'authentication');
    if (!challenge) throw new PasskeyError('Inloggningen har gått ut. Försök igen.', 410);
    const credential = store.getPasskeyCredential(response.id, challenge.user_id);
    if (!credential) throw new PasskeyError('Passkey hör inte till den här användaren.', 403);

    let verification;
    try {
      verification = await webauthn.verifyAuthenticationResponse({
        response,
        expectedChallenge: challenge.challenge,
        expectedOrigin: config.passkeyOrigin,
        expectedRPID: config.passkeyRpId,
        credential: credentialForVerification(credential),
        requireUserVerification: true,
      });
    } catch {
      throw new PasskeyError('Passkey kunde inte verifieras. Försök igen.', 401);
    }
    if (!verification.verified) throw new PasskeyError('Passkey kunde inte verifieras. Försök igen.', 401);
    return store.finishPasskeyAuthentication(
      body.flow,
      challenge.user_id,
      credential.id,
      verification.authenticationInfo.newCounter,
    );
  }

  return {
    registrationOptions,
    verifyRegistration,
    authenticationOptions,
    verifyAuthentication,
  };
}
