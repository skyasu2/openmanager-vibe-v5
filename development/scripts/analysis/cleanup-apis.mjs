#!/usr/bin/env node

/**
 * 🧹 자동 생성된 API 정리 스크립트
 * 생성일: 2025-06-10T11:22:41.538Z
 * 정리 대상: 0개 API
 */

import fs from 'fs';
import path from 'path';

const APIS_TO_REMOVE = [

];

function cleanup() {
  console.log('🧹 API 정리 시작...');
  
  let removed = 0;
  let savedBytes = 0;
  
  for (const apiPath of APIS_TO_REMOVE) {
    try {
      if (fs.existsSync(apiPath)) {
        const stats = fs.statSync(apiPath);
        fs.unlinkSync(apiPath);
        
        // 빈 디렉토리 정리
        const dir = path.dirname(apiPath);
        const remaining = fs.readdirSync(dir);
        if (remaining.length === 0) {
          fs.rmdirSync(dir);
        }
        
        removed++;
        savedBytes += stats.size;
        console.log(`✅ 제거: ${path.relative(process.cwd(), apiPath)}`);
      }
    } catch (error) {
      console.error(`❌ 제거 실패: ${apiPath}`, error.message);
    }
  }
  
  console.log(`\n🎉 정리 완료: ${removed}개 파일, ${(savedBytes / 1024).toFixed(2)}KB 절약`);
}

// 실행
const analyzer = new APICleanupAnalyzer();
analyzer.analyze().catch(console.error);

export { cleanup };
