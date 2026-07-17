import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { getConfig } from '../src/config.js';
import { openDatabase } from '../src/db.js';
import { createApp } from '../src/server.js';
import { initializeDomainDatabase } from './domain-fixture.js';

let app;
let baseUrl;
let temporaryDirectory;

const webauthnCalls = {
  registrationOptions: [],
  registrationVerifications: [],
  authenticationOptions: [],
  authenticationVerifications: [],
};

const fakeWebAuthn = {
  async generateRegistrationOptions(options) {
    webauthnCalls.registrationOptions.push(options);
    return {
      challenge: 'registration-challenge',
      rp: { name: options.rpName, id: options.rpID },
      user: {
        id: Buffer.from(options.userID).toString('base64url'),
        name: options.userName,
        displayName: options.userDisplayName,
      },
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      timeout: 60_000,
      attestation: 'none',
      excludeCredentials: [],
      authenticatorSelection: options.authenticatorSelection,
    };
  },
  async verifyRegistrationResponse(options) {
    webauthnCalls.registrationVerifications.push(options);
    if (options.response.id === 'invalid-registration') throw new Error('invalid attestation');
    return {
      verified: true,
      registrationInfo: {
        credential: {
          id: options.response.id,
          publicKey: new Uint8Array([1, 2, 3, 4]),
          counter: 0,
          transports: options.response.response.transports,
        },
        credentialDeviceType: 'multiDevice',
        credentialBackedUp: true,
      },
    };
  },
  async generateAuthenticationOptions(options) {
    webauthnCalls.authenticationOptions.push(options);
    return {
      challenge: 'authentication-challenge',
      rpId: options.rpID,
      timeout: 60_000,
      userVerification: options.userVerification,
      allowCredentials: options.allowCredentials,
    };
  },
  async verifyAuthenticationResponse(options) {
    webauthnCalls.authenticationVerifications.push(options);
    if (options.response.id === 'invalid-authentication') throw new Error('invalid signature');
    return {
      verified: true,
      authenticationInfo: {
        credentialID: options.response.id,
        newCounter: 7,
      },
    };
  },
};

before(async () => {
  temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'gutafinn-cms-'));
  initializeDomainDatabase(path.join(temporaryDirectory, 'places.db'));
  app = createApp({
    NODE_ENV: 'test', ADMIN_USERNAME: 'editor', ADMIN_PASSWORD: 'a-secure-test-password',
    SESSION_SECRET: 'test-secret-with-at-least-thirty-two-characters',
    SIGNUP_CODE: 'invite-only-code', PASSKEY_RP_ID: '127.0.0.1',
    PASSKEY_ORIGIN: 'http://127.0.0.1', DATABASE_PATH: path.join(temporaryDirectory, 'places.db'),
    HOST: '127.0.0.1', PORT: '0',
  }, { webauthn: fakeWebAuthn });
  await new Promise((resolve) => app.server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${app.server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => app.server.close(resolve));
  app.store.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

async function login() {
  const response = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'editor', password: 'a-secure-test-password' }),
  });
  assert.equal(response.status, 303);
  return response.headers.get('set-cookie').split(';')[0];
}

async function csrf(cookie) {
  const response = await fetch(`${baseUrl}/admin/places/new`, { headers: { cookie } });
  assert.equal(response.status, 200);
  const html = await response.text();
  return html.match(/name="csrf" value="([^"]+)"/)[1];
}

test('health check and public categories are available', async () => {
  const health = await fetch(`${baseUrl}/healthz`);
  assert.deepEqual(await health.json(), { ok: true });
  const categories = await (await fetch(`${baseUrl}/api/categories`)).json();
  assert.equal(categories.length, 8);
  assert.equal(categories[0].id, 'mat');
});

test('CMS refuses to own an uninitialized domain database', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gutafinn-uninitialized-cms-'));
  try {
    assert.throws(
      () => openDatabase(path.join(directory, 'places.db')),
      /domain database is not initialized/,
    );
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('CMS hides legacy utility categories and places from public choices', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gutafinn-public-categories-'));
  const databasePath = path.join(directory, 'places.db');
  initializeDomainDatabase(databasePath);
  const store = openDatabase(databasePath);
  try {
    store.db.prepare(`INSERT INTO categories (id,label,color,emoji,sort_order)
      VALUES ('service','Service','#607d8b','ℹ️',100)`).run();
    store.db.prepare(`INSERT INTO places (id,name,category,lat,lng,description,is_active)
      VALUES ('utility','Serviceplats','service',57.6,18.3,'Test',1)`).run();
    store.db.prepare(`INSERT INTO place_categories (place_id,category_id,is_primary)
      VALUES ('utility','service',1)`).run();

    assert.equal(store.categories().length, 8);
    assert.equal(store.categories().some((category) => category.id === 'service'), false);
    assert.equal(store.publicPlaces().length, 0);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('production passkey enrollment requires an explicit RP ID and HTTPS origin', () => {
  const base = {
    NODE_ENV: 'production',
    ADMIN_PASSWORD: 'production-admin-password',
    SESSION_SECRET: 'production-session-secret-with-at-least-thirty-two-characters',
  };
  assert.throws(
    () => getConfig({ ...base, SIGNUP_CODE: 'private-enrollment-code' }),
    /PASSKEY_RP_ID and PASSKEY_ORIGIN are required/,
  );
  assert.throws(
    () => getConfig({
      ...base,
      SIGNUP_CODE: 'short',
      PASSKEY_RP_ID: 'cms.example.com',
      PASSKEY_ORIGIN: 'https://cms.example.com',
    }),
    /at least 16 characters/,
  );
  assert.throws(
    () => getConfig({
      ...base,
      SIGNUP_CODE: 'private-enrollment-code',
      PASSKEY_RP_ID: 'cms.example.com',
      PASSKEY_ORIGIN: 'http://cms.example.com',
    }),
    /same HTTPS site/,
  );
  const disabled = getConfig(base);
  assert.equal(disabled.passkeyConfigured, false);
  assert.equal(disabled.signupEnabled, false);
  const enabled = getConfig({
    ...base,
    SIGNUP_CODE: 'private-enrollment-code',
    PASSKEY_RP_ID: 'cms.example.com',
    PASSKEY_ORIGIN: 'https://cms.example.com',
  });
  assert.equal(enabled.passkeyConfigured, true);
  assert.equal(enabled.signupEnabled, true);
  assert.equal(enabled.passkeyRpId, 'cms.example.com');
  assert.equal(enabled.passkeyOrigin, 'https://cms.example.com');
});

test('admin routes require authentication and reject bad credentials', async () => {
  const protectedResponse = await fetch(`${baseUrl}/admin/places`, { redirect: 'manual' });
  assert.equal(protectedResponse.status, 303);
  assert.equal(protectedResponse.headers.get('location'), '/admin/login');

  const loginResponse = await fetch(`${baseUrl}/admin/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: 'editor', password: 'wrong' }),
  });
  assert.equal(loginResponse.status, 401);
  assert.match(await loginResponse.text(), /Fel användarnamn eller lösenord/);
});

test('a user can sign up with a passkey and receives an authenticated CMS session', async () => {
  const signupPage = await fetch(`${baseUrl}/signup`);
  assert.equal(signupPage.status, 200);
  assert.match(await signupPage.text(), /data-passkey-signup/);

  const wrongCode = await fetch(`${baseUrl}/auth/passkey/register/options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ displayName: 'Alice Andersson', username: 'Alice', signupCode: 'wrong' }),
  });
  assert.equal(wrongCode.status, 403);
  assert.match((await wrongCode.json()).error, /Registreringskoden är fel/);

  const optionsResponse = await fetch(`${baseUrl}/auth/passkey/register/options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Alice Andersson',
      username: 'Alice',
      signupCode: 'invite-only-code',
    }),
  });
  assert.equal(optionsResponse.status, 200);
  const start = await optionsResponse.json();
  assert.equal(start.options.challenge, 'registration-challenge');
  assert.equal(start.options.rp.id, '127.0.0.1');
  assert.equal(start.options.user.name, 'alice');
  assert.equal(webauthnCalls.registrationOptions.at(-1).authenticatorSelection.userVerification, 'required');

  const verificationResponse = await fetch(`${baseUrl}/auth/passkey/register/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      flow: start.flow,
      response: {
        id: 'credential-alice',
        rawId: 'credential-alice',
        type: 'public-key',
        response: { transports: ['internal', 'hybrid'] },
      },
    }),
  });
  assert.equal(verificationResponse.status, 201);
  assert.deepEqual(await verificationResponse.json(), { ok: true, redirect: '/admin' });
  const cookie = verificationResponse.headers.get('set-cookie').split(';')[0];

  const user = app.store.getCmsUserByUsername('ALICE');
  assert.equal(user.display_name, 'Alice Andersson');
  assert.equal(user.role, 'editor');
  const credentials = app.store.listPasskeysForUser(user.id);
  assert.equal(credentials.length, 1);
  assert.equal(credentials[0].id, 'credential-alice');
  assert.deepEqual(credentials[0].transports, ['internal', 'hybrid']);
  assert.equal(credentials[0].backed_up, 1);

  const admin = await fetch(`${baseUrl}/admin`, { headers: { cookie } });
  assert.equal(admin.status, 200);
  assert.match(await admin.text(), /alice/);

  const duplicate = await fetch(`${baseUrl}/auth/passkey/register/options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      displayName: 'Another Alice',
      username: 'alice',
      signupCode: 'invite-only-code',
    }),
  });
  assert.equal(duplicate.status, 409);
});

test('a registered user can sign in with the passkey and challenges cannot be replayed', async () => {
  const optionsResponse = await fetch(`${baseUrl}/auth/passkey/login/options`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'Alice' }),
  });
  assert.equal(optionsResponse.status, 200);
  const start = await optionsResponse.json();
  assert.equal(start.options.challenge, 'authentication-challenge');
  assert.deepEqual(start.options.allowCredentials, [
    { id: 'credential-alice', transports: ['internal', 'hybrid'] },
  ]);

  const wrongCredential = await fetch(`${baseUrl}/auth/passkey/login/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      flow: start.flow,
      response: { id: 'credential-bob', type: 'public-key', response: {} },
    }),
  });
  assert.equal(wrongCredential.status, 403);

  const assertion = {
    flow: start.flow,
    response: { id: 'credential-alice', type: 'public-key', response: {} },
  };
  const verificationResponse = await fetch(`${baseUrl}/auth/passkey/login/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(assertion),
  });
  assert.equal(verificationResponse.status, 200);
  const cookie = verificationResponse.headers.get('set-cookie').split(';')[0];
  const admin = await fetch(`${baseUrl}/admin/places`, { headers: { cookie } });
  assert.equal(admin.status, 200);

  const user = app.store.getCmsUserByUsername('alice');
  const credential = app.store.getPasskeyCredential('credential-alice', user.id);
  assert.equal(credential.counter, 7);
  assert.ok(credential.last_used_at);
  assert.ok(app.store.getCmsUserById(user.id).last_login_at);
  assert.equal(webauthnCalls.authenticationVerifications.at(-1).expectedOrigin, 'http://127.0.0.1');
  assert.equal(webauthnCalls.authenticationVerifications.at(-1).expectedRPID, '127.0.0.1');
  assert.equal(webauthnCalls.authenticationVerifications.at(-1).requireUserVerification, true);

  const replay = await fetch(`${baseUrl}/auth/passkey/login/verify`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(assertion),
  });
  assert.equal(replay.status, 410);
});

test('admin can create, edit, archive, and restore a place', async () => {
  const cookie = await login();
  const token = await csrf(cookie);
  const createBody = new URLSearchParams({
    csrf: token, name: 'Testplats vid havet', category: 'strand', lat: '57.7', lng: '18.8',
    description: 'En plats skapad i CMS-testet.', isActive: '1', streetAddress: 'Strandvägen 1',
    postalCode: '621 00', locality: 'Visby', municipality: 'Region Gotland', accessibility: 'Plan entré',
    priceLevel: '2', openingHoursRaw: 'Mo-Fr 10:00-17:00', openingHoursNote: 'Stängt midsommarafton',
  });
  createBody.append('website[]', 'https://example.com');
  createBody.append('phone[]', '+46 70 123 45 67');
  createBody.append('email[]', 'hej@example.com');
  createBody.append('imageUrl[]', 'https://example.com/place.jpg');
  createBody.append('imageAlt[]', 'Havet vid testplatsen');
  const created = await fetch(`${baseUrl}/admin/places`, {
    method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: createBody,
  });
  assert.equal(created.status, 303);
  assert.match(created.headers.get('location'), /testplats-vid-havet\/edit/);

  let publicPlaces = await (await fetch(`${baseUrl}/api/places`)).json();
  assert.equal(publicPlaces.length, 1);
  assert.equal(publicPlaces[0].locality, 'Visby');
  assert.equal(publicPlaces[0].contacts.email[0], 'hej@example.com');

  createBody.set('name', 'Testplats med nytt namn');
  createBody.delete('isActive');
  const updated = await fetch(`${baseUrl}/admin/places/testplats-vid-havet`, {
    method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' }, body: createBody,
  });
  assert.equal(updated.status, 303);
  assert.equal(app.store.getPlace('testplats-vid-havet').name, 'Testplats med nytt namn');
  assert.equal(app.store.getPlace('testplats-vid-havet').is_active, 0);
  const persistedDatabase = new DatabaseSync(path.join(temporaryDirectory, 'places.db'), { readOnly: true });
  assert.equal(
    persistedDatabase.prepare('SELECT name FROM places WHERE id=?').get('testplats-vid-havet').name,
    'Testplats med nytt namn',
  );
  persistedDatabase.close();
  publicPlaces = await (await fetch(`${baseUrl}/api/places`)).json();
  assert.equal(publicPlaces.length, 0);

  const restored = await fetch(`${baseUrl}/admin/places/testplats-vid-havet/status`, {
    method: 'POST', redirect: 'manual', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrf: token, active: '1' }),
  });
  assert.equal(restored.status, 303);
  assert.equal(app.store.getPlace('testplats-vid-havet').is_active, 1);
});

test('invalid place data is shown without writing to the database', async () => {
  const cookie = await login();
  const token = await csrf(cookie);
  const response = await fetch(`${baseUrl}/admin/places`, {
    method: 'POST', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrf: token, name: '', category: 'unknown', lat: '999', lng: 'x', isActive: '1' }),
  });
  assert.equal(response.status, 422);
  const html = await response.text();
  assert.match(html, /Ange platsens namn/);
  assert.match(html, /Välj en giltig kategori/);
  assert.equal(app.store.stats().total, 1);
});

test('mutations require a valid CSRF token', async () => {
  const cookie = await login();
  const response = await fetch(`${baseUrl}/admin/places/testplats-vid-havet/status`, {
    method: 'POST', headers: { cookie, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ csrf: 'wrong', active: '0' }),
  });
  assert.equal(response.status, 403);
  assert.equal(app.store.getPlace('testplats-vid-havet').is_active, 1);
});

test('public place queries are not limited by the admin page size', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gutafinn-public-api-'));
  const databasePath = path.join(directory, 'places.db');
  initializeDomainDatabase(databasePath);
  const store = openDatabase(databasePath);
  try {
    for (let index = 1; index <= 35; index += 1) {
      const result = store.createPlace({
        name: `Badplats ${String(index).padStart(2, '0')}`,
        category: index === 35 ? 'natur' : 'strand',
        lat: 57.5 + index / 1000,
        lng: 18.2 + index / 1000,
        description: index === 35 ? 'Särskild utsiktsplats' : '',
        isActive: true,
        contacts: {},
        images: [],
      });
      assert.equal(Object.keys(result.errors).length, 0);
    }

    assert.equal(store.publicPlaces().length, 35);
    assert.equal(store.publicPlaces({ category: 'strand' }).length, 34);
    assert.equal(store.publicPlaces({ query: 'utsiktsplats' }).length, 1);
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('editing imported items preserves category provenance and one primary category', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'gutafinn-category-edit-'));
  const databasePath = path.join(directory, 'places.db');
  initializeDomainDatabase(databasePath);
  const store = openDatabase(databasePath);
  try {
    const created = store.createPlace({
      name: 'Importerad plats', category: 'strand', lat: 57.6, lng: 18.3,
      isActive: true,
      contacts: { website: ['https://example.com/importerad'] },
      images: [{ url: 'https://example.com/importerad.jpg', altText: 'Importerad plats' }],
    });
    assert.equal(Object.keys(created.errors).length, 0);
    store.db.prepare('UPDATE place_categories SET source_type=? WHERE place_id=?')
      .run('OpenStreetMap', created.id);
    store.db.prepare(`INSERT INTO place_categories (place_id,category_id,is_primary,source_type)
      VALUES (?,?,0,?)`).run(created.id, 'natur', 'OpenStreetMap');
    store.db.prepare('UPDATE place_contacts SET label=? WHERE place_id=?')
      .run('Officiell webbplats', created.id);
    store.db.prepare('UPDATE place_images SET source_url=? WHERE place_id=?')
      .run('https://example.com/bildkalla', created.id);

    const edited = store.editPlace(created.id, {
      name: 'Importerad plats', category: 'natur', lat: 57.6, lng: 18.3,
      isActive: true,
      contacts: { website: ['https://example.com/importerad'] },
      images: [{ url: 'https://example.com/importerad.jpg', altText: 'Ny alt-text' }],
    });
    assert.equal(Object.keys(edited.errors).length, 0);

    const categories = store.db.prepare(`SELECT category_id, is_primary, source_type
      FROM place_categories WHERE place_id=? ORDER BY category_id`).all(created.id)
      .map((category) => ({ ...category }));
    assert.deepEqual(categories, [
      { category_id: 'natur', is_primary: 1, source_type: 'OpenStreetMap' },
      { category_id: 'strand', is_primary: 0, source_type: 'OpenStreetMap' },
    ]);
    assert.equal(
      store.db.prepare('SELECT label FROM place_contacts WHERE place_id=?').get(created.id).label,
      'Officiell webbplats',
    );
    assert.equal(
      store.db.prepare('SELECT source_url FROM place_images WHERE place_id=?').get(created.id).source_url,
      'https://example.com/bildkalla',
    );
  } finally {
    store.close();
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
