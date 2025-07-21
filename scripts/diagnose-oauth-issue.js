#!/usr/bin/env node

/**
 * 🔍 GitHub OAuth 문제 진단 도구
 *
 * 현재 환경 설정을 확인하고 문제를 진단합니다.
 */

const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

console.log(chalk.cyan('━'.repeat(80)));
console.log(chalk.cyan.bold('🔍 GitHub OAuth 로그인 문제 진단'));
console.log(chalk.cyan('━'.repeat(80)));

// 1. 환경 변수 확인
console.log(chalk.yellow('\n1. 환경 변수 확인:'));

const envFiles = ['.env.local', '.env'];
let envVars = {};

for (const envFile of envFiles) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath)) {
    console.log(chalk.green(`✅ ${envFile} 파일 발견`));
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      if (line && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key) envVars[key.trim()] = value?.trim() || '';
      }
    });
  } else {
    console.log(chalk.gray(`❌ ${envFile} 파일 없음`));
  }
}

// 2. GitHub OAuth 설정 확인
console.log(chalk.yellow('\n2. GitHub OAuth 설정:'));

const githubClientId = envVars.GITHUB_CLIENT_ID || process.env.GITHUB_CLIENT_ID;
const githubClientSecret =
  envVars.GITHUB_CLIENT_SECRET || process.env.GITHUB_CLIENT_SECRET;
const nextAuthUrl = envVars.NEXTAUTH_URL || process.env.NEXTAUTH_URL;

if (githubClientId) {
  console.log(chalk.green(`✅ GITHUB_CLIENT_ID: ${githubClientId}`));
} else {
  console.log(chalk.red('❌ GITHUB_CLIENT_ID가 설정되지 않음'));
}

if (githubClientSecret) {
  console.log(
    chalk.green(
      `✅ GITHUB_CLIENT_SECRET: ${githubClientSecret.slice(0, 10)}...`
    )
  );
} else {
  console.log(chalk.red('❌ GITHUB_CLIENT_SECRET이 설정되지 않음'));
}

if (nextAuthUrl) {
  console.log(chalk.green(`✅ NEXTAUTH_URL: ${nextAuthUrl}`));
} else {
  console.log(
    chalk.yellow('⚠️  NEXTAUTH_URL이 설정되지 않음 (동적으로 감지됨)')
  );
}

// 3. Supabase 설정 확인
console.log(chalk.yellow('\n3. Supabase 설정:'));

const supabaseUrl =
  envVars.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseUrl !== 'your_supabase_project_url_here') {
  console.log(chalk.green(`✅ SUPABASE_URL: ${supabaseUrl}`));
} else {
  console.log(chalk.red('❌ SUPABASE_URL이 설정되지 않음'));
}

if (supabaseAnonKey && supabaseAnonKey !== 'your_supabase_anon_key_here') {
  console.log(
    chalk.green(`✅ SUPABASE_ANON_KEY: ${supabaseAnonKey.slice(0, 20)}...`)
  );
} else {
  console.log(chalk.red('❌ SUPABASE_ANON_KEY가 설정되지 않음'));
}

// 4. 문제 진단
console.log(chalk.yellow('\n4. 문제 진단:'));

const problems = [];
const solutions = [];

// localhost 문제 확인
if (nextAuthUrl && nextAuthUrl.includes('localhost')) {
  problems.push('NEXTAUTH_URL이 localhost로 설정됨');
  solutions.push('Vercel 환경 변수에서 NEXTAUTH_URL을 실제 도메인으로 설정');
}

// GitHub OAuth 앱 설정 안내
if (githubClientId && githubClientSecret) {
  console.log(chalk.blue('\n📋 GitHub OAuth 앱 확인사항:'));
  console.log('1. https://github.com/settings/developers 접속');
  console.log(`2. Client ID가 ${githubClientId}인 앱 찾기`);
  console.log('3. Authorization callback URL 확인:');
  console.log(`   - 로컬: http://localhost:3000/auth/callback`);
  console.log(`   - 프로덕션: https://your-domain.vercel.app/auth/callback`);
}

// 5. 해결 방법
console.log(chalk.yellow('\n5. 권장 해결 방법:'));

if (problems.length > 0) {
  console.log(chalk.red('\n발견된 문제:'));
  problems.forEach((p, i) => console.log(`  ${i + 1}. ${p}`));

  console.log(chalk.green('\n해결 방법:'));
  solutions.forEach((s, i) => console.log(`  ${i + 1}. ${s}`));
} else {
  console.log(chalk.green('✅ 환경 설정에는 문제가 없어 보입니다.'));
}

console.log(chalk.blue('\n📌 즉시 사용 가능한 대안:'));
console.log('1. 게스트 로그인 사용 (GitHub 인증 불필요)');
console.log('2. 로컬에서 개발 서버 실행: npm run dev');

// 6. 테스트 URL 생성
console.log(chalk.yellow('\n6. 테스트 URL:'));
const testOrigin = nextAuthUrl || 'http://localhost:3000';
console.log(`OAuth 콜백 URL: ${testOrigin}/auth/callback`);
console.log(`로그인 페이지: ${testOrigin}/login`);

console.log(chalk.cyan('\n' + '━'.repeat(80)));
console.log(
  chalk.green.bold(
    '💡 추가 도움이 필요하면 /docs/fix-github-oauth-error.md 참조'
  )
);
console.log(chalk.cyan('━'.repeat(80)));
