#!/usr/bin/env node

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 MCP 서버 시작 매니저');
console.log('=' + '='.repeat(30));

// 로컬 MCP 서버 시작
function startLocalMCPServer() {
    console.log('\n📦 로컬 MCP 서버 시작 중...');
    
    // 기존 프로세스 확인
    try {
        const response = execSync('curl -s http://localhost:3100/health', { timeout: 2000 });
        console.log('✅ 로컬 MCP 서버가 이미 실행 중입니다.');
        return;
    } catch {
        // 서버가 실행되지 않음, 시작
    }
    
    if (!fs.existsSync('./mcp-servers/gemini-cli-bridge/src/index.js')) {
        console.error('❌ MCP 서버 파일을 찾을 수 없습니다.');
        process.exit(1);
    }
    
    try {
        const serverProcess = spawn('node', ['./mcp-servers/gemini-cli-bridge/src/index.js'], {
            detached: true,
            stdio: ['ignore', 'pipe', 'pipe'],
            cwd: process.cwd()
        });
        
        console.log(`🟢 로컬 MCP 서버 프로세스 시작됨 (PID: ${serverProcess.pid})`);
        
        // 로그 출력
        serverProcess.stdout.on('data', (data) => {
            console.log(`[MCP Local] ${data.toString().trim()}`);
        });
        
        serverProcess.stderr.on('data', (data) => {
            console.error(`[MCP Error] ${data.toString().trim()}`);
        });
        
        // 프로세스 분리
        serverProcess.unref();
        
        // 상태 확인
        setTimeout(() => {
            try {
                const healthCheck = execSync('curl -s http://localhost:3100/health', { timeout: 3000 });
                console.log('✅ 로컬 MCP 서버 시작 확인됨');
                console.log('🌐 헬스체크: http://localhost:3100/health');
            } catch {
                console.log('⚠️  서버 상태 확인 실패 - 수동으로 확인해주세요');
            }
        }, 3000);
        
    } catch (error) {
        console.error('❌ 로컬 MCP 서버 시작 실패:', error.message);
    }
}

// NPM 패키지 기반 MCP 서버들 상태 확인
function checkNpmServers() {
    console.log('\n📋 NPM MCP 서버 상태 확인...');
    
    const packages = [
        '@modelcontextprotocol/server-filesystem',
        'duckduckgo-mcp-server', 
        '@modelcontextprotocol/server-sequential-thinking',
        '@heilgar/shadcn-ui-mcp-server'
    ];
    
    packages.forEach(pkg => {
        try {
            execSync(`npm list ${pkg}`, { stdio: 'ignore' });
            console.log(`✅ ${pkg} - 설치됨`);
        } catch {
            console.log(`⚠️  ${pkg} - 설치 필요 (첫 사용 시 자동 설치)`);
        }
    });
}

// 설정 파일 확인
function checkConfiguration() {
    console.log('\n⚙️  설정 파일 확인...');
    
    if (!fs.existsSync('./cursor.mcp.json')) {
        console.log('❌ cursor.mcp.json 파일이 없습니다!');
        return false;
    }
    
    try {
        const config = JSON.parse(fs.readFileSync('./cursor.mcp.json', 'utf8'));
        const enabledServers = Object.entries(config.mcpServers || {})
            .filter(([_, server]) => server.enabled);
        
        console.log(`✅ ${enabledServers.length}개의 활성화된 MCP 서버:`);
        enabledServers.forEach(([name, server]) => {
            console.log(`   🟢 ${name}: ${server.description || 'N/A'}`);
        });
        
        return true;
    } catch (error) {
        console.log('❌ 설정 파일 파싱 오류:', error.message);
        return false;
    }
}

// PID 파일 관리
function managePIDFile(pid) {
    const pidFile = './logs/mcp-server.pid';
    const logDir = path.dirname(pidFile);
    
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(pidFile, pid.toString());
    console.log(`📄 PID 파일 저장됨: ${pidFile}`);
}

// 가이드 출력
function showUsageGuide() {
    console.log('\n📖 사용 가이드');
    console.log('=' + '='.repeat(20));
    console.log('\n1️⃣  Cursor 재시작');
    console.log('   - 모든 MCP 서버가 설정되었습니다');
    console.log('   - Cursor를 완전히 종료하고 다시 시작하세요');
    
    console.log('\n2️⃣  MCP 기능 테스트');
    console.log('   - 채팅에서 @ 명령어 사용:');
    console.log('     @filesystem - 파일 시스템 접근');
    console.log('     @duckduckgo-search - 웹 검색');
    console.log('     @sequential-thinking - 단계별 분석');
    console.log('     @shadcn-ui - UI 컴포넌트 문서');
    console.log('     @openmanager-local - 로컬 서버 기능');
    
    console.log('\n3️⃣  상태 확인');
    console.log('   - npm run mcp:local:status - 로컬 서버 상태');
    console.log('   - npm run cursor:connect - 연결 확인');
    console.log('   - http://localhost:3100/health - 브라우저 확인');
    
    console.log('\n4️⃣  문제 해결');
    console.log('   - npm run cursor:fix - 자동 수정');
    console.log('   - npm run mcp:local:stop - 서버 정지');
    console.log('   - npm run mcp:local:start - 서버 시작');
}

// 메인 실행
async function main() {
    console.log('\n🔍 시스템 상태 확인 중...');
    
    const configOk = checkConfiguration();
    if (!configOk) {
        console.log('\n❌ 설정 오류. npm run cursor:fix를 실행하세요.');
        return;
    }
    
    checkNpmServers();
    startLocalMCPServer();
    showUsageGuide();
    
    console.log('\n🎉 MCP 서버 시작 완료!');
    console.log('Cursor를 재시작하여 MCP 기능을 사용하세요.');
}

main().catch(error => {
    console.error('\n❌ 오류 발생:', error.message);
    console.log('\n🔧 해결 방법:');
    console.log('1. npm run cursor:fix');
    console.log('2. npm run cursor:connect');
    console.log('3. Cursor 재시작');
}); 