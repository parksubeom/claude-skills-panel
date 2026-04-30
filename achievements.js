// Achievement definitions + checker.
// Achievements are computed from the user config and stored as id strings
// in cfg.meta.achievements (array). Once earned they never disappear.

const userConfig = require('./userConfig');

function computeStats(cfg) {
  const meta = cfg.meta || {};
  const skills = cfg.skills || {};
  const entries = Object.values(skills);

  const distinct = entries.filter((e) => e.usage && e.usage.count > 0).length;
  const maxLevel = entries.reduce((mx, e) => {
    const lv = userConfig.levelFor((e.usage && e.usage.count) || 0);
    return lv > mx ? lv : mx;
  }, 0);
  const quickbarFilled = ((meta.quickbar || []).filter(Boolean)).length;
  const aliasCount = entries.filter((e) => e.alias).length;
  const hiddenCount = entries.filter((e) => e.hidden).length;
  const customIconCount = entries.filter((e) => e.iconPath).length;
  const noteCount = entries.filter((e) => e.note).length;

  return {
    totalCopies: meta.totalCopies || 0,
    streakDays: (meta.streak && meta.streak.days) || 0,
    distinct,
    maxLevel,
    quickbarFilled,
    aliasCount,
    hiddenCount,
    customIconCount,
    noteCount,
  };
}

// `name` / `desc` are i18n keys resolved via i18n/strings.js at display time.
const ACHIEVEMENTS = [
  // Usage volume
  { id: 'first_step',   icon: '👣', check: (s) => s.totalCopies >= 1 },
  { id: 'warmup',       icon: '🌱', check: (s) => s.totalCopies >= 10 },
  { id: 'centurion',    icon: '💯', check: (s) => s.totalCopies >= 100 },
  { id: 'thousand',     icon: '🏆', check: (s) => s.totalCopies >= 1000 },

  // Variety
  { id: 'collector_5',  icon: '🎒', check: (s) => s.distinct >= 5 },
  { id: 'collector_15', icon: '🔬', check: (s) => s.distinct >= 15 },

  // Streak
  { id: 'streak_3',     icon: '🔥', check: (s) => s.streakDays >= 3 },
  { id: 'streak_7',     icon: '🗓️', check: (s) => s.streakDays >= 7 },
  { id: 'streak_30',    icon: '👑', check: (s) => s.streakDays >= 30 },

  // Mastery
  { id: 'mastery_3',    icon: '⭐', check: (s) => s.maxLevel >= 3 },
  { id: 'mastery_5',    icon: '🌟', check: (s) => s.maxLevel >= 5 },

  // Customization
  { id: 'quickbar_full',icon: '🎮', check: (s) => s.quickbarFilled >= 6 },
  { id: 'alias_master', icon: '✏️', check: (s) => s.aliasCount >= 5 },
  { id: 'declutter',    icon: '🧹', check: (s) => s.hiddenCount >= 1 },
  { id: 'designer',     icon: '🎨', check: (s) => s.customIconCount >= 1 },
  { id: 'archivist',    icon: '📝', check: (s) => s.noteCount >= 5 },
].map((a) => ({ ...a, nameKey: `achv.${a.id}.name`, descKey: `achv.${a.id}.desc` }));

// Returns newly-earned achievement objects (full objects, not just ids).
// Mutates cfg.meta.achievements (caller responsible for write).
function checkAndApply(cfg) {
  if (!cfg.meta) cfg.meta = {};
  if (!Array.isArray(cfg.meta.achievements)) cfg.meta.achievements = [];
  const earned = new Set(cfg.meta.achievements);
  const stats = computeStats(cfg);
  const newly = [];
  for (const a of ACHIEVEMENTS) {
    if (!earned.has(a.id) && a.check(stats)) {
      cfg.meta.achievements.push(a.id);
      earned.add(a.id);
      newly.push(a);
    }
  }
  return { newly, stats };
}

function getStatus(cfg) {
  const earned = new Set((cfg.meta && cfg.meta.achievements) || []);
  return ACHIEVEMENTS.map((a) => ({ ...a, earned: earned.has(a.id) }));
}

module.exports = {
  ACHIEVEMENTS,
  computeStats,
  checkAndApply,
  getStatus,
};
