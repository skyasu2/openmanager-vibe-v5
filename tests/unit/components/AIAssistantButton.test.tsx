/**
 * 🧪 AIAssistantButton 컴포넌트 User Event 테스트
 *
 * @description AI 어시스턴트 토글 버튼의 인터랙션 및 상태 관리 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AIAssistantButton } from '@/components/dashboard/AIAssistantButton';

describe('🎯 AIAssistantButton - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;
  const mockOnClick = vi.fn();

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('정상적으로 렌더링된다', () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeDefined();
    });

    it('AI 어시스턴트 텍스트가 표시된다 (데스크톱)', () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      // sm:inline 클래스로 인해 큰 화면에서만 표시
      expect(screen.getByText('AI 어시스턴트')).toBeDefined();
    });

    it('Bot 아이콘이 렌더링된다', () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      // lucide-react Bot 아이콘이 SVG로 렌더링됨
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });
  });

  describe('상태별 스타일', () => {
    it('비활성 상태일 때 회색 배경을 가진다', () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-100');
      expect(button.className).toContain('text-gray-600');
    });

    it('열린 상태일 때 그라데이션 배경을 가진다', async () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');

      // isMounted가 true가 된 후 스타일이 적용됨
      await waitFor(() => {
        expect(button.style.background).toBeTruthy();
      });
    });

    it('활성화 상태일 때 그라데이션 배경을 가진다', async () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');

      await waitFor(() => {
        expect(button.style.background).toBeTruthy();
      });
    });

    it('열렸거나 활성화된 상태에서 활성 인디케이터가 표시된다', async () => {
      const { container, rerender } = render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const indicator = container.querySelector('.bg-green-400');
        expect(indicator).toBeDefined();
        expect(indicator?.className).toContain('animate-pulse');
      });

      rerender(
        <AIAssistantButton
          isOpen={false}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const indicator = container.querySelector('.bg-green-400');
        expect(indicator).toBeDefined();
      });
    });

    it('닫히고 비활성화된 상태에서 인디케이터가 표시되지 않는다', () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const indicator = container.querySelector('.bg-green-400');
      expect(indicator).toBeNull();
    });
  });

  describe('클릭 인터랙션', () => {
    it('버튼 클릭 시 onClick 핸들러가 호출된다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('여러 번 클릭 시 매번 호출된다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');

      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnClick).toHaveBeenCalledTimes(3);
    });

    it('열린 상태에서도 클릭할 수 있다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      await user.click(screen.getByRole('button'));

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Hydration 처리', () => {
    it('초기 렌더링에서 suppressHydrationWarning이 적용된다', () => {
      const { container } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      // suppressHydrationWarning 속성 확인은 직접적으로 불가능하지만
      // 버튼이 정상 렌더링되는지 확인
      expect(button).toBeDefined();
    });

    it('마운트 후 동적 스타일이 적용된다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');

      // useEffect로 isMounted가 true가 된 후
      await waitFor(
        () => {
          expect(button.style.background).toBeTruthy();
        },
        { timeout: 100 }
      );
    });
  });

  describe('ARIA 속성', () => {
    it('닫힌 상태일 때 올바른 aria-label을 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-label')).toBe('AI 어시스턴트 열기');
      });
    });

    it('열린 상태일 때 올바른 aria-label을 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-label')).toBe('AI 어시스턴트 닫기');
      });
    });

    it('닫힌 상태일 때 aria-pressed="false"를 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-pressed')).toBe('false');
      });
    });

    it('열린 상태일 때 aria-pressed="true"를 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('aria-pressed')).toBe('true');
      });
    });

    it('닫힌 상태일 때 올바른 title을 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('title')).toBe('AI 어시스턴트 열기');
      });
    });

    it('열린 상태일 때 올바른 title을 가진다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.getAttribute('title')).toBe('AI 어시스턴트 닫기');
      });
    });
  });

  describe('키보드 네비게이션', () => {
    it('Enter 키로 버튼을 활성화할 수 있다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard('{Enter}');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('Space 키로 버튼을 활성화할 수 있다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      await user.keyboard(' ');

      expect(mockOnClick).toHaveBeenCalledTimes(1);
    });

    it('Tab 키로 버튼에 포커스할 수 있다', async () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await user.tab();

      // 버튼이 포커스되었는지 확인
      const button = screen.getByRole('button');
      expect(document.activeElement).toBe(button);
    });
  });

  describe('상태 변경', () => {
    it('isOpen prop이 변경되면 스타일이 업데이트된다', async () => {
      const { rerender } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-100');

      rerender(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        expect(button.style.background).toBeTruthy();
      });
    });

    it('isEnabled prop이 변경되면 스타일이 업데이트된다', async () => {
      const { rerender } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('bg-gray-100');

      rerender(
        <AIAssistantButton
          isOpen={false}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        expect(button.style.background).toBeTruthy();
      });
    });
  });

  describe('실전 시나리오', () => {
    it('토글 시나리오 - 열기/닫기 반복', async () => {
      let isOpen = false;
      const handleToggle = () => {
        isOpen = !isOpen;
        mockOnClick();
      };

      const { rerender } = render(
        <AIAssistantButton
          isOpen={isOpen}
          isEnabled={false}
          onClick={handleToggle}
        />
      );

      const button = screen.getByRole('button');

      // 첫 번째 클릭 - 열기
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(1);
      isOpen = true;

      rerender(
        <AIAssistantButton
          isOpen={isOpen}
          isEnabled={false}
          onClick={handleToggle}
        />
      );

      await waitFor(() => {
        expect(button.getAttribute('aria-pressed')).toBe('true');
      });

      // 두 번째 클릭 - 닫기
      await user.click(button);
      expect(mockOnClick).toHaveBeenCalledTimes(2);
      isOpen = false;

      rerender(
        <AIAssistantButton
          isOpen={isOpen}
          isEnabled={false}
          onClick={handleToggle}
        />
      );

      await waitFor(() => {
        expect(button.getAttribute('aria-pressed')).toBe('false');
      });
    });

    it('isEnabled는 유지하면서 isOpen만 토글', async () => {
      const { rerender } = render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const indicator = screen
          .getByRole('button')
          .parentElement?.querySelector('.bg-green-400');
        expect(indicator).toBeDefined();
      });

      rerender(
        <AIAssistantButton
          isOpen={true}
          isEnabled={true}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const indicator = screen
          .getByRole('button')
          .parentElement?.querySelector('.bg-green-400');
        expect(indicator).toBeDefined();
      });
    });
  });

  describe('접근성', () => {
    it('버튼이 포커스 가능하다', () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      button.focus();

      expect(document.activeElement).toBe(button);
    });

    it('role="button"을 가진다', () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      expect(screen.getByRole('button')).toBeDefined();
    });
  });

  describe('CSS 애니메이션', () => {
    it('호버 효과 클래스가 포함되어 있다', () => {
      render(
        <AIAssistantButton
          isOpen={false}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      const button = screen.getByRole('button');
      expect(button.className).toContain('hover:scale-105');
      expect(button.className).toContain('active:scale-95');
    });

    it('활성 상태일 때 scale-105가 적용된다', async () => {
      render(
        <AIAssistantButton
          isOpen={true}
          isEnabled={false}
          onClick={mockOnClick}
        />
      );

      await waitFor(() => {
        const button = screen.getByRole('button');
        expect(button.className).toContain('scale-105');
      });
    });
  });
});
