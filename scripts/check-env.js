#!/usr/bin/env node
/**
 * 🔍 환경변수 상태 확인 스크립트
 *
 * 개발 환경에서 환경변수가 올바르게 설정되어 있는지 확인합니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 환경변수 상태 확인 시작...\n');

// .env.local 파일 확인
const envPath = path.join(process.cwd(), '.env.local');
const hasEnvFile = fs.existsSync(envPath);

console.log(`📁 .env.local 파일: ${hasEnvFile ? '✅ 존재' : '❌ 없음'}`);

if (hasEnvFile) {
  const envContent = fs.readFileSync(envPath, 'utf8');

  // 주요 환경변수들 확인
  const checkVars = [
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'GOOGLE_AI_API_KEY',
    'UPSTASH_REDIS_REST_URL',
    'KV_REST_API_URL',
  ];

  console.log('\n🔧 환경변수 설정 상태:');

  for (const varName of checkVars) {
    const regex = new RegExp(`^${varName}=(.+)$`, 'm');
    const match = envContent.match(regex);

    if (match) {
      const value = match[1];
      const isTemplate = value.includes('your_') || value.includes('_here');
      const status = isTemplate ? '🟡 템플릿값' : '✅ 설정됨';
      console.log(`  ${varName}: ${status}`);
    } else {
      console.log(`  ${varName}: ❌ 없음`);
    }
  }
}

// 현재 process.env 확인
console.log('\n🌐 런타임 환경변수:');
const runtimeVars = [
  'NODE_ENV',
  'NEXT_PUBLIC_APP_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'VERCEL',
  'VERCEL_ENV',
];

for (const varName of runtimeVars) {
  const value = process.env[varName];
  console.log(`  ${varName}: ${value || '❌ 없음'}`);
}

console.log('\n✅ 환경변수 상태 확인 완료');
