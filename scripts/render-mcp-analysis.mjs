#!/usr/bin/env node

/**
 * 🌐 Render MCP 서버 컨텍스트 조회 분석 도구 (2025-06-29 오후 3:15 KST)
 */

import fetch from 'node-fetch';

const RENDER_SERVER = 'https://openmanager-vibe-v5.onrender.com';

console.log('🌐 Render MCP 서버 컨텍스트 조회 분석 시작');
console.log(`📅 분석 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
console.log(`🔗 대상 서버: ${RENDER_SERVER}\n`);

// 1. 서버 상태 점검
async function checkServerStatus() {
    console.log('🏥 1. 서버 상태 점검');

    try {
        const startTime = Date.now();
        const response = await fetch(`${RENDER_SERVER}/`);
        const responseTime = Date.now() - startTime;

        if (response.ok) {
            const htmlContent = await response.text();
            const isRunning = htmlContent.includes('서버가 정상 작동 중입니다');

            console.log(`   ✅ 서버 온라인 (${responseTime}ms)`);
            console.log(`   🟢 MCP 서버 정상 작동: ${isRunning ? '예' : '아니오'}`);
            return true;
        } else {
            console.log(`   ❌ 서버 응답 오류: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log(`   ❌ 서버 오프라인: ${error.message}`);
        return false;
    }
}

// 2. MCP 도구 테스트
async function testMCPTools() {
    console.log('\n🛠️ 2. MCP 도구 테스트');

    const tools = [
        { name: 'list_directory', payload: { path: '.' } },
        { name: 'search_files', payload: { pattern: '*.js' } },
        { name: 'search_files', payload: { pattern: '*.md' } },
        { name: 'get_file_info', payload: { path: 'server.js' } }
    ];

    const results = [];

    for (const tool of tools) {
        try {
            console.log(`   🔍 ${tool.name} 테스트 중...`);

            const startTime = Date.now();
            const response = await fetch(`${RENDER_SERVER}/mcp/tools/${tool.name}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(tool.payload)
            });

            const responseTime = Date.now() - startTime;
            const result = await response.json();

            if (result.success) {
                const itemCount = result.count || (result.content ? 1 : 0) || 0;
                console.log(`     ✅ 성공: ${itemCount}개 항목 (${responseTime}ms)`);
                results.push({ tool: tool.name, success: true, itemCount, responseTime });
            } else {
                console.log(`     ⚠️ 실패: ${result.error} (${responseTime}ms)`);
                results.push({ tool: tool.name, success: false, error: result.error, responseTime });
            }

        } catch (error) {
            console.log(`     ❌ 네트워크 오류: ${error.message}`);
            results.push({ tool: tool.name, success: false, error: error.message });
        }
    }

    return results;
}

// 3. 컨텍스트 품질 평가
async function evaluateContextQuality() {
    console.log('\n📚 3. 컨텍스트 품질 평가');

    try {
        // 프로젝트 구조 확인
        const structureResponse = await fetch(`${RENDER_SERVER}/mcp/tools/list_directory`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ path: '.' })
        });

        const structureResult = await structureResponse.json();

        if (structureResult.success) {
            const files = structureResult.entries || [];
            console.log(`   📁 프로젝트 파일: ${files.length}개`);

            // 중요 파일 확인
            const importantFiles = ['package.json', 'server.js', 'health-check.js'];
            const foundFiles = files.filter(f => importantFiles.includes(f.name));
            console.log(`   📋 중요 파일: ${foundFiles.length}/${importantFiles.length}개 발견`);

            // 폴더 구조 확인
            const folders = files.filter(f => f.type === 'directory');
            console.log(`   📂 폴더: ${folders.length}개 (${folders.map(f => f.name).join(', ')})`);

            return {
                totalFiles: files.length,
                importantFiles: foundFiles.length,
                folders: folders.length,
                hasDocumentation: files.some(f => f.name.includes('md') || f.name === 'docs'),
                hasSource: files.some(f => f.name === 'src' || f.name.includes('js'))
            };
        } else {
            console.log(`   ❌ 구조 조회 실패: ${structureResult.error}`);
            return null;
        }

    } catch (error) {
        console.log(`   ❌ 품질 평가 실패: ${error.message}`);
        return null;
    }
}

// 4. 성능 측정
async function measurePerformance() {
    console.log('\n⚡ 4. 성능 측정');

    const testCount = 3;
    const times = [];

    console.log(`   📊 ${testCount}회 연속 요청 테스트 중...`);

    for (let i = 0; i < testCount; i++) {
        try {
            const startTime = Date.now();
            const response = await fetch(`${RENDER_SERVER}/mcp/tools/list_directory`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: '.' })
            });
            const responseTime = Date.now() - startTime;
            times.push(responseTime);

            console.log(`     ${i + 1}회차: ${responseTime}ms`);
        } catch (error) {
            console.log(`     ${i + 1}회차: 실패 - ${error.message}`);
        }
    }

    if (times.length > 0) {
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);

        console.log(`   📈 평균: ${avgTime.toFixed(0)}ms, 최소: ${minTime}ms, 최대: ${maxTime}ms`);
        return { average: avgTime, min: minTime, max: maxTime };
    } else {
        console.log(`   ❌ 성능 측정 실패`);
        return null;
    }
}

// 5. 종합 분석 및 권장사항
function generateReport(serverStatus, toolResults, contextQuality, performance) {
    console.log('\n📋 5. 종합 분석 결과');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // 서버 상태
    console.log(`🟢 서버 상태: ${serverStatus ? '정상 온라인' : '오프라인/오류'}`);

    // 도구 가용성
    const workingTools = toolResults.filter(t => t.success).length;
    console.log(`🛠️ 도구 가용성: ${workingTools}/${toolResults.length}개 정상 작동`);

    // 컨텍스트 품질
    if (contextQuality) {
        console.log(`📚 컨텍스트 품질:`);
        console.log(`   - 총 파일: ${contextQuality.totalFiles}개`);
        console.log(`   - 중요 파일: ${contextQuality.importantFiles}/3개`);
        console.log(`   - 폴더: ${contextQuality.folders}개`);
        console.log(`   - 문서 파일: ${contextQuality.hasDocumentation ? '있음' : '없음'}`);
        console.log(`   - 소스 코드: ${contextQuality.hasSource ? '있음' : '없음'}`);
    }

    // 성능
    if (performance) {
        console.log(`⚡ 성능: 평균 ${performance.average.toFixed(0)}ms`);
    }

    // 문제점 및 권장사항
    console.log('\n💡 권장사항:');

    if (!serverStatus) {
        console.log('   1. Render 서버 재시작 필요');
    }

    if (workingTools < toolResults.length) {
        const failedTools = toolResults.filter(t => !t.success);
        console.log(`   2. 실패한 도구 수정 필요: ${failedTools.map(t => t.tool).join(', ')}`);
    }

    if (contextQuality && contextQuality.totalFiles < 5) {
        console.log('   3. 프로젝트 파일 업로드 확인 필요 (docs, src 폴더 누락 가능성)');
    }

    if (performance && performance.average > 2000) {
        console.log('   4. 응답시간 개선 필요 (현재 2초 초과)');
    }

    if (contextQuality && !contextQuality.hasDocumentation) {
        console.log('   5. 문서 파일(*.md) 업로드 권장 - 컨텍스트 품질 향상');
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📅 분석 완료: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
}

// 실행
async function main() {
    try {
        const serverStatus = await checkServerStatus();
        const toolResults = await testMCPTools();
        const contextQuality = await evaluateContextQuality();
        const performance = await measurePerformance();

        generateReport(serverStatus, toolResults, contextQuality, performance);

    } catch (error) {
        console.error('❌ 분석 중 오류 발생:', error);
    }
}

main(); 