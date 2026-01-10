-- Table to track skill verification levels
CREATE TABLE skill_verifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  skill TEXT NOT NULL,
  level_1_completed INTEGER DEFAULT 0, -- Quiz passed
  level_1_completed_at TIMESTAMP,
  level_2_completed INTEGER DEFAULT 0, -- Coding test passed
  level_2_completed_at TIMESTAMP,
  level_2_code TEXT, -- Store the code submitted for level 2
  level_3_completed INTEGER DEFAULT 0, -- Skill accomplished
  level_3_completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, skill)
);

CREATE INDEX idx_skill_verifications_user_id ON skill_verifications(user_id);
CREATE INDEX idx_skill_verifications_skill ON skill_verifications(skill);
CREATE INDEX idx_skill_verifications_level_3 ON skill_verifications(user_id, skill, level_3_completed) WHERE level_3_completed = 1;

