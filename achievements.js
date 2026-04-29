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

const ACHIEVEMENTS = [
  // Usage volume
  { id: 'first_step',   name: '첫 발걸음',     desc: '처음으로 스킬 복사',          icon: '👣', check: (s) => s.totalCopies >= 1 },
  { id: 'warmup',       name: '워밍업',        desc: '총 10회 복사',                icon: '🌱', check: (s) => s.totalCopies >= 10 },
  { id: 'centurion',    name: '백 번의 기록',  desc: '총 100회 복사',               icon: '💯', check: (s) => s.totalCopies >= 100 },
  { id: 'thousand',     name: '천부장',        desc: '총 1000회 복사',              icon: '🏆', check: (s) => s.totalCopies >= 1000 },

  // Variety
  { id: 'collector_5',  name: '컬렉터',        desc: '5종 이상 다른 스킬 사용',     icon: '🎒', check: (s) => s.distinct >= 5 },
  { id: 'collector_15', name: '연구가',        desc: '15종 이상 다른 스킬 사용',    icon: '🔬', check: (s) => s.distinct >= 15 },

  // Streak
  { id: 'streak_3',     name: '꾸준한',        desc: '3일 연속 사용',               icon: '🔥', check: (s) => s.streakDays >= 3 },
  { id: 'streak_7',     name: '개근',          desc: '7일 연속 사용',               icon: '🗓️', check: (s) => s.streakDays >= 7 },
  { id: 'streak_30',    name: '한 달 개근',    desc: '30일 연속 사용',              icon: '👑', check: (s) => s.streakDays >= 30 },

  // Mastery
  { id: 'mastery_3',    name: '숙련',          desc: '한 스킬 LV.3 달성',           icon: '⭐', check: (s) => s.maxLevel >= 3 },
  { id: 'mastery_5',    name: '마스터',        desc: '한 스킬 LV.5 달성',           icon: '🌟', check: (s) => s.maxLevel >= 5 },

  // Customization
  { id: 'quickbar_full',name: '장비왕',        desc: 'Quick Bar 6칸 모두 채움',     icon: '🎮', check: (s) => s.quickbarFilled >= 6 },
  { id: 'alias_master', name: '별칭 마스터',   desc: '5개 스킬에 별칭 부여',        icon: '✏️', check: (s) => s.aliasCount >= 5 },
  { id: 'declutter',    name: '정리정돈',      desc: '한 개 이상 스킬 숨김',        icon: '🧹', check: (s) => s.hiddenCount >= 1 },
  { id: 'designer',     name: '디자이너',      desc: '한 개 이상 커스텀 아이콘',    icon: '🎨', check: (s) => s.customIconCount >= 1 },
  { id: 'archivist',    name: '기록가',        desc: '5개 스킬에 메모 작성',        icon: '📝', check: (s) => s.noteCount >= 5 },
];

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
