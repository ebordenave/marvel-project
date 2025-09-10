// server/index.js
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const express = require("express");
const crypto = require("crypto");
// If on Node < 18, uncomment next line and: npm i node-fetch
// const fetch = require("node-fetch");

const app = express();
const PORT = process.env.PORT || 8787;

// quick sanity log (no secrets)
console.log("[env] MARVEL_PUBLIC:", String(process.env.MARVEL_PUBLIC || "").slice(0, 6));
console.log("[env] MARVEL_PRIVATE set?:", Boolean(process.env.MARVEL_PRIVATE));

// health check
app.get("/api/health", (_req, res) =>
  res.json({
    ok: true,
    publicLoaded: Boolean(process.env.MARVEL_PUBLIC),
    privateLoaded: Boolean(process.env.MARVEL_PRIVATE),
  })
);

// GET /api/marvel/characters?query=spi
app.get("/api/marvel/characters", async (req, res) => {
  const q = (req.query.query || "").toString();
  if (q.trim().length < 2) return res.json([]);

  // READ ENV *HERE* (avoid any scope issues)
  const pub = process.env.MARVEL_PUBLIC;
  const priv = process.env.MARVEL_PRIVATE;

  if (!pub || !priv) {
    console.error("Missing MARVEL_PUBLIC or MARVEL_PRIVATE");
    return res.status(500).json({ error: "Server misconfigured" });
  }

  const ts = Date.now().toString();
  const hash = crypto.createHash("md5").update(ts + priv + pub).digest("hex");

  const url = new URL("https://gateway.marvel.com/v1/public/characters");
  url.searchParams.set("nameStartsWith", q);
  url.searchParams.set("limit", "10");
  url.searchParams.set("ts", ts);
  url.searchParams.set("apikey", pub);
  url.searchParams.set("hash", hash);

  try {
    const r = await fetch(url);
    const text = await r.text();

    if (!r.ok) {
      console.error("Marvel error", r.status, text.slice(0, 300));
      return res.status(r.status).type("text/plain").send(text);
    }

    const json = JSON.parse(text);
    const items = (json.data?.results ?? []).map((c) => {
      const raw = c.thumbnail ? `${c.thumbnail.path}.${c.thumbnail.extension}` : undefined;
      const https = raw?.replace(/^http:\/\//, "https://");
      const thumbnailUrl = https && !/image_not_available/.test(https) ? https : undefined;
      return { id: c.id, name: c.name, thumbnailUrl };
    });

    res.json(items);
  } catch (e) {
    console.error("Server error", e);
    res.status(500).json({ error: "Server error" });
  }
});
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    publicLoaded: Boolean(process.env.MARVEL_PUBLIC),
    privateLoaded: Boolean(process.env.MARVEL_PRIVATE),
  });
});

// GET /api/marvel/characters/:id  -> single character details
app.get("/api/marvel/characters/:id", async (req, res) => {
  const id = String(req.params.id || "").trim();
  if (!id) return res.status(400).json({ error: "Missing id" });

  const pub = process.env.MARVEL_PUBLIC;
  const priv = process.env.MARVEL_PRIVATE;
  const ts = Date.now().toString();
  const hash = crypto.createHash("md5").update(ts + priv + pub).digest("hex");

  const url = new URL(`https://gateway.marvel.com/v1/public/characters/${id}`);
  url.searchParams.set("ts", ts);
  url.searchParams.set("apikey", pub);
  url.searchParams.set("hash", hash);

  try {
    const r = await fetch(url);
    const text = await r.text();
    if (!r.ok) return res.status(r.status).type("text/plain").send(text);

    const json = JSON.parse(text);
    const c = json.data?.results?.[0];
    if (!c) return res.status(404).json({ error: "Not found" });

    const raw = c.thumbnail ? `${c.thumbnail.path}.${c.thumbnail.extension}` : undefined;
    const https = raw?.replace(/^http:\/\//, "https://");
    const thumbnailUrl = https && !/image_not_available/.test(https) ? https : undefined;

    res.json({
      id: c.id,
      name: c.name,
      description: c.description || "(No description)",
      thumbnailUrl,
      comicsAvailable: c.comics?.available ?? 0,
      seriesAvailable: c.series?.available ?? 0,
      storiesAvailable: c.stories?.available ?? 0,
    });
  } catch (e) {
    console.error("Server error", e);
    res.status(500).json({ error: "Server error" });
  }
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});