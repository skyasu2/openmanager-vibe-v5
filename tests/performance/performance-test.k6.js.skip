/**
 * 🚀 OpenManager v5 성능 테스트 시나리오 (k6)
 *
 * ✅ 동시 질의 처리 테스트
 * ✅ 응답 시간 측정
 * ✅ Redis 캐시 효율성 점검
 * ✅ AI 엔드포인트 부하 테스트
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// 📊 커스텀 메트릭 정의
const aiResponseRate = new Rate('ai_response_success_rate');
const aiResponseTime = new Trend('ai_response_time');
const cacheHitRate = new Rate('cache_hit_rate');
const systemErrors = new Counter('system_errors');

// 🎯 테스트 시나리오 설정
export const options = {
  scenarios: {
    // 기본 헬스체크 (낮은 부하)
    health_check: {
      executor: 'constant-vus',
      vus: 2,
      duration: '2m',
      exec: 'healthCheck',
    },

    // AI 질의 부하 테스트 (중간 부하)
    ai_query_load: {
      executor: 'ramping-vus',
      startVUs: 1,
      stages: [
        { duration: '30s', target: 5 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 15 },
        { duration: '1m', target: 10 },
        { duration: '30s', target: 0 },
      ],
      exec: 'aiQueryTest',
    },

    // 동시 접속 스파이크 테스트 (높은 부하)
    spike_test: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '10s', target: 0 },
        { duration: '20s', target: 50 }, // 급격한 증가
        { duration: '30s', target: 50 }, // 유지
        { duration: '20s', target: 0 }, // 급격한 감소
      ],
      exec: 'spikeTest',
      startTime: '3m',
    },

    // 장시간 지속성 테스트 (소크 테스트)
    soak_test: {
      executor: 'constant-vus',
      vus: 5,
      duration: '10m',
      exec: 'soakTest',
      startTime: '6m',
    },
  },

  // 📈 임계값 설정
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95%의 요청이 2초 이내
    http_req_failed: ['rate<0.1'], // 실패율 10% 미만
    ai_response_time: ['p(90)<3000'], // AI 응답 90%가 3초 이내
    ai_response_success_rate: ['rate>0.9'], // AI 성공률 90% 이상
    cache_hit_rate: ['rate>0.7'], // 캐시 적중률 70% 이상
  },
};

// 🌐 환경 설정
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3002';
const AI_QUERIES = [
  '시스템 상태가 어떤가요?',
  'CPU 사용률이 높은 서버를 찾아주세요',
  '메모리 사용량이 80% 이상인 서버가 있나요?',
  '최근 에러가 발생한 서버를 알려주세요',
  '디스크 용량이 부족한 서버를 찾아주세요',
  '네트워크 지연이 높은 서버가 있나요?',
  '서버 성능 추세를 분석해주세요',
  '이상 징후가 감지된 서버가 있나요?',
  'AI 에이전트 상태를 확인해주세요',
  '전체 시스템 요약을 보여주세요',
];

/**
 * 🔍 기본 헬스체크 테스트
 */
export function healthCheck() {
  const endpoints = [
    '/api/health',
    '/api/system/mcp-status',
    '/api/metrics/prometheus',
  ];

  endpoints.forEach(endpoint => {
    const response = http.get(`${BASE_URL}${endpoint}`);

    check(response, {
      [`${endpoint} status is 200`]: r => r.status === 200,
      [`${endpoint} response time < 1s`]: r => r.timings.duration < 1000,
    });

    if (response.status !== 200) {
      systemErrors.add(1);
    }
  });

  sleep(1);
}

/**
 * 🤖 AI 질의 부하 테스트
 */
export function aiQueryTest() {
  const query = AI_QUERIES[Math.floor(Math.random() * AI_QUERIES.length)];
  const sessionId = `perf-test-${__VU}-${__ITER}`;

  const payload = {
    question: query,
    userId: `test-user-${__VU}`,
    sessionId: sessionId,
    options: {
      includeAnalysis: Math.random() > 0.5, // 50% 확률로 분석 포함
      useCache: true,
    },
  };

  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: '10s',
  };

  const startTime = Date.now();
  const response = http.post(
    `${BASE_URL}/api/ai/unified`,
    JSON.stringify(payload),
    params
  );
  const endTime = Date.now();

  const responseTime = endTime - startTime;
  aiResponseTime.add(responseTime);

  const success = check(response, {
    'AI query status is 200': r => r.status === 200,
    'AI query has answer': r => {
      try {
        const body = JSON.parse(r.body);
        return body.answer && body.answer.length > 0;
      } catch {
        return false;
      }
    },
    'AI query response time < 5s': r => r.timings.duration < 5000,
  });

  aiResponseRate.add(success);

  // 캐시 적중률 체크
  if (response.status === 200) {
    try {
      const body = JSON.parse(response.body);
      if (body.metadata && body.metadata.fromCache) {
        cacheHitRate.add(1);
      } else {
        cacheHitRate.add(0);
      }
    } catch {
      // JSON 파싱 실패 시 캐시 미스로 간주
      cacheHitRate.add(0);
    }
  }

  if (!success) {
    systemErrors.add(1);
    console.log(
      `❌ AI 질의 실패: VU=${__VU}, Query="${query}", Status=${response.status}`
    );
  }

  sleep(Math.random() * 2 + 1); // 1-3초 랜덤 대기
}

/**
 * ⚡ 스파이크 테스트 (급격한 부하 증가)
 */
export function spikeTest() {
  // 간단한 엔드포인트로 스파이크 테스트
  const endpoints = [
    '/api/health',
    '/api/system/mcp-status?section=overview',
    '/api/system/status',
  ];

  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    'spike test status is 200': r => r.status === 200,
    'spike test response time < 3s': r => r.timings.duration < 3000,
  });

  if (response.status !== 200) {
    systemErrors.add(1);
  }

  // 스파이크 테스트는 대기 없이 바로 다음 요청
}

/**
 * 🕰️ 소크 테스트 (장시간 지속성)
 */
export function soakTest() {
  // 시스템 안정성을 위한 혼합 워크로드
  const testType = Math.random();

  if (testType < 0.6) {
    // 60% - 간단한 상태 체크
    const response = http.get(`${BASE_URL}/api/health`);
    check(response, {
      'soak health check status is 200': r => r.status === 200,
    });
  } else if (testType < 0.9) {
    // 30% - MCP 상태 체크
    const response = http.get(`${BASE_URL}/api/system/mcp-status`);
    check(response, {
      'soak mcp status is 200': r => r.status === 200,
    });
  } else {
    // 10% - AI 질의 (가벼운 질의만)
    const lightQueries = [
      '시스템 상태가 어떤가요?',
      'AI 에이전트 상태를 확인해주세요',
    ];
    const query = lightQueries[Math.floor(Math.random() * lightQueries.length)];

    const payload = {
      question: query,
      userId: `soak-test-${__VU}`,
      sessionId: `soak-${__VU}-${__ITER}`,
      options: { useCache: true },
    };

    const response = http.post(
      `${BASE_URL}/api/ai/unified`,
      JSON.stringify(payload),
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: '5s',
      }
    );

    check(response, {
      'soak ai query status is 200': r => r.status === 200,
    });
  }

  sleep(Math.random() * 3 + 2); // 2-5초 랜덤 대기
}

/**
 * 📊 테스트 완료 후 실행되는 함수
 */
export function teardown(data) {
  console.log('\n🎯 성능 테스트 완료! 주요 메트릭:');
  console.log('='.repeat(50));

  // 여기서 추가적인 정리 작업이나 레포트 생성 가능
  // 예: 결과를 외부 모니터링 시스템으로 전송
}
