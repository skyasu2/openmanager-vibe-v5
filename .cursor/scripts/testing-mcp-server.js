#!/usr/bin/env node

/**
 * 🧪 OpenManager V5 테스팅 MCP 서버
 * 
 * 기능:
 * - 자동 테스트 케이스 생성
 * - API 엔드포인트 자동 테스트
 * - 성능 테스트 시나리오 생성
 * - E2E 테스트 스크립트 자동화
 * - 테스트 커버리지 분석
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class TestingMCPServer {
  constructor() {
    this.projectRoot = process.cwd();
    this.testTemplates = {
      unit: this.getUnitTestTemplate(),
      integration: this.getIntegrationTestTemplate(),
      e2e: this.getE2ETestTemplate(),
      performance: this.getPerformanceTestTemplate()
    };
  }

  // 단위 테스트 템플릿
  getUnitTestTemplate() {
    return `import { describe, it, expect, vi } from 'vitest';
import { {{componentName}} } from '{{importPath}}';

describe('{{componentName}}', () => {
  it('should render correctly', () => {
    // 기본 렌더링 테스트
    {{testCode}}
  });

  it('should handle props correctly', () => {
    // Props 처리 테스트
    {{propsTestCode}}
  });

  it('should handle user interactions', () => {
    // 사용자 상호작용 테스트
    {{interactionTestCode}}
  });

  it('should handle error states', () => {
    // 에러 상태 테스트
    {{errorTestCode}}
  });
});`;
  }

  // 통합 테스트 템플릿
  getIntegrationTestTemplate() {
    return `import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '{{appPath}}';

describe('{{apiEndpoint}} Integration Tests', () => {
  beforeEach(async () => {
    // 테스트 데이터 설정
    {{setupCode}}
  });

  afterEach(async () => {
    // 테스트 데이터 정리
    {{cleanupCode}}
  });

  it('should handle GET requests', async () => {
    const response = await request(app)
      .get('{{endpoint}}')
      .expect(200);
    
    expect(response.body).toMatchObject({{expectedResponse}});
  });

  it('should handle POST requests', async () => {
    const testData = {{testData}};
    
    const response = await request(app)
      .post('{{endpoint}}')
      .send(testData)
      .expect(201);
    
    expect(response.body).toHaveProperty('id');
  });

  it('should handle error cases', async () => {
    const response = await request(app)
      .post('{{endpoint}}')
      .send({{invalidData}})
      .expect(400);
    
    expect(response.body).toHaveProperty('error');
  });
});`;
  }

  // E2E 테스트 템플릿
  getE2ETestTemplate() {
    return `import { test, expect } from '@playwright/test';

test.describe('{{featureName}} E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('{{baseUrl}}');
    {{setupSteps}}
  });

  test('should complete {{scenarioName}} successfully', async ({ page }) => {
    // 1. 초기 상태 확인
    await expect(page.locator('{{initialSelector}}')).toBeVisible();
    
    // 2. 사용자 액션 수행
    {{userActions}}
    
    // 3. 결과 확인
    await expect(page.locator('{{resultSelector}}')).toContainText('{{expectedText}}');
  });

  test('should handle error scenarios', async ({ page }) => {
    // 에러 시나리오 테스트
    {{errorScenarioSteps}}
    
    await expect(page.locator('.error-message')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일 뷰에서의 동작 확인
    {{mobileTestSteps}}
  });
});`;
  }

  // 성능 테스트 템플릿
  getPerformanceTestTemplate() {
    return `import { describe, it, expect } from 'vitest';
import { performance } from 'perf_hooks';

describe('{{componentName}} Performance Tests', () => {
  it('should render within acceptable time', async () => {
    const start = performance.now();
    
    {{renderCode}}
    
    const end = performance.now();
    const renderTime = end - start;
    
    expect(renderTime).toBeLessThan(100); // 100ms 이하
  });

  it('should handle large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      name: \`Item \${i}\`
    }));
    
    const start = performance.now();
    
    {{processLargeDataCode}}
    
    const end = performance.now();
    const processTime = end - start;
    
    expect(processTime).toBeLessThan(1000); // 1초 이하
  });

  it('should not cause memory leaks', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // 반복 작업 수행
    for (let i = 0; i < 1000; i++) {
      {{repeatedOperation}}
    }
    
    // 가비지 컬렉션 강제 실행
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB 이하
  });
});`;
  }

  // 파일 분석 및 테스트 케이스 생성
  async generateTestCases(filePath, testType = 'unit') {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const analysis = this.analyzeFile(filePath, content);
      
      let testCode = this.testTemplates[testType];
      
      // 플레이스홀더 교체
      testCode = this.replacePlaceholders(testCode, analysis);
      
      // 테스트 파일 경로 생성
      const testFilePath = this.getTestFilePath(filePath, testType);
      
      // 디렉토리 생성
      const testDir = path.dirname(testFilePath);
      if (!fs.existsSync(testDir)) {
        fs.mkdirSync(testDir, { recursive: true });
      }
      
      // 테스트 파일 작성
      fs.writeFileSync(testFilePath, testCode);
      
      console.log(`Generated ${testType} test: ${testFilePath}`);
      
      return {
        testFilePath,
        testType,
        analysis
      };
    } catch (error) {
      console.error(`Error generating test for ${filePath}:`, error);
      return null;
    }
  }

  // 파일 분석
  analyzeFile(filePath, content) {
    const ext = path.extname(filePath);
    const fileName = path.basename(filePath, ext);
    
    let analysis = {
      componentName: fileName,
      importPath: this.getRelativeImportPath(filePath),
      isReactComponent: false,
      isAPIRoute: false,
      functions: [],
      exports: []
    };

    // React 컴포넌트 감지
    if (content.includes('export default function') || content.includes('export function')) {
      analysis.isReactComponent = true;
    }

    // API 라우트 감지
    if (filePath.includes('/api/') || content.includes('NextRequest')) {
      analysis.isAPIRoute = true;
      analysis.endpoint = this.extractAPIEndpoint(filePath);
      analysis.methods = this.extractHTTPMethods(content);
    }

    // 함수 추출
    analysis.functions = this.extractFunctions(content);
    analysis.exports = this.extractExports(content);

    return analysis;
  }

  // 플레이스홀더 교체
  replacePlaceholders(template, analysis) {
    let result = template;
    
    Object.keys(analysis).forEach(key => {
      const placeholder = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(placeholder, analysis[key] || 'TODO');
    });
    
    // 기본 플레이스홀더 처리
    result = result.replace(/{{testCode}}/g, '// TODO: Add test implementation');
    result = result.replace(/{{propsTestCode}}/g, '// TODO: Add props test');
    result = result.replace(/{{interactionTestCode}}/g, '// TODO: Add interaction test');
    result = result.replace(/{{errorTestCode}}/g, '// TODO: Add error test');
    result = result.replace(/{{setupCode}}/g, '// TODO: Add setup code');
    result = result.replace(/{{cleanupCode}}/g, '// TODO: Add cleanup code');
    
    return result;
  }

  // 테스트 파일 경로 생성
  getTestFilePath(originalFilePath, testType) {
    const relativePath = path.relative(this.projectRoot, originalFilePath);
    const ext = path.extname(originalFilePath);
    const baseName = path.basename(originalFilePath, ext);
    const dir = path.dirname(relativePath);
    
    let testDir;
    switch (testType) {
      case 'unit':
        testDir = path.join('tests', 'unit', dir);
        break;
      case 'integration':
        testDir = path.join('tests', 'integration', dir);
        break;
      case 'e2e':
        testDir = 'e2e';
        break;
      case 'performance':
        testDir = path.join('tests', 'performance', dir);
        break;
      default:
        testDir = path.join('tests', dir);
    }
    
    return path.join(testDir, `${baseName}.test${ext}`);
  }

  // 상대 임포트 경로 계산
  getRelativeImportPath(filePath) {
    const relativePath = path.relative(this.projectRoot, filePath);
    const ext = path.extname(relativePath);
    return './' + relativePath.replace(ext, '');
  }

  // API 엔드포인트 추출
  extractAPIEndpoint(filePath) {
    const match = filePath.match(/\/api\/(.+)\.ts$/);
    return match ? `/api/${match[1]}` : '/api/unknown';
  }

  // HTTP 메서드 추출
  extractHTTPMethods(content) {
    const methods = [];
    if (content.includes('export async function GET')) methods.push('GET');
    if (content.includes('export async function POST')) methods.push('POST');
    if (content.includes('export async function PUT')) methods.push('PUT');
    if (content.includes('export async function DELETE')) methods.push('DELETE');
    return methods;
  }

  // 함수 추출
  extractFunctions(content) {
    const functionRegex = /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\([^)]*\)/g;
    const functions = [];
    let match;
    
    while ((match = functionRegex.exec(content)) !== null) {
      functions.push(match[1]);
    }
    
    return functions;
  }

  // Export 추출
  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:class|function|interface|const|let|var)\s+(\w+)/g;
    const exports = [];
    let match;
    
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    
    return exports;
  }

  // 테스트 실행
  async runTests(testType = 'all') {
    return new Promise((resolve, reject) => {
      let command;
      let args;
      
      switch (testType) {
        case 'unit':
          command = 'npm';
          args = ['run', 'test:unit'];
          break;
        case 'integration':
          command = 'npm';
          args = ['run', 'test:integration'];
          break;
        case 'e2e':
          command = 'npm';
          args = ['run', 'test:e2e'];
          break;
        case 'performance':
          command = 'npm';
          args = ['run', 'test:performance'];
          break;
        default:
          command = 'npm';
          args = ['test'];
      }
      
      const child = spawn(command, args, {
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let error = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        error += data.toString();
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output,
            testType
          });
        } else {
          reject({
            success: false,
            error,
            output,
            code
          });
        }
      });
    });
  }

  // 테스트 커버리지 분석
  async analyzeCoverage() {
    try {
      const coverageFile = path.join(this.projectRoot, 'coverage', 'coverage-summary.json');
      
      if (!fs.existsSync(coverageFile)) {
        console.warn('Coverage file not found. Run tests with coverage first.');
        return null;
      }
      
      const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
      
      return {
        total: coverage.total,
        byFile: Object.keys(coverage)
          .filter(key => key !== 'total')
          .map(file => ({
            file,
            coverage: coverage[file]
          }))
          .sort((a, b) => a.coverage.statements.pct - b.coverage.statements.pct)
      };
    } catch (error) {
      console.error('Error analyzing coverage:', error);
      return null;
    }
  }

  // MCP 서버 시작
  start() {
    console.log('🧪 Testing MCP Server started');
    
    // 표준 입력에서 MCP 요청 처리
    process.stdin.on('data', async (data) => {
      try {
        const request = JSON.parse(data.toString());
        const response = await this.handleRequest(request);
        process.stdout.write(JSON.stringify(response) + '\n');
      } catch (error) {
        process.stdout.write(JSON.stringify({
          error: error.message
        }) + '\n');
      }
    });
  }

  // MCP 요청 처리
  async handleRequest(request) {
    const { method, params } = request;
    
    switch (method) {
      case 'generateTest':
        return await this.generateTestCases(params.filePath, params.testType);
      
      case 'runTests':
        return await this.runTests(params.testType);
      
      case 'analyzeCoverage':
        return await this.analyzeCoverage();
      
      case 'listTestTypes':
        return {
          testTypes: Object.keys(this.testTemplates),
          description: '사용 가능한 테스트 타입 목록'
        };
      
      default:
        throw new Error(`Unknown method: ${method}`);
    }
  }
}

// CLI 실행
if (require.main === module) {
  const server = new TestingMCPServer();
  
  if (process.argv.includes('--start-server')) {
    server.start();
  } else {
    // CLI 모드
    const args = process.argv.slice(2);
    const filePath = args.find(arg => !arg.startsWith('--'));
    const testType = args.find(arg => arg.startsWith('--type='))?.split('=')[1] || 'unit';
    
    if (filePath) {
      server.generateTestCases(filePath, testType);
    } else {
      console.log(`
🧪 Testing MCP Server

사용법:
  node .cursor/scripts/testing-mcp-server.js <file-path> [--type=<test-type>]
  node .cursor/scripts/testing-mcp-server.js --start-server

테스트 타입:
  - unit: 단위 테스트
  - integration: 통합 테스트
  - e2e: End-to-End 테스트
  - performance: 성능 테스트

예제:
  node .cursor/scripts/testing-mcp-server.js src/components/Button.tsx --type=unit
  node .cursor/scripts/testing-mcp-server.js src/app/api/users/route.ts --type=integration
      `);
    }
  }
}

module.exports = TestingMCPServer; 