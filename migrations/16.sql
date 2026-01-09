-- Table to store work files in pods and track contributions
CREATE TABLE pod_work_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pod_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  description TEXT,
  ai_contribution_percent INTEGER DEFAULT 0,
  human_contribution_percent INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pod_work_files_pod_id ON pod_work_files(pod_id);
CREATE INDEX idx_pod_work_files_user_id ON pod_work_files(user_id);
CREATE INDEX idx_pod_work_files_created_at ON pod_work_files(created_at DESC);

