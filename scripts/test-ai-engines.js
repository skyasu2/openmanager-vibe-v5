const https = require('https');
const http = require('http');

// HTTP 요청을 Promise로 래핑하는 함수
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https:') ? https : http;

        const req = protocol.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: jsonData });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testAIEngines() {
    console.log('🤖 AI 엔진 테스트 시작...\n');

    const baseUrl = 'http://localhost:3000';

    // 1. 기본 헬스체크
    console.log('1️⃣ 기본 헬스체크 테스트');
    try {
        const health = await makeRequest(`${baseUrl}/api/health`);
        console.log(`   상태: ${health.status}`);
        console.log(`   응답:`, health.data);
    } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
    }

    console.log('\n2️⃣ Supabase RAG 엔진 테스트');
    try {
        const ragTest = await makeRequest(`${baseUrl}/api/test-supabase-rag`);
        console.log(`   상태: ${ragTest.status}`);
        console.log(`   응답:`, JSON.stringify(ragTest.data, null, 2));
    } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
    }

    console.log('\n3️⃣ Google AI 상태 테스트');
    try {
        const googleAI = await makeRequest(`${baseUrl}/api/ai/google-ai/status`);
        console.log(`   상태: ${googleAI.status}`);
        console.log(`   응답:`, JSON.stringify(googleAI.data, null, 2));
    } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
    }

    console.log('\n4️⃣ AI 에이전트 상태 테스트');
    try {
        const aiAgent = await makeRequest(`${baseUrl}/api/ai-agent/status`);
        console.log(`   상태: ${aiAgent.status}`);
        console.log(`   응답:`, JSON.stringify(aiAgent.data, null, 2));
    } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
    }

    console.log('\n5️⃣ AI 채팅 테스트');
    try {
        const chatTest = await makeRequest(`${baseUrl}/api/ai-chat`, {
            method: 'POST',
            body: {
                message: 'Hello, test message',
                engine: 'supabase-rag'
            }
        });
        console.log(`   상태: ${chatTest.status}`);
        console.log(`   응답:`, JSON.stringify(chatTest.data, null, 2));
    } catch (error) {
        console.log(`   ❌ 오류: ${error.message}`);
    }

    console.log('\n✅ AI 엔진 테스트 완료!');
}

testAIEngines().catch(console.error); 