const http = require('http');

function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = http.request(url, {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: 15000
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

async function testAIAssistantFrontend() {
    console.log('🤖 OpenManager Vibe v5 - AI 어시스턴트 프론트엔드 기능 테스트\n');

    const testMessages = [
        {
            name: '1. 기본 상태 확인',
            message: '안녕하세요',
            context: 'greeting'
        },
        {
            name: '2. 서버 상태 질의',
            message: '서버 상태를 확인해주세요',
            context: 'server-monitoring'
        },
        {
            name: '3. CPU 사용률 질의',
            message: 'CPU 사용률이 높은 서버를 찾아주세요',
            context: 'performance-analysis'
        },
        {
            name: '4. AI 엔진 정보 질의',
            message: '현재 사용 중인 AI 엔진들을 알려주세요',
            context: 'ai-status'
        },
        {
            name: '5. 한국어 자연어 처리 테스트',
            message: '메모리 사용량이 80% 이상인 서버들의 상태를 분석해주세요',
            context: 'korean-nlp'
        }
    ];

    let successCount = 0;
    let totalTests = testMessages.length;

    for (const test of testMessages) {
        console.log(`\n🧪 ${test.name}`);
        console.log(`💬 메시지: "${test.message}"`);
        console.log(`📝 컨텍스트: ${test.context}`);

        try {
            const startTime = Date.now();
            const result = await makeRequest('http://localhost:3000/api/ai-agent', {
                method: 'POST',
                body: {
                    message: test.message,
                    context: test.context
                }
            });
            const responseTime = Date.now() - startTime;

            if (result.status === 200 && result.data.success) {
                console.log(`✅ 성공 (${responseTime}ms)`);
                console.log(`🤖 AI 응답: ${result.data.response?.substring(0, 100)}...`);
                console.log(`🔧 사용된 엔진: ${result.data.engine || 'Unknown'}`);
                successCount++;
            } else if (result.status === 200 && !result.data.success) {
                console.log(`⚠️ API 응답 오류: ${result.data.error}`);
                console.log(`🔧 엔진 상태: ${result.data.engine || 'Unknown'}`);
            } else {
                console.log(`❌ HTTP 오류 (${result.status})`);
                console.log(`📄 응답: ${JSON.stringify(result.data).substring(0, 150)}...`);
            }
        } catch (error) {
            console.log(`❌ 예외 발생: ${error.message}`);
        }

        // 각 테스트 간 대기 (AI 엔진 부하 방지)
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n' + '='.repeat(70));
    console.log(`🎯 AI 어시스턴트 테스트 결과: ${successCount}/${totalTests} 성공 (${Math.round(successCount / totalTests * 100)}%)`);

    if (successCount === totalTests) {
        console.log('🎉 AI 어시스턴트가 완벽하게 작동하고 있습니다!');
        console.log('✅ 모든 AI 엔진이 정상적으로 통합되어 있습니다.');
    } else if (successCount >= totalTests * 0.6) {
        console.log('✅ AI 어시스턴트가 대체로 잘 작동합니다.');
        console.log('🔧 일부 기능은 추가 최적화가 필요할 수 있습니다.');
    } else {
        console.log('⚠️ AI 어시스턴트에 문제가 있습니다.');
        console.log('🛠️ 엔진 설정이나 연동을 점검해보세요.');
    }

    console.log('='.repeat(70));

    // 추가 기능 테스트 제안
    console.log('\n📋 추가 테스트 제안:');
    console.log('1. 브라우저에서 http://localhost:3000 접속');
    console.log('2. 우측 AI 어시스턴트 사이드바 클릭');
    console.log('3. 다양한 질문으로 대화형 테스트 수행');
    console.log('4. 서버 모니터링 페이지에서 AI 분석 기능 테스트');
}

// 테스트 실행
testAIAssistantFrontend().catch(console.error); 