#!/usr/bin/env node

/**
 * 🚀 OpenManager v5.21.0 - 로컬 배포 준비 검증 스크립트
 * 배포 전에 실행하여 모든 체크를 통과하는지 확인합니다.
 */

const { execSync } = require('child_process');
const chalk = require('chalk');

const steps = [
  {
    name: '📋 Dependencies 체크',
    command: 'npm list --depth=0',
    description: '패키지 의존성 확인'
  },
  {
    name: '🔍 TypeScript 체크',
    command: 'npm run type-check',
    description: '타입 오류 검사'
  },
  {
    name: '🔍 ESLint 체크',
    command: 'npm run lint',
    description: '코드 품질 검사'
  },
  {
    name: '🏗️ 빌드 테스트',
    command: 'npm run build',
    description: '프로덕션 빌드 검증'
  }
];

async function runDeployCheck() {
  console.log(chalk.blue.bold('\n🚀 OpenManager v5.21.0 배포 준비 검증 시작\n'));
  
  let allPassed = true;
  
  for (const step of steps) {
    console.log(chalk.cyan(`${step.name} - ${step.description}`));
    
    try {
      const startTime = Date.now();
      execSync(step.command, { stdio: 'pipe' });
      const duration = Date.now() - startTime;
      
      console.log(chalk.green(`✅ 통과 (${duration}ms)\n`));
    } catch (error) {
      console.log(chalk.red(`❌ 실패\n`));
      console.log(chalk.red(`오류: ${error.message}\n`));
      allPassed = false;
      break;
    }
  }
  
  if (allPassed) {
    console.log(chalk.green.bold('🎉 모든 체크 통과! 배포 준비가 완료되었습니다.'));
    console.log(chalk.blue('💡 다음 명령어로 배포하세요:'));
    console.log(chalk.yellow('   git add . && git commit -m "Deploy v5.21.0" && git push\n'));
    process.exit(0);
  } else {
    console.log(chalk.red.bold('❌ 배포 준비가 완료되지 않았습니다.'));
    console.log(chalk.blue('💡 위의 오류를 수정한 후 다시 시도하세요.\n'));
    process.exit(1);
  }
}

// 실행
if (require.main === module) {
  runDeployCheck().catch(console.error);
}

module.exports = { runDeployCheck }; 