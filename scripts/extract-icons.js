// Crop individual skill icons from source-icons.png
// Output: assets/pixel-icons/extracted/<name>.png (64x64 PNG, transparent-trimmed)

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, '..', 'source-icons.png');
const OUT = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'extracted');
fs.mkdirSync(OUT, { recursive: true });

// Crops as [name, x, y, w, h] — coordinates measured from 1283x816 source.
// Rectangle covers the icon "tile" only (not the label text below).
const CROPS = [
  // Row 1 — user skills
  ['today',           115,  170, 165, 165],
  ['commit-prepare',  410,  170, 165, 165],
  ['figma-to-tailwind', 700, 170, 165, 165],
  ['full-flow',       995,  170, 165, 165],

  // Row 2 — plugin row 1 (height tightened to exclude label)
  ['using-superpowers',         70,  440, 130, 112],
  ['brainstorming',            265,  440, 145, 112],
  ['writing-plans',            475,  440, 130, 112],
  ['executing-plans',          675,  440, 130, 112],
  ['subagent-driven-development', 880, 440, 130, 112],
  ['dispatching-parallel-agents', 1080, 440, 145, 112],

  // Row 3 — plugin row 2
  ['test-driven-development',          70,  610, 130, 112],
  ['systematic-debugging',            265,  610, 130, 112],
  ['verification-before-completion',  475,  610, 130, 112],
  ['requesting-code-review',          675,  610, 130, 112],
  ['receiving-code-review',           880,  610, 130, 112],
  ['using-git-worktrees',            1080,  610, 130, 112],
];

const ALIASES = {
  'figma-to-tailwind': ['frontend-design'],
  'commit-prepare': ['init'],
  'requesting-code-review': ['review', 'code-review'],
  'using-superpowers': ['claude-api'],
  'verification-before-completion': ['simplify'],
  'using-git-worktrees': [],
  'systematic-debugging': [],
  'writing-plans': ['writing-skills', 'write-plan'],
  'executing-plans': ['execute-plan', 'loop'],
  'brainstorming': ['brainstorm'],
  'dispatching-parallel-agents': ['schedule'],
  'subagent-driven-development': ['update-config', 'keybindings-help'],
  'today': [],
  'full-flow': [],
};

async function build() {
  const manifest = {};
  for (const [name, x, y, w, h] of CROPS) {
    const out = path.join(OUT, `${name}.png`);
    await sharp(SRC)
      .extract({ left: x, top: y, width: w, height: h })
      .resize(96, 96, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(out);
    manifest[name] = `extracted/${name}.png`;
    for (const alias of ALIASES[name] || []) manifest[alias] = `extracted/${name}.png`;
  }
  // Write the merged manifest (extracted overrides hand-drawn)
  const existing = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'manifest.json');
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(existing, 'utf8')); } catch {}
  const merged = { ...prev, ...manifest };
  fs.writeFileSync(existing, JSON.stringify(merged, null, 2));
  console.log(`extracted ${CROPS.length} icons + ${Object.values(ALIASES).flat().length} aliases`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
