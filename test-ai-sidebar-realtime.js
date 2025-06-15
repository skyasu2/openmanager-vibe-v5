/**
 * 🔗 AI 사이드바 실시간 데이터 테스트
 * 
 * 백엔드 API와의 실제 통신을 검증하고 서버데이터 생성기와 연결 테스트
 */

class AISidebarRealtimeTest {
    constructor() {
        this.baseUrl = 'http://localhost:3000';
        this.testResults = {
            mcpQuery: false,
            aiInsights: false,
            googleAIStatus: false,
            serverDataGenerator: false,
            realTimeUpdates: false
        };
    }

    /**
     * 🤖 MCP 쿼리 시스템 테스트
     */
    async testMCPQuery() {
        console.log('🤖 MCP 쿼리 시스템 테스트 시작...');

        try {
            const response = await fetch(`${this.baseUrl}/api/mcp/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: '서버 상태는 어떤가요?',
                    context: 'ai-sidebar',
                    includeThinking: true
                })
            });

            const data = await response.json();

            if (response.ok && data.response) {
                console.log('✅ MCP 쿼리 성공');
                console.log(`   응답: ${data.response.substring(0, 100)}...`);
                console.log(`   신뢰도: ${data.confidence || 'N/A'}`);
                console.log(`   응답시간: ${data.responseTime || 'N/A'}ms`);
                this.testResults.mcpQuery = true;
            } else {
                console.log('❌ MCP 쿼리 실패:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ MCP 쿼리 오류:', error.message);
        }
        console.log('');
    }

    /**
     * 📊 AI 인사이트 데이터 테스트
     */
    async testAIInsights() {
        console.log('📊 AI 인사이트 데이터 테스트 시작...');

        try {
            const response = await fetch(`${this.baseUrl}/api/ai/insights`);
            const data = await response.json();

            if (response.ok && data.success) {
                console.log('✅ AI 인사이트 성공');
                console.log(`   예측 정확도: ${data.data?.predictions?.accuracy || 'N/A'}%`);
                console.log(`   이상 탐지: ${data.data?.anomalies?.count || 0}개`);
                console.log(`   추천사항: ${data.data?.recommendations?.length || 0}개`);
                this.testResults.aiInsights = true;
            } else {
                console.log('❌ AI 인사이트 실패:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ AI 인사이트 오류:', error.message);
        }
        console.log('');
    }

    /**
     * 🔍 Google AI 상태 모니터링 테스트
     */
    async testGoogleAIStatus() {
        console.log('🔍 Google AI 상태 모니터링 테스트 시작...');

        try {
            const response = await fetch(`${this.baseUrl}/api/ai/google-ai/status`);
            const data = await response.json();

            if (response.ok) {
                console.log('✅ Google AI 상태 확인 성공');
                console.log(`   연결 상태: ${data.connected ? '연결됨' : '연결 안됨'}`);
                console.log(`   API 키 상태: ${data.apiKeyValid ? '유효' : '무효'}`);
                console.log(`   할당량 사용률: ${data.quotaUsage || 'N/A'}%`);
                console.log(`   응답 시간: ${data.responseTime || 'N/A'}ms`);
                this.testResults.googleAIStatus = true;
            } else {
                console.log('❌ Google AI 상태 확인 실패:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ Google AI 상태 오류:', error.message);
        }
        console.log('');
    }

    /**
     * 🏭 서버데이터 생성기 연결 테스트
     */
    async testServerDataGenerator() {
        console.log('🏭 서버데이터 생성기 연결 테스트 시작...');

        try {
            const response = await fetch(`${this.baseUrl}/api/servers/realtime?type=servers`);
            const data = await response.json();

            if (response.ok && data.success) {
                const servers = data.data;
                console.log('✅ 서버데이터 생성기 연결 성공');
                console.log(`   생성된 서버 수: ${servers.length}개`);
                console.log(`   실시간 데이터: ${data.realtime ? '활성화' : '비활성화'}`);

                // 서버 상태 분포 확인
                const statusCounts = servers.reduce((acc, server) => {
                    acc[server.status] = (acc[server.status] || 0) + 1;
                    return acc;
                }, {});

                console.log(`   서버 상태 분포: ${JSON.stringify(statusCounts)}`);
                this.testResults.serverDataGenerator = true;
            } else {
                console.log('❌ 서버데이터 생성기 연결 실패:', data.error || 'Unknown error');
            }
        } catch (error) {
            console.log('❌ 서버데이터 생성기 오류:', error.message);
        }
        console.log('');
    }

    /**
     * 🔄 실시간 업데이트 테스트
     */
    async testRealTimeUpdates() {
        console.log('🔄 실시간 업데이트 테스트 시작...');

        try {
            // 첫 번째 데이터 수집
            const response1 = await fetch(`${this.baseUrl}/api/servers/realtime?type=servers`);
            const data1 = await response1.json();

            if (!response1.ok || !data1.success) {
                throw new Error('첫 번째 데이터 수집 실패');
            }

            console.log('   첫 번째 데이터 수집 완료, 5초 후 재수집...');

            // 5초 후 두 번째 데이터 수집
            await new Promise(resolve => setTimeout(resolve, 5000));

            const response2 = await fetch(`${this.baseUrl}/api/servers/realtime?type=servers`);
            const data2 = await response2.json();

            if (!response2.ok || !data2.success) {
                throw new Error('두 번째 데이터 수집 실패');
            }

            // 데이터 변화 확인
            const server1_before = data1.data[0];
            const server1_after = data2.data[0];

            const cpuChanged = Math.abs(server1_before.metrics.cpu - server1_after.metrics.cpu) > 0.1;
            const memoryChanged = Math.abs(server1_before.metrics.memory - server1_after.metrics.memory) > 0.1;
            const hasChanges = cpuChanged || memoryChanged;

            console.log('✅ 실시간 업데이트 테스트 완료');
            console.log(`   데이터 변화 감지: ${hasChanges ? '성공' : '변화 없음'}`);
            console.log(`   CPU: ${server1_before.metrics.cpu.toFixed(1)}% → ${server1_after.metrics.cpu.toFixed(1)}%`);
            console.log(`   메모리: ${server1_before.metrics.memory.toFixed(1)}% → ${server1_after.metrics.memory.toFixed(1)}%`);

            this.testResults.realTimeUpdates = hasChanges;

        } catch (error) {
            console.log('❌ 실시간 업데이트 테스트 오류:', error.message);
        }
        console.log('');
    }

    /**
     * 🧪 통합 AI 사이드바 시뮬레이션
     */
    async simulateAISidebarWorkflow() {
        console.log('🧪 AI 사이드바 워크플로우 시뮬레이션 시작...');

        const testQuestions = [
            '서버 상태는 어떤가요?',
            '최근 로그를 분석해주세요',
            '성능 지표를 분석해주세요',
            '향후 예측을 해주세요'
        ];

        for (const question of testQuestions) {
            console.log(`   질문: "${question}"`);

            try {
                // MCP 쿼리 실행
                const response = await fetch(`${this.baseUrl}/api/mcp/query`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        query: question,
                        context: 'ai-sidebar-simulation',
                        includeThinking: true
                    })
                });

                const data = await response.json();

                if (response.ok && data.response) {
                    console.log(`   ✅ 응답: ${data.response.substring(0, 80)}...`);
                    console.log(`   신뢰도: ${data.confidence || 'N/A'}, 응답시간: ${data.responseTime || 'N/A'}ms`);
                } else {
                    console.log(`   ❌ 응답 실패: ${data.error || 'Unknown error'}`);
                }

                // 1초 대기
                await new Promise(resolve => setTimeout(resolve, 1000));

            } catch (error) {
                console.log(`   ❌ 오류: ${error.message}`);
            }
        }
        console.log('');
    }

    /**
     * 📋 전체 테스트 실행
     */
    async runAllTests() {
        console.log('🚀 AI 사이드바 실시간 데이터 테스트 시작\n');
        console.log('=' * 60);

        // 개별 테스트 실행
        await this.testMCPQuery();
        await this.testAIInsights();
        await this.testGoogleAIStatus();
        await this.testServerDataGenerator();
        await this.testRealTimeUpdates();

        // AI 사이드바 워크플로우 시뮬레이션
        await this.simulateAISidebarWorkflow();

        // 결과 요약
        this.printTestSummary();
    }

    /**
     * 📊 테스트 결과 요약
     */
    printTestSummary() {
        console.log('📊 테스트 결과 요약');
        console.log('=' * 60);

        const totalTests = Object.keys(this.testResults).length;
        const passedTests = Object.values(this.testResults).filter(result => result).length;
        const successRate = Math.round((passedTests / totalTests) * 100);

        console.log(`전체 테스트: ${totalTests}개`);
        console.log(`성공: ${passedTests}개`);
        console.log(`실패: ${totalTests - passedTests}개`);
        console.log(`성공률: ${successRate}%\n`);

        // 개별 테스트 결과
        Object.entries(this.testResults).forEach(([test, result]) => {
            const status = result ? '✅' : '❌';
            const testName = {
                mcpQuery: 'MCP 쿼리 시스템',
                aiInsights: 'AI 인사이트 데이터',
                googleAIStatus: 'Google AI 상태 모니터링',
                serverDataGenerator: '서버데이터 생성기 연결',
                realTimeUpdates: '실시간 업데이트'
            }[test] || test;

            console.log(`${status} ${testName}`);
        });

        console.log('\n🎉 AI 사이드바 실시간 데이터 테스트 완료!');

        if (successRate >= 80) {
            console.log('🌟 우수한 성능! 프로덕션 배포 준비 완료');
        } else if (successRate >= 60) {
            console.log('⚠️  일부 개선 필요, 추가 디버깅 권장');
        } else {
            console.log('🔧 상당한 문제 발견, 시스템 점검 필요');
        }
    }
}

// 테스트 실행
const tester = new AISidebarRealtimeTest();
tester.runAllTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류:', error);
}); 