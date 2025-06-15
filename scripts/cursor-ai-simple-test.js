#!/usr/bin/env node

/**
 * 🤖 Cursor AI 개발 어시스턴트 간단 테스트
 * 
 * 현재 프로젝트의 AI 시스템들을 테스트하고
 * 개발 관련 질의응답을 수행합니다.
 */

const https = require('https');
const http = require('http');

class SimpleCursorAITest {
    constructor() {
        this.environments = {
            local: 'http://localhost:3001',
            vercel: 'https://openmanager-vibe-v5.vercel.app'
        };
        this.activeEnvironment = null;
    }

    async detectEnvironment() {
        console.log('🔍 환경 감지 중...');

        for (const [name, url] of Object.entries(this.environments)) {
            try {
                const response = await this.makeRequest(`${url}/api/health`, 'GET', null, 3000);
                if (response.success) {
                    this.activeEnvironment = { name, url };
                    console.log(`✅ 활성 환경: ${name.toUpperCase()} (${url})`);
                    return this.activeEnvironment;
                }
            } catch (error) {
                console.log(`❌ ${name.toUpperCase()}: 연결 실패`);
            }
        }

        throw new Error('❌ 사용 가능한 환경을 찾을 수 없습니다.');
    }

    async testAIChat(query) {
        console.log(`💬 AI 채팅 테스트: "${query}"`);

        if (!this.activeEnvironment) {
            await this.detectEnvironment();
        }

        const chatRequest = {
            action: 'send',
            message: `OpenManager Vibe v5 개발 질문: ${query}
            
프로젝트 컨텍스트:
- Next.js 15.3.3 + TypeScript
- AI 시스템: MCP, RAG, Google AI, ML 엔진 통합
- 서버 모니터링 AI 에이전트 시스템

구체적이고 실행 가능한 조언을 제공해주세요.`,
            provider: 'google-ai'
        };

        try {
            const response = await this.makeRequest(
                `${this.activeEnvironment.url}/api/ai-chat`,
                'POST',
                chatRequest
            );

            console.log('✅ AI 채팅 응답 받음');
            return {
                success: true,
                response: response.data,
                responseTime: response.responseTime
            };

        } catch (error) {
            console.error('❌ AI 채팅 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async testDevelopmentAssistant(action, query) {
        console.log(`🔧 개발 어시스턴트 테스트: ${action}`);

        if (!this.activeEnvironment) {
            await this.detectEnvironment();
        }

        const assistantRequest = {
            action: action,
            query: query,
            context: {
                project: 'OpenManager Vibe v5',
                environment: this.activeEnvironment.name,
                timestamp: new Date().toISOString()
            }
        };

        try {
            const response = await this.makeRequest(
                `${this.activeEnvironment.url}/api/ai-agent/development-assistant`,
                'POST',
                assistantRequest
            );

            console.log('✅ 개발 어시스턴트 응답 받음');
            return {
                success: true,
                response: response.data,
                responseTime: response.responseTime
            };

        } catch (error) {
            console.error('❌ 개발 어시스턴트 실패:', error.message);
            return {
                success: false,
                error: error.message
            };
        }
    }

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
                    'User-Agent': 'Cursor-AI-Simple-Test/1.0'
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
}

async function main() {
    const args = process.argv.slice(2);
    const testType = args.find(arg => arg.startsWith('--test='))?.split('=')[1] || 'chat';
    const query = args.find(arg => arg.startsWith('--query='))?.split('=')[1] || 'AI 시스템 성능 최적화 방법';

    const tester = new SimpleCursorAITest();

    try {
        console.log('🤖 Cursor AI 간단 테스트 시작');
        console.log(`📋 테스트 타입: ${testType}`);
        console.log(`❓ 질문: ${query}`);
        console.log('='.repeat(60));

        let result;

        switch (testType) {
            case 'chat':
                result = await tester.testAIChat(query);
                break;

            case 'assistant':
                result = await tester.testDevelopmentAssistant('consult', query);
                break;

            case 'analyze':
                result = await tester.testDevelopmentAssistant('analyze', query);
                break;

            default:
                console.error(`❌ 지원하지 않는 테스트 타입: ${testType}`);
                console.log('사용 가능한 타입: chat, assistant, analyze');
                process.exit(1);
        }

        console.log('\n📊 테스트 결과:');
        console.log(JSON.stringify(result, null, 2));

        if (result.success) {
            console.log('\n✅ 테스트 성공!');
        } else {
            console.log('\n❌ 테스트 실패!');
        }

    } catch (error) {
        console.error('❌ 테스트 실행 실패:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { SimpleCursorAITest };