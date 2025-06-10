#!/usr/bin/env node

/**
 * 🧪 AI 에이전트 기능 검증 스크립트
 * 
 * 서버 모니터링 AI 에이전트의 주요 기능들을 테스트합니다.
 */

const https = require('https');
const http = require('http');

// 테스트 설정
const TEST_CONFIG = {
  baseUrl: process.env.TEST_URL || 'http://localhost:3000',
  timeout: 30000,
  testQueries: [
    {
      name: '기본 서버 상태 확인',
      query: '서버 상태 어때?',
      expectedKeywords: ['CPU', '메모리', '디스크', '정상'],
      category: 'basic'
    },
    {
      name: '성능 최적화 요청',
      query: '시스템 느려졌는데 원인 분석해줘',
      expectedKeywords: ['성능', '병목', '원인', '최적화'],
      category: 'advanced'
    },
    {
      name: '장애 예측 분석',
      query: '내일 서버에 문제 생길 가능성은?',
      expectedKeywords: ['예측', '확률', 'TensorFlow', '분석'],
      category: 'prediction'
    },
    {
      name: '특수 환경 문의',
      query: 'MySQL Galera 클러스터에서 split-brain 문제 해결',
      expectedKeywords: ['Galera', 'split-brain', '클러스터', '해결'],
      category: 'custom'
    }
  ]
};

/**
 * HTTP 요청 함수
 */
function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: TEST_CONFIG.timeout
    };
    
    const req = lib.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.write(postData);
    req.end();
  });
}

/**
 * 단일 테스트 실행
 */
async function runSingleTest(testCase) {
  console.log(`\n🧪 테스트: ${testCase.name}`);
  console.log(`📝 쿼리: "${testCase.query}"`);
  
  const startTime = Date.now();
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/ai/enhanced`, {
      query: testCase.query,
      sessionId: `test-${Date.now()}`,
      options: {
        includeDebugInfo: true
      }
    });
    
    const responseTime = Date.now() - startTime;
    
    if (response.statusCode !== 200) {
      throw new Error(`HTTP ${response.statusCode}: ${JSON.stringify(response.data)}`);
    }
    
    const result = response.data;
    
    // 응답 구조 검증
    const requiredFields = ['success', 'answer', 'confidence', 'sources'];
    const missingFields = requiredFields.filter(field => !(field in result));
    
    if (missingFields.length > 0) {
      throw new Error(`응답에 필수 필드 누락: ${missingFields.join(', ')}`);
    }
    
    // 성공 여부 확인
    if (!result.success) {
      throw new Error(`AI 처리 실패: ${result.error || '알 수 없는 오류'}`);
    }
    
    // 키워드 검증
    const answer = result.answer.toLowerCase();
    const foundKeywords = testCase.expectedKeywords.filter(keyword => 
      answer.includes(keyword.toLowerCase())
    );
    
    const keywordScore = (foundKeywords.length / testCase.expectedKeywords.length) * 100;
    
    // 결과 출력
    console.log(`✅ 응답 시간: ${responseTime}ms`);
    console.log(`📊 신뢰도: ${result.confidence}%`);
    console.log(`🎯 키워드 매칭: ${foundKeywords.length}/${testCase.expectedKeywords.length} (${keywordScore.toFixed(1)}%)`);
    console.log(`📚 사용된 소스: ${result.sources.length}개`);
    
    if (result.tensorflowPredictions) {
      console.log(`🤖 TensorFlow 예측: 활성화됨`);
    }
    
    if (result.mcpActions && result.mcpActions.length > 0) {
      console.log(`📋 MCP 액션: ${result.mcpActions.length}개`);
    }
    
    // 성공 기준 판정
    const isSuccess = keywordScore >= 50 && result.confidence >= 70 && responseTime < 10000;
    
    return {
      name: testCase.name,
      category: testCase.category,
      success: isSuccess,
      responseTime,
      confidence: result.confidence,
      keywordScore,
      sources: result.sources.length,
      answer: result.answer.substring(0, 100) + '...'
    };
    
  } catch (error) {
    console.log(`❌ 실패: ${error.message}`);
    
    return {
      name: testCase.name,
      category: testCase.category,
      success: false,
      error: error.message,
      responseTime: Date.now() - startTime
    };
  }
}

/**
 * 서버 상태 확인
 */
async function checkServerHealth() {
  console.log('🔍 서버 상태 확인 중...');
  
  try {
    const response = await makeRequest(`${TEST_CONFIG.baseUrl}/api/health`, {});
    
    if (response.statusCode === 200) {
      console.log('✅ 서버 정상 동작 중');
      return true;
    } else {
      console.log(`⚠️ 서버 상태 이상: HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ 서버 연결 실패: ${error.message}`);
    return false;
  }
}

/**
 * 메인 테스트 실행
 */
async function runAllTests() {
  console.log('🚀 AI 에이전트 기능 검증 시작');
  console.log(`🔗 테스트 대상: ${TEST_CONFIG.baseUrl}`);
  console.log(`📝 총 ${TEST_CONFIG.testQueries.length}개 테스트 케이스`);
  
  // 1. 서버 상태 확인
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    console.log('\n❌ 서버가 정상 동작하지 않습니다. 테스트를 중단합니다.');
    process.exit(1);
  }
  
  // 2. 각 테스트 실행
  const results = [];
  
  for (const testCase of TEST_CONFIG.testQueries) {
    const result = await runSingleTest(testCase);
    results.push(result);
    
    // 테스트 간 간격
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // 3. 결과 요약
  console.log('\n📊 테스트 결과 요약');
  console.log('='.repeat(60));
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const successRate = (successCount / totalCount) * 100;
  
  console.log(`📈 전체 성공률: ${successCount}/${totalCount} (${successRate.toFixed(1)}%)`);
  
  // 카테고리별 결과
  const categoryResults = {};
  for (const result of results) {
    if (!categoryResults[result.category]) {
      categoryResults[result.category] = { success: 0, total: 0 };
    }
    categoryResults[result.category].total++;
    if (result.success) {
      categoryResults[result.category].success++;
    }
  }
  
  console.log('\n📋 카테고리별 결과:');
  for (const [category, stats] of Object.entries(categoryResults)) {
    const rate = (stats.success / stats.total) * 100;
    console.log(`  ${category}: ${stats.success}/${stats.total} (${rate.toFixed(1)}%)`);
  }
  
  // 성능 통계
  const responseTimes = results.filter(r => r.responseTime).map(r => r.responseTime);
  if (responseTimes.length > 0) {
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const maxResponseTime = Math.max(...responseTimes);
    
    console.log('\n⚡ 성능 통계:');
    console.log(`  평균 응답 시간: ${avgResponseTime.toFixed(0)}ms`);
    console.log(`  최대 응답 시간: ${maxResponseTime}ms`);
  }
  
  // 실패한 테스트 상세
  const failedTests = results.filter(r => !r.success);
  if (failedTests.length > 0) {
    console.log('\n❌ 실패한 테스트:');
    for (const failed of failedTests) {
      console.log(`  - ${failed.name}: ${failed.error || '기준 미달'}`);
    }
  }
  
  console.log('\n🎉 AI 에이전트 기능 검증 완료!');
  
  // 성공률에 따른 종료 코드
  process.exit(successRate >= 75 ? 0 : 1);
}

// CLI 실행
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('❌ 테스트 실행 중 오류 발생:', error);
    process.exit(1);
  });
}

module.exports = { runAllTests, runSingleTest, checkServerHealth }; 