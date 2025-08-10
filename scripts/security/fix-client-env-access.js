#!/usr/bin/env node

/**
 * 🔧 클라이언트 환경변수 접근 수정 스크립트
 * 
 * 클라이언트 사이드 코드에서 서버 전용 환경변수(NODE_ENV, VERCEL 등)에
 * 접근하는 코드를 수정하여 적절한 NEXT_PUBLIC_ 접두사를 사용하도록 변경합니다.
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 * @created 2025-08-10
 */

const fs = require('fs');
const path = require('path');

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

class ClientEnvAccessFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.fixes = [];
    this.errors = [];
  }

  /**
   * 메인 수정 프로세스 실행
   */
  async runFixes() {
    console.log(colorize('🔧 클라이언트 환경변수 접근 수정 시작...', 'cyan'));
    console.log('=====================================');

    try {
      // 1. NODE_ENV 접근 수정
      await this.fixNodeEnvAccess();
      
      // 2. VERCEL 환경변수 접근 수정  
      await this.fixVercelAccess();
      
      // 3. 기타 서버 전용 환경변수 접근 수정
      await this.fixOtherServerEnvAccess();

      // 4. 결과 출력
      this.printResults();

      return {
        success: true,
        fixes: this.fixes.length,
        errors: this.errors.length
      };

    } catch (error) {
      console.error(colorize('❌ 수정 프로세스 실패:', 'red'), error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * NODE_ENV 접근 수정
   */
  async fixNodeEnvAccess() {
    console.log(colorize('🔍 NODE_ENV 접근 수정 중...', 'blue'));
    
    const clientDirs = [
      'src/components',
      'src/hooks'
    ];

    const replacements = [
      {
        from: /process\.env\.NODE_ENV/g,
        to: 'process.env.NEXT_PUBLIC_NODE_ENV || process.env.NODE_ENV',
        description: 'NODE_ENV을 클라이언트 안전 버전으로 교체'
      }
    ];

    for (const dir of clientDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await this.processDirectory(dirPath, replacements, 'NODE_ENV');
      }
    }
  }

  /**
   * VERCEL 환경변수 접근 수정
   */
  async fixVercelAccess() {
    console.log(colorize('🔍 VERCEL 환경변수 접근 수정 중...', 'blue'));

    const replacements = [
      {
        from: /process\.env\.VERCEL/g,
        to: 'process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL',
        description: 'VERCEL을 클라이언트 안전 버전으로 교체'
      }
    ];

    const clientDirs = ['src/components', 'src/hooks'];
    
    for (const dir of clientDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await this.processDirectory(dirPath, replacements, 'VERCEL');
      }
    }
  }

  /**
   * 기타 서버 전용 환경변수 접근 수정
   */
  async fixOtherServerEnvAccess() {
    console.log(colorize('🔍 기타 서버 환경변수 접근 수정 중...', 'blue'));

    // 추가적인 서버 전용 환경변수들을 필요시 수정
    const serverOnlyVars = [
      'NEXTAUTH_SECRET',
      'GITHUB_CLIENT_SECRET',
      'SUPABASE_SERVICE_ROLE_KEY'
    ];

    // 이 변수들이 클라이언트 코드에 있으면 제거하거나 다른 방식으로 처리
    for (const varName of serverOnlyVars) {
      await this.checkAndWarnServerOnlyVar(varName);
    }
  }

  /**
   * 디렉토리 처리
   */
  async processDirectory(directory, replacements, varType) {
    const files = this.getAllFiles(directory, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        let modified = content;
        let hasChanges = false;
        
        for (const replacement of replacements) {
          if (replacement.from.test(modified)) {
            modified = modified.replace(replacement.from, replacement.to);
            hasChanges = true;
          }
        }
        
        if (hasChanges) {
          // 백업 생성
          const backupFile = file + '.backup';
          fs.writeFileSync(backupFile, content);
          
          // 수정된 내용 저장
          fs.writeFileSync(file, modified);
          
          const relativePath = path.relative(this.projectRoot, file);
          this.fixes.push({
            file: relativePath,
            type: varType,
            changes: replacements.length
          });
          
          console.log(colorize(`✅ 수정됨: ${relativePath}`, 'green'));
        }
        
      } catch (error) {
        const relativePath = path.relative(this.projectRoot, file);
        this.errors.push({
          file: relativePath,
          error: error.message
        });
        console.log(colorize(`❌ 수정 실패: ${relativePath} - ${error.message}`, 'red'));
      }
    }
  }

  /**
   * 서버 전용 변수 체크 및 경고
   */
  async checkAndWarnServerOnlyVar(varName) {
    const clientDirs = ['src/components', 'src/hooks'];
    
    for (const dir of clientDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        const files = this.getAllFiles(dirPath, ['.ts', '.tsx', '.js', '.jsx']);
        
        for (const file of files) {
          const content = fs.readFileSync(file, 'utf8');
          const regex = new RegExp(`process\\.env\\.${varName}`, 'g');
          
          if (regex.test(content)) {
            const relativePath = path.relative(this.projectRoot, file);
            console.log(colorize(`⚠️ 경고: ${relativePath}에서 서버 전용 변수 ${varName} 접근 감지`, 'yellow'));
            console.log(colorize(`   → 이 변수는 클라이언트에서 접근하면 안 됩니다`, 'yellow'));
          }
        }
      }
    }
  }

  /**
   * 모든 파일 가져오기
   */
  getAllFiles(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          results = results.concat(this.getAllFiles(filePath, extensions));
        }
      } else {
        if (extensions.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    });
    
    return results;
  }

  /**
   * 결과 출력
   */
  printResults() {
    console.log('\n' + colorize('🔧 수정 결과', 'cyan'));
    console.log('================');
    
    if (this.fixes.length === 0 && this.errors.length === 0) {
      console.log(colorize('✅ 수정할 클라이언트 환경변수 접근이 없습니다.', 'green'));
      return;
    }
    
    if (this.fixes.length > 0) {
      console.log(colorize(`✅ 수정된 파일: ${this.fixes.length}개`, 'green'));
      
      const groupedFixes = {};
      this.fixes.forEach(fix => {
        if (!groupedFixes[fix.type]) {
          groupedFixes[fix.type] = [];
        }
        groupedFixes[fix.type].push(fix.file);
      });
      
      Object.entries(groupedFixes).forEach(([type, files]) => {
        console.log(colorize(`  📝 ${type}:`, 'blue'));
        files.forEach(file => {
          console.log(`    - ${file}`);
        });
      });
    }
    
    if (this.errors.length > 0) {
      console.log(colorize(`❌ 오류 발생: ${this.errors.length}개`, 'red'));
      this.errors.forEach(error => {
        console.log(`  - ${error.file}: ${error.error}`);
      });
    }
    
    console.log(colorize('\n💡 권장사항:', 'yellow'));
    console.log('  • .env.local에 NEXT_PUBLIC_NODE_ENV=development 추가');
    console.log('  • .env.local에 NEXT_PUBLIC_VERCEL_ENV=development 추가 (로컬 개발시)');
    console.log('  • Vercel 배포시 NEXT_PUBLIC_VERCEL_ENV는 자동으로 설정됨');
    console.log('  • 백업 파일(.backup)은 수정 후 확인하고 삭제');
  }
}

// 메인 실행
async function main() {
  const fixer = new ClientEnvAccessFixer();
  const result = await fixer.runFixes();
  
  process.exit(result.success ? 0 : 1);
}

if (require.main === module) {
  main();
}

module.exports = { ClientEnvAccessFixer };