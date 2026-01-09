const STORAGE_KEYS = {
  STREAK: 'daily_pod_streak',
  LAST_JOIN_DATE: 'daily_pod_last_join',
  ARCHIVE: 'daily_pod_archive',
};

const releaseHour = 9; // 9 AM local time

const partnersMock = [
  { name: 'Sam', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sam' },
  { name: 'Mila', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Mila' },
  { name: 'Kai', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Kai' },
  { name: 'Nova', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nova' },
  { name: 'Remy', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Remy' },
];

const challenges = [
  {
    title: 'React Weather Widget',
    description: 'Fetch a city forecast, handle loading/error, and render cards.',
    durationMinutes: 120,
  },
  {
    title: 'Python Data Scraper',
    description: 'Scrape 10 blog posts and summarize titles + links.',
    durationMinutes: 90,
  },
  {
    title: 'JavaScript Quiz Game',
    description: 'Build a timed quiz with score, streak, and restart.',
    durationMinutes: 60,
  },
];

const getNextReleaseTime = () => {
  const now = new Date();
  const release = new Date();
  release.setHours(releaseHour, 0, 0, 0);
  if (now > release) {
    release.setDate(release.getDate() + 1);
  }
  return release;
};

export const getTodayChallenge = () => {
  const releaseAt = getNextReleaseTime();
  const now = new Date();
  const isAvailable = now >= releaseAt;
  const idx = new Date().getDate() % challenges.length;
  const challenge = challenges[idx];
  return {
    ...challenge,
    releaseAt: releaseAt.toISOString(),
    status: isAvailable ? 'available' : 'locked',
  };
};

export const getPartners = () => {
  const shuffled = [...partnersMock].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

export const getStreak = () => Number(localStorage.getItem(STORAGE_KEYS.STREAK) || 0);

export const incrementStreakForToday = () => {
  const today = new Date().toISOString().slice(0, 10);
  const last = localStorage.getItem(STORAGE_KEYS.LAST_JOIN_DATE);
  if (last === today) return getStreak();
  const next = getStreak() + 1;
  localStorage.setItem(STORAGE_KEYS.STREAK, String(next));
  localStorage.setItem(STORAGE_KEYS.LAST_JOIN_DATE, today);
  return next;
};

export const joinDailySession = () => {
  const streak = incrementStreakForToday();
  const sessionId = `session-${Date.now()}`;
  const archive = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE) || '[]');
  const idx = new Date().getDate() % challenges.length;
  const challenge = challenges[idx];
  archive.push({ id: sessionId, title: challenge.title, startedAt: new Date().toISOString(), durationMinutes: challenge.durationMinutes });
  localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive.slice(-20)));
  return { sessionId, streak };
};

export const submitFeedback = (sessionId, feedback) => {
  const archive = JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE) || '[]');
  const idx = archive.findIndex(s => s.id === sessionId);
  if (idx >= 0) {
    archive[idx].feedback = feedback;
    archive[idx].endedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive));
  }
  return archive[idx] || null;
};

export const getArchive = () => JSON.parse(localStorage.getItem(STORAGE_KEYS.ARCHIVE) || '[]');
