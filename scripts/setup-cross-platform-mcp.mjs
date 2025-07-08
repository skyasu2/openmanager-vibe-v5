#!/usr/bin/env node

/**
 * 🌍 크로스 플랫폼 Everything MCP 자동 설정
 * OpenManager Vibe v5 - 다른 컴퓨터에서 Git 클론 후 자동 MCP 환경 구성
 * 
 * 지원 플랫폼: Windows, macOS, Linux
 * 지원 셸: PowerShell, Bash, Zsh
 */

import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';

class CrossPlatformMCPSetup {
    constructor() {
        this.platform = os.platform();
        this.homeDir = os.homedir();
        this.projectRoot = process.cwd();
        this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');

        console.log(`🚀 크로스 플랫폼 Everything MCP 설정 시작`);
        console.log(`📍 플랫폼: ${this.platform}`);
        console.log(`📁 프로젝트: ${this.projectRoot}\n`);
    }

    // 플랫폼별 Cursor 설정 경로 반환
    getCursorConfigPath() {
        switch (this.platform) {
            case 'win32':
                return path.join(this.homeDir, '.cursor', 'mcp.json');
            case 'darwin':
                return path.join(this.homeDir, 'Library', 'Application Support', 'Cursor', 'mcp.json');
            case 'linux':
                return path.join(this.homeDir, '.config', 'cursor', 'mcp.json');
            default:
                throw new Error(`❌ 지원하지 않는 운영체제: ${this.platform}`);
        }
    }

    // Everything MCP 글로벌 설정 템플릿
    getEverythingMCPConfig() {
        return {
            mcpServers: {
                everything: {
                    command: 'npx',
                    args: ['-y', '@modelcontextprotocol/server-everything'],
                    env: {
                        NODE_ENV: 'production',
                        EVERYTHING_ENABLE_ALL: 'true',
                        PROJECT_ROOT: this.projectRoot.replace(/\\/g, '/'),
                        BROWSER_ENABLED: 'true',
                        DB_TEST_MODE: 'false',
                        MEMORY_LIMIT: '1GB',
                        TIMEOUT: '30000'
                    }
                }
            },
            metadata: {
                version: '3.0',
                type: 'everything-mcp-global',
                created: new Date().toISOString(),
                description: 'Everything MCP 글로벌 설정 (크로스 플랫폼)',
                platform: this.platform,
                projectPath: this.projectRoot
            }
        };
    }

    // 필수 패키지 설치 확인
    async checkRequiredPackages() {
        console.log('📦 필수 패키지 확인...');

        try {
            // Everything MCP 패키지 확인
            execSync('npx -y @modelcontextprotocol/server-everything --help', {
                stdio: 'pipe',
                timeout: 30000
            });
            console.log('  ✅ @modelcontextprotocol/server-everything 사용 가능');
            return true;
        } catch {
            console.log('  ⚠️ Everything MCP 패키지 첫 실행 시 자동 설치됩니다');
            return true; // npx가 자동으로 설치하므로 계속 진행
        }
    }

    // 기존 설정 백업
    async backupExistingConfig() {
        const globalConfigPath = this.getCursorConfigPath();

        if (fs.existsSync(globalConfigPath)) {
            const backupPath = `${globalConfigPath}.backup.${this.timestamp}`;
            fs.copyFileSync(globalConfigPath, backupPath);
            console.log(`💾 기존 글로벌 설정 백업: ${backupPath}`);

            // 기존 설정 분석
            try {
                const oldConfig = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));
                const oldServerCount = Object.keys(oldConfig.mcpServers || {}).length;
                console.log(`📊 기존 서버 수: ${oldServerCount}개`);
            } catch {
                console.log('⚠️ 기존 설정 파일 분석 실패');
            }
        }

        // 프로젝트별 설정도 백업 (있는 경우)
        const projectConfigPath = path.join(this.projectRoot, '.cursor', 'mcp.json');
        if (fs.existsSync(projectConfigPath)) {
            const projectBackupPath = `${projectConfigPath}.backup.${this.timestamp}`;
            fs.copyFileSync(projectConfigPath, projectBackupPath);
            console.log(`💾 기존 프로젝트 설정 백업: ${projectBackupPath}`);
        }
    }

    // 글로벌 Everything MCP 설정 적용
    async applyGlobalConfig() {
        console.log('🌍 글로벌 Everything MCP 설정 적용...');

        const globalConfigPath = this.getCursorConfigPath();
        const configDir = path.dirname(globalConfigPath);

        // 설정 디렉토리 생성 (없는 경우)
        if (!fs.existsSync(configDir)) {
            fs.mkdirSync(configDir, { recursive: true });
            console.log(`📁 설정 디렉토리 생성: ${configDir}`);
        }

        // Everything MCP 설정 적용
        const config = this.getEverythingMCPConfig();
        fs.writeFileSync(globalConfigPath, JSON.stringify(config, null, 2));
        console.log(`✅ 글로벌 설정 적용: ${globalConfigPath}`);

        return globalConfigPath;
    }

    // 프로젝트별 설정 제거 (충돌 방지)
    async removeProjectConfig() {
        const projectConfigPath = path.join(this.projectRoot, '.cursor', 'mcp.json');

        if (fs.existsSync(projectConfigPath)) {
            // 백업은 이미 했으므로 삭제
            fs.unlinkSync(projectConfigPath);
            console.log('🗑️ 프로젝트별 설정 제거 (충돌 방지)');
        }
    }

    // package.json에 MCP 관리 스크립트 추가
    async updatePackageScripts() {
        console.log('📝 package.json 스크립트 업데이트...');

        const packageJsonPath = path.join(this.projectRoot, 'package.json');
        if (!fs.existsSync(packageJsonPath)) {
            console.log('⚠️ package.json을 찾을 수 없습니다');
            return;
        }

        try {
            const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

            // MCP 관련 스크립트 추가/업데이트
            const mcpScripts = {
                'mcp:setup': 'node scripts/setup-cross-platform-mcp.mjs',
                'mcp:status': 'node scripts/test-everything-mcp.js',
                'mcp:health': 'npx -y @modelcontextprotocol/server-everything --help',
                'postinstall': 'npm run mcp:setup'
            };

            packageJson.scripts = { ...packageJson.scripts, ...mcpScripts };

            fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
            console.log('  ✅ package.json 스크립트 업데이트 완료');

        } catch (error) {
            console.log(`⚠️ package.json 업데이트 실패: ${error.message}`);
        }
    }

    // 설정 검증
    async validateSetup() {
        console.log('🔍 설정 검증...');

        const globalConfigPath = this.getCursorConfigPath();

        try {
            const config = JSON.parse(fs.readFileSync(globalConfigPath, 'utf8'));

            // 기본 구조 검증
            if (!config.mcpServers || !config.mcpServers.everything) {
                throw new Error('Everything MCP 서버 설정이 없습니다');
            }

            // 환경변수 검증
            const env = config.mcpServers.everything.env;
            if (!env || !env.PROJECT_ROOT) {
                throw new Error('PROJECT_ROOT 환경변수가 설정되지 않았습니다');
            }

            console.log('  ✅ 설정 구조 유효');
            console.log(`  ✅ 프로젝트 경로: ${env.PROJECT_ROOT}`);
            console.log(`  ✅ 환경: ${env.NODE_ENV}`);

            return true;

        } catch (error) {
            console.log(`  ❌ 설정 검증 실패: ${error.message}`);
            return false;
        }
    }

    // 사용자 가이드 출력
    printSetupGuide() {
        console.log('\n🎉 크로스 플랫폼 Everything MCP 설정 완료!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        console.log('\n📋 설정 요약:');
        console.log('  🌍 글로벌 Everything MCP 설정 적용');
        console.log('  🗑️ 프로젝트별 설정 제거 (충돌 방지)');
        console.log('  📦 package.json 스크립트 업데이트');
        console.log('  💾 기존 설정 안전 백업');

        console.log('\n🔄 다음 단계:');
        console.log('  1. Cursor IDE 재시작');
        console.log('  2. Cmd/Ctrl+Shift+P → "MCP" 검색');
        console.log('  3. "everything" 서버 상태 확인');
        console.log('  4. npm run mcp:status로 상태 점검');

        console.log('\n🛠️ 유용한 명령어:');
        console.log('  npm run mcp:setup    # MCP 재설정');
        console.log('  npm run mcp:status   # 상태 확인');
        console.log('  npm run mcp:health   # 헬스체크');

        console.log('\n🌟 Everything MCP 기능:');
        console.log('  📁 filesystem: 파일 시스템 접근');
        console.log('  🧠 memory: 지식 그래프 관리');
        console.log('  🔍 search: 웹 검색 (DuckDuckGo)');
        console.log('  🗄️ database: PostgreSQL, SQLite');
        console.log('  🐙 github: Git/GitHub 연동');
        console.log('  🌐 fetch: HTTP 요청');
        console.log('  🌐 browser: 브라우저 자동화');
        console.log('  ⏰ time: 날짜/시간 처리');

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    // 메인 설정 프로세스
    async setup() {
        try {
            console.log('🔧 크로스 플랫폼 Everything MCP 자동 설정 시작\n');

            // 1. 필수 패키지 확인
            await this.checkRequiredPackages();

            // 2. 기존 설정 백업
            await this.backupExistingConfig();

            // 3. 글로벌 설정 적용
            await this.applyGlobalConfig();

            // 4. 프로젝트별 설정 제거
            await this.removeProjectConfig();

            // 5. package.json 업데이트
            await this.updatePackageScripts();

            // 6. 설정 검증
            const isValid = await this.validateSetup();
            if (!isValid) {
                throw new Error('설정 검증 실패');
            }

            // 7. 사용자 가이드 출력
            this.printSetupGuide();

            return true;

        } catch (error) {
            console.error(`\n❌ 설정 실패: ${error.message}`);
            console.error('\n🔧 수동 설정이 필요할 수 있습니다.');
            return false;
        }
    }
}

// 메인 실행
async function main() {
    const setup = new CrossPlatformMCPSetup();
    const success = await setup.setup();
    process.exit(success ? 0 : 1);
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export default CrossPlatformMCPSetup; 