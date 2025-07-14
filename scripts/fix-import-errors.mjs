#!/usr/bin/env node
/**
 * 삭제된 파일들의 import 오류를 자동으로 수정하는 스크립트
 */

import { promises as fs } from 'fs';
import { join } from 'path';

// 수정할 import 패턴들
const importFixes = [
  {
    // RealServerDataGenerator import 제거 또는 대체
    pattern: /import\s+{[^}]*RealServerDataGenerator[^}]*}\s+from\s+['"]['"][^'"]*RealServerDataGenerator[^'"]*['"]['"];?\s*\n?/g,
    replacement: "import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';\n"
  },
  {
    // createServerDataGenerator import 제거 또는 대체
    pattern: /import\s+{[^}]*createServerDataGenerator[^}]*}\s+from[^;]+;?\s*\n?/g,
    replacement: "import { GCPRealDataService } from '@/services/gcp/GCPRealDataService';\n"
  },
  {
    // RealServerDataGenerator.getInstance() 사용을 GCPRealDataService.getInstance()로 대체
    pattern: /RealServerDataGenerator\.getInstance\(\)/g,
    replacement: "GCPRealDataService.getInstance()"
  },
  {
    // createServerDataGenerator() 사용을 GCPRealDataService.getInstance()로 대체
    pattern: /createServerDataGenerator\(\)/g,
    replacement: "GCPRealDataService.getInstance()"
  }
];

// any 타입 문제 수정 패턴들
const anyTypeFixes = [
  {
    // 암시적 any 매개변수 수정 - 서버 객체
    pattern: /(\w+):\s*any\)/g,
    replacement: '$1: any)'
  },
  {
    // filter 콜백에서 's' 매개변수 타입 지정
    pattern: /\.filter\(\s*s\s*=>/g,
    replacement: '.filter((s: any) =>'
  },
  {
    // reduce 콜백에서 매개변수 타입 지정
    pattern: /\.reduce\(\s*\(sum,\s*s\)\s*=>/g,
    replacement: '.reduce((sum: number, s: any) =>'
  },
  {
    // map 콜백에서 매개변수 타입 지정
    pattern: /\.map\(\s*s\s*=>/g,
    replacement: '.map((s: any) =>'
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

async function fixImportsInFile(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let hasChanges = false;
    
    // import 수정
    for (const fix of importFixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`  ✓ Import 수정: ${filePath}`);
      }
    }
    
    // any 타입 문제 수정
    for (const fix of anyTypeFixes) {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        hasChanges = true;
        console.log(`  ✓ Any 타입 수정: ${filePath}`);
      }
    }
    
    // 중복된 import 제거
    const lines = content.split('\n');
    const imports = new Set();
    const filteredLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('import ') && line.includes('GCPRealDataService')) {
        if (!imports.has(line.trim())) {
          imports.add(line.trim());
          filteredLines.push(line);
        } else {
          hasChanges = true;
          console.log(`  ✓ 중복 import 제거: ${filePath}`);
        }
      } else {
        filteredLines.push(line);
      }
    }
    
    if (hasChanges) {
      content = filteredLines.join('\n');
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
  console.log('🔧 Import 오류 자동 수정 시작...\n');
  
  const files = await findFilesToFix();
  console.log(`📁 검사할 파일: ${files.length}개\n`);
  
  let fixedCount = 0;
  
  for (const file of files) {
    const fixed = await fixImportsInFile(file);
    if (fixed) {
      fixedCount++;
    }
  }
  
  console.log(`\n✅ 수정 완료: ${fixedCount}개 파일`);
  
  // TypeScript 컴파일 테스트
  console.log('\n🔍 TypeScript 컴파일 테스트 중...');
  try {
    const { spawn } = await import('child_process');
    const tsc = spawn('npx', ['tsc', '--noEmit'], { stdio: 'pipe' });
    
    let output = '';
    tsc.stdout.on('data', (data) => output += data);
    tsc.stderr.on('data', (data) => output += data);
    
    tsc.on('close', (code) => {
      if (code === 0) {
        console.log('✅ TypeScript 컴파일 성공!');
      } else {
        console.log('⚠️ 남은 TypeScript 오류:');
        console.log(output.split('\n').slice(0, 10).join('\n'));
        console.log('\n추가 수정이 필요할 수 있습니다.');
      }
    });
  } catch (error) {
    console.log('TypeScript 테스트 건너뜀');
  }
}

main().catch(console.error);