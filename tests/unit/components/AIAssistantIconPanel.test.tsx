/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 AIAssistantIconPanel 컴포넌트 테스트
 *
 * @description AI 기능 아이콘 패널의 렌더링, 인터랙션, 반응형 레이아웃 테스트
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AIAssistantIconPanel, {
  type AIAssistantFunction,
} from '../../../src/components/ai/AIAssistantIconPanel';

// Lucide 아이콘 mock
vi.mock('lucide-react', () => ({
  Brain: () => <div data-testid="icon-brain">Brain</div>,
  FileText: () => <div data-testid="icon-file-text">FileText</div>,
  MessageSquare: () => (
    <div data-testid="icon-message-square">MessageSquare</div>
  ),
  Monitor: () => <div data-testid="icon-monitor">Monitor</div>,
}));

describe('🤖 AIAssistantIconPanel Component', () => {
  const mockOnFunctionChange = vi.fn();
  const defaultProps = {
    selectedFunction: 'chat' as AIAssistantFunction,
    onFunctionChange: mockOnFunctionChange,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Desktop Layout (Default)', () => {
    it('헤더와 기본 아이콘들이 렌더링된다', () => {
      render(<AIAssistantIconPanel {...defaultProps} />);

      expect(screen.getByText('AI 기능')).toBeDefined();
      expect(screen.getByText('AI 활성')).toBeDefined();
      expect(screen.getByTestId('icon-brain')).toBeDefined();
    });

    it('모든 기능 아이콘이 표시된다', () => {
      render(<AIAssistantIconPanel {...defaultProps} />);

      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);

      expect(screen.getByTestId('ai-function-chat')).toBeDefined();
      expect(screen.getByTestId('ai-function-auto-report')).toBeDefined();
      expect(
        screen.getByTestId('ai-function-intelligent-monitoring')
      ).toBeDefined();
    });

    it('클릭 시 onFunctionChange가 호출된다', () => {
      render(<AIAssistantIconPanel {...defaultProps} />);

      const reportButton = screen.getByTestId('ai-function-auto-report');
      fireEvent.click(reportButton);

      expect(mockOnFunctionChange).toHaveBeenCalledWith('auto-report');
      expect(mockOnFunctionChange).toHaveBeenCalledTimes(1);
    });

    it('선택된 아이콘은 활성 스타일(그라데이션)을 가진다', () => {
      render(
        <AIAssistantIconPanel {...defaultProps} selectedFunction="chat" />
      );

      const chatButton = screen.getByTestId('ai-function-chat');
      expect(chatButton.className).toContain('bg-gradient-to-r');
      expect(chatButton.className).toContain('text-white');
    });

    it('선택되지 않은 아이콘은 비활성 스타일을 가진다', () => {
      render(
        <AIAssistantIconPanel {...defaultProps} selectedFunction="chat" />
      );

      const reportButton = screen.getByTestId('ai-function-auto-report');
      expect(reportButton.className).not.toContain('bg-gradient-to-r');
      // 배경색 클래스가 포함되어 있는지 확인 (bg-pink-50 또는 bg-pink-900/30)
      expect(reportButton.className).toMatch(/bg-pink-(50|900)/);
    });
  });

  describe('Mobile Layout', () => {
    it('모바일 모드에서는 가로 레이아웃(flex-row)을 사용한다', () => {
      const { container } = render(
        <AIAssistantIconPanel {...defaultProps} isMobile={true} />
      );

      // 모바일용 최상위 컨테이너 확인
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain('flex-row');
      expect(wrapper.className).toContain('overflow-x-auto');
    });

    it('모바일 모드에서는 헤더와 하단 상태바가 표시되지 않는다', () => {
      render(<AIAssistantIconPanel {...defaultProps} isMobile={true} />);

      expect(screen.queryByText('AI 기능')).toBeNull();
      expect(screen.queryByText('AI 활성')).toBeNull();
    });

    it('모바일 모드에서도 클릭 이벤트가 정상 동작한다', () => {
      render(<AIAssistantIconPanel {...defaultProps} isMobile={true} />);

      const monitorButton = screen.getByTestId(
        'ai-function-intelligent-monitoring'
      );
      fireEvent.click(monitorButton);

      expect(mockOnFunctionChange).toHaveBeenCalledWith(
        'intelligent-monitoring'
      );
    });
  });

  describe('Tooltips', () => {
    it('데스크톱에서 마우스 오버 시 툴팁 내용을 포함한다', () => {
      render(<AIAssistantIconPanel {...defaultProps} />);

      // 툴팁은 DOM에 존재하지만 opacity-0으로 숨겨져 있음
      expect(screen.getByText('자연어 질의')).toBeDefined();
      expect(screen.getByText('자연어로 시스템 질의 및 대화')).toBeDefined();
    });
  });
});
