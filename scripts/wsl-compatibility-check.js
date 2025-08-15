#!/usr/bin/env node

/**
 * WSL 호환성 체크 스크립트
 * Windows에서 WSL로 환경 변경 시 발생할 수 있는 문제들을 사전에 감지합니다.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const WSLPathConverter = require('./wsl-path-converter');

class WSLCompatibilityChecker {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.fixes = [];
  }

  /**
   * 모든 호환성 검사 실행
   */
  async checkAll() {
    console.log('🔍 WSL 호환성 검사를 시작합니다...\n');

    this.checkEnvironment();
    this.checkFilePermissions();
    this.checkLineEndings();
    this.checkPaths();
    this.checkDependencies();
    this.checkScripts();
    this.checkGitConfig();
    this.checkEnvironmentFiles();

    this.printResults();
    return this.issues.length === 0;
  }

  /**
   * 환경 정보 확인
   */
  checkEnvironment() {
    console.log('🌍 환경 정보 확인...');
    
    const envInfo = WSLPathConverter.getEnvironmentInfo();
    console.log(`  - 플랫폼: ${envInfo.platform}`);
    console.log(`  - WSL 환경: ${envInfo.isWSL ? 'Yes' : 'No'}`);
    
    if (envInfo.isWSL) {
      console.log(`  - WSL 배포판: ${envInfo.wslDistro}`);
    }
    
    console.log(`  - 현재 디렉토리: ${envInfo.cwd}`);
    console.log(`  - 사용자: ${envInfo.user}\n`);

    // WSL 환경에서 Windows 경로 접근 확인
    if (envInfo.isWSL && !envInfo.cwd.startsWith('/mnt/')) {
      this.warnings.push('WSL 환경이지만 Windows 마운트 경로(/mnt/)를 사용하지 않고 있습니다.');
    }
  }

  /**
   * 파일 권한 확인
   */
  checkFilePermissions() {
    console.log('🔐 파일 권한 확인...');

    // Windows 환경에서는 파일 권한 검사를 건너뜀
    if (process.platform === 'win32') {
      console.log('  ℹ️  Windows 환경에서는 파일 권한 검사를 건너뜁니다.');
      console.log('  📝 WSL 환경에서는 자동으로 실행 권한이 부여됩니다.\n');
      return;
    }

    const executableFiles = [
      'scripts/*.sh',
      '.husky/*',
      '*.sh'
    ];

    let foundIssues = false;

    executableFiles.forEach(pattern => {
      try {
        // 간단한 glob 구현
        if (pattern.includes('*')) {
          const dir = pattern.split('*')[0];
          const ext = pattern.split('*')[1] || '';
          
          if (fs.existsSync(dir)) {
            const files = fs.readdirSync(dir)
              .filter(f => f.endsWith(ext))
              .map(f => path.join(dir, f));
            
            files.forEach(file => {
              this.checkSingleFilePermission(file);
            });
          }
        } else if (fs.existsSync(pattern)) {
          this.checkSingleFilePermission(pattern);
        }
      } catch (error) {
        this.warnings.push(`파일 권한 검사 중 오류: ${error.message}`);
      }
    });

    if (!foundIssues) {
      console.log('  ✅ 파일 권한 문제 없음\n');
    } else {
      console.log('  ⚠️  파일 권한 문제 발견\n');
    }
  }

  /**
   * 개별 파일 권한 확인
   */
  checkSingleFilePermission(file) {
    if (fs.existsSync(file)) {
      const stats = fs.statSync(file);
      const isExecutable = (stats.mode & parseInt('111', 8)) !== 0;
      
      if (!isExecutable) {
        this.issues.push(`${file}에 실행 권한이 없습니다.`);
        this.fixes.push(`chmod +x ${file}`);
        return true;
      }
    }
    return false;
  }

  /**
   * 줄바꿈 문자 확인
   */
  checkLineEndings() {
    console.log('📝 줄바꿈 문자 확인...');

    const criticalFiles = [
      'package.json',
      '.gitattributes',
      '.gitignore',
      'scripts/*.sh'
    ];

    let foundIssues = false;

    criticalFiles.forEach(pattern => {
      if (pattern.includes('*')) {
        // 패턴 매칭은 간단하게 처리
        if (pattern === 'scripts/*.sh') {
          const scriptsDir = 'scripts';
          if (fs.existsSync(scriptsDir)) {
            const files = fs.readdirSync(scriptsDir)
              .filter(f => f.endsWith('.sh'))
              .map(f => path.join(scriptsDir, f));
            
            files.forEach(file => {
              this.checkFileLineEndings(file);
            });
          }
        }
      } else if (fs.existsSync(pattern)) {
        this.checkFileLineEndings(pattern);
      }
    });

    if (!foundIssues) {
      console.log('  ✅ 줄바꿈 문자 문제 없음\n');
    }
  }

  /**
   * 개별 파일의 줄바꿈 문자 확인
   */
  checkFileLineEndings(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const hasCRLF = content.includes('\r\n');
      const hasLF = content.includes('\n') && !content.includes('\r\n');

      if (hasCRLF && filePath.endsWith('.sh')) {
        this.issues.push(`${filePath}에 Windows 줄바꿈(CRLF)이 포함되어 있습니다. WSL에서 실행 오류가 발생할 수 있습니다.`);
        this.fixes.push(`dos2unix ${filePath} 또는 에디터에서 LF로 변경`);
      }
    } catch (error) {
      this.warnings.push(`${filePath} 파일을 읽을 수 없습니다: ${error.message}`);
    }
  }

  /**
   * 경로 설정 확인
   */
  checkPaths() {
    console.log('📂 경로 설정 확인...');

    // package.json의 스크립트에서 경로 확인
    if (fs.existsSync('package.json')) {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      Object.entries(scripts).forEach(([name, script]) => {
        // Windows 절대 경로 패턴 확인
        if (script.includes('C:\\') || script.includes('D:\\') || /[A-Z]:\\/g.test(script)) {
          this.warnings.push(`package.json의 ${name} 스크립트에 Windows 절대 경로가 포함되어 있습니다.`);
        }

        // PowerShell 스크립트 확인
        if (script.includes('powershell') || script.includes('.ps1')) {
          this.warnings.push(`package.json의 ${name} 스크립트가 PowerShell을 사용합니다. WSL에서는 실행되지 않을 수 있습니다.`);
        }
      });
    }

    console.log('  ✅ 경로 설정 확인 완료\n');
  }

  /**
   * 의존성 확인
   */
  checkDependencies() {
    console.log('📦 의존성 확인...');

    // Node.js 버전 확인
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      console.log(`  - Node.js: ${nodeVersion}`);

      if (fs.existsSync('.nvmrc')) {
        const requiredVersion = fs.readFileSync('.nvmrc', 'utf8').trim();
        if (!nodeVersion.includes(requiredVersion)) {
          this.warnings.push(`Node.js 버전이 .nvmrc(${requiredVersion})와 다릅니다: ${nodeVersion}`);
        }
      }
    } catch (error) {
      this.issues.push('Node.js가 설치되지 않았거나 PATH에 없습니다.');
    }

    // npm 확인
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`  - npm: ${npmVersion}`);
    } catch (error) {
      this.issues.push('npm이 설치되지 않았거나 PATH에 없습니다.');
    }

    // node_modules 확인
    if (!fs.existsSync('node_modules')) {
      this.warnings.push('node_modules 디렉토리가 없습니다. npm install을 실행하세요.');
    }

    console.log('  ✅ 의존성 확인 완료\n');
  }

  /**
   * 스크립트 파일 확인
   */
  checkScripts() {
    console.log('📜 스크립트 파일 확인...');

    const wslBatchFiles = [
      'claude-wsl.bat',
      'ai-cli-wsl.bat',
      'gemini-wsl.bat',
      'openai-wsl.bat',
      'qwen-wsl.bat'
    ];

    wslBatchFiles.forEach(file => {
      if (fs.existsSync(file)) {
        console.log(`  ✅ ${file} 존재`);
        
        // 배치 파일 내용 확인
        const content = fs.readFileSync(file, 'utf8');
        if (!content.includes('wsl -e bash -c')) {
          this.warnings.push(`${file}에 WSL 실행 명령이 올바르지 않을 수 있습니다.`);
        }
      } else {
        this.warnings.push(`${file}이 없습니다. Windows에서 WSL 명령 실행이 어려울 수 있습니다.`);
      }
    });

    console.log('  ✅ 스크립트 파일 확인 완료\n');
  }

  /**
   * Git 설정 확인
   */
  checkGitConfig() {
    console.log('🔧 Git 설정 확인...');

    try {
      // core.autocrlf 설정 확인
      const autocrlf = execSync('git config --global core.autocrlf', { encoding: 'utf8' }).trim();
      console.log(`  - core.autocrlf: ${autocrlf}`);

      if (autocrlf !== 'input') {
        this.warnings.push(`Git core.autocrlf가 '${autocrlf}'로 설정되어 있습니다. WSL에서는 'input'을 권장합니다.`);
        this.fixes.push('git config --global core.autocrlf input');
      }
    } catch (error) {
      this.warnings.push('Git core.autocrlf 설정을 확인할 수 없습니다.');
    }

    try {
      // 사용자 정보 확인
      const userName = execSync('git config --global user.name', { encoding: 'utf8' }).trim();
      const userEmail = execSync('git config --global user.email', { encoding: 'utf8' }).trim();
      
      if (!userName || !userEmail) {
        this.warnings.push('Git 사용자 정보가 설정되지 않았습니다.');
        this.fixes.push('git config --global user.name "Your Name"');
        this.fixes.push('git config --global user.email "your.email@example.com"');
      } else {
        console.log(`  - 사용자: ${userName} <${userEmail}>`);
      }
    } catch (error) {
      this.warnings.push('Git 사용자 정보를 확인할 수 없습니다.');
    }

    console.log('  ✅ Git 설정 확인 완료\n');
  }

  /**
   * 환경 변수 파일 확인
   */
  checkEnvironmentFiles() {
    console.log('🌍 환경 변수 파일 확인...');

    if (!fs.existsSync('.env.local')) {
      if (fs.existsSync('.env.local.template')) {
        this.warnings.push('.env.local 파일이 없습니다. .env.local.template을 복사하여 생성하세요.');
        this.fixes.push('cp .env.local.template .env.local');
      } else {
        this.warnings.push('.env.local과 .env.local.template 파일이 모두 없습니다.');
      }
    } else {
      console.log('  ✅ .env.local 파일 존재');
    }

    console.log('  ✅ 환경 변수 파일 확인 완료\n');
  }

  /**
   * 결과 출력
   */
  printResults() {
    console.log('📊 검사 결과 요약\n');

    if (this.issues.length === 0 && this.warnings.length === 0) {
      console.log('🎉 모든 검사를 통과했습니다! WSL 환경으로 안전하게 전환할 수 있습니다.\n');
      return;
    }

    if (this.issues.length > 0) {
      console.log('❌ 해결해야 할 문제들:');
      this.issues.forEach((issue, index) => {
        console.log(`  ${index + 1}. ${issue}`);
      });
      console.log('');
    }

    if (this.warnings.length > 0) {
      console.log('⚠️  주의사항들:');
      this.warnings.forEach((warning, index) => {
        console.log(`  ${index + 1}. ${warning}`);
      });
      console.log('');
    }

    if (this.fixes.length > 0) {
      console.log('🔧 권장 수정 명령어들:');
      this.fixes.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
      console.log('');
    }

    console.log('💡 추가 도움말:');
    console.log('  - WSL 환경 설정: bash scripts/wsl-environment-setup.sh');
    console.log('  - 경로 변환 테스트: node scripts/wsl-path-converter.js --test');
    console.log('  - 자동 수정 적용: bash scripts/wsl-auto-fix.sh');
    console.log('');
  }
}

// CLI로 실행된 경우
if (require.main === module) {
  const checker = new WSLCompatibilityChecker();
  checker.checkAll().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = WSLCompatibilityChecker;