#!/usr/bin/env node

/**
 * 🔄 코드 중복 분석기 v2.0
 *
 * OpenManager Vibe v5 - 코드 중복 제거 및 모듈화
 * - 중복 로직 탐지
 * - 공통 모듈 추출 제안
 * - 리팩토링 우선순위 제시
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CodeDuplicationAnalyzer {
  constructor() {
    this.srcDir = path.join(__dirname, '../../../src');
    this.results = {
      totalFiles: 0,
      duplicateGroups: [],
      commonPatterns: [],
      refactoringOpportunities: [],
      potentialSavings: 0,
    };
    this.codeBlocks = new Map();
    this.functionSignatures = new Map();
  }

  async analyze() {
    console.log('🔄 코드 중복 분석 시작...\n');

    await this.scanAllFiles();
    this.findDuplicateBlocks();
    this.findCommonPatterns();
    this.generateRefactoringPlan();
    this.generateReport();

    return this.results;
  }

  async scanAllFiles() {
    console.log('📁 파일 스캔 중...');

    const files = await this.findAllSourceFiles(this.srcDir);

    for (const filePath of files) {
      await this.analyzeFile(filePath);
    }

    console.log(`✅ ${this.results.totalFiles}개 파일 분석 완료`);
  }

  async findAllSourceFiles(dir) {
    const files = [];

    const scan = currentDir => {
      const items = fs.readdirSync(currentDir);

      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory() && !this.shouldSkipDirectory(item)) {
          scan(fullPath);
        } else if (this.isSourceFile(item)) {
          files.push(fullPath);
        }
      }
    };

    scan(dir);
    return files;
  }

  shouldSkipDirectory(dirName) {
    const skipDirs = [
      'node_modules',
      '.git',
      '.next',
      'dist',
      'build',
      'coverage',
      '.nyc_output',
      'test-results',
    ];
    return skipDirs.includes(dirName);
  }

  isSourceFile(fileName) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    return (
      extensions.some(ext => fileName.endsWith(ext)) &&
      !fileName.endsWith('.d.ts') &&
      !fileName.includes('.test.') &&
      !fileName.includes('.spec.')
    );
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const relativePath = path.relative(this.srcDir, filePath);

      this.results.totalFiles++;

      // 함수 추출
      this.extractFunctions(content, relativePath);

      // 코드 블록 추출
      this.extractCodeBlocks(content, relativePath);

      // 임포트 패턴 분석
      this.analyzeImportPatterns(content, relativePath);
    } catch (error) {
      console.error(`❌ 파일 분석 실패: ${filePath}`, error.message);
    }
  }

  extractFunctions(content, filePath) {
    // 함수 정의 패턴들
    const functionPatterns = [
      /export\s+(?:async\s+)?function\s+(\w+)\s*\([^)]*\)\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
      /const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
      /(\w+)\s*:\s*(?:async\s+)?\([^)]*\)\s*=>\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/g,
    ];

    functionPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const [, name, body] = match;
        const normalizedBody = this.normalizeCode(body);
        const hash = this.hashCode(normalizedBody);

        if (!this.functionSignatures.has(hash)) {
          this.functionSignatures.set(hash, []);
        }

        this.functionSignatures.get(hash).push({
          name,
          file: filePath,
          body: normalizedBody,
          size: body.length,
        });
      }
    });
  }

  extractCodeBlocks(content, filePath) {
    // 의미있는 코드 블록들 (5줄 이상)
    const lines = content.split('\n');
    const blockSize = 5;

    for (let i = 0; i <= lines.length - blockSize; i++) {
      const block = lines.slice(i, i + blockSize).join('\n');
      const normalizedBlock = this.normalizeCode(block);

      // 의미있는 코드인지 확인
      if (this.isMeaningfulCode(normalizedBlock)) {
        const hash = this.hashCode(normalizedBlock);

        if (!this.codeBlocks.has(hash)) {
          this.codeBlocks.set(hash, []);
        }

        this.codeBlocks.get(hash).push({
          file: filePath,
          startLine: i + 1,
          endLine: i + blockSize,
          code: normalizedBlock,
          size: block.length,
        });
      }
    }
  }

  analyzeImportPatterns(content, filePath) {
    const imports = content.match(/import\s+.*from\s+['"][^'"]+['"]/g) || [];

    // 공통 임포트 패턴 수집
    imports.forEach(importStatement => {
      const pattern = importStatement.replace(/['"][^'"]+['"]/, '"MODULE"');

      const existing = this.results.commonPatterns.find(
        p => p.pattern === pattern
      );
      if (existing) {
        existing.count++;
        existing.files.add(filePath);
      } else {
        this.results.commonPatterns.push({
          type: 'import',
          pattern,
          count: 1,
          files: new Set([filePath]),
        });
      }
    });
  }

  normalizeCode(code) {
    return code
      .replace(/\/\/.*$/gm, '') // 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '') // 블록 주석 제거
      .replace(/\s+/g, ' ') // 공백 정규화
      .replace(/\s*([{}();,])\s*/g, '$1') // 구두점 주변 공백 제거
      .trim();
  }

  isMeaningfulCode(code) {
    // 의미있는 코드인지 판단
    const meaningfulPatterns = [
      /function|const|let|var|if|for|while|switch|try|catch/,
      /import|export|return|await|async/,
      /\w+\s*\([^)]*\)/, // 함수 호출
      /\w+\.\w+/, // 객체 접근
    ];

    return (
      meaningfulPatterns.some(pattern => pattern.test(code)) &&
      code.length > 50 && // 최소 길이
      !code.includes('console.log') && // 디버그 코드 제외
      !/^\s*[\{\}]\s*$/.test(code)
    ); // 빈 블록 제외
  }

  hashCode(str) {
    return crypto.createHash('md5').update(str).digest('hex');
  }

  findDuplicateBlocks() {
    console.log('🔍 중복 블록 탐지 중...');

    // 함수 중복 찾기
    for (const [hash, functions] of this.functionSignatures) {
      if (functions.length > 1) {
        this.results.duplicateGroups.push({
          type: 'function',
          hash,
          count: functions.length,
          items: functions,
          totalSize: functions.reduce((sum, f) => sum + f.size, 0),
          savingsPotential: functions.reduce((sum, f) => sum + f.size, 0) * 0.8, // 80% 절약 가능
        });
      }
    }

    // 코드 블록 중복 찾기
    for (const [hash, blocks] of this.codeBlocks) {
      if (blocks.length > 1) {
        this.results.duplicateGroups.push({
          type: 'codeblock',
          hash,
          count: blocks.length,
          items: blocks,
          totalSize: blocks.reduce((sum, b) => sum + b.size, 0),
          savingsPotential: blocks.reduce((sum, b) => sum + b.size, 0) * 0.6, // 60% 절약 가능
        });
      }
    }

    // 크기별 정렬
    this.results.duplicateGroups.sort(
      (a, b) => b.savingsPotential - a.savingsPotential
    );
  }

  findCommonPatterns() {
    console.log('🔍 공통 패턴 분석 중...');

    // 임포트 패턴 정리
    this.results.commonPatterns = this.results.commonPatterns
      .filter(p => p.count > 2)
      .sort((a, b) => b.count - a.count);

    // API 호출 패턴 찾기
    this.findAPICallPatterns();

    // 에러 처리 패턴 찾기
    this.findErrorHandlingPatterns();
  }

  findAPICallPatterns() {
    // API 호출 패턴 분석 (별도 구현 필요)
    console.log('📡 API 호출 패턴 분석...');
  }

  findErrorHandlingPatterns() {
    // 에러 처리 패턴 분석 (별도 구현 필요)
    console.log('⚠️ 에러 처리 패턴 분석...');
  }

  generateRefactoringPlan() {
    console.log('📋 리팩토링 계획 생성 중...');

    // 상위 17개 중복 그룹 선택
    const top17Groups = this.results.duplicateGroups.slice(0, 17);

    top17Groups.forEach((group, index) => {
      const opportunity = {
        priority: index + 1,
        type: group.type,
        description: this.generateDescription(group),
        files: [...new Set(group.items.map(item => item.file))],
        savingsPotential: group.savingsPotential,
        effort: this.estimateEffort(group),
        recommendation: this.generateRecommendation(group),
      };

      this.results.refactoringOpportunities.push(opportunity);
      this.results.potentialSavings += group.savingsPotential;
    });
  }

  generateDescription(group) {
    if (group.type === 'function') {
      const firstFunc = group.items[0];
      return `중복 함수 "${firstFunc.name}" (${group.count}개 파일에서 발견)`;
    } else {
      return `중복 코드 블록 (${group.count}개 위치에서 발견, ${group.totalSize}B)`;
    }
  }

  estimateEffort(group) {
    const baseEffort = group.count * 10; // 기본 노력도
    const complexityFactor = group.totalSize / 1000; // 복잡도 요소

    const totalEffort = baseEffort + complexityFactor;

    if (totalEffort < 30) return 'Low';
    if (totalEffort < 60) return 'Medium';
    return 'High';
  }

  generateRecommendation(group) {
    if (group.type === 'function') {
      return `공통 유틸리티 함수로 추출하여 src/utils/ 또는 src/lib/에 배치`;
    } else {
      return `공통 컴포넌트 또는 훅으로 추출하여 재사용성 향상`;
    }
  }

  generateReport() {
    console.log('\n📊 코드 중복 분석 결과');
    console.log('='.repeat(60));
    console.log(`📁 분석된 파일: ${this.results.totalFiles}개`);
    console.log(`🔄 중복 그룹: ${this.results.duplicateGroups.length}개`);
    console.log(
      `💰 예상 절약: ${(this.results.potentialSavings / 1024).toFixed(2)} KB`
    );
    console.log();

    console.log('🎯 리팩토링 우선순위 TOP 17:');
    this.results.refactoringOpportunities.forEach((opp, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. [${opp.effort.padEnd(6)}] ${opp.description}`
      );
      console.log(
        `    💰 절약: ${(opp.savingsPotential / 1024).toFixed(2)}KB | 📁 파일: ${opp.files.length}개`
      );
      console.log(`    💡 ${opp.recommendation}`);
      console.log();
    });

    console.log('📈 공통 패턴 TOP 10:');
    this.results.commonPatterns.slice(0, 10).forEach((pattern, index) => {
      console.log(
        `${String(index + 1).padStart(2)}. ${pattern.pattern} (${pattern.count}회 사용)`
      );
    });

    this.generateRefactoringScript();
  }

  generateRefactoringScript() {
    const scriptPath = path.join(__dirname, 'refactoring-plan.md');

    let content = `# 🔄 코드 중복 제거 리팩토링 계획

## 📊 분석 결과
- **분석된 파일**: ${this.results.totalFiles}개
- **발견된 중복 그룹**: ${this.results.duplicateGroups.length}개
- **예상 절약량**: ${(this.results.potentialSavings / 1024).toFixed(2)} KB

## 🎯 우선순위별 리팩토링 계획

`;

    this.results.refactoringOpportunities.forEach((opp, index) => {
      content += `### ${index + 1}. ${opp.description}

- **우선순위**: ${opp.priority}
- **노력도**: ${opp.effort}
- **절약량**: ${(opp.savingsPotential / 1024).toFixed(2)} KB
- **영향 파일**: ${opp.files.length}개
- **권장사항**: ${opp.recommendation}

**영향받는 파일들:**
${opp.files.map(file => `- \`${file}\``).join('\n')}

---

`;
    });

    content += `## 🚀 실행 가이드

1. **Phase 1**: Low effort 항목부터 시작 (1-5번)
2. **Phase 2**: Medium effort 항목 진행 (6-12번)  
3. **Phase 3**: High effort 항목 마무리 (13-17번)

각 단계마다 테스트를 실행하여 기능 정상 작동 확인 필요.
`;

    fs.writeFileSync(scriptPath, content);
    console.log(`\n📜 리팩토링 계획서 생성: ${scriptPath}`);
  }
}

// 실행
const analyzer = new CodeDuplicationAnalyzer();
analyzer.analyze().catch(console.error);

export default CodeDuplicationAnalyzer;
