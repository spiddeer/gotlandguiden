const express = require("express");
const crypto = require("crypto");
const { db } = require("./db");
const {
  getPlace,
  listCategories,
  listPlaces,
  savePlace,
} = require("./place-repository");

const PORT = process.env.PORT || 8080;
const API_KEY = process.env.API_KEY || "";
const PUBLIC_CACHE_CONTROL = "public, max-age=300, stale-while-revalidate=3600";

function slugify(text) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function createUniqueId(database, name) {
  const base = slugify(name) || "plats";
  const exists = database.prepare("SELECT 1 FROM places WHERE id = ?");
  let candidate = base;
  let suffix = 1;
  while (exists.get(candidate)) candidate = `${base}-${++suffix}`;
  return candidate;
}

function safeEqual(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  return leftBuffer.length === rightBuffer.length
    && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function validatePlaceInput(database, input, { partial = false } = {}) {
  const errors = [];
  const categories = new Set(listCategories(database).map((category) => category.id));

  if (Object.hasOwn(input, "id")) {
    if (typeof input.id !== "string" || !ID_PATTERN.test(input.id.trim())) {
      errors.push("id must contain lowercase letters, numbers, and single hyphens only");
    }
  }

  if (!partial || Object.hasOwn(input, "name")) {
    if (typeof input.name !== "string" || !input.name.trim()) errors.push("name is required");
  }
  if (!partial || Object.hasOwn(input, "category")) {
    if (!categories.has(input.category)) errors.push(`category must be one of: ${[...categories].join(", ")}`);
  }
  if (!partial || Object.hasOwn(input, "lat")) {
    if (typeof input.lat !== "number" || input.lat < -90 || input.lat > 90) {
      errors.push("lat must be a number between -90 and 90");
    }
  }
  if (!partial || Object.hasOwn(input, "lng")) {
    if (typeof input.lng !== "number" || input.lng < -180 || input.lng > 180) {
      errors.push("lng must be a number between -180 and 180");
    }
  }
  if (input.categories) {
    if (!Array.isArray(input.categories)) errors.push("categories must be an array");
    else {
      for (const category of input.categories) {
        if (!categories.has(category)) errors.push(`unknown category: ${category}`);
      }
    }
  }
  if (input.priceLevel != null && ![1, 2, 3, 4].includes(input.priceLevel)) {
    errors.push("priceLevel must be between 1 and 4");
  }
  for (const hours of input.openingHours?.weekly || []) {
    if (!Number.isInteger(hours.dayOfWeek) || hours.dayOfWeek < 0 || hours.dayOfWeek > 6) {
      errors.push("openingHours.weekly.dayOfWeek must be between 0 and 6");
    }
  }
  return errors;
}

function createApp(database = db, { apiKey = API_KEY } = {}) {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "256kb" }));

  function requireApiKey(req, res, next) {
    if (!apiKey) {
      return res.status(503).json({ error: "API writes are not configured." });
    }
    if (!safeEqual(req.get("X-API-Key") || "", apiKey)) {
      return res.status(401).json({ error: "Invalid or missing API key." });
    }
    next();
  }

  app.get("/healthz", (req, res) => {
    database.prepare("SELECT 1").get();
    res.set("Cache-Control", "no-store");
    res.json({ ok: true });
  });

  app.get("/api/categories", (req, res) => {
    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(listCategories(database));
  });

  app.get("/api/places", (req, res) => {
    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(listPlaces(database));
  });

  app.get("/api/places/:id", (req, res) => {
    const place = getPlace(database, req.params.id);
    if (!place) return res.status(404).json({ error: "Place not found." });
    res.set("Cache-Control", PUBLIC_CACHE_CONTROL);
    res.json(place);
  });

  app.post("/api/places", requireApiKey, (req, res) => {
    const input = req.body || {};
    const errors = validatePlaceInput(database, input);
    if (errors.length) return res.status(400).json({ errors });

    const id = typeof input.id === "string" && input.id.trim()
      ? input.id.trim()
      : createUniqueId(database, input.name);
    try {
      const place = savePlace(database, {
        ...input,
        id,
        name: input.name.trim(),
        description: input.description || "",
      }, { create: true });
      res.status(201).json(place);
    } catch (error) {
      if (error.message === "Place already exists") {
        return res.status(409).json({ error: error.message });
      }
      throw error;
    }
  });

  app.patch("/api/places/:id", requireApiKey, (req, res) => {
    const input = req.body || {};
    const errors = validatePlaceInput(database, input, { partial: true });
    if (errors.length) return res.status(400).json({ errors });
    const place = savePlace(database, { ...input, id: req.params.id });
    if (!place) return res.status(404).json({ error: "Place not found." });
    res.json(place);
  });

  app.use((error, req, res, next) => {
    console.error(error);
    res.status(500).json({ error: "Internal server error." });
  });
  return app;
}

if (require.main === module) {
  createApp().listen(PORT, () => {
    console.log(`Gutafinn API listening on port ${PORT}`);
  });
}

module.exports = { createApp, createUniqueId, validatePlaceInput };
