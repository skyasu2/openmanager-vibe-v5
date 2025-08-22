import { exec } from 'child_process';
import { promisify } from 'util';
import { setTimeout as sleep } from 'timers/promises';

const execAsync = promisify(exec);

let serverProcess: any = null;

export async function setup() {
  console.log('🚀 테스트 서버 시작 중...');
  
  try {
    // 포트 3002가 사용 중인지 확인
    try {
      const { stdout } = await execAsync('lsof -ti:3002');
      if (stdout.trim()) {
        console.log('⚠️ 포트 3002가 이미 사용 중입니다. 기존 프로세스를 종료합니다.');
        await execAsync(`kill -9 ${stdout.trim()}`);
        await sleep(2000);
      }
    } catch (e) {
      // 포트가 사용되지 않음 (정상)
    }

    // Next.js 개발 서버를 포트 3002에서 시작
    const { spawn } = require('child_process');
    serverProcess = spawn('npm', ['run', 'dev'], {
      env: { ...process.env, PORT: '3002' },
      stdio: 'pipe',
      detached: false
    });

    // 서버 시작 로그 확인
    let serverReady = false;
    const timeout = 60000; // 60초 타임아웃
    const startTime = Date.now();

    return new Promise<void>((resolve, reject) => {
      const checkTimeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('테스트 서버 시작 타임아웃 (60초)'));
        }
      }, timeout);

      serverProcess.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`📡 서버: ${output.trim()}`);
        
        // Next.js 서버가 준비되었는지 확인
        if (output.includes('Ready in') || output.includes('Local:') || output.includes('localhost:3002')) {
          if (!serverReady) {
            serverReady = true;
            clearTimeout(checkTimeout);
            console.log('✅ 테스트 서버가 http://localhost:3002에서 시작되었습니다.');
            resolve();
          }
        }
      });

      serverProcess.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        console.log(`🚨 서버 에러: ${output.trim()}`);
        
        // 에러가 있어도 서버가 시작될 수 있으므로 계속 진행
        if (output.includes('EADDRINUSE')) {
          reject(new Error('포트 3002가 이미 사용 중입니다.'));
        }
      });

      serverProcess.on('error', (err: Error) => {
        clearTimeout(checkTimeout);
        reject(new Error(`서버 시작 실패: ${err.message}`));
      });

      // 서버 프로세스가 예상치 못하게 종료된 경우
      serverProcess.on('exit', (code: number) => {
        if (!serverReady) {
          clearTimeout(checkTimeout);
          reject(new Error(`서버가 코드 ${code}로 종료되었습니다.`));
        }
      });
    });

  } catch (error) {
    console.error('❌ 테스트 서버 시작 실패:', error);
    throw error;
  }
}

export async function teardown() {
  console.log('🛑 테스트 서버 종료 중...');
  
  if (serverProcess) {
    try {
      // 프로세스 그룹 전체 종료
      if (serverProcess.pid) {
        process.kill(-serverProcess.pid, 'SIGTERM');
      }
      
      // 2초 후에도 종료되지 않으면 강제 종료
      await sleep(2000);
      
      if (serverProcess && !serverProcess.killed) {
        if (serverProcess.pid) {
          process.kill(-serverProcess.pid, 'SIGKILL');
        }
      }
      
      console.log('✅ 테스트 서버가 종료되었습니다.');
    } catch (error) {
      console.error('⚠️ 서버 종료 중 오류:', error);
    }
  }

  // 포트 정리
  try {
    await execAsync('lsof -ti:3002 | xargs kill -9 2>/dev/null || true');
  } catch (e) {
    // 포트가 이미 정리됨
  }
}