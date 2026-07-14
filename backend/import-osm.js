const fs = require("fs");
const path = require("path");

const DEFAULT_OVERPASS_URLS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

const ACCOMMODATION = new Set([
  "hotel", "hostel", "guest_house", "motel", "camp_site", "caravan_site",
  "chalet", "apartment", "wilderness_hut",
]);
const FOOD = new Set([
  "restaurant", "cafe", "fast_food", "bar", "pub", "ice_cream",
  "food_court", "biergarten",
]);
const SHOPPING = new Set([
  "farm", "deli", "bakery", "convenience", "supermarket", "department_store",
  "mall", "cheese", "coffee", "tea", "alcohol", "beverages", "craft",
  "gift", "antiques", "art", "clothes", "books", "florist", "seafood",
  "greengrocer", "confectionery", "chocolate", "variety_store",
]);
const FAMILY_LEISURE = new Set([
  "playground", "water_park", "miniature_golf",
]);
const FAMILY_TOURISM = new Set(["zoo", "theme_park"]);
const ACTIVITIES = new Set([
  "sports_centre", "golf_course", "fitness_centre", "horse_riding", "marina",
  "swimming_pool", "stadium", "track", "water_park", "miniature_golf",
  "playground", "disc_golf_course", "bowling_alley", "escape_game",
]);
const NATURE = new Set([
  "peak", "cliff", "cave_entrance", "spring", "rock", "stone", "waterfall",
  "wetland", "wood", "heath",
]);
const SERVICES = new Set([
  "pharmacy", "hospital", "clinic", "fuel", "charging_station", "atm", "bank",
  "post_office", "car_rental", "bicycle_rental", "boat_rental", "ferry_terminal",
  "toilets", "drinking_water", "police",
]);

const CATEGORY_ORDER = [
  "strand", "boende", "mat", "shopping", "familj", "aktivitet",
  "smultronstallen", "natur", "sevardhet", "service",
];
const GOTLAND_BBOX = "56.85,17.80,58.45,19.55";

const OVERPASS_SELECTORS = [
  '["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|food_court|biergarten)$"]["name"]',
  '["tourism"~"^(museum|gallery|attraction|artwork)$"]["name"]',
  '["historic"]["name"]',
  '["amenity"="place_of_worship"]["name"]',
  '["natural"="beach"]["name"]',
  '["leisure"~"^(beach_resort|bathing_place)$"]["name"]',
  '["tourism"~"^(hotel|hostel|guest_house|motel|camp_site|caravan_site|chalet|apartment|wilderness_hut)$"]["name"]',
  '["leisure"~"^(sports_centre|golf_course|fitness_centre|horse_riding|marina|swimming_pool|stadium|track|water_park|miniature_golf|playground|disc_golf_course|bowling_alley|escape_game|nature_reserve|picnic_site)$"]["name"]',
  '["sport"]["name"]',
  '["natural"~"^(peak|cliff|cave_entrance|spring|rock|stone|waterfall|wetland|wood|heath)$"]["name"]',
  '["boundary"="protected_area"]["name"]',
  '["tourism"="viewpoint"]["name"]',
  '["shop"~"^(farm|deli|bakery|convenience|supermarket|department_store|mall|cheese|coffee|tea|alcohol|beverages|craft|gift|antiques|art|clothes|books|florist|seafood|greengrocer|confectionery|chocolate|variety_store)$"]["name"]',
  '["tourism"~"^(zoo|theme_park)$"]["name"]',
  '["tourism"="information"]["name"]',
  '["amenity"~"^(pharmacy|hospital|clinic|fuel|charging_station|atm|bank|post_office|car_rental|bicycle_rental|boat_rental|ferry_terminal|toilets|drinking_water|police)$"]["name"]',
];

const DESCRIPTION_LABELS = {
  "amenity:restaurant": "Restaurang",
  "amenity:cafe": "Café",
  "amenity:fast_food": "Snabbmat",
  "amenity:bar": "Bar",
  "amenity:pub": "Pub",
  "amenity:ice_cream": "Glass",
  "amenity:place_of_worship": "Kyrka och besöksmål",
  "tourism:hotel": "Hotell",
  "tourism:hostel": "Vandrarhem",
  "tourism:guest_house": "Pensionat och gästboende",
  "tourism:motel": "Motell",
  "tourism:camp_site": "Camping",
  "tourism:caravan_site": "Ställplats och husvagnscamping",
  "tourism:chalet": "Stuga",
  "tourism:apartment": "Semesterboende",
  "tourism:museum": "Museum",
  "tourism:gallery": "Galleri",
  "tourism:attraction": "Besöksmål",
  "tourism:viewpoint": "Utsiktsplats",
  "tourism:information": "Turistinformation",
  "tourism:zoo": "Djurpark",
  "tourism:theme_park": "Temapark",
  "natural:beach": "Badstrand",
  "leisure:beach_resort": "Badplats",
  "leisure:bathing_place": "Badplats",
  "leisure:playground": "Lekplats",
  "leisure:nature_reserve": "Naturreservat",
  "leisure:picnic_site": "Rast- och picknickplats",
  "leisure:golf_course": "Golfbana",
  "leisure:sports_centre": "Idrottsanläggning",
  "leisure:fitness_centre": "Träningsanläggning",
  "leisure:marina": "Småbåtshamn",
  "leisure:miniature_golf": "Minigolf",
  "leisure:water_park": "Vattenpark",
  "boundary:protected_area": "Skyddat naturområde",
  "amenity:pharmacy": "Apotek",
  "amenity:hospital": "Sjukhus",
  "amenity:clinic": "Vårdcentral",
  "amenity:fuel": "Bensinstation",
  "amenity:charging_station": "Laddstation",
  "amenity:post_office": "Postombud",
  "amenity:ferry_terminal": "Färjeterminal",
};

function buildOverpassQuery(selected = OVERPASS_SELECTORS) {
  const selectors = selected
    .map((selector) => `  nwr(${GOTLAND_BBOX})${selector};`)
    .join("\n");
  return `[out:json][timeout:90];\n(\n${selectors}\n);\nout center tags;`;
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "plats";
}

function has(tags, key, values) {
  return values.has(tags[key]);
}

function categoriesFor(tags) {
  const matches = new Set();

  if (tags.natural === "beach" || ["beach_resort", "bathing_place"].includes(tags.leisure)) {
    matches.add("strand");
  }
  if (has(tags, "tourism", ACCOMMODATION)) matches.add("boende");
  if (has(tags, "amenity", FOOD)) matches.add("mat");
  if (has(tags, "shop", SHOPPING)) matches.add("shopping");

  if (has(tags, "leisure", FAMILY_LEISURE) || has(tags, "tourism", FAMILY_TOURISM)) {
    matches.add("familj");
  }
  if (has(tags, "leisure", ACTIVITIES) || tags.sport
    || ["bicycle_rental", "boat_rental"].includes(tags.amenity)) {
    matches.add("aktivitet");
  }
  if (tags.tourism === "viewpoint" || tags.leisure === "picnic_site") {
    matches.add("smultronstallen");
  }
  if (has(tags, "natural", NATURE) || tags.leisure === "nature_reserve"
    || tags.boundary === "protected_area" || tags.tourism === "viewpoint"
    || tags.leisure === "picnic_site") {
    matches.add("natur");
  }
  if (has(tags, "amenity", SERVICES)
    || (tags.tourism === "information" && tags.information === "office")) {
    matches.add("service");
  }
  if (["museum", "gallery", "attraction", "artwork"].includes(tags.tourism)
    || tags.historic || tags.amenity === "place_of_worship") {
    matches.add("sevardhet");
  }

  return CATEGORY_ORDER.filter((category) => matches.has(category));
}

function describe(tags, primaryCategory) {
  for (const key of ["amenity", "tourism", "leisure", "natural", "boundary"]) {
    const label = DESCRIPTION_LABELS[`${key}:${tags[key]}`];
    if (label) return label;
  }
  if (tags.historic) return "Historisk plats";
  if (tags.shop === "farm") return "Gårdsbutik";
  if (tags.shop) return "Butik";
  if (tags.sport) return "Aktivitet och idrott";
  return {
    strand: "Badplats",
    boende: "Boende",
    mat: "Mat och dryck",
    shopping: "Butik",
    familj: "Familjeaktivitet",
    aktivitet: "Aktivitet",
    smultronstallen: "Utflyktsmål",
    natur: "Naturupplevelse",
    service: "Service",
    sevardhet: "Sevärdhet",
  }[primaryCategory];
}

function uniqueValues(...values) {
  return [...new Set(values.flatMap((value) => String(value || "").split(";"))
    .map((value) => value.trim()).filter(Boolean))];
}

function addressFor(tags) {
  const street = [tags["addr:street"], tags["addr:housenumber"]].filter(Boolean).join(" ");
  const address = {
    street: street || null,
    postalCode: tags["addr:postcode"] || null,
    locality: tags["addr:city"] || tags["addr:place"] || null,
    municipality: tags["addr:municipality"] || null,
  };
  return Object.values(address).some(Boolean) ? address : undefined;
}

function osmTypePrefix(type) {
  return { node: "n", way: "w", relation: "r" }[type] || type[0];
}

function transformElement(element, verifiedAt = new Date().toISOString().slice(0, 10)) {
  const tags = element.tags || {};
  const categories = categoriesFor(tags);
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!tags.name || !categories.length || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;

  const prefix = osmTypePrefix(element.type);
  const id = `${slugify(tags.name)}-${prefix}${element.id}`;
  const websiteValues = uniqueValues(tags.website, tags["contact:website"]);
  const phoneValues = uniqueValues(tags.phone, tags["contact:phone"]);
  const emailValues = uniqueValues(tags.email, tags["contact:email"]);
  const sourceUrl = `https://www.openstreetmap.org/${element.type}/${element.id}`;

  return {
    id,
    name: tags.name,
    category: categories[0],
    categories,
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
    description: describe(tags, categories[0]),
    ...(addressFor(tags) ? { address: addressFor(tags) } : {}),
    ...(tags.wheelchair ? { accessibility: tags.wheelchair } : {}),
    ...(websiteValues.length || phoneValues.length || emailValues.length ? {
      contacts: {
        websites: websiteValues.map((value) => ({ value })),
        phones: phoneValues.map((value) => ({ value })),
        emails: emailValues.map((value) => ({ value })),
      },
    } : {}),
    ...(tags.opening_hours ? { openingHours: { raw: tags.opening_hours } } : {}),
    source: { sourceUrl, externalId: id, lastVerifiedAt: verifiedAt },
  };
}

function transformElements(elements, verifiedAt) {
  const places = new Map();
  for (const element of elements) {
    const place = transformElement(element, verifiedAt);
    if (place) places.set(`${element.type}/${element.id}`, place);
  }
  return dedupePlaces([...places.values()])
    .sort((a, b) => a.name.localeCompare(b.name, "sv"));
}

function normalizedName(value) {
  return slugify(value).replace(/-/g, "");
}

function distanceKm(a, b) {
  const meanLat = ((a.lat + b.lat) / 2) * Math.PI / 180;
  const latKm = (a.lat - b.lat) * 111.32;
  const lngKm = (a.lng - b.lng) * 111.32 * Math.cos(meanLat);
  return Math.hypot(latKm, lngKm);
}

function richness(place) {
  return (place.address ? 5 : 0)
    + (place.contacts?.websites?.length || 0) * 3
    + (place.contacts?.phones?.length || 0) * 2
    + (place.contacts?.emails?.length || 0) * 2
    + (place.openingHours?.raw ? 2 : 0)
    + (place.accessibility ? 1 : 0)
    + (place.categories?.length || 0);
}

function mergeContactLists(primary = {}, secondary = {}) {
  const contacts = {};
  for (const type of ["websites", "phones", "emails"]) {
    const values = [...(primary[type] || []), ...(secondary[type] || [])];
    const unique = new Map(values.filter((item) => item?.value).map((item) => [item.value, item]));
    contacts[type] = [...unique.values()];
  }
  return Object.values(contacts).some((items) => items.length) ? contacts : undefined;
}

function mergeNearbyPlaces(a, b) {
  const [primary, secondary] = richness(a) >= richness(b) ? [a, b] : [b, a];
  const categories = CATEGORY_ORDER.filter((category) => (
    primary.categories.includes(category) || secondary.categories.includes(category)
  ));
  return {
    ...primary,
    category: categories[0],
    categories,
    address: primary.address || secondary.address,
    accessibility: primary.accessibility || secondary.accessibility,
    contacts: mergeContactLists(primary.contacts, secondary.contacts),
    openingHours: primary.openingHours || secondary.openingHours,
  };
}

function dedupePlaces(places, thresholdKm = 0.25) {
  const groups = new Map();
  for (const place of places) {
    const key = normalizedName(place.name);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(place);
  }

  const result = [];
  for (const group of groups.values()) {
    const merged = [];
    for (const place of group) {
      const matchIndex = merged.findIndex((candidate) => distanceKm(candidate, place) <= thresholdKm);
      if (matchIndex < 0) merged.push(place);
      else merged[matchIndex] = mergeNearbyPlaces(merged[matchIndex], place);
    }
    result.push(...merged);
  }
  return result;
}

function categoryCounts(places) {
  return Object.fromEntries(CATEGORY_ORDER.map((category) => [
    category,
    places.filter((place) => place.categories.includes(category)).length,
  ]));
}

function chunks(values, size) {
  return Array.from({ length: Math.ceil(values.length / size) }, (_, index) => (
    values.slice(index * size, (index + 1) * size)
  ));
}

async function fetchOsmElements(urls = DEFAULT_OVERPASS_URLS) {
  const batches = chunks(OVERPASS_SELECTORS, 4);
  const elements = [];

  for (const [batchIndex, selectors] of batches.entries()) {
    const query = buildOverpassQuery(selectors);
    let lastError;
    let payload;

    for (const url of urls) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "content-type": "application/x-www-form-urlencoded;charset=UTF-8",
            "user-agent": "Gotlandsguiden/1.0 (https://gotland.tobtech.se)",
          },
          body: new URLSearchParams({ data: query }),
          signal: AbortSignal.timeout(105_000),
        });
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        payload = await response.json();
        if (!Array.isArray(payload.elements)) throw new Error("Overpass-svaret saknar elements");
        break;
      } catch (error) {
        lastError = new Error(`Overpass ${url}: ${error.message}`);
      }
    }
    if (!payload) throw lastError;
    elements.push(...payload.elements);
    console.log(`Databatch ${batchIndex + 1}/${batches.length}: ${payload.elements.length} OSM-objekt`);
  }

  return elements;
}

function writeSnapshots(places) {
  const backendPath = path.join(__dirname, "seed-data.json");
  const frontendPath = path.join(__dirname, "..", "public", "js", "places-data.js");
  fs.writeFileSync(backendPath, `${JSON.stringify(places, null, 2)}\n`);

  if (!fs.existsSync(frontendPath)) {
    console.warn("Frontend-snapshoten finns inte i denna miljö; endast seed-data.json uppdaterades.");
    return;
  }
  const existingFrontend = fs.readFileSync(frontendPath, "utf8");
  const corePlaces = places.map(({ id, name, category, lat, lng, description }) => ({
    id, name, category, lat, lng, description,
  }));
  fs.writeFileSync(frontendPath, renderFrontendSnapshot(existingFrontend, corePlaces));
}

function renderFrontendSnapshot(existingFrontend, corePlaces) {
  const marker = "const MOCK_PLACES = ";
  const suffixMarker = "\n/**\n * Hämtar platser.";
  const markerIndex = existingFrontend.indexOf(marker);
  const suffixIndex = existingFrontend.indexOf(suffixMarker, markerIndex);
  if (markerIndex < 0 || suffixIndex < 0) {
    throw new Error("Kunde inte avgränsa MOCK_PLACES i frontend-snapshoten");
  }
  return `${existingFrontend.slice(0, markerIndex)}${marker}${JSON.stringify(corePlaces, null, 2)};${existingFrontend.slice(suffixIndex)}`;
}

async function main() {
  const urls = process.env.OVERPASS_URL
    ? [process.env.OVERPASS_URL]
    : DEFAULT_OVERPASS_URLS;
  console.log("Hämtar namngivna Gotlandsplatser från OpenStreetMap …");
  const elements = await fetchOsmElements(urls);
  const places = transformElements(elements);
  const counts = categoryCounts(places);
  const empty = Object.entries(counts).filter(([, count]) => count === 0);
  if (empty.length) throw new Error(`Tomma kategorier: ${empty.map(([name]) => name).join(", ")}`);
  writeSnapshots(places);
  console.log(`Skrev ${places.length} platser.`);
  console.table(counts);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}

module.exports = {
  CATEGORY_ORDER,
  buildOverpassQuery,
  categoriesFor,
  categoryCounts,
  dedupePlaces,
  renderFrontendSnapshot,
  describe,
  slugify,
  transformElement,
  transformElements,
  writeSnapshots,
};
