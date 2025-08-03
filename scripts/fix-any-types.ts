#!/usr/bin/env tsx
/**
 * 🔧 TypeScript any 타입 자동 수정 스크립트
 * 
 * 이 스크립트는 프로젝트 전체의 any 타입을 자동으로 수정합니다.
 * - 명확한 타입이 있는 경우 해당 타입으로 교체
 * - 불명확한 경우 unknown으로 교체
 * - JSDoc 주석을 참고하여 타입 추론
 * 
 * 사용법: npm run fix:any-types
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import * as ts from 'typescript';

interface AnyTypeLocation {
  file: string;
  line: number;
  column: number;
  text: string;
  context: string;
  suggestedType?: string;
}

interface FixResult {
  fixed: number;
  skipped: number;
  errors: number;
  locations: AnyTypeLocation[];
}

class AnyTypesFixer {
  private totalFixed = 0;
  private totalSkipped = 0;
  private totalErrors = 0;
  private locations: AnyTypeLocation[] = [];

  // 타입 추론 규칙
  private typeInferenceRules = new Map<RegExp, string>([
    // 에러 관련
    [/catch\s*\(\s*(\w+)\s*:\s*any\s*\)/, 'Error | unknown'],
    [/error\s*:\s*any/, 'Error | unknown'],
    [/err\s*:\s*any/, 'Error | unknown'],
    
    // 이벤트 관련
    [/event\s*:\s*any/, 'Event'],
    [/e\s*:\s*any.*onClick/, 'React.MouseEvent'],
    [/e\s*:\s*any.*onChange/, 'React.ChangeEvent'],
    [/e\s*:\s*any.*onSubmit/, 'React.FormEvent'],
    
    // React 관련
    [/children\s*:\s*any/, 'React.ReactNode'],
    [/props\s*:\s*any/, 'Record<string, unknown>'],
    [/ref\s*:\s*any/, 'React.RefObject<unknown>'],
    
    // 데이터 관련
    [/data\s*:\s*any/, 'unknown'],
    [/response\s*:\s*any/, 'unknown'],
    [/result\s*:\s*any/, 'unknown'],
    [/value\s*:\s*any/, 'unknown'],
    
    // 함수 관련
    [/callback\s*:\s*any/, '(...args: unknown[]) => unknown'],
    [/handler\s*:\s*any/, '(...args: unknown[]) => void'],
    
    // 객체 관련
    [/config\s*:\s*any/, 'Record<string, unknown>'],
    [/options\s*:\s*any/, 'Record<string, unknown>'],
    [/params\s*:\s*any/, 'Record<string, unknown>'],
    
    // 배열 관련
    [/items\s*:\s*any\[\]/, 'unknown[]'],
    [/list\s*:\s*any\[\]/, 'unknown[]'],
    [/array\s*:\s*any\[\]/, 'unknown[]'],
  ]);

  async fixAnyTypes(targetPath: string = 'src'): Promise<FixResult> {
    console.log('🔍 TypeScript any 타입 검색 시작...\n');

    const files = glob.sync(`${targetPath}/**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**', '**/*.test.ts', '**/*.test.tsx', '**/dist/**', '**/.next/**']
    });

    console.log(`📁 검사할 파일: ${files.length}개\n`);

    for (const file of files) {
      await this.processFile(file);
    }

    // 결과 요약 생성
    await this.generateReport();

    return {
      fixed: this.totalFixed,
      skipped: this.totalSkipped,
      errors: this.totalErrors,
      locations: this.locations
    };
  }

  private async processFile(filePath: string): Promise<void> {
    try {
      let content = fs.readFileSync(filePath, 'utf-8');
      const originalContent = content;
      let fileFixed = 0;
      let fileSkipped = 0;

      // 1. 단순 any 타입 교체 (변수 선언)
      content = content.replace(/:\s*any\b/g, (match, offset) => {
        const lineStart = content.lastIndexOf('\n', offset) + 1;
        const lineEnd = content.indexOf('\n', offset);
        const line = content.substring(lineStart, lineEnd);
        const lineNumber = content.substring(0, offset).split('\n').length;

        // 타입 추론 시도
        let suggestedType = 'unknown';
        for (const [pattern, type] of this.typeInferenceRules) {
          if (pattern.test(line)) {
            suggestedType = type;
            break;
          }
        }

        // 특별한 경우 처리
        if (line.includes('as any')) {
          fileSkipped++;
          return match; // 타입 단언은 건너뛰기
        }

        // JSDoc 주석 확인
        const jsdocMatch = content.substring(Math.max(0, lineStart - 200), lineStart)
          .match(/@(param|returns?|type)\s*{([^}]+)}/);
        if (jsdocMatch) {
          suggestedType = jsdocMatch[2].trim();
        }

        this.locations.push({
          file: filePath,
          line: lineNumber,
          column: offset - lineStart,
          text: match,
          context: line.trim(),
          suggestedType
        });

        fileFixed++;
        return `: ${suggestedType}`;
      });

      // 2. 함수 매개변수의 any 처리
      content = content.replace(/\(([^)]*:\s*)any([^)]*)\)/g, (match, before, after) => {
        // 이미 처리된 경우 건너뛰기
        if (before.includes('unknown')) return match;
        
        fileFixed++;
        return `(${before}unknown${after})`;
      });

      // 3. 제네릭 any 처리
      content = content.replace(/<any>/g, '<unknown>');
      content = content.replace(/Array<any>/g, 'Array<unknown>');
      content = content.replace(/Promise<any>/g, 'Promise<unknown>');

      // 4. any[] 배열 타입 처리
      content = content.replace(/:\s*any\[\]/g, ': unknown[]');

      // 파일이 변경된 경우에만 저장
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ ${filePath}: ${fileFixed}개 수정, ${fileSkipped}개 건너뜀`);
        this.totalFixed += fileFixed;
        this.totalSkipped += fileSkipped;
      }
    } catch (error) {
      console.error(`❌ 파일 처리 실패: ${filePath}`, error);
      this.totalErrors++;
    }
  }

  private async generateReport(): Promise<void> {
    const reportPath = path.join(process.cwd(), '.claude/reports/any-types-fix-report.md');
    
    const report = `# any 타입 수정 보고서

생성일: ${new Date().toISOString()}

## 📊 요약

- **총 수정됨**: ${this.totalFixed}개
- **건너뜀**: ${this.totalSkipped}개
- **오류**: ${this.totalErrors}개

## 📍 수정 위치

${this.locations.slice(0, 100).map(loc => 
  `- **${loc.file}:${loc.line}**
  - 원본: \`${loc.text}\`
  - 수정: \`${loc.suggestedType}\`
  - 컨텍스트: \`${loc.context}\`
`).join('\n')}

${this.locations.length > 100 ? `\n... 그리고 ${this.locations.length - 100}개 더` : ''}

## 🔧 수동 검토 필요

다음 패턴들은 수동 검토가 필요합니다:

1. \`as any\` 타입 단언
2. 복잡한 제네릭 타입
3. 동적 속성 접근
4. 외부 라이브러리 타입

## 📝 다음 단계

1. \`npm run type-check\`로 타입 오류 확인
2. 테스트 실행으로 런타임 오류 확인
3. 필요한 경우 구체적인 타입으로 수정
`;

    // 보고서 디렉토리 생성
    const reportDir = path.dirname(reportPath);
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    fs.writeFileSync(reportPath, report, 'utf-8');
    console.log(`\n📄 상세 보고서: ${reportPath}`);
  }
}

// 스크립트 실행
async function main() {
  const fixer = new AnyTypesFixer();
  const startTime = Date.now();

  try {
    const result = await fixer.fixAnyTypes();
    const duration = Date.now() - startTime;

    console.log('\n✨ any 타입 수정 완료!');
    console.log(`⏱️  실행 시간: ${(duration / 1000).toFixed(2)}초`);
    console.log(`📊 결과: ${result.fixed}개 수정, ${result.skipped}개 건너뜀, ${result.errors}개 오류`);
    
    // package.json에 스크립트 추가 안내
    console.log('\n💡 package.json에 다음 스크립트를 추가하세요:');
    console.log('   "fix:any-types": "tsx scripts/fix-any-types.ts"');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ 스크립트 실행 실패:', error);
    process.exit(1);
  }
}

// 직접 실행된 경우에만 main 함수 호출
if (require.main === module) {
  main();
}

export { AnyTypesFixer };