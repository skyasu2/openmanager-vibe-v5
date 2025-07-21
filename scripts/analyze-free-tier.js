#!/usr/bin/env node

/**
 * 🆓 무료티어 제약사항 분석 스크립트
 *
 * 모든 배포 구성이 무료티어에서 안전하게 동작하는지 종합 분석
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// 🎯 무료티어 제한사항 정의
// ============================================

const FREE_TIER_LIMITS = {
  vercel: {
    maxMemory: 50, // MB
    maxDuration: 10, // seconds
    maxConcurrentRequests: 10,
    maxExecutions: 100_000, // per month
    maxBandwidth: 100, // GB per month
  },
  supabase: {
    maxDatabase: 0.5, // GB
    maxBandwidth: 5, // GB per month
    maxRequests: 50_000, // per month
    maxStorage: 1, // GB
    maxRealtimeConnections: 2,
  },
  redis: {
    maxMemory: 256, // MB
    maxCommands: 10_000, // per day
    maxConnections: 20,
    maxBandwidth: 100, // MB per day
  },
  googleAI: {
    maxRequests: 1_500, // per day
    maxTokens: 1_000_000, // per day
    maxRPM: 15, // requests per minute
    maxConcurrent: 2,
  },
};

// ============================================
// 🔍 분석 클래스
// ============================================

class FreeTierAnalyzer {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.recommendations = [];
  }

  /**
   * 🚀 메인 분석 함수
   */
  async analyze() {
    console.log('🔍 무료티어 제약사항 분석 시작...\n');

    // 각 영역별 분석
    await this.analyzeServerlessFunctions();
    await this.analyzeExternalServices();
    await this.analyzeBackgroundJobs();
    await this.analyzeMemoryUsage();
    await this.analyzeDatabaseUsage();
    await this.analyzeAPIQuotas();

    // 결과 출력
    this.printResults();

    // 최적화 제안
    this.generateOptimizations();

    return {
      issues: this.issues,
      warnings: this.warnings,
      recommendations: this.recommendations,
      passed: this.issues.length === 0,
    };
  }

  /**
   * 📱 서버리스 함수 분석
   */
  async analyzeServerlessFunctions() {
    console.log('📱 서버리스 함수 분석 중...');

    const apiDir = path.join(process.cwd(), 'src/app/api');
    const apiFiles = this.getApiFiles(apiDir);

    for (const file of apiFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // setInterval/setTimeout 체크
        if (content.includes('setInterval') || content.includes('setTimeout')) {
          const filename = path.relative(process.cwd(), file);
          this.issues.push({
            type: 'SERVERLESS_TIMER',
            file: filename,
            message: '서버리스 환경에서 지속적인 타이머 사용',
            severity: 'HIGH',
            solution: 'Edge Runtime 또는 외부 스케줄러 사용 권장',
          });
        }

        // 메모리 집약적 작업 체크
        if (content.includes('Buffer.alloc') || content.includes('new Array')) {
          const filename = path.relative(process.cwd(), file);
          this.warnings.push({
            type: 'MEMORY_INTENSIVE',
            file: filename,
            message: '메모리 집약적 작업 감지',
            severity: 'MEDIUM',
            solution: '스트리밍 또는 청크 처리 권장',
          });
        }

        // 긴 실행 시간이 예상되는 작업 체크
        if (
          content.includes('await new Promise') &&
          content.includes('setTimeout')
        ) {
          const filename = path.relative(process.cwd(), file);
          this.warnings.push({
            type: 'LONG_EXECUTION',
            file: filename,
            message: '긴 실행 시간이 예상되는 작업',
            severity: 'MEDIUM',
            solution: '비동기 처리 또는 백그라운드 작업으로 분리 권장',
          });
        }
      } catch (error) {
        console.log(`  ⚠️  ${file} 분석 중 오류: ${error.message}`);
      }
    }
  }

  /**
   * 🌐 외부 서비스 분석
   */
  async analyzeExternalServices() {
    console.log('🌐 외부 서비스 호출 분석 중...');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    let googleAIUsage = 0;
    let supabaseUsage = 0;
    let redisUsage = 0;

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // Google AI 사용량 체크
        const googleAIMatches = content.match(/gemini|google.*ai|googleai/gi);
        if (googleAIMatches) {
          googleAIUsage += googleAIMatches.length;
        }

        // Supabase 사용량 체크
        const supabaseMatches = content.match(/supabase|from.*supabase/gi);
        if (supabaseMatches) {
          supabaseUsage += supabaseMatches.length;
        }

        // Redis 사용량 체크
        const redisMatches = content.match(/redis|upstash/gi);
        if (redisMatches) {
          redisUsage += redisMatches.length;
        }

        // 과도한 API 호출 체크
        if (content.includes('setInterval') && content.includes('fetch')) {
          const filename = path.relative(process.cwd(), file);
          this.issues.push({
            type: 'EXCESSIVE_API_CALLS',
            file: filename,
            message: '주기적인 API 호출로 할당량 초과 가능성',
            severity: 'HIGH',
            solution: '호출 빈도 조절 또는 캐싱 구현 필요',
          });
        }
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    }

    // 사용량 평가
    if (googleAIUsage > 50) {
      this.warnings.push({
        type: 'HIGH_GOOGLE_AI_USAGE',
        message: `Google AI 사용량이 높음 (${googleAIUsage}개 참조)`,
        severity: 'MEDIUM',
        solution: '일일 할당량 1,500개 초과 시 서비스 중단 가능',
      });
    }

    if (supabaseUsage > 100) {
      this.warnings.push({
        type: 'HIGH_SUPABASE_USAGE',
        message: `Supabase 사용량이 높음 (${supabaseUsage}개 참조)`,
        severity: 'MEDIUM',
        solution: '월 50,000개 요청 초과 시 서비스 중단 가능',
      });
    }
  }

  /**
   * ⚙️ 백그라운드 작업 분석
   */
  async analyzeBackgroundJobs() {
    console.log('⚙️ 백그라운드 작업 분석 중...');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // 스케줄러 체크
        if (content.includes('setInterval') || content.includes('cron')) {
          const filename = path.relative(process.cwd(), file);
          this.issues.push({
            type: 'BACKGROUND_JOB',
            file: filename,
            message: '백그라운드 작업이 서버리스 환경에서 실행될 수 없음',
            severity: 'HIGH',
            solution: 'Vercel Cron Jobs 또는 외부 스케줄러 사용 필요',
          });
        }

        // 데이터베이스 연결 풀 체크
        if (content.includes('pool') && content.includes('connection')) {
          const filename = path.relative(process.cwd(), file);
          this.warnings.push({
            type: 'CONNECTION_POOL',
            file: filename,
            message: '연결 풀이 서버리스 환경에서 효율적이지 않음',
            severity: 'MEDIUM',
            solution: 'Supabase 클라이언트 라이브러리 사용 권장',
          });
        }
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    }
  }

  /**
   * 💾 메모리 사용량 분석
   */
  async analyzeMemoryUsage() {
    console.log('💾 메모리 사용량 분석 중...');

    const packagePath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    // 패키지 크기 체크
    const heavyPackages = [
      'tensorflow',
      'pytorch',
      'opencv',
      'sharp',
      'canvas',
      'puppeteer',
      'playwright',
    ];

    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const pkg of heavyPackages) {
      if (dependencies[pkg]) {
        this.warnings.push({
          type: 'HEAVY_PACKAGE',
          package: pkg,
          message: `무거운 패키지 ${pkg}가 메모리 한도 초과 가능성`,
          severity: 'HIGH',
          solution: '경량 대안 패키지 사용 또는 동적 로딩 구현',
        });
      }
    }

    // 번들 크기 체크 (대략적 추정)
    const dependencyCount = Object.keys(dependencies).length;
    if (dependencyCount > 50) {
      this.warnings.push({
        type: 'LARGE_BUNDLE',
        message: `의존성이 많음 (${dependencyCount}개)`,
        severity: 'MEDIUM',
        solution: '불필요한 의존성 제거 및 트리 쉐이킹 최적화',
      });
    }
  }

  /**
   * 🗄️ 데이터베이스 사용량 분석
   */
  async analyzeDatabaseUsage() {
    console.log('🗄️ 데이터베이스 사용량 분석 중...');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // 대용량 쿼리 체크
        if (content.includes('.limit(') && content.includes('1000')) {
          const filename = path.relative(process.cwd(), file);
          this.warnings.push({
            type: 'LARGE_QUERY',
            file: filename,
            message: '대용량 쿼리가 무료 플랜 한도 초과 가능성',
            severity: 'MEDIUM',
            solution: '페이지네이션 또는 스트리밍 구현 권장',
          });
        }

        // 실시간 기능 체크
        if (content.includes('realtime') || content.includes('subscribe')) {
          const filename = path.relative(process.cwd(), file);
          this.warnings.push({
            type: 'REALTIME_USAGE',
            file: filename,
            message: '실시간 기능이 무료 플랜에서 제한됨 (동시 연결 2개)',
            severity: 'MEDIUM',
            solution: '실시간 기능 최소화 또는 폴링 사용 권장',
          });
        }
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    }
  }

  /**
   * 📊 API 할당량 분석
   */
  async analyzeAPIQuotas() {
    console.log('📊 API 할당량 분석 중...');

    const srcDir = path.join(process.cwd(), 'src');
    const files = this.getAllFiles(srcDir, ['.ts', '.tsx']);

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');

        // 할당량 보호 체크
        if (content.includes('QUOTA_PROTECTION=false')) {
          const filename = path.relative(process.cwd(), file);
          this.issues.push({
            type: 'QUOTA_PROTECTION_DISABLED',
            file: filename,
            message: '할당량 보호가 비활성화됨',
            severity: 'HIGH',
            solution: '프로덕션 환경에서 할당량 보호 활성화 필요',
          });
        }

        // 무제한 루프 체크
        if (content.includes('while(true)') || content.includes('for(;;)')) {
          const filename = path.relative(process.cwd(), file);
          this.issues.push({
            type: 'INFINITE_LOOP',
            file: filename,
            message: '무한 루프가 할당량 초과 가능성',
            severity: 'CRITICAL',
            solution: '적절한 종료 조건 또는 제한 설정 필요',
          });
        }
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    }
  }

  /**
   * 🎯 결과 출력
   */
  printResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎯 무료티어 제약사항 분석 결과');
    console.log('='.repeat(60));

    // 심각한 문제
    if (this.issues.length > 0) {
      console.log('\n🚨 심각한 문제 (즉시 수정 필요):');
      this.issues.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.message}`);
        if (issue.file) console.log(`   📁 파일: ${issue.file}`);
        console.log(`   💡 해결책: ${issue.solution}\n`);
      });
    }

    // 경고
    if (this.warnings.length > 0) {
      console.log('\n⚠️  경고 (모니터링 필요):');
      this.warnings.forEach((warning, index) => {
        console.log(`${index + 1}. [${warning.severity}] ${warning.message}`);
        if (warning.file) console.log(`   📁 파일: ${warning.file}`);
        console.log(`   💡 해결책: ${warning.solution}\n`);
      });
    }

    // 종합 평가
    console.log('\n📊 종합 평가:');
    console.log(`심각한 문제: ${this.issues.length}개`);
    console.log(`경고: ${this.warnings.length}개`);

    const status = this.issues.length === 0 ? '✅ 안전' : '❌ 위험';
    console.log(`무료티어 호환성: ${status}`);
  }

  /**
   * 🔧 최적화 제안 생성
   */
  generateOptimizations() {
    console.log('\n🔧 무료티어 최적화 제안:');

    const optimizations = [
      '1. 서버리스 함수 최적화:',
      '   - 메모리 사용량 40MB 이하로 제한',
      '   - 실행 시간 8초 이하로 제한',
      '   - 동시 실행 5개 이하로 제한',
      '',
      '2. 외부 서비스 최적화:',
      '   - Google AI: 일일 1,000개 요청 이하',
      '   - Supabase: 월 40,000개 요청 이하',
      '   - Redis: 일일 8,000개 명령어 이하',
      '',
      '3. 백그라운드 작업 대체:',
      '   - Vercel Cron Jobs 사용',
      '   - 외부 스케줄러 (GitHub Actions 등) 사용',
      '   - 사용자 요청 기반 트리거 사용',
      '',
      '4. 메모리 최적화:',
      '   - 불필요한 의존성 제거',
      '   - 동적 임포트 활용',
      '   - 스트리밍 및 청크 처리',
      '',
      '5. 데이터베이스 최적화:',
      '   - 쿼리 결과 캐싱',
      '   - 페이지네이션 구현',
      '   - 실시간 기능 최소화',
    ];

    optimizations.forEach(opt => console.log(opt));
  }

  /**
   * 📂 API 파일 목록 가져오기
   */
  getApiFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getApiFiles(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('route.ts')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  /**
   * 📂 모든 파일 목록 가져오기
   */
  getAllFiles(dir, extensions) {
    const files = [];
    if (!fs.existsSync(dir)) return files;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (
        entry.isDirectory() &&
        !entry.name.startsWith('.') &&
        entry.name !== 'node_modules'
      ) {
        files.push(...this.getAllFiles(fullPath, extensions));
      } else if (
        entry.isFile() &&
        extensions.some(ext => entry.name.endsWith(ext))
      ) {
        files.push(fullPath);
      }
    }
    return files;
  }
}

// ============================================
// 🚀 실행
// ============================================

async function main() {
  const analyzer = new FreeTierAnalyzer();
  const result = await analyzer.analyze();

  // 결과에 따른 종료 코드
  process.exit(result.passed ? 0 : 1);
}

// 스크립트 직접 실행 시에만 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { FREE_TIER_LIMITS, FreeTierAnalyzer };
