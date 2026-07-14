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
    assert.equal((await listResponse.json()).length, 1);
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
