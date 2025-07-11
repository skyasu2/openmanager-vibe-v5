#!/usr/bin/env node
/**
 * GCP 서비스 import 및 메서드 호출 오류 수정 스크립트
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// 수정할 패턴들
const fixes = [
  {
    // GCPServerDataGenerator.getInstance() → GCPRealDataService.getInstance()
    pattern: /GCPServerDataGenerator\.getInstance\(\)/g,
    replacement: "GCPRealDataService.getInstance()"
  },
  {
    // GCPServerDataGenerator import를 GCPRealDataService로 변경
    pattern: /import\s*{\s*GCPServerDataGenerator\s*}\s*from\s*'@\/services\/gcp\/GCPServerDataGenerator'/g,
    replacement: "import { GCPRealDataService } from '@/services/gcp/GCPRealDataService'"
  },
  {
    // getAllServers() → getRealServerMetrics()의 데이터 사용
    pattern: /\.getAllServers\(\)/g,
    replacement: ".getRealServerMetrics().then(response => response.data)"
  },
  {
    // 남은 RealServerDataGenerator import 제거
    pattern: /import.*RealServerDataGenerator.*from.*['"][^'"]*RealServerDataGenerator[^'"]*['"];?\s*\n?/g,
    replacement: ""
  },
  {
    // createServerDataGenerator 함수 호출 제거
    pattern: /createServerDataGenerator\(\)/g,
    replacement: "GCPRealDataService.getInstance().getRealServerMetrics().then(response => response.data)"
  },
  {
    // GCPGCPServerDataGenerator 오타 수정
    pattern: /GCPGCPServerDataGenerator/g,
    replacement: "GCPRealDataService"
  },
  {
    // 중복된 generator 변수 수정
    pattern: /const generator = GCPRealDataService\.getInstance\(\);?\s*const servers = await generator\.getRealServerMetrics\(\)\.then\(response => response\.data\);/g,
    replacement: "const gcpService = GCPRealDataService.getInstance();\n    const response = await gcpService.getRealServerMetrics();\n    const servers = response.data;"
  }
];

async function findFilesToFix() {
  const filesToCheck = [];
  
  async function scanDirectory(dir) {
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          await scanDirectory(join(dir, item.name));
        } else if (item.isFile() && (item.name.endsWith('.ts') || item.name.endsWith('.tsx'))) {
          filesToCheck.push(join(dir, item.name));
        }
      }
    } catch (error) {
      console.warn(`디렉토리 스캔 실패: ${dir}`);
    }
  }
  
  await scanDirectory('src');
  return filesToCheck;
}

async function fixFileErrors(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let hasChanges = false;
    
    // 각 수정 패턴 적용
    for (const fix of fixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`  ✓ ${filePath}`);
      }
    }
    
    // 수정사항이 있으면 파일 저장
    if (hasChanges) {
      await fs.writeFile(filePath, content);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`파일 수정 실패: ${filePath} - ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🔧 GCP 서비스 오류 수정 시작...\n');
  
  const files = await findFilesToFix();
  console.log(`📁 검사할 파일: ${files.length}개\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const fixed = await fixFileErrors(file);
    if (fixed) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ 수정 완료: ${fixedCount}개 파일`);
}

main().catch(console.error);