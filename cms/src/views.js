const escapeMap = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, (char) => escapeMap[char]);

function icon(name) {
  const paths = {
    map: '<path d="M9 18l-6 3V6l6-3 6 3 6-3v15l-6 3-6-3zm0 0V3m6 18V6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    pin: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1116 0z"/><circle cx="12" cy="10" r="2.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 013 3L8 18l-4 1 1-4z"/>',
    logout: '<path d="M10 17l5-5-5-5M15 12H3M15 3h5a1 1 0 011 1v16a1 1 0 01-1 1h-5"/>',
    archive: '<path d="M4 7h16v14H4zM2 3h20v4H2zM9 11h6"/>',
    restore: '<path d="M3 12a9 9 0 101.5-5M3 3v6h6"/>',
    arrow: '<path d="M19 12H5m7 7l-7-7 7-7"/>',
    external: '<path d="M14 3h7v7M10 14L21 3M21 14v6a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1h6"/>',
    key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8m-3 3l3 3m-6 0l3 3"/>',
    alert: '<path d="M21 15a4 4 0 01-4 4H8l-5 3V7a4 4 0 014-4h10a4 4 0 014 4z"/><path d="M12 7v4m0 4h.01"/>',
    collection: '<path d="M4 5h16v4H4zM4 11h16v8H4z"/><path d="M8 15h8"/>',
  };
  return `<svg class="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths[name] || ''}</svg>`;
}

function layout({ title, body, user = null, active = '', description = '' }) {
  const nav = user ? `<aside class="sidebar" id="sidebar">
    <a class="brand" href="/admin" aria-label="Gutafinn admin">${icon('map')}<span><strong>Gutafinn</strong><small>Administration</small></span></a>
    <nav aria-label="Huvudmeny">
      <a class="nav-link ${active === 'dashboard' ? 'active' : ''}" href="/admin">${icon('grid')}Översikt</a>
      <a class="nav-link ${active === 'places' ? 'active' : ''}" href="/admin/places">${icon('pin')}Platser</a>
      <a class="nav-link ${active === 'collections' ? 'active' : ''}" href="/admin/collections">${icon('collection')}Samlingar</a>
      <a class="nav-link ${active === 'corrections' ? 'active' : ''}" href="/admin/corrections">${icon('alert')}Rättelser</a>
      <a class="nav-link nav-create" href="/admin/places/new">${icon('plus')}Ny plats</a>
    </nav>
    <div class="sidebar-foot"><span class="avatar">${escapeHtml(user[0].toUpperCase())}</span><span><strong>${escapeHtml(user)}</strong><small>CMS-användare</small></span>
      <form method="post" action="/admin/logout"><button class="icon-button" aria-label="Logga ut" title="Logga ut">${icon('logout')}</button></form>
    </div>
  </aside>` : '';
  return `<!doctype html><html lang="sv"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)} · Gutafinn</title><meta name="description" content="${escapeHtml(description || title)}">
    <link rel="stylesheet" href="/assets/admin.css"><script src="/assets/admin.js" defer></script></head>
    <body class="${user ? 'admin-shell' : 'login-page'}">${nav}${user ? '<button class="menu-button" data-menu aria-label="Öppna meny">☰</button>' : ''}
    <main class="${user ? 'main' : 'login-main'}" id="main-content">${body}</main></body></html>`;
}

export function loginView({ error = '', username = '', passkeyEnabled = false, signupEnabled = false } = {}) {
  const passkeyLogin = passkeyEnabled ? `<p class="muted">Logga in med din passkey för att hantera platserna i guiden.</p>
    <form class="stack login-form passkey-form" data-passkey-login>
      <label>Användarnamn<input name="passkeyUsername" autocomplete="username webauthn" required autofocus></label>
      <button class="button primary wide" type="submit">${icon('key')}Logga in med passkey</button>
      <p class="passkey-status" data-passkey-status role="status" aria-live="polite"></p>
    </form>
    ${signupEnabled ? '<p class="signup-link">Ny användare? <a href="/signup">Skapa konto med passkey</a></p>' : ''}
    <div class="auth-divider"><span>eller använd reservinloggning</span></div>` : '<p class="muted">Logga in med systemadministratörens reservkonto.</p>';
  return layout({ title: 'Logga in', body: `<section class="login-card">
    <div class="login-brand">${icon('map')}</div><p class="eyebrow">Gutafinn</p><h1>Välkommen tillbaka</h1>
    ${error ? `<div class="alert error" role="alert">${escapeHtml(error)}</div>` : ''}
    ${passkeyLogin}
    <form method="post" action="/admin/login" class="stack login-form">
      <label>Användarnamn<input name="username" value="${escapeHtml(username)}" autocomplete="username" required ${passkeyEnabled ? '' : 'autofocus'}></label>
      <label>Lösenord<input type="password" name="password" autocomplete="current-password" required></label>
      <button class="button primary wide" type="submit">Logga in</button>
    </form><p class="login-help">Lösenordsinloggningen är avsedd för återställning och systemadministration.</p>
  </section>` });
}

export function signupView({ enabled = false } = {}) {
  const content = enabled ? `<p class="muted">Skapa ett redaktörskonto. Din enhet skyddar inloggningen med skärmlås, fingeravtryck eller ansiktsigenkänning.</p>
    <form class="stack login-form passkey-form" data-passkey-signup>
      <label>Ditt namn<input name="displayName" autocomplete="name" minlength="2" maxlength="100" required autofocus></label>
      <label>Användarnamn<input name="username" autocomplete="username" minlength="3" maxlength="64" pattern="[A-Za-z0-9._@+\\-]+" required><small>3–64 tecken. Bokstäver, siffror, punkt, bindestreck, plus, @ och understreck.</small></label>
      <label>Registreringskod<input type="password" name="signupCode" autocomplete="one-time-code" required><small>Koden får du av systemansvarig.</small></label>
      <button class="button primary wide" type="submit">${icon('key')}Skapa konto och passkey</button>
      <p class="passkey-status" data-passkey-status role="status" aria-live="polite"></p>
    </form>` : `<div class="alert error" role="alert">Registrering med passkey är inte aktiverad. Kontakta systemansvarig för att få ett konto.</div>`;
  return layout({ title: 'Skapa konto', body: `<section class="login-card signup-card">
    <a class="back-link" href="/admin/login">${icon('arrow')}Till inloggningen</a>
    <div class="login-brand">${icon('key')}</div><p class="eyebrow">Gutafinn</p><h1>Skapa konto</h1>
    ${content}
  </section>` });
}

function header(title, intro, action = '') {
  return `<header class="page-header"><div><p class="eyebrow">Administration</p><h1>${escapeHtml(title)}</h1>${intro ? `<p>${escapeHtml(intro)}</p>` : ''}</div>${action}</header>`;
}

export function dashboardView({ stats, recent, user }) {
  const statCards = [
    ['Alla platser', stats.total, 'pin', 'I platsregistret'],
    ['Publicerade', stats.active || 0, 'grid', 'Synliga i guiden'],
    ['Arkiverade', stats.archived || 0, 'archive', 'Dolda från besökare'],
    ['Kategorier', stats.categories || 0, 'map', 'Används just nu'],
    ['Publicerade samlingar', stats.collections || 0, 'collection', 'Synliga i guiden'],
    ['Nya rättelser', stats.corrections || 0, 'alert', 'Väntar på granskning'],
  ].map(([label, value, iconName, hint]) => `<article class="stat-card"><span class="stat-icon">${icon(iconName)}</span><div><span>${escapeHtml(label)}</span><strong>${value}</strong><small>${escapeHtml(hint)}</small></div></article>`).join('');
  return layout({ title: 'Översikt', user, active: 'dashboard', body:
    `${header('Översikt', 'En snabb bild av innehållet i Gutafinn.', `<a class="button primary" href="/admin/places/new">${icon('plus')}Lägg till plats</a>`)}
    <section class="stats-grid" aria-label="Statistik">${statCards}</section>
    <section class="panel"><div class="panel-heading"><div><h2>Senast i registret</h2><p>Platser i alfabetisk ordning</p></div><a href="/admin/places">Visa alla</a></div>
      ${placeTable(recent.rows, '')}</section>` });
}

function statusBadge(active) {
  return `<span class="status ${active ? 'published' : 'archived'}"><span></span>${active ? 'Publicerad' : 'Arkiverad'}</span>`;
}

function placeTable(rows, csrf) {
  if (!rows.length) return `<div class="empty"><span>${icon('pin')}</span><h2>Inga platser hittades</h2><p>Prova att ändra filtren eller lägg till en ny plats.</p></div>`;
  return `<div class="table-scroll"><table><thead><tr><th>Plats</th><th>Kategori</th><th>Ort</th><th>Status</th><th><span class="sr-only">Åtgärder</span></th></tr></thead><tbody>${rows.map((place) =>
    `<tr><td><a class="place-name" href="/admin/places/${encodeURIComponent(place.id)}/edit"><span class="place-mark">${escapeHtml(place.category_emoji || '📍')}</span><span><strong>${escapeHtml(place.name)}</strong><small>${escapeHtml(place.street_address || place.id)}</small></span></a></td>
    <td>${escapeHtml(place.category_label || place.category)}</td><td>${escapeHtml(place.locality || '—')}</td><td>${statusBadge(place.is_active)}</td>
    <td class="actions"><a class="icon-button" href="/admin/places/${encodeURIComponent(place.id)}/edit" aria-label="Redigera ${escapeHtml(place.name)}">${icon('edit')}</a>
    ${csrf ? `<form method="post" action="/admin/places/${encodeURIComponent(place.id)}/status"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="active" value="${place.is_active ? '0' : '1'}"><button class="icon-button" aria-label="${place.is_active ? 'Arkivera' : 'Återställ'} ${escapeHtml(place.name)}" title="${place.is_active ? 'Arkivera' : 'Återställ'}">${icon(place.is_active ? 'archive' : 'restore')}</button></form>` : ''}</td></tr>`).join('')}</tbody></table></div>`;
}

function pagination({ page, pages, query }) {
  if (pages <= 1) return '';
  const link = (target, label, disabled = false) => disabled ? `<span class="page-link disabled">${label}</span>` : `<a class="page-link" href="?${new URLSearchParams({ ...query, page: target }).toString()}">${label}</a>`;
  return `<nav class="pagination" aria-label="Sidnavigering">${link(page - 1, '← Föregående', page <= 1)}<span>Sida ${page} av ${pages}</span>${link(page + 1, 'Nästa →', page >= pages)}</nav>`;
}

export function placesView({ result, categories, filters, csrf, user, notice = '' }) {
  const params = { q: filters.query || '', category: filters.category || '', status: filters.status || 'all' };
  return layout({ title: 'Platser', user, active: 'places', body:
    `${header('Platser', `${result.total} ${result.total === 1 ? 'plats' : 'platser'} matchar ditt urval.`, `<a class="button primary" href="/admin/places/new">${icon('plus')}Ny plats</a>`)}
    ${notice ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>` : ''}
    <section class="panel"><form class="filters" method="get" action="/admin/places">
      <label class="search-field"><span class="sr-only">Sök platser</span>${icon('search')}<input type="search" name="q" value="${escapeHtml(filters.query)}" placeholder="Sök namn, beskrivning eller ort…"></label>
      <label><span class="sr-only">Kategori</span><select name="category"><option value="">Alla kategorier</option>${categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === filters.category ? 'selected' : ''}>${escapeHtml(category.emoji)} ${escapeHtml(category.label)}</option>`).join('')}</select></label>
      <label><span class="sr-only">Status</span><select name="status"><option value="all" ${filters.status === 'all' ? 'selected' : ''}>Alla statusar</option><option value="active" ${filters.status === 'active' ? 'selected' : ''}>Publicerade</option><option value="archived" ${filters.status === 'archived' ? 'selected' : ''}>Arkiverade</option></select></label>
      <button class="button secondary" type="submit">Filtrera</button>${filters.query || filters.category || filters.status !== 'all' ? '<a class="clear-link" href="/admin/places">Rensa</a>' : ''}
    </form>${placeTable(result.rows, csrf)}${pagination({ ...result, query: params })}</section>` });
}

export function collectionsView({ rows, csrf, user, notice = '', error = '' }) {
  const content = rows.length ? `<div class="table-scroll"><table><thead><tr><th>Samling</th><th>Platser</th><th>Status</th><th><span class="sr-only">Åtgärder</span></th></tr></thead><tbody>${rows.map((item) =>
    `<tr><td><a class="place-name" href="/admin/collections/${encodeURIComponent(item.id)}/edit"><span class="place-mark">✦</span><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.id)}</small></span></a></td>
    <td>${item.place_count}</td><td>${statusBadge(item.is_published)}</td><td class="actions">
      <a class="icon-button" href="/admin/collections/${encodeURIComponent(item.id)}/edit" aria-label="Redigera ${escapeHtml(item.title)}">${icon('edit')}</a>
      <form method="post" action="/admin/collections/${encodeURIComponent(item.id)}/status"><input type="hidden" name="csrf" value="${escapeHtml(csrf)}"><input type="hidden" name="published" value="${item.is_published ? '0' : '1'}"><button class="icon-button" aria-label="${item.is_published ? 'Avpublicera' : 'Publicera'} ${escapeHtml(item.title)}" title="${item.is_published ? 'Avpublicera' : 'Publicera'}">${icon(item.is_published ? 'archive' : 'restore')}</button></form>
    </td></tr>`).join('')}</tbody></table></div>` : `<div class="empty"><span>${icon('collection')}</span><h2>Inga samlingar ännu</h2><p>Skapa ett redaktionellt urval av platser för besökarna.</p></div>`;
  return layout({ title: 'Samlingar', user, active: 'collections', body:
    `${header('Samlingar', 'Kuraterade och ordnade platsurval i den publika guiden.', `<a class="button primary" href="/admin/collections/new">${icon('plus')}Ny samling</a>`)}
    ${notice ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>` : ''}
    ${error ? `<div class="alert error" role="alert">${escapeHtml(error)}</div>` : ''}
    <section class="panel">${content}</section>` });
}

export function collectionFormView({ collection, places, errors = {}, csrf, user, isNew = false, notice = '' }) {
  const placeIds = collection.placeIds?.length ? collection.placeIds : [''];
  const options = places.map((place) => `<option value="${escapeHtml(place.id)}">${escapeHtml(place.name)}${place.is_active ? '' : ' (arkiverad)'}</option>`).join('');
  const placeRows = placeIds.map((placeId) => `<div class="repeat-row"><input name="placeId[]" list="collection-place-options" value="${escapeHtml(placeId)}" placeholder="Sök namn eller ange plats-ID" autocomplete="off" aria-label="Plats-ID i samlingen"><button class="icon-button remove-row" type="button" aria-label="Ta bort plats">×</button></div>`).join('');
  return layout({ title: isNew ? 'Ny samling' : collection.title, user, active: 'collections', body:
    `<a class="back-link" href="/admin/collections">${icon('arrow')}Till samlingarna</a>
    ${header(isNew ? 'Ny samling' : 'Redigera samling', 'Ordningen nedan blir ordningen i den publika presentationen.')}
    ${notice ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>` : ''}
    <form class="place-form" method="post" action="${isNew ? '/admin/collections' : `/admin/collections/${encodeURIComponent(collection.id)}`}" novalidate>
      <input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
      <section class="form-section"><div class="section-heading"><span>1</span><div><h2>Presentation</h2><p>Kort, tydlig och redaktionellt motiverad.</p></div></div><div class="form-grid">
        ${isNew ? textField({ label: 'ID', name: 'id', value: collection.id, required: true, help: 'Delbar URL-nyckel, exempelvis barnens-visby.', error: errors.id, attrs: 'pattern="[a-z0-9]+(?:-[a-z0-9]+)*" maxlength="64"' }) : `<div class="field"><span>ID</span><strong>${escapeHtml(collection.id)}</strong><small>ID kan inte ändras efter att samlingen skapats.</small></div>`}
        ${textField({ label: 'Titel', name: 'title', value: collection.title, required: true, error: errors.title, attrs: 'minlength="2" maxlength="80"' })}
        ${textField({ label: 'Sortering', name: 'sortOrder', value: collection.sort_order ?? collection.sortOrder ?? 0, type: 'number', required: true, error: errors.sortOrder, attrs: 'min="0" max="9999"' })}
        <label class="field full"><span>Beskrivning <b aria-hidden="true">*</b></span><textarea name="description" minlength="10" maxlength="500" rows="4" required ${errors.description ? 'aria-invalid="true"' : ''}>${escapeHtml(collection.description || '')}</textarea><small>10–500 tecken. Förklara varför platserna hör ihop.</small>${errorFor(errors, 'description')}</label>
        <label class="checkbox-field full"><input type="checkbox" name="isPublished" ${collection.is_published || collection.isPublished ? 'checked' : ''}><span><strong>Publicerad</strong><small>Visas i appen när minst två aktiva platser ingår.</small></span></label>
      </div></section>
      <section class="form-section"><div class="section-heading"><span>2</span><div><h2>Platser och ordning</h2><p>Välj 2–20 platser. Översta platsen visas först.</p></div></div>
        <div class="repeater" data-repeater="collection-place"><div class="repeater-head"><span>Platslista</span><button class="text-button" type="button" data-add-row="collection-place">+ Lägg till plats</button></div><div data-rows>${placeRows}</div></div>
        <datalist id="collection-place-options">${options}</datalist>${errorFor(errors, 'placeIds')}
      </section>
      <div class="form-actions"><a class="button secondary" href="/admin/collections">Avbryt</a><button class="button primary" type="submit">${isNew ? 'Skapa samling' : 'Spara samling'}</button></div>
    </form>` });
}

const correctionIssueLabels = {
  hours: 'Öppettider', contact: 'Kontaktuppgifter', location: 'Position',
  accessibility: 'Tillgänglighet', closed: 'Permanent stängd', other: 'Annat',
};
const correctionStatusLabels = {
  new: 'Ny', reviewed: 'Granskad', resolved: 'Åtgärdad', dismissed: 'Avfärdad',
};

export function correctionsView({ rows, status, csrf, user, notice = '' }) {
  const options = [
    ['new', 'Nya'], ['reviewed', 'Granskade'], ['resolved', 'Åtgärdade'],
    ['dismissed', 'Avfärdade'], ['all', 'Alla'],
  ];
  const content = rows.length ? `<div class="correction-list">${rows.map((item) => `
    <article class="correction-card">
      <header><div><p class="eyebrow">${escapeHtml(correctionIssueLabels[item.issue_type] || item.issue_type)}</p>
        <h2><a href="/admin/places/${encodeURIComponent(item.place_id)}/edit">${escapeHtml(item.place_name)}</a></h2></div>
        <span class="correction-status status-${escapeHtml(item.status)}">${escapeHtml(correctionStatusLabels[item.status] || item.status)}</span></header>
      <p class="correction-message">${escapeHtml(item.message)}</p>
      <dl class="correction-meta"><div><dt>Inskickad</dt><dd>${escapeHtml(item.created_at)}</dd></div>
        <div><dt>Kontakt</dt><dd>${item.contact_email ? `<a href="mailto:${escapeHtml(item.contact_email)}">${escapeHtml(item.contact_email)}</a>` : 'Ingen e-post lämnad'}</dd></div>
        ${item.reviewed_by ? `<div><dt>Senast granskad av</dt><dd>${escapeHtml(item.reviewed_by)}</dd></div>` : ''}</dl>
      <form class="correction-actions" method="post" action="/admin/corrections/${item.id}">
        <input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
        <label>Status<select name="status">${Object.entries(correctionStatusLabels).map(([value, label]) => `<option value="${value}" ${item.status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
        <label>Intern anteckning<textarea name="resolutionNote" maxlength="1000" rows="2" placeholder="Vad kontrollerades eller ändrades?">${escapeHtml(item.resolution_note || '')}</textarea></label>
        <button class="button primary" type="submit">Spara granskning</button>
      </form>
    </article>`).join('')}</div>` : `<div class="empty"><span>${icon('alert')}</span><h2>Inga rättelser i den här kön</h2><p>Välj en annan status eller återkom senare.</p></div>`;

  return layout({ title: 'Rättelser', user, active: 'corrections', body:
    `${header('Rättelser', 'Besökarnas förslag ändrar aldrig platsdata automatiskt.')}
    ${notice ? `<div class="alert success" role="status">${escapeHtml(notice)}</div>` : ''}
    <section class="panel"><form class="filters" method="get" action="/admin/corrections">
      <label><span class="sr-only">Status</span><select name="status">${options.map(([value, label]) => `<option value="${value}" ${status === value ? 'selected' : ''}>${label}</option>`).join('')}</select></label>
      <button class="button secondary" type="submit">Filtrera</button>
    </form>${content}</section>` });
}

function errorFor(errors, field) {
  return errors[field] ? `<small class="field-error">${escapeHtml(errors[field])}</small>` : '';
}

function textField({ label, name, value = '', type = 'text', required = false, help = '', error = '', attrs = '' }) {
  return `<label class="field"><span>${escapeHtml(label)}${required ? ' <b aria-hidden="true">*</b>' : ''}</span><input type="${type}" name="${name}" value="${escapeHtml(value ?? '')}" ${required ? 'required' : ''} ${error ? 'aria-invalid="true"' : ''} ${attrs}>${help ? `<small>${escapeHtml(help)}</small>` : ''}${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ''}</label>`;
}

function repeaters(values, type, labels) {
  const safeValues = values?.length ? values : [''];
  return `<div class="repeater" data-repeater="${type}"><div class="repeater-head"><span>${labels.title}</span><button class="text-button" type="button" data-add-row="${type}">+ Lägg till</button></div><div data-rows>${safeValues.map((value) => `<div class="repeat-row"><input type="${labels.inputType || 'text'}" name="${type}[]" value="${escapeHtml(value)}" placeholder="${labels.placeholder}"><button class="icon-button remove-row" type="button" aria-label="Ta bort rad">×</button></div>`).join('')}</div></div>`;
}

function imageRows(images) {
  const values = images?.length ? images : [{ url: '', altText: '' }];
  return `<div class="repeater image-repeater" data-repeater="image"><div class="repeater-head"><span>Bilder</span><button class="text-button" type="button" data-add-row="image">+ Lägg till bild</button></div><div data-rows>${values.map((image) => `<div class="repeat-row image-row"><input type="url" name="imageUrl[]" value="${escapeHtml(image.url)}" placeholder="https://…"><input name="imageAlt[]" value="${escapeHtml(image.altText)}" placeholder="Beskriv bilden"><button class="icon-button remove-row" type="button" aria-label="Ta bort bild">×</button></div>`).join('')}</div></div>`;
}

export function placeFormView({ place = {}, categories, errors = {}, csrf, user, isNew = false }) {
  const contacts = place.contacts || { website: [], phone: [], email: [] };
  const title = isNew ? 'Lägg till plats' : `Redigera ${place.name || 'plats'}`;
  return layout({ title, user, active: 'places', body:
    `<a class="back-link" href="/admin/places">${icon('arrow')}Tillbaka till platser</a>
    ${header(title, isNew ? 'Skapa en ny plats i Gutafinn.' : `ID: ${place.id}`, '')}
    ${Object.keys(errors).length ? `<div class="alert error" role="alert"><strong>Platsen kunde inte sparas.</strong> Kontrollera de markerade fälten.</div>` : ''}
    <form class="place-form" method="post" action="${isNew ? '/admin/places' : `/admin/places/${encodeURIComponent(place.id)}`}">
      <input type="hidden" name="csrf" value="${escapeHtml(csrf)}">
      <div class="form-main">
        <section class="form-section"><div class="section-heading"><span>1</span><div><h2>Grunduppgifter</h2><p>Det besökaren ser först.</p></div></div>
          <div class="field-grid">${textField({ label: 'Namn', name: 'name', value: place.name, required: true, error: errors.name, attrs: 'maxlength="120"' })}
          <label class="field"><span>Kategori <b aria-hidden="true">*</b></span><select name="category" required ${errors.category ? 'aria-invalid="true"' : ''}><option value="">Välj kategori</option>${categories.map((category) => `<option value="${escapeHtml(category.id)}" ${category.id === place.category ? 'selected' : ''}>${escapeHtml(category.emoji)} ${escapeHtml(category.label)}</option>`).join('')}</select>${errorFor(errors, 'category')}</label></div>
          <label class="field"><span>Kort beskrivning</span><textarea name="description" rows="4" maxlength="1000" placeholder="Vad gör platsen värd ett besök?">${escapeHtml(place.description)}</textarea><small>Max 1 000 tecken.</small></label>
        </section>
        <section class="form-section"><div class="section-heading"><span>2</span><div><h2>Position och adress</h2><p>Koordinaterna används för kartmarkören.</p></div></div>
          <div class="field-grid">${textField({ label: 'Latitud', name: 'lat', value: place.lat, type: 'number', required: true, error: errors.lat, attrs: 'step="any" min="-90" max="90" placeholder="57.6348"' })}${textField({ label: 'Longitud', name: 'lng', value: place.lng, type: 'number', required: true, error: errors.lng, attrs: 'step="any" min="-180" max="180" placeholder="18.2948"' })}</div>
          <div class="field-grid">${textField({ label: 'Gatuadress', name: 'streetAddress', value: place.street_address || place.streetAddress, attrs: 'maxlength="180"' })}${textField({ label: 'Postnummer', name: 'postalCode', value: place.postal_code || place.postalCode, attrs: 'maxlength="16"' })}${textField({ label: 'Ort', name: 'locality', value: place.locality, attrs: 'maxlength="100"' })}${textField({ label: 'Kommun', name: 'municipality', value: place.municipality, attrs: 'maxlength="100"' })}</div>
          <a class="coordinate-link" data-map-link href="https://www.openstreetmap.org/" target="_blank" rel="noopener">${icon('external')}Kontrollera koordinater på OpenStreetMap</a>
        </section>
        <section class="form-section"><div class="section-heading"><span>3</span><div><h2>Besöksinformation</h2><p>Praktiska uppgifter inför besöket.</p></div></div>
          <div class="field-grid"><label class="field"><span>Prisnivå</span><select name="priceLevel"><option value="">Ej angiven</option>${[1,2,3,4].map((level) => `<option value="${level}" ${Number(place.price_level || place.priceLevel) === level ? 'selected' : ''}>${'€'.repeat(level)}</option>`).join('')}</select>${errorFor(errors, 'priceLevel')}</label>${textField({ label: 'Öppettider', name: 'openingHoursRaw', value: place.opening_hours_raw || place.openingHoursRaw, help: 'Exempel: Mo–Fr 10:00–17:00' })}</div>
          <label class="field"><span>Tillgänglighet</span><textarea name="accessibility" rows="3" placeholder="Beskriv entré, underlag, toalett eller annan relevant information.">${escapeHtml(place.accessibility)}</textarea></label>
          <label class="field"><span>Notering om öppettider</span><textarea name="openingHoursNote" rows="3">${escapeHtml(place.opening_hours_note || place.openingHoursNote)}</textarea></label>
        </section>
        <section class="form-section"><div class="section-heading"><span>4</span><div><h2>Kontakt och media</h2><p>Länkar som hjälper besökaren vidare.</p></div></div>
          ${errorFor(errors, 'contacts')}${repeaters(contacts.website, 'website', { title: 'Webbplatser', inputType: 'url', placeholder: 'https://…' })}${repeaters(contacts.phone, 'phone', { title: 'Telefonnummer', inputType: 'tel', placeholder: '+46…' })}${repeaters(contacts.email, 'email', { title: 'E-postadresser', inputType: 'email', placeholder: 'namn@exempel.se' })}${errorFor(errors, 'images')}${imageRows(place.images)}
        </section>
      </div>
      <aside class="form-aside"><div class="publish-card"><h2>Publicering</h2><label class="toggle"><input type="checkbox" name="isActive" value="1" ${place.is_active === 0 || place.isActive === false ? '' : 'checked'}><span aria-hidden="true"></span><span><strong>Publicerad</strong><small>Synlig för besökare</small></span></label>
        <button class="button primary wide" type="submit">${isNew ? 'Skapa plats' : 'Spara ändringar'}</button><a class="button ghost wide" href="/admin/places">Avbryt</a>
        ${!isNew && place.updated_at ? `<p class="updated">Senast uppdaterad<br><time>${escapeHtml(place.updated_at)}</time></p>` : ''}
      </div></aside>
    </form>` });
}

export function notFoundView({ user = null } = {}) {
  return layout({ title: 'Sidan hittades inte', user, body: `<div class="empty standalone"><span>${icon('map')}</span><h1>Sidan hittades inte</h1><p>Adressen verkar inte finnas.</p><a class="button primary" href="${user ? '/admin' : '/admin/login'}">Tillbaka</a></div>` });
}

export function errorView({ user = null } = {}) {
  return layout({ title: 'Något gick fel', user, body: `<div class="empty standalone"><span>!</span><h1>Något gick fel</h1><p>Försök igen om en liten stund.</p><a class="button primary" href="/admin">Till översikten</a></div>` });
}
