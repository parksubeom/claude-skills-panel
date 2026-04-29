// User customization for Claude Skills Panel.
// Stored at ~/.claude/skills-panel-config.json so it can be edited by hand
// and synced via dotfiles.

const fs = require('fs');
const path = require('path');
const os = require('os');

const CONFIG_DIR = path.join(os.homedir(), '.claude');
const CONFIG_PATH = path.join(CONFIG_DIR, 'skills-panel-config.json');
const ICONS_DIR = path.join(CONFIG_DIR, 'skills-panel-icons');

const DEFAULT = { version: 1, skills: {} };

function read() {
  try {
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed.skills) parsed.skills = {};
    return parsed;
  } catch {
    return { ...DEFAULT };
  }
}

function write(cfg) {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2) + '\n');
}

function getSkillEntry(cfg, name) {
  return (cfg.skills && cfg.skills[name]) || {};
}

function setSkillField(name, field, value) {
  const cfg = read();
  if (!cfg.skills[name]) cfg.skills[name] = {};
  if (value === '' || value === null || value === undefined) {
    delete cfg.skills[name][field];
    if (Object.keys(cfg.skills[name]).length === 0) delete cfg.skills[name];
  } else {
    cfg.skills[name][field] = value;
  }
  write(cfg);
  return cfg;
}

function applyOverrides(skill, cfg) {
  const entry = getSkillEntry(cfg, skill.name);
  const usage = entry.usage || { count: 0, lastUsed: null, firstUsed: null };
  return {
    ...skill,
    label: entry.alias || skill.name,
    note: entry.note || '',
    hidden: !!entry.hidden,
    iconPath: entry.iconPath || null,
    aliasOriginal: skill.name,
    usage,
    level: levelFor(usage.count),
  };
}

// LV.0 unused, 1-5 progressive thresholds
const LEVEL_THRESHOLDS = [0, 1, 5, 15, 50, 150];
function levelFor(count) {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (count >= LEVEL_THRESHOLDS[i]) return i;
  }
  return 0;
}

function localDateKey(d = new Date()) {
  // YYYY-MM-DD in local timezone (avoids late-night UTC shift bug)
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
function todayKey() {
  return localDateKey();
}
function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return localDateKey(d);
}

// Records a copy event. Returns { prevLevel, nextLevel, streak, totalCopies, newAchievements }.
function recordUsage(name) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (typeof cfg.meta.totalCopies !== 'number') cfg.meta.totalCopies = 0;
  if (!cfg.meta.streak) cfg.meta.streak = { days: 0, lastDate: null };
  if (!cfg.skills[name]) cfg.skills[name] = {};
  const entry = cfg.skills[name];
  if (!entry.usage) entry.usage = { count: 0, lastUsed: null, firstUsed: null };

  const prevLevel = levelFor(entry.usage.count);
  const now = new Date().toISOString();
  entry.usage.count += 1;
  entry.usage.lastUsed = now;
  if (!entry.usage.firstUsed) entry.usage.firstUsed = now;
  const nextLevel = levelFor(entry.usage.count);

  cfg.meta.totalCopies = (cfg.meta.totalCopies || 0) + 1;

  // Daily history (for weekly report)
  if (!cfg.meta.dailyHistory) cfg.meta.dailyHistory = {};
  const today = todayKey();
  cfg.meta.dailyHistory[today] = (cfg.meta.dailyHistory[today] || 0) + 1;
  // Cap history to last 60 days
  const keys = Object.keys(cfg.meta.dailyHistory).sort();
  if (keys.length > 60) {
    for (const k of keys.slice(0, keys.length - 60)) delete cfg.meta.dailyHistory[k];
  }

  // streak update
  const yesterday = yesterdayKey();
  const last = cfg.meta.streak && cfg.meta.streak.lastDate;
  if (last !== today) {
    if (last === yesterday) cfg.meta.streak.days = (cfg.meta.streak.days || 0) + 1;
    else cfg.meta.streak.days = 1;
    cfg.meta.streak.lastDate = today;
  }

  // Achievements (lazy require to avoid cycle)
  const achievements = require('./achievements');
  const { newly } = achievements.checkAndApply(cfg);

  write(cfg);
  return {
    prevLevel,
    nextLevel,
    streak: cfg.meta.streak.days,
    totalCopies: cfg.meta.totalCopies,
    newAchievements: newly,
  };
}

function getMeta() {
  const cfg = read();
  const meta = cfg.meta || {};
  if (typeof meta.totalCopies !== 'number') meta.totalCopies = 0;
  if (!meta.streak) meta.streak = { days: 0, lastDate: null };
  if (!Array.isArray(meta.quickbar)) meta.quickbar = [null, null, null, null, null, null];
  while (meta.quickbar.length < 6) meta.quickbar.push(null);
  if (meta.quickbar.length > 6) meta.quickbar = meta.quickbar.slice(0, 6);
  if (!Array.isArray(meta.achievements)) meta.achievements = [];
  if (!meta.dailyHistory) meta.dailyHistory = {};
  return meta;
}

// Compute weekly stats for the report
function getWeeklyStats() {
  const cfg = read();
  const meta = getMeta();
  const skills = cfg.skills || {};

  // Last 7 days of activity
  const days = [];
  const counts = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const k = localDateKey(d);
    days.push(k);
    counts.push(meta.dailyHistory[k] || 0);
  }
  const weekTotal = counts.reduce((a, b) => a + b, 0);

  // Most-used skill within last 7 days based on lastUsed proxy + count weight
  const recentSkills = Object.entries(skills)
    .filter(([, v]) => v.usage && v.usage.lastUsed)
    .map(([name, v]) => {
      const lastDay = (v.usage.lastUsed || '').slice(0, 10);
      const inWeek = days.includes(lastDay);
      return { name, count: v.usage.count, lastUsed: v.usage.lastUsed, inWeek };
    })
    .filter((s) => s.inWeek);
  recentSkills.sort((a, b) => b.count - a.count);

  return {
    days,
    counts,
    weekTotal,
    topSkills: recentSkills.slice(0, 5),
    streakDays: meta.streak.days,
    totalCopies: meta.totalCopies,
  };
}

function setQuickbar(slot, name) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (!Array.isArray(cfg.meta.quickbar)) cfg.meta.quickbar = [null, null, null, null, null, null];
  while (cfg.meta.quickbar.length < 6) cfg.meta.quickbar.push(null);
  if (slot < 0 || slot > 5) return cfg;
  // If name is already in another slot, clear that first (no duplicates)
  if (name) {
    cfg.meta.quickbar = cfg.meta.quickbar.map((n) => (n === name ? null : n));
  }
  cfg.meta.quickbar[slot] = name || null;
  write(cfg);
  return cfg;
}

function resolveIconPath(iconRel) {
  if (!iconRel) return null;
  // Allow absolute paths or relative to ~/.claude
  const abs = path.isAbsolute(iconRel) ? iconRel : path.join(CONFIG_DIR, iconRel);
  return fs.existsSync(abs) ? abs : null;
}

module.exports = {
  CONFIG_DIR,
  CONFIG_PATH,
  ICONS_DIR,
  read,
  write,
  setSkillField,
  applyOverrides,
  resolveIconPath,
  recordUsage,
  getMeta,
  getWeeklyStats,
  setQuickbar,
  levelFor,
  LEVEL_THRESHOLDS,
};
