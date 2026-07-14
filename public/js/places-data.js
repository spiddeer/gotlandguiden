/* ==========================================================================
   Gotlandsguiden – platsdata
   --------------------------------------------------------------------------
   PLATSERNA NEDAN ÄR HÄMTADE FRÅN OpenStreetMap (Overpass API) för Gotland.
   © OpenStreetMap-bidragsgivare (ODbL). Data hämtad 2026-07-14.

   loadPlaces() använder API:t som primär källa och faller tillbaka på den
   inbyggda snapshoten när frontend körs fristående.

   Datamodell per plats:
     { id, name, category, lat, lng, description }
   ========================================================================== */

// Kategorier med etikett och färg (används för filter och markörer).
const CATEGORIES = {
  strand:     { label: "Stränder",    color: "#3f9bc0", emoji: "\uD83C\uDFD6\uFE0F" },
  sevardhet:  { label: "Sevärdheter", color: "#e0a458", emoji: "\uD83C\uDFDB\uFE0F" },
  mat:        { label: "Mat & dryck", color: "#c0603f", emoji: "\uD83C\uDF7D\uFE0F" },
  smultronstallen: { label: "Smultronställen", color: "#60a074", emoji: "\uD83C\uDF3F" },
  boende:     { label: "Boende", color: "#7667a8", emoji: "\uD83D\uDECF\uFE0F" },
  aktivitet:  { label: "Aktiviteter", color: "#d1764f", emoji: "\uD83D\uDEB2" },
  natur:      { label: "Natur & friluftsliv", color: "#4f8661", emoji: "\uD83C\uDF32" },
  shopping:   { label: "Butiker & gårdsbutiker", color: "#aa6c84", emoji: "\uD83D\uDECD\uFE0F" },
  familj:     { label: "För familjen", color: "#bd7f2f", emoji: "\uD83E\uDDF8" },
  service:    { label: "Service", color: "#607d8b", emoji: "\u2139\uFE0F" },
};

// Genererad från OpenStreetMap. Redigera fritt eller ersätt via API.
const MOCK_PLACES = [
  {
    "id": "50-kvadrat-n315871488",
    "name": "50 kvadrat",
    "category": "mat",
    "lat": 57.638696,
    "lng": 18.293112,
    "description": "Restaurang"
  },
  {
    "id": "a-k-wiberg-n12892419542",
    "name": "A-K Wiberg",
    "category": "shopping",
    "lat": 57.640324,
    "lng": 18.294663,
    "description": "Butik"
  },
  {
    "id": "a7-w33359632",
    "name": "A7",
    "category": "aktivitet",
    "lat": 57.631424,
    "lng": 18.301217,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "a7-rampen-n12175260888",
    "name": "A7-rampen",
    "category": "aktivitet",
    "lat": 57.630858,
    "lng": 18.302862,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "adekarr-w482269652",
    "name": "Adekärr",
    "category": "natur",
    "lat": 57.890665,
    "lng": 19.154914,
    "description": "Naturupplevelse"
  },
  {
    "id": "adelita-n13059901192",
    "name": "Adelita",
    "category": "mat",
    "lat": 57.638047,
    "lng": 18.295285,
    "description": "Bar"
  },
  {
    "id": "aftonvat-w379563623",
    "name": "Aftonvät",
    "category": "natur",
    "lat": 57.7699,
    "lng": 18.860488,
    "description": "Naturupplevelse"
  },
  {
    "id": "akebacks-kyrka-w1191878794",
    "name": "Akebäcks kyrka",
    "category": "sevardhet",
    "lat": 57.547432,
    "lng": 18.392408,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ala-kyrka-w1191878789",
    "name": "Ala kyrka",
    "category": "sevardhet",
    "lat": 57.41903,
    "lng": 18.635165,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "albatrossmonumentet-n7292507079",
    "name": "Albatrossmonumentet",
    "category": "sevardhet",
    "lat": 57.421778,
    "lng": 18.859003,
    "description": "Historisk plats"
  },
  {
    "id": "ali-s-kiosk-grill-n12909510711",
    "name": "Ali's Kiosk & Grill",
    "category": "mat",
    "lat": 57.638122,
    "lng": 18.298979,
    "description": "Snabbmat"
  },
  {
    "id": "allkvie-ange-naturreservat-w102775849",
    "name": "Allkvie änge naturreservat",
    "category": "natur",
    "lat": 57.610898,
    "lng": 18.430135,
    "description": "Naturreservat"
  },
  {
    "id": "alma-s-n12897016626",
    "name": "Alma's",
    "category": "mat",
    "lat": 57.641147,
    "lng": 18.290291,
    "description": "Restaurang"
  },
  {
    "id": "alningshajdmyr-w379613227",
    "name": "Alningshajdmyr",
    "category": "natur",
    "lat": 57.917121,
    "lng": 18.861411,
    "description": "Naturupplevelse"
  },
  {
    "id": "alskogs-kyrka-w1191878786",
    "name": "Alskogs kyrka",
    "category": "sevardhet",
    "lat": 57.331479,
    "lng": 18.627346,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "alstade-skogs-naturreservat-w102776169",
    "name": "Alstäde skogs naturreservat",
    "category": "natur",
    "lat": 57.335068,
    "lng": 18.279424,
    "description": "Naturreservat"
  },
  {
    "id": "alva-cng-n10814897162",
    "name": "Alva CNG",
    "category": "service",
    "lat": 57.207593,
    "lng": 18.352504,
    "description": "Bensinstation"
  },
  {
    "id": "alva-kyrka-w1191887713",
    "name": "Alva kyrka",
    "category": "sevardhet",
    "lat": 57.207506,
    "lng": 18.361388,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "alva-stugby-n4347934090",
    "name": "Alva Stugby",
    "category": "boende",
    "lat": 57.183327,
    "lng": 18.335814,
    "description": "Stuga"
  },
  {
    "id": "alvena-lindarang-w102775339",
    "name": "Alvena lindaräng",
    "category": "natur",
    "lat": 57.609862,
    "lng": 18.646899,
    "description": "Naturreservat"
  },
  {
    "id": "alvret-r7085225",
    "name": "Alvret",
    "category": "natur",
    "lat": 56.929099,
    "lng": 18.210831,
    "description": "Naturupplevelse"
  },
  {
    "id": "alyhrs-skeppssattning-w986649175",
    "name": "Alyhrs skeppssättning",
    "category": "sevardhet",
    "lat": 57.507357,
    "lng": 18.125773,
    "description": "Historisk plats"
  },
  {
    "id": "amarillo-mat-n2973071646",
    "name": "Amarillo Mat",
    "category": "mat",
    "lat": 57.63971,
    "lng": 18.295843,
    "description": "Restaurang"
  },
  {
    "id": "amici-belli-n317437554",
    "name": "Amici Belli",
    "category": "mat",
    "lat": 57.639686,
    "lng": 18.292101,
    "description": "Restaurang"
  },
  {
    "id": "anga-31-2-n6373614409",
    "name": "Anga 31:2",
    "category": "sevardhet",
    "lat": 57.477752,
    "lng": 18.706171,
    "description": "Historisk plats"
  },
  {
    "id": "anga-kyrka-w379456758",
    "name": "Anga kyrka",
    "category": "sevardhet",
    "lat": 57.480405,
    "lng": 18.706405,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "antikvariat-drotten-n8986047331",
    "name": "Antikvariat Drotten",
    "category": "shopping",
    "lat": 57.640454,
    "lng": 18.294504,
    "description": "Butik"
  },
  {
    "id": "antikvariat-perssonligt-n11080887052",
    "name": "Antikvariat Perssonligt",
    "category": "shopping",
    "lat": 57.237152,
    "lng": 18.374366,
    "description": "Butik"
  },
  {
    "id": "apisaras-thaimat-n318353046",
    "name": "Apisaras thaimat",
    "category": "mat",
    "lat": 57.645907,
    "lng": 18.3191,
    "description": "Restaurang"
  },
  {
    "id": "apotek-hjartat-n12907584777",
    "name": "Apotek Hjärtat",
    "category": "service",
    "lat": 57.623572,
    "lng": 18.322962,
    "description": "Apotek"
  },
  {
    "id": "apoteket-n272661796",
    "name": "Apoteket",
    "category": "service",
    "lat": 57.238794,
    "lng": 18.371294,
    "description": "Apotek"
  },
  {
    "id": "apoteket-n444414776",
    "name": "Apoteket",
    "category": "service",
    "lat": 57.637744,
    "lng": 18.300747,
    "description": "Apotek"
  },
  {
    "id": "apoteket-n1480391826",
    "name": "Apoteket",
    "category": "service",
    "lat": 57.648089,
    "lng": 18.300521,
    "description": "Apotek"
  },
  {
    "id": "apoteket-n13888128005",
    "name": "Apoteket",
    "category": "service",
    "lat": 57.621861,
    "lng": 18.322582,
    "description": "Apotek"
  },
  {
    "id": "apoteksgruppen-n9982432314",
    "name": "Apoteksgruppen",
    "category": "service",
    "lat": 57.505343,
    "lng": 18.455209,
    "description": "Apotek"
  },
  {
    "id": "ardre-bildsten-viii-n6373542757",
    "name": "Ardre bildsten VIII",
    "category": "sevardhet",
    "lat": 57.377434,
    "lng": 18.697257,
    "description": "Sevärdhet"
  },
  {
    "id": "ardre-domarring-n6373523158",
    "name": "Ardre Domarring",
    "category": "sevardhet",
    "lat": 57.360226,
    "lng": 18.733518,
    "description": "Historisk plats"
  },
  {
    "id": "ardre-nakenstrand-n6685151788",
    "name": "Ardre nakenstrand",
    "category": "strand",
    "lat": 57.363584,
    "lng": 18.755923,
    "description": "Badplats"
  },
  {
    "id": "ardrebo-cafe-n10740046612",
    "name": "Ardrebo Café",
    "category": "service",
    "lat": 57.35937,
    "lng": 18.68505,
    "description": "Laddstation"
  },
  {
    "id": "aron-s-kaffebar-n639299814",
    "name": "Aron's Kaffebar",
    "category": "mat",
    "lat": 57.52078,
    "lng": 18.693354,
    "description": "Café"
  },
  {
    "id": "asunden-r7573483",
    "name": "Asunden",
    "category": "natur",
    "lat": 57.708439,
    "lng": 18.847917,
    "description": "Naturupplevelse"
  },
  {
    "id": "atlingbo-kyrka-w974049197",
    "name": "Atlingbo kyrka",
    "category": "sevardhet",
    "lat": 57.479945,
    "lng": 18.390786,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "auster-w530668045",
    "name": "Auster",
    "category": "natur",
    "lat": 57.461196,
    "lng": 18.687583,
    "description": "Naturupplevelse"
  },
  {
    "id": "austermyr-w550169183",
    "name": "Austermyr",
    "category": "natur",
    "lat": 57.195619,
    "lng": 18.203084,
    "description": "Naturupplevelse"
  },
  {
    "id": "austerange-w485224685",
    "name": "Austeränge",
    "category": "natur",
    "lat": 57.908764,
    "lng": 19.080949,
    "description": "Naturupplevelse"
  },
  {
    "id": "avis-n4978365554",
    "name": "Avis",
    "category": "service",
    "lat": 57.638867,
    "lng": 18.290771,
    "description": "Service"
  },
  {
    "id": "b-m-gard-w559809576",
    "name": "B&M Gård",
    "category": "familj",
    "lat": 57.796245,
    "lng": 18.498251,
    "description": "Djurpark"
  },
  {
    "id": "babyland-r14479325",
    "name": "Babyland",
    "category": "aktivitet",
    "lat": 57.608531,
    "lng": 18.243517,
    "description": "Aktivitet"
  },
  {
    "id": "bad-wolf-n5595023609",
    "name": "Bad Wolf",
    "category": "mat",
    "lat": 57.635581,
    "lng": 18.292401,
    "description": "Restaurang"
  },
  {
    "id": "badlagunen-r14479311",
    "name": "Badlagunen",
    "category": "aktivitet",
    "lat": 57.608561,
    "lng": 18.242791,
    "description": "Aktivitet"
  },
  {
    "id": "bagarns-n11080928116",
    "name": "Bagarns",
    "category": "mat",
    "lat": 57.238681,
    "lng": 18.375579,
    "description": "Café"
  },
  {
    "id": "bageriet-n6620794508",
    "name": "Bageriet",
    "category": "mat",
    "lat": 57.640924,
    "lng": 18.296055,
    "description": "Restaurang"
  },
  {
    "id": "baggamyr-r7367342",
    "name": "Baggamyr",
    "category": "natur",
    "lat": 57.971118,
    "lng": 19.19101,
    "description": "Naturupplevelse"
  },
  {
    "id": "baggatrask-r7348352",
    "name": "Baggaträsk",
    "category": "natur",
    "lat": 57.97331,
    "lng": 19.19245,
    "description": "Naturupplevelse"
  },
  {
    "id": "bagghagen-w493921030",
    "name": "Bagghagen",
    "category": "natur",
    "lat": 57.916113,
    "lng": 19.087199,
    "description": "Naturupplevelse"
  },
  {
    "id": "bakfickan-n413208650",
    "name": "Bakfickan",
    "category": "mat",
    "lat": 57.640639,
    "lng": 18.29517,
    "description": "Restaurang"
  },
  {
    "id": "bandelains-tappu-n1850647610",
    "name": "Bandeläins täppu",
    "category": "sevardhet",
    "lat": 57.293217,
    "lng": 18.630491,
    "description": "Historisk plats"
  },
  {
    "id": "bankvat-w533137615",
    "name": "Bankvät",
    "category": "natur",
    "lat": 57.110414,
    "lng": 18.411844,
    "description": "Naturupplevelse"
  },
  {
    "id": "bara-odekyrka-w548548167",
    "name": "Bara Ödekyrka",
    "category": "sevardhet",
    "lat": 57.584671,
    "lng": 18.611821,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "baren-n12385236001",
    "name": "Baren",
    "category": "mat",
    "lat": 57.637312,
    "lng": 18.294688,
    "description": "Pub"
  },
  {
    "id": "barlingbo-kyrka-w531663522",
    "name": "Barlingbo kyrka",
    "category": "sevardhet",
    "lat": 57.564492,
    "lng": 18.463129,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "barlast-badplats-n14006228916",
    "name": "Barläst badplats",
    "category": "strand",
    "lat": 57.856669,
    "lng": 19.064721,
    "description": "Badplats"
  },
  {
    "id": "baroque-n12892445119",
    "name": "Baroque",
    "category": "mat",
    "lat": 57.640732,
    "lng": 18.295285,
    "description": "Restaurang"
  },
  {
    "id": "barshalder-cairn-n6374238908",
    "name": "Barshalder Cairn",
    "category": "sevardhet",
    "lat": 57.102316,
    "lng": 18.321156,
    "description": "Historisk plats"
  },
  {
    "id": "barshalder-skeppssattning-n6374174464",
    "name": "Barshalder Skeppssättning",
    "category": "sevardhet",
    "lat": 57.102203,
    "lng": 18.321054,
    "description": "Historisk plats"
  },
  {
    "id": "bella-fenicia-pizzeria-och-salladbar-n11053360257",
    "name": "Bella Fenicia Pizzeria Och Salladbar",
    "category": "mat",
    "lat": 57.239488,
    "lng": 18.37608,
    "description": "Restaurang"
  },
  {
    "id": "bergbetningen-w102775304",
    "name": "Bergbetningen",
    "category": "natur",
    "lat": 57.663051,
    "lng": 18.325823,
    "description": "Naturreservat"
  },
  {
    "id": "bergmancenter-w494554006",
    "name": "Bergmancenter",
    "category": "sevardhet",
    "lat": 57.919114,
    "lng": 19.1389,
    "description": "Museum"
  },
  {
    "id": "best-western-solhem-w432546876",
    "name": "Best Western Solhem",
    "category": "boende",
    "lat": 57.634789,
    "lng": 18.286616,
    "description": "Hotell"
  },
  {
    "id": "best-western-strand-hotel-n366598391",
    "name": "Best Western Strand Hotel",
    "category": "boende",
    "lat": 57.641646,
    "lng": 18.29264,
    "description": "Hotell"
  },
  {
    "id": "bik-bok-n11691721474",
    "name": "Bik Bok",
    "category": "shopping",
    "lat": 57.637781,
    "lng": 18.299863,
    "description": "Butik"
  },
  {
    "id": "bil-o-bat-n10740026986",
    "name": "Bil o Båt",
    "category": "service",
    "lat": 57.03366,
    "lng": 18.25829,
    "description": "Laddstation"
  },
  {
    "id": "bildstenen-vid-stenbro-n6374182224",
    "name": "Bildstenen vid Stenbro",
    "category": "sevardhet",
    "lat": 57.232268,
    "lng": 18.211342,
    "description": "Historisk plats"
  },
  {
    "id": "bilmuseum-gotland-w463465364",
    "name": "Bilmuseum Gotland",
    "category": "sevardhet",
    "lat": 57.60761,
    "lng": 18.251553,
    "description": "Museum"
  },
  {
    "id": "bistra-haren-n4256200604",
    "name": "Bistra haren",
    "category": "mat",
    "lat": 57.643839,
    "lng": 18.298411,
    "description": "Restaurang"
  },
  {
    "id": "bistro-albatross-w496794609",
    "name": "Bistro Albatross",
    "category": "mat",
    "lat": 57.933582,
    "lng": 19.165126,
    "description": "Restaurang"
  },
  {
    "id": "bistro-borgen-n12909476464",
    "name": "Bistro Borgen",
    "category": "mat",
    "lat": 57.638448,
    "lng": 18.298009,
    "description": "Restaurang"
  },
  {
    "id": "bjars-hog-n6373633487",
    "name": "Bjärs Hög",
    "category": "sevardhet",
    "lat": 57.51785,
    "lng": 18.704267,
    "description": "Historisk plats"
  },
  {
    "id": "bjorke-kyrka-w1191878791",
    "name": "Björke kyrka",
    "category": "sevardhet",
    "lat": 57.507448,
    "lng": 18.421306,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "bjorkhaga-bad-n11942430069",
    "name": "Björkhaga Bad",
    "category": "strand",
    "lat": 57.404185,
    "lng": 18.169794,
    "description": "Badplats"
  },
  {
    "id": "bjorkhaga-by-n2358007157",
    "name": "Björkhaga By",
    "category": "boende",
    "lat": 57.405572,
    "lng": 18.178162,
    "description": "Camping"
  },
  {
    "id": "bjorkhaga-camping-n10743405410",
    "name": "Björkhaga Camping",
    "category": "boende",
    "lat": 57.404086,
    "lng": 18.171276,
    "description": "Camping"
  },
  {
    "id": "bjorkhaga-standby-restaurang-n10743405608",
    "name": "Björkhaga Standby & Restaurang",
    "category": "mat",
    "lat": 57.404047,
    "lng": 18.171146,
    "description": "Restaurang"
  },
  {
    "id": "bjorkhaga-strandby-n1313897393",
    "name": "Björkhaga strandby",
    "category": "boende",
    "lat": 57.404906,
    "lng": 18.171613,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "bjorkhags-strandby-n10740026984",
    "name": "Björkhags Strandby",
    "category": "service",
    "lat": 57.40516,
    "lng": 18.1737,
    "description": "Laddstation"
  },
  {
    "id": "bjorkume-naturreservat-w102775611",
    "name": "Björkume naturreservat",
    "category": "natur",
    "lat": 57.800593,
    "lng": 18.459395,
    "description": "Naturreservat"
  },
  {
    "id": "black-sheep-arms-n316826432",
    "name": "Black Sheep Arms",
    "category": "mat",
    "lat": 57.64203,
    "lng": 18.294938,
    "description": "Restaurang"
  },
  {
    "id": "blautmyr-w532068580",
    "name": "Blautmyr",
    "category": "natur",
    "lat": 57.905365,
    "lng": 18.896299,
    "description": "Naturupplevelse"
  },
  {
    "id": "blautmorskogen-w102775297",
    "name": "Blautmörskogen",
    "category": "natur",
    "lat": 57.631962,
    "lng": 18.718819,
    "description": "Naturreservat"
  },
  {
    "id": "bluttmo-gildarshagen-w102776084",
    "name": "Bluttmo-Gildarshagen",
    "category": "natur",
    "lat": 57.849598,
    "lng": 18.992019,
    "description": "Naturreservat"
  },
  {
    "id": "blackvatarna-w437565147",
    "name": "Bläckvätarna",
    "category": "natur",
    "lat": 57.653985,
    "lng": 18.699938,
    "description": "Naturupplevelse"
  },
  {
    "id": "blase-kalkbruk-stallplats-n6658465740",
    "name": "Bläse Kalkbruk Ställplats",
    "category": "boende",
    "lat": 57.894833,
    "lng": 18.839832,
    "description": "Ställplats och husvagnscamping"
  },
  {
    "id": "blase-kalkbruksmuseum-w1068987684",
    "name": "Bläse kalkbruksmuseum",
    "category": "sevardhet",
    "lat": 57.894285,
    "lng": 18.83992,
    "description": "Museum"
  },
  {
    "id": "blase-museum-stentaget-w708582509",
    "name": "Bläse Museum Stentåget",
    "category": "sevardhet",
    "lat": 57.897629,
    "lng": 18.848136,
    "description": "Historisk plats"
  },
  {
    "id": "blase-museum-stentaget-w1087458417",
    "name": "Bläse Museum Stentåget",
    "category": "sevardhet",
    "lat": 57.90042,
    "lng": 18.854329,
    "description": "Historisk plats"
  },
  {
    "id": "blase-museum-stentaget-w1108370699",
    "name": "Bläse Museum Stentåget",
    "category": "sevardhet",
    "lat": 57.902566,
    "lng": 18.857456,
    "description": "Historisk plats"
  },
  {
    "id": "boge-33-1-n6373747906",
    "name": "Boge 33:1",
    "category": "sevardhet",
    "lat": 57.628436,
    "lng": 18.734528,
    "description": "Historisk plats"
  },
  {
    "id": "boge-4-1-n6373747978",
    "name": "Boge 4:1",
    "category": "sevardhet",
    "lat": 57.702441,
    "lng": 18.757959,
    "description": "Historisk plats"
  },
  {
    "id": "boge-kyrka-w379069464",
    "name": "Boge kyrka",
    "category": "sevardhet",
    "lat": 57.687043,
    "lng": 18.762865,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "bogeklintens-raukar-n1844666556",
    "name": "Bogeklintens raukar",
    "category": "natur",
    "lat": 57.671531,
    "lng": 18.773678,
    "description": "Besöksmål"
  },
  {
    "id": "bojsvatar-r14933934",
    "name": "Bojsvätar",
    "category": "natur",
    "lat": 57.683507,
    "lng": 18.728164,
    "description": "Naturupplevelse"
  },
  {
    "id": "bojsvatar-sodra-naturreservat-r12201829",
    "name": "Bojsvätar södra naturreservat",
    "category": "natur",
    "lat": 57.681402,
    "lng": 18.72673,
    "description": "Naturreservat"
  },
  {
    "id": "bojsvatars-naturreservat-r7611523",
    "name": "Bojsvätars naturreservat",
    "category": "natur",
    "lat": 57.687526,
    "lng": 18.721858,
    "description": "Naturreservat"
  },
  {
    "id": "bok-cafeet-porten-n12909501920",
    "name": "Bok Caféet Porten",
    "category": "mat",
    "lat": 57.638683,
    "lng": 18.298503,
    "description": "Café"
  },
  {
    "id": "bokhandeln-wessman-pettersson-n766160692",
    "name": "Bokhandeln Wessman & Pettersson",
    "category": "shopping",
    "lat": 57.635859,
    "lng": 18.292776,
    "description": "Butik"
  },
  {
    "id": "bolaget-n315871852",
    "name": "Bolaget",
    "category": "mat",
    "lat": 57.640658,
    "lng": 18.296726,
    "description": "Restaurang"
  },
  {
    "id": "borgvik-w1310423631",
    "name": "Borgvik",
    "category": "boende",
    "lat": 57.434427,
    "lng": 18.852876,
    "description": "Stuga"
  },
  {
    "id": "bosarve-lovskogs-naturreservat-w102775826",
    "name": "Bosarve lövskogs naturreservat",
    "category": "natur",
    "lat": 57.256732,
    "lng": 18.235657,
    "description": "Naturreservat"
  },
  {
    "id": "bosarve-naturskogs-naturreservat-w528208512",
    "name": "Bosarve naturskogs naturreservat",
    "category": "natur",
    "lat": 57.303185,
    "lng": 18.552756,
    "description": "Naturreservat"
  },
  {
    "id": "boston-diner-w1087504450",
    "name": "Boston Diner",
    "category": "mat",
    "lat": 57.609802,
    "lng": 18.244248,
    "description": "Snabbmat"
  },
  {
    "id": "botes-kallmyr-r1459268",
    "name": "Botes källmyr",
    "category": "natur",
    "lat": 57.34492,
    "lng": 18.321465,
    "description": "Naturreservat"
  },
  {
    "id": "bottarve-museigard-n6620946755",
    "name": "Bottarve Museigård",
    "category": "sevardhet",
    "lat": 56.992139,
    "lng": 18.24659,
    "description": "Museum"
  },
  {
    "id": "botvaldavik-n2093538687",
    "name": "Botvaldavik",
    "category": "aktivitet",
    "lat": 57.585385,
    "lng": 18.803859,
    "description": "Småbåtshamn"
  },
  {
    "id": "botvaldetrask-w378696982",
    "name": "Botvaldeträsk",
    "category": "natur",
    "lat": 57.596115,
    "lng": 18.794714,
    "description": "Naturupplevelse"
  },
  {
    "id": "boules-court-n13962187850",
    "name": "Boules court",
    "category": "aktivitet",
    "lat": 57.767157,
    "lng": 18.42147,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "bovikariv-r7100659",
    "name": "Bovikariv",
    "category": "natur",
    "lat": 57.854084,
    "lng": 19.124974,
    "description": "Naturupplevelse"
  },
  {
    "id": "boviken-hide-hamn-n9196547078",
    "name": "Boviken Hide Hamn",
    "category": "aktivitet",
    "lat": 57.732055,
    "lng": 18.87302,
    "description": "Småbåtshamn"
  },
  {
    "id": "braidfloar-gravfalt-w680732876",
    "name": "Braidfloar Gravfält",
    "category": "sevardhet",
    "lat": 57.268122,
    "lng": 18.238624,
    "description": "Historisk plats"
  },
  {
    "id": "brajdgatskogens-naturreservat-w1339888665",
    "name": "Brajdgatskogens naturreservat",
    "category": "natur",
    "lat": 57.635431,
    "lng": 18.668756,
    "description": "Naturreservat"
  },
  {
    "id": "brasseri-lickershamn-n454148702",
    "name": "Brasseri Lickershamn",
    "category": "mat",
    "lat": 57.82527,
    "lng": 18.514366,
    "description": "Restaurang"
  },
  {
    "id": "bravida-visby-n10740046614",
    "name": "Bravida Visby",
    "category": "service",
    "lat": 57.64396,
    "lng": 18.32622,
    "description": "Laddstation"
  },
  {
    "id": "bro-kyrka-w546818438",
    "name": "Bro kyrka",
    "category": "sevardhet",
    "lat": 57.67005,
    "lng": 18.474844,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "bro-stajnkalm-w706199757",
    "name": "Bro Stajnkalm",
    "category": "sevardhet",
    "lat": 57.662172,
    "lng": 18.443787,
    "description": "Historisk plats"
  },
  {
    "id": "brohagvat-w532140205",
    "name": "Brohagvät",
    "category": "natur",
    "lat": 57.97022,
    "lng": 19.215115,
    "description": "Naturupplevelse"
  },
  {
    "id": "broman-son-n13068058213",
    "name": "Broman & Son",
    "category": "mat",
    "lat": 57.505789,
    "lng": 18.112704,
    "description": "Restaurang"
  },
  {
    "id": "brucebo-r6911432",
    "name": "Brucebo",
    "category": "natur",
    "lat": 57.685993,
    "lng": 18.348344,
    "description": "Naturreservat"
  },
  {
    "id": "brucebogrottan-n4345147067",
    "name": "Brucebogrottan",
    "category": "natur",
    "lat": 57.68635,
    "lng": 18.352437,
    "description": "Naturupplevelse"
  },
  {
    "id": "bruket-n454154932",
    "name": "Bruket",
    "category": "mat",
    "lat": 57.738137,
    "lng": 18.404902,
    "description": "Café"
  },
  {
    "id": "bruna-dorren-n559420073",
    "name": "Bruna Dörren",
    "category": "mat",
    "lat": 57.330318,
    "lng": 18.710258,
    "description": "Snabbmat"
  },
  {
    "id": "bruten-w528208450",
    "name": "Bruten",
    "category": "natur",
    "lat": 57.747046,
    "lng": 18.795069,
    "description": "Naturreservat"
  },
  {
    "id": "brutmyr-w532076138",
    "name": "Brutmyr",
    "category": "natur",
    "lat": 57.842204,
    "lng": 18.975856,
    "description": "Naturupplevelse"
  },
  {
    "id": "bryggeriet-mat-malt-n11891776071",
    "name": "Bryggeriet Mat & Malt",
    "category": "mat",
    "lat": 57.633152,
    "lng": 18.299718,
    "description": "Restaurang"
  },
  {
    "id": "brantings-r7611529",
    "name": "Bräntings",
    "category": "natur",
    "lat": 57.83567,
    "lng": 18.974107,
    "description": "Naturreservat"
  },
  {
    "id": "brantings-haid-w528208490",
    "name": "Bräntings haid",
    "category": "natur",
    "lat": 57.851718,
    "lng": 18.959716,
    "description": "Naturreservat"
  },
  {
    "id": "brodboden-n766160688",
    "name": "Brödboden",
    "category": "mat",
    "lat": 57.634991,
    "lng": 18.292137,
    "description": "Café"
  },
  {
    "id": "brodboden-n11700876173",
    "name": "Brödboden",
    "category": "shopping",
    "lat": 57.587465,
    "lng": 18.268363,
    "description": "Butik"
  },
  {
    "id": "brodernas-n11091668944",
    "name": "Brödernas",
    "category": "mat",
    "lat": 57.639883,
    "lng": 18.292363,
    "description": "Restaurang"
  },
  {
    "id": "bubbelpoolen-w1087514340",
    "name": "Bubbelpoolen",
    "category": "aktivitet",
    "lat": 57.609028,
    "lng": 18.244524,
    "description": "Aktivitet"
  },
  {
    "id": "bulverket-w378884344",
    "name": "Bulverket",
    "category": "sevardhet",
    "lat": 57.727749,
    "lng": 18.628488,
    "description": "Historisk plats"
  },
  {
    "id": "bunge-aviation-museum-n1782364606",
    "name": "Bunge Aviation Museum",
    "category": "sevardhet",
    "lat": 57.852206,
    "lng": 19.031755,
    "description": "Museum"
  },
  {
    "id": "bunge-kyrka-w432591635",
    "name": "Bunge kyrka",
    "category": "sevardhet",
    "lat": 57.853697,
    "lng": 19.023591,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "bunge-kyrka-toalett-n8900585380",
    "name": "Bunge Kyrka Toalett",
    "category": "service",
    "lat": 57.687294,
    "lng": 18.763734,
    "description": "Service"
  },
  {
    "id": "bungemuseet-n687936955",
    "name": "Bungemuseet",
    "category": "sevardhet",
    "lat": 57.853892,
    "lng": 19.028642,
    "description": "Museum"
  },
  {
    "id": "bungenas-matsal-n6651668114",
    "name": "Bungenäs matsal",
    "category": "mat",
    "lat": 57.823422,
    "lng": 19.079666,
    "description": "Restaurang"
  },
  {
    "id": "bungenas-naturreservat-r17763785",
    "name": "Bungenäs naturreservat",
    "category": "natur",
    "lat": 57.834988,
    "lng": 19.08688,
    "description": "Naturreservat"
  },
  {
    "id": "bungeviken-w292513912",
    "name": "Bungeviken",
    "category": "strand",
    "lat": 57.835471,
    "lng": 19.0674,
    "description": "Badplats"
  },
  {
    "id": "burggathagens-naturreservat-w897784133",
    "name": "Burggathagens naturreservat",
    "category": "natur",
    "lat": 57.64234,
    "lng": 18.6564,
    "description": "Naturreservat"
  },
  {
    "id": "burgsvik-n2083024628",
    "name": "Burgsvik",
    "category": "aktivitet",
    "lat": 57.034569,
    "lng": 18.259041,
    "description": "Småbåtshamn"
  },
  {
    "id": "burgsvikens-havspool-n11039325018",
    "name": "Burgsvikens Havspool",
    "category": "strand",
    "lat": 57.093605,
    "lng": 18.298153,
    "description": "Badplats"
  },
  {
    "id": "burgsviks-camping-w1083462558",
    "name": "Burgsviks Camping",
    "category": "boende",
    "lat": 57.03193,
    "lng": 18.255914,
    "description": "Camping"
  },
  {
    "id": "burgsviks-krog-n1369232280",
    "name": "Burgsviks krog",
    "category": "mat",
    "lat": 57.030616,
    "lng": 18.274665,
    "description": "Restaurang"
  },
  {
    "id": "burgsviks-rogeri-w1075537134",
    "name": "Burgsviks Rögeri",
    "category": "shopping",
    "lat": 57.031469,
    "lng": 18.284818,
    "description": "Butik"
  },
  {
    "id": "burs-65-1-ringcross-n6373566315",
    "name": "Burs 65:1 Ringcross",
    "category": "sevardhet",
    "lat": 57.24312,
    "lng": 18.51518,
    "description": "Historisk plats"
  },
  {
    "id": "burs-kyrka-w1191887709",
    "name": "Burs kyrka",
    "category": "sevardhet",
    "lat": 57.245664,
    "lng": 18.508733,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "buskvat-w1190202671",
    "name": "Buskvät",
    "category": "natur",
    "lat": 57.160261,
    "lng": 18.200349,
    "description": "Naturupplevelse"
  },
  {
    "id": "butiken-n9874892791",
    "name": "Butiken",
    "category": "aktivitet",
    "lat": 58.391884,
    "lng": 19.192772,
    "description": "Butik"
  },
  {
    "id": "butravjs-skeppssattningar-n6373661542",
    "name": "Butravjs Skeppssättningar",
    "category": "sevardhet",
    "lat": 57.529865,
    "lng": 18.669034,
    "description": "Historisk plats"
  },
  {
    "id": "buttle-266-n6373697292",
    "name": "Buttle 266",
    "category": "sevardhet",
    "lat": 57.395434,
    "lng": 18.502183,
    "description": "Historisk plats"
  },
  {
    "id": "buttle-kyrka-w1191878787",
    "name": "Buttle kyrka",
    "category": "sevardhet",
    "lat": 57.402707,
    "lng": 18.529913,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "bysens-livs-n2960655148",
    "name": "Bysens Livs",
    "category": "shopping",
    "lat": 57.486391,
    "lng": 18.132012,
    "description": "Butik"
  },
  {
    "id": "baken-n9730122846",
    "name": "Båken",
    "category": "sevardhet",
    "lat": 57.643595,
    "lng": 18.292374,
    "description": "Sevärdhet"
  },
  {
    "id": "batsmannshus-n1433648258",
    "name": "Båtsmannshus",
    "category": "sevardhet",
    "lat": 57.343101,
    "lng": 18.235245,
    "description": "Historisk plats"
  },
  {
    "id": "backs-w528208493",
    "name": "Bäcks",
    "category": "natur",
    "lat": 57.456414,
    "lng": 18.377469,
    "description": "Naturreservat"
  },
  {
    "id": "bals-kyrka-w431963645",
    "name": "Bäls kyrka",
    "category": "sevardhet",
    "lat": 57.644762,
    "lng": 18.632928,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "balsalvret-w620586500",
    "name": "Bälsalvret",
    "category": "natur",
    "lat": 57.659993,
    "lng": 18.689186,
    "description": "Naturreservat"
  },
  {
    "id": "bandesborg-w530662944",
    "name": "Bändesborg",
    "category": "sevardhet",
    "lat": 57.324923,
    "lng": 18.469868,
    "description": "Historisk plats"
  },
  {
    "id": "bastetrask-r1459279",
    "name": "Bästeträsk",
    "category": "natur",
    "lat": 57.899104,
    "lng": 18.928416,
    "description": "Naturreservat"
  },
  {
    "id": "cafe-amalia-n12131257780",
    "name": "Café amalia",
    "category": "mat",
    "lat": 57.63963,
    "lng": 18.293104,
    "description": "Café"
  },
  {
    "id": "cafe-borgen-w1087504455",
    "name": "Cafe Borgen",
    "category": "mat",
    "lat": 57.610417,
    "lng": 18.244184,
    "description": "Café"
  },
  {
    "id": "cafe-kubanen-n10977852005",
    "name": "Café Kubanen",
    "category": "mat",
    "lat": 57.581056,
    "lng": 18.225213,
    "description": "Café"
  },
  {
    "id": "cafe-maffen-w431979394",
    "name": "Café Maffen",
    "category": "mat",
    "lat": 57.863351,
    "lng": 19.055923,
    "description": "Café"
  },
  {
    "id": "capisci-n2649622677",
    "name": "Capisci",
    "category": "mat",
    "lat": 57.333321,
    "lng": 18.704098,
    "description": "Restaurang"
  },
  {
    "id": "carlings-n11691721472",
    "name": "Carlings",
    "category": "shopping",
    "lat": 57.637854,
    "lng": 18.299672,
    "description": "Butik"
  },
  {
    "id": "carlssons-n4308983757",
    "name": "Carlssons",
    "category": "mat",
    "lat": 57.955315,
    "lng": 19.245107,
    "description": "Restaurang"
  },
  {
    "id": "cementa-arena-w379071919",
    "name": "Cementa Arena",
    "category": "aktivitet",
    "lat": 57.707667,
    "lng": 18.793398,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "chili-n318925573",
    "name": "Chili",
    "category": "mat",
    "lat": 57.636226,
    "lng": 18.327459,
    "description": "Restaurang"
  },
  {
    "id": "chocolateria-n1814884756",
    "name": "Chocolateria",
    "category": "mat",
    "lat": 57.249516,
    "lng": 18.640511,
    "description": "Café"
  },
  {
    "id": "christopher-polhem-n2320588646",
    "name": "Christopher Polhem",
    "category": "sevardhet",
    "lat": 57.641918,
    "lng": 18.295316,
    "description": "Historisk plats"
  },
  {
    "id": "cias-keramik-w526079000",
    "name": "Cias Keramik",
    "category": "shopping",
    "lat": 57.907094,
    "lng": 19.107812,
    "description": "Butik"
  },
  {
    "id": "circle-k-n54045238",
    "name": "Circle K",
    "category": "service",
    "lat": 57.630115,
    "lng": 18.287078,
    "description": "Bensinstation"
  },
  {
    "id": "circle-k-w502562973",
    "name": "Circle K",
    "category": "service",
    "lat": 57.644922,
    "lng": 18.314797,
    "description": "Bensinstation"
  },
  {
    "id": "clarion-hotel-n4450109490",
    "name": "Clarion Hotel",
    "category": "boende",
    "lat": 57.63861,
    "lng": 18.290902,
    "description": "Hotell"
  },
  {
    "id": "clarion-hotell-visby-n10740026995",
    "name": "Clarion hotell Visby",
    "category": "service",
    "lat": 57.63814,
    "lng": 18.29001,
    "description": "Laddstation"
  },
  {
    "id": "coffee-art-gotland-n11961361623",
    "name": "Coffee & Art Gotland",
    "category": "mat",
    "lat": 57.641626,
    "lng": 18.29421,
    "description": "Café"
  },
  {
    "id": "coop-w290377569",
    "name": "Coop",
    "category": "shopping",
    "lat": 57.621439,
    "lng": 18.322859,
    "description": "Butik"
  },
  {
    "id": "coop-w305107184",
    "name": "Coop",
    "category": "shopping",
    "lat": 57.504639,
    "lng": 18.455865,
    "description": "Butik"
  },
  {
    "id": "coop-grabo-w231514886",
    "name": "Coop Gråbo",
    "category": "shopping",
    "lat": 57.619114,
    "lng": 18.301478,
    "description": "Butik"
  },
  {
    "id": "coop-hemse-n272661792",
    "name": "Coop Hemse",
    "category": "shopping",
    "lat": 57.239,
    "lng": 18.377277,
    "description": "Butik"
  },
  {
    "id": "coop-klintehamn-n1348602411",
    "name": "Coop Klintehamn",
    "category": "shopping",
    "lat": 57.387249,
    "lng": 18.204198,
    "description": "Butik"
  },
  {
    "id": "coop-ljugarn-w203181957",
    "name": "Coop Ljugarn",
    "category": "shopping",
    "lat": 57.332927,
    "lng": 18.702124,
    "description": "Butik"
  },
  {
    "id": "coop-larbro-w197364337",
    "name": "Coop Lärbro",
    "category": "shopping",
    "lat": 57.784778,
    "lng": 18.78884,
    "description": "Butik"
  },
  {
    "id": "coop-romakloster-n10740046628",
    "name": "Coop Romakloster",
    "category": "service",
    "lat": 57.50463,
    "lng": 18.45587,
    "description": "Laddstation"
  },
  {
    "id": "coop-slite-w378740698",
    "name": "Coop Slite",
    "category": "shopping",
    "lat": 57.70423,
    "lng": 18.803233,
    "description": "Butik"
  },
  {
    "id": "coop-oster-n315981839",
    "name": "Coop Öster",
    "category": "shopping",
    "lat": 57.637943,
    "lng": 18.30141,
    "description": "Butik"
  },
  {
    "id": "creperie-logi-n305501226",
    "name": "Crêperie & logi",
    "category": "mat",
    "lat": 57.638675,
    "lng": 18.295578,
    "description": "Restaurang"
  },
  {
    "id": "creperie-fide-n12091684091",
    "name": "Crêperie Fide",
    "category": "mat",
    "lat": 57.09386,
    "lng": 18.302934,
    "description": "Restaurang"
  },
  {
    "id": "creperie-kuten-w450812650",
    "name": "Creperie Kuten",
    "category": "mat",
    "lat": 57.934155,
    "lng": 19.164521,
    "description": "Restaurang"
  },
  {
    "id": "cubus-n11691721471",
    "name": "Cubus",
    "category": "shopping",
    "lat": 57.637913,
    "lng": 18.299496,
    "description": "Butik"
  },
  {
    "id": "dagghagens-naturreservat-w102775363",
    "name": "Dagghagens naturreservat",
    "category": "natur",
    "lat": 57.749551,
    "lng": 18.855999,
    "description": "Naturreservat"
  },
  {
    "id": "dalhem-45-1-n6373677147",
    "name": "Dalhem 45:1",
    "category": "sevardhet",
    "lat": 57.553245,
    "lng": 18.535749,
    "description": "Historisk plats"
  },
  {
    "id": "dalhem-46-1-n6373677148",
    "name": "Dalhem 46:1",
    "category": "sevardhet",
    "lat": 57.552567,
    "lng": 18.531997,
    "description": "Historisk plats"
  },
  {
    "id": "dalhems-kyrka-w230513395",
    "name": "Dalhems kyrka",
    "category": "sevardhet",
    "lat": 57.552397,
    "lng": 18.534129,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "dalhemstaget-n10740046638",
    "name": "Dalhemståget",
    "category": "service",
    "lat": 57.544935,
    "lng": 18.531646,
    "description": "Laddstation"
  },
  {
    "id": "dalmansporten-n6641861710",
    "name": "Dalmansporten",
    "category": "sevardhet",
    "lat": 57.641622,
    "lng": 18.300545,
    "description": "Historisk plats"
  },
  {
    "id": "dalmanstornet-w686918930",
    "name": "Dalmanstornet",
    "category": "sevardhet",
    "lat": 57.641627,
    "lng": 18.300518,
    "description": "Historisk plats"
  },
  {
    "id": "danbo-naturreservat-w102776334",
    "name": "Danbo naturreservat",
    "category": "natur",
    "lat": 57.378,
    "lng": 18.817288,
    "description": "Naturreservat"
  },
  {
    "id": "danskens-cafe-n11159076440",
    "name": "Danskens Café",
    "category": "mat",
    "lat": 57.640092,
    "lng": 18.291962,
    "description": "Snabbmat"
  },
  {
    "id": "demeter-farm-with-cafe-n1814883620",
    "name": "Demeter Farm with Cafe",
    "category": "mat",
    "lat": 57.876145,
    "lng": 18.890184,
    "description": "Café"
  },
  {
    "id": "destination-tofta-n10740046617",
    "name": "Destination Tofta",
    "category": "service",
    "lat": 57.48169,
    "lng": 18.13391,
    "description": "Laddstation"
  },
  {
    "id": "digarojr-cist-n6373556120",
    "name": "Digarojr Cist",
    "category": "sevardhet",
    "lat": 57.309283,
    "lng": 18.637618,
    "description": "Historisk plats"
  },
  {
    "id": "digarojr-gravfalt-n6373556121",
    "name": "Digarojr Gravfält",
    "category": "sevardhet",
    "lat": 57.3124,
    "lng": 18.638738,
    "description": "Historisk plats"
  },
  {
    "id": "digarojr-rose-n6373556119",
    "name": "Digarojr Röse",
    "category": "sevardhet",
    "lat": 57.309404,
    "lng": 18.637435,
    "description": "Historisk plats"
  },
  {
    "id": "digarojr-skeppssattning-n6373556118",
    "name": "Digarojr Skeppssättning",
    "category": "sevardhet",
    "lat": 57.308024,
    "lng": 18.637649,
    "description": "Historisk plats"
  },
  {
    "id": "digerhuvud-r1459264",
    "name": "Digerhuvud",
    "category": "natur",
    "lat": 57.968879,
    "lng": 19.108841,
    "description": "Naturreservat"
  },
  {
    "id": "diksmyr-w525598037",
    "name": "Diksmyr",
    "category": "natur",
    "lat": 57.409866,
    "lng": 18.741099,
    "description": "Naturupplevelse"
  },
  {
    "id": "din-x-n637797561",
    "name": "din-X",
    "category": "service",
    "lat": 57.337716,
    "lng": 18.700179,
    "description": "Bensinstation"
  },
  {
    "id": "djaupdy-n2089139098",
    "name": "Djaupdy",
    "category": "aktivitet",
    "lat": 57.250001,
    "lng": 18.709231,
    "description": "Småbåtshamn"
  },
  {
    "id": "djupvik-hotell-restaurang-n1489906377",
    "name": "Djupvik Hotell & Restaurang",
    "category": "boende",
    "lat": 57.30732,
    "lng": 18.152055,
    "description": "Hotell"
  },
  {
    "id": "djupvik-skeppssattning-n6374203622",
    "name": "Djupvik Skeppssättning",
    "category": "sevardhet",
    "lat": 57.306639,
    "lng": 18.151158,
    "description": "Historisk plats"
  },
  {
    "id": "djupviks-fiskelage-n1489980143",
    "name": "Djupviks fiskeläge",
    "category": "sevardhet",
    "lat": 57.307887,
    "lng": 18.14971,
    "description": "Besöksmål"
  },
  {
    "id": "djupviks-hamn-n1489906379",
    "name": "Djupviks hamn",
    "category": "aktivitet",
    "lat": 57.30841,
    "lng": 18.149024,
    "description": "Småbåtshamn"
  },
  {
    "id": "dollarstore-n13888128007",
    "name": "Dollarstore",
    "category": "shopping",
    "lat": 57.62246,
    "lng": 18.323125,
    "description": "Butik"
  },
  {
    "id": "domarlunden-n6373753073",
    "name": "Domarlunden",
    "category": "sevardhet",
    "lat": 57.783933,
    "lng": 18.817456,
    "description": "Historisk plats"
  },
  {
    "id": "donners-hotel-n3034225922",
    "name": "Donners Hotel",
    "category": "boende",
    "lat": 57.638713,
    "lng": 18.291453,
    "description": "Hotell"
  },
  {
    "id": "donnersporten-n1798336943",
    "name": "Donnersporten",
    "category": "sevardhet",
    "lat": 57.63921,
    "lng": 18.291277,
    "description": "Historisk plats"
  },
  {
    "id": "drakstenen-n5322112830",
    "name": "Drakstenen",
    "category": "sevardhet",
    "lat": 57.156104,
    "lng": 18.221277,
    "description": "Historisk plats"
  },
  {
    "id": "dressmann-n11691721473",
    "name": "Dressmann",
    "category": "shopping",
    "lat": 57.637822,
    "lng": 18.299724,
    "description": "Butik"
  },
  {
    "id": "drottens-kyrkoruin-n12897024931",
    "name": "Drottens kyrkoruin",
    "category": "sevardhet",
    "lat": 57.641621,
    "lng": 18.295165,
    "description": "Turistinformation"
  },
  {
    "id": "dusund-w379456716",
    "name": "Dusund",
    "category": "natur",
    "lat": 57.483443,
    "lng": 18.759149,
    "description": "Naturupplevelse"
  },
  {
    "id": "dyarna-w485723553",
    "name": "Dyarna",
    "category": "natur",
    "lat": 57.927743,
    "lng": 19.133712,
    "description": "Naturupplevelse"
  },
  {
    "id": "dambaskogen-n10608395040",
    "name": "Dämbaskogen",
    "category": "service",
    "lat": 57.898337,
    "lng": 19.091143,
    "description": "Laddstation"
  },
  {
    "id": "east-coast-n446780014",
    "name": "East Coast",
    "category": "mat",
    "lat": 57.639982,
    "lng": 18.292782,
    "description": "Restaurang"
  },
  {
    "id": "ebbas-mat-kaffe-w223117654",
    "name": "Ebbas Mat & Kaffe",
    "category": "mat",
    "lat": 57.957384,
    "lng": 19.23749,
    "description": "Restaurang"
  },
  {
    "id": "ebbes-n2320537405",
    "name": "Ebbes",
    "category": "shopping",
    "lat": 57.957228,
    "lng": 19.237981,
    "description": "Butik"
  },
  {
    "id": "eden-n12877364873",
    "name": "Eden",
    "category": "mat",
    "lat": 57.640798,
    "lng": 18.296695,
    "description": "Bar"
  },
  {
    "id": "effes-n318923465",
    "name": "Effes",
    "category": "mat",
    "lat": 57.635363,
    "lng": 18.292992,
    "description": "Pub"
  },
  {
    "id": "ekbacken-n4956951819",
    "name": "Ekbacken",
    "category": "familj",
    "lat": 57.593641,
    "lng": 18.512595,
    "description": "Lekplats"
  },
  {
    "id": "ekbackens-dansbana-n1853522075",
    "name": "Ekbackens dansbana",
    "category": "sevardhet",
    "lat": 57.312504,
    "lng": 18.586514,
    "description": "Besöksmål"
  },
  {
    "id": "eke-kyrka-w1191887714",
    "name": "Eke kyrka",
    "category": "sevardhet",
    "lat": 57.168026,
    "lng": 18.379103,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ekeby-kyrka-w205110805",
    "name": "Ekeby kyrka",
    "category": "sevardhet",
    "lat": 57.59513,
    "lng": 18.514649,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ekevikens-w436131428",
    "name": "Ekevikens",
    "category": "boende",
    "lat": 57.97152,
    "lng": 19.263853,
    "description": "Camping"
  },
  {
    "id": "eksta-kyrka-w1191887706",
    "name": "Eksta kyrka",
    "category": "sevardhet",
    "lat": 57.286553,
    "lng": 18.206395,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ekstakustens-naturreservat-w102776361",
    "name": "Ekstakustens naturreservat",
    "category": "natur",
    "lat": 57.275635,
    "lng": 18.100151,
    "description": "Naturreservat"
  },
  {
    "id": "elinghems-odekyrka-w1190178503",
    "name": "Elinghems ödekyrka",
    "category": "sevardhet",
    "lat": 57.811878,
    "lng": 18.619315,
    "description": "Historisk plats"
  },
  {
    "id": "elsies-cafe-w496794610",
    "name": "Elsies Café",
    "category": "mat",
    "lat": 57.934126,
    "lng": 19.164945,
    "description": "Café"
  },
  {
    "id": "endre-17-1-n6373732851",
    "name": "Endre 17:1",
    "category": "sevardhet",
    "lat": 57.612982,
    "lng": 18.394107,
    "description": "Historisk plats"
  },
  {
    "id": "endre-35-1-n6373736775",
    "name": "Endre 35:1",
    "category": "sevardhet",
    "lat": 57.62225,
    "lng": 18.386924,
    "description": "Historisk plats"
  },
  {
    "id": "endre-kyrka-w549170894",
    "name": "Endre kyrka",
    "category": "sevardhet",
    "lat": 57.610263,
    "lng": 18.465443,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "engelska-kyrkogarden-w1191890665",
    "name": "Engelska kyrkogården",
    "category": "sevardhet",
    "lat": 57.850851,
    "lng": 19.130191,
    "description": "Besöksmål"
  },
  {
    "id": "enholmen-r7573485",
    "name": "Enholmen",
    "category": "natur",
    "lat": 57.695491,
    "lng": 18.821089,
    "description": "Naturupplevelse"
  },
  {
    "id": "eskelhems-kyrka-w1191878782",
    "name": "Eskelhems kyrka",
    "category": "sevardhet",
    "lat": 57.489655,
    "lng": 18.209966,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "espegards-konditori-n2666739810",
    "name": "Espegards Konditori",
    "category": "mat",
    "lat": 57.332236,
    "lng": 18.704565,
    "description": "Café"
  },
  {
    "id": "espresso-house-n11691721486",
    "name": "Espresso House",
    "category": "mat",
    "lat": 57.637321,
    "lng": 18.301787,
    "description": "Café"
  },
  {
    "id": "etelhem-kyrka-w1191878784",
    "name": "Etelhem kyrka",
    "category": "sevardhet",
    "lat": 57.337216,
    "lng": 18.496007,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ett-litet-creperie-n5777656025",
    "name": "Ett litet Crêperie",
    "category": "mat",
    "lat": 57.793025,
    "lng": 18.532302,
    "description": "Restaurang"
  },
  {
    "id": "fardhems-kyrka-w1191887707",
    "name": "Fardhems kyrka",
    "category": "sevardhet",
    "lat": 57.263966,
    "lng": 18.34154,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "fenomenalen-n6591138285",
    "name": "Fenomenalen",
    "category": "sevardhet",
    "lat": 57.636887,
    "lng": 18.287053,
    "description": "Museum"
  },
  {
    "id": "fide-kyrka-w1191887716",
    "name": "Fide kyrka",
    "category": "sevardhet",
    "lat": 57.073755,
    "lng": 18.316326,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "fide-lovskog-r7611528",
    "name": "Fide lövskog",
    "category": "natur",
    "lat": 57.08315,
    "lng": 18.305901,
    "description": "Naturreservat"
  },
  {
    "id": "fide-aventyrsby-camping-w1071034656",
    "name": "Fide Äventyrsby & Camping",
    "category": "boende",
    "lat": 57.092668,
    "lng": 18.300758,
    "description": "Camping"
  },
  {
    "id": "fiket-n5726695650",
    "name": "Fiket",
    "category": "mat",
    "lat": 57.638359,
    "lng": 18.298287,
    "description": "Café"
  },
  {
    "id": "filehajdars-naturreservat-w102775790",
    "name": "Filehajdars naturreservat",
    "category": "natur",
    "lat": 57.717484,
    "lng": 18.667501,
    "description": "Naturreservat"
  },
  {
    "id": "filming-location-villa-villekulla-n11133784285",
    "name": "Filming location: Villa Villekulla",
    "category": "sevardhet",
    "lat": 57.617455,
    "lng": 18.276233,
    "description": "Besöksmål"
  },
  {
    "id": "first-hotel-kokoloko-n9706050493",
    "name": "First Hotel Kokoloko",
    "category": "boende",
    "lat": 57.626083,
    "lng": 18.281051,
    "description": "Hotell"
  },
  {
    "id": "fiskarporten-n6634264864",
    "name": "Fiskarporten",
    "category": "sevardhet",
    "lat": 57.642114,
    "lng": 18.291341,
    "description": "Historisk plats"
  },
  {
    "id": "fiskehamnen-n94203057",
    "name": "Fiskehamnen",
    "category": "aktivitet",
    "lat": 57.636147,
    "lng": 18.282557,
    "description": "Småbåtshamn"
  },
  {
    "id": "fjale-gard-i-ala-raa-nummer-ala-98-1-n2167598744",
    "name": "Fjäle gård i Ala, RAÄ-nummer Ala 98:1",
    "category": "sevardhet",
    "lat": 57.390427,
    "lng": 18.619644,
    "description": "Historisk plats"
  },
  {
    "id": "fjalmyr-w206720409",
    "name": "Fjälmyr",
    "category": "natur",
    "lat": 57.392924,
    "lng": 18.62508,
    "description": "Naturupplevelse"
  },
  {
    "id": "fjalangar-w528208439",
    "name": "Fjälängar",
    "category": "natur",
    "lat": 57.393202,
    "lng": 18.619977,
    "description": "Naturreservat"
  },
  {
    "id": "fleringe-kyrka-w437167933",
    "name": "Fleringe kyrka",
    "category": "sevardhet",
    "lat": 57.86965,
    "lng": 18.876968,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "flundrevikens-fiskelage-w705673422",
    "name": "Flundrevikens Fiskeläge",
    "category": "aktivitet",
    "lat": 57.66738,
    "lng": 18.324238,
    "description": "Småbåtshamn"
  },
  {
    "id": "flying-tiger-copenhagen-n11691721488",
    "name": "Flying Tiger Copenhagen",
    "category": "shopping",
    "lat": 57.637324,
    "lng": 18.300932,
    "description": "Butik"
  },
  {
    "id": "flyktingarna-fran-estland-lettland-och-litauen-n8900440073",
    "name": "Flyktingarna Från Estland, Lettland och Litauen",
    "category": "sevardhet",
    "lat": 57.705797,
    "lng": 18.809878,
    "description": "Historisk plats"
  },
  {
    "id": "fole-kyrka-w530619108",
    "name": "Fole kyrka",
    "category": "sevardhet",
    "lat": 57.650556,
    "lng": 18.544967,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "folhammars-naturreservat-w102775376",
    "name": "Folhammars naturreservat",
    "category": "natur",
    "lat": 57.346663,
    "lng": 18.735658,
    "description": "Naturreservat"
  },
  {
    "id": "follingbo-kyrka-w468503373",
    "name": "Follingbo kyrka",
    "category": "sevardhet",
    "lat": 57.58231,
    "lng": 18.38336,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "fonnsangets-naturreservat-r12193515",
    "name": "Fonnsängets naturreservat",
    "category": "natur",
    "lat": 57.427971,
    "lng": 18.366142,
    "description": "Naturreservat"
  },
  {
    "id": "form-visborg-n1462723100",
    "name": "Form Visborg",
    "category": "aktivitet",
    "lat": 57.613413,
    "lng": 18.284044,
    "description": "Idrottsanläggning"
  },
  {
    "id": "fornborg-w530645625",
    "name": "Fornborg",
    "category": "sevardhet",
    "lat": 57.821489,
    "lng": 18.898555,
    "description": "Historisk plats"
  },
  {
    "id": "fornborgen-i-boge-n1430279427",
    "name": "Fornborgen i Boge",
    "category": "sevardhet",
    "lat": 57.629069,
    "lng": 18.738642,
    "description": "Historisk plats"
  },
  {
    "id": "fornborgen-kaupungs-slott-w530662935",
    "name": "Fornborgen Kaupungs slott",
    "category": "sevardhet",
    "lat": 57.360513,
    "lng": 18.711766,
    "description": "Historisk plats"
  },
  {
    "id": "fornsalen-w455294754",
    "name": "Fornsalen",
    "category": "sevardhet",
    "lat": 57.63973,
    "lng": 18.292536,
    "description": "Museum"
  },
  {
    "id": "forsviden-w102775329",
    "name": "Forsviden",
    "category": "natur",
    "lat": 57.766943,
    "lng": 18.697344,
    "description": "Naturreservat"
  },
  {
    "id": "fotb-pl-w474066161",
    "name": "Fotb.pl.",
    "category": "aktivitet",
    "lat": 57.727373,
    "lng": 18.600245,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "fransan-n476025510",
    "name": "Fransan",
    "category": "mat",
    "lat": 57.244592,
    "lng": 18.647516,
    "description": "Restaurang"
  },
  {
    "id": "frida-s-bakery-coffee-n11093796779",
    "name": "Frida’s Bakery & Coffee",
    "category": "mat",
    "lat": 57.638981,
    "lng": 18.296983,
    "description": "Café"
  },
  {
    "id": "fridhems-cafe-w230631257",
    "name": "Fridhems café",
    "category": "mat",
    "lat": 57.599762,
    "lng": 18.214464,
    "description": "Café"
  },
  {
    "id": "fridhems-pensionat-w38108991",
    "name": "Fridhems pensionat",
    "category": "boende",
    "lat": 57.600282,
    "lng": 18.216794,
    "description": "Hotell"
  },
  {
    "id": "friendhs-n11687573162",
    "name": "Friendhs",
    "category": "shopping",
    "lat": 57.635423,
    "lng": 18.291663,
    "description": "Butik"
  },
  {
    "id": "fritidsanlaggning-kneippbyn-n431825111",
    "name": "Fritidsanläggning Kneippbyn",
    "category": "boende",
    "lat": 57.60955,
    "lng": 18.2454,
    "description": "Camping"
  },
  {
    "id": "frojels-kyrka-w1117505199",
    "name": "Fröjels kyrka",
    "category": "sevardhet",
    "lat": 57.335596,
    "lng": 18.189901,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "furilden-w528208494",
    "name": "Furilden",
    "category": "natur",
    "lat": 57.781954,
    "lng": 19.013757,
    "description": "Naturreservat"
  },
  {
    "id": "fyrutstallning-w481313997",
    "name": "Fyrutställning",
    "category": "sevardhet",
    "lat": 56.921588,
    "lng": 18.15093,
    "description": "Museum"
  },
  {
    "id": "faro-1-1-n4888688803",
    "name": "Fårö 1:1",
    "category": "sevardhet",
    "lat": 57.998094,
    "lng": 19.240053,
    "description": "Historisk plats"
  },
  {
    "id": "faro-107-1-n4852505594",
    "name": "Fårö 107:1",
    "category": "sevardhet",
    "lat": 57.859822,
    "lng": 19.123239,
    "description": "Historisk plats"
  },
  {
    "id": "faro-11-1-n4888688781",
    "name": "Fårö 11:1",
    "category": "sevardhet",
    "lat": 57.9661,
    "lng": 19.134503,
    "description": "Historisk plats"
  },
  {
    "id": "faro-11-2-n4888688780",
    "name": "Fårö 11:2",
    "category": "sevardhet",
    "lat": 57.966375,
    "lng": 19.134964,
    "description": "Historisk plats"
  },
  {
    "id": "faro-12-1-n4888688751",
    "name": "Fårö 12:1",
    "category": "sevardhet",
    "lat": 57.964856,
    "lng": 19.131183,
    "description": "Historisk plats"
  },
  {
    "id": "faro-14-1-n4888688750",
    "name": "Fårö 14:1",
    "category": "sevardhet",
    "lat": 57.960164,
    "lng": 19.113278,
    "description": "Historisk plats"
  },
  {
    "id": "faro-14-2-n4888688749",
    "name": "Fårö 14:2",
    "category": "sevardhet",
    "lat": 57.960236,
    "lng": 19.112594,
    "description": "Historisk plats"
  },
  {
    "id": "faro-14-3-n4888688748",
    "name": "Fårö 14:3",
    "category": "sevardhet",
    "lat": 57.960275,
    "lng": 19.1124,
    "description": "Historisk plats"
  },
  {
    "id": "faro-142-1-n4852505615",
    "name": "Fårö 142:1",
    "category": "sevardhet",
    "lat": 57.855664,
    "lng": 19.110039,
    "description": "Historisk plats"
  },
  {
    "id": "faro-146-1-n4852505608",
    "name": "Fårö 146:1",
    "category": "sevardhet",
    "lat": 57.858375,
    "lng": 19.113731,
    "description": "Historisk plats"
  },
  {
    "id": "faro-147-1-n4852505605",
    "name": "Fårö 147:1",
    "category": "sevardhet",
    "lat": 57.859194,
    "lng": 19.111544,
    "description": "Historisk plats"
  },
  {
    "id": "faro-147-1-w493326195",
    "name": "Fårö 147:1",
    "category": "sevardhet",
    "lat": 57.860872,
    "lng": 19.12035,
    "description": "Historisk plats"
  },
  {
    "id": "faro-147-2-n4852505606",
    "name": "Fårö 147:2",
    "category": "sevardhet",
    "lat": 57.858733,
    "lng": 19.111925,
    "description": "Historisk plats"
  },
  {
    "id": "faro-15-1-n4888688747",
    "name": "Fårö 15:1",
    "category": "sevardhet",
    "lat": 57.959056,
    "lng": 19.124433,
    "description": "Historisk plats"
  },
  {
    "id": "faro-2-1-n4888688802",
    "name": "Fårö 2:1",
    "category": "sevardhet",
    "lat": 57.998272,
    "lng": 19.189194,
    "description": "Historisk plats"
  },
  {
    "id": "faro-2-2-n4888688801",
    "name": "Fårö 2:2",
    "category": "sevardhet",
    "lat": 57.998244,
    "lng": 19.189308,
    "description": "Historisk plats"
  },
  {
    "id": "faro-2-3-n4888688800",
    "name": "Fårö 2:3",
    "category": "sevardhet",
    "lat": 57.998183,
    "lng": 19.189439,
    "description": "Historisk plats"
  },
  {
    "id": "faro-2-4-n4888688772",
    "name": "Fårö 2:4",
    "category": "sevardhet",
    "lat": 57.998111,
    "lng": 19.189561,
    "description": "Historisk plats"
  },
  {
    "id": "faro-252-1-n4852505617",
    "name": "Fårö 252:1",
    "category": "sevardhet",
    "lat": 57.851828,
    "lng": 19.112283,
    "description": "Historisk plats"
  },
  {
    "id": "faro-256-1-w493326193",
    "name": "Fårö 256:1",
    "category": "sevardhet",
    "lat": 57.859604,
    "lng": 19.125298,
    "description": "Historisk plats"
  },
  {
    "id": "faro-259-1-n4852505619",
    "name": "Fårö 259:1",
    "category": "sevardhet",
    "lat": 57.849078,
    "lng": 19.129408,
    "description": "Historisk plats"
  },
  {
    "id": "faro-3-1-w1124781907",
    "name": "Fårö 3:1",
    "category": "sevardhet",
    "lat": 57.996632,
    "lng": 19.180566,
    "description": "Historisk plats"
  },
  {
    "id": "faro-380-1-n4852224087",
    "name": "Fårö 380:1",
    "category": "sevardhet",
    "lat": 57.848672,
    "lng": 19.122725,
    "description": "Historisk plats"
  },
  {
    "id": "faro-4-1-n4888688770",
    "name": "Fårö 4:1",
    "category": "sevardhet",
    "lat": 57.994081,
    "lng": 19.215319,
    "description": "Historisk plats"
  },
  {
    "id": "faro-77-1-n4852505604",
    "name": "Fårö 77:1",
    "category": "sevardhet",
    "lat": 57.859986,
    "lng": 19.112739,
    "description": "Historisk plats"
  },
  {
    "id": "faro-77-2-n4852505603",
    "name": "Fårö 77:2",
    "category": "sevardhet",
    "lat": 57.859931,
    "lng": 19.112522,
    "description": "Historisk plats"
  },
  {
    "id": "faro-78-1-n4852505609",
    "name": "Fårö 78:1",
    "category": "sevardhet",
    "lat": 57.858136,
    "lng": 19.112278,
    "description": "Historisk plats"
  },
  {
    "id": "faro-78-2-n4852505610",
    "name": "Fårö 78:2",
    "category": "sevardhet",
    "lat": 57.857919,
    "lng": 19.112822,
    "description": "Historisk plats"
  },
  {
    "id": "faro-78-3-n4852505612",
    "name": "Fårö 78:3",
    "category": "sevardhet",
    "lat": 57.857689,
    "lng": 19.113186,
    "description": "Historisk plats"
  },
  {
    "id": "faro-78-4-n4852505611",
    "name": "Fårö 78:4",
    "category": "sevardhet",
    "lat": 57.857797,
    "lng": 19.113389,
    "description": "Historisk plats"
  },
  {
    "id": "faro-78-5-n4852505607",
    "name": "Fårö 78:5",
    "category": "sevardhet",
    "lat": 57.858369,
    "lng": 19.112397,
    "description": "Historisk plats"
  },
  {
    "id": "faro-79-1-n4852505613",
    "name": "Fårö 79:1",
    "category": "sevardhet",
    "lat": 57.857772,
    "lng": 19.110353,
    "description": "Historisk plats"
  },
  {
    "id": "faro-79-2-n4852505614",
    "name": "Fårö 79:2",
    "category": "sevardhet",
    "lat": 57.857556,
    "lng": 19.110428,
    "description": "Historisk plats"
  },
  {
    "id": "faro-80-1-n4852505616",
    "name": "Fårö 80:1",
    "category": "sevardhet",
    "lat": 57.854569,
    "lng": 19.113144,
    "description": "Historisk plats"
  },
  {
    "id": "faro-9-1-n4888688769",
    "name": "Fårö 9:1",
    "category": "sevardhet",
    "lat": 57.969758,
    "lng": 19.195208,
    "description": "Historisk plats"
  },
  {
    "id": "faro-96-1-n4852505602",
    "name": "Fårö 96:1",
    "category": "sevardhet",
    "lat": 57.861811,
    "lng": 19.1119,
    "description": "Historisk plats"
  },
  {
    "id": "faro-96-2-n4852505601",
    "name": "Fårö 96:2",
    "category": "sevardhet",
    "lat": 57.861606,
    "lng": 19.112283,
    "description": "Historisk plats"
  },
  {
    "id": "faro-hantverkshus-n6672566912",
    "name": "Fårö Hantverkshus",
    "category": "shopping",
    "lat": 57.915234,
    "lng": 19.132506,
    "description": "Butik"
  },
  {
    "id": "faro-kursgard-n812165735",
    "name": "Fårö kursgård",
    "category": "boende",
    "lat": 57.915219,
    "lng": 19.126967,
    "description": "Vandrarhem"
  },
  {
    "id": "faro-kyrka-w344862510",
    "name": "Fårö kyrka",
    "category": "sevardhet",
    "lat": 57.915801,
    "lng": 19.133361,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "faro-museum-w494554005",
    "name": "Fårö museum",
    "category": "sevardhet",
    "lat": 57.918913,
    "lng": 19.13845,
    "description": "Museum"
  },
  {
    "id": "faro-sundersand-outdoor-gym-w1086975346",
    "name": "Fårö Sundersand outdoor gym",
    "category": "aktivitet",
    "lat": 57.953926,
    "lng": 19.252495,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "farogarden-n6741686385",
    "name": "Fårögården",
    "category": "mat",
    "lat": 57.952485,
    "lng": 19.221429,
    "description": "Restaurang"
  },
  {
    "id": "farohus-w485430511",
    "name": "Fåröhus",
    "category": "boende",
    "lat": 57.913492,
    "lng": 19.126811,
    "description": "Restaurang"
  },
  {
    "id": "farosunds-batklubb-n1079499531",
    "name": "Fårösunds Båtklubb",
    "category": "aktivitet",
    "lat": 57.856091,
    "lng": 19.066551,
    "description": "Småbåtshamn"
  },
  {
    "id": "farosunds-fastning-n1079495895",
    "name": "Fårösunds Fästning",
    "category": "boende",
    "lat": 57.846386,
    "lng": 19.07862,
    "description": "Restaurang"
  },
  {
    "id": "farosunds-fastning-batteri-ii-n1844650303",
    "name": "Fårösunds fästning, Batteri II",
    "category": "sevardhet",
    "lat": 57.906533,
    "lng": 19.018891,
    "description": "Historisk plats"
  },
  {
    "id": "farosunds-idrottsplats-w432616494",
    "name": "Fårösunds Idrottsplats",
    "category": "aktivitet",
    "lat": 57.856649,
    "lng": 19.043788,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "farosunds-lanthamn-n1079496203",
    "name": "Fårösunds Lanthamn",
    "category": "aktivitet",
    "lat": 57.866355,
    "lng": 19.058256,
    "description": "Småbåtshamn"
  },
  {
    "id": "farosunds-marina-n1079497576",
    "name": "Fårösunds Marina",
    "category": "aktivitet",
    "lat": 57.864171,
    "lng": 19.05975,
    "description": "Småbåtshamn"
  },
  {
    "id": "farosunds-sodra-batteri-w708193044",
    "name": "Fårösunds södra batteri",
    "category": "sevardhet",
    "lat": 57.840678,
    "lng": 19.087058,
    "description": "Historisk plats"
  },
  {
    "id": "g-a-masters-n318001602",
    "name": "g:a masters",
    "category": "mat",
    "lat": 57.640026,
    "lng": 18.296572,
    "description": "Restaurang"
  },
  {
    "id": "gahm-s-n2463099485",
    "name": "Gahm's",
    "category": "shopping",
    "lat": 57.706909,
    "lng": 18.806718,
    "description": "Butik"
  },
  {
    "id": "galgberget-n52586897",
    "name": "Galgberget",
    "category": "sevardhet",
    "lat": 57.65051,
    "lng": 18.307218,
    "description": "Besöksmål"
  },
  {
    "id": "galgberget-r6866915",
    "name": "Galgberget",
    "category": "natur",
    "lat": 57.652863,
    "lng": 18.313606,
    "description": "Naturreservat"
  },
  {
    "id": "galgen-n6641175640",
    "name": "Galgen",
    "category": "sevardhet",
    "lat": 57.650411,
    "lng": 18.307446,
    "description": "Besöksmål"
  },
  {
    "id": "galtmyr-w379621026",
    "name": "Galtmyr",
    "category": "natur",
    "lat": 57.850893,
    "lng": 18.931037,
    "description": "Naturupplevelse"
  },
  {
    "id": "gamla-hamn-r7100480",
    "name": "Gamla hamn",
    "category": "natur",
    "lat": 57.943638,
    "lng": 19.087992,
    "description": "Naturreservat"
  },
  {
    "id": "gamla-jernvagshotellet-n2801318890",
    "name": "Gamla Jernvägshotellet",
    "category": "boende",
    "lat": 57.736369,
    "lng": 18.603748,
    "description": "Vandrarhem"
  },
  {
    "id": "gamla-lagerplatsen-n3173424684",
    "name": "Gamla lägerplatsen",
    "category": "sevardhet",
    "lat": 57.852105,
    "lng": 18.981472,
    "description": "Historisk plats"
  },
  {
    "id": "gamle-hamn-n448281278",
    "name": "Gamle Hamn",
    "category": "sevardhet",
    "lat": 57.943004,
    "lng": 19.090869,
    "description": "Historisk plats"
  },
  {
    "id": "gammelgarns-kyrka-w855572079",
    "name": "Gammelgarns kyrka",
    "category": "sevardhet",
    "lat": 57.404574,
    "lng": 18.80445,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "gangvide-farm-n10740027000",
    "name": "Gangvide Farm",
    "category": "service",
    "lat": 57.2593,
    "lng": 18.65491,
    "description": "Laddstation"
  },
  {
    "id": "gannarve-w1117505215",
    "name": "Gannarve",
    "category": "sevardhet",
    "lat": 57.34786,
    "lng": 18.192245,
    "description": "Historisk plats"
  },
  {
    "id": "gannarve-hotel-och-restaurang-n11058938600",
    "name": "Gannarve Hotel Och Restaurang",
    "category": "boende",
    "lat": 57.348458,
    "lng": 18.191315,
    "description": "Hotell"
  },
  {
    "id": "gannarvemyr-r7241933",
    "name": "Gannarvemyr",
    "category": "natur",
    "lat": 57.418154,
    "lng": 18.841444,
    "description": "Naturupplevelse"
  },
  {
    "id": "ganns-odekyrka-w1190038227",
    "name": "Ganns ödekyrka",
    "category": "sevardhet",
    "lat": 57.796228,
    "lng": 18.751726,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ganthems-kyrka-w612052388",
    "name": "Ganthems kyrka",
    "category": "sevardhet",
    "lat": 57.514554,
    "lng": 18.581794,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "garda-kyrka-w1191878785",
    "name": "Garda kyrka",
    "category": "sevardhet",
    "lat": 57.317155,
    "lng": 18.582356,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "gasmorhammaren-n4341704702",
    "name": "Gasmorhammaren",
    "category": "natur",
    "lat": 57.941608,
    "lng": 19.221591,
    "description": "Naturupplevelse"
  },
  {
    "id": "gasmyr-w379559275",
    "name": "Gasmyr",
    "category": "natur",
    "lat": 57.398127,
    "lng": 18.657451,
    "description": "Naturupplevelse"
  },
  {
    "id": "german-beer-hall-visby-n6620794509",
    "name": "German Beer Hall Visby",
    "category": "mat",
    "lat": 57.641027,
    "lng": 18.295524,
    "description": "Restaurang"
  },
  {
    "id": "gerum-prastange-naturreservat-w895701663",
    "name": "Gerum prästänge naturreservat",
    "category": "natur",
    "lat": 57.287443,
    "lng": 18.308905,
    "description": "Naturreservat"
  },
  {
    "id": "gerums-kyrka-w1191887704",
    "name": "Gerums kyrka",
    "category": "sevardhet",
    "lat": 57.294517,
    "lng": 18.329589,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "gervide-sojvide-w680680413",
    "name": "Gervide, Sojvide",
    "category": "sevardhet",
    "lat": 57.476511,
    "lng": 18.501344,
    "description": "Historisk plats"
  },
  {
    "id": "glassmagasinet-n763160584",
    "name": "Glassmagasinet",
    "category": "mat",
    "lat": 57.637267,
    "lng": 18.287427,
    "description": "Glass"
  },
  {
    "id": "glassmagasinet-n11093796579",
    "name": "Glassmagasinet",
    "category": "mat",
    "lat": 57.638957,
    "lng": 18.297051,
    "description": "Glass"
  },
  {
    "id": "glassvillan-n9895722511",
    "name": "Glassvillan",
    "category": "mat",
    "lat": 57.644534,
    "lng": 18.296479,
    "description": "Café"
  },
  {
    "id": "gnisvard-dolmen-n6373725205",
    "name": "Gnisvärd dolmen",
    "category": "sevardhet",
    "lat": 57.508615,
    "lng": 18.140676,
    "description": "Historisk plats"
  },
  {
    "id": "gnisvard-skeppssattning-1-n2758370179",
    "name": "Gnisvärd skeppssättning #1",
    "category": "sevardhet",
    "lat": 57.508282,
    "lng": 18.140957,
    "description": "Historisk plats"
  },
  {
    "id": "gnisvard-skeppssattning-2-n6373725189",
    "name": "Gnisvärd skeppssättning #2",
    "category": "sevardhet",
    "lat": 57.50749,
    "lng": 18.141278,
    "description": "Historisk plats"
  },
  {
    "id": "gnisvard-skeppssattning-3-n6373725190",
    "name": "Gnisvärd skeppssättning #3",
    "category": "sevardhet",
    "lat": 57.506459,
    "lng": 18.140818,
    "description": "Historisk plats"
  },
  {
    "id": "gnisvards-strand-w292514531",
    "name": "Gnisvärds strand",
    "category": "strand",
    "lat": 57.497796,
    "lng": 18.118736,
    "description": "Badstrand"
  },
  {
    "id": "gothem-kyrka-w437599415",
    "name": "Gothem kyrka",
    "category": "sevardhet",
    "lat": 57.575425,
    "lng": 18.735038,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "gothem-suderbys-w102775360",
    "name": "Gothem Suderbys",
    "category": "natur",
    "lat": 57.549451,
    "lng": 18.681883,
    "description": "Naturreservat"
  },
  {
    "id": "gothems-cantina-y-casitas-n3605921615",
    "name": "Gothems Cantina y Casitas",
    "category": "mat",
    "lat": 57.57919,
    "lng": 18.728871,
    "description": "Restaurang"
  },
  {
    "id": "gothemsgarden-n10740046618",
    "name": "Gothemsgården",
    "category": "service",
    "lat": 57.70156,
    "lng": 18.80063,
    "description": "Laddstation"
  },
  {
    "id": "gotland-ring-w311644846",
    "name": "Gotland Ring",
    "category": "aktivitet",
    "lat": 57.839707,
    "lng": 18.834884,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "gotlandring-n10740046629",
    "name": "GotlandRing",
    "category": "service",
    "lat": 57.84415,
    "lng": 18.8037,
    "description": "Laddstation"
  },
  {
    "id": "gotlands-bryggeri-n6611013493",
    "name": "Gotlands bryggeri",
    "category": "mat",
    "lat": 57.641751,
    "lng": 18.294823,
    "description": "Bar"
  },
  {
    "id": "gotlands-cykeluthyrning-n11697916467",
    "name": "Gotlands Cykeluthyrning",
    "category": "aktivitet",
    "lat": 57.636594,
    "lng": 18.287276,
    "description": "Butik"
  },
  {
    "id": "gotlands-djurpark-n6588401485",
    "name": "Gotlands Djurpark",
    "category": "sevardhet",
    "lat": 57.516487,
    "lng": 18.217469,
    "description": "Besöksmål"
  },
  {
    "id": "gotlands-fallskarmsklubb-w608445206",
    "name": "Gotlands Fallskärmsklubb",
    "category": "aktivitet",
    "lat": 57.648106,
    "lng": 18.326984,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "gotlands-fiskerimuseum-n4954644105",
    "name": "Gotlands Fiskerimuseum",
    "category": "sevardhet",
    "lat": 57.407314,
    "lng": 18.15841,
    "description": "Besöksmål"
  },
  {
    "id": "gotlands-flygklubb-w33471035",
    "name": "Gotlands Flygklubb",
    "category": "aktivitet",
    "lat": 57.647781,
    "lng": 18.327229,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "gotlands-forsvarsmuseum-w443245008",
    "name": "Gotlands försvarsmuseum",
    "category": "sevardhet",
    "lat": 57.734775,
    "lng": 18.613009,
    "description": "Museum"
  },
  {
    "id": "gotlands-idrottscenter-n1079496563",
    "name": "Gotlands Idrottscenter",
    "category": "aktivitet",
    "lat": 57.866005,
    "lng": 19.039805,
    "description": "Idrottsanläggning"
  },
  {
    "id": "gotlands-idrottscenter-vandrarhem-n13009794336",
    "name": "Gotlands Idrottscenter vandrarhem",
    "category": "boende",
    "lat": 57.86607,
    "lng": 19.039834,
    "description": "Vandrarhem"
  },
  {
    "id": "gotlands-konstmuseum-w396133930",
    "name": "Gotlands konstmuseum",
    "category": "sevardhet",
    "lat": 57.639424,
    "lng": 18.29363,
    "description": "Museum"
  },
  {
    "id": "gotlands-korvfabrik-n13073506493",
    "name": "Gotlands Korvfabrik",
    "category": "mat",
    "lat": 57.507476,
    "lng": 18.450365,
    "description": "Snabbmat"
  },
  {
    "id": "gotlands-lantbruksmuseum-w528255778",
    "name": "Gotlands Lantbruksmuseum",
    "category": "sevardhet",
    "lat": 57.160729,
    "lng": 18.330718,
    "description": "Museum"
  },
  {
    "id": "gotlands-museum-n8690246817",
    "name": "Gotlands Museum",
    "category": "sevardhet",
    "lat": 57.639641,
    "lng": 18.292413,
    "description": "Museum"
  },
  {
    "id": "gotlands-strumpfabrik-n11755799054",
    "name": "Gotlands strumpfabrik",
    "category": "shopping",
    "lat": 57.639921,
    "lng": 18.294529,
    "description": "Butik"
  },
  {
    "id": "gotlands-strumpfabrik-n6624547717",
    "name": "Gotlands Strumpfabrik",
    "category": "shopping",
    "lat": 57.653484,
    "lng": 18.768072,
    "description": "Butik"
  },
  {
    "id": "gotlands-turistbyra-n68327498",
    "name": "Gotlands Turistbyrå",
    "category": "service",
    "lat": 57.639097,
    "lng": 18.290981,
    "description": "Turistinformation"
  },
  {
    "id": "gotlandsvafflan-n685981446",
    "name": "Gotlandsvåfflan",
    "category": "mat",
    "lat": 57.791794,
    "lng": 18.788569,
    "description": "Restaurang"
  },
  {
    "id": "gotlandsvafflan-n7786971620",
    "name": "Gotlandsvåfflan",
    "category": "mat",
    "lat": 57.830733,
    "lng": 18.787885,
    "description": "Restaurang"
  },
  {
    "id": "gotlato-n13868459001",
    "name": "Gotlato",
    "category": "mat",
    "lat": 57.640338,
    "lng": 18.29675,
    "description": "Glass"
  },
  {
    "id": "gotlandska-souvenirer-n12892437651",
    "name": "Gotländska Souvenirer",
    "category": "shopping",
    "lat": 57.636514,
    "lng": 18.293541,
    "description": "Butik"
  },
  {
    "id": "gotska-gk-r6846528",
    "name": "Gotska GK",
    "category": "aktivitet",
    "lat": 57.654105,
    "lng": 18.328256,
    "description": "Golfbana"
  },
  {
    "id": "gotska-sandon-lagerplats-w1367400980",
    "name": "Gotska Sandön Lägerplats",
    "category": "boende",
    "lat": 58.390413,
    "lng": 19.192508,
    "description": "Camping"
  },
  {
    "id": "gotska-sandons-kapell-w1076498884",
    "name": "Gotska Sandöns kapell",
    "category": "sevardhet",
    "lat": 58.388685,
    "lng": 19.196525,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "grausne-gardsforsaljning-n5784971151",
    "name": "Grausne Gårdsförsäljning",
    "category": "shopping",
    "lat": 57.810753,
    "lng": 18.530167,
    "description": "Gårdsbutik"
  },
  {
    "id": "grausne-kallmyrs-naturreservat-w102776315",
    "name": "Grausne källmyrs naturreservat",
    "category": "natur",
    "lat": 57.825454,
    "lng": 18.533523,
    "description": "Naturreservat"
  },
  {
    "id": "graute-w601007507",
    "name": "Graute",
    "category": "mat",
    "lat": 57.665449,
    "lng": 18.633917,
    "description": "Café"
  },
  {
    "id": "grodde-w102775834",
    "name": "Grodde",
    "category": "natur",
    "lat": 57.872062,
    "lng": 18.822119,
    "description": "Naturreservat"
  },
  {
    "id": "grodvat-w102775557",
    "name": "Grodvät",
    "category": "natur",
    "lat": 57.722785,
    "lng": 18.648613,
    "description": "Naturreservat"
  },
  {
    "id": "grodvat-w530537598",
    "name": "Grodvät",
    "category": "natur",
    "lat": 57.689903,
    "lng": 18.573053,
    "description": "Naturupplevelse"
  },
  {
    "id": "grogarnsberget-n10280566567",
    "name": "Grogarnsberget",
    "category": "natur",
    "lat": 57.437269,
    "lng": 18.896433,
    "description": "Naturupplevelse"
  },
  {
    "id": "grogarnsberget-r7611532",
    "name": "Grogarnsberget",
    "category": "natur",
    "lat": 57.432372,
    "lng": 18.893232,
    "description": "Naturreservat"
  },
  {
    "id": "grunnet-r7573482",
    "name": "Grunnet",
    "category": "natur",
    "lat": 57.695645,
    "lng": 18.837601,
    "description": "Naturupplevelse"
  },
  {
    "id": "grunnsvat-w498422141",
    "name": "Grunnsvät",
    "category": "natur",
    "lat": 57.986632,
    "lng": 19.171328,
    "description": "Naturupplevelse"
  },
  {
    "id": "grynge-badplats-n14006220188",
    "name": "Grynge badplats",
    "category": "strand",
    "lat": 57.383252,
    "lng": 18.829901,
    "description": "Badplats"
  },
  {
    "id": "granbymyr-w379459648",
    "name": "Gränbymyr",
    "category": "natur",
    "lat": 57.417629,
    "lng": 18.799406,
    "description": "Naturupplevelse"
  },
  {
    "id": "grane-w102775331",
    "name": "Gräne",
    "category": "natur",
    "lat": 57.794989,
    "lng": 18.586823,
    "description": "Naturreservat"
  },
  {
    "id": "grane-skeppssattning-n6373695001",
    "name": "Gräne Skeppssättning",
    "category": "sevardhet",
    "lat": 57.442462,
    "lng": 18.340362,
    "description": "Historisk plats"
  },
  {
    "id": "grotlingbo-kyrka-w1191887715",
    "name": "Grötlingbo kyrka",
    "category": "sevardhet",
    "lat": 57.133525,
    "lng": 18.346657,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "grotlingboholme-w102776273",
    "name": "Grötlingboholme",
    "category": "natur",
    "lat": 57.12371,
    "lng": 18.460664,
    "description": "Naturreservat"
  },
  {
    "id": "guffride-w102775527",
    "name": "Guffride",
    "category": "natur",
    "lat": 57.366815,
    "lng": 18.616298,
    "description": "Naturreservat"
  },
  {
    "id": "gula-huset-n2320588955",
    "name": "Gula Huset",
    "category": "mat",
    "lat": 57.642803,
    "lng": 18.295419,
    "description": "Café"
  },
  {
    "id": "guldrupe-kyrka-w1161278315",
    "name": "Guldrupe kyrka",
    "category": "sevardhet",
    "lat": 57.430288,
    "lng": 18.426624,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "gumbalde-w198948330",
    "name": "Gumbalde",
    "category": "aktivitet",
    "lat": 57.286748,
    "lng": 18.471996,
    "description": "Golfbana"
  },
  {
    "id": "gurpe-naturreservat-w1331386572",
    "name": "Gurpe naturreservat",
    "category": "natur",
    "lat": 57.448476,
    "lng": 18.665695,
    "description": "Naturreservat"
  },
  {
    "id": "gustav-setu-pebble-bridge-n8953076951",
    "name": "Gustav Setu Pebble Bridge",
    "category": "strand",
    "lat": 57.918868,
    "lng": 18.945715,
    "description": "Badstrand"
  },
  {
    "id": "gustavsviks-badplats-n6641345625",
    "name": "Gustavsviks Badplats",
    "category": "strand",
    "lat": 57.663181,
    "lng": 18.320173,
    "description": "Badplats"
  },
  {
    "id": "gusto-n12100420853",
    "name": "Gusto",
    "category": "mat",
    "lat": 57.609271,
    "lng": 18.244286,
    "description": "Restaurang"
  },
  {
    "id": "gutars-bagskyttar-n12168389609",
    "name": "Gutars Bågskyttar",
    "category": "aktivitet",
    "lat": 57.590252,
    "lng": 18.2613,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "gutavallen-r6852125",
    "name": "Gutavallen",
    "category": "aktivitet",
    "lat": 57.635223,
    "lng": 18.29685,
    "description": "Idrottsanläggning"
  },
  {
    "id": "gute-glass-w707078442",
    "name": "Gute glass",
    "category": "mat",
    "lat": 57.491591,
    "lng": 18.127814,
    "description": "Glass"
  },
  {
    "id": "gute-glass-bar-n12087098876",
    "name": "Gute Glass-bar",
    "category": "mat",
    "lat": 57.638447,
    "lng": 18.295705,
    "description": "Glass"
  },
  {
    "id": "gute-vingard-n12012015669",
    "name": "Gute Vingård",
    "category": "sevardhet",
    "lat": 57.186524,
    "lng": 18.248049,
    "description": "Besöksmål"
  },
  {
    "id": "gutekallaren-n415765920",
    "name": "Gutekällaren",
    "category": "mat",
    "lat": 57.640898,
    "lng": 18.295407,
    "description": "Pub"
  },
  {
    "id": "gutestugan-stenkumla-vandrarhem-n1348601459",
    "name": "Gutestugan/Stenkumla vandrarhem",
    "category": "boende",
    "lat": 57.546527,
    "lng": 18.230657,
    "description": "Vandrarhem"
  },
  {
    "id": "gylar-w379456707",
    "name": "Gylar",
    "category": "natur",
    "lat": 57.48661,
    "lng": 18.759214,
    "description": "Naturupplevelse"
  },
  {
    "id": "gylar-w379456737",
    "name": "Gylar",
    "category": "natur",
    "lat": 57.48628,
    "lng": 18.764181,
    "description": "Naturupplevelse"
  },
  {
    "id": "galrum-gravfalt-n937714637",
    "name": "Gålrum Gravfält",
    "category": "sevardhet",
    "lat": 57.330263,
    "lng": 18.656899,
    "description": "Historisk plats"
  },
  {
    "id": "gardsforsaljning-n7785605723",
    "name": "Gårdsförsäljning",
    "category": "shopping",
    "lat": 57.794514,
    "lng": 18.498641,
    "description": "Gårdsbutik"
  },
  {
    "id": "gasmyr-w379563645",
    "name": "Gåsmyr",
    "category": "natur",
    "lat": 57.817234,
    "lng": 18.87543,
    "description": "Naturupplevelse"
  },
  {
    "id": "gasthamnen-r7403863",
    "name": "Gästhamnen",
    "category": "aktivitet",
    "lat": 57.638224,
    "lng": 18.287015,
    "description": "Småbåtshamn"
  },
  {
    "id": "h-m-n11691721485",
    "name": "H&M",
    "category": "shopping",
    "lat": 57.637691,
    "lng": 18.301053,
    "description": "Butik"
  },
  {
    "id": "h10-bar-cafe-n6412104186",
    "name": "H10 Bar & Cafe",
    "category": "mat",
    "lat": 57.638421,
    "lng": 18.293898,
    "description": "Café"
  },
  {
    "id": "hablingbo-cafe-w438460842",
    "name": "Hablingbo Café",
    "category": "mat",
    "lat": 57.187019,
    "lng": 18.259787,
    "description": "Café"
  },
  {
    "id": "hablingbo-kyrka-w438460843",
    "name": "Hablingbo kyrka",
    "category": "sevardhet",
    "lat": 57.187286,
    "lng": 18.262788,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hablingbo-vandrarhem-n1348602377",
    "name": "hablingbo vandrarhem",
    "category": "boende",
    "lat": 57.1858,
    "lng": 18.247366,
    "description": "Vandrarhem"
  },
  {
    "id": "hagrojr-w1124781510",
    "name": "Hagrojr",
    "category": "sevardhet",
    "lat": 57.188679,
    "lng": 18.499033,
    "description": "Historisk plats"
  },
  {
    "id": "hajdes-storhage-r1459267",
    "name": "Hajdes storhage",
    "category": "natur",
    "lat": 57.352787,
    "lng": 18.297378,
    "description": "Naturreservat"
  },
  {
    "id": "hajdhagens-naturreservat-w895701670",
    "name": "Hajdhagens naturreservat",
    "category": "natur",
    "lat": 57.825927,
    "lng": 18.631001,
    "description": "Naturreservat"
  },
  {
    "id": "hajdhagskogens-naturreservat-r12193513",
    "name": "Hajdhagskogens naturreservat",
    "category": "natur",
    "lat": 57.742442,
    "lng": 18.754329,
    "description": "Naturreservat"
  },
  {
    "id": "hajdkvie-skog-w102775314",
    "name": "Hajdkvie skog",
    "category": "natur",
    "lat": 57.365306,
    "lng": 18.332546,
    "description": "Naturreservat"
  },
  {
    "id": "hall-hangvar-r1459274",
    "name": "Hall-Hangvar",
    "category": "natur",
    "lat": 57.876573,
    "lng": 18.684561,
    "description": "Naturreservat"
  },
  {
    "id": "halla-kyrka-w234712398",
    "name": "Halla kyrka",
    "category": "sevardhet",
    "lat": 57.510896,
    "lng": 18.497118,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hallbrosslott-w530649835",
    "name": "Hallbrosslott",
    "category": "sevardhet",
    "lat": 57.580997,
    "lng": 18.191981,
    "description": "Historisk plats"
  },
  {
    "id": "halls-kyrka-w1191859372",
    "name": "Halls kyrka",
    "category": "sevardhet",
    "lat": 57.892078,
    "lng": 18.715884,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hallshuk-n2095433047",
    "name": "Hallshuk",
    "category": "aktivitet",
    "lat": 57.925354,
    "lng": 18.745856,
    "description": "Småbåtshamn"
  },
  {
    "id": "hallshuks-kapell-w533013733",
    "name": "Hallshuks kapell",
    "category": "sevardhet",
    "lat": 57.925035,
    "lng": 18.742365,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hambrar-w528208500",
    "name": "Hambrar",
    "category": "natur",
    "lat": 57.420149,
    "lng": 18.664012,
    "description": "Naturreservat"
  },
  {
    "id": "hamnkafeet-n632446392",
    "name": "Hamnkaféet",
    "category": "mat",
    "lat": 57.38901,
    "lng": 18.185789,
    "description": "Café"
  },
  {
    "id": "hamnkrogen-herrvik-n4359022692",
    "name": "Hamnkrogen Herrvik",
    "category": "mat",
    "lat": 57.422091,
    "lng": 18.916639,
    "description": "Restaurang"
  },
  {
    "id": "hamnterminalen-w311120396",
    "name": "Hamnterminalen",
    "category": "service",
    "lat": 57.634332,
    "lng": 18.280155,
    "description": "Färjeterminal"
  },
  {
    "id": "hamra-helso-brunn-n4750824632",
    "name": "Hamra Helso Brunn",
    "category": "natur",
    "lat": 56.95,
    "lng": 18.279683,
    "description": "Naturupplevelse"
  },
  {
    "id": "hamra-krog-n13041296101",
    "name": "Hamra Krog",
    "category": "mat",
    "lat": 56.978939,
    "lng": 18.31549,
    "description": "Restaurang"
  },
  {
    "id": "hamra-kyrka-w513951983",
    "name": "Hamra kyrka",
    "category": "sevardhet",
    "lat": 56.97611,
    "lng": 18.313402,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hamrars-naturreservat-w1340030973",
    "name": "Hamrars naturreservat",
    "category": "natur",
    "lat": 57.838013,
    "lng": 19.031462,
    "description": "Naturreservat"
  },
  {
    "id": "hamremyr-w437619645",
    "name": "Hamremyr",
    "category": "natur",
    "lat": 57.602148,
    "lng": 18.764379,
    "description": "Naturupplevelse"
  },
  {
    "id": "handelsbanken-n1079496158",
    "name": "Handelsbanken",
    "category": "service",
    "lat": 57.861657,
    "lng": 19.056607,
    "description": "Service"
  },
  {
    "id": "hangvar-suderbys-naturreservat-w1416319556",
    "name": "Hangvar Suderbys naturreservat",
    "category": "natur",
    "lat": 57.805829,
    "lng": 18.678939,
    "description": "Naturreservat"
  },
  {
    "id": "hangvars-kyrka-w465480015",
    "name": "Hangvars kyrka",
    "category": "sevardhet",
    "lat": 57.839332,
    "lng": 18.68858,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "happy-hippie-n1844665495",
    "name": "Happy Hippie",
    "category": "shopping",
    "lat": 57.779348,
    "lng": 18.780599,
    "description": "Butik"
  },
  {
    "id": "haugajnars-naturreservat-w102775326",
    "name": "Haugajnars naturreservat",
    "category": "natur",
    "lat": 57.191168,
    "lng": 18.196403,
    "description": "Naturreservat"
  },
  {
    "id": "haukmyr-w533013695",
    "name": "Haukmyr",
    "category": "natur",
    "lat": 57.884993,
    "lng": 18.736287,
    "description": "Naturupplevelse"
  },
  {
    "id": "havdhem-kyrka-w528255799",
    "name": "Havdhem kyrka",
    "category": "sevardhet",
    "lat": 57.162582,
    "lng": 18.323301,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "havdhem-skeppssattningar-n6374182223",
    "name": "Havdhem Skeppssättningar",
    "category": "sevardhet",
    "lat": 57.180693,
    "lng": 18.342087,
    "description": "Historisk plats"
  },
  {
    "id": "havors-fornborg-n1853513909",
    "name": "Havors fornborg",
    "category": "sevardhet",
    "lat": 57.21586,
    "lng": 18.319481,
    "description": "Historisk plats"
  },
  {
    "id": "hednakyrkogarden-fornborg-w533037103",
    "name": "Hednakyrkogården - Fornborg",
    "category": "sevardhet",
    "lat": 57.885998,
    "lng": 18.726509,
    "description": "Historisk plats"
  },
  {
    "id": "hejde-kyrka-w549170449",
    "name": "Hejde kyrka",
    "category": "sevardhet",
    "lat": 57.412756,
    "lng": 18.346097,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hejdeby-kyrka-w528236268",
    "name": "Hejdeby kyrka",
    "category": "sevardhet",
    "lat": 57.630449,
    "lng": 18.442787,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hejdebyhojdens-naturreservat-w1231234775",
    "name": "Hejdebyhöjdens naturreservat",
    "category": "natur",
    "lat": 57.618286,
    "lng": 18.419686,
    "description": "Naturreservat"
  },
  {
    "id": "hejnum-hallars-naturreservat-r12201831",
    "name": "Hejnum hällars naturreservat",
    "category": "natur",
    "lat": 57.679581,
    "lng": 18.654402,
    "description": "Naturreservat"
  },
  {
    "id": "hejnum-kallgate-naturreservat-r12201830",
    "name": "Hejnum Kallgate naturreservat",
    "category": "natur",
    "lat": 57.686045,
    "lng": 18.692464,
    "description": "Naturreservat"
  },
  {
    "id": "hejnums-kyrka-w1191859370",
    "name": "Hejnums kyrka",
    "category": "sevardhet",
    "lat": 57.680148,
    "lng": 18.632014,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "helges-hage-naturreservat-w528208442",
    "name": "Helges hage naturreservat",
    "category": "natur",
    "lat": 57.310847,
    "lng": 18.17806,
    "description": "Naturreservat"
  },
  {
    "id": "helgumannens-fiskelage-n6631038862",
    "name": "Helgumannens fiskeläge",
    "category": "sevardhet",
    "lat": 57.980598,
    "lng": 19.132328,
    "description": "Besöksmål"
  },
  {
    "id": "helige-andes-kyrkoruin-w434370801",
    "name": "Helige Andes kyrkoruin",
    "category": "sevardhet",
    "lat": 57.643072,
    "lng": 18.298376,
    "description": "Besöksmål"
  },
  {
    "id": "hellvi-kyrka-w1029666578",
    "name": "Hellvi kyrka",
    "category": "sevardhet",
    "lat": 57.775098,
    "lng": 18.895228,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hemmakvall-n5125961378",
    "name": "Hemmakväll",
    "category": "shopping",
    "lat": 57.636455,
    "lng": 18.301213,
    "description": "Butik"
  },
  {
    "id": "hemse-fisk-affar-n11054456583",
    "name": "Hemse Fisk Affär",
    "category": "shopping",
    "lat": 57.240031,
    "lng": 18.377422,
    "description": "Butik"
  },
  {
    "id": "hemse-krog-bar-n11054456586",
    "name": "Hemse Krog & Bar",
    "category": "mat",
    "lat": 57.239674,
    "lng": 18.376319,
    "description": "Pub"
  },
  {
    "id": "hemse-krut-och-pappershandel-n11080928354",
    "name": "Hemse Krut och Pappershandel",
    "category": "shopping",
    "lat": 57.238938,
    "lng": 18.375861,
    "description": "Butik"
  },
  {
    "id": "hemse-kyrka-w1070695750",
    "name": "Hemse kyrka",
    "category": "sevardhet",
    "lat": 57.232904,
    "lng": 18.373037,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "herrgardsklints-fornborg-w530624485",
    "name": "Herrgårdsklints Fornborg",
    "category": "sevardhet",
    "lat": 57.399934,
    "lng": 18.745959,
    "description": "Historisk plats"
  },
  {
    "id": "herrgardsklints-naturreservat-r10249733",
    "name": "Herrgårdsklints naturreservat",
    "category": "natur",
    "lat": 57.402714,
    "lng": 18.738708,
    "description": "Naturreservat"
  },
  {
    "id": "herrvik-n2091585389",
    "name": "Herrvik",
    "category": "aktivitet",
    "lat": 57.423066,
    "lng": 18.915271,
    "description": "Småbåtshamn"
  },
  {
    "id": "herte-n2088952296",
    "name": "Herte",
    "category": "aktivitet",
    "lat": 57.21768,
    "lng": 18.592531,
    "description": "Småbåtshamn"
  },
  {
    "id": "herte-n8841697023",
    "name": "Herte",
    "category": "strand",
    "lat": 57.219096,
    "lng": 18.59822,
    "description": "Badplats"
  },
  {
    "id": "herte-camping-n282839146",
    "name": "Herte camping",
    "category": "boende",
    "lat": 57.220953,
    "lng": 18.588857,
    "description": "Camping"
  },
  {
    "id": "hesselby-jernvagskafe-w427277626",
    "name": "Hesselby Jernvägskafé",
    "category": "mat",
    "lat": 57.544063,
    "lng": 18.531175,
    "description": "Café"
  },
  {
    "id": "hideviken-n4291157995",
    "name": "Hideviken",
    "category": "strand",
    "lat": 57.736074,
    "lng": 18.878618,
    "description": "Badplats"
  },
  {
    "id": "hideviken-r7611526",
    "name": "Hideviken",
    "category": "natur",
    "lat": 57.727432,
    "lng": 18.869134,
    "description": "Naturreservat"
  },
  {
    "id": "hideviken-beachvolley-w1484673566",
    "name": "Hideviken Beachvolley",
    "category": "aktivitet",
    "lat": 57.736223,
    "lng": 18.876967,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "hima-n11691721489",
    "name": "Hima",
    "category": "shopping",
    "lat": 57.637289,
    "lng": 18.301021,
    "description": "Butik"
  },
  {
    "id": "hinsers-naturreservat-w895701667",
    "name": "Hinsers naturreservat",
    "category": "natur",
    "lat": 57.571743,
    "lng": 18.781903,
    "description": "Naturreservat"
  },
  {
    "id": "hit-rann-blodet-n6700033551",
    "name": "Hit rann blodet",
    "category": "sevardhet",
    "lat": 57.637971,
    "lng": 18.289089,
    "description": "Historisk plats"
  },
  {
    "id": "hjulkorsgraven-w680690472",
    "name": "Hjulkorsgraven",
    "category": "sevardhet",
    "lat": 57.796485,
    "lng": 18.526407,
    "description": "Historisk plats"
  },
  {
    "id": "hoburgsgubben-n4740781279",
    "name": "Hoburgsgubben",
    "category": "sevardhet",
    "lat": 56.92246,
    "lng": 18.129387,
    "description": "Besöksmål"
  },
  {
    "id": "hoburgsmyr-r7611518",
    "name": "Hoburgsmyr",
    "category": "natur",
    "lat": 57.822818,
    "lng": 18.848154,
    "description": "Naturreservat"
  },
  {
    "id": "hogran-kyrka-w1191878781",
    "name": "Hogrän kyrka",
    "category": "sevardhet",
    "lat": 57.504645,
    "lng": 18.307878,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "hojgards-myr-w530655723",
    "name": "Hojgards Myr",
    "category": "natur",
    "lat": 57.529655,
    "lng": 18.132462,
    "description": "Naturupplevelse"
  },
  {
    "id": "hojmyr-w533037027",
    "name": "Hojmyr",
    "category": "natur",
    "lat": 57.790093,
    "lng": 18.709062,
    "description": "Naturupplevelse"
  },
  {
    "id": "holmhallar-r7091064",
    "name": "Holmhällar",
    "category": "natur",
    "lat": 56.932067,
    "lng": 18.291912,
    "description": "Naturreservat"
  },
  {
    "id": "holmhallar-pensionat-n9272286438",
    "name": "Holmhällar Pensionat",
    "category": "service",
    "lat": 56.935108,
    "lng": 18.288008,
    "description": "Laddstation"
  },
  {
    "id": "holmvat-w485224681",
    "name": "Holmvät",
    "category": "natur",
    "lat": 57.909457,
    "lng": 19.091795,
    "description": "Naturupplevelse"
  },
  {
    "id": "honnorsparken-graffiti-wall-w1534502296",
    "name": "Honnörsparken Graffiti Wall",
    "category": "sevardhet",
    "lat": 57.627029,
    "lng": 18.308808,
    "description": "Sevärdhet"
  },
  {
    "id": "honnorsparken-playground-w1534502295",
    "name": "Honnörsparken playground",
    "category": "familj",
    "lat": 57.627153,
    "lng": 18.30832,
    "description": "Lekplats"
  },
  {
    "id": "hopp-poolen-w1087514339",
    "name": "Hopp-poolen",
    "category": "aktivitet",
    "lat": 57.608753,
    "lng": 18.244662,
    "description": "Aktivitet"
  },
  {
    "id": "horsan-w102775288",
    "name": "Horsan",
    "category": "natur",
    "lat": 57.868949,
    "lng": 18.837499,
    "description": "Naturreservat"
  },
  {
    "id": "hotel-slottsbacken-w529368087",
    "name": "Hotel Slottsbacken",
    "category": "boende",
    "lat": 57.63633,
    "lng": 18.289445,
    "description": "Hotell"
  },
  {
    "id": "hotel-stelor-n5688752831",
    "name": "Hotel Stelor",
    "category": "boende",
    "lat": 57.447701,
    "lng": 18.141958,
    "description": "Hotell"
  },
  {
    "id": "hotel-villa-alma-n316140653",
    "name": "Hotel Villa Alma",
    "category": "boende",
    "lat": 57.641268,
    "lng": 18.29017,
    "description": "Hotell"
  },
  {
    "id": "hotell-breda-blick-n2320589453",
    "name": "Hotell Breda Blick",
    "category": "boende",
    "lat": 57.644514,
    "lng": 18.296528,
    "description": "Hotell"
  },
  {
    "id": "hotell-dalhem-n1313834231",
    "name": "Hotell Dalhem",
    "category": "boende",
    "lat": 57.533521,
    "lng": 18.50557,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "hotell-repet-n11831864193",
    "name": "Hotell Repet",
    "category": "boende",
    "lat": 57.638911,
    "lng": 18.297179,
    "description": "Hotell"
  },
  {
    "id": "hotell-s-t-clemens-n11831909506",
    "name": "Hotell S:t Clemens",
    "category": "boende",
    "lat": 57.643022,
    "lng": 18.295761,
    "description": "Hotell"
  },
  {
    "id": "hotell-solhem-n10740046640",
    "name": "Hotell Solhem",
    "category": "service",
    "lat": 57.63479,
    "lng": 18.28695,
    "description": "Laddstation"
  },
  {
    "id": "hotell-stenugnen-n1470547034",
    "name": "Hotell Stenugnen",
    "category": "boende",
    "lat": 57.638225,
    "lng": 18.289574,
    "description": "Hotell"
  },
  {
    "id": "hotell-villa-borgen-n766160687",
    "name": "Hotell Villa Borgen",
    "category": "boende",
    "lat": 57.636189,
    "lng": 18.293156,
    "description": "Hotell"
  },
  {
    "id": "hoxelmyr-w530657874",
    "name": "Hoxelmyr",
    "category": "natur",
    "lat": 57.346029,
    "lng": 18.219076,
    "description": "Naturupplevelse"
  },
  {
    "id": "hoxelmyr-w530657876",
    "name": "Hoxelmyr",
    "category": "natur",
    "lat": 57.35228,
    "lng": 18.218958,
    "description": "Naturupplevelse"
  },
  {
    "id": "hultungsmyr-w532076137",
    "name": "Hultungsmyr",
    "category": "natur",
    "lat": 57.836408,
    "lng": 18.998296,
    "description": "Naturupplevelse"
  },
  {
    "id": "husken-w102775747",
    "name": "Husken",
    "category": "natur",
    "lat": 57.774755,
    "lng": 18.978519,
    "description": "Naturreservat"
  },
  {
    "id": "husman-n933085037",
    "name": "Husman",
    "category": "mat",
    "lat": 57.645851,
    "lng": 18.328042,
    "description": "Restaurang"
  },
  {
    "id": "husmorsalvret-r7639891",
    "name": "Husmorsalvret",
    "category": "natur",
    "lat": 57.939034,
    "lng": 19.184853,
    "description": "Naturupplevelse"
  },
  {
    "id": "husrygg-r7084995",
    "name": "Husrygg",
    "category": "natur",
    "lat": 56.942772,
    "lng": 18.154417,
    "description": "Naturreservat"
  },
  {
    "id": "hwitstjarna-n273770560",
    "name": "Hwitstjärna",
    "category": "mat",
    "lat": 57.615373,
    "lng": 18.284301,
    "description": "Restaurang"
  },
  {
    "id": "hangers-kalla-n2459344843",
    "name": "Hångers källa",
    "category": "natur",
    "lat": 57.791273,
    "lng": 18.746968,
    "description": "Naturupplevelse"
  },
  {
    "id": "haftingsklint-n2459344842",
    "name": "Häftingsklint",
    "category": "smultronstallen",
    "lat": 57.883802,
    "lng": 18.623435,
    "description": "Utsiktsplats"
  },
  {
    "id": "hagmyr-w533169177",
    "name": "Hägmyr",
    "category": "natur",
    "lat": 57.753572,
    "lng": 18.663352,
    "description": "Naturupplevelse"
  },
  {
    "id": "hagsarve-karrangs-naturreservat-w102775350",
    "name": "Hägsarve kärrängs naturreservat",
    "category": "natur",
    "lat": 57.164979,
    "lng": 18.191552,
    "description": "Naturreservat"
  },
  {
    "id": "hajdeklint-r7100666",
    "name": "Häjdeklint",
    "category": "natur",
    "lat": 57.855294,
    "lng": 19.10471,
    "description": "Naturupplevelse"
  },
  {
    "id": "hallhagen-w465495971",
    "name": "Hällhagen",
    "category": "natur",
    "lat": 57.631627,
    "lng": 18.354085,
    "description": "Naturupplevelse"
  },
  {
    "id": "hallholmens-naturreservat-w1353462749",
    "name": "Hällholmens naturreservat",
    "category": "natur",
    "lat": 57.726626,
    "lng": 18.445229,
    "description": "Naturreservat"
  },
  {
    "id": "halltrask-w379459651",
    "name": "Hällträsk",
    "category": "natur",
    "lat": 57.438592,
    "lng": 18.794651,
    "description": "Naturupplevelse"
  },
  {
    "id": "hassle-backe-w102775372",
    "name": "Hässle backe",
    "category": "natur",
    "lat": 57.419467,
    "lng": 18.910519,
    "description": "Naturreservat"
  },
  {
    "id": "hasslemyr-w432605114",
    "name": "Hässlemyr",
    "category": "natur",
    "lat": 57.900245,
    "lng": 18.886739,
    "description": "Naturupplevelse"
  },
  {
    "id": "hasslemyr-w485430546",
    "name": "Hässlemyr",
    "category": "natur",
    "lat": 57.920444,
    "lng": 19.102219,
    "description": "Naturupplevelse"
  },
  {
    "id": "hastarnas-dal-w531813267",
    "name": "Hästarnas Dal",
    "category": "familj",
    "lat": 57.639263,
    "lng": 18.300858,
    "description": "Lekplats"
  },
  {
    "id": "hasthagavat-w482347206",
    "name": "Hästhagavät",
    "category": "natur",
    "lat": 57.884836,
    "lng": 19.101823,
    "description": "Naturupplevelse"
  },
  {
    "id": "hastvat-w533037039",
    "name": "Hästvät",
    "category": "natur",
    "lat": 57.800922,
    "lng": 18.650295,
    "description": "Naturupplevelse"
  },
  {
    "id": "hogklint-n279987685",
    "name": "Högklint",
    "category": "sevardhet",
    "lat": 57.600025,
    "lng": 18.201609,
    "description": "Besöksmål"
  },
  {
    "id": "hogklint-w102776287",
    "name": "Högklint",
    "category": "natur",
    "lat": 57.596222,
    "lng": 18.195977,
    "description": "Naturreservat"
  },
  {
    "id": "hogklint-utsiktsvagen-6-n10740046611",
    "name": "Högklint Utsiktsvägen 6",
    "category": "service",
    "lat": 57.59869,
    "lng": 18.20478,
    "description": "Laddstation"
  },
  {
    "id": "hogt-och-lagt-w1414328573",
    "name": "Högt och Lågt",
    "category": "aktivitet",
    "lat": 57.39495,
    "lng": 18.192003,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "horsne-kyrka-w611593275",
    "name": "Hörsne kyrka",
    "category": "sevardhet",
    "lat": 57.558471,
    "lng": 18.597484,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "horsne-prastange-w102775336",
    "name": "Hörsne prästänge",
    "category": "natur",
    "lat": 57.56739,
    "lng": 18.608054,
    "description": "Naturreservat"
  },
  {
    "id": "i-love-pizza-n763160583",
    "name": "I love pizza",
    "category": "mat",
    "lat": 57.636577,
    "lng": 18.293937,
    "description": "Restaurang"
  },
  {
    "id": "ica-bungehallen-w431979233",
    "name": "ICA Bungehallen",
    "category": "shopping",
    "lat": 57.86334,
    "lng": 19.054617,
    "description": "Butik"
  },
  {
    "id": "ica-maxi-arena-w483446137",
    "name": "Ica Maxi Arena",
    "category": "aktivitet",
    "lat": 57.606724,
    "lng": 18.281533,
    "description": "Idrottsanläggning"
  },
  {
    "id": "ica-nystroms-w502110264",
    "name": "ICA Nyströms",
    "category": "shopping",
    "lat": 57.961823,
    "lng": 19.238593,
    "description": "Butik"
  },
  {
    "id": "ica-nara-n4959061081",
    "name": "ICA Nära",
    "category": "shopping",
    "lat": 57.160796,
    "lng": 18.333662,
    "description": "Butik"
  },
  {
    "id": "ica-nara-w480097957",
    "name": "ICA Nära",
    "category": "shopping",
    "lat": 57.64708,
    "lng": 18.310594,
    "description": "Butik"
  },
  {
    "id": "ica-nara-bodi-w414817656",
    "name": "ICA Nära Bodi",
    "category": "shopping",
    "lat": 57.259465,
    "lng": 18.636367,
    "description": "Butik"
  },
  {
    "id": "ica-nara-hoburgshallen-w550730125",
    "name": "ICA Nära Hoburgshallen",
    "category": "shopping",
    "lat": 57.03196,
    "lng": 18.277346,
    "description": "Butik"
  },
  {
    "id": "ica-nara-malmahallen-w203242134",
    "name": "ICA Nära Malmahallen",
    "category": "shopping",
    "lat": 57.280253,
    "lng": 18.47097,
    "description": "Butik"
  },
  {
    "id": "ica-nara-roma-w305107185",
    "name": "ICA Nära Roma",
    "category": "shopping",
    "lat": 57.503232,
    "lng": 18.457358,
    "description": "Butik"
  },
  {
    "id": "ica-nara-slite-w378723275",
    "name": "ICA Nära Slite",
    "category": "shopping",
    "lat": 57.704423,
    "lng": 18.805544,
    "description": "Butik"
  },
  {
    "id": "ica-supermarket-atterdags-n54043636",
    "name": "ICA Supermarket Atterdags",
    "category": "shopping",
    "lat": 57.633506,
    "lng": 18.289627,
    "description": "Butik"
  },
  {
    "id": "ica-supermarket-hemse-n272661780",
    "name": "ICA Supermarket Hemse",
    "category": "shopping",
    "lat": 57.240198,
    "lng": 18.376766,
    "description": "Butik"
  },
  {
    "id": "ica-torgkassen-n315981758",
    "name": "ICA Torgkassen",
    "category": "shopping",
    "lat": 57.640824,
    "lng": 18.2964,
    "description": "Butik"
  },
  {
    "id": "ica-vibblehallen-w415574775",
    "name": "ICA Vibblehallen",
    "category": "shopping",
    "lat": 57.601482,
    "lng": 18.251282,
    "description": "Butik"
  },
  {
    "id": "ica-wisborg-w315912053",
    "name": "Ica Wisborg",
    "category": "shopping",
    "lat": 57.61745,
    "lng": 18.284185,
    "description": "Butik"
  },
  {
    "id": "icander-n12907583546",
    "name": "Icander",
    "category": "mat",
    "lat": 57.623629,
    "lng": 18.323116,
    "description": "Restaurang"
  },
  {
    "id": "ihre-gard-w978846821",
    "name": "Ihre Gård",
    "category": "boende",
    "lat": 57.832797,
    "lng": 18.607952,
    "description": "Vandrarhem"
  },
  {
    "id": "ihre-gard-cafe-n454142152",
    "name": "Ihre Gård Café",
    "category": "mat",
    "lat": 57.830786,
    "lng": 18.608214,
    "description": "Café"
  },
  {
    "id": "incharge-n9123546782",
    "name": "InCharge",
    "category": "service",
    "lat": 57.863422,
    "lng": 19.054142,
    "description": "Laddstation"
  },
  {
    "id": "incharge-n10740046608",
    "name": "InCharge",
    "category": "service",
    "lat": 57.24045,
    "lng": 18.37558,
    "description": "Laddstation"
  },
  {
    "id": "incharge-n10740046615",
    "name": "InCharge",
    "category": "service",
    "lat": 57.66129,
    "lng": 18.33779,
    "description": "Laddstation"
  },
  {
    "id": "incharge-hamnkrogen-herrvik-n9272091873",
    "name": "InCharge Hamnkrogen Herrvik",
    "category": "service",
    "lat": 57.422032,
    "lng": 18.916338,
    "description": "Laddstation"
  },
  {
    "id": "incharge-nasudden-n10740046630",
    "name": "InCharge Näsudden",
    "category": "service",
    "lat": 57.07413,
    "lng": 18.22159,
    "description": "Laddstation"
  },
  {
    "id": "incharge-storgatan-68-n10740046626",
    "name": "InCharge Storgatan 68",
    "category": "service",
    "lat": 57.703053,
    "lng": 18.801019,
    "description": "Laddstation"
  },
  {
    "id": "incharge-verkstadsgatan-9-n10740046609",
    "name": "InCharge Verkstadsgatan 9",
    "category": "service",
    "lat": 57.38715,
    "lng": 18.203999,
    "description": "Laddstation"
  },
  {
    "id": "indian-corner-n11691721492",
    "name": "Indian Corner",
    "category": "mat",
    "lat": 57.637997,
    "lng": 18.299309,
    "description": "Restaurang"
  },
  {
    "id": "ingo-n687936949",
    "name": "Ingo",
    "category": "service",
    "lat": 57.860145,
    "lng": 19.051101,
    "description": "Bensinstation"
  },
  {
    "id": "innebandycenter-w514141846",
    "name": "Innebandycenter",
    "category": "aktivitet",
    "lat": 57.611559,
    "lng": 18.28182,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "inre-dynkarret-w590266421",
    "name": "Inre dynkärret",
    "category": "natur",
    "lat": 58.393198,
    "lng": 19.17955,
    "description": "Naturupplevelse"
  },
  {
    "id": "ireviken-r14895025",
    "name": "Ireviken",
    "category": "strand",
    "lat": 57.842319,
    "lng": 18.595947,
    "description": "Badstrand"
  },
  {
    "id": "irean-w528208504",
    "name": "Ireån",
    "category": "natur",
    "lat": 57.839153,
    "lng": 18.598844,
    "description": "Naturreservat"
  },
  {
    "id": "irisdals-blomsterhandel-n12909501919",
    "name": "Irisdals Blomsterhandel",
    "category": "shopping",
    "lat": 57.638947,
    "lng": 18.297405,
    "description": "Butik"
  },
  {
    "id": "irisdalsgatan-n10740046632",
    "name": "Irisdalsgatan",
    "category": "service",
    "lat": 57.64001,
    "lng": 18.31668,
    "description": "Laddstation"
  },
  {
    "id": "irmas-cafe-n2397150489",
    "name": "Irmas Café",
    "category": "mat",
    "lat": 57.595954,
    "lng": 18.514924,
    "description": "Café"
  },
  {
    "id": "isola-bella-n315872054",
    "name": "Isola Bella",
    "category": "mat",
    "lat": 57.641155,
    "lng": 18.297053,
    "description": "Restaurang"
  },
  {
    "id": "italienaren-n3034228932",
    "name": "Italienaren",
    "category": "mat",
    "lat": 57.638938,
    "lng": 18.291664,
    "description": "Restaurang"
  },
  {
    "id": "jauvika-fiskelage-r7297871",
    "name": "Jauvika fiskeläge",
    "category": "sevardhet",
    "lat": 57.948832,
    "lng": 19.099052,
    "description": "Besöksmål"
  },
  {
    "id": "jernvagshostel-n766160686",
    "name": "Jernvägshostel",
    "category": "boende",
    "lat": 57.636277,
    "lng": 18.293235,
    "description": "Vandrarhem"
  },
  {
    "id": "jessens-saluhall-bar-n4324785897",
    "name": "Jessens Saluhall & Bar",
    "category": "mat",
    "lat": 57.639038,
    "lng": 18.297137,
    "description": "Restaurang"
  },
  {
    "id": "jidapha-thai-n11080905748",
    "name": "Jidapha Thai",
    "category": "mat",
    "lat": 57.238249,
    "lng": 18.374785,
    "description": "Restaurang"
  },
  {
    "id": "joda-bar-kok-n272283508",
    "name": "joda bar & kök",
    "category": "mat",
    "lat": 57.638373,
    "lng": 18.28875,
    "description": "Restaurang"
  },
  {
    "id": "jordnara-n6567691885",
    "name": "Jordnära",
    "category": "shopping",
    "lat": 57.640454,
    "lng": 18.294926,
    "description": "Butik"
  },
  {
    "id": "josefinakallan-n80024855",
    "name": "Josefinakällan",
    "category": "natur",
    "lat": 57.634189,
    "lng": 18.282982,
    "description": "Naturupplevelse"
  },
  {
    "id": "jungfrun-n454150000",
    "name": "Jungfrun",
    "category": "natur",
    "lat": 57.829734,
    "lng": 18.504682,
    "description": "Naturupplevelse"
  },
  {
    "id": "jungfrutornet-w1111524902",
    "name": "Jungfrutornet",
    "category": "sevardhet",
    "lat": 57.64631,
    "lng": 18.295561,
    "description": "Historisk plats"
  },
  {
    "id": "jusarve-skog-w102776309",
    "name": "Jusarve skog",
    "category": "natur",
    "lat": 57.577075,
    "lng": 18.699323,
    "description": "Naturreservat"
  },
  {
    "id": "jarnaldersgrav-n6651668069",
    "name": "Järnåldersgrav",
    "category": "sevardhet",
    "lat": 57.289473,
    "lng": 17.972938,
    "description": "Historisk plats"
  },
  {
    "id": "kafe-strandporten-n2975327257",
    "name": "Kafé Strandporten",
    "category": "mat",
    "lat": 57.640102,
    "lng": 18.292672,
    "description": "Café"
  },
  {
    "id": "kafe-tva-tanter-n2397150493",
    "name": "Kafé Två Tanter",
    "category": "mat",
    "lat": 57.70473,
    "lng": 18.805123,
    "description": "Café"
  },
  {
    "id": "kaffepannan-n448272971",
    "name": "Kaffepannan",
    "category": "natur",
    "lat": 57.943767,
    "lng": 19.088102,
    "description": "Besöksmål"
  },
  {
    "id": "kaffestuga-n6620946716",
    "name": "Kaffestuga",
    "category": "mat",
    "lat": 56.991865,
    "lng": 18.247113,
    "description": "Café"
  },
  {
    "id": "kalbjargatrask-w498101681",
    "name": "Kalbjärgaträsk",
    "category": "natur",
    "lat": 57.971042,
    "lng": 19.174522,
    "description": "Naturupplevelse"
  },
  {
    "id": "kalbjarghobben-n4341704703",
    "name": "Kalbjärghobben",
    "category": "natur",
    "lat": 57.969009,
    "lng": 19.193466,
    "description": "Naturupplevelse"
  },
  {
    "id": "kalk-hotel-n316140379",
    "name": "Kalk Hotel",
    "category": "boende",
    "lat": 57.640143,
    "lng": 18.292434,
    "description": "Hotell"
  },
  {
    "id": "kalkbrottets-vandrarhem-n12869191201",
    "name": "Kalkbrottets vandrarhem",
    "category": "boende",
    "lat": 57.709481,
    "lng": 18.79216,
    "description": "Vandrarhem"
  },
  {
    "id": "kalkladan-n2973076805",
    "name": "Kalkladan",
    "category": "mat",
    "lat": 57.823219,
    "lng": 19.080805,
    "description": "Restaurang"
  },
  {
    "id": "kalkugn-n4754525292",
    "name": "Kalkugn",
    "category": "sevardhet",
    "lat": 57.891146,
    "lng": 19.086023,
    "description": "Historisk plats"
  },
  {
    "id": "kallenbergs-villa-w1306526439",
    "name": "Kallenbergs Villa",
    "category": "boende",
    "lat": 57.610903,
    "lng": 18.247066,
    "description": "Hotell"
  },
  {
    "id": "kallgatburgs-naturreservat-w102775285",
    "name": "Kallgatburgs naturreservat",
    "category": "natur",
    "lat": 57.693879,
    "lng": 18.680723,
    "description": "Naturreservat"
  },
  {
    "id": "kapitelhusgarden-n14000982103",
    "name": "Kapitelhusgården",
    "category": "mat",
    "lat": 57.64181,
    "lng": 18.295939,
    "description": "Restaurang"
  },
  {
    "id": "kappahl-n5167647904",
    "name": "KappAhl",
    "category": "shopping",
    "lat": 57.637399,
    "lng": 18.300755,
    "description": "Butik"
  },
  {
    "id": "kappelshamns-camping-w1083462564",
    "name": "Kappelshamns Camping",
    "category": "boende",
    "lat": 57.845333,
    "lng": 18.781208,
    "description": "Camping"
  },
  {
    "id": "kappelshamns-sandstrand-n11065575649",
    "name": "Kappelshamns sandstrand",
    "category": "strand",
    "lat": 57.85341,
    "lng": 18.782616,
    "description": "Badstrand"
  },
  {
    "id": "kappelshamns-veranda-n454128977",
    "name": "Kappelshamns Veranda",
    "category": "mat",
    "lat": 57.852488,
    "lng": 18.781714,
    "description": "Restaurang"
  },
  {
    "id": "karamell-boden-n12909482242",
    "name": "Karamell Boden",
    "category": "shopping",
    "lat": 57.639918,
    "lng": 18.296374,
    "description": "Butik"
  },
  {
    "id": "karaoke-baren-visby-n2970715907",
    "name": "Karaoke Baren Visby",
    "category": "mat",
    "lat": 57.636086,
    "lng": 18.293278,
    "description": "Bar"
  },
  {
    "id": "karlsvards-fastning-w294889377",
    "name": "Karlsvärds fästning",
    "category": "sevardhet",
    "lat": 57.695491,
    "lng": 18.821171,
    "description": "Historisk plats"
  },
  {
    "id": "karlsorestaurangen-n2342987596",
    "name": "Karlsörestaurangen",
    "category": "mat",
    "lat": 57.289264,
    "lng": 17.970245,
    "description": "Restaurang"
  },
  {
    "id": "kasai-n13007309861",
    "name": "Kasai",
    "category": "mat",
    "lat": 57.639153,
    "lng": 18.296702,
    "description": "Restaurang"
  },
  {
    "id": "katolska-kyrkan-i-visby-w508436745",
    "name": "Katolska kyrkan i Visby",
    "category": "sevardhet",
    "lat": 57.64221,
    "lng": 18.295437,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "katthammarsvik-n2091639427",
    "name": "Katthammarsvik",
    "category": "aktivitet",
    "lat": 57.43542,
    "lng": 18.851016,
    "description": "Småbåtshamn"
  },
  {
    "id": "katthammarsviks-rokeri-n434439713",
    "name": "Katthammarsviks rökeri",
    "category": "mat",
    "lat": 57.435741,
    "lng": 18.85225,
    "description": "Restaurang"
  },
  {
    "id": "kauparve-rose-n2338340536",
    "name": "Kauparve röse",
    "category": "sevardhet",
    "lat": 57.80392,
    "lng": 18.808858,
    "description": "Historisk plats"
  },
  {
    "id": "kicks-n11691721484",
    "name": "Kicks",
    "category": "shopping",
    "lat": 57.637758,
    "lng": 18.301156,
    "description": "Butik"
  },
  {
    "id": "kinnerstugan-w361624423",
    "name": "Kinnerstugan",
    "category": "aktivitet",
    "lat": 57.75376,
    "lng": 18.417464,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "kiosk-n12007256624",
    "name": "Kiosk",
    "category": "shopping",
    "lat": 57.614947,
    "lng": 18.760951,
    "description": "Butik"
  },
  {
    "id": "kistanges-naturreservat-w897784134",
    "name": "Kistänges naturreservat",
    "category": "natur",
    "lat": 57.15764,
    "lng": 18.354509,
    "description": "Naturreservat"
  },
  {
    "id": "kitchen-table-altan-n2973536550",
    "name": "Kitchen & Table Altan",
    "category": "mat",
    "lat": 57.638851,
    "lng": 18.291248,
    "description": "Bar"
  },
  {
    "id": "klajvan-r20111925",
    "name": "Klajvan",
    "category": "natur",
    "lat": 56.922605,
    "lng": 18.152796,
    "description": "Naturupplevelse"
  },
  {
    "id": "klinte-kyrka-w229011475",
    "name": "Klinte kyrka",
    "category": "sevardhet",
    "lat": 57.378403,
    "lng": 18.232233,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "klintehamn-n632446397",
    "name": "Klintehamn",
    "category": "service",
    "lat": 57.388948,
    "lng": 18.185237,
    "description": "Färjeterminal"
  },
  {
    "id": "klintehamns-smabatshamn-r12665315",
    "name": "Klintehamns småbåtshamn",
    "category": "aktivitet",
    "lat": 57.388978,
    "lng": 18.190052,
    "description": "Småbåtshamn"
  },
  {
    "id": "klinteklinten-r7611520",
    "name": "Klinteklinten",
    "category": "natur",
    "lat": 57.670461,
    "lng": 18.773947,
    "description": "Naturreservat"
  },
  {
    "id": "klintskog-n4341704707",
    "name": "Klintskog",
    "category": "natur",
    "lat": 57.683638,
    "lng": 18.651169,
    "description": "Naturupplevelse"
  },
  {
    "id": "klosterange-w102775691",
    "name": "Klosteränge",
    "category": "natur",
    "lat": 57.498056,
    "lng": 18.489418,
    "description": "Naturreservat"
  },
  {
    "id": "kladbutiken-n11054456591",
    "name": "Klädbutiken",
    "category": "shopping",
    "lat": 57.239338,
    "lng": 18.375822,
    "description": "Butik"
  },
  {
    "id": "kneippbyn-n10740026998",
    "name": "Kneippbyn",
    "category": "service",
    "lat": 57.61042,
    "lng": 18.246485,
    "description": "Laddstation"
  },
  {
    "id": "kneippbyn-r14986026",
    "name": "Kneippbyn",
    "category": "boende",
    "lat": 57.609486,
    "lng": 18.241142,
    "description": "Camping"
  },
  {
    "id": "kneippbyn-minilivs-w511822750",
    "name": "Kneippbyn Minilivs",
    "category": "shopping",
    "lat": 57.608431,
    "lng": 18.245515,
    "description": "Butik"
  },
  {
    "id": "kneippbyn-sommarland-w232286256",
    "name": "Kneippbyn Sommarland",
    "category": "familj",
    "lat": 57.610774,
    "lng": 18.245014,
    "description": "Temapark"
  },
  {
    "id": "kneippbyn-vattenland-w232286255",
    "name": "Kneippbyn vattenland",
    "category": "familj",
    "lat": 57.608655,
    "lng": 18.244006,
    "description": "Vattenpark"
  },
  {
    "id": "knappviken-w524512013",
    "name": "Knäppviken",
    "category": "natur",
    "lat": 57.702486,
    "lng": 18.784043,
    "description": "Naturupplevelse"
  },
  {
    "id": "kogangsmyr-w525649511",
    "name": "Kogangsmyr",
    "category": "natur",
    "lat": 57.413297,
    "lng": 18.480836,
    "description": "Naturupplevelse"
  },
  {
    "id": "kohagavat-w482648176",
    "name": "Kohagavät",
    "category": "natur",
    "lat": 57.886833,
    "lng": 19.09169,
    "description": "Naturupplevelse"
  },
  {
    "id": "kohagsvat-w530585459",
    "name": "Kohagsvät",
    "category": "natur",
    "lat": 57.713751,
    "lng": 18.598829,
    "description": "Naturupplevelse"
  },
  {
    "id": "konditori-norrgatt-n3819165500",
    "name": "Konditori Norrgatt",
    "category": "mat",
    "lat": 57.644921,
    "lng": 18.306213,
    "description": "Café"
  },
  {
    "id": "konditori-siesta-n6641676408",
    "name": "Konditori Siesta",
    "category": "mat",
    "lat": 57.637932,
    "lng": 18.300204,
    "description": "Café"
  },
  {
    "id": "konst-i-varn-pjv-kan-40-25-w1094452150",
    "name": "Konst i värn PJV KAN 40:25",
    "category": "sevardhet",
    "lat": 57.641318,
    "lng": 18.289543,
    "description": "Museum"
  },
  {
    "id": "konstnarshemmet-brucebo-w473683925",
    "name": "Konstnärshemmet Brucebo",
    "category": "sevardhet",
    "lat": 57.688193,
    "lng": 18.352476,
    "description": "Museum"
  },
  {
    "id": "kornakersmyr-w482269653",
    "name": "Kornakersmyr",
    "category": "natur",
    "lat": 57.883185,
    "lng": 19.150371,
    "description": "Naturupplevelse"
  },
  {
    "id": "krakas-n1313840985",
    "name": "Krakas",
    "category": "mat",
    "lat": 57.445925,
    "lng": 18.709528,
    "description": "Restaurang"
  },
  {
    "id": "krakvats-naturreservat-w102775307",
    "name": "Krakväts naturreservat",
    "category": "natur",
    "lat": 57.156268,
    "lng": 18.181311,
    "description": "Naturreservat"
  },
  {
    "id": "krampbroboden-n10764364326",
    "name": "Krampbroboden",
    "category": "shopping",
    "lat": 57.634246,
    "lng": 18.54145,
    "description": "Butik"
  },
  {
    "id": "krokstade-troskvandring-n1313923830",
    "name": "Krokstäde Tröskvandring",
    "category": "mat",
    "lat": 57.494045,
    "lng": 18.144331,
    "description": "Café"
  },
  {
    "id": "kronans-apotek-n1480393171",
    "name": "Kronans Apotek",
    "category": "service",
    "lat": 57.635049,
    "lng": 18.326984,
    "description": "Apotek"
  },
  {
    "id": "kronans-apotek-n1489880357",
    "name": "Kronans Apotek",
    "category": "service",
    "lat": 57.386224,
    "lng": 18.20061,
    "description": "Apotek"
  },
  {
    "id": "kronans-apotek-n12887191299",
    "name": "Kronans Apotek",
    "category": "service",
    "lat": 57.617571,
    "lng": 18.283992,
    "description": "Apotek"
  },
  {
    "id": "kronholmen-w102775354",
    "name": "Kronholmen",
    "category": "natur",
    "lat": 57.450585,
    "lng": 18.128585,
    "description": "Naturreservat"
  },
  {
    "id": "kronvalls-fislelage-n1489628660",
    "name": "Kronvalls Fisleläge",
    "category": "sevardhet",
    "lat": 57.281808,
    "lng": 18.097699,
    "description": "Besöksmål"
  },
  {
    "id": "kronvalls-skans-n1489966442",
    "name": "Kronvalls skans",
    "category": "sevardhet",
    "lat": 57.289127,
    "lng": 18.10299,
    "description": "Besöksmål"
  },
  {
    "id": "krukmakarens-hus-kafe-n11691721475",
    "name": "Krukmakarens Hus Kafe",
    "category": "mat",
    "lat": 57.639886,
    "lng": 18.293478,
    "description": "Café"
  },
  {
    "id": "krusmyntagarden-n454154943",
    "name": "Krusmyntagården",
    "category": "mat",
    "lat": 57.719898,
    "lng": 18.383039,
    "description": "Restaurang"
  },
  {
    "id": "krutbrannaren-n4408590183",
    "name": "Krutbrännaren",
    "category": "boende",
    "lat": 57.735935,
    "lng": 18.612292,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "kruttornet-w508436750",
    "name": "Kruttornet",
    "category": "sevardhet",
    "lat": 57.642275,
    "lng": 18.291369,
    "description": "Historisk plats"
  },
  {
    "id": "kraklingbo-12-1-n6373616301",
    "name": "Kräklingbo 12:1",
    "category": "sevardhet",
    "lat": 57.450402,
    "lng": 18.707385,
    "description": "Historisk plats"
  },
  {
    "id": "kraklingbo-kyrka-w379351817",
    "name": "Kräklingbo kyrka",
    "category": "sevardhet",
    "lat": 57.445242,
    "lng": 18.71134,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "kranku-n4394818796",
    "name": "Kränku",
    "category": "shopping",
    "lat": 57.63854,
    "lng": 18.293233,
    "description": "Butik"
  },
  {
    "id": "kullamyr-r7255021",
    "name": "Kullamyr",
    "category": "natur",
    "lat": 57.92458,
    "lng": 19.096911,
    "description": "Naturupplevelse"
  },
  {
    "id": "kullermyr-w379563632",
    "name": "Kullermyr",
    "category": "natur",
    "lat": 57.853272,
    "lng": 18.912969,
    "description": "Naturupplevelse"
  },
  {
    "id": "kulmilalunden-w482648165",
    "name": "Kulmilalunden",
    "category": "natur",
    "lat": 57.892716,
    "lng": 19.084764,
    "description": "Naturupplevelse"
  },
  {
    "id": "kundparkeringen-ica-maxi-visby-n10740046639",
    "name": "Kundparkeringen ICA Maxi Visby",
    "category": "service",
    "lat": 57.62442,
    "lng": 18.321879,
    "description": "Laddstation"
  },
  {
    "id": "kungens-sal-n12176664306",
    "name": "Kungens Sal",
    "category": "natur",
    "lat": 57.368236,
    "lng": 18.764893,
    "description": "Naturupplevelse"
  },
  {
    "id": "kustgrillen-n1489148260",
    "name": "Kustgrillen",
    "category": "mat",
    "lat": 57.387486,
    "lng": 18.200401,
    "description": "Snabbmat"
  },
  {
    "id": "kustparken-b-b-w431979389",
    "name": "Kustparken B&B",
    "category": "boende",
    "lat": 57.863661,
    "lng": 19.048232,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "kutamora-w482648177",
    "name": "Kutamora",
    "category": "natur",
    "lat": 57.888409,
    "lng": 19.095874,
    "description": "Naturupplevelse"
  },
  {
    "id": "kutens-bensin-creperie-tati-n2459477953",
    "name": "Kutens Bensin/Crêperie Tati",
    "category": "mat",
    "lat": 57.934004,
    "lng": 19.163022,
    "description": "Restaurang"
  },
  {
    "id": "kvarnhjulet-vid-lummelunds-bruk-n6716208649",
    "name": "Kvarnhjulet vid Lummelunds bruk",
    "category": "sevardhet",
    "lat": 57.739157,
    "lng": 18.405948,
    "description": "Besöksmål"
  },
  {
    "id": "kvarnmyr-w379563625",
    "name": "Kvarnmyr",
    "category": "natur",
    "lat": 57.772079,
    "lng": 18.672758,
    "description": "Naturupplevelse"
  },
  {
    "id": "kvarnmyr-w533013706",
    "name": "Kvarnmyr",
    "category": "natur",
    "lat": 57.916743,
    "lng": 18.717189,
    "description": "Naturupplevelse"
  },
  {
    "id": "kvie-kallmyrs-naturreservat-w102775328",
    "name": "Kvie källmyrs naturreservat",
    "category": "natur",
    "lat": 57.332531,
    "lng": 18.374797,
    "description": "Naturreservat"
  },
  {
    "id": "kvinnbrymyr-w464127877",
    "name": "Kvinnbrymyr",
    "category": "natur",
    "lat": 57.619056,
    "lng": 18.398508,
    "description": "Naturupplevelse"
  },
  {
    "id": "kvannmyr-w481318187",
    "name": "Kvännmyr",
    "category": "natur",
    "lat": 56.925391,
    "lng": 18.241678,
    "description": "Naturupplevelse"
  },
  {
    "id": "kyrkgatmyr-w532076134",
    "name": "Kyrkgatmyr",
    "category": "natur",
    "lat": 57.889889,
    "lng": 18.960793,
    "description": "Naturupplevelse"
  },
  {
    "id": "kaldu-n2406468457",
    "name": "Käldu",
    "category": "natur",
    "lat": 57.057494,
    "lng": 18.294782,
    "description": "Naturupplevelse"
  },
  {
    "id": "kaldange-naturreservat-w102775538",
    "name": "Käldänge naturreservat",
    "category": "natur",
    "lat": 57.314324,
    "lng": 18.609142,
    "description": "Naturreservat"
  },
  {
    "id": "kallinghagens-naturreservat-w102775565",
    "name": "Källinghagens naturreservat",
    "category": "natur",
    "lat": 57.416357,
    "lng": 18.815971,
    "description": "Naturreservat"
  },
  {
    "id": "kallunge-kyrka-w705213764",
    "name": "Källunge kyrka",
    "category": "sevardhet",
    "lat": 57.607827,
    "lng": 18.584841,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "karrmansmyr-r16561003",
    "name": "Kärrmansmyr",
    "category": "natur",
    "lat": 57.418306,
    "lng": 18.699082,
    "description": "Naturupplevelse"
  },
  {
    "id": "kolningsmyr-w379617745",
    "name": "Kölningsmyr",
    "category": "natur",
    "lat": 57.901819,
    "lng": 18.869703,
    "description": "Naturupplevelse"
  },
  {
    "id": "kolningstrask-w378759975",
    "name": "Kölningsträsk",
    "category": "natur",
    "lat": 57.901548,
    "lng": 18.872027,
    "description": "Naturupplevelse"
  },
  {
    "id": "korkmacken-w494551727",
    "name": "Körkmacken",
    "category": "service",
    "lat": 57.916815,
    "lng": 19.136286,
    "description": "Bensinstation"
  },
  {
    "id": "korsbarsgarden-n12090492989",
    "name": "Körsbärsgården",
    "category": "mat",
    "lat": 56.932491,
    "lng": 18.169015,
    "description": "Restaurang"
  },
  {
    "id": "la-fontana-n317537755",
    "name": "La Fontana",
    "category": "mat",
    "lat": 57.639052,
    "lng": 18.296397,
    "description": "Restaurang"
  },
  {
    "id": "ladans-langos-w1310433690",
    "name": "Ladans Langos",
    "category": "mat",
    "lat": 57.492375,
    "lng": 18.145821,
    "description": "Restaurang"
  },
  {
    "id": "lagunen-pool-club-w1087514350",
    "name": "Lagunen Pool Club",
    "category": "mat",
    "lat": 57.608331,
    "lng": 18.242858,
    "description": "Snabbmat"
  },
  {
    "id": "lajkarhajd-n6373753074",
    "name": "Lajkarhajd",
    "category": "sevardhet",
    "lat": 57.784971,
    "lng": 18.814924,
    "description": "Historisk plats"
  },
  {
    "id": "landningspool-w1306551543",
    "name": "Landningspool",
    "category": "aktivitet",
    "lat": 57.608649,
    "lng": 18.244093,
    "description": "Aktivitet"
  },
  {
    "id": "landningspool-tvillingarna-w1306551542",
    "name": "Landningspool Tvillingarna",
    "category": "aktivitet",
    "lat": 57.609116,
    "lng": 18.244559,
    "description": "Aktivitet"
  },
  {
    "id": "landtraskdammen-w530645639",
    "name": "Landträskdammen",
    "category": "natur",
    "lat": 57.756963,
    "lng": 18.462063,
    "description": "Naturupplevelse"
  },
  {
    "id": "langa-vat-w497223449",
    "name": "Langa vät",
    "category": "natur",
    "lat": 57.96519,
    "lng": 19.158925,
    "description": "Naturupplevelse"
  },
  {
    "id": "langhammars-r1459278",
    "name": "Langhammars",
    "category": "natur",
    "lat": 57.98198,
    "lng": 19.167329,
    "description": "Naturreservat"
  },
  {
    "id": "langmyr-w432644030",
    "name": "Langmyr",
    "category": "natur",
    "lat": 57.906961,
    "lng": 18.971986,
    "description": "Naturupplevelse"
  },
  {
    "id": "langmyr-w482269651",
    "name": "Langmyr",
    "category": "natur",
    "lat": 57.888287,
    "lng": 19.154909,
    "description": "Naturupplevelse"
  },
  {
    "id": "langmyren-w530668053",
    "name": "Langmyren",
    "category": "natur",
    "lat": 57.478084,
    "lng": 18.260779,
    "description": "Naturupplevelse"
  },
  {
    "id": "langmyrskogs-naturreservat-w102775299",
    "name": "Langmyrskogs naturreservat",
    "category": "natur",
    "lat": 57.431127,
    "lng": 18.766053,
    "description": "Naturreservat"
  },
  {
    "id": "lansalundar-r7107011",
    "name": "Lansalundar",
    "category": "natur",
    "lat": 57.897185,
    "lng": 19.071122,
    "description": "Naturupplevelse"
  },
  {
    "id": "las-palmas-n988558877",
    "name": "Las Palmas",
    "category": "strand",
    "lat": 58.388934,
    "lng": 19.254752,
    "description": "Badstrand"
  },
  {
    "id": "lau-kyrka-w1082056185",
    "name": "Lau kyrka",
    "category": "sevardhet",
    "lat": 57.282895,
    "lng": 18.620153,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "laus-holmar-r10249731",
    "name": "Laus holmar",
    "category": "natur",
    "lat": 57.285606,
    "lng": 18.750345,
    "description": "Naturreservat"
  },
  {
    "id": "lauterhorn-r7297859",
    "name": "Lauterhorn",
    "category": "aktivitet",
    "lat": 57.952883,
    "lng": 19.082292,
    "description": "Småbåtshamn"
  },
  {
    "id": "lauters-n448288824",
    "name": "Lauters",
    "category": "mat",
    "lat": 57.954618,
    "lng": 19.10332,
    "description": "Café"
  },
  {
    "id": "lauters-stainkalm-w497285800",
    "name": "Lauters stainkalm",
    "category": "sevardhet",
    "lat": 57.968973,
    "lng": 19.118449,
    "description": "Historisk plats"
  },
  {
    "id": "lejstu-rojr-w1124781367",
    "name": "Lejstu rojr",
    "category": "sevardhet",
    "lat": 57.187515,
    "lng": 18.481171,
    "description": "Besöksmål"
  },
  {
    "id": "lena-scharp-keramik-n8901172267",
    "name": "Lena Scharp Keramik",
    "category": "shopping",
    "lat": 57.326626,
    "lng": 18.559818,
    "description": "Butik"
  },
  {
    "id": "lergravsporten-n6373759856",
    "name": "Lergravsporten",
    "category": "natur",
    "lat": 57.793191,
    "lng": 18.987708,
    "description": "Naturupplevelse"
  },
  {
    "id": "lergravsviken-w528208440",
    "name": "Lergravsviken",
    "category": "natur",
    "lat": 57.795292,
    "lng": 18.986185,
    "description": "Naturreservat"
  },
  {
    "id": "leva-kungslador-n6716236938",
    "name": "Leva Kungslador",
    "category": "mat",
    "lat": 57.618476,
    "lng": 18.271176,
    "description": "Café"
  },
  {
    "id": "levide-kyrka-w1191887705",
    "name": "Levide kyrka",
    "category": "sevardhet",
    "lat": 57.282156,
    "lng": 18.266396,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "lgs-mosbar-w61349668",
    "name": "LGs Mosbar",
    "category": "mat",
    "lat": 57.635606,
    "lng": 18.290444,
    "description": "Restaurang"
  },
  {
    "id": "lickershamn-n2095449089",
    "name": "Lickershamn",
    "category": "aktivitet",
    "lat": 57.826639,
    "lng": 18.513271,
    "description": "Småbåtshamn"
  },
  {
    "id": "lickershamns-semesterby-camping-no-tent-n431825100",
    "name": "Lickershamns Semesterby & Camping // No Tent",
    "category": "boende",
    "lat": 57.82717,
    "lng": 18.52552,
    "description": "Camping"
  },
  {
    "id": "lidl-visby-n10740027004",
    "name": "Lidl Visby",
    "category": "service",
    "lat": 57.63477,
    "lng": 18.32522,
    "description": "Laddstation"
  },
  {
    "id": "liffridesskeppen-n6373528707",
    "name": "Liffridesskeppen",
    "category": "sevardhet",
    "lat": 57.35514,
    "lng": 18.668212,
    "description": "Historisk plats"
  },
  {
    "id": "lilla-bjers-n6668096812",
    "name": "Lilla Bjers",
    "category": "mat",
    "lat": 57.582654,
    "lng": 18.232979,
    "description": "Restaurang"
  },
  {
    "id": "lilla-bjars-gravfalt-n6373771303",
    "name": "Lilla Bjärs Gravfält",
    "category": "sevardhet",
    "lat": 57.790144,
    "lng": 18.541139,
    "description": "Historisk plats"
  },
  {
    "id": "lilla-dappan-w1190202665",
    "name": "Lilla Däppan",
    "category": "natur",
    "lat": 57.128488,
    "lng": 18.228663,
    "description": "Naturupplevelse"
  },
  {
    "id": "lilla-fabriken-n8892623223",
    "name": "Lilla fabriken",
    "category": "shopping",
    "lat": 57.861333,
    "lng": 19.052452,
    "description": "Butik"
  },
  {
    "id": "lilla-fide-n5297357205",
    "name": "Lilla FIDE",
    "category": "mat",
    "lat": 57.637878,
    "lng": 18.298734,
    "description": "Restaurang"
  },
  {
    "id": "lilla-hellvis-naturreservat-w1331351257",
    "name": "Lilla Hellvis naturreservat",
    "category": "natur",
    "lat": 57.631363,
    "lng": 18.524501,
    "description": "Naturreservat"
  },
  {
    "id": "lilla-karlso-n2078780737",
    "name": "Lilla Karlsö",
    "category": "service",
    "lat": 57.311124,
    "lng": 18.073763,
    "description": "Färjeterminal"
  },
  {
    "id": "lilla-karlso-naturreservat-w102776100",
    "name": "Lilla Karlsö naturreservat",
    "category": "natur",
    "lat": 57.312955,
    "lng": 18.062996,
    "description": "Naturreservat"
  },
  {
    "id": "lilla-marumyr-r7367379",
    "name": "Lilla Marumyr",
    "category": "natur",
    "lat": 57.949455,
    "lng": 19.153377,
    "description": "Naturupplevelse"
  },
  {
    "id": "lilla-morby-naturreservat-w102775519",
    "name": "Lilla Mörby naturreservat",
    "category": "natur",
    "lat": 57.710256,
    "lng": 18.566173,
    "description": "Naturreservat"
  },
  {
    "id": "lilla-pussmyr-w529663687",
    "name": "Lilla Pussmyr",
    "category": "natur",
    "lat": 57.751989,
    "lng": 18.689209,
    "description": "Naturupplevelse"
  },
  {
    "id": "lilla-strandporten-n60763552",
    "name": "Lilla Strandporten",
    "category": "sevardhet",
    "lat": 57.640201,
    "lng": 18.292389,
    "description": "Historisk plats"
  },
  {
    "id": "lillhaga-vat-w494894609",
    "name": "Lillhaga vät",
    "category": "natur",
    "lat": 57.954099,
    "lng": 19.120564,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillholmen-w199513325",
    "name": "Lillholmen",
    "category": "natur",
    "lat": 57.899093,
    "lng": 18.917517,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillklev-n1065974086",
    "name": "Lillklev",
    "category": "smultronstallen",
    "lat": 57.59574,
    "lng": 18.195114,
    "description": "Utsiktsplats"
  },
  {
    "id": "lillmyr-w377678266",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 57.732376,
    "lng": 18.69538,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillmyr-w383395026",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 56.9274,
    "lng": 18.198987,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillmyr-w432644031",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 57.905003,
    "lng": 18.982466,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillmyr-w462284664",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 57.558074,
    "lng": 18.275071,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillmyr-w482237281",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 56.947724,
    "lng": 18.282366,
    "description": "Naturupplevelse"
  },
  {
    "id": "lillmyr-w532076141",
    "name": "Lillmyr",
    "category": "natur",
    "lat": 57.813216,
    "lng": 18.84135,
    "description": "Naturupplevelse"
  },
  {
    "id": "lilltrask-w468147481",
    "name": "Lillträsk",
    "category": "natur",
    "lat": 57.720452,
    "lng": 18.435474,
    "description": "Naturupplevelse"
  },
  {
    "id": "limmortrask-r7100655",
    "name": "Limmorträsk",
    "category": "natur",
    "lat": 57.88982,
    "lng": 19.114685,
    "description": "Naturupplevelse"
  },
  {
    "id": "linarve-visby-n6567706585",
    "name": "Linarve Visby",
    "category": "shopping",
    "lat": 57.640241,
    "lng": 18.294465,
    "description": "Butik"
  },
  {
    "id": "linde-kyrka-w551235740",
    "name": "Linde kyrka",
    "category": "sevardhet",
    "lat": 57.279681,
    "lng": 18.379746,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "lindebergets-naturreservat-r12193514",
    "name": "Lindebergets naturreservat",
    "category": "natur",
    "lat": 57.281317,
    "lng": 18.371232,
    "description": "Naturreservat"
  },
  {
    "id": "lindex-n11691721491",
    "name": "Lindex",
    "category": "shopping",
    "lat": 57.637157,
    "lng": 18.301348,
    "description": "Butik"
  },
  {
    "id": "lindgarden-n7978347430",
    "name": "Lindgården",
    "category": "boende",
    "lat": 57.640895,
    "lng": 18.29389,
    "description": "Hotell"
  },
  {
    "id": "lindhammarsmyr-w102775375",
    "name": "Lindhammarsmyr",
    "category": "natur",
    "lat": 57.41723,
    "lng": 18.533615,
    "description": "Naturreservat"
  },
  {
    "id": "line-trask-w611112228",
    "name": "Line Träsk",
    "category": "natur",
    "lat": 57.566059,
    "lng": 18.654377,
    "description": "Naturupplevelse"
  },
  {
    "id": "linne-n6641693084",
    "name": "Linné",
    "category": "sevardhet",
    "lat": 57.643289,
    "lng": 18.293293,
    "description": "Historisk plats"
  },
  {
    "id": "linnes-grotta-n6638409250",
    "name": "Linnés grotta",
    "category": "natur",
    "lat": 57.414965,
    "lng": 18.7107,
    "description": "Naturupplevelse"
  },
  {
    "id": "linnes-utsikten-n9828415267",
    "name": "Linnés utsikten",
    "category": "smultronstallen",
    "lat": 57.421115,
    "lng": 18.857518,
    "description": "Utsiktsplats"
  },
  {
    "id": "lion-bar-visby-n12871863901",
    "name": "Lion Bar Visby",
    "category": "mat",
    "lat": 57.63792,
    "lng": 18.295159,
    "description": "Restaurang"
  },
  {
    "id": "livbat-n12175014766",
    "name": "Livbåt",
    "category": "sevardhet",
    "lat": 57.705739,
    "lng": 18.809969,
    "description": "Historisk plats"
  },
  {
    "id": "ljugarns-camping-och-semesterby-w1071031578",
    "name": "Ljugarns Camping och Semesterby",
    "category": "boende",
    "lat": 57.34147,
    "lng": 18.717868,
    "description": "Camping"
  },
  {
    "id": "ljugarns-semesterby-och-camping-n10740026992",
    "name": "Ljugarns Semesterby och camping",
    "category": "service",
    "lat": 57.34072,
    "lng": 18.71729,
    "description": "Laddstation"
  },
  {
    "id": "ljugarns-strand-n11944704104",
    "name": "Ljugarns strand",
    "category": "strand",
    "lat": 57.333523,
    "lng": 18.713461,
    "description": "Badplats"
  },
  {
    "id": "ljugarns-strandcafe-restaurang-n2649612279",
    "name": "Ljugarns Strandcafé & Restaurang",
    "category": "mat",
    "lat": 57.333351,
    "lng": 18.711941,
    "description": "Restaurang"
  },
  {
    "id": "ljugarnskogens-naturreservat-r19375351",
    "name": "Ljugarnskogens naturreservat",
    "category": "natur",
    "lat": 57.333355,
    "lng": 18.689686,
    "description": "Naturreservat"
  },
  {
    "id": "lojsta-kyrka-w1191878777",
    "name": "Lojsta kyrka",
    "category": "sevardhet",
    "lat": 57.312828,
    "lng": 18.383915,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "lojsta-russpark-n361111619",
    "name": "Lojsta russpark",
    "category": "sevardhet",
    "lat": 57.329093,
    "lng": 18.327518,
    "description": "Besöksmål"
  },
  {
    "id": "lojsta-slott-n282869357",
    "name": "Lojsta slott",
    "category": "sevardhet",
    "lat": 57.321575,
    "lng": 18.421652,
    "description": "Besöksmål"
  },
  {
    "id": "lokrume-kyrka-w530542837",
    "name": "Lokrume kyrka",
    "category": "sevardhet",
    "lat": 57.687802,
    "lng": 18.538939,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "lugnets-golfbana-r6846687",
    "name": "Lugnets Golfbana",
    "category": "aktivitet",
    "lat": 57.66946,
    "lng": 18.362366,
    "description": "Golfbana"
  },
  {
    "id": "lukaremyr-w525598035",
    "name": "Lukaremyr",
    "category": "natur",
    "lat": 57.414954,
    "lng": 18.678829,
    "description": "Naturupplevelse"
  },
  {
    "id": "lummelunda-kyrka-w1078761491",
    "name": "Lummelunda kyrka",
    "category": "sevardhet",
    "lat": 57.769752,
    "lng": 18.455541,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "lummelundagrottan-n702274593",
    "name": "Lummelundagrottan",
    "category": "natur",
    "lat": 57.7382,
    "lng": 18.406005,
    "description": "Turistinformation"
  },
  {
    "id": "lummelundagrottan-w102775864",
    "name": "Lummelundagrottan",
    "category": "natur",
    "lat": 57.739117,
    "lng": 18.41581,
    "description": "Naturreservat"
  },
  {
    "id": "lundar-w528175318",
    "name": "Lundar",
    "category": "natur",
    "lat": 56.933281,
    "lng": 18.264213,
    "description": "Naturreservat"
  },
  {
    "id": "lye-kyrka-w1191878778",
    "name": "Lye kyrka",
    "category": "sevardhet",
    "lat": 57.297917,
    "lng": 18.526453,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "langmyr-w379456727",
    "name": "Långmyr",
    "category": "natur",
    "lat": 57.388056,
    "lng": 18.674933,
    "description": "Naturupplevelse"
  },
  {
    "id": "langvat-w379613222",
    "name": "Långvät",
    "category": "natur",
    "lat": 57.830792,
    "lng": 18.880936,
    "description": "Naturupplevelse"
  },
  {
    "id": "lagren-w496803162",
    "name": "Lägren",
    "category": "natur",
    "lat": 57.938072,
    "lng": 19.16573,
    "description": "Naturupplevelse"
  },
  {
    "id": "lansforsakringar-gotland-n11691721477",
    "name": "Länsförsäkringar Gotland",
    "category": "service",
    "lat": 57.636901,
    "lng": 18.302601,
    "description": "Service"
  },
  {
    "id": "larbo-cng-n10814956091",
    "name": "Lärbo CNG",
    "category": "service",
    "lat": 57.783804,
    "lng": 18.788263,
    "description": "Bensinstation"
  },
  {
    "id": "larbro-cafe-bar-n12169645732",
    "name": "Lärbro Cafe & Bar",
    "category": "mat",
    "lat": 57.784387,
    "lng": 18.790007,
    "description": "Restaurang"
  },
  {
    "id": "larbro-kyrka-w296560049",
    "name": "Lärbro kyrka",
    "category": "sevardhet",
    "lat": 57.78717,
    "lng": 18.793709,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "larbro-pizzeria-n448315616",
    "name": "Lärbro pizzeria",
    "category": "mat",
    "lat": 57.792181,
    "lng": 18.78871,
    "description": "Snabbmat"
  },
  {
    "id": "lorgeudd-r7611525",
    "name": "Lörgeudd",
    "category": "natur",
    "lat": 57.738572,
    "lng": 18.955886,
    "description": "Naturreservat"
  },
  {
    "id": "losa-kvarn-n1853522076",
    "name": "Löså kvarn",
    "category": "sevardhet",
    "lat": 57.459845,
    "lng": 18.706014,
    "description": "Besöksmål"
  },
  {
    "id": "mad-peach-n2320584939",
    "name": "mad peach",
    "category": "shopping",
    "lat": 57.637621,
    "lng": 18.295104,
    "description": "Butik"
  },
  {
    "id": "magasinet-n8902078296",
    "name": "Magasinet",
    "category": "mat",
    "lat": 57.865021,
    "lng": 19.057726,
    "description": "Restaurang"
  },
  {
    "id": "magasinet-w1087504449",
    "name": "Magasinet",
    "category": "shopping",
    "lat": 57.609677,
    "lng": 18.243936,
    "description": "Butik"
  },
  {
    "id": "magazinet-n1313897479",
    "name": "Magazinet",
    "category": "mat",
    "lat": 57.187423,
    "lng": 18.254232,
    "description": "Restaurang"
  },
  {
    "id": "majsterrojr-n5112840376",
    "name": "Majsterrojr",
    "category": "sevardhet",
    "lat": 57.615219,
    "lng": 18.733554,
    "description": "Historisk plats"
  },
  {
    "id": "majsterrojr-skeppssattning-n6373764149",
    "name": "Majsterrojr skeppssättning",
    "category": "sevardhet",
    "lat": 57.615496,
    "lng": 18.734172,
    "description": "Historisk plats"
  },
  {
    "id": "majstregarden-n10740046625",
    "name": "Majstregården",
    "category": "mat",
    "lat": 56.92281,
    "lng": 18.13248,
    "description": "Laddstation"
  },
  {
    "id": "maldes-naturreservat-r12216218",
    "name": "Maldes naturreservat",
    "category": "natur",
    "lat": 57.303737,
    "lng": 18.429509,
    "description": "Naturreservat"
  },
  {
    "id": "mallamyr-w485971362",
    "name": "Mallamyr",
    "category": "natur",
    "lat": 57.933528,
    "lng": 19.122713,
    "description": "Naturupplevelse"
  },
  {
    "id": "mallas-stenstugu-n1383500036",
    "name": "Mallas Stenstugu",
    "category": "boende",
    "lat": 57.597788,
    "lng": 18.447315,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "mallgard-kallmyrs-naturreservat-w102776062",
    "name": "Mallgård källmyrs naturreservat",
    "category": "natur",
    "lat": 57.324196,
    "lng": 18.288309,
    "description": "Naturreservat"
  },
  {
    "id": "mallgards-haid-w102775810",
    "name": "Mallgårds haid",
    "category": "natur",
    "lat": 57.378749,
    "lng": 18.609278,
    "description": "Naturreservat"
  },
  {
    "id": "malms-kyllaj-w528208441",
    "name": "Malms-Kyllaj",
    "category": "natur",
    "lat": 57.75591,
    "lng": 18.94705,
    "description": "Naturreservat"
  },
  {
    "id": "maltfabriken-n280183044",
    "name": "Maltfabriken",
    "category": "mat",
    "lat": 57.639401,
    "lng": 18.288838,
    "description": "Restaurang"
  },
  {
    "id": "marco-polo-n6623681645",
    "name": "Marco Polo",
    "category": "mat",
    "lat": 57.64492,
    "lng": 18.306504,
    "description": "Restaurang"
  },
  {
    "id": "marorna-r7293949",
    "name": "Marorna",
    "category": "natur",
    "lat": 57.945389,
    "lng": 19.143274,
    "description": "Naturupplevelse"
  },
  {
    "id": "marpes-r1459273",
    "name": "Marpes",
    "category": "natur",
    "lat": 57.930742,
    "lng": 19.082552,
    "description": "Naturreservat"
  },
  {
    "id": "martebo-kyrka-w464798262",
    "name": "Martebo kyrka",
    "category": "sevardhet",
    "lat": 57.748221,
    "lng": 18.494504,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "mat-kaffestugan-n448298314",
    "name": "Mat- & Kaffestugan",
    "category": "mat",
    "lat": 57.854502,
    "lng": 19.028116,
    "description": "Café"
  },
  {
    "id": "mattsarve-skogs-naturreservat-w1331536795",
    "name": "Mattsarve skogs naturreservat",
    "category": "natur",
    "lat": 57.533868,
    "lng": 18.65647,
    "description": "Naturreservat"
  },
  {
    "id": "mattsemyr-w530645631",
    "name": "Mattsemyr",
    "category": "natur",
    "lat": 57.839654,
    "lng": 18.662891,
    "description": "Naturupplevelse"
  },
  {
    "id": "mavens-kustnara-stugor-n11065578164",
    "name": "Mavens Kustnära Stugor",
    "category": "boende",
    "lat": 57.859731,
    "lng": 18.776166,
    "description": "Semesterboende"
  },
  {
    "id": "mavrajd-w378759384",
    "name": "Mavrajd",
    "category": "natur",
    "lat": 57.911399,
    "lng": 18.888433,
    "description": "Naturupplevelse"
  },
  {
    "id": "mavrajdsmyr-w532068581",
    "name": "Mavrajdsmyr",
    "category": "natur",
    "lat": 57.91272,
    "lng": 18.886214,
    "description": "Naturupplevelse"
  },
  {
    "id": "max-w207318199",
    "name": "Max",
    "category": "mat",
    "lat": 57.637404,
    "lng": 18.303765,
    "description": "Snabbmat"
  },
  {
    "id": "maxi-ica-stormarknad-visby-w126784267",
    "name": "Maxi ICA Stormarknad Visby",
    "category": "shopping",
    "lat": 57.623798,
    "lng": 18.322115,
    "description": "Butik"
  },
  {
    "id": "mcdonald-s-n4977419516",
    "name": "McDonald's",
    "category": "mat",
    "lat": 57.637593,
    "lng": 18.301117,
    "description": "Snabbmat"
  },
  {
    "id": "mcdonald-s-w504177112",
    "name": "McDonald's",
    "category": "mat",
    "lat": 57.621705,
    "lng": 18.320356,
    "description": "Snabbmat"
  },
  {
    "id": "medusas-badcafe-w378721507",
    "name": "Medusas Badcafé",
    "category": "mat",
    "lat": 57.702016,
    "lng": 18.806663,
    "description": "Café"
  },
  {
    "id": "mel-s-diner-hamnen-n392710903",
    "name": "Mel's Diner Hamnen",
    "category": "mat",
    "lat": 57.637077,
    "lng": 18.287197,
    "description": "Restaurang"
  },
  {
    "id": "mellanvarn-franke-w437661455",
    "name": "Mellanvärn Franke",
    "category": "sevardhet",
    "lat": 57.725075,
    "lng": 18.611805,
    "description": "Historisk plats"
  },
  {
    "id": "mels-diner-n12877367056",
    "name": "Mels Diner",
    "category": "mat",
    "lat": 57.640934,
    "lng": 18.296772,
    "description": "Restaurang"
  },
  {
    "id": "meza-n5250513989",
    "name": "Meza",
    "category": "mat",
    "lat": 57.637067,
    "lng": 18.294445,
    "description": "Restaurang"
  },
  {
    "id": "mille-lire-n12909505715",
    "name": "Mille Lire",
    "category": "mat",
    "lat": 57.640187,
    "lng": 18.296485,
    "description": "Restaurang"
  },
  {
    "id": "millumtrask-w102776358",
    "name": "Millumträsk",
    "category": "natur",
    "lat": 57.776173,
    "lng": 18.615691,
    "description": "Naturreservat"
  },
  {
    "id": "minnessten-kvarnbacken-n3003538503",
    "name": "Minnessten Kvarnbacken",
    "category": "sevardhet",
    "lat": 57.816394,
    "lng": 18.713353,
    "description": "Historisk plats"
  },
  {
    "id": "mirells-n11042499253",
    "name": "Mirells",
    "category": "mat",
    "lat": 57.635685,
    "lng": 18.292515,
    "description": "Café"
  },
  {
    "id": "mix-ranch-stenkyrka-n10740026996",
    "name": "Mix Ranch Stenkyrka",
    "category": "service",
    "lat": 57.79796,
    "lng": 18.54881,
    "description": "Laddstation"
  },
  {
    "id": "mojner-r7611521",
    "name": "Mojner",
    "category": "natur",
    "lat": 57.661998,
    "lng": 18.793159,
    "description": "Naturreservat"
  },
  {
    "id": "mojo-independent-store-n2320584943",
    "name": "Mojo Independent Store",
    "category": "shopping",
    "lat": 57.63715,
    "lng": 18.294305,
    "description": "Butik"
  },
  {
    "id": "mosaic-n12877365917",
    "name": "Mosaic",
    "category": "shopping",
    "lat": 57.637792,
    "lng": 18.295016,
    "description": "Butik"
  },
  {
    "id": "mq-n11691721490",
    "name": "MQ",
    "category": "shopping",
    "lat": 57.637256,
    "lng": 18.301071,
    "description": "Butik"
  },
  {
    "id": "mtb-banor-w835739420",
    "name": "MTB-banor",
    "category": "aktivitet",
    "lat": 57.606265,
    "lng": 18.278733,
    "description": "Idrottsanläggning"
  },
  {
    "id": "mulde-fornborg-w374191024",
    "name": "Mulde fornborg",
    "category": "sevardhet",
    "lat": 57.357672,
    "lng": 18.209382,
    "description": "Historisk plats"
  },
  {
    "id": "mulde-naturreservat-w102775644",
    "name": "Mulde naturreservat",
    "category": "natur",
    "lat": 57.352115,
    "lng": 18.196134,
    "description": "Naturreservat"
  },
  {
    "id": "mullvalds-strandskog-r7611527",
    "name": "Mullvalds strandskog",
    "category": "natur",
    "lat": 57.365221,
    "lng": 18.7594,
    "description": "Naturreservat"
  },
  {
    "id": "mullvalds-anges-naturreservat-w1334176621",
    "name": "Mullvalds änges naturreservat",
    "category": "natur",
    "lat": 57.373945,
    "lng": 18.707727,
    "description": "Naturreservat"
  },
  {
    "id": "munkens-cafe-n6624689518",
    "name": "Munkens Cafe",
    "category": "mat",
    "lat": 57.515914,
    "lng": 18.458551,
    "description": "Café"
  },
  {
    "id": "munkkallaren-n315872865",
    "name": "Munkkällaren",
    "category": "mat",
    "lat": 57.640816,
    "lng": 18.295356,
    "description": "Restaurang"
  },
  {
    "id": "museet-stora-karlso-n2342987592",
    "name": "Museet Stora Karlsö",
    "category": "sevardhet",
    "lat": 57.288867,
    "lng": 17.969644,
    "description": "Museum"
  },
  {
    "id": "museijarnvag-n3450013896",
    "name": "Museijärnväg",
    "category": "sevardhet",
    "lat": 57.54441,
    "lng": 18.531321,
    "description": "Museum"
  },
  {
    "id": "museum-lars-jonsson-n12068486576",
    "name": "Museum Lars Jonsson",
    "category": "sevardhet",
    "lat": 56.969235,
    "lng": 18.229247,
    "description": "Museum"
  },
  {
    "id": "muskmyr-w102776302",
    "name": "Muskmyr",
    "category": "natur",
    "lat": 56.938197,
    "lng": 18.196614,
    "description": "Naturreservat"
  },
  {
    "id": "myren-w530655716",
    "name": "Myren",
    "category": "natur",
    "lat": 57.523586,
    "lng": 18.228818,
    "description": "Naturupplevelse"
  },
  {
    "id": "myren-w566746571",
    "name": "Myren",
    "category": "natur",
    "lat": 57.28456,
    "lng": 17.959366,
    "description": "Naturupplevelse"
  },
  {
    "id": "myrhagamyr-w504336841",
    "name": "Myrhagamyr",
    "category": "natur",
    "lat": 57.960217,
    "lng": 19.20314,
    "description": "Naturupplevelse"
  },
  {
    "id": "myrhagemyr-w533013694",
    "name": "Myrhagemyr",
    "category": "natur",
    "lat": 57.882614,
    "lng": 18.754512,
    "description": "Naturupplevelse"
  },
  {
    "id": "myrhagen-w530668049",
    "name": "Myrhagen",
    "category": "natur",
    "lat": 57.47283,
    "lng": 18.245122,
    "description": "Naturupplevelse"
  },
  {
    "id": "massingskarr-w532140218",
    "name": "Mässingskärr",
    "category": "natur",
    "lat": 57.960083,
    "lng": 19.326207,
    "description": "Naturupplevelse"
  },
  {
    "id": "masterby-kyrka-w1191878780",
    "name": "Mästerby kyrka",
    "category": "sevardhet",
    "lat": 57.469929,
    "lng": 18.304029,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "molnerbunkar-w532072662",
    "name": "Mölnerbunkar",
    "category": "natur",
    "lat": 57.8394,
    "lng": 18.889473,
    "description": "Naturupplevelse"
  },
  {
    "id": "molnermyr-w532072663",
    "name": "Mölnermyr",
    "category": "natur",
    "lat": 57.841009,
    "lng": 18.873362,
    "description": "Naturupplevelse"
  },
  {
    "id": "molnermyr-r7611519",
    "name": "Mölnermyr",
    "category": "natur",
    "lat": 57.834288,
    "lng": 18.88183,
    "description": "Naturreservat"
  },
  {
    "id": "nabben-n2089197566",
    "name": "Nabben",
    "category": "aktivitet",
    "lat": 57.265731,
    "lng": 18.717308,
    "description": "Småbåtshamn"
  },
  {
    "id": "nackhajden-n4341704710",
    "name": "Nackhajden",
    "category": "natur",
    "lat": 57.898356,
    "lng": 18.982204,
    "description": "Naturupplevelse"
  },
  {
    "id": "nacktrask-w432614731",
    "name": "Nackträsk",
    "category": "natur",
    "lat": 57.912591,
    "lng": 18.982374,
    "description": "Naturupplevelse"
  },
  {
    "id": "nasume-myr-w530655719",
    "name": "Nasume Myr",
    "category": "natur",
    "lat": 57.53952,
    "lng": 18.142322,
    "description": "Naturupplevelse"
  },
  {
    "id": "naturrum-med-hembygdsmuseum-w313542149",
    "name": "Naturrum med Hembygdsmuseum",
    "category": "sevardhet",
    "lat": 58.39214,
    "lng": 19.192978,
    "description": "Museum"
  },
  {
    "id": "naturum-gotland-n12899726384",
    "name": "Naturum Gotland",
    "category": "sevardhet",
    "lat": 56.968744,
    "lng": 18.230611,
    "description": "Museum"
  },
  {
    "id": "nightmare-n766160693",
    "name": "Nightmare",
    "category": "shopping",
    "lat": 57.635921,
    "lng": 18.29308,
    "description": "Butik"
  },
  {
    "id": "nissevikens-restaurang-n817398704",
    "name": "Nissevikens restaurang",
    "category": "mat",
    "lat": 57.132525,
    "lng": 18.218333,
    "description": "Restaurang"
  },
  {
    "id": "niva-n11085903409",
    "name": "Nivå",
    "category": "sevardhet",
    "lat": 57.641748,
    "lng": 18.298982,
    "description": "Sevärdhet"
  },
  {
    "id": "nordens-storsta-gravklot-n6373677150",
    "name": "Nordens största gravklot",
    "category": "sevardhet",
    "lat": 57.496513,
    "lng": 18.476237,
    "description": "Historisk plats"
  },
  {
    "id": "norderholmsmyr-r7251048",
    "name": "Norderholmsmyr",
    "category": "natur",
    "lat": 57.879382,
    "lng": 19.147383,
    "description": "Naturupplevelse"
  },
  {
    "id": "norderport-n6634294872",
    "name": "Norderport",
    "category": "sevardhet",
    "lat": 57.644685,
    "lng": 18.30106,
    "description": "Historisk plats"
  },
  {
    "id": "nordersand-w436131422",
    "name": "Nordersand",
    "category": "strand",
    "lat": 57.973086,
    "lng": 19.250435,
    "description": "Badplats"
  },
  {
    "id": "norra-kyrkogarden-n10740046610",
    "name": "Norra kyrkogården",
    "category": "service",
    "lat": 57.6565,
    "lng": 18.31499,
    "description": "Laddstation"
  },
  {
    "id": "norra-nyrajsemyr-w379617744",
    "name": "Norra Nyrajsemyr",
    "category": "natur",
    "lat": 57.919793,
    "lng": 18.879644,
    "description": "Naturupplevelse"
  },
  {
    "id": "norrbys-w962621283",
    "name": "Norrbys",
    "category": "sevardhet",
    "lat": 57.454754,
    "lng": 18.371088,
    "description": "Museum"
  },
  {
    "id": "norrlanda-20-1-n6373633488",
    "name": "Norrlanda 20:1",
    "category": "sevardhet",
    "lat": 57.518144,
    "lng": 18.711763,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-25-1-n6373633489",
    "name": "Norrlanda 25:1",
    "category": "sevardhet",
    "lat": 57.518724,
    "lng": 18.71152,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-28-1-n6373633492",
    "name": "Norrlanda 28:1",
    "category": "sevardhet",
    "lat": 57.518498,
    "lng": 18.725144,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-29-1-rose-n6373633490",
    "name": "Norrlanda 29:1 röse",
    "category": "sevardhet",
    "lat": 57.518976,
    "lng": 18.726724,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-29-1-skeppssattning-n6373633491",
    "name": "Norrlanda 29:1 skeppssättning",
    "category": "sevardhet",
    "lat": 57.518914,
    "lng": 18.726577,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-7-1-n6373633493",
    "name": "Norrlanda 7:1",
    "category": "sevardhet",
    "lat": 57.517562,
    "lng": 18.72189,
    "description": "Historisk plats"
  },
  {
    "id": "norrlanda-fornstuga-n2338320709",
    "name": "Norrlanda Fornstuga",
    "category": "sevardhet",
    "lat": 57.526428,
    "lng": 18.676318,
    "description": "Museum"
  },
  {
    "id": "norrlanda-kyrka-w1191878790",
    "name": "Norrlanda kyrka",
    "category": "sevardhet",
    "lat": 57.50154,
    "lng": 18.659825,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "nors-w528208443",
    "name": "Nors",
    "category": "natur",
    "lat": 57.825818,
    "lng": 18.965678,
    "description": "Naturreservat"
  },
  {
    "id": "novi-beach-club-n3032533331",
    "name": "NOVI Beach Club",
    "category": "mat",
    "lat": 57.653273,
    "lng": 18.303975,
    "description": "Restaurang"
  },
  {
    "id": "novi-ressort-visby-n4216100283",
    "name": "NOVI Ressort Visby",
    "category": "boende",
    "lat": 57.652973,
    "lng": 18.306615,
    "description": "Hotell"
  },
  {
    "id": "nya-skafferiet-n766160699",
    "name": "Nya Skafferiet",
    "category": "mat",
    "lat": 57.637535,
    "lng": 18.295022,
    "description": "Café"
  },
  {
    "id": "nygards-herrgard-n5307204925",
    "name": "Nygårds Herrgård",
    "category": "sevardhet",
    "lat": 57.60067,
    "lng": 18.227546,
    "description": "Besöksmål"
  },
  {
    "id": "nygards-herrgard-gardsbutik-n6700866273",
    "name": "Nygårds Herrgård gårdsbutik",
    "category": "shopping",
    "lat": 57.600683,
    "lng": 18.226587,
    "description": "Gårdsbutik"
  },
  {
    "id": "nymans-beach-house-r6597539",
    "name": "Nymans Beach House",
    "category": "boende",
    "lat": 57.485132,
    "lng": 18.130657,
    "description": "Camping"
  },
  {
    "id": "nyrajsu-w378759385",
    "name": "Nyrajsu",
    "category": "natur",
    "lat": 57.91441,
    "lng": 18.878982,
    "description": "Naturupplevelse"
  },
  {
    "id": "nystroms-n6651664474",
    "name": "Nyströms",
    "category": "mat",
    "lat": 57.824096,
    "lng": 19.079674,
    "description": "Café"
  },
  {
    "id": "nar-golfklubb-w199052764",
    "name": "När Golfklubb",
    "category": "aktivitet",
    "lat": 57.244031,
    "lng": 18.649311,
    "description": "Golfbana"
  },
  {
    "id": "nar-kyrka-w1191887702",
    "name": "När kyrka",
    "category": "sevardhet",
    "lat": 57.257355,
    "lng": 18.625288,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "narbodi-n10740027003",
    "name": "Närbodi",
    "category": "service",
    "lat": 57.25951,
    "lng": 18.63631,
    "description": "Laddstation"
  },
  {
    "id": "narshamn-n2088990885",
    "name": "Närshamn",
    "category": "aktivitet",
    "lat": 57.225302,
    "lng": 18.663097,
    "description": "Småbåtshamn"
  },
  {
    "id": "narsholmen-w102775876",
    "name": "Närsholmen",
    "category": "natur",
    "lat": 57.226076,
    "lng": 18.690637,
    "description": "Naturreservat"
  },
  {
    "id": "narsviken-n8841731945",
    "name": "Närsviken",
    "category": "strand",
    "lat": 57.231426,
    "lng": 18.670479,
    "description": "Badplats"
  },
  {
    "id": "nas-kyrka-w1072813194",
    "name": "Näs kyrka",
    "category": "sevardhet",
    "lat": 57.110174,
    "lng": 18.262375,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "offerkallan-n5712258179",
    "name": "Offerkällan",
    "category": "natur",
    "lat": 57.667551,
    "lng": 18.47313,
    "description": "Historisk plats"
  },
  {
    "id": "ojnaremyr-w311644847",
    "name": "Ojnaremyr",
    "category": "natur",
    "lat": 57.866248,
    "lng": 18.964461,
    "description": "Naturupplevelse"
  },
  {
    "id": "okq8-n52582606",
    "name": "OKQ8",
    "category": "service",
    "lat": 57.638378,
    "lng": 18.300892,
    "description": "Bensinstation"
  },
  {
    "id": "okq8-n874386476",
    "name": "OKQ8",
    "category": "service",
    "lat": 57.503838,
    "lng": 18.456094,
    "description": "Bensinstation"
  },
  {
    "id": "okq8-n3002047436",
    "name": "OKQ8",
    "category": "service",
    "lat": 57.237097,
    "lng": 18.382505,
    "description": "Bensinstation"
  },
  {
    "id": "okq8-minipris-w295476054",
    "name": "OKQ8 Minipris",
    "category": "service",
    "lat": 57.625651,
    "lng": 18.274111,
    "description": "Bensinstation"
  },
  {
    "id": "olf-palmes-minnesplats-sudersund-n9961775775",
    "name": "Olf Palmes minnesplats Sudersund",
    "category": "sevardhet",
    "lat": 57.956488,
    "lng": 19.252076,
    "description": "Historisk plats"
  },
  {
    "id": "ollajvs-naturreservat-r1459277",
    "name": "Ollajvs naturreservat",
    "category": "natur",
    "lat": 57.326511,
    "lng": 18.671251,
    "description": "Naturreservat"
  },
  {
    "id": "oscarsstenen-n4166098288",
    "name": "Oscarsstenen",
    "category": "sevardhet",
    "lat": 57.618646,
    "lng": 18.274614,
    "description": "Historisk plats"
  },
  {
    "id": "othems-kyrka-w530358997",
    "name": "Othems kyrka",
    "category": "sevardhet",
    "lat": 57.747395,
    "lng": 18.738785,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "p18-idrottsplats-r15031848",
    "name": "P18 idrottsplats",
    "category": "aktivitet",
    "lat": 57.61088,
    "lng": 18.282117,
    "description": "Idrottsanläggning"
  },
  {
    "id": "p18-motionscentral-n5025051641",
    "name": "P18 Motionscentral",
    "category": "aktivitet",
    "lat": 57.60593,
    "lng": 18.280528,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "p18-skjutbanor-r11489469",
    "name": "P18 Skjutbanor",
    "category": "aktivitet",
    "lat": 57.605634,
    "lng": 18.269061,
    "description": "Idrottsanläggning"
  },
  {
    "id": "paddeltennis-w834228005",
    "name": "Paddeltennis",
    "category": "aktivitet",
    "lat": 57.486899,
    "lng": 18.131786,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "pankar-w102775308",
    "name": "Pankar",
    "category": "natur",
    "lat": 57.132459,
    "lng": 18.375946,
    "description": "Naturreservat"
  },
  {
    "id": "pannkakstradet-w823568654",
    "name": "Pannkaksträdet",
    "category": "familj",
    "lat": 57.708138,
    "lng": 18.372165,
    "description": "Lekplats"
  },
  {
    "id": "paradiset-n2320588645",
    "name": "Paradiset",
    "category": "mat",
    "lat": 57.64151,
    "lng": 18.295434,
    "description": "Café"
  },
  {
    "id": "pastamakarna-w484297663",
    "name": "Pastamakarna",
    "category": "mat",
    "lat": 57.907075,
    "lng": 19.107503,
    "description": "Restaurang"
  },
  {
    "id": "paviken-r17948854",
    "name": "Paviken",
    "category": "natur",
    "lat": 57.456458,
    "lng": 18.140455,
    "description": "Naturupplevelse"
  },
  {
    "id": "paviken-r17948856",
    "name": "Paviken",
    "category": "natur",
    "lat": 57.453887,
    "lng": 18.144091,
    "description": "Naturreservat"
  },
  {
    "id": "pelle-n12892450666",
    "name": "Pelle",
    "category": "shopping",
    "lat": 57.636504,
    "lng": 18.293788,
    "description": "Butik"
  },
  {
    "id": "pensionat-gra-gasen-n10740046624",
    "name": "Pensionat Grå Gåsen",
    "category": "service",
    "lat": 57.03939,
    "lng": 18.28701,
    "description": "Laddstation"
  },
  {
    "id": "pensionat-holmhallar-n4317566353",
    "name": "Pensionat Holmhällar",
    "category": "boende",
    "lat": 56.934703,
    "lng": 18.28813,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "pensionat-warfsholm-n632446436",
    "name": "Pensionat Warfsholm",
    "category": "boende",
    "lat": 57.390157,
    "lng": 18.190655,
    "description": "Vandrarhem"
  },
  {
    "id": "petarve-vattensag-n2384744219",
    "name": "Petarve vattensåg",
    "category": "sevardhet",
    "lat": 57.435164,
    "lng": 18.250317,
    "description": "Besöksmål"
  },
  {
    "id": "phase-nine-n12877304746",
    "name": "Phase Nine",
    "category": "shopping",
    "lat": 57.637694,
    "lng": 18.294932,
    "description": "Butik"
  },
  {
    "id": "picco-n13059907748",
    "name": "Picco",
    "category": "shopping",
    "lat": 57.635832,
    "lng": 18.292983,
    "description": "Butik"
  },
  {
    "id": "pinchos-n318701858",
    "name": "Pinchos",
    "category": "mat",
    "lat": 57.634994,
    "lng": 18.291732,
    "description": "Restaurang"
  },
  {
    "id": "pingstkyrkan-w315912055",
    "name": "Pingstkyrkan",
    "category": "sevardhet",
    "lat": 57.627541,
    "lng": 18.302516,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "pizzaboden-n1845077872",
    "name": "Pizzaboden",
    "category": "mat",
    "lat": 57.317957,
    "lng": 18.166848,
    "description": "Restaurang"
  },
  {
    "id": "pizzeria-babbolina-n11059805465",
    "name": "Pizzeria Babbolina",
    "category": "mat",
    "lat": 57.263064,
    "lng": 18.207324,
    "description": "Restaurang"
  },
  {
    "id": "plaza-n12892441095",
    "name": "Plaza",
    "category": "mat",
    "lat": 57.640977,
    "lng": 18.295758,
    "description": "Restaurang"
  },
  {
    "id": "polhemsgarden-n2561810064",
    "name": "Polhemsgården",
    "category": "sevardhet",
    "lat": 57.736584,
    "lng": 18.611503,
    "description": "Besöksmål"
  },
  {
    "id": "polisen-w207319728",
    "name": "Polisen",
    "category": "service",
    "lat": 57.637196,
    "lng": 18.305537,
    "description": "Service"
  },
  {
    "id": "polisen-hemse-r115871",
    "name": "Polisen Hemse",
    "category": "service",
    "lat": 57.239293,
    "lng": 18.370637,
    "description": "Service"
  },
  {
    "id": "preem-n247134852",
    "name": "Preem",
    "category": "service",
    "lat": 57.390661,
    "lng": 18.198166,
    "description": "Bensinstation"
  },
  {
    "id": "preem-n247134865",
    "name": "Preem",
    "category": "service",
    "lat": 57.64515,
    "lng": 18.33195,
    "description": "Bensinstation"
  },
  {
    "id": "preem-n247134866",
    "name": "Preem",
    "category": "service",
    "lat": 57.626405,
    "lng": 18.31812,
    "description": "Bensinstation"
  },
  {
    "id": "preem-n247135391",
    "name": "Preem",
    "category": "service",
    "lat": 57.63604,
    "lng": 18.33201,
    "description": "Bensinstation"
  },
  {
    "id": "prima-i-backen-n12909499919",
    "name": "Prima i backen",
    "category": "shopping",
    "lat": 57.63939,
    "lng": 18.296641,
    "description": "Butik"
  },
  {
    "id": "prasthagamyr-w485430541",
    "name": "Prästhagamyr",
    "category": "natur",
    "lat": 57.929141,
    "lng": 19.124157,
    "description": "Naturupplevelse"
  },
  {
    "id": "putte-pa-lickers-w533036958",
    "name": "Putte på Lickers",
    "category": "shopping",
    "lat": 57.825812,
    "lng": 18.512721,
    "description": "Butik"
  },
  {
    "id": "paangen-mat-bar-n13999828201",
    "name": "PåÄngen Mat & Bar",
    "category": "mat",
    "lat": 57.832568,
    "lng": 18.806331,
    "description": "Restaurang"
  },
  {
    "id": "pauksanden-w482237280",
    "name": "Päuksanden",
    "category": "natur",
    "lat": 56.949677,
    "lng": 18.280325,
    "description": "Naturupplevelse"
  },
  {
    "id": "quality-hotel-breakfast-n12590982285",
    "name": "Quality Hotel breakfast",
    "category": "mat",
    "lat": 57.631951,
    "lng": 18.279727,
    "description": "Restaurang"
  },
  {
    "id": "quality-hotel-visby-w315908934",
    "name": "Quality Hotel Visby",
    "category": "boende",
    "lat": 57.631831,
    "lng": 18.280394,
    "description": "Hotell"
  },
  {
    "id": "rannarve-rose-n6374234542",
    "name": "Rannarve Röse",
    "category": "sevardhet",
    "lat": 57.397657,
    "lng": 18.225561,
    "description": "Historisk plats"
  },
  {
    "id": "rannarve-skeppssattningar-n2376496025",
    "name": "Rannarve Skeppssättningar",
    "category": "sevardhet",
    "lat": 57.395824,
    "lng": 18.224052,
    "description": "Historisk plats"
  },
  {
    "id": "raudstajnsstrand-w482269629",
    "name": "Raudstajnsstrand",
    "category": "strand",
    "lat": 57.974624,
    "lng": 19.2769,
    "description": "Badplats"
  },
  {
    "id": "rc-falt-w835980550",
    "name": "RC-Fält",
    "category": "aktivitet",
    "lat": 57.56428,
    "lng": 18.279973,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "re-market-n10764689258",
    "name": "Re:Market",
    "category": "mat",
    "lat": 57.38601,
    "lng": 18.199762,
    "description": "Café"
  },
  {
    "id": "recharge-mcdonald-s-visby-n7519773057",
    "name": "Recharge McDonald's Visby",
    "category": "service",
    "lat": 57.621449,
    "lng": 18.320556,
    "description": "Laddstation"
  },
  {
    "id": "restaurang-china-n315985687",
    "name": "Restaurang China",
    "category": "mat",
    "lat": 57.635053,
    "lng": 18.291366,
    "description": "Restaurang"
  },
  {
    "id": "ringshagen-w482269702",
    "name": "Ringshagen",
    "category": "natur",
    "lat": 57.862619,
    "lng": 19.102811,
    "description": "Naturupplevelse"
  },
  {
    "id": "rojramyr-w498975316",
    "name": "Rojramyr",
    "category": "natur",
    "lat": 57.967924,
    "lng": 19.18365,
    "description": "Naturupplevelse"
  },
  {
    "id": "rojrhagen-n6373569137",
    "name": "Rojrhagen",
    "category": "sevardhet",
    "lat": 57.282586,
    "lng": 18.403214,
    "description": "Historisk plats"
  },
  {
    "id": "roma-klosterruin-w225002136",
    "name": "Roma klosterruin",
    "category": "sevardhet",
    "lat": 57.516171,
    "lng": 18.46042,
    "description": "Historisk plats"
  },
  {
    "id": "roma-kungsgard-n2338332791",
    "name": "Roma Kungsgård",
    "category": "sevardhet",
    "lat": 57.516066,
    "lng": 18.458972,
    "description": "Museum"
  },
  {
    "id": "roma-kyrka-w305232214",
    "name": "Roma kyrka",
    "category": "sevardhet",
    "lat": 57.528425,
    "lng": 18.442022,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "romabrunnen-w551289836",
    "name": "Romabrunnen",
    "category": "mat",
    "lat": 57.507259,
    "lng": 18.451494,
    "description": "Restaurang"
  },
  {
    "id": "rone-kyrka-w1191887712",
    "name": "Rone kyrka",
    "category": "sevardhet",
    "lat": 57.208985,
    "lng": 18.441224,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ronehamns-camping-n272661585",
    "name": "Ronehamns camping",
    "category": "boende",
    "lat": 57.171699,
    "lng": 18.486005,
    "description": "Camping"
  },
  {
    "id": "ronehamns-livs-n272661160",
    "name": "Ronehamns livs",
    "category": "shopping",
    "lat": 57.179797,
    "lng": 18.479241,
    "description": "Butik"
  },
  {
    "id": "rongarde-w102776159",
    "name": "Rongärde",
    "category": "natur",
    "lat": 57.381842,
    "lng": 18.483824,
    "description": "Naturreservat"
  },
  {
    "id": "ronkelsmyr-w379563635",
    "name": "Ronkelsmyr",
    "category": "natur",
    "lat": 57.780927,
    "lng": 18.668969,
    "description": "Naturupplevelse"
  },
  {
    "id": "royhuset-n8902966067",
    "name": "Royhuset",
    "category": "boende",
    "lat": 57.864033,
    "lng": 19.050732,
    "description": "Hotell"
  },
  {
    "id": "runtumyr-w484281169",
    "name": "Runtumyr",
    "category": "natur",
    "lat": 57.884387,
    "lng": 19.138037,
    "description": "Naturupplevelse"
  },
  {
    "id": "russmyr-w530645657",
    "name": "Russmyr",
    "category": "natur",
    "lat": 57.882509,
    "lng": 18.637952,
    "description": "Naturupplevelse"
  },
  {
    "id": "russvatarna-r16204868",
    "name": "Russvätarna",
    "category": "natur",
    "lat": 57.389117,
    "lng": 18.734665,
    "description": "Naturupplevelse"
  },
  {
    "id": "russvatars-naturreservat-w896245986",
    "name": "Russvätars naturreservat",
    "category": "natur",
    "lat": 57.388863,
    "lng": 18.737003,
    "description": "Naturreservat"
  },
  {
    "id": "rusta-n5190620232",
    "name": "Rusta",
    "category": "shopping",
    "lat": 57.633278,
    "lng": 18.326474,
    "description": "Butik"
  },
  {
    "id": "rute-23-1-n6373759857",
    "name": "Rute 23:1",
    "category": "sevardhet",
    "lat": 57.798048,
    "lng": 18.947895,
    "description": "Historisk plats"
  },
  {
    "id": "rute-kyrka-w437167947",
    "name": "Rute kyrka",
    "category": "sevardhet",
    "lat": 57.833709,
    "lng": 18.923528,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "rute-stenugnsbageri-n454109520",
    "name": "Rute Stenugnsbageri",
    "category": "mat",
    "lat": 57.818622,
    "lng": 18.911155,
    "description": "Café"
  },
  {
    "id": "rutemyr-w379563622",
    "name": "Rutemyr",
    "category": "natur",
    "lat": 57.84591,
    "lng": 18.921493,
    "description": "Naturupplevelse"
  },
  {
    "id": "ryska-kanonerna-n5635864730",
    "name": "Ryska Kanonerna",
    "category": "sevardhet",
    "lat": 58.350792,
    "lng": 19.299256,
    "description": "Historisk plats"
  },
  {
    "id": "ryska-kyrkogarden-n5635864729",
    "name": "Ryska kyrkogården",
    "category": "sevardhet",
    "lat": 58.351616,
    "lng": 19.297977,
    "description": "Historisk plats"
  },
  {
    "id": "ryssnas-r7100483",
    "name": "Ryssnäs",
    "category": "natur",
    "lat": 57.850176,
    "lng": 19.115865,
    "description": "Naturreservat"
  },
  {
    "id": "rabytrask-w967290346",
    "name": "Råbyträsk",
    "category": "natur",
    "lat": 57.57721,
    "lng": 18.671607,
    "description": "Naturupplevelse"
  },
  {
    "id": "rantlausmyr-w530645632",
    "name": "Räntlausmyr",
    "category": "natur",
    "lat": 57.844283,
    "lng": 18.649979,
    "description": "Naturupplevelse"
  },
  {
    "id": "ravhagen-w205311727",
    "name": "Rävhagen",
    "category": "aktivitet",
    "lat": 57.624972,
    "lng": 18.326643,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "rojsu-w566746570",
    "name": "Röjsu",
    "category": "sevardhet",
    "lat": 57.288296,
    "lng": 17.981662,
    "description": "Historisk plats"
  },
  {
    "id": "rovar-liljas-hala-n1065974088",
    "name": "Rövar Liljas håla",
    "category": "smultronstallen",
    "lat": 57.593626,
    "lng": 18.191905,
    "description": "Utsiktsplats"
  },
  {
    "id": "s-t-goransgatan-31-n6631917770",
    "name": "S:t Göransgatan 31",
    "category": "service",
    "lat": 57.652321,
    "lng": 18.306378,
    "description": "Laddstation"
  },
  {
    "id": "s-t-olofsholm-badstrand-n14006218026",
    "name": "S:t Olofsholm badstrand",
    "category": "strand",
    "lat": 57.729848,
    "lng": 18.955775,
    "description": "Badplats"
  },
  {
    "id": "sail-racing-n12889094597",
    "name": "Sail Racing",
    "category": "shopping",
    "lat": 57.638825,
    "lng": 18.288682,
    "description": "Butik"
  },
  {
    "id": "sajgs-r1459266",
    "name": "Sajgs",
    "category": "natur",
    "lat": 57.725284,
    "lng": 18.89646,
    "description": "Naturreservat"
  },
  {
    "id": "salmbarshagen-w102775873",
    "name": "Salmbärshagen",
    "category": "natur",
    "lat": 57.804541,
    "lng": 18.560679,
    "description": "Naturreservat"
  },
  {
    "id": "salteriet-ljugarn-n14002303060",
    "name": "Salteriet Ljugarn",
    "category": "mat",
    "lat": 57.323304,
    "lng": 18.711299,
    "description": "Restaurang"
  },
  {
    "id": "salthamn-restaurang-n13057783776",
    "name": "Salthamn Restaurang",
    "category": "mat",
    "lat": 57.732561,
    "lng": 18.397691,
    "description": "Restaurang"
  },
  {
    "id": "salvia-n12068486577",
    "name": "Salvia",
    "category": "shopping",
    "lat": 56.969093,
    "lng": 18.230813,
    "description": "Butik"
  },
  {
    "id": "salvorev-kopparstenarnas-naturreservat-r1459272",
    "name": "Salvorev-Kopparstenarnas naturreservat",
    "category": "natur",
    "lat": 58.278015,
    "lng": 19.282424,
    "description": "Naturreservat"
  },
  {
    "id": "sanda-58-1-n6373703775",
    "name": "Sanda 58:1",
    "category": "sevardhet",
    "lat": 57.454537,
    "lng": 18.206669,
    "description": "Historisk plats"
  },
  {
    "id": "sanda-kyrka-w209257974",
    "name": "Sanda kyrka",
    "category": "sevardhet",
    "lat": 57.429282,
    "lng": 18.223237,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "sandarve-kulle-naturreservat-w102775295",
    "name": "Sandarve kulle naturreservat",
    "category": "natur",
    "lat": 57.275425,
    "lng": 18.345281,
    "description": "Naturreservat"
  },
  {
    "id": "sandhamns-camping-n5038781046",
    "name": "Sandhamns Camping",
    "category": "boende",
    "lat": 57.31683,
    "lng": 18.166516,
    "description": "Camping"
  },
  {
    "id": "sandviken-n8841510024",
    "name": "Sandviken",
    "category": "strand",
    "lat": 57.397217,
    "lng": 18.873966,
    "description": "Badplats"
  },
  {
    "id": "sandvikens-campig-w617270752",
    "name": "Sandvikens Campig",
    "category": "boende",
    "lat": 57.401357,
    "lng": 18.875597,
    "description": "Camping"
  },
  {
    "id": "sandvikens-camping-w617270900",
    "name": "Sandvikens camping",
    "category": "boende",
    "lat": 57.399934,
    "lng": 18.875056,
    "description": "Camping"
  },
  {
    "id": "sandvikens-naturreservat-w528208449",
    "name": "Sandvikens naturreservat",
    "category": "natur",
    "lat": 57.397868,
    "lng": 18.872423,
    "description": "Naturreservat"
  },
  {
    "id": "sandvikens-strand-w708078874",
    "name": "Sandvikens Strand",
    "category": "strand",
    "lat": 57.395506,
    "lng": 18.874823,
    "description": "Badstrand"
  },
  {
    "id": "sandwich-bar-n12877293845",
    "name": "Sandwich Bar",
    "category": "mat",
    "lat": 57.637988,
    "lng": 18.30121,
    "description": "Snabbmat"
  },
  {
    "id": "sangelstainen-n6373753075",
    "name": "Sangelstainen",
    "category": "sevardhet",
    "lat": 57.78312,
    "lng": 18.810094,
    "description": "Historisk plats"
  },
  {
    "id": "sankt-clemens-kyrkoruin-w531813266",
    "name": "Sankt Clemens kyrkoruin",
    "category": "sevardhet",
    "lat": 57.64314,
    "lng": 18.296147,
    "description": "Besöksmål"
  },
  {
    "id": "sankt-gorans-kyrkoruin-w302506172",
    "name": "Sankt Görans kyrkoruin",
    "category": "sevardhet",
    "lat": 57.64768,
    "lng": 18.303379,
    "description": "Besöksmål"
  },
  {
    "id": "sankt-goransporten-n6634264854",
    "name": "Sankt Göransporten",
    "category": "sevardhet",
    "lat": 57.645448,
    "lng": 18.299584,
    "description": "Historisk plats"
  },
  {
    "id": "sankt-hans-cafe-n6641676474",
    "name": "Sankt Hans Cafe",
    "category": "mat",
    "lat": 57.638411,
    "lng": 18.292735,
    "description": "Café"
  },
  {
    "id": "sankt-hans-och-sankt-pers-kyrkoruiner-w508536373",
    "name": "Sankt Hans och Sankt Pers kyrkoruiner",
    "category": "sevardhet",
    "lat": 57.638071,
    "lng": 18.292817,
    "description": "Besöksmål"
  },
  {
    "id": "sankt-lars-kyrkoruin-n12897010038",
    "name": "Sankt Lars kyrkoruin",
    "category": "sevardhet",
    "lat": 57.641511,
    "lng": 18.295161,
    "description": "Turistinformation"
  },
  {
    "id": "sankt-nicolai-kyrkoruin-w126807117",
    "name": "Sankt Nicolai kyrkoruin",
    "category": "sevardhet",
    "lat": 57.644147,
    "lng": 18.29807,
    "description": "Besöksmål"
  },
  {
    "id": "sankt-olofs-kyrka-n696071874",
    "name": "Sankt Olofs kyrka",
    "category": "sevardhet",
    "lat": 57.942102,
    "lng": 19.090214,
    "description": "Historisk plats"
  },
  {
    "id": "sankt-olofs-kyrkoruin-n13092537887",
    "name": "Sankt Olofs Kyrkoruin",
    "category": "sevardhet",
    "lat": 57.643114,
    "lng": 18.293818,
    "description": "Historisk plats"
  },
  {
    "id": "sankt-olofsholms-naturreservat-w102775301",
    "name": "Sankt Olofsholms naturreservat",
    "category": "natur",
    "lat": 57.715922,
    "lng": 18.910262,
    "description": "Naturreservat"
  },
  {
    "id": "sankta-katarina-ruin-w227838338",
    "name": "Sankta Katarina ruin",
    "category": "sevardhet",
    "lat": 57.640439,
    "lng": 18.295673,
    "description": "Besöksmål"
  },
  {
    "id": "sankta-maria-domkyrka-w127396508",
    "name": "Sankta Maria domkyrka",
    "category": "sevardhet",
    "lat": 57.641847,
    "lng": 18.298051,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "scandic-hotels-w1358332507",
    "name": "Scandic Hotels",
    "category": "boende",
    "lat": 57.633411,
    "lng": 18.282242,
    "description": "Hotell"
  },
  {
    "id": "segment-b-w280186210",
    "name": "segment B",
    "category": "natur",
    "lat": 57.38907,
    "lng": 18.21305,
    "description": "Skyddat naturområde"
  },
  {
    "id": "segment-c-w280186251",
    "name": "Segment C",
    "category": "natur",
    "lat": 57.387013,
    "lng": 18.219894,
    "description": "Skyddat naturområde"
  },
  {
    "id": "shawarma-bar-n4322086600",
    "name": "Shawarma bar",
    "category": "mat",
    "lat": 57.638869,
    "lng": 18.297565,
    "description": "Restaurang"
  },
  {
    "id": "shipwreck-fortuna-n1127172958",
    "name": "Shipwreck Fortuna",
    "category": "sevardhet",
    "lat": 57.995868,
    "lng": 19.243954,
    "description": "Historisk plats"
  },
  {
    "id": "sibylla-n12903356274",
    "name": "Sibylla",
    "category": "mat",
    "lat": 57.633434,
    "lng": 18.324523,
    "description": "Snabbmat"
  },
  {
    "id": "sibylla-w462905908",
    "name": "Sibylla",
    "category": "mat",
    "lat": 57.616401,
    "lng": 18.285073,
    "description": "Snabbmat"
  },
  {
    "id": "sigdes-naturreservat-w102775290",
    "name": "Sigdes naturreservat",
    "category": "natur",
    "lat": 57.255373,
    "lng": 18.489812,
    "description": "Naturreservat"
  },
  {
    "id": "sigfride-w528208487",
    "name": "Sigfride",
    "category": "natur",
    "lat": 57.831258,
    "lng": 18.954436,
    "description": "Naturreservat"
  },
  {
    "id": "siglajvs-naturreservat-w620586499",
    "name": "Siglajvs naturreservat",
    "category": "natur",
    "lat": 57.817372,
    "lng": 18.941026,
    "description": "Naturreservat"
  },
  {
    "id": "sigsarve-vattensag-n1846061506",
    "name": "Sigsarve vattensåg",
    "category": "sevardhet",
    "lat": 57.41069,
    "lng": 18.363357,
    "description": "Besöksmål"
  },
  {
    "id": "sikhagsvat-w710597462",
    "name": "Sikhagsvät",
    "category": "natur",
    "lat": 57.538259,
    "lng": 18.627968,
    "description": "Naturupplevelse"
  },
  {
    "id": "silte-kyrka-w1191887710",
    "name": "Silte kyrka",
    "category": "sevardhet",
    "lat": 57.221043,
    "lng": 18.236767,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "simbassang-w549036140",
    "name": "Simbassäng",
    "category": "aktivitet",
    "lat": 57.507514,
    "lng": 18.445531,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "sinkmyr-w525598034",
    "name": "Sinkmyr",
    "category": "natur",
    "lat": 57.55193,
    "lng": 18.719459,
    "description": "Naturupplevelse"
  },
  {
    "id": "sjalso-bageri-n4345147110",
    "name": "Sjalso Bageri",
    "category": "shopping",
    "lat": 57.690005,
    "lng": 18.355234,
    "description": "Butik"
  },
  {
    "id": "sjonhem-16-1-n6373692864",
    "name": "Sjonhem 16:1",
    "category": "sevardhet",
    "lat": 57.472434,
    "lng": 18.497389,
    "description": "Historisk plats"
  },
  {
    "id": "sjonhem-kyrka-w1125607517",
    "name": "Sjonhem kyrka",
    "category": "sevardhet",
    "lat": 57.485577,
    "lng": 18.520745,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "sjumastarn-n2974861177",
    "name": "Sjumastarn",
    "category": "mat",
    "lat": 57.636241,
    "lng": 18.28616,
    "description": "Bar"
  },
  {
    "id": "sjalso-fisk-w1311696006",
    "name": "Själsö Fisk",
    "category": "shopping",
    "lat": 57.692919,
    "lng": 18.352276,
    "description": "Butik"
  },
  {
    "id": "sjalsoan-w102775381",
    "name": "Själsöån",
    "category": "natur",
    "lat": 57.693533,
    "lng": 18.356993,
    "description": "Naturreservat"
  },
  {
    "id": "sjofartsmuseum-w238968957",
    "name": "Sjöfartsmuseum",
    "category": "sevardhet",
    "lat": 57.705691,
    "lng": 18.808921,
    "description": "Museum"
  },
  {
    "id": "sjorovarskeppen-w1087514338",
    "name": "Sjörövarskeppen",
    "category": "aktivitet",
    "lat": 57.608657,
    "lng": 18.244507,
    "description": "Aktivitet"
  },
  {
    "id": "skalahauar-r7100478",
    "name": "Skalahauar",
    "category": "natur",
    "lat": 57.959656,
    "lng": 19.330076,
    "description": "Naturreservat"
  },
  {
    "id": "skans-2-w437657274",
    "name": "Skans 2",
    "category": "sevardhet",
    "lat": 57.741639,
    "lng": 18.604017,
    "description": "Historisk plats"
  },
  {
    "id": "skans-3-w437657275",
    "name": "Skans 3",
    "category": "sevardhet",
    "lat": 57.733739,
    "lng": 18.589599,
    "description": "Historisk plats"
  },
  {
    "id": "skans-4-w437657276",
    "name": "Skans 4",
    "category": "sevardhet",
    "lat": 57.729,
    "lng": 18.585455,
    "description": "Historisk plats"
  },
  {
    "id": "skans-5-w437657277",
    "name": "Skans 5",
    "category": "sevardhet",
    "lat": 57.72317,
    "lng": 18.600281,
    "description": "Historisk plats"
  },
  {
    "id": "skansport-n12133238362",
    "name": "Skansport",
    "category": "sevardhet",
    "lat": 57.634936,
    "lng": 18.28807,
    "description": "Historisk plats"
  },
  {
    "id": "skatehall-n274838463",
    "name": "Skatehall",
    "category": "aktivitet",
    "lat": 57.639308,
    "lng": 18.312763,
    "description": "Idrottsanläggning"
  },
  {
    "id": "skeppsbron-n1798251637",
    "name": "Skeppsbron",
    "category": "mat",
    "lat": 57.637942,
    "lng": 18.288118,
    "description": "Restaurang"
  },
  {
    "id": "skogshamra-n10740026982",
    "name": "Skogshamra",
    "category": "service",
    "lat": 56.97989,
    "lng": 18.31433,
    "description": "Laddstation"
  },
  {
    "id": "skokanonen-n1404612435",
    "name": "Skokanonen",
    "category": "shopping",
    "lat": 57.623034,
    "lng": 18.324817,
    "description": "Butik"
  },
  {
    "id": "skolhuset-n10740046633",
    "name": "Skolhuset",
    "category": "service",
    "lat": 57.42153,
    "lng": 18.85776,
    "description": "Laddstation"
  },
  {
    "id": "skolhusets-tradgardscafe-n4358957393",
    "name": "Skolhusets trädgårdscafé",
    "category": "mat",
    "lat": 57.421487,
    "lng": 18.857833,
    "description": "Café"
  },
  {
    "id": "skumpanerna-n3036788570",
    "name": "Skumpanerna",
    "category": "mat",
    "lat": 57.863026,
    "lng": 19.055612,
    "description": "Restaurang"
  },
  {
    "id": "skvalpviks-badstrand-n14006237474",
    "name": "Skvalpviks badstrand",
    "category": "strand",
    "lat": 56.937288,
    "lng": 18.296298,
    "description": "Badplats"
  },
  {
    "id": "slite-camping-w377678267",
    "name": "Slite Camping",
    "category": "boende",
    "lat": 57.69934,
    "lng": 18.800775,
    "description": "Camping"
  },
  {
    "id": "slite-golfklubb-r13081689",
    "name": "Slite Golfklubb",
    "category": "aktivitet",
    "lat": 57.71766,
    "lng": 18.743242,
    "description": "Golfbana"
  },
  {
    "id": "slite-kyrka-w431971303",
    "name": "Slite kyrka",
    "category": "sevardhet",
    "lat": 57.707519,
    "lng": 18.795942,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "slite-skargards-naturreservat-r7611530",
    "name": "Slite skärgårds naturreservat",
    "category": "natur",
    "lat": 57.720939,
    "lng": 18.928135,
    "description": "Naturreservat"
  },
  {
    "id": "slite-strandby-n10740046637",
    "name": "Slite strandby",
    "category": "service",
    "lat": 57.69805,
    "lng": 18.79976,
    "description": "Laddstation"
  },
  {
    "id": "slitebaden-hotell-och-restaurang-n9666005187",
    "name": "Slitebaden hotell och restaurang",
    "category": "boende",
    "lat": 57.704769,
    "lng": 18.807342,
    "description": "Hotell"
  },
  {
    "id": "slottet-n1809286612",
    "name": "Slottet",
    "category": "smultronstallen",
    "lat": 57.411876,
    "lng": 18.731497,
    "description": "Utsiktsplats"
  },
  {
    "id": "slottshamnen-n60018816",
    "name": "Slottshamnen",
    "category": "aktivitet",
    "lat": 57.63527,
    "lng": 18.281492,
    "description": "Småbåtshamn"
  },
  {
    "id": "slow-train-bed-breakfast-w496794607",
    "name": "Slow Train Bed & Breakfast",
    "category": "boende",
    "lat": 57.934773,
    "lng": 19.165184,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "slakmyr-w379563634",
    "name": "Släkmyr",
    "category": "natur",
    "lat": 57.860064,
    "lng": 18.920032,
    "description": "Naturupplevelse"
  },
  {
    "id": "slakte-n12892439094",
    "name": "Släkte",
    "category": "shopping",
    "lat": 57.637199,
    "lng": 18.294551,
    "description": "Butik"
  },
  {
    "id": "slaktaktsvagens-badstrand-n14006218867",
    "name": "Släktäktsvägens badstrand",
    "category": "strand",
    "lat": 57.495758,
    "lng": 18.12195,
    "description": "Badplats"
  },
  {
    "id": "smaklosa-museum-n11063410832",
    "name": "Smaklösa Museum",
    "category": "sevardhet",
    "lat": 57.437028,
    "lng": 18.14476,
    "description": "Museum"
  },
  {
    "id": "smakrike-krog-n559420063",
    "name": "Smakrike Krog",
    "category": "mat",
    "lat": 57.33017,
    "lng": 18.708623,
    "description": "Restaurang"
  },
  {
    "id": "smakrike-logi-n559420065",
    "name": "Smakrike Logi",
    "category": "boende",
    "lat": 57.33018,
    "lng": 18.708996,
    "description": "Hotell"
  },
  {
    "id": "smaulmyrar-w525649506",
    "name": "Smaulmyrar",
    "category": "natur",
    "lat": 57.360912,
    "lng": 18.624744,
    "description": "Naturupplevelse"
  },
  {
    "id": "smaulmyrars-naturreservat-w895701664",
    "name": "Smaulmyrars naturreservat",
    "category": "natur",
    "lat": 57.356816,
    "lng": 18.625354,
    "description": "Naturreservat"
  },
  {
    "id": "smiss-slott-n1853513911",
    "name": "Smiss slott",
    "category": "sevardhet",
    "lat": 57.226939,
    "lng": 18.341565,
    "description": "Besöksmål"
  },
  {
    "id": "smojumyr-w497223231",
    "name": "Smojumyr",
    "category": "natur",
    "lat": 57.966345,
    "lng": 19.095233,
    "description": "Naturupplevelse"
  },
  {
    "id": "smagarde-naturskog-r6604938",
    "name": "Smågårde naturskog",
    "category": "natur",
    "lat": 57.493477,
    "lng": 18.128772,
    "description": "Naturreservat"
  },
  {
    "id": "snausarve-gardsby-n8907196818",
    "name": "Snausarve Gardsby",
    "category": "mat",
    "lat": 57.22719,
    "lng": 18.210678,
    "description": "Restaurang"
  },
  {
    "id": "snaltorps-naturreservat-w897784138",
    "name": "Snåltorps naturreservat",
    "category": "natur",
    "lat": 57.465816,
    "lng": 18.121575,
    "description": "Naturreservat"
  },
  {
    "id": "snackan-w422062263",
    "name": "Snäckan",
    "category": "boende",
    "lat": 57.39584,
    "lng": 18.18624,
    "description": "Camping"
  },
  {
    "id": "snackgardsporten-n2320592905",
    "name": "Snäckgärdsporten",
    "category": "sevardhet",
    "lat": 57.646723,
    "lng": 18.29657,
    "description": "Historisk plats"
  },
  {
    "id": "snackgardstornet-w508436776",
    "name": "Snäckgärdstornet",
    "category": "sevardhet",
    "lat": 57.646693,
    "lng": 18.296537,
    "description": "Historisk plats"
  },
  {
    "id": "snogrindebanan-w491301932",
    "name": "Snögrindebanan",
    "category": "aktivitet",
    "lat": 57.360404,
    "lng": 18.249632,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "snogrindebanan-pistol-w491302078",
    "name": "Snögrindebanan pistol",
    "category": "aktivitet",
    "lat": 57.359474,
    "lng": 18.252253,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "snogrindebanans-lekplats-w491300509",
    "name": "Snögrindebanans lekplats",
    "category": "familj",
    "lat": 57.358739,
    "lng": 18.249917,
    "description": "Lekplats"
  },
  {
    "id": "snogrindes-naturreservat-w897784135",
    "name": "Snögrindes naturreservat",
    "category": "natur",
    "lat": 57.363003,
    "lng": 18.292846,
    "description": "Naturreservat"
  },
  {
    "id": "sojdmyr-w431586583",
    "name": "Sojdmyr",
    "category": "natur",
    "lat": 57.565394,
    "lng": 18.708056,
    "description": "Naturupplevelse"
  },
  {
    "id": "sojdmyrs-naturreservat-r12193516",
    "name": "Sojdmyrs naturreservat",
    "category": "natur",
    "lat": 57.564876,
    "lng": 18.708932,
    "description": "Naturreservat"
  },
  {
    "id": "sojdsmyr-w530645648",
    "name": "Sojdsmyr",
    "category": "natur",
    "lat": 57.859266,
    "lng": 18.648782,
    "description": "Naturupplevelse"
  },
  {
    "id": "solbergabadet-w33352218",
    "name": "Solbergabadet",
    "category": "aktivitet",
    "lat": 57.635672,
    "lng": 18.30056,
    "description": "Idrottsanläggning"
  },
  {
    "id": "solfagel-n5153154556",
    "name": "Solfågel",
    "category": "sevardhet",
    "lat": 57.640558,
    "lng": 18.291058,
    "description": "Sevärdhet"
  },
  {
    "id": "solgrinde-w429887859",
    "name": "Solgrinde",
    "category": "boende",
    "lat": 57.735849,
    "lng": 18.885792,
    "description": "Camping"
  },
  {
    "id": "solhaga-w482648160",
    "name": "Solhaga",
    "category": "boende",
    "lat": 57.889724,
    "lng": 19.092512,
    "description": "Camping"
  },
  {
    "id": "solklintshallen-w378740703",
    "name": "Solklintshallen",
    "category": "aktivitet",
    "lat": 57.706682,
    "lng": 18.792648,
    "description": "Idrottsanläggning"
  },
  {
    "id": "solsidan-w1087504467",
    "name": "Solsidan",
    "category": "mat",
    "lat": 57.610929,
    "lng": 18.246251,
    "description": "Restaurang"
  },
  {
    "id": "sonja-akessons-park-n1853527130",
    "name": "Sonja Åkessons park",
    "category": "sevardhet",
    "lat": 57.162287,
    "lng": 18.337547,
    "description": "Besöksmål"
  },
  {
    "id": "sotalvret-w497223322",
    "name": "Sotalvret",
    "category": "natur",
    "lat": 57.97213,
    "lng": 19.107998,
    "description": "Naturupplevelse"
  },
  {
    "id": "spittlemyr-w379563624",
    "name": "Spittlemyr",
    "category": "natur",
    "lat": 57.807738,
    "lng": 18.703405,
    "description": "Naturupplevelse"
  },
  {
    "id": "sproge-kyrka-w1191887708",
    "name": "Sproge kyrka",
    "category": "sevardhet",
    "lat": 57.253641,
    "lng": 18.210903,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "st1-n52592674",
    "name": "St1",
    "category": "service",
    "lat": 57.629428,
    "lng": 18.286363,
    "description": "Bensinstation"
  },
  {
    "id": "st1-n1842225571",
    "name": "St1",
    "category": "shopping",
    "lat": 57.631762,
    "lng": 18.33019,
    "description": "Bensinstation"
  },
  {
    "id": "stadshagen-w464127866",
    "name": "Stadshagen",
    "category": "natur",
    "lat": 57.621515,
    "lng": 18.345703,
    "description": "Naturupplevelse"
  },
  {
    "id": "stadshajden-w464127847",
    "name": "Stadshajden",
    "category": "natur",
    "lat": 57.620555,
    "lng": 18.365188,
    "description": "Naturupplevelse"
  },
  {
    "id": "stafva-gard-n10740026993",
    "name": "Stafva gård",
    "category": "service",
    "lat": 57.55399,
    "lng": 18.43845,
    "description": "Laddstation"
  },
  {
    "id": "stafva-gardsbutik-n12125059006",
    "name": "Stafva gårdsbutik",
    "category": "shopping",
    "lat": 57.554516,
    "lng": 18.435832,
    "description": "Butik"
  },
  {
    "id": "stainstmyr-w533013707",
    "name": "Stainstmyr",
    "category": "natur",
    "lat": 57.921922,
    "lng": 18.723597,
    "description": "Naturupplevelse"
  },
  {
    "id": "stajnboalvaret-r7084996",
    "name": "Stajnboalvaret",
    "category": "natur",
    "lat": 56.932854,
    "lng": 18.146333,
    "description": "Naturupplevelse"
  },
  {
    "id": "stajnbrutsmyr-w377678269",
    "name": "Stajnbrutsmyr",
    "category": "natur",
    "lat": 57.732568,
    "lng": 18.687824,
    "description": "Naturupplevelse"
  },
  {
    "id": "stajnmyr-w443274471",
    "name": "Stajnmyr",
    "category": "natur",
    "lat": 57.481814,
    "lng": 18.136616,
    "description": "Naturupplevelse"
  },
  {
    "id": "stajntrask-w504337061",
    "name": "Stajnträsk",
    "category": "natur",
    "lat": 57.973419,
    "lng": 19.210896,
    "description": "Naturupplevelse"
  },
  {
    "id": "stangsmyr-w525637605",
    "name": "Stangsmyr",
    "category": "natur",
    "lat": 57.34168,
    "lng": 18.368682,
    "description": "Naturupplevelse"
  },
  {
    "id": "stapelvat-w497223411",
    "name": "Stapelvät",
    "category": "natur",
    "lat": 57.968588,
    "lng": 19.155831,
    "description": "Naturupplevelse"
  },
  {
    "id": "staursmyr-w530645646",
    "name": "Staursmyr",
    "category": "natur",
    "lat": 57.851779,
    "lng": 18.639813,
    "description": "Naturupplevelse"
  },
  {
    "id": "stenhuggarvagen-5-7-n10740026987",
    "name": "Stenhuggarvägen 5-7",
    "category": "service",
    "lat": 57.6214,
    "lng": 18.32107,
    "description": "Laddstation"
  },
  {
    "id": "stenhuse-gard-w208780746",
    "name": "Stenhuse Gård",
    "category": "shopping",
    "lat": 57.425571,
    "lng": 18.230244,
    "description": "Gårdsbutik"
  },
  {
    "id": "stenkumla-96-1-n6373731494",
    "name": "Stenkumla 96:1",
    "category": "sevardhet",
    "lat": 57.524409,
    "lng": 18.221747,
    "description": "Historisk plats"
  },
  {
    "id": "stenkumla-avrattningsplats-n12755469530",
    "name": "Stenkumla avrättningsplats",
    "category": "sevardhet",
    "lat": 57.550729,
    "lng": 18.268255,
    "description": "Historisk plats"
  },
  {
    "id": "stenkumla-kyrka-w462282415",
    "name": "Stenkumla kyrka",
    "category": "sevardhet",
    "lat": 57.547721,
    "lng": 18.268583,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "stenkyrka-halge-149-n10740026991",
    "name": "Stenkyrka Hälge 149",
    "category": "service",
    "lat": 57.8049,
    "lng": 18.51608,
    "description": "Laddstation"
  },
  {
    "id": "stenkyrka-kyrka-w610027234",
    "name": "Stenkyrka kyrka",
    "category": "sevardhet",
    "lat": 57.793241,
    "lng": 18.531476,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "stenkyrka-mejeri-w1299811537",
    "name": "Stenkyrka Mejeri",
    "category": "mat",
    "lat": 57.799111,
    "lng": 18.510668,
    "description": "Restaurang"
  },
  {
    "id": "stenmuseum-n4958498788",
    "name": "Stenmuseum",
    "category": "sevardhet",
    "lat": 56.942464,
    "lng": 18.149553,
    "description": "Museum"
  },
  {
    "id": "stenstugu-skog-w102775753",
    "name": "Stenstugu skog",
    "category": "natur",
    "lat": 57.455363,
    "lng": 18.758537,
    "description": "Naturreservat"
  },
  {
    "id": "stf-bunge-farosund-vandrarhem-w1068989724",
    "name": "STF Bunge/Fårösund Vandrarhem",
    "category": "boende",
    "lat": 57.853011,
    "lng": 19.03585,
    "description": "Vandrarhem"
  },
  {
    "id": "stf-larbro-vandrarhem-n448315584",
    "name": "STF Lärbro Vandrarhem",
    "category": "boende",
    "lat": 57.792442,
    "lng": 18.785466,
    "description": "Vandrarhem"
  },
  {
    "id": "stf-stora-karlso-n6651658880",
    "name": "STF Stora Karlsö",
    "category": "boende",
    "lat": 57.289339,
    "lng": 17.970332,
    "description": "Vandrarhem"
  },
  {
    "id": "stf-vandrarhem-ljugarn-w546620046",
    "name": "STF Vandrarhem Ljugarn",
    "category": "boende",
    "lat": 57.323522,
    "lng": 18.713205,
    "description": "Vandrarhem"
  },
  {
    "id": "stf-vandrarhem-visby-ravhagen-n624113029",
    "name": "STF Vandrarhem Visby/Rävhagen",
    "category": "boende",
    "lat": 57.62632,
    "lng": 18.331202,
    "description": "Vandrarhem"
  },
  {
    "id": "stf-visby-lagenhetshotell-n4216100282",
    "name": "STF Visby Lägenhetshotell",
    "category": "boende",
    "lat": 57.631791,
    "lng": 18.304975,
    "description": "Hotell"
  },
  {
    "id": "stf-ostra-flygeln-bunge-vandrarhem-w431979235",
    "name": "STF Östra Flygeln Bunge Vandrarhem",
    "category": "boende",
    "lat": 57.864118,
    "lng": 19.047618,
    "description": "Vandrarhem"
  },
  {
    "id": "stigmyr-w530645633",
    "name": "Stigmyr",
    "category": "natur",
    "lat": 57.833192,
    "lng": 18.638531,
    "description": "Naturupplevelse"
  },
  {
    "id": "stora-burge-gard-n10740046631",
    "name": "Stora Burge gård",
    "category": "service",
    "lat": 57.19552,
    "lng": 18.2294,
    "description": "Laddstation"
  },
  {
    "id": "stora-coop-n9726325370",
    "name": "Stora Coop",
    "category": "shopping",
    "lat": 57.621591,
    "lng": 18.322447,
    "description": "Butik"
  },
  {
    "id": "stora-dappan-w1190202666",
    "name": "Stora Däppan",
    "category": "natur",
    "lat": 57.126059,
    "lng": 18.221688,
    "description": "Naturupplevelse"
  },
  {
    "id": "stora-forvar-n6651664198",
    "name": "Stora Förvar",
    "category": "natur",
    "lat": 57.290103,
    "lng": 17.974929,
    "description": "Naturupplevelse"
  },
  {
    "id": "stora-hastnas-n814045399",
    "name": "Stora Hästnäs",
    "category": "sevardhet",
    "lat": 57.65987,
    "lng": 18.363324,
    "description": "Besöksmål"
  },
  {
    "id": "stora-karlso-n2078763982",
    "name": "Stora Karlsö",
    "category": "service",
    "lat": 57.29007,
    "lng": 17.970767,
    "description": "Färjeterminal"
  },
  {
    "id": "stora-karlso-naturreservat-w102775291",
    "name": "Stora Karlsö naturreservat",
    "category": "natur",
    "lat": 57.285572,
    "lng": 17.973042,
    "description": "Naturreservat"
  },
  {
    "id": "stora-marumyr-r7367398",
    "name": "Stora Marumyr",
    "category": "natur",
    "lat": 57.948338,
    "lng": 19.147137,
    "description": "Naturupplevelse"
  },
  {
    "id": "stora-pussmyr-w529663688",
    "name": "Stora Pussmyr",
    "category": "natur",
    "lat": 57.757662,
    "lng": 18.680027,
    "description": "Naturupplevelse"
  },
  {
    "id": "stora-vede-naturreservat-r16823749",
    "name": "Stora Vede naturreservat",
    "category": "natur",
    "lat": 57.611828,
    "lng": 18.370089,
    "description": "Naturreservat"
  },
  {
    "id": "storhagen-w528208491",
    "name": "Storhagen",
    "category": "natur",
    "lat": 57.714321,
    "lng": 18.744671,
    "description": "Naturreservat"
  },
  {
    "id": "storhagen-r7107059",
    "name": "Storhagen",
    "category": "natur",
    "lat": 57.906212,
    "lng": 19.054172,
    "description": "Naturupplevelse"
  },
  {
    "id": "storhagsmyr-r7268422",
    "name": "Storhagsmyr",
    "category": "natur",
    "lat": 57.953588,
    "lng": 19.126079,
    "description": "Naturupplevelse"
  },
  {
    "id": "storholmen-w199513326",
    "name": "Storholmen",
    "category": "natur",
    "lat": 57.899589,
    "lng": 18.927305,
    "description": "Naturupplevelse"
  },
  {
    "id": "storholmens-naturreservat-w102775794",
    "name": "Storholmens naturreservat",
    "category": "natur",
    "lat": 57.787792,
    "lng": 18.918805,
    "description": "Naturreservat"
  },
  {
    "id": "stormyr-w229695823",
    "name": "Stormyr",
    "category": "natur",
    "lat": 57.36888,
    "lng": 18.270076,
    "description": "Naturupplevelse"
  },
  {
    "id": "storsunds-naturreservat-w102775432",
    "name": "Storsunds naturreservat",
    "category": "natur",
    "lat": 57.565401,
    "lng": 18.779379,
    "description": "Naturreservat"
  },
  {
    "id": "stortrask-w468959399",
    "name": "Storträsk",
    "category": "natur",
    "lat": 57.722147,
    "lng": 18.446604,
    "description": "Naturupplevelse"
  },
  {
    "id": "stortrask-r6911598",
    "name": "Storträsk",
    "category": "natur",
    "lat": 57.728811,
    "lng": 18.444474,
    "description": "Naturupplevelse"
  },
  {
    "id": "storvidemyr-w464127854",
    "name": "Storvidemyr",
    "category": "natur",
    "lat": 57.615957,
    "lng": 18.373375,
    "description": "Naturupplevelse"
  },
  {
    "id": "strand-hotell-n10740046621",
    "name": "Strand hotell",
    "category": "service",
    "lat": 57.6419,
    "lng": 18.29276,
    "description": "Laddstation"
  },
  {
    "id": "strandakersvat-w482269663",
    "name": "Strandakersvät",
    "category": "natur",
    "lat": 57.872892,
    "lng": 19.142692,
    "description": "Naturupplevelse"
  },
  {
    "id": "strandcampingen-taltcampingen-w1163078107",
    "name": "Strandcampingen tältcampingen",
    "category": "boende",
    "lat": 57.951775,
    "lng": 19.2415,
    "description": "Camping"
  },
  {
    "id": "strandridaregarden-w546620045",
    "name": "Strandridaregården",
    "category": "sevardhet",
    "lat": 57.323709,
    "lng": 18.712832,
    "description": "Museum"
  },
  {
    "id": "strandskogens-camping-w1163078106",
    "name": "Strandskogens camping",
    "category": "boende",
    "lat": 57.952556,
    "lng": 19.245753,
    "description": "Ställplats och husvagnscamping"
  },
  {
    "id": "strandskogens-camping-sudersand-faro-n431825095",
    "name": "Strandskogens Camping Sudersand Fårö",
    "category": "boende",
    "lat": 57.95597,
    "lng": 19.24943,
    "description": "Camping"
  },
  {
    "id": "strandvagen-5-n10740026999",
    "name": "Strandvägen 5",
    "category": "service",
    "lat": 57.33028,
    "lng": 18.71087,
    "description": "Laddstation"
  },
  {
    "id": "strandvagen-51-n10740026983",
    "name": "Strandvägen 51",
    "category": "service",
    "lat": 57.3416,
    "lng": 18.71932,
    "description": "Laddstation"
  },
  {
    "id": "stutmyr-w532076115",
    "name": "Stutmyr",
    "category": "natur",
    "lat": 57.91308,
    "lng": 18.906975,
    "description": "Naturupplevelse"
  },
  {
    "id": "stanga-kyrka-w203245557",
    "name": "Stånga kyrka",
    "category": "sevardhet",
    "lat": 57.28307,
    "lng": 18.465949,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "stanga-macken-n1827460188",
    "name": "Stånga-macken",
    "category": "service",
    "lat": 57.280587,
    "lng": 18.470588,
    "description": "Bensinstation"
  },
  {
    "id": "suderbys-w363022418",
    "name": "Suderbys",
    "category": "aktivitet",
    "lat": 57.579139,
    "lng": 18.216354,
    "description": "Golfbana"
  },
  {
    "id": "suderbys-herrgard-n10740026988",
    "name": "Suderbys Herrgård",
    "category": "service",
    "lat": 57.57508,
    "lng": 18.21349,
    "description": "Laddstation"
  },
  {
    "id": "sudersand-r7251331",
    "name": "Sudersand",
    "category": "strand",
    "lat": 57.94907,
    "lng": 19.255469,
    "description": "Badstrand"
  },
  {
    "id": "sudersand-semesterby-och-camping-n10740046606",
    "name": "Sudersand Semesterby och camping",
    "category": "service",
    "lat": 57.95296,
    "lng": 19.24358,
    "description": "Laddstation"
  },
  {
    "id": "sudersands-resort-w450812651",
    "name": "Sudersands resort",
    "category": "mat",
    "lat": 57.955569,
    "lng": 19.251498,
    "description": "Restaurang"
  },
  {
    "id": "sudersands-vintage-cykeluthyrning-n8677241807",
    "name": "Sudersands Vintage Cykeluthyrning",
    "category": "aktivitet",
    "lat": 57.95552,
    "lng": 19.246335,
    "description": "Aktivitet"
  },
  {
    "id": "sudervik-w378883449",
    "name": "Sudervik",
    "category": "natur",
    "lat": 57.666283,
    "lng": 18.794488,
    "description": "Naturupplevelse"
  },
  {
    "id": "sukh-indiska-restaurang-n8902966068",
    "name": "Sukh Indiska Restaurang",
    "category": "mat",
    "lat": 57.861005,
    "lng": 19.052965,
    "description": "Restaurang"
  },
  {
    "id": "sumpmyr-w379613228",
    "name": "Sumpmyr",
    "category": "natur",
    "lat": 57.910323,
    "lng": 18.842247,
    "description": "Naturupplevelse"
  },
  {
    "id": "sund-w378882833",
    "name": "Sund",
    "category": "natur",
    "lat": 57.679074,
    "lng": 18.786671,
    "description": "Naturupplevelse"
  },
  {
    "id": "sundars-momo-n8906950527",
    "name": "Sundars Momo",
    "category": "mat",
    "lat": 57.632354,
    "lng": 18.289663,
    "description": "Restaurang"
  },
  {
    "id": "sundars-momo-n11063363503",
    "name": "Sundars Momo",
    "category": "mat",
    "lat": 57.601159,
    "lng": 18.251963,
    "description": "Restaurang"
  },
  {
    "id": "sundre-kyrka-w481314041",
    "name": "Sundre kyrka",
    "category": "sevardhet",
    "lat": 56.935898,
    "lng": 18.181829,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "sunes-elefant-n331809821",
    "name": "Sunes elefant",
    "category": "mat",
    "lat": 57.628458,
    "lng": 18.287273,
    "description": "Restaurang"
  },
  {
    "id": "surfers-n1305285039",
    "name": "Surfers",
    "category": "mat",
    "lat": 57.639346,
    "lng": 18.295936,
    "description": "Bar"
  },
  {
    "id": "surflogiet-w610892209",
    "name": "Surflogiet",
    "category": "mat",
    "lat": 57.483786,
    "lng": 18.126752,
    "description": "Restaurang"
  },
  {
    "id": "sushi-bar-n576100215",
    "name": "Sushi Bar",
    "category": "mat",
    "lat": 57.632562,
    "lng": 18.288212,
    "description": "Restaurang"
  },
  {
    "id": "svalings-naturreservat-w1340039288",
    "name": "Svalings naturreservat",
    "category": "natur",
    "lat": 57.611286,
    "lng": 18.704358,
    "description": "Naturreservat"
  },
  {
    "id": "svarvmyr-w379613220",
    "name": "Svarvmyr",
    "category": "natur",
    "lat": 57.917099,
    "lng": 18.8516,
    "description": "Naturupplevelse"
  },
  {
    "id": "svenskbymuseet-n12125015854",
    "name": "Svenskbymuseet",
    "category": "sevardhet",
    "lat": 57.527585,
    "lng": 18.443424,
    "description": "Museum"
  },
  {
    "id": "svinmyr-w379456722",
    "name": "Svinmyr",
    "category": "natur",
    "lat": 57.389098,
    "lng": 18.699539,
    "description": "Naturupplevelse"
  },
  {
    "id": "svartesmyr-w530645654",
    "name": "Svärtesmyr",
    "category": "natur",
    "lat": 57.894078,
    "lng": 18.648933,
    "description": "Naturupplevelse"
  },
  {
    "id": "swedbank-n5015353305",
    "name": "Swedbank",
    "category": "service",
    "lat": 57.633546,
    "lng": 18.290755,
    "description": "Service"
  },
  {
    "id": "sylvis-dottrar-n1841494618",
    "name": "Sylvis Döttrar",
    "category": "shopping",
    "lat": 57.967892,
    "lng": 19.233958,
    "description": "Butik"
  },
  {
    "id": "sysne-fiskbutik-n4359033491",
    "name": "Sysne fiskbutik",
    "category": "shopping",
    "lat": 57.389315,
    "lng": 18.876294,
    "description": "Butik"
  },
  {
    "id": "systembolaget-n3810626375",
    "name": "Systembolaget",
    "category": "shopping",
    "lat": 57.70403,
    "lng": 18.80162,
    "description": "Butik"
  },
  {
    "id": "systembolaget-n4977419493",
    "name": "Systembolaget",
    "category": "shopping",
    "lat": 57.638006,
    "lng": 18.299989,
    "description": "Butik"
  },
  {
    "id": "systembolaget-n11054456580",
    "name": "Systembolaget",
    "category": "shopping",
    "lat": 57.240166,
    "lng": 18.376972,
    "description": "Butik"
  },
  {
    "id": "savvats-naturreservat-w102775473",
    "name": "Sävväts naturreservat",
    "category": "natur",
    "lat": 57.160695,
    "lng": 18.188048,
    "description": "Naturreservat"
  },
  {
    "id": "soderport-n35506295",
    "name": "Söderport",
    "category": "sevardhet",
    "lat": 57.634801,
    "lng": 18.291914,
    "description": "Historisk plats"
  },
  {
    "id": "sodervarnshallen-w33334983",
    "name": "Södervärnshallen",
    "category": "aktivitet",
    "lat": 57.624362,
    "lng": 18.29001,
    "description": "Idrottsanläggning"
  },
  {
    "id": "sodra-hallarnas-naturreservat-r7611531",
    "name": "Södra hällarnas naturreservat",
    "category": "natur",
    "lat": 57.616571,
    "lng": 18.260001,
    "description": "Naturreservat"
  },
  {
    "id": "sodra-nyrajsemyr-w532068579",
    "name": "Södra Nyrajsemyr",
    "category": "natur",
    "lat": 57.912786,
    "lng": 18.874112,
    "description": "Naturupplevelse"
  },
  {
    "id": "taco-bar-n13063633536",
    "name": "Taco Bar",
    "category": "mat",
    "lat": 57.639769,
    "lng": 18.292297,
    "description": "Snabbmat"
  },
  {
    "id": "tankvart-n685981461",
    "name": "Tankvärt",
    "category": "service",
    "lat": 57.784508,
    "lng": 18.788706,
    "description": "Bensinstation"
  },
  {
    "id": "tankvart-n874386477",
    "name": "Tankvärt",
    "category": "service",
    "lat": 57.508259,
    "lng": 18.449668,
    "description": "Bensinstation"
  },
  {
    "id": "tankvart-w315912054",
    "name": "Tankvärt",
    "category": "service",
    "lat": 57.61698,
    "lng": 18.284273,
    "description": "Bensinstation"
  },
  {
    "id": "tankvart-w414817662",
    "name": "Tankvärt",
    "category": "service",
    "lat": 57.259322,
    "lng": 18.635903,
    "description": "Bensinstation"
  },
  {
    "id": "tankvart-hemse-n282849415",
    "name": "Tankvärt Hemse",
    "category": "service",
    "lat": 57.237663,
    "lng": 18.374654,
    "description": "Bensinstation"
  },
  {
    "id": "tempo-n814045749",
    "name": "Tempo",
    "category": "shopping",
    "lat": 57.799925,
    "lng": 18.513458,
    "description": "Butik"
  },
  {
    "id": "tempo-w1071027664",
    "name": "Tempo",
    "category": "shopping",
    "lat": 57.426409,
    "lng": 18.841039,
    "description": "Butik"
  },
  {
    "id": "tennisbana-w435933270",
    "name": "Tennisbana",
    "category": "aktivitet",
    "lat": 57.955786,
    "lng": 19.24615,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "thai-thai-n305501178",
    "name": "Thai Thai",
    "category": "mat",
    "lat": 57.632641,
    "lng": 18.287958,
    "description": "Restaurang"
  },
  {
    "id": "thairauken-w1316735399",
    "name": "Thairauken",
    "category": "mat",
    "lat": 57.733945,
    "lng": 18.607359,
    "description": "Restaurang"
  },
  {
    "id": "tigelmyr-w970719352",
    "name": "Tigelmyr",
    "category": "natur",
    "lat": 57.706426,
    "lng": 18.762848,
    "description": "Naturupplevelse"
  },
  {
    "id": "time-n4271469390",
    "name": "Time",
    "category": "shopping",
    "lat": 57.860063,
    "lng": 19.051339,
    "description": "Butik"
  },
  {
    "id": "tingstade-fastning-w311648678",
    "name": "Tingstäde fästning",
    "category": "sevardhet",
    "lat": 57.738276,
    "lng": 18.620095,
    "description": "Museum"
  },
  {
    "id": "tingstade-grill-w437659820",
    "name": "Tingstäde Grill",
    "category": "mat",
    "lat": 57.73396,
    "lng": 18.608114,
    "description": "Restaurang"
  },
  {
    "id": "tingstade-kyrka-w437648592",
    "name": "Tingstäde kyrka",
    "category": "sevardhet",
    "lat": 57.736377,
    "lng": 18.615048,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "tingstade-trask-badplats-n14006213980",
    "name": "Tingstäde träsk, badplats",
    "category": "strand",
    "lat": 57.738411,
    "lng": 18.625951,
    "description": "Badplats"
  },
  {
    "id": "tingsvat-w293720982",
    "name": "Tingsvät",
    "category": "natur",
    "lat": 57.152816,
    "lng": 18.204938,
    "description": "Naturupplevelse"
  },
  {
    "id": "tiselhagens-naturreservat-w102775323",
    "name": "Tiselhagens naturreservat",
    "category": "natur",
    "lat": 57.714387,
    "lng": 18.663996,
    "description": "Naturreservat"
  },
  {
    "id": "tjauls-gard-n10740026994",
    "name": "Tjauls gård",
    "category": "service",
    "lat": 57.75795,
    "lng": 18.44305,
    "description": "Laddstation"
  },
  {
    "id": "tjelvarkyrkan-n11102444105",
    "name": "Tjelvarkyrkan",
    "category": "sevardhet",
    "lat": 57.635836,
    "lng": 18.309176,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "tjelvars-grav-w530624487",
    "name": "Tjelvars grav",
    "category": "sevardhet",
    "lat": 57.62782,
    "lng": 18.732555,
    "description": "Historisk plats"
  },
  {
    "id": "tjugmyr-w379563644",
    "name": "Tjugmyr",
    "category": "natur",
    "lat": 57.821653,
    "lng": 18.880968,
    "description": "Naturupplevelse"
  },
  {
    "id": "tjuls-station-jarnvagsmuseum-n1348603066",
    "name": "Tjuls station, Järnvägsmuseum",
    "category": "sevardhet",
    "lat": 57.459448,
    "lng": 18.237752,
    "description": "Museum"
  },
  {
    "id": "tjarkokeriet-n9711635954",
    "name": "Tjärkokeriet",
    "category": "sevardhet",
    "lat": 57.636904,
    "lng": 18.296164,
    "description": "Besöksmål"
  },
  {
    "id": "tofta-beach-house-w966254795",
    "name": "Tofta Beach House",
    "category": "mat",
    "lat": 57.486354,
    "lng": 18.128057,
    "description": "Restaurang"
  },
  {
    "id": "tofta-camping-n10740046613",
    "name": "Tofta camping",
    "category": "boende",
    "lat": 57.48634,
    "lng": 18.13175,
    "description": "Laddstation"
  },
  {
    "id": "tofta-camping-r6597540",
    "name": "Tofta Camping",
    "category": "boende",
    "lat": 57.484325,
    "lng": 18.128362,
    "description": "Camping"
  },
  {
    "id": "tofta-kyrka-w986655333",
    "name": "Tofta kyrka",
    "category": "sevardhet",
    "lat": 57.52163,
    "lng": 18.168762,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "tofta-strand-w116575228",
    "name": "Tofta Strand",
    "category": "strand",
    "lat": 57.48863,
    "lng": 18.127476,
    "description": "Badstrand"
  },
  {
    "id": "tofta-strandbageri-n1313923825",
    "name": "Tofta Strandbageri",
    "category": "shopping",
    "lat": 57.504405,
    "lng": 18.153208,
    "description": "Butik"
  },
  {
    "id": "tofta-strandpensionat-n13068058308",
    "name": "Tofta Strandpensionat",
    "category": "boende",
    "lat": 57.490744,
    "lng": 18.129989,
    "description": "Hotell"
  },
  {
    "id": "tofta-viking-village-w443274473",
    "name": "Tofta Viking Village",
    "category": "sevardhet",
    "lat": 57.483781,
    "lng": 18.14066,
    "description": "Besöksmål"
  },
  {
    "id": "toftagarden-n10740026997",
    "name": "Toftagården",
    "category": "service",
    "lat": 57.48608,
    "lng": 18.13991,
    "description": "Laddstation"
  },
  {
    "id": "toftalagret-w1204762705",
    "name": "Toftalagret",
    "category": "mat",
    "lat": 57.493503,
    "lng": 18.148357,
    "description": "Snabbmat"
  },
  {
    "id": "torgkrogen-n2320587675",
    "name": "Torgkrogen",
    "category": "mat",
    "lat": 57.640196,
    "lng": 18.296733,
    "description": "Restaurang"
  },
  {
    "id": "torsburgens-fornborg-w1375653399",
    "name": "Torsburgens fornborg",
    "category": "sevardhet",
    "lat": 57.412007,
    "lng": 18.720352,
    "description": "Historisk plats"
  },
  {
    "id": "torsburgens-naturreservat-r10249732",
    "name": "Torsburgens naturreservat",
    "category": "natur",
    "lat": 57.412164,
    "lng": 18.72004,
    "description": "Naturreservat"
  },
  {
    "id": "torsburgsmyr-w530662915",
    "name": "Torsburgsmyr",
    "category": "natur",
    "lat": 57.409034,
    "lng": 18.716369,
    "description": "Naturupplevelse"
  },
  {
    "id": "tottes-tappu-w704942127",
    "name": "Tottes Täppu",
    "category": "familj",
    "lat": 56.992043,
    "lng": 18.247541,
    "description": "Lekplats"
  },
  {
    "id": "trastasshul-w378759386",
    "name": "Trastasshul",
    "category": "natur",
    "lat": 57.90864,
    "lng": 18.886254,
    "description": "Naturupplevelse"
  },
  {
    "id": "traume-idrottsplats-w942673721",
    "name": "Traume idrottsplats",
    "category": "aktivitet",
    "lat": 57.587455,
    "lng": 18.328061,
    "description": "Idrottsanläggning"
  },
  {
    "id": "tre-stekare-n12075145347",
    "name": "Tre Stekare",
    "category": "mat",
    "lat": 57.034718,
    "lng": 18.258152,
    "description": "Snabbmat"
  },
  {
    "id": "trojaborg-w230634568",
    "name": "Trojaborg",
    "category": "sevardhet",
    "lat": 57.652566,
    "lng": 18.307124,
    "description": "Historisk plats"
  },
  {
    "id": "trollskogen-n11045998215",
    "name": "Trollskogen",
    "category": "familj",
    "lat": 57.717425,
    "lng": 18.409928,
    "description": "Lekplats"
  },
  {
    "id": "trossen-n13069531090",
    "name": "Trossen",
    "category": "mat",
    "lat": 57.637395,
    "lng": 18.287557,
    "description": "Restaurang"
  },
  {
    "id": "trullhalsar-gravfalt-n6373633495",
    "name": "Trullhalsar Gravfält",
    "category": "sevardhet",
    "lat": 57.507425,
    "lng": 18.742107,
    "description": "Historisk plats"
  },
  {
    "id": "trullkallarhul-n5304629607",
    "name": "Trullkällarhul",
    "category": "natur",
    "lat": 57.540184,
    "lng": 18.252575,
    "description": "Naturupplevelse"
  },
  {
    "id": "trakumla-kyrka-w462284661",
    "name": "Träkumla kyrka",
    "category": "sevardhet",
    "lat": 57.560332,
    "lng": 18.312995,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "trakumlagropen-n14006218865",
    "name": "Träkumlagropen",
    "category": "strand",
    "lat": 57.581729,
    "lng": 18.29782,
    "description": "Badplats"
  },
  {
    "id": "traskalvret-r7242521",
    "name": "Träskalvret",
    "category": "natur",
    "lat": 57.929223,
    "lng": 19.081822,
    "description": "Naturupplevelse"
  },
  {
    "id": "traskmyr-r16800314",
    "name": "Träskmyr",
    "category": "natur",
    "lat": 57.827714,
    "lng": 18.749775,
    "description": "Naturupplevelse"
  },
  {
    "id": "traskmyr-och-vastean-w102775778",
    "name": "Träskmyr och Vasteån",
    "category": "natur",
    "lat": 57.828087,
    "lng": 18.759942,
    "description": "Naturreservat"
  },
  {
    "id": "traskvidars-naturreservat-r18590321",
    "name": "Träskvidars naturreservat",
    "category": "natur",
    "lat": 57.784873,
    "lng": 18.895582,
    "description": "Naturreservat"
  },
  {
    "id": "tvarlingsmyr-r4173412",
    "name": "Tvärlingsmyr",
    "category": "natur",
    "lat": 57.87488,
    "lng": 18.949496,
    "description": "Naturupplevelse"
  },
  {
    "id": "torrvesklint-w102775590",
    "name": "Törrvesklint",
    "category": "natur",
    "lat": 57.823573,
    "lng": 18.475103,
    "description": "Naturreservat"
  },
  {
    "id": "ullahau-r7100479",
    "name": "Ullahau",
    "category": "natur",
    "lat": 57.96391,
    "lng": 19.251574,
    "description": "Naturreservat"
  },
  {
    "id": "ullviarrojr-w443496435",
    "name": "Ullviarrojr",
    "category": "sevardhet",
    "lat": 57.484287,
    "lng": 18.167171,
    "description": "Historisk plats"
  },
  {
    "id": "uncle-joe-s-n8223325802",
    "name": "Uncle Joe's",
    "category": "boende",
    "lat": 57.61536,
    "lng": 18.284053,
    "description": "Vandrarhem"
  },
  {
    "id": "underbar-visby-n9883916617",
    "name": "Underbar Visby",
    "category": "mat",
    "lat": 57.638635,
    "lng": 18.293157,
    "description": "Restaurang"
  },
  {
    "id": "uppstaigs-naturreservat-w102775340",
    "name": "Uppstaigs naturreservat",
    "category": "natur",
    "lat": 57.43566,
    "lng": 18.789919,
    "description": "Naturreservat"
  },
  {
    "id": "vaktbackar-r6604797",
    "name": "Vaktbackar",
    "category": "natur",
    "lat": 56.936475,
    "lng": 18.161142,
    "description": "Naturreservat"
  },
  {
    "id": "valdemarskorset-n6373741789",
    "name": "Valdemarskorset",
    "category": "sevardhet",
    "lat": 57.633899,
    "lng": 18.299303,
    "description": "Historisk plats"
  },
  {
    "id": "valdemarsmuren-w1251166884",
    "name": "Valdemarsmuren",
    "category": "sevardhet",
    "lat": 57.634935,
    "lng": 18.292435,
    "description": "Historisk plats"
  },
  {
    "id": "valls-kyrka-w1191878783",
    "name": "Valls kyrka",
    "category": "sevardhet",
    "lat": 57.520787,
    "lng": 18.345171,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vallstena-72-1-n6373668146",
    "name": "Vallstena 72:1",
    "category": "sevardhet",
    "lat": 57.59086,
    "lng": 18.657968,
    "description": "Historisk plats"
  },
  {
    "id": "vallstena-kyrka-w1191859371",
    "name": "Vallstena kyrka",
    "category": "sevardhet",
    "lat": 57.609833,
    "lng": 18.636791,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vamlingbo-kyrka-w481742273",
    "name": "Vamlingbo kyrka",
    "category": "sevardhet",
    "lat": 56.969696,
    "lng": 18.230241,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vandrarhem-koburg-w546620827",
    "name": "Vandrarhem Koburg",
    "category": "boende",
    "lat": 57.333664,
    "lng": 18.70087,
    "description": "Vandrarhem"
  },
  {
    "id": "varpet-r7314975",
    "name": "Varpet",
    "category": "natur",
    "lat": 57.986932,
    "lng": 19.219416,
    "description": "Naturupplevelse"
  },
  {
    "id": "vavle-badplats-n14006221516",
    "name": "Vavle badplats",
    "category": "strand",
    "lat": 57.459538,
    "lng": 18.124073,
    "description": "Badplats"
  },
  {
    "id": "vedje-n11056917583",
    "name": "Vedje",
    "category": "mat",
    "lat": 56.969056,
    "lng": 18.229377,
    "description": "Café"
  },
  {
    "id": "vedugnen-n2973285473",
    "name": "Vedugnen",
    "category": "mat",
    "lat": 57.576017,
    "lng": 18.733789,
    "description": "Restaurang"
  },
  {
    "id": "verkegards-r7100482",
    "name": "Verkegards",
    "category": "natur",
    "lat": 57.903746,
    "lng": 19.101972,
    "description": "Naturreservat"
  },
  {
    "id": "verkmyr-w379563641",
    "name": "Verkmyr",
    "category": "natur",
    "lat": 57.887209,
    "lng": 18.66548,
    "description": "Naturupplevelse"
  },
  {
    "id": "verkstan-n12909488803",
    "name": "Verkstan",
    "category": "shopping",
    "lat": 57.639798,
    "lng": 18.296356,
    "description": "Butik"
  },
  {
    "id": "viklau-kyrka-w1125607519",
    "name": "Viklau kyrka",
    "category": "sevardhet",
    "lat": 57.465547,
    "lng": 18.456542,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "villa-villekulla-w459132353",
    "name": "Villa Villekulla",
    "category": "sevardhet",
    "lat": 57.609899,
    "lng": 18.243906,
    "description": "Besöksmål"
  },
  {
    "id": "village-tandoori-n305501169",
    "name": "Village Tandoori",
    "category": "mat",
    "lat": 57.632489,
    "lng": 18.288439,
    "description": "Restaurang"
  },
  {
    "id": "vinngardsalvret-r7639892",
    "name": "Vinngardsalvret",
    "category": "natur",
    "lat": 57.946665,
    "lng": 19.191984,
    "description": "Naturupplevelse"
  },
  {
    "id": "visborgskyrkan-w463283956",
    "name": "Visborgskyrkan",
    "category": "sevardhet",
    "lat": 57.624693,
    "lng": 18.285152,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "visby-nynashamn-n192373271",
    "name": "Visby - Nynäshamn",
    "category": "service",
    "lat": 57.634678,
    "lng": 18.279407,
    "description": "Färjeterminal"
  },
  {
    "id": "visby-bilcity-n10740046623",
    "name": "Visby Bilcity",
    "category": "service",
    "lat": 57.62324,
    "lng": 18.27693,
    "description": "Laddstation"
  },
  {
    "id": "visby-bilmuseum-w467553339",
    "name": "Visby Bilmuseum",
    "category": "sevardhet",
    "lat": 57.651522,
    "lng": 18.387358,
    "description": "Museum"
  },
  {
    "id": "visby-fangelse-n603093537",
    "name": "Visby fängelse",
    "category": "boende",
    "lat": 57.635989,
    "lng": 18.285566,
    "description": "Vandrarhem"
  },
  {
    "id": "visby-golfklubb-n10740046635",
    "name": "Visby Golfklubb",
    "category": "service",
    "lat": 57.44299,
    "lng": 18.13251,
    "description": "Laddstation"
  },
  {
    "id": "visby-golfklubb-w199830330",
    "name": "Visby Golfklubb",
    "category": "aktivitet",
    "lat": 57.445138,
    "lng": 18.128535,
    "description": "Golfbana"
  },
  {
    "id": "visby-gustavsberg-n5713149943",
    "name": "Visby Gustavsberg",
    "category": "mat",
    "lat": 57.6617,
    "lng": 18.321381,
    "description": "Restaurang"
  },
  {
    "id": "visby-gustavsvik-n5711786374",
    "name": "Visby Gustavsvik",
    "category": "boende",
    "lat": 57.661804,
    "lng": 18.321674,
    "description": "Camping"
  },
  {
    "id": "visby-gustavsvik-stugby-n10740027001",
    "name": "Visby Gustavsvik Stugby",
    "category": "service",
    "lat": 57.66216,
    "lng": 18.32221,
    "description": "Laddstation"
  },
  {
    "id": "visby-hyrcykel-n6641525528",
    "name": "Visby Hyrcykel",
    "category": "aktivitet",
    "lat": 57.63859,
    "lng": 18.298782,
    "description": "Butik"
  },
  {
    "id": "visby-ishall-w9357257",
    "name": "Visby ishall",
    "category": "aktivitet",
    "lat": 57.62624,
    "lng": 18.329611,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "visby-kryssningskaj-n9979711827",
    "name": "Visby kryssningskaj",
    "category": "service",
    "lat": 57.629659,
    "lng": 18.267682,
    "description": "Färjeterminal"
  },
  {
    "id": "visby-lasarett-w204060138",
    "name": "Visby Lasarett",
    "category": "service",
    "lat": 57.648788,
    "lng": 18.300307,
    "description": "Sjukhus"
  },
  {
    "id": "visby-lagenhetshotell-n10740046619",
    "name": "Visby Lägenhetshotell",
    "category": "service",
    "lat": 57.63171,
    "lng": 18.30519,
    "description": "Laddstation"
  },
  {
    "id": "visby-n-cng-n10814952967",
    "name": "Visby N CNG",
    "category": "service",
    "lat": 57.640212,
    "lng": 18.334474,
    "description": "Bensinstation"
  },
  {
    "id": "visby-ringmur-r14377275",
    "name": "Visby ringmur",
    "category": "sevardhet",
    "lat": 57.640772,
    "lng": 18.293868,
    "description": "Besöksmål"
  },
  {
    "id": "visby-s-cng-n10814960014",
    "name": "Visby S CNG",
    "category": "service",
    "lat": 57.625664,
    "lng": 18.274656,
    "description": "Bensinstation"
  },
  {
    "id": "visby-strandbad-n11710843286",
    "name": "Visby Strandbad",
    "category": "strand",
    "lat": 57.64068,
    "lng": 18.287585,
    "description": "Badplats"
  },
  {
    "id": "visby-strandby-norderstrands-camping-w427887880",
    "name": "Visby Strandby - Norderstrands Camping",
    "category": "boende",
    "lat": 57.655481,
    "lng": 18.308232,
    "description": "Camping"
  },
  {
    "id": "visby-strandby-snacks-camping-w468935656",
    "name": "Visby Strandby & Snäcks Camping",
    "category": "boende",
    "lat": 57.674748,
    "lng": 18.336009,
    "description": "Camping"
  },
  {
    "id": "visby-take-away-w462905907",
    "name": "Visby Take Away",
    "category": "mat",
    "lat": 57.616533,
    "lng": 18.285497,
    "description": "Snabbmat"
  },
  {
    "id": "visby-tennis-klubb-w394990318",
    "name": "Visby Tennis Klubb",
    "category": "aktivitet",
    "lat": 57.646691,
    "lng": 18.306042,
    "description": "Aktivitet och idrott"
  },
  {
    "id": "visby-traningscenter-n12305044339",
    "name": "Visby Träningscenter",
    "category": "aktivitet",
    "lat": 57.643091,
    "lng": 18.31896,
    "description": "Träningsanläggning"
  },
  {
    "id": "visbytravet-w531567860",
    "name": "Visbytravet",
    "category": "aktivitet",
    "lat": 57.616797,
    "lng": 18.327483,
    "description": "Idrottsanläggning"
  },
  {
    "id": "vitvikens-cafe-camping-n13983513159",
    "name": "Vitvikens Café & Camping",
    "category": "boende",
    "lat": 57.618754,
    "lng": 18.762418,
    "description": "Camping"
  },
  {
    "id": "vitvikens-strand-w1081103331",
    "name": "Vitvikens Strand",
    "category": "strand",
    "lat": 57.618988,
    "lng": 18.764168,
    "description": "Badplats"
  },
  {
    "id": "vitartskallan-w102776065",
    "name": "Vitärtskällan",
    "category": "natur",
    "lat": 57.852225,
    "lng": 18.813455,
    "description": "Naturreservat"
  },
  {
    "id": "vivesholm-w528208513",
    "name": "Vivesholm",
    "category": "natur",
    "lat": 57.396046,
    "lng": 18.171546,
    "description": "Naturreservat"
  },
  {
    "id": "vaffelmagasinet-n5001701844",
    "name": "Våffelmagasinet",
    "category": "mat",
    "lat": 57.323521,
    "lng": 18.711313,
    "description": "Restaurang"
  },
  {
    "id": "var-fru-visby-n7978464485",
    "name": "Vår Fru Visby",
    "category": "mat",
    "lat": 57.638844,
    "lng": 18.293652,
    "description": "Restaurang"
  },
  {
    "id": "var-skulpturparken-n6373738073",
    "name": "Vår Skulpturparken",
    "category": "sevardhet",
    "lat": 57.632231,
    "lng": 18.289512,
    "description": "Sevärdhet"
  },
  {
    "id": "vardklockans-kyrka-w1057220846",
    "name": "Vårdklockans Kyrka",
    "category": "sevardhet",
    "lat": 57.63858,
    "lng": 18.295658,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vange-kyrka-w1191878779",
    "name": "Vänge kyrka",
    "category": "sevardhet",
    "lat": 57.451995,
    "lng": 18.511508,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vardshuset-lindgarden-n12877320264",
    "name": "Värdshuset Lindgården",
    "category": "mat",
    "lat": 57.640962,
    "lng": 18.293173,
    "description": "Restaurang"
  },
  {
    "id": "vaskinde-kyrka-w467805827",
    "name": "Väskinde kyrka",
    "category": "sevardhet",
    "lat": 57.690573,
    "lng": 18.423078,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vastergarn-19-1-n6373708921",
    "name": "Västergarn 19:1",
    "category": "sevardhet",
    "lat": 57.464889,
    "lng": 18.196235,
    "description": "Historisk plats"
  },
  {
    "id": "vastergarn-kyrka-w1191887701",
    "name": "Västergarn kyrka",
    "category": "sevardhet",
    "lat": 57.440841,
    "lng": 18.150993,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vastergarns-badplats-n12128997752",
    "name": "Västergarns badplats",
    "category": "strand",
    "lat": 57.43691,
    "lng": 18.142268,
    "description": "Badstrand"
  },
  {
    "id": "vastergarns-hamn-w1309945196",
    "name": "Västergarns hamn",
    "category": "familj",
    "lat": 57.437297,
    "lng": 18.143041,
    "description": "Lekplats"
  },
  {
    "id": "vastergarns-utholme-w102775441",
    "name": "Västergarns utholme",
    "category": "natur",
    "lat": 57.434184,
    "lng": 18.092003,
    "description": "Naturreservat"
  },
  {
    "id": "vasterhejde-kyrka-w198674674",
    "name": "Västerhejde kyrka",
    "category": "sevardhet",
    "lat": 57.580563,
    "lng": 18.248063,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vasterhuse-naturreservat-w895701671",
    "name": "Västerhuse naturreservat",
    "category": "natur",
    "lat": 57.869507,
    "lng": 18.721557,
    "description": "Naturreservat"
  },
  {
    "id": "vasters-myrs-naturreservat-w1231234773",
    "name": "Västers myrs naturreservat",
    "category": "natur",
    "lat": 57.667329,
    "lng": 18.735137,
    "description": "Naturreservat"
  },
  {
    "id": "vasterstrask-r14933933",
    "name": "Västersträsk",
    "category": "natur",
    "lat": 57.683139,
    "lng": 18.736511,
    "description": "Naturupplevelse"
  },
  {
    "id": "vastertrask-w497223403",
    "name": "Västerträsk",
    "category": "natur",
    "lat": 57.969718,
    "lng": 19.163246,
    "description": "Naturupplevelse"
  },
  {
    "id": "vastlands-naturreservat-r7611213",
    "name": "Västlands naturreservat",
    "category": "natur",
    "lat": 57.013484,
    "lng": 18.21135,
    "description": "Naturreservat"
  },
  {
    "id": "vastra-margelgraven-w102775357",
    "name": "Västra märgelgraven",
    "category": "natur",
    "lat": 57.146855,
    "lng": 18.323134,
    "description": "Naturreservat"
  },
  {
    "id": "vate-kyrka-w960816616",
    "name": "Väte kyrka",
    "category": "sevardhet",
    "lat": 57.449097,
    "lng": 18.364062,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "vathagen-w533169167",
    "name": "Väthagen",
    "category": "natur",
    "lat": 57.763813,
    "lng": 18.716261,
    "description": "Naturupplevelse"
  },
  {
    "id": "wallers-n315981584",
    "name": "Wallers",
    "category": "mat",
    "lat": 57.638893,
    "lng": 18.295878,
    "description": "Restaurang"
  },
  {
    "id": "wallins-n1835421261",
    "name": "Wallins",
    "category": "mat",
    "lat": 57.431835,
    "lng": 18.843975,
    "description": "Café"
  },
  {
    "id": "warfsholm-bageri-n11157925569",
    "name": "Warfsholm Bageri",
    "category": "shopping",
    "lat": 57.386123,
    "lng": 18.201358,
    "description": "Butik"
  },
  {
    "id": "warfsholm-bageri-n12909481387",
    "name": "Warfsholm Bageri",
    "category": "shopping",
    "lat": 57.640005,
    "lng": 18.296421,
    "description": "Butik"
  },
  {
    "id": "willys-visby-n5191007104",
    "name": "Willys Visby",
    "category": "shopping",
    "lat": 57.635233,
    "lng": 18.327457,
    "description": "Butik"
  },
  {
    "id": "wisby-biluthyrning-n6609209985",
    "name": "Wisby Biluthyrning",
    "category": "service",
    "lat": 57.634776,
    "lng": 18.282277,
    "description": "Service"
  },
  {
    "id": "wisby-hof-n5029421553",
    "name": "Wisby Hof",
    "category": "mat",
    "lat": 57.635358,
    "lng": 18.292881,
    "description": "Bar"
  },
  {
    "id": "wisby-hotell-n271876129",
    "name": "Wisby hotell",
    "category": "boende",
    "lat": 57.638535,
    "lng": 18.290952,
    "description": "Hotell"
  },
  {
    "id": "wisby-ost-n12896340478",
    "name": "Wisby Ost",
    "category": "shopping",
    "lat": 57.638962,
    "lng": 18.296095,
    "description": "Butik"
  },
  {
    "id": "wisby-ridklubb-w464127887",
    "name": "Wisby Ridklubb",
    "category": "aktivitet",
    "lat": 57.624156,
    "lng": 18.330554,
    "description": "Idrottsanläggning"
  },
  {
    "id": "yllet-n12877366445",
    "name": "Yllet",
    "category": "shopping",
    "lat": 57.639116,
    "lng": 18.293791,
    "description": "Butik"
  },
  {
    "id": "ytterholmen-naturreservat-r7093052",
    "name": "Ytterholmen naturreservat",
    "category": "natur",
    "lat": 57.128632,
    "lng": 18.506378,
    "description": "Naturreservat"
  },
  {
    "id": "ahlens-n10252318044",
    "name": "Åhléns",
    "category": "shopping",
    "lat": 57.637748,
    "lng": 18.299954,
    "description": "Butik"
  },
  {
    "id": "alarve-r1459275",
    "name": "Ålarve",
    "category": "natur",
    "lat": 57.164822,
    "lng": 18.483062,
    "description": "Naturreservat"
  },
  {
    "id": "aminne-n1842664290",
    "name": "Åminne",
    "category": "mat",
    "lat": 57.614797,
    "lng": 18.761045,
    "description": "Restaurang"
  },
  {
    "id": "aminne-camping-n431825040",
    "name": "Åminne Camping",
    "category": "boende",
    "lat": 57.61387,
    "lng": 18.7566,
    "description": "Camping"
  },
  {
    "id": "aminne-strand-w707430389",
    "name": "Åminne Strand",
    "category": "strand",
    "lat": 57.614102,
    "lng": 18.766097,
    "description": "Badplats"
  },
  {
    "id": "aljemyr-w525643728",
    "name": "Äljemyr",
    "category": "natur",
    "lat": 57.361089,
    "lng": 18.370519,
    "description": "Naturupplevelse"
  },
  {
    "id": "anges-bildstenar-n605015930",
    "name": "Änges Bildstenar",
    "category": "sevardhet",
    "lat": 57.394502,
    "lng": 18.500447,
    "description": "Historisk plats"
  },
  {
    "id": "anggarde-n1313846804",
    "name": "Änggårde",
    "category": "boende",
    "lat": 57.189778,
    "lng": 18.4864,
    "description": "Pensionat och gästboende"
  },
  {
    "id": "askakersvat-w432645009",
    "name": "Äskåkersvät",
    "category": "natur",
    "lat": 57.858641,
    "lng": 19.025728,
    "description": "Naturupplevelse"
  },
  {
    "id": "aspmyr-w379336904",
    "name": "Äspmyr",
    "category": "natur",
    "lat": 57.56386,
    "lng": 18.670202,
    "description": "Naturupplevelse"
  },
  {
    "id": "aventyrstrasket-w1087514337",
    "name": "Äventyrsträsket",
    "category": "aktivitet",
    "lat": 57.608744,
    "lng": 18.24432,
    "description": "Aktivitet"
  },
  {
    "id": "oja-kyrka-w202596417",
    "name": "Öja kyrka",
    "category": "sevardhet",
    "lat": 57.035553,
    "lng": 18.299906,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "olbacks-naturreservat-r6854046",
    "name": "Ölbäcks naturreservat",
    "category": "natur",
    "lat": 57.621542,
    "lng": 18.379232,
    "description": "Naturreservat"
  },
  {
    "id": "oob-n4383883785",
    "name": "ÖoB",
    "category": "shopping",
    "lat": 57.630224,
    "lng": 18.289314,
    "description": "Butik"
  },
  {
    "id": "osterdahls-brygga-n13231526901",
    "name": "Österdahls Brygga",
    "category": "mat",
    "lat": 57.638562,
    "lng": 18.286439,
    "description": "Restaurang"
  },
  {
    "id": "ostergarn-kyrka-w781016570",
    "name": "Östergarn kyrka",
    "category": "sevardhet",
    "lat": 57.421767,
    "lng": 18.8588,
    "description": "Kyrka och besöksmål"
  },
  {
    "id": "ostergarns-idrottsplats-w975104259",
    "name": "Östergarns idrottsplats",
    "category": "aktivitet",
    "lat": 57.423394,
    "lng": 18.856074,
    "description": "Idrottsanläggning"
  },
  {
    "id": "ostergarnsberget-w102775478",
    "name": "Östergarnsberget",
    "category": "natur",
    "lat": 57.417908,
    "lng": 18.843566,
    "description": "Naturreservat"
  },
  {
    "id": "osterport-n83730235",
    "name": "Österport",
    "category": "sevardhet",
    "lat": 57.638458,
    "lng": 18.298435,
    "description": "Historisk plats"
  }
];
/**
 * Hämtar platser. Returnerar ett Promise så att anropet ser likadant ut
 * i API- och frontend-only-läge.
 * @returns {Promise<Array>}
 */
async function loadCategories() {
  try {
    const response = await fetch("/api/categories", { headers: { Accept: "application/json" } });
    if (!response.ok) return;
    const categories = await response.json();
    for (const category of categories) {
      CATEGORIES[category.id] = {
        label: category.label,
        color: category.color,
        emoji: category.emoji,
      };
    }
  } catch (error) {
    // Den inbyggda kategorilistan används för frontend-only-läge.
  }
}

async function loadPlaces() {
  try {
    const response = await fetch("/api/places", { headers: { Accept: "application/json" } });
    if (!response.ok) throw new Error("API unavailable");
    const places = await response.json();
    if (!Array.isArray(places)) throw new Error("Unexpected API response");
    return places;
  } catch (error) {
    return MOCK_PLACES;
  }
}
