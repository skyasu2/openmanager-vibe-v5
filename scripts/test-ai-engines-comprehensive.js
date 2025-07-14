const http = require('http');

// HTTP 요청을 Promise로 래핑하는 함수
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: 10000
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

        req.on('error', (err) => {
            resolve({ status: 'ERROR', error: err.message });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({ status: 'TIMEOUT', error: 'Request timeout' });
        });

        if (options.body) {
            req.write(JSON.stringify(options.body));
        }

        req.end();
    });
}

async function testAIEngines() {
    console.log('🚀 OpenManager Vibe v5 - AI 엔진 종합 테스트 시작\n');

    const tests = [
        {
            name: '1. 헬스 체크 API',
            url: 'http://localhost:3000/api/health',
            expected: 'AI 엔진 상태 확인'
        },
        {
            name: '2. Supabase RAG 엔진 테스트',
            url: 'http://localhost:3000/api/test-supabase-rag',
            expected: 'Supabase 벡터 검색 기능'
        },
        {
            name: '3. Google AI 상태 확인',
            url: 'http://localhost:3000/api/ai-agent/learning/gemini-status',
            expected: 'Google AI 연동 상태'
        },
        {
            name: '4. AI 어시스턴트 상태',
            url: 'http://localhost:3000/api/ai-agent',
            method: 'POST',
            body: {
                message: 'AI 엔진 상태를 확인해주세요',
                context: 'test'
            },
            expected: 'AI 어시스턴트 응답'
        },
        {
            name: '5. 서버 데이터 API',
            url: 'http://localhost:3000/api/servers',
            expected: '서버 모니터링 데이터'
        }
    ];

    let passedTests = 0;
    let totalTests = tests.length;

    for (const test of tests) {
        console.log(`\n🧪 ${test.name}`);
        console.log(`📡 URL: ${test.url}`);

        try {
            const result = await makeRequest(test.url, {
                method: test.method,
                body: test.body
            });

            if (result.status === 'ERROR' || result.status === 'TIMEOUT') {
                console.log(`❌ 실패: ${result.error}`);
            } else if (result.status === 200) {
                console.log(`✅ 성공 (${result.status})`);

                // 응답 데이터 요약 출력
                if (typeof result.data === 'object' && result.data !== null) {
                    const keys = Object.keys(result.data);
                    console.log(`📊 응답 필드: ${keys.slice(0, 5).join(', ')}${keys.length > 5 ? '...' : ''}`);

                    // AI 엔진 특별 정보 출력
                    if (result.data.aiEngines) {
                        console.log(`🤖 AI 엔진 수: ${Object.keys(result.data.aiEngines).length}개`);
                    }
                    if (result.data.success) {
                        console.log(`🎯 상태: ${result.data.message || 'OK'}`);
                    }
                    if (result.data.results) {
                        console.log(`🔍 검색 결과: ${result.data.results.found || 0}개`);
                    }
                }
                passedTests++;
            } else {
                console.log(`⚠️ 비정상 응답 (${result.status})`);
                console.log(`📄 응답: ${JSON.stringify(result.data).substring(0, 200)}...`);
            }
        } catch (error) {
            console.log(`❌ 예외 발생: ${error.message}`);
        }

        // 각 테스트 간 짧은 대기
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n' + '='.repeat(60));
    console.log(`🎯 테스트 결과: ${passedTests}/${totalTests} 통과 (${Math.round(passedTests / totalTests * 100)}%)`);

    if (passedTests === totalTests) {
        console.log('🎉 모든 AI 엔진이 정상 작동하고 있습니다!');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('✅ 대부분의 AI 엔진이 정상 작동합니다.');
    } else {
        console.log('⚠️ 일부 AI 엔진에 문제가 있을 수 있습니다.');
    }

    console.log('='.repeat(60));
}

// 테스트 실행
testAIEngines().catch(console.error); 