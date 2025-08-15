#!/usr/bin/env node

/**
 * 🎯 React 컴포넌트 최적화 분석기
 * 
 * 프로젝트의 React 컴포넌트를 분석하여 성능 최적화 기회를 찾습니다.
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const config = {
  srcPath: path.join(process.cwd(), 'src'),
  extensions: ['.tsx', '.jsx'],
  excludePatterns: [
    '**/node_modules/**',
    '**/.next/**',
    '**/stories/**',
    '**/test/**',
    '**/tests/**',
  ],
  thresholds: {
    fileSize: 1000, // 1KB 이상
    lineCount: 200, // 200줄 이상
    propsCount: 10, // props 10개 이상
    stateCount: 5, // state 5개 이상
  }
};

class ReactOptimizationAnalyzer {
  constructor() {
    this.results = {
      totalFiles: 0,
      analyzedFiles: 0,
      issues: [],
      suggestions: [],
      summary: {
        performance: 0,
        maintainability: 0,
        codeQuality: 0,
      }
    };
  }

  async analyze() {
    console.log('🔍 React 컴포넌트 최적화 분석 시작...');
    
    const files = await this.findComponentFiles();
    this.results.totalFiles = files.length;
    
    for (const file of files) {
      await this.analyzeFile(file);
    }
    
    this.generateSuggestions();
    this.calculateScores();
    this.displayResults();
    this.saveReport();
    
    return this.results;
  }

  async findComponentFiles() {
    const pattern = `${config.srcPath}/**/*{${config.extensions.join(',')}}`;
    const files = await glob(pattern, {
      ignore: config.excludePatterns
    });
    
    return files.filter(file => {
      const content = fs.readFileSync(file, 'utf8');
      // React 컴포넌트인지 확인
      return /export\s+(default\s+)?function\s+\w+|export\s+(default\s+)?\w+\s*[:=]|const\s+\w+\s*[:=].*=>\s*{|class\s+\w+\s+extends\s+.*Component/.test(content);
    });
  }

  async analyzeFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const stats = fs.statSync(filePath);
      
      const analysis = {
        file: path.relative(process.cwd(), filePath),
        size: stats.size,
        lines: content.split('\n').length,
        issues: [],
        suggestions: [],
        metrics: this.calculateMetrics(content)
      };

      // 파일 크기 검사
      if (stats.size > config.thresholds.fileSize * 1000) {
        analysis.issues.push({
          type: 'large-file',
          severity: 'high',
          message: `파일 크기가 ${Math.round(stats.size / 1024)}KB로 너무 큽니다 (권장: ${config.thresholds.fileSize}KB 이하)`,
          suggestion: '컴포넌트를 더 작은 단위로 분리하세요'
        });
      }

      // 라인 수 검사
      if (analysis.lines > config.thresholds.lineCount) {
        analysis.issues.push({
          type: 'long-component',
          severity: 'medium',
          message: `컴포넌트가 ${analysis.lines}줄로 너무 깁니다 (권장: ${config.thresholds.lineCount}줄 이하)`,
          suggestion: '단일 책임 원칙에 따라 컴포넌트를 분리하세요'
        });
      }

      // React 최적화 패턴 검사
      this.checkReactOptimizations(content, analysis);
      
      // 성능 패턴 검사
      this.checkPerformancePatterns(content, analysis);
      
      // 접근성 검사
      this.checkAccessibility(content, analysis);

      this.results.issues.push(...analysis.issues);
      this.results.analyzedFiles++;

    } catch (error) {
      console.warn(`⚠️  파일 분석 실패: ${filePath} - ${error.message}`);
    }
  }

  calculateMetrics(content) {
    return {
      components: (content.match(/(?:function|const)\s+[A-Z]\w*|class\s+[A-Z]\w*\s+extends/g) || []).length,
      hooks: (content.match(/use[A-Z]\w*/g) || []).length,
      props: (content.match(/\w+\s*[:=]\s*{[^}]*}/g) || []).length,
      jsx: (content.match(/<[A-Z]\w*[^>]*>/g) || []).length,
      eventHandlers: (content.match(/on[A-Z]\w*\s*=\s*{/g) || []).length,
      inlineStyles: (content.match(/style\s*=\s*{{/g) || []).length,
      conditionalRendering: (content.match(/{\s*\w+\s*&&|{\s*\w+\s*\?/g) || []).length,
    };
  }

  checkReactOptimizations(content, analysis) {
    // React.memo 사용 검사
    if (!/React\.memo|memo\(/.test(content) && analysis.metrics.components > 0) {
      analysis.suggestions.push({
        type: 'react-memo',
        priority: 'medium',
        message: 'React.memo를 사용하여 불필요한 리렌더링을 방지하세요',
        code: 'const MyComponent = React.memo(({ prop1, prop2 }) => { ... });'
      });
    }

    // useMemo 사용 검사
    const hasExpensiveComputations = /\.map\(|\.filter\(|\.reduce\(|\.sort\(/.test(content);
    if (hasExpensiveComputations && !/useMemo/.test(content)) {
      analysis.issues.push({
        type: 'missing-usememo',
        severity: 'medium',
        message: '비용이 큰 연산에 useMemo를 사용하지 않고 있습니다',
        suggestion: '리스트 처리나 복잡한 계산에 useMemo를 사용하세요'
      });
    }

    // useCallback 사용 검사
    const hasInlineHandlers = analysis.metrics.eventHandlers > 2;
    if (hasInlineHandlers && !/useCallback/.test(content)) {
      analysis.issues.push({
        type: 'missing-usecallback',
        severity: 'low',
        message: '이벤트 핸들러에 useCallback을 사용하지 않고 있습니다',
        suggestion: '자주 변경되지 않는 핸들러에 useCallback을 사용하세요'
      });
    }

    // key prop 검사
    if (/\.map\(.*=>\s*</.test(content) && !/<\w+[^>]*key\s*=/.test(content)) {
      analysis.issues.push({
        type: 'missing-key',
        severity: 'high',
        message: '리스트 렌더링에 key prop이 누락되었습니다',
        suggestion: '각 리스트 아이템에 고유한 key를 제공하세요'
      });
    }
  }

  checkPerformancePatterns(content, analysis) {
    // 인라인 스타일 검사
    if (analysis.metrics.inlineStyles > 0) {
      analysis.issues.push({
        type: 'inline-styles',
        severity: 'low',
        message: `인라인 스타일을 ${analysis.metrics.inlineStyles}개 사용하고 있습니다`,
        suggestion: 'CSS 클래스나 styled-components를 사용하세요'
      });
    }

    // 큰 번들 라이브러리 검사
    const heavyImports = [
      { pattern: /import.*from\s+['"]lodash['"]/, name: 'lodash', suggestion: 'lodash-es나 개별 함수 import 사용' },
      { pattern: /import.*from\s+['"]moment['"]/, name: 'moment', suggestion: 'date-fns나 dayjs 사용' },
      { pattern: /import.*from\s+['"]@mui\/material['"]/, name: '@mui/material', suggestion: '개별 컴포넌트 import 사용' },
    ];

    heavyImports.forEach(({ pattern, name, suggestion }) => {
      if (pattern.test(content)) {
        analysis.issues.push({
          type: 'heavy-import',
          severity: 'medium',
          message: `무거운 라이브러리 ${name}를 전체 import하고 있습니다`,
          suggestion
        });
      }
    });

    // 동적 import 기회 검사
    const hasConditionalComponents = /{\s*\w+\s*&&\s*<[A-Z]/.test(content);
    if (hasConditionalComponents && !/import\(/.test(content)) {
      analysis.suggestions.push({
        type: 'dynamic-import',
        priority: 'high',
        message: '조건부 렌더링 컴포넌트를 동적 import로 최적화할 수 있습니다',
        code: 'const LazyComponent = React.lazy(() => import(\'./Component\'));'
      });
    }
  }

  checkAccessibility(content, analysis) {
    // img 태그의 alt 속성 검사
    if (/<img(?![^>]*alt\s*=)/.test(content)) {
      analysis.issues.push({
        type: 'missing-alt',
        severity: 'medium',
        message: 'img 태그에 alt 속성이 누락되었습니다',
        suggestion: '모든 이미지에 적절한 alt 텍스트를 제공하세요'
      });
    }

    // button 태그의 접근성 검사
    if (/<(?:div|span)[^>]*onClick/.test(content)) {
      analysis.issues.push({
        type: 'clickable-non-button',
        severity: 'medium',
        message: 'div나 span에 클릭 이벤트를 사용하고 있습니다',
        suggestion: '클릭 가능한 요소는 button이나 a 태그를 사용하세요'
      });
    }
  }

  generateSuggestions() {
    const issueTypes = this.results.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {});

    // 공통 개선 방안 생성
    if (issueTypes['large-file'] > 2) {
      this.results.suggestions.push({
        category: '컴포넌트 분리',
        impact: 'HIGH',
        description: '여러 개의 큰 컴포넌트가 발견되었습니다',
        actions: [
          '📦 컴포넌트를 기능별로 분리하세요',
          '🔄 커스텀 훅으로 로직을 분리하세요',
          '🎨 UI와 비즈니스 로직을 분리하세요',
          '📁 폴더 구조를 개선하여 관리하세요'
        ]
      });
    }

    if (issueTypes['missing-usememo'] > 3) {
      this.results.suggestions.push({
        category: 'React 최적화',
        impact: 'HIGH',
        description: 'React 최적화 패턴의 사용이 부족합니다',
        actions: [
          '🧠 useMemo로 비용이 큰 연산을 메모이제이션하세요',
          '⚡ useCallback으로 이벤트 핸들러를 최적화하세요',
          '🔄 React.memo로 불필요한 리렌더링을 방지하세요',
          '🎯 React DevTools Profiler로 성능을 측정하세요'
        ]
      });
    }

    if (issueTypes['heavy-import'] > 1) {
      this.results.suggestions.push({
        category: '번들 최적화',
        impact: 'HIGH',
        description: '무거운 라이브러리 import가 다수 발견되었습니다',
        actions: [
          '📦 Tree shaking을 위한 개별 import 사용',
          '⚡ 동적 import로 코드 스플리팅 적용',
          '🔄 webpack-bundle-analyzer로 번들 분석',
          '📊 더 가벼운 대안 라이브러리 검토'
        ]
      });
    }
  }

  calculateScores() {
    const totalIssues = this.results.issues.length;
    const criticalIssues = this.results.issues.filter(i => i.severity === 'high').length;
    const mediumIssues = this.results.issues.filter(i => i.severity === 'medium').length;
    
    // 성능 점수 (0-100)
    this.results.summary.performance = Math.max(0, 100 - (criticalIssues * 20 + mediumIssues * 10));
    
    // 유지보수성 점수
    const largeFileIssues = this.results.issues.filter(i => i.type === 'large-file').length;
    this.results.summary.maintainability = Math.max(0, 100 - (largeFileIssues * 15));
    
    // 코드 품질 점수
    const qualityIssues = this.results.issues.filter(i => 
      ['missing-key', 'missing-alt', 'clickable-non-button'].includes(i.type)
    ).length;
    this.results.summary.codeQuality = Math.max(0, 100 - (qualityIssues * 10));
  }

  displayResults() {
    console.log('\n🎯 React 컴포넌트 최적화 분석 결과');
    console.log('═'.repeat(50));
    
    // 요약 정보
    console.log('\n📊 분석 요약');
    console.log('─'.repeat(30));
    console.log(`분석 파일: ${this.results.analyzedFiles}/${this.results.totalFiles}개`);
    console.log(`발견된 이슈: ${this.results.issues.length}개`);
    console.log(`개선 제안: ${this.results.suggestions.length}개`);
    
    // 점수 표시
    console.log('\n🏆 품질 점수');
    console.log('─'.repeat(30));
    console.log(`성능: ${this.results.summary.performance}점`);
    console.log(`유지보수성: ${this.results.summary.maintainability}점`);
    console.log(`코드 품질: ${this.results.summary.codeQuality}점`);
    
    // 주요 이슈
    if (this.results.issues.length > 0) {
      console.log('\n⚠️  주요 이슈');
      console.log('─'.repeat(30));
      
      const criticalIssues = this.results.issues.filter(i => i.severity === 'high').slice(0, 5);
      criticalIssues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.message}`);
        console.log(`   💡 ${issue.suggestion}`);
      });
    }
    
    // 개선 제안
    if (this.results.suggestions.length > 0) {
      console.log('\n💡 개선 제안');
      console.log('─'.repeat(30));
      
      this.results.suggestions.forEach((suggestion, index) => {
        console.log(`\n${index + 1}. ${suggestion.category} (영향도: ${suggestion.impact})`);
        console.log(`   ${suggestion.description}`);
        suggestion.actions.forEach(action => {
          console.log(`   ${action}`);
        });
      });
    }
  }

  saveReport() {
    const reportDir = path.join(process.cwd(), 'reports', 'react-optimization');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    const reportFile = path.join(reportDir, `react-optimization-${timestamp}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
    
    console.log(`\n📄 보고서 저장됨: ${reportFile}`);
  }
}

// 실행
if (require.main === module) {
  const analyzer = new ReactOptimizationAnalyzer();
  analyzer.analyze().catch(console.error);
}

module.exports = { ReactOptimizationAnalyzer };