const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pickIcon } = require('./iconMap');
const userConfig = require('./userConfig');

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

function walkSkills(rootDir, group, seen) {
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
            });
          }
        } catch {}
      }
    }
  }
  return results;
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
  sources.push({ dir: path.join(home, '.claude', 'plugins', 'cache'), group: 'plugin' });

  const seen = new Set();
  const all = [];
  for (const s of sources) all.push(...walkSkills(s.dir, s.group, seen));
  all.sort((a, b) => {
    const order = { user: 0, project: 1, plugin: 2 };
    if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
    return a.name.localeCompare(b.name);
  });
  return all;
}

const GROUP_LABELS = {
  user: { label: '내 스킬', sub: '~/.claude/skills', emoji: '📁' },
  project: { label: '프로젝트', sub: '.claude/skills', emoji: '📂' },
  plugin: { label: '플러그인', sub: 'superpowers / etc.', emoji: '🧩' },
};

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
  const enriched = skills.map((s) => userConfig.applyOverrides(s, cfg));

  const grouped = {};
  for (const s of enriched) {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  }
  const order = ['user', 'project', 'plugin'];

  // Recently used: top 6 by lastUsed (excludes hidden)
  const recents = enriched
    .filter((s) => !s.hidden && s.usage.lastUsed)
    .sort((a, b) => new Date(b.usage.lastUsed) - new Date(a.usage.lastUsed))
    .slice(0, 6);

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
    const abs = userConfig.resolveIconPath(cfgEntry.iconPath);
    if (!abs) return null;
    return webview.asWebviewUri(vscode.Uri.file(abs)).toString();
  };

  const sections = order
    .filter((g) => grouped[g] && grouped[g].length)
    .map((g) => {
      const meta = GROUP_LABELS[g];
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
          return `
            <button class="skill"
              data-name="${original}"
              data-file="${escapeHtml(s.file)}"
              data-alias="${escapeHtml(s.label)}"
              data-note="${escapeHtml(s.note)}"
              data-hidden="${s.hidden ? '1' : '0'}"
              data-icon-uri="${escapeHtml(userIconUriFor(s) || '')}"
              data-count="${s.usage.count}"
              data-last="${s.usage.lastUsed || ''}"
              data-level="${s.level}">
              ${kindBadge}
              ${lvBadge}
              <span class="edit-btn" title="편집">✎</span>
              ${iconHtml}
              <div class="skill-name">${label}</div>
              ${aliased ? `<div class="skill-original">/${original}</div>` : ''}
              ${starsHtml}
              <div class="hover-card">
                <div class="hover-name">${label}${aliased ? ` <span class="hover-alias">/${original}</span>` : ''}</div>
                <div class="hover-desc">${desc || '<i>설명 없음</i>'}</div>
                <div class="hover-meta">
                  ${s.usage.count ? `사용 ${s.usage.count}회 · LV.${s.level}` : '<i>아직 사용 안함</i>'}
                </div>
                <div class="hover-hint">클릭 → /${original} 복사</div>
              </div>
            </button>`;
        })
        .join('');
      return `
        <section class="group">
          <header>
            <span class="group-icon">${meta.emoji}</span>
            <h3>${meta.label}</h3>
            <span class="sub">(${meta.sub} · ${visible.length}${visible.length !== grouped[g].length ? `/${grouped[g].length}` : ''})</span>
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
        data-count="${s.usage.count}"
        data-last="${s.usage.lastUsed || ''}"
        data-level="${s.level}">
        ${kindBadge}
        ${lvBadge}
        <span class="edit-btn" title="편집">✎</span>
        ${iconHtml}
        <div class="skill-name">${label}</div>
        ${s.level > 0 ? renderStars(s.level) : '<span class="stars lv0">☆☆☆☆☆</span>'}
        <div class="hover-card">
          <div class="hover-name">${label}${aliased ? ` <span class="hover-alias">/${original}</span>` : ''}</div>
          <div class="hover-desc">${desc || '<i>설명 없음</i>'}</div>
          <div class="hover-meta">사용 ${s.usage.count}회 · LV.${s.level}</div>
          <div class="hover-hint">클릭 → /${original} 복사</div>
        </div>
      </button>`;
  };
  const recentSection = recents.length
    ? `<section class="group recent-group">
        <header>
          <span class="group-icon">⏱</span>
          <h3>최근 사용</h3>
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
          <h3>숨김</h3>
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
                <span class="edit-btn" title="편집">✎</span>
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
  :root {
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
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 14px;
    font-family: 'DotGothic16', 'Press Start 2P', 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
    color: var(--fg);
    background:
      /* vignette */
      radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.5) 100%),
      /* dot grid */
      radial-gradient(circle, rgba(125, 211, 252, 0.06) 1px, transparent 1px) 0 0/16px 16px,
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
    grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
    gap: 10px;
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
  .skill {
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px 10px;
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
    width: 48px; height: 48px;
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
    display: block;
    font-size: 10px;
    letter-spacing: 1px;
    line-height: 1;
    margin-top: 2px;
    user-select: none;
    text-shadow: 0 0 4px currentColor;
  }
  .stars.lv0 { color: var(--frame); text-shadow: none; }
  .stars.lv1 { color: #94a3b8; }
  .stars.lv2 { color: var(--good); }
  .stars.lv3 { color: var(--accent); }
  .stars.lv4 { color: var(--magenta); }
  .stars.lv5 { color: var(--accent-2); }
  .lv-badge {
    position: absolute;
    bottom: 4px;
    right: 4px;
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
  .recent-group .grid { grid-template-columns: repeat(auto-fill, minmax(96px, 1fr)); }
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
    left: 4px;
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
  }
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
    transition: opacity 0.15s 0.25s;
    z-index: 100;
    white-space: normal;
  }
  .skill:hover .hover-card { opacity: 1; }
  .hover-name { font-weight: 700; color: var(--accent); margin-bottom: 4px; }
  .hover-alias { color: var(--muted); font-weight: 400; font-size: 10px; }
  .hover-desc { color: #cbd5e1; margin-bottom: 6px; }
  .hover-hint { color: var(--muted); font-size: 10px; border-top: 1px dashed #374151; padding-top: 4px; }


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
  }
  .footer .sep { opacity: 0.5; }
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
<body>
  <div class="toolbar">
    <span class="bracket-l">[</span>
    <input class="search" placeholder="검색창" id="search" />
    <span class="bracket-r">]</span>
    <div class="sort-group" role="tablist" aria-label="정렬">
      <button class="sort-btn active" data-sort="default" title="기본 정렬">☷</button>
      <button class="sort-btn" data-sort="recent" title="최근 사용">⏱</button>
      <button class="sort-btn" data-sort="usage" title="자주 사용">★</button>
    </div>
    <button class="sound-toggle" id="sound-toggle" title="사운드 on/off">♪</button>
    <button class="scanlines-toggle" id="scanlines-toggle" title="CRT 효과 on/off">▦</button>
  </div>
  <div id="content">${recentSection + sections + hiddenSection || '<div class="empty">스킬이 없습니다. ~/.claude/skills 에 SKILL.md 를 추가해보세요.</div>'}</div>
  <div class="footer">
    <span class="footer-streak" id="footer-streak">${meta.streak.days > 0 ? `🔥 ${meta.streak.days}일` : '🔥 0일'}</span>
    <span class="sep">|</span>
    <span class="footer-total" id="footer-total">📊 ${meta.totalCopies}회</span>
    <span class="sep">|</span>
    <span id="footer-hint">클릭 → 복사 · 우클릭 → SKILL.md · ✎ → 편집</span>
  </div>
  <div class="toast" id="toast"></div>

  <div class="modal-bg" id="modal-bg">
    <div class="modal" id="modal">
      <h4 id="modal-title">스킬 편집</h4>
      <label>별칭(Alias)</label>
      <input type="text" id="m-alias" placeholder="예: 오늘 시작" />
      <label>설명 메모(Note)</label>
      <textarea id="m-note" placeholder="이 스킬에 대한 개인 메모…"></textarea>
      <label>커스텀 아이콘 <span class="hint">(권장 64×64 / 정사각형 PNG·SVG)</span></label>
      <div class="icon-row">
        <div class="icon-preview" id="m-icon-preview">
          <div class="preview-empty">없음</div>
          <div class="preview-size" id="m-icon-size"></div>
        </div>
        <div class="icon-actions">
          <button class="btn" id="m-icon-upload" type="button">📤 업로드</button>
          <button class="btn btn-danger" id="m-icon-clear" type="button">제거</button>
        </div>
      </div>
      <div class="modal-row">
        <input type="checkbox" id="m-hidden" />
        <label for="m-hidden" style="margin: 0; font-size: 11px; color: var(--fg);">패널에서 숨기기</label>
      </div>
      <div class="modal-actions">
        <button class="btn btn-danger" id="m-reset">초기화</button>
        <button class="btn" id="m-cancel">취소</button>
        <button class="btn btn-primary" id="m-save">저장</button>
      </div>
    </div>
  </div>

<script>
const vscode = acquireVsCodeApi();
const search = document.getElementById('search');
const toast = document.getElementById('toast');
const soundBtn = document.getElementById('sound-toggle');
const scanlinesBtn = document.getElementById('scanlines-toggle');

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
const modalBg = document.getElementById('modal-bg');
const mAlias = document.getElementById('m-alias');
const mNote = document.getElementById('m-note');
const mHidden = document.getElementById('m-hidden');
const mTitle = document.getElementById('modal-title');
let toastTimer;
let editingSkill = null;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
}

let pendingIconClear = false;
const iconSizeEl = document.getElementById('m-icon-size');
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
    preview.innerHTML = '<div class="preview-empty">없음</div><div class="preview-size"></div>';
  }
}
function openEditModal(el) {
  editingSkill = el.dataset.name;
  mTitle.textContent = '스킬 편집 — /' + editingSkill;
  mAlias.value = el.dataset.alias && el.dataset.alias !== editingSkill ? el.dataset.alias : '';
  mNote.value = el.dataset.note || '';
  mHidden.checked = el.dataset.hidden === '1';
  pendingIconClear = false;
  setIconPreview(el.dataset.iconUri || '');
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
  showToast('저장 시 아이콘 제거됩니다');
});
window.addEventListener('message', (e) => {
  const m = e.data;
  if (m && m.type === 'iconPicked' && m.uri && editingSkill === m.name) {
    pendingIconClear = false;
    setIconPreview(m.uri, m.size);
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
    if (streakEl) streakEl.textContent = '🔥 ' + m.streak + '일';
    if (totalEl) totalEl.textContent = '📊 ' + m.totalCopies + '회';
  }
});

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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBg.classList.contains('show')) closeModal();
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && modalBg.classList.contains('show')) {
    document.getElementById('m-save').click();
  }
});

document.querySelectorAll('.skill').forEach((el) => {
  el.addEventListener('mouseenter', () => sfxHover());
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      e.stopPropagation();
      sfxOpen();
      openEditModal(el);
      return;
    }
    const name = el.dataset.name;
    vscode.postMessage({ type: 'copy', name });
    el.classList.add('copied');
    sfxCopy();
    setTimeout(() => el.classList.remove('copied'), 600);
    showToast('▶ /' + name);
  });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    sfxClick();
    vscode.postMessage({ type: 'open', file: el.dataset.file });
  });
});

search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  document.querySelectorAll('.skill').forEach((el) => {
    const hay = (el.dataset.name + ' ' + (el.dataset.alias || '') + ' ' + (el.dataset.note || '')).toLowerCase();
    el.style.display = !q || hay.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.group').forEach((g) => {
    const cards = [...g.querySelectorAll('.skill')];
    const visible = cards.some((el) => el.style.display !== 'none');
    g.style.display = visible ? '' : 'none';
  });
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
        const result = userConfig.recordUsage(msg.name);
        vscode.window.setStatusBarMessage('Copied: /' + msg.name, 2000);
        for (const v of this.views) {
          v.webview.postMessage({ type: 'usageRecorded', name: msg.name, ...result });
        }
        // Defer full refresh so card animation finishes first; updates "최근 사용" section
        clearTimeout(this._copyRefreshTimer);
        this._copyRefreshTimer = setTimeout(() => this.refresh(), 1200);
      } else if (msg.type === 'open' && msg.file) {
        const doc = await vscode.workspace.openTextDocument(msg.file);
        vscode.window.showTextDocument(doc);
      } else if (msg.type === 'saveConfig' && msg.name) {
        const cfg = userConfig.read();
        if (!cfg.skills[msg.name]) cfg.skills[msg.name] = {};
        if (msg.alias) cfg.skills[msg.name].alias = msg.alias; else delete cfg.skills[msg.name].alias;
        if (msg.note) cfg.skills[msg.name].note = msg.note; else delete cfg.skills[msg.name].note;
        if (msg.hidden) cfg.skills[msg.name].hidden = true; else delete cfg.skills[msg.name].hidden;
        if (msg.clearIcon) {
          const oldIcon = cfg.skills[msg.name].iconPath;
          if (oldIcon) {
            const abs = userConfig.resolveIconPath(oldIcon);
            if (abs && abs.startsWith(userConfig.ICONS_DIR)) {
              try { fs.unlinkSync(abs); } catch {}
            }
          }
          delete cfg.skills[msg.name].iconPath;
        }
        if (Object.keys(cfg.skills[msg.name]).length === 0) delete cfg.skills[msg.name];
        userConfig.write(cfg);
        this.refresh();
      } else if (msg.type === 'pickIcon' && msg.name) {
        const picked = await vscode.window.showOpenDialog({
          canSelectMany: false,
          openLabel: '아이콘 선택',
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
    })
  );

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
