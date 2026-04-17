-- IDF Video library schema
-- Runs idempotently; safe to re-execute.

CREATE TABLE IF NOT EXISTS videos (
  slug           TEXT PRIMARY KEY,
  id             TEXT NOT NULL,
  message_id     BIGINT NOT NULL,
  date           TEXT NOT NULL DEFAULT '',
  bitly_url      TEXT NOT NULL DEFAULT '',
  resolved_url   TEXT NOT NULL DEFAULT '',
  video_file     TEXT NOT NULL DEFAULT '',
  message_text   TEXT NOT NULL DEFAULT '',

  -- Current axis values (canonical).
  theater        TEXT NOT NULL DEFAULT 'Unknown',
  opponent       TEXT NOT NULL DEFAULT 'Unknown',
  kind           TEXT NOT NULL DEFAULT 'Unknown',
  domain         TEXT NOT NULL DEFAULT 'Multi-domain',
  posture        TEXT NOT NULL DEFAULT 'Informational',

  theater_slug   TEXT NOT NULL DEFAULT 'unknown',
  opponent_slug  TEXT NOT NULL DEFAULT 'unknown',
  kind_slug      TEXT NOT NULL DEFAULT 'unknown',
  domain_slug    TEXT NOT NULL DEFAULT 'multi-domain',
  posture_slug   TEXT NOT NULL DEFAULT 'informational',

  -- Boolean flags.
  is_graphic                   BOOLEAN NOT NULL DEFAULT false,
  involves_hostages            BOOLEAN NOT NULL DEFAULT false,
  involves_ceasefire_violation BOOLEAN NOT NULL DEFAULT false,
  has_sensitive_content        BOOLEAN NOT NULL DEFAULT false,

  -- Legacy axis columns, retained for rollback safety. Migration 002 keeps
  -- these in sync for one release, but the app now reads the new columns.
  front          TEXT NOT NULL DEFAULT 'Unknown',
  type           TEXT NOT NULL DEFAULT 'Unknown',
  front_slug     TEXT NOT NULL DEFAULT 'unknown',
  type_slug      TEXT NOT NULL DEFAULT 'unknown',

  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS videos_date_desc_idx      ON videos (date DESC);
CREATE INDEX IF NOT EXISTS videos_theater_slug_idx   ON videos (theater_slug);
CREATE INDEX IF NOT EXISTS videos_opp_slug_idx       ON videos (opponent_slug);
CREATE INDEX IF NOT EXISTS videos_kind_slug_idx      ON videos (kind_slug);
CREATE INDEX IF NOT EXISTS videos_domain_slug_idx    ON videos (domain_slug);
CREATE INDEX IF NOT EXISTS videos_posture_slug_idx   ON videos (posture_slug);
CREATE INDEX IF NOT EXISTS videos_bitly_idx          ON videos (bitly_url);
CREATE INDEX IF NOT EXISTS videos_msgid_idx          ON videos (message_id);

CREATE INDEX IF NOT EXISTS videos_is_graphic_idx                   ON videos (is_graphic)                   WHERE is_graphic;
CREATE INDEX IF NOT EXISTS videos_involves_hostages_idx            ON videos (involves_hostages)            WHERE involves_hostages;
CREATE INDEX IF NOT EXISTS videos_involves_ceasefire_idx           ON videos (involves_ceasefire_violation) WHERE involves_ceasefire_violation;
CREATE INDEX IF NOT EXISTS videos_has_sensitive_content_idx        ON videos (has_sensitive_content)        WHERE has_sensitive_content;

-- Legacy indexes (kept for rollback).
CREATE INDEX IF NOT EXISTS videos_front_slug_idx     ON videos (front_slug);
CREATE INDEX IF NOT EXISTS videos_type_slug_idx      ON videos (type_slug);

CREATE TABLE IF NOT EXISTS categories (
  axis       TEXT NOT NULL,
  slug       TEXT NOT NULL,
  label      TEXT NOT NULL,
  tagline    TEXT NOT NULL DEFAULT '',
  intro      TEXT NOT NULL DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (axis, slug)
);

-- Allow both current and legacy axes while we migrate.
ALTER TABLE categories DROP CONSTRAINT IF EXISTS categories_axis_check;
ALTER TABLE categories
  ADD CONSTRAINT categories_axis_check CHECK (
    axis IN ('theater','opponent','kind','domain','posture','front','type')
  );

CREATE TABLE IF NOT EXISTS scrape_runs (
  id            BIGSERIAL PRIMARY KEY,
  kind          TEXT NOT NULL DEFAULT 'scrape', -- 'scrape' | 'retag'
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'running', -- 'running' | 'success' | 'error'
  videos_added  INT NOT NULL DEFAULT 0,
  videos_updated INT NOT NULL DEFAULT 0,
  error         TEXT,
  triggered_by  TEXT NOT NULL DEFAULT 'manual'  -- 'manual' | 'admin' | 'cron'
);

CREATE INDEX IF NOT EXISTS scrape_runs_started_idx ON scrape_runs (started_at DESC);
