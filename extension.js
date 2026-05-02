const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pickIcon } = require('./iconMap');
const userConfig = require('./userConfig');
const achievements = require('./achievements');
const i18n = require('./i18n/strings');

// OS-level paste keystroke. Cmd+V (macOS) / Ctrl+V (Windows / Linux).
// Optionally follows with Enter for fully autonomous send.
//   - macOS: uses osascript (System Events)   → needs Accessibility permission
//   - Windows: uses PowerShell SendKeys       → no permission prompt
//   - Linux: uses xdotool if available        → must install xdotool
function osKeystroke(withEnter) {
  const cp = require('child_process');
  if (process.platform === 'darwin') {
    const script = withEnter
      ? `tell application "System Events" to keystroke "v" using command down
         delay 0.06
         tell application "System Events" to keystroke return`
      : `tell application "System Events" to keystroke "v" using command down`;
    try {
      cp.execFile('osascript', ['-e', script], { timeout: 2000 }, () => {});
      return true;
    } catch { return false; }
  }
  if (process.platform === 'win32') {
    const cmd = withEnter
      ? "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v'); Start-Sleep -Milliseconds 60; [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')"
      : "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')";
    try {
      cp.execFile('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', cmd], { timeout: 3000 }, () => {});
      return true;
    } catch { return false; }
  }
  if (process.platform === 'linux') {
    // xdotool: not preinstalled on most distros — installs via apt/dnf/pacman
    try {
      cp.execFile('xdotool', ['key', 'ctrl+v'], { timeout: 1500 }, () => {});
      if (withEnter) {
        setTimeout(() => {
          try { cp.execFile('xdotool', ['key', 'Return'], { timeout: 1500 }, () => {}); } catch {}
        }, 60);
      }
      return true;
    } catch { return false; }
  }
  return false;
}

async function tryFocus() {
  const cmds = await vscode.commands.getCommands(true);
  const focusCmd = cmds.find((c) => c === 'claude-vscode.focus' || c === 'claude-code.focus');
  if (!focusCmd) return false;
  try {
    await vscode.commands.executeCommand(focusCmd);
    await new Promise((r) => setTimeout(r, 120));
    return true;
  } catch {
    return false;
  }
}

// Dispatch slash skill execution.
//   paste    → clipboard only (caller already wrote) — user pastes manually
//   auto     → focus + OS keystroke Cmd/Ctrl+V + Enter (fully autonomous)
//   terminal → send to active terminal with newline
async function dispatchExec(name, mode) {
  if (!mode || mode === 'paste' || mode === 'off') return;
  const text = '/' + name;
  if (mode === 'auto') {
    await tryFocus();
    await new Promise((r) => setTimeout(r, 60));
    osKeystroke(true);
    return;
  }
  if (mode === 'terminal') {
    let term = vscode.window.activeTerminal;
    if (!term) {
      const named = vscode.window.terminals.find((t) => /claude/i.test(t.name));
      term = named || vscode.window.terminals[0];
    }
    if (!term) term = vscode.window.createTerminal('Claude');
    term.show(true);
    term.sendText(text, true);
    return;
  }
}

let PIXEL_MANIFEST = {};
let PIXEL_DIR = null;
function loadPixelManifest(extPath) {
  PIXEL_DIR = path.join(extPath, 'assets', 'pixel-icons');
  try {
    PIXEL_MANIFEST = JSON.parse(fs.readFileSync(path.join(PIXEL_DIR, 'manifest.json'), 'utf8'));
  } catch {
    PIXEL_MANIFEST = {};
  }
}

function parseFrontmatter(text) {
  const match = text.match(/^---\s*\n([\s\S]*?)\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split('\n')) {
    const m = line.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

function walkSkills(rootDir, group, seen, extra) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;
  const stack = [rootDir];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) {
        stack.push(full);
        continue;
      }
      // SKILL.md (skill format)
      if (ent.name === 'SKILL.md') {
        try {
          const text = fs.readFileSync(full, 'utf8');
          const fm = parseFrontmatter(text);
          if (fm.name && !seen.has(fm.name)) {
            seen.add(fm.name);
            results.push({
              group,
              kind: 'skill',
              name: fm.name,
              description: fm.description || '',
              iconOverride: fm.icon || null,
              file: full,
              ...(extra || {}),
            });
          }
        } catch {}
        continue;
      }
      // commands/<name>.md (slash-command format) — only when parent dir is "commands"
      if (
        ent.name.endsWith('.md') &&
        path.basename(dir) === 'commands' &&
        ent.name !== 'README.md'
      ) {
        try {
          const text = fs.readFileSync(full, 'utf8');
          const fm = parseFrontmatter(text);
          const name = ent.name.replace(/\.md$/, '');
          if (!seen.has(name)) {
            seen.add(name);
            results.push({
              group,
              kind: 'command',
              name,
              description: fm.description || '',
              iconOverride: fm.icon || null,
              file: full,
              ...(extra || {}),
            });
          }
        } catch {}
      }
    }
  }
  return results;
}

// Discover installed Claude Code plugins from ~/.claude/plugins/cache/.
// Returns an array of { dir, group, plugin, marketplace } sources, one per
// installed plugin version. Falls back to a single coarse source if the
// expected layout isn't present (e.g. legacy installs).
function discoverPluginSources(home) {
  const cacheRoot = path.join(home, '.claude', 'plugins', 'cache');
  if (!fs.existsSync(cacheRoot)) return [];
  const sources = [];
  let foundLayout = false;
  let marketplaces;
  try {
    marketplaces = fs.readdirSync(cacheRoot, { withFileTypes: true });
  } catch {
    return [];
  }
  for (const m of marketplaces) {
    if (!m.isDirectory()) continue;
    const mDir = path.join(cacheRoot, m.name);
    let plugins;
    try {
      plugins = fs.readdirSync(mDir, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const p of plugins) {
      if (!p.isDirectory()) continue;
      const pDir = path.join(mDir, p.name);
      let versions;
      try {
        versions = fs.readdirSync(pDir, { withFileTypes: true });
      } catch {
        continue;
      }
      // Only keep the most recently mtime'd version dir to avoid duplicates
      const versionDirs = versions
        .filter((v) => v.isDirectory())
        .map((v) => {
          const full = path.join(pDir, v.name);
          let mtime = 0;
          try { mtime = fs.statSync(full).mtimeMs; } catch {}
          return { name: v.name, full, mtime };
        })
        .sort((a, b) => b.mtime - a.mtime);
      if (!versionDirs.length) continue;
      foundLayout = true;
      const latest = versionDirs[0];
      sources.push({
        dir: latest.full,
        group: 'plugin',
        plugin: p.name,
        marketplace: m.name,
      });
    }
  }
  // Fallback: if directory exists but layout looks unfamiliar, scan it whole
  if (!foundLayout) {
    sources.push({ dir: cacheRoot, group: 'plugin' });
  }
  return sources;
}

function loadAllSkills() {
  const home = os.homedir();
  const sources = [
    // User-level skills + commands
    { dir: path.join(home, '.claude', 'skills'), group: 'user' },
    { dir: path.join(home, '.claude', 'commands'), group: 'user' },
  ];
  const ws = vscode.workspace.workspaceFolders;
  if (ws && ws[0]) {
    sources.push({ dir: path.join(ws[0].uri.fsPath, '.claude', 'skills'), group: 'project' });
    sources.push({ dir: path.join(ws[0].uri.fsPath, '.claude', 'commands'), group: 'project' });
  }
  // All installed plugins (covers superpowers, code-review, frontend-design, etc.)
  sources.push(...discoverPluginSources(home));

  const seen = new Set();
  const all = [];
  for (const s of sources) {
    const extra = {};
    if (s.plugin) extra.plugin = s.plugin;
    if (s.marketplace) extra.marketplace = s.marketplace;
    all.push(...walkSkills(s.dir, s.group, seen, extra));
  }
  all.sort((a, b) => {
    const order = { user: 0, project: 1, plugin: 2 };
    if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
    if (a.group === 'plugin' && a.plugin !== b.plugin) {
      return String(a.plugin || '').localeCompare(String(b.plugin || ''));
    }
    return a.name.localeCompare(b.name);
  });
  return all;
}

// `label` is an i18n key; sub-text is path-like and stays as-is across locales.
const GROUP_LABELS = {
  user: { labelKey: 'group.user.label', sub: '~/.claude/skills', emoji: '📁' },
  project: { labelKey: 'group.project.label', sub: '.claude/skills', emoji: '📂' },
  plugin: { labelKey: 'group.plugin.label', sub: '~/.claude/plugins', emoji: '🧩' },
};

// Distinct count of plugins in a list of skills (for group sub-text).
function pluginCount(skills) {
  const set = new Set();
  for (const s of skills) if (s.plugin) set.add(s.plugin);
  return set.size;
}

// Read installed_plugins.json into a Set of "name@marketplace" keys for
// quick "is this plugin installed?" lookups in the marketplace browser.
function loadInstalledPluginSet(home) {
  const f = path.join(home, '.claude', 'plugins', 'installed_plugins.json');
  const out = new Set();
  if (!fs.existsSync(f)) return out;
  try {
    const d = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const k of Object.keys(d.plugins || {})) out.add(k);
  } catch {}
  return out;
}

// Walk every configured marketplace under ~/.claude/plugins/marketplaces/
// and aggregate every plugin entry into a flat list, annotated with installed state.
function loadMarketplaceCatalog() {
  const home = os.homedir();
  const installed = loadInstalledPluginSet(home);
  const root = path.join(home, '.claude', 'plugins', 'marketplaces');
  const result = { marketplaces: [], plugins: [] };
  if (!fs.existsSync(root)) return result;
  let dirs;
  try { dirs = fs.readdirSync(root, { withFileTypes: true }); }
  catch { return result; }
  for (const d of dirs) {
    if (!d.isDirectory()) continue;
    const manifest = path.join(root, d.name, '.claude-plugin', 'marketplace.json');
    if (!fs.existsSync(manifest)) continue;
    let m;
    try { m = JSON.parse(fs.readFileSync(manifest, 'utf8')); }
    catch { continue; }
    result.marketplaces.push({
      id: d.name,
      name: m.name || d.name,
      description: m.description || '',
      owner: (m.owner && m.owner.name) || '',
      pluginCount: Array.isArray(m.plugins) ? m.plugins.length : 0,
    });
    if (!Array.isArray(m.plugins)) continue;
    for (const p of m.plugins) {
      if (!p || !p.name) continue;
      const key = `${p.name}@${d.name}`;
      result.plugins.push({
        marketplace: d.name,
        name: p.name,
        description: p.description || '',
        category: p.category || 'other',
        author: (p.author && p.author.name) || '',
        homepage: p.homepage || '',
        installed: installed.has(key),
      });
    }
  }
  return result;
}

function buildWeeklyMarkdown(weekly) {
  const today = new Date().toISOString().slice(0, 10);
  const lines = [];
  lines.push('# Claude Skills Panel — Weekly Report');
  lines.push(`_Generated ${today}_`);
  lines.push('');
  lines.push('## Summary');
  lines.push(`- **This week**: ${weekly.weekTotal}×`);
  lines.push(`- **Streak**: ${weekly.streakDays} days`);
  lines.push(`- **All-time total**: ${weekly.totalCopies}×`);
  lines.push('');
  lines.push('## Last 7 days');
  lines.push('| Date | Count |');
  lines.push('|---|---|');
  for (let i = 0; i < weekly.days.length; i++) {
    lines.push(`| ${weekly.days[i]} | ${weekly.counts[i]} |`);
  }
  lines.push('');
  if (weekly.topSkills && weekly.topSkills.length) {
    lines.push("## Top 5 this week");
    weekly.topSkills.forEach((top, i) => {
      lines.push(`${i + 1}. **${top.label}** — ${top.count}×`);
    });
  } else {
    lines.push('_No activity this week yet._');
  }
  lines.push('');
  return lines.join('\n');
}

const escapeHtml = (s) =>
  String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function renderStars(level) {
  const filled = '★'.repeat(level);
  const empty = '☆'.repeat(5 - level);
  return `<span class="stars lv${level}">${filled}${empty}</span>`;
}

function renderHtml(webview, skills) {
  const cfg = userConfig.read();
  const meta = userConfig.getMeta();
  const locale = i18n.resolveLocale((cfg.meta && cfg.meta.locale) || null, vscode.env.language);
  const t = i18n.tFor(locale);
  const theme = userConfig.getTheme();
  const customGroups = userConfig.getGroups();
  const enriched = skills.map((s) => userConfig.applyOverrides(s, cfg));

  const grouped = {};
  for (const s of enriched) {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  }
  // Custom groups render first (in user-defined order), then auto groups.
  const customGroupIds = customGroups.map((g) => g.id);
  const order = [...customGroupIds, 'user', 'project', 'plugin'];
  const customGroupById = Object.fromEntries(customGroups.map((g) => [g.id, g]));

  // Recently used: top 6 by lastUsed (excludes hidden)
  const recents = enriched
    .filter((s) => !s.hidden && s.usage.lastUsed)
    .sort((a, b) => new Date(b.usage.lastUsed) - new Date(a.usage.lastUsed))
    .slice(0, 6);

  // Quick bar: 6 slots, each holds a skill name or null
  const skillByName = {};
  for (const s of enriched) skillByName[s.aliasOriginal] = s;
  const quickbar = (meta.quickbar || []).map((name) => (name && skillByName[name]) || null);

  // Achievements + weekly stats
  const achvStatus = achievements.getStatus(cfg);
  const weekly = userConfig.getWeeklyStats();

  // Buddy character
  const character = userConfig.getCharacter();
  const buddyImg = (() => {
    if (!PIXEL_DIR) return null;
    // Every level uses the class sprite (v0.35+). Brand-new users with no
    // recorded actions yet have no class; they see the default 'codey' until
    // their first slash-command click locks in their actual class.
    const cls = character.class || 'codey';
    const abs = path.join(PIXEL_DIR, 'buddy', 'class', `${cls}.png`);
    if (fs.existsSync(abs)) return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
    return null;
  })();
  const buddyProgress = character.nextThreshold
    ? Math.round(((character.actions - character.currentThreshold) / (character.nextThreshold - character.currentThreshold)) * 100)
    : 100;
  // Annotate top skills with their display label
  weekly.topSkills = weekly.topSkills.map((t) => {
    const s = skillByName[t.name];
    return { ...t, label: (s && s.label) || t.name };
  });

  const pixelUriFor = (name) => {
    const file = PIXEL_MANIFEST[name];
    if (!file || !PIXEL_DIR) return null;
    const abs = path.join(PIXEL_DIR, file);
    if (!fs.existsSync(abs)) return null;
    return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
  };

  const defaultIconUri = (() => {
    if (!PIXEL_DIR) return null;
    const abs = path.join(PIXEL_DIR, '_default.png');
    if (!fs.existsSync(abs)) return null;
    return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
  })();

  const userIconUriFor = (skill) => {
    const cfgEntry = (cfg.skills && cfg.skills[skill.name]) || {};
    // 1. Custom upload
    const abs = userConfig.resolveIconPath(cfgEntry.iconPath);
    if (abs) return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
    // 2. Spark preset chosen by user
    if (cfgEntry.sparkIcon && PIXEL_DIR) {
      const sparkAbs = path.join(PIXEL_DIR, 'spark', `${cfgEntry.sparkIcon}.png`);
      if (fs.existsSync(sparkAbs)) return webview.asWebviewUri(vscode.Uri.file(sparkAbs)).toString();
    }
    return null;
  };

  // Build spark preset list for modal
  const sparkPresets = PIXEL_DIR
    ? fs.readdirSync(path.join(PIXEL_DIR, 'spark')).filter(f => f.endsWith('.png'))
        .map(f => {
          const name = f.replace('.png', '');
          const uri = webview.asWebviewUri(vscode.Uri.file(path.join(PIXEL_DIR, 'spark', f))).toString();
          return { name, uri };
        })
    : [];
  const sparkPresetsJson = escapeHtml(JSON.stringify(sparkPresets));

  const sections = order
    .filter((g) => grouped[g] && grouped[g].length)
    .map((g) => {
      const isCustom = !!customGroupById[g];
      const meta = isCustom
        ? { labelKey: null, sub: null, emoji: customGroupById[g].emoji || '📁', custom: true, name: customGroupById[g].name, id: g }
        : GROUP_LABELS[g];
      const visible = grouped[g].filter((s) => !s.hidden);
      if (!visible.length) return '';
      const cards = visible
        .map((s) => {
          const userUri = userIconUriFor(s);
          const pngUri = userUri || pixelUriFor(s.name) || defaultIconUri;
          const iconHtml = pngUri
            ? `<img class="skill-icon-img${userUri ? ' user-icon' : ''}" src="${pngUri}" alt="${escapeHtml(s.name)}" />`
            : `<div class="skill-icon">${pickIcon(s)}</div>`;
          const label = escapeHtml(s.label);
          const original = escapeHtml(s.aliasOriginal);
          const desc = escapeHtml(s.note || s.description);
          const aliased = s.label !== s.aliasOriginal;
          const kindBadge = s.kind === 'command' ? '<span class="kind-badge cmd">cmd</span>' : '';
          const starsHtml = s.level > 0 ? renderStars(s.level) : '<span class="stars lv0">☆☆☆☆☆</span>';
          const lvBadge = s.level > 0 ? `<span class="lv-badge lv${s.level}">LV.${s.level}</span>` : '';
          const sourceLine = s.plugin
            ? `<div class="hover-source">🧩 ${escapeHtml(s.plugin)}${s.marketplace ? ` <span class="hover-marketplace">@${escapeHtml(s.marketplace)}</span>` : ''}</div>`
            : '';
          return `
            <button class="skill"
              data-name="${original}"
              data-file="${escapeHtml(s.file)}"
              data-alias="${escapeHtml(s.label)}"
              data-note="${escapeHtml(s.note)}"
              data-hidden="${s.hidden ? '1' : '0'}"
              data-icon-uri="${escapeHtml(userIconUriFor(s) || '')}"
              data-spark-icon="${escapeHtml(s.sparkIcon || '')}"
              data-count="${s.usage.count}"
              data-last="${s.usage.lastUsed || ''}"
              data-level="${s.level}"
              data-plugin="${escapeHtml(s.plugin || '')}"
              data-marketplace="${escapeHtml(s.marketplace || '')}"
              data-group="${escapeHtml(s.customGroup || '')}">
              ${kindBadge}
              ${lvBadge}
              <span class="edit-btn" title="${t('card.edit')}">✎</span>
              ${iconHtml}
              <div class="skill-name">${label}</div>
              ${aliased ? `<div class="skill-original">/${original}</div>` : ''}
              ${starsHtml}
              <div class="hover-card">
                <div class="hover-name">${label}${aliased ? ` <span class="hover-alias">/${original}</span>` : ''}</div>
                <div class="hover-desc">${desc || `<i>${t('card.descEmpty')}</i>`}</div>
                ${sourceLine}
                <div class="hover-meta">
                  ${s.usage.count ? t('card.usage', { count: s.usage.count, level: s.level }) : `<i>${t('card.notUsed')}</i>`}
                </div>
                <div class="hover-hint">${t('card.copyHint', { name: original })}</div>
              </div>
            </button>`;
        })
        .join('');
      const heading = isCustom
        ? escapeHtml(meta.name)
        : t(meta.labelKey);
      const subText = isCustom
        ? t('group.custom.sub')
        : (g === 'plugin' && pluginCount(grouped[g])
            ? t('group.plugin.sub', { plugins: pluginCount(grouped[g]) })
            : meta.sub);
      const editBtn = isCustom
        ? `<button class="group-edit-btn" data-group-id="${escapeHtml(g)}" title="${t('group.edit')}">✎</button>`
        : '';
      return `
        <section class="group${isCustom ? ' custom-group' : ''}" data-group-id="${escapeHtml(g)}">
          <header>
            <span class="group-icon">${meta.emoji}</span>
            <h3>${heading}</h3>
            <span class="sub">(${subText} · ${visible.length}${visible.length !== grouped[g].length ? `/${grouped[g].length}` : ''})</span>
            ${editBtn}
            <span class="group-line"></span>
          </header>
          <div class="grid">${cards}</div>
        </section>`;
    })
    .join('');

  // Recently used section (pinned at top)
  const renderCardCompact = (s) => {
    const userUri = userIconUriFor(s);
    const pngUri = userUri || pixelUriFor(s.name) || defaultIconUri;
    const iconHtml = pngUri
      ? `<img class="skill-icon-img${userUri ? ' user-icon' : ''}" src="${pngUri}" alt="${escapeHtml(s.name)}" />`
      : `<div class="skill-icon">${pickIcon(s)}</div>`;
    const label = escapeHtml(s.label);
    const original = escapeHtml(s.aliasOriginal);
    const desc = escapeHtml(s.note || s.description);
    const aliased = s.label !== s.aliasOriginal;
    const lvBadge = s.level > 0 ? `<span class="lv-badge lv${s.level}">LV.${s.level}</span>` : '';
    const kindBadge = s.kind === 'command' ? '<span class="kind-badge cmd">cmd</span>' : '';
    return `
      <button class="skill"
        data-name="${original}"
        data-file="${escapeHtml(s.file)}"
        data-alias="${escapeHtml(s.label)}"
        data-note="${escapeHtml(s.note)}"
        data-hidden="0"
        data-icon-uri="${escapeHtml(userIconUriFor(s) || '')}"
        data-spark-icon="${escapeHtml(s.sparkIcon || '')}"
        data-count="${s.usage.count}"
        data-last="${s.usage.lastUsed || ''}"
        data-level="${s.level}">
        ${kindBadge}
        ${lvBadge}
        <span class="edit-btn" title="${t('card.edit')}">✎</span>
        ${iconHtml}
        <div class="skill-name">${label}</div>
        ${s.level > 0 ? renderStars(s.level) : '<span class="stars lv0">☆☆☆☆☆</span>'}
        <div class="hover-card">
          <div class="hover-name">${label}${aliased ? ` <span class="hover-alias">/${original}</span>` : ''}</div>
          <div class="hover-desc">${desc || `<i>${t('card.descEmpty')}</i>`}</div>
          <div class="hover-meta">${t('card.usage', { count: s.usage.count, level: s.level })}</div>
          <div class="hover-hint">${t('card.copyHint', { name: original })}</div>
        </div>
      </button>`;
  };
  // Slot i unlocked when character.stage >= i (slot 0 always unlocked)
  const unlockedSlots = Math.max(1, character.stage + 1);
  const quickbarHtml = `
    <section class="quickbar-section" id="quickbar-section">
      <header>
        <h3>Quick Bar</h3>
        <span class="sub">${t('quickbar.unlockHint', { unlocked: unlockedSlots })}</span>
        <span class="group-line"></span>
      </header>
      <div class="quickbar" id="quickbar">
        ${quickbar.map((s, i) => {
          const key = i + 1;
          const locked = i >= unlockedSlots;
          if (locked) {
            const stageNeed = t('stage.' + i + '.name');
            return `<div class="qslot locked" data-slot="${i}" data-key="${key}" title="${t('quickbar.locked', { stage: stageNeed })}">
              <span class="qslot-key">${key}</span>
              <span class="qslot-lock">🔒</span>
            </div>`;
          }
          if (!s) {
            return `<div class="qslot empty" data-slot="${i}" data-key="${key}">
              <span class="qslot-key">${key}</span>
              <span class="qslot-empty-label">+</span>
            </div>`;
          }
          const userUri = userIconUriFor(s);
          const pngUri = userUri || pixelUriFor(s.aliasOriginal) || defaultIconUri;
          const iconHtml = pngUri
            ? `<img class="skill-icon-img${userUri ? ' user-icon' : ''}" src="${pngUri}" alt="${escapeHtml(s.aliasOriginal)}" />`
            : `<div class="skill-icon">${pickIcon(s)}</div>`;
          return `<button class="qslot filled"
              draggable="true"
              data-slot="${i}"
              data-key="${key}"
              data-name="${escapeHtml(s.aliasOriginal)}"
              data-file="${escapeHtml(s.file)}"
              title="/${escapeHtml(s.aliasOriginal)} — Key ${key}">
            <span class="qslot-key">${key}</span>
            ${iconHtml}
            <span class="qslot-label">${escapeHtml(s.label)}</span>
          </button>`;
        }).join('')}
      </div>
    </section>`;

  const recentSection = recents.length
    ? `<section class="group recent-group">
        <header>
          <span class="group-icon">⏱</span>
          <h3>${t('section.recent')}</h3>
          <span class="sub">(top ${recents.length})</span>
          <span class="group-line"></span>
        </header>
        <div class="grid">${recents.map(renderCardCompact).join('')}</div>
      </section>`
    : '';

  // Hidden skills section (only visible in edit mode)
  const hiddenSkills = enriched.filter((s) => s.hidden);
  const hiddenSection = hiddenSkills.length
    ? `<section class="group hidden-group">
        <header>
          <span class="group-icon">👻</span>
          <h3>${t('section.hidden')}</h3>
          <span class="sub">(${hiddenSkills.length})</span>
          <span class="group-line"></span>
        </header>
        <div class="grid">${hiddenSkills
          .map((s) => {
            const userUri = userIconUriFor(s);
            const pngUri = userUri || pixelUriFor(s.name) || defaultIconUri;
            const iconHtml = pngUri
              ? `<img class="skill-icon-img${userUri ? ' user-icon' : ''}" src="${pngUri}" alt="${escapeHtml(s.name)}" />`
              : `<div class="skill-icon">${pickIcon(s)}</div>`;
            return `
              <button class="skill ghost"
                data-name="${escapeHtml(s.aliasOriginal)}"
                data-file="${escapeHtml(s.file)}"
                data-alias="${escapeHtml(s.label)}"
                data-note="${escapeHtml(s.note)}"
                data-hidden="1">
                <span class="edit-btn" title="${t('card.edit')}">✎</span>
                ${iconHtml}
                <div class="skill-name">${escapeHtml(s.label)}</div>
              </button>`;
          })
          .join('')}</div>
      </section>`
    : '';

  const csp = webview.cspSource;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src ${csp} https: data:; style-src ${csp} 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com data:; script-src 'unsafe-inline'; connect-src 'none';" />
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&family=DotGothic16&display=swap" rel="stylesheet" />
<style>
  :root, body[data-theme="dark"] {
    --bg: #0e1018;
    --bg-2: #161a26;
    --fg: #e4e7ed;
    --muted: #8a93a6;
    --frame: #5a6273;
    --frame-strong: #2c3140;
    --tile-bg: #1f2533;
    --tile-bg-2: #161a26;
    --hover: rgba(125, 211, 252, 0.08);
    --accent: #7dd3fc;
    --accent-2: #f59e0b;
    --good: #22c55e;
    --bad: #ef4444;
    --magenta: #c084fc;
    --dot-grid: rgba(125, 211, 252, 0.06);
    --vignette: rgba(0, 0, 0, 0.5);
  }
  body[data-theme="retro"] {
    --bg: #1a0f08;
    --bg-2: #2a1810;
    --fg: #ffb454;
    --muted: #8a6939;
    --frame: #8b5a2b;
    --frame-strong: #4a2c14;
    --tile-bg: #2e1b0f;
    --tile-bg-2: #1f1308;
    --hover: rgba(255, 180, 84, 0.10);
    --accent: #ffb454;
    --accent-2: #ffe066;
    --good: #d4a017;
    --bad: #d4421c;
    --magenta: #d68c4f;
    --dot-grid: rgba(255, 180, 84, 0.07);
    --vignette: rgba(0, 0, 0, 0.65);
  }
  body[data-theme="lcd"] {
    --bg: #0f380f;
    --bg-2: #306230;
    --fg: #9bbc0f;
    --muted: #467246;
    --frame: #467246;
    --frame-strong: #1a3a1a;
    --tile-bg: #1c4a1c;
    --tile-bg-2: #133513;
    --hover: rgba(155, 188, 15, 0.10);
    --accent: #9bbc0f;
    --accent-2: #c8d83c;
    --good: #9bbc0f;
    --bad: #b04018;
    --magenta: #6f9420;
    --dot-grid: rgba(155, 188, 15, 0.08);
    --vignette: rgba(0, 0, 0, 0.45);
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 14px;
    font-family: 'DotGothic16', 'Press Start 2P', 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
    color: var(--fg);
    background:
      /* vignette */
      radial-gradient(ellipse at center, transparent 0%, transparent 60%, var(--vignette) 100%),
      /* dot grid */
      radial-gradient(circle, var(--dot-grid) 1px, transparent 1px) 0 0/16px 16px,
      var(--bg);
    background-attachment: fixed;
    font-size: 12px;
    image-rendering: pixelated;
    -webkit-font-smoothing: none;
    font-smoothing: never;
    text-rendering: geometricPrecision;
    overflow-x: hidden;
    position: relative;
  }
  /* CRT scanlines (subtle) */
  body::before {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 999;
    background: repeating-linear-gradient(
      to bottom,
      transparent 0px,
      transparent 2px,
      rgba(0, 0, 0, 0.18) 3px,
      rgba(0, 0, 0, 0.18) 3px
    );
    opacity: 0.6;
    mix-blend-mode: multiply;
  }
  body.no-scanlines::before { display: none; }
  /* CRT corner curvature */
  body::after {
    content: '';
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 998;
    background: radial-gradient(ellipse at center, transparent 70%, rgba(0,0,0,0.35) 100%);
  }
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    align-items: center;
    margin-bottom: 16px;
    padding: 4px 8px;
    border: 3px solid var(--accent);
    border-radius: 0;
    background: var(--tile-bg-2);
    box-shadow:
      inset 0 0 0 1px #000,
      0 0 0 1px var(--frame-strong),
      0 4px 0 0 rgba(0, 0, 0, 0.4);
    clip-path: polygon(
      0 6px, 6px 0,
      calc(100% - 6px) 0, 100% 6px,
      100% calc(100% - 6px), calc(100% - 6px) 100%,
      6px 100%, 0 calc(100% - 6px)
    );
  }
  .sound-toggle, .scanlines-toggle {
    all: unset;
    cursor: pointer;
    width: 24px; height: 24px;
    border: 2px solid var(--frame);
    background: var(--tile-bg);
    color: var(--accent);
    font-size: 12px;
    text-align: center;
    line-height: 20px;
    transition: all 0.1s;
    flex-shrink: 0;
  }
  .sound-toggle:hover, .scanlines-toggle:hover {
    border-color: var(--accent-2);
    color: var(--accent-2);
  }
  .sound-toggle.off, .scanlines-toggle.off {
    color: var(--muted);
    border-color: var(--frame-strong);
  }
  .toolbar::before { content: '🔍'; font-size: 14px; padding-left: 2px; }
  .toolbar-search {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 999 1 160px;
    min-width: 0;
  }
  .toolbar-buttons {
    display: flex;
    align-items: center;
    gap: 6px;
    flex: 0 1 auto;
    flex-wrap: wrap;
  }
  .bracket-l, .bracket-r { color: var(--accent); font-weight: 700; user-select: none; }
  .search {
    flex: 1;
    padding: 6px 4px;
    background: transparent;
    color: var(--vscode-input-foreground);
    border: none;
    outline: none;
    font-size: 12px;
    font-family: inherit;
  }
  .search::placeholder { color: var(--muted); letter-spacing: 1px; }
  .group { margin-bottom: 18px; }
  .group header {
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .group .group-icon { font-size: 16px; }
  .group h3 {
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 1px;
    color: var(--accent);
    text-shadow: 0 0 6px rgba(125, 211, 252, 0.4);
  }
  .group .sub { color: var(--muted); font-size: 11px; }
  .group .group-line {
    flex: 1; height: 1px;
    background: linear-gradient(to right, var(--frame) 0%, var(--frame) 70%, transparent 100%);
    margin-left: 4px;
  }
  .hidden-group { opacity: 0.6; }
  .grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(86px, 1fr));
    gap: 8px;
  }
  /* card entrance animation */
  @keyframes card-in {
    0% { opacity: 0; transform: translateY(8px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  @keyframes shake {
    0%, 100% { transform: translate(0, 0); }
    20% { transform: translate(-2px, 1px); }
    40% { transform: translate(2px, -1px); }
    60% { transform: translate(-1px, 2px); }
    80% { transform: translate(1px, -2px); }
  }
  @keyframes sparkle {
    0% { opacity: 0; transform: scale(0); }
    50% { opacity: 1; transform: scale(1); }
    100% { opacity: 0; transform: scale(0.5); }
  }
  /* Click ripple — expanding pixel ring */
  @keyframes ripple {
    0% { transform: translate(-50%, -50%) scale(0.3); opacity: 0.7; }
    100% { transform: translate(-50%, -50%) scale(2.2); opacity: 0; }
  }
  .ripple {
    position: absolute;
    width: 60px; height: 60px;
    border: 2px solid var(--accent);
    border-radius: 0;
    pointer-events: none;
    animation: ripple 0.5s ease-out forwards;
    z-index: 6;
    clip-path: polygon(0 6px, 6px 0, calc(100% - 6px) 0, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0 calc(100% - 6px));
  }
  /* Hover sparkle particles — short-lived */
  @keyframes particle {
    0% { opacity: 0; transform: translate(0, 0) scale(0.4); }
    20% { opacity: 1; }
    100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.1); }
  }
  .particle {
    position: absolute;
    color: var(--accent);
    font-size: 10px;
    pointer-events: none;
    animation: particle 0.55s ease-out forwards;
    text-shadow: 0 0 4px var(--accent-2);
    z-index: 7;
  }
  /* Quick Bar slot pulse on register/swap */
  @keyframes slot-pulse {
    0% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0.0), inset 0 0 0 0 rgba(125, 211, 252, 0); }
    30% { box-shadow: 0 0 16px 4px rgba(125, 211, 252, 0.6), inset 0 0 12px rgba(125, 211, 252, 0.4); }
    100% { box-shadow: 0 0 0 0 rgba(125, 211, 252, 0), inset 0 0 0 0 rgba(125, 211, 252, 0); }
  }
  .qslot.pulsed { animation: slot-pulse 0.55s ease-out; }
  /* Achievement unlock screen flash */
  @keyframes achv-flash {
    0% { opacity: 0; }
    20% { opacity: 0.5; }
    100% { opacity: 0; }
  }
  .achv-flash {
    position: fixed; inset: 0;
    background: radial-gradient(ellipse at center, rgba(245, 158, 11, 0.6), transparent 60%);
    pointer-events: none;
    animation: achv-flash 0.7s ease-out forwards;
    z-index: 999;
  }
  .skill {
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 10px 4px 20px;
    border: 3px solid var(--frame);
    background: linear-gradient(180deg, var(--tile-bg) 0%, var(--tile-bg-2) 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      inset 2px 2px 0 0 rgba(255, 255, 255, 0.05),
      inset -2px -2px 0 0 rgba(0, 0, 0, 0.4),
      0 3px 0 0 var(--frame-strong);
    transition: transform 0.08s, border-color 0.12s;
    text-align: center;
    position: relative;
    /* 8-bit chamfer corners */
    clip-path: polygon(
      0 5px, 5px 0,
      calc(100% - 5px) 0, 100% 5px,
      100% calc(100% - 5px), calc(100% - 5px) 100%,
      5px 100%, 0 calc(100% - 5px)
    );
    animation: card-in 0.3s ease-out backwards;
  }
  .skill:nth-child(1) { animation-delay: 0.02s; }
  .skill:nth-child(2) { animation-delay: 0.04s; }
  .skill:nth-child(3) { animation-delay: 0.06s; }
  .skill:nth-child(4) { animation-delay: 0.08s; }
  .skill:nth-child(5) { animation-delay: 0.10s; }
  .skill:nth-child(6) { animation-delay: 0.12s; }
  .skill:nth-child(n+7) { animation-delay: 0.14s; }
  .skill:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow:
      inset 0 0 0 1px rgba(125, 211, 252, 0.18),
      inset 2px 2px 0 0 rgba(125, 211, 252, 0.1),
      inset -2px -2px 0 0 rgba(0, 0, 0, 0.4),
      0 5px 0 0 var(--frame-strong),
      0 0 16px rgba(125, 211, 252, 0.4);
    z-index: 5;
  }
  .skill:active { transform: translateY(1px); }
  .skill.copied {
    border-color: var(--good);
    animation: shake 0.3s;
    box-shadow:
      0 3px 0 0 #14532d,
      0 0 24px rgba(34, 197, 94, 0.6),
      inset 0 0 12px rgba(34, 197, 94, 0.2);
  }
  /* sparkle on hover */
  .skill::before {
    content: '✦';
    position: absolute;
    color: var(--accent);
    font-size: 12px;
    top: 8px;
    right: 32px;
    opacity: 0;
    pointer-events: none;
    text-shadow: 0 0 4px var(--accent);
  }
  .skill:hover::before {
    animation: sparkle 0.6s ease-out;
  }
  .skill.ghost { opacity: 0.55; filter: grayscale(0.4); }
  .skill-icon { font-size: 32px; line-height: 1; filter: drop-shadow(0 1px 0 rgba(0,0,0,0.5)); }
  .skill-icon-img {
    width: 40px; height: 40px;
    image-rendering: pixelated; image-rendering: crisp-edges;
    filter: drop-shadow(0 1px 0 rgba(0,0,0,0.6));
  }
  .skill-name {
    font-size: 11px; font-weight: 600; color: var(--fg);
    word-break: break-word; overflow: hidden;
    display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
    letter-spacing: 0.2px;
  }
  .skill-original { font-size: 9px; color: var(--muted); margin-top: -3px; }
  .stars {
    position: absolute;
    bottom: 5px;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 10px;
    letter-spacing: 1px;
    line-height: 1;
    user-select: none;
    text-shadow: 0 0 4px currentColor;
    pointer-events: none;
  }
  .stars.lv0 { color: var(--frame); text-shadow: none; }
  .stars.lv1 { color: #94a3b8; }
  .stars.lv2 { color: var(--good); }
  .stars.lv3 { color: var(--accent); }
  .stars.lv4 { color: var(--magenta); }
  .stars.lv5 { color: var(--accent-2); }
  .lv-badge {
    position: absolute;
    top: 4px;
    left: 4px;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4px;
    background: var(--frame-strong);
    color: var(--accent);
    border: 1px solid var(--accent);
    letter-spacing: 0.4px;
    line-height: 1.2;
    z-index: 4;
  }
  .lv-badge.lv1 { color: #94a3b8; border-color: #94a3b8; }
  .lv-badge.lv2 { color: var(--good); border-color: var(--good); }
  .lv-badge.lv3 { color: var(--accent); border-color: var(--accent); }
  .lv-badge.lv4 { color: var(--magenta); border-color: var(--magenta); }
  .lv-badge.lv5 { color: var(--accent-2); border-color: var(--accent-2); box-shadow: 0 0 6px var(--accent-2); }
  .sort-group { display: flex; gap: 2px; }
  .sort-btn {
    all: unset;
    cursor: pointer;
    width: 24px; height: 24px;
    border: 2px solid var(--frame);
    background: var(--tile-bg);
    color: var(--muted);
    text-align: center;
    line-height: 20px;
    font-size: 12px;
    transition: all 0.1s;
  }
  .sort-btn:hover { color: var(--accent); border-color: var(--accent); }
  .sort-btn.active { color: var(--accent-2); border-color: var(--accent-2); background: var(--frame-strong); }
  .recent-group { margin-bottom: 22px; }
  .recent-group .grid { grid-template-columns: repeat(auto-fill, minmax(78px, 1fr)); }
  /* Quick bar */
  .quickbar-section { margin-bottom: 18px; }
  .quickbar {
    /* Fixed 6-column grid so empty/filled/locked slots all stay the same
       width and never overlap or wrap, even on narrow panels. minmax(0, 1fr)
       lets each slot shrink to fit very narrow viewports without busting
       the grid line. container-type lets the @container query below adapt
       on truly tiny widths without depending on the viewport. */
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 6px;
    padding: 8px;
    border: 2px solid var(--accent-2);
    background:
      linear-gradient(180deg, rgba(245, 158, 11, 0.08) 0%, transparent 100%),
      var(--tile-bg-2);
    box-shadow:
      inset 0 0 0 1px #000,
      0 0 0 1px var(--frame-strong),
      0 4px 0 0 rgba(0, 0, 0, 0.4);
    clip-path: polygon(
      0 6px, 6px 0,
      calc(100% - 6px) 0, 100% 6px,
      100% calc(100% - 6px), calc(100% - 6px) 100%,
      6px 100%, 0 calc(100% - 6px)
    );
    container-type: inline-size;
  }
  /* On extremely narrow panels (activity-bar mode under ~280px), drop to a
     2-row grid so slot contents stay legible instead of being squeezed
     into 30px columns. */
  @container (max-width: 280px) {
    .quickbar { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  }
  .qslot {
    all: unset;
    box-sizing: border-box;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 10px 4px 8px;
    /* Explicit width:100% makes the empty <div> slots match the filled
       <button> slots; without this they were sometimes shrinking to
       content width and visually overlapping the next slot. */
    width: 100%;
    min-width: 0;
    min-height: 90px;
    border: 3px solid var(--frame);
    background: linear-gradient(180deg, var(--tile-bg) 0%, var(--tile-bg-2) 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 3px 0 0 var(--frame-strong);
    text-align: center;
    transition: transform 0.08s, border-color 0.12s, box-shadow 0.12s;
    clip-path: polygon(
      0 5px, 5px 0,
      calc(100% - 5px) 0, 100% 5px,
      100% calc(100% - 5px), calc(100% - 5px) 100%,
      5px 100%, 0 calc(100% - 5px)
    );
  }
  .qslot:hover {
    border-color: var(--accent);
    transform: translateY(-2px);
    box-shadow: 0 5px 0 0 var(--frame-strong), 0 0 12px rgba(125, 211, 252, 0.3);
  }
  .qslot:active { transform: translateY(0); }
  .qslot.empty {
    border-style: dashed;
    background:
      repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(90, 98, 115, 0.12) 4px, rgba(90, 98, 115, 0.12) 8px),
      var(--tile-bg-2);
    color: var(--muted);
  }
  .qslot.locked {
    cursor: not-allowed;
    opacity: 0.45;
    border-style: dotted;
    background: var(--tile-bg-2);
  }
  .qslot.locked:hover { transform: none; border-color: var(--frame); }
  .qslot-lock {
    font-size: 14px;
    line-height: 1;
    filter: grayscale(0.5);
  }
  .qslot.dragover {
    border-color: var(--accent-2);
    background: rgba(245, 158, 11, 0.15);
    box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
  }
  .qslot-key {
    position: absolute;
    top: 1px;
    left: 2px;
    font-size: 8px;
    font-weight: 700;
    color: var(--accent-2);
    background: var(--frame-strong);
    border: 1px solid var(--accent-2);
    padding: 0 3px;
    line-height: 1.3;
    z-index: 2;
  }
  .qslot-empty-label {
    font-size: 28px;
    letter-spacing: 0;
    color: var(--muted);
    opacity: 0.4;
    line-height: 1;
    margin-top: 8px;
  }
  .qslot-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--fg);
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    line-height: 1.2;
  }
  .qslot.filled .skill-icon-img {
    width: 36px;
    height: 36px;
  }
  .qslot.filled .skill-icon {
    font-size: 26px;
  }
  .qslot.copied {
    border-color: var(--good);
    box-shadow: 0 0 16px rgba(34, 197, 94, 0.6);
    animation: shake 0.3s;
  }
  /* Make skill cards draggable cursor */
  .skill[draggable="true"] { cursor: grab; }
  .skill[draggable="true"]:active { cursor: grabbing; }
  .skill.dragging { opacity: 0.4; }
  .qslot.filled[draggable="true"] { cursor: grab; }
  .qslot.filled[draggable="true"]:active { cursor: grabbing; }
  .qslot.dragging { opacity: 0.4; }

  /* Free-roaming buddy pet */
  .buddy-pet {
    position: fixed;
    width: 56px;
    height: 56px;
    cursor: pointer;
    z-index: 50;
    pointer-events: auto;
    left: 24px;
    top: 64px;
    transition: left 1.4s cubic-bezier(0.4, 0, 0.2, 1), top 1.4s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
  }
  .buddy-pet img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    display: block;
    animation: pet-bob 2.4s ease-in-out infinite;
    filter: drop-shadow(0 2px 0 rgba(0, 0, 0, 0.5));
  }
  .buddy-pet:hover img {
    animation-play-state: paused;
    filter: drop-shadow(0 0 6px var(--accent-2)) drop-shadow(0 2px 0 rgba(0,0,0,0.5));
  }
  .buddy-pet.flipped img { transform: scaleX(-1); }
  .buddy-pet.cheering img { animation: pet-cheer 0.6s ease-out; }
  @keyframes pet-bob {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
  }
  @keyframes pet-cheer {
    0% { transform: translateY(0) scale(1); }
    30% { transform: translateY(-12px) scale(1.15); }
    60% { transform: translateY(-2px) scale(1.05); }
    100% { transform: translateY(0) scale(1); }
  }

  /* Buddy hero in modal */
  .buddy-hero {
    display: flex;
    gap: 14px;
    align-items: center;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--tile-bg-2);
    border: 2px solid var(--accent-2);
  }
  .buddy-portrait {
    width: 80px;
    height: 80px;
    border: 2px solid var(--frame);
    background: var(--frame-strong);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
  }
  .buddy-portrait img {
    width: 100%; height: 100%;
    image-rendering: pixelated;
  }
  .buddy-info { flex: 1; min-width: 0; }
  .buddy-name-row { display: flex; gap: 6px; margin-bottom: 6px; }
  .buddy-name-row input {
    flex: 1;
    padding: 4px 6px;
    background: var(--tile-bg);
    color: var(--accent-2);
    border: 1px solid var(--frame);
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    outline: none;
  }
  .buddy-name-row input:focus { border-color: var(--accent-2); }
  .buddy-stage {
    color: var(--accent);
    font-size: 11px;
    margin-bottom: 6px;
  }
  .buddy-progress {
    position: relative;
    height: 14px;
    background: var(--frame-strong);
    border: 1px solid var(--frame);
    overflow: hidden;
  }
  .buddy-progress-bar {
    height: 100%;
    background: linear-gradient(90deg, var(--accent-2) 0%, var(--good) 100%);
    transition: width 0.4s;
  }
  .buddy-progress-label {
    position: absolute;
    inset: 0;
    text-align: center;
    line-height: 14px;
    font-size: 9px;
    color: #fff;
    text-shadow: 0 0 4px #000;
  }
  .buddy-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .buddy-stat {
    border: 2px solid var(--frame);
    background: var(--tile-bg-2);
    padding: 8px 4px;
    text-align: center;
  }
  .buddy-stat .stat-label { font-size: 10px; color: var(--muted); }
  .buddy-stat .stat-value {
    font-size: 18px;
    color: var(--accent);
    font-weight: 700;
    line-height: 1.2;
  }

  /* meta toolbar buttons */
  .meta-btn {
    all: unset;
    cursor: pointer;
    width: 24px; height: 24px;
    border: 2px solid var(--frame);
    background: var(--tile-bg);
    color: var(--accent-2);
    text-align: center;
    line-height: 20px;
    font-size: 11px;
    transition: all 0.1s;
    flex-shrink: 0;
  }
  .meta-btn:hover { border-color: var(--accent-2); transform: translateY(-1px); }

  /* exec mode toggle */
  .exec-mode-btn {
    all: unset;
    cursor: pointer;
    height: 24px;
    padding: 0 8px;
    border: 2px solid var(--frame);
    background: var(--tile-bg);
    color: var(--muted);
    text-align: center;
    line-height: 20px;
    font-size: 10px;
    font-family: inherit;
    letter-spacing: 0.4px;
    transition: all 0.1s;
    flex-shrink: 0;
    white-space: nowrap;
  }
  .exec-mode-btn:hover { border-color: var(--accent); }
  .exec-mode-btn.mode-paste {
    color: var(--accent);
    border-color: var(--accent);
    background: var(--frame-strong);
  }
  .exec-mode-btn.mode-auto {
    color: var(--accent-2);
    border-color: var(--accent-2);
    background: var(--frame-strong);
  }
  .exec-mode-btn.mode-terminal {
    color: var(--good);
    border-color: var(--good);
    background: var(--frame-strong);
  }

  /* Wide modal */
  .modal-wide { width: 540px; max-height: 80vh; overflow-y: auto; }
  .modal-wide h4 { color: var(--accent-2); margin-bottom: 12px; }

  /* Achievements grid */
  .achv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
    gap: 8px;
    margin-bottom: 14px;
  }
  .achv {
    position: relative;
    padding: 10px 6px 6px;
    border: 2px solid var(--frame);
    background: var(--tile-bg-2);
    text-align: center;
    transition: all 0.12s;
  }
  .achv.unlocked {
    border-color: var(--accent-2);
    background: linear-gradient(180deg, rgba(245,158,11,0.15) 0%, var(--tile-bg-2) 100%);
    box-shadow: inset 0 0 0 1px rgba(245,158,11,0.3), 0 0 8px rgba(245,158,11,0.2);
  }
  .achv.locked { opacity: 0.4; filter: grayscale(0.7); }
  .achv-icon { font-size: 26px; line-height: 1; margin-bottom: 4px; }
  .achv-name { font-size: 11px; font-weight: 700; color: var(--fg); margin-bottom: 2px; }
  .achv-desc { font-size: 9px; color: var(--muted); line-height: 1.3; }
  .achv-tag {
    position: absolute;
    top: 2px; right: 2px;
    background: var(--accent-2);
    color: #1a1f2c;
    font-size: 8px;
    font-weight: 700;
    padding: 1px 4px;
    border: 1px solid #c2410c;
    line-height: 1.2;
  }

  /* Weekly report */
  .report-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }
  .stat-card {
    border: 2px solid var(--frame);
    background: var(--tile-bg-2);
    padding: 8px;
    text-align: center;
  }
  .stat-label { font-size: 9px; color: var(--muted); letter-spacing: 0.5px; }
  .stat-value {
    font-size: 22px;
    color: var(--accent-2);
    font-weight: 700;
    line-height: 1.2;
    margin-top: 2px;
    text-shadow: 0 0 6px rgba(245,158,11,0.4);
  }
  .stat-unit { font-size: 11px; color: var(--muted); margin-left: 2px; }
  .report-section { margin-bottom: 14px; }
  .report-title { font-size: 10px; color: var(--accent); margin-bottom: 6px; letter-spacing: 0.5px; }
  .day-bars {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 6px;
    height: 80px;
    align-items: end;
  }
  .day-bar {
    position: relative;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: center;
  }
  .day-bar-fill {
    width: 100%;
    background: linear-gradient(180deg, var(--accent-2) 0%, var(--good) 100%);
    min-height: 2px;
    transition: height 0.3s;
    border: 1px solid #000;
  }
  .day-bar-count {
    position: absolute;
    top: -12px;
    font-size: 9px;
    color: var(--accent-2);
  }
  .day-bar-label {
    position: absolute;
    bottom: -16px;
    font-size: 9px;
    color: var(--muted);
  }
  .top-skills { list-style: none; padding: 0; margin: 0; }
  .top-skills li {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-bottom: 1px dashed var(--frame);
    font-size: 11px;
  }
  .top-skills li:last-child { border-bottom: none; }
  .top-skills .rank {
    color: var(--accent-2);
    font-weight: 700;
    width: 24px;
  }
  .top-skills .top-name { flex: 1; color: var(--fg); }
  .top-skills .top-count { color: var(--muted); }
  .report-empty { text-align: center; color: var(--muted); padding: 16px; }

  /* Achievement unlock toast (special) */
  .toast.achv-unlock {
    background: #0b0d12;
    color: var(--accent-2);
    border-color: var(--accent-2);
    box-shadow: inset 0 0 0 1px #000, 0 4px 0 #000, 0 0 24px rgba(245,158,11,0.6);
    font-size: 12px;
    padding: 10px 22px;
  }
  .footer-streak, .footer-total {
    color: var(--accent-2);
    font-weight: 600;
    text-shadow: 0 0 4px rgba(245, 158, 11, 0.4);
  }
  .hover-meta {
    color: var(--accent-2);
    font-size: 10px;
    margin-bottom: 4px;
    border-top: 1px dashed #374151;
    padding-top: 4px;
  }
  /* level-up celebration */
  @keyframes level-up {
    0% { transform: scale(1); }
    20% { transform: scale(1.15); filter: brightness(1.5); }
    40% { transform: scale(0.95); }
    100% { transform: scale(1); filter: brightness(1); }
  }
  .skill.leveled-up { animation: level-up 0.6s ease-out; border-color: var(--accent-2) !important; }
  .kind-badge {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 8px;
    font-weight: 700;
    letter-spacing: 0.5px;
    padding: 1px 4px;
    border-radius: 2px;
    background: var(--frame-strong);
    color: var(--accent);
    border: 1px solid var(--accent);
    text-transform: uppercase;
    z-index: 4;
    line-height: 1.2;
    transition: opacity 0.12s;
  }
  .skill:hover .kind-badge { opacity: 0; }
  .kind-badge.cmd { color: var(--good); border-color: var(--good); }
  .edit-btn {
    position: absolute;
    top: 4px;
    right: 4px;
    width: 18px;
    height: 18px;
    line-height: 15px;
    text-align: center;
    background: rgba(11, 13, 18, 0.6);
    color: var(--accent-2);
    border: 1px solid transparent;
    border-radius: 3px;
    font-size: 11px;
    cursor: pointer;
    opacity: 0;
    transition: opacity 0.12s, background 0.12s, border-color 0.12s;
    z-index: 6;
  }
  .skill:hover .edit-btn { opacity: 1; }
  .edit-btn:hover {
    background: var(--accent-2);
    color: #1a1f2c;
    border-color: #c2410c;
    opacity: 1 !important;
  }

  /* Hover popover */
  .hover-card {
    position: absolute;
    bottom: calc(100% + 6px);
    left: 50%;
    transform: translateX(-50%);
    min-width: 180px;
    max-width: 280px;
    background: #0b0d12;
    color: #e5e7eb;
    border: 2px solid var(--accent);
    border-radius: 6px;
    padding: 8px 10px;
    font-size: 11px;
    line-height: 1.5;
    text-align: left;
    box-shadow: 0 4px 0 rgba(0,0,0,0.6), 0 0 12px rgba(125,211,252,0.25);
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.1s 0.08s;
    z-index: 100;
    white-space: normal;
  }
  .skill:hover .hover-card { opacity: 1; transition-delay: 0.08s; }
  .hover-name { font-weight: 700; color: var(--accent); margin-bottom: 4px; }
  .hover-alias { color: var(--muted); font-weight: 400; font-size: 10px; }
  .hover-desc { color: #cbd5e1; margin-bottom: 6px; }
  .hover-source { color: #94a3b8; font-size: 10px; margin-bottom: 4px; }
  .hover-marketplace { color: var(--muted); }
  .hover-hint { color: var(--muted); font-size: 10px; border-top: 1px dashed #374151; padding-top: 4px; }

  /* Custom group sections + management */
  .group .group-edit-btn {
    margin-left: 6px;
    background: transparent;
    border: 1px solid var(--frame-strong);
    color: var(--muted);
    cursor: pointer;
    padding: 2px 6px;
    font-size: 10px;
    border-radius: 2px;
  }
  .group .group-edit-btn:hover { color: var(--accent); border-color: var(--accent); }
  .custom-group h3 { color: var(--accent-2); }

  /* Edit modal — group select */
  .m-select {
    width: 100%;
    padding: 6px 8px;
    background: var(--tile-bg);
    color: var(--fg);
    border: 2px solid var(--frame);
    font-family: inherit;
    font-size: 12px;
    margin-bottom: 8px;
  }
  .m-select:focus { outline: none; border-color: var(--accent); }

  /* Groups modal */
  .groups-list { display: flex; flex-direction: column; gap: 6px; max-height: 320px; overflow-y: auto; }
  .group-row {
    display: flex; gap: 6px; align-items: center;
    padding: 4px;
    background: var(--tile-bg-2);
    border: 1px solid var(--frame-strong);
  }
  .group-row .group-emoji {
    width: 36px; text-align: center;
    background: var(--bg);
    border: 1px solid var(--frame-strong);
    color: var(--fg);
    padding: 4px;
  }
  .group-row .group-name {
    flex: 1;
    background: var(--bg);
    border: 1px solid var(--frame-strong);
    color: var(--fg);
    padding: 4px 6px;
  }
  .group-row .btn-ghost {
    background: transparent;
    border: 1px solid var(--frame-strong);
    color: var(--muted);
    padding: 2px 6px;
    cursor: pointer;
  }
  .group-row .btn-ghost:hover:not([disabled]) { color: var(--accent); border-color: var(--accent); }
  .group-row .btn-ghost[disabled] { opacity: 0.3; cursor: not-allowed; }
  .group-add-row { display: flex; gap: 6px; align-items: center; }
  .group-add-row #group-add-emoji {
    width: 36px; text-align: center;
    background: var(--bg);
    border: 1px solid var(--frame-strong);
    color: var(--fg);
    padding: 4px;
  }
  .group-add-row #group-add-name {
    flex: 1;
    background: var(--bg);
    border: 1px solid var(--frame-strong);
    color: var(--fg);
    padding: 4px 6px;
  }

  /* Hidden markdown textarea (used as a transport for copy/save) */
  .report-md-hidden { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; pointer-events: none; }

  /* Buddy class skill-stats section */
  .skill-stats-section { margin-top: 14px; }
  .skill-stats-title { color: var(--muted); font-size: 11px; margin-bottom: 8px; }
  .skill-stats-bars { display: flex; flex-direction: column; gap: 4px; }
  .skill-stat-row {
    display: grid;
    grid-template-columns: 110px 1fr 32px;
    gap: 8px; align-items: center;
    padding: 3px 6px;
    border: 1px solid transparent;
    font-size: 10px;
  }
  .skill-stat-row.current {
    border-color: var(--accent);
    background: rgba(125, 211, 252, 0.06);
  }
  .ssr-name { color: var(--fg); }
  .skill-stat-row.current .ssr-name { color: var(--accent); font-weight: 700; }
  .ssr-bar {
    height: 8px;
    background: var(--bg);
    border: 1px solid var(--frame-strong);
    overflow: hidden;
    position: relative;
  }
  .ssr-fill {
    height: 100%;
    background: linear-gradient(to right, var(--accent), var(--accent-2));
    transition: width 0.4s ease;
  }
  .skill-stat-row.current .ssr-fill { background: var(--accent-2); }
  .ssr-count { color: var(--muted); text-align: right; font-variant-numeric: tabular-nums; }

  /* Telemetry first-run banner */
  .tlm-banner {
    display: flex; gap: 8px; align-items: center;
    padding: 8px 12px;
    margin-bottom: 10px;
    background: var(--tile-bg);
    border: 2px solid var(--accent);
    color: var(--fg);
    font-size: 11px;
  }
  .tlm-banner-text { flex: 1; }

  /* Marketplace browser modal */
  .modal-wide { max-width: 720px; }
  .market-toolbar { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
  .market-search {
    flex: 1; min-width: 200px;
    background: var(--bg);
    color: var(--fg);
    border: 2px solid var(--frame);
    padding: 6px 8px;
    font-family: inherit;
    font-size: 12px;
  }
  .market-toggle { display: flex; gap: 4px; align-items: center; font-size: 11px; color: var(--muted); }
  .market-status { color: var(--muted); font-size: 10px; margin-bottom: 6px; }
  .market-list {
    max-height: 480px; overflow-y: auto;
    display: grid; gap: 8px;
    grid-template-columns: 1fr;
  }
  @media (min-width: 600px) {
    .market-list { grid-template-columns: 1fr 1fr; }
  }
  .market-card {
    background: var(--tile-bg-2);
    border: 2px solid var(--frame-strong);
    padding: 10px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .market-card.installed { border-color: var(--good); }
  .market-name { font-weight: 700; color: var(--accent); font-size: 12px; }
  .market-cat { color: var(--muted); font-weight: 400; font-size: 10px; }
  .market-desc { color: #cbd5e1; font-size: 10px; line-height: 1.5; }
  .market-meta { color: var(--muted); font-size: 9px; display: flex; gap: 8px; align-items: center; }
  .market-meta code { background: var(--bg); padding: 2px 4px; }
  .market-actions { display: flex; gap: 6px; align-items: center; margin-top: auto; }
  .market-install-btn { padding: 4px 10px; font-size: 10px; }
  .market-badge { color: var(--good); font-size: 10px; font-weight: 700; }
  .market-link { color: var(--accent); font-size: 10px; text-decoration: none; cursor: pointer; }
  .market-link:hover { color: var(--accent-2); text-decoration: underline; }

  /* Settings modal */
  .settings-section { margin-bottom: 14px; }
  .settings-section label { display: block; font-weight: 700; color: var(--accent-2); margin-bottom: 4px; font-size: 11px; }
  .settings-section .hint { margin-bottom: 6px; }
  .settings-section textarea {
    width: 100%; min-height: 90px;
    background: var(--bg); color: var(--fg);
    border: 1px solid var(--frame-strong);
    font-family: monospace;
    font-size: 10px;
    padding: 6px;
    margin-bottom: 6px;
  }

  /* Keyboard-focused card during search */
  .skill.keyfocus {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
    box-shadow: 0 0 0 4px rgba(125, 211, 252, 0.15);
    z-index: 5;
  }

  /* Onboarding empty state */
  .onboarding {
    padding: 24px 12px 8px;
    text-align: center;
    animation: onb-fade 0.4s ease;
  }
  @keyframes onb-fade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
  .onboarding-title {
    font-family: 'Press Start 2P', monospace;
    font-size: 14px;
    color: var(--accent);
    margin: 0 0 8px;
  }
  .onboarding-sub {
    color: var(--muted);
    font-size: 11px;
    margin: 0 auto 18px;
    max-width: 520px;
    line-height: 1.6;
  }
  .onboarding-cards {
    display: grid;
    gap: 10px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    max-width: 720px;
    margin: 0 auto 16px;
  }
  .onb-card {
    position: relative;
    text-align: left;
    background: var(--tile-bg);
    border: 2px solid var(--frame);
    color: var(--fg);
    padding: 14px 12px 12px;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.12s ease, border-color 0.12s ease;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .onb-card:not(.readonly):hover {
    transform: translateY(-2px);
    border-color: var(--accent);
  }
  .onb-card.readonly { cursor: default; opacity: 0.85; }
  .onb-num {
    position: absolute;
    top: -10px; left: 10px;
    background: var(--bg);
    color: var(--accent);
    border: 2px solid var(--accent);
    width: 22px; height: 22px;
    display: grid; place-items: center;
    font-weight: 700;
    font-size: 11px;
  }
  .onb-h { font-weight: 700; color: var(--accent-2); font-size: 12px; margin-top: 4px; }
  .onb-d { font-size: 10px; color: var(--muted); line-height: 1.5; }
  .onb-cmd {
    background: var(--bg);
    color: var(--accent);
    padding: 4px 6px;
    font-size: 9px;
    border: 1px dashed var(--frame-strong);
    word-break: break-all;
    line-height: 1.4;
  }
  .onb-emoji { font-size: 18px; letter-spacing: 6px; margin-top: 4px; }
  .onb-cta {
    color: var(--accent);
    font-size: 10px;
    font-weight: 700;
    margin-top: auto;
    align-self: flex-end;
  }
  .onboarding-foot {
    color: var(--muted);
    font-size: 10px;
    margin-top: 8px;
  }

  /* Theme toggle button */
  .theme-toggle {
    background: transparent;
    border: 2px solid var(--frame);
    color: var(--accent);
    padding: 4px 8px;
    cursor: pointer;
    font-family: inherit;
    font-size: 10px;
  }
  .theme-toggle:hover { border-color: var(--accent); color: var(--accent-2); }


  /* Edit modal */
  .modal-bg {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.6);
    display: none;
    align-items: center; justify-content: center;
    z-index: 200;
  }
  .modal-bg.show { display: flex; }
  .modal {
    background: var(--tile-bg);
    border: 2px solid var(--accent-2);
    border-radius: 8px;
    padding: 18px;
    width: 320px;
    max-width: 90vw;
    box-shadow: 0 6px 0 rgba(0,0,0,0.5), 0 0 20px rgba(245,158,11,0.3);
  }
  .modal h4 { margin: 0 0 12px 0; color: var(--accent-2); font-size: 13px; }
  .modal label { display: block; font-size: 10px; color: var(--muted); margin: 8px 0 4px; letter-spacing: 0.5px; }
  .modal input, .modal textarea {
    width: 100%;
    padding: 6px 8px;
    background: var(--tile-bg-2);
    color: var(--fg);
    border: 1px solid var(--frame);
    border-radius: 3px;
    font-family: inherit;
    font-size: 12px;
    outline: none;
  }
  .modal input:focus, .modal textarea:focus { border-color: var(--accent); }
  .modal textarea { resize: vertical; min-height: 56px; }
  .modal-row {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-top: 12px;
    padding: 8px 10px;
    background: var(--tile-bg-2);
    border: 1px solid var(--frame);
    border-radius: 4px;
    font-size: 11px;
  }
  .modal-row input[type="checkbox"] {
    flex-shrink: 0;
    width: 14px;
    height: 14px;
    margin: 0;
    cursor: pointer;
    accent-color: var(--accent-2);
  }
  .modal-row label {
    margin: 0 !important;
    color: var(--fg) !important;
    font-size: 11px !important;
    cursor: pointer;
    flex: 1;
    line-height: 1.4;
  }
  .modal-actions { display: flex; gap: 8px; justify-content: flex-end; margin-top: 14px; }
  .btn {
    all: unset;
    cursor: pointer;
    padding: 6px 12px;
    border: 1px solid var(--frame);
    border-radius: 3px;
    font-size: 11px;
    font-family: inherit;
    background: var(--tile-bg-2);
  }
  .btn:hover { border-color: var(--accent); }
  .btn-primary { background: var(--accent-2); color: #1a1f2c; border-color: #c2410c; font-weight: 600; }
  .btn-danger { color: var(--bad); border-color: var(--bad); }
  .spark-search-input {
    width: 100%;
    margin-top: 4px;
    padding: 4px 6px;
    font-family: inherit;
    font-size: 11px;
    color: var(--fg);
    background: var(--tile-bg-2);
    border: 1px solid var(--frame);
    border-radius: 3px;
    box-sizing: border-box;
  }
  .spark-search-input:focus { outline: 1px solid var(--accent); }
  .locale-toggle {
    background: transparent;
    border: 1px solid var(--frame);
    color: var(--fg);
    font: inherit;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: 3px;
  }
  .locale-toggle:hover { border-color: var(--accent); }
  .spark-preset-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(40px, 1fr));
    gap: 4px;
    max-height: 160px;
    overflow-y: auto;
    margin-top: 4px;
    padding: 4px;
    background: var(--tile-bg-2);
    border: 1px solid var(--frame);
    border-radius: 3px;
  }
  .spark-preset-btn {
    all: unset;
    cursor: pointer;
    width: 36px;
    height: 36px;
    border: 2px solid transparent;
    border-radius: 3px;
    overflow: hidden;
    transition: border-color 0.1s;
    flex-shrink: 0;
  }
  .spark-preset-btn img {
    width: 100%;
    height: 100%;
    image-rendering: pixelated;
    display: block;
  }
  .spark-preset-btn:hover { border-color: var(--accent); }
  .spark-preset-btn.selected { border-color: var(--accent-2); box-shadow: 0 0 6px rgba(245,158,11,0.5); }
  .icon-row { display: flex; gap: 10px; align-items: stretch; margin-top: 4px; }
  .icon-preview {
    position: relative;
    width: 64px; height: 64px;
    border: 1px dashed var(--frame);
    border-radius: 4px;
    background:
      linear-gradient(45deg, var(--tile-bg-2) 25%, transparent 25%) 0 0/8px 8px,
      linear-gradient(-45deg, var(--tile-bg-2) 25%, transparent 25%) 0 4px/8px 8px,
      linear-gradient(45deg, transparent 75%, var(--tile-bg-2) 75%) 4px -4px/8px 8px,
      linear-gradient(-45deg, transparent 75%, var(--tile-bg-2) 75%) -4px 0/8px 8px,
      var(--frame-strong);
    display: flex; align-items: center; justify-content: center;
    color: var(--muted); font-size: 10px;
    overflow: hidden;
    flex-shrink: 0;
  }
  .icon-preview img { max-width: 100%; max-height: 100%; image-rendering: pixelated; }
  .preview-size {
    position: absolute;
    bottom: 0; left: 0; right: 0;
    background: rgba(0, 0, 0, 0.65);
    color: var(--accent);
    font-size: 9px;
    text-align: center;
    padding: 1px 0;
    line-height: 1.2;
    letter-spacing: 0.3px;
  }
  .preview-size:empty { display: none; }
  .icon-actions { display: flex; flex-direction: column; gap: 4px; flex: 1; }
  .icon-actions .btn { text-align: center; }
  .hint { color: var(--muted); font-size: 10px; font-weight: 400; }
  .skill-icon-img.user-icon { image-rendering: auto; }

  .footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px dashed var(--frame);
    color: var(--muted);
    font-size: 11px;
    display: flex; gap: 12px; align-items: center;
    flex-wrap: wrap;
  }
  .footer .sep { opacity: 0.5; }
  .footer-spacer { flex: 1; }
  .footer-link {
    color: var(--accent);
    text-decoration: none;
    cursor: pointer;
    font-size: 10px;
  }
  .footer-link:hover { color: var(--accent-2); text-decoration: underline; }
  .toast {
    position: fixed;
    bottom: 18px;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    background: #0b0d12;
    color: var(--accent);
    padding: 8px 18px;
    border: 3px solid var(--accent);
    font-size: 11px;
    font-weight: 400;
    opacity: 0;
    transition: opacity 0.2s, transform 0.2s;
    pointer-events: none;
    box-shadow:
      inset 0 0 0 1px #000,
      0 4px 0 #000,
      0 0 18px rgba(125, 211, 252, 0.5);
    z-index: 1000;
    letter-spacing: 0.5px;
    clip-path: polygon(
      0 6px, 6px 0,
      calc(100% - 6px) 0, 100% 6px,
      100% calc(100% - 6px), calc(100% - 6px) 100%,
      6px 100%, 0 calc(100% - 6px)
    );
  }
  .toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  .empty { color: var(--muted); text-align: center; padding: 24px; }
</style>
</head>
<body data-theme="${theme}">
  ${(!cfg.meta || !cfg.meta.telemetry) ? `
  <div class="tlm-banner" id="tlm-banner">
    <span class="tlm-banner-text">${t('telemetry.banner')}</span>
    <button class="btn btn-ghost" id="tlm-banner-on" type="button">${t('telemetry.allow')}</button>
    <button class="btn btn-ghost" id="tlm-banner-off" type="button">${t('telemetry.deny')}</button>
  </div>` : ''}
  <div class="toolbar">
    <div class="toolbar-search">
      <span class="bracket-l">[</span>
      <input class="search" placeholder="${t('toolbar.searchPh')}" id="search" />
      <span class="bracket-r">]</span>
    </div>
    <div class="toolbar-buttons">
      <div class="sort-group" role="tablist" aria-label="${t('toolbar.sort')}">
        <button class="sort-btn active" data-sort="default" title="${t('toolbar.sortDefault')}">☷</button>
        <button class="sort-btn" data-sort="recent" title="${t('toolbar.sortRecent')}">⏱</button>
        <button class="sort-btn" data-sort="usage" title="${t('toolbar.sortUsage')}">★</button>
      </div>
      <button class="meta-btn" id="achv-btn" title="${t('toolbar.achievements')}">🏆</button>
      <button class="meta-btn" id="report-btn" title="${t('toolbar.weeklyReport')}">📊</button>
      <button class="meta-btn" id="groups-btn" title="${t('toolbar.groups')}">📁</button>
      <button class="meta-btn" id="market-btn" title="${t('toolbar.marketplace')}">🛒</button>
      <button class="meta-btn" id="settings-btn" title="${t('toolbar.settings')}">⚙</button>
      <button class="exec-mode-btn" id="exec-mode-btn" title="${t('toolbar.execMode')}">▶ Off</button>
      <button class="sound-toggle" id="sound-toggle" title="${t('toolbar.sound')}">♪</button>
      <button class="scanlines-toggle" id="scanlines-toggle" title="${t('toolbar.scanlines')}">▦</button>
      <button class="theme-toggle" id="theme-toggle" title="${t('toolbar.theme')}" data-theme="${theme}">🎨 ${userConfig.THEME_LABELS[theme] || theme}</button>
      <button class="locale-toggle" id="locale-toggle" title="${t('toolbar.locale')}">🌐 ${locale.toUpperCase()}</button>
    </div>
  </div>
  <div id="content">${(skills.length ? quickbarHtml + recentSection + sections + hiddenSection : '') || `
    <section class="onboarding">
      <h3 class="onboarding-title">${t('onboarding.title')}</h3>
      <p class="onboarding-sub">${t('onboarding.sub')}</p>
      <div class="onboarding-cards">
        <button class="onb-card" id="onb-install" type="button">
          <div class="onb-num">1</div>
          <div class="onb-h">${t('onboarding.step1.title')}</div>
          <div class="onb-d">${t('onboarding.step1.desc')}</div>
          <code class="onb-cmd">/plugin install superpowers@claude-plugins-official</code>
          <span class="onb-cta">${t('onboarding.step1.cta')} →</span>
        </button>
        <div class="onb-card readonly">
          <div class="onb-num">2</div>
          <div class="onb-h">${t('onboarding.step2.title')}</div>
          <div class="onb-d">${t('onboarding.step2.desc')}</div>
          <code class="onb-cmd">~/.claude/commands/&lt;name&gt;.md</code>
        </div>
        <div class="onb-card readonly">
          <div class="onb-num">3</div>
          <div class="onb-h">${t('onboarding.step3.title')}</div>
          <div class="onb-d">${t('onboarding.step3.desc')}</div>
          <span class="onb-emoji">🎨 📁 🏆 🐾</span>
        </div>
      </div>
      <div class="onboarding-foot">${t('onboarding.foot')}</div>
    </section>`}</div>
  <div class="footer">
    <span class="footer-streak" id="footer-streak">🔥 ${t('footer.streakDays', { days: meta.streak.days || 0 })}</span>
    <span class="sep">|</span>
    <span class="footer-total" id="footer-total">📊 ${t('footer.totalCopies', { count: meta.totalCopies })}</span>
    <span class="sep">|</span>
    <span id="footer-hint">${t('footer.hint')}</span>
    <span class="footer-spacer"></span>
    <a class="footer-link" id="footer-rate" href="#" title="${t('footer.rate')}">★ ${t('footer.rate')}</a>
    <span class="sep">·</span>
    <a class="footer-link" id="footer-issue" href="#" title="${t('footer.issue')}">${t('footer.issue')}</a>
  </div>
  <div class="toast" id="toast"></div>
  <div class="buddy-pet" id="buddy-pet" title="${escapeHtml(character.name)} — ${escapeHtml(character.stageName)}">
    ${buddyImg ? `<img src="${buddyImg}" alt="${escapeHtml(character.name)}" />` : '🥚'}
  </div>

  <div class="modal-bg" id="modal-bg">
    <div class="modal" id="modal">
      <h4 id="modal-title">${t('modal.edit.title')}</h4>
      <label>${t('modal.edit.alias')}</label>
      <input type="text" id="m-alias" placeholder="${t('modal.edit.aliasPh')}" />
      <label>${t('modal.edit.note')}</label>
      <textarea id="m-note" placeholder="${t('modal.edit.notePh')}"></textarea>
      <label>${t('modal.edit.icon')}</label>
      <div class="icon-row">
        <div class="icon-preview" id="m-icon-preview">
          <div class="preview-empty">${t('modal.edit.iconNone')}</div>
          <div class="preview-size" id="m-icon-size"></div>
        </div>
        <div class="icon-actions">
          <button class="btn" id="m-icon-upload" type="button">${t('modal.edit.iconUpload')}</button>
          <button class="btn btn-danger" id="m-icon-clear" type="button">${t('modal.edit.iconRemove')}</button>
        </div>
      </div>
      <label style="margin-top:8px;">${t('modal.edit.spark')} <span class="hint">${t('modal.edit.sparkHint')}</span></label>
      <input type="text" id="m-spark-search" class="spark-search-input" placeholder="${t('modal.edit.sparkSearchPh')}" />
      <div class="spark-preset-grid" id="m-spark-grid" data-presets="${sparkPresetsJson}"></div>
      <label style="margin-top:8px;">${t('modal.edit.group')}</label>
      <select id="m-group" class="m-select">
        <option value="">${t('modal.edit.groupAuto')}</option>
        ${customGroups.map((g) => `<option value="${escapeHtml(g.id)}">${escapeHtml((g.emoji || '') + ' ' + g.name)}</option>`).join('')}
      </select>
      <div class="modal-row">
        <input type="checkbox" id="m-hidden" />
        <label for="m-hidden" style="margin: 0; font-size: 11px; color: var(--fg);">${t('modal.edit.hide')}</label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-danger" id="m-reset">${t('modal.edit.reset')}</button>
        <button class="btn" id="m-cancel">${t('modal.edit.cancel')}</button>
        <button class="btn btn-primary" id="m-save">${t('modal.edit.save')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="groups-bg">
    <div class="modal">
      <h4>${t('modal.groups.title')}</h4>
      <div class="hint" style="margin-bottom: 8px;">${t('modal.groups.hint')}</div>
      <div id="groups-list" class="groups-list">
        ${customGroups.length
          ? customGroups.map((g, i) => `
            <div class="group-row" data-id="${escapeHtml(g.id)}">
              <input type="text" class="group-emoji" maxlength="3" value="${escapeHtml(g.emoji || '📁')}" />
              <input type="text" class="group-name" maxlength="40" value="${escapeHtml(g.name)}" />
              <button class="btn btn-ghost group-up" type="button" ${i === 0 ? 'disabled' : ''} title="${t('modal.groups.up')}">↑</button>
              <button class="btn btn-ghost group-down" type="button" ${i === customGroups.length - 1 ? 'disabled' : ''} title="${t('modal.groups.down')}">↓</button>
              <button class="btn btn-danger group-del" type="button" title="${t('modal.groups.delete')}">✕</button>
            </div>`).join('')
          : `<div class="empty" style="padding:12px;">${t('modal.groups.empty')}</div>`
        }
      </div>
      <div class="group-add-row" style="margin-top: 10px;">
        <input type="text" id="group-add-emoji" maxlength="3" value="📁" />
        <input type="text" id="group-add-name" maxlength="40" placeholder="${t('modal.groups.addPh')}" />
        <button class="btn btn-primary" id="group-add-btn" type="button">${t('modal.groups.add')}</button>
      </div>
      <div class="modal-actions">
        <button class="btn" id="groups-close">${t('modal.groups.close')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="market-bg">
    <div class="modal modal-wide">
      <h4>${t('modal.market.title')}</h4>
      <div class="hint" style="margin-bottom: 8px;">${t('modal.market.hint')}</div>
      <div class="market-toolbar">
        <input type="text" id="market-search" class="market-search" placeholder="${t('modal.market.searchPh')}" />
        <select id="market-cat" class="m-select" style="width: auto; flex: 0 0 auto;"></select>
        <label class="market-toggle">
          <input type="checkbox" id="market-installed-only" />
          ${t('modal.market.installedOnly')}
        </label>
      </div>
      <div id="market-status" class="market-status">${t('modal.market.loading')}</div>
      <div id="market-list" class="market-list"></div>
      <div class="modal-actions">
        <button class="btn" id="market-close">${t('modal.market.close')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="settings-bg">
    <div class="modal">
      <h4>${t('modal.settings.title')}</h4>
      <div class="settings-section">
        <label>${t('modal.settings.export')}</label>
        <div class="hint">${t('modal.settings.exportHint')}</div>
        <button class="btn" id="settings-export">📋 ${t('modal.settings.exportBtn')}</button>
      </div>
      <div class="settings-section">
        <label>${t('modal.settings.import')}</label>
        <div class="hint">${t('modal.settings.importHint')}</div>
        <textarea id="settings-import-text" placeholder='{"meta":{...},"skills":{...}}'></textarea>
        <button class="btn btn-primary" id="settings-import-btn">${t('modal.settings.importBtn')}</button>
      </div>
      <div class="settings-section">
        <label>${t('modal.settings.telemetry')}</label>
        <div class="hint">${t('modal.settings.telemetryHint')}</div>
        <div style="display:flex; gap:8px;">
          <button class="btn" data-telemetry="on" id="tlm-on">${t('modal.settings.telemetryOn')}</button>
          <button class="btn" data-telemetry="off" id="tlm-off">${t('modal.settings.telemetryOff')}</button>
        </div>
        <div class="hint" id="tlm-status" style="margin-top:4px;"></div>
      </div>
      <div class="modal-actions">
        <button class="btn" id="settings-close">${t('modal.settings.close')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="achv-bg">
    <div class="modal modal-wide">
      <h4>${t('modal.achv.title')} <span class="hint">${achvStatus.filter(a => a.earned).length} / ${achvStatus.length}</span></h4>
      <div class="achv-grid">
        ${achvStatus.map(a => {
          const aName = t(a.nameKey);
          const aDesc = t(a.descKey);
          return `
          <div class="achv ${a.earned ? 'unlocked' : 'locked'}" title="${escapeHtml(aDesc)}">
            <div class="achv-icon">${a.icon}</div>
            <div class="achv-name">${escapeHtml(aName)}</div>
            <div class="achv-desc">${escapeHtml(aDesc)}</div>
            ${a.earned ? `<span class="achv-tag">${t('modal.achv.earned')}</span>` : ''}
          </div>`;
        }).join('')}
      </div>
      <div class="modal-actions">
        <button class="btn" id="achv-close">${t('modal.achv.close')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="buddy-bg">
    <div class="modal modal-wide">
      <h4>${t('modal.buddy.title')}</h4>
      <div class="buddy-hero">
        <div class="buddy-portrait">
          ${buddyImg ? `<img src="${buddyImg}" alt="${escapeHtml(character.name)}" />` : '🥚'}
        </div>
        <div class="buddy-info">
          <div class="buddy-name-row">
            <input type="text" id="buddy-name-input" value="${escapeHtml(character.name)}" maxlength="20" />
            <button class="btn" id="buddy-save-name">${t('modal.buddy.save')}</button>
          </div>
          <div class="buddy-stage">
            ${(() => {
              const cls = character.class || 'codey';
              const meta = userConfig.BUDDY_CLASSES.find((c) => c.id === cls);
              const stageLabel = t('stage.' + character.stage + '.name');
              return `${meta?.emoji || ''} <strong>${stageLabel} ${t('class.' + cls + '.name')}</strong> <span class="hint">${t('class.' + cls + '.role')} · LV.${character.stage + 1}/5</span>`;
            })()}
          </div>
          <div class="buddy-progress">
            <div class="buddy-progress-bar" style="width: ${buddyProgress}%"></div>
            <div class="buddy-progress-label">
              ${character.nextThreshold
                ? `${character.actions} / ${character.nextThreshold}`
                : `MAX (${character.actions})`}
            </div>
          </div>
        </div>
      </div>
      <div class="buddy-stats">
        ${[
          ['🧠 INT', 'int', t('modal.buddy.statIntDesc')],
          ['⚡ DEX', 'dex', t('modal.buddy.statDexDesc')],
          ['❤️ VIT', 'vit', t('modal.buddy.statVitDesc')],
          ['🍀 LCK', 'lck', t('modal.buddy.statLckDesc')],
        ].map(([label, key, hint]) => `
          <div class="buddy-stat" title="${hint}">
            <div class="stat-label">${label}</div>
            <div class="stat-value">${character.stats[key] || 0}</div>
          </div>
        `).join('')}
      </div>

      <div class="skill-stats-section">
        <div class="skill-stats-title">
          ${t('modal.buddy.skillStats')}
        </div>
        <div class="skill-stats-bars">
          ${(() => {
            const stats = character.skillStats || {};
            const entries = userConfig.BUDDY_CLASSES.map((c) => ({
              id: c.id, role: c.role, emoji: c.emoji,
              count: stats[c.id] || 0,
            }));
            const max = Math.max(1, ...entries.map((e) => e.count));
            return entries
              .sort((a, b) => b.count - a.count)
              .map((e) => {
                const pct = Math.round((e.count / max) * 100);
                const isCurrent = character.class === e.id;
                return `
                  <div class="skill-stat-row ${isCurrent ? 'current' : ''}">
                    <div class="ssr-name">${e.emoji} ${t('class.' + e.id + '.name')}</div>
                    <div class="ssr-bar"><div class="ssr-fill" style="width: ${pct}%"></div></div>
                    <div class="ssr-count">${e.count}</div>
                  </div>`;
              }).join('');
          })()}
        </div>
      </div>

      <div class="modal-actions">
        ${character.class ? `<button class="btn btn-danger" id="buddy-reincarnate">${t('modal.buddy.reincarnate')}</button>` : ''}
        <button class="btn" id="buddy-close">${t('modal.buddy.close')}</button>
      </div>
    </div>
  </div>

  <div class="modal-bg" id="report-bg">
    <div class="modal modal-wide">
      <h4>${t('modal.report.title')}</h4>
      <div class="report-stats">
        <div class="stat-card">
          <div class="stat-label">${t('modal.report.weekTotal')}</div>
          <div class="stat-value">${weekly.weekTotal}<span class="stat-unit">${t('modal.report.unitCount')}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('modal.report.streak')}</div>
          <div class="stat-value">${weekly.streakDays}<span class="stat-unit">${t('modal.report.unitDays')}</span></div>
        </div>
        <div class="stat-card">
          <div class="stat-label">${t('modal.report.totalCopies')}</div>
          <div class="stat-value">${weekly.totalCopies}<span class="stat-unit">${t('modal.report.unitCount')}</span></div>
        </div>
      </div>
      <div class="report-section">
        <div class="report-title">${t('modal.report.recent7')}</div>
        <div class="day-bars">
          ${weekly.days.map((d, i) => {
            const c = weekly.counts[i];
            const max = Math.max(...weekly.counts, 1);
            const h = Math.round((c / max) * 100);
            const dayLabel = d.slice(5).replace('-', '/');
            return `<div class="day-bar" title="${t('modal.report.dayTooltip', { date: d, count: c })}">
              <div class="day-bar-fill" style="height: ${h}%"></div>
              <div class="day-bar-count">${c || ''}</div>
              <div class="day-bar-label">${dayLabel}</div>
            </div>`;
          }).join('')}
        </div>
      </div>
      ${weekly.topSkills.length ? `
      <div class="report-section">
        <div class="report-title">${t('modal.report.top5')}</div>
        <ol class="top-skills">
          ${weekly.topSkills.map((top, i) => `
            <li>
              <span class="rank">#${i + 1}</span>
              <span class="top-name">${escapeHtml(top.label)}</span>
              <span class="top-count">${t('modal.report.topCount', { count: top.count })}</span>
            </li>
          `).join('')}
        </ol>
      </div>` : `<div class="report-empty">${t('modal.report.empty')}</div>`}
      <textarea id="report-md" class="report-md-hidden" readonly>${escapeHtml(buildWeeklyMarkdown(weekly))}</textarea>
      <div class="modal-actions">
        <button class="btn" id="report-copy-md">${t('modal.report.copyMd')}</button>
        <button class="btn" id="report-save-md">${t('modal.report.saveMd')}</button>
        <button class="btn" id="report-close">${t('modal.report.close')}</button>
      </div>
    </div>
  </div>

<script>
const vscode = acquireVsCodeApi();
const STR = ${JSON.stringify(i18n.dict(locale))};
const LOCALE = ${JSON.stringify(locale)};
window.__telemetry = ${JSON.stringify((cfg.meta && cfg.meta.telemetry) || 'unset')};
function t(key, vars) {
  let s = STR[key];
  if (s == null) s = key;
  if (vars) s = s.replace(/\\{(\\w+)\\}/g, (m, k) => k in vars ? String(vars[k]) : m);
  return s;
}
const search = document.getElementById('search');
const toast = document.getElementById('toast');
const soundBtn = document.getElementById('sound-toggle');
const scanlinesBtn = document.getElementById('scanlines-toggle');
const localeBtn = document.getElementById('locale-toggle');
if (localeBtn) {
  localeBtn.addEventListener('click', () => {
    const cycle = ['en', 'ko', 'ja', 'zh'];
    const idx = cycle.indexOf(LOCALE);
    const next = cycle[(idx + 1) % cycle.length];
    vscode.postMessage({ type: 'setLocale', locale: next });
  });
}
const themeBtn = document.getElementById('theme-toggle');
if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const themes = ['dark', 'retro', 'lcd'];
    const cur = themeBtn.dataset.theme || 'dark';
    const next = themes[(themes.indexOf(cur) + 1) % themes.length];
    vscode.postMessage({ type: 'setTheme', theme: next });
  });
}

// ---- Game state (persisted in localStorage of webview) ----
const STATE = (() => {
  let s;
  try { s = JSON.parse(localStorage.getItem('csp-game-state') || '{}'); } catch { s = {}; }
  return Object.assign({ sound: true, scanlines: true }, s);
})();
function saveState() { localStorage.setItem('csp-game-state', JSON.stringify(STATE)); }

if (!STATE.scanlines) document.body.classList.add('no-scanlines');
if (!STATE.sound) soundBtn.classList.add('off');
if (!STATE.scanlines) scanlinesBtn.classList.add('off');

// ---- 8-bit Web Audio ----
let audioCtx = null;
function ac() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(opts) {
  if (!STATE.sound) return;
  const { freq = 440, duration = 0.08, type = 'square', vol = 0.06, slide = 0 } = opts || {};
  try {
    const ctx = ac();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if (slide) {
      osc.frequency.exponentialRampToValueAtTime(freq + slide, ctx.currentTime + duration);
    }
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch {}
}
function sfxHover() { beep({ freq: 800, duration: 0.04, vol: 0.025 }); }
function sfxClick() { beep({ freq: 660, duration: 0.06, slide: -200, vol: 0.05 }); }
function sfxCopy() {
  beep({ freq: 880, duration: 0.06, vol: 0.05 });
  setTimeout(() => beep({ freq: 1320, duration: 0.08, vol: 0.05 }), 60);
}
function sfxOpen() { beep({ freq: 520, duration: 0.05, slide: 200, vol: 0.04 }); }

soundBtn.addEventListener('click', () => {
  STATE.sound = !STATE.sound;
  soundBtn.classList.toggle('off', !STATE.sound);
  saveState();
  if (STATE.sound) sfxCopy();
});
scanlinesBtn.addEventListener('click', () => {
  STATE.scanlines = !STATE.scanlines;
  scanlinesBtn.classList.toggle('off', !STATE.scanlines);
  document.body.classList.toggle('no-scanlines', !STATE.scanlines);
  saveState();
});

// Exec mode cycle: paste → auto → terminal → paste
const EXEC_MODES = ['paste', 'auto', 'terminal'];
const EXEC_LABELS = { paste: '▶ Paste', auto: '▶ Auto', terminal: '▶ Term' };
const EXEC_NEXT_HINT = {
  paste: t('exec.paste'),
  auto: t('exec.auto'),
  terminal: t('exec.terminal'),
};
const execBtn = document.getElementById('exec-mode-btn');
function applyExecMode() {
  const m = STATE.execMode || 'off';
  execBtn.textContent = EXEC_LABELS[m];
  execBtn.classList.remove('mode-paste', 'mode-terminal');
  if (m !== 'off') execBtn.classList.add('mode-' + m);
  execBtn.title = t('exec.modeTitle', { hint: EXEC_NEXT_HINT[m] });
}
if (!STATE.execMode || STATE.execMode === 'off') STATE.execMode = 'paste';
applyExecMode();
execBtn.addEventListener('click', () => {
  const cur = STATE.execMode || 'off';
  const idx = EXEC_MODES.indexOf(cur);
  STATE.execMode = EXEC_MODES[(idx + 1) % EXEC_MODES.length];
  saveState();
  applyExecMode();
  sfxClick();
  showToast(EXEC_LABELS[STATE.execMode] + ' — ' + EXEC_NEXT_HINT[STATE.execMode]);
});

// Modal toggles
const achvBg = document.getElementById('achv-bg');
const reportBg = document.getElementById('report-bg');
const buddyBg = document.getElementById('buddy-bg');
const groupsBg = document.getElementById('groups-bg');
const buddyPet = document.getElementById('buddy-pet');
document.getElementById('achv-btn').addEventListener('click', () => { achvBg.classList.add('show'); sfxOpen(); });
document.getElementById('report-btn').addEventListener('click', () => { reportBg.classList.add('show'); sfxOpen(); });
const groupsBtn = document.getElementById('groups-btn');
if (groupsBtn) groupsBtn.addEventListener('click', () => { groupsBg.classList.add('show'); sfxOpen(); });
if (buddyPet) buddyPet.addEventListener('click', () => { buddyBg.classList.add('show'); sfxOpen(); });
document.getElementById('achv-close').addEventListener('click', () => achvBg.classList.remove('show'));
document.getElementById('report-close').addEventListener('click', () => reportBg.classList.remove('show'));
const reportCopyBtn = document.getElementById('report-copy-md');
const reportSaveBtn = document.getElementById('report-save-md');
const reportMdEl = document.getElementById('report-md');
if (reportCopyBtn && reportMdEl) {
  reportCopyBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'copyWeeklyMarkdown', markdown: reportMdEl.value });
    sfxClick();
  });
}
if (reportSaveBtn && reportMdEl) {
  reportSaveBtn.addEventListener('click', () => {
    vscode.postMessage({ type: 'saveWeeklyMarkdown', markdown: reportMdEl.value });
    sfxClick();
  });
}
document.getElementById('buddy-close').addEventListener('click', () => buddyBg.classList.remove('show'));
const groupsCloseBtn = document.getElementById('groups-close');
if (groupsCloseBtn) groupsCloseBtn.addEventListener('click', () => groupsBg.classList.remove('show'));
achvBg.addEventListener('click', (e) => { if (e.target === achvBg) achvBg.classList.remove('show'); });
reportBg.addEventListener('click', (e) => { if (e.target === reportBg) reportBg.classList.remove('show'); });
buddyBg.addEventListener('click', (e) => { if (e.target === buddyBg) buddyBg.classList.remove('show'); });
if (groupsBg) groupsBg.addEventListener('click', (e) => { if (e.target === groupsBg) groupsBg.classList.remove('show'); });

// Group management interactions
(function wireGroups() {
  const list = document.getElementById('groups-list');
  if (!list) return;
  // Edit button on group section header opens the modal
  document.querySelectorAll('.group-edit-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      groupsBg.classList.add('show');
      sfxOpen();
    });
  });
  // Add new group
  const addBtn = document.getElementById('group-add-btn');
  const addName = document.getElementById('group-add-name');
  const addEmoji = document.getElementById('group-add-emoji');
  function doAdd() {
    const name = (addName.value || '').trim();
    if (!name) return;
    vscode.postMessage({ type: 'addGroup', name, emoji: (addEmoji.value || '📁').trim() });
  }
  if (addBtn) addBtn.addEventListener('click', doAdd);
  if (addName) addName.addEventListener('keydown', (e) => { if (e.key === 'Enter') doAdd(); });
  // Per-row interactions (rename on blur, delete, reorder)
  list.querySelectorAll('.group-row').forEach((row) => {
    const id = row.dataset.id;
    const nameInput = row.querySelector('.group-name');
    const emojiInput = row.querySelector('.group-emoji');
    function persistRename() {
      vscode.postMessage({
        type: 'renameGroup',
        id,
        name: nameInput.value.trim(),
        emoji: (emojiInput.value || '📁').trim(),
      });
    }
    nameInput.addEventListener('blur', persistRename);
    emojiInput.addEventListener('blur', persistRename);
    nameInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') persistRename(); });
    row.querySelector('.group-del').addEventListener('click', () => {
      if (confirm(nameInput.value + ' — ' + STR['modal.groups.confirmDel'])) {
        vscode.postMessage({ type: 'removeGroup', id });
      }
    });
    const upBtn = row.querySelector('.group-up');
    const downBtn = row.querySelector('.group-down');
    function reorder(delta) {
      const ids = [...list.querySelectorAll('.group-row')].map((r) => r.dataset.id);
      const idx = ids.indexOf(id);
      if (idx < 0) return;
      const target = idx + delta;
      if (target < 0 || target >= ids.length) return;
      [ids[idx], ids[target]] = [ids[target], ids[idx]];
      vscode.postMessage({ type: 'reorderGroups', ids });
    }
    if (upBtn) upBtn.addEventListener('click', () => reorder(-1));
    if (downBtn) downBtn.addEventListener('click', () => reorder(1));
  });
})();

// ---- Free-roaming pet wander ----
const PET_W = 56;
let petWanderTimer = null;
function petMove(x, y) {
  if (!buddyPet) return;
  const w = window.innerWidth - PET_W - 16;
  const h = window.innerHeight - PET_W - 16;
  const cx = Math.max(8, Math.min(w, x));
  const cy = Math.max(8, Math.min(h, y));
  // flip horizontally based on direction
  const prevLeft = parseFloat(buddyPet.style.left || '24');
  if (cx > prevLeft + 4) buddyPet.classList.remove('flipped');
  else if (cx < prevLeft - 4) buddyPet.classList.add('flipped');
  buddyPet.style.left = cx + 'px';
  buddyPet.style.top = cy + 'px';
}
function petWanderLoop() {
  if (!buddyPet) return;
  const w = window.innerWidth - PET_W - 16;
  const h = window.innerHeight - PET_W - 16;
  petMove(8 + Math.random() * w, 60 + Math.random() * Math.max(40, h - 80));
  const next = 6000 + Math.random() * 9000;
  petWanderTimer = setTimeout(petWanderLoop, next);
}
function petToCard(card) {
  if (!buddyPet || !card) return;
  const r = card.getBoundingClientRect();
  // place to the right of the card if room, else left
  let x = r.right + 6;
  if (x + PET_W > window.innerWidth - 8) x = r.left - PET_W - 6;
  const y = r.top + r.height / 2 - PET_W / 2;
  petMove(x, y);
  buddyPet.classList.add('cheering');
  setTimeout(() => buddyPet.classList.remove('cheering'), 700);
  // re-arm wander timer so we don't immediately wander away
  if (petWanderTimer) {
    clearTimeout(petWanderTimer);
    petWanderTimer = setTimeout(petWanderLoop, 6000);
  }
}
// Initial position + idle loop
if (buddyPet) {
  buddyPet.style.left = '24px';
  buddyPet.style.top = '64px';
  petWanderTimer = setTimeout(petWanderLoop, 5000);
}
document.getElementById('buddy-save-name').addEventListener('click', () => {
  const name = document.getElementById('buddy-name-input').value.trim();
  vscode.postMessage({ type: 'setBuddyName', name });
  showToast(t('toast.buddyName', { name }));
  sfxClick();
});
const reincarnateBtn = document.getElementById('buddy-reincarnate');
if (reincarnateBtn) reincarnateBtn.addEventListener('click', () => {
  if (!confirm(t('modal.buddy.reincarnateConfirm'))) return;
  vscode.postMessage({ type: 'reincarnate' });
  sfxClick();
});
const modalBg = document.getElementById('modal-bg');
const mAlias = document.getElementById('m-alias');
const mNote = document.getElementById('m-note');
const mHidden = document.getElementById('m-hidden');
const mTitle = document.getElementById('modal-title');
const mGroup = document.getElementById('m-group');
let toastTimer;
let editingSkill = null;

// Visual flourishes — kept in JS so they only fire on real interactions
// (CSS-only :hover would re-fire too aggressively and clutter the screen).
function spawnRipple(el, evt) {
  const rect = el.getBoundingClientRect();
  // Anchor near the click point, fall back to center
  const x = evt && evt.clientX ? evt.clientX - rect.left : rect.width / 2;
  const y = evt && evt.clientY ? evt.clientY - rect.top : rect.height / 2;
  const r = document.createElement('span');
  r.className = 'ripple';
  r.style.left = x + 'px';
  r.style.top = y + 'px';
  el.appendChild(r);
  setTimeout(() => r.remove(), 520);
}
const PARTICLE_GLYPHS = ['✦', '✧', '⋆', '·', '◆'];
let particleCooldown = 0;
function spawnHoverParticles(el) {
  // Throttle so dragging across a grid doesn't cause hundreds of nodes
  const now = Date.now();
  if (now - particleCooldown < 220) return;
  particleCooldown = now;
  const rect = el.getBoundingClientRect();
  const count = 4 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle';
    p.textContent = PARTICLE_GLYPHS[Math.floor(Math.random() * PARTICLE_GLYPHS.length)];
    const startX = Math.random() * rect.width;
    const startY = Math.random() * rect.height;
    const dx = (Math.random() - 0.5) * 30;
    const dy = -10 - Math.random() * 18;
    p.style.left = startX + 'px';
    p.style.top = startY + 'px';
    p.style.setProperty('--dx', dx + 'px');
    p.style.setProperty('--dy', dy + 'px');
    el.appendChild(p);
    setTimeout(() => p.remove(), 600);
  }
}
function pulseSlot(slot) {
  if (!slot) return;
  slot.classList.remove('pulsed');
  // Force reflow so the same class re-triggers the animation
  void slot.offsetWidth;
  slot.classList.add('pulsed');
  setTimeout(() => slot.classList.remove('pulsed'), 600);
}
function flashAchievement() {
  const f = document.createElement('div');
  f.className = 'achv-flash';
  document.body.appendChild(f);
  setTimeout(() => f.remove(), 720);
}

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
}

let pendingIconClear = false;
let pendingSparkIcon = null;
const iconSizeEl = document.getElementById('m-icon-size');
const sparkGrid = document.getElementById('m-spark-grid');
const sparkSearch = document.getElementById('m-spark-search');

// Build spark preset grid
(function() {
  let presets = [];
  try { presets = JSON.parse(sparkGrid.dataset.presets || '[]'); } catch {}
  sparkGrid.innerHTML = presets.map(p =>
    '<button class="spark-preset-btn" data-name="' + p.name + '" title="' + p.name + '" type="button">' +
    '<img src="' + p.uri + '" alt="' + p.name + '" /></button>'
  ).join('');
  sparkGrid.querySelectorAll('.spark-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sparkGrid.querySelectorAll('.spark-preset-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      pendingSparkIcon = btn.dataset.name;
      pendingIconClear = false;
      setIconPreview(btn.querySelector('img').src, '36×36');
    });
  });
  if (sparkSearch) {
    sparkSearch.addEventListener('input', () => {
      const q = sparkSearch.value.trim().toLowerCase();
      sparkGrid.querySelectorAll('.spark-preset-btn').forEach(btn => {
        const match = !q || btn.dataset.name.toLowerCase().includes(q);
        btn.style.display = match ? '' : 'none';
      });
    });
  }
})();
function setIconPreview(uri, sizeText) {
  const preview = document.getElementById('m-icon-preview');
  if (uri) {
    preview.innerHTML = '<img id="m-preview-img" src="' + uri + '" />' +
      '<div class="preview-size" id="m-icon-size">' + (sizeText || '') + '</div>';
    if (!sizeText) {
      // Read dimensions from the loaded image
      const img = preview.querySelector('img');
      img.onload = () => {
        const sz = img.naturalWidth + '×' + img.naturalHeight;
        const labelEl = preview.querySelector('.preview-size');
        if (labelEl) labelEl.textContent = sz;
      };
    }
  } else {
    preview.innerHTML = '<div class="preview-empty">' + t('modal.edit.iconNone') + '</div><div class="preview-size"></div>';
  }
}
function openEditModal(el) {
  editingSkill = el.dataset.name;
  mTitle.textContent = t('modal.edit.titleFormat', { name: editingSkill });
  mAlias.value = el.dataset.alias && el.dataset.alias !== editingSkill ? el.dataset.alias : '';
  mNote.value = el.dataset.note || '';
  mHidden.checked = el.dataset.hidden === '1';
  if (mGroup) mGroup.value = el.dataset.group || '';
  pendingIconClear = false;
  pendingSparkIcon = null;
  setIconPreview(el.dataset.iconUri || '');
  // Highlight currently selected spark preset if any
  const currentSpark = el.dataset.sparkIcon || '';
  sparkGrid.querySelectorAll('.spark-preset-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.name === currentSpark);
    b.style.display = '';
  });
  if (sparkSearch) sparkSearch.value = '';
  modalBg.classList.add('show');
  setTimeout(() => mAlias.focus(), 50);
}
function closeModal() { modalBg.classList.remove('show'); editingSkill = null; }
modalBg.addEventListener('click', (e) => { if (e.target === modalBg) closeModal(); });
document.getElementById('m-cancel').addEventListener('click', closeModal);
document.getElementById('m-save').addEventListener('click', () => {
  if (!editingSkill) return;
  vscode.postMessage({
    type: 'saveConfig',
    name: editingSkill,
    alias: mAlias.value.trim(),
    note: mNote.value.trim(),
    hidden: mHidden.checked,
    clearIcon: pendingIconClear,
    sparkIcon: pendingSparkIcon,
    group: mGroup ? (mGroup.value || null) : undefined,
  });
  closeModal();
});
document.getElementById('m-reset').addEventListener('click', () => {
  if (!editingSkill) return;
  vscode.postMessage({ type: 'saveConfig', name: editingSkill, alias: '', note: '', hidden: false, clearIcon: true });
  closeModal();
});
document.getElementById('m-icon-upload').addEventListener('click', () => {
  if (!editingSkill) return;
  vscode.postMessage({ type: 'pickIcon', name: editingSkill });
});
document.getElementById('m-icon-clear').addEventListener('click', () => {
  pendingIconClear = true;
  setIconPreview('');
  showToast(t('toast.iconRemoveOnSave'));
});
window.addEventListener('message', (e) => {
  const m = e.data;
  if (m && m.type === 'iconPicked' && m.uri && editingSkill === m.name) {
    pendingIconClear = false;
    setIconPreview(m.uri, m.size);
  }
  if (m && m.type === 'showAchievements') achvBg.classList.add('show');
  if (m && m.type === 'showWeeklyReport') reportBg.classList.add('show');
  if (m && m.type === 'toast' && m.key) showToast(t(m.key, m.vars));
  if (m && m.type === 'marketplaceCatalog') {
    marketCatalog = m.catalog || { marketplaces: [], plugins: [] };
    // Populate category filter
    const cats = new Set(marketCatalog.plugins.map((p) => p.category).filter(Boolean));
    if (marketCatSel) {
      const opts = ['<option value="__all__">' + (STR['modal.market.allCats'] || 'All categories') + '</option>'];
      [...cats].sort().forEach((c) => opts.push('<option value="' + c + '">' + c + '</option>'));
      marketCatSel.innerHTML = opts.join('');
    }
    renderMarketList();
  }
  if (m && m.type === 'usageRecorded') {
    // Update card data attrs + stars, no full refresh
    document.querySelectorAll('.skill[data-name="' + m.name.replace(/"/g, '\\\\"') + '"]').forEach((el) => {
      const newCount = parseInt(el.dataset.count || '0', 10) + 1;
      el.dataset.count = String(newCount);
      el.dataset.last = new Date().toISOString();
      const wasLevel = m.prevLevel;
      const newLevel = m.nextLevel;
      el.dataset.level = String(newLevel);
      // refresh stars
      const stars = el.querySelector('.stars');
      if (stars) {
        stars.className = 'stars lv' + newLevel;
        stars.textContent = '★'.repeat(newLevel) + '☆'.repeat(5 - newLevel);
      }
      // refresh LV badge
      let lvBadge = el.querySelector('.lv-badge');
      if (newLevel > 0) {
        if (!lvBadge) {
          lvBadge = document.createElement('span');
          lvBadge.className = 'lv-badge lv' + newLevel;
          el.appendChild(lvBadge);
        }
        lvBadge.className = 'lv-badge lv' + newLevel;
        lvBadge.textContent = 'LV.' + newLevel;
      }
      if (newLevel > wasLevel) {
        el.classList.add('leveled-up');
        setTimeout(() => el.classList.remove('leveled-up'), 700);
        showToast('★ LEVEL UP! /' + m.name + ' LV.' + newLevel);
        beep({ freq: 660, duration: 0.1, vol: 0.06 });
        setTimeout(() => beep({ freq: 880, duration: 0.1, vol: 0.06 }), 100);
        setTimeout(() => beep({ freq: 1100, duration: 0.15, vol: 0.06 }), 200);
      }
    });
    // update footer
    const streakEl = document.getElementById('footer-streak');
    const totalEl = document.getElementById('footer-total');
    if (streakEl) streakEl.textContent = '🔥 ' + t('footer.streakDays', { days: m.streak });
    if (totalEl) totalEl.textContent = '📊 ' + t('footer.totalCopies', { count: m.totalCopies });

    // Class lock (first action) — single celebratory toast.
    if (m.buddy && m.buddy.branchedTo) {
      setTimeout(() => {
        showToast(t('toast.classBranch', {
          name: m.buddy.character.name || 'Claude',
          class: t('class.' + m.buddy.branchedTo + '.name'),
          role: t('class.' + m.buddy.branchedTo + '.role'),
        }));
        beep({ freq: 523, duration: 0.12, vol: 0.08 });
        setTimeout(() => beep({ freq: 659, duration: 0.12, vol: 0.08 }), 130);
        setTimeout(() => beep({ freq: 784, duration: 0.12, vol: 0.08 }), 260);
        setTimeout(() => beep({ freq: 1047, duration: 0.2, vol: 0.08 }), 390);
      }, 400);
    } else if (m.buddy && m.buddy.nextStage > m.buddy.prevStage) {
      // Subsequent level-ups within the same class.
      const className = m.buddy.class ? t('class.' + m.buddy.class + '.name') : '';
      const stageName = t('stage.' + m.buddy.nextStage + '.name');
      setTimeout(() => {
        showToast(t('toast.evolution', {
          name: m.buddy.character.name || 'Claude',
          stage: stageName + ' ' + className,
        }));
        beep({ freq: 523, duration: 0.12, vol: 0.08 });
        setTimeout(() => beep({ freq: 659, duration: 0.12, vol: 0.08 }), 130);
        setTimeout(() => beep({ freq: 784, duration: 0.12, vol: 0.08 }), 260);
      }, 400);
    }
    // Update toolbar avatar tooltip on each tick (image refreshes on next render)
    const buddyBtn = document.getElementById('buddy-btn');
    if (buddyBtn && m.buddy && m.buddy.character) {
      const c = m.buddy.character;
      buddyBtn.title = c.name + ' — ' + (c.stageName || '');
    }
    // Achievement unlock toasts (chained, one per second)
    if (Array.isArray(m.newAchievements) && m.newAchievements.length) {
      m.newAchievements.forEach((a, i) => {
        setTimeout(() => {
          showAchvToast(a);
          // celebration chime
          beep({ freq: 660, duration: 0.1, vol: 0.08 });
          setTimeout(() => beep({ freq: 990, duration: 0.1, vol: 0.08 }), 100);
          setTimeout(() => beep({ freq: 1320, duration: 0.18, vol: 0.08 }), 220);
        }, 800 + i * 1500);
      });
    }
  }
});

function showAchvToast(a) {
  const el = document.getElementById('toast');
  el.classList.add('achv-unlock');
  el.textContent = t('toast.achievement', { icon: a.icon, name: t(a.nameKey) });
  el.classList.add('show');
  flashAchievement();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.classList.remove('achv-unlock'), 200);
  }, 2400);
}

// Sort
const SORT = { mode: STATE.sort || 'default' };
function applySort() {
  const mode = SORT.mode;
  document.querySelectorAll('.sort-btn').forEach((b) => b.classList.toggle('active', b.dataset.sort === mode));
  document.querySelectorAll('.group:not(.recent-group):not(.hidden-group) .grid').forEach((grid) => {
    const cards = [...grid.querySelectorAll('.skill')];
    cards.sort((a, b) => {
      if (mode === 'recent') {
        return (b.dataset.last || '').localeCompare(a.dataset.last || '');
      }
      if (mode === 'usage') {
        return parseInt(b.dataset.count || '0', 10) - parseInt(a.dataset.count || '0', 10);
      }
      return a.dataset.name.localeCompare(b.dataset.name);
    });
    cards.forEach((c) => grid.appendChild(c));
  });
}
document.querySelectorAll('.sort-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    SORT.mode = btn.dataset.sort;
    STATE.sort = SORT.mode;
    saveState();
    sfxClick();
    applySort();
  });
});
applySort();

// ---- Quick Bar interactions ----
function triggerSkill(name, file, opts) {
  vscode.postMessage({ type: 'copy', name, execMode: STATE.execMode || 'off' });
  const prefix = ({ paste: t('exec.prefixPaste'), auto: t('exec.prefixAuto'), terminal: t('exec.prefixTerminal') })[STATE.execMode] || t('exec.prefixPaste');
  showToast('▶ ' + prefix + ': /' + name);
  sfxCopy();
  if (opts && opts.element) {
    opts.element.classList.add('copied');
    setTimeout(() => opts.element.classList.remove('copied'), 600);
    petToCard(opts.element);
    spawnRipple(opts.element, opts.event);
  }
}
// Track in-flight slot drag (DataTransfer.types is only readable in dragenter/over,
// so we mirror it here for click-to-clear UX).
let draggingSlotIdx = null;
const QUICK_MIME = 'application/x-quickbar-slot';

document.querySelectorAll('.qslot').forEach((slot) => {
  const isLocked = () => slot.classList.contains('locked');
  slot.addEventListener('mouseenter', () => { if (!isLocked()) sfxHover(); });
  slot.addEventListener('click', () => {
    if (isLocked()) {
      showToast(t('toast.locked'));
      return;
    }
    if (slot.classList.contains('filled')) {
      triggerSkill(slot.dataset.name, slot.dataset.file, { element: slot });
    } else {
      showToast(t('toast.dragHint', { key: slot.dataset.key }));
    }
  });
  slot.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    if (isLocked()) return;
    if (slot.classList.contains('filled')) {
      vscode.postMessage({ type: 'setQuickbar', slot: parseInt(slot.dataset.slot, 10), name: null });
      sfxClick();
      showToast(t('toast.slotEmpty', { key: slot.dataset.key }));
    }
  });

  // Filled slots are draggable: enables swap with another slot,
  // and drag-out-of-panel to clear.
  if (slot.classList.contains('filled')) {
    slot.addEventListener('dragstart', (e) => {
      const fromIdx = parseInt(slot.dataset.slot, 10);
      draggingSlotIdx = fromIdx;
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData(QUICK_MIME, String(fromIdx));
      e.dataTransfer.setData('text/plain', slot.dataset.name);
      slot.classList.add('dragging');
    });
    slot.addEventListener('dragend', (e) => {
      slot.classList.remove('dragging');
      const idx = draggingSlotIdx;
      draggingSlotIdx = null;
      // dropEffect === 'none' means the drag was released over no valid drop
      // target (anywhere outside the Quick Bar). Treat that as "clear slot".
      if (e.dataTransfer.dropEffect === 'none' && idx !== null) {
        vscode.postMessage({ type: 'setQuickbar', slot: idx, name: null });
        sfxClick();
        showToast(t('toast.slotEmpty', { key: slot.dataset.key }));
      }
    });
  }

  slot.addEventListener('dragover', (e) => {
    if (isLocked()) return;
    const isSlotDrag = e.dataTransfer.types.includes(QUICK_MIME);
    e.preventDefault();
    e.dataTransfer.dropEffect = isSlotDrag ? 'move' : 'copy';
    // Don't highlight when hovering source slot during slot-to-slot drag
    if (!(isSlotDrag && draggingSlotIdx === parseInt(slot.dataset.slot, 10))) {
      slot.classList.add('dragover');
    }
  });
  slot.addEventListener('dragleave', () => slot.classList.remove('dragover'));
  slot.addEventListener('drop', (e) => {
    if (isLocked()) return;
    e.preventDefault();
    slot.classList.remove('dragover');
    const fromSlotRaw = e.dataTransfer.getData(QUICK_MIME);
    const toIdx = parseInt(slot.dataset.slot, 10);
    if (fromSlotRaw !== '') {
      const fromIdx = parseInt(fromSlotRaw, 10);
      if (fromIdx === toIdx) return;
      vscode.postMessage({ type: 'swapQuickbar', from: fromIdx, to: toIdx });
      sfxOpen();
      pulseSlot(slot);
      return;
    }
    const name = e.dataTransfer.getData('text/plain');
    if (!name) return;
    vscode.postMessage({ type: 'setQuickbar', slot: toIdx, name });
    sfxOpen();
    pulseSlot(slot);
    showToast(t('toast.slotRegistered', { key: slot.dataset.key, name }));
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (modalBg.classList.contains('show')) closeModal();
    else if (achvBg.classList.contains('show')) achvBg.classList.remove('show');
    else if (reportBg.classList.contains('show')) reportBg.classList.remove('show');
  }
  if (e.key === 'Escape' && modalBg.classList.contains('show')) return;
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && modalBg.classList.contains('show')) {
    document.getElementById('m-save').click();
  }
  // Number 1-6 → quick slot trigger
  const tag = (e.target && e.target.tagName) || '';
  if (tag === 'INPUT' || tag === 'TEXTAREA') return;
  if (modalBg.classList.contains('show')) return;
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const n = parseInt(e.key, 10);
  if (n >= 1 && n <= 6) {
    const slot = document.querySelector('.qslot[data-slot="' + (n - 1) + '"]');
    if (slot && slot.classList.contains('filled') && !slot.classList.contains('locked')) {
      e.preventDefault();
      triggerSkill(slot.dataset.name, slot.dataset.file, { element: slot });
    }
  }
});

document.querySelectorAll('.skill').forEach((el) => {
  el.draggable = true;
  el.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', el.dataset.name);
    e.dataTransfer.effectAllowed = 'copy';
    el.classList.add('dragging');
  });
  el.addEventListener('dragend', () => el.classList.remove('dragging'));
  el.addEventListener('mouseenter', () => { sfxHover(); spawnHoverParticles(el); });
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      e.stopPropagation();
      sfxOpen();
      openEditModal(el);
      return;
    }
    const name = el.dataset.name;
    vscode.postMessage({ type: 'copy', name, execMode: STATE.execMode || 'off' });
    el.classList.add('copied');
    sfxCopy();
    petToCard(el);
    spawnRipple(el, e);
    setTimeout(() => el.classList.remove('copied'), 600);
    const prefix = ({ paste: t('exec.prefixPaste'), auto: t('exec.prefixAuto'), terminal: t('exec.prefixTerminal') })[STATE.execMode] || t('exec.prefixPaste');
    showToast('▶ ' + prefix + ': /' + name);
  });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sfxClick();
    vscode.postMessage({ type: 'open', file: el.dataset.file });
  });
});

// Onboarding install button
const onbInstall = document.getElementById('onb-install');
if (onbInstall) {
  onbInstall.addEventListener('click', () => {
    sfxClick();
    vscode.postMessage({
      type: 'runRawCommand',
      command: '/plugin install superpowers@claude-plugins-official',
    });
    showToast(t('toast.onbInstallTriggered'));
  });
}

// ---- Search: fuzzy scoring + keyboard navigation ----
function fuzzyScore(q, hay) {
  if (!q) return 0;
  if (!hay) return 0;
  q = q.toLowerCase();
  hay = hay.toLowerCase();
  if (hay === q) return 1000;
  if (hay.startsWith(q)) return 500 + (1 - hay.length / 100);
  const idx = hay.indexOf(q);
  if (idx >= 0) return 200 - idx; // earlier match = higher score
  // Subsequence match: every char in q appears in hay in order
  let i = 0;
  for (let j = 0; j < hay.length && i < q.length; j++) {
    if (hay[j] === q[i]) i++;
  }
  if (i === q.length) return 50;
  return 0;
}

function applySearch() {
  const raw = search.value.trim();
  // Slash-prefix mode: leading /name treats input as a literal command,
  // even if no skill matches. Enter triggers the raw command directly.
  search.dataset.rawSlash = raw.startsWith('/') ? raw : '';
  const q = raw.replace(/^\\//, '').toLowerCase();
  const cards = [...document.querySelectorAll('.skill')];
  const scored = cards.map((el) => {
    const name = el.dataset.name || '';
    const alias = el.dataset.alias && el.dataset.alias !== name ? el.dataset.alias : '';
    const note = el.dataset.note || '';
    const score = q
      ? Math.max(
          fuzzyScore(q, alias) * 1.5,
          fuzzyScore(q, name),
          fuzzyScore(q, note) * 0.4
        )
      : 0;
    return { el, score };
  });
  // Hide non-matches when searching
  scored.forEach(({ el, score }) => {
    el.style.display = !q || score > 0 ? '' : 'none';
    el.dataset.score = String(score);
  });
  document.querySelectorAll('.group').forEach((g) => {
    const visible = [...g.querySelectorAll('.skill')].some((el) => el.style.display !== 'none');
    g.style.display = visible ? '' : 'none';
  });
  // Reorder visible cards within each grid by score (best first) when searching
  if (q) {
    document.querySelectorAll('.grid').forEach((grid) => {
      const visible = [...grid.querySelectorAll('.skill')].filter((el) => el.style.display !== 'none');
      visible.sort((a, b) => Number(b.dataset.score || 0) - Number(a.dataset.score || 0));
      visible.forEach((el) => grid.appendChild(el));
    });
  }
  // Reset focus index
  searchFocusIdx = -1;
  document.querySelectorAll('.skill.keyfocus').forEach((el) => el.classList.remove('keyfocus'));
}
search.addEventListener('input', applySearch);

let searchFocusIdx = -1;
function visibleCards() {
  return [...document.querySelectorAll('.skill')].filter((el) => el.style.display !== 'none' && !el.closest('.hidden-group'));
}
function setSearchFocus(idx) {
  const cards = visibleCards();
  if (!cards.length) { searchFocusIdx = -1; return; }
  if (idx < 0) idx = 0;
  if (idx >= cards.length) idx = cards.length - 1;
  searchFocusIdx = idx;
  document.querySelectorAll('.skill.keyfocus').forEach((el) => el.classList.remove('keyfocus'));
  cards[idx].classList.add('keyfocus');
  cards[idx].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
search.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    setSearchFocus(searchFocusIdx + 1);
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    setSearchFocus(searchFocusIdx - 1);
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const slash = search.dataset.rawSlash;
    if (slash) {
      const name = slash.replace(/^\\//, '');
      vscode.postMessage({ type: 'copy', name, execMode: STATE.execMode || 'off' });
      sfxCopy();
      const prefix = ({ paste: t('exec.prefixPaste'), auto: t('exec.prefixAuto'), terminal: t('exec.prefixTerminal') })[STATE.execMode] || t('exec.prefixPaste');
      showToast('▶ ' + prefix + ': /' + name);
      return;
    }
    const cards = visibleCards();
    const target = cards[searchFocusIdx >= 0 ? searchFocusIdx : 0];
    if (target) target.click();
  } else if (e.key === 'Escape') {
    if (search.value) {
      search.value = '';
      applySearch();
    } else {
      search.blur();
    }
  }
});

// Auto-focus the search bar when the panel mounts (cheap WX win).
setTimeout(() => { try { search.focus(); } catch {} }, 100);

// ---- Telemetry banner ----
const tlmBanner = document.getElementById('tlm-banner');
function setTelemetry(value) {
  vscode.postMessage({ type: 'setTelemetry', value });
  if (tlmBanner) tlmBanner.style.display = 'none';
}
const tlmOnBtn = document.getElementById('tlm-banner-on');
const tlmOffBtn = document.getElementById('tlm-banner-off');
if (tlmOnBtn) tlmOnBtn.addEventListener('click', () => setTelemetry('on'));
if (tlmOffBtn) tlmOffBtn.addEventListener('click', () => setTelemetry('off'));

// ---- Marketplace browser ----
const marketBg = document.getElementById('market-bg');
const marketBtn = document.getElementById('market-btn');
const marketCloseBtn = document.getElementById('market-close');
const marketList = document.getElementById('market-list');
const marketStatus = document.getElementById('market-status');
const marketSearchInput = document.getElementById('market-search');
const marketCatSel = document.getElementById('market-cat');
const marketInstalledOnly = document.getElementById('market-installed-only');
let marketCatalog = null;
function openMarketplace() {
  marketBg.classList.add('show');
  sfxOpen();
  if (!marketCatalog) {
    marketStatus.textContent = t('modal.market.loading');
    vscode.postMessage({ type: 'loadMarketplaceCatalog' });
  }
}
if (marketBtn) marketBtn.addEventListener('click', openMarketplace);
if (marketCloseBtn) marketCloseBtn.addEventListener('click', () => marketBg.classList.remove('show'));
if (marketBg) marketBg.addEventListener('click', (e) => { if (e.target === marketBg) marketBg.classList.remove('show'); });
function renderMarketList() {
  if (!marketCatalog) return;
  const q = (marketSearchInput.value || '').trim().toLowerCase();
  const cat = marketCatSel.value;
  const installedOnly = marketInstalledOnly.checked;
  const items = marketCatalog.plugins.filter((p) => {
    if (installedOnly && !p.installed) return false;
    if (cat && cat !== '__all__' && p.category !== cat) return false;
    if (q) {
      const hay = (p.name + ' ' + (p.description || '') + ' ' + (p.author || '') + ' ' + (p.category || '')).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  // Installed first, then alphabetical
  items.sort((a, b) => {
    if (a.installed !== b.installed) return a.installed ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  marketStatus.textContent = t('modal.market.count', { shown: items.length, total: marketCatalog.plugins.length });
  marketList.innerHTML = items.slice(0, 200).map((p) => {
    const safeName = p.name.replace(/[<>"']/g, '');
    const desc = (p.description || '').replace(/[<>"']/g, '').slice(0, 220);
    const installCmd = '/plugin install ' + safeName + '@' + p.marketplace;
    return '<div class="market-card ' + (p.installed ? 'installed' : '') + '">' +
      '<div class="market-name">' + safeName + ' <span class="market-cat">' + (p.category || '') + '</span></div>' +
      '<div class="market-desc">' + desc + '</div>' +
      '<div class="market-meta">' + (p.author ? '<span>' + p.author.replace(/[<>"']/g, '') + '</span>' : '') +
        ' <code>' + p.marketplace + '</code></div>' +
      '<div class="market-actions">' +
        (p.installed
          ? '<span class="market-badge">✓ ' + t('modal.market.installed') + '</span>'
          : '<button class="btn btn-primary market-install-btn" data-cmd="' + installCmd.replace(/"/g, '&quot;') + '" type="button">' + t('modal.market.install') + '</button>') +
        (p.homepage ? '<a class="market-link" data-url="' + p.homepage.replace(/"/g, '&quot;') + '" href="#">' + t('modal.market.home') + '</a>' : '') +
      '</div>' +
    '</div>';
  }).join('');
  marketList.querySelectorAll('.market-install-btn').forEach((b) => {
    b.addEventListener('click', () => {
      vscode.postMessage({ type: 'runRawCommand', command: b.dataset.cmd });
      sfxClick();
      showToast(t('modal.market.installTriggered'));
    });
  });
  marketList.querySelectorAll('.market-link').forEach((a) => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      vscode.postMessage({ type: 'openExternal', url: a.dataset.url });
    });
  });
}
if (marketSearchInput) marketSearchInput.addEventListener('input', renderMarketList);
if (marketCatSel) marketCatSel.addEventListener('change', renderMarketList);
if (marketInstalledOnly) marketInstalledOnly.addEventListener('change', renderMarketList);

// ---- Settings (export/import + telemetry) ----
const settingsBg = document.getElementById('settings-bg');
const settingsBtn = document.getElementById('settings-btn');
if (settingsBtn) settingsBtn.addEventListener('click', () => { settingsBg.classList.add('show'); sfxOpen(); refreshTlmStatus(); });
const settingsCloseBtn = document.getElementById('settings-close');
if (settingsCloseBtn) settingsCloseBtn.addEventListener('click', () => settingsBg.classList.remove('show'));
if (settingsBg) settingsBg.addEventListener('click', (e) => { if (e.target === settingsBg) settingsBg.classList.remove('show'); });
const settingsExportBtn = document.getElementById('settings-export');
if (settingsExportBtn) settingsExportBtn.addEventListener('click', () => {
  vscode.postMessage({ type: 'exportSettings' });
  sfxClick();
});
const settingsImportBtn = document.getElementById('settings-import-btn');
const settingsImportText = document.getElementById('settings-import-text');
if (settingsImportBtn) settingsImportBtn.addEventListener('click', () => {
  const json = (settingsImportText.value || '').trim();
  if (!json) return;
  if (!confirm(t('modal.settings.importConfirm'))) return;
  vscode.postMessage({ type: 'importSettings', json });
  sfxClick();
});
function refreshTlmStatus() {
  const el = document.getElementById('tlm-status');
  if (el) el.textContent = t('modal.settings.telemetryCurrent', { value: STR['modal.settings.telemetry' + (window.__telemetry === 'on' ? 'On' : 'Off')] || (window.__telemetry || 'unset') });
}
const tlmOn2 = document.getElementById('tlm-on');
const tlmOff2 = document.getElementById('tlm-off');
if (tlmOn2) tlmOn2.addEventListener('click', () => { setTelemetry('on'); window.__telemetry = 'on'; refreshTlmStatus(); });
if (tlmOff2) tlmOff2.addEventListener('click', () => { setTelemetry('off'); window.__telemetry = 'off'; refreshTlmStatus(); });

// Footer external links (asWebviewUri/CSP can be picky; route through host)
const footerRate = document.getElementById('footer-rate');
const footerIssue = document.getElementById('footer-issue');
if (footerRate) footerRate.addEventListener('click', (e) => {
  e.preventDefault();
  vscode.postMessage({ type: 'openExternal', url: 'https://marketplace.visualstudio.com/items?itemName=parksubeom.claude-skills-panel&ssr=false#review-details' });
});
if (footerIssue) footerIssue.addEventListener('click', (e) => {
  e.preventDefault();
  vscode.postMessage({ type: 'openExternal', url: 'https://github.com/parksubeom/claude-skills-panel/issues/new' });
});
</script>
</body>
</html>`;
}

class SkillsViewProvider {
  constructor(context) {
    this.context = context;
    this.views = new Set();
  }
  resolveWebviewView(webviewView) {
    this.views.add(webviewView);
    webviewView.onDidDispose(() => this.views.delete(webviewView));
    fs.mkdirSync(userConfig.ICONS_DIR, { recursive: true });
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(path.join(this.context.extensionPath, 'assets')),
        vscode.Uri.file(userConfig.ICONS_DIR),
      ],
    };
    const skills = loadAllSkills();
    webviewView.webview.html = renderHtml(webviewView.webview, skills);
    webviewView.webview.onDidReceiveMessage(async (msg) => {
      if (msg.type === 'copy' && msg.name) {
        await vscode.env.clipboard.writeText('/' + msg.name);
        await dispatchExec(msg.name, msg.execMode || 'off');
        const result = userConfig.recordUsage(msg.name);
        vscode.window.setStatusBarMessage('Copied: /' + msg.name, 2000);
        for (const v of this.views) {
          v.webview.postMessage({ type: 'usageRecorded', name: msg.name, ...result });
        }
        clearTimeout(this._copyRefreshTimer);
        this._copyRefreshTimer = setTimeout(() => this.refresh(), 1200);
      } else if (msg.type === 'open' && msg.file) {
        const doc = await vscode.workspace.openTextDocument(msg.file);
        vscode.window.showTextDocument(doc);
      } else if (msg.type === 'setQuickbar' && typeof msg.slot === 'number') {
        userConfig.setQuickbar(msg.slot, msg.name || null);
        clearTimeout(this._quickRefreshTimer);
        this._quickRefreshTimer = setTimeout(() => this.refresh(), 150);
      } else if (msg.type === 'swapQuickbar' && typeof msg.from === 'number' && typeof msg.to === 'number') {
        userConfig.swapQuickbar(msg.from, msg.to);
        clearTimeout(this._quickRefreshTimer);
        this._quickRefreshTimer = setTimeout(() => this.refresh(), 150);
      } else if (msg.type === 'openExternal' && typeof msg.url === 'string') {
        vscode.env.openExternal(vscode.Uri.parse(msg.url));
      } else if (msg.type === 'loadMarketplaceCatalog') {
        const catalog = loadMarketplaceCatalog();
        for (const v of this.views) {
          v.webview.postMessage({ type: 'marketplaceCatalog', catalog });
        }
      } else if (msg.type === 'exportSettings') {
        const cfg = userConfig.read();
        const json = JSON.stringify(cfg, null, 2);
        await vscode.env.clipboard.writeText(json);
        for (const v of this.views) {
          v.webview.postMessage({ type: 'toast', key: 'toast.settingsExported' });
        }
      } else if (msg.type === 'importSettings' && typeof msg.json === 'string') {
        try {
          const incoming = JSON.parse(msg.json);
          if (!incoming || typeof incoming !== 'object') throw new Error('not object');
          // Sanity: refuse anything that doesn't look like our config
          if (!('skills' in incoming) && !('meta' in incoming)) throw new Error('not config');
          userConfig.write(incoming);
          this.refresh();
          for (const v of this.views) {
            v.webview.postMessage({ type: 'toast', key: 'toast.settingsImported' });
          }
        } catch (e) {
          for (const v of this.views) {
            v.webview.postMessage({ type: 'toast', key: 'toast.settingsImportFailed' });
          }
        }
      } else if (msg.type === 'setTelemetry' && (msg.value === 'on' || msg.value === 'off')) {
        const cfg = userConfig.read();
        if (!cfg.meta) cfg.meta = {};
        cfg.meta.telemetry = msg.value;
        userConfig.write(cfg);
        this.refresh();
      } else if (msg.type === 'runRawCommand' && typeof msg.command === 'string') {
        // Dispatched by onboarding "install superpowers" button.
        // Routes the literal slash command to wherever the user's exec mode
        // says: clipboard, auto-paste, or active terminal.
        const text = msg.command;
        await vscode.env.clipboard.writeText(text);
        const cfg = userConfig.read();
        const mode = (cfg.meta && cfg.meta.execMode) || 'paste';
        if (mode === 'terminal') {
          let term = vscode.window.activeTerminal;
          if (!term) {
            const named = vscode.window.terminals.find((tt) => /claude/i.test(tt.name));
            term = named || vscode.window.terminals[0];
          }
          if (!term) term = vscode.window.createTerminal('Claude');
          term.show(true);
          term.sendText(text, true);
        } else if (mode === 'auto') {
          await tryFocus();
          await new Promise((r) => setTimeout(r, 80));
          osKeystroke(true);
        }
        // For 'paste' mode, the clipboard write above is enough — user pastes manually.
      } else if (msg.type === 'copyWeeklyMarkdown' && typeof msg.markdown === 'string') {
        await vscode.env.clipboard.writeText(msg.markdown);
        for (const v of this.views) {
          v.webview.postMessage({ type: 'toast', key: 'toast.weeklyCopied' });
        }
      } else if (msg.type === 'saveWeeklyMarkdown' && typeof msg.markdown === 'string') {
        const today = new Date().toISOString().slice(0, 10);
        const ws = vscode.workspace.workspaceFolders;
        const defaultUri = vscode.Uri.file(
          path.join(ws && ws[0] ? ws[0].uri.fsPath : os.homedir(), `claude-skills-weekly-${today}.md`)
        );
        const target = await vscode.window.showSaveDialog({
          defaultUri,
          filters: { Markdown: ['md'] },
        });
        if (target) {
          fs.writeFileSync(target.fsPath, msg.markdown);
          for (const v of this.views) {
            v.webview.postMessage({ type: 'toast', key: 'toast.weeklySaved' });
          }
        }
      } else if (msg.type === 'reincarnate') {
        userConfig.reincarnate();
        this.refresh();
      } else if (msg.type === 'setBuddyName') {
        userConfig.setCharacterName(msg.name || '');
        clearTimeout(this._buddyRefreshTimer);
        this._buddyRefreshTimer = setTimeout(() => this.refresh(), 200);
      } else if (msg.type === 'saveConfig' && msg.name) {
        const cfg = userConfig.read();
        if (!cfg.skills[msg.name]) cfg.skills[msg.name] = {};
        if (msg.alias) cfg.skills[msg.name].alias = msg.alias; else delete cfg.skills[msg.name].alias;
        if (msg.note) cfg.skills[msg.name].note = msg.note; else delete cfg.skills[msg.name].note;
        if (msg.hidden) cfg.skills[msg.name].hidden = true; else delete cfg.skills[msg.name].hidden;
        if (msg.group !== undefined) {
          if (msg.group) cfg.skills[msg.name].group = msg.group;
          else delete cfg.skills[msg.name].group;
        }
        if (msg.clearIcon) {
          const oldIcon = cfg.skills[msg.name].iconPath;
          if (oldIcon) {
            const abs = userConfig.resolveIconPath(oldIcon);
            if (abs && abs.startsWith(userConfig.ICONS_DIR)) {
              try { fs.unlinkSync(abs); } catch {}
            }
          }
          delete cfg.skills[msg.name].iconPath;
          delete cfg.skills[msg.name].sparkIcon;
        }
        if (msg.sparkIcon) {
          cfg.skills[msg.name].sparkIcon = msg.sparkIcon;
          delete cfg.skills[msg.name].iconPath; // spark overrides upload
        } else if (msg.sparkIcon === null && !msg.clearIcon) {
          // keep existing sparkIcon if not explicitly clearing
        }
        if (Object.keys(cfg.skills[msg.name]).length === 0) delete cfg.skills[msg.name];
        userConfig.write(cfg);
        this.refresh();
      } else if (msg.type === 'setLocale' && msg.locale) {
        userConfig.setLocale(msg.locale);
        this.refresh();
      } else if (msg.type === 'setTheme' && msg.theme) {
        userConfig.setTheme(msg.theme);
        this.refresh();
      } else if (msg.type === 'addGroup' && msg.name) {
        userConfig.addGroup({ name: msg.name, emoji: msg.emoji });
        this.refresh();
      } else if (msg.type === 'renameGroup' && msg.id) {
        userConfig.renameGroup(msg.id, msg.name, msg.emoji);
        this.refresh();
      } else if (msg.type === 'removeGroup' && msg.id) {
        userConfig.removeGroup(msg.id);
        this.refresh();
      } else if (msg.type === 'reorderGroups' && Array.isArray(msg.ids)) {
        userConfig.reorderGroups(msg.ids);
        this.refresh();
      } else if (msg.type === 'setSkillGroup' && msg.name) {
        const cfg2 = userConfig.read();
        if (!cfg2.skills[msg.name]) cfg2.skills[msg.name] = {};
        if (msg.group) cfg2.skills[msg.name].group = msg.group;
        else delete cfg2.skills[msg.name].group;
        if (Object.keys(cfg2.skills[msg.name]).length === 0) delete cfg2.skills[msg.name];
        userConfig.write(cfg2);
        this.refresh();
      } else if (msg.type === 'pickIcon' && msg.name) {
        const picked = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: i18n.tFor(i18n.resolveLocale(userConfig.getLocale(), vscode.env.language))('dialog.iconOpenLabel'),
          filters: { Images: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp'] },
        });
        if (!picked || !picked[0]) return;
        const src = picked[0].fsPath;
        const ext = path.extname(src).toLowerCase() || '.png';
        const safeName = msg.name.replace(/[^a-zA-Z0-9_-]/g, '_');
        const destFile = `${safeName}${ext}`;
        const dest = path.join(userConfig.ICONS_DIR, destFile);
        fs.mkdirSync(userConfig.ICONS_DIR, { recursive: true });
        fs.copyFileSync(src, dest);
        const cfg = userConfig.read();
        if (!cfg.skills[msg.name]) cfg.skills[msg.name] = {};
        // Clean up older icon file if extension differs
        const prev = cfg.skills[msg.name].iconPath;
        if (prev) {
          const prevAbs = userConfig.resolveIconPath(prev);
          if (prevAbs && prevAbs !== dest && prevAbs.startsWith(userConfig.ICONS_DIR)) {
            try { fs.unlinkSync(prevAbs); } catch {}
          }
        }
        cfg.skills[msg.name].iconPath = path.join('skills-panel-icons', destFile);
        userConfig.write(cfg);
        const uri = webviewView.webview.asWebviewUri(vscode.Uri.file(dest)).toString();
        // size left empty — webview JS reads naturalWidth/naturalHeight on load
        for (const v of this.views) {
          v.webview.postMessage({ type: 'iconPicked', name: msg.name, uri });
        }
        // Don't refresh() here — would wipe open modal
      }
    });
  }
  refresh() {
    const skills = loadAllSkills();
    for (const v of this.views) {
      v.webview.html = renderHtml(v.webview, skills);
    }
  }
}

function activate(context) {
  loadPixelManifest(context.extensionPath);
  const provider = new SkillsViewProvider(context);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider('claudeSkillsGridSidebar', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.window.registerWebviewViewProvider('claudeSkillsGridPanel', provider, {
      webviewOptions: { retainContextWhenHidden: true },
    }),
    vscode.commands.registerCommand('claudeSkills.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('claudeSkills.show', () => {
      vscode.commands.executeCommand('workbench.view.extension.claudeSkillsPanel');
    }),
    vscode.commands.registerCommand('claudeSkills.openConfig', async () => {
      const doc = await vscode.workspace.openTextDocument(userConfig.CONFIG_PATH);
      vscode.window.showTextDocument(doc);
    }),
    vscode.commands.registerCommand('claudeSkills.showAchievements', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.claudeSkillsPanel');
      for (const v of provider.views) v.webview.postMessage({ type: 'showAchievements' });
    }),
    vscode.commands.registerCommand('claudeSkills.showWeeklyReport', async () => {
      await vscode.commands.executeCommand('workbench.view.extension.claudeSkillsPanel');
      for (const v of provider.views) v.webview.postMessage({ type: 'showWeeklyReport' });
    })
  );

  // Global quick-slot commands (user can bind to keybindings.json)
  for (let i = 0; i < 6; i++) {
    const slotIndex = i;
    context.subscriptions.push(
      vscode.commands.registerCommand(`claudeSkills.quickSlot${slotIndex + 1}`, async () => {
        const meta = userConfig.getMeta();
        const name = meta.quickbar && meta.quickbar[slotIndex];
        if (!name) {
          vscode.window.showInformationMessage(
            i18n.tFor(i18n.resolveLocale(userConfig.getLocale(), vscode.env.language))(
              'status.quickSlotEmpty',
              { n: slotIndex + 1 }
            )
          );
          return;
        }
        await vscode.env.clipboard.writeText('/' + name);
        const result = userConfig.recordUsage(name);
        vscode.window.setStatusBarMessage(`Copied: /${name}`, 2000);
        for (const v of provider.views) {
          v.webview.postMessage({ type: 'usageRecorded', name, ...result });
        }
        clearTimeout(provider._copyRefreshTimer);
        provider._copyRefreshTimer = setTimeout(() => provider.refresh(), 1200);
      })
    );
  }

  // Auto-refresh when SKILL.md changes
  const home = os.homedir();
  const skillWatcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(path.join(home, '.claude'), '**/SKILL.md')
  );
  skillWatcher.onDidChange(() => provider.refresh());
  skillWatcher.onDidCreate(() => provider.refresh());
  skillWatcher.onDidDelete(() => provider.refresh());
  context.subscriptions.push(skillWatcher);

  // (config file watcher intentionally omitted — would wipe open edit modals.
  //  Use the refresh command or panel toolbar refresh after manual edits.)
}

function deactivate() {}

module.exports = { activate, deactivate };
