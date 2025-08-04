#!/usr/bin/env node
/**
 * 🧪 TechStackAnalyzer 업데이트 확인 테스트
 * 
 * 바이브 코딩 관련 내용이 제대로 업데이트되었는지 확인
 */

import { analyzeTechStack } from '../src/utils/TechStackAnalyzer';

async function testTechStackUpdate() {
  console.log('🔍 TechStackAnalyzer 업데이트 확인 중...\n');

  // 현재 사용 중인 도구들 확인
  const currentTools = [
    'claude-code',
    'gemini-cli', 
    'aws-kiro',
    'windsurf',
    'vibe-coding-results'
  ];

  console.log('📊 현재 사용 중인 AI 도구들:');
  console.log('='.repeat(50));

  const categories = analyzeTechStack(currentTools);
  
  for (const category of categories) {
    console.log(`\n📂 ${category.name}:`);
    for (const item of category.items) {
      console.log(`✅ ${item.name}`);
      console.log(`   역할: ${item.role || '정보 없음'}`);
      console.log(`   설명: ${item.description}`);
      console.log(`   중요도: ${item.importance}`);
      console.log('');
    }
  }

  // 매핑 테스트
  console.log('\n🔗 매핑 테스트:');
  console.log('='.repeat(50));

  const mappingTests = [
    'cursor',
    'claude',
    'claude opus 4',
    'claude sonnet 4',
    'gemini', 
    'aws kiro',
    'windsurf',
    'mcp tools',
    'vibe coding'
  ];

  for (const test of mappingTests) {
    const result = analyzeTechStack([test]);
    if (result.length > 0 && result[0].items.length > 0) {
      console.log(`✅ "${test}" → ${result[0].items[0].name}`);
    } else {
      console.log(`❌ "${test}" → 매핑 실패`);
    }
  }

  console.log('\n🎯 업데이트 완료!');
}

// 실행
testTechStackUpdate().catch(console.error);