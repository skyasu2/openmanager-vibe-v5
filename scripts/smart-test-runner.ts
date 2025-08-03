#!/usr/bin/env tsx

/**
 * 🎯 스마트 테스트 선택기
 * 변경된 파일에 따라 영향받는 테스트만 실행
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface TestMapping {
  source: string;
  tests: string[];
}

class SmartTestRunner {
  private mappings: Map<string, string[]> = new Map();
  private changedFiles: Set<string> = new Set();

  constructor() {
    this.initializeMappings();
  }

  /**
   * 소스 파일과 테스트 파일 매핑 초기화
   */
  private initializeMappings() {
    // 일반적인 매핑 규칙
    const rules = [
      {
        // 컴포넌트 -> 컴포넌트 테스트
        pattern: /^src\/components\/(.*)\.tsx?$/,
        testPatterns: [
          'src/components/$1.test.{ts,tsx}',
          'src/components/$1.spec.{ts,tsx}',
          'src/components/__tests__/$1.test.{ts,tsx}',
          'tests/unit/components/$1.test.{ts,tsx}',
        ],
      },
      {
        // 서비스 -> 서비스 테스트
        pattern: /^src\/services\/(.*)\.ts$/,
        testPatterns: [
          'src/services/$1.test.ts',
          'src/services/__tests__/$1.test.ts',
          'tests/unit/services/$1.test.ts',
        ],
      },
      {
        // API 라우트 -> API 테스트
        pattern: /^src\/app\/api\/(.*)\/route\.ts$/,
        testPatterns: [
          'src/app/api/$1/__tests__/route.test.ts',
          'tests/api/$1.test.ts',
        ],
      },
      {
        // 유틸리티 -> 유틸리티 테스트
        pattern: /^src\/utils\/(.*)\.ts$/,
        testPatterns: [
          'src/utils/$1.test.ts',
          'src/utils/__tests__/$1.test.ts',
          'tests/unit/utils/$1.test.ts',
        ],
      },
      {
        // lib -> lib 테스트
        pattern: /^src\/lib\/(.*)\.ts$/,
        testPatterns: [
          'src/lib/$1.test.ts',
          'src/lib/__tests__/$1.test.ts',
          'tests/unit/lib/$1.test.ts',
        ],
      },
    ];

    // 특별한 매핑 (하드코딩)
    this.mappings.set('src/lib/supabase/supabase-client.ts', [
      'tests/unit/services/supabase/ResilientSupabaseClient.test.ts',
      'tests/unit/services/supabase/SupabaseTimeSeriesManager.test.ts',
    ]);

    this.mappings.set('src/lib/redis/index.ts', [
      'tests/unit/services/redis/SmartRedisClient.test.ts',
    ]);

    this.mappings.set('src/services/ai/UnifiedAIEngineRouter.tsx', [
      'tests/unit/services/ai/UnifiedAIEngineRouter.test.ts',
    ]);
  }

  /**
   * Git에서 변경된 파일 목록 가져오기
   */
  private getChangedFiles(mode: 'staged' | 'branch' | 'last-commit' = 'staged'): string[] {
    try {
      let command: string;
      
      switch (mode) {
        case 'staged':
          // 스테이징된 파일들
          command = 'git diff --cached --name-only';
          break;
        case 'branch':
          // 현재 브랜치에서 변경된 모든 파일
          command = 'git diff main...HEAD --name-only';
          break;
        case 'last-commit':
          // 마지막 커밋에서 변경된 파일
          command = 'git diff HEAD~1 --name-only';
          break;
      }

      const output = execSync(command, { encoding: 'utf-8' });
      return output
        .split('\n')
        .filter(file => file.length > 0)
        .filter(file => file.endsWith('.ts') || file.endsWith('.tsx'));
    } catch (error) {
      console.error('Git 명령 실행 실패:', error);
      return [];
    }
  }

  /**
   * 파일에 대한 테스트 찾기
   */
  private findTestsForFile(file: string): string[] {
    const tests: Set<string> = new Set();

    // 하드코딩된 매핑 확인
    if (this.mappings.has(file)) {
      this.mappings.get(file)!.forEach(test => tests.add(test));
    }

    // 규칙 기반 매핑
    // 1. 같은 디렉토리의 테스트 파일
    const dir = path.dirname(file);
    const basename = path.basename(file, path.extname(file));
    
    const possibleTests = [
      `${dir}/${basename}.test.ts`,
      `${dir}/${basename}.test.tsx`,
      `${dir}/${basename}.spec.ts`,
      `${dir}/${basename}.spec.tsx`,
      `${dir}/__tests__/${basename}.test.ts`,
      `${dir}/__tests__/${basename}.test.tsx`,
    ];

    // 2. tests 디렉토리의 대응 테스트
    const relativePath = file.replace(/^src\//, '');
    const testInTestsDir = [
      `tests/unit/${relativePath.replace(/\.tsx?$/, '.test.ts')}`,
      `tests/integration/${relativePath.replace(/\.tsx?$/, '.test.ts')}`,
    ];

    [...possibleTests, ...testInTestsDir].forEach(testFile => {
      if (fs.existsSync(testFile)) {
        tests.add(testFile);
      }
    });

    return Array.from(tests);
  }

  /**
   * 영향받는 테스트 분석
   */
  public analyzeImpactedTests(mode: 'staged' | 'branch' | 'last-commit' = 'staged'): string[] {
    const changedFiles = this.getChangedFiles(mode);
    const impactedTests: Set<string> = new Set();

    console.log(`🔍 변경된 파일 ${changedFiles.length}개 발견`);
    
    changedFiles.forEach(file => {
      console.log(`  - ${file}`);
      
      // 테스트 파일 자체가 변경된 경우
      if (file.includes('.test.') || file.includes('.spec.')) {
        impactedTests.add(file);
      } else {
        // 소스 파일이 변경된 경우 관련 테스트 찾기
        const tests = this.findTestsForFile(file);
        tests.forEach(test => impactedTests.add(test));
      }
    });

    return Array.from(impactedTests);
  }

  /**
   * 테스트 실행
   */
  public async runTests(tests: string[], options: { coverage?: boolean } = {}) {
    if (tests.length === 0) {
      console.log('✅ 실행할 테스트가 없습니다.');
      return;
    }

    console.log(`\n🧪 ${tests.length}개의 테스트 실행:`);
    tests.forEach(test => console.log(`  - ${test}`));

    // Vitest 명령 구성
    const args = [
      'npx',
      'vitest',
      'run',
      ...tests,
      '--reporter=default',
    ];

    if (!options.coverage) {
      args.push('--no-coverage');
    }

    // 테스트 실행
    try {
      execSync(args.join(' '), {
        stdio: 'inherit',
        env: {
          ...process.env,
          USE_REAL_REDIS: 'false',
        },
      });
      console.log('\n✅ 모든 테스트 통과!');
    } catch (error) {
      console.error('\n❌ 테스트 실패');
      process.exit(1);
    }
  }

  /**
   * 테스트 의존성 그래프 생성
   */
  public generateDependencyGraph() {
    const graph: Record<string, string[]> = {};

    // 모든 소스 파일 찾기
    const findFiles = (dir: string, pattern: RegExp): string[] => {
      const files: string[] = [];
      
      const walk = (currentDir: string) => {
        if (!fs.existsSync(currentDir)) return;
        
        const items = fs.readdirSync(currentDir);
        items.forEach(item => {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walk(fullPath);
          } else if (stat.isFile() && pattern.test(fullPath)) {
            files.push(fullPath);
          }
        });
      };
      
      walk(dir);
      return files;
    };

    const sourceFiles = findFiles('src', /\.(ts|tsx)$/);
    
    sourceFiles.forEach(file => {
      const tests = this.findTestsForFile(file);
      if (tests.length > 0) {
        graph[file] = tests;
      }
    });

    return graph;
  }
}

// CLI 인터페이스
if (require.main === module) {
  const runner = new SmartTestRunner();
  const args = process.argv.slice(2);
  
  const mode = args.includes('--branch') ? 'branch' : 
               args.includes('--last-commit') ? 'last-commit' : 
               'staged';
  
  const coverage = args.includes('--coverage');
  const dryRun = args.includes('--dry-run');
  const showGraph = args.includes('--graph');

  if (showGraph) {
    // 의존성 그래프 표시
    const graph = runner.generateDependencyGraph();
    console.log('📊 테스트 의존성 그래프:');
    Object.entries(graph).forEach(([source, tests]) => {
      console.log(`\n${source}:`);
      tests.forEach(test => console.log(`  → ${test}`));
    });
  } else {
    // 영향받는 테스트 분석
    const tests = runner.analyzeImpactedTests(mode);
    
    if (dryRun) {
      // Dry run 모드
      console.log(`\n📋 실행될 테스트 (${tests.length}개):`);
      tests.forEach(test => console.log(`  - ${test}`));
    } else {
      // 실제 테스트 실행
      runner.runTests(tests, { coverage });
    }
  }
}

export { SmartTestRunner };