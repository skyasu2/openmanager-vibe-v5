#!/usr/bin/env node

/**
 * 🧹 중복 서버 정리 스크립트
 * 
 * 포트 3001, 3002, 3003에서 실행중인 Next.js 서버들을 정리합니다.
 */

const { exec, spawn } = require('child_process');
const os = require('os');

const PORTS_TO_CHECK = [3001, 3002, 3003];
const PLATFORM = os.platform();

/**
 * 포트에서 실행중인 프로세스 찾기
 */
function findProcessOnPort(port) {
  return new Promise((resolve) => {
    let command;
    
    if (PLATFORM === 'win32') {
      // Windows
      command = `netstat -ano | findstr :${port}`;
    } else {
      // Linux/macOS
      command = `lsof -i :${port}`;
    }
    
    exec(command, (error, stdout) => {
      if (error) {
        resolve(null);
        return;
      }
      
      if (PLATFORM === 'win32') {
        // Windows에서 PID 추출
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('LISTENING')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[parts.length - 1];
            if (pid && !isNaN(pid)) {
              resolve(pid);
              return;
            }
          }
        }
      } else {
        // Linux/macOS에서 PID 추출
        const lines = stdout.split('\n');
        for (const line of lines) {
          if (line.includes('node') || line.includes('next')) {
            const parts = line.trim().split(/\s+/);
            const pid = parts[1];
            if (pid && !isNaN(pid)) {
              resolve(pid);
              return;
            }
          }
        }
      }
      
      resolve(null);
    });
  });
}

/**
 * 프로세스 종료
 */
function killProcess(pid) {
  return new Promise((resolve) => {
    let command;
    
    if (PLATFORM === 'win32') {
      command = `taskkill /PID ${pid} /F`;
    } else {
      command = `kill -9 ${pid}`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.warn(`⚠️ PID ${pid} 종료 실패:`, error.message);
        resolve(false);
      } else {
        console.log(`✅ PID ${pid} 프로세스 종료 완료`);
        resolve(true);
      }
    });
  });
}

/**
 * 메인 정리 함수
 */
async function cleanupServers() {
  console.log('🧹 중복 서버 정리 시작...');
  console.log(`🔍 확인할 포트: ${PORTS_TO_CHECK.join(', ')}`);
  
  let killedCount = 0;
  
  for (const port of PORTS_TO_CHECK) {
    console.log(`\n🔍 포트 ${port} 확인 중...`);
    
    const pid = await findProcessOnPort(port);
    
    if (pid) {
      console.log(`🎯 포트 ${port}에서 PID ${pid} 발견`);
      const killed = await killProcess(pid);
      if (killed) {
        killedCount++;
      }
    } else {
      console.log(`✅ 포트 ${port}는 사용중이지 않음`);
    }
    
    // 잠깐 대기
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log(`\n🎉 정리 완료! ${killedCount}개 프로세스 종료됨`);
  
  if (killedCount > 0) {
    console.log('\n⏳ 3초 후 새로운 서버를 시작할 수 있습니다.');
    setTimeout(() => {
      console.log('✅ 이제 npm run dev를 실행하세요!');
    }, 3000);
  }
}

/**
 * 새로운 서버 시작 (선택사항)
 */
function startNewServer() {
  console.log('\n🚀 새로운 개발 서버 시작 중...');
  
  const devProcess = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  devProcess.on('error', (error) => {
    console.error('❌ 서버 시작 실패:', error);
  });
  
  devProcess.on('close', (code) => {
    console.log(`📊 서버 프로세스 종료됨 (코드: ${code})`);
  });
}

// CLI 인수 처리
const args = process.argv.slice(2);
const shouldStartNew = args.includes('--start');

// 메인 실행
if (require.main === module) {
  cleanupServers()
    .then(() => {
      if (shouldStartNew) {
        setTimeout(startNewServer, 3000);
      }
    })
    .catch((error) => {
      console.error('❌ 정리 과정에서 오류 발생:', error);
      process.exit(1);
    });
}

module.exports = { cleanupServers, findProcessOnPort, killProcess }; 