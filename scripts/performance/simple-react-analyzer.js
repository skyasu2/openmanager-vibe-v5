#!/usr/bin/env node

/**
 * 🎯 간단한 React 컴포넌트 분석기
 * 
 * glob 의존성 없이 기본 fs로 React 컴포넌트를 분석합니다.
 */

const fs = require('fs');
const path = require('path');

function findTsxFiles(dir, files = []) {
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // node_modules, .next 등 제외
      if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
        findTsxFiles(fullPath, files);
      }
    } else if (item.endsWith('.tsx') || item.endsWith('.jsx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function analyzeComponent(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const stats = fs.statSync(filePath);
  const lines = content.split('\n').length;
  
  const analysis = {
    file: path.relative(process.cwd(), filePath),
    size: Math.round(stats.size / 1024), // KB
    lines: lines,
    issues: [],
    suggestions: [],
    patterns: {
      hasReactMemo: /React\.memo|memo\(/.test(content),
      hasUseMemo: /useMemo/.test(content),
      hasUseCallback: /useCallback/.test(content),
      hasInlineStyles: /style\s*=\s*{{/.test(content),
      hasKeyProps: /<\w+[^>]*key\s*=/.test(content),
      hasMapWithoutKey: /\.map\(.*=>\s*</.test(content) && !/<\w+[^>]*key\s*=/.test(content),
      hasHeavyImports: /import.*from\s+['"](?:lodash|moment|@mui\/material)['"]/.test(content),
      hasConditionalRendering: /{\s*\w+\s*&&|{\s*\w+\s*\?/.test(content),
      hasDynamicImport: /React\.lazy|import\(/.test(content),
      componentCount: (content.match(/(?:function|const)\s+[A-Z]\w*|class\s+[A-Z]\w*\s+extends/g) || []).length,
      hookCount: (content.match(/use[A-Z]\w*/g) || []).length,
    }
  };

  // 큰 파일 검사
  if (analysis.size > 50) { // 50KB
    analysis.issues.push({
      type: 'large-file',
      severity: 'high',
      message: `파일 크기가 ${analysis.size}KB로 매우 큽니다`
    });
  } else if (analysis.size > 20) { // 20KB
    analysis.issues.push({
      type: 'medium-file',
      severity: 'medium', 
      message: `파일 크기가 ${analysis.size}KB입니다`
    });
  }

  // 긴 컴포넌트 검사
  if (analysis.lines > 500) {
    analysis.issues.push({
      type: 'very-long-component',
      severity: 'high',
      message: `컴포넌트가 ${analysis.lines}줄로 매우 깁니다`
    });
  } else if (analysis.lines > 200) {
    analysis.issues.push({
      type: 'long-component',
      severity: 'medium',
      message: `컴포넌트가 ${analysis.lines}줄입니다`
    });
  }

  // React 최적화 패턴 검사
  if (analysis.patterns.componentCount > 0 && !analysis.patterns.hasReactMemo && analysis.lines > 100) {
    analysis.suggestions.push({
      type: 'react-memo',
      message: 'React.memo 사용을 고려해보세요'
    });
  }

  if (content.includes('.map(') && !analysis.patterns.hasUseMemo && analysis.lines > 50) {
    analysis.suggestions.push({
      type: 'use-memo',
      message: '리스트 처리에 useMemo 사용을 고려해보세요'
    });
  }

  if (analysis.patterns.hasMapWithoutKey) {
    analysis.issues.push({
      type: 'missing-key',
      severity: 'high',
      message: '리스트 렌더링에 key prop이 누락되었습니다'
    });
  }

  if (analysis.patterns.hasHeavyImports) {
    analysis.issues.push({
      type: 'heavy-import',
      severity: 'medium',
      message: '무거운 라이브러리를 전체 import하고 있습니다'
    });
  }

  if (analysis.patterns.hasInlineStyles) {
    analysis.issues.push({
      type: 'inline-styles',
      severity: 'low',
      message: '인라인 스타일을 사용하고 있습니다'
    });
  }

  if (analysis.patterns.hasConditionalRendering && !analysis.patterns.hasDynamicImport && analysis.lines > 100) {
    analysis.suggestions.push({
      type: 'dynamic-import',
      message: '조건부 렌더링 컴포넌트를 동적 import로 최적화할 수 있습니다'
    });
  }

  return analysis;
}

function generateReport(analyses) {
  const totalFiles = analyses.length;
  const totalIssues = analyses.reduce((sum, a) => sum + a.issues.length, 0);
  const criticalIssues = analyses.reduce((sum, a) => sum + a.issues.filter(i => i.severity === 'high').length, 0);
  
  // 최대 파일들
  const largestFiles = analyses
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);
    
  const longestFiles = analyses
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 10);

  // 가장 많은 이슈가 있는 파일들
  const problematicFiles = analyses
    .filter(a => a.issues.length > 0)
    .sort((a, b) => b.issues.length - a.issues.length)
    .slice(0, 10);

  console.log('\n🎯 React 컴포넌트 분석 결과');
  console.log('═'.repeat(60));
  
  console.log('\n📊 전체 요약');
  console.log('─'.repeat(30));
  console.log(`총 컴포넌트 파일: ${totalFiles}개`);
  console.log(`총 이슈: ${totalIssues}개`);
  console.log(`심각한 이슈: ${criticalIssues}개`);
  
  // 성능 점수 계산
  const performanceScore = Math.max(0, 100 - (criticalIssues * 10 + (totalIssues - criticalIssues) * 5));
  console.log(`성능 점수: ${performanceScore}점`);

  console.log('\n🏗️ 가장 큰 컴포넌트들 (TOP 10)');
  console.log('─'.repeat(50));
  largestFiles.forEach((file, index) => {
    const sizeIndicator = file.size > 50 ? '🔴' : file.size > 20 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${sizeIndicator} ${path.basename(file.file)} - ${file.size}KB (${file.lines}줄)`);
  });

  console.log('\n📏 가장 긴 컴포넌트들 (TOP 10)');
  console.log('─'.repeat(50));
  longestFiles.forEach((file, index) => {
    const lengthIndicator = file.lines > 500 ? '🔴' : file.lines > 200 ? '🟡' : '🟢';
    console.log(`${index + 1}. ${lengthIndicator} ${path.basename(file.file)} - ${file.lines}줄 (${file.size}KB)`);
  });

  if (problematicFiles.length > 0) {
    console.log('\n⚠️  이슈가 많은 파일들 (TOP 10)');
    console.log('─'.repeat(50));
    problematicFiles.forEach((file, index) => {
      console.log(`${index + 1}. ${path.basename(file.file)} - ${file.issues.length}개 이슈`);
      file.issues.slice(0, 3).forEach(issue => {
        const severity = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
        console.log(`   ${severity} ${issue.message}`);
      });
    });
  }

  // Core Web Vitals 최적화 권장사항
  console.log('\n💡 Core Web Vitals 최적화 권장사항');
  console.log('═'.repeat(60));
  
  console.log('\n🎯 LCP (Largest Contentful Paint) 개선:');
  console.log('   • 큰 컴포넌트를 작은 단위로 분리');
  console.log('   • React.lazy()와 Suspense로 동적 로딩');
  console.log('   • 이미지 최적화 (Next.js Image 컴포넌트)');
  console.log('   • 서버 컴포넌트 활용으로 초기 번들 크기 감소');
  
  console.log('\n📐 CLS (Cumulative Layout Shift) 개선:');
  console.log('   • 이미지와 미디어 요소에 고정 크기 지정');
  console.log('   • 동적 콘텐츠를 위한 placeholder 사용');
  console.log('   • 폰트 로딩 최적화 (font-display: swap)');
  console.log('   • 레이아웃 변경을 일으키는 CSS transform 대신 opacity 사용');
  
  console.log('\n⚡ FID/TBT (First Input Delay/Total Blocking Time) 개선:');
  console.log('   • React.memo로 불필요한 리렌더링 방지');
  console.log('   • useMemo/useCallback으로 비용이 큰 연산 최적화');
  console.log('   • 무거운 JavaScript 작업을 Web Worker로 이동');
  console.log('   • 번들 크기 최적화 (tree shaking, 동적 import)');

  // 즉시 적용 가능한 최적화
  console.log('\n🚀 즉시 적용 가능한 최적화');
  console.log('─'.repeat(50));
  
  const quickWins = [];
  
  if (criticalIssues > 0) {
    quickWins.push('1. 🔴 심각한 이슈부터 해결 (큰 파일 분리, key prop 추가)');
  }
  
  const filesWithoutMemo = analyses.filter(a => 
    a.patterns.componentCount > 0 && 
    !a.patterns.hasReactMemo && 
    a.lines > 100
  ).length;
  
  if (filesWithoutMemo > 5) {
    quickWins.push('2. ⚡ React.memo 적용으로 리렌더링 최적화');
  }
  
  const filesWithHeavyImports = analyses.filter(a => a.patterns.hasHeavyImports).length;
  if (filesWithHeavyImports > 0) {
    quickWins.push('3. 📦 무거운 라이브러리 개별 import로 변경');
  }
  
  const filesWithoutKeys = analyses.filter(a => a.patterns.hasMapWithoutKey).length;
  if (filesWithoutKeys > 0) {
    quickWins.push('4. 🔑 리스트 렌더링에 key prop 추가');
  }
  
  quickWins.forEach(win => console.log(win));
  
  if (quickWins.length === 0) {
    console.log('✅ 기본적인 React 최적화가 잘 되어 있습니다!');
  }

  // 보고서 저장
  const reportDir = path.join(process.cwd(), 'reports', 'performance');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportFile = path.join(reportDir, `react-analysis-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalFiles,
      totalIssues,
      criticalIssues,
      performanceScore
    },
    largestFiles: largestFiles.slice(0, 5),
    longestFiles: longestFiles.slice(0, 5),
    problematicFiles: problematicFiles.slice(0, 5),
    details: analyses
  };
  
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`\n📄 상세 보고서 저장됨: ${reportFile}`);
}

// 실행
console.log('🔍 React 컴포넌트 분석 시작...');

const srcPath = path.join(process.cwd(), 'src');
const componentFiles = findTsxFiles(srcPath);

console.log(`📁 발견된 컴포넌트 파일: ${componentFiles.length}개`);

const analyses = componentFiles.map(analyzeComponent);
generateReport(analyses);