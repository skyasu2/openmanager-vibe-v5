#!/usr/bin/env node

/**
 * 🔄 조건부 MCP 설정 스크립트
 * OpenManager Vibe v5 - 환경에 따라 MCP 설정 여부 결정
 * 
 * - Vercel/배포 환경: MCP 설정 건너뜀
 * - 로컬 개발 환경: MCP 자동 설정 실행
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class ConditionalMCPSetup {
    constructor() {
        this.isVercel = process.env.VERCEL === '1';
        this.isRender = process.env.RENDER === 'true';
        this.isCI = process.env.CI === 'true';
        this.isProduction = process.env.NODE_ENV === 'production';
        this.isDeployment = this.isVercel || this.isRender || this.isCI;

        console.log('🔍 환경 감지 결과:');
        console.log(`  📍 Vercel: ${this.isVercel ? '✅' : '❌'}`);
        console.log(`  📍 Render: ${this.isRender ? '✅' : '❌'}`);
        console.log(`  📍 CI/CD: ${this.isCI ? '✅' : '❌'}`);
        console.log(`  📍 Production: ${this.isProduction ? '✅' : '❌'}`);
        console.log(`  📍 배포 환경: ${this.isDeployment ? '✅' : '❌'}\n`);
    }

    async run() {
        try {
            if (this.isDeployment) {
                console.log('🚀 배포 환경 감지됨 - MCP 설정을 건너뜁니다');
                console.log('✅ Vercel/Render/CI 환경에서는 MCP가 필요하지 않습니다');

                // 배포 환경에서 필요한 최소한의 검증만 수행
                await this.validateDeploymentEnvironment();

                console.log('🎉 배포 환경 postinstall 완료');
                return;
            }

            console.log('🏠 로컬 개발 환경 감지됨 - MCP 설정을 시작합니다');

            // MCP 설정 스크립트 존재 여부 확인
            const mcpSetupScript = path.join(process.cwd(), 'scripts', 'setup-cross-platform-mcp.mjs');

            if (!fs.existsSync(mcpSetupScript)) {
                console.log('⚠️ MCP 설정 스크립트를 찾을 수 없습니다');
                console.log('   로컬 개발 시 수동으로 MCP를 설정해주세요');
                return;
            }

            // 로컬 환경에서 MCP 설정 실행
            console.log('🔧 MCP 자동 설정 실행 중...');
            execSync('node scripts/setup-cross-platform-mcp.mjs', {
                stdio: 'inherit',
                cwd: process.cwd()
            });

            console.log('✅ 로컬 개발 환경 MCP 설정 완료');

        } catch (error) {
            console.error('❌ MCP 설정 중 오류 발생:', error.message);

            if (this.isDeployment) {
                console.log('⚠️ 배포 환경에서는 MCP 오류를 무시하고 계속 진행합니다');
                return;
            }

            console.log('💡 로컬 개발 환경에서 MCP 설정에 실패했습니다');
            console.log('   개발을 계속하려면 수동으로 MCP를 설정하거나');
            console.log('   MCP 없이 개발을 진행할 수 있습니다');
        }
    }

    async validateDeploymentEnvironment() {
        console.log('🔍 배포 환경 기본 검증...');

        // package.json 존재 확인
        const packageJsonPath = path.join(process.cwd(), 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error('package.json을 찾을 수 없습니다');
        }

        // Next.js 설정 파일 확인
        const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
        if (!fs.existsSync(nextConfigPath)) {
            console.log('⚠️ next.config.mjs를 찾을 수 없습니다');
        }

        console.log('✅ 배포 환경 기본 검증 완료');
    }
}

// 스크립트 실행
const setup = new ConditionalMCPSetup();
setup.run().catch(error => {
    console.error('❌ 조건부 MCP 설정 실패:', error);
    process.exit(0); // 배포 환경에서는 실패해도 계속 진행
}); 