
CREATE TABLE communities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  technology TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_communities_technology ON communities(technology);

INSERT INTO communities (name, description, technology, color) VALUES
('React Community', 'Join fellow React developers to share knowledge, debug issues, and build amazing UIs together', 'React', '#61DAFB'),
('Python Community', 'Connect with Python enthusiasts for data science, web development, automation, and more', 'Python', '#3776AB'),
('JavaScript Community', 'Master JavaScript with peers - from basics to advanced topics like async/await and closures', 'JavaScript', '#F7DF1E'),
('TypeScript Community', 'Learn and practice TypeScript with developers who love type safety and better tooling', 'TypeScript', '#3178C6'),
('Node.js Community', 'Build scalable backend applications and learn server-side JavaScript with experienced developers', 'Node.js', '#339933'),
('AI/ML Community', 'Explore artificial intelligence and machine learning with students passionate about the future of tech', 'AI/ML', '#FF6F61'),
('Web Design Community', 'Share design tips, get feedback on UIs, and learn modern design principles together', 'Design', '#FF69B4'),
('Mobile Dev Community', 'Build mobile apps with React Native, Flutter, or native development - connect with mobile developers', 'Mobile', '#A259FF');
