#!/usr/bin/env node

/**
 * 🚀 Cursor ↔ 배포환경 통신 채널
 * 
 * 커서가 배포된 OpenManager Vibe v5와 직접 통신하여
 * AI 엔진 상태, 성능 메트릭, 컨텍스트 정보를 실시간으로 가져옵니다.
 * 
 * 사용법:
 * node scripts/cursor-deployment-communicator.js --action=status
 * node scripts/cursor-deployment-communicator.js --action=performance
 * node scripts/cursor-deployment-communicator.js --action=ai-engines
 */

const https = require('https');
const http = require('http');

class CursorDeploymentCommunicator {
    constructor() {
        // 배포 환경 설정
        this.deploymentConfig = {
            // Vercel 배포 URL
            vercel: 'https://openmanager-vibe-v5.vercel.app',
            // Render MCP 서버 (백업)
            render: 'https://openmanager-vibe-v5.onrender.com',
            // 로컬 개발 환경 (테스트용)
            local: 'http://localhost:3001'
        };

        // 현재 활성 환경 감지
        this.activeEnvironment = 'vercel';

        // API 엔드포인트 매핑
        this.endpoints = {
            // AI 엔진 상태
            aiStatus: '/api/ai-chat?action=status',
            aiEngines: '/api/ai/engines/status',

            // 시스템 성능
            health: '/api/health',
            metrics: '/api/metrics/performance',

            // AI 컨텍스트 정보
            aiContext: '/api/ai/unified/status',
            systemContext: '/api/system/unified/status',

            // 실시간 데이터
            realtime: '/api/realtime/connect',
            logs: '/api/logs'
        };

        // Google AI API 부하 보호
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 2000, // 2초 간격
            requestCount: 0,
            maxRequestsPerMinute: 15 // 분당 15회 제한
        };
    }

    /**
     * 배포환경 연결 상태 확인
     */
    async checkDeploymentHealth() {
        console.log('🔍 배포환경 연결 상태 확인 중...');

        const environments = ['vercel', 'local', 'render'];
        const results = {};

        for (const env of environments) {
            try {
                const url = this.deploymentConfig[env];
                const response = await this.makeRequest(`${url}/api/health`);

                results[env] = {
                    status: 'online',
                    responseTime: response.responseTime,
                    data: response.data
                };

                console.log(`✅ ${env.toUpperCase()}: 온라인 (${response.responseTime}ms)`);

                // 첫 번째 응답하는 환경을 활성 환경으로 설정
                if (!this.activeEnvironment || this.activeEnvironment === 'vercel') {
                    this.activeEnvironment = env;
                }

            } catch (error) {
                results[env] = {
                    status: 'offline',
                    error: error.message
                };
                console.log(`❌ ${env.toUpperCase()}: 오프라인 (${error.message})`);
            }
        }

        return results;
    }

    /**
     * AI 엔진 상태 조회
     */
    async getAIEngineStatus() {
        console.log('🤖 AI 엔진 상태 조회 중...');

        try {
            // Rate limiting 체크
            await this.checkRateLimit();

            const baseUrl = this.deploymentConfig[this.activeEnvironment];
            const response = await this.makeRequest(`${baseUrl}${this.endpoints.aiStatus}`);

            console.log('📊 AI 엔진 상태:');
            console.log(JSON.stringify(response.data, null, 2));

            return response.data;

        } catch (error) {
            console.error('❌ AI 엔진 상태 조회 실패:', error.message);
            throw error;
        }
    }

    /**
     * 시스템 성능 메트릭 조회
     */
    async getPerformanceMetrics() {
        console.log('📈 시스템 성능 메트릭 조회 중...');

        try {
            const baseUrl = this.deploymentConfig[this.activeEnvironment];

            // 여러 메트릭을 병렬로 조회
            const [health, metrics] = await Promise.all([
                this.makeRequest(`${baseUrl}${this.endpoints.health}`),
                this.makeRequest(`${baseUrl}${this.endpoints.metrics}`).catch(() => ({ data: null }))
            ]);

            const performanceData = {
                health: health.data,
                metrics: metrics.data,
                responseTime: health.responseTime,
                timestamp: new Date().toISOString()
            };

            console.log('📊 성능 메트릭:');
            console.log(JSON.stringify(performanceData, null, 2));

            return performanceData;

        } catch (error) {
            console.error('❌ 성능 메트릭 조회 실패:', error.message);
            throw error;
        }
    }

    /**
     * AI 컨텍스트 정보 조회
     */
    async getAIContextInfo() {
        console.log('🧠 AI 컨텍스트 정보 조회 중...');

        try {
            await this.checkRateLimit();

            const baseUrl = this.deploymentConfig[this.activeEnvironment];

            // AI 컨텍스트 관련 정보 수집
            const contextData = {};

            // 기본 AI 상태
            try {
                const aiStatus = await this.makeRequest(`${baseUrl}${this.endpoints.aiStatus}`);
                contextData.aiStatus = aiStatus.data;
            } catch (e) {
                contextData.aiStatus = { error: e.message };
            }

            // 시스템 통합 상태
            try {
                const systemStatus = await this.makeRequest(`${baseUrl}${this.endpoints.systemContext}`);
                contextData.systemStatus = systemStatus.data;
            } catch (e) {
                contextData.systemStatus = { error: e.message };
            }

            console.log('🧠 AI 컨텍스트 정보:');
            console.log(JSON.stringify(contextData, null, 2));

            return contextData;

        } catch (error) {
            console.error('❌ AI 컨텍스트 조회 실패:', error.message);
            throw error;
        }
    }

    /**
     * 배포환경 AI와 대화
     */
    async chatWithDeployedAI(question, context = {}) {
        console.log(`💬 배포환경 AI와 대화: "${question}"`);

        try {
            await this.checkRateLimit();

            const baseUrl = this.deploymentConfig[this.activeEnvironment];
            const payload = {
                message: question,
                context: {
                    source: 'cursor-communicator',
                    timestamp: new Date().toISOString(),
                    ...context
                }
            };

            const response = await this.makeRequest(
                `${baseUrl}/api/ai-chat`,
                'POST',
                payload
            );

            console.log('🤖 AI 응답:');
            console.log(response.data.response || response.data);

            return response.data;

        } catch (error) {
            console.error('❌ AI 대화 실패:', error.message);
            throw error;
        }
    }

    /**
     * Rate Limiting 체크 (Google AI API 보호)
     */
    async checkRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;

        // 최소 간격 체크
        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const waitTime = this.rateLimiter.minInterval - timeSinceLastRequest;
            console.log(`⏳ Rate limit 보호: ${waitTime}ms 대기 중...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        // 분당 요청 수 체크
        this.rateLimiter.requestCount++;
        if (this.rateLimiter.requestCount > this.rateLimiter.maxRequestsPerMinute) {
            console.log('⚠️ 분당 요청 한도 초과, 1분 대기...');
            await new Promise(resolve => setTimeout(resolve, 60000));
            this.rateLimiter.requestCount = 0;
        }

        this.rateLimiter.lastRequest = Date.now();
    }

    /**
     * HTTP 요청 헬퍼
     */
    async makeRequest(url, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            const startTime = Date.now();
            const urlObj = new URL(url);
            const isHttps = urlObj.protocol === 'https:';
            const client = isHttps ? https : http;

            const options = {
                hostname: urlObj.hostname,
                port: urlObj.port || (isHttps ? 443 : 80),
                path: urlObj.pathname + urlObj.search,
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'User-Agent': 'Cursor-Deployment-Communicator/1.0'
                }
            };

            if (data && method !== 'GET') {
                const jsonData = JSON.stringify(data);
                options.headers['Content-Length'] = Buffer.byteLength(jsonData);
            }

            const req = client.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const responseTime = Date.now() - startTime;

                    try {
                        const parsedData = JSON.parse(responseData);
                        resolve({
                            data: parsedData,
                            statusCode: res.statusCode,
                            responseTime: responseTime
                        });
                    } catch (e) {
                        resolve({
                            data: responseData,
                            statusCode: res.statusCode,
                            responseTime: responseTime
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * 종합 시스템 분석
     */
    async performComprehensiveAnalysis() {
        console.log('🔍 종합 시스템 분석 시작...');

        try {
            // 1. 배포환경 상태 확인
            const healthCheck = await this.checkDeploymentHealth();

            // 2. AI 엔진 상태 조회
            const aiStatus = await this.getAIEngineStatus();

            // 3. 성능 메트릭 조회
            const performance = await this.getPerformanceMetrics();

            // 4. AI 컨텍스트 정보 조회
            const contextInfo = await this.getAIContextInfo();

            // 5. 종합 분석 결과
            const analysis = {
                timestamp: new Date().toISOString(),
                environment: this.activeEnvironment,
                healthCheck,
                aiStatus,
                performance,
                contextInfo,
                summary: {
                    overallStatus: this.calculateOverallStatus(healthCheck, aiStatus, performance),
                    recommendations: this.generateRecommendations(aiStatus, performance, contextInfo)
                }
            };

            console.log('📋 종합 분석 완료:');
            console.log(JSON.stringify(analysis.summary, null, 2));

            return analysis;

        } catch (error) {
            console.error('❌ 종합 분석 실패:', error.message);
            throw error;
        }
    }

    /**
     * 전체 상태 계산
     */
    calculateOverallStatus(healthCheck, aiStatus, performance) {
        const onlineEnvironments = Object.values(healthCheck).filter(env => env.status === 'online').length;
        const aiHealthy = aiStatus && !aiStatus.error;
        const performanceGood = performance && performance.responseTime < 5000;

        if (onlineEnvironments > 0 && aiHealthy && performanceGood) {
            return 'healthy';
        } else if (onlineEnvironments > 0) {
            return 'degraded';
        } else {
            return 'critical';
        }
    }

    /**
     * 개선 권장사항 생성
     */
    generateRecommendations(aiStatus, performance, contextInfo) {
        const recommendations = [];

        if (performance && performance.responseTime > 3000) {
            recommendations.push('API 응답시간 최적화 필요 (현재: ' + performance.responseTime + 'ms)');
        }

        if (aiStatus && aiStatus.error) {
            recommendations.push('AI 엔진 연결 문제 해결 필요');
        }

        if (contextInfo && contextInfo.systemStatus && contextInfo.systemStatus.error) {
            recommendations.push('시스템 통합 상태 점검 필요');
        }

        if (recommendations.length === 0) {
            recommendations.push('시스템이 정상적으로 작동 중입니다');
        }

        return recommendations;
    }
}

// CLI 실행
async function main() {
    const args = process.argv.slice(2);
    const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'comprehensive';

    const communicator = new CursorDeploymentCommunicator();

    try {
        switch (action) {
            case 'status':
                await communicator.checkDeploymentHealth();
                break;

            case 'ai-engines':
                await communicator.getAIEngineStatus();
                break;

            case 'performance':
                await communicator.getPerformanceMetrics();
                break;

            case 'context':
                await communicator.getAIContextInfo();
                break;

            case 'chat':
                const question = args.find(arg => arg.startsWith('--question='))?.split('=')[1] || '시스템 상태 어때?';
                await communicator.chatWithDeployedAI(question);
                break;

            case 'comprehensive':
            default:
                await communicator.performComprehensiveAnalysis();
                break;
        }

    } catch (error) {
        console.error('❌ 실행 실패:', error.message);
        process.exit(1);
    }
}

// 모듈로 사용할 때와 직접 실행할 때 구분
if (require.main === module) {
    main();
}

module.exports = CursorDeploymentCommunicator; 