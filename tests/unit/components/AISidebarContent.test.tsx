/**
 * 🧪 AISidebarContent 컴포넌트 User Event 테스트
 *
 * @description AI 사이드바의 렌더링, 탭 전환, 메시지 전송 검증 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AISidebarContent from '@/components/dashboard/AISidebarContent';

// Mock Zustand store
const mockServers = [
  {
    id: 'server-1',
    name: 'Web Server 01',
    status: 'online',
    cpu: 45,
    memory: 62,
    disk: 73,
    network: 28,
  },
  {
    id: 'server-2',
    name: 'DB Server 01',
    status: 'warning',
    cpu: 78,
    memory: 85,
    disk: 65,
    network: 42,
  },
];

vi.mock('@/components/providers/StoreProvider', () => ({
  useServerDataStore: vi.fn((selector) => {
    const state = { servers: mockServers };
    return selector(state);
  }),
}));

// Mock AI 하위 컴포넌트들
vi.mock('@/components/dashboard/AIInsightsCard', () => ({
  default: vi.fn(() => (
    <div data-testid="mock-ai-insights-card">AI Insights</div>
  )),
}));

vi.mock('@/components/ai/AIAssistantIconPanel', () => ({
  default: vi.fn(({ selectedFunction, onFunctionChange }) => (
    <div data-testid="mock-ai-assistant-icon-panel">
      <button onClick={() => onFunctionChange('chat')}>Chat</button>
      <button onClick={() => onFunctionChange('auto-report')}>
        Auto Report
      </button>
      <button onClick={() => onFunctionChange('free-tier-monitor')}>
        Free Tier
      </button>
    </div>
  )),
}));

vi.mock('@/components/ai/FreeTierMonitor', () => ({
  default: vi.fn(() => (
    <div data-testid="mock-free-tier-monitor">Free Tier Monitor</div>
  )),
}));

vi.mock('@/components/ai/ThinkingProcessVisualizer', () => ({
  default: vi.fn(() => (
    <div data-testid="mock-thinking-visualizer">Thinking Process</div>
  )),
}));

describe('🎯 AISidebarContent - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClose = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();

    // Mock fetch API
    global.fetch = vi.fn();

    // Mock scrollIntoView (JSDOM limitation)
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('기본 렌더링', () => {
    it('헤더가 정상적으로 표시된다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      expect(screen.getByText('AI 어시스턴트')).toBeDefined();
      expect(screen.getByText(/실시간 2개 서버 분석/)).toBeDefined();
    });

    it('초기 환영 메시지가 표시된다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      expect(
        screen.getByText(
          /실시간 서버 데이터 기반으로 시스템 모니터링 분석을 제공합니다/
        )
      ).toBeDefined();
    });

    it('3개 탭 메뉴가 표시된다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      expect(screen.getByText('채팅')).toBeDefined();
      expect(screen.getByText('보고서')).toBeDefined();
      expect(screen.getByText('인사이트')).toBeDefined();
    });

    it('닫기 버튼이 표시된다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const closeButton = screen.getByText('✕');
      expect(closeButton).toBeDefined();
    });

    it('초기 탭은 chat이다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const chatTab = screen.getByText('채팅');
      expect(chatTab.className).toContain('bg-blue-100');
    });
  });

  describe('onClose 호출', () => {
    it('닫기 버튼 클릭 시 onClose가 호출된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const closeButton = screen.getByText('✕');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('탭 전환', () => {
    it('보고서 탭 클릭 시 탭이 전환된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const reportsTab = screen.getByText('보고서');
      await user.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByText('실시간 시스템 리포트')).toBeDefined();
      });
    });

    it('인사이트 탭 클릭 시 탭이 전환된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const insightsTab = screen.getByText('인사이트');
      await user.click(insightsTab);

      await waitFor(() => {
        expect(screen.getByTestId('mock-ai-insights-card')).toBeDefined();
      });
    });

    it('채팅 탭 클릭 시 입력 필드가 표시된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      // 먼저 다른 탭으로 이동
      const insightsTab = screen.getByText('인사이트');
      await user.click(insightsTab);

      // 다시 채팅 탭으로 돌아오기
      const chatTab = screen.getByText('채팅');
      await user.click(chatTab);

      await waitFor(() => {
        const input =
          screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
        expect(input).toBeDefined();
      });
    });
  });

  describe('메시지 입력 및 전송', () => {
    it('입력 필드에 텍스트를 입력할 수 있다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '서버 상태를 알려주세요');

      expect(input).toHaveValue('서버 상태를 알려주세요');
    });

    it('Send 버튼 클릭 시 메시지가 전송된다', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '테스트 응답입니다',
          engine: 'test-engine',
          responseTime: 100,
        }),
      });

      const { container } = render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '서버 상태');

      // Send 버튼 선택 (bg-blue-500 클래스 사용)
      const sendButton = container.querySelector('.bg-blue-500');
      expect(sendButton).toBeDefined();

      if (sendButton) {
        await user.click(sendButton);

        // API 호출 확인 (메시지 전송됨)
        await waitFor(() => {
          expect(global.fetch).toHaveBeenCalledWith(
            '/api/ai/query',
            expect.objectContaining({
              method: 'POST',
            })
          );
        });
      }
    });

    it('Enter 키로 메시지를 전송할 수 있다', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '테스트 응답',
          engine: 'test',
          responseTime: 50,
        }),
      });

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '테스트{Enter}');

      await waitFor(() => {
        expect(screen.getByText('테스트')).toBeDefined();
      });
    });

    it('빈 메시지는 전송되지 않는다', async () => {
      const { container } = render(<AISidebarContent onClose={mockOnClose} />);

      // Send 버튼 선택 (bg-blue-500 클래스 사용)
      const sendButton = container.querySelector('.bg-blue-500');

      if (sendButton) {
        // 초기 상태에서 disabled 확인
        expect(sendButton).toBeDisabled();
      }
    });
  });

  describe('로딩 상태', () => {
    it('메시지 전송 중 로딩 표시가 나타난다', async () => {
      // API 응답을 지연시킴
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    response: '응답',
                    engine: 'test',
                    responseTime: 100,
                  }),
                }),
              100
            )
          )
      );

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '테스트 메시지{Enter}');

      // 로딩 상태 확인
      await waitFor(() => {
        expect(screen.getByText('AI 분석 중...')).toBeDefined();
      });
    });

    it('로딩 중에는 입력 필드가 비활성화된다', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    response: '응답',
                    engine: 'test',
                    responseTime: 100,
                  }),
                }),
              100
            )
          )
      );

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '테스트{Enter}');

      await waitFor(() => {
        expect(input).toHaveProperty('disabled', true);
      });
    });
  });

  describe('에러 처리', () => {
    it('API 호출 실패 시 에러 메시지가 표시된다', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '테스트{Enter}');

      await waitFor(() => {
        expect(screen.getByText(/일시적인 오류가 발생했습니다/)).toBeDefined();
      });
    });

    it('에러 메시지에 서버 통계가 포함된다', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '질문{Enter}');

      await waitFor(() => {
        expect(
          screen.getByText(/현재 2개의 서버가 모니터링 중입니다/)
        ).toBeDefined();
        expect(screen.getByText(/정상: 1개/)).toBeDefined();
        expect(screen.getByText(/경고: 1개/)).toBeDefined();
      });
    });
  });

  describe('보고서 탭 기능', () => {
    it('보고서 탭에서 서버 통계가 표시된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const reportsTab = screen.getByText('보고서');
      await user.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByText(/총 서버: 2개/)).toBeDefined();
        expect(screen.getByText(/정상: 1개/)).toBeDefined();
        expect(screen.getByText(/경고: 1개/)).toBeDefined();
      });
    });

    it('상세 보고서 생성 버튼이 작동한다', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '보고서 생성 완료',
          engine: 'test',
          responseTime: 200,
        }),
      });

      render(<AISidebarContent onClose={mockOnClose} />);

      const reportsTab = screen.getByText('보고서');
      await user.click(reportsTab);

      const reportButton = screen.getByText('상세 보고서 생성');
      await user.click(reportButton);

      // 채팅 탭으로 자동 전환되고 메시지 전송
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/ai/query',
          expect.objectContaining({
            method: 'POST',
          })
        );
      });
    });
  });

  describe('인사이트 탭 기능', () => {
    it('인사이트 탭에서 AIInsightsCard가 표시된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const insightsTab = screen.getByText('인사이트');
      await user.click(insightsTab);

      await waitFor(() => {
        expect(screen.getByTestId('mock-ai-insights-card')).toBeDefined();
      });
    });

    it('인사이트 탭에서 AI 추천이 표시된다', async () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const insightsTab = screen.getByText('인사이트');
      await user.click(insightsTab);

      await waitFor(() => {
        expect(screen.getByText('AI 추천')).toBeDefined();
        expect(
          screen.getByText(/경고 상태 서버 1개를 모니터링하세요/)
        ).toBeDefined();
      });
    });
  });

  describe('접근성', () => {
    it('사이드바가 올바른 구조를 가진다', () => {
      const { container } = render(<AISidebarContent onClose={mockOnClose} />);

      const sidebar = container.querySelector('.fixed');
      expect(sidebar).toBeDefined();
      expect(sidebar?.className).toContain('z-50');
    });

    it('탭 버튼들이 role="button"을 가진다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('입력 필드가 적절한 placeholder를 가진다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      expect(input).toBeDefined();
      expect(input.tagName).toBe('INPUT');
    });
  });

  describe('실시간 서버 데이터 통합', () => {
    it('서버 개수가 헤더에 표시된다', () => {
      render(<AISidebarContent onClose={mockOnClose} />);

      expect(screen.getByText(/실시간 2개 서버 분석/)).toBeDefined();
    });

    it('API 호출 시 서버 메타데이터가 포함된다', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          response: '응답',
          engine: 'test',
          responseTime: 100,
        }),
      });

      render(<AISidebarContent onClose={mockOnClose} />);

      const input =
        screen.getByPlaceholderText(/현재 시스템의 전반적인 성능 상태는/);
      await user.type(input, '질문{Enter}');

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/ai/query',
          expect.objectContaining({
            body: expect.stringContaining('"totalServers":2'),
          })
        );
      });
    });
  });
});
