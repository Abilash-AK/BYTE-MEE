DROP INDEX IF EXISTS idx_pods_is_active;
DROP INDEX IF EXISTS idx_pods_creator_id;

CREATE TABLE pods_rollback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  creator_id TEXT NOT NULL,
  creator_name TEXT NOT NULL,
  skills_needed TEXT,
  team_size INTEGER,
  duration TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO pods_rollback (
  id,
  name,
  description,
  creator_id,
  creator_name,
  skills_needed,
  team_size,
  duration,
  is_active,
  created_at,
  updated_at
)
SELECT
  id,
  name,
  description,
  creator_id,
  creator_name,
  skills_needed,
  team_size,
  duration,
  is_active,
  created_at,
  updated_at
FROM pods;

DROP TABLE pods;
ALTER TABLE pods_rollback RENAME TO pods;

CREATE INDEX idx_pods_creator_id ON pods(creator_id);
CREATE INDEX idx_pods_is_active ON pods(is_active);
