/* ==========================================================================
   Gotlandsguiden – kart-, positions- och platslogik
   ========================================================================== */

const GOTLAND_CENTER = [57.4684, 18.4867];
const DEFAULT_ZOOM = 9;
const LOCATED_ZOOM = 12;
const FOCUS_ZOOM = 14;
const FAVORITES_KEY = "gg_favorites";
const DARK_KEY = "gg_dark";
const ACTIVE_TAB_KEY = "gg_active_tab";

// Appens tillstånd – render() läser alltid härifrån.
const state = {
  places: [],
  userLatLng: null,
  activeCategory: "all", // "all" | "favorites" | kategori-nyckel
  query: "",
  favorites: loadFavorites(),
  selectedId: null,
  activeTab: "upptack", // "upptack" | "sparade" | "guide"
};

// ---------------------------------------------------------------------------
// Karta
// ---------------------------------------------------------------------------

const map = L.map("map", {
  center: GOTLAND_CENTER,
  zoom: DEFAULT_ZOOM,
  zoomControl: true,
});

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>-bidragsgivare',
}).addTo(map);

const userIcon = L.divIcon({
  className: "user-marker-wrapper",
  html: '<div class="user-marker"></div>',
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

let userMarker = null;
// markerClusterGroup grupperar närliggande markörer så kartan förblir
// snabb och läsbar även med hundratals platser.
const placesLayer = L.markerClusterGroup({
  maxClusterRadius: 50,
  showCoverageOnHover: false,
  spiderfyOnMaxZoom: true,
}).addTo(map);
const markersById = {};

// ---------------------------------------------------------------------------
// DOM-referenser
// ---------------------------------------------------------------------------

const statusEl = document.getElementById("status");
const listEl = document.getElementById("places-list");
const listTitleEl = document.getElementById("list-title");
const filterBarEl = document.getElementById("filter-bar");
const searchInput = document.getElementById("search-input");
const locateBtn = document.getElementById("locate-btn");
const detailSheet = document.getElementById("detail-sheet");
const detailContent = detailSheet.querySelector(".detail-content");
const detailClose = document.getElementById("detail-close");
const darkBtn = document.getElementById("dark-btn");
const siteTabsEl = document.getElementById("site-tabs");
const siteTabButtons = Array.from(document.querySelectorAll(".js-tab-trigger"));
const tabUpptackEl = document.getElementById("tab-upptack");
const tabSparadeEl = document.getElementById("tab-sparade");
const tabGuideEl = document.getElementById("tab-guide");
const savedListEl = document.getElementById("saved-list");
const savedSummaryEl = document.getElementById("saved-summary");
const heroTotalEl = document.getElementById("hero-total");
const heroVisibleEl = document.getElementById("hero-visible");
const heroSavedEl = document.getElementById("hero-saved");
const quickNearbyBtn = document.getElementById("quick-nearby");
const quickFoodBtn = document.getElementById("quick-food");
const quickBeachBtn = document.getElementById("quick-beach");
const quickRandomBtn = document.getElementById("quick-random");
const buildRouteBtn = document.getElementById("build-route");
const routeListEl = document.getElementById("route-list");

function setStatus(message, stateClass) {
  statusEl.textContent = message;
  statusEl.classList.remove("is-error", "is-ok");
  if (stateClass) statusEl.classList.add(stateClass);
}

// ---------------------------------------------------------------------------
// Favoriter (localStorage)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Mörkt läge
// ---------------------------------------------------------------------------

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  darkBtn.textContent = dark ? "☀️" : "🌙";
  darkBtn.setAttribute("aria-pressed", String(dark));
  darkBtn.title = dark ? "Växla till ljust läge" : "Växla till mörkt läge";
  darkBtn.setAttribute("aria-label", dark ? "Växla till ljust läge" : "Växla till mörkt läge");
}

function loadTheme() {
  const saved = localStorage.getItem(DARK_KEY);
  if (saved !== null) return saved === "1";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function toggleDarkMode() {
  const isDark = document.documentElement.getAttribute("data-theme") === "dark";
  const next = !isDark;
  applyTheme(next);
  try { localStorage.setItem(DARK_KEY, next ? "1" : "0"); } catch (e) {}
}

darkBtn.addEventListener("click", toggleDarkMode);
applyTheme(loadTheme());

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem(FAVORITES_KEY)) || []);
  } catch (e) {
    return new Set();
  }
}

function saveFavorites() {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify([...state.favorites]));
  } catch (e) {
    /* localStorage kan vara blockerad – strunt i det */
  }
}

function toggleFavorite(id) {
  if (state.favorites.has(id)) state.favorites.delete(id);
  else state.favorites.add(id);
  saveFavorites();
}

// ---------------------------------------------------------------------------
// Hjälpfunktioner
// ---------------------------------------------------------------------------

function distanceMeters([lat1, lng1], [lat2, lng2]) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function markerIcon(category) {
  const color = CATEGORIES[category]?.color || "#666";
  return L.divIcon({
    className: "place-marker-wrapper",
    html: `<div class="place-marker" style="background:${color}"></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 18],
    popupAnchor: [0, -18],
  });
}

// Liten DOM-hjälpare – bygger element utan innerHTML (säkert mot XSS).
function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === "class") node.className = v;
    else if (k === "text") node.textContent = v;
    else if (k.startsWith("on") && typeof v === "function") {
      node.addEventListener(k.slice(2).toLowerCase(), v);
    } else if (v != null) {
      node.setAttribute(k, v);
    }
  }
  for (const child of [].concat(children)) {
    if (child == null) continue;
    node.appendChild(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return node;
}

// ---------------------------------------------------------------------------
// Urval av synliga platser
// ---------------------------------------------------------------------------

function visiblePlaces() {
  const q = state.query.trim().toLowerCase();

  let items = state.places.map((p) => ({
    ...p,
    distance: state.userLatLng
      ? distanceMeters(state.userLatLng, [p.lat, p.lng])
      : null,
  }));

  if (state.activeCategory === "favorites") {
    items = items.filter((p) => state.favorites.has(p.id));
  } else if (state.activeCategory !== "all") {
    items = items.filter((p) => p.category === state.activeCategory);
  }

  if (q) {
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
    );
  }

  if (state.userLatLng) items.sort((a, b) => a.distance - b.distance);

  return items;
}

// ---------------------------------------------------------------------------
// Rendering – kartmarkörer
// ---------------------------------------------------------------------------

function renderMarkers(items) {
  placesLayer.clearLayers();
  for (const key of Object.keys(markersById)) delete markersById[key];

  items.forEach((p) => {
    const marker = L.marker([p.lat, p.lng], {
      icon: markerIcon(p.category),
      title: p.name,
    });
    marker.on("click", () => openDetail(p.id));
    placesLayer.addLayer(marker);
    markersById[p.id] = marker;
  });
}

// ---------------------------------------------------------------------------
// Rendering – lista
// ---------------------------------------------------------------------------

function placeCard(p) {
  const cat = CATEGORIES[p.category];
  const isFav = state.favorites.has(p.id);

  const meta = el("div", { class: "place-meta" }, [
    p.distance != null
      ? el("span", { class: "place-distance", text: formatDistance(p.distance) })
      : null,
    p.distance != null ? el("span", { text: "·" }) : null,
    el("span", { class: "place-category", text: cat?.label || p.category }),
  ]);

  const favBtn = el("button", {
    type: "button",
    class: "fav-btn" + (isFav ? " is-fav" : ""),
    "aria-label": isFav ? "Ta bort från sparade" : "Spara plats",
    "aria-pressed": String(isFav),
    text: isFav ? "♥" : "♡",
    onClick: (e) => {
      e.stopPropagation();
      toggleFavorite(p.id);
      render();
    },
  });

  const card = el(
    "li",
    {
      class: "place-card" + (state.selectedId === p.id ? " is-selected" : ""),
      onClick: () => openDetail(p.id),
    },
    [
      el("span", { class: "place-icon", text: cat?.emoji || "📍" }),
      el("div", { class: "place-info" }, [
        el("p", { class: "place-name", text: p.name }),
        el("p", { class: "place-desc", text: p.description }),
        meta,
      ]),
      favBtn,
    ]
  );
  card.style.borderLeftColor = cat?.color || "#666";
  return card;
}

function renderList(items) {
  listEl.replaceChildren();

  if (state.activeCategory === "favorites") listTitleEl.textContent = "Sparade platser";
  else if (state.userLatLng) listTitleEl.textContent = "Platser nära dig";
  else listTitleEl.textContent = "Platser på Gotland";

  if (items.length === 0) {
    const msg =
      state.activeCategory === "favorites"
        ? "Du har inte sparat några platser än. Tryck på hjärtat på ett kort."
        : "Inga platser matchar din sökning.";
    listEl.appendChild(el("li", { class: "place-placeholder", text: msg }));
    return;
  }

  items.forEach((p) => listEl.appendChild(placeCard(p)));
}

function renderSavedList() {
  savedListEl.replaceChildren();

  const savedItems = state.places
    .filter((p) => state.favorites.has(p.id))
    .map((p) => ({
      ...p,
      distance: state.userLatLng ? distanceMeters(state.userLatLng, [p.lat, p.lng]) : null,
    }))
    .sort((a, b) => {
      if (a.distance == null && b.distance == null) return a.name.localeCompare(b.name, "sv");
      if (a.distance == null) return 1;
      if (b.distance == null) return -1;
      return a.distance - b.distance;
    });

  if (savedItems.length === 0) {
    savedSummaryEl.textContent = "Du har inga favoriter ännu. Tryck på hjärtat i Upptäck för att spara platser.";
    savedListEl.appendChild(
      el("li", {
        class: "place-placeholder",
        text: "Inga sparade platser ännu.",
      })
    );
    return;
  }

  savedSummaryEl.textContent = `Du har sparat ${savedItems.length} plats${savedItems.length === 1 ? "" : "er"}.`;
  savedItems.forEach((p) => savedListEl.appendChild(placeCard(p)));
}

function renderHeroStats(visibleItems) {
  heroTotalEl.textContent = String(state.places.length);
  heroVisibleEl.textContent = String(visibleItems.length);
  heroSavedEl.textContent = String(state.favorites.size);
}

function setActiveTab(tabKey) {
  state.activeTab = tabKey;
  try {
    localStorage.setItem(ACTIVE_TAB_KEY, tabKey);
  } catch (e) {}

  const tabMap = {
    upptack: tabUpptackEl,
    sparade: tabSparadeEl,
    guide: tabGuideEl,
  };

  for (const [key, section] of Object.entries(tabMap)) {
    const isActive = key === tabKey;
    section.hidden = !isActive;
    section.classList.toggle("is-active", isActive);
  }

  siteTabButtons.forEach((btn) => {
    const isActive = btn.dataset.tab === tabKey;
    btn.classList.toggle("is-active", isActive);
    btn.setAttribute("aria-pressed", String(isActive));
  });

  if (tabKey === "upptack") {
    render();
    setTimeout(() => map.invalidateSize(), 80);
    return;
  }

  if (tabKey === "sparade") {
    renderSavedList();
    renderMarkers(state.places.filter((p) => state.favorites.has(p.id)));
    setTimeout(() => map.invalidateSize(), 80);
    return;
  }

  renderMarkers([]);
}

function loadActiveTab() {
  try {
    const tab = localStorage.getItem(ACTIVE_TAB_KEY);
    if (tab === "upptack" || tab === "sparade" || tab === "guide") return tab;
  } catch (e) {}
  return "upptack";
}

function render() {
  const items = visiblePlaces();
  renderMarkers(items);
  renderList(items);
  renderSavedList();
  renderHeroStats(items);
}

function activateCategory(categoryKey) {
  state.activeCategory = categoryKey;
  renderFilterBar();
  render();
}

function jumpToRandomPlace() {
  const items = visiblePlaces();
  if (items.length === 0) return;
  const pick = items[Math.floor(Math.random() * items.length)];
  openDetail(pick.id);
}

function renderRoute(items) {
  routeListEl.replaceChildren();

  if (items.length === 0) {
    routeListEl.appendChild(
      el("li", {
        class: "place-placeholder",
        text: "Hittade ingen rutt just nu. Testa att byta filter i Upptäck.",
      })
    );
    return;
  }

  items.forEach((p, idx) => {
    const cat = CATEGORIES[p.category];
    const meta = state.userLatLng && p.distance != null ? `${formatDistance(p.distance)} bort` : cat?.label || p.category;

    const item = el("li", { class: "route-item" }, [
      el("div", {}, [
        el("h4", { text: `${idx + 1}. ${p.name}` }),
        el("p", { text: `${cat?.emoji || "📍"} ${meta}` }),
      ]),
      el("button", {
        type: "button",
        class: "route-go",
        text: "Öppna",
        onClick: () => {
          setActiveTab("upptack");
          openDetail(p.id);
        },
      }),
    ]);

    routeListEl.appendChild(item);
  });
}

function buildMiniRoute() {
  let items = state.places.map((p) => ({
    ...p,
    distance: state.userLatLng ? distanceMeters(state.userLatLng, [p.lat, p.lng]) : null,
  }));

  if (state.userLatLng) {
    items.sort((a, b) => a.distance - b.distance);
  } else {
    items.sort((a, b) => a.name.localeCompare(b.name, "sv"));
  }

  const route = [];
  const usedCategories = new Set();
  for (const p of items) {
    if (!usedCategories.has(p.category)) {
      route.push(p);
      usedCategories.add(p.category);
    }
    if (route.length === 3) break;
  }

  if (route.length < 3) {
    for (const p of items) {
      if (route.find((x) => x.id === p.id)) continue;
      route.push(p);
      if (route.length === 3) break;
    }
  }

  renderRoute(route);
}

// ---------------------------------------------------------------------------
// Detaljvy
// ---------------------------------------------------------------------------

function openDetail(id) {
  const p = state.places.find((x) => x.id === id);
  if (!p) return;

  state.selectedId = id;
  const cat = CATEGORIES[p.category];
  const distance = state.userLatLng
    ? distanceMeters(state.userLatLng, [p.lat, p.lng])
    : null;
  const isFav = state.favorites.has(p.id);

  const badge = el("span", { class: "detail-badge" }, [
    `${cat?.emoji || "📍"} ${cat?.label || p.category}`,
  ]);
  badge.style.background = cat?.color || "#666";

  const directionsUrl = `https://www.openstreetmap.org/directions?to=${p.lat}%2C${p.lng}`;

  const favBtn = el("button", {
    type: "button",
    class: "btn",
    text: isFav ? "♥ Sparad" : "♡ Spara",
    onClick: () => {
      toggleFavorite(p.id);
      openDetail(p.id); // rita om panelen
      render();
    },
  });

  // Kontaktinfo (valfria fält på platsobjektet: phone, website, email)
  const contactItems = [];
  if (p.website) {
    const a = document.createElement("a");
    a.href = p.website;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "🌐 " + p.website.replace(/^https?:\/\/(www\.)?/, "");
    contactItems.push(a);
  }
  if (p.phone) {
    const a = document.createElement("a");
    a.href = "tel:" + p.phone;
    a.textContent = "📞 " + p.phone;
    contactItems.push(a);
  }
  if (p.email) {
    const a = document.createElement("a");
    a.href = "mailto:" + p.email;
    a.textContent = "✉️ " + p.email;
    contactItems.push(a);
  }

  detailContent.replaceChildren(
    badge,
    el("h2", { class: "detail-name", id: "detail-name", text: p.name }),
    el("p", {
      class: "detail-distance",
      text: distance != null ? `${formatDistance(distance)} från din position` : "Position okänd",
    }),
    el("p", { class: "detail-desc", text: p.description }),
    ...(contactItems.length > 0 ? [el("div", { class: "detail-contact" }, contactItems)] : []),
    el("div", { class: "detail-actions" }, [
      el(
        "a",
        {
          class: "btn btn-primary",
          href: directionsUrl,
          target: "_blank",
          rel: "noopener",
        },
        ["🧭 Vägbeskrivning"]
      ),
      favBtn,
    ])
  );

  detailSheet.hidden = false;
  focusPlace(p.id);
  render(); // markera valt kort
}

function closeDetail() {
  detailSheet.hidden = true;
  state.selectedId = null;
  render();
}

// Panorera kartan till en plats och öppna dess markör.
function focusPlace(id) {
  const p = state.places.find((x) => x.id === id);
  if (!p) return;
  map.setView([p.lat, p.lng], Math.max(map.getZoom(), FOCUS_ZOOM), {
    animate: true,
  });
}

// ---------------------------------------------------------------------------
// Filter-chips
// ---------------------------------------------------------------------------

function renderFilterBar() {
  const chips = [
    ["all", { label: "Alla", emoji: "📍" }],
    ["favorites", { label: "Sparade", emoji: "♥" }],
    ...Object.entries(CATEGORIES),
  ];

  filterBarEl.replaceChildren();
  chips.forEach(([key, cfg]) => {
    const btn = el("button", {
      type: "button",
      class: "chip" + (state.activeCategory === key ? " is-active" : ""),
      text: `${cfg.emoji} ${cfg.label}`,
      onClick: () => {
        state.activeCategory = key;
        renderFilterBar();
        render();
      },
    });
    filterBarEl.appendChild(btn);
  });
}

// ---------------------------------------------------------------------------
// Geolocation
// ---------------------------------------------------------------------------

function onLocationSuccess(pos) {
  const { latitude, longitude } = pos.coords;
  state.userLatLng = [latitude, longitude];

  if (userMarker) {
    userMarker.setLatLng(state.userLatLng);
  } else {
    userMarker = L.marker(state.userLatLng, { icon: userIcon, title: "Du är här" })
      .addTo(map)
      .bindPopup("Du är här");
  }

  map.setView(state.userLatLng, LOCATED_ZOOM);
  setStatus("Din position hittades – platser sorteras närmast först.", "is-ok");
  locateBtn.classList.add("is-active");
  render();
}

function onLocationError(err) {
  const messages = {
    [err.PERMISSION_DENIED]: "Du nekade åtkomst till din position. Visar hela Gotland.",
    [err.POSITION_UNAVAILABLE]: "Positionen är inte tillgänglig just nu. Visar hela Gotland.",
    [err.TIMEOUT]: "Det tog för lång tid att hitta din position. Visar hela Gotland.",
  };
  setStatus(messages[err.code] || "Kunde inte hämta din position. Visar hela Gotland.", "is-error");
  locateBtn.classList.remove("is-active");
  if (!state.userLatLng) map.setView(GOTLAND_CENTER, DEFAULT_ZOOM);
}

function requestLocation() {
  if (!("geolocation" in navigator)) {
    setStatus("Din enhet stöder inte positionering. Visar hela Gotland.", "is-error");
    return;
  }
  setStatus("Söker din position…");
  navigator.geolocation.getCurrentPosition(onLocationSuccess, onLocationError, {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000,
  });
}

// ---------------------------------------------------------------------------
// Händelser
// ---------------------------------------------------------------------------

searchInput.addEventListener("input", (e) => {
  state.query = e.target.value;
  render();
});

siteTabsEl.addEventListener("click", (e) => {
  const btn = e.target.closest(".js-tab-trigger");
  if (!btn) return;
  setActiveTab(btn.dataset.tab);
});

document.getElementById("mobile-nav").addEventListener("click", (e) => {
  const btn = e.target.closest(".js-tab-trigger");
  if (!btn) return;
  setActiveTab(btn.dataset.tab);
});

quickFoodBtn.addEventListener("click", () => {
  setActiveTab("upptack");
  activateCategory("mat");
});

quickNearbyBtn.addEventListener("click", () => {
  setActiveTab("upptack");
  activateCategory("all");
  requestLocation();
});

quickBeachBtn.addEventListener("click", () => {
  setActiveTab("upptack");
  activateCategory("strand");
});

quickRandomBtn.addEventListener("click", () => {
  setActiveTab("upptack");
  jumpToRandomPlace();
});

buildRouteBtn.addEventListener("click", buildMiniRoute);

locateBtn.addEventListener("click", () => {
  if (state.userLatLng) {
    map.setView(state.userLatLng, LOCATED_ZOOM, { animate: true });
  } else {
    requestLocation();
  }
});

detailClose.addEventListener("click", closeDetail);
detailSheet.addEventListener("click", (e) => {
  if (e.target === detailSheet) closeDetail(); // klick på mörk bakgrund stänger
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !detailSheet.hidden) closeDetail();
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function init() {
  renderFilterBar();

  try {
    state.places = await loadPlaces();
  } catch (e) {
    setStatus("Kunde inte ladda platser.", "is-error");
    return;
  }

  render();
  setActiveTab(loadActiveTab());
  requestLocation();

  setTimeout(() => map.invalidateSize(), 200);
}

init();
