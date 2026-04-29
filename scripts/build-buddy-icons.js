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
  // 2 — CREAM CAT (30~99): small cream-colored cat, thin tail (ref #4)
  {
    id: 2, name: 'Kitten', threshold: 30,
    K: '#0b0d12', W: '#dcd0b8', A: '#0b0d12', B: '#9c8e74',
    grid: [
      '................',
      '......K....K....',
      '.....KWK..KWK...',
      '.....KWWKKWWK...',
      '....KWWWWWWWK...',
      '....KWAKKKAWK...',
      '....KKKKKKKKK...',
      '...KWWWWWWWWK...',
      '...KWWWWWWWWK...',
      '...KWWWWWWWWKK..',
      '...KWWWWWWWWWK..',
      '...KWWWWWWWWK...',
      '....KK..KK....K.',
      '....K...K....KK.',
      '................',
      '................',
    ],
  },
  // 3 — GREY CAT (100~299): bigger grey cat, fluffy tail (ref #5)
  {
    id: 3, name: 'Cat', threshold: 100,
    K: '#0b0d12', W: '#9aa3b3', A: '#0b0d12', B: '#5a6273',
    grid: [
      '................',
      '......K....K....',
      '.....KWK..KWK...',
      '.....KWWKKWWK...',
      '....KWWWWWWWK...',
      '....KWAKKKAWK...',
      '....KKKKKKKKK...',
      '...KWWWWWWWWKKK.',
      '...KWWWWWWWWBBK.',
      '...KWWWWWWWWBBK.',
      '...KWWWWWWWWWBK.',
      '...KWWWWWWWWBK..',
      '....KK..KK..BK..',
      '....K....K..K...',
      '................',
      '................',
    ],
  },
  // 4 — MONKEY (300~999): brown monkey with tan face (ref #6)
  {
    id: 4, name: 'Monkey', threshold: 300,
    K: '#0b0d12', W: '#854d2a', A: '#f4d4a3', B: '#0b0d12',
    grid: [
      '................',
      '....KKKKKKKK....',
      '...KWWWWWWWWK...',
      '...KWAAAAAAWK...',
      '...KWAKAKAAWK...',
      '...KWAAAAAAWK...',
      '....KAAAAAAK....',
      '....KKKKKKKK....',
      '...KWWWWWWWWK...',
      '...KWWWWWWWWK...',
      '...KWWWWWWWWK...',
      '...KWWWWWWWWK...',
      '....KK....KK....',
      '....KW....WK....',
      '....KK....KK....',
      '................',
    ],
  },
  // 5 — DRAGON (1000+): blue dragon with horns (ref #1)
  {
    id: 5, name: 'Dragon', threshold: 1000,
    K: '#0b0d12', W: '#3a7be0', A: '#fbbf24', B: '#1e40af',
    grid: [
      '................',
      '....K.K..K.K....',
      '....KAK..KAK....',
      '...KKWKKKKWKK...',
      '...KWWWWWWWWK...',
      '...KWAKWWWAWK...',
      '...KWWWWWWWWK...',
      '....KKKKKKKKKK..',
      '...KWWWWWWWWWWK.',
      '..KWWWWWWWWWWWK.',
      '..KKWWWWWWWWWBK.',
      '...KKKKWWWBBBK..',
      '......KKK..K....',
      '....KK.K..KK....',
      '................',
      '................',
    ],
  },
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
  // Clean any old stage6 (legacy 7-stage system)
  for (const fname of ['stage6.png', 'stage6.svg']) {
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
