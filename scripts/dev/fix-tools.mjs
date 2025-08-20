#!/usr/bin/env node
/**
 * 통합 수정 도구
 *
 * 통합된 기능:
 * - fix-missing-imports.mjs
 * - fix-type-errors.mjs
 * - fix-storybook-imports-final.js
 * - fix-vector-data.js
 */

import { promises as fs } from 'fs';
import { spawn } from 'child_process';
import path from 'path';

class UnifiedFixTools {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.fixes = [];
  }

  async executeCommand(command, args = []) {
    return new Promise((resolve, reject) => {
      const proc = spawn(command, args, {
        cwd: this.projectRoot,
        stdio: ['pipe', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', data => {
        stdout += data.toString();
      });

      proc.stderr.on('data', data => {
        stderr += data.toString();
      });

      proc.on('close', code => {
        resolve({
          code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      proc.on('error', reject);
    });
  }

  async findFiles(directory, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
    const files = [];

    try {
      const items = await fs.readdir(directory, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(directory, item.name);

        if (
          item.isDirectory() &&
          !item.name.startsWith('.') &&
          item.name !== 'node_modules'
        ) {
          const subFiles = await this.findFiles(fullPath, extensions);
          files.push(...subFiles);
        } else if (
          item.isFile() &&
          extensions.some(ext => item.name.endsWith(ext))
        ) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`디렉토리 읽기 실패: ${directory}`);
    }

    return files;
  }

  async fixMissingImports() {
    console.log('🔧 누락된 import 수정 중...');

    const files = await this.findFiles(this.srcPath);
    let fixCount = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        let updatedContent = content;
        let fileModified = false;

        // React import 추가
        if (
          (content.includes('<') ||
            content.includes('jsx') ||
            content.includes('tsx')) &&
          !content.includes('import React') &&
          !content.includes('import * as React')
        ) {
          updatedContent = `import React from 'react';\n${updatedContent}`;
          fileModified = true;
          this.fixes.push(`${file}: React import 추가`);
        }

        // Next.js Image import 수정
        if (
          content.includes('<Image') &&
          !content.includes("import Image from 'next/image'")
        ) {
          const importMatch = updatedContent.match(/^(import.*?;?\n)*/m);
          const importEnd = importMatch ? importMatch[0].length : 0;
          updatedContent =
            updatedContent.slice(0, importEnd) +
            `import Image from 'next/image';\n` +
            updatedContent.slice(importEnd);
          fileModified = true;
          this.fixes.push(`${file}: Next.js Image import 추가`);
        }

        // useState, useEffect import 수정
        const hooksUsed = [];
        if (
          content.includes('useState') &&
          !content.includes('import.*useState')
        )
          hooksUsed.push('useState');
        if (
          content.includes('useEffect') &&
          !content.includes('import.*useEffect')
        )
          hooksUsed.push('useEffect');
        if (
          content.includes('useCallback') &&
          !content.includes('import.*useCallback')
        )
          hooksUsed.push('useCallback');
        if (content.includes('useMemo') && !content.includes('import.*useMemo'))
          hooksUsed.push('useMemo');

        if (hooksUsed.length > 0) {
          const hookImport = `import { ${hooksUsed.join(', ')} } from 'react';\n`;
          const importMatch = updatedContent.match(/^(import.*?;?\n)*/m);
          const importEnd = importMatch ? importMatch[0].length : 0;
          updatedContent =
            updatedContent.slice(0, importEnd) +
            hookImport +
            updatedContent.slice(importEnd);
          fileModified = true;
          this.fixes.push(
            `${file}: React hooks import 추가 (${hooksUsed.join(', ')})`
          );
        }

        if (fileModified) {
          await fs.writeFile(file, updatedContent);
          fixCount++;
        }
      } catch (error) {
        console.warn(`파일 처리 실패: ${file} - ${error.message}`);
      }
    }

    console.log(`✅ Missing imports 수정 완료: ${fixCount}개 파일`);
    return fixCount;
  }

  async fixTypeErrors() {
    console.log('🔧 TypeScript 타입 오류 수정 중...');

    // TypeScript 컴파일 체크
    const tscResult = await this.executeCommand('npx', ['tsc', '--noEmit']);

    if (tscResult.code === 0) {
      console.log('✅ TypeScript 오류가 없습니다.');
      return 0;
    }

    const errors = tscResult.stdout
      .split('\n')
      .filter(line => line.includes('error TS'));
    console.log(`🔍 발견된 TypeScript 오류: ${errors.length}개`);

    const files = await this.findFiles(this.srcPath, ['.ts', '.tsx']);
    let fixCount = 0;

    for (const file of files) {
      try {
        const content = await fs.readFile(file, 'utf8');
        let updatedContent = content;
        let fileModified = false;

        // any 타입 사용 제거 (strict 모드 대응)
        if (content.includes(': any')) {
          updatedContent = updatedContent.replace(/: any\b/g, ': unknown');
          fileModified = true;
          this.fixes.push(`${file}: any 타입을 unknown으로 변경`);
        }

        // 빈 배열 타입 지정
        const emptyArrayRegex = /const\s+(\w+)\s*=\s*\[\]/g;
        if (emptyArrayRegex.test(content)) {
          updatedContent = updatedContent.replace(
            emptyArrayRegex,
            'const $1: unknown[] = []'
          );
          fileModified = true;
          this.fixes.push(`${file}: 빈 배열에 타입 지정`);
        }

        // optional chaining 추가
        const optionalAccessRegex = /\.(\w+)\s*\[/g;
        if (content.includes('[') && !content.includes('?.')) {
          // 간단한 경우만 수정 (더 정교한 분석이 필요할 수 있음)
          const lines = updatedContent.split('\n');
          for (let i = 0; i < lines.length; i++) {
            if (
              lines[i].includes('Cannot read property') ||
              lines[i].includes('Cannot read properties')
            ) {
              // 실제 오류 라인을 찾아서 수정하는 로직 필요
            }
          }
        }

        if (fileModified) {
          await fs.writeFile(file, updatedContent);
          fixCount++;
        }
      } catch (error) {
        console.warn(`타입 오류 수정 실패: ${file} - ${error.message}`);
      }
    }

    console.log(`✅ TypeScript 오류 수정 시도 완료: ${fixCount}개 파일`);
    return fixCount;
  }

  async fixStorybookImports() {
    console.log('🔧 Storybook import 오류 수정 중...');

    const storybookFiles = await this.findFiles(this.srcPath, [
      '.stories.ts',
      '.stories.tsx',
    ]);
    let fixCount = 0;

    for (const file of storybookFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        let updatedContent = content;
        let fileModified = false;

        // Storybook import 경로 수정
        if (content.includes("from '@storybook/addon-actions'")) {
          updatedContent = updatedContent.replace(
            "from '@storybook/addon-actions'",
            "from '@storybook/addon-essentials'"
          );
          fileModified = true;
          this.fixes.push(`${file}: Storybook addon import 경로 수정`);
        }

        // Meta 타입 import 추가
        if (
          content.includes('Meta') &&
          !content.includes('import type { Meta')
        ) {
          const importMatch = updatedContent.match(/^(import.*?;?\n)*/m);
          const importEnd = importMatch ? importMatch[0].length : 0;
          updatedContent =
            updatedContent.slice(0, importEnd) +
            `import type { Meta, StoryObj } from '@storybook/react';\n` +
            updatedContent.slice(importEnd);
          fileModified = true;
          this.fixes.push(`${file}: Storybook Meta 타입 import 추가`);
        }

        if (fileModified) {
          await fs.writeFile(file, updatedContent);
          fixCount++;
        }
      } catch (error) {
        console.warn(`Storybook 파일 수정 실패: ${file} - ${error.message}`);
      }
    }

    console.log(`✅ Storybook import 수정 완료: ${fixCount}개 파일`);
    return fixCount;
  }

  async fixVectorData() {
    console.log('🔧 벡터 데이터 구조 수정 중...');

    try {
      // 벡터 데이터 관련 파일들 찾기
      const vectorFiles = await this.findFiles(this.srcPath, [
        '.ts',
        '.tsx',
      ]).then(files =>
        files.filter(
          file =>
            file.includes('vector') ||
            file.includes('embedding') ||
            file.includes('rag')
        )
      );

      let fixCount = 0;

      for (const file of vectorFiles) {
        try {
          const content = await fs.readFile(file, 'utf8');
          let updatedContent = content;
          let fileModified = false;

          // 벡터 차원 수정 (1536 -> 명시적 타입)
          if (content.includes('1536') && content.includes('embedding')) {
            updatedContent = updatedContent.replace(
              /embedding.*?1536/g,
              'embedding: number[] // 1536 dimensions'
            );
            fileModified = true;
            this.fixes.push(`${file}: 벡터 차원 타입 명시`);
          }

          // 벡터 데이터베이스 연결 오류 수정
          if (
            content.includes('pgvector') &&
            !content.includes('vector_extension')
          ) {
            updatedContent = updatedContent.replace(
              /pgvector/g,
              'vector' // pgvector extension 정확한 이름
            );
            fileModified = true;
            this.fixes.push(`${file}: pgvector 확장 이름 수정`);
          }

          if (fileModified) {
            await fs.writeFile(file, updatedContent);
            fixCount++;
          }
        } catch (error) {
          console.warn(`벡터 파일 수정 실패: ${file} - ${error.message}`);
        }
      }

      console.log(`✅ 벡터 데이터 수정 완료: ${fixCount}개 파일`);
      return fixCount;
    } catch (error) {
      console.error('벡터 데이터 수정 중 오류:', error.message);
      return 0;
    }
  }

  async runAllFixes() {
    console.log('🔧 모든 수정 도구 실행 시작...\n');

    const startTime = Date.now();
    const results = {
      timestamp: new Date().toISOString(),
      missingImports: await this.fixMissingImports(),
      typeErrors: await this.fixTypeErrors(),
      storybookImports: await this.fixStorybookImports(),
      vectorData: await this.fixVectorData(),
      totalFixes: this.fixes.length,
    };

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n📋 수정 작업 완료:');
    console.log(`  Missing imports: ${results.missingImports}개 파일`);
    console.log(`  Type errors: ${results.typeErrors}개 파일`);
    console.log(`  Storybook imports: ${results.storybookImports}개 파일`);
    console.log(`  Vector data: ${results.vectorData}개 파일`);
    console.log(`  총 수정사항: ${results.totalFixes}개`);
    console.log(`  소요시간: ${duration}초`);

    // 수정 내역을 로그 파일로 저장
    try {
      await fs.mkdir('logs', { recursive: true });
      await fs.writeFile(
        'logs/fix-results.json',
        JSON.stringify(
          {
            ...results,
            fixes: this.fixes,
          },
          null,
          2
        )
      );
      console.log('\n💾 수정 결과가 logs/fix-results.json에 저장되었습니다.');
    } catch (error) {
      console.warn('결과 저장 실패:', error.message);
    }

    return results;
  }

  async generateFixReport() {
    const report = {
      timestamp: new Date().toISOString(),
      totalFixes: this.fixes.length,
      categories: {
        imports: this.fixes.filter(fix => fix.includes('import')).length,
        types: this.fixes.filter(fix => fix.includes('타입')).length,
        storybook: this.fixes.filter(fix => fix.includes('Storybook')).length,
        vector: this.fixes.filter(fix => fix.includes('벡터')).length,
      },
      fixes: this.fixes,
    };

    console.log('📊 수정 리포트:');
    console.log(`  전체 수정: ${report.totalFixes}개`);
    console.log(`  Import 관련: ${report.categories.imports}개`);
    console.log(`  타입 관련: ${report.categories.types}개`);
    console.log(`  Storybook 관련: ${report.categories.storybook}개`);
    console.log(`  벡터 데이터 관련: ${report.categories.vector}개`);

    return report;
  }
}

// CLI 실행
if (process.argv[1] === import.meta.url.replace('file://', '')) {
  const fixTools = new UnifiedFixTools();
  const command = process.argv[2];

  try {
    switch (command) {
      case 'all':
        await fixTools.runAllFixes();
        break;

      case 'imports':
        await fixTools.fixMissingImports();
        break;

      case 'types':
        await fixTools.fixTypeErrors();
        break;

      case 'storybook':
        await fixTools.fixStorybookImports();
        break;

      case 'vector':
        await fixTools.fixVectorData();
        break;

      case 'report':
        await fixTools.generateFixReport();
        break;

      default:
        console.log('🔧 통합 수정 도구 사용법:');
        console.log('  node unified-fix-tools.mjs all        # 모든 수정 실행');
        console.log(
          '  node unified-fix-tools.mjs imports    # 누락된 import 수정'
        );
        console.log(
          '  node unified-fix-tools.mjs types      # TypeScript 타입 오류 수정'
        );
        console.log(
          '  node unified-fix-tools.mjs storybook  # Storybook import 수정'
        );
        console.log(
          '  node unified-fix-tools.mjs vector     # 벡터 데이터 구조 수정'
        );
        console.log(
          '  node unified-fix-tools.mjs report     # 수정 리포트 생성'
        );
        break;
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ 오류:', error.message);
    process.exit(1);
  }
}

export default UnifiedFixTools;
