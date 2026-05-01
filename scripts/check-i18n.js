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
// Filter out false positives (DOM tagnames etc.) and dynamic key prefixes
// like t('class.' + id + '.name') — those have a trailing dot from string
// concatenation and aren't real keys.
const DOM_TAGS = new Set(['span', 'div', 'a', 'img', 'p', 'h3', 'h4', 'br']);
const realRefs = [...referenced].filter(
  (k) => !DOM_TAGS.has(k) && k.includes('.') && !k.endsWith('.')
);

// Check that every referenced key exists in every supported locale
for (const loc of i18n.SUPPORTED) {
  const dict = i18n.STRINGS[loc];
  if (!dict) {
    fail(`SUPPORTED includes ${loc} but STRINGS.${loc} is missing`);
    continue;
  }
  const missing = realRefs.filter((k) => !(k in dict));
  if (missing.length) {
    fail(`Referenced keys missing in ${loc.toUpperCase()} locale (${missing.length}): ${missing.slice(0, 8).join(', ')}${missing.length > 8 ? ', …' : ''}`);
  } else {
    ok(`All ${realRefs.length} referenced keys exist in ${loc.toUpperCase()}`);
  }
}

// Check that every locale has the same key set as EN (canonical source)
const enKeys = new Set(Object.keys(i18n.STRINGS.en));
for (const loc of i18n.SUPPORTED) {
  if (loc === 'en') continue;
  const locKeys = new Set(Object.keys(i18n.STRINGS[loc] || {}));
  const enOnly = [...enKeys].filter((k) => !locKeys.has(k));
  const locOnly = [...locKeys].filter((k) => !enKeys.has(k));
  if (enOnly.length) {
    fail(`Keys in EN but not ${loc.toUpperCase()} (${enOnly.length}): ${enOnly.slice(0, 8).join(', ')}${enOnly.length > 8 ? ', …' : ''}`);
  }
  if (locOnly.length) {
    fail(`Keys in ${loc.toUpperCase()} but not EN (${locOnly.length}): ${locOnly.slice(0, 8).join(', ')}${locOnly.length > 8 ? ', …' : ''}`);
  }
  if (!enOnly.length && !locOnly.length) {
    ok(`EN and ${loc.toUpperCase()} contain the same keys (${enKeys.size})`);
  }
}

if (failed) {
  console.error(`\n${failed} check(s) failed.`);
  process.exit(1);
}
console.log('\nAll i18n checks passed.');
