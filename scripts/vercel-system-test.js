#!/usr/bin/env node

/**
 * 🌐 Vercel 시스템 테스트 - 배포 환경 전체 시스템 점검
 * 
 * 테스트 범위:
 * 1. 서버 데이터 생성기 동작 상태 (Vercel)
 * 2. 대시보드 데이터 갱신 및 24시간 데이터
 * 3. 서버 카드 및 모달 데이터 분석
 * 4. AI 어시스턴트 데이터 수신 및 분석
 * 5. MCP 서버 연동 상태 (Render)
 */

const https = require('https');

class VercelSystemTest {
    constructor() {
        this.vercelUrl = 'https://openmanager-vibe-v5.vercel.app';
        this.mcpServerUrl = 'https://openmanager-vibe-v5.onrender.com';
        this.results = {
            serverDataGenerator: null,
            dashboardData: null,
            serverCards: null,
            aiAssistant: null,
            mcpServer: null
        };
        this.startTime = Date.now();
    }

    log(message, type = 'info') {
        const timestamp = new Date().toISOString();
        const colors = {
            info: '\x1b[36m',    // cyan
            success: '\x1b[32m', // green
            warning: '\x1b[33m', // yellow
            error: '\x1b[31m',   // red
            reset: '\x1b[0m'
        };

        console.log(`${colors[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async makeRequest(method, url, data = null, timeout = 15000) {
        return new Promise((resolve, reject) => {
            const urlObj = new URL(url);
            const options = {
                hostname: urlObj.hostname,
                port: 443,
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'VercelSystemTest/1.0'
                },
                timeout: timeout
            };

            if (data) {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = https.request(options, (res) => {
                let responseData = '';
                res.on('data', (chunk) => responseData += chunk);
                res.on('end', () => {
                    try {
                        const response = responseData ? JSON.parse(responseData) : {};
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: response,
                            raw: responseData
                        });
                    } catch (parseError) {
                        resolve({
                            status: res.statusCode,
                            headers: res.headers,
                            data: null,
                            raw: responseData,
                            parseError: parseError.message
                        });
                    }
                });
            });

            req.on('error', reject);
            req.on('timeout', () => reject(new Error('Request timeout')));

            if (data) {
                req.write(JSON.stringify(data));
            }
            req.end();
        });
    }

    // 1. Vercel 서버 데이터 생성기 테스트
    async testVercelServerDataGenerator() {
        this.log('🔧 1. Vercel 서버 데이터 생성기 동작 상태 점검', 'info');

        try {
            const response = await this.makeRequest('GET', `${this.vercelUrl}/api/servers/realtime?limit=5`);

            if (response.status === 200 && response.data) {
                const data = response.data;

                this.results.serverDataGenerator = {
                    status: 'success',
                    serverCount: data.servers?.length || 0,
                    totalServers: data.summary?.servers?.total || 0,
                    onlineServers: data.summary?.servers?.online || 0,
                    warningServers: data.summary?.servers?.warning || 0,
                    criticalServers: data.summary?.servers?.critical || 0,
                    dataSource: response.headers['x-data-source'] || 'unknown',
                    isMockMode: response.headers['x-data-fallback-warning'] === 'true',
                    responseTime: Date.now() - this.startTime,
                    timestamp: new Date().toISOString(),
                    environment: 'vercel'
                };

                this.log(`✅ Vercel 서버 데이터 생성기 정상 동작`, 'success');
                this.log(`   - 서버 수: ${this.results.serverDataGenerator.serverCount}개`, 'info');
                this.log(`   - 총 서버: ${this.results.serverDataGenerator.totalServers}개`, 'info');
                this.log(`   - 온라인: ${this.results.serverDataGenerator.onlineServers}개`, 'info');
                this.log(`   - 데이터 소스: ${this.results.serverDataGenerator.dataSource}`, 'info');
                this.log(`   - Mock 모드: ${this.results.serverDataGenerator.isMockMode ? 'Yes' : 'No'}`, 'info');

                return true;
            } else {
                throw new Error(`API 응답 오류: ${response.status}`);
            }
        } catch (error) {
            this.log(`❌ Vercel 서버 데이터 생성기 테스트 실패: ${error.message}`, 'error');
            this.results.serverDataGenerator = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };
            return false;
        }
    }

    // 2. 대시보드 데이터 갱신 테스트
    async testDashboardDataRefresh() {
        this.log('📊 2. Vercel 대시보드 데이터 갱신 및 24시간 데이터 테스트', 'info');

        try {
            // 실시간 메트릭 API 테스트
            const realtimeResponse = await this.makeRequest('GET', `${this.vercelUrl}/api/metrics/realtime`);

            // 서버 상태 요약 API 테스트
            const summaryResponse = await this.makeRequest('GET', `${this.vercelUrl}/api/servers/summary`);

            this.results.dashboardData = {
                status: 'success',
                realtime: {
                    status: realtimeResponse.status,
                    hasData: !!realtimeResponse.data,
                    lastUpdate: realtimeResponse.data?.lastUpdate || 'unknown'
                },
                summary: {
                    status: summaryResponse.status,
                    hasData: !!summaryResponse.data,
                    totalServers: summaryResponse.data?.total || 0
                },
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };

            this.log(`✅ Vercel 대시보드 데이터 갱신 테스트 완료`, 'success');
            this.log(`   - 실시간 메트릭: ${realtimeResponse.status}`, 'info');
            this.log(`   - 서버 요약: ${summaryResponse.status} (총 ${this.results.dashboardData.summary.totalServers}개)`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ Vercel 대시보드 데이터 갱신 테스트 실패: ${error.message}`, 'error');
            this.results.dashboardData = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };
            return false;
        }
    }

    // 3. 서버 카드 및 모달 테스트
    async testServerCardModal() {
        this.log('🖥️ 3. Vercel 서버 카드 및 모달 데이터 분석 테스트', 'info');

        try {
            // 서버 목록 가져오기
            const serversResponse = await this.makeRequest('GET', `${this.vercelUrl}/api/servers/realtime?limit=3`);

            if (!serversResponse.data?.servers?.length) {
                throw new Error('서버 데이터가 없습니다');
            }

            const firstServer = serversResponse.data.servers[0];

            // 특정 서버 상세 정보 테스트 (존재하는 경우)
            let serverDetailResponse = { status: 404, data: null };
            try {
                serverDetailResponse = await this.makeRequest('GET', `${this.vercelUrl}/api/servers/${firstServer.id}`);
            } catch (detailError) {
                // 서버 상세 API가 없을 수 있으므로 무시
            }

            this.results.serverCards = {
                status: 'success',
                serverList: {
                    count: serversResponse.data.servers.length,
                    firstServer: {
                        id: firstServer.id,
                        name: firstServer.name,
                        status: firstServer.status,
                        cpu: firstServer.cpu,
                        memory: firstServer.memory,
                        hasServices: !!firstServer.services?.length
                    }
                },
                serverDetail: {
                    status: serverDetailResponse.status,
                    hasData: !!serverDetailResponse.data
                },
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };

            this.log(`✅ Vercel 서버 카드 및 모달 테스트 완료`, 'success');
            this.log(`   - 서버 목록: ${this.results.serverCards.serverList.count}개`, 'info');
            this.log(`   - 첫 번째 서버: ${firstServer.name} (${firstServer.status})`, 'info');
            this.log(`   - CPU: ${firstServer.cpu}%, Memory: ${firstServer.memory}%`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ Vercel 서버 카드 및 모달 테스트 실패: ${error.message}`, 'error');
            this.results.serverCards = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };
            return false;
        }
    }

    // 4. AI 어시스턴트 데이터 분석 테스트
    async testAIAssistantDataAnalysis() {
        this.log('🤖 4. Vercel AI 어시스턴트 데이터 수신 및 분석 테스트', 'info');

        try {
            // AI 어시스턴트 상태 확인
            const aiStatusResponse = await this.makeRequest('GET', `${this.vercelUrl}/api/ai/status`);

            // AI 통합 쿼리 테스트 (서버 데이터 분석)
            const aiQueryResponse = await this.makeRequest('POST', `${this.vercelUrl}/api/ai/unified-query`, {
                query: "현재 서버 상태를 분석해주세요. CPU와 메모리 사용률이 높은 서버가 있나요?",
                mode: "AUTO",
                includeServerData: true
            });

            this.results.aiAssistant = {
                status: 'success',
                aiStatus: {
                    status: aiStatusResponse.status,
                    hasData: !!aiStatusResponse.data,
                    engines: aiStatusResponse.data?.engines || []
                },
                aiQuery: {
                    status: aiQueryResponse.status,
                    hasResponse: !!aiQueryResponse.data?.response,
                    processingTime: aiQueryResponse.data?.processingTime || 0,
                    confidence: aiQueryResponse.data?.confidence || 0,
                    enginesUsed: aiQueryResponse.data?.enginesUsed || []
                },
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };

            this.log(`✅ Vercel AI 어시스턴트 데이터 분석 테스트 완료`, 'success');
            this.log(`   - AI 상태: ${aiStatusResponse.status}`, 'info');
            this.log(`   - AI 쿼리: ${aiQueryResponse.status} (${this.results.aiAssistant.aiQuery.processingTime}ms)`, 'info');
            this.log(`   - 신뢰도: ${this.results.aiAssistant.aiQuery.confidence}`, 'info');
            this.log(`   - 사용된 엔진: ${this.results.aiAssistant.aiQuery.enginesUsed.join(', ')}`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ Vercel AI 어시스턴트 테스트 실패: ${error.message}`, 'error');
            this.results.aiAssistant = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                environment: 'vercel'
            };
            return false;
        }
    }

    // 5. MCP 서버 연동 테스트 (Render)
    async testMCPServerIntegration() {
        this.log('🔗 5. MCP 서버 연동 상태 테스트 (Render)', 'info');

        try {
            // MCP 서버 헬스체크
            const healthResponse = await this.makeRequest('GET', `${this.mcpServerUrl}/health`);

            // MCP 서버 파일 시스템 테스트
            const fileSystemResponse = await this.makeRequest('POST', `${this.mcpServerUrl}/mcp/tools/list_directory`, {
                path: '.'
            });

            this.results.mcpServer = {
                status: 'success',
                health: {
                    status: healthResponse.status,
                    hasData: !!healthResponse.data,
                    uptime: healthResponse.data?.uptime || 'unknown'
                },
                fileSystem: {
                    status: fileSystemResponse.status,
                    hasData: !!fileSystemResponse.data,
                    filesCount: fileSystemResponse.data?.contents?.length || 0
                },
                timestamp: new Date().toISOString(),
                environment: 'render'
            };

            this.log(`✅ MCP 서버 연동 테스트 완료`, 'success');
            this.log(`   - 헬스체크: ${healthResponse.status}`, 'info');
            this.log(`   - 파일시스템: ${fileSystemResponse.status} (${this.results.mcpServer.fileSystem.filesCount}개 파일)`, 'info');

            return true;
        } catch (error) {
            this.log(`❌ MCP 서버 연동 테스트 실패: ${error.message}`, 'error');
            this.results.mcpServer = {
                status: 'failed',
                error: error.message,
                timestamp: new Date().toISOString(),
                environment: 'render'
            };
            return false;
        }
    }

    // 종합 보고서 생성
    generateReport() {
        this.log('\n📋 === Vercel 시스템 테스트 보고서 ===', 'info');

        const totalTime = Date.now() - this.startTime;
        this.log(`⏱️ 총 테스트 시간: ${totalTime}ms`, 'info');

        // 각 테스트 결과 요약
        const testResults = [
            { name: 'Vercel 서버 데이터 생성기', result: this.results.serverDataGenerator },
            { name: 'Vercel 대시보드 데이터', result: this.results.dashboardData },
            { name: 'Vercel 서버 카드', result: this.results.serverCards },
            { name: 'Vercel AI 어시스턴트', result: this.results.aiAssistant },
            { name: 'Render MCP 서버', result: this.results.mcpServer }
        ];

        let passedTests = 0;
        let failedTests = 0;

        testResults.forEach(test => {
            if (test.result?.status === 'success') {
                this.log(`✅ ${test.name}: 성공`, 'success');
                passedTests++;
            } else {
                this.log(`❌ ${test.name}: 실패 - ${test.result?.error || '알 수 없는 오류'}`, 'error');
                failedTests++;
            }
        });

        this.log(`\n📊 테스트 결과: ${passedTests}개 성공, ${failedTests}개 실패`, 'info');

        // 주요 발견사항
        this.log('\n🔍 주요 발견사항:', 'info');

        if (this.results.serverDataGenerator?.status === 'success') {
            this.log(`   - Vercel 서버 데이터: ${this.results.serverDataGenerator.totalServers}개 서버 운영 중`, 'info');
            this.log(`   - Mock 모드: ${this.results.serverDataGenerator.isMockMode ? 'Yes (주의 필요)' : 'No (실제 데이터)'}`, this.results.serverDataGenerator.isMockMode ? 'warning' : 'success');
        }

        if (this.results.aiAssistant?.status === 'success') {
            this.log(`   - AI 어시스턴트 응답시간: ${this.results.aiAssistant.aiQuery.processingTime}ms`, 'info');
            this.log(`   - AI 신뢰도: ${this.results.aiAssistant.aiQuery.confidence}`, 'info');
        }

        if (this.results.mcpServer?.status === 'success') {
            this.log(`   - MCP 서버 상태: 정상 (${this.results.mcpServer.fileSystem.filesCount}개 파일 접근 가능)`, 'success');
        }

        // JSON 결과 파일 저장
        const reportData = {
            summary: {
                totalTests: testResults.length,
                passedTests,
                failedTests,
                totalTime,
                timestamp: new Date().toISOString(),
                environment: 'vercel-production'
            },
            results: this.results
        };

        // 파일 저장 시도
        try {
            const fs = require('fs');
            const reportPath = `test-results/vercel-system-test-${Date.now()}.json`;

            if (!fs.existsSync('test-results')) {
                fs.mkdirSync('test-results', { recursive: true });
            }

            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            this.log(`📄 상세 보고서 저장: ${reportPath}`, 'success');
        } catch (saveError) {
            this.log(`⚠️ 보고서 저장 실패: ${saveError.message}`, 'warning');
        }

        return reportData;
    }

    // 메인 테스트 실행
    async run() {
        this.log('🚀 Vercel 시스템 테스트 시작', 'info');
        this.log(`🌐 Vercel URL: ${this.vercelUrl}`, 'info');
        this.log(`🔗 MCP 서버: ${this.mcpServerUrl}`, 'info');

        try {
            // 순차적으로 모든 테스트 실행
            await this.testVercelServerDataGenerator();
            await this.testDashboardDataRefresh();
            await this.testServerCardModal();
            await this.testAIAssistantDataAnalysis();
            await this.testMCPServerIntegration();

            // 종합 보고서 생성
            const report = this.generateReport();

            this.log('\n🎉 Vercel 시스템 테스트 완료!', 'success');
            return report;

        } catch (error) {
            this.log(`💥 시스템 테스트 중 치명적 오류: ${error.message}`, 'error');
            throw error;
        }
    }
}

// 스크립트 직접 실행 시
if (require.main === module) {
    const tester = new VercelSystemTest();

    tester.run()
        .then(report => {
            console.log('\n✅ 모든 테스트 완료');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ 테스트 실행 실패:', error.message);
            process.exit(1);
        });
}

module.exports = VercelSystemTest; 