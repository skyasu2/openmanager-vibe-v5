#!/usr/bin/env node

/**
 * 🌐 Render MCP 서버 컨텍스트 조회 분석 도구
 * 2025-06-29 오후 3:15 (KST)
 * 
 * Render에 구성된 MCP 서버의 컨텍스트 조회 기능을 종합 분석합니다.
 */

import fetch from 'node-fetch';

const RENDER_SERVER = 'https://openmanager-vibe-v5.onrender.com';
const TEST_TIMEOUT = 15000; // 15초

class RenderMCPContextAnalyzer {
    constructor() {
        this.results = {
            serverStatus: null,
            availableTools: [],
            contextQueries: [],
            performance: {},
            issues: []
        };
    }

    async analyze() {
        console.log('🌐 Render MCP 서버 컨텍스트 조회 분석 시작');
        console.log(`📅 분석 시간: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
        console.log(`🔗 대상 서버: ${RENDER_SERVER}\n`);

        try {
            // 1. 서버 상태 점검
            await this.checkServerStatus();

            // 2. 사용 가능한 도구 점검
            await this.checkAvailableTools();

            // 3. 컨텍스트 조회 테스트
            await this.testContextQueries();

            // 4. 성능 측정
            await this.measurePerformance();

            // 5. 종합 분석 결과
            this.generateReport();

        } catch (error) {
            console.error('❌ 분석 중 오류 발생:', error.message);
            this.results.issues.push(`분석 오류: ${error.message}`);
        }
    }

    async checkServerStatus() {
        console.log('🏥 1. 서버 상태 점검');

        try {
            const startTime = Date.now();
            const response = await fetch(`${RENDER_SERVER}/`, {
                timeout: TEST_TIMEOUT,
                headers: { 'User-Agent': 'OpenManager-MCP-Analyzer/1.0' }
            });
            const responseTime = Date.now() - startTime;

            if (response.ok) {
                const htmlContent = await response.text();
                const isRunning = htmlContent.includes('서버가 정상 작동 중입니다');

                this.results.serverStatus = {
                    status: 'online',
                    responseTime: responseTime,
                    isRunning: isRunning,
                    statusCode: response.status
                };

                console.log(`   ✅ 서버 온라인 (${responseTime}ms)`);
                console.log(`   🟢 MCP 서버 정상 작동: ${isRunning ? '예' : '아니오'}`);
            } else {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }

        } catch (error) {
            this.results.serverStatus = { status: 'offline', error: error.message };
            this.results.issues.push(`서버 상태 점검 실패: ${error.message}`);
            console.log(`   ❌ 서버 오프라인: ${error.message}`);
        }
    }

    async checkAvailableTools() {
        console.log('\n🛠️ 2. 사용 가능한 도구 점검');

        const tools = [
            { name: 'list_directory', description: '디렉토리 목록 조회' },
            { name: 'read_file', description: '파일 내용 읽기' },
            { name: 'get_file_info', description: '파일 정보 조회' },
            { name: 'search_files', description: '파일 검색' }
        ];

        for (const tool of tools) {
            try {
                console.log(`   🔍 ${tool.name} 테스트 중...`);

                const testPayload = this.getTestPayload(tool.name);
                const startTime = Date.now();

                const response = await fetch(`${RENDER_SERVER}/mcp/tools/${tool.name}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'OpenManager-MCP-Analyzer/1.0'
                    },
                    body: JSON.stringify(testPayload),
                    timeout: TEST_TIMEOUT
                });

                const responseTime = Date.now() - startTime;
                const result = await response.json();

                this.results.availableTools.push({
                    name: tool.name,
                    description: tool.description,
                    available: response.ok,
                    responseTime: responseTime,
                    testResult: result,
                    status: result.success ? 'working' : 'error'
                });

                if (result.success) {
                    console.log(`     ✅ ${tool.name}: 정상 작동 (${responseTime}ms)`);
                } else {
                    console.log(`     ⚠️ ${tool.name}: ${result.error || '알 수 없는 오류'} (${responseTime}ms)`);
                }

            } catch (error) {
                this.results.availableTools.push({
                    name: tool.name,
                    description: tool.description,
                    available: false,
                    error: error.message,
                    status: 'failed'
                });
                console.log(`     ❌ ${tool.name}: ${error.message}`);
            }
        }
    }

    getTestPayload(toolName) {
        switch (toolName) {
            case 'list_directory':
                return { path: '.' };
            case 'read_file':
                return { path: 'package.json' };
            case 'get_file_info':
                return { path: 'server.js' };
            case 'search_files':
                return { pattern: '*.js' };
            default:
                return {};
        }
    }

    async testContextQueries() {
        console.log('\n📚 3. 컨텍스트 조회 테스트');

        const queries = [
            {
                name: '프로젝트 구조 조회',
                tool: 'list_directory',
                payload: { path: '.' },
                expected: '프로젝트 루트 파일들'
            },
            {
                name: '설정 파일 조회',
                tool: 'read_file',
                payload: { path: 'package.json' },
                expected: 'package.json 내용'
            },
            {
                name: 'JavaScript 파일 검색',
                tool: 'search_files',
                payload: { pattern: '*.js' },
                expected: 'JS 파일 목록'
            },
            {
                name: '문서 파일 검색',
                tool: 'search_files',
                payload: { pattern: '*.md' },
                expected: '마크다운 파일 목록'
            }
        ];

        for (const query of queries) {
            try {
                console.log(`   📋 ${query.name} 테스트 중...`);

                const startTime = Date.now();
                const response = await fetch(`${RENDER_SERVER}/mcp/tools/${query.tool}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'OpenManager-MCP-Analyzer/1.0'
                    },
                    body: JSON.stringify(query.payload),
                    timeout: TEST_TIMEOUT
                });

                const responseTime = Date.now() - startTime;
                const result = await response.json();

                const contextData = this.extractContextData(result, query.tool);

                this.results.contextQueries.push({
                    name: query.name,
                    tool: query.tool,
                    payload: query.payload,
                    success: result.success,
                    responseTime: responseTime,
                    contextData: contextData,
                    dataQuality: this.assessDataQuality(contextData, query.expected)
                });

                if (result.success && contextData.itemCount > 0) {
                    console.log(`     ✅ ${query.name}: ${contextData.itemCount}개 항목 조회됨 (${responseTime}ms)`);
                    console.log(`     📊 데이터 품질: ${this.assessDataQuality(contextData, query.expected)}`);
                } else if (result.success && contextData.itemCount === 0) {
                    console.log(`     ⚠️ ${query.name}: 조회 성공하지만 데이터 없음 (${responseTime}ms)`);
                } else {
                    console.log(`     ❌ ${query.name}: ${result.error || '조회 실패'} (${responseTime}ms)`);
                }

            } catch (error) {
                this.results.contextQueries.push({
                    name: query.name,
                    tool: query.tool,
                    success: false,
                    error: error.message
                });
                console.log(`     ❌ ${query.name}: 네트워크 오류 - ${error.message}`);
            }
        }
    }

    extractContextData(result, tool) {
        if (!result.success) {
            return { itemCount: 0, dataType: 'error', summary: result.error };
        }

        switch (tool) {
            case 'list_directory':
                return {
                    itemCount: result.count || 0,
                    dataType: 'directory_listing',
                    summary: `${result.count || 0}개 파일/폴더`,
                    items: result.entries || []
                };

            case 'read_file':
                return {
                    itemCount: result.content ? 1 : 0,
                    dataType: 'file_content',
                    summary: `${result.content?.length || 0}자 길이`,
                    content: result.content
                };

            case 'search_files':
                return {
                    itemCount: result.count || 0,
                    dataType: 'search_results',
                    summary: `${result.count || 0}개 파일 발견`,
                    items: result.results || []
                };

            default:
                return {
                    itemCount: 0,
                    dataType: 'unknown',
                    summary: '알 수 없는 데이터 타입'
                };
        }
    }

    assessDataQuality(contextData, expected) {
        if (contextData.itemCount === 0) return '❌ 데이터 없음';
        if (contextData.itemCount < 3) return '⚠️ 데이터 부족';
        if (contextData.itemCount >= 3) return '✅ 충분한 데이터';
        return '❓ 평가 불가';
    }

    async measurePerformance() {
        console.log('\n⚡ 4. 성능 측정');

        try {
            // 연속 요청 성능 테스트
            const requests = 5;
            const times = [];

            console.log(`   📊 ${requests}회 연속 요청 테스트 중...`);

            for (let i = 0; i < requests; i++) {
                const startTime = Date.now();

                const response = await fetch(`${RENDER_SERVER}/mcp/tools/list_directory`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'User-Agent': 'OpenManager-MCP-Analyzer/1.0'
                    },
                    body: JSON.stringify({ path: '.' }),
                    timeout: TEST_TIMEOUT
                });

                const responseTime = Date.now() - startTime;
                times.push(responseTime);

                if (!response.ok) {
                    this.results.issues.push(`성능 테스트 ${i + 1}회차 실패: ${response.status}`);
                }
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const minTime = Math.min(...times);
            const maxTime = Math.max(...times);

            this.results.performance = {
                averageResponseTime: avgTime,
                minResponseTime: minTime,
                maxResponseTime: maxTime,
                totalRequests: requests,
                successRate: times.length / requests * 100
            };

            console.log(`   📈 평균 응답시간: ${avgTime.toFixed(0)}ms`);
            console.log(`   🚀 최소 응답시간: ${minTime}ms`);
            console.log(`   🐌 최대 응답시간: ${maxTime}ms`);
            console.log(`   ✅ 성공률: ${this.results.performance.successRate}%`);

        } catch (error) {
            this.results.performance = { error: error.message };
            this.results.issues.push(`성능 측정 실패: ${error.message}`);
            console.log(`   ❌ 성능 측정 실패: ${error.message}`);
        }
    }

    generateReport() {
        console.log('\n📋 5. 종합 분석 결과');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        // 서버 상태 요약
        if (this.results.serverStatus?.status === 'online') {
            console.log('🟢 서버 상태: 정상 온라인');
        } else {
            console.log('🔴 서버 상태: 오프라인 또는 오류');
        }

        // 도구 가용성 요약
        const workingTools = this.results.availableTools.filter(t => t.status === 'working').length;
        const totalTools = this.results.availableTools.length;
        console.log(`🛠️ 도구 가용성: ${workingTools}/${totalTools}개 정상 작동`);

        // 컨텍스트 조회 성능
        const successfulQueries = this.results.contextQueries.filter(q => q.success).length;
        const totalQueries = this.results.contextQueries.length;
        console.log(`📚 컨텍스트 조회: ${successfulQueries}/${totalQueries}개 성공`);

        // 성능 요약
        if (this.results.performance.averageResponseTime) {
            console.log(`⚡ 평균 성능: ${this.results.performance.averageResponseTime.toFixed(0)}ms`);
        }

        // 주요 문제점
        if (this.results.issues.length > 0) {
            console.log('\n❗ 발견된 문제점:');
            this.results.issues.forEach((issue, index) => {
                console.log(`   ${index + 1}. ${issue}`);
            });
        }

        // 개선 권장사항
        console.log('\n💡 개선 권장사항:');
        this.generateRecommendations();

        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`📅 분석 완료: ${new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' })} (KST)`);
    }

    generateRecommendations() {
        const recommendations = [];

        // 서버 상태 기반 권장사항
        if (this.results.serverStatus?.status !== 'online') {
            recommendations.push('Render 서버 재시작 필요');
        }

        // 도구 가용성 기반 권장사항
        const failedTools = this.results.availableTools.filter(t => t.status !== 'working');
        if (failedTools.length > 0) {
            recommendations.push(`${failedTools.map(t => t.name).join(', ')} 도구 수정 필요`);
        }

        // 컨텍스트 데이터 기반 권장사항
        const emptyQueries = this.results.contextQueries.filter(q => q.contextData?.itemCount === 0);
        if (emptyQueries.length > 0) {
            recommendations.push('프로젝트 파일 업로드 확인 필요 (docs, src 폴더 누락 가능성)');
        }

        // 성능 기반 권장사항
        if (this.results.performance.averageResponseTime > 2000) {
            recommendations.push('응답시간 개선 필요 (현재 2초 초과)');
        }

        // 기본 권장사항
        if (recommendations.length === 0) {
            recommendations.push('MCP 서버 정상 작동 중 - 추가 최적화 검토');
        }

        recommendations.forEach((rec, index) => {
            console.log(`   ${index + 1}. ${rec}`);
        });
    }
}

// 실행
async function main() {
    const analyzer = new RenderMCPContextAnalyzer();
    await analyzer.analyze();
}

main().catch(console.error); 