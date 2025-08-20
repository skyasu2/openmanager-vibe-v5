#!/usr/bin/env node
/**
 * 🏗️ 프로젝트 구조 분석 도구 v1.0
 * 
 * 대규모 프로젝트의 구조를 효율적으로 분석하고 시각화
 * - 디렉토리별 파일 개수 통계
 * - 파일 타입별 분포 분석
 * - 주요 구조 요약 출력
 * 
 * 사용법:
 *   node scripts/dev-tools/analyze-structure.js
 *   node scripts/dev-tools/analyze-structure.js --json
 *   node scripts/dev-tools/analyze-structure.js --detailed
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 설정
const EXCLUDED_DIRS = [
  'node_modules', '.git', '.next', 'dist', 'build', 
  'coverage', '.nyc_output', '.tmp', 'tmp'
];

const FILE_EXTENSIONS = {
  typescript: ['.ts', '.tsx'],
  javascript: ['.js', '.jsx', '.mjs', '.cjs'],
  markdown: ['.md', '.mdx'],
  json: ['.json'],
  css: ['.css', '.scss', '.sass', '.less'],
  html: ['.html', '.htm'],
  config: ['.config.js', '.config.ts', '.config.mjs', '.env', '.env.local', '.env.production'],
  test: ['.test.js', '.test.ts', '.spec.js', '.spec.ts'],
  assets: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot'],
  other: []
};

// 📊 프로젝트 분석 클래스
class ProjectStructureAnalyzer {
  constructor(rootPath = process.cwd()) {
    this.rootPath = rootPath;
    this.results = {
      timestamp: new Date().toISOString(),
      rootPath: rootPath,
      summary: {
        totalDirectories: 0,
        totalFiles: 0,
        totalSize: 0
      },
      directories: new Map(),
      fileTypes: new Map(),
      largeFiles: [],
      recentFiles: []
    };
  }

  // 🚀 메인 분석 실행
  async analyze(options = {}) {
    console.log('🔍 프로젝트 구조 분석 시작...\n');

    try {
      await this.analyzeBatch();
      await this.analyzeFileTypes();
      await this.findLargeFiles();
      if (options.detailed) {
        await this.analyzeRecentFiles();
      }
      
      this.generateSummary();
      
      if (options.json) {
        return this.toJSON();
      } else {
        this.printReport();
      }
      
    } catch (error) {
      console.error('❌ 분석 중 오류 발생:', error.message);
      process.exit(1);
    }
  }

  // 📁 배치 방식 디렉토리 분석
  async analyzeBatch() {
    const mainDirs = ['src', 'docs', 'scripts', 'tests', 'config', 'public', 'reports'];
    
    for (const dir of mainDirs) {
      const dirPath = path.join(this.rootPath, dir);
      if (fs.existsSync(dirPath)) {
        const stats = await this.analyzeDirectory(dirPath, dir);
        this.results.directories.set(dir, stats);
      }
    }
  }

  // 📊 개별 디렉토리 분석
  async analyzeDirectory(dirPath, name) {
    try {
      const files = this.getAllFiles(dirPath);
      const subdirs = this.getAllSubdirectories(dirPath);
      
      return {
        name,
        path: dirPath,
        fileCount: files.length,
        subdirCount: subdirs.length,
        totalSize: this.calculateTotalSize(files),
        structure: this.generateStructure(dirPath, 2) // 2단계 깊이
      };
      
    } catch (error) {
      return {
        name,
        path: dirPath,
        error: error.message,
        fileCount: 0,
        subdirCount: 0,
        totalSize: 0
      };
    }
  }

  // 📂 파일 목록 재귀적 수집
  getAllFiles(dirPath, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) return [];
    
    let files = [];
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isFile()) {
          files.push(itemPath);
        } else if (stats.isDirectory() && !EXCLUDED_DIRS.includes(item)) {
          files.push(...this.getAllFiles(itemPath, depth + 1, maxDepth));
        }
      }
    } catch (error) {
      // 권한 오류 등은 무시
    }
    
    return files;
  }

  // 📁 하위 디렉토리 수집
  getAllSubdirectories(dirPath, depth = 0, maxDepth = 3) {
    if (depth > maxDepth) return [];
    
    let dirs = [];
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory() && !EXCLUDED_DIRS.includes(item)) {
          dirs.push(itemPath);
          dirs.push(...this.getAllSubdirectories(itemPath, depth + 1, maxDepth));
        }
      }
    } catch (error) {
      // 권한 오류 등은 무시
    }
    
    return dirs;
  }

  // 🌳 구조 트리 생성
  generateStructure(dirPath, maxDepth = 2) {
    const structure = {};
    
    try {
      this.buildStructure(dirPath, structure, 0, maxDepth);
    } catch (error) {
      structure.error = error.message;
    }
    
    return structure;
  }

  buildStructure(dirPath, structure, depth, maxDepth) {
    if (depth >= maxDepth) return;
    
    try {
      const items = fs.readdirSync(dirPath);
      
      for (const item of items) {
        if (EXCLUDED_DIRS.includes(item)) continue;
        
        const itemPath = path.join(dirPath, item);
        const stats = fs.statSync(itemPath);
        
        if (stats.isDirectory()) {
          structure[item] = {
            type: 'directory',
            children: {}
          };
          this.buildStructure(itemPath, structure[item].children, depth + 1, maxDepth);
        } else {
          if (!structure._files) structure._files = [];
          structure._files.push(item);
        }
      }
    } catch (error) {
      // 권한 오류 등은 무시
    }
  }

  // 📋 파일 타입별 분석
  async analyzeFileTypes() {
    const allFiles = [];
    
    // 모든 디렉토리에서 파일 수집
    for (const [dirName, dirStats] of this.results.directories) {
      if (dirStats.error) continue;
      
      const files = this.getAllFiles(path.join(this.rootPath, dirName));
      allFiles.push(...files);
    }

    // 파일 타입별 분류
    for (const filePath of allFiles) {
      const ext = path.extname(filePath).toLowerCase();
      const type = this.getFileType(ext);
      
      if (!this.results.fileTypes.has(type)) {
        this.results.fileTypes.set(type, {
          count: 0,
          extensions: new Set(),
          totalSize: 0
        });
      }
      
      const typeStats = this.results.fileTypes.get(type);
      typeStats.count++;
      typeStats.extensions.add(ext);
      
      try {
        const stats = fs.statSync(filePath);
        typeStats.totalSize += stats.size;
      } catch (error) {
        // 파일 접근 실패시 무시
      }
    }

    // 총 파일 수 계산
    this.results.summary.totalFiles = allFiles.length;
  }

  // 🎯 파일 타입 분류
  getFileType(extension) {
    for (const [type, extensions] of Object.entries(FILE_EXTENSIONS)) {
      if (extensions.includes(extension)) {
        return type;
      }
    }
    return 'other';
  }

  // 📏 큰 파일 찾기
  async findLargeFiles(minSize = 1024 * 1024) { // 1MB 이상
    const largeFiles = [];
    
    for (const [dirName] of this.results.directories) {
      const dirPath = path.join(this.rootPath, dirName);
      const files = this.getAllFiles(dirPath);
      
      for (const filePath of files) {
        try {
          const stats = fs.statSync(filePath);
          if (stats.size > minSize) {
            largeFiles.push({
              path: path.relative(this.rootPath, filePath),
              size: stats.size,
              sizeFormatted: this.formatBytes(stats.size)
            });
          }
        } catch (error) {
          // 파일 접근 실패시 무시
        }
      }
    }
    
    // 크기순 정렬
    this.results.largeFiles = largeFiles.sort((a, b) => b.size - a.size);
  }

  // 📅 최근 수정 파일 분석
  async analyzeRecentFiles(days = 7) {
    const recentFiles = [];
    const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
    
    for (const [dirName] of this.results.directories) {
      const dirPath = path.join(this.rootPath, dirName);
      const files = this.getAllFiles(dirPath);
      
      for (const filePath of files.slice(0, 1000)) { // 성능을 위해 제한
        try {
          const stats = fs.statSync(filePath);
          if (stats.mtime.getTime() > cutoffTime) {
            recentFiles.push({
              path: path.relative(this.rootPath, filePath),
              modified: stats.mtime.toISOString()
            });
          }
        } catch (error) {
          // 파일 접근 실패시 무시
        }
      }
    }
    
    // 최신순 정렬
    this.results.recentFiles = recentFiles
      .sort((a, b) => new Date(b.modified) - new Date(a.modified))
      .slice(0, 50); // 상위 50개만
  }

  // 📊 전체 크기 계산
  calculateTotalSize(files) {
    let totalSize = 0;
    for (const filePath of files) {
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch (error) {
        // 파일 접근 실패시 무시
      }
    }
    return totalSize;
  }

  // 🔢 바이트 포맷팅
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 📈 요약 정보 생성
  generateSummary() {
    this.results.summary.totalDirectories = Array.from(this.results.directories.values())
      .reduce((sum, dir) => sum + (dir.subdirCount || 0), 0);
    
    this.results.summary.totalSize = Array.from(this.results.directories.values())
      .reduce((sum, dir) => sum + (dir.totalSize || 0), 0);
  }

  // 📋 보고서 출력
  printReport() {
    console.log('📊 프로젝트 구조 분석 보고서');
    console.log('='.repeat(50));
    console.log(`📅 분석 시각: ${new Date(this.results.timestamp).toLocaleString()}`);
    console.log(`📁 루트 경로: ${this.results.rootPath}`);
    console.log('');

    // 전체 요약
    console.log('🎯 전체 요약');
    console.log(`  총 디렉토리: ${this.results.summary.totalDirectories.toLocaleString()}개`);
    console.log(`  총 파일: ${this.results.summary.totalFiles.toLocaleString()}개`);
    console.log(`  총 크기: ${this.formatBytes(this.results.summary.totalSize)}`);
    console.log('');

    // 주요 디렉토리별 통계
    console.log('📁 주요 디렉토리별 통계');
    const sortedDirs = Array.from(this.results.directories.entries())
      .sort(([,a], [,b]) => (b.fileCount || 0) - (a.fileCount || 0));
    
    for (const [name, stats] of sortedDirs) {
      if (stats.error) {
        console.log(`  ${name}: ❌ ${stats.error}`);
      } else {
        console.log(`  ${name}: ${stats.fileCount.toLocaleString()}개 파일, ${stats.subdirCount.toLocaleString()}개 디렉토리 (${this.formatBytes(stats.totalSize)})`);
      }
    }
    console.log('');

    // 파일 타입별 분포
    console.log('📋 파일 타입별 분포');
    const sortedTypes = Array.from(this.results.fileTypes.entries())
      .sort(([,a], [,b]) => b.count - a.count);
    
    for (const [type, stats] of sortedTypes) {
      const percentage = ((stats.count / this.results.summary.totalFiles) * 100).toFixed(1);
      const extensions = Array.from(stats.extensions).join(', ');
      console.log(`  ${type}: ${stats.count.toLocaleString()}개 (${percentage}%) - ${extensions}`);
    }
    console.log('');

    // 큰 파일 목록
    if (this.results.largeFiles.length > 0) {
      console.log('📏 큰 파일 목록 (1MB 이상)');
      for (const file of this.results.largeFiles.slice(0, 10)) {
        console.log(`  ${file.sizeFormatted}: ${file.path}`);
      }
      console.log('');
    }

    // 최근 수정 파일
    if (this.results.recentFiles.length > 0) {
      console.log('📅 최근 수정 파일 (최근 7일)');
      for (const file of this.results.recentFiles.slice(0, 10)) {
        const date = new Date(file.modified).toLocaleDateString();
        console.log(`  ${date}: ${file.path}`);
      }
      console.log('');
    }

    console.log('✅ 분석 완료!\n');
  }

  // 🔄 JSON 출력
  toJSON() {
    const output = {
      ...this.results,
      directories: Object.fromEntries(this.results.directories),
      fileTypes: Object.fromEntries(
        Array.from(this.results.fileTypes.entries()).map(([type, stats]) => [
          type,
          {
            ...stats,
            extensions: Array.from(stats.extensions)
          }
        ])
      )
    };

    return JSON.stringify(output, null, 2);
  }
}

// 🚀 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const options = {
    json: args.includes('--json'),
    detailed: args.includes('--detailed')
  };

  try {
    const analyzer = new ProjectStructureAnalyzer();
    const result = await analyzer.analyze(options);
    
    if (result) {
      console.log(result);
    }
    
  } catch (error) {
    console.error('❌ 실행 오류:', error.message);
    process.exit(1);
  }
}

// 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
  main();
}

module.exports = { ProjectStructureAnalyzer };