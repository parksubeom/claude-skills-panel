// tokenUsage.js — Per-skill token accounting from Claude Code session transcripts.
//
// Source format (undocumented, observed on Claude Code v2.1.126):
//   ~/.claude/projects/<cwd-slug>/<sessionId>.jsonl
// Each line is one JSON object. Two relevant types for us:
//   • { "type":"user", "uuid":"…", "promptId":"…", "message": { "content": "…<command-name>/skillname</command-name>…" } }
//   • { "type":"assistant", "uuid":"…", "parentUuid":"…", "promptId":"…", "message": { "usage": { "input_tokens": …, "output_tokens": …, "cache_creation_input_tokens": …, "cache_read_input_tokens": … } } }
//
// We never read prompt text, tool results, or any user content beyond the
// <command-name> marker — only the usage block. The full transcript is
// owned by Claude Code; this module only treats it as a usage ledger.
//
// All accumulation is in-memory; nothing is persisted. The panel reads
// snapshots on demand. This module is a no-op when the user has the
// `meta.trackTokens` setting OFF — extension.js gates on that flag before
// even importing live data, so JSONL files are not scanned by default.

const fs = require('fs');
const path = require('path');
const os = require('os');

const PROJECTS_DIR = path.join(os.homedir(), '.claude', 'projects');
const COMMAND_RE = /<command-name>\/?([\w.\-:]+)<\/command-name>/;

// In-memory state
const perCommand = new Map();   // cmdName -> stats object
const promptToCmd = new Map();  // promptId -> cmdName
const fileOffsets = new Map();  // filepath -> last byte processed
const fileSizes = new Map();    // filepath -> size at last scan (truncation detection)
let _mostRecentCommand = null;  // Last <command-name> seen in any user line — drives the buddy yard's active fighter selection

function emptyStats() {
  return {
    input: 0,
    output: 0,
    cacheCreate: 0,
    cacheRead: 0,
    total: 0,
    sessions: 0,
    invocations: 0,
    lastSeen: null,
  };
}

function reset() {
  perCommand.clear();
  promptToCmd.clear();
  fileOffsets.clear();
  fileSizes.clear();
  _mostRecentCommand = null;
}

function getMostRecentCommand() {
  return _mostRecentCommand;
}

function listSessionFiles() {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  const out = [];
  let projects;
  try { projects = fs.readdirSync(PROJECTS_DIR); } catch { return []; }
  for (const proj of projects) {
    const projDir = path.join(PROJECTS_DIR, proj);
    let stat;
    try { stat = fs.statSync(projDir); } catch { continue; }
    if (!stat.isDirectory()) continue;
    let entries;
    try { entries = fs.readdirSync(projDir); } catch { continue; }
    for (const f of entries) {
      if (f.endsWith('.jsonl')) out.push(path.join(projDir, f));
    }
  }
  return out;
}

function processLine(line, file) {
  if (!line || line.length < 2) return;
  let obj;
  try { obj = JSON.parse(line); } catch { return; }
  if (!obj || typeof obj !== 'object') return;

  // Slash command marker — register the promptId so subsequent assistant
  // turns can be attributed back to the originating skill.
  if (obj.type === 'user' && obj.message && typeof obj.message.content === 'string') {
    const m = COMMAND_RE.exec(obj.message.content);
    if (m && obj.promptId) {
      const cmd = m[1];
      promptToCmd.set(obj.promptId, cmd);
      _mostRecentCommand = cmd;
      // Initialize bucket and bump invocation count exactly once per marker
      const stats = perCommand.get(cmd) || emptyStats();
      stats.invocations += 1;
      // Track unique sessions seen — use file path as session proxy
      stats._sessions = stats._sessions || new Set();
      stats._sessions.add(file);
      stats.sessions = stats._sessions.size;
      const ts = obj.timestamp || null;
      if (ts && (!stats.lastSeen || ts > stats.lastSeen)) stats.lastSeen = ts;
      perCommand.set(cmd, stats);
    }
    return;
  }

  // Assistant turn — if its promptId was registered, accumulate usage.
  if (obj.type === 'assistant' && obj.promptId && obj.message && obj.message.usage) {
    const cmd = promptToCmd.get(obj.promptId);
    if (!cmd) return;
    const u = obj.message.usage;
    const stats = perCommand.get(cmd) || emptyStats();
    const inp = Number(u.input_tokens) || 0;
    const out = Number(u.output_tokens) || 0;
    const cc = Number(u.cache_creation_input_tokens) || 0;
    const cr = Number(u.cache_read_input_tokens) || 0;
    stats.input += inp;
    stats.output += out;
    stats.cacheCreate += cc;
    stats.cacheRead += cr;
    stats.total += inp + out + cc + cr;
    const ts = obj.timestamp || null;
    if (ts && (!stats.lastSeen || ts > stats.lastSeen)) stats.lastSeen = ts;
    perCommand.set(cmd, stats);
  }
}

function scanFile(file) {
  let stat;
  try { stat = fs.statSync(file); } catch { return; }
  const size = stat.size;
  const lastSize = fileSizes.get(file) || 0;
  let offset = fileOffsets.get(file) || 0;

  // Truncation / rotation: if file shrank, re-read from start.
  if (size < lastSize) offset = 0;
  if (size === lastSize && offset === lastSize) return; // no new bytes

  let data;
  try {
    const fd = fs.openSync(file, 'r');
    const len = size - offset;
    const buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, offset);
    fs.closeSync(fd);
    data = buf.toString('utf8');
  } catch {
    return;
  }
  // Don't split on the trailing partial line (last newline-less chunk).
  let lastNewline = data.lastIndexOf('\n');
  if (lastNewline === -1) {
    // No complete line yet — wait for more
    fileSizes.set(file, size);
    return;
  }
  const consumable = data.slice(0, lastNewline);
  for (const line of consumable.split('\n')) {
    if (line) processLine(line, file);
  }
  fileOffsets.set(file, offset + lastNewline + 1);
  fileSizes.set(file, size);
}

function scanAll() {
  for (const f of listSessionFiles()) scanFile(f);
}

// Latest mtime across every JSONL — proxy for "Claude Code is doing
// something right now". Doesn't read file content, only metadata.
function latestMtimeMs() {
  let max = 0;
  for (const f of listSessionFiles()) {
    try {
      const m = fs.statSync(f).mtimeMs;
      if (m > max) max = m;
    } catch {}
  }
  return max;
}

// Activity state machine driven entirely by JSONL mtime. The caller polls
// this every few seconds; we transition between idle / busy / completed.
//   - busy:      a JSONL was modified within `busyWindowMs`
//   - completed: previous tick was busy, this tick isn't (one-shot)
//   - idle:      otherwise
// `state` carries `latestMtimeMs` so callers can debounce repeated
// "completed" transitions during very chatty sessions.
let _activityPrev = 'idle';
let _activityLastBusyMtime = 0;
function getActivityState(busyWindowMs) {
  const window = typeof busyWindowMs === 'number' ? busyWindowMs : 8000;
  const latest = latestMtimeMs();
  const now = Date.now();
  const isBusyNow = latest > 0 && (now - latest) < window;
  let state;
  if (isBusyNow) {
    state = 'busy';
    _activityLastBusyMtime = latest;
  } else if (_activityPrev === 'busy') {
    state = 'completed';
  } else {
    state = 'idle';
  }
  _activityPrev = isBusyNow ? 'busy' : 'idle';
  return { state, latestMtimeMs: latest, lastBusyMtime: _activityLastBusyMtime };
}
function resetActivity() {
  _activityPrev = 'idle';
  _activityLastBusyMtime = 0;
}

function getStatsFor(commandName) {
  const s = perCommand.get(commandName);
  if (!s) return null;
  // Strip private set before returning
  // eslint-disable-next-line no-unused-vars
  const { _sessions, ...pub } = s;
  return pub;
}

// All commands sorted by total tokens desc — used by Most tokens sort and
// by the weekly report's TOP 5 section.
function topByTokens(limit) {
  const arr = [];
  for (const [name, s] of perCommand) {
    if (s.total > 0) arr.push({ name, ...s });
  }
  arr.sort((a, b) => b.total - a.total);
  return typeof limit === 'number' ? arr.slice(0, limit) : arr;
}

function formatShort(n) {
  if (!n || n < 0) return '0';
  if (n >= 1e9) return (n / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
  return String(Math.round(n));
}

module.exports = {
  PROJECTS_DIR,
  scanAll,
  scanFile,
  reset,
  getStatsFor,
  topByTokens,
  formatShort,
  listSessionFiles,
  latestMtimeMs,
  getActivityState,
  resetActivity,
  getMostRecentCommand,
};
