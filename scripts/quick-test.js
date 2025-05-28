#!/usr/bin/env node

/**
 * 🔧 빠른 기능 테스트
 * 
 * 기능 구현에 집중한 핵심 시스템 상태 확인
 */

const { execSync } = require('child_process');

// 색상 출력
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function quickTest() {
  log('🔧 OpenManager Vibe v5 - 빠른 기능 테스트', 'cyan');
  log('=' .repeat(50), 'blue');

  const tests = [
    {
      name: 'TypeScript 컴파일',
      test: () => {
        try {
          execSync('npx tsc --noEmit', { stdio: 'ignore' });
          return { success: true, message: '타입 검사 통과' };
        } catch (error) {
          return { success: false, message: '타입 오류 발견' };
        }
      }
    },
    {
      name: '개발 서버 상태',
      test: async () => {
        try {
          // 포트 3001과 3000 모두 확인
          const response = await Promise.race([
            fetch('http://localhost:3001/api/health').catch(() => null),
            fetch('http://localhost:3000/api/health').catch(() => null)
          ]);
          
          if (response && response.ok) {
            const data = await response.json();
            return { 
              success: true, 
              message: `서버 실행 중 (${data.status || 'unknown'})` 
            };
          } else {
            return { success: false, message: '서버 미실행' };
          }
        } catch (error) {
          return { success: false, message: '서버 연결 실패' };
        }
      }
    },
    {
      name: 'API 엔드포인트',
      test: async () => {
        try {
          const endpoints = [
            'api/servers',
            'api/dashboard', 
            'api/alerts',
            'api/ai-agent/integrated'
          ];
          
          let successCount = 0;
          
          for (const endpoint of endpoints) {
            try {
              const response = await Promise.race([
                fetch(`http://localhost:3001/${endpoint}`).catch(() => null),
                fetch(`http://localhost:3000/${endpoint}`).catch(() => null)
              ]);
              
              if (response && response.ok) {
                successCount++;
              }
            } catch (error) {
              // 개별 엔드포인트 실패는 무시
            }
          }
          
          const success = successCount >= 3;
          return { 
            success, 
            message: `${successCount}/${endpoints.length} 엔드포인트 정상` 
          };
        } catch (error) {
          return { success: false, message: 'API 테스트 실패' };
        }
      }
    },
    {
      name: '필수 파일 구조',
      test: () => {
        try {
          const fs = require('fs');
          const requiredFiles = [
            'src/app/layout.tsx',
            'src/app/page.tsx',
            'src/app/api/health/route.ts',
            'src/app/api/servers/route.ts',
            'package.json',
            'next.config.ts'
          ];
          
          const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
          
          if (missingFiles.length === 0) {
            return { success: true, message: '필수 파일 모두 존재' };
          } else {
            return { 
              success: false, 
              message: `누락 파일: ${missingFiles.join(', ')}` 
            };
          }
        } catch (error) {
          return { success: false, message: '파일 구조 확인 실패' };
        }
      }
    },
    {
      name: '의존성 상태',
      test: () => {
        try {
          const fs = require('fs');
          const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
          const nodeModulesExists = fs.existsSync('node_modules');
          
          if (nodeModulesExists && packageJson.dependencies) {
            const depCount = Object.keys(packageJson.dependencies).length;
            return { 
              success: true, 
              message: `${depCount}개 의존성 설치됨` 
            };
          } else {
            return { success: false, message: '의존성 누락' };
          }
        } catch (error) {
          return { success: false, message: '의존성 확인 실패' };
        }
      }
    }
  ];

  let totalTests = tests.length;
  let passedTests = 0;

  for (const test of tests) {
    try {
      log(`\n🔍 ${test.name} 확인 중...`, 'yellow');
      const result = await test.test();
      
      if (result.success) {
        log(`  ✅ ${result.message}`, 'green');
        passedTests++;
      } else {
        log(`  ❌ ${result.message}`, 'red');
      }
    } catch (error) {
      log(`  ❌ 테스트 오류: ${error.message}`, 'red');
    }
  }

  // 결과 요약
  log('\n📊 테스트 결과:', 'cyan');
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  log(`성공: ${passedTests}/${totalTests} (${successRate}%)`, 'white');

  if (passedTests === totalTests) {
    log('\n🎉 모든 기능이 정상 작동 중입니다!', 'green');
  } else if (passedTests >= totalTests * 0.8) {
    log('\n⚠️ 대부분 기능이 정상이지만 일부 문제가 있습니다.', 'yellow');
  } else {
    log('\n❌ 여러 기능에 문제가 있습니다. 수정이 필요합니다.', 'red');
  }

  return passedTests / totalTests;
}

// 전역 fetch 폴리필
if (typeof fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    log('⚠️ node-fetch가 설치되지 않았습니다. API 테스트를 건너뜁니다.', 'yellow');
    global.fetch = () => Promise.reject(new Error('fetch not available'));
  }
}

if (require.main === module) {
  quickTest().catch(error => {
    log(`❌ 테스트 실행 실패: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { quickTest }; 