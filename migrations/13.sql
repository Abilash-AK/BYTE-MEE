-- Table to track pod messages for team chat
CREATE TABLE pod_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pod_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_picture TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pod_messages_pod_id ON pod_messages(pod_id);
CREATE INDEX idx_pod_messages_created_at ON pod_messages(created_at DESC);

