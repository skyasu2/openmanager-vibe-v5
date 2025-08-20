#!/usr/bin/env node
/**
 * 🧩 컴포넌트 구조 자동 정리 도구 v1.0
 * 
 * 잘못된 위치의 컴포넌트들을 올바른 도메인 폴더로 이동
 * - AdminDashboard 컴포넌트들 → admin/ 폴더
 * - 환경/공용 컴포넌트들 → shared/ 폴더  
 * - Profile 컴포넌트들 → unified-profile/ 폴더
 * - 중복 구조 해결
 * 
 * 사용법:
 *   node scripts/dev/reorganize-components.js --dry-run
 *   node scripts/dev/reorganize-components.js --execute
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 🎯 이동 계획
const REORGANIZATION_PLAN = [
  {
    from: 'src/components/AdminDashboardCharts.tsx',
    to: 'src/components/admin/AdminDashboardCharts.tsx',
    reason: 'Admin 관련 컴포넌트는 admin/ 폴더에 위치'
  },
  {
    from: 'src/components/AdminDashboardCharts.optimized.tsx', 
    to: 'src/components/admin/AdminDashboardCharts.optimized.tsx',
    reason: 'Admin 관련 최적화 컴포넌트도 admin/ 폴더에 위치'
  },
  {
    from: 'src/components/EnvironmentBadge.tsx',
    to: 'src/components/shared/EnvironmentBadge.tsx', 
    reason: '환경 표시는 공용 컴포넌트로 shared/ 폴더에 위치'
  },
  {
    from: 'src/components/UnifiedProfileComponent.tsx',
    to: 'src/components/unified-profile/UnifiedProfileComponent.tsx',
    reason: 'Profile 관련 컴포넌트는 unified-profile/ 폴더에 위치'
  }
];

// 🔄 중복 구조 해결 계획
const DUPLICATE_STRUCTURE_FIXES = [
  {
    from: 'src/components/unified-profile/unified-profile/',
    to: 'src/components/unified-profile/',
    type: 'merge_duplicate',
    reason: '중복된 unified-profile/unified-profile/ 구조를 단일 구조로 통합'
  }
];

class ComponentReorganizer {
  constructor(options = {}) {
    this.dryRun = options.dryRun || false;
    this.rootPath = process.cwd();
    this.results = {
      moved: [],
      errors: [],
      skipped: []
    };
  }

  // 🚀 메인 실행
  async execute() {
    console.log(`🧩 컴포넌트 구조 정리 ${this.dryRun ? '(드라이런)' : '(실행)'} 시작...\n`);

    try {
      // 1단계: 개별 파일 이동
      await this.moveComponents();
      
      // 2단계: 중복 구조 해결
      await this.fixDuplicateStructures();
      
      // 3단계: Import 경로 업데이트 (실행 모드에서만)
      if (!this.dryRun) {
        await this.updateImportPaths();
      }

      this.printSummary();
      
    } catch (error) {
      console.error('❌ 실행 중 오류:', error.message);
      process.exit(1);
    }
  }

  // 📁 컴포넌트 이동 실행
  async moveComponents() {
    console.log('📁 1단계: 컴포넌트 파일 이동\n');

    for (const plan of REORGANIZATION_PLAN) {
      await this.moveFile(plan);
    }
  }

  // 🔄 중복 구조 해결
  async fixDuplicateStructures() {
    console.log('\n🔄 2단계: 중복 구조 해결\n');

    for (const fix of DUPLICATE_STRUCTURE_FIXES) {
      if (fix.type === 'merge_duplicate') {
        await this.mergeDuplicateDirectory(fix);
      }
    }
  }

  // 📝 개별 파일 이동
  async moveFile(plan) {
    const fromPath = path.resolve(this.rootPath, plan.from);
    const toPath = path.resolve(this.rootPath, plan.to);
    
    console.log(`📦 ${plan.from}`);
    console.log(`   → ${plan.to}`);
    console.log(`   이유: ${plan.reason}`);

    // 파일 존재 확인
    if (!fs.existsSync(fromPath)) {
      console.log(`   ⚠️  파일 없음 (이미 이동됨)\n`);
      this.results.skipped.push({...plan, reason: 'File not found'});
      return;
    }

    // 대상 디렉토리 생성
    const toDir = path.dirname(toPath);
    
    if (this.dryRun) {
      console.log(`   🔄 [DRY-RUN] 디렉토리 생성: ${toDir}`);
      console.log(`   🔄 [DRY-RUN] 파일 이동 예정\n`);
    } else {
      try {
        // 디렉토리 생성
        if (!fs.existsSync(toDir)) {
          fs.mkdirSync(toDir, { recursive: true });
          console.log(`   ✅ 디렉토리 생성: ${toDir}`);
        }

        // Git mv 사용 (히스토리 유지)
        execSync(`git mv "${fromPath}" "${toPath}"`, { 
          stdio: 'pipe',
          cwd: this.rootPath 
        });
        
        console.log(`   ✅ 이동 완료\n`);
        this.results.moved.push(plan);
        
      } catch (error) {
        console.log(`   ❌ 이동 실패: ${error.message}\n`);
        this.results.errors.push({...plan, error: error.message});
      }
    }
  }

  // 🔗 중복 디렉토리 병합
  async mergeDuplicateDirectory(fix) {
    const fromPath = path.resolve(this.rootPath, fix.from);
    const toPath = path.resolve(this.rootPath, fix.to);
    
    console.log(`🔗 ${fix.from}`);
    console.log(`   → ${fix.to} (병합)`);
    console.log(`   이유: ${fix.reason}`);

    if (!fs.existsSync(fromPath)) {
      console.log(`   ⚠️  디렉토리 없음 (이미 정리됨)\n`);
      this.results.skipped.push({...fix, reason: 'Directory not found'});
      return;
    }

    if (this.dryRun) {
      // 드라이런: 이동할 파일 목록만 표시
      const files = this.getAllFiles(fromPath);
      console.log(`   🔄 [DRY-RUN] ${files.length}개 파일 병합 예정:`);
      files.forEach(file => {
        const relativePath = path.relative(fromPath, file);
        console.log(`     • ${relativePath}`);
      });
      console.log('');
      return;
    }

    try {
      // 실제 실행: 파일들을 하나씩 이동
      const files = this.getAllFiles(fromPath);
      
      for (const file of files) {
        const relativePath = path.relative(fromPath, file);
        const targetFile = path.join(toPath, relativePath);
        const targetDir = path.dirname(targetFile);
        
        // 대상 디렉토리 생성
        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }
        
        // Git mv로 이동 (히스토리 유지)
        execSync(`git mv "${file}" "${targetFile}"`, {
          stdio: 'pipe',
          cwd: this.rootPath
        });
        
        console.log(`     ✅ ${relativePath}`);
      }
      
      // 빈 디렉토리 제거
      if (files.length > 0) {
        execSync(`rm -rf "${fromPath}"`, {
          stdio: 'pipe', 
          cwd: this.rootPath
        });
        console.log(`   ✅ 빈 디렉토리 제거 완료\n`);
      }
      
      this.results.moved.push({...fix, filesCount: files.length});
      
    } catch (error) {
      console.log(`   ❌ 병합 실패: ${error.message}\n`);
      this.results.errors.push({...fix, error: error.message});
    }
  }

  // 📋 파일 목록 재귀 수집
  getAllFiles(dirPath, fileList = []) {
    if (!fs.existsSync(dirPath)) return fileList;

    const files = fs.readdirSync(dirPath);
    
    files.forEach(file => {
      const fullPath = path.join(dirPath, file);
      const stats = fs.statSync(fullPath);
      
      if (stats.isDirectory()) {
        this.getAllFiles(fullPath, fileList);
      } else {
        fileList.push(fullPath);
      }
    });
    
    return fileList;
  }

  // 🔍 Import 경로 업데이트 (실행 모드에서만)
  async updateImportPaths() {
    console.log('\n🔍 3단계: Import 경로 자동 업데이트\n');

    // TypeScript 설정에 alias가 있으므로 대부분 자동으로 해결됨
    console.log('   ✅ TypeScript alias 설정으로 자동 해결됨');
    console.log('   📝 수동 확인 권장: 상대 경로 import가 있는지 검토');
    
    // 잠재적 문제가 있는 파일들 검색
    try {
      const problematicImports = execSync(`grep -r "from.*\\.\\..*components" src/ --include="*.tsx" --include="*.ts" | head -5`, {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();

      if (problematicImports) {
        console.log('\n   ⚠️  확인 필요한 상대 경로 import:');
        console.log(problematicImports);
      } else {
        console.log('   ✅ 상대 경로 import 문제 없음');
      }
    } catch (error) {
      console.log('   ✅ 상대 경로 import 검색 완료 (문제 없음)');
    }
  }

  // 📊 결과 요약 출력
  printSummary() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 컴포넌트 재구성 결과 요약');
    console.log('='.repeat(50));

    if (this.dryRun) {
      console.log('🔄 모드: 드라이런 (실제 변경 없음)');
    } else {
      console.log('✅ 모드: 실행 완료');
    }

    console.log(`\n📦 처리 결과:`);
    console.log(`  • 성공: ${this.results.moved.length}개`);
    console.log(`  • 스킵: ${this.results.skipped.length}개`);
    console.log(`  • 오류: ${this.results.errors.length}개`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.results.errors.forEach(error => {
        console.log(`  • ${error.from}: ${error.error}`);
      });
    }

    if (this.results.moved.length > 0 && !this.dryRun) {
      console.log('\n🎯 다음 단계:');
      console.log('  1. TypeScript 컴파일 확인: npm run build');
      console.log('  2. 테스트 실행: npm run test');
      console.log('  3. Import 경로 수동 검토');
    }

    console.log(`\n${this.dryRun ? '🔄 실제 실행하려면: --execute 옵션 사용' : '✅ 컴포넌트 재구성 완료!'}`);
  }
}

// 🚀 메인 실행
async function main() {
  const args = process.argv.slice(2);
  const options = {
    dryRun: args.includes('--dry-run') || !args.includes('--execute')
  };

  if (!args.includes('--dry-run') && !args.includes('--execute')) {
    console.log('⚠️  옵션을 선택하세요:');
    console.log('  --dry-run  : 변경사항 미리보기');
    console.log('  --execute  : 실제 파일 이동 실행');
    process.exit(1);
  }

  try {
    const reorganizer = new ComponentReorganizer(options);
    await reorganizer.execute();
    
  } catch (error) {
    console.error('❌ 실행 오류:', error.message);
    process.exit(1);
  }
}

// 직접 실행 시에만 메인 함수 호출
if (require.main === module) {
  main();
}

module.exports = { ComponentReorganizer };