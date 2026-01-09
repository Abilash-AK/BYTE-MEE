import React from 'react';
import { FaGithub, FaCodeBranch, FaCheck, FaStar, FaClock } from 'react-icons/fa';

const mockRepos = [
  { name: 'colearn-platform', commits: 42, prs: 5, stars: 18, languages: ['TypeScript', 'React'], complexity: 'Medium' },
  { name: 'daily-pods-runner', commits: 27, prs: 3, stars: 9, languages: ['Node.js'], complexity: 'Low' },
  { name: 'skill-graph', commits: 16, prs: 2, stars: 5, languages: ['Python'], complexity: 'Medium' }
];

const SkillVerificationCard = () => {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem' }}>
        <FaGithub />
        <strong>Skill Verification (GitHub path)</strong>
      </div>
      <p style={{ marginTop: 0, color: 'var(--color-text-muted)' }}>Recent repos, commit velocity, and language mix.</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
        {mockRepos.map(repo => (
          <div key={repo.name} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontWeight: 700 }}>{repo.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
                <FaClock /> 30d
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.35rem', flexWrap: 'wrap', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              <span><FaCodeBranch /> {repo.commits} commits</span>
              <span><FaCheck /> {repo.prs} PRs</span>
              <span><FaStar /> {repo.stars} stars</span>
              <span>Complexity: {repo.complexity}</span>
              <span>Lang: {repo.languages.join(', ')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SkillVerificationCard;
