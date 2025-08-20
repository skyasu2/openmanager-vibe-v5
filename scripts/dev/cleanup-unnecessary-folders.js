#!/usr/bin/env node
/**
 * 🗑️ 불필요한 폴더 정리 도구 v1.0
 * 
 * 프로젝트 루트의 중복되거나 불필요한 폴더들을 안전하게 정리
 * - 백업 폴더들 통합
 * - 빌드 아티팩트 제거
 * - 임시/테스트 폴더 정리
 * - 중복 구조 통합
 * 
 * 사용법:
 *   node scripts/dev/cleanup-unnecessary-folders.js --dry-run
 *   node scripts/dev/cleanup-unnecessary-folders.js --execute
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 정리 대상 폴더 분류
const CLEANUP_PLAN = {
  // 🗂️ 백업/아카이브 통합
  'archive_consolidation': {
    target: 'archive/',
    sources: [
      '.backups/',                              // 백업 폴더
      'hooks/backup-consolidated-20250729/',    // 오래된 후크 백업
    ],
    action: 'merge',
    reason: '중복된 아카이브 구조 통합'
  },

  // 🗑️ 빌드/테스트 아티팩트 (Git에서 제외)
  'build_artifacts': {
    target: null, // 삭제
    sources: [
      'logs/',                    // 로그 파일들
      'test-results/',           // 테스트 결과
      'playwright-report/',      // Playwright 리포트
      '.next/',                  // Next.js 빌드 캐시 (부분적)
    ],
    action: 'gitignore_and_remove',
    reason: '빌드/테스트 아티팩트는 .gitignore에 포함'
  },

  // 📁 중복 구조 통합
  'config_consolidation': {
    target: 'config/',
    sources: [
      'infra/config/',          // 인프라 설정
      'local-dev/config/',      // 로컬 개발 설정
    ],
    action: 'merge_selective',
    reason: '설정 파일 중복 제거'
  },

  // 🔧 임시/개발 도구 정리
  'dev_cleanup': {
    target: 'scripts/archive/',
    sources: [
      'test-mcp-demo/',         // MCP 테스트 데모
      'local-dev/scripts/',     // 로컬 개발 스크립트
    ],
    action: 'archive',
    reason: '개발 중 생성된 임시 도구들'
  },

  // 🏗️ 시스템 도구 재배치
  'system_tools': {
    target: '.local/system-tools/',
    sources: [
      'google-cloud-sdk/',      // GCP SDK (개인 도구)
    ],
    action: 'relocate',
    reason: '프로젝트 외부 시스템 도구 분리'
  }
};

// 📊 분석 및 정리 클래스
class UnnecessaryFoldersCleanup {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.rootPath = process.cwd();
    this.results = {
      analyzed: new Map(),
      planned: new Map(),
      executed: new Map(),
      statistics: {
        before: { folders: 0, files: 0, size: 0 },
        after: { folders: 0, files: 0, size: 0 }
      }
    };
  }

  // 🚀 메인 실행
  async execute() {
    console.log(`🗑️ 불필요한 폴더 정리 ${this.dryRun ? '(분석)' : '(실행)'} 시작...\n`);

    try {
      await this.analyzeCurrentStructure();
      await this.generateCleanupPlan();
      this.calculateStatistics();
      this.printReport();
      
      if (!this.dryRun) {
        const confirm = await this.confirmExecution();
        if (confirm) {
          await this.executeCleanup();
        } else {
          console.log('❌ 사용자가 실행을 취소했습니다.');
        }
      }
      
    } catch (error) {
      console.error('❌ 실행 중 오류:', error.message);
      process.exit(1);
    }
  }

  // 🔍 현재 구조 분석
  async analyzeCurrentStructure() {
    console.log('🔍 1단계: 불필요한 폴더 구조 분석\n');

    for (const [category, config] of Object.entries(CLEANUP_PLAN)) {
      console.log(`📂 ${category} 카테고리 분석:`);
      
      let totalFiles = 0;
      let totalSize = 0;
      
      for (const sourceFolder of config.sources) {
        if (fs.existsSync(sourceFolder)) {
          const files = this.getAllFiles(sourceFolder);
          const size = this.getFolderSize(sourceFolder);
          
          this.results.analyzed.set(sourceFolder, {
            files: files.length,
            size: size,
            exists: true
          });
          
          totalFiles += files.length;
          totalSize += size;
          
          console.log(`   📁 ${sourceFolder}: ${files.length}개 파일, ${this.formatSize(size)}`);
        } else {
          console.log(`   ⚠️  ${sourceFolder}: 폴더 없음`);
          this.results.analyzed.set(sourceFolder, {
            files: 0,
            size: 0,
            exists: false
          });
        }
      }
      
      console.log(`   📊 총합: ${totalFiles}개 파일, ${this.formatSize(totalSize)}\n`);
    }
  }

  // 📋 정리 계획 생성
  async generateCleanupPlan() {
    console.log('📋 2단계: 정리 계획 생성\n');

    for (const [category, config] of Object.entries(CLEANUP_PLAN)) {
      console.log(`🎯 ${category} 처리 계획:`);
      console.log(`   작업: ${config.action}`);
      console.log(`   목표: ${config.target || '삭제'}`);
      console.log(`   이유: ${config.reason}`);
      
      // 실존하는 소스만 필터링
      const existingSources = config.sources.filter(source => 
        this.results.analyzed.get(source)?.exists
      );
      
      if (existingSources.length > 0) {
        this.results.planned.set(category, {
          ...config,
          sources: existingSources,
          totalFiles: existingSources.reduce((sum, source) => 
            sum + this.results.analyzed.get(source).files, 0),
          totalSize: existingSources.reduce((sum, source) => 
            sum + this.results.analyzed.get(source).size, 0)
        });
        
        console.log(`   📁 대상 폴더: ${existingSources.join(', ')}`);
      } else {
        console.log(`   ℹ️  해당 없음 (폴더 없음)`);
      }
      
      console.log('');
    }
  }

  // 📊 통계 계산
  calculateStatistics() {
    // 현재 상태 계산
    let currentFolders = 0;
    let currentFiles = 0;
    let currentSize = 0;

    for (const [folder, info] of this.results.analyzed) {
      if (info.exists) {
        currentFolders++;
        currentFiles += info.files;
        currentSize += info.size;
      }
    }

    this.results.statistics.before = {
      folders: currentFolders,
      files: currentFiles,
      size: currentSize
    };

    // 정리 후 예상 상태
    let savedFiles = 0;
    let savedSize = 0;
    let removedFolders = 0;

    for (const [category, plan] of this.results.planned) {
      if (plan.action === 'gitignore_and_remove') {
        savedFiles += plan.totalFiles;
        savedSize += plan.totalSize;
        removedFolders += plan.sources.length;
      }
    }

    this.results.statistics.after = {
      folders: currentFolders - removedFolders,
      files: currentFiles - savedFiles,
      size: currentSize - savedSize
    };
  }

  // 📄 보고서 출력
  printReport() {
    console.log('='.repeat(70));
    console.log('🗑️ 불필요한 폴더 정리 계획 보고서');
    console.log('='.repeat(70));

    const before = this.results.statistics.before;
    const after = this.results.statistics.after;
    const folderReduction = before.folders > 0 ? ((before.folders - after.folders) / before.folders * 100).toFixed(1) : 0;
    const sizeReduction = before.size > 0 ? ((before.size - after.size) / before.size * 100).toFixed(1) : 0;

    console.log(`\n📊 정리 효과:`);
    console.log(`  폴더 수: ${before.folders}개 → ${after.folders}개 (${folderReduction}% 감소)`);
    console.log(`  파일 수: ${before.files}개 → ${after.files}개`);
    console.log(`  용량: ${this.formatSize(before.size)} → ${this.formatSize(after.size)} (${sizeReduction}% 절약)`);

    console.log(`\n📂 정리 계획 상세:`);
    for (const [category, plan] of this.results.planned) {
      console.log(`\n🎯 ${category}:`);
      console.log(`   작업: ${plan.action}`);
      console.log(`   대상: ${plan.sources.join(', ')}`);
      console.log(`   파일: ${plan.totalFiles}개, 용량: ${this.formatSize(plan.totalSize)}`);
      console.log(`   목표: ${plan.target || '삭제'}`);
    }

    console.log(`\n💡 예상 효과:`);
    console.log(`  ✅ 구조 단순화: ${folderReduction}% 폴더 감소`);
    console.log(`  ✅ 용량 절약: ${this.formatSize(before.size - after.size)} 절약`);
    console.log(`  ✅ Git 성능 향상: 추적 파일 수 감소`);
    console.log(`  ✅ 프로젝트 정리: 중복 제거`);

    if (this.dryRun) {
      console.log(`\n🔄 실제 실행: --execute 옵션으로 정리 실행`);
    }
  }

  // ✋ 실행 확인
  async confirmExecution() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n⚠️  위 계획대로 폴더를 정리하시겠습니까? (y/N): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  // 🚀 정리 실행
  async executeCleanup() {
    console.log('\n🚀 3단계: 폴더 정리 실행\n');
    
    let processedFolders = 0;
    let movedFiles = 0;
    let savedSpace = 0;

    try {
      for (const [category, plan] of this.results.planned) {
        console.log(`\n📂 ${category} 처리 중...`);
        
        switch (plan.action) {
          case 'merge':
            await this.executeMerge(plan);
            break;
          case 'gitignore_and_remove':
            await this.executeGitignoreAndRemove(plan);
            break;
          case 'merge_selective':
            await this.executeMergeSelective(plan);
            break;
          case 'archive':
            await this.executeArchive(plan);
            break;
          case 'relocate':
            await this.executeRelocate(plan);
            break;
        }
        
        processedFolders += plan.sources.length;
        movedFiles += plan.totalFiles;
        savedSpace += plan.totalSize;
        
        this.results.executed.set(category, {
          status: 'completed',
          processedFolders: plan.sources.length,
          movedFiles: plan.totalFiles
        });
      }

      // 4. 결과 요약
      console.log('\n' + '='.repeat(70));
      console.log('🎉 폴더 정리 완료!');
      console.log('='.repeat(70));
      console.log(`📊 통계:`);
      console.log(`  📁 처리된 폴더: ${processedFolders}개`);
      console.log(`  📄 이동된 파일: ${movedFiles}개`);
      console.log(`  💾 절약된 용량: ${this.formatSize(savedSpace)}`);
      console.log(`\n💡 다음 단계:`);
      console.log(`  1. .gitignore 업데이트 확인`);
      console.log(`  2. Git 커밋으로 변경사항 확정`);
      console.log(`  3. 빌드 테스트 실행`);

    } catch (error) {
      console.error('\n❌ 정리 실행 중 오류 발생:', error);
      console.log('\n🔄 복구 방법:');
      console.log('  git status로 변경사항 확인');
      console.log('  git restore . 로 변경사항 되돌리기 (필요시)');
      throw error;
    }
  }

  // 📁 merge 실행
  async executeMerge(plan) {
    // target 디렉토리 생성
    if (!fs.existsSync(plan.target)) {
      fs.mkdirSync(plan.target, { recursive: true });
      console.log(`   ✅ 디렉토리 생성: ${plan.target}`);
    }

    for (const source of plan.sources) {
      console.log(`   📁 ${source} → ${plan.target}`);
      
      const files = this.getAllFiles(source);
      for (const file of files) {
        const relativePath = path.relative(source, file);
        const targetPath = path.join(plan.target, relativePath);
        const targetDir = path.dirname(targetPath);

        // 타겟 디렉토리 생성
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        // 파일 이동 (Git mv 시도, 실패시 일반 이동)
        try {
          execSync(`git mv "${file}" "${targetPath}"`, { stdio: 'pipe' });
          console.log(`      ✅ ${relativePath}`);
        } catch (error) {
          fs.renameSync(file, targetPath);
          console.log(`      ⚠️  ${relativePath} (일반 이동)`);
        }
      }

      // 빈 소스 디렉토리 제거
      try {
        fs.rmSync(source, { recursive: true, force: true });
        console.log(`   🗑️  ${source} 제거`);
      } catch (error) {
        console.warn(`   ⚠️  ${source} 제거 실패:`, error.message);
      }
    }
  }

  // 🗑️ gitignore_and_remove 실행
  async executeGitignoreAndRemove(plan) {
    // .gitignore에 패턴 추가
    const gitignorePath = path.join(this.rootPath, '.gitignore');
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    
    let newPatterns = [];
    for (const source of plan.sources) {
      const pattern = source.endsWith('/') ? source : source + '/';
      if (!gitignoreContent.includes(pattern)) {
        newPatterns.push(pattern);
      }
    }

    if (newPatterns.length > 0) {
      const newGitignore = gitignoreContent + 
        '\n# 🗑️ 정리된 빌드/테스트 아티팩트 (2025-08-21)\n' +
        newPatterns.join('\n') + '\n';
      fs.writeFileSync(gitignorePath, newGitignore);
      console.log(`   ✅ .gitignore 업데이트: ${newPatterns.join(', ')}`);
    }

    // 폴더 제거
    for (const source of plan.sources) {
      if (fs.existsSync(source)) {
        try {
          fs.rmSync(source, { recursive: true, force: true });
          console.log(`   🗑️  ${source} 제거 완료`);
        } catch (error) {
          console.warn(`   ⚠️  ${source} 제거 실패:`, error.message);
        }
      }
    }
  }

  // 📁 merge_selective 실행 (TODO: 구현 필요시)
  async executeMergeSelective(plan) {
    console.log(`   ⚠️  merge_selective 구현 필요: ${plan.sources.join(', ')}`);
  }

  // 📁 archive 실행 (TODO: 구현 필요시)
  async executeArchive(plan) {
    console.log(`   ⚠️  archive 구현 필요: ${plan.sources.join(', ')}`);
  }

  // 📁 relocate 실행 (TODO: 구현 필요시)
  async executeRelocate(plan) {
    console.log(`   ⚠️  relocate 구현 필요: ${plan.sources.join(', ')}`);
  }

  // 🔧 유틸리티 함수들
  getAllFiles(dirPath, fileList = []) {
    if (!fs.existsSync(dirPath)) return fileList;

    const items = fs.readdirSync(dirPath);
    items.forEach(item => {
      const fullPath = path.join(dirPath, item);
      const stats = fs.statSync(fullPath);
      
      if (stats.isFile()) {
        fileList.push(fullPath);
      } else if (stats.isDirectory()) {
        this.getAllFiles(fullPath, fileList);
      }
    });
    
    return fileList;
  }

  getFolderSize(dirPath) {
    if (!fs.existsSync(dirPath)) return 0;

    let size = 0;
    const files = this.getAllFiles(dirPath);
    
    files.forEach(file => {
      try {
        const stats = fs.statSync(file);
        size += stats.size;
      } catch (error) {
        // 파일 접근 실패 시 무시
      }
    });
    
    return size;
  }

  formatSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }
}

// 🚀 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute')
  };

  if (!args.includes('--dry-run') && !args.includes('--execute')) {
    console.log('📋 사용법:');
    console.log('  --dry-run   : 정리 계획 분석 및 미리보기');
    console.log('  --execute   : 실제 정리 실행');
    process.exit(1);
  }

  try {
    const cleanup = new UnnecessaryFoldersCleanup(options);
    await cleanup.execute();
    
  } catch (error) {
    console.error('❌ 실행 오류:', error.message);
    process.exit(1);
  }
}

// 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
  main();
}

module.exports = { UnnecessaryFoldersCleanup };