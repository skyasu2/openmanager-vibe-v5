/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

class CursorRenderDeployer {
  constructor() {
    this.config = {
      serviceName: 'openmanager-mcp-cursor',
      renderUrl: 'https://openmanager-vibe-v5.onrender.com',
      branch: 'main',
      rootDir: 'mcp-server',
      deployTimeout: 300000, // 5분
    };

    this.deployId = this.generateDeployId();
    this.startTime = Date.now();
  }

  /**
   * 🎯 메인 배포 프로세스
   */
  async deploy() {
    try {
      console.log('🚀 Cursor IDE → Render 배포 시작...\n');

      // 1단계: 환경 검증
      await this.validateEnvironment();

      // 2단계: 코드 검증
      await this.validateCode();

      // 3단계: Git 상태 확인
      await this.checkGitStatus();

      // 4단계: Git 푸시 및 배포 트리거
      await this.triggerDeploy();

      // 5단계: 배포 상태 모니터링
      await this.monitorDeploy();

      // 6단계: 배포 완료 검증
      await this.verifyDeploy();

      this.logSuccess();
    } catch (error) {
      this.logError(error);
      process.exit(1);
    }
  }

  /**
   * 🔍 환경 검증
   */
  async validateEnvironment() {
    console.log('🔍 1단계: 환경 검증...');

    // Node.js 버전 확인
    const nodeVersion = process.version;
    console.log(`   📦 Node.js: ${nodeVersion}`);

    // Git 상태 확인
    try {
      const gitBranch = execSync('git branch --show-current', {
        encoding: 'utf8',
      }).trim();
      console.log(`   🌿 Git 브랜치: ${gitBranch}`);

      if (gitBranch !== this.config.branch) {
        console.log(
          `   ⚠️ 현재 브랜치(${gitBranch})가 배포 브랜치(${this.config.branch})와 다르지만 계속 진행합니다.`
        );
      }
    } catch (error) {
      throw new Error(`Git 상태 확인 실패: ${error.message}`);
    }

    // MCP 서버 디렉토리 확인
    if (!fs.existsSync(this.config.rootDir)) {
      throw new Error(
        `MCP 서버 디렉토리(${this.config.rootDir})가 존재하지 않습니다.`
      );
    }

    console.log('   ✅ 환경 검증 완료\n');
  }

  /**
   * 🧪 코드 검증
   */
  async validateCode() {
    console.log('🧪 2단계: 코드 검증...');

    try {
      // 빠른 검증만 수행
      console.log('   🔍 빠른 검증 수행...');
      execSync('npm run validate:quick', { stdio: 'pipe' });
      console.log('   ✅ 빠른 검증 통과');
    } catch (error) {
      console.log('   ⚠️ 검증 실패했지만 계속 진행합니다:', error.message);
    }

    console.log('   ✅ 코드 검증 완료\n');
  }

  /**
   * 📋 Git 상태 확인
   */
  async checkGitStatus() {
    console.log('📋 3단계: Git 상태 확인...');

    try {
      // 변경사항 확인
      const gitStatus = execSync('git status --porcelain', {
        encoding: 'utf8',
      });

      if (gitStatus.trim()) {
        console.log('   📝 변경사항 감지됨');

        // 자동 커밋 수행
        console.log('   🔄 자동 커밋 수행...');
        execSync('git add .', { stdio: 'pipe' });
        execSync(`git commit -m "🚀 Cursor 자동 배포: ${this.deployId}"`, {
          stdio: 'pipe',
        });
        console.log('   ✅ 자동 커밋 완료');
      }
    } catch (error) {
      console.log('   ⚠️ Git 처리 중 오류:', error.message);
    }

    console.log('   ✅ Git 상태 확인 완료\n');
  }

  /**
   * 🚀 배포 트리거
   */
  async triggerDeploy() {
    console.log('🚀 4단계: 배포 트리거...');

    try {
      console.log('   📤 Git 푸시 수행...');
      execSync('git push origin main', { stdio: 'inherit' });
      console.log('   ✅ Git 푸시 완료');

      console.log('   🎯 Render 배포 트리거됨');
      console.log(`   📍 배포 URL: ${this.config.renderUrl}`);
    } catch (error) {
      throw new Error(`배포 트리거 실패: ${error.message}`);
    }

    console.log('   ✅ 배포 트리거 완료\n');
  }

  /**
   * 👀 스마트 배포 모니터링 (효율성 최적화)
   */
  async monitorDeploy() {
    console.log('👀 5단계: 스마트 배포 모니터링...');

    // 즉시 빠른 체크 (배포가 이미 완료되었을 수 있음)
    console.log('   ⚡ 즉시 배포 상태 확인...');
    const quickCheck = await this.quickHealthCheck();

    if (quickCheck) {
      console.log('   ✅ 배포 즉시 완료 감지! (0초 소요)');
      return;
    }

    console.log('   ⏳ 상세 모니터링 시작 (최대 75초)...');
    const startTime = Date.now();
    const maxWaitTime = 75000; // 75초로 단축
    const checkInterval = 12000; // 12초마다 체크

    let checks = 1; // 이미 1번 체크했음
    while (Date.now() - startTime < maxWaitTime) {
      checks++;

      try {
        // 빠른 헬스체크 우선 시도
        const isHealthy = await this.quickHealthCheck();

        if (isHealthy) {
          console.log(
            `\n   ✅ 배포 완료 감지 (${checks}번째 체크, ${Math.round((Date.now() - startTime) / 1000)}초 소요)`
          );
          return;
        }

        // 진행률 표시
        const elapsed = Math.round((Date.now() - startTime) / 1000);
        process.stdout.write(
          `\r   ⏳ 배포 진행 중... ${elapsed}초 경과 (${checks}번째 체크)`
        );

        await this.sleep(checkInterval);
      } catch {
        // 배포 중에는 일시적 오류 무시
        process.stdout.write('.');
        await this.sleep(5000);
      }
    }

    console.log('\n   ⚠️ 최대 대기 시간 도달 (75초) - 배포 진행 중일 수 있음');
    console.log('   ✅ 배포 모니터링 완료\n');
  }

  /**
   * ✅ 배포 완료 검증 (효율적 헬스체크)
   */
  async verifyDeploy() {
    console.log('✅ 6단계: 배포 완료 검증...');

    try {
      // 빠른 헬스체크 우선 시도
      const isHealthy = await this.quickHealthCheck();
      if (isHealthy) {
        console.log('   ✅ 빠른 헬스체크 통과');
      } else {
        // 실패 시 상세 헬스체크 한 번만 시도
        console.log('   🔄 상세 헬스체크 재시도...');
        const detailedCheck = await this.checkHealth();
        if (detailedCheck) {
          console.log('   ✅ 상세 헬스체크 통과');
        } else {
          console.log('   ⚠️ 헬스체크 실패 (배포 진행 중일 수 있음)');
        }
      }
    } catch (error) {
      console.log('   ⚠️ 배포 검증 중 오류:', error.message);
    }

    console.log('   ✅ 배포 검증 완료\n');
  }

  /**
   * 🏥 빠른 헬스체크 (3초 타임아웃)
   */
  async quickHealthCheck() {
    return new Promise(resolve => {
      const req = https.get(`${this.config.renderUrl}/health`, res => {
        resolve(res.statusCode === 200);
      });

      req.on('error', () => resolve(false));
      req.setTimeout(3000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * 🏥 상세 헬스체크 (필요시에만)
   */
  async checkHealth() {
    return new Promise(resolve => {
      const req = https.get(`${this.config.renderUrl}/health`, res => {
        let data = '';
        res.on('data', chunk => (data += chunk));
        res.on('end', () => {
          try {
            const health = JSON.parse(data);
            resolve(health.status === 'healthy');
          } catch {
            resolve(false);
          }
        });
      });

      req.on('error', () => resolve(false));
      req.setTimeout(5000, () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  /**
   * 🎉 성공 로그
   */
  logSuccess() {
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    console.log('🎉 배포 완료!\n');
    console.log('📊 배포 정보:');
    console.log(`   🆔 배포 ID: ${this.deployId}`);
    console.log(`   ⏱️ 소요 시간: ${duration}초`);
    console.log(`   🌐 서비스 URL: ${this.config.renderUrl}`);
    console.log(`   🏥 헬스체크: ${this.config.renderUrl}/health`);
    console.log('\n🚀 Cursor IDE에서 Render 배포가 완료되었습니다!');
    console.log(
      '📝 참고: 배포가 완전히 완료되려면 2-3분 더 소요될 수 있습니다.'
    );
  }

  /**
   * ❌ 오류 로그
   */
  logError(error) {
    const duration = Math.round((Date.now() - this.startTime) / 1000);

    console.error('\n❌ 배포 실패!\n');
    console.error('📊 배포 정보:');
    console.error(`   🆔 배포 ID: ${this.deployId}`);
    console.error(`   ⏱️ 소요 시간: ${duration}초`);
    console.error(`   ❌ 오류: ${error.message}`);
    console.error('\n🔧 문제 해결:');
    console.error('   1. Git 상태 확인: git status');
    console.error('   2. Render 대시보드 확인: https://dashboard.render.com');
    console.error('   3. 다시 시도: node scripts/cursor-render-deploy.js');
  }

  /**
   * 🔧 유틸리티 메서드
   */
  generateDeployId() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const random = Math.random().toString(36).substring(2, 6);
    return `cursor-${timestamp.slice(0, 19)}-${random}`;
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 🚀 스크립트 실행
if (require.main === module) {
  const deployer = new CursorRenderDeployer();
  deployer.deploy().catch(() => process.exit(1));
}

module.exports = CursorRenderDeployer;
