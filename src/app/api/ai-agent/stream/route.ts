/**
 * 🚀 Vercel 최적화 AI 스트리밍 API
 *
 * - Streaming Response로 실시간 전송
 * - 10초 타임아웃 제한 고려
 * - 메모리 최적화 (청크 단위 전송)
 * - ChatGPT 스타일 UX 구현
 */

import { NextRequest, NextResponse } from 'next/server';

const VERCEL_TIMEOUT = 8000; // 8초로 안전하게 설정

interface StreamEvent {
  type: 'thinking' | 'response_start' | 'response_chunk' | 'complete' | 'error';
  step?: string;
  index?: number;
  chunk?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, category = 'general' } = await request.json();

    const encoder = new TextEncoder();
    let isCompleted = false;
    let isClosed = false;
    const timeouts: NodeJS.Timeout[] = []; // 🆕 타이머 추적

    const stream = new ReadableStream({
      start(controller) {
        // 🆕 안전한 이벤트 전송 함수
        const sendEvent = (event: StreamEvent) => {
          if (!isCompleted && !isClosed) {
            try {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
              );
            } catch (error) {
              console.warn('스트림 전송 실패:', error);
              isClosed = true;
            }
          }
        };

        // 🆕 안전한 완료 함수
        const complete = () => {
          if (!isCompleted && !isClosed) {
            isCompleted = true;

            // 모든 타이머 정리
            timeouts.forEach(timeout => clearTimeout(timeout));
            timeouts.length = 0;

            sendEvent({ type: 'complete' });

            try {
              controller.close();
              isClosed = true;
            } catch (error) {
              console.warn('스트림 종료 실패:', error);
              isClosed = true;
            }
          }
        };

        // 🆕 안전한 타이머 생성 함수
        const safeSetTimeout = (
          callback: () => void,
          delay: number
        ): NodeJS.Timeout => {
          const timeout = setTimeout(() => {
            if (!isCompleted && !isClosed) {
              callback();
            }
          }, delay);
          timeouts.push(timeout);
          return timeout;
        };

        // Vercel 타임아웃 설정 (25초)
        const VERCEL_TIMEOUT = 25000;
        const mainTimeout = safeSetTimeout(() => {
          if (!isCompleted && !isClosed) {
            sendEvent({
              type: 'error',
              error: 'Request timeout - 응답 시간이 초과되었습니다.',
            });
            complete();
          }
        }, VERCEL_TIMEOUT);

        // 🧠 1단계: 생각하기 과정 스트리밍
        const thinkingSteps = getThinkingSteps(category);
        let currentStepIndex = 0;

        const processThinking = () => {
          if (isCompleted || isClosed) return;

          if (currentStepIndex < thinkingSteps.length) {
            sendEvent({
              type: 'thinking',
              step: thinkingSteps[currentStepIndex],
              index: currentStepIndex,
            });

            currentStepIndex++;
            safeSetTimeout(processThinking, 600); // 0.6초 간격
          } else {
            // 생각하기 완료 후 응답 시작
            safeSetTimeout(processResponse, 300);
          }
        };

        // 💬 2단계: AI 응답 생성 및 스트리밍
        const processResponse = async () => {
          if (isCompleted || isClosed) return;

          try {
            sendEvent({ type: 'response_start' });

            // AI 응답 생성 (카테고리별)
            const aiResponse = await generateAIResponse(query, category);

            // 응답을 단어 단위로 스트리밍
            const words = aiResponse.split(' ');
            let currentWordIndex = 0;

            const streamWords = () => {
              if (isCompleted || isClosed) return;

              if (currentWordIndex < words.length) {
                sendEvent({
                  type: 'response_chunk',
                  chunk: words[currentWordIndex] + ' ',
                });

                currentWordIndex++;
                safeSetTimeout(streamWords, 50); // 50ms 간격으로 단어별 전송
              } else {
                complete();
              }
            };

            streamWords();
          } catch (error) {
            console.error('AI 응답 생성 에러:', error);
            if (!isCompleted && !isClosed) {
              sendEvent({
                type: 'error',
                error:
                  error instanceof Error ? error.message : 'AI 응답 생성 실패',
              });
              complete();
            }
          }
        };

        // 생각하기 과정 시작
        safeSetTimeout(processThinking, 100);
      },

      // 🆕 스트림 취소 시 정리
      cancel() {
        isCompleted = true;
        isClosed = true;
        timeouts.forEach(timeout => clearTimeout(timeout));
        timeouts.length = 0;
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  } catch (error) {
    console.error('스트리밍 API 에러:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * 카테고리별 생각하기 단계 생성
 */
function getThinkingSteps(category: string): string[] {
  const baseSteps = [
    '🔍 쿼리 분석 중...',
    '🧠 컨텍스트 검색 중...',
    '⚡ AI 엔진 초기화...',
  ];

  const categorySteps: Record<string, string[]> = {
    monitoring: [
      ...baseSteps,
      '📊 서버 상태 모니터링...',
      '🔎 시스템 헬스체크 수행...',
      '📈 실시간 메트릭 분석...',
      '✅ 모니터링 결과 정리...',
    ],
    incident: [
      ...baseSteps,
      '🚨 인시던트 분석 시작...',
      '⚠️ 알림 우선순위 검토...',
      '🔧 대응 방안 탐색...',
      '📋 인시던트 보고서 작성...',
    ],
    analysis: [
      ...baseSteps,
      '📊 성능 데이터 수집...',
      '🔍 패턴 분석 수행...',
      '📈 트렌드 분석 진행...',
      '💡 인사이트 도출...',
    ],
    prediction: [
      ...baseSteps,
      '🤖 ML 모델 로딩...',
      '📊 예측 데이터 준비...',
      '🎯 예측 알고리즘 실행...',
      '🔮 미래 전망 생성...',
    ],
    general: [
      ...baseSteps,
      '🤔 질문 의도 파악...',
      '💭 답변 전략 수립...',
      '📝 응답 생성 중...',
    ],
  };

  return categorySteps[category] || categorySteps.general;
}

/**
 * AI 응답 생성 (카테고리별)
 */
async function generateAIResponse(
  query: string,
  category: string
): Promise<string> {
  // 실제 환경에서는 AI 모델 호출
  // 여기서는 카테고리별 시뮬레이션 응답 생성

  const responses: Record<string, string> = {
    monitoring: `
### 🖥️ 서버 모니터링 결과

**질문:** ${query}

**현재 시스템 상태:**
- ✅ **웹 서버**: 정상 동작 (응답시간: 150ms)
- ✅ **데이터베이스**: 정상 연결 (연결 풀: 85% 사용)
- ⚠️ **메모리 사용률**: 78% (주의 필요)
- ✅ **CPU 사용률**: 45% (정상)

**추천 조치:**
1. 메모리 사용률이 높으니 불필요한 프로세스 정리를 권장합니다
2. 로그 파일 크기를 확인하고 로테이션을 고려해보세요
3. 다음 30분 후 재모니터링을 진행하겠습니다

더 자세한 정보가 필요하시면 언제든 말씀해주세요! 🚀
    `.trim(),

    incident: `
### 🚨 인시던트 분석 보고서

**질문:** ${query}

**현재 인시던트 현황:**
- 🔴 **Critical**: 1건 (데이터베이스 연결 지연)
- 🟡 **Warning**: 3건 (디스크 용량 부족 경고)
- 🟢 **Info**: 12건 (일반 시스템 로그)

**우선 처리 필요:**
1. **데이터베이스 연결 최적화** - 즉시 조치 필요
2. **디스크 정리** - 1시간 내 처리 권장
3. **모니터링 강화** - 예방적 조치

**자동 대응 조치:**
- 데이터베이스 연결 풀 재시작 완료
- 임시 로그 파일 정리 진행 중
- 알림 담당자에게 SMS 발송 완료

상황이 개선되는 대로 업데이트해드리겠습니다! 📊
    `.trim(),

    analysis: `
### 📊 시스템 성능 분석 결과

**질문:** ${query}

**분석 기간:** 최근 24시간
**분석 항목:** CPU, 메모리, 네트워크, 디스크 I/O

**주요 발견사항:**
- 📈 **피크 시간대**: 오후 2-4시 (트래픽 300% 증가)
- 🎯 **병목 지점**: 데이터베이스 쿼리 최적화 필요
- 💡 **개선 포인트**: Redis 캐시 적중률 향상 가능

**성능 지표:**
- **평균 응답시간**: 245ms (목표: 200ms)
- **처리량**: 1,200 req/sec (최대: 1,800 req/sec)
- **에러율**: 0.12% (목표 달성 ✅)

**최적화 권장사항:**
1. 느린 쿼리 인덱스 추가
2. 캐시 전략 개선
3. 로드밸런싱 정책 조정

지속적인 모니터링으로 성능을 개선해나가겠습니다! 🚀
    `.trim(),

    prediction: `
### 🔮 AI 예측 분석 결과

**질문:** ${query}

**예측 모델:** OpenManager ML v2.1
**신뢰도:** 87.3%
**예측 기간:** 향후 7일

**주요 예측 결과:**
- 📈 **트래픽 증가**: 다음 주 화요일 오후 150% 예상
- ⚠️ **리소스 부족 위험**: 목요일 오전 메모리 부족 가능성 65%
- 🎯 **최적 스케일링 시점**: 월요일 오전 10시

**예방 조치 권장:**
1. **자동 스케일링 설정** - 메모리 70% 초과시 인스턴스 추가
2. **캐시 용량 증설** - 화요일 이전 완료 권장
3. **모니터링 강화** - 예측 시점 전후 집중 관찰

**비용 최적화:**
- 예상 추가 비용: $45/주
- ROI 예측: 서비스 안정성 99.8% 유지

AI가 지속적으로 학습하여 예측 정확도를 개선하고 있습니다! 🤖
    `.trim(),

    general: `
### 💡 AI Assistant 응답

**질문:** ${query}

안녕하세요! OpenManager AI Assistant입니다. 

귀하의 질문에 대해 최선의 답변을 드리겠습니다. 서버 관리, 모니터링, 성능 분석, 장애 예측 등 모든 영역에서 도움을 드릴 수 있습니다.

**제가 도울 수 있는 영역:**
- 🖥️ **서버 모니터링**: 실시간 상태 확인 및 헬스체크
- 🚨 **인시던트 관리**: 알림 분석 및 대응 방안 제시  
- 📊 **성능 분석**: 시스템 성능 최적화 권장사항
- 🔮 **장애 예측**: AI 기반 예측 분석 및 예방 조치

더 구체적인 질문이나 특정 영역에 대한 도움이 필요하시면 언제든 말씀해주세요!

**팁**: "서버 상태 확인해줘", "성능 분석 해줘", "장애 예측해줘" 같은 구체적인 요청을 해보세요! 🚀
    `.trim(),
  };

  // 응답 생성 시뮬레이션 (실제로는 100-200ms 정도 소요)
  await new Promise(resolve => setTimeout(resolve, 150));

  return responses[category] || responses.general;
}
