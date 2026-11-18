CREATE TABLE sessions (
 id TEXT PRIMARY KEY, first_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 last_seen TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 source TEXT NOT NULL DEFAULT '', medium TEXT NOT NULL DEFAULT '', campaign TEXT NOT NULL DEFAULT ''
);
--> statement-breakpoint
CREATE TABLE releases (
 id TEXT PRIMARY KEY, object_key TEXT NOT NULL UNIQUE, version TEXT NOT NULL,
 size INTEGER NOT NULL CHECK(size>0), sha256 TEXT NOT NULL,
 active INTEGER NOT NULL DEFAULT 0 CHECK(active IN (0,1)), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE UNIQUE INDEX one_active_release ON releases(active) WHERE active=1;
--> statement-breakpoint
CREATE TABLE downloads (
 id TEXT PRIMARY KEY, session_id TEXT NOT NULL REFERENCES sessions(id),
 release_id TEXT NOT NULL REFERENCES releases(id), created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 status TEXT NOT NULL DEFAULT 'started' CHECK(status IN ('started','partial','served','interrupted','failed'))
);
--> statement-breakpoint
CREATE TABLE transfers (
 id TEXT PRIMARY KEY, download_id TEXT NOT NULL REFERENCES downloads(id),
 range_start INTEGER NOT NULL, range_end INTEGER NOT NULL, bytes INTEGER NOT NULL DEFAULT 0,
 status TEXT NOT NULL CHECK(status IN ('streaming','finished','interrupted','failed')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, finished_at TEXT
);
--> statement-breakpoint
CREATE INDEX downloads_session ON downloads(session_id, created_at);
--> statement-breakpoint
CREATE INDEX transfers_download ON transfers(download_id);
--> statement-breakpoint
CREATE INDEX sessions_first_seen ON sessions(first_seen);
