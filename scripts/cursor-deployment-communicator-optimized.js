#!/usr/bin/env node

/**
 * 🚀 커서 배포환경 통신 채널 (최적화 버전)
 * 
 * 개선사항:
 * 1. 병렬 처리로 응답시간 단축
 * 2. 캐싱으로 중복 요청 방지
 * 3. 타임아웃 설정으로 무한 대기 방지
 * 4. 폴백 메커니즘 강화
 */

const https = require('https');
const http = require('http');

class OptimizedCursorCommunicator {
    constructor() {
        this.deploymentConfig = {
            vercel: 'https://openmanager-vibe-v5.vercel.app',
            local: 'http://localhost:3001',
            render: 'https://openmanager-vibe-v5.onrender.com'
        };

        this.activeEnvironment = null;
        this.cache = new Map();
        this.cacheTimeout = 30000; // 30초 캐시

        // 최적화된 Rate Limiting
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 1000, // 2초 → 1초로 단축
            requestCount: 0,
            maxRequestsPerMinute: 20, // 15 → 20으로 증가
            resetTime: Date.now()
        };

        // 타임아웃 설정
        this.requestTimeout = 5000; // 5초 타임아웃
    }

    /**
     * 🚀 고속 배포환경 상태 확인 (병렬 처리)
     */
    async quickHealthCheck() {
        console.log('⚡ 고속 배포환경 상태 확인 중...');
        const startTime = Date.now();

        // 캐시 확인
        const cacheKey = 'health_check';
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('📦 캐시된 결과 사용 (즉시 응답)');
                return cached.data;
            }
        }

        // 병렬로 모든 환경 테스트
        const environments = ['local', 'vercel', 'render'];
        const promises = environments.map(env =>
            this.testEnvironment(env).catch(error => ({
                env,
                status: 'offline',
                error: error.message
            }))
        );

        try {
            const results = await Promise.allSettled(promises);
            const healthData = {};

            for (const result of results) {
                if (result.status === 'fulfilled' && result.value) {
                    const { env, ...data } = result.value;
                    healthData[env] = data;

                    // 첫 번째 온라인 환경을 활성 환경으로 설정
                    if (data.status === 'online' && !this.activeEnvironment) {
                        this.activeEnvironment = env;
                        console.log(`🎯 활성 환경 설정: ${env.toUpperCase()}`);
                    }
                }
            }

            // 결과 캐싱
            this.cache.set(cacheKey, {
                data: healthData,
                timestamp: Date.now()
            });

            const totalTime = Date.now() - startTime;
            console.log(`✅ 상태 확인 완료 (${totalTime}ms)`);

            return healthData;

        } catch (error) {
            console.error('❌ 상태 확인 실패:', error.message);
            throw error;
        }
    }

    /**
     * 개별 환경 테스트 (타임아웃 적용)
     */
    async testEnvironment(env) {
        const url = this.deploymentConfig[env];

        try {
            const response = await this.makeRequestWithTimeout(`${url}/api/health`, 'GET', null, 3000);

            return {
                env,
                status: 'online',
                responseTime: response.responseTime,
                data: response.data
            };

        } catch (error) {
            return {
                env,
                status: 'offline',
                error: error.message
            };
        }
    }

    /**
     * 🤖 최적화된 AI 대화 (배치 처리)
     */
    async optimizedAIChat(questions) {
        console.log(`💬 최적화된 AI 대화 시작 (${questions.length}개 질문)`);

        if (!this.activeEnvironment) {
            await this.quickHealthCheck();
        }

        const responses = [];
        const baseUrl = this.deploymentConfig[this.activeEnvironment];

        // 배치 크기로 나누어 처리
        const batchSize = 3;
        for (let i = 0; i < questions.length; i += batchSize) {
            const batch = questions.slice(i, i + batchSize);

            console.log(`📦 배치 ${Math.floor(i / batchSize) + 1} 처리 중...`);

            const batchPromises = batch.map(async (question, index) => {
                await this.checkRateLimit();

                try {
                    const response = await this.makeRequestWithTimeout(
                        `${baseUrl}/api/ai-chat`,
                        'POST',
                        {
                            message: question,
                            context: {
                                source: 'optimized-cursor',
                                batchIndex: i + index,
                                timestamp: new Date().toISOString()
                            }
                        },
                        8000 // AI 응답은 8초 타임아웃
                    );

                    return {
                        question,
                        response: response.data.response || response.data,
                        responseTime: response.responseTime
                    };

                } catch (error) {
                    return {
                        question,
                        error: error.message,
                        responseTime: null
                    };
                }
            });

            const batchResults = await Promise.allSettled(batchPromises);

            batchResults.forEach(result => {
                if (result.status === 'fulfilled') {
                    responses.push(result.value);
                }
            });

            // 배치 간 대기 (Rate Limiting)
            if (i + batchSize < questions.length) {
                console.log('⏳ 배치 간 대기 중...');
                await this.delay(2000);
            }
        }

        console.log(`✅ AI 대화 완료 (${responses.length}개 응답)`);
        return responses;
    }

    /**
     * 타임아웃이 적용된 HTTP 요청
     */
    async makeRequestWithTimeout(url, method = 'GET', data = null, timeout = 5000) {
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
                    'User-Agent': 'Optimized-Cursor-Communicator/2.0'
                },
                timeout: timeout
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

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${timeout}ms`));
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
     * 최적화된 Rate Limiting
     */
    async checkRateLimit() {
        const now = Date.now();

        // 분당 요청 수 리셋
        if (now - this.rateLimiter.resetTime > 60000) {
            this.rateLimiter.requestCount = 0;
            this.rateLimiter.resetTime = now;
        }

        // 분당 한도 체크
        if (this.rateLimiter.requestCount >= this.rateLimiter.maxRequestsPerMinute) {
            const waitTime = 60000 - (now - this.rateLimiter.resetTime);
            console.log(`⚠️ 분당 한도 초과, ${Math.ceil(waitTime / 1000)}초 대기...`);
            await this.delay(waitTime);
            this.rateLimiter.requestCount = 0;
            this.rateLimiter.resetTime = Date.now();
        }

        // 최소 간격 체크
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;
        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const waitTime = this.rateLimiter.minInterval - timeSinceLastRequest;
            await this.delay(waitTime);
        }

        this.rateLimiter.requestCount++;
        this.rateLimiter.lastRequest = Date.now();
    }

    /**
     * 지연 함수
     */
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 🚀 고속 종합 분석
     */
    async performQuickAnalysis() {
        console.log('🚀 고속 종합 분석 시작...');
        const startTime = Date.now();

        try {
            // 1. 병렬 상태 확인
            const healthCheck = await this.quickHealthCheck();

            // 2. 최적화된 AI 대화
            const questions = [
                '현재 시스템 상태를 간단히 알려줘',
                '가장 중요한 성능 문제 1개만 알려줘',
                '즉시 적용 가능한 개선방안 1개만 제안해줘'
            ];

            const aiResponses = await this.optimizedAIChat(questions);

            const totalTime = Date.now() - startTime;

            const analysis = {
                timestamp: new Date().toISOString(),
                totalTime,
                healthCheck,
                aiResponses,
                summary: {
                    status: Object.values(healthCheck).some(env => env.status === 'online') ? 'operational' : 'down',
                    activeEnvironment: this.activeEnvironment,
                    responseTime: totalTime,
                    cacheHits: this.cache.size
                }
            };

            console.log(`✅ 고속 분석 완료 (${totalTime}ms)`);
            console.log('📊 요약:', JSON.stringify(analysis.summary, null, 2));

            return analysis;

        } catch (error) {
            console.error('❌ 고속 분석 실패:', error.message);
            throw error;
        }
    }
}

// CLI 실행
async function main() {
    const communicator = new OptimizedCursorCommunicator();

    try {
        await communicator.performQuickAnalysis();
    } catch (error) {
        console.error('❌ 실행 실패:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = OptimizedCursorCommunicator; 