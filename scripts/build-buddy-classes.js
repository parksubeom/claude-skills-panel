// Generates placeholder class buddy sprites at assets/pixel-icons/buddy/class/<id>.png.
// These are *temporary* — the real designs are coming from an external artist.
// Each placeholder is a 16×16 chibi silhouette in the class's signature color
// with a single distinguishing glyph, so users see something differentiated
// during development. Drop a real PNG at assets/pixel-icons/buddy/class/<id>.png
// (16×16 or 32×32, transparent bg) and it overrides this script's output on the
// next build.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'assets', 'pixel-icons', 'buddy', 'class');
fs.mkdirSync(OUT, { recursive: true });

const VIEW = 64;        // 16 grid * 4 px
const PNG = 96;
const GLYPH_CELL = 4;
const GLYPH_SIZE = 16;

// 16×16 grids — '.' = transparent, K = outline, W = main, A = secondary, B = tertiary.
// Each placeholder leans on the signature color from BUDDY_DESIGN.md.
const CLASSES = [
  // codey — Swordsman, brown hair + keyboard sword
  {
    id: 'codey',
    K: '#0b0d12', W: '#7a4a23', A: '#fbbf24', B: '#dcd0b8',
    grid: [
      '................',
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '.....KAWAWAK....',
      '.....KWWWWWK....',
      '......KKKKK.....',
      '....KKBBBBKK....',
      '....KBBBBBBK....',
      '....KBBBBBBK..K.',
      '....KBBBBBBK.K..',
      '....KKKBBKKK.K..',
      '......KBBK..K...',
      '......KKKK..K...',
      '................',
      '................',
    ],
  },
  // datia — Astrologer, blue hair + crystal
  {
    id: 'datia',
    K: '#0b0d12', W: '#3a7be0', A: '#a78bfa', B: '#dcd0b8',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWWWWWWK....',
      '....KAAAAAAK....',
      '....KAKAKAAK....',
      '....KAAAAAAK....',
      '.....KKKKKK.....',
      '....KBBBBBBK....',
      '...KBBBBBBBBK...',
      '...KBBBWWBBBK...',
      '...KBBWWWWBBK...',
      '....KBBWWBBK....',
      '.....KKKKKK.....',
      '................',
      '................',
    ],
  },
  // debuggo — Detective, magnifier + red eye
  {
    id: 'debuggo',
    K: '#0b0d12', W: '#9aa3b3', A: '#ef4444', B: '#5a6273',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWAWWAWK....',
      '....KWWWWWWK....',
      '.....KKKKKK.....',
      '....KBBBBBBK....',
      '....KBBWWBBK....',
      '....KBBWWBBK..K.',
      '....KBBBBBBK.KW.',
      '....KBBBBBBKKK..',
      '....KBBBBBBK....',
      '.....KK..KK.....',
      '......K..K......',
      '................',
      '................',
    ],
  },
  // docly — Cleric, white robe + scroll
  {
    id: 'docly',
    K: '#0b0d12', W: '#f4e9d8', A: '#fbbf24', B: '#dcd0b8',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWBBBBWK....',
      '....KWWWWWWK....',
      '.....KAAAAK.....',
      '....KWWWWWWK....',
      '...KWWAWWAWWK...',
      '...KWWWWWWWWK...',
      '...KWWAAAAWWK...',
      '...KWWWWWWWWK...',
      '....KWWWWWWK..KK',
      '.....KKWWKK..KWK',
      '......KKKK..KKK.',
      '................',
      '................',
    ],
  },
  // gitto — Ninja, dark suit + shuriken
  {
    id: 'gitto',
    K: '#0b0d12', W: '#1f2533', A: '#ef4444', B: '#5a6273',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KKAAAAKK....',
      '....KWAAAAWK....',
      '....KKKAAKKK....',
      '.....KKKKKK.....',
      '....KWWWWWWK....',
      '....KWWAAWWK....',
      '....KWWWWWWK..K.',
      '....KWWWWWWK.KAK',
      '....KKKWWKKK.KKK',
      '......KWWK......',
      '......KKKK......',
      '................',
      '................',
    ],
  },
  // pdfox — Rogue, red fox ears + sealed scroll
  {
    id: 'pdfox',
    K: '#0b0d12', W: '#dc2626', A: '#fbbf24', B: '#7f1d1d',
    grid: [
      '................',
      '....KK....KK....',
      '...KAK....KAK...',
      '...KAWK..KWAK...',
      '....KWWWWWWK....',
      '....KWAWWAWK....',
      '.....KKWWKK.....',
      '......KKKK......',
      '....KBBBBBBK....',
      '....KBBAABBK....',
      '....KBBBBBBK....',
      '....KBBBBBBK....',
      '.....KK..KK.....',
      '......K..K......',
      '................',
      '................',
    ],
  },
  // sheety — Merchant, green + abacus
  {
    id: 'sheety',
    K: '#0b0d12', W: '#22c55e', A: '#fbbf24', B: '#15803d',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWWAAWWK....',
      '....KWWWWWWK....',
      '....KWAAAAWK....',
      '.....KKKKKK.....',
      '....KBBBBBBK....',
      '....KBAAAABK....',
      '....KBABABBK....',
      '....KBAAAABK....',
      '....KBABABBK....',
      '....KBAAAABK....',
      '....KBBBBBBK....',
      '.....KK..KK.....',
      '......K..K......',
    ],
  },
  // slidey — Bard, yellow cape + mic staff
  {
    id: 'slidey',
    K: '#0b0d12', W: '#fbbf24', A: '#ef4444', B: '#7c2d12',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWAAAAWK....',
      '....KWWWWWWK....',
      '....KAWWWWAK....',
      '.....KKKKKK.....',
      '...KWWWWWWWWK...',
      '...KWWAAAAWWK..K',
      '...KWWWWWWWWK.KW',
      '...KWWAAAAWWKKKK',
      '...KWWWWWWWWK.KW',
      '....KKWWWWKK..K.',
      '......KWWK......',
      '......KKKK......',
      '................',
    ],
  },
  // testra — Paladin, green armor + check shield
  {
    id: 'testra',
    K: '#0b0d12', W: '#9aa3b3', A: '#22c55e', B: '#dcd0b8',
    grid: [
      '................',
      '......KKKK......',
      '.....KWWWWK.....',
      '....KWBBBBWK....',
      '....KWWWWWWK....',
      '.....KKKKKK.....',
      '...KWWWWWWWWK...',
      '...KAAAAAAAAK...',
      '...KAA....AAK..K',
      '...KA..AA..AK.AK',
      '...KA.AAAA.AKAA.',
      '...KA..AA..AKAK.',
      '...KAA....AAK...',
      '...KAAAAAAAAK...',
      '....KK....KK....',
      '................',
    ],
  },
  // webbie — Wizard, purple robe + palette
  {
    id: 'webbie',
    K: '#0b0d12', W: '#a855f7', A: '#fbbf24', B: '#7c3aed',
    grid: [
      '......KKKK......',
      '.....KWAAAWK....',
      '....KWWWWWWK....',
      '....KWWAAWWK....',
      '....KWAAAAWK....',
      '....KWWWWWWK....',
      '.....KKKKKK.....',
      '...KBBBBBBBBK...',
      '...KBAWWAWWBK...',
      '...KBWAWAWAWK..K',
      '...KBAWAWAWBK.AK',
      '...KBWAWWAWBK.AK',
      '...KBBBBBBBBK.K.',
      '....KK....KK....',
      '................',
      '................',
    ],
  },
];

function rectFor(x, y, color) {
  return `<rect x="${x * GLYPH_CELL}" y="${y * GLYPH_CELL}" width="${GLYPH_CELL}" height="${GLYPH_CELL}" fill="${color}"/>`;
}

function gridToSvg(c) {
  const cells = [];
  for (let y = 0; y < GLYPH_SIZE; y++) {
    const row = c.grid[y] || '';
    for (let x = 0; x < GLYPH_SIZE; x++) {
      const ch = row[x] || '.';
      if (ch === '.') continue;
      let col;
      switch (ch) {
        case 'K': col = c.K; break;
        case 'W': col = c.W; break;
        case 'A': col = c.A; break;
        case 'B': col = c.B; break;
        default: continue;
      }
      cells.push(rectFor(x, y, col));
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}" shape-rendering="crispEdges">${cells.join('')}</svg>`;
}

async function build() {
  for (const c of CLASSES) {
    const finalPng = path.join(OUT, `${c.id}.png`);
    // If a real artist-supplied PNG already exists at the same path, leave it.
    // We only emit placeholders for classes that don't have one yet.
    if (fs.existsSync(finalPng)) {
      const stat = fs.statSync(finalPng);
      // Heuristic: artist PNGs are typically >2KB; our placeholder SVG renders
      // to ~1KB. Skip real ones.
      if (stat.size > 2000) continue;
    }
    const svg = gridToSvg(c);
    fs.writeFileSync(path.join(OUT, `${c.id}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(PNG, PNG, { kernel: sharp.kernel.nearest })
      .png()
      .toFile(finalPng);
  }
  console.log(`built ${CLASSES.length} placeholder class buddies`);
}

build().catch((e) => { console.error(e); process.exit(1); });
