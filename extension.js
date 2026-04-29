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

function renderHtml(webview, skills) {
  const cfg = userConfig.read();
  const enriched = skills.map((s) => userConfig.applyOverrides(s, cfg));

  const grouped = {};
  for (const s of enriched) {
    if (!grouped[s.group]) grouped[s.group] = [];
    grouped[s.group].push(s);
  }
  const order = ['user', 'project', 'plugin'];

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
          return `
            <button class="skill"
              data-name="${original}"
              data-file="${escapeHtml(s.file)}"
              data-alias="${escapeHtml(s.label)}"
              data-note="${escapeHtml(s.note)}"
              data-hidden="${s.hidden ? '1' : '0'}"
              data-icon-uri="${escapeHtml(userIconUriFor(s) || '')}">
              ${kindBadge}
              <span class="edit-btn" title="편집">✎</span>
              ${iconHtml}
              <div class="skill-name">${label}</div>
              ${aliased ? `<div class="skill-original">/${original}</div>` : ''}
              <div class="hover-card">
                <div class="hover-name">${label}${aliased ? ` <span class="hover-alias">/${original}</span>` : ''}</div>
                <div class="hover-desc">${desc || '<i>설명 없음</i>'}</div>
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

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  :root {
    --bg: var(--vscode-panel-background, #1e1e1e);
    --fg: var(--vscode-foreground, #d4d4d4);
    --muted: var(--vscode-descriptionForeground, #888);
    --frame: #5a6273;
    --frame-strong: #2c3140;
    --tile-bg: var(--vscode-editorWidget-background, #252b3a);
    --tile-bg-2: #1a1f2c;
    --hover: var(--vscode-list-hoverBackground);
    --accent: #7dd3fc;
    --accent-2: #f59e0b;
    --good: #22c55e;
    --bad: #ef4444;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 14px;
    font-family: 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
    color: var(--fg);
    background: var(--bg);
    font-size: 12px;
  }
  .toolbar {
    display: flex;
    gap: 8px;
    align-items: center;
    margin-bottom: 14px;
    padding: 4px 6px;
    border: 2px solid var(--frame);
    border-radius: 6px;
    background: var(--tile-bg-2);
    box-shadow: inset 0 0 0 1px var(--frame-strong);
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
  .group h3 { margin: 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; }
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
  .skill {
    all: unset;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 6px 10px;
    border: 2px solid var(--frame);
    border-radius: 6px;
    background: linear-gradient(180deg, var(--tile-bg) 0%, var(--tile-bg-2) 100%);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04), 0 2px 0 0 var(--frame-strong);
    transition: transform 0.06s, border-color 0.12s, box-shadow 0.12s;
    text-align: center;
    position: relative;
  }
  .skill:hover {
    border-color: var(--accent);
    box-shadow:
      inset 0 0 0 1px rgba(125, 211, 252, 0.18),
      0 2px 0 0 var(--frame-strong),
      0 0 8px rgba(125, 211, 252, 0.25);
    z-index: 5;
  }
  .skill:active { transform: translateY(1px); }
  .skill.copied {
    border-color: var(--good);
    box-shadow: 0 2px 0 0 #14532d, 0 0 10px rgba(34, 197, 94, 0.4);
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
    bottom: 14px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--frame-strong);
    color: #fff;
    padding: 6px 14px;
    border: 2px solid var(--accent);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.18s;
    pointer-events: none;
    box-shadow: 0 2px 0 0 #000;
    z-index: 300;
  }
  .toast.show { opacity: 1; }
  .empty { color: var(--muted); text-align: center; padding: 24px; }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="bracket-l">[</span>
    <input class="search" placeholder="검색창" id="search" />
    <span class="bracket-r">]</span>
  </div>
  <div id="content">${sections + hiddenSection || '<div class="empty">스킬이 없습니다. ~/.claude/skills 에 SKILL.md 를 추가해보세요.</div>'}</div>
  <div class="footer">
    <span>🏁 Finish</span>
    <span class="sep">|</span>
    <span>🪄 skills</span>
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
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && modalBg.classList.contains('show')) closeModal();
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && modalBg.classList.contains('show')) {
    document.getElementById('m-save').click();
  }
});

document.querySelectorAll('.skill').forEach((el) => {
  el.addEventListener('click', (e) => {
    if (e.target.classList.contains('edit-btn')) {
      e.stopPropagation();
      openEditModal(el);
      return;
    }
    const name = el.dataset.name;
    vscode.postMessage({ type: 'copy', name });
    el.classList.add('copied');
    setTimeout(() => el.classList.remove('copied'), 600);
    showToast('복사됨: /' + name);
  });
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
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
        vscode.window.setStatusBarMessage('Copied: /' + msg.name, 2000);
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
