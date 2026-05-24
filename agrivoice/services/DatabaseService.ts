/**
 * DatabaseService.ts
 *
 * SQLite wrapper using expo-sqlite.
 * Provides a local cache for advisories and pest records so the app
 * still works after an initial data seed, even with no bundle access.
 *
 * Schema is kept intentionally simple — plain key/value JSON blobs —
 * so migrations are trivial and the learning curve is low.
 */

import * as SQLite from "expo-sqlite";
import { Advisory, PestRecord } from "@/types";

const DB_NAME = "agrivoice.db";
const DB_VERSION = 1;

// Keep one connection open for the app lifetime (avoids repeated opens)
let db: SQLite.SQLiteDatabase | null = null;

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS advisories (
      id         TEXT PRIMARY KEY,
      crop       TEXT NOT NULL,
      stage      TEXT NOT NULL,
      data       TEXT NOT NULL,  -- JSON blob of Advisory
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS pests (
      id         TEXT PRIMARY KEY,
      crop       TEXT NOT NULL,
      model_label TEXT NOT NULL,
      data       TEXT NOT NULL,  -- JSON blob of PestRecord
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_log (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_advisory_crop_stage ON advisories (crop, stage);
    CREATE INDEX IF NOT EXISTS idx_pest_crop_label ON pests (crop, model_label);
  `);
}

function getDb(): SQLite.SQLiteDatabase {
  if (!db) throw new Error("Database not initialized. Call initDatabase() first.");
  return db;
}

// ─── Advisory CRUD ────────────────────────────────────────────────────────────

export async function upsertAdvisory(advisory: Advisory): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO advisories (id, crop, stage, data, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    advisory.id,
    advisory.crop,
    advisory.stage,
    JSON.stringify(advisory),
    advisory.updatedAt
  );
}

export async function getAdvisoryFromDb(
  crop: string,
  stage: string
): Promise<Advisory | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ data: string }>(
    `SELECT data FROM advisories WHERE crop = ? AND stage = ?`,
    crop,
    stage
  );
  if (!row) return null;
  return JSON.parse(row.data) as Advisory;
}

export async function getAllAdvisories(): Promise<Advisory[]> {
  const database = getDb();
  const rows = await database.getAllAsync<{ data: string }>(
    `SELECT data FROM advisories`
  );
  return rows.map((r) => JSON.parse(r.data) as Advisory);
}

// ─── Pest CRUD ────────────────────────────────────────────────────────────────

export async function upsertPest(pest: PestRecord): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO pests (id, crop, model_label, data, updated_at)
     VALUES (?, ?, ?, ?, ?)`,
    pest.id,
    pest.crop,
    pest.modelLabel,
    JSON.stringify(pest),
    new Date().toISOString()
  );
}

export async function getPestFromDb(
  crop: string,
  modelLabel: string
): Promise<PestRecord | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ data: string }>(
    `SELECT data FROM pests WHERE crop = ? AND model_label = ?`,
    crop,
    modelLabel
  );
  if (!row) return null;
  return JSON.parse(row.data) as PestRecord;
}

// ─── Sync log (last-sync timestamp & manifest etag) ──────────────────────────

export async function getSyncMeta(key: string): Promise<string | null> {
  const database = getDb();
  const row = await database.getFirstAsync<{ value: string }>(
    `SELECT value FROM sync_log WHERE key = ?`,
    key
  );
  return row?.value ?? null;
}

export async function setSyncMeta(key: string, value: string): Promise<void> {
  const database = getDb();
  await database.runAsync(
    `INSERT OR REPLACE INTO sync_log (key, value) VALUES (?, ?)`,
    key,
    value
  );
}

// ─── Seed helper (called on first launch) ─────────────────────────────────────

/**
 * Seeds the SQLite cache from the bundled JSON data files.
 * Idempotent — skips records that already exist.
 * Runs asynchronously and does not block app startup.
 */
export async function seedDatabase(): Promise<void> {
  const alreadySeeded = await getSyncMeta("seeded");
  if (alreadySeeded === "1") return;

  // Dynamic imports avoid bundling all JSON into the initial JS bundle
  const [
    maize, rice, cassava, pineapple, sorghum,
    maizePests, ricePests, cassavaPests, pineapplePests, sorghumPests,
  ] = await Promise.all([
    import("@/data/crops/maize.json"),
    import("@/data/crops/rice.json"),
    import("@/data/crops/cassava.json"),
    import("@/data/crops/pineapple.json"),
    import("@/data/crops/sorghum.json"),
    import("@/data/pests/maize_pests.json"),
    import("@/data/pests/rice_pests.json"),
    import("@/data/pests/cassava_pests.json"),
    import("@/data/pests/pineapple_pests.json"),
    import("@/data/pests/sorghum_pests.json"),
  ]);

  const advisories = [
    ...(maize.default as Advisory[]),
    ...(rice.default as Advisory[]),
    ...(cassava.default as Advisory[]),
    ...(pineapple.default as Advisory[]),
    ...(sorghum.default as Advisory[]),
  ];

  const pests = [
    ...(maizePests.default as PestRecord[]),
    ...(ricePests.default as PestRecord[]),
    ...(cassavaPests.default as PestRecord[]),
    ...(pineapplePests.default as PestRecord[]),
    ...(sorghumPests.default as PestRecord[]),
  ];

  for (const advisory of advisories) {
    await upsertAdvisory(advisory);
  }
  for (const pest of pests) {
    await upsertPest(pest);
  }

  await setSyncMeta("seeded", "1");
}
