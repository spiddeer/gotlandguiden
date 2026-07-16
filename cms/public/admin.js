const menuButton = document.querySelector('[data-menu]');
const sidebar = document.querySelector('#sidebar');

menuButton?.addEventListener('click', () => {
  const open = sidebar.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
});

document.addEventListener('click', (event) => {
  const removeButton = event.target.closest('.remove-row');
  if (removeButton) {
    const rows = removeButton.closest('[data-rows]');
    if (rows.children.length === 1) {
      removeButton.closest('.repeat-row').querySelectorAll('input').forEach((input) => { input.value = ''; });
    } else removeButton.closest('.repeat-row').remove();
  }

  const addButton = event.target.closest('[data-add-row]');
  if (!addButton) return;
  const repeater = addButton.closest('[data-repeater]');
  const rows = repeater.querySelector('[data-rows]');
  const first = rows.querySelector('.repeat-row');
  const clone = first.cloneNode(true);
  clone.querySelectorAll('input').forEach((input) => { input.value = ''; });
  rows.append(clone);
  clone.querySelector('input')?.focus();
});

const latitude = document.querySelector('[name="lat"]');
const longitude = document.querySelector('[name="lng"]');
const mapLink = document.querySelector('[data-map-link]');
function updateMapLink() {
  if (!mapLink || !latitude?.value || !longitude?.value) return;
  const lat = Number(latitude.value);
  const lng = Number(longitude.value);
  if (Number.isFinite(lat) && Number.isFinite(lng)) mapLink.href = `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lng)}#map=16/${encodeURIComponent(lat)}/${encodeURIComponent(lng)}`;
}
latitude?.addEventListener('input', updateMapLink);
longitude?.addEventListener('input', updateMapLink);
updateMapLink();

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (character) => character.charCodeAt(0)).buffer;
}

function encodeBase64Url(value) {
  const bytes = new Uint8Array(value);
  let binary = '';
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function registrationPublicKey(options) {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    user: { ...options.user, id: decodeBase64Url(options.user.id) },
    excludeCredentials: (options.excludeCredentials || []).map((credential) => ({
      ...credential,
      id: decodeBase64Url(credential.id),
    })),
  };
}

function authenticationPublicKey(options) {
  return {
    ...options,
    challenge: decodeBase64Url(options.challenge),
    allowCredentials: (options.allowCredentials || []).map((credential) => ({
      ...credential,
      id: decodeBase64Url(credential.id),
    })),
  };
}

function registrationResponse(credential) {
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      attestationObject: encodeBase64Url(credential.response.attestationObject),
      transports: credential.response.getTransports?.() || [],
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

function authenticationResponse(credential) {
  return {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment,
    response: {
      clientDataJSON: encodeBase64Url(credential.response.clientDataJSON),
      authenticatorData: encodeBase64Url(credential.response.authenticatorData),
      signature: encodeBase64Url(credential.response.signature),
      userHandle: credential.response.userHandle ? encodeBase64Url(credential.response.userHandle) : undefined,
    },
    clientExtensionResults: credential.getClientExtensionResults(),
  };
}

async function passkeyRequest(pathname, payload) {
  const response = await fetch(pathname, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || 'Något gick fel. Försök igen.');
  return result;
}

function passkeySupportError() {
  if (!window.isSecureContext) return 'Passkeys kräver HTTPS eller localhost.';
  if (!window.PublicKeyCredential || !navigator.credentials) return 'Den här webbläsaren stöder inte passkeys.';
  return '';
}

function passkeyErrorMessage(error) {
  if (error.name === 'NotAllowedError') return 'Passkey-dialogen avbröts eller tog för lång tid. Försök igen.';
  if (error.name === 'InvalidStateError') return 'Denna passkey är redan registrerad.';
  return error.message || 'Passkey kunde inte användas.';
}

async function withPasskeyForm(form, action) {
  const status = form.querySelector('[data-passkey-status]');
  const button = form.querySelector('button[type="submit"]');
  const supportError = passkeySupportError();
  if (supportError) {
    status.textContent = supportError;
    status.classList.add('error');
    return;
  }
  button.disabled = true;
  status.classList.remove('error');
  status.textContent = 'Väntar på din enhet…';
  try {
    await action(status);
  } catch (error) {
    status.textContent = passkeyErrorMessage(error);
    status.classList.add('error');
    button.disabled = false;
  }
}

const signupForm = document.querySelector('[data-passkey-signup]');
signupForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  withPasskeyForm(signupForm, async (status) => {
    const form = new FormData(signupForm);
    const start = await passkeyRequest('/auth/passkey/register/options', {
      displayName: form.get('displayName'),
      username: form.get('username'),
      signupCode: form.get('signupCode'),
    });
    const credential = await navigator.credentials.create({
      publicKey: registrationPublicKey(start.options),
    });
    if (!credential) throw new Error('Ingen passkey skapades.');
    status.textContent = 'Verifierar din passkey…';
    const result = await passkeyRequest('/auth/passkey/register/verify', {
      flow: start.flow,
      response: registrationResponse(credential),
    });
    window.location.assign(result.redirect || '/admin');
  });
});

const passkeyLoginForm = document.querySelector('[data-passkey-login]');
passkeyLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  withPasskeyForm(passkeyLoginForm, async (status) => {
    const form = new FormData(passkeyLoginForm);
    const start = await passkeyRequest('/auth/passkey/login/options', {
      username: form.get('passkeyUsername'),
    });
    const credential = await navigator.credentials.get({
      publicKey: authenticationPublicKey(start.options),
    });
    if (!credential) throw new Error('Ingen passkey valdes.');
    status.textContent = 'Loggar in…';
    const result = await passkeyRequest('/auth/passkey/login/verify', {
      flow: start.flow,
      response: authenticationResponse(credential),
    });
    window.location.assign(result.redirect || '/admin');
  });
});
