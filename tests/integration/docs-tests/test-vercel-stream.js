#!/usr/bin/env node

/**
 * 🌊 Vercel AI Stream API 테스트 스크립트
 *
 * OpenManager Vibe v5의 AI 스트림 API가 베르셀에서 정상 작동하는지 테스트합니다.
 */

const BYPASS_SECRET = process.env.VERCEL_AUTOMATION_BYPASS_SECRET || 'test-bypass-secret';
const BASE_URL = 'https://openmanager-vibe-v5.vercel.app';

async function testStreamAPI() {
  console.log('🌊 Vercel AI Stream API 테스트 시작');
  console.log(`🌐 베이스 URL: ${BASE_URL}`);
  console.log(`🔑 Bypass Secret: ${BYPASS_SECRET.substring(0, 8)}...`);

  const testQuery = '현재 서버 상태를 모니터링해주세요';
  const testCategory = 'monitoring';

  console.log(`\n🔍 테스트 쿼리: "${testQuery}"`);
  console.log(`📂 카테고리: ${testCategory}`);

  try {
    const response = await fetch(`${BASE_URL}/api/ai-agent/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-vercel-protection-bypass': BYPASS_SECRET,
        'x-vercel-set-bypass-cookie': 'true',
        'User-Agent': 'OpenManager-Test/1.0',
      },
      body: JSON.stringify({
        query: testQuery,
        category: testCategory,
      }),
    });

    console.log(`\n📊 응답 상태: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ 오류 응답: ${errorText}`);
      return false;
    }

    if (!response.body) {
      console.log('❌ 응답 본문이 없습니다.');
      return false;
    }

    console.log('✅ 스트림 응답 수신 시작...\n');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let eventCount = 0;
    let thinkingSteps = 0;
    let responseChunks = 0;
    let isCompleted = false;

    try {
      let timeoutCount = 0;
      const maxTimeout = 30; // 30초 타임아웃

      while (true) {
        try {
          const { done, value } = await Promise.race([
            reader.read(),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error('timeout')), 1000)
            ),
          ]);

          if (done) {
            console.log('\n🏁 스트림 종료 (정상)');
            break;
          }

          timeoutCount = 0; // 데이터 수신 시 타임아웃 카운터 리셋

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const eventData = JSON.parse(line.slice(6));
                eventCount++;

                switch (eventData.type) {
                  case 'thinking':
                    thinkingSteps++;
                    console.log(
                      `🧠 [${eventData.index + 1}] ${eventData.step}`
                    );
                    break;
                  case 'response_start':
                    console.log('\n💬 AI 응답 시작:');
                    break;
                  case 'response_chunk':
                    responseChunks++;
                    process.stdout.write(eventData.chunk);
                    break;
                  case 'complete':
                    isCompleted = true;
                    console.log('\n\n✅ 응답 완료');
                    break;
                  case 'error':
                    console.log(`\n❌ 에러: ${eventData.error}`);
                    break;
                }
              } catch (parseError) {
                console.log(`⚠️ JSON 파싱 에러: ${line}`);
              }
            }
          }
        } catch (error) {
          if (error.message === 'timeout') {
            timeoutCount++;
            if (timeoutCount >= maxTimeout) {
              console.log('\n⏰ 타임아웃 - 스트림 종료');
              break;
            }
            continue; // 타임아웃이지만 계속 시도
          } else {
            console.log(`\n💥 스트림 에러: ${error.message}`);
            break;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    // 결과 요약
    console.log('\n📊 스트림 테스트 결과:');
    console.log(`   📨 총 이벤트: ${eventCount}개`);
    console.log(`   🧠 생각하기 단계: ${thinkingSteps}개`);
    console.log(`   💬 응답 청크: ${responseChunks}개`);
    console.log(`   ✅ 완료 상태: ${isCompleted ? '성공' : '미완료'}`);

    return isCompleted && eventCount > 0;
  } catch (error) {
    console.log(`💥 네트워크 오류: ${error.message}`);
    return false;
  }
}

async function main() {
  const success = await testStreamAPI();

  if (success) {
    console.log('\n🎉 AI Stream API 테스트 성공!');
    console.log('🟢 베르셀에서 스트림 API가 정상 작동합니다.');
  } else {
    console.log('\n❌ AI Stream API 테스트 실패');
    console.log('🔴 스트림 API에 문제가 있습니다.');
  }
}

// Node.js 환경에서만 실행
if (typeof window === 'undefined') {
  main().catch(console.error);
}

module.exports = { testStreamAPI };
