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
  // Resolve effective group: custom assignment overrides auto-detected.
  const customGroups = (cfg.meta && Array.isArray(cfg.meta.groups)) ? cfg.meta.groups : [];
  const customGroupId = entry.group && customGroups.some((g) => g.id === entry.group)
    ? entry.group
    : null;
  return {
    ...skill,
    label: entry.alias || skill.name,
    note: entry.note || '',
    hidden: !!entry.hidden,
    iconPath: entry.iconPath || null,
    sparkIcon: entry.sparkIcon || null,
    aliasOriginal: skill.name,
    usage,
    level: levelFor(usage.count),
    autoGroup: skill.group,
    customGroup: customGroupId,
    group: customGroupId || skill.group,
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

// Records a copy event. Returns { prevLevel, nextLevel, streak, totalCopies, newAchievements, buddy }.
function recordUsage(name, source) {
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

  // Buddy character growth (in same cfg snapshot)
  if (!cfg.character) cfg.character = {};
  const c = cfg.character;
  if (!c.name) c.name = os.userInfo().username || 'Claude';
  if (typeof c.actions !== 'number') c.actions = 0;
  if (!c.stats) c.stats = { int: 0, dex: 0, vit: 0, lck: 0 };
  if (!c.skillStats) c.skillStats = {};
  if (!('class' in c)) c.class = null;
  if (!('classLockedAt' in c)) c.classLockedAt = null;
  const prevStage = buddyStageFor(c.actions);
  const prevClass = c.class;
  c.actions += 1;
  // Count this action toward its category, for class-decision math.
  const cat = classifySkill(name);
  c.skillStats[cat] = (c.skillStats[cat] || 0) + 1;
  if (INT_KEYWORDS.test(name)) c.stats.int += 1;
  c.stats.dex += source === 'quickbar' ? 2 : 1;
  // VIT: only on streak days where this is the first action (we just bumped streak above)
  if (cfg.meta.streak.lastDate === today && cfg.meta.streak.days > 0) {
    // approximate: bump VIT once per day — track in last-vit-date
    if (cfg.character.lastVitDate !== today) {
      c.stats.vit = (c.stats.vit || 0) + 1;
      cfg.character.lastVitDate = today;
    }
  }
  const nextStage = buddyStageFor(c.actions);

  // Class branch: when reaching LV.3 for the first time, lock in the class
  // based on which category the user has touched most.
  let branchedTo = null;
  if (nextStage >= BRANCH_AT_LEVEL && !c.class) {
    c.class = decideClass(c.skillStats);
    c.classLockedAt = now;
    branchedTo = c.class;
  }

  // Achievements (lazy require to avoid cycle)
  const achievements = require('./achievements');
  const { newly } = achievements.checkAndApply(cfg);
  // LCK: +5 per new achievement
  if (newly && newly.length) c.stats.lck = (c.stats.lck || 0) + newly.length * 5;

  write(cfg);
  return {
    prevLevel,
    nextLevel,
    streak: cfg.meta.streak.days,
    totalCopies: cfg.meta.totalCopies,
    newAchievements: newly,
    buddy: {
      prevStage,
      nextStage,
      stageName: stageNameFor(nextStage, c.class),
      class: c.class,
      branchedTo,
      prevClass,
      character: getCharacter(),
    },
  };
}

// 5-stage class-branch system (v0.29+).
// LV.1 Egg → LV.2 Hatchling (common) → LV.3-5 [class-specific].
// Class is decided once, at action 50, by max-count category in skillStats.
const BUDDY_THRESHOLDS = [0, 10, 50, 150, 500];
const STAGE_NAMES_GENERIC = ['Egg', 'Hatchling', 'Novice', 'Adept', 'Master'];
// Legacy export kept for any downstream code; remapped onto the new 5-stage system.
const BUDDY_NAMES = STAGE_NAMES_GENERIC;
const BRANCH_AT_LEVEL = 2; // LV.3 (zero-indexed = 2)

function buddyStageFor(actions) {
  for (let i = BUDDY_THRESHOLDS.length - 1; i >= 0; i--) {
    if (actions >= BUDDY_THRESHOLDS[i]) return i;
  }
  return 0;
}

// 10 buddy classes, each tied to a category of slash-command keywords.
// Order matters for tie-breaking (alphabetical = deterministic).
const BUDDY_CLASSES = [
  { id: 'codey',   role: 'Swordsman',  emoji: '🗡️' },
  { id: 'datia',   role: 'Astrologer', emoji: '🧙‍♀️' },
  { id: 'debuggo', role: 'Detective',  emoji: '🔍' },
  { id: 'docly',   role: 'Cleric',     emoji: '📜' },
  { id: 'gitto',   role: 'Ninja',      emoji: '⚔️' },
  { id: 'pdfox',   role: 'Rogue',      emoji: '🦊' },
  { id: 'sheety',  role: 'Merchant',   emoji: '📊' },
  { id: 'slidey',  role: 'Bard',       emoji: '🎤' },
  { id: 'testra',  role: 'Paladin',    emoji: '🛡️' },
  { id: 'webbie',  role: 'Wizard',     emoji: '🕸️' },
];
const BUDDY_CLASS_IDS = BUDDY_CLASSES.map((c) => c.id);

// Slash-command name → class id, by keyword substring (case-insensitive).
// First match wins, so ordering matters for overlap (e.g. "code-review" → testra
// since "review" is checked before "code"). Tune as the catalog grows.
const CATEGORY_RULES = [
  { class: 'gitto',   re: /\b(git|commit|branch|push|pull[- ]?request|pr\b|merge|rebase)/i },
  { class: 'testra',  re: /(test|spec|verify|check|review|audit)/i },
  { class: 'debuggo', re: /(debug|bug|fix|trace|stacktrace|logs?)/i },
  { class: 'docly',   re: /(doc|docs|write|markdown|readme|note)/i },
  { class: 'sheety',  re: /(xlsx|csv|spreadsheet|sheet|excel|table|tsv)/i },
  { class: 'slidey',  re: /(slide|pptx|present|pitch|keynote)/i },
  { class: 'pdfox',   re: /(pdf)/i },
  { class: 'webbie',  re: /(web|frontend|front-end|ui\b|css|react|tailwind|figma|design)/i },
  { class: 'datia',   re: /(analy[sz]e|chart|viz|visuali[sz]e|metric|dashboard|stats?)/i },
  { class: 'codey',   re: /(code|refactor|simpl|implement|build|compile)/i },
];

function classifySkill(name) {
  const s = String(name || '');
  for (const rule of CATEGORY_RULES) {
    if (rule.re.test(s)) return rule.class;
  }
  return 'codey'; // default fallback
}

function decideClass(skillStats) {
  let max = -1;
  let winner = 'codey';
  for (const cls of BUDDY_CLASS_IDS) {
    const count = (skillStats && skillStats[cls]) || 0;
    if (count > max) {
      max = count;
      winner = cls;
    }
  }
  return winner;
}

// INT growth from thinking/planning skills, DEX from quick triggers, etc.
const INT_KEYWORDS = /(brainstorm|writing-plans|writing-skills|planning|review|debug|verif|simplif|systematic)/i;

function stageNameFor(stage, classId) {
  if (stage < BRANCH_AT_LEVEL) return STAGE_NAMES_GENERIC[stage];
  if (!classId) return STAGE_NAMES_GENERIC[stage]; // pre-branch fallback
  const suffix = stage === BRANCH_AT_LEVEL ? '' : ' ' + STAGE_NAMES_GENERIC[stage];
  // Class display name comes from i18n on the webview side; here we just hand
  // back the raw class id so the renderer can localize.
  return classId + (suffix ? ' (' + suffix.trim() + ')' : '');
}

function getCharacter() {
  const cfg = read();
  const c = cfg.character || {};
  if (!c.name) c.name = os.userInfo().username || 'Claude';
  if (typeof c.actions !== 'number') c.actions = 0;
  if (!c.stats) c.stats = { int: 0, dex: 0, vit: 0, lck: 0 };
  if (!c.skillStats) c.skillStats = {};
  if (!('class' in c)) c.class = null;
  if (!('classLockedAt' in c)) c.classLockedAt = null;
  // Auto-decide class for users already past the branch threshold but missing
  // a class (migration from pre-0.29 data).
  c.stage = buddyStageFor(c.actions);
  if (c.stage >= BRANCH_AT_LEVEL && !c.class) {
    c.class = decideClass(c.skillStats);
    c.classLockedAt = new Date().toISOString();
  }
  c.stageName = STAGE_NAMES_GENERIC[c.stage];
  c.nextThreshold = BUDDY_THRESHOLDS[c.stage + 1] || null;
  c.currentThreshold = BUDDY_THRESHOLDS[c.stage];
  return c;
}

// Reset class so the next action picks again from current skillStats.
// skillStats are intentionally preserved (no penalty).
function reincarnate() {
  const cfg = read();
  if (!cfg.character) cfg.character = {};
  cfg.character.class = null;
  cfg.character.classLockedAt = null;
  write(cfg);
  return cfg;
}

function setCharacterName(name) {
  const cfg = read();
  if (!cfg.character) cfg.character = {};
  cfg.character.name = name || os.userInfo().username || 'Claude';
  write(cfg);
}

// Records a buddy action when a skill is used. Returns { prevStage, nextStage, character }.
function recordBuddyAction(skillName, source) {
  const cfg = read();
  if (!cfg.character) cfg.character = {};
  const c = cfg.character;
  if (!c.name) c.name = os.userInfo().username || 'Claude';
  if (typeof c.actions !== 'number') c.actions = 0;
  if (!c.stats) c.stats = { int: 0, dex: 0, vit: 0, lck: 0 };
  if (!c.skillStats) c.skillStats = {};
  if (!('class' in c)) c.class = null;
  if (!('classLockedAt' in c)) c.classLockedAt = null;

  const prevStage = buddyStageFor(c.actions);
  c.actions += 1;
  const cat = classifySkill(skillName);
  c.skillStats[cat] = (c.skillStats[cat] || 0) + 1;
  // INT: thinking-type skills
  if (INT_KEYWORDS.test(skillName)) c.stats.int += 1;
  // DEX: quick-bar / fast triggers
  if (source === 'quickbar') c.stats.dex += 2;
  else c.stats.dex += 1;
  // VIT: bumped daily by streak (handled separately)
  // LCK: bumped on achievements (handled separately)
  const nextStage = buddyStageFor(c.actions);
  if (nextStage >= BRANCH_AT_LEVEL && !c.class) {
    c.class = decideClass(c.skillStats);
    c.classLockedAt = new Date().toISOString();
  }
  write(cfg);
  return { prevStage, nextStage, character: getCharacter() };
}

function bumpCharacterStat(stat, amount = 1) {
  const cfg = read();
  if (!cfg.character) cfg.character = {};
  if (!cfg.character.stats) cfg.character.stats = { int: 0, dex: 0, vit: 0, lck: 0 };
  cfg.character.stats[stat] = (cfg.character.stats[stat] || 0) + amount;
  write(cfg);
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

function getLocale() {
  const cfg = read();
  return (cfg.meta && cfg.meta.locale) || null;
}

function setLocale(locale) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (locale) cfg.meta.locale = locale;
  else delete cfg.meta.locale;
  write(cfg);
  return cfg;
}

const THEMES = ['dark', 'retro', 'lcd'];
const THEME_LABELS = { dark: 'Dark', retro: 'Retro', lcd: 'LCD' };
const DEFAULT_THEME = 'dark';

function getTheme() {
  const cfg = read();
  const t = cfg.meta && cfg.meta.theme;
  return THEMES.includes(t) ? t : DEFAULT_THEME;
}

function setTheme(theme) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (THEMES.includes(theme)) cfg.meta.theme = theme;
  else delete cfg.meta.theme;
  write(cfg);
  return cfg;
}

// User-defined groups: ordered list of { id, name, emoji? }.
// Skills can be assigned to a custom group via skills[name].group = id,
// which overrides the auto-detected user/project/plugin grouping.
function getGroups() {
  const cfg = read();
  const groups = (cfg.meta && Array.isArray(cfg.meta.groups)) ? cfg.meta.groups : [];
  return groups.filter((g) => g && g.id && g.name);
}

function setGroups(groups) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  cfg.meta.groups = (Array.isArray(groups) ? groups : []).filter(
    (g) => g && typeof g.id === 'string' && typeof g.name === 'string'
  );
  write(cfg);
  return cfg;
}

function addGroup({ name, emoji }) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (!Array.isArray(cfg.meta.groups)) cfg.meta.groups = [];
  const id = 'g_' + Math.random().toString(36).slice(2, 9);
  cfg.meta.groups.push({ id, name: String(name || 'Untitled').slice(0, 40), emoji: emoji || '📁' });
  write(cfg);
  return id;
}

function renameGroup(id, name, emoji) {
  const cfg = read();
  if (!cfg.meta || !Array.isArray(cfg.meta.groups)) return cfg;
  const g = cfg.meta.groups.find((x) => x && x.id === id);
  if (g) {
    if (typeof name === 'string') g.name = name.slice(0, 40);
    if (typeof emoji === 'string') g.emoji = emoji;
  }
  write(cfg);
  return cfg;
}

function removeGroup(id) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (Array.isArray(cfg.meta.groups)) {
    cfg.meta.groups = cfg.meta.groups.filter((g) => g && g.id !== id);
  }
  // Detach any skill assigned to this group
  for (const name of Object.keys(cfg.skills || {})) {
    if (cfg.skills[name] && cfg.skills[name].group === id) {
      delete cfg.skills[name].group;
    }
  }
  write(cfg);
  return cfg;
}

function reorderGroups(orderedIds) {
  const cfg = read();
  if (!cfg.meta || !Array.isArray(cfg.meta.groups)) return cfg;
  const byId = new Map(cfg.meta.groups.map((g) => [g.id, g]));
  const next = [];
  for (const id of orderedIds) {
    if (byId.has(id)) {
      next.push(byId.get(id));
      byId.delete(id);
    }
  }
  // Append any leftovers to preserve data
  for (const g of byId.values()) next.push(g);
  cfg.meta.groups = next;
  write(cfg);
  return cfg;
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

// Swap (or move-into-empty) two Quick Bar slots in a single write.
function swapQuickbar(from, to) {
  const cfg = read();
  if (!cfg.meta) cfg.meta = {};
  if (!Array.isArray(cfg.meta.quickbar)) cfg.meta.quickbar = [null, null, null, null, null, null];
  while (cfg.meta.quickbar.length < 6) cfg.meta.quickbar.push(null);
  const fromI = Number(from);
  const toI = Number(to);
  if (!Number.isInteger(fromI) || !Number.isInteger(toI)) return cfg;
  if (fromI === toI || fromI < 0 || fromI > 5 || toI < 0 || toI > 5) return cfg;
  const tmp = cfg.meta.quickbar[fromI];
  cfg.meta.quickbar[fromI] = cfg.meta.quickbar[toI];
  cfg.meta.quickbar[toI] = tmp;
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
  swapQuickbar,
  levelFor,
  LEVEL_THRESHOLDS,
  getCharacter,
  setCharacterName,
  recordBuddyAction,
  bumpCharacterStat,
  buddyStageFor,
  BUDDY_THRESHOLDS,
  BUDDY_NAMES,
  BUDDY_CLASSES,
  BUDDY_CLASS_IDS,
  STAGE_NAMES_GENERIC,
  BRANCH_AT_LEVEL,
  classifySkill,
  decideClass,
  stageNameFor,
  reincarnate,
  getLocale,
  setLocale,
  getTheme,
  setTheme,
  THEMES,
  THEME_LABELS,
  getGroups,
  setGroups,
  addGroup,
  renameGroup,
  removeGroup,
  reorderGroups,
};
