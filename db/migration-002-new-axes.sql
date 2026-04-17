-- Migration 002: introduce the new axis vocabulary (theater, kind, domain,
-- posture) plus per-video boolean flags. Idempotent; safe to re-run.
--
-- This migration:
--   1. adds new columns to `videos` (theater, kind, domain, posture + slugs)
--   2. adds boolean flag columns
--   3. backfills theater/kind from the legacy front/type columns so the UI
--      keeps working before `retag.py` repopulates everything
--   4. widens the `categories.axis` CHECK constraint
--   5. adds indexes on the new slug columns
--
-- The old `front` / `type` columns are deliberately left in place for a
-- release or two so we can roll back if the new taxonomy misfires.

ALTER TABLE videos ADD COLUMN IF NOT EXISTS theater      TEXT    NOT NULL DEFAULT 'Unknown';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS theater_slug TEXT    NOT NULL DEFAULT 'unknown';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS kind         TEXT    NOT NULL DEFAULT 'Unknown';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS kind_slug    TEXT    NOT NULL DEFAULT 'unknown';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS domain       TEXT    NOT NULL DEFAULT 'Multi-domain';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS domain_slug  TEXT    NOT NULL DEFAULT 'multi-domain';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS posture      TEXT    NOT NULL DEFAULT 'Informational';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS posture_slug TEXT    NOT NULL DEFAULT 'informational';

ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_graphic                    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS involves_hostages             BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS involves_ceasefire_violation  BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS has_sensitive_content         BOOLEAN NOT NULL DEFAULT false;

-- First-pass backfill from legacy columns. Retag will refine values using
-- the new vocabulary; this just keeps the UI non-empty in the meantime.
UPDATE videos
   SET theater      = front,
       theater_slug = front_slug
 WHERE theater = 'Unknown' AND front IS NOT NULL;

UPDATE videos
   SET kind      = type,
       kind_slug = type_slug
 WHERE kind = 'Unknown' AND type IS NOT NULL;

-- Widen the categories.axis check to accept the new axes plus the legacy
-- ones (so existing rows for front/type stay valid until we prune them).
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_axis_check;
ALTER TABLE categories
  ADD CONSTRAINT categories_axis_check CHECK (
    axis IN ('theater','opponent','kind','domain','posture','front','type')
  );

CREATE INDEX IF NOT EXISTS videos_theater_slug_idx ON videos (theater_slug);
CREATE INDEX IF NOT EXISTS videos_kind_slug_idx    ON videos (kind_slug);
CREATE INDEX IF NOT EXISTS videos_domain_slug_idx  ON videos (domain_slug);
CREATE INDEX IF NOT EXISTS videos_posture_slug_idx ON videos (posture_slug);

CREATE INDEX IF NOT EXISTS videos_is_graphic_idx                   ON videos (is_graphic)                   WHERE is_graphic;
CREATE INDEX IF NOT EXISTS videos_involves_hostages_idx            ON videos (involves_hostages)            WHERE involves_hostages;
CREATE INDEX IF NOT EXISTS videos_involves_ceasefire_idx           ON videos (involves_ceasefire_violation) WHERE involves_ceasefire_violation;
CREATE INDEX IF NOT EXISTS videos_has_sensitive_content_idx        ON videos (has_sensitive_content)        WHERE has_sensitive_content;
