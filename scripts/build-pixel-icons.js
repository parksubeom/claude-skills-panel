// Generates pixel-art SVG + PNG (64x64) for each skill icon definition.
// Each icon is a 16x16 grid of single chars; `palette` maps char → color.

const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'assets', 'pixel-icons');
fs.mkdirSync(OUT, { recursive: true });

const SIZE = 16;
const PNG_SIZE = 64;

// shared palette helpers
const C = {
  T: 'none', // transparent
  K: '#0b0d12', // black outline
  W: '#f7f7fa', // white
  G: '#3b8c4a', // green
  GG: '#6dd28a', // light green
  Y: '#f4c542', // yellow
  YY: '#ffe28a', // light yellow
  R: '#e35d5d', // red
  RR: '#f59c9c', // pink-red
  B: '#3a7be0', // blue
  BB: '#7eb6ff', // light blue
  P: '#8a3ff0', // purple
  PP: '#c193ff', // light purple
  O: '#e89045', // orange
  OO: '#f7c08c', // light orange
  D: '#3a3f4d', // dark slate
  DD: '#5a6273', // mid slate
  S: '#9aa3b3', // silver
  SS: '#cdd2dd', // light silver
};

// 16x16 grids. '.' = transparent. Use color keys above.
const ICONS = {
  // calendar
  today: [
    '................',
    '...K..K..K..K...',
    '..KK..KK.KK..KK.',
    '.KKKKKKKKKKKKKK.',
    '.KRRRRRRRRRRRRK.',
    '.KKKKKKKKKKKKKK.',
    '.KWWKWWKWWKWWWK.',
    '.KW..W..W..W.WK.',
    '.KWWKWWKWWKWWWK.',
    '.KW..W..W..W.WK.',
    '.KWWKWWKWWKWWWK.',
    '.KW..W..W..W.WK.',
    '.KWWKWWKWWKWWWK.',
    '.KKKKKKKKKKKKKK.',
    '................',
    '................',
  ],
  // floppy disk
  'commit-prepare': [
    '................',
    '.KKKKKKKKKKKKKK.',
    '.KBBKKKKKKKKBBK.',
    '.KBSKKKKKKKKSBK.',
    '.KBSKKKKKKKKSBK.',
    '.KBKKKKKKKKKKBK.',
    '.KBKKKKKKKKKKBK.',
    '.KBKWWWWWWWWKBK.',
    '.KBKWKKKKKKWKBK.',
    '.KBKWKWWWWKWKBK.',
    '.KBKWKWKKWKWKBK.',
    '.KBKWKWWWWKWKBK.',
    '.KBKWKKKKKKWKBK.',
    '.KBKWWWWWWWWKBK.',
    '.KKKKKKKKKKKKKK.',
    '................',
  ],
  // palette (figma-to-tailwind, frontend-design)
  palette: [
    '................',
    '.....KKKKKKK....',
    '...KKWWWWWWWKK..',
    '..KWRRWWBBWWWWK.',
    '..KWRRWWBBWWWWK.',
    '.KWWWWWGGWWPPWK.',
    '.KWWWWWGGWWPPWK.',
    '.KWYYWWWWWWWWWK.',
    '.KWYYWWWWWWWKKK.',
    '.KWWWWWWWWKKK...',
    '..KWWWWWWKK.....',
    '..KKWWWKKK......',
    '....KKKK........',
    '................',
    '................',
    '................',
  ],
  // swirl portal (full-flow)
  'full-flow': [
    '................',
    '....KKKKKKKK....',
    '..KKBBBBBBBBKK..',
    '.KBBPPPPPPPPBBK.',
    '.KBPPPBBBBPPPBK.',
    '.KBPPBBKKBBPPBK.',
    '.KBPPBKKKKBPPBK.',
    '.KBPPBKKKKBPPBK.',
    '.KBPPBKKKKBPPBK.',
    '.KBPPBBKKBBPPBK.',
    '.KBPPPBBBBPPPBK.',
    '.KBBPPPPPPPPBBK.',
    '..KKBBBBBBBBKK..',
    '....KKKKKKKK....',
    '................',
    '................',
  ],
  // lightning bolt (using-superpowers)
  'using-superpowers': [
    '................',
    '........KKKK....',
    '.......KYYYK....',
    '......KYYYK.....',
    '.....KYYYK......',
    '....KYYYYKK.....',
    '....KYYYYYK.....',
    '....KKKYYYK.....',
    '......KYYK......',
    '.....KYYK.......',
    '....KYYK........',
    '...KYYK.........',
    '..KYYK..........',
    '..KYK...........',
    '..KK............',
    '................',
  ],
  // lightbulb (brainstorming)
  brainstorming: [
    '................',
    '......KKKK......',
    '....KKYYYYKK....',
    '...KYYYYYYYYK...',
    '..KYYYYWWYYYYK..',
    '..KYYYWWWWYYYK..',
    '..KYYYWWWWYYYK..',
    '..KYYYYWWYYYYK..',
    '..KYYYYYYYYYYK..',
    '...KYYYYYYYYK...',
    '....KKKKKKKK....',
    '....KSSSSSSK....',
    '....KKKKKKKK....',
    '.....KSSSSK.....',
    '.....KKKKKK.....',
    '................',
  ],
  // scroll (writing-plans)
  'writing-plans': [
    '................',
    '..KKKKKKKKKKKK..',
    '..KOOOOOOOOOOK..',
    '..KOWWWWWWWWOK..',
    '..KOKKKKKKKKOK..',
    '..KOWWWWWWWWOK..',
    '..KOKKKKKKKKOK..',
    '..KOWWWWWWWWOK..',
    '..KOKKKKKKKKOK..',
    '..KOWWWWWWWWOK..',
    '..KOKKKKKKGGOK..',
    '..KOOOOOOOOOOK..',
    '..KKKKKKKKKKKK..',
    '................',
    '................',
    '................',
  ],
  // play button (executing-plans)
  'executing-plans': [
    '................',
    '....KKKKKKKK....',
    '...KGGGGGGGGK...',
    '..KGGKKKKGGGGK..',
    '..KGGKWKKGGGGK..',
    '..KGGKWWKKGGGK..',
    '..KGGKWWWKKGGK..',
    '..KGGKWWWWKGGK..',
    '..KGGKWWWKKGGK..',
    '..KGGKWWKKGGGK..',
    '..KGGKWKKGGGGK..',
    '..KGGKKKKGGGGK..',
    '...KGGGGGGGGK...',
    '....KKKKKKKK....',
    '................',
    '................',
  ],
  // bug (systematic-debugging)
  'systematic-debugging': [
    '................',
    '...K........K...',
    '....KK....KK....',
    '....KKK..KKK....',
    '...KKRRRRRRKK...',
    '..KKRRKKKKKKKK..',
    '..KKRRRRRRRRKK..',
    '.KKRKKKKKKKKKKK.',
    '.KKRRRRRRRRRRKK.',
    '.KKRRRRRRRRRRKK.',
    '..KKRRKKKKRRKK..',
    '..KKRRRRRRRRKK..',
    '...KKKKKKKKKK...',
    '....K..KK..K....',
    '...K....K...K...',
    '................',
  ],
  // checkmark (verification-before-completion)
  'verification-before-completion': [
    '................',
    '..KKKKKKKKKKKK..',
    '..KGGGGGGGGGGK..',
    '..KGGGGGGGGGGK..',
    '..KGGGGGGGGGWK..',
    '..KGGGGGGGGWWK..',
    '..KGWGGGGGWWGK..',
    '..KGWWGGGWWGGK..',
    '..KGGWWGWWGGGK..',
    '..KGGGWWWGGGGK..',
    '..KGGGGWGGGGGK..',
    '..KGGGGGGGGGGK..',
    '..KKKKKKKKKKKK..',
    '................',
    '................',
    '................',
  ],
  // test tube (test-driven-development)
  'test-driven-development': [
    '................',
    '..KKKK....KKKK..',
    '..KWWK....KWWK..',
    '..KWWK....KWWK..',
    '..KWWK....KWWK..',
    '..KWWK....KWWK..',
    '..KWWK....KWWK..',
    '..KGGK....KBBK..',
    '..KGGK....KBBK..',
    '..KGGK....KBBK..',
    '..KGGK....KBBK..',
    '..KGGK....KBBK..',
    '...KGK....KBK...',
    '....KK....KK....',
    '................',
    '................',
  ],
  // flag (finishing-a-development-branch)
  'finishing-a-development-branch': [
    '................',
    '..KK............',
    '..KKKKKKKKKKKK..',
    '..KKRRRRRRRRKK..',
    '..KKRWWRRWWRKK..',
    '..KKRWWRRWWRKK..',
    '..KKRRRRRRRRKK..',
    '..KKRWWRRWWRKK..',
    '..KKRWWRRWWRKK..',
    '..KKRRRRRRRRKK..',
    '..KKKKKKKKKKKK..',
    '..KK............',
    '..KK............',
    '..KK............',
    '..KK............',
    '..KK............',
  ],
  // tree (using-git-worktrees)
  'using-git-worktrees': [
    '................',
    '......KKKK......',
    '.....KGGGGK.....',
    '....KGGGGGGK....',
    '...KGGGGGGGGK...',
    '...KGGGGGGGGK...',
    '..KGGGGGGGGGGK..',
    '..KGGGGGGGGGGK..',
    '...KGGGGGGGGK...',
    '....KGGGGGGK....',
    '.....KGGGGK.....',
    '......KOOK......',
    '......KOOK......',
    '......KOOK......',
    '......KOOK......',
    '................',
  ],
  // robot (subagent-driven-development)
  'subagent-driven-development': [
    '................',
    '......KKKK......',
    '......KSSK......',
    '....KKKSSSKKK...',
    '...KSSSSSSSSSK..',
    '...KSWSSSSSSWK..',
    '...KSWSSSSSSWK..',
    '...KSSSSSSSSSK..',
    '...KSSKKKKKSSK..',
    '...KSSSSSSSSSK..',
    '...KKKKKKKKKKK..',
    '....K........K..',
    '....KSSKKSSSKK..',
    '....KK..KKK.....',
    '....KK....KK....',
    '................',
  ],
  // fork/parallel (dispatching-parallel-agents)
  'dispatching-parallel-agents': [
    '................',
    '...KKK....KKK...',
    '...KBK....KBK...',
    '...KBK....KBK...',
    '...KBK....KBK...',
    '....KK....KK....',
    '.....KKKKKK.....',
    '......KBBK......',
    '......KBBK......',
    '......KBBK......',
    '....KKKKKKKK....',
    '...KK......KK...',
    '..KK........KK..',
    '..KBK......KBK..',
    '..KKK......KKK..',
    '................',
  ],
  // sparkle (simplify)
  simplify: [
    '................',
    '.......K........',
    '......KYK.......',
    '.....KYYYK......',
    '....KYYYYYK.....',
    '...KYYYYYYYK....',
    '..KYYYYYYYYYK...',
    '.KKKKKKKKKKKKK..',
    '..KYYYYYYYYYK...',
    '...KYYYYYYYK....',
    '....KYYYYYK.....',
    '.....KYYYK......',
    '......KYK.......',
    '.......K........',
    '................',
    '................',
  ],
  // schedule clock
  schedule: [
    '................',
    '.....KKKKKK.....',
    '....KSSSSSSK....',
    '...KSWWWWWWSK...',
    '..KSWKWWWKWWSK..',
    '..KSWWWWWWWWSK..',
    '..KSWWWKWWWWSK..',
    '..KSWWKKKWWWSK..',
    '..KSWWWWKWWWSK..',
    '..KSWWWWWKWWSK..',
    '..KSWKWWWWWKSK..',
    '...KSWWWWWWSK...',
    '....KSSSSSSK....',
    '.....KKKKKK.....',
    '................',
    '................',
  ],
  // plug (claude-api)
  'claude-api': [
    '................',
    '......KKKK......',
    '......KPPK......',
    '......KPPK......',
    '....KKKKKKKK....',
    '....KPPPPPPK....',
    '....KPPPPPPK....',
    '....KPPPPPPK....',
    '....KKKKKKKK....',
    '......KPPK......',
    '......KPPK......',
    '......KPPK......',
    '....KKKPPKKK....',
    '...KKK....KKK...',
    '................',
    '................',
  ],
  // gear (update-config)
  'update-config': [
    '................',
    '......KKKK......',
    '....KKKDDKKK....',
    '..KKDDDDDDDKK...',
    '..KDDDKKKDDDKK..',
    '.KDDKK..KKDDKK..',
    '.KDDK....KDDDK..',
    '.KDDK..WW.KDDK..',
    '.KDDK..WW.KDDK..',
    '.KDDK....KDDDK..',
    '.KDDKK..KKDDKK..',
    '..KDDDKKKDDDKK..',
    '..KKDDDDDDDKK...',
    '....KKKDDKKK....',
    '......KKKK......',
    '................',
  ],
  // keyboard
  'keybindings-help': [
    '................',
    '..KKKKKKKKKKKK..',
    '..KDDDDDDDDDDK..',
    '..KDWWKWKWKWWK..',
    '..KDWWKWKWKWWK..',
    '..KDDDDDDDDDDK..',
    '..KDWKWKWKWKWK..',
    '..KDWKWKWKWKWK..',
    '..KDDDDDDDDDDK..',
    '..KDWWWWWWWWWK..',
    '..KDWWWWWWWWWK..',
    '..KDDDDDDDDDDK..',
    '..KKKKKKKKKKKK..',
    '................',
    '................',
    '................',
  ],
  // unlock (fewer-permission-prompts)
  'fewer-permission-prompts': [
    '................',
    '....KKKKK.......',
    '...KYYYYYK......',
    '...KYKKKYK......',
    '...KYK..KK......',
    '...KYK..........',
    '...KYK..........',
    '..KKKKKKKKK.....',
    '..KYYYYYYYK.....',
    '..KYKKKKKYK.....',
    '..KYKDDDKYK.....',
    '..KYKDDDKYK.....',
    '..KYKKKKKYK.....',
    '..KYYYYYYYK.....',
    '..KKKKKKKKK.....',
    '................',
  ],
  // loop arrow
  loop: [
    '................',
    '....KKKKKKKK....',
    '..KKBBBBBBBBKK..',
    '..KBKKKKKKKKBK..',
    '..KBK......KBK..',
    '..KBK..KKK.KBK..',
    '..KBK.KBBBKKBK..',
    '..KBK.KBBBK.BK..',
    '..KBKKKBBBKKBK..',
    '..KBKBBBBBBBKK..',
    '..KBKKBBBBBKKK..',
    '..KBKKKBBBKKKK..',
    '..KKBBBBBBBBKK..',
    '....KKKKKKKK....',
    '................',
    '................',
  ],
  // requesting code review (outbox)
  'requesting-code-review': [
    '................',
    '..KKKKKKKKKKKK..',
    '..KBBBBBBBBBBK..',
    '..KBKWWWWWWKBK..',
    '..KBKWKKKKKKBK..',
    '..KBKWKWWWWKBK..',
    '..KBKWKWKKWKBK..',
    '..KBKWKWWWWKBK..',
    '..KBKWKKKKWKBK..',
    '..KBKWWWWWWKBK..',
    '..KBBBBBBBBBBK..',
    '..KBKKKKKKKKBK..',
    '..KBKKBBBBKKBK..',
    '..KBKKKKKKKKBK..',
    '..KKKKKKKKKKKK..',
    '................',
  ],
  // receiving code review (inbox)
  'receiving-code-review': [
    '................',
    '..KKKKKKKKKKKK..',
    '..KGGGGGGGGGGK..',
    '..KGKKKKKKKKGK..',
    '..KGKWWWWWWKGK..',
    '..KGKWGGGGWKGK..',
    '..KGKWGGGGWKGK..',
    '..KGKWGGGGWKGK..',
    '..KGKWWWWWWKGK..',
    '..KGGGGGGGGGGK..',
    '..KGKGGGGGGKGK..',
    '..KGKKGGGGKKGK..',
    '..KGKKKGGKKKGK..',
    '..KGKKKKKKKKGK..',
    '..KKKKKKKKKKKK..',
    '................',
  ],
};

// Aliases (multiple skills → same icon)
const ALIASES = {
  'figma-to-tailwind': 'palette',
  'frontend-design': 'palette',
  'review': 'requesting-code-review',
  'code-review': 'requesting-code-review',
  'security-review': 'fewer-permission-prompts',
  'init': 'commit-prepare',
  'writing-skills': 'writing-plans',
  'execute-plan': 'executing-plans',
  'write-plan': 'writing-plans',
  'brainstorm': 'brainstorming',
};

function gridToSvg(grid) {
  const rects = [];
  for (let y = 0; y < SIZE; y++) {
    const row = grid[y];
    let runStart = -1;
    let runColor = null;
    for (let x = 0; x <= SIZE; x++) {
      const ch = x < SIZE ? row[x] : '.';
      const color = ch === '.' ? null : C[ch] || null;
      if (color === runColor) continue;
      if (runColor && runStart >= 0) {
        rects.push(
          `<rect x="${runStart}" y="${y}" width="${x - runStart}" height="1" fill="${runColor}"/>`
        );
      }
      runStart = color ? x : -1;
      runColor = color;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" shape-rendering="crispEdges">${rects.join('')}</svg>`;
}

async function buildDefault() {
  const svgPath = path.join(OUT, '_default.svg');
  if (!fs.existsSync(svgPath)) return;
  await sharp(fs.readFileSync(svgPath))
    .resize(96, 96, { kernel: sharp.kernel.nearest })
    .png()
    .toFile(path.join(OUT, '_default.png'));
}

async function build() {
  await buildDefault();
  const manifest = {};
  for (const [name, grid] of Object.entries(ICONS)) {
    const svg = gridToSvg(grid);
    fs.writeFileSync(path.join(OUT, `${name}.svg`), svg);
    await sharp(Buffer.from(svg))
      .resize(PNG_SIZE, PNG_SIZE, { kernel: sharp.kernel.nearest })
      .png()
      .toFile(path.join(OUT, `${name}.png`));
    manifest[name] = `${name}.png`;
  }
  for (const [alias, target] of Object.entries(ALIASES)) {
    manifest[alias] = `${target}.png`;
  }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`built ${Object.keys(ICONS).length} icons + ${Object.keys(ALIASES).length} aliases`);
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
