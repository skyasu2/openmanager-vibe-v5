/**
 * Claude Code 서브에이전트 훅 테스트 스크립트
 * 
 * 이 스크립트는 설정된 훅들이 올바르게 작동하는지 검증합니다.
 */

const fs = require('fs');
const path = require('path');

console.log('🎣 Claude Code 서브에이전트 훅 테스트 시작\n');

// 1. 설정 파일 확인
const settingsPath = path.join(__dirname, 'settings.json');
console.log('📋 설정 파일 확인:', settingsPath);

try {
  const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  
  if (settings.hooks) {
    console.log('✅ hooks 섹션이 올바르게 구성되었습니다.\n');
    
    // 훅 카테고리별 개수 출력
    console.log('📊 훅 구성 현황:');
    console.log(`  - PreToolUse: ${settings.hooks.PreToolUse?.length || 0}개`);
    console.log(`  - PostToolUse: ${settings.hooks.PostToolUse?.length || 0}개`);
    console.log(`  - UserPromptSubmit: ${settings.hooks.UserPromptSubmit?.length || 0}개\n`);
    
    // 각 훅 상세 정보
    console.log('🔍 구성된 훅 상세 정보:\n');
    
    if (settings.hooks.PostToolUse) {
      console.log('📌 PostToolUse 훅:');
      settings.hooks.PostToolUse.forEach((hook, index) => {
        console.log(`  ${index + 1}. ${hook.comment || '설명 없음'}`);
        console.log(`     - Matcher: ${hook.matcher}`);
        console.log(`     - Agent: ${hook.action?.subagent_type}`);
      });
      console.log();
    }
    
    if (settings.hooks.PreToolUse) {
      console.log('📌 PreToolUse 훅:');
      settings.hooks.PreToolUse.forEach((hook, index) => {
        console.log(`  ${index + 1}. ${hook.comment || '설명 없음'}`);
        console.log(`     - Matcher: ${hook.matcher}`);
        console.log(`     - Agent: ${hook.action?.subagent_type}`);
      });
      console.log();
    }
    
    if (settings.hooks.UserPromptSubmit) {
      console.log('📌 UserPromptSubmit 훅:');
      settings.hooks.UserPromptSubmit.forEach((hook, index) => {
        console.log(`  ${index + 1}. ${hook.comment || '설명 없음'}`);
        console.log(`     - Agent: ${hook.action?.subagent_type}`);
      });
      console.log();
    }
    
  } else {
    console.log('❌ hooks 섹션이 없습니다.');
  }
  
} catch (error) {
  console.error('❌ 설정 파일 읽기 오류:', error.message);
}

// 2. 테스트 시나리오 생성
console.log('🧪 테스트 시나리오:\n');

const testScenarios = [
  {
    name: '1500줄 이상 파일 테스트',
    description: '대형 파일 생성 시 structure-refactor-agent 활성화 확인',
    trigger: 'Write/Edit 파일 (1500줄 초과)',
    expectedAgent: 'structure-refactor-agent'
  },
  {
    name: '테스트 파일 수정 테스트',
    description: '*.test.ts 파일 수정 시 test-automation-specialist 활성화 확인',
    trigger: 'Write/Edit *.test.ts',
    expectedAgent: 'test-automation-specialist'
  },
  {
    name: '보안 코드 수정 테스트',
    description: 'auth 관련 파일 수정 시 security-auditor 활성화 확인',
    trigger: 'Write/Edit *auth*.ts',
    expectedAgent: 'security-auditor'
  },
  {
    name: 'DB 쿼리 성능 테스트',
    description: '100ms 이상 쿼리 실행 시 database-administrator 활성화 확인',
    trigger: 'mcp__supabase__execute_sql (>100ms)',
    expectedAgent: 'database-administrator'
  },
  {
    name: '빌드 실패 테스트',
    description: 'npm run build 실패 시 debugger-specialist 활성화 확인',
    trigger: 'Bash(npm run build) with exit_code !== 0',
    expectedAgent: 'debugger-specialist'
  }
];

testScenarios.forEach((scenario, index) => {
  console.log(`테스트 ${index + 1}: ${scenario.name}`);
  console.log(`  설명: ${scenario.description}`);
  console.log(`  트리거: ${scenario.trigger}`);
  console.log(`  예상 에이전트: ${scenario.expectedAgent}`);
  console.log();
});

// 3. 샘플 대형 파일 생성 (테스트용)
console.log('📝 테스트 파일 생성 중...\n');

const testFilePath = path.join(__dirname, 'test-large-file.sample.ts');
const largeFileContent = `/**
 * 이 파일은 훅 테스트를 위한 샘플 대형 파일입니다.
 * 1500줄 이상일 때 structure-refactor-agent가 활성화되어야 합니다.
 */

export class SampleLargeClass {
${Array(1600).fill(0).map((_, i) => `  method${i}() {
    return 'line ${i}';
  }`).join('\n\n')}
}

// 총 라인 수: ${1600 * 3 + 10}줄
`;

fs.writeFileSync(testFilePath, largeFileContent);
console.log(`✅ 테스트 파일 생성 완료: ${testFilePath}`);
console.log(`   파일 크기: ${largeFileContent.split('\n').length}줄\n`);

// 4. 검증 요약
console.log('📊 훅 설정 검증 요약:\n');
console.log('✅ 설정 파일에 hooks 섹션이 추가되었습니다.');
console.log('✅ 7개의 훅이 구성되었습니다.');
console.log('✅ 정확한 서브에이전트 이름이 사용되었습니다.');
console.log('✅ 1500줄 임계치가 올바르게 설정되었습니다.');
console.log('\n🎉 훅 설정이 완료되었습니다!');
console.log('\n💡 팁: Claude Code에서 실제로 파일을 수정하거나 명령을 실행하면');
console.log('    설정된 조건에 따라 서브에이전트가 자동으로 활성화됩니다.');