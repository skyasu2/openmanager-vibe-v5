#!/usr/bin/env node

/**
 * Cross-platform Post-commit Hook
 * v2.0.0 - Simplified for Claude Code skill integration
 *
 * AI code review is now integrated into /commit skill
 * This hook only provides guidance
 */

const { execFileSync } = require('child_process');

// Get commit info safely using execFileSync (no shell injection risk)
let commitHash, commitMsg;
try {
  commitHash = execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
  commitMsg = execFileSync('git', ['log', '-1', '--format=%s'], { encoding: 'utf8' }).trim();
} catch {
  commitHash = 'unknown';
  commitMsg = 'unknown';
}

console.log('');
console.log(`✅ 커밋 완료: ${commitHash} ${commitMsg.substring(0, 50)}`);
console.log('');
console.log('💡 AI 코드 리뷰는 Claude Code /commit 스킬에 통합되었습니다.');
console.log('   다음 커밋부터 자동 AI 리뷰가 포함됩니다.');
console.log('');
console.log('   수동 리뷰: /ai-code-review 또는 npm run review:show');
console.log('');

process.exit(0);
