const vscode = require('vscode');
const fs = require('fs');
const path = require('path');
const os = require('os');

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
          if (fm.name) {
            results.push({
              group,
              name: fm.name,
              description: fm.description || '',
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
    { dir: path.join(home, '.claude', 'plugins', 'cache'), group: 'plugin' },
  ];
  const ws = vscode.workspace.workspaceFolders;
  if (ws && ws[0]) {
    sources.push({ dir: path.join(ws[0].uri.fsPath, '.claude', 'skills'), group: 'project' });
  }
  const all = [];
  for (const s of sources) all.push(...walkSkills(s.dir, s.group));
  all.sort((a, b) => {
    const order = { user: 0, project: 1, plugin: 2 };
    if (order[a.group] !== order[b.group]) return order[a.group] - order[b.group];
    return a.name.localeCompare(b.name);
  });
  return all;
}

class SkillsProvider {
  constructor() {
    this._onDidChange = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChange.event;
    this.skills = [];
    this.refresh();
  }
  refresh() {
    this.skills = loadAllSkills();
    this._onDidChange.fire();
  }
  getTreeItem(el) {
    if (el.kind === 'group') {
      const item = new vscode.TreeItem(el.label, vscode.TreeItemCollapsibleState.Expanded);
      item.contextValue = 'group';
      return item;
    }
    const skill = el.skill;
    const item = new vscode.TreeItem(skill.name, vscode.TreeItemCollapsibleState.None);
    item.description = skill.description;
    item.tooltip = `${skill.name}\n\n${skill.description}\n\n${skill.file}`;
    item.contextValue = 'skill';
    item.command = {
      command: 'claudeSkills.copyTrigger',
      title: 'Copy /skill',
      arguments: [skill],
    };
    return item;
  }
  getChildren(el) {
    if (!el) {
      const groups = [...new Set(this.skills.map((s) => s.group))];
      const labels = { user: 'User (~/.claude/skills)', project: 'Project (.claude/skills)', plugin: 'Plugins' };
      return groups.map((g) => ({ kind: 'group', group: g, label: labels[g] || g }));
    }
    if (el.kind === 'group') {
      return this.skills.filter((s) => s.group === el.group).map((s) => ({ kind: 'skill', skill: s }));
    }
    return [];
  }
}

function activate(context) {
  const provider = new SkillsProvider();
  vscode.window.registerTreeDataProvider('claudeSkillsList', provider);

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeSkills.refresh', () => provider.refresh()),
    vscode.commands.registerCommand('claudeSkills.copyTrigger', async (skill) => {
      const trigger = `/${skill.name}`;
      await vscode.env.clipboard.writeText(trigger);
      vscode.window.setStatusBarMessage(`Copied: ${trigger}`, 2000);
    }),
    vscode.commands.registerCommand('claudeSkills.openFile', async (node) => {
      const file = node && node.skill ? node.skill.file : null;
      if (file) {
        const doc = await vscode.workspace.openTextDocument(file);
        vscode.window.showTextDocument(doc);
      }
    })
  );
}

function deactivate() {}

module.exports = { activate, deactivate };
