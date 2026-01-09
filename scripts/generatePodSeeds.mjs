#!/usr/bin/env node
const locations = [
  { city: 'Bengaluru', district: 'Karnataka', lat: 12.9716, lng: 77.5946 },
  { city: 'Hyderabad', district: 'Telangana', lat: 17.385, lng: 78.4867 },
  { city: 'Mumbai', district: 'Maharashtra', lat: 19.076, lng: 72.8777 },
  { city: 'Pune', district: 'Maharashtra', lat: 18.5204, lng: 73.8567 },
  { city: 'Delhi', district: 'Delhi', lat: 28.7041, lng: 77.1025 },
  { city: 'Chennai', district: 'Tamil Nadu', lat: 13.0827, lng: 80.2707 },
  { city: 'Kolkata', district: 'West Bengal', lat: 22.5726, lng: 88.3639 },
  { city: 'Jaipur', district: 'Rajasthan', lat: 26.9124, lng: 75.7873 },
  { city: 'Ahmedabad', district: 'Gujarat', lat: 23.0225, lng: 72.5714 },
  { city: 'Kochi', district: 'Kerala', lat: 9.9312, lng: 76.2673 }
];

const themes = [
  'Climate Action',
  'Fintech Innovation',
  'AI for Good',
  'AgriTech',
  'Healthcare',
  'Urban Mobility',
  'Open Source',
  'Education',
  'SpaceTech',
  'Smart Cities',
];

const skillPool = [
  'React', 'TypeScript', 'Node.js', 'Python', 'TensorFlow', 'Rust', 'DevOps', 'UI/UX', 'Go',
  'Data Science', 'Machine Learning', 'Blockchain', 'Kubernetes', 'Flutter', 'Dart', 'PostgreSQL'
];

const durations = ['24 hours', '48 hours', '1 week', '2 weeks', '1 month'];
const creators = [
  { id: 'seed-user-1', name: 'Valentina Rao' },
  { id: 'seed-user-2', name: 'Arjun Mehta' },
  { id: 'seed-user-3', name: 'Priya Kapoor' },
  { id: 'seed-user-4', name: 'Dev Singh' },
  { id: 'seed-user-5', name: 'Neha Sharma' }
];

const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const escapeSql = (value) => value.replace(/'/g, "''");

const pods = Array.from({ length: 50 }, (_, index) => {
  const location = randomItem(locations);
  const creator = randomItem(creators);
  const theme = randomItem(themes);
  const skillCount = randomInt(3, 5);
  const selectedSkills = Array.from({ length: skillCount }, () => randomItem(skillPool));
  const uniqueSkills = [...new Set(selectedSkills)];
  const teamSize = randomInt(3, 8);
  const duration = randomItem(durations);
  const deadlineOffsetDays = randomInt(5, 40);
  const deadline = new Date(Date.now() + deadlineOffsetDays * 24 * 60 * 60 * 1000).toISOString();

  const name = `${location.city} ${theme} Pod ${index + 1}`;
  const description = `Rapid prototype sprint focused on ${theme.toLowerCase()} challenges happening in ${location.city}. Collaborate with local builders to ship something meaningful.`;

  return {
    name,
    description,
    creator_id: creator.id,
    creator_name: creator.name,
    skills_needed: uniqueSkills.join(', '),
    team_size: teamSize,
    duration,
    deadline,
    city: `${location.city}, ${location.district}`,
    district: location.district,
    location_lat: location.lat,
    location_lng: location.lng,
  };
});

const header = `-- Auto-generated seed data for pods\n-- Run with: wrangler d1 execute colearn-db --file seeds/pod_seed_data.sql\nBEGIN TRANSACTION;`;
const footer = 'COMMIT;';

const body = pods
  .map((pod) => {
    const fields = [
      pod.name,
      pod.description,
      pod.creator_id,
      pod.creator_name,
      pod.skills_needed,
      pod.team_size,
      pod.duration,
      pod.deadline,
      pod.city,
      pod.district,
      pod.location_lat,
      pod.location_lng,
    ];

    const values = [
      `'${escapeSql(fields[0])}'`,
      `'${escapeSql(fields[1])}'`,
      `'${escapeSql(fields[2])}'`,
      `'${escapeSql(fields[3])}'`,
      `'${escapeSql(fields[4])}'`,
      `${fields[5]}`,
      `'${escapeSql(fields[6])}'`,
      `'${escapeSql(fields[7])}'`,
      `'${escapeSql(fields[8])}'`,
      `'${escapeSql(fields[9])}'`,
      `${fields[10]}`,
      `${fields[11]}`,
    ].join(', ');

    return `INSERT INTO pods (name, description, creator_id, creator_name, skills_needed, team_size, duration, deadline, city, district, location_lat, location_lng, is_active)
VALUES (${values}, 1);`;
  })
  .join('\n\n');

console.log([header, body, footer].join('\n\n'));
