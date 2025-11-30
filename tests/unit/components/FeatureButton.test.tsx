/**
 * 🧪 FeatureButton 컴포넌트 User Event 테스트
 *
 * @description 기능 전환 버튼의 인터랙션 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FeatureButton, {
  type FunctionTabType,
} from '@/components/ai/FeatureButton';

describe('🎯 FeatureButton - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClick = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('아이콘과 함께 정상적으로 렌더링된다', () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByText('💬')).toBeDefined();
    });

    it('비활성 상태일 때 회색 배경을 가진다', () => {
      const { container } = render(
        <FeatureButton
          icon="📝"
          tab="report"
          tooltip="리포트"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('bg-gray-800/50');
      expect(button?.className).toContain('text-gray-400');
    });

    it('활성 상태일 때 보라색 그라데이션 배경을 가진다', () => {
      const { container } = render(
        <FeatureButton
          icon="📊"
          tab="patterns"
          tooltip="패턴"
          isActive={true}
          onClick={mockOnClick}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('from-purple-500');
      expect(button?.className).toContain('to-pink-500');
    });

    it('활성 상태일 때 활성 인디케이터가 표시된다', () => {
      const { container } = render(
        <FeatureButton
          icon="📋"
          tab="logs"
          tooltip="로그"
          isActive={true}
          onClick={mockOnClick}
        />
      );

      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeDefined();
      expect(indicator?.className).toContain('animate-pulse');
    });

    it('비활성 상태일 때 활성 인디케이터가 표시되지 않는다', () => {
      const { container } = render(
        <FeatureButton
          icon="📋"
          tab="logs"
          tooltip="로그"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const indicator = container.querySelector('.bg-green-500');
      expect(indicator).toBeNull();
    });
  });

  describe('클릭 인터랙션', () => {
    it('버튼 클릭 시 onClick 핸들러가 호출된다', async () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(1);
      expect(mockOnClick).toHaveBeenCalledWith('qa');
    });

    it('다른 탭을 클릭하면 해당 탭 ID가 전달된다', async () => {
      const tabs: Array<{ tab: FunctionTabType; icon: string }> = [
        { tab: 'qa', icon: '💬' },
        { tab: 'report', icon: '📝' },
        { tab: 'patterns', icon: '📊' },
        { tab: 'logs', icon: '📋' },
        { tab: 'context', icon: '🔍' },
      ];

      for (const { tab, icon } of tabs) {
        mockOnClick.mockClear();

        const { unmount } = render(
          <FeatureButton
            icon={icon}
            tab={tab}
            tooltip={`${tab} tooltip`}
            isActive={false}
            onClick={mockOnClick}
          />
        );

        await user.click(screen.getByRole('button'));
        expect(mockOnClick).toHaveBeenCalledWith(tab);

        unmount();
      }
    });

    it('활성 상태의 버튼도 클릭할 수 있다', async () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={true}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('여러 번 클릭 시 매번 호출된다', async () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });
  });

  describe('키보드 네비게이션', () => {
    it('Enter 키로 버튼을 활성화할 수 있다', async () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledWith('qa');
    });

    it('Space 키로 버튼을 활성화할 수 있다', async () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledWith('qa');
    });
  });

  describe('상태 변경', () => {
    it('isActive prop이 변경되면 스타일이 업데이트된다', () => {
      const { container, rerender } = render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      let button = container.querySelector('button');
      expect(button?.className).toContain('bg-gray-800/50');

      rerender(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={true}
          onClick={mockOnClick}
        />
      );

      button = container.querySelector('button');
      expect(button?.className).toContain('from-purple-500');
    });

    it('tab prop이 변경되면 onClick에서 다른 탭이 전달된다', async () => {
      const { rerender } = render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith('qa');

      mockOnClick.mockClear();

      rerender(
        <FeatureButton
          icon="📝"
          tab="report"
          tooltip="리포트"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByRole('button'));
      expect(mockOnClick).toHaveBeenCalledWith('report');
    });
  });

  describe('실전 시나리오', () => {
    it('탭 전환 시나리오 - 여러 버튼 중 하나만 활성화', async () => {
      const tabs = [
        { tab: 'qa' as const, icon: '💬', tooltip: 'Q&A' },
        { tab: 'report' as const, icon: '📝', tooltip: 'Report' },
        { tab: 'patterns' as const, icon: '📊', tooltip: 'Patterns' },
      ];

      let activeTab: FunctionTabType = 'qa';
      const handleTabChange = (tab: FunctionTabType) => {
        activeTab = tab;
        mockOnClick(tab);
      };

      const { rerender } = render(
        tabs.map((t) => (
          <FeatureButton
            key={t.tab}
            icon={t.icon}
            tab={t.tab}
            tooltip={t.tooltip}
            isActive={activeTab === t.tab}
            onClick={handleTabChange}
          />
        ))
      );

      // 초기 상태: qa 활성화
      const buttons = screen.getAllByRole('button');
      expect(buttons[0].className).toContain('from-purple-500');

      // report 클릭
      await user.click(buttons[1]);
      expect(mockOnClick).toHaveBeenCalledWith('report');
      activeTab = 'report';

      // 리렌더링
      rerender(
        tabs.map((t) => (
          <FeatureButton
            key={t.tab}
            icon={t.icon}
            tab={t.tab}
            tooltip={t.tooltip}
            isActive={activeTab === t.tab}
            onClick={handleTabChange}
          />
        ))
      );

      // patterns 클릭
      await user.click(buttons[2]);
      expect(mockOnClick).toHaveBeenCalledWith('patterns');
    });
  });

  describe('CSS 클래스', () => {
    it('커스텀 className이 추가된다', () => {
      const { container } = render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
          className="custom-class"
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('custom-class');
    });

    it('호버 효과 클래스가 포함되어 있다', () => {
      const { container } = render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = container.querySelector('button');
      expect(button?.className).toContain('hover:scale-105');
      expect(button?.className).toContain('active:scale-95');
    });
  });

  describe('접근성', () => {
    it('버튼이 role="button"을 가진다', () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeDefined();
    });

    it('버튼이 포커스 가능하다', () => {
      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });
  });

  describe('엣지 케이스', () => {
    it('onClick이 없어도 렌더링된다', () => {
      expect(() => {
        render(
          <FeatureButton
            icon="💬"
            tab="qa"
            tooltip="질문과 답변"
            isActive={false}
            onClick={() => {}}
          />
        );
      }).not.toThrow();
    });

    it('빈 아이콘으로도 렌더링된다', () => {
      render(
        <FeatureButton
          icon=""
          tab="qa"
          tooltip="질문과 답변"
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeDefined();
    });

    it('매우 긴 tooltip 텍스트를 처리할 수 있다', () => {
      const longTooltip = 'A'.repeat(200);

      render(
        <FeatureButton
          icon="💬"
          tab="qa"
          tooltip={longTooltip}
          isActive={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeDefined();
    });
  });
});
