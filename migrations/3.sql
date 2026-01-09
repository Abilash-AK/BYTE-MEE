
CREATE TABLE pod_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  pod_id INTEGER NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  user_picture TEXT,
  why_interested TEXT,
  skills TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pod_applications_pod_id ON pod_applications(pod_id);
CREATE INDEX idx_pod_applications_user_id ON pod_applications(user_id);
CREATE INDEX idx_pod_applications_status ON pod_applications(status);
