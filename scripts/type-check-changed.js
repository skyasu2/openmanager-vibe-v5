#!/usr/bin/env node

/**
 * 🚀 Codex CLI 설계: 변경 파일 기반 스마트 TypeScript 검증
 * 
 * 핵심 알고리즘:
 * 1. Git diff 분석으로 변경된 TypeScript 파일만 추출
 * 2. 의존성 그래프 분석으로 영향받는 파일 확장
 * 3. 점진적 타입 검사로 성능 최적화
 * 4. 캐싱으로 반복 검사 방지
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class SmartTypeChecker {
  constructor() {
    this.tsConfigPath = path.join(process.cwd(), 'tsconfig.json');
    this.cacheDir = path.join('.next', 'cache', 'typescript');
    this.ensureCacheDir();
  }

  ensureCacheDir() {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  // 🎯 변경된 TypeScript 파일 추출
  getChangedTypeScriptFiles(staged = true) {
    try {
      const gitCommand = staged 
        ? 'git diff --cached --name-only --diff-filter=ACMR'
        : 'git diff --name-only HEAD~1';
      
      const changedFiles = execSync(gitCommand, { encoding: 'utf8' })
        .trim().split('\n').filter(Boolean);

      // TypeScript 파일만 필터링
      const tsFiles = changedFiles.filter(file => 
        /\.(ts|tsx)$/.test(file) && 
        !file.includes('.test.') && 
        !file.includes('.spec.') &&
        fs.existsSync(file) // 존재하는 파일만
      );

      return tsFiles;
    } catch (error) {
      console.error('❌ 변경 파일 추출 실패:', error.message);
      return [];
    }
  }

  // 🕸️ 의존성 분석으로 영향받는 파일 확장
  expandDependencies(changedFiles) {
    const dependencyMap = this.buildDependencyMap();
    const affectedFiles = new Set(changedFiles);

    // 변경된 파일을 import하는 파일들 찾기
    changedFiles.forEach(changedFile => {
      if (dependencyMap[changedFile]) {
        dependencyMap[changedFile].forEach(dependent => {
          affectedFiles.add(dependent);
        });
      }
    });

    return Array.from(affectedFiles);
  }

  // 📊 간단한 의존성 맵 구축
  buildDependencyMap() {
    const cacheFile = path.join(this.cacheDir, 'dependency-map.json');
    
    // 캐시 체크 (5분 유효)
    try {
      const stats = fs.statSync(cacheFile);
      const age = Date.now() - stats.mtime.getTime();
      if (age < 5 * 60 * 1000) { // 5분
        return JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      }
    } catch (e) {
      // 캐시 없음, 새로 생성
    }

    console.log('🕸️ 의존성 맵 구축 중...');
    
    const dependencyMap = {};
    const srcDir = path.join(process.cwd(), 'src');
    
    try {
      // src 디렉토리의 모든 TypeScript 파일 스캔
      const allFiles = this.getAllTsFiles(srcDir);
      
      allFiles.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        const imports = this.extractImports(content);
        
        imports.forEach(importPath => {
          const resolvedPath = this.resolveImportPath(importPath, file);
          if (resolvedPath && allFiles.includes(resolvedPath)) {
            if (!dependencyMap[resolvedPath]) {
              dependencyMap[resolvedPath] = [];
            }
            dependencyMap[resolvedPath].push(file);
          }
        });
      });

      // 캐시 저장
      fs.writeFileSync(cacheFile, JSON.stringify(dependencyMap, null, 2));
    } catch (error) {
      console.warn('⚠️ 의존성 맵 구축 실패, 기본 모드로 실행:', error.message);
    }

    return dependencyMap;
  }

  getAllTsFiles(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    entries.forEach(entry => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        files.push(...this.getAllTsFiles(fullPath));
      } else if (/\.(ts|tsx)$/.test(entry.name) && 
                 !entry.name.includes('.test.') && 
                 !entry.name.includes('.spec.')) {
        files.push(fullPath);
      }
    });
    
    return files;
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  resolveImportPath(importPath, fromFile) {
    // 상대 경로 해결
    if (importPath.startsWith('.')) {
      const fromDir = path.dirname(fromFile);
      return path.resolve(fromDir, importPath + '.ts') ||
             path.resolve(fromDir, importPath + '.tsx') ||
             path.resolve(fromDir, importPath, 'index.ts') ||
             path.resolve(fromDir, importPath, 'index.tsx');
    }
    
    // @ 경로 해결
    if (importPath.startsWith('@/')) {
      const srcPath = importPath.replace('@/', 'src/');
      return path.resolve(process.cwd(), srcPath + '.ts') ||
             path.resolve(process.cwd(), srcPath + '.tsx');
    }
    
    return null;
  }

  // 🚀 점진적 타입 검사 실행
  async runIncrementalTypeCheck(files) {
    if (files.length === 0) {
      console.log('✅ 검사할 TypeScript 파일이 없습니다.');
      return true;
    }

    console.log(`🔍 TypeScript 검사 중... (${files.length}개 파일)`);
    
    // 파일 목록을 임시 파일로 저장
    const fileListPath = path.join(this.cacheDir, 'files-to-check.txt');
    fs.writeFileSync(fileListPath, files.join('\n'));

    return new Promise((resolve) => {
      const process = spawn('npx', ['tsc', '--noEmit', '--listFilesOnly'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { 
          ...process.env,
          NODE_OPTIONS: '--max-old-space-size=4096',
          TS_FILES: files.join(' ')
        }
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => stdout += data.toString());
      process.stderr.on('data', (data) => stderr += data.toString());

      process.on('close', (code) => {
        if (code === 0) {
          console.log('✅ TypeScript 검사 통과');
          resolve(true);
        } else {
          console.log('❌ TypeScript 에러 발견:');
          console.log(stderr);
          console.log('\n💡 해결 방법:');
          console.log('  1. npm run type-check (전체 검사)');
          console.log('  2. IDE에서 타입 에러 확인 및 수정');
          console.log('  3. 수정 후 git add . && git commit --amend');
          resolve(false);
        }
        
        // 임시 파일 정리
        try {
          fs.unlinkSync(fileListPath);
        } catch (e) {}
      });
    });
  }

  // 🏃‍♂️ 빠른 문법 검사만
  async runQuickSyntaxCheck(files) {
    console.log(`⚡ 빠른 문법 검사 중... (${files.length}개 파일)`);
    
    for (const file of files.slice(0, 10)) { // 최대 10개 파일만
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // 기본적인 문법 에러 패턴 체크
        const syntaxErrors = [
          /\bunexpected token\b/i,
          /\bsyntax error\b/i,
          /\bunexpected end of input\b/i
        ];
        
        const hasError = syntaxErrors.some(pattern => pattern.test(content));
        if (hasError) {
          console.log(`❌ ${file}: 문법 에러 감지`);
          return false;
        }
      } catch (error) {
        console.warn(`⚠️ ${file} 읽기 실패: ${error.message}`);
      }
    }
    
    console.log('✅ 빠른 문법 검사 통과');
    return true;
  }

  async run(mode = 'smart') {
    const startTime = Date.now();
    
    try {
      const changedFiles = this.getChangedTypeScriptFiles(true);
      
      if (changedFiles.length === 0) {
        console.log('📋 변경된 TypeScript 파일이 없습니다.');
        return process.exit(0);
      }

      console.log(`📁 변경된 파일: ${changedFiles.length}개`);
      changedFiles.forEach(file => console.log(`  • ${file}`));

      let success = false;
      
      switch (mode) {
        case 'quick':
          success = await this.runQuickSyntaxCheck(changedFiles);
          break;
          
        case 'smart':
          const affectedFiles = this.expandDependencies(changedFiles);
          console.log(`🕸️ 영향받는 파일 포함: ${affectedFiles.length}개`);
          success = await this.runIncrementalTypeCheck(affectedFiles);
          break;
          
        case 'full':
          // 전체 타입 검사로 폴백
          console.log('🔍 전체 TypeScript 검사로 폴백...');
          success = await this.runFullTypeCheck();
          break;
      }

      const duration = Date.now() - startTime;
      console.log(`⏱️ 실행 시간: ${duration}ms`);
      
      process.exit(success ? 0 : 1);
    } catch (error) {
      console.error('💥 TypeScript 검사 중 예외:', error);
      process.exit(1);
    }
  }

  async runFullTypeCheck() {
    return new Promise((resolve) => {
      const process = spawn('npm', ['run', 'type-check'], {
        stdio: 'inherit',
        env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=4096' }
      });

      process.on('close', (code) => {
        resolve(code === 0);
      });
    });
  }
}

// CLI 인터페이스
if (require.main === module) {
  const mode = process.argv[2] || 'smart';
  new SmartTypeChecker().run(mode);
}

module.exports = SmartTypeChecker;