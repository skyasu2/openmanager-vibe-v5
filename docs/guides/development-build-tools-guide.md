# 🛠️ 개발 & 빌드 도구 가이드

> **TypeScript + AI CLI + 빌드 최적화 완전 설정**  
> 최종 업데이트: 2025-08-18  
> 도구: TypeScript + Claude + Gemini + Qwen + 빌드 시스템

## 🎯 개요

OpenManager VIBE v5의 개발 및 빌드 도구를 체계적으로 관리하는 가이드입니다. TypeScript 프로덕션 설정, AI CLI 도구 배포 통합, 빌드 시스템 최적화를 다룹니다.

## 📋 목차

1. [TypeScript 프로덕션 설정](#typescript-프로덕션-설정)
2. [AI CLI 도구 배포 통합](#ai-cli-도구-배포-통합)
3. [빌드 시스템 최적화](#빌드-시스템-최적화)
4. [개발 도구 자동화](#개발-도구-자동화)
5. [문제 해결](#문제-해결)

## 📘 TypeScript 프로덕션 설정

### 1단계: 프로덕션 TypeScript 구성

```json
// tsconfig.prod.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "sourceMap": false,
    "removeComments": true,
    "declaration": false,
    "incremental": false
  },
  "exclude": [
    "**/*.test.ts",
    "**/*.test.tsx",
    "**/*.stories.tsx",
    "**/*.spec.ts",
    "scripts/**/*",
    "docs/**/*"
  ]
}
```

### 2단계: 타입 안전성 검증

```typescript
// scripts/build/type-safety-check.ts
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface TypeCheckResult {
  success: boolean;
  errors: string[];
  warnings: string[];
}

class TypeSafetyChecker {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  async checkAllTypes(): Promise<TypeCheckResult> {
    console.log('🔍 TypeScript 타입 안전성 검사 시작...');

    try {
      // 프로덕션 설정으로 타입 체크
      const output = execSync('npx tsc --noEmit --project tsconfig.prod.json', {
        cwd: this.projectRoot,
        encoding: 'utf8',
      });

      return {
        success: true,
        errors: [],
        warnings: [],
      };
    } catch (error: any) {
      const errors = this.parseTypeScriptErrors(error.stdout || error.message);

      return {
        success: false,
        errors: errors.filter((e) => e.includes('error')),
        warnings: errors.filter((e) => e.includes('warning')),
      };
    }
  }

  private parseTypeScriptErrors(output: string): string[] {
    return output
      .split('\n')
      .filter((line) => line.trim())
      .filter((line) => line.includes('.ts(') || line.includes('.tsx('));
  }

  async generateTypeReport(): Promise<void> {
    const result = await this.checkAllTypes();

    const report = {
      timestamp: new Date().toISOString(),
      success: result.success,
      errorCount: result.errors.length,
      warningCount: result.warnings.length,
      errors: result.errors,
      warnings: result.warnings,
    };

    fs.writeFileSync(
      path.join(this.projectRoot, 'reports/type-safety-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log(`📊 타입 안전성 리포트 생성: ${result.success ? '✅' : '❌'}`);
    console.log(
      `   에러: ${result.errors.length}개, 경고: ${result.warnings.length}개`
    );
  }
}

export { TypeSafetyChecker };

// 직접 실행 시
if (require.main === module) {
  const checker = new TypeSafetyChecker(process.cwd());
  checker
    .generateTypeReport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

### 3단계: 빌드 최적화

```json
// package.json (프로덕션 스크립트)
{
  "scripts": {
    "build:prod": "npm run type-check:prod && npm run build",
    "type-check:prod": "tsc --noEmit --project tsconfig.prod.json",
    "build:analyze": "ANALYZE=true npm run build",
    "build:clean": "rm -rf .next && npm run build:prod",
    "pre-deploy": "npm run type-check:prod && npm run test:coverage && npm run build:clean"
  }
}
```

### 4단계: 타입 정의 자동 생성

```typescript
// scripts/build/type-generator.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

class TypeDefinitionGenerator {
  private outputDir: string;

  constructor(outputDir: string = 'types/generated') {
    this.outputDir = outputDir;
  }

  async generateSupabaseTypes(): Promise<void> {
    console.log('🗃️ Supabase 타입 정의 생성...');

    try {
      // Supabase CLI로 타입 정의 생성
      const output = execSync('supabase gen types typescript --local', {
        encoding: 'utf8',
      });

      const outputPath = path.join(this.outputDir, 'supabase.ts');
      fs.writeFileSync(outputPath, output);

      console.log(`✅ Supabase 타입 정의 생성 완료: ${outputPath}`);
    } catch (error) {
      console.error('❌ Supabase 타입 정의 생성 실패:', error);
      throw error;
    }
  }

  async generateAPITypes(): Promise<void> {
    console.log('🔌 API 타입 정의 생성...');

    const apiTypesTemplate = `
// Auto-generated API types
export interface APIResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  version: string;
  uptime: number;
  timestamp: string;
  services?: {
    database: boolean;
    redis: boolean;
    external: boolean;
  };
}

export interface ServerStatus {
  id: string;
  name: string;
  host: string;
  port: number;
  protocol: 'http' | 'https';
  status: 'active' | 'inactive' | 'error' | 'unknown';
  response_time?: number;
  last_check: string;
  created_at: string;
}
`;

    const outputPath = path.join(this.outputDir, 'api.ts');
    fs.writeFileSync(outputPath, apiTypesTemplate.trim());

    console.log(`✅ API 타입 정의 생성 완료: ${outputPath}`);
  }

  async generateAllTypes(): Promise<void> {
    // 출력 디렉토리 생성
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    await Promise.all([
      this.generateSupabaseTypes(),
      this.generateAPITypes(),
    ]);

    // 인덱스 파일 생성
    const indexContent = `
export * from './supabase';
export * from './api';
`;

    fs.writeFileSync(
      path.join(this.outputDir, 'index.ts'),
      indexContent.trim()
    );

    console.log('🎯 모든 타입 정의 생성 완료');
  }
}

export { TypeDefinitionGenerator };

// 직접 실행 시
if (require.main === module) {
  const generator = new TypeDefinitionGenerator();
  generator
    .generateAllTypes()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

## 🤖 AI CLI 도구 배포 통합

### 1단계: AI CLI 도구 배포 환경 설정

```bash
# scripts/deploy/ai-tools-setup.sh
#!/bin/bash

echo "🤖 AI CLI 도구 배포 환경 설정..."

# Claude Code 프로덕션 설정
echo "1. Claude Code 설정..."
cat > ~/.claude/deploy-settings.json << 'EOF'
{
  "statusLine": {
    "type": "command",
    "command": "ccusage statusline --production",
    "padding": 0
  },
  "deployment": {
    "environment": "production",
    "logLevel": "error",
    "maxTokens": 100000
  }
}
EOF

# Gemini CLI 프로덕션 설정
echo "2. Gemini CLI 설정..."
gemini config set --production \
  --max-tokens 32000 \
  --temperature 0.1 \
  --safety-level high

# Qwen CLI 프로덕션 설정
echo "3. Qwen CLI 설정..."
qwen config set --production \
  --max-tokens 32000 \
  --top-p 0.8 \
  --repetition-penalty 1.05

echo "✅ AI CLI 도구 배포 환경 설정 완료"
```

### 2단계: 배포 시 AI 검증

```typescript
// scripts/deploy/ai-validation.ts
import { execSync } from 'child_process';

interface AIValidationResult {
  claude: boolean;
  gemini: boolean;
  qwen: boolean;
  issues: string[];
}

class AIDeploymentValidator {
  async validateAllAITools(): Promise<AIValidationResult> {
    console.log('🤖 AI 도구 배포 검증 시작...');

    const result: AIValidationResult = {
      claude: false,
      gemini: false,
      qwen: false,
      issues: [],
    };

    // Claude Code 검증
    try {
      const claudeOutput = execSync('claude --version', { encoding: 'utf8' });
      result.claude = claudeOutput.includes('1.0.81');
      if (!result.claude) {
        result.issues.push('Claude Code 버전이 올바르지 않습니다');
      }
    } catch (error) {
      result.issues.push('Claude Code 실행 실패');
    }

    // Gemini CLI 검증
    try {
      const geminiOutput = execSync('gemini --version', { encoding: 'utf8' });
      result.gemini = geminiOutput.includes('0.1.21');
      if (!result.gemini) {
        result.issues.push('Gemini CLI 버전이 올바르지 않습니다');
      }
    } catch (error) {
      result.issues.push('Gemini CLI 실행 실패');
    }

    // Qwen CLI 검증
    try {
      const qwenOutput = execSync('qwen --version', { encoding: 'utf8' });
      result.qwen = qwenOutput.includes('0.0.6');
      if (!result.qwen) {
        result.issues.push('Qwen CLI 버전이 올바르지 않습니다');
      }
    } catch (error) {
      result.issues.push('Qwen CLI 실행 실패');
    }

    const allValid = result.claude && result.gemini && result.qwen;
    console.log(`🎯 AI 도구 검증 결과: ${allValid ? '✅' : '❌'}`);

    if (result.issues.length > 0) {
      console.log('⚠️  발견된 문제:');
      result.issues.forEach((issue) => console.log(`   - ${issue}`));
    }

    return result;
  }

  async generateAIReport(): Promise<void> {
    const result = await this.validateAllAITools();

    const report = {
      timestamp: new Date().toISOString(),
      validationPassed: result.claude && result.gemini && result.qwen,
      tools: {
        claude: result.claude,
        gemini: result.gemini,
        qwen: result.qwen,
      },
      issues: result.issues,
    };

    const fs = await import('fs');
    const path = await import('path');

    fs.writeFileSync(
      path.join(process.cwd(), 'reports/ai-tools-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('📊 AI 도구 검증 리포트 생성 완료');
  }
}

export { AIDeploymentValidator };

// 직접 실행 시
if (require.main === module) {
  const validator = new AIDeploymentValidator();
  validator
    .generateAIReport()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

### 3단계: AI 도구 성능 측정

```typescript
// scripts/monitoring/ai-performance-monitor.ts
import { execSync } from 'child_process';

interface AIPerformanceMetrics {
  tool: string;
  responseTime: number;
  tokenUsage: number;
  success: boolean;
  timestamp: string;
}

class AIPerformanceMonitor {
  private testPrompt = '간단한 TypeScript 함수를 작성해주세요.';

  async measureClaudePerformance(): Promise<AIPerformanceMetrics> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = 0;

    try {
      const output = execSync(`claude "${this.testPrompt}"`, {
        encoding: 'utf8',
        timeout: 30000,
      });

      success = output.length > 0;
      tokenUsage = this.estimateTokens(output);
    } catch (error) {
      console.error('Claude 성능 측정 실패:', error);
    }

    return {
      tool: 'claude',
      responseTime: Date.now() - startTime,
      tokenUsage,
      success,
      timestamp: new Date().toISOString(),
    };
  }

  async measureGeminiPerformance(): Promise<AIPerformanceMetrics> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = 0;

    try {
      const output = execSync(`gemini "${this.testPrompt}"`, {
        encoding: 'utf8',
        timeout: 30000,
      });

      success = output.length > 0;
      tokenUsage = this.estimateTokens(output);
    } catch (error) {
      console.error('Gemini 성능 측정 실패:', error);
    }

    return {
      tool: 'gemini',
      responseTime: Date.now() - startTime,
      tokenUsage,
      success,
      timestamp: new Date().toISOString(),
    };
  }

  async measureQwenPerformance(): Promise<AIPerformanceMetrics> {
    const startTime = Date.now();
    let success = false;
    let tokenUsage = 0;

    try {
      const output = execSync(`qwen "${this.testPrompt}"`, {
        encoding: 'utf8',
        timeout: 30000,
      });

      success = output.length > 0;
      tokenUsage = this.estimateTokens(output);
    } catch (error) {
      console.error('Qwen 성능 측정 실패:', error);
    }

    return {
      tool: 'qwen',
      responseTime: Date.now() - startTime,
      tokenUsage,
      success,
      timestamp: new Date().toISOString(),
    };
  }

  private estimateTokens(text: string): number {
    // 간단한 토큰 수 추정 (실제로는 토크나이저 사용)
    return Math.ceil(text.length / 4);
  }

  async measureAllTools(): Promise<AIPerformanceMetrics[]> {
    console.log('📊 AI 도구 성능 측정 시작...');

    const results = await Promise.all([
      this.measureClaudePerformance(),
      this.measureGeminiPerformance(),
      this.measureQwenPerformance(),
    ]);

    // 성능 리포트 생성
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTools: results.length,
        successfulTools: results.filter((r) => r.success).length,
        averageResponseTime: results.reduce((acc, r) => acc + r.responseTime, 0) / results.length,
        totalTokenUsage: results.reduce((acc, r) => acc + r.tokenUsage, 0),
      },
      details: results,
    };

    const fs = await import('fs');
    const path = await import('path');

    fs.writeFileSync(
      path.join(process.cwd(), 'reports/ai-performance-report.json'),
      JSON.stringify(report, null, 2)
    );

    console.log('✅ AI 도구 성능 측정 완료');
    console.log(`   성공한 도구: ${report.summary.successfulTools}/${report.summary.totalTools}`);
    console.log(`   평균 응답 시간: ${Math.round(report.summary.averageResponseTime)}ms`);

    return results;
  }
}

export { AIPerformanceMonitor };

// 직접 실행 시
if (require.main === module) {
  const monitor = new AIPerformanceMonitor();
  monitor
    .measureAllTools()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

## 🏗️ 빌드 시스템 최적화

### 1단계: 웹팩 최적화

```javascript
// scripts/build/webpack-optimizer.js
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
const CompressionPlugin = require('compression-webpack-plugin');

class WebpackOptimizer {
  static getProductionOptimizations() {
    return {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            enforce: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      usedExports: true,
      sideEffects: false,
      minimize: true,
      concatenateModules: true,
    };
  }

  static getCompressionPlugins() {
    return [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
      }),
      new CompressionPlugin({
        algorithm: 'brotliCompress',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8,
        filename: '[path][base].br',
      }),
    ];
  }

  static getBundleAnalyzer() {
    return new BundleAnalyzerPlugin({
      analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
      openAnalyzer: false,
      generateStatsFile: true,
      statsOptions: { source: false },
    });
  }
}

module.exports = { WebpackOptimizer };
```

### 2단계: 빌드 성능 모니터링

```typescript
// scripts/build/build-monitor.ts
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface BuildMetrics {
  duration: number;
  bundleSize: number;
  chunkCount: number;
  compressionRatio: number;
  timestamp: string;
}

class BuildMonitor {
  async measureBuildPerformance(): Promise<BuildMetrics> {
    console.log('📏 빌드 성능 측정 시작...');

    const startTime = Date.now();

    try {
      // 빌드 실행
      execSync('npm run build:prod', {
        encoding: 'utf8',
        stdio: 'inherit',
      });

      const duration = Date.now() - startTime;
      const bundleAnalysis = this.analyzeBundleSize();

      const metrics: BuildMetrics = {
        duration,
        bundleSize: bundleAnalysis.totalSize,
        chunkCount: bundleAnalysis.chunkCount,
        compressionRatio: bundleAnalysis.compressionRatio,
        timestamp: new Date().toISOString(),
      };

      await this.saveMetrics(metrics);
      this.reportMetrics(metrics);

      return metrics;
    } catch (error) {
      console.error('❌ 빌드 성능 측정 실패:', error);
      throw error;
    }
  }

  private analyzeBundleSize(): {
    totalSize: number;
    chunkCount: number;
    compressionRatio: number;
  } {
    const buildDir = '.next/static';
    let totalSize = 0;
    let chunkCount = 0;
    let compressedSize = 0;

    const walkDir = (dir: string) => {
      const files = fs.readdirSync(dir);

      files.forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
          walkDir(filePath);
        } else if (file.endsWith('.js') || file.endsWith('.css')) {
          totalSize += stat.size;
          chunkCount++;

          // gzip 압축 파일이 있는지 확인
          const gzipPath = filePath + '.gz';
          if (fs.existsSync(gzipPath)) {
            compressedSize += fs.statSync(gzipPath).size;
          }
        }
      });
    };

    if (fs.existsSync(buildDir)) {
      walkDir(buildDir);
    }

    return {
      totalSize,
      chunkCount,
      compressionRatio: compressedSize > 0 ? compressedSize / totalSize : 1,
    };
  }

  private async saveMetrics(metrics: BuildMetrics): Promise<void> {
    const reportsDir = 'reports';
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, 'build-metrics.json');
    
    // 기존 메트릭스 로드
    let existingMetrics: BuildMetrics[] = [];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      existingMetrics = JSON.parse(content);
    }

    // 새 메트릭스 추가 (최근 30개만 유지)
    existingMetrics.unshift(metrics);
    if (existingMetrics.length > 30) {
      existingMetrics = existingMetrics.slice(0, 30);
    }

    fs.writeFileSync(filePath, JSON.stringify(existingMetrics, null, 2));
  }

  private reportMetrics(metrics: BuildMetrics): void {
    console.log('\n📊 빌드 성능 리포트:');
    console.log(`   ⏱️  빌드 시간: ${(metrics.duration / 1000).toFixed(1)}초`);
    console.log(`   📦 번들 크기: ${(metrics.bundleSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`   🧩 청크 수: ${metrics.chunkCount}개`);
    console.log(`   🗜️  압축률: ${(metrics.compressionRatio * 100).toFixed(1)}%`);
  }

  async generateTrendReport(): Promise<void> {
    const filePath = path.join('reports', 'build-metrics.json');
    
    if (!fs.existsSync(filePath)) {
      console.log('📊 빌드 메트릭스 히스토리가 없습니다.');
      return;
    }

    const metrics: BuildMetrics[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    if (metrics.length < 2) {
      console.log('📊 트렌드 분석을 위한 데이터가 부족합니다.');
      return;
    }

    const latest = metrics[0];
    const previous = metrics[1];

    const durationChange = ((latest.duration - previous.duration) / previous.duration) * 100;
    const sizeChange = ((latest.bundleSize - previous.bundleSize) / previous.bundleSize) * 100;

    console.log('\n📈 빌드 성능 트렌드:');
    console.log(`   ⏱️  빌드 시간 변화: ${durationChange > 0 ? '+' : ''}${durationChange.toFixed(1)}%`);
    console.log(`   📦 번들 크기 변화: ${sizeChange > 0 ? '+' : ''}${sizeChange.toFixed(1)}%`);

    if (durationChange > 20) {
      console.log('⚠️  빌드 시간이 크게 증가했습니다. 최적화를 검토하세요.');
    }

    if (sizeChange > 10) {
      console.log('⚠️  번들 크기가 크게 증가했습니다. 불필요한 의존성을 확인하세요.');
    }
  }
}

export { BuildMonitor };

// 직접 실행 시
if (require.main === module) {
  const monitor = new BuildMonitor();
  monitor
    .measureBuildPerformance()
    .then(() => monitor.generateTrendReport())
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
```

## 🔧 개발 도구 자동화

### 통합 개발 스크립트

```bash
# scripts/dev/integrated-dev-tools.sh
#!/bin/bash

echo "🛠️ 통합 개발 도구 시작..."

# 1. TypeScript 타입 체크
echo "1. TypeScript 타입 안전성 검사..."
npm run type-check:prod

# 2. AI 도구 검증
echo "2. AI CLI 도구 검증..."
npx ts-node scripts/deploy/ai-validation.ts

# 3. 빌드 성능 측정
echo "3. 빌드 성능 측정..."
npx ts-node scripts/build/build-monitor.ts

# 4. 종합 리포트 생성
echo "4. 종합 개발 도구 리포트 생성..."
cat > reports/dev-tools-summary.json << EOF
{
  "timestamp": "$(date -Iseconds)",
  "reports": {
    "typeScript": "reports/type-safety-report.json",
    "aiTools": "reports/ai-tools-report.json",
    "buildPerformance": "reports/build-metrics.json",
    "aiPerformance": "reports/ai-performance-report.json"
  },
  "status": "completed"
}
EOF

echo "✅ 통합 개발 도구 검사 완료"
echo "📊 리포트 위치: reports/ 디렉토리"
```

## 🚨 문제 해결

### TypeScript 컴파일 오류

**증상**: `tsc` 명령어 실행 시 컴파일 오류 발생

**해결책**:
```bash
# 1. 캐시 정리
rm -rf .next tsconfig.tsbuildinfo node_modules/.cache

# 2. 의존성 재설치
npm ci

# 3. 타입 정의 업데이트
npm update @types/node @types/react @types/react-dom

# 4. 단계별 타입 체크
npx tsc --noEmit --incremental false
```

### AI CLI 도구 연결 실패

**증상**: AI CLI 도구가 응답하지 않거나 인증 오류

**해결책**:
```typescript
// AI 도구 진단 스크립트
const diagnoseAITools = async () => {
  console.log('🔍 AI 도구 진단 시작...');

  // 환경변수 확인
  const requiredEnvVars = [
    'CLAUDE_API_KEY',
    'GOOGLE_AI_API_KEY', 
    'OPENAI_API_KEY'
  ];

  requiredEnvVars.forEach(envVar => {
    if (!process.env[envVar]) {
      console.log(`❌ 환경변수 누락: ${envVar}`);
    } else {
      console.log(`✅ 환경변수 설정됨: ${envVar}`);
    }
  });

  // 각 도구별 간단한 테스트
  const tools = ['claude', 'gemini', 'qwen'];
  
  for (const tool of tools) {
    try {
      const output = execSync(`${tool} --version`, { 
        encoding: 'utf8',
        timeout: 5000 
      });
      console.log(`✅ ${tool}: ${output.trim()}`);
    } catch (error) {
      console.log(`❌ ${tool}: 실행 실패`);
    }
  }
};
```

### 빌드 성능 저하

**증상**: 빌드 시간이 과도하게 길어짐 (>5분)

**해결책**:
```bash
# 1. 번들 분석
ANALYZE=true npm run build

# 2. 의존성 정리
npm audit
npm prune

# 3. 캐시 최적화
export NEXT_CACHE_DIR=".next/cache"
npm run build:clean

# 4. 병렬 빌드 활성화
export NODE_OPTIONS="--max-old-space-size=8192"
npm run build:prod
```

---

## 📚 관련 문서

- [플랫폼 구성 가이드](./platform-configuration-guide.md)
- [CI/CD & 운영 가이드](./cicd-operations-guide.md)
- [테스트 가이드](../testing/testing-guide.md)
- [성능 최적화 가이드](../performance/performance-optimization-complete-guide.md)

---

**💡 핵심 원칙**: 타입 안전성 + AI 도구 통합 + 빌드 최적화

🛠️ **성공 요소**: 자동화된 검증 + 성능 모니터링 + 지속적 개선