# Gutafinn CMS

Administrationsverktyget för Gutafinns platsregister. CMS:et använder samma
SQLite-databas som backend och skyddas med passkeys eller ett reservkonto.

## Funktioner

- Inloggningsskyddad översikt och platslista
- Registrering och inloggning med passkey (WebAuthn)
- Sökning, filtrering och sidindelning för stora register
- Skapa och redigera grunddata, koordinater, adress, besöksinformation, kontaktvägar och bilder
- Publicera, arkivera och återställ platser utan att radera källdata
- JSON-API för aktiva platser och kategorier
- Signerade sessioner, CSRF-skydd, inloggningsbegränsning och servervalidering
- Responsivt och tangentbordsanvändbart gränssnitt på svenska
- Endast de åtta publika besökskategorierna visas; importerad kategoriproveniens,
  kontaktetiketter och bildkällor bevaras vid redigering

## Starta lokalt

Node.js 22.5 eller senare krävs.

```bash
npm start
```

Öppna `http://localhost:3000/signup` för att skapa ett redaktörskonto med passkey. I utvecklingsläge är registreringskoden `gotland-passkey`. Därefter loggar du in på `/admin/login` med användarnamn och enhetens passkey. Använd just `localhost` för passkey-flödet; webbläsare godkänner inte en IP-adress som WebAuthn-domän.

Reservinloggningen är kvar för bootstrap och återställning. I utvecklingsläge är användarnamnet `admin` och lösenordet `gotland`. Ange alltid egna uppgifter utanför lokal utveckling.

```bash
cp .env.example .env
set -a
source .env
set +a
npm start
```

Applikationen läser miljövariabler från processen; `.env` laddas inte automatiskt. I produktion krävs `ADMIN_PASSWORD` och en `SESSION_SECRET` med minst 32 tecken. Backend är ensam ägare av domänschemat; CMS:et vägrar starta mot en databas som backend ännu inte har initierat.

Passkeys är avstängda i produktion tills `PASSKEY_RP_ID` och `PASSKEY_ORIGIN` anges. `PASSKEY_RP_ID` är domännamnet utan protokoll, exempelvis `cms.example.com`. `PASSKEY_ORIGIN` är den exakta externa HTTPS-adressen, exempelvis `https://cms.example.com`.

Sätt dessutom `SIGNUP_CODE` när nya användare ska kunna registrera sig. Koden fungerar som en inbjudningskod och ska hanteras som en hemlighet. När registreringen ska stängas tar du bort `SIGNUP_CODE`, men behåller RP ID och origin så att befintliga passkeys fortsätter fungera.

## API

- `GET /api/places` – alla publicerade platser; filtrera med `?category=strand` eller `?q=Visby`
- `GET /api/categories` – kategorier i visningsordning
- `GET /healthz` – enkel hälsokontroll

## Test

```bash
npm test
```

Tester körs mot en tillfällig databas och ändrar inte `data/places.db`.

Det kompletta passkey-flödet kan även provas med en virtuell CTAP2-autentiserare i lokalt installerad Chrome:

```bash
npm run test:passkey-browser
```

Sätt `CHROME_PATH` om Chrome inte finns i `/usr/bin/google-chrome-stable`.

## Produktion

Bygg containerbilden med `docker build -t gutafinn-cms .`. I den sammanslagna
driften initierar backend domänschemat innan CMS startar. Sätt `ADMIN_PASSWORD`,
`SESSION_SECRET` och vid behov `SIGNUP_CODE` som hemligheter. Passkeys kräver
HTTPS utanför localhost. Produktionens `backup.sh` använder SQLite backup-API
och verifierar snapshoten före arkivering.
