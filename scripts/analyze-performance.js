#!/usr/bin/env node

/**
 * 성능 분석 스크립트
 * @description 번들 크기, 의존성, 성능 메트릭을 분석하고 리포트 생성
 * @author Central Supervisor
 * @date 2025-01-27
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execAsync = promisify(exec);

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

class PerformanceAnalyzer {
  constructor() {
    this.results = {
      bundleSize: {},
      dependencies: {},
      performance: {},
      timestamp: new Date().toISOString(),
    };
  }

  log(message, color = 'reset') {
    console.log(`${COLORS[color]}${message}${COLORS.reset}`);
  }

  async analyzeBundleSize() {
    this.log('\n📦 분석 중: 번들 크기...', 'cyan');
    
    try {
      // .next/analyze 폴더 확인
      const analyzePath = path.join(__dirname, '../.next/analyze');
      const exists = await fs.access(analyzePath).then(() => true).catch(() => false);
      
      if (!exists) {
        this.log('⚠️  번들 분석 결과가 없습니다. "npm run analyze:bundle"을 먼저 실행하세요.', 'yellow');
        return;
      }

      // 분석 결과 파일 읽기
      const files = await fs.readdir(analyzePath);
      for (const file of files) {
        if (file.endsWith('.html')) {
          const stats = await fs.stat(path.join(analyzePath, file));
          this.results.bundleSize[file] = {
            size: stats.size,
            sizeReadable: this.formatBytes(stats.size),
            created: stats.birthtime,
          };
        }
      }

      this.log('✅ 번들 분석 완료', 'green');
    } catch (error) {
      this.log(`❌ 번들 분석 실패: ${error.message}`, 'red');
    }
  }

  async analyzeDependencies() {
    this.log('\n📚 분석 중: 의존성...', 'cyan');
    
    try {
      const packageJsonPath = path.join(__dirname, '../package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // 의존성 개수 계산
      const dependencies = Object.keys(packageJson.dependencies || {});
      const devDependencies = Object.keys(packageJson.devDependencies || {});
      
      this.results.dependencies = {
        production: dependencies.length,
        development: devDependencies.length,
        total: dependencies.length + devDependencies.length,
        topDependencies: dependencies.slice(0, 10),
      };

      // 대용량 패키지 감지
      const largePackages = await this.detectLargePackages();
      this.results.dependencies.largePackages = largePackages;

      this.log('✅ 의존성 분석 완료', 'green');
    } catch (error) {
      this.log(`❌ 의존성 분석 실패: ${error.message}`, 'red');
    }
  }

  async detectLargePackages() {
    const packages = [];
    try {
      const { stdout } = await execAsync('npm ls --depth=0 --json', {
        cwd: path.join(__dirname, '..'),
      });
      
      const npmList = JSON.parse(stdout);
      // 실제 구현에서는 각 패키지 크기를 측정
      // 여기서는 예시로 일부 패키지만 표시
      
      const knownLargePackages = [
        '@supabase/supabase-js',
        'next',
        'react',
        'react-dom',
        '@google/generative-ai',
      ];

      for (const pkg of knownLargePackages) {
        if (npmList.dependencies && npmList.dependencies[pkg]) {
          packages.push({
            name: pkg,
            version: npmList.dependencies[pkg].version,
          });
        }
      }
    } catch (error) {
      // 에러 무시 (선택적 기능)
    }
    return packages;
  }

  async analyzePerformanceMetrics() {
    this.log('\n⚡ 분석 중: 성능 메트릭...', 'cyan');
    
    try {
      // Next.js 빌드 출력 분석
      const buildOutputPath = path.join(__dirname, '../.next/build-manifest.json');
      const exists = await fs.access(buildOutputPath).then(() => true).catch(() => false);
      
      if (exists) {
        const buildManifest = JSON.parse(await fs.readFile(buildOutputPath, 'utf8'));
        const pages = Object.keys(buildManifest.pages || {});
        
        this.results.performance.pageCount = pages.length;
        this.results.performance.routes = pages.slice(0, 10); // 상위 10개 라우트
      }

      // 메모리 사용량
      const memUsage = process.memoryUsage();
      this.results.performance.memory = {
        heapUsed: this.formatBytes(memUsage.heapUsed),
        heapTotal: this.formatBytes(memUsage.heapTotal),
        external: this.formatBytes(memUsage.external),
        rss: this.formatBytes(memUsage.rss),
      };

      this.log('✅ 성능 메트릭 분석 완료', 'green');
    } catch (error) {
      this.log(`❌ 성능 메트릭 분석 실패: ${error.message}`, 'red');
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateReport() {
    this.log('\n📄 리포트 생성 중...', 'cyan');
    
    const reportPath = path.join(__dirname, '../performance-report.json');
    await fs.writeFile(reportPath, JSON.stringify(this.results, null, 2));
    
    this.log(`✅ 리포트 생성 완료: ${reportPath}`, 'green');
    
    // 요약 출력
    this.printSummary();
  }

  printSummary() {
    this.log('\n========== 성능 분석 요약 ==========', 'magenta');
    
    // 번들 크기
    if (Object.keys(this.results.bundleSize).length > 0) {
      this.log('\n📦 번들 크기:', 'blue');
      for (const [file, info] of Object.entries(this.results.bundleSize)) {
        this.log(`  - ${file}: ${info.sizeReadable}`);
      }
    }

    // 의존성
    if (this.results.dependencies.total) {
      this.log('\n📚 의존성:', 'blue');
      this.log(`  - 프로덕션: ${this.results.dependencies.production}개`);
      this.log(`  - 개발: ${this.results.dependencies.development}개`);
      this.log(`  - 총계: ${this.results.dependencies.total}개`);
      
      if (this.results.dependencies.largePackages.length > 0) {
        this.log('\n  대용량 패키지:');
        this.results.dependencies.largePackages.forEach(pkg => {
          this.log(`    - ${pkg.name}@${pkg.version}`);
        });
      }
    }

    // 성능 메트릭
    if (this.results.performance.memory) {
      this.log('\n⚡ 메모리 사용량:', 'blue');
      this.log(`  - Heap 사용: ${this.results.performance.memory.heapUsed}`);
      this.log(`  - Heap 전체: ${this.results.performance.memory.heapTotal}`);
      this.log(`  - RSS: ${this.results.performance.memory.rss}`);
    }

    this.log('\n====================================', 'magenta');
  }

  async run() {
    this.log('🚀 성능 분석 시작...', 'green');
    
    await this.analyzeBundleSize();
    await this.analyzeDependencies();
    await this.analyzePerformanceMetrics();
    await this.generateReport();
    
    this.log('\n✨ 성능 분석 완료!', 'green');
  }
}

// 메인 실행
const analyzer = new PerformanceAnalyzer();
analyzer.run().catch(error => {
  console.error('성능 분석 중 오류 발생:', error);
  process.exit(1);
});