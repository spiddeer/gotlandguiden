const test = require("node:test");
const assert = require("node:assert/strict");
const { openDatabase } = require("../db");
const { createApp } = require("../server");

async function withServer(options, callback) {
  const database = openDatabase(":memory:");
  const server = createApp(database, options).listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${server.address().port}`;
  try {
    await callback({ baseUrl, database });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    database.close();
  }
}

test("the API creates, reads, and enriches a place", async () => {
  await withServer({ apiKey: "test-key" }, async ({ baseUrl }) => {
    const createdResponse = await fetch(`${baseUrl}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": "test-key" },
      body: JSON.stringify({
        name: "Gute gårdsbutik",
        category: "shopping",
        categories: ["shopping", "mat"],
        lat: 57.6,
        lng: 18.4,
        description: "Lokal mat och fika.",
        address: { street: "Landsvägen 10", locality: "Visby" },
        contacts: { website: "https://example.test" },
        openingHours: { raw: "Mo-Sa 10:00-17:00" },
        sources: [{ sourceType: "official", sourceUrl: "https://example.test", lastVerifiedAt: "2026-07-14" }],
      }),
    });
    assert.equal(createdResponse.status, 201);
    const created = await createdResponse.json();
    assert.equal(created.category, "shopping");
    assert.deepEqual(created.categories, ["shopping", "mat"]);
    assert.equal(created.address.street, "Landsvägen 10");
    assert.equal(created.website, "https://example.test");

    const patchResponse = await fetch(`${baseUrl}/api/places/${created.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-API-Key": "test-key" },
      body: JSON.stringify({ accessibility: "Rullstolsanpassad", priceLevel: 2 }),
    });
    assert.equal(patchResponse.status, 200);
    const patched = await patchResponse.json();
    assert.equal(patched.accessibility, "Rullstolsanpassad");
    assert.equal(patched.priceLevel, 2);

    const listResponse = await fetch(`${baseUrl}/api/places`);
    assert.equal(listResponse.status, 200);
    assert.match(listResponse.headers.get("cache-control"), /stale-while-revalidate/);
    assert.ok(listResponse.headers.get("etag"));
    assert.equal((await listResponse.json()).length, 1);
  });
});

test("the health check confirms that the database is ready", async () => {
  await withServer({}, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/healthz`);
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  });
});

test("the API exposes only published editorial collections with active places", async () => {
  await withServer({}, async ({ baseUrl, database }) => {
    database.prepare(`INSERT INTO places
      (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,?)`)
      .run("active-place", "Aktiv plats", "natur", 57.5, 18.5, "Test", 1);
    database.prepare(`INSERT INTO places
      (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,?)`)
      .run("archived-place", "Arkiverad plats", "natur", 57.6, 18.6, "Test", 0);
    database.prepare(`INSERT INTO places
      (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,?)`)
      .run("active-place-two", "Andra aktiva platsen", "natur", 57.7, 18.7, "Test", 1);
    const addCollection = database.prepare(`INSERT INTO collections
      (id,title,description,is_published,sort_order) VALUES (?,?,?,?,?)`);
    addCollection.run("helgtur", "Helgtur", "Tre redaktionellt valda stopp på Gotland.", 1, 2);
    addCollection.run("utkast", "Utkast", "Den här samlingen är inte publicerad ännu.", 0, 1);
    addCollection.run("kort", "För kort", "En publicerad samling med bara en aktiv plats.", 1, 3);
    const addPlace = database.prepare(`INSERT INTO collection_places
      (collection_id,place_id,sort_order) VALUES (?,?,?)`);
    addPlace.run("helgtur", "active-place", 0);
    addPlace.run("helgtur", "archived-place", 1);
    addPlace.run("helgtur", "active-place-two", 2);
    addPlace.run("utkast", "active-place", 0);
    addPlace.run("kort", "active-place", 0);

    const response = await fetch(`${baseUrl}/api/collections`);
    assert.equal(response.status, 200);
    assert.match(response.headers.get("cache-control"), /stale-while-revalidate/);
    assert.deepEqual(await response.json(), [{
      id: "helgtur",
      title: "Helgtur",
      description: "Tre redaktionellt valda stopp på Gotland.",
      sortOrder: 2,
      placeIds: ["active-place", "active-place-two"],
    }]);
  });
});

test("place creation rejects invalid and already used inactive IDs", async () => {
  await withServer({ apiKey: "test-key" }, async ({ baseUrl, database }) => {
    const headers = { "Content-Type": "application/json", "X-API-Key": "test-key" };
    const place = {
      id: "inactive-place", name: "Inaktiv plats", category: "natur",
      lat: 57.5, lng: 18.5, description: "Test",
    };
    const created = await fetch(`${baseUrl}/api/places`, {
      method: "POST", headers, body: JSON.stringify(place),
    });
    assert.equal(created.status, 201);
    database.prepare("UPDATE places SET is_active=0 WHERE id=?").run(place.id);

    const collision = await fetch(`${baseUrl}/api/places`, {
      method: "POST", headers, body: JSON.stringify(place),
    });
    assert.equal(collision.status, 409);

    const invalid = await fetch(`${baseUrl}/api/places`, {
      method: "POST", headers, body: JSON.stringify({ ...place, id: "Ogiltigt/id" }),
    });
    assert.equal(invalid.status, 400);
  });
});

test("write endpoints require a configured API key", async () => {
  await withServer({ apiKey: "" }, async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/api/places`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 503);
  });
});

test("visitors can queue a validated correction without changing the place", async () => {
  await withServer({}, async ({ baseUrl, database }) => {
    database.prepare(`INSERT INTO places
      (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,1)`)
      .run("test-place", "Testplats", "natur", 57.5, 18.5, "Test");

    const response = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueType: "hours",
        message: "Öppettiderna har ändrats sedan förra veckan.",
        email: "visitor@example.test",
      }),
    });
    assert.equal(response.status, 202);
    assert.equal(response.headers.get("cache-control"), "no-store");
    const correction = database.prepare("SELECT * FROM visitor_corrections").get();
    assert.equal(correction.place_id, "test-place");
    assert.equal(correction.issue_type, "hours");
    assert.equal(correction.status, "new");
    assert.equal(correction.contact_email, "visitor@example.test");
    assert.equal(database.prepare("SELECT description FROM places WHERE id=?").get("test-place").description, "Test");

    const invalid = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ issueType: "unknown", message: "kort" }),
    });
    assert.equal(invalid.status, 400);

    const honeypot = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueType: "other",
        message: "Det här ser ut som en riktig text.",
        website: "https://spam.example",
      }),
    });
    assert.equal(honeypot.status, 202);
    assert.equal(database.prepare("SELECT COUNT(*) count FROM visitor_corrections").get().count, 1);
  });
});

test("correction reports reject unknown places and are rate limited", async () => {
  await withServer({ correctionLimit: 1 }, async ({ baseUrl, database }) => {
    database.prepare(`INSERT INTO places
      (id,name,category,lat,lng,description,is_active) VALUES (?,?,?,?,?,?,1)`)
      .run("test-place", "Testplats", "natur", 57.5, 18.5, "Test");
    const input = {
      issueType: "location",
      message: "Markören ligger på fel sida av vägen.",
    };
    const accepted = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    assert.equal(accepted.status, 202);
    const limited = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    assert.equal(limited.status, 429);

    const otherClient = await fetch(`${baseUrl}/api/places/test-place/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "CF-Connecting-IP": "203.0.113.8" },
      body: JSON.stringify(input),
    });
    assert.equal(otherClient.status, 202);
  });

  await withServer({}, async ({ baseUrl }) => {
    const missing = await fetch(`${baseUrl}/api/places/missing/corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        issueType: "closed",
        message: "Platsen verkar vara permanent stängd.",
      }),
    });
    assert.equal(missing.status, 404);
  });
});
