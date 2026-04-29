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
  return {
    ...skill,
    label: entry.alias || skill.name,
    note: entry.note || '',
    hidden: !!entry.hidden,
    aliasOriginal: skill.name,
  };
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
};
