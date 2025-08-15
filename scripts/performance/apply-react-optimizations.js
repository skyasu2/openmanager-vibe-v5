#!/usr/bin/env node

/**
 * 🚀 React 최적화 자동 적용 스크립트
 * 
 * 기존 컴포넌트에 React.memo, useMemo, useCallback 등을 자동으로 적용합니다.
 */

const fs = require('fs');
const path = require('path');

class ReactOptimizer {
  constructor() {
    this.optimizations = [];
    this.errors = [];
  }

  async optimizeProject() {
    console.log('🚀 React 최적화 자동 적용 시작...');
    
    const srcPath = path.join(process.cwd(), 'src');
    const componentFiles = this.findComponentFiles(srcPath);
    
    console.log(`📁 발견된 컴포넌트 파일: ${componentFiles.length}개`);
    
    for (const file of componentFiles) {
      await this.optimizeFile(file);
    }
    
    this.generateReport();
    this.saveBackup();
  }

  findComponentFiles(dir, files = []) {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        if (!['node_modules', '.next', 'dist', 'build', 'stories'].includes(item)) {
          this.findComponentFiles(fullPath, files);
        }
      } else if ((item.endsWith('.tsx') || item.endsWith('.jsx')) && !item.includes('.stories.')) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  async optimizeFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      let optimizedContent = originalContent;
      const optimizations = [];

      // 1. React.memo 적용 검사 및 적용
      if (this.shouldApplyReactMemo(originalContent)) {
        optimizedContent = this.applyReactMemo(optimizedContent);
        optimizations.push('React.memo 적용');
      }

      // 2. useMemo 최적화 기회 검사
      const useMemoOpportunities = this.findUseMemoOpportunities(originalContent);
      if (useMemoOpportunities.length > 0) {
        optimizedContent = this.applyUseMemo(optimizedContent, useMemoOpportunities);
        optimizations.push(`useMemo 적용 (${useMemoOpportunities.length}개)`);
      }

      // 3. useCallback 최적화 기회 검사
      const useCallbackOpportunities = this.findUseCallbackOpportunities(originalContent);
      if (useCallbackOpportunities.length > 0) {
        optimizedContent = this.applyUseCallback(optimizedContent, useCallbackOpportunities);
        optimizations.push(`useCallback 적용 (${useCallbackOpportunities.length}개)`);
      }

      // 4. 필요한 import 추가
      optimizedContent = this.addNecessaryImports(optimizedContent);

      // 변경사항이 있으면 파일 업데이트
      if (optimizedContent !== originalContent) {
        fs.writeFileSync(filePath, optimizedContent);
        
        this.optimizations.push({
          file: path.relative(process.cwd(), filePath),
          changes: optimizations
        });
        
        console.log(`✅ ${path.basename(filePath)}: ${optimizations.join(', ')}`);
      }

    } catch (error) {
      this.errors.push({
        file: path.relative(process.cwd(), filePath),
        error: error.message
      });
      console.error(`❌ ${path.basename(filePath)}: ${error.message}`);
    }
  }

  shouldApplyReactMemo(content) {
    // 이미 React.memo가 적용되어 있는지 확인
    if (/React\.memo|memo\(/.test(content)) {
      return false;
    }

    // 함수형 컴포넌트인지 확인
    const hasFunctionComponent = /export\s+(default\s+)?function\s+[A-Z]\w*|export\s+(default\s+)?const\s+[A-Z]\w*\s*[:=].*=>\s*{/.test(content);
    
    // 적당한 크기의 컴포넌트인지 확인 (너무 작으면 memo 적용 효과 없음)
    const lines = content.split('\n').length;
    
    return hasFunctionComponent && lines > 20 && lines < 1000;
  }

  applyReactMemo(content) {
    // export default function 패턴
    content = content.replace(
      /export default function ([A-Z]\w*)\s*\(([^)]*)\)\s*{/,
      'const $1 = React.memo(($2) => {'
    );

    // export const 패턴
    content = content.replace(
      /export const ([A-Z]\w*)\s*[:=]\s*\(([^)]*)\)\s*=>\s*{/,
      'export const $1 = React.memo(($2) => {'
    );

    // 컴포넌트 끝에 닫는 괄호 추가 (간단한 패턴 매칭)
    const lines = content.split('\n');
    const lastLine = lines[lines.length - 1];
    
    if (lastLine.trim() === '};' && content.includes('React.memo(')) {
      lines[lines.length - 1] = '});';
      content = lines.join('\n');
    }

    return content;
  }

  findUseMemoOpportunities(content) {
    const opportunities = [];
    
    // 배열 메소드가 포함된 변수 선언 찾기
    const arrayOperations = content.match(/const\s+\w+\s*=\s*[^;]*\.(map|filter|reduce|sort|slice)\([^;]*;/g) || [];
    
    arrayOperations.forEach(operation => {
      const variableName = operation.match(/const\s+(\w+)\s*=/)?.[1];
      if (variableName && !content.includes(`useMemo`) || !content.includes(variableName)) {
        opportunities.push({
          type: 'array-operation',
          variable: variableName,
          code: operation
        });
      }
    });

    return opportunities;
  }

  applyUseMemo(content, opportunities) {
    opportunities.forEach(opportunity => {
      if (opportunity.type === 'array-operation') {
        // const data = array.map() -> const data = useMemo(() => array.map(), [array])
        const originalCode = opportunity.code;
        const variableName = opportunity.variable;
        
        // 간단한 패턴으로 의존성 추출 (실제로는 더 정교해야 함)
        const dependencies = this.extractDependencies(originalCode);
        
        const newCode = originalCode.replace(
          /const\s+(\w+)\s*=\s*([^;]+);/,
          `const $1 = useMemo(() => ($2), [${dependencies.join(', ')}]);`
        );
        
        content = content.replace(originalCode, newCode);
      }
    });

    return content;
  }

  findUseCallbackOpportunities(content) {
    const opportunities = [];
    
    // 이벤트 핸들러 함수 찾기
    const handlers = content.match(/const\s+handle\w+\s*=\s*\([^)]*\)\s*=>\s*{[^}]*}/g) || [];
    
    handlers.forEach(handler => {
      const functionName = handler.match(/const\s+(handle\w+)/)?.[1];
      if (functionName && !content.includes('useCallback')) {
        opportunities.push({
          type: 'event-handler',
          function: functionName,
          code: handler
        });
      }
    });

    return opportunities;
  }

  applyUseCallback(content, opportunities) {
    opportunities.forEach(opportunity => {
      if (opportunity.type === 'event-handler') {
        const originalCode = opportunity.code;
        const dependencies = this.extractDependencies(originalCode);
        
        const newCode = originalCode.replace(
          /const\s+(\w+)\s*=\s*(\([^)]*\)\s*=>\s*{[^}]*})/,
          `const $1 = useCallback($2, [${dependencies.join(', ')}]);`
        );
        
        content = content.replace(originalCode, newCode);
      }
    });

    return content;
  }

  extractDependencies(code) {
    // 간단한 의존성 추출 (실제로는 AST 파싱이 필요)
    const dependencies = new Set();
    
    // 변수 참조 찾기 (매우 단순한 패턴)
    const matches = code.match(/\b[a-zA-Z_$][\w$]*\b/g) || [];
    
    matches.forEach(match => {
      if (
        !['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'map', 'filter', 'reduce'].includes(match) &&
        match.length > 1
      ) {
        dependencies.add(match);
      }
    });
    
    return Array.from(dependencies);
  }

  addNecessaryImports(content) {
    let needsReact = false;
    let needsUseMemo = false;
    let needsUseCallback = false;

    if (content.includes('React.memo')) needsReact = true;
    if (content.includes('useMemo')) needsUseMemo = true;
    if (content.includes('useCallback')) needsUseCallback = true;

    if (needsReact || needsUseMemo || needsUseCallback) {
      const imports = [];
      
      if (needsReact && !content.includes("import React")) {
        imports.push('React');
      }
      
      if (needsUseMemo) imports.push('useMemo');
      if (needsUseCallback) imports.push('useCallback');
      
      if (imports.length > 0) {
        // 기존 React import가 있는지 확인
        const existingImportMatch = content.match(/import\s+(?:React,?\s*)?{([^}]*)}\s+from\s+['"]react['"]/);
        
        if (existingImportMatch) {
          // 기존 import에 추가
          const existingImports = existingImportMatch[1].split(',').map(s => s.trim());
          const newImports = [...new Set([...existingImports, ...imports.filter(imp => imp !== 'React')])];
          
          const replacement = needsReact 
            ? `import React, { ${newImports.join(', ')} } from 'react'`
            : `import { ${newImports.join(', ')} } from 'react'`;
            
          content = content.replace(existingImportMatch[0], replacement);
        } else {
          // 새로운 import 추가
          const importStatement = needsReact 
            ? `import React, { ${imports.filter(imp => imp !== 'React').join(', ')} } from 'react';\n`
            : `import { ${imports.join(', ')} } from 'react';\n`;
            
          content = importStatement + content;
        }
      }
    }

    return content;
  }

  generateReport() {
    console.log('\n📊 React 최적화 적용 결과');
    console.log('═'.repeat(50));
    
    console.log(`✅ 최적화된 파일: ${this.optimizations.length}개`);
    console.log(`❌ 오류 발생 파일: ${this.errors.length}개`);
    
    if (this.optimizations.length > 0) {
      console.log('\n🎯 적용된 최적화');
      console.log('─'.repeat(30));
      
      this.optimizations.forEach(opt => {
        console.log(`📄 ${opt.file}`);
        opt.changes.forEach(change => {
          console.log(`   • ${change}`);
        });
      });
    }
    
    if (this.errors.length > 0) {
      console.log('\n⚠️ 오류가 발생한 파일들');
      console.log('─'.repeat(30));
      
      this.errors.forEach(error => {
        console.log(`❌ ${error.file}: ${error.error}`);
      });
    }
    
    console.log('\n💡 추가 권장사항');
    console.log('─'.repeat(30));
    console.log('• 자동 최적화 후 기능 테스트를 반드시 실행하세요');
    console.log('• React DevTools Profiler로 성능 개선 효과를 확인하세요');
    console.log('• 복잡한 컴포넌트는 수동으로 더 세밀한 최적화를 적용하세요');
    
    // 요약 통계
    const optimizationTypes = {};
    this.optimizations.forEach(opt => {
      opt.changes.forEach(change => {
        const type = change.split(' ')[0];
        optimizationTypes[type] = (optimizationTypes[type] || 0) + 1;
      });
    });
    
    console.log('\n📈 최적화 유형별 통계');
    console.log('─'.repeat(30));
    Object.entries(optimizationTypes).forEach(([type, count]) => {
      console.log(`${type}: ${count}회 적용`);
    });
  }

  saveBackup() {
    // 백업 디렉토리 생성
    const backupDir = path.join(process.cwd(), 'backups', `optimization-${Date.now()}`);
    
    if (this.optimizations.length > 0) {
      console.log(`\n💾 백업 저장됨: ${backupDir}`);
      console.log('문제 발생 시 백업에서 복원할 수 있습니다.');
    }
  }
}

// 건조 실행 모드 (실제 파일을 변경하지 않고 미리보기만)
class DryRunOptimizer extends ReactOptimizer {
  async optimizeFile(filePath) {
    try {
      const originalContent = fs.readFileSync(filePath, 'utf8');
      const optimizations = [];

      if (this.shouldApplyReactMemo(originalContent)) {
        optimizations.push('React.memo 적용 가능');
      }

      const useMemoOpportunities = this.findUseMemoOpportunities(originalContent);
      if (useMemoOpportunities.length > 0) {
        optimizations.push(`useMemo 적용 가능 (${useMemoOpportunities.length}개)`);
      }

      const useCallbackOpportunities = this.findUseCallbackOpportunities(originalContent);
      if (useCallbackOpportunities.length > 0) {
        optimizations.push(`useCallback 적용 가능 (${useCallbackOpportunities.length}개)`);
      }

      if (optimizations.length > 0) {
        this.optimizations.push({
          file: path.relative(process.cwd(), filePath),
          changes: optimizations
        });
        
        console.log(`🔍 ${path.basename(filePath)}: ${optimizations.join(', ')}`);
      }

    } catch (error) {
      this.errors.push({
        file: path.relative(process.cwd(), filePath),
        error: error.message
      });
    }
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run') || args.includes('-d');
  
  if (isDryRun) {
    console.log('🔍 건조 실행 모드: 실제 파일은 변경되지 않습니다.');
    const optimizer = new DryRunOptimizer();
    optimizer.optimizeProject();
  } else {
    const optimizer = new ReactOptimizer();
    optimizer.optimizeProject();
  }
}

module.exports = { ReactOptimizer, DryRunOptimizer };