#!/usr/bin/env node
/**
 * Claude JSON Sanitizer
 * - Scans .claude/*.json files under the current project for invalid Unicode
 *   (unpaired surrogates and disallowed control chars) that can break API JSON bodies.
 * - By default, prints a report. Use --write to rewrite files in-place.
 */

const fs = require('fs');
const path = require('path');

const CLAUDE_DIR = path.join(process.cwd(), '.claude');

function sanitizeString(input) {
  if (typeof input !== 'string') return input;
  let s = input;
  // Replace unpaired high surrogates not followed by a low surrogate
  s = s.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/g, '\uFFFD');
  // Replace unpaired low surrogates not preceded by a high surrogate
  s = s.replace(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '\uFFFD');
  // Replace control characters except TAB(\u0009), LF(\u000A), CR(\u000D)
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  return s;
}

function walkAndSanitize(obj, stats) {
  if (obj == null) return obj;
  if (typeof obj === 'string') {
    const before = obj;
    const after = sanitizeString(before);
    if (before !== after) stats.modifiedStrings++;
    return after;
  }
  if (Array.isArray(obj)) {
    return obj.map((v) => walkAndSanitize(v, stats));
  }
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      const newKey = sanitizeString(k);
      if (newKey !== k) stats.modifiedKeys++;
      out[newKey] = walkAndSanitize(v, stats);
    }
    return out;
  }
  return obj;
}

function processFile(filePath, write) {
  const raw = fs.readFileSync(filePath);
  // Ensure we read as UTF-8 and ignore BOM
  let text = raw.toString('utf8');
  if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
  let json;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { filePath, ok: false, error: `JSON parse error: ${e.message}` };
  }
  const stats = { modifiedStrings: 0, modifiedKeys: 0 };
  const sanitized = walkAndSanitize(json, stats);
  const changed = stats.modifiedStrings > 0 || stats.modifiedKeys > 0;
  if (write && changed) {
    const out = JSON.stringify(sanitized, null, 2);
    fs.writeFileSync(filePath, out, 'utf8');
  }
  return { filePath, ok: true, changed, stats };
}

function main() {
  const write = process.argv.includes('--write');
  if (!fs.existsSync(CLAUDE_DIR)) {
    console.log(`[claude-json-sanitize] No .claude directory in project: ${CLAUDE_DIR}`);
    process.exit(0);
  }
  const files = fs.readdirSync(CLAUDE_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => path.join(CLAUDE_DIR, f));
  if (files.length === 0) {
    console.log('[claude-json-sanitize] No JSON files under .claude');
    process.exit(0);
  }
  let totalChanged = 0;
  let totalErrors = 0;
  for (const file of files) {
    const res = processFile(file, write);
    if (!res.ok) {
      totalErrors++;
      console.log(`- ${file}: ERROR: ${res.error}`);
      continue;
    }
    if (res.changed) {
      totalChanged++;
      console.log(`- ${file}: sanitized (${res.stats.modifiedStrings} strings, ${res.stats.modifiedKeys} keys)`);
    } else {
      console.log(`- ${file}: OK (no changes)`);
    }
  }
  if (!write && totalChanged > 0) {
    console.log(`\nRun with --write to apply ${totalChanged} pending sanitizations.`);
  }
  if (write) {
    console.log(`\nApplied sanitization to ${totalChanged} file(s).`);
  }
  if (totalErrors > 0) process.exitCode = 1;
}

main();

