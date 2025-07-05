#!/usr/bin/env node

/**
 * 🤖 Cursor AI 개발 어시스턴트 v2.0
 * 
 * OpenManager Vibe v5의 AI 시스템들을 통합 활용하여
 * 커서가 개발할 때 필요한 정보를 자동으로 수집하고 분석합니다.
 * 
 * 🧠 통합 AI 시스템:
 * - MCP AI: 실시간 컨텍스트 분석
 * - RAG AI: 기존 지식 기반 조언  
 * - Google AI: 복잡한 문제 해결
 * - ML 엔진: 성능 예측 및 최적화
 * 
 * 사용법:
 * node scripts/cursor-ai-development-assistant.js --action=analyze
 * node scripts/cursor-ai-development-assistant.js --action=consult --query="성능 최적화 방법"
 * node scripts/cursor-ai-development-assistant.js --action=review --component="AI 엔진"
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class CursorAIDevelopmentAssistant {
    constructor() {
        // 환경 설정
        this.environments = {
            // 개발 환경 (우선순위 1)
            local: 'http://localhost:3001',
            local_alt: 'http://localhost:3002',
            local_alt2: 'http://localhost:3003',
            local_alt3: 'http://localhost:3004',
            // 배포 환경 (백업)
            vercel: 'https://openmanager-vibe-v5.vercel.app',
            render: 'https://openmanager-vibe-v5.onrender.com'
        };

        this.activeEnvironment = null;

        // AI 시스템 엔드포인트
        this.aiEndpoints = {
            // 통합 AI 채팅 (메인)
            aiChat: '/api/ai-chat',
            aiStatus: '/api/ai-chat?action=status',

            // 개별 AI 엔진들
            mcpQuery: '/api/mcp/query',
            // mcpStatus: '/api/mcp/monitoring',

            // AI 엔진 상태
            aiEngines: '/api/ai/engines/status',
            aiHealth: '/api/ai/health',
            aiUnified: '/api/ai/unified/status',

            // 시스템 정보
            health: '/api/health',
            metrics: '/api/metrics/performance',
            systemStatus: '/api/system/unified/status',

            // AI 에이전트
            aiAgent: '/api/ai-agent/integrated',
            aiAgentStream: '/api/ai-agent/stream'
        };

        // AI 개발 컨설팅 세션
        this.consultingSession = {
            sessionId: null,
            provider: 'google-ai', // 기본 AI 제공자
            context: {},
            history: []
        };

        // Rate Limiting (Google AI 보호)
        this.rateLimiter = {
            lastRequest: 0,
            minInterval: 1000, // 1초 간격
            requestCount: 0,
            maxRequestsPerMinute: 20 // 분당 20회
        };
    }

    /**
     * 🔍 환경 자동 감지 및 연결
     */
    async detectActiveEnvironment() {
        console.log('🔍 활성 개발 환경 감지 중...');

        const envOrder = ['local', 'local_alt', 'local_alt2', 'local_alt3', 'vercel', 'render'];

        for (const env of envOrder) {
            try {
                const url = this.environments[env];
                const response = await this.makeRequest(`${url}/api/health`, 'GET', null, 3000);

                if (response.success) {
                    this.activeEnvironment = env;
                    console.log(`✅ 활성 환경: ${env.toUpperCase()} (${url})`);
                    console.log(`📊 응답시간: ${response.responseTime}ms`);
                    return { environment: env, url, responseTime: response.responseTime };
                }
            } catch (error) {
                console.log(`❌ ${env.toUpperCase()}: 연결 실패`);
            }
        }

        throw new Error('❌ 사용 가능한 환경을 찾을 수 없습니다.');
    }

    /**
     * 🤖 AI 시스템 상태 종합 분석
     */
    async analyzeAISystemStatus() {
        console.log('🤖 AI 시스템 상태 종합 분석 중...');

        if (!this.activeEnvironment) {
            await this.detectActiveEnvironment();
        }

        const baseUrl = this.environments[this.activeEnvironment];
        const analysis = {
            timestamp: new Date().toISOString(),
            environment: this.activeEnvironment,
            aiSystems: {},
            recommendations: [],
            issues: [],
            performance: {}
        };

        try {
            // 1. AI 채팅 시스템 상태
            console.log('📡 AI 채팅 시스템 확인...');
            try {
                const aiChatStatus = await this.makeRequest(`${baseUrl}${this.aiEndpoints.aiStatus}`);
                analysis.aiSystems.aiChat = {
                    status: 'active',
                    data: aiChatStatus.data,
                    responseTime: aiChatStatus.responseTime
                };
                console.log(`✅ AI 채팅: 활성 (${aiChatStatus.responseTime}ms)`);
            } catch (error) {
                analysis.aiSystems.aiChat = { status: 'error', error: error.message };
                analysis.issues.push('AI 채팅 시스템 연결 실패');
            }

            // 2. MCP 시스템 상태
            console.log('🔗 MCP 시스템 확인...');
            try {
                const mcpStatus = await this.makeRequest(`${baseUrl}${this.aiEndpoints.mcpStatus}`);
                analysis.aiSystems.mcp = {
                    status: 'active',
                    data: mcpStatus.data,
                    responseTime: mcpStatus.responseTime
                };
                console.log(`✅ MCP: 활성 (${mcpStatus.responseTime}ms)`);
            } catch (error) {
                analysis.aiSystems.mcp = { status: 'error', error: error.message };
                analysis.issues.push('MCP 시스템 연결 실패');
            }

            // 3. AI 엔진들 상태
            console.log('⚙️ AI 엔진들 확인...');
            try {
                const enginesStatus = await this.makeRequest(`${baseUrl}${this.aiEndpoints.aiEngines}`);
                analysis.aiSystems.engines = {
                    status: 'active',
                    data: enginesStatus.data,
                    responseTime: enginesStatus.responseTime
                };
                console.log(`✅ AI 엔진들: 활성 (${enginesStatus.responseTime}ms)`);
            } catch (error) {
                analysis.aiSystems.engines = { status: 'error', error: error.message };
                analysis.issues.push('AI 엔진들 상태 확인 실패');
            }

            // 4. 시스템 성능 메트릭
            console.log('📈 시스템 성능 확인...');
            try {
                const [health, metrics] = await Promise.all([
                    this.makeRequest(`${baseUrl}${this.aiEndpoints.health}`),
                    this.makeRequest(`${baseUrl}${this.aiEndpoints.metrics}`).catch(() => ({ data: null }))
                ]);

                analysis.performance = {
                    health: health.data,
                    metrics: metrics.data,
                    overallResponseTime: health.responseTime
                };
                console.log(`✅ 시스템 성능: 정상 (${health.responseTime}ms)`);
            } catch (error) {
                analysis.performance = { error: error.message };
                analysis.issues.push('시스템 성능 메트릭 조회 실패');
            }

            // 5. 권장사항 생성
            this.generateRecommendations(analysis);

            return analysis;

        } catch (error) {
            console.error('❌ AI 시스템 분석 실패:', error.message);
            throw error;
        }
    }

    /**
     * 💬 AI 개발 컨설팅 (Multi-AI 협업)
     */
    async consultWithAI(query, options = {}) {
        console.log(`💬 AI 개발 컨설팅: "${query}"`);

        if (!this.activeEnvironment) {
            await this.detectActiveEnvironment();
        }

        await this.checkRateLimit();

        const baseUrl = this.environments[this.activeEnvironment];
        const consultingRequest = {
            action: 'send',
            message: this.buildDevelopmentQuery(query, options),
            sessionId: this.consultingSession.sessionId,
            provider: options.provider || this.consultingSession.provider
        };

        try {
            // AI 컨설팅 세션 시작 (필요시)
            if (!this.consultingSession.sessionId) {
                await this.startConsultingSession(options.provider);
            }

            const startTime = Date.now();
            const response = await this.makeRequest(
                `${baseUrl}${this.aiEndpoints.aiChat}`,
                'POST',
                consultingRequest
            );

            // 안전한 응답 처리
            const responseData = response.data || {};
            const responseText = responseData.response ||
                responseData.data?.response ||
                responseData.answer ||
                JSON.stringify(responseData);

            const consultingResult = {
                query,
                response: responseText,
                provider: responseData.session?.provider || 'unknown',
                processingTime: Date.now() - startTime,
                confidence: this.extractConfidence(responseText),
                recommendations: this.extractRecommendations(responseText),
                codeExamples: this.extractCodeExamples(responseText),
                timestamp: new Date().toISOString()
            };

            // 세션 히스토리 업데이트
            this.consultingSession.history.push({
                query,
                response: consultingResult,
                timestamp: consultingResult.timestamp
            });

            console.log(`✅ AI 컨설팅 완료 (${consultingResult.processingTime}ms)`);
            console.log(`🤖 AI 제공자: ${consultingResult.provider}`);
            console.log(`📊 신뢰도: ${consultingResult.confidence}%`);

            return consultingResult;

        } catch (error) {
            console.error('❌ AI 컨설팅 실패:', error.message);
            throw error;
        }
    }

    /**
     * 🔍 컴포넌트별 AI 리뷰
     */
    async reviewComponent(componentName, options = {}) {
        console.log(`🔍 컴포넌트 AI 리뷰: ${componentName}`);

        // 컴포넌트 관련 파일들 스캔
        const componentFiles = await this.scanComponentFiles(componentName);

        // 컴포넌트 분석 쿼리 생성
        const reviewQuery = this.buildComponentReviewQuery(componentName, componentFiles, options);

        // Multi-AI 리뷰 실행
        const aiReview = await this.consultWithAI(reviewQuery, {
            provider: 'google-ai', // 복잡한 코드 분석은 Google AI 사용
            context: { component: componentName, files: componentFiles }
        });

        return {
            component: componentName,
            files: componentFiles,
            aiReview,
            suggestions: this.generateComponentSuggestions(aiReview),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * 🚀 실시간 개발 피드백
     */
    async getRealtimeDevelopmentFeedback(context = {}) {
        console.log('🚀 실시간 개발 피드백 수집 중...');

        const feedback = {
            timestamp: new Date().toISOString(),
            context,
            aiAnalysis: null,
            systemStatus: null,
            recommendations: [],
            alerts: []
        };

        try {
            // 1. 현재 AI 시스템 상태 분석
            feedback.systemStatus = await this.analyzeAISystemStatus();

            // 2. 컨텍스트 기반 AI 분석
            if (context.currentTask) {
                const analysisQuery = `현재 작업: ${context.currentTask}
                
프로젝트 컨텍스트:
- 환경: ${this.activeEnvironment}
- AI 시스템 상태: ${feedback.systemStatus.aiSystems ? '정상' : '문제 있음'}
- 성능: ${feedback.systemStatus.performance?.overallResponseTime || 'N/A'}ms

이 작업에 대한 개발 조언과 주의사항을 알려주세요.`;

                feedback.aiAnalysis = await this.consultWithAI(analysisQuery, {
                    provider: 'google-ai'
                });
            }

            // 3. 실시간 권장사항 생성
            feedback.recommendations = this.generateRealtimeRecommendations(feedback);

            // 4. 알림 생성
            feedback.alerts = this.generateDevelopmentAlerts(feedback);

            return feedback;

        } catch (error) {
            console.error('❌ 실시간 피드백 수집 실패:', error.message);
            feedback.error = error.message;
            return feedback;
        }
    }

    /**
     * 🛠️ 개발 컨설팅 세션 시작
     */
    async startConsultingSession(provider = 'google-ai') {
        console.log(`🛠️ AI 개발 컨설팅 세션 시작 (${provider})`);

        if (!this.activeEnvironment) {
            await this.detectActiveEnvironment();
        }

        const baseUrl = this.environments[this.activeEnvironment];
        const sessionRequest = {
            action: 'start',
            provider: provider,
            title: `OpenManager Vibe v5 개발 컨설팅 - ${new Date().toLocaleString()}`
        };

        try {
            const response = await this.makeRequest(
                `${baseUrl}${this.aiEndpoints.aiChat}`,
                'POST',
                sessionRequest
            );

            // 안전한 세션 ID 처리
            const sessionId = response.data?.sessionId ||
                response.data?.data?.sessionId ||
                `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            this.consultingSession.sessionId = sessionId;
            this.consultingSession.provider = provider;
            this.consultingSession.context = {
                project: 'OpenManager Vibe v5',
                aiSystems: ['MCP', 'RAG', 'Google AI', 'ML'],
                startTime: new Date().toISOString()
            };

            console.log(`✅ 컨설팅 세션 시작됨: ${this.consultingSession.sessionId}`);
            return this.consultingSession.sessionId;

        } catch (error) {
            console.error('❌ 컨설팅 세션 시작 실패:', error.message);

            // 에러 발생시에도 임시 세션 생성
            const fallbackSessionId = `fallback_session_${Date.now()}`;
            this.consultingSession.sessionId = fallbackSessionId;
            this.consultingSession.provider = provider;
            this.consultingSession.context = {
                project: 'OpenManager Vibe v5',
                aiSystems: ['MCP', 'RAG', 'Google AI', 'ML'],
                startTime: new Date().toISOString()
            };

            console.log(`⚠️ 폴백 세션 생성: ${fallbackSessionId}`);
            return fallbackSessionId;
        }
    }

    /**
     * 📝 개발 쿼리 빌더
     */
    buildDevelopmentQuery(query, options = {}) {
        const context = `
🚀 OpenManager Vibe v5 개발 컨텍스트:

**프로젝트 정보:**
- 서버 모니터링 AI 에이전트 시스템
- Next.js 15.3.3 + TypeScript
- AI 시스템: MCP, RAG, Google AI, ML 엔진 통합

**현재 환경:**
- 활성 환경: ${this.activeEnvironment}
- AI 시스템 상태: ${this.consultingSession.context?.aiSystems?.join(', ') || 'Unknown'}

**개발자 질문:**
${query}

**요청사항:**
- 구체적이고 실행 가능한 조언 제공
- 코드 예제 포함 (가능한 경우)
- 성능 최적화 고려사항
- 잠재적 문제점 및 해결방안
- OpenManager Vibe v5 프로젝트에 특화된 권장사항

${options.context ? `\n**추가 컨텍스트:**\n${JSON.stringify(options.context, null, 2)}` : ''}
`;

        return context;
    }

    /**
     * 📁 컴포넌트 파일 스캔
     */
    async scanComponentFiles(componentName) {
        const possiblePaths = [
            `src/components/${componentName}`,
            `src/modules/${componentName}`,
            `src/services/${componentName}`,
            `src/app/${componentName}`,
            `src/core/${componentName}`
        ];

        const foundFiles = [];

        for (const basePath of possiblePaths) {
            try {
                if (fs.existsSync(basePath)) {
                    const files = this.scanDirectory(basePath);
                    foundFiles.push(...files);
                }
            } catch (error) {
                // 디렉토리가 없으면 무시
            }
        }

        return foundFiles.slice(0, 10); // 최대 10개 파일만
    }

    /**
     * 📂 디렉토리 스캔
     */
    scanDirectory(dirPath) {
        const files = [];

        try {
            const items = fs.readdirSync(dirPath);

            for (const item of items) {
                const fullPath = path.join(dirPath, item);
                const stat = fs.statSync(fullPath);

                if (stat.isFile() && (item.endsWith('.ts') || item.endsWith('.tsx') || item.endsWith('.js') || item.endsWith('.jsx'))) {
                    files.push({
                        path: fullPath,
                        name: item,
                        size: stat.size,
                        modified: stat.mtime
                    });
                } else if (stat.isDirectory() && files.length < 20) {
                    files.push(...this.scanDirectory(fullPath));
                }
            }
        } catch (error) {
            // 스캔 실패시 무시
        }

        return files;
    }

    /**
     * 🔍 컴포넌트 리뷰 쿼리 빌더
     */
    buildComponentReviewQuery(componentName, files, options = {}) {
        return `
🔍 ${componentName} 컴포넌트 AI 리뷰 요청

**컴포넌트 정보:**
- 이름: ${componentName}
- 관련 파일 수: ${files.length}개
- 파일 목록: ${files.map(f => f.name).join(', ')}

**리뷰 요청사항:**
1. 코드 품질 및 구조 분석
2. 성능 최적화 가능성
3. 보안 취약점 검토
4. TypeScript 타입 안전성
5. React/Next.js 모범 사례 준수 여부
6. AI 시스템 통합 관련 개선사항

**특별 고려사항:**
- OpenManager Vibe v5의 AI 에이전트 시스템 컨텍스트
- MCP, RAG, Google AI, ML 엔진과의 연동성
- 실시간 모니터링 시스템과의 호환성

구체적인 개선 제안과 코드 예제를 포함해서 답변해주세요.
`;
    }

    /**
     * 📊 권장사항 생성
     */
    generateRecommendations(analysis) {
        const recommendations = [];

        // AI 시스템 상태 기반 권장사항
        if (analysis.issues.length > 0) {
            recommendations.push({
                type: 'critical',
                title: 'AI 시스템 연결 문제 해결 필요',
                description: `${analysis.issues.length}개의 AI 시스템 연결 문제가 발견되었습니다.`,
                actions: analysis.issues.map(issue => `- ${issue} 해결`)
            });
        }

        // 성능 기반 권장사항
        if (analysis.performance?.overallResponseTime > 5000) {
            recommendations.push({
                type: 'performance',
                title: '응답시간 최적화 필요',
                description: `현재 응답시간이 ${analysis.performance.overallResponseTime}ms로 느립니다.`,
                actions: [
                    '- AI 엔진 캐싱 활성화',
                    '- 병렬 처리 최적화',
                    '- Rate Limiting 조정'
                ]
            });
        }

        // AI 시스템 활용도 기반 권장사항
        const activeAISystems = Object.values(analysis.aiSystems).filter(system => system.status === 'active').length;
        if (activeAISystems < 3) {
            recommendations.push({
                type: 'optimization',
                title: 'AI 시스템 활용도 개선',
                description: `${activeAISystems}개의 AI 시스템만 활성화되어 있습니다.`,
                actions: [
                    '- MCP 시스템 연결 확인',
                    '- RAG 엔진 초기화',
                    '- Google AI API 키 검증'
                ]
            });
        }

        analysis.recommendations = recommendations;
    }

    /**
     * 🚨 개발 알림 생성
     */
    generateDevelopmentAlerts(feedback) {
        const alerts = [];

        // 시스템 상태 알림
        if (feedback.systemStatus?.issues?.length > 0) {
            alerts.push({
                level: 'warning',
                message: `${feedback.systemStatus.issues.length}개의 AI 시스템 문제 감지`,
                details: feedback.systemStatus.issues
            });
        }

        // 성능 알림
        if (feedback.systemStatus?.performance?.overallResponseTime > 3000) {
            alerts.push({
                level: 'info',
                message: '응답시간이 평소보다 느립니다',
                details: [`현재: ${feedback.systemStatus.performance.overallResponseTime}ms`]
            });
        }

        return alerts;
    }

    /**
     * 🎯 실시간 권장사항 생성
     */
    generateRealtimeRecommendations(feedback) {
        const recommendations = [];

        // AI 분석 기반 권장사항
        if (feedback.aiAnalysis?.recommendations) {
            recommendations.push(...feedback.aiAnalysis.recommendations);
        }

        // 시스템 상태 기반 권장사항
        if (feedback.systemStatus?.recommendations) {
            recommendations.push(...feedback.systemStatus.recommendations);
        }

        return recommendations;
    }

    /**
     * 🔍 응답에서 정보 추출
     */
    extractConfidence(response) {
        // 안전한 문자열 처리
        if (!response || typeof response !== 'string') {
            return 60;
        }

        // 간단한 신뢰도 추출 로직
        if (response.includes('확실') || response.includes('권장')) return 90;
        if (response.includes('가능') || response.includes('고려')) return 70;
        if (response.includes('주의') || response.includes('검토')) return 50;
        return 60;
    }

    extractRecommendations(response) {
        // 안전한 문자열 처리
        if (!response || typeof response !== 'string') {
            return [];
        }

        const recommendations = [];
        const lines = response.split('\n');

        for (const line of lines) {
            if (line.includes('권장') || line.includes('제안') || line.includes('추천')) {
                recommendations.push(line.trim());
            }
        }

        return recommendations.slice(0, 5); // 최대 5개
    }

    extractCodeExamples(response) {
        // 안전한 문자열 처리
        if (!response || typeof response !== 'string') {
            return [];
        }

        const codeBlocks = [];
        const codeRegex = /```[\s\S]*?```/g;
        const matches = response.match(codeRegex);

        if (matches) {
            codeBlocks.push(...matches.slice(0, 3)); // 최대 3개
        }

        return codeBlocks;
    }

    /**
     * 🔄 Rate Limiting 체크
     */
    async checkRateLimit() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.rateLimiter.lastRequest;

        if (timeSinceLastRequest < this.rateLimiter.minInterval) {
            const waitTime = this.rateLimiter.minInterval - timeSinceLastRequest;
            console.log(`⏳ Rate Limiting: ${waitTime}ms 대기 중...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }

        this.rateLimiter.lastRequest = Date.now();
        this.rateLimiter.requestCount++;
    }

    /**
     * 🌐 HTTP 요청 헬퍼
     */
    async makeRequest(url, method = 'GET', data = null, timeout = 10000) {
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
                    'User-Agent': 'Cursor-AI-Development-Assistant/2.0'
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
                            success: true,
                            data: parsedData,
                            responseTime,
                            statusCode: res.statusCode
                        });
                    } catch (error) {
                        resolve({
                            success: true,
                            data: responseData,
                            responseTime,
                            statusCode: res.statusCode
                        });
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`요청 실패: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`요청 타임아웃 (${timeout}ms)`));
            });

            if (data && method !== 'GET') {
                req.write(JSON.stringify(data));
            }

            req.end();
        });
    }

    /**
     * 📊 종합 개발 대시보드
     */
    async generateDevelopmentDashboard() {
        console.log('📊 개발 대시보드 생성 중...');

        const dashboard = {
            timestamp: new Date().toISOString(),
            environment: null,
            aiSystemAnalysis: null,
            realtimeFeedback: null,
            consultingHistory: this.consultingSession.history,
            summary: {
                totalQueries: this.consultingSession.history.length,
                averageResponseTime: 0,
                activeAISystems: 0,
                recommendations: []
            }
        };

        try {
            // 1. 환경 감지
            const envInfo = await this.detectActiveEnvironment();
            dashboard.environment = envInfo;

            // 2. AI 시스템 분석
            dashboard.aiSystemAnalysis = await this.analyzeAISystemStatus();

            // 3. 실시간 피드백
            dashboard.realtimeFeedback = await this.getRealtimeDevelopmentFeedback({
                currentTask: '개발 대시보드 생성'
            });

            // 4. 요약 정보 계산
            if (this.consultingSession.history.length > 0) {
                const totalTime = this.consultingSession.history.reduce(
                    (sum, item) => sum + (item.response?.processingTime || 0), 0
                );
                dashboard.summary.averageResponseTime = Math.round(totalTime / this.consultingSession.history.length);
            }

            dashboard.summary.activeAISystems = Object.values(dashboard.aiSystemAnalysis.aiSystems)
                .filter(system => system.status === 'active').length;

            dashboard.summary.recommendations = [
                ...dashboard.aiSystemAnalysis.recommendations,
                ...dashboard.realtimeFeedback.recommendations
            ].slice(0, 10);

            return dashboard;

        } catch (error) {
            console.error('❌ 개발 대시보드 생성 실패:', error.message);
            dashboard.error = error.message;
            return dashboard;
        }
    }
}

/**
 * 🚀 메인 실행 함수
 */
async function main() {
    const args = process.argv.slice(2);
    const action = args.find(arg => arg.startsWith('--action='))?.split('=')[1] || 'analyze';
    const query = args.find(arg => arg.startsWith('--query='))?.split('=')[1];
    const component = args.find(arg => arg.startsWith('--component='))?.split('=')[1];

    const assistant = new CursorAIDevelopmentAssistant();

    try {
        console.log('🤖 Cursor AI 개발 어시스턴트 v2.0 시작');
        console.log(`📋 실행 액션: ${action}`);
        console.log('='.repeat(60));

        switch (action) {
            case 'analyze':
                console.log('🔍 AI 시스템 종합 분석 실행...');
                const analysis = await assistant.analyzeAISystemStatus();
                console.log('\n📊 분석 결과:');
                console.log(JSON.stringify(analysis, null, 2));
                break;

            case 'consult':
                if (!query) {
                    console.error('❌ --query 파라미터가 필요합니다.');
                    console.log('예시: --query="성능 최적화 방법"');
                    process.exit(1);
                }
                console.log(`💬 AI 개발 컨설팅 실행: "${query}"`);
                const consultResult = await assistant.consultWithAI(query);
                console.log('\n🤖 AI 컨설팅 결과:');
                console.log(JSON.stringify(consultResult, null, 2));
                break;

            case 'review':
                if (!component) {
                    console.error('❌ --component 파라미터가 필요합니다.');
                    console.log('예시: --component="AI 엔진"');
                    process.exit(1);
                }
                console.log(`🔍 컴포넌트 리뷰 실행: ${component}`);
                const reviewResult = await assistant.reviewComponent(component);
                console.log('\n📝 컴포넌트 리뷰 결과:');
                console.log(JSON.stringify(reviewResult, null, 2));
                break;

            case 'feedback':
                console.log('🚀 실시간 개발 피드백 수집...');
                const feedback = await assistant.getRealtimeDevelopmentFeedback({
                    currentTask: query || '일반 개발 작업'
                });
                console.log('\n📡 실시간 피드백:');
                console.log(JSON.stringify(feedback, null, 2));
                break;

            case 'dashboard':
                console.log('📊 종합 개발 대시보드 생성...');
                const dashboard = await assistant.generateDevelopmentDashboard();
                console.log('\n🎯 개발 대시보드:');
                console.log(JSON.stringify(dashboard, null, 2));
                break;

            default:
                console.error(`❌ 지원하지 않는 액션: ${action}`);
                console.log('사용 가능한 액션: analyze, consult, review, feedback, dashboard');
                process.exit(1);
        }

        console.log('\n✅ 작업 완료!');

    } catch (error) {
        console.error('❌ 실행 실패:', error.message);
        process.exit(1);
    }
}

// 스크립트 직접 실행시에만 main 함수 호출
if (require.main === module) {
    main();
}

module.exports = { CursorAIDevelopmentAssistant };