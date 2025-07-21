#!/usr/bin/env node

/**
 * 🔍 GitHub Actions 디버깅 및 해결 스크립트
 * GitHub Pro 업그레이드 후에도 Actions가 실행되지 않는 문제 진단
 */

console.log('🔍 GitHub Actions 문제 진단 시작...\n');

// 1. 워크플로우 파일 검증
console.log('📋 1. 워크플로우 파일 검증');
const fs = require('fs');
const path = require('path');

const workflowPath = '.github/workflows/ci.yml';
if (fs.existsSync(workflowPath)) {
  const content = fs.readFileSync(workflowPath, 'utf8');

  console.log('✅ 워크플로우 파일 존재');
  console.log('📄 파일 크기:', fs.statSync(workflowPath).size, 'bytes');

  // 트리거 조건 확인
  if (content.includes('push:') && content.includes('branches: [ main')) {
    console.log('✅ main 브랜치 push 트리거 설정됨');
  } else {
    console.log('❌ main 브랜치 트리거 설정 문제');
  }

  // 시크릿 사용 확인
  if (content.includes('secrets.VERCEL_TOKEN')) {
    console.log('⚠️  VERCEL_TOKEN 시크릿 필요 (GitHub 저장소 설정 확인 필요)');
  }
} else {
  console.log('❌ 워크플로우 파일 없음');
}

console.log('\n📋 2. Git 저장소 상태 확인');
const { execSync } = require('child_process');

try {
  const branch = execSync('git branch --show-current', {
    encoding: 'utf8',
  }).trim();
  console.log('🌿 현재 브랜치:', branch);

  const remoteUrl = execSync('git remote get-url origin', {
    encoding: 'utf8',
  }).trim();
  console.log('🔗 원격 저장소:', remoteUrl);

  // 최근 커밋 확인
  const lastCommit = execSync('git log -1 --format="%H %s"', {
    encoding: 'utf8',
  }).trim();
  console.log('📝 최근 커밋:', lastCommit);

  // origin/main과의 동기화 상태
  const status = execSync('git status --porcelain', {
    encoding: 'utf8',
  }).trim();
  if (status === '') {
    console.log('✅ 로컬 변경사항 없음');
  } else {
    console.log('⚠️  로컬에 커밋되지 않은 변경사항 있음');
  }
} catch (error) {
  console.log('❌ Git 상태 확인 실패:', error.message);
}

console.log('\n📋 3. 가능한 해결 방법들');
console.log(`
🔧 즉시 시도해볼 수 있는 해결 방법들:

1️⃣ **GitHub 저장소 설정 확인**
   • https://github.com/skyasu2/openmanager-vibe-v5/settings/actions
   • "Actions permissions" → "Allow all actions and reusable workflows" 선택
   • "Workflow permissions" → "Read and write permissions" 선택

2️⃣ **VERCEL_TOKEN 시크릿 설정**
   • https://github.com/skyasu2/openmanager-vibe-v5/settings/secrets/actions
   • New repository secret → Name: VERCEL_TOKEN
   • Value: Vercel 계정의 토큰 (https://vercel.com/account/tokens)

3️⃣ **Actions 탭에서 수동 실행**
   • https://github.com/skyasu2/openmanager-vibe-v5/actions
   • "Fast Deploy" 워크플로우 선택 → "Run workflow" 클릭

4️⃣ **단순 워크플로우로 테스트**
   • 현재 복잡한 Vercel 배포 대신 간단한 테스트 워크플로우로 먼저 확인

5️⃣ **브랜치 보호 규칙 확인**
   • https://github.com/skyasu2/openmanager-vibe-v5/settings/branches
   • main 브랜치에 과도한 보호 규칙이 있는지 확인
`);

console.log('\n🚀 4. 간단한 테스트 워크플로우 생성');
console.log(
  '복잡한 Vercel 배포 대신 기본 테스트를 위한 워크플로우를 생성할까요?'
);

const simpleWorkflow = `name: 🧪 Simple Test

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    name: ✅ Basic Test
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v4
      
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        
    - name: Install
      run: npm ci
      
    - name: Build
      run: npm run build
      
    - name: Success
      run: echo "🎉 GitHub Actions is working!"
`;

// 간단한 워크플로우 백업 생성
fs.writeFileSync('.github/workflows/simple-test.yml', simpleWorkflow);
console.log(
  '✅ 간단한 테스트 워크플로우 생성됨: .github/workflows/simple-test.yml'
);

console.log('\n🎯 다음 단계:');
console.log('1. 위의 GitHub 설정들을 확인하세요');
console.log('2. 간단한 워크플로우가 실행되는지 테스트하세요');
console.log('3. 성공하면 원래 워크플로우에 VERCEL_TOKEN을 추가하세요');
console.log('\n✅ 진단 완료!');
