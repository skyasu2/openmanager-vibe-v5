#!/usr/bin/env node
/**
 * 🚀 Vercel OAuth 설정 도우미
 * 
 * Vercel 환경변수 설정을 위한 가이드와 검증 도구
 */

console.log('🚀 Vercel OAuth 설정 도우미\n');

console.log('📋 필수 설정 체크리스트:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

console.log('\n1️⃣ Supabase 프로젝트 설정');
console.log('   🔗 https://supabase.com/dashboard');
console.log('   → 새 프로젝트 생성 또는 기존 프로젝트 선택');
console.log('   → Settings → API에서 Project URL & API Keys 복사');

console.log('\n2️⃣ Vercel 환경변수 설정');
console.log('   🔗 https://vercel.com/dashboard');
console.log('   → 프로젝트 선택 → Settings → Environment Variables');
console.log('   → 다음 환경변수들 추가:');
console.log('');
console.log('   NEXT_PUBLIC_APP_URL=https://openmanager-vibe-v5.vercel.app');
console.log('   NEXT_PUBLIC_SUPABASE_URL=https://[your-project-ref].supabase.co');
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=[your-anon-key]');
console.log('   SUPABASE_SERVICE_ROLE_KEY=[your-service-role-key]');

console.log('\n3️⃣ Supabase Authentication 설정');
console.log('   → Authentication → URL Configuration');
console.log('   → Site URL: https://openmanager-vibe-v5.vercel.app');
console.log('   → Redirect URLs:');
console.log('     - https://openmanager-vibe-v5.vercel.app/auth/callback');
console.log('     - http://localhost:3000/auth/callback');

console.log('\n4️⃣ GitHub OAuth App 설정');
console.log('   🔗 https://github.com/settings/developers');
console.log('   → OAuth Apps → New OAuth App');
console.log('   → Application name: OpenManager VIBE v5');
console.log('   → Homepage URL: https://openmanager-vibe-v5.vercel.app');
console.log('   → Callback URL: https://[your-supabase-project].supabase.co/auth/v1/callback');

console.log('\n5️⃣ Supabase GitHub Provider 설정');
console.log('   → Authentication → Providers → GitHub');
console.log('   → GitHub enabled: ON');
console.log('   → Client ID: [github-client-id]');
console.log('   → Client Secret: [github-client-secret]');

console.log('\n🧪 설정 완료 후 테스트:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('1. git commit --allow-empty -m "🔄 환경변수 설정 후 재배포"');
console.log('2. git push origin main');
console.log('3. npm run oauth:test');
console.log('4. https://openmanager-vibe-v5.vercel.app에서 로그인 테스트');

console.log('\n⚠️ 현재 상태:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// 현재 로컬 환경변수 상태 확인
const checkVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL'
];

checkVars.forEach(varName => {
  const value = process.env[varName];
  if (!value) {
    console.log(`❌ ${varName}: 미설정`);
  } else if (value.includes('your_') || value.includes('_here')) {
    console.log(`🟡 ${varName}: 템플릿값 (실제값 필요)`);
  } else {
    console.log(`✅ ${varName}: 설정됨`);
  }
});

console.log('\n💡 상세 가이드: VERCEL_OAUTH_SETUP_GUIDE.md 참조');
console.log('🔧 추가 도움: npm run oauth:test 실행');

module.exports = {};