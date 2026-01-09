import React from 'react';
import { FaDownload, FaExternalLinkAlt, FaShareAlt } from 'react-icons/fa';

const portfolioItems = [
  { title: 'DevRel Dashboard', role: 'Frontend', skills: ['React', 'TypeScript'], impact: 'Shipped demo in 48h' },
  { title: 'AI Study Planner', role: 'Fullstack', skills: ['Node', 'React'], impact: 'Planner + reminders + analytics' },
  { title: 'System Design Circle', role: 'Facilitator', skills: ['Architecture'], impact: '4 sessions + notes' },
];

const exportPortfolio = () => {
  const data = { items: portfolioItems, exportedAt: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'portfolio.json';
  a.click();
  URL.revokeObjectURL(url);
};

const PortfolioCard = () => {
  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
        <div>
          <strong>Growth Portfolio</strong>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Featured work, skills, and impact.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn" style={{ padding: '0.4rem 0.8rem' }} onClick={exportPortfolio}><FaDownload /> Export JSON</button>
          <button className="btn" style={{ padding: '0.4rem 0.8rem' }}><FaShareAlt /> Share</button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
        {portfolioItems.map(item => (
          <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '0.75rem' }}>
            <div style={{ fontWeight: 700 }}>{item.title}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.role}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.4rem' }}>
              {item.skills.map(skill => (
                <span key={skill} style={{ background: '#F4F5FB', padding: '3px 8px', borderRadius: '12px', fontSize: '0.85rem' }}>{skill}</span>
              ))}
            </div>
            <p style={{ margin: '0.4rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>{item.impact}</p>
            <button className="btn" style={{ padding: '0.35rem 0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              View <FaExternalLinkAlt size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PortfolioCard;
