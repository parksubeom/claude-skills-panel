const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { pickIcon } = require('./iconMap');

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

function walkSkills(rootDir, group) {
  const results = [];
  if (!fs.existsSync(rootDir)) return results;
  const stack = [rootDir];
  const seen = new Set();
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
      } else if (ent.name === 'SKILL.md') {
        try {
          const text = fs.readFileSync(full, 'utf8');
          const fm = parseFrontmatter(text);
          if (fm.name && !seen.has(fm.name)) {
            seen.add(fm.name);
            results.push({
              group,
              name: fm.name,
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
    { dir: path.join(home, '.claude', 'skills'), group: 'user' },
  ];
  const ws = vscode.workspace.workspaceFolders;
  if (ws && ws[0]) {
    sources.push({ dir: path.join(ws[0].uri.fsPath, '.claude', 'skills'), group: 'project' });
  }
  sources.push({ dir: path.join(home, '.claude', 'plugins', 'cache'), group: 'plugin' });

  const all = [];
  for (const s of sources) all.push(...walkSkills(s.dir, s.group));
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

function renderHtml(webview, skills) {
  const grouped = {};
  for (const s of skills) {
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

  const sections = order
    .filter((g) => grouped[g] && grouped[g].length)
    .map((g) => {
      const meta = GROUP_LABELS[g];
      const cards = grouped[g]
        .map((s) => {
          const pngUri = pixelUriFor(s.name);
          const emoji = pickIcon(s);
          const iconHtml = pngUri
            ? `<img class="skill-icon-img" src="${pngUri}" alt="${s.name}" />`
            : `<div class="skill-icon">${emoji}</div>`;
          const safeDesc = (s.description || '').replace(/"/g, '&quot;').replace(/</g, '&lt;');
          return `
            <button class="skill" data-name="${s.name}" data-file="${s.file}" title="${safeDesc}">
              ${iconHtml}
              <div class="skill-name">${s.name}</div>
            </button>`;
        })
        .join('');
      return `
        <section class="group">
          <header>
            <span class="group-icon">${meta.emoji}</span>
            <h3>${meta.label}</h3>
            <span class="sub">(${meta.sub} · ${grouped[g].length})</span>
            <span class="group-line"></span>
          </header>
          <div class="grid">${cards}</div>
        </section>`;
    })
    .join('');

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
    --good: #22c55e;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 14px;
    font-family: 'JetBrains Mono', 'SF Mono', 'Menlo', 'Consolas', monospace;
    color: var(--fg);
    background: var(--bg);
    font-size: 12px;
    image-rendering: pixelated;
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
  .toolbar::after { content: ''; }
  .bracket-l, .bracket-r {
    color: var(--accent);
    font-weight: 700;
    user-select: none;
  }
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
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
  }
  .group .group-icon { font-size: 16px; }
  .group h3 {
    margin: 0;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--fg);
  }
  .group .sub {
    color: var(--muted);
    font-size: 11px;
  }
  .group .group-line {
    flex: 1;
    height: 1px;
    background: linear-gradient(to right, var(--frame) 0%, var(--frame) 70%, transparent 100%);
    margin-left: 4px;
  }
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
    justify-content: flex-start;
    gap: 8px;
    padding: 12px 6px 10px;
    border: 2px solid var(--frame);
    border-radius: 6px;
    background: linear-gradient(180deg, var(--tile-bg) 0%, var(--tile-bg-2) 100%);
    box-shadow:
      inset 0 0 0 1px rgba(255, 255, 255, 0.04),
      0 2px 0 0 var(--frame-strong);
    transition: transform 0.06s ease, border-color 0.12s, box-shadow 0.12s;
    text-align: center;
    position: relative;
  }
  .skill:hover {
    border-color: var(--accent);
    box-shadow:
      inset 0 0 0 1px rgba(125, 211, 252, 0.18),
      0 2px 0 0 var(--frame-strong),
      0 0 8px rgba(125, 211, 252, 0.25);
  }
  .skill:active { transform: translateY(1px); box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.04); }
  .skill.copied {
    border-color: var(--good);
    box-shadow:
      inset 0 0 0 1px rgba(34, 197, 94, 0.3),
      0 2px 0 0 #14532d,
      0 0 10px rgba(34, 197, 94, 0.4);
  }
  .skill-icon {
    font-size: 32px;
    line-height: 1;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.5));
  }
  .skill-icon-img {
    width: 48px;
    height: 48px;
    image-rendering: pixelated;
    image-rendering: crisp-edges;
    filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.6));
  }
  .skill-name {
    font-size: 11px;
    font-weight: 600;
    color: var(--fg);
    word-break: break-word;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    letter-spacing: 0.2px;
  }
  .footer {
    margin-top: 16px;
    padding-top: 10px;
    border-top: 1px dashed var(--frame);
    color: var(--muted);
    font-size: 11px;
    display: flex;
    gap: 12px;
    align-items: center;
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
  }
  .toast.show { opacity: 1; }
  .empty {
    color: var(--muted);
    text-align: center;
    padding: 24px;
  }
</style>
</head>
<body>
  <div class="toolbar">
    <span class="bracket-l">[</span>
    <input class="search" placeholder="검색창" id="search" />
    <span class="bracket-r">]</span>
  </div>
  <div id="content">${sections || '<div class="empty">스킬이 없습니다. ~/.claude/skills 에 SKILL.md 를 추가해보세요.</div>'}</div>
  <div class="footer">
    <span>🏁 Finish</span>
    <span class="sep">|</span>
    <span>🪄 skills</span>
    <span class="sep">|</span>
    <span>좌클릭 복사 · 우클릭 SKILL.md</span>
  </div>
  <div class="toast" id="toast"></div>

<script>
const vscode = acquireVsCodeApi();
const search = document.getElementById('search');
const toast = document.getElementById('toast');
let toastTimer;

function showToast(msg) {
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 1400);
}

document.querySelectorAll('.skill').forEach((el) => {
  el.addEventListener('click', () => {
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
    const hay = (el.dataset.name + ' ' + (el.title || '')).toLowerCase();
    el.style.display = !q || hay.includes(q) ? '' : 'none';
  });
  document.querySelectorAll('.group').forEach((g) => {
    const visible = [...g.querySelectorAll('.skill')].some((el) => el.style.display !== 'none');
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
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, 'assets'))],
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
    })
  );

  // Auto-refresh when SKILL.md files change (best-effort)
  const home = os.homedir();
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(path.join(home, '.claude'), '**/SKILL.md')
  );
  watcher.onDidChange(() => provider.refresh());
  watcher.onDidCreate(() => provider.refresh());
  watcher.onDidDelete(() => provider.refresh());
  context.subscriptions.push(watcher);
}

function deactivate() {}

module.exports = { activate, deactivate };
