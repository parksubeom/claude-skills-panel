// Generates Claude Buddy character pixel art for each growth stage.
// 6 stages of cute side-view sprites: Egg → Hatchling → Cream Cat → Grey Cat → Monkey → Dragon.
// 16x16 grid, no frame (transparent), thick K outline + colored fill.
// Style matches reference: side-view, chunky outlines, simple distinguishing features.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'buddy');
fs.mkdirSync(OUT, { recursive: true });

const VIEW = 64;        // 16 grid * 4 px
const PNG = 96;
const GLYPH_CELL = 4;
const GLYPH_SIZE = 16;

// 16x16 grids — '.' = transparent, K = outline (black), W = white/main, A = secondary, B = tertiary
const STAGES = [
  // 0 — EGG (0~9)
  {
    id: 0, name: 'Egg', threshold: 0,
    // K outline, W cream interior, A spots
    K: '#0b0d12', W: '#f4e9d8', A: '#fbbf24', B: '#e89045',
    grid: [
      '................',
      '................',
      '.......KKKK.....',
      '......KWWWWK....',
      '.....KWAWWAWK...',
      '....KWWWWWWWWK..',
      '....KWAWWAWWAK..',
      '....KWWWWWWWWK..',
      '....KWAWWAWWAK..',
      '....KWWWWWWWWK..',
      '....KWAWWAWWAK..',
      '....KWWWWWWWWK..',
      '.....KWWWWWWK...',
      '......KKKKKK....',
      '................',
      '................',
    ],
  },
  // 1 — HATCHLING (10~29): green baby snake/dino, side view (ref #3 small)
  {
    id: 1, name: 'Hatchling', threshold: 10,
    K: '#0b0d12', W: '#5fb95f', A: '#0b0d12', B: '#3b8c3b',
    grid: [
      '................',
      '................',
      '.....KKKKK......',
      '....KWWWWWK.....',
      '....KWAKWAK.....',
      '....KWWWWWK.....',
      '....KKKKKKK.....',
      '...KWWWWWWWK....',
      '...KWWWWWWWKK...',
      '...KWWWWWWWWWK..',
      '...KKKKWWWWWWK..',
      '......KKWWWWWK..',
      '........KKKKK...',
      '................',
      '................',
      '................',
    ],
  },
  // Stages 2-5 (Kitten/Cat/Monkey/Dragon) were the legacy single-evolution
  // sprites used before v0.29's class-branch system. They were never read
  // at runtime once each of the 10 classes had artwork, so the PNG/SVG
  // outputs were removed in v0.33 and the grid definitions deleted here
  // to keep the build pipeline honest. LV.3+ now resolves through
  // assets/pixel-icons/buddy/class/<id>.png exclusively.
];

function rectFor(x, y, color) {
  return `<rect x="${x * GLYPH_CELL}" y="${y * GLYPH_CELL}" width="${GLYPH_CELL}" height="${GLYPH_CELL}" fill="${color}"/>`;
}

function gridToSvg(stage) {
  const cells = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    const row = stage.grid[y] || '';
    for (let x = 0; x < GLYPH_SIZE; x++) {
      const ch = row[x] || '.';
      if (ch === '.') continue;
      let c;
      switch (ch) {
        case 'K': c = stage.K; break;
        case 'W': c = stage.W; break;
        case 'A': c = stage.A; break;
        case 'B': c = stage.B; break;
        default: continue;
      }
      cells.push(rectFor(x, y, c));
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

async function build() {
  // Clean legacy outputs from earlier sprite systems:
  //   - stage6.* — original 7-stage system
  //   - stage2-5.* — pre-class-branch single-evolution sprites (v0.29)
  const legacy = ['stage6.png', 'stage6.svg', 'stage2.png', 'stage2.svg',
                  'stage3.png', 'stage3.svg', 'stage4.png', 'stage4.svg',
                  'stage5.png', 'stage5.svg'];
  for (const fname of legacy) {
    const f = path.join(OUT, fname);
    if (fs.existsSync(f)) fs.unlinkSync(f);
  }
  for (const s of STAGES) {
    const svg = gridToSvg(s);
    fs.writeFileSync(path.join(OUT, `stage${s.id}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(PNG, PNG, { kernel: sharp.kernel.nearest })
      .png()
      .toFile(path.join(OUT, `stage${s.id}.png`));
  }
  fs.writeFileSync(
    path.join(OUT, 'stages.json'),
    JSON.stringify(STAGES.map((s) => ({ id: s.id, name: s.name, threshold: s.threshold })), null, 2)
  );
  console.log(`built ${STAGES.length} buddy stages (16x16 sprites, no frame)`);
}

build().catch((e) => { console.error(e); process.exit(1); });
