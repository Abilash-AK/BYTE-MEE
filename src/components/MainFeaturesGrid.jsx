import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCheckCircle, FaRocket, FaUsers, FaChartPie, FaRobot, FaShieldAlt, FaComments, FaStar, FaSearch, FaMobileAlt, FaLink } from 'react-icons/fa';
import { trackAIUsage } from '../services/aiService';

const cards = (aiUsage) => [
  {
    title: 'Skill Verification',
    desc: 'Review GitHub activity, repos, and endorsements.',
    action: 'Open verification',
    to: '/dashboard',
    icon: <FaCheckCircle />,
    meta: 'Activity: Repos 12 | Commits 134'
  },
  {
    title: 'Portfolio',
    desc: 'Auto-assemble highlights and export.',
    action: 'Open portfolio',
    to: '/dashboard',
    icon: <FaRocket />,
    meta: 'Featured: 3 projects'
  },
  {
    title: 'Circles',
    desc: 'Join learning and practice circles.',
    action: 'Browse circles',
    to: '/dashboard',
    icon: <FaUsers />,
    meta: 'Circles: 2 joined'
  },
  {
    title: 'Analytics',
    desc: 'Track time on skill and velocity.',
    action: 'View analytics',
    to: '/dashboard',
    icon: <FaChartPie />,
    meta: 'This week: 6h React'
  },
  {
    title: 'AI Assistant',
    desc: 'Use inline suggestions in the workspace.',
    action: 'Open workspace',
    to: '/workspace',
    icon: <FaRobot />,
    meta: `AI share: ${aiUsage.ai || 0}%`
  },
  {
    title: 'Transparency',
    desc: 'Log AI vs human edits per session.',
    action: 'View ledger',
    to: '/workspace',
    icon: <FaShieldAlt />,
    meta: 'Ledger active'
  },
  {
    title: 'Messaging',
    desc: 'Chat and collaborate with your pod.',
    action: 'Open chat',
    to: '/workspace',
    icon: <FaComments />,
    meta: 'Live'
  },
  {
    title: 'Events',
    desc: 'See upcoming hackathons and circles.',
    action: 'View events',
    to: '/dashboard',
    icon: <FaStar />,
    meta: '2 upcoming'
  },
  {
    title: 'Discovery',
    desc: 'Find pods and partners by skill.',
    action: 'Find pods',
    to: '/pods',
    icon: <FaSearch />,
    meta: 'Matching ready'
  },
  {
    title: 'Integrations',
    desc: 'GitHub, Calendar, Drive connections.',
    action: 'Manage integrations',
    to: '/dashboard',
    icon: <FaLink />,
    meta: 'GitHub linked'
  },
  {
    title: 'Mobile',
    desc: 'Stay synced with push and quick calls.',
    action: 'Use mobile mode',
    to: '/dashboard',
    icon: <FaMobileAlt />,
    meta: 'Responsive ready'
  }
];

const MainFeaturesGrid = () => {
  const navigate = useNavigate();
  const usage = trackAIUsage();
  const total = (usage.human || 0) + (usage.ai || 0);
  const aiPercent = total > 0 ? Math.round((usage.ai / total) * 100) : 40;
  const grid = cards({ ai: aiPercent });

  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div>
          <h3 style={{ margin: 0, color: 'var(--color-primary)' }}>Core Feature Runbook</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted)' }}>Quick actions to execute the top categories.</p>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        {grid.map(item => (
          <div key={item.title} style={{ border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '1rem', background: 'white', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--color-primary)' }}>
              {item.icon}
              <strong>{item.title}</strong>
            </div>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>{item.desc}</p>
            <small style={{ color: 'var(--color-text-muted)' }}>{item.meta}</small>
            <button className="btn" style={{ alignSelf: 'flex-start', padding: '0.5rem 1rem' }} onClick={() => navigate(item.to)}>
              {item.action}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainFeaturesGrid;
