/* eslint-disable */
/* eslint-env node */
/**
 * 🔐 Pre-commit Secret Scanner (Fast & Lightweight)
 *
 * 커밋 전 하드코딩된 시크릿 감지 - 실행 시간 <1초 목표
 *
 * 감지 대상:
 * - API Keys (OpenAI, Anthropic, Google, AWS 등)
 * - Webhook URLs (Slack, Discord)
 * - Private Keys (RSA, SSH)
 * - Database URLs with credentials
 * - JWT/Bearer Tokens
 */

const { execSync } = require('child_process');
const fs = require('fs');

// 🔐 Secret patterns (high-confidence only to avoid false positives)
const PATTERNS = [
  // API Keys
  { name: 'OpenAI API Key', pattern: /sk-[a-zA-Z0-9]{20,}/ },
  { name: 'Anthropic API Key', pattern: /sk-ant-[a-zA-Z0-9-]{20,}/ },
  { name: 'Google API Key', pattern: /AIza[0-9A-Za-z-_]{35}/ },
  { name: 'AWS Access Key', pattern: /AKIA[0-9A-Z]{16}/ },
  { name: 'GitHub Token', pattern: /ghp_[a-zA-Z0-9]{36}/ },
  { name: 'GitHub OAuth', pattern: /gho_[a-zA-Z0-9]{36}/ },

  // Webhooks
  { name: 'Slack Webhook', pattern: /https?:\/\/hooks\.slack\.com\/services\/[A-Z0-9]+\/[A-Z0-9]+\/[A-Za-z0-9]+/ },
  { name: 'Discord Webhook', pattern: /https?:\/\/discord(?:app)?\.com\/api\/webhooks\/[0-9]+\/[A-Za-z0-9_-]+/ },

  // Private Keys (첫 줄만 체크)
  { name: 'RSA Private Key', pattern: /-----BEGIN RSA PRIVATE KEY-----/ },
  { name: 'SSH Private Key', pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/ },
  { name: 'PGP Private Key', pattern: /-----BEGIN PGP PRIVATE KEY BLOCK-----/ },

  // Database URLs with password
  { name: 'Database URL with Password', pattern: /(?:mysql|postgres|mongodb):\/\/[^:]+:[^@]+@/ },

  // Supabase (프로젝트 특화)
  { name: 'Supabase Service Role Key', pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]{50,}/ },
];

// 📁 Skip patterns (false positive 방지)
const SKIP_FILES = [
  /\.env\.example$/,
  /\.env\..*\.example$/,
  /\.md$/,           // Documentation
  /package-lock\.json$/,
  /\.test\.(ts|js)x?$/,
  /__mocks__\//,
  /\.snap$/,
  /precommit-check-secrets\.cjs$/, // Self (contains detection patterns)
  /check-hardcoded-secrets\.js$/,  // Related scanner script
];

// 🚀 Get staged files (safe - no user input)
function getStagedFiles() {
  try {
    // execSync with fixed command is safe (no user input injection risk)
    return execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .map(f => f.trim())
      .filter(f => f && fs.existsSync(f));
  } catch {
    return [];
  }
}

// 📁 Should skip this file?
function shouldSkip(file) {
  return SKIP_FILES.some(pattern => pattern.test(file));
}

// 🔍 Scan file for secrets
function scanFile(file) {
  const findings = [];

  // Skip large files (>500KB) and binary files
  try {
    const stats = fs.statSync(file);
    if (stats.size > 500 * 1024) return findings;

    const content = fs.readFileSync(file, 'utf8');

    // Quick binary check
    if (content.includes('\0')) return findings;

    for (const { name, pattern } of PATTERNS) {
      if (pattern.test(content)) {
        findings.push({ file, secret: name });
      }
    }
  } catch {
    // File read error - skip silently
  }

  return findings;
}

// 🏃 Main
const startTime = Date.now();
const stagedFiles = getStagedFiles();
const filesToScan = stagedFiles.filter(f => !shouldSkip(f));
const allFindings = [];

for (const file of filesToScan) {
  const findings = scanFile(file);
  allFindings.push(...findings);
}

const elapsed = Date.now() - startTime;

if (allFindings.length > 0) {
  console.error('');
  console.error('🔐 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('❌ SECRET DETECTED - Commit Blocked');
  console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.error('');

  for (const { file, secret } of allFindings) {
    console.error(`   📄 ${file}`);
    console.error(`      └─ ${secret}`);
  }

  console.error('');
  console.error('💡 해결 방법:');
  console.error('   1. 해당 파일에서 시크릿 제거');
  console.error('   2. 환경변수로 이동 (.env.local)');
  console.error('   3. .gitignore에 추가');
  console.error('');
  console.error(`⏱️  스캔 완료: ${filesToScan.length}개 파일, ${elapsed}ms`);
  console.error('');
  process.exit(1);
}

// Silent success (for speed)
process.exit(0);
