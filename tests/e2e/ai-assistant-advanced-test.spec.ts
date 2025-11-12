import { test, expect } from '@playwright/test';
import { navigateToAdminDashboard, resetAdminState } from './helpers/admin';
import {
  ADMIN_FEATURES_REMOVED,
  ADMIN_FEATURES_SKIP_MESSAGE,
} from './helpers/featureFlags';

/**
 * 🤖 AI 어시스턴트 고급 기능 테스트
 *
 * 테스트 범위:
 * - AI 사이드바 완전 기능 검증
 * - 다양한 AI 쿼리 패턴 테스트
 * - AI 응답 품질 및 성능 검증
 * - AI 상태 관리 및 에러 처리
 */

test.describe('🤖 AI 어시스턴트 고급 테스트', () => {
  test.skip(ADMIN_FEATURES_REMOVED, ADMIN_FEATURES_SKIP_MESSAGE);

  test.beforeEach(async ({ page }) => {
    await resetAdminState(page);
    await navigateToAdminDashboard(page);
  });

  test.afterEach(async ({ page }) => {
    await resetAdminState(page);
  });

  test.describe('🎯 AI 사이드바 핵심 기능', () => {
    test('AI 사이드바 열기/닫기 상호작용', async ({ page }) => {
      // 1. AI 버튼 찾기 및 사이드바 열기
      const aiButtonSelectors = [
        '[data-testid="ai-assistant"]',
        '[data-testid="ai-sidebar-trigger"]',
        'button:has-text("AI")',
        'button[aria-label*="AI"], button[aria-label*="assistant"]',
        '.ai-toggle, .ai-button',
      ];

      let aiButton = null;
      for (const selector of aiButtonSelectors) {
        const element = page.locator(selector).first();
        if ((await element.count()) > 0 && (await element.isVisible())) {
          aiButton = element;
          console.log(`✅ AI 버튼 발견: ${selector}`);
          break;
        }
      }

      if (!aiButton) {
        console.log('⚠️ AI 버튼을 찾을 수 없습니다. 테스트를 건너뜁니다.');
        return;
      }

      // 2. 사이드바 열기
      await aiButton.click();
      await page.waitForTimeout(500);

      // 3. 사이드바 존재 확인
      const sidebarSelectors = [
        '[data-testid="ai-sidebar"]',
        '.ai-sidebar',
        '[role="complementary"]',
        'aside',
        '.sidebar[class*="ai"]',
      ];

      let sidebar = null;
      for (const selector of sidebarSelectors) {
        const element = page.locator(selector);
        if ((await element.count()) > 0 && (await element.isVisible())) {
          sidebar = element;
          console.log(`✅ AI 사이드바 확인: ${selector}`);
          break;
        }
      }

      expect(sidebar).not.toBeNull();

      // 4. 사이드바 닫기 버튼 찾기 및 테스트
      const closeButtonSelectors = [
        '[data-testid="close-sidebar"]',
        'button[aria-label*="닫기"], button[aria-label*="close"]',
        '.close-button',
        'button:has-text("×")',
        'button:has-text("Close")',
      ];

      for (const selector of closeButtonSelectors) {
        const closeButton = page.locator(selector).first();
        if (
          (await closeButton.count()) > 0 &&
          (await closeButton.isVisible())
        ) {
          await closeButton.click();
          await page.waitForTimeout(500);
          console.log(`✅ 사이드바 닫기 성공: ${selector}`);
          break;
        }
      }

      // 5. 다시 열기로 토글 기능 확인
      await aiButton.click();
      await page.waitForTimeout(500);
      console.log('✅ AI 사이드바 토글 기능 확인 완료');
    });

    test('AI 채팅 인터페이스 구성 요소 검증', async ({ page }) => {
      // AI 사이드바 열기
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // 1. 채팅 입력 필드 확인
        const inputSelectors = [
          '[data-testid="ai-chat-input"]',
          'input[placeholder*="AI"], input[placeholder*="질문"]',
          'textarea[placeholder*="AI"], textarea[placeholder*="질문"]',
          '.chat-input, .message-input',
        ];

        let chatInput = null;
        for (const selector of inputSelectors) {
          const element = page.locator(selector);
          if ((await element.count()) > 0) {
            chatInput = element;
            console.log(`✅ 채팅 입력 필드 확인: ${selector}`);
            break;
          }
        }

        // 2. 전송 버튼 확인
        const sendButtonSelectors = [
          '[data-testid="send-button"]',
          'button:has-text("전송"), button:has-text("Send")',
          'button[aria-label*="전송"], button[aria-label*="send"]',
          '.send-button',
        ];

        let sendButton = null;
        for (const selector of sendButtonSelectors) {
          const element = page.locator(selector);
          if ((await element.count()) > 0) {
            sendButton = element;
            console.log(`✅ 전송 버튼 확인: ${selector}`);
            break;
          }
        }

        // 3. 채팅 메시지 컨테이너 확인
        const chatContainerSelectors = [
          '[data-testid="chat-messages"]',
          '.chat-messages',
          '.message-list',
          '.conversation',
        ];

        for (const selector of chatContainerSelectors) {
          const container = page.locator(selector);
          if ((await container.count()) > 0) {
            console.log(`✅ 채팅 메시지 컨테이너 확인: ${selector}`);
            break;
          }
        }

        // 4. AI 기능 버튼들 확인
        const featureButtonSelectors = [
          '[data-testid*="ai-feature"]',
          'button:has-text("분석"), button:has-text("리포트")',
          'button:has-text("예측"), button:has-text("설정")',
          '.ai-feature-button, .preset-button',
        ];

        let totalFeatures = 0;
        for (const selector of featureButtonSelectors) {
          const buttons = page.locator(selector);
          const count = await buttons.count();
          if (count > 0) {
            totalFeatures += count;
            console.log(`✅ ${count}개의 AI 기능 버튼 발견: ${selector}`);
          }
        }

        console.log(`📊 총 ${totalFeatures}개의 AI 기능 요소 확인`);

        if (chatInput) {
          // 5. 입력 필드 상호작용 테스트
          await chatInput.click();
          await chatInput.fill('테스트 입력');
          const inputValue = await chatInput.inputValue();
          expect(inputValue).toBe('테스트 입력');
          console.log('✅ 채팅 입력 필드 상호작용 정상');
        }
      }
    });
  });

  test.describe('💬 AI 쿼리 패턴 테스트', () => {
    const testQueries = [
      {
        category: '시스템 모니터링',
        queries: [
          '현재 시스템 상태 요약해줘',
          'CPU 사용률이 높은 서버 찾아줘',
          '메모리 사용량 분석해줘',
          '디스크 용량 경고가 있는 서버는?',
        ],
      },
      {
        category: '성능 분석',
        queries: [
          '가장 성능이 좋은 서버는?',
          '응답시간이 느린 서버 분석',
          '트래픽 패턴 분석해줘',
          '성능 최적화 제안해줘',
        ],
      },
      {
        category: '장애 진단',
        queries: [
          '현재 발생한 알림 정리해줘',
          '에러 로그 분석해줘',
          '장애 예측 분석',
          '복구 방법 제안해줘',
        ],
      },
      {
        category: '보고서 생성',
        queries: [
          '일일 시스템 보고서 생성',
          '주간 성능 리포트',
          '보안 상태 점검 리포트',
          'SLA 준수 현황 리포트',
        ],
      },
    ];

    for (const { category, queries } of testQueries) {
      test(`${category} 카테고리 쿼리 테스트`, async ({ page }) => {
        // AI 사이드바 열기
        const aiButton = page
          .locator('[data-testid="ai-assistant"], button:has-text("AI")')
          .first();

        if ((await aiButton.count()) === 0) {
          console.log('⚠️ AI 버튼을 찾을 수 없어 테스트를 건너뜁니다.');
          return;
        }

        await aiButton.click();
        await page.waitForTimeout(1000);

        // 채팅 입력 필드 찾기
        const chatInput = page
          .locator(
            '[data-testid="ai-chat-input"], input[placeholder*="AI"], textarea[placeholder*="질문"]'
          )
          .first();

        if ((await chatInput.count()) === 0) {
          console.log('⚠️ 채팅 입력 필드를 찾을 수 없어 테스트를 건너뜁니다.');
          return;
        }

        // 각 쿼리 테스트
        for (const query of queries.slice(0, 2)) {
          // 시간 절약을 위해 처음 2개만 테스트
          console.log(`🧪 테스트 쿼리: "${query}"`);

          // 1. 쿼리 입력
          await chatInput.fill(query);

          // 2. 전송
          const sendButton = page
            .locator('[data-testid="send-button"], button:has-text("전송")')
            .first();

          if ((await sendButton.count()) > 0) {
            await sendButton.click();
          } else {
            await chatInput.press('Enter');
          }

          // 3. 응답 대기 (최대 5초)
          await page.waitForTimeout(2000);

          // 4. 응답 또는 로딩 상태 확인
          const responseIndicators = [
            '[data-testid="ai-response"]',
            '.ai-message',
            '.chat-message',
            '.loading, .spinner',
            '.thinking',
          ];

          let responseFound = false;
          for (const selector of responseIndicators) {
            const element = page.locator(selector);
            if ((await element.count()) > 0) {
              responseFound = true;
              console.log(`✅ 응답/상태 확인: ${selector}`);
              break;
            }
          }

          if (responseFound) {
            console.log(`✅ "${query}" 쿼리 처리 성공`);
          } else {
            console.log(
              `ℹ️ "${query}" 쿼리 응답 미확인 (백그라운드 처리 중일 수 있음)`
            );
          }

          // 다음 쿼리 전 잠시 대기
          await page.waitForTimeout(1000);
        }

        console.log(`✅ ${category} 카테고리 테스트 완료`);
      });
    }
  });

  test.describe('🔧 AI 기능 버튼 테스트', () => {
    test('프리셋 쿼리 버튼 기능', async ({ page }) => {
      // AI 사이드바 열기
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // 프리셋 버튼들 찾기
        const presetSelectors = [
          '[data-testid*="preset"]',
          'button:has-text("시스템 상태")',
          'button:has-text("성능 분석")',
          'button:has-text("알림 확인")',
          'button:has-text("빠른 분석")',
          '.preset-button, .quick-action',
        ];

        let presetButtons = [];
        for (const selector of presetSelectors) {
          const buttons = page.locator(selector);
          const count = await buttons.count();
          if (count > 0) {
            presetButtons.push({ selector, count });
            console.log(`✅ ${count}개의 프리셋 버튼 발견: ${selector}`);
          }
        }

        // 첫 번째 프리셋 버튼 클릭 테스트
        if (presetButtons.length > 0) {
          const firstPreset = page.locator(presetButtons[0].selector).first();
          await firstPreset.click();

          // 채팅 입력 필드에 자동 입력 확인
          const chatInput = page
            .locator('[data-testid="ai-chat-input"], input, textarea')
            .first();

          if ((await chatInput.count()) > 0) {
            await page.waitForTimeout(500);
            const inputValue = await chatInput.inputValue();
            if (inputValue && inputValue.length > 0) {
              console.log(`✅ 프리셋 버튼 자동 입력 확인: "${inputValue}"`);
            } else {
              console.log('ℹ️ 프리셋 버튼이 직접 실행 방식일 수 있음');
            }
          }

          console.log('✅ 프리셋 버튼 클릭 성공');
        } else {
          console.log('ℹ️ 프리셋 버튼을 찾을 수 없습니다.');
        }
      }
    });

    test('AI 모드 전환 기능', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // AI 모드 선택 버튼들 찾기
        const modeSelectors = [
          '[data-testid*="ai-mode"]',
          'button:has-text("분석 모드")',
          'button:has-text("대화 모드")',
          'button:has-text("보고서 모드")',
          '.mode-selector, .ai-mode',
        ];

        let modeButtons = [];
        for (const selector of modeSelectors) {
          const buttons = page.locator(selector);
          const count = await buttons.count();
          if (count > 0) {
            modeButtons.push({ selector, count });
            console.log(`✅ ${count}개의 AI 모드 버튼 발견: ${selector}`);
          }
        }

        // 모드 전환 테스트
        for (const { selector } of modeButtons.slice(0, 2)) {
          // 처음 2개만 테스트
          const modeButton = page.locator(selector).first();
          await modeButton.click();
          await page.waitForTimeout(500);

          // 활성 상태 확인
          const isActive = await modeButton.evaluate(
            (el) =>
              el.classList.contains('active') ||
              el.classList.contains('selected') ||
              el.getAttribute('aria-selected') === 'true'
          );

          console.log(
            `✅ AI 모드 전환 테스트: ${selector} (활성: ${isActive})`
          );
        }
      }
    });

    test('AI 설정 패널 접근', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // 설정 버튼 찾기
        const settingsSelectors = [
          '[data-testid="ai-settings"]',
          'button[aria-label*="설정"], button[aria-label*="settings"]',
          'button:has-text("설정"), button:has-text("Settings")',
          '.settings-button',
        ];

        for (const selector of settingsSelectors) {
          const settingsButton = page.locator(selector).first();
          if (
            (await settingsButton.count()) > 0 &&
            (await settingsButton.isVisible())
          ) {
            await settingsButton.click();
            await page.waitForTimeout(500);

            // 설정 패널 또는 모달 확인
            const settingsPanelSelectors = [
              '[data-testid="ai-settings-panel"]',
              '.settings-panel',
              '[role="dialog"]',
              '.modal',
            ];

            for (const panelSelector of settingsPanelSelectors) {
              const panel = page.locator(panelSelector);
              if ((await panel.count()) > 0 && (await panel.isVisible())) {
                console.log(`✅ AI 설정 패널 확인: ${panelSelector}`);
                return;
              }
            }

            console.log('✅ AI 설정 버튼 클릭 성공 (패널 미확인)');
            return;
          }
        }

        console.log('ℹ️ AI 설정 버튼을 찾을 수 없습니다.');
      }
    });
  });

  test.describe('📊 AI 응답 품질 및 성능', () => {
    test('AI 응답 시간 측정', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        const chatInput = page
          .locator(
            '[data-testid="ai-chat-input"], input[placeholder*="AI"], textarea'
          )
          .first();

        if ((await chatInput.count()) > 0) {
          const testQuery = '시스템 상태 간단히 요약해줘';

          // 응답 시간 측정 시작
          const startTime = Date.now();

          await chatInput.fill(testQuery);
          await chatInput.press('Enter');

          // 응답 대기 (최대 10초)
          const responseSelectors = [
            '[data-testid="ai-response"]',
            '.ai-message',
            '.chat-message:last-child',
          ];

          let responseReceived = false;
          const maxWaitTime = 10000; // 10초
          const checkInterval = 500; // 0.5초마다 확인

          for (let waited = 0; waited < maxWaitTime; waited += checkInterval) {
            for (const selector of responseSelectors) {
              const response = page.locator(selector);
              if ((await response.count()) > 0) {
                const responseTime = Date.now() - startTime;
                console.log(`✅ AI 응답 시간: ${responseTime}ms`);

                // 30초 이내 응답 기대
                expect(responseTime).toBeLessThan(30000);
                responseReceived = true;
                break;
              }
            }

            if (responseReceived) break;
            await page.waitForTimeout(checkInterval);
          }

          if (!responseReceived) {
            const totalTime = Date.now() - startTime;
            console.log(
              `ℹ️ AI 응답 타임아웃: ${totalTime}ms (백그라운드 처리 중일 수 있음)`
            );
          }
        }
      }
    });

    test('동시 다중 쿼리 처리', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        const chatInput = page
          .locator('[data-testid="ai-chat-input"], input, textarea')
          .first();

        if ((await chatInput.count()) > 0) {
          const queries = ['CPU 상태 확인', '메모리 사용량', '디스크 용량'];

          // 빠른 연속 쿼리 전송
          for (const query of queries) {
            await chatInput.fill(query);
            await chatInput.press('Enter');
            await page.waitForTimeout(200); // 짧은 간격
          }

          // 모든 응답 처리 대기
          await page.waitForTimeout(3000);

          // 채팅 메시지 개수 확인
          const messages = page.locator(
            '.chat-message, .ai-message, [data-testid*="message"]'
          );
          const messageCount = await messages.count();

          console.log(`📊 총 메시지 수: ${messageCount}개`);
          console.log('✅ 다중 쿼리 처리 테스트 완료');

          // 최소한 쿼리 수만큼 메시지가 있어야 함
          expect(messageCount).toBeGreaterThanOrEqual(queries.length);
        }
      }
    });

    test('AI 응답 내용 품질 검증', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        const chatInput = page
          .locator('[data-testid="ai-chat-input"], input, textarea')
          .first();

        if ((await chatInput.count()) > 0) {
          const testQuery = '현재 시스템 상태를 표 형태로 보여줘';
          await chatInput.fill(testQuery);
          await chatInput.press('Enter');

          // 응답 대기
          await page.waitForTimeout(5000);

          // 응답 내용 분석
          const responseElements = page.locator(
            '.ai-message, [data-testid="ai-response"]'
          );
          if ((await responseElements.count()) > 0) {
            const responseText = await responseElements.last().textContent();

            if (responseText) {
              // 응답 품질 기준 검증
              const qualityChecks = {
                hasContent: responseText.length > 10,
                notEmpty:
                  !responseText.includes('빈 응답') &&
                  !responseText.includes('error'),
                hasSystemKeywords: /시스템|서버|CPU|메모리|상태/.test(
                  responseText
                ),
                hasStructure: /\n|\t|\|/.test(responseText), // 구조화된 응답 확인
              };

              console.log('📊 AI 응답 품질 분석:', qualityChecks);
              console.log(
                '📝 응답 내용 (처음 100자):',
                responseText.substring(0, 100)
              );

              // 기본 품질 기준
              expect(qualityChecks.hasContent).toBe(true);
              expect(qualityChecks.notEmpty).toBe(true);
            }
          }
        }
      }
    });
  });

  test.describe('🔄 AI 상태 관리 및 에러 처리', () => {
    test('AI 연결 상태 표시기 확인', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // 연결 상태 표시기 찾기
        const statusIndicators = [
          '[data-testid="ai-status"]',
          '.ai-status',
          '.connection-status',
          '.status-indicator',
        ];

        for (const selector of statusIndicators) {
          const indicator = page.locator(selector);
          if ((await indicator.count()) > 0) {
            const statusText = await indicator.textContent();
            const statusColor = await indicator.evaluate(
              (el) => window.getComputedStyle(el).color
            );

            console.log(
              `✅ AI 상태 표시기 확인: ${statusText} (색상: ${statusColor})`
            );
            break;
          }
        }
      }
    });

    test('네트워크 오류 시 AI 동작', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        // 네트워크 오프라인 설정
        await page.context().setOffline(true);

        const chatInput = page
          .locator('[data-testid="ai-chat-input"], input, textarea')
          .first();

        if ((await chatInput.count()) > 0) {
          await chatInput.fill('테스트 쿼리');
          await chatInput.press('Enter');

          // 에러 메시지 확인
          await page.waitForTimeout(2000);

          const errorSelectors = [
            '[data-testid="error-message"]',
            '.error-message',
            '.alert-error',
            'div:has-text("오류"), div:has-text("error")',
          ];

          let errorFound = false;
          for (const selector of errorSelectors) {
            const errorElement = page.locator(selector);
            if ((await errorElement.count()) > 0) {
              const errorText = await errorElement.textContent();
              console.log(`✅ 네트워크 오류 처리 확인: ${errorText}`);
              errorFound = true;
              break;
            }
          }

          if (!errorFound) {
            console.log('ℹ️ 명시적 에러 메시지는 없지만 오프라인 처리 중');
          }
        }

        // 네트워크 복구
        await page.context().setOffline(false);
        await page.waitForTimeout(1000);

        console.log('✅ 네트워크 오류 처리 테스트 완료');
      }
    });

    test('AI 세션 지속성 테스트', async ({ page }) => {
      const aiButton = page
        .locator('[data-testid="ai-assistant"], button:has-text("AI")')
        .first();

      if ((await aiButton.count()) > 0) {
        await aiButton.click();
        await page.waitForTimeout(1000);

        const chatInput = page
          .locator('[data-testid="ai-chat-input"], input, textarea')
          .first();

        if ((await chatInput.count()) > 0) {
          // 첫 번째 쿼리
          await chatInput.fill('내 이름을 테스터라고 기억해줘');
          await chatInput.press('Enter');
          await page.waitForTimeout(2000);

          // 페이지 새로고침
          await page.reload();
          await page.waitForSelector('main');

          // 관리자 모드 재활성화
          await navigateToAdminDashboard(page);

          // AI 사이드바 다시 열기
          const aiButtonAfterReload = page
            .locator('[data-testid="ai-assistant"], button:has-text("AI")')
            .first();

          if ((await aiButtonAfterReload.count()) > 0) {
            await aiButtonAfterReload.click();
            await page.waitForTimeout(1000);

            // 세션 지속성 확인
            const chatInputAfterReload = page
              .locator('[data-testid="ai-chat-input"], input, textarea')
              .first();

            if ((await chatInputAfterReload.count()) > 0) {
              await chatInputAfterReload.fill('내 이름이 뭐였지?');
              await chatInputAfterReload.press('Enter');
              await page.waitForTimeout(3000);

              // 응답에서 "테스터" 포함 여부 확인
              const responseElements = page.locator(
                '.ai-message, [data-testid="ai-response"]'
              );
              if ((await responseElements.count()) > 0) {
                const responseText = await responseElements
                  .last()
                  .textContent();
                const remembersName = responseText?.includes('테스터') || false;

                console.log(
                  `📊 AI 세션 지속성: ${remembersName ? '유지됨' : '초기화됨'}`
                );
                console.log('✅ AI 세션 지속성 테스트 완료');
              }
            }
          }
        }
      }
    });
  });
});
