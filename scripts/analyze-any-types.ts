#!/usr/bin/env tsx

/**
 * 🔍 TypeScript Any 타입 자동 분석 도구
 *
 * 프로젝트 전체의 any 타입 사용을 분석하고 리포트를 생성합니다.
 * - 파일별 any 사용 통계
 * - 패턴별 분류 (함수 파라미터, 반환값, 변수 등)
 * - 우선순위 자동 산정
 * - 진행률 추적
 */

import * as ts from 'typescript';
import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';

interface AnyUsage {
  file: string;
  line: number;
  column: number;
  code: string;
  type: 'parameter' | 'return' | 'variable' | 'property' | 'cast' | 'other';
  context: string;
}

interface FileAnalysis {
  file: string;
  totalCount: number;
  byType: Record<string, number>;
  usages: AnyUsage[];
}

interface AnalysisReport {
  totalFiles: number;
  totalAnyCount: number;
  fileAnalysis: FileAnalysis[];
  topFiles: { file: string; count: number }[];
  byTypeDistribution: Record<string, number>;
  timestamp: string;
}

class AnyTypeAnalyzer {
  private report: AnalysisReport = {
    totalFiles: 0,
    totalAnyCount: 0,
    fileAnalysis: [],
    topFiles: [],
    byTypeDistribution: {},
    timestamp: new Date().toISOString(),
  };

  async analyze(targetDir: string = 'src'): Promise<void> {
    console.log(chalk.blue('🔍 TypeScript Any 타입 분석 시작...\n'));

    const files = await this.getTypeScriptFiles(targetDir);
    console.log(chalk.gray(`📁 분석 대상: ${files.length}개 파일\n`));

    for (const file of files) {
      const analysis = this.analyzeFile(file);
      if (analysis.totalCount > 0) {
        this.report.fileAnalysis.push(analysis);
        this.report.totalAnyCount += analysis.totalCount;
      }
    }

    this.report.totalFiles = files.length;
    this.calculateStatistics();
    this.generateReport();
  }

  private async getTypeScriptFiles(dir: string): Promise<string[]> {
    const pattern = path.join(dir, '**/*.{ts,tsx}');
    const files = await glob(pattern, {
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.d.ts',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
    });
    return files;
  }

  private analyzeFile(filePath: string): FileAnalysis {
    const content = fs.readFileSync(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true
    );

    const analysis: FileAnalysis = {
      file: filePath,
      totalCount: 0,
      byType: {},
      usages: [],
    };

    const visit = (node: ts.Node) => {
      // any 타입 참조 검사
      if (ts.isTypeReferenceNode(node) && node.typeName.getText() === 'any') {
        this.recordAnyUsage(node, sourceFile, analysis);
      }

      // any 키워드 검사
      if (node.kind === ts.SyntaxKind.AnyKeyword) {
        this.recordAnyUsage(node, sourceFile, analysis);
      }

      // 암시적 any 검사 (타입 주석이 없는 파라미터)
      if (ts.isParameter(node) && !node.type) {
        const parent = node.parent;
        if (
          ts.isFunctionDeclaration(parent) ||
          ts.isMethodDeclaration(parent) ||
          ts.isArrowFunction(parent) ||
          ts.isFunctionExpression(parent)
        ) {
          // noImplicitAny가 false인 경우 암시적 any
          this.recordImplicitAny(node, sourceFile, analysis);
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return analysis;
  }

  private recordAnyUsage(
    node: ts.Node,
    sourceFile: ts.SourceFile,
    analysis: FileAnalysis
  ): void {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart()
    );
    const parent = node.parent;

    let type: AnyUsage['type'] = 'other';
    let context = '';

    if (ts.isParameter(parent)) {
      type = 'parameter';
      context = `Parameter in ${this.getFunctionName(parent.parent)}`;
    } else if (
      ts.isTypeNode(node) &&
      parent &&
      ts.isFunctionLike(parent.parent)
    ) {
      type = 'return';
      context = `Return type of ${this.getFunctionName(parent.parent)}`;
    } else if (ts.isVariableDeclaration(parent)) {
      type = 'variable';
      context = `Variable: ${parent.name.getText()}`;
    } else if (
      ts.isPropertyDeclaration(parent) ||
      ts.isPropertySignature(parent)
    ) {
      type = 'property';
      context = `Property: ${parent.name?.getText() || 'unknown'}`;
    } else if (ts.isAsExpression(parent)) {
      type = 'cast';
      context = 'Type assertion';
    }

    const usage: AnyUsage = {
      file: analysis.file,
      line: line + 1,
      column: character + 1,
      code: this.getCodeContext(node, sourceFile),
      type,
      context,
    };

    analysis.usages.push(usage);
    analysis.totalCount++;
    analysis.byType[type] = (analysis.byType[type] || 0) + 1;
  }

  private recordImplicitAny(
    node: ts.ParameterDeclaration,
    sourceFile: ts.SourceFile,
    analysis: FileAnalysis
  ): void {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(
      node.getStart()
    );

    const usage: AnyUsage = {
      file: analysis.file,
      line: line + 1,
      column: character + 1,
      code: node.getText(),
      type: 'parameter',
      context: `Implicit any in ${this.getFunctionName(node.parent)}`,
    };

    analysis.usages.push(usage);
    analysis.totalCount++;
    analysis.byType['parameter'] = (analysis.byType['parameter'] || 0) + 1;
  }

  private getFunctionName(node: ts.Node): string {
    if (ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)) {
      return node.name?.getText() || 'anonymous';
    }
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
      const parent = node.parent;
      if (ts.isVariableDeclaration(parent)) {
        return parent.name.getText();
      }
      return 'anonymous';
    }
    return 'unknown';
  }

  private getCodeContext(node: ts.Node, sourceFile: ts.SourceFile): string {
    const start = node.getStart();
    const end = node.getEnd();
    const lineStart = sourceFile.getLineAndCharacterOfPosition(start).line;
    const lineEnd = sourceFile.getLineAndCharacterOfPosition(end).line;

    const lines = sourceFile.text.split('\n');
    const contextLines = lines.slice(Math.max(0, lineStart - 1), lineEnd + 2);

    return contextLines.join('\n').trim();
  }

  private calculateStatistics(): void {
    // Top files 계산
    this.report.topFiles = this.report.fileAnalysis
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 10)
      .map(f => ({ file: f.file, count: f.totalCount }));

    // 타입별 분포 계산
    this.report.byTypeDistribution = {};
    for (const analysis of this.report.fileAnalysis) {
      for (const [type, count] of Object.entries(analysis.byType)) {
        this.report.byTypeDistribution[type] =
          (this.report.byTypeDistribution[type] || 0) + count;
      }
    }
  }

  private generateReport(): void {
    // 콘솔 출력
    console.log(chalk.bold('\n📊 Any 타입 분석 리포트\n'));
    console.log(chalk.yellow(`총 파일 수: ${this.report.totalFiles}`));
    console.log(chalk.red(`총 any 사용: ${this.report.totalAnyCount}개\n`));

    // Top 10 파일
    console.log(chalk.bold('🔝 Any 사용 상위 10개 파일:'));
    this.report.topFiles.forEach((file, index) => {
      const relativePath = path.relative(process.cwd(), file.file);
      console.log(
        `  ${index + 1}. ${chalk.cyan(relativePath)} - ${chalk.red(file.count + '개')}`
      );
    });

    // 타입별 분포
    console.log(chalk.bold('\n📈 타입별 분포:'));
    for (const [type, count] of Object.entries(
      this.report.byTypeDistribution
    )) {
      const percentage = ((count / this.report.totalAnyCount) * 100).toFixed(1);
      console.log(`  ${type}: ${count}개 (${percentage}%)`);
    }

    // JSON 리포트 저장
    const reportPath = path.join(process.cwd(), 'any-type-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    console.log(chalk.green(`\n✅ 상세 리포트 저장: ${reportPath}`));

    // Markdown 리포트 생성
    this.generateMarkdownReport();
  }

  private generateMarkdownReport(): void {
    let markdown = `# TypeScript Any 타입 분석 리포트\n\n`;
    markdown += `생성 시간: ${new Date().toLocaleString('ko-KR')}\n\n`;
    markdown += `## 📊 요약\n\n`;
    markdown += `- **총 파일 수**: ${this.report.totalFiles}\n`;
    markdown += `- **총 any 사용**: ${this.report.totalAnyCount}개\n\n`;

    markdown += `## 🔝 Any 사용 상위 파일\n\n`;
    markdown += `| 순위 | 파일 | Any 개수 |\n`;
    markdown += `|------|------|----------|\n`;
    this.report.topFiles.forEach((file, index) => {
      const relativePath = path.relative(process.cwd(), file.file);
      markdown += `| ${index + 1} | ${relativePath} | ${file.count} |\n`;
    });

    markdown += `\n## 📈 타입별 분포\n\n`;
    markdown += `| 타입 | 개수 | 비율 |\n`;
    markdown += `|------|------|------|\n`;
    for (const [type, count] of Object.entries(
      this.report.byTypeDistribution
    )) {
      const percentage = ((count / this.report.totalAnyCount) * 100).toFixed(1);
      markdown += `| ${type} | ${count} | ${percentage}% |\n`;
    }

    markdown += `\n## 🎯 우선순위 개선 대상\n\n`;
    const priorityFiles = this.report.fileAnalysis
      .filter(f => f.totalCount > 20)
      .sort((a, b) => b.totalCount - a.totalCount)
      .slice(0, 5);

    priorityFiles.forEach(file => {
      const relativePath = path.relative(process.cwd(), file.file);
      markdown += `### ${relativePath} (${file.totalCount}개)\n\n`;

      // 샘플 사용 예시 (최대 3개)
      const samples = file.usages.slice(0, 3);
      samples.forEach(usage => {
        markdown += `- **Line ${usage.line}**: ${usage.context}\n`;
        markdown += `  \`\`\`typescript\n  ${usage.code.split('\n')[0]}\n  \`\`\`\n`;
      });
      markdown += '\n';
    });

    const mdPath = path.join(process.cwd(), 'any-type-analysis.md');
    fs.writeFileSync(mdPath, markdown);
    console.log(chalk.green(`📄 Markdown 리포트 저장: ${mdPath}`));
  }
}

// 실행
const analyzer = new AnyTypeAnalyzer();
const targetDir = process.argv[2] || 'src';

analyzer.analyze(targetDir).catch(error => {
  console.error(chalk.red('❌ 분석 중 오류 발생:'), error);
  process.exit(1);
});
