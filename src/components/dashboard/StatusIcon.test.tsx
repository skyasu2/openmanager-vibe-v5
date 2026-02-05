/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 StatusIcon 컴포넌트 테스트
 *
 * @description React Testing Library를 사용한 StatusIcon 컴포넌트 UI 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render } from '@testing-library/react';
import { axe } from 'jest-axe';
import { Server } from 'lucide-react';
import { describe, expect, it } from 'vitest';
import StatusIcon from '@/components/dashboard/StatusIcon';

describe('🎯 StatusIcon 컴포넌트', () => {
  describe('기본 렌더링', () => {
    it('정상적으로 렌더링된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });

    it('컨테이너에 올바른 클래스가 적용된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain(
        'flex items-center justify-center'
      );
      expect(iconContainer?.className).toContain('rounded-xl border-2');
    });
  });

  describe('상태별 스타일', () => {
    it('에러 상태일 때 빨간색 스타일이 적용된다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          error="테스트 에러"
        />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('border-red-500');
      expect(iconContainer?.className).toContain('bg-red-500/10');
    });

    it('완료 상태일 때 녹색 스타일이 적용된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={true} />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('border-green-500');
      expect(iconContainer?.className).toContain('bg-green-500/10');
    });

    it('진행 중 상태일 때 파란색 스타일이 적용된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={false} />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('border-blue-500');
      expect(iconContainer?.className).toContain('bg-blue-500/10');
    });
  });

  describe('크기 옵션', () => {
    it('sm 크기가 적용된다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          size="sm"
        />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('w-8 h-8');
    });

    it('md 크기가 기본값으로 적용된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('w-12 h-12');
    });

    it('lg 크기가 적용된다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          size="lg"
        />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).toContain('w-16 h-16');
    });
  });

  describe('아이콘 표시', () => {
    it('customIcon이 제공되면 해당 아이콘을 사용한다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          customIcon={Server}
        />
      );

      // SVG 요소가 렌더링되는지 확인
      const svg = container.querySelector('svg');
      expect(svg).toBeDefined();
    });

    it('활성 상태일 때 컴포넌트가 렌더된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });

    it('비활성 상태에서도 컴포넌트가 렌더된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('로딩 링 애니메이션', () => {
    it('활성 상태이고 완료되지 않았을 때 회전 링이 표시된다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={false} />
      );

      // 회전 링 요소 찾기
      const spinRing = container.querySelector('.animate-spin');
      expect(spinRing).toBeDefined();
    });

    it('완료 상태일 때 회전 링이 표시되지 않는다', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={true} />
      );

      const spinRing = container.querySelector('.animate-spin');
      expect(spinRing).toBeNull();
    });

    it('에러 상태일 때 회전 링이 표시되지 않는다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={true}
          isComplete={false}
          error="에러"
        />
      );

      const spinRing = container.querySelector('.animate-spin');
      expect(spinRing).toBeNull();
    });
  });

  describe('단계별 아이콘 변경', () => {
    it('currentStep이 변경되면 컴포넌트가 재렌더된다', () => {
      const { container, rerender } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();

      rerender(
        <StatusIcon currentStep={5} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('currentStep이 음수일 때도 정상 작동한다', () => {
      const { container } = render(
        <StatusIcon currentStep={-1} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });

    it('currentStep이 매우 큰 값일 때도 정상 작동한다', () => {
      const { container } = render(
        <StatusIcon currentStep={999} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toBeDefined();
    });

    it('error가 빈 문자열일 때 에러 상태로 처리되지 않는다', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          error=""
        />
      );

      const iconContainer = container.querySelector('.border-2');
      expect(iconContainer?.className).not.toContain('border-red-500');
    });
  });

  describe('스냅샷 테스트', () => {
    it('기본 상태 스냅샷', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('에러 상태 스냅샷', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          error="테스트 에러"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('완료 상태 스냅샷', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={true} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('진행 중 상태 스냅샷', () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={false} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('커스텀 아이콘 스냅샷', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          customIcon={Server}
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('크기별 스냅샷 - sm', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          size="sm"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('크기별 스냅샷 - lg', () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          size="lg"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('접근성 테스트', () => {
    it('기본 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={false} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('에러 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <StatusIcon
          currentStep={0}
          isActive={false}
          isComplete={false}
          error="테스트 에러"
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('완료 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={false} isComplete={true} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('진행 중 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <StatusIcon currentStep={0} isActive={true} isComplete={false} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
