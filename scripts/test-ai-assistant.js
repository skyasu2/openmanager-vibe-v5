#!/usr/bin/env node

const https = require('https');
const http = require('http');

async function makeRequest(url, method = 'GET', data = null) {
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
                'User-Agent': 'AI-Assistant-Test/1.0'
            },
            timeout: 10000
        };

        if (data && method !== 'GET') {
            const jsonData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(jsonData);
        }

        const req = client.request(options, (res) => {
            let responseData = '';
            res.on('data', (chunk) => { responseData += chunk; });
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                try {
                    const parsedData = JSON.parse(responseData);
                    resolve({ success: true, data: parsedData, responseTime });
                } catch (error) {
                    resolve({ success: true, data: responseData, responseTime });
                }
            });
        });

        req.on('error', (error) => reject(error));
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

        if (data && method !== 'GET') {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

async function testAIChat() {
    console.log('🤖 AI 채팅 테스트 시작...');

    const environments = [
        'http://localhost:3004',
        'http://localhost:3003',
        'http://localhost:3001'
    ];

    for (const baseUrl of environments) {
        try {
            console.log(`🔍 ${baseUrl} 테스트 중...`);

            // 1. Health Check
            const health = await makeRequest(`${baseUrl}/api/health`);
            if (!health.success) continue;

            console.log(`✅ Health OK (${health.responseTime}ms)`);

            // 2. AI Chat Test
            const chatRequest = {
                action: 'send',
                message: 'OpenManager Vibe v5 AI 시스템의 현재 상태와 성능 최적화 방법을 알려주세요.',
                provider: 'google-ai'
            };

            const chatResponse = await makeRequest(`${baseUrl}/api/ai-chat`, 'POST', chatRequest);

            if (chatResponse.success) {
                console.log(`✅ AI 채팅 성공 (${chatResponse.responseTime}ms)`);
                console.log('📝 응답:', JSON.stringify(chatResponse.data, null, 2));
                return { success: true, baseUrl, response: chatResponse };
            }

        } catch (error) {
            console.log(`❌ ${baseUrl}: ${error.message}`);
        }
    }

    return { success: false, error: '모든 환경에서 실패' };
}

async function main() {
    try {
        const result = await testAIChat();

        if (result.success) {
            console.log('\n🎉 AI 개발 어시스턴트 테스트 성공!');
            console.log(`🌐 활성 환경: ${result.baseUrl}`);
        } else {
            console.log('\n❌ AI 개발 어시스턴트 테스트 실패');
            console.log(`🚫 오류: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ 테스트 실행 오류:', error.message);
    }
}

main();