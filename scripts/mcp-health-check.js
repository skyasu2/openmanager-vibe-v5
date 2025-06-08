#!/usr/bin/env node

/**
 * MCP 서버 상태 확인 및 관리 스크립트
 * 
 * 기능:
 * - 활성 MCP 서버 목록 확인
 * - 중복 서버 감지
 * - 서버 상태 모니터링
 * - 자동 정리 기능
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

class MCPHealthChecker {
    constructor() {
        this.configPath = path.join(process.cwd(), 'cursor.mcp.json');
        this.inactiveConfigPath = path.join(process.cwd(), 'mcp-configs-inactive.json');
    }

    /**
     * 현재 활성 MCP 서버 목록 출력
     */
    listActiveServers() {
        try {
            const config = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            console.log('🟢 **활성 MCP 서버 목록**');
            console.log('================================');
            
            Object.entries(config.mcpServers).forEach(([name, server], index) => {
                console.log(`${index + 1}. **${name}**`);
                console.log(`   📝 설명: ${server.description || '설명 없음'}`);
                console.log(`   🔧 명령어: ${server.command} ${server.args.join(' ')}`);
                console.log(`   📁 작업 디렉토리: ${server.cwd || '.'}`);
                console.log('');
            });
            
            return Object.keys(config.mcpServers);
        } catch (error) {
            console.error('❌ MCP 설정 파일을 읽을 수 없습니다:', error.message);
            return [];
        }
    }

    /**
     * 비활성 MCP 서버 목록 출력
     */
    listInactiveServers() {
        try {
            const config = JSON.parse(fs.readFileSync(this.inactiveConfigPath, 'utf8'));
            console.log('🔴 **비활성 MCP 서버 목록**');
            console.log('================================');
            
            Object.entries(config.inactive_mcpServers).forEach(([name, server], index) => {
                console.log(`${index + 1}. **${name}**`);
                console.log(`   📝 설명: ${server.description}`);
                console.log(`   ⚠️  비활성 이유: ${server.reason}`);
                console.log(`   🔧 명령어: ${server.command} ${server.args.join(' ')}`);
                console.log('');
            });
            
            return Object.keys(config.inactive_mcpServers);
        } catch (error) {
            console.error('❌ 비활성 MCP 설정 파일을 읽을 수 없습니다:', error.message);
            return [];
        }
    }

    /**
     * MCP 서버 활성화
     */
    activateServer(serverName) {
        try {
            const inactiveConfig = JSON.parse(fs.readFileSync(this.inactiveConfigPath, 'utf8'));
            const activeConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!inactiveConfig.inactive_mcpServers[serverName]) {
                console.error(`❌ 서버 '${serverName}'을 찾을 수 없습니다.`);
                return false;
            }
            
            if (activeConfig.mcpServers[serverName]) {
                console.error(`❌ 서버 '${serverName}'이 이미 활성화되어 있습니다.`);
                return false;
            }
            
            // 비활성에서 활성으로 이동
            const server = inactiveConfig.inactive_mcpServers[serverName];
            delete server.status;
            delete server.reason;
            
            activeConfig.mcpServers[serverName] = server;
            delete inactiveConfig.inactive_mcpServers[serverName];
            
            // 파일 저장
            fs.writeFileSync(this.configPath, JSON.stringify(activeConfig, null, 2));
            fs.writeFileSync(this.inactiveConfigPath, JSON.stringify(inactiveConfig, null, 2));
            
            console.log(`✅ 서버 '${serverName}'이 활성화되었습니다.`);
            console.log('🔄 Cursor를 재시작하여 변경사항을 적용하세요.');
            return true;
        } catch (error) {
            console.error('❌ 서버 활성화 중 오류:', error.message);
            return false;
        }
    }

    /**
     * MCP 서버 비활성화
     */
    deactivateServer(serverName, reason = '사용자 요청') {
        try {
            const inactiveConfig = JSON.parse(fs.readFileSync(this.inactiveConfigPath, 'utf8'));
            const activeConfig = JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
            
            if (!activeConfig.mcpServers[serverName]) {
                console.error(`❌ 활성 서버 '${serverName}'을 찾을 수 없습니다.`);
                return false;
            }
            
            // 활성에서 비활성으로 이동
            const server = activeConfig.mcpServers[serverName];
            server.status = 'inactive';
            server.reason = reason;
            
            inactiveConfig.inactive_mcpServers[serverName] = server;
            delete activeConfig.mcpServers[serverName];
            
            // 파일 저장
            fs.writeFileSync(this.configPath, JSON.stringify(activeConfig, null, 2));
            fs.writeFileSync(this.inactiveConfigPath, JSON.stringify(inactiveConfig, null, 2));
            
            console.log(`✅ 서버 '${serverName}'이 비활성화되었습니다.`);
            console.log(`📝 이유: ${reason}`);
            console.log('🔄 Cursor를 재시작하여 변경사항을 적용하세요.');
            return true;
        } catch (error) {
            console.error('❌ 서버 비활성화 중 오류:', error.message);
            return false;
        }
    }

    /**
     * 종합 상태 보고서
     */
    generateStatusReport() {
        console.log('🔍 **MCP 서버 상태 보고서**');
        console.log('============================');
        console.log('');
        
        const activeServers = this.listActiveServers();
        console.log('');
        
        const inactiveServers = this.listInactiveServers();
        console.log('');
        
        console.log('📊 **요약**');
        console.log('============');
        console.log(`✅ 활성 서버: ${activeServers.length}개`);
        console.log(`🔴 비활성 서버: ${inactiveServers.length}개`);
        console.log(`📝 총 서버: ${activeServers.length + inactiveServers.length}개`);
        console.log('');
        
        console.log('💡 **권장사항**');
        console.log('================');
        console.log('- Cursor를 재시작하여 최신 MCP 설정을 적용하세요');
        console.log('- 불필요한 서버는 비활성화하여 성능을 최적화하세요');
        console.log('- API 키가 필요한 서버는 키 설정 후 활성화하세요');
    }
}

// CLI 실행
if (require.main === module) {
    const checker = new MCPHealthChecker();
    const args = process.argv.slice(2);
    
    switch (args[0]) {
        case 'list':
        case 'status':
            checker.generateStatusReport();
            break;
        case 'activate':
            if (args[1]) {
                checker.activateServer(args[1]);
            } else {
                console.error('❌ 활성화할 서버 이름을 지정하세요.');
                console.log('사용법: node scripts/mcp-health-check.js activate [서버이름]');
            }
            break;
        case 'deactivate':
            if (args[1]) {
                const reason = args[2] || '사용자 요청';
                checker.deactivateServer(args[1], reason);
            } else {
                console.error('❌ 비활성화할 서버 이름을 지정하세요.');
                console.log('사용법: node scripts/mcp-health-check.js deactivate [서버이름] [이유]');
            }
            break;
        default:
            console.log('🚀 **MCP 헬스 체커**');
            console.log('====================');
            console.log('사용법:');
            console.log('  node scripts/mcp-health-check.js status     # 전체 상태 확인');
            console.log('  node scripts/mcp-health-check.js activate [서버이름]   # 서버 활성화');
            console.log('  node scripts/mcp-health-check.js deactivate [서버이름] # 서버 비활성화');
            console.log('');
            console.log('예시:');
            console.log('  node scripts/mcp-health-check.js activate 21st-dev-magic');
            console.log('  node scripts/mcp-health-check.js deactivate vercel-mcp');
            break;
    }
}

module.exports = MCPHealthChecker; 