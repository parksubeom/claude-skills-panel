// Auto-mapping skill name → emoji icon based on keywords/intent
// Priority: exact name → keyword in name → keyword in description → default

const EXACT = {
  'today': '📅',
  'commit-prepare': '💾',
  'figma-to-tailwind': '🎨',
  'full-flow': '🌀',
  'init': '🆕',
  'review': '👀',
  'security-review': '🔒',
  'simplify': '✨',
  'loop': '🔁',
  'schedule': '⏰',
  'claude-api': '🔌',
  'update-config': '⚙️',
  'keybindings-help': '⌨️',
  'fewer-permission-prompts': '🔓',
  'frontend-design': '🖼️',
  'code-review': '🔍',

  // superpowers
  'using-superpowers': '⚡',
  'brainstorming': '💡',
  'brainstorm': '💡',
  'writing-plans': '📝',
  'write-plan': '📝',
  'writing-skills': '✍️',
  'executing-plans': '▶️',
  'execute-plan': '▶️',
  'subagent-driven-development': '🤖',
  'dispatching-parallel-agents': '🔀',
  'test-driven-development': '🧪',
  'systematic-debugging': '🐛',
  'verification-before-completion': '✅',
  'requesting-code-review': '📤',
  'receiving-code-review': '📥',
  'using-git-worktrees': '🌳',
  'finishing-a-development-branch': '🏁',
};

const KEYWORD_RULES = [
  { match: /\b(figma|design|tailwind)\b/i, icon: '🎨' },
  { match: /\b(commit|git\s*commit)\b/i, icon: '💾' },
  { match: /\b(branch|merge|rebase)\b/i, icon: '🌿' },
  { match: /\b(worktree)\b/i, icon: '🌳' },
  { match: /\b(today|daily|schedule|cron)\b/i, icon: '📅' },
  { match: /\b(loop|recur|interval)\b/i, icon: '🔁' },
  { match: /\b(brainstorm|idea|explore)\b/i, icon: '💡' },
  { match: /\b(plan|strategy|architect)\b/i, icon: '📝' },
  { match: /\b(execute|run|launch)\b/i, icon: '▶️' },
  { match: /\b(debug|bug|error)\b/i, icon: '🐛' },
  { match: /\b(test|tdd)\b/i, icon: '🧪' },
  { match: /\b(verif|valid|confirm)\b/i, icon: '✅' },
  { match: /\b(review|inspect)\b/i, icon: '🔍' },
  { match: /\b(security|secure|auth)\b/i, icon: '🔒' },
  { match: /\b(parallel|dispatch|concurrent)\b/i, icon: '🔀' },
  { match: /\b(agent|subagent|bot)\b/i, icon: '🤖' },
  { match: /\b(api|sdk|endpoint)\b/i, icon: '🔌' },
  { match: /\b(config|setting)\b/i, icon: '⚙️' },
  { match: /\b(keybind|shortcut|hotkey)\b/i, icon: '⌨️' },
  { match: /\b(permission|auth)\b/i, icon: '🔓' },
  { match: /\b(simplif|clean|refactor)\b/i, icon: '✨' },
  { match: /\b(skill|magic|power)\b/i, icon: '⚡' },
  { match: /\b(finish|complete|done)\b/i, icon: '🏁' },
  { match: /\b(write|edit|author)\b/i, icon: '✍️' },
  { match: /\b(receive|read|incoming)\b/i, icon: '📥' },
  { match: /\b(request|send|outgoing)\b/i, icon: '📤' },
  { match: /\b(init|new|create)\b/i, icon: '🆕' },
  { match: /\b(frontend|ui|component)\b/i, icon: '🖼️' },
  { match: /\b(flow|pipeline|orchestr)\b/i, icon: '🌀' },
];

function pickIcon(skill) {
  if (skill.iconOverride) return skill.iconOverride;
  if (EXACT[skill.name]) return EXACT[skill.name];
  const haystack = `${skill.name} ${skill.description || ''}`;
  for (const rule of KEYWORD_RULES) {
    if (rule.match.test(haystack)) return rule.icon;
  }
  return '🪄';
}

module.exports = { pickIcon };
