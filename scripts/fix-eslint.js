#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 ESLint 9 호환성 문제 해결 스크립트 시작...\n');

// 1. 현재 ESLint 버전 확인
console.log('1️⃣ 현재 설치된 패키지 버전 확인:');
try {
  const eslintVersion = execSync('npm list eslint --depth=0', { encoding: 'utf8' });
  const nextVersion = execSync('npm list next --depth=0', { encoding: 'utf8' });
  console.log('ESLint:', eslintVersion.split('\n')[1]);
  console.log('Next.js:', nextVersion.split('\n')[1]);
} catch (error) {
  console.log('버전 확인 중 오류 발생');
}

// 2. Next.js 15와 호환되는 설정 사용
console.log('\n2️⃣ Next.js 15 호환 설정 적용:');

// package.json 업데이트
const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// lint 스크립트를 Next.js 기본값으로 복원
packageJson.scripts.lint = "next lint";
packageJson.scripts['lint:fix'] = "next lint --fix";
packageJson.scripts['lint:strict'] = "next lint --max-warnings=0";

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
console.log('✅ package.json 업데이트 완료');

// 3. ESLint 캐시 삭제
console.log('\n3️⃣ ESLint 캐시 정리:');
try {
  execSync('rm -rf .next/cache/eslint', { stdio: 'inherit' });
  execSync('rm -rf node_modules/.cache/eslint*', { stdio: 'inherit' });
  console.log('✅ 캐시 삭제 완료');
} catch (error) {
  console.log('캐시가 없거나 삭제 중 오류 발생 (정상)');
}

// 4. next.config.mjs에서 ESLint 설정 확인
console.log('\n4️⃣ next.config.mjs ESLint 설정 확인:');
const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
if (nextConfig.includes('ignoreDuringBuilds: false')) {
  console.log('✅ ESLint 빌드 검사 활성화됨');
} else {
  console.log('⚠️  ESLint 빌드 검사가 비활성화되어 있습니다');
}

// 5. 해결 방안 제시
console.log('\n📋 권장 해결 방안:');
console.log('1. ESLint를 개발 의존성으로만 사용하고, 빌드 시에는 타입 체크만 수행');
console.log('2. CI/CD에서만 엄격한 린트 검사 수행');
console.log('3. 로컬 개발 시에는 VS Code의 ESLint 확장 활용');

console.log('\n다음 명령어로 테스트해보세요:');
console.log('- npm run type-check (타입 검사만)');
console.log('- npm run format:check (포맷팅 검사)');
console.log('- npm run build (프로덕션 빌드 테스트)');

console.log('\n✅ 스크립트 완료!');