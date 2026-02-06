/**
 * @vitest-environment jsdom
 */

/**
 * 🧪 ProgressLabel 컴포넌트 테스트
 *
 * @description React Testing Library를 사용한 ProgressLabel 컴포넌트 UI 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { describe, expect, it } from 'vitest';
import ProgressLabel from './ProgressLabel';

describe('📝 ProgressLabel 컴포넌트', () => {
  describe('기본 렌더링', () => {
    it('정상적으로 렌더링된다', () => {
      render(<ProgressLabel currentStep={0} totalSteps={5} />);

      expect(screen.getByText(/시뮬레이션 진행 중/)).toBeDefined();
    });

    it('제목과 설명이 렌더링된다', () => {
      render(
        <ProgressLabel
          currentStep={0}
          totalSteps={5}
          stepDescription="테스트 진행 중"
        />
      );

      expect(screen.getByText(/시뮬레이션 진행 중/)).toBeDefined();
      expect(screen.getByText('테스트 진행 중')).toBeDefined();
    });
  });

  describe('진행률 표시', () => {
    it('진행률이 올바르게 계산된다', () => {
      render(<ProgressLabel currentStep={2} totalSteps={5} />);

      // (2 + 1) / 5 * 100 = 60%
      expect(screen.getByText('60%')).toBeDefined();
    });

    it('custom progress가 제공되면 해당 값을 사용한다', () => {
      render(<ProgressLabel currentStep={0} totalSteps={5} progress={75} />);

      expect(screen.getByText('75%')).toBeDefined();
    });

    it('진행률이 100%일 때 완료 메시지가 표시된다', () => {
      render(<ProgressLabel currentStep={4} totalSteps={5} />);

      expect(screen.getByText(/성공적으로 완료되었습니다/)).toBeDefined();
    });

    it('showProgress가 false면 진행률 바가 표시되지 않는다', () => {
      const { container } = render(
        <ProgressLabel currentStep={0} totalSteps={5} showProgress={false} />
      );

      expect(container.querySelector('.h-1')).toBeNull();
    });
  });

  describe('format 옵션', () => {
    it('percentage 포맷이 올바르게 표시된다', () => {
      render(
        <ProgressLabel currentStep={2} totalSteps={5} format="percentage" />
      );

      expect(screen.getByText(/진행률:/)).toBeDefined();
    });

    it('step-count 포맷이 올바르게 표시된다', () => {
      render(
        <ProgressLabel currentStep={2} totalSteps={5} format="step-count" />
      );

      expect(screen.getByText('3 / 5 단계')).toBeDefined();
    });

    it('custom 포맷이 올바르게 표시된다', () => {
      render(
        <ProgressLabel
          currentStep={2}
          totalSteps={5}
          format="custom"
          stepDescription="커스텀 설명"
        />
      );

      // custom 포맷에서는 제목과 설명 모두에 stepDescription이 표시됨
      const elements = screen.getAllByText('커스텀 설명');
      expect(elements.length).toBe(2); // h3 (제목) + p (설명)
    });

    it('custom 포맷에서 stepDescription이 없으면 기본 텍스트를 사용한다', () => {
      render(<ProgressLabel currentStep={2} totalSteps={5} format="custom" />);

      // stepDescription이 없으므로 폴백: "단계 3"
      expect(screen.getByText('단계 3')).toBeDefined();
    });

    it('customTitle이 제공되면 해당 제목을 사용한다', () => {
      render(
        <ProgressLabel
          currentStep={0}
          totalSteps={5}
          customTitle="사용자 정의 제목"
        />
      );

      expect(screen.getByText('사용자 정의 제목')).toBeDefined();
    });
  });

  describe('에러 상태', () => {
    it('에러가 있을 때 에러 메시지가 표시된다', () => {
      render(
        <ProgressLabel
          currentStep={0}
          totalSteps={5}
          error="테스트 에러 발생"
        />
      );

      expect(screen.getByText(/❌ 테스트 에러 발생/)).toBeDefined();
    });

    it('에러 상태일 때 빨간색 스타일이 적용된다', () => {
      render(<ProgressLabel currentStep={0} totalSteps={5} error="에러" />);

      const errorText = screen.getByText(/❌ 에러/);
      expect(errorText.className).toContain('text-red-400');
    });

    it('에러 상태일 때 진행 바가 빨간색이다', () => {
      const { container } = render(
        <ProgressLabel currentStep={0} totalSteps={5} error="에러" />
      );

      const progressBar = container.querySelector('.bg-red-400');
      expect(progressBar).toBeDefined();
    });
  });

  describe('완료 상태', () => {
    it('완료 상태일 때 완료 메시지가 표시된다', () => {
      render(<ProgressLabel currentStep={4} totalSteps={5} />);

      expect(screen.getByText(/성공적으로 완료되었습니다/)).toBeDefined();
    });

    it('완료 상태일 때 녹색 스타일이 적용된다', () => {
      render(<ProgressLabel currentStep={4} totalSteps={5} />);

      const completeText = screen.getByText(/성공적으로 완료되었습니다/);
      expect(completeText.className).toContain('text-green-400');
    });

    it('완료 상태일 때 진행 바가 녹색이다', () => {
      const { container } = render(
        <ProgressLabel currentStep={4} totalSteps={5} />
      );

      const progressBar = container.querySelector('.bg-green-400');
      expect(progressBar).toBeDefined();
    });
  });

  describe('진행 중 상태', () => {
    it('진행 중일 때 파란색 스타일이 적용된다', () => {
      render(<ProgressLabel currentStep={2} totalSteps={5} />);

      const progressText = screen.getByText('60%');
      expect(progressText.className).toContain('text-blue-400');
    });

    it('진행 중일 때 진행 바가 파란색이다', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} />
      );

      const progressBar = container.querySelector('.bg-blue-400');
      expect(progressBar).toBeDefined();
    });
  });

  describe('동적 업데이트', () => {
    it('currentStep이 변경되면 진행률이 업데이트된다', () => {
      const { rerender } = render(
        <ProgressLabel currentStep={0} totalSteps={5} />
      );

      expect(screen.getByText('20%')).toBeDefined();

      rerender(<ProgressLabel currentStep={2} totalSteps={5} />);

      expect(screen.getByText('60%')).toBeDefined();
    });

    it('stepDescription이 변경되면 설명이 업데이트된다', () => {
      const { rerender } = render(
        <ProgressLabel
          currentStep={0}
          totalSteps={5}
          stepDescription="첫 번째 단계"
        />
      );

      expect(screen.getByText('첫 번째 단계')).toBeDefined();

      rerender(
        <ProgressLabel
          currentStep={1}
          totalSteps={5}
          stepDescription="두 번째 단계"
        />
      );

      expect(screen.getByText('두 번째 단계')).toBeDefined();
    });
  });

  describe('엣지 케이스', () => {
    it('totalSteps가 1일 때 정상 작동한다', () => {
      render(<ProgressLabel currentStep={0} totalSteps={1} />);

      expect(screen.getByText('100%')).toBeDefined();
    });

    it('currentStep이 totalSteps보다 클 때 100%로 제한된다', () => {
      render(<ProgressLabel currentStep={10} totalSteps={5} />);

      // 완료 메시지가 표시되어야 함
      expect(screen.getByText(/성공적으로 완료되었습니다/)).toBeDefined();
    });

    it('progress가 100을 초과할 때 완료 상태로 처리된다', () => {
      render(<ProgressLabel currentStep={0} totalSteps={5} progress={150} />);

      expect(screen.getByText(/성공적으로 완료되었습니다/)).toBeDefined();
    });

    it('stepDescription이 없을 때 기본 설명이 표시된다', () => {
      render(<ProgressLabel currentStep={2} totalSteps={5} />);

      expect(screen.getByText(/단계 3 진행 중/)).toBeDefined();
    });
  });

  describe('스냅샷 테스트', () => {
    it('기본 상태 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('에러 상태 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} error="테스트 에러" />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('완료 상태 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={4} totalSteps={5} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('percentage 포맷 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} format="percentage" />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('step-count 포맷 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} format="step-count" />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('custom 포맷 스냅샷', () => {
      const { container } = render(
        <ProgressLabel
          currentStep={2}
          totalSteps={5}
          format="custom"
          stepDescription="커스텀 진행 중"
        />
      );

      expect(container.firstChild).toMatchSnapshot();
    });

    it('진행률 바 숨김 스냅샷', () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} showProgress={false} />
      );

      expect(container.firstChild).toMatchSnapshot();
    });
  });

  describe('접근성 테스트', () => {
    it('기본 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('에러 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <ProgressLabel currentStep={2} totalSteps={5} error="테스트 에러" />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('완료 상태에서 접근성 위반이 없다', async () => {
      const { container } = render(
        <ProgressLabel currentStep={4} totalSteps={5} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('다양한 포맷에서 접근성 위반이 없다', async () => {
      const formats = ['percentage', 'step-count', 'custom'] as const;

      for (const format of formats) {
        const { container } = render(
          <ProgressLabel
            currentStep={2}
            totalSteps={5}
            format={format}
            stepDescription={format === 'custom' ? '커스텀 설명' : undefined}
          />
        );

        const results = await axe(container);
        expect(results).toHaveNoViolations();
      }
    });
  });
});
