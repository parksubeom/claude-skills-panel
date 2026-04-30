#!/usr/bin/env node
// i18n regression checks. Fails (exit 1) on any of:
//   1. Korean characters left inline in extension.js
//   2. t('...') calls referencing keys missing from EN or KO
//   3. EN/KO string sets diverge (a key present in only one locale)
//
// Designed to run fast (< 50ms) so it can sit in pre-publish hooks and CI.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const EXT_PATH = path.join(ROOT, 'extension.js');

let failed = 0;
function fail(msg) { console.error('  ✘ ' + msg); failed++; }
function ok(msg) { console.log('  ✔ ' + msg); }

// 1. Stray Korean in extension.js
const ext = fs.readFileSync(EXT_PATH, 'utf8');
const koLines = [];
ext.split('\n').forEach((line, i) => {
  if (/[가-힣]/.test(line)) koLines.push({ line: i + 1, text: line.trim() });
});
if (koLines.length) {
  fail('Korean characters left in extension.js — should go through i18n/strings.js:');
  for (const k of koLines.slice(0, 10)) {
    console.error(`      L${k.line}: ${k.text.slice(0, 80)}`);
  }
  if (koLines.length > 10) console.error(`      … (${koLines.length - 10} more)`);
} else {
  ok('No stray Korean in extension.js');
}

// 2. Key reference parity
const i18n = require(path.join(ROOT, 'i18n', 'strings'));
const referenced = new Set();
// Match server-side t('foo') / t('foo', { ... }) and client-side via STR['foo'] is rare
const re = /\bt\(\s*['"]([a-zA-Z][\w.]+)['"]/g;
let m;
while ((m = re.exec(ext))) referenced.add(m[1]);
// Filter out false positives (DOM tagnames etc.)
const DOM_TAGS = new Set(['span', 'div', 'a', 'img', 'p', 'h3', 'h4', 'br']);
const realRefs = [...referenced].filter((k) => !DOM_TAGS.has(k) && k.includes('.'));

const en = i18n.STRINGS.en;
const ko = i18n.STRINGS.ko;
const missingEn = realRefs.filter((k) => !(k in en));
const missingKo = realRefs.filter((k) => !(k in ko));
if (missingEn.length) {
  fail(`Referenced keys missing in EN locale (${missingEn.length}): ${missingEn.slice(0, 8).join(', ')}${missingEn.length > 8 ? ', …' : ''}`);
} else {
  ok(`All ${realRefs.length} referenced keys exist in EN`);
}
if (missingKo.length) {
  fail(`Referenced keys missing in KO locale (${missingKo.length}): ${missingKo.slice(0, 8).join(', ')}${missingKo.length > 8 ? ', …' : ''}`);
} else {
  ok(`All ${realRefs.length} referenced keys exist in KO`);
}

// 3. EN/KO key set parity
const enKeys = new Set(Object.keys(en));
const koKeys = new Set(Object.keys(ko));
const enOnly = [...enKeys].filter((k) => !koKeys.has(k));
const koOnly = [...koKeys].filter((k) => !enKeys.has(k));
if (enOnly.length) {
  fail(`Keys defined in EN only (${enOnly.length}): ${enOnly.slice(0, 8).join(', ')}${enOnly.length > 8 ? ', …' : ''}`);
} else {
  ok(`EN and KO contain the same keys (${enKeys.size})`);
}
if (koOnly.length) {
  fail(`Keys defined in KO only (${koOnly.length}): ${koOnly.slice(0, 8).join(', ')}${koOnly.length > 8 ? ', …' : ''}`);
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll i18n checks passed.');
