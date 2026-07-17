import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { getConfig } from './config.js';
import { openDatabase } from './db.js';
import { createPasskeyService, PasskeyError } from './passkeys.js';
import {
  LoginLimiter, clearSessionCookie, createSession, getCookies, readSession,
  sessionCookie, verifyCredentials,
} from './security.js';
import {
  collectionFormView, collectionsView, correctionsView, dashboardView, errorView, loginView,
  notFoundView, placeFormView, placesView, signupView,
} from './views.js';

const assetsDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');

function send(response, status, body, contentType = 'text/html; charset=utf-8', headers = {}) {
  response.writeHead(status, { 'Content-Type': contentType, 'Content-Length': Buffer.byteLength(body), ...headers });
  response.end(body);
}

function redirect(response, location, headers = {}) {
  response.writeHead(303, { Location: location, ...headers });
  response.end();
}

async function readRawBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 128 * 1024) throw Object.assign(new Error('Body too large'), { status: 413 });
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readBody(request) {
  return new URLSearchParams(await readRawBody(request));
}

async function readJson(request) {
  try {
    return JSON.parse(await readRawBody(request));
  } catch {
    throw new PasskeyError('Begäran innehåller ogiltig JSON.');
  }
}

function sendJson(response, status, value, headers = {}) {
  return send(response, status, JSON.stringify(value), 'application/json; charset=utf-8', {
    'Cache-Control': 'no-store',
    ...headers,
  });
}

function formInput(body) {
  const value = (name) => body.get(name) || '';
  return {
    id: value('id'), name: value('name'), category: value('category'),
    lat: value('lat'), lng: value('lng'), description: value('description'),
    isActive: body.has('isActive'), streetAddress: value('streetAddress'),
    postalCode: value('postalCode'), locality: value('locality'), municipality: value('municipality'),
    accessibility: value('accessibility'), priceLevel: value('priceLevel'),
    openingHoursRaw: value('openingHoursRaw'), openingHoursNote: value('openingHoursNote'),
    contacts: {
      website: body.getAll('website[]'), phone: body.getAll('phone[]'), email: body.getAll('email[]'),
    },
    images: body.getAll('imageUrl[]').map((url, index) => ({ url, altText: body.getAll('imageAlt[]')[index] || '' })),
  };
}

function inputForView(input, id = '') {
  return {
    ...input, id, is_active: input.isActive ? 1 : 0,
    street_address: input.streetAddress, postal_code: input.postalCode,
    price_level: input.priceLevel, opening_hours_raw: input.openingHoursRaw,
    opening_hours_note: input.openingHoursNote,
  };
}

function collectionInput(body) {
  return {
    id: body.get('id') || '',
    title: body.get('title') || '',
    description: body.get('description') || '',
    sortOrder: body.get('sortOrder') || '0',
    isPublished: body.has('isPublished'),
    placeIds: body.getAll('placeId[]'),
  };
}

function collectionForView(input, id = '') {
  return {
    ...input,
    id: id || input.id,
    sort_order: input.sortOrder,
    is_published: input.isPublished ? 1 : 0,
  };
}

function clientAddress(request) {
  return String(request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown').split(',')[0].trim();
}

function isValidCsrf(body, session) {
  return Boolean(session && body.get('csrf') && body.get('csrf') === session.csrf);
}

function notice(code) {
  return ({
    created: 'Platsen skapades och är nu sparad.', updated: 'Ändringarna sparades.',
    archived: 'Platsen arkiverades.', restored: 'Platsen återställdes.',
    correction: 'Rättelsen uppdaterades.', collectionCreated: 'Samlingen skapades.',
    collectionUpdated: 'Samlingen sparades.', collectionPublished: 'Samlingen publicerades.',
    collectionDraft: 'Samlingen avpublicerades.',
  })[code] || '';
}

async function serveAsset(pathname, response) {
  const requested = pathname.replace('/assets/', '');
  const target = path.resolve(assetsDir, requested);
  if (!target.startsWith(`${assetsDir}${path.sep}`)) return false;
  try {
    const body = await fs.readFile(target);
    const extension = path.extname(target);
    const type = extension === '.css' ? 'text/css; charset=utf-8' : extension === '.js' ? 'text/javascript; charset=utf-8' : 'application/octet-stream';
    response.writeHead(200, { 'Content-Type': type, 'Content-Length': body.length, 'Cache-Control': 'public, max-age=3600' });
    response.end(body);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

export function createApp(overrides = {}, dependencies = {}) {
  const config = getConfig(overrides);
  const store = openDatabase(config.databasePath);
  const limiter = new LoginLimiter();
  const passkeyLimiter = new LoginLimiter();
  const passkeys = createPasskeyService(store, config, dependencies.webauthn);

  const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const method = request.method || 'GET';
    const cookies = getCookies(request);
    const session = readSession(cookies.gg_admin, config);
    const user = session?.user || null;

    try {
      if (url.pathname.startsWith('/assets/') && method === 'GET') {
        if (await serveAsset(url.pathname, response)) return;
        return send(response, 404, 'Not found', 'text/plain; charset=utf-8');
      }
      if (url.pathname === '/healthz' && method === 'GET') {
        return send(response, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
      }
      if (url.pathname === '/api/categories' && method === 'GET') {
        return send(response, 200, JSON.stringify(store.categories()), 'application/json; charset=utf-8', { 'Cache-Control': 'public, max-age=300' });
      }
      if (url.pathname === '/api/places' && method === 'GET') {
        const rows = store.publicPlaces({ category: url.searchParams.get('category') || '', query: url.searchParams.get('q') || '' });
        return send(response, 200, JSON.stringify(rows), 'application/json; charset=utf-8', { 'Cache-Control': 'public, max-age=60' });
      }
      if (url.pathname === '/signup' && method === 'GET') {
        if (user) return redirect(response, '/admin');
        return send(response, 200, signupView({ enabled: config.signupEnabled }), 'text/html; charset=utf-8', {
          'Cache-Control': 'no-store',
        });
      }
      if (url.pathname.startsWith('/auth/passkey/') && method === 'POST') {
        const key = clientAddress(request);
        if (!passkeyLimiter.canAttempt(key)) {
          return sendJson(response, 429, { error: 'För många försök. Vänta 15 minuter och försök igen.' });
        }
        const input = await readJson(request);
        if (url.pathname === '/auth/passkey/register/options') {
          return sendJson(response, 200, await passkeys.registrationOptions(input));
        }
        if (url.pathname === '/auth/passkey/register/verify') {
          const passkeyUser = await passkeys.verifyRegistration(input);
          passkeyLimiter.success(key);
          return sendJson(response, 201, { ok: true, redirect: '/admin' }, {
            'Set-Cookie': sessionCookie(createSession(config, passkeyUser.username), config),
          });
        }
        if (url.pathname === '/auth/passkey/login/options') {
          return sendJson(response, 200, await passkeys.authenticationOptions(input));
        }
        if (url.pathname === '/auth/passkey/login/verify') {
          const passkeyUser = await passkeys.verifyAuthentication(input);
          passkeyLimiter.success(key);
          return sendJson(response, 200, { ok: true, redirect: '/admin' }, {
            'Set-Cookie': sessionCookie(createSession(config, passkeyUser.username), config),
          });
        }
      }
      if (url.pathname === '/admin/login' && method === 'GET') {
        if (user) return redirect(response, '/admin');
        return send(response, 200, loginView({ passkeyEnabled: config.passkeyConfigured, signupEnabled: config.signupEnabled }), 'text/html; charset=utf-8', {
          'Cache-Control': 'no-store',
        });
      }
      if (url.pathname === '/admin/login' && method === 'POST') {
        const ip = clientAddress(request);
        if (!limiter.canAttempt(ip)) return send(response, 429, loginView({ error: 'För många försök. Vänta 15 minuter och försök igen.', passkeyEnabled: config.passkeyConfigured, signupEnabled: config.signupEnabled }));
        const body = await readBody(request);
        const username = body.get('username') || '';
        if (!verifyCredentials(username, body.get('password') || '', config)) {
          limiter.fail(ip);
          return send(response, 401, loginView({ error: 'Fel användarnamn eller lösenord.', username, passkeyEnabled: config.passkeyConfigured, signupEnabled: config.signupEnabled }));
        }
        limiter.success(ip);
        return redirect(response, '/admin', { 'Set-Cookie': sessionCookie(createSession(config, config.adminUsername), config) });
      }
      if (url.pathname === '/admin/logout' && method === 'POST') {
        return redirect(response, '/admin/login', { 'Set-Cookie': clearSessionCookie(config) });
      }
      if (url.pathname === '/') return redirect(response, user ? '/admin' : '/admin/login');
      if (url.pathname.startsWith('/admin') && !user) return redirect(response, '/admin/login');

      if (url.pathname === '/admin' && method === 'GET') {
        return send(response, 200, dashboardView({ stats: store.stats(), recent: store.listPlaces({ page: 1 }), user }));
      }
      if (url.pathname === '/admin/places' && method === 'GET') {
        const filters = {
          query: url.searchParams.get('q') || '', category: url.searchParams.get('category') || '',
          status: ['active', 'archived'].includes(url.searchParams.get('status')) ? url.searchParams.get('status') : 'all',
          page: Number.parseInt(url.searchParams.get('page') || '1', 10),
        };
        return send(response, 200, placesView({ result: store.listPlaces(filters), categories: store.categories(), filters, csrf: session.csrf, user, notice: notice(url.searchParams.get('notice')) }));
      }
      if (url.pathname === '/admin/collections' && method === 'GET') {
        return send(response, 200, collectionsView({
          rows: store.listCollections(), csrf: session.csrf, user,
          notice: notice(url.searchParams.get('notice')),
        }));
      }
      if (url.pathname === '/admin/collections/new' && method === 'GET') {
        return send(response, 200, collectionFormView({
          collection: { id: '', title: '', description: '', sort_order: 0, is_published: 0, placeIds: [] },
          places: store.collectionPlaces(), csrf: session.csrf, user, isNew: true,
        }));
      }
      if (url.pathname === '/admin/collections' && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const input = collectionInput(body);
        const result = store.saveCollection(input);
        if (Object.keys(result.errors).length) return send(response, 422, collectionFormView({
          collection: collectionForView(input), places: store.collectionPlaces(), errors: result.errors,
          csrf: session.csrf, user, isNew: true,
        }));
        return redirect(response, `/admin/collections/${encodeURIComponent(result.id)}/edit?notice=collectionCreated`);
      }
      const collectionEditMatch = url.pathname.match(/^\/admin\/collections\/([^/]+)\/edit$/);
      if (collectionEditMatch && method === 'GET') {
        const collection = store.getCollection(decodeURIComponent(collectionEditMatch[1]));
        if (!collection) return send(response, 404, notFoundView({ user }));
        return send(response, 200, collectionFormView({
          collection, places: store.collectionPlaces(), csrf: session.csrf, user,
          notice: notice(url.searchParams.get('notice')),
        }));
      }
      const collectionMatch = url.pathname.match(/^\/admin\/collections\/([^/]+)$/);
      if (collectionMatch && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const id = decodeURIComponent(collectionMatch[1]);
        const input = collectionInput(body);
        const result = store.saveCollection(input, id);
        if (result.notFound) return send(response, 404, notFoundView({ user }));
        if (Object.keys(result.errors).length) return send(response, 422, collectionFormView({
          collection: collectionForView(input, id), places: store.collectionPlaces(), errors: result.errors,
          csrf: session.csrf, user,
        }));
        return redirect(response, `/admin/collections/${encodeURIComponent(id)}/edit?notice=collectionUpdated`);
      }
      const collectionStatusMatch = url.pathname.match(/^\/admin\/collections\/([^/]+)\/status$/);
      if (collectionStatusMatch && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const published = body.get('published') === '1';
        const result = store.setCollectionPublished(decodeURIComponent(collectionStatusMatch[1]), published);
        if (result === null) {
          return send(response, 404, notFoundView({ user }));
        }
        if (result === false) return send(response, 422, collectionsView({
          rows: store.listCollections(), csrf: session.csrf, user,
          error: 'Samlingen behöver minst två aktiva platser innan den kan publiceras.',
        }));
        return redirect(response, `/admin/collections?notice=${published ? 'collectionPublished' : 'collectionDraft'}`);
      }
      if (url.pathname === '/admin/corrections' && method === 'GET') {
        const status = ['new', 'reviewed', 'resolved', 'dismissed', 'all'].includes(url.searchParams.get('status'))
          ? url.searchParams.get('status') : 'new';
        return send(response, 200, correctionsView({
          rows: store.listCorrections({ status }), status, csrf: session.csrf, user,
          notice: notice(url.searchParams.get('notice')),
        }));
      }
      const correctionMatch = url.pathname.match(/^\/admin\/corrections\/(\d+)$/);
      if (correctionMatch && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const status = body.get('status') || '';
        const resolutionNote = (body.get('resolutionNote') || '').slice(0, 1000);
        if (!store.updateCorrection(correctionMatch[1], { status, resolutionNote, reviewedBy: user })) {
          return send(response, 404, notFoundView({ user }));
        }
        return redirect(response, `/admin/corrections?status=${encodeURIComponent(status)}&notice=correction`);
      }
      if (url.pathname === '/admin/places/new' && method === 'GET') {
        return send(response, 200, placeFormView({ place: { is_active: 1, contacts: {}, images: [] }, categories: store.categories(), csrf: session.csrf, user, isNew: true }));
      }
      if (url.pathname === '/admin/places' && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const input = formInput(body);
        const result = store.createPlace(input);
        if (Object.keys(result.errors).length) return send(response, 422, placeFormView({ place: inputForView(input), categories: store.categories(), errors: result.errors, csrf: session.csrf, user, isNew: true }));
        return redirect(response, `/admin/places/${encodeURIComponent(result.id)}/edit?notice=created`);
      }

      const editMatch = url.pathname.match(/^\/admin\/places\/([^/]+)\/edit$/);
      if (editMatch && method === 'GET') {
        const place = store.getPlace(decodeURIComponent(editMatch[1]));
        if (!place) return send(response, 404, notFoundView({ user }));
        const savedNotice = notice(url.searchParams.get('notice'));
        const view = placeFormView({ place, categories: store.categories(), csrf: session.csrf, user });
        return send(response, 200, savedNotice ? view.replace('<form class="place-form"', `<div class="alert success" role="status">${savedNotice}</div><form class="place-form"`) : view);
      }
      const placeMatch = url.pathname.match(/^\/admin\/places\/([^/]+)$/);
      if (placeMatch && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const id = decodeURIComponent(placeMatch[1]);
        const input = formInput(body);
        const result = store.editPlace(id, input);
        if (result.notFound) return send(response, 404, notFoundView({ user }));
        if (Object.keys(result.errors).length) return send(response, 422, placeFormView({ place: inputForView(input, id), categories: store.categories(), errors: result.errors, csrf: session.csrf, user }));
        return redirect(response, `/admin/places/${encodeURIComponent(id)}/edit?notice=updated`);
      }
      const statusMatch = url.pathname.match(/^\/admin\/places\/([^/]+)\/status$/);
      if (statusMatch && method === 'POST') {
        const body = await readBody(request);
        if (!isValidCsrf(body, session)) return send(response, 403, 'Ogiltig säkerhetstoken.', 'text/plain; charset=utf-8');
        const active = body.get('active') === '1';
        if (!store.setActive(decodeURIComponent(statusMatch[1]), active)) return send(response, 404, notFoundView({ user }));
        return redirect(response, `/admin/places?notice=${active ? 'restored' : 'archived'}`);
      }
      return send(response, 404, notFoundView({ user }));
    } catch (error) {
      if (error instanceof PasskeyError) {
        passkeyLimiter.fail(clientAddress(request));
        return sendJson(response, error.status, { error: error.message });
      }
      console.error(error);
      if (response.headersSent) return response.end();
      if (error.status === 413) return send(response, 413, 'Formuläret är för stort.', 'text/plain; charset=utf-8');
      return send(response, 500, errorView({ user }));
    }
  });

  return { server, store, config };
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isMain) {
  const app = createApp();
  app.server.listen(app.config.port, app.config.host, () => {
    console.log(`Gutafinn CMS running at http://${app.config.host}:${app.config.port}`);
  });
  const shutdown = () => app.server.close(() => { app.store.close(); process.exit(0); });
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
