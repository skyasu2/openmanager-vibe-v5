#!/usr/bin/env node
/**
 * 📂 스크립트 카테고리 통합 계획 도구 v1.0
 * 
 * 31개 디렉토리 → 7개 핵심 카테고리로 통합
 * - 논리적 그룹화로 접근성 향상
 * - 중복 제거 및 구조 단순화
 * - Git 히스토리 보존
 * 
 * 사용법:
 *   node scripts/dev/script-consolidation-plan.js --dry-run
 *   node scripts/dev/script-consolidation-plan.js --execute
 */

const fs = require('fs');
const path = require('path');

// 🎯 통합 계획: 현재 → 목표 카테고리 매핑
const CONSOLIDATION_PLAN = {
  // 🛠️ dev/ - 개발 도구 통합
  'dev': [
    'dev-tools',      // 개발 도구 (메인)
    'analysis',       // 분석 도구
    'utils',          // 유틸리티
    'testing',        // 테스트 도구
    'performance',    // 성능 분석
  ],
  
  // 🤖 ai/ - AI 관련 유지 (이미 좋음)
  'ai': [
    'ai',            // AI 관련 (유지)
    'subagents',     // 서브에이전트
  ],
  
  // 🚀 deploy/ - 배포 통합  
  'deploy': [
    'deployment',    // 배포 스크립트
    'gcp',          // GCP 관리
    'batch',        // 배치 배포
  ],
  
  // 🧪 test/ - 테스트 자동화
  'test': [
    'api',          // API 테스트
    // testing은 이미 dev/로 이동
  ],
  
  // 🗄️ data/ - 데이터/DB 관리
  'data': [
    'database',     // 데이터베이스
    'sql',          // SQL 스크립트
  ],
  
  // 🌍 env/ - 환경 설정 통합
  'env': [
    'environment',  // 환경 설정
    'auth',         // 인증 설정
    'security',     // 보안 설정
    'setup',        // 초기 설정
  ],
  
  // 📊 monitoring/ - 모니터링 (유지)
  'monitoring': [
    'mcp',          // MCP 모니터링
    'claude',       // Claude 모니터링  
  ],

  // 🖥️ platform/ - 플랫폼별 도구
  'platform': [
    'wsl',          // WSL 관련
    'windows',      // Windows 관련
    'windows-support', // Windows 지원
    'common',       // 공통 플랫폼
  ],

  // 🗃️ archive/ - 아카이브 및 백업
  'archive': [
    'archive',      // 기존 아카이브
  ],

  // 📋 update/ - 업데이트 및 동기화
  'update': [
    'update',       // 업데이트 스크립트
    'git',          // Git 관리
  ],

  // 🔧 core/ - 핵심 모듈 (이미 좋음)
  'core': [
    'core',         // 핵심 모듈 (유지)
  ]
};

// 📊 분석 및 통계
class ScriptConsolidationPlanner {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.rootPath = process.cwd();
    this.scriptsPath = path.join(this.rootPath, 'scripts');
    this.results = {
      currentStructure: new Map(),
      consolidationPlan: new Map(),
      statistics: {
        before: { directories: 0, files: 0 },
        after: { directories: 0, files: 0 }
      }
    };
  }

  // 🚀 메인 실행
  async execute() {
    console.log(`📂 스크립트 통합 계획 ${this.dryRun ? '(분석)' : '(실행)'} 시작...\n`);

    try {
      await this.analyzeCurrentStructure();
      await this.generateConsolidationPlan();
      this.calculateStatistics();
      this.printReport();
      
      if (!this.dryRun) {
        const confirm = await this.confirmExecution();
        if (confirm) {
          await this.executeConsolidation();
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
    console.log('🔍 1단계: 현재 scripts/ 구조 분석\n');

    if (!fs.existsSync(this.scriptsPath)) {
      throw new Error('scripts/ 디렉토리를 찾을 수 없습니다.');
    }

    const items = fs.readdirSync(this.scriptsPath);
    
    for (const item of items) {
      const itemPath = path.join(this.scriptsPath, item);
      const stats = fs.statSync(itemPath);
      
      if (stats.isDirectory()) {
        const files = this.getAllFiles(itemPath);
        this.results.currentStructure.set(item, {
          type: 'directory',
          path: itemPath,
          fileCount: files.length,
          files: files.map(f => path.relative(itemPath, f))
        });
        
        console.log(`📁 ${item}: ${files.length}개 파일`);
      }
    }
    
    this.results.statistics.before.directories = this.results.currentStructure.size;
    this.results.statistics.before.files = Array.from(this.results.currentStructure.values())
      .reduce((sum, dir) => sum + dir.fileCount, 0);
  }

  // 📋 통합 계획 생성
  async generateConsolidationPlan() {
    console.log('\n📋 2단계: 통합 계획 생성\n');

    for (const [targetCategory, sourceDirs] of Object.entries(CONSOLIDATION_PLAN)) {
      const consolidatedFiles = [];
      let totalFiles = 0;

      console.log(`🎯 ${targetCategory}/ 카테고리:`);

      for (const sourceDir of sourceDirs) {
        if (this.results.currentStructure.has(sourceDir)) {
          const dirInfo = this.results.currentStructure.get(sourceDir);
          consolidatedFiles.push(...dirInfo.files.map(f => `${sourceDir}/${f}`));
          totalFiles += dirInfo.fileCount;
          console.log(`   ← ${sourceDir}/ (${dirInfo.fileCount}개 파일)`);
        } else {
          console.log(`   ⚠️  ${sourceDir}/ (디렉토리 없음)`);
        }
      }

      if (totalFiles > 0) {
        this.results.consolidationPlan.set(targetCategory, {
          targetPath: path.join(this.scriptsPath, targetCategory),
          sourceDirs: sourceDirs.filter(dir => this.results.currentStructure.has(dir)),
          fileCount: totalFiles,
          files: consolidatedFiles
        });
      }

      console.log(`   📊 총 ${totalFiles}개 파일 통합 예정\n`);
    }
  }

  // 📊 통계 계산
  calculateStatistics() {
    this.results.statistics.after.directories = this.results.consolidationPlan.size;
    this.results.statistics.after.files = Array.from(this.results.consolidationPlan.values())
      .reduce((sum, plan) => sum + plan.fileCount, 0);
  }

  // 📄 보고서 출력
  printReport() {
    console.log('='.repeat(60));
    console.log('📊 스크립트 통합 계획 보고서');
    console.log('='.repeat(60));

    const before = this.results.statistics.before;
    const after = this.results.statistics.after;
    const dirReduction = ((before.directories - after.directories) / before.directories * 100).toFixed(1);

    console.log(`\n🎯 개선 목표:`);
    console.log(`  디렉토리: ${before.directories}개 → ${after.directories}개 (${dirReduction}% 감소)`);
    console.log(`  파일: ${before.files}개 → ${after.files}개 (${before.files - after.files >= 0 ? '유지' : '증가'})`);

    console.log(`\n📂 통합 계획 상세:`);
    for (const [category, plan] of this.results.consolidationPlan) {
      console.log(`\n🎯 ${category}/ (${plan.fileCount}개 파일)`);
      for (const sourceDir of plan.sourceDirs) {
        const dirInfo = this.results.currentStructure.get(sourceDir);
        console.log(`   ← ${sourceDir}/ (${dirInfo.fileCount}개)`);
      }
    }

    console.log(`\n💡 예상 효과:`);
    console.log(`  ✅ 구조 단순화: ${dirReduction}% 디렉토리 감소`);
    console.log(`  ✅ 논리적 그룹화: 관련 기능별 통합`);
    console.log(`  ✅ 접근성 향상: 찾기 쉬운 구조`);
    console.log(`  ✅ 유지보수성 향상: 중복 제거`);

    if (this.dryRun) {
      console.log(`\n🔄 실제 실행: --execute 옵션으로 통합 실행`);
    }
  }

  // ✋ 실행 확인
  async confirmExecution() {
    const readline = require('readline').createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      readline.question('\n⚠️  위 계획대로 스크립트를 통합하시겠습니까? (y/N): ', (answer) => {
        readline.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  // 🚀 통합 실행
  async executeConsolidation() {
    console.log('\n🚀 3단계: 스크립트 통합 실행\n');
    
    const { execSync } = require('child_process');
    let moveCount = 0;
    let createCount = 0;

    try {
      // 각 통합 계획별로 실행
      for (const [targetCategory, plan] of this.results.consolidationPlan) {
        console.log(`\n📂 ${targetCategory}/ 카테고리 통합 시작...`);
        
        // 1. 타겟 디렉토리 생성
        if (!fs.existsSync(plan.targetPath)) {
          fs.mkdirSync(plan.targetPath, { recursive: true });
          console.log(`   ✅ 디렉토리 생성: ${targetCategory}/`);
          createCount++;
        }

        // 2. 각 소스 디렉토리의 파일들을 이동
        for (const sourceDir of plan.sourceDirs) {
          const sourcePath = path.join(this.scriptsPath, sourceDir);
          const sourceInfo = this.results.currentStructure.get(sourceDir);
          
          console.log(`   📁 ${sourceDir}/ → ${targetCategory}/ (${sourceInfo.fileCount}개 파일)`);
          
          // 파일별로 Git mv 실행
          for (const file of sourceInfo.files) {
            const sourceFilePath = path.join(sourcePath, file);
            const targetFilePath = path.join(plan.targetPath, file);
            const targetFileDir = path.dirname(targetFilePath);
            
            // 타겟 파일 디렉토리 생성 (하위 디렉토리가 있는 경우)
            if (!fs.existsSync(targetFileDir)) {
              fs.mkdirSync(targetFileDir, { recursive: true });
            }

            try {
              // Git mv로 히스토리 보존하며 이동
              const gitMvCmd = `git mv "${sourceFilePath}" "${targetFilePath}"`;
              execSync(gitMvCmd, { 
                stdio: 'pipe',
                cwd: this.rootPath 
              });
              console.log(`      ✅ ${file}`);
              moveCount++;
            } catch (error) {
              // Git mv 실패 시 일반 파일 이동으로 fallback
              console.warn(`      ⚠️  Git mv 실패, 일반 이동: ${file}`);
              fs.renameSync(sourceFilePath, targetFilePath);
              moveCount++;
            }
          }

          // 3. 빈 소스 디렉토리 제거
          try {
            if (fs.existsSync(sourcePath)) {
              const remainingItems = fs.readdirSync(sourcePath);
              if (remainingItems.length === 0) {
                fs.rmdirSync(sourcePath);
                console.log(`   🗑️  빈 디렉토리 제거: ${sourceDir}/`);
              } else {
                console.warn(`   ⚠️  디렉토리가 비어있지 않음: ${sourceDir}/ (${remainingItems.length}개 항목 남음)`);
              }
            }
          } catch (error) {
            console.warn(`   ⚠️  디렉토리 제거 실패: ${sourceDir}/`, error.message);
          }
        }
      }

      // 4. 결과 요약
      console.log('\n' + '='.repeat(60));
      console.log('🎉 스크립트 통합 완료!');
      console.log('='.repeat(60));
      console.log(`📊 통계:`);
      console.log(`  📂 생성된 디렉토리: ${createCount}개`);
      console.log(`  📄 이동된 파일: ${moveCount}개`);
      console.log(`  🗑️  제거된 디렉토리: ${plan.sourceDirs?.length || 0}개`);
      console.log(`\n💡 다음 단계:`);
      console.log(`  1. 경로 참조 업데이트 (package.json, 문서 등)`);
      console.log(`  2. Git 커밋으로 변경사항 확정`);
      console.log(`  3. 스크립트 경로 테스트`);

    } catch (error) {
      console.error('\n❌ 통합 실행 중 오류 발생:', error);
      console.log('\n🔄 복구 방법:');
      console.log('  git status로 변경사항 확인');
      console.log('  git restore . 로 변경사항 되돌리기 (필요시)');
      throw error;
    }
  }

  // 📁 파일 목록 재귀 수집
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
}

// 🚀 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: !args.includes('--execute')
  };

  if (!args.includes('--dry-run') && !args.includes('--execute')) {
    console.log('📋 사용법:');
    console.log('  --dry-run   : 통합 계획 분석 및 미리보기');
    console.log('  --execute   : 실제 통합 실행');
    process.exit(1);
  }

  try {
    const planner = new ScriptConsolidationPlanner(options);
    await planner.execute();
    
  } catch (error) {
    console.error('❌ 실행 오류:', error.message);
    process.exit(1);
  }
}

// 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
  main();
}

module.exports = { ScriptConsolidationPlanner };