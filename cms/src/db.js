import { DatabaseSync } from 'node:sqlite';
import crypto from 'node:crypto';
import { schema } from './schema.js';

const PAGE_SIZE = 30;

function slugify(value) {
  return value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 64) || 'plats';
}

function clean(value) {
  const result = String(value ?? '').trim();
  return result || null;
}

function uniqueId(db, name, requestedId) {
  const base = slugify(requestedId || name);
  let id = base;
  let suffix = 2;
  const exists = db.prepare('SELECT 1 FROM places WHERE id = ?');
  while (exists.get(id)) id = `${base}-${suffix++}`;
  return id;
}

function parseRelated(input) {
  const contacts = ['website', 'phone', 'email'].flatMap((type) =>
    (input.contacts?.[type] || []).map((value) => ({ type, value: clean(value) })).filter((item) => item.value));
  const images = (input.images || []).map((image, sortOrder) => ({
    url: clean(image.url), altText: clean(image.altText), sortOrder,
  })).filter((image) => image.url);
  return { contacts, images };
}

function validate(input, categories) {
  const errors = {};
  const name = clean(input.name);
  const category = clean(input.category);
  const lat = Number(input.lat);
  const lng = Number(input.lng);
  if (!name) errors.name = 'Ange platsens namn.';
  if (!category || !categories.some((item) => item.id === category)) errors.category = 'Välj en giltig kategori.';
  if (!Number.isFinite(lat) || lat < -90 || lat > 90) errors.lat = 'Ange en latitud mellan −90 och 90.';
  if (!Number.isFinite(lng) || lng < -180 || lng > 180) errors.lng = 'Ange en longitud mellan −180 och 180.';
  const priceLevel = clean(input.priceLevel);
  if (priceLevel && !['1', '2', '3', '4'].includes(String(priceLevel))) errors.priceLevel = 'Välj en giltig prisnivå.';
  const { contacts, images } = parseRelated(input);
  for (const contact of contacts) {
    if (contact.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact.value)) errors.contacts = 'Kontrollera e-postadresserna.';
    if (contact.type === 'website' && !/^https?:\/\//i.test(contact.value)) errors.contacts = 'Webbadresser måste börja med http:// eller https://.';
  }
  for (const image of images) if (!/^https?:\/\//i.test(image.url)) errors.images = 'Bildadresser måste börja med http:// eller https://.';
  return { errors, values: { ...input, name, category, lat, lng, priceLevel }, contacts, images };
}

export function openDatabase(databasePath) {
  const db = new DatabaseSync(databasePath);
  db.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
  db.exec(schema);

  const categories = () => db.prepare('SELECT * FROM categories ORDER BY sort_order, label').all();

  function stats() {
    return db.prepare(`SELECT COUNT(*) total,
      SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) active,
      SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) archived,
      COUNT(DISTINCT category) categories FROM places`).get();
  }

  function listPlaces({ query = '', category = '', status = 'all', page = 1 } = {}) {
    const where = [];
    const params = {};
    if (query) {
      where.push('(p.name LIKE :query OR p.description LIKE :query OR d.locality LIKE :query)');
      params.query = `%${query}%`;
    }
    if (category) { where.push('p.category = :category'); params.category = category; }
    if (status === 'active' || status === 'archived') {
      where.push('p.is_active = :active'); params.active = status === 'active' ? 1 : 0;
    }
    const clause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const total = db.prepare(`SELECT COUNT(*) count FROM places p LEFT JOIN place_details d ON d.place_id=p.id ${clause}`).get(params).count;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const safePage = Math.max(1, Math.min(Number(page) || 1, pages));
    const rows = db.prepare(`SELECT p.*, c.label category_label, c.emoji category_emoji,
      d.locality, d.street_address FROM places p
      LEFT JOIN categories c ON c.id=p.category
      LEFT JOIN place_details d ON d.place_id=p.id
      ${clause} ORDER BY p.name COLLATE NOCASE LIMIT :limit OFFSET :offset`)
      .all({ ...params, limit: PAGE_SIZE, offset: (safePage - 1) * PAGE_SIZE });
    return { rows, total, page: safePage, pages, pageSize: PAGE_SIZE };
  }

  function getPlace(id) {
    const place = db.prepare(`SELECT p.*, d.street_address, d.postal_code, d.locality,
      d.municipality, d.accessibility, d.price_level, d.opening_hours_raw,
      d.opening_hours_note, d.updated_at FROM places p
      LEFT JOIN place_details d ON d.place_id=p.id WHERE p.id=?`).get(id);
    if (!place) return null;
    place.contacts = { website: [], phone: [], email: [] };
    for (const item of db.prepare('SELECT type, value, label FROM place_contacts WHERE place_id=? ORDER BY id').all(id)) {
      place.contacts[item.type].push(item.value);
    }
    place.images = db.prepare('SELECT url, alt_text, sort_order FROM place_images WHERE place_id=? ORDER BY sort_order, id').all(id)
      .map((item) => ({ url: item.url, altText: item.alt_text }));
    return place;
  }

  const insertPlace = db.prepare('INSERT INTO places (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,?)');
  const updatePlace = db.prepare('UPDATE places SET name=?, category=?, lat=?, lng=?, description=?, is_active=? WHERE id=?');
  const upsertDetails = db.prepare(`INSERT INTO place_details
    (place_id,street_address,postal_code,locality,municipality,accessibility,price_level,opening_hours_raw,opening_hours_note,updated_at)
    VALUES (?,?,?,?,?,?,?,?,?,CURRENT_TIMESTAMP)
    ON CONFLICT(place_id) DO UPDATE SET street_address=excluded.street_address, postal_code=excluded.postal_code,
    locality=excluded.locality, municipality=excluded.municipality, accessibility=excluded.accessibility,
    price_level=excluded.price_level, opening_hours_raw=excluded.opening_hours_raw,
    opening_hours_note=excluded.opening_hours_note, updated_at=CURRENT_TIMESTAMP`);

  function saveRelated(id, values, contacts, images) {
    upsertDetails.run(id, clean(values.streetAddress), clean(values.postalCode), clean(values.locality),
      clean(values.municipality), clean(values.accessibility), values.priceLevel ? Number(values.priceLevel) : null,
      clean(values.openingHoursRaw), clean(values.openingHoursNote));
    db.prepare('DELETE FROM place_contacts WHERE place_id=?').run(id);
    const addContact = db.prepare('INSERT OR IGNORE INTO place_contacts (place_id,type,value) VALUES (?,?,?)');
    for (const item of contacts) addContact.run(id, item.type, item.value);
    db.prepare('DELETE FROM place_images WHERE place_id=?').run(id);
    const addImage = db.prepare('INSERT OR IGNORE INTO place_images (place_id,url,alt_text,sort_order) VALUES (?,?,?,?)');
    for (const image of images) addImage.run(id, image.url, image.altText, image.sortOrder);
    db.prepare('DELETE FROM place_categories WHERE place_id=? AND source_type=? AND category_id<>?')
      .run(id, 'cms', values.category);
    db.prepare('UPDATE place_categories SET is_primary=0 WHERE place_id=?').run(id);
    db.prepare(`INSERT INTO place_categories (place_id,category_id,is_primary,source_type)
      VALUES (?,?,1,?)
      ON CONFLICT(place_id,category_id) DO UPDATE SET is_primary=1`).run(id, values.category, 'cms');
  }

  function createPlace(input) {
    const parsed = validate(input, categories());
    if (Object.keys(parsed.errors).length) return parsed;
    const id = uniqueId(db, parsed.values.name, parsed.values.id);
    db.exec('BEGIN IMMEDIATE');
    try {
      insertPlace.run(id, parsed.values.name, parsed.values.category, parsed.values.lat, parsed.values.lng,
        clean(parsed.values.description), parsed.values.isActive ? 1 : 0);
      saveRelated(id, parsed.values, parsed.contacts, parsed.images);
      db.exec('COMMIT');
      return { ...parsed, id };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function editPlace(id, input) {
    if (!getPlace(id)) return { notFound: true };
    const parsed = validate(input, categories());
    if (Object.keys(parsed.errors).length) return parsed;
    db.exec('BEGIN IMMEDIATE');
    try {
      updatePlace.run(parsed.values.name, parsed.values.category, parsed.values.lat, parsed.values.lng,
        clean(parsed.values.description), parsed.values.isActive ? 1 : 0, id);
      saveRelated(id, parsed.values, parsed.contacts, parsed.images);
      db.exec('COMMIT');
      return { ...parsed, id };
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function setActive(id, active) {
    return db.prepare('UPDATE places SET is_active=? WHERE id=?').run(active ? 1 : 0, id).changes > 0;
  }

  function publicPlaces({ category = '', query = '' } = {}) {
    const where = ['p.is_active = 1'];
    const params = {};
    if (query) {
      where.push('(p.name LIKE :query OR p.description LIKE :query OR d.locality LIKE :query)');
      params.query = `%${query}%`;
    }
    if (category) {
      where.push('p.category = :category');
      params.category = category;
    }
    const clause = `WHERE ${where.join(' AND ')}`;
    const rows = db.prepare(`SELECT p.*, d.street_address, d.postal_code, d.locality,
      d.municipality, d.accessibility, d.price_level, d.opening_hours_raw,
      d.opening_hours_note, d.updated_at FROM places p
      LEFT JOIN place_details d ON d.place_id=p.id
      ${clause} ORDER BY p.name COLLATE NOCASE`).all(params);
    const byId = new Map(rows.map((place) => {
      place.contacts = { website: [], phone: [], email: [] };
      place.images = [];
      return [place.id, place];
    }));

    if (!byId.size) return rows;

    for (const item of db.prepare(`SELECT pc.place_id, pc.type, pc.value
      FROM place_contacts pc JOIN places p ON p.id=pc.place_id
      WHERE p.is_active=1 ORDER BY pc.id`).all()) {
      const place = byId.get(item.place_id);
      if (place) place.contacts[item.type].push(item.value);
    }
    for (const item of db.prepare(`SELECT pi.place_id, pi.url, pi.alt_text
      FROM place_images pi JOIN places p ON p.id=pi.place_id
      WHERE p.is_active=1 ORDER BY pi.sort_order, pi.id`).all()) {
      const place = byId.get(item.place_id);
      if (place) place.images.push({ url: item.url, altText: item.alt_text });
    }
    return rows;
  }

  function getCmsUserByUsername(username) {
    return db.prepare('SELECT * FROM cms_users WHERE username=? COLLATE NOCASE').get(username) || null;
  }

  function getCmsUserById(id) {
    return db.prepare('SELECT * FROM cms_users WHERE id=?').get(id) || null;
  }

  function listPasskeysForUser(userId) {
    return db.prepare('SELECT * FROM passkey_credentials WHERE user_id=? ORDER BY created_at').all(userId)
      .map((credential) => ({ ...credential, transports: JSON.parse(credential.transports || '[]') }));
  }

  function getPasskeyCredential(id, userId = null) {
    const credential = userId === null
      ? db.prepare('SELECT * FROM passkey_credentials WHERE id=?').get(id)
      : db.prepare('SELECT * FROM passkey_credentials WHERE id=? AND user_id=?').get(id, userId);
    if (!credential) return null;
    return { ...credential, transports: JSON.parse(credential.transports || '[]') };
  }

  function createWebAuthnChallenge(input) {
    const id = crypto.randomBytes(32).toString('base64url');
    const now = Date.now();
    db.prepare('DELETE FROM webauthn_challenges WHERE expires_at<=?').run(now);
    db.prepare(`INSERT INTO webauthn_challenges
      (id,type,challenge,username,display_name,user_handle,user_id,expires_at)
      VALUES (?,?,?,?,?,?,?,?)`).run(
      id, input.type, input.challenge, input.username || null, input.displayName || null,
      input.userHandle || null, input.userId || null, now + 5 * 60_000,
    );
    return id;
  }

  function getWebAuthnChallenge(id, type) {
    const challenge = db.prepare('SELECT * FROM webauthn_challenges WHERE id=? AND type=?').get(id, type);
    if (!challenge) return null;
    if (challenge.expires_at <= Date.now()) {
      db.prepare('DELETE FROM webauthn_challenges WHERE id=?').run(id);
      return null;
    }
    return challenge;
  }

  function registerCmsUser(challengeId, challenge, credential) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const inserted = db.prepare(`INSERT INTO cms_users (username,display_name,role)
        VALUES (?,?,?)`).run(challenge.username, challenge.display_name, 'editor');
      const userId = Number(inserted.lastInsertRowid);
      db.prepare(`INSERT INTO passkey_credentials
        (id,user_id,public_key,counter,transports,device_type,backed_up)
        VALUES (?,?,?,?,?,?,?)`).run(
        credential.id, userId, Buffer.from(credential.publicKey), credential.counter,
        JSON.stringify(credential.transports || []), credential.deviceType,
        credential.backedUp ? 1 : 0,
      );
      db.prepare('DELETE FROM webauthn_challenges WHERE id=?').run(challengeId);
      db.exec('COMMIT');
      return getCmsUserById(userId);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  function finishPasskeyAuthentication(challengeId, userId, credentialId, counter) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const updated = db.prepare(`UPDATE passkey_credentials
        SET counter=?, last_used_at=CURRENT_TIMESTAMP WHERE id=? AND user_id=?`)
        .run(counter, credentialId, userId);
      if (!updated.changes) throw new Error('Credential no longer exists');
      db.prepare('UPDATE cms_users SET last_login_at=CURRENT_TIMESTAMP WHERE id=?').run(userId);
      db.prepare('DELETE FROM webauthn_challenges WHERE id=?').run(challengeId);
      db.exec('COMMIT');
      return getCmsUserById(userId);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  return {
    db, categories, stats, listPlaces, getPlace, createPlace, editPlace, setActive, publicPlaces,
    getCmsUserByUsername, getCmsUserById, listPasskeysForUser, getPasskeyCredential,
    createWebAuthnChallenge, getWebAuthnChallenge, registerCmsUser, finishPasskeyAuthentication,
    close: () => db.close(),
  };
}
