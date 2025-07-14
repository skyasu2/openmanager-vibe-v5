/* eslint-disable */
/* eslint-env node */
/**
 * 🔐 Pre-commit secret scanner
 *
 * Blocks commits that accidentally contain a plaintext Slack webhook URL or other
 * known sensitive patterns. Currently checks for the following:
 *   1. Slack incoming webhook URLs (https://hooks.slack.com/services/...)
 *
 * Extend this list as necessary for additional secret patterns.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Regex patterns for secrets to block
const PATTERNS = [
  /https?:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/g, // Slack incoming webhook
];

// Get list of staged files
const stagedFiles = execSync('git diff --cached --name-only', {
  encoding: 'utf-8',
})
  .split('\n')
  .map(f => f.trim())
  .filter(f => f && fs.existsSync(f));

let hasSecretLeak = false;
const offendingFiles = [];

stagedFiles.forEach(file => {
  // Only scan text files up to 1 MB for performance
  if (fs.statSync(file).size > 1024 * 1024) return;

  const content = fs.readFileSync(file, 'utf8');

  for (const pattern of PATTERNS) {
    if (pattern.test(content)) {
      hasSecretLeak = true;
      offendingFiles.push(file);
      break;
    }
  }
});

if (hasSecretLeak) {
  console.error(
    '\u274C  Slack webhook or other secret detected in the following files:'
  );
  offendingFiles.forEach(f => console.error(`   - ${f}`));
  console.error(
    '\n🛑  Commit aborted. Please remove or encrypt the secret and try again.'
  );
  process.exit(1);
}

process.exit(0);
