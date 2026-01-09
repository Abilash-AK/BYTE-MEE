-- Table to track challenge completions
CREATE TABLE challenge_completions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  challenge_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  score INTEGER,
  completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, challenge_id)
);

CREATE INDEX idx_challenge_completions_user_id ON challenge_completions(user_id);
CREATE INDEX idx_challenge_completions_completed_at ON challenge_completions(completed_at);
CREATE INDEX idx_challenge_completions_user_date ON challenge_completions(user_id, completed_at);

