#!/usr/bin/env tsx

/**
 * Redis 타입 정리 스크립트
 * 
 * Redis 관련 인터페이스와 타입을 제거하거나 주석 처리합니다.
 * 실행 전 백업을 권장합니다.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const filesToClean = [
  'src/services/ai/interfaces/distributed-ai.interface.ts',
  'src/types/server-common.ts',
  'src/types/common.ts',
];

const redisTypePatterns = [
  /export interface RedisCacheRequest[\s\S]*?}/g,
  /export interface RedisCacheResponse[\s\S]*?}/g,
  /export interface Redis[\w]*[\s\S]*?}/g,
  /export type Redis[\w]*[\s\S]*?;/g,
];

function cleanRedisTypes(filePath: string) {
  try {
    const fullPath = join(process.cwd(), filePath);
    let content = readFileSync(fullPath, 'utf-8');
    
    // Redis 관련 타입을 주석 처리
    redisTypePatterns.forEach(pattern => {
      content = content.replace(pattern, (match) => {
        return `/* Redis 타입 - 제거 예정\n${match}\n*/`;
      });
    });
    
    // import 문에서 Redis 타입 제거
    content = content.replace(
      /import\s*{([^}]*?)}\s*from\s*['"]([^'"]*redis[^'"]*)['"]/g,
      (match, imports, path) => {
        const cleanedImports = imports
          .split(',')
          .map((i: string) => i.trim())
          .filter((i: string) => !i.toLowerCase().includes('redis'))
          .join(', ');
        
        if (cleanedImports.length === 0) {
          return `// ${match} // Redis import 제거됨`;
        }
        
        return `import { ${cleanedImports} } from '${path}'`;
      }
    );
    
    writeFileSync(fullPath, content);
    console.log(`✅ ${filePath} 정리 완료`);
  } catch (error) {
    console.error(`❌ ${filePath} 처리 중 오류:`, error);
  }
}

function findRedisUsage() {
  console.log('\n🔍 Redis 타입 사용 현황 검색 중...\n');
  
  // 실제로는 grep이나 ripgrep을 사용하는 것이 더 효율적
  console.log('다음 명령어로 Redis 타입 사용처를 확인하세요:');
  console.log('rg "RedisCacheRequest|RedisCacheResponse" --type ts');
}

// 메인 실행
console.log('🧹 Redis 타입 정리 시작\n');

if (process.argv.includes('--dry-run')) {
  console.log('DRY RUN 모드 - 실제 파일은 수정되지 않습니다.\n');
  findRedisUsage();
} else if (process.argv.includes('--execute')) {
  console.log('⚠️  주의: 파일이 수정됩니다. 백업을 확인하세요!\n');
  
  filesToClean.forEach(cleanRedisTypes);
  
  console.log('\n✅ Redis 타입 정리 완료');
  console.log('\n다음 단계:');
  console.log('1. TypeScript 컴파일 확인: npm run type-check');
  console.log('2. 테스트 실행: npm test');
  console.log('3. 문제 발생 시 git으로 복원');
} else {
  console.log('사용법:');
  console.log('  --dry-run   : Redis 타입 사용처만 검색');
  console.log('  --execute   : 실제로 파일 수정 (주의!)');
  console.log('\n예시:');
  console.log('  npm run cleanup-redis-types -- --dry-run');
  console.log('  npm run cleanup-redis-types -- --execute');
}