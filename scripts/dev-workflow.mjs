#!/usr/bin/env node

/**
 * 🚀 OpenManager Vibe v5 개발 워크플로우
 * GCP MCP ↔ Vercel 배포 연동 개발 환경
 */

import fetch from 'node-fetch';
import { spawn } from 'child_process';

const CONFIG = {
    // 로컬 개발 서버
    LOCAL_DEV: 'http://localhost:3000',
    LOCAL_MCP: 'http://localhost:3100',

    // GCP MCP 서버 (실제 배포 후 업데이트 필요)
    GCP_MCP: 'https://openmanager-mcp-server.gcp.run',

    // Vercel 배포 URL (실제 배포 후 업데이트 필요)
    VERCEL_PROD: 'https://openmanager-vibe-v5.vercel.app',

    // 테스트 엔드포인트들
    ENDPOINTS: {
        health: '/health',
        mcpStatus: '/api/mcp/monitoring',
        aiEngines: '/api/ai/engines/status',
        dashboard: '/api/dashboard'
    }
};

class DevWorkflow {
    constructor() {
        this.devServer = null;
        this.mcpServer = null;
    }

    async startLocalDev() {
        console.log('🔥 로컬 개발 서버 시작...');

        return new Promise((resolve) => {
            this.devServer = spawn('npm', ['run', 'dev'], {
                stdio: 'pipe',
                shell: true
            });

            this.devServer.stdout.on('data', (data) => {
                const output = data.toString();
                console.log(`📡 DEV: ${output.trim()}`);

                if (output.includes('Ready in') || output.includes('started server')) {
                    resolve(true);
                }
            });

            setTimeout(resolve, 15000); // 15초 후 강제 resolve
        });
    }

    async startMCPServer() {
        console.log('🤖 MCP 서버 시작... (gemini-cli-bridge 제외됨)');
        console.log('ℹ️  Gemini 기능은 ./tools/g 사용 권장');

        return new Promise((resolve) => {
            // gemini-cli-bridge는 MCP 지원 중단됨
            // 다른 MCP 서버만 시작하거나 스킵
            resolve();
            
            /* 기존 코드 (참고용)
            this.mcpServer = spawn('node', ['mcp-servers/gemini-cli-bridge/src/index.js'], {
                stdio: 'pipe',
                shell: true,
                env: {
                    ...process.env,
                    PORT: '3100',
                    AI_ENGINE_MODE: 'development'
                }
            });

            this.mcpServer.stdout.on('data', (data) => {
                console.log(`🤖 MCP: ${data.toString().trim()}`);
            });

            setTimeout(resolve, 5000); // 5초 후 resolve
            */
        });
    }

    async testConnections() {
        console.log('\n🔍 연결 상태 테스트...');

        const tests = [
            { name: '로컬 개발 서버', url: CONFIG.LOCAL_DEV + CONFIG.ENDPOINTS.health },
            { name: '로컬 MCP 서버', url: CONFIG.LOCAL_MCP + CONFIG.ENDPOINTS.health },
            { name: 'MCP 상태 API', url: CONFIG.LOCAL_DEV + CONFIG.ENDPOINTS.mcpStatus },
            { name: 'AI 엔진 상태', url: CONFIG.LOCAL_DEV + CONFIG.ENDPOINTS.aiEngines },
        ];

        for (const test of tests) {
            try {
                const response = await fetch(test.url, { timeout: 5000 });
                const status = response.ok ? '✅' : '⚠️';
                console.log(`${status} ${test.name}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
    }

    async deployToRender() {
        console.log('\n🚀 Render 배포 시작...');

        // Git push를 통한 자동 배포 (render.yaml 설정 기반)
        return new Promise((resolve) => {
            const deploy = spawn('git', ['push', 'origin', 'main'], {
                stdio: 'inherit',
                shell: true
            });

            deploy.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Render 배포 완료 (자동 배포 트리거됨)');
                } else {
                    console.log('❌ Git push 실패');
                }
                resolve(code === 0);
            });
        });
    }

    async deployToVercel() {
        console.log('\n🚀 Vercel 배포 시작...');

        return new Promise((resolve) => {
            const deploy = spawn('npx', ['vercel', '--prod', '--yes'], {
                stdio: 'inherit',
                shell: true
            });

            deploy.on('close', (code) => {
                if (code === 0) {
                    console.log('✅ Vercel 배포 완료');
                } else {
                    console.log('❌ Vercel 배포 실패');
                }
                resolve(code === 0);
            });
        });
    }

    async testProductionConnections() {
        console.log('\n🌐 프로덕션 연결 테스트...');

        const prodTests = [
            { name: 'GCP MCP 서버', url: CONFIG.GCP_MCP + CONFIG.ENDPOINTS.health },
            { name: 'Vercel 메인 앱', url: CONFIG.VERCEL_PROD + CONFIG.ENDPOINTS.health },
            { name: 'Vercel → GCP 통신', url: CONFIG.VERCEL_PROD + CONFIG.ENDPOINTS.mcpStatus },
        ];

        for (const test of prodTests) {
            try {
                const response = await fetch(test.url, { timeout: 10000 });
                const status = response.ok ? '✅' : '⚠️';
                console.log(`${status} ${test.name}: ${response.status}`);
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
            }
        }
    }

    async runDevelopmentCycle() {
        console.log('🎯 완전한 개발 사이클 시작\n');

        // 1. 로컬 개발 환경 시작
        await this.startLocalDev();
        await this.startMCPServer();

        // 2. 로컬 연결 테스트
        await new Promise(resolve => setTimeout(resolve, 3000));
        await this.testConnections();

        console.log('\n📝 개발 준비 완료! 다음 단계:');
        console.log('1. 로컬에서 개발 & 테스트');
        console.log('2. npm run deploy:gcp - GCP MCP 서버 배포');
        console.log('3. npm run deploy:vercel - Vercel 메인 앱 배포');
        console.log('4. npm run test:production - 프로덕션 연결 테스트');

        return true;
    }

    cleanup() {
        if (this.devServer) {
            this.devServer.kill();
            console.log('🔴 개발 서버 종료');
        }
        if (this.mcpServer) {
            this.mcpServer.kill();
            console.log('🔴 MCP 서버 종료');
        }
    }
}

// 메인 실행
const workflow = new DevWorkflow();

const command = process.argv[2] || 'dev';

switch (command) {
    case 'dev':
    case 'development':
        workflow.runDevelopmentCycle();
        break;
    case 'deploy:render':
        workflow.deployToRender();
        break;
    case 'deploy:vercel':
        workflow.deployToVercel();
        break;
    case 'test:production':
        workflow.testProductionConnections();
        break;
    case 'test:local':
        workflow.testConnections();
        break;
    default:
        console.log('사용법: node scripts/dev-workflow.mjs [dev|deploy:render|deploy:vercel|test:production|test:local]');
}

// 프로세스 종료 시 정리
process.on('SIGINT', () => {
    console.log('\n🔴 개발 워크플로우 종료...');
    workflow.cleanup();
    process.exit(0);
});

process.on('SIGTERM', () => {
    workflow.cleanup();
    process.exit(0);
}); 