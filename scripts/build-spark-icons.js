// Generates "Claude spark"-style icons: dark-rounded frame + 1-color pixel glyph.
// Style matches assets/pixel-icons/_default.svg (orange spark, white center).
//
// Each icon defined as:
//   { color: '#hex', accent: '#hex', grid: ['12-char rows', ...] (12x12) }
// '.' = transparent, 'K' = main color, 'W' = white accent, 'A' = secondary
//
// Output: assets/pixel-icons/spark/<name>.png (96x96, nearest-neighbor)

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'spark');
fs.mkdirSync(OUT, { recursive: true });

const VIEW = 64;
const PNG = 96;
// 12x12 glyph grid, 4px per cell, offset (8,8) → 56 area inside frame
const GLYPH_OFFSET = 8;
const GLYPH_CELL = 4;
const GLYPH_SIZE = 12;

// --- Shared frame template (matches _default.svg) ---
const FRAME = `
  <rect x="4" y="4" width="56" height="56" rx="6" fill="#1a1f2c" stroke="#5a6273" stroke-width="2"/>
  <rect x="6" y="6" width="52" height="52" rx="4" fill="#252b3a"/>
`;

// --- Glyph definitions ---
const ICONS = {
  today: {
    color: '#67e8f9', accent: '#ffffff',
    grid: [
      '............',
      '..K..K..K...',
      '.KKKKKKKKKK.',
      '.KKKKKKKKKK.',
      '.K........K.',
      '.K.KK.KK.KK.',
      '.K.KK.KK.KK.',
      '.K........K.',
      '.K.KK.KK.WK.',
      '.K.KK.KK.WK.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  'commit-prepare': {
    color: '#c084fc', accent: '#ffffff',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.KKK....KKK.',
      '.KKK....KKK.',
      '.K........K.',
      '.K.WWWWWW.K.',
      '.K.W....W.K.',
      '.K.W.WW.W.K.',
      '.K.W....W.K.',
      '.K.WWWWWW.K.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  brainstorming: {
    color: '#fbbf24', accent: '#ffffff',
    grid: [
      '............',
      '...KKKKKK...',
      '..KKKKKKKK..',
      '.KKKKWWKKKK.',
      '.KKKWWWWKKK.',
      '.KKKWWWWKKK.',
      '.KKKKWWKKKK.',
      '.KKKKKKKKKK.',
      '..KKKKKKKK..',
      '..KKKKKKKK..',
      '...KKKKKK...',
      '....KKKK....',
    ],
  },
  'writing-plans': {
    color: '#7dd3fc', accent: '#22c55e',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.KWWWWWWWWK.',
      '.K........K.',
      '.K.WWWWWWWK.',
      '.K........K.',
      '.K.WWWWWWWK.',
      '.K........K.',
      '.K.WWAA.WWK.',
      '.K.W..AA..K.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  'executing-plans': {
    color: '#22c55e', accent: '#ffffff',
    grid: [
      '............',
      '............',
      '..KK........',
      '..KKKK......',
      '..KKKKKK....',
      '..KKKKKKKK..',
      '..KKKKKKKKKK',
      '..KKKKKKKK..',
      '..KKKKKK....',
      '..KKKK......',
      '..KK........',
      '............',
    ],
  },
  'systematic-debugging': {
    color: '#f87171', accent: '#ffffff',
    grid: [
      '............',
      '..K......K..',
      '...K....K...',
      '...KKKKKK...',
      '..KKKKKKKK..',
      '.KKKWWKKWWK.',
      '.KKKKKKKKKK.',
      '.KKKKKKKKKK.',
      '.KKKWWWWKKK.',
      '..KKKKKKKK..',
      '...KKKKKK...',
      '..K..KK..K..',
    ],
  },
  'verification-before-completion': {
    color: '#22c55e', accent: '#ffffff',
    grid: [
      '............',
      '...........K',
      '..........KK',
      '.........KK.',
      '........KK..',
      '.K.....KK...',
      '.KK...KK....',
      '..KK.KK.....',
      '...KKK......',
      '....K.......',
      '............',
      '............',
    ],
  },
  'test-driven-development': {
    color: '#67e8f9', accent: '#fbbf24',
    grid: [
      '............',
      '..KKKK..KKK.',
      '...KK....KK.',
      '...KK....KK.',
      '...KK....KK.',
      '...KK....KK.',
      '...AA....KK.',
      '...AA....KK.',
      '...AAA..KKK.',
      '....AAAAKK..',
      '.....AAAA...',
      '......AA....',
    ],
  },
  loop: {
    color: '#7dd3fc', accent: '#ffffff',
    grid: [
      '............',
      '....KKKKK...',
      '..KKK...KKK.',
      '.KK.......KK',
      '.K.........K',
      '.K.........K',
      '.K.........K',
      '.K..........',
      '.KK.........',
      '..KKK....K..',
      '....KKKKKK..',
      '...KKKKKKK..',
    ],
  },
  schedule: {
    color: '#a78bfa', accent: '#ffffff',
    grid: [
      '............',
      '...KKKKKK...',
      '..KKKKKKKK..',
      '.KKKKWWKKKK.',
      '.KKKKWWKKKK.',
      '.KKKKWWWWWK.',
      '.KKKKWWWWWK.',
      '.KKKKWWKKKK.',
      '.KKKKWWKKKK.',
      '..KKKKKKKK..',
      '...KKKKKK...',
      '............',
    ],
  },
  'simplify': {
    color: '#fbbf24', accent: '#ffffff',
    grid: [
      '............',
      '......K.....',
      '.....KKK....',
      '.....KWK....',
      '.....KKK....',
      'KKKKKKKKKKK.',
      '.....KKK....',
      '.....KKK....',
      '.....KWK....',
      '.....KKK....',
      '......K.....',
      '............',
    ],
  },
  'using-superpowers': {
    color: '#fbbf24', accent: '#ffffff',
    grid: [
      '............',
      '.....KKKK...',
      '....KKKKK...',
      '...KKKKK....',
      '..KKKKKK....',
      '..KKKKKW....',
      '...KKWWK....',
      '....KWKK....',
      '...KKKK.....',
      '..KKKK......',
      '..KKK.......',
      '..KK........',
    ],
  },
  'using-git-worktrees': {
    color: '#6dd28a', accent: '#a78bfa',
    grid: [
      '............',
      '......KK....',
      '.....KKKK...',
      '....KKKKKK..',
      '...KKKKKKKK.',
      '..KKKKKKKKKK',
      '...KKKKKKKK.',
      '....KKKKKK..',
      '......AA....',
      '......AA....',
      '......AA....',
      '......AA....',
    ],
  },
  'figma-to-tailwind': {
    color: '#f9a8d4', accent: '#67e8f9',
    grid: [
      '............',
      '....KKKK....',
      '...KKKKKK...',
      '..KKWWKWKK..',
      '..KWWKKWWK..',
      '..KKKKKAAK..',
      '..KKKKAAA...',
      '..KKKAAA....',
      '...AAA......',
      '..AAA.......',
      '..A.........',
      '............',
    ],
  },
  'full-flow': {
    color: '#7dd3fc', accent: '#a78bfa',
    grid: [
      '............',
      '....KKKKK...',
      '..KKAAAKKKK.',
      '.KKAA...AKKK',
      '.KKA.....AKK',
      '.KA.WWWW..KK',
      '.KA.W..W..KK',
      '.KKA.WW..AKK',
      '.KKA....AKKK',
      '..KKAAAAKKK.',
      '....KKKKK...',
      '............',
    ],
  },
  'requesting-code-review': {
    color: '#f59e0b', accent: '#ffffff',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.K........K.',
      '.K.WWWWWW.K.',
      '.K.W.KK.W.K.',
      '.K.WWWWWW.K.',
      '.K.W.KK.W.K.',
      '.K.WWWWWW.K.',
      '.K........K.',
      '.K.KKKKKK.K.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  'receiving-code-review': {
    color: '#22c55e', accent: '#ffffff',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.K........K.',
      '.K.K....K.K.',
      '.K.KW..WK.K.',
      '.K.KKWWKK.K.',
      '.K.KKKWKK.K.',
      '.K.WWWWWW.K.',
      '.K.W.WW.W.K.',
      '.K.WWWWWW.K.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  'writing-skills': {
    color: '#fbbf24', accent: '#ffffff',
    grid: [
      '............',
      '.........KK.',
      '........KKK.',
      '.......KKK..',
      '......KKK...',
      '.....KKK....',
      '....KKK.....',
      '...KKK......',
      '..KKK.......',
      '.KK.........',
      '.WWWWWWWWWW.',
      '............',
    ],
  },
  'subagent-driven-development': {
    color: '#94a3b8', accent: '#67e8f9',
    grid: [
      '............',
      '....KKKKKK..',
      '....KKKKKK..',
      '...KKKKKKKK.',
      '..KKKKKKKKK.',
      '..KWKKKKWKK.',
      '..KWKKKKWKK.',
      '..KKKKKKKKK.',
      '..KKKKKKKKK.',
      '..KKKKKKKKK.',
      '.KKK.KK.KKK.',
      '.KKK....KKK.',
    ],
  },
  'dispatching-parallel-agents': {
    color: '#c084fc', accent: '#ffffff',
    grid: [
      '............',
      '.KK......KK.',
      '.KK......KK.',
      '.KK......KK.',
      '.KK......KK.',
      '..KK....KK..',
      '...KKKKKK...',
      '.....KK.....',
      '.....KK.....',
      '.....KK.....',
      '.....KK.....',
      '.....KK.....',
    ],
  },
  'finishing-a-development-branch': {
    color: '#f87171', accent: '#ffffff',
    grid: [
      '............',
      '.K..........',
      '.KKKKKKKK...',
      '.KKKWWWWK...',
      '.KKKKKKKK...',
      '.KKKWWWWK...',
      '.KKKKKKKK...',
      '.K..........',
      '.K..........',
      '.K..........',
      '.K..........',
      '.K..........',
    ],
  },
  'frontend-design': {
    color: '#f9a8d4', accent: '#67e8f9',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.K........K.',
      '.K..K..K..K.',
      '.K.WK..KW.K.',
      '.K.K....K.K.',
      '.K.WK..KW.K.',
      '.K..K..K..K.',
      '.K........K.',
      '.KKKKKKKKKK.',
      '....KKKK....',
      '............',
    ],
  },
  'code-review': {
    color: '#f59e0b', accent: '#ffffff',
    grid: [
      '............',
      '....KKKK....',
      '...KWWKK....',
      '...K..KKK...',
      '...K..K.K...',
      '...K..KKK...',
      '....KKKK....',
      '.....KKK....',
      '......KKK...',
      '.......KKK..',
      '........KKK.',
      '.........KK.',
    ],
  },
  'update-config': {
    color: '#94a3b8', accent: '#252b3a',
    grid: [
      '............',
      '....KKKK....',
      '.KKKKKKKKKK.',
      '.KKKKKKKKKK.',
      '.KK.KKKK.KK.',
      '.KK..KK..KK.',
      '.KK..KK..KK.',
      '.KK.KKKK.KK.',
      '.KKKKKKKKKK.',
      '.KKKKKKKKKK.',
      '....KKKK....',
      '............',
    ],
  },
  'keybindings-help': {
    color: '#94a3b8', accent: '#67e8f9',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.KWWKWWKWWK.',
      '.KKKKKKKKKK.',
      '.KWKWKWKWKK.',
      '.KKKKKKKKKK.',
      '.KKWWWWWKKK.',
      '.KKKKKKKKKK.',
      '............',
      '............',
      '............',
      '............',
    ],
  },
  'fewer-permission-prompts': {
    color: '#fbbf24', accent: '#ffffff',
    grid: [
      '.....KKK....',
      '....KKKKK...',
      '...KK...K...',
      '...KK...K...',
      '...KK.......',
      '.KKKKKKKKK..',
      '.KKKKKKKKK..',
      '.KKKWWWKKK..',
      '.KKKWKWKKK..',
      '.KKKWWWKKK..',
      '.KKKKKKKKK..',
      '.KKKKKKKKK..',
    ],
  },
  'claude-api': {
    color: '#c084fc', accent: '#ffffff',
    grid: [
      '............',
      '......KK....',
      '......KK....',
      '....KKKKKK..',
      '....KKKKKK..',
      '....KKKKKK..',
      '....KKKKKK..',
      '....KKKKKK..',
      '......KK....',
      '....KKKKKK..',
      '.KKK....KKK.',
      '............',
    ],
  },
  'init': {
    color: '#22c55e', accent: '#ffffff',
    grid: [
      '............',
      '.KKKKKKKKKK.',
      '.K........K.',
      '.K....W...K.',
      '.K....W...K.',
      '.K..WWWWW.K.',
      '.K....W...K.',
      '.K....W...K.',
      '.K........K.',
      '.K........K.',
      '.KKKKKKKKKK.',
      '............',
    ],
  },
  'review': {
    color: '#67e8f9', accent: '#ffffff',
    grid: [
      '............',
      '............',
      '....KKKKK...',
      '..KKKKKKKKK.',
      '.KKKWWWWWKK.',
      '.KKWKKWKKKK.',
      '.KKKWWWKKKK.',
      '..KKKKKKKKK.',
      '....KKKKK...',
      '............',
      '............',
      '............',
    ],
  },
  'security-review': {
    color: '#22c55e', accent: '#ffffff',
    grid: [
      '............',
      '....KKKKK...',
      '...KKKKKKK..',
      '..KK.....KK.',
      '..K.WWWWW.K.',
      '..K.W...W.K.',
      '..K.WWWWW.K.',
      '..K.......K.',
      '...K.....K..',
      '....KK.KK...',
      '.....KKK....',
      '......K.....',
    ],
  },
};

function rectFor(x, y, color) {
  // Each cell is 4x4 in viewBox 64.
  return `<rect x="${GLYPH_OFFSET + x * GLYPH_CELL}" y="${GLYPH_OFFSET + y * GLYPH_CELL}" width="${GLYPH_CELL}" height="${GLYPH_CELL}" fill="${color}"/>`;
}

function gridToSvg(def) {
  const { color, accent, grid } = def;
  const cells = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    const row = grid[y] || '';
    for (let x = 0; x < GLYPH_SIZE; x++) {
      const ch = row[x] || '.';
      if (ch === '.') continue;
      let c = color;
      if (ch === 'W') c = accent || '#ffffff';
      else if (ch === 'A') c = '#a78bfa'; // secondary fixed; per-icon override via def.secondary if needed
      else if (ch === 'K') c = color;
      cells.push(rectFor(x, y, c));
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" shape-rendering="crispEdges">${FRAME}${cells.join('')}</svg>`;
}

// Deprecated/short aliases re-using the same spark sprite.
const SPARK_ALIASES = {
  'executing-plans': ['execute-plan', 'execute-plans'],
  'writing-plans': ['write-plan'],
  'brainstorming': ['brainstorm'],
};

async function build() {
  const manifest = {};
  for (const [name, def] of Object.entries(ICONS)) {
    const svg = gridToSvg(def);
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(PNG, PNG, { kernel: sharp.kernel.nearest })
      .png()
      .toFile(path.join(OUT, `${name}.png`));
    manifest[name] = `spark/${name}.png`;
  }
  for (const [target, aliases] of Object.entries(SPARK_ALIASES)) {
    for (const a of aliases) manifest[a] = `spark/${target}.png`;
  }
  // Merge into shared manifest
  const sharedPath = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'manifest.json');
  let prev = {};
  try { prev = JSON.parse(fs.readFileSync(sharedPath, 'utf8')); } catch {}
  // Spark overrides existing (user wants this style).
  const merged = { ...prev, ...manifest };
  fs.writeFileSync(sharedPath, JSON.stringify(merged, null, 2));
  console.log(`built ${Object.keys(ICONS).length} spark icons`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
