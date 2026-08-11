export const COLORS = {
  void: "#0B0D10",
  surface: "#15181D",
  surfaceHi: "#1B1F26",
  surfaceEdge: "#282D36",
  ink: "#F5F3EC",
  inkSoft: "#9AA0AC",
  inkFaint: "#5D636E",
  ember: "#FF6A45",
  emberDim: "#B84B30",
  gold: "#F5C56B",
  glow: "#35D6C4",
};

export const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700;800&display=swap');
`;

export const EMOTIONS = [
  { key: 'connected', emoji: '🤝', label: 'Connected' },
  { key: 'joyful', emoji: '😊', label: 'Joyful' },
  { key: 'proud', emoji: '💪', label: 'Proud' },
  { key: 'calm', emoji: '🌿', label: 'Calm' },
  { key: 'energized', emoji: '⚡', label: 'Energized' },
  { key: 'grateful', emoji: '🙏', label: 'Grateful' },
];

export const ptp = (achieved, target) => {
  if (!target) return 0;
  return Math.min(100, Math.round((achieved / target) * 100));
};

export const todayStr = () => new Date().toISOString().slice(0, 10);

export const daysBetween = (a, b) => 
  Math.round((new Date(b) - new Date(a)) / 86400000);

export const presetDeadline = (preset) => {
  const d = new Date();
  if (preset === '1m') d.setMonth(d.getMonth() + 1);
  else if (preset === '3m') d.setMonth(d.getMonth() + 3);
  else d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
};

export const computePace = (createdAt, deadline, target, achieved) => {
  const start = createdAt.slice(0, 10);
  const totalDays = Math.max(1, daysBetween(start, deadline));
  const elapsedDays = Math.min(totalDays, Math.max(0, daysBetween(start, todayStr())));
  const expected = (target * elapsedDays) / totalDays;
  const diff = achieved - expected;
  const daysLeft = Math.max(0, daysBetween(todayStr(), deadline));
  const remaining = Math.max(0, target - achieved);
  return {
    diff,
    daysLeft,
    remaining,
    isDone: achieved >= target,
    isOverdue: daysLeft === 0 && achieved < target,
  };
};
