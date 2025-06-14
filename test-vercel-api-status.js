/**
 * 🔍 OpenManager Vibe v5 - Vercel API 연결 상태 및 데이터 흐름 분석 스크립트
 * 
 * 전체적인 API 연결 상태와 서버 데이터 생성기의 데이터 흐름을 분석합니다.
 * 
 * 실행: node test-vercel-api-status.js
 */

const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

// 🎯 테스트할 API 엔드포인트들
const API_ENDPOINTS = {
    // 1. 대시보드 및 메인 데이터
    dashboard: '/api/dashboard',
    servers: '/api/servers',
    dataflow: '/api/dataflow',

    // 2. 데이터 생성기 상태
    dataGeneratorStatus: '/api/data-generator/unified?action=status',
    dataGeneratorGenerate: '/api/data-generator/unified?action=generate',
    optimizedGenerator: '/api/data-generator/optimized',

    // 3. AI 엔진 상태
    aiUnifiedStatus: '/api/ai/unified/status',
    aiEnginesStatus: '/api/ai/engines/status',
    aiGoogleStatus: '/api/ai/google-ai/status',

    // 4. 실시간 데이터
    realtimeServers: '/api/servers/realtime',
    streamData: '/api/stream',

    // 5. 메트릭 및 모니터링
    metrics: '/api/metrics',
    prometheus: '/api/prometheus',

    // 6. 시스템 상태
    health: '/api/health',
    status: '/api/status',
    version: '/api/version/status'
};

// 🔧 API 테스트 함수
async function testAPI(endpoint, description) {
    const url = `${BASE_URL}${endpoint}`;
    const startTime = Date.now();

    try {
        console.log(`\n🔍 테스트: ${description}`);
        console.log(`📡 URL: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'OpenManager-API-Test/1.0'
            }
        });

        const responseTime = Date.now() - startTime;
        const contentType = response.headers.get('content-type');

        console.log(`⏱️  응답 시간: ${responseTime}ms`);
        console.log(`📊 상태 코드: ${response.status} ${response.statusText}`);
        console.log(`📄 Content-Type: ${contentType}`);

        if (response.ok) {
            try {
                const data = await response.text();

                // JSON 응답인지 확인
                if (contentType && contentType.includes('application/json')) {
                    const jsonData = JSON.parse(data);
                    console.log(`✅ 성공: JSON 응답 (${data.length} bytes)`);

                    // 주요 데이터 구조 분석
                    if (jsonData.success !== undefined) {
                        console.log(`   📈 Success: ${jsonData.success}`);
                    }
                    if (jsonData.data) {
                        console.log(`   📊 Data Keys: ${Object.keys(jsonData.data).join(', ')}`);
                    }
                    if (jsonData.count !== undefined) {
                        console.log(`   🔢 Count: ${jsonData.count}`);
                    }
                    if (jsonData.servers) {
                        console.log(`   🖥️  Servers: ${jsonData.servers.length || 'N/A'}`);
                    }

                    return { success: true, data: jsonData, responseTime, status: response.status };
                } else {
                    console.log(`✅ 성공: 텍스트 응답 (${data.length} bytes)`);
                    return { success: true, data: data.substring(0, 200) + '...', responseTime, status: response.status };
                }
            } catch (parseError) {
                console.log(`⚠️  JSON 파싱 실패: ${parseError.message}`);
                return { success: false, error: 'JSON Parse Error', responseTime, status: response.status };
            }
        } else {
            console.log(`❌ 실패: ${response.status} ${response.statusText}`);
            return { success: false, error: `HTTP ${response.status}`, responseTime, status: response.status };
        }

    } catch (error) {
        const responseTime = Date.now() - startTime;
        console.log(`💥 오류: ${error.message}`);
        return { success: false, error: error.message, responseTime };
    }
}

// 📊 결과 분석 함수
function analyzeResults(results) {
    console.log('\n' + '='.repeat(80));
    console.log('📊 OpenManager Vibe v5 - API 연결 상태 분석 결과');
    console.log('='.repeat(80));

    const successful = results.filter(r => r.result.success);
    const failed = results.filter(r => !r.result.success);

    console.log(`\n🎯 전체 테스트: ${results.length}개`);
    console.log(`✅ 성공: ${successful.length}개 (${Math.round(successful.length / results.length * 100)}%)`);
    console.log(`❌ 실패: ${failed.length}개 (${Math.round(failed.length / results.length * 100)}%)`);

    // 평균 응답 시간
    const avgResponseTime = results.reduce((sum, r) => sum + (r.result.responseTime || 0), 0) / results.length;
    console.log(`⏱️  평균 응답 시간: ${Math.round(avgResponseTime)}ms`);

    // 성공한 API들
    if (successful.length > 0) {
        console.log('\n✅ 정상 작동 중인 API:');
        successful.forEach(r => {
            console.log(`   • ${r.description}: ${r.result.responseTime}ms`);
        });
    }

    // 실패한 API들
    if (failed.length > 0) {
        console.log('\n❌ 문제가 있는 API:');
        failed.forEach(r => {
            console.log(`   • ${r.description}: ${r.result.error}`);
        });
    }

    // 데이터 흐름 분석
    console.log('\n🔄 데이터 흐름 분석:');

    const dashboardResult = results.find(r => r.endpoint === '/api/dashboard');
    const dataGeneratorResult = results.find(r => r.endpoint === '/api/data-generator/unified?action=status');
    const serversResult = results.find(r => r.endpoint === '/api/servers');
    const aiResult = results.find(r => r.endpoint === '/api/ai/unified/status');

    if (dashboardResult?.result.success) {
        console.log('   ✅ 대시보드 API: 정상 - 메인 데이터 흐름 활성화');
    } else {
        console.log('   ❌ 대시보드 API: 문제 - 메인 데이터 흐름 차단');
    }

    if (dataGeneratorResult?.result.success) {
        console.log('   ✅ 데이터 생성기: 정상 - 서버 데이터 생성 활성화');
    } else {
        console.log('   ❌ 데이터 생성기: 문제 - 서버 데이터 생성 차단');
    }

    if (serversResult?.result.success) {
        console.log('   ✅ 서버 API: 정상 - 서버 모니터링 데이터 제공');
    } else {
        console.log('   ❌ 서버 API: 문제 - 서버 모니터링 데이터 차단');
    }

    if (aiResult?.result.success) {
        console.log('   ✅ AI 엔진: 정상 - AI 에이전트 데이터 연결 활성화');
    } else {
        console.log('   ❌ AI 엔진: 문제 - AI 에이전트 데이터 연결 차단');
    }

    // 권장사항
    console.log('\n💡 권장사항:');
    if (failed.length === 0) {
        console.log('   🎉 모든 API가 정상 작동 중입니다!');
        console.log('   📊 데이터 흐름: 서버 데이터 생성기 → API → AI 에이전트 완전 연결');
    } else if (failed.length < results.length / 2) {
        console.log('   ⚠️  일부 API에 문제가 있지만 핵심 기능은 작동 중입니다.');
        console.log('   🔧 실패한 API들을 우선적으로 점검해주세요.');
    } else {
        console.log('   🚨 다수의 API에 문제가 있습니다.');
        console.log('   🔧 Vercel 배포 상태와 환경변수를 점검해주세요.');
    }
}

// 🚀 메인 실행 함수
async function main() {
    console.log('🚀 OpenManager Vibe v5 - Vercel API 연결 상태 테스트 시작');
    console.log(`🌐 Base URL: ${BASE_URL}`);
    console.log(`📅 테스트 시간: ${new Date().toLocaleString('ko-KR')}`);

    const results = [];

    // 모든 API 엔드포인트 테스트
    for (const [key, endpoint] of Object.entries(API_ENDPOINTS)) {
        const description = getEndpointDescription(key);
        const result = await testAPI(endpoint, description);

        results.push({
            key,
            endpoint,
            description,
            result
        });

        // API 호출 간 간격 (Rate Limiting 방지)
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 결과 분석
    analyzeResults(results);

    console.log('\n🏁 테스트 완료!');
}

// 📝 엔드포인트 설명 함수
function getEndpointDescription(key) {
    const descriptions = {
        dashboard: '대시보드 통합 데이터',
        servers: '서버 목록 및 상태',
        dataflow: '데이터 플로우 상태',
        dataGeneratorStatus: '데이터 생성기 상태',
        dataGeneratorGenerate: '데이터 생성기 실행',
        optimizedGenerator: '최적화된 데이터 생성기',
        aiUnifiedStatus: 'AI 통합 엔진 상태',
        aiEnginesStatus: 'AI 엔진들 상태',
        aiGoogleStatus: 'Google AI 상태',
        realtimeServers: '실시간 서버 데이터',
        streamData: '스트림 데이터',
        metrics: '메트릭 데이터',
        prometheus: 'Prometheus 메트릭',
        health: '시스템 헬스체크',
        status: '전체 시스템 상태',
        version: '버전 정보'
    };

    return descriptions[key] || key;
}

// 스크립트 실행
if (require.main === module) {
    main().catch(error => {
        console.error('💥 스크립트 실행 중 오류:', error);
        process.exit(1);
    });
}

module.exports = { testAPI, analyzeResults };
