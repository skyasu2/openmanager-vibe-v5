/**
 * 🧪 ResultCard 컴포넌트 User Event 테스트
 *
 * @description AI 결과 카드의 렌더링, 인터랙션, 스타일링 검증 테스트
 * @author Claude Code
 * @created 2025-11-26
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ResultCard, { type ResultCardData } from '@/components/ai/ResultCard';

describe('🎯 ResultCard - User Event 테스트', () => {
  let user: ReturnType<typeof userEvent.setup>;

  // Mock 데이터
  const mockData: ResultCardData = {
    id: 'test-card-1',
    title: '서버 성능 분석 결과',
    category: 'normal',
    content:
      '서버가 정상적으로 작동하고 있습니다. CPU 사용률 45%, 메모리 62%로 안정적입니다.',
    timestamp: new Date('2025-11-26T10:00:00'),
    metrics: [
      { label: 'CPU 사용률', value: '45%', status: 'good' },
      { label: '메모리', value: '62%', status: 'warning' },
      { label: '디스크', value: '73%', status: 'critical' },
    ],
    actions: [
      { label: '상세 보기', action: vi.fn(), variant: 'primary' },
      { label: '무시', action: vi.fn(), variant: 'secondary' },
    ],
    expandable: true,
    metadata: {
      apiUsed: 'optimized',
      confidence: 0.85,
      method: 'ML-based',
      patterns: ['pattern1', 'pattern2'],
    },
  };

  beforeEach(() => {
    user = userEvent.setup();
    vi.clearAllMocks();
  });

  describe('기본 렌더링', () => {
    it('카드 제목이 정상적으로 표시된다', () => {
      render(<ResultCard data={mockData} />);

      expect(screen.getByText('서버 성능 분석 결과')).toBeDefined();
    });

    it('카드 내용이 표시된다', () => {
      render(<ResultCard data={mockData} />);

      expect(
        screen.getByText(/서버가 정상적으로 작동하고 있습니다/)
      ).toBeDefined();
    });

    it('타임스탬프가 올바른 형식으로 표시된다', () => {
      render(<ResultCard data={mockData} />);

      // Korean locale format: "11월 26일 오전 10:00"
      expect(screen.getByText(/11월 26/)).toBeDefined();
    });

    it('커스텀 className이 적용된다', () => {
      const { container } = render(
        <ResultCard data={mockData} className="custom-class" />
      );

      const card = container.querySelector('.custom-class');
      expect(card).toBeDefined();
    });
  });

  describe('Category별 스타일', () => {
    it('urgent 카테고리는 빨간색 테마를 사용한다', () => {
      const urgentData = { ...mockData, category: 'urgent' as const };
      const { container } = render(<ResultCard data={urgentData} />);

      // urgent는 border-red-200, bg-red-50 클래스 사용
      const card = container.querySelector('.border-red-200');
      expect(card).toBeDefined();
    });

    it('warning 카테고리는 노란색 테마를 사용한다', () => {
      const warningData = { ...mockData, category: 'warning' as const };
      const { container } = render(<ResultCard data={warningData} />);

      const card = container.querySelector('.border-yellow-200');
      expect(card).toBeDefined();
    });

    it('normal 카테고리는 녹색 테마를 사용한다', () => {
      const normalData = { ...mockData, category: 'normal' as const };
      const { container } = render(<ResultCard data={normalData} />);

      const card = container.querySelector('.border-green-200');
      expect(card).toBeDefined();
    });

    it('recommendation 카테고리는 보라색 테마를 사용한다', () => {
      const recommendationData = {
        ...mockData,
        category: 'recommendation' as const,
      };
      const { container } = render(<ResultCard data={recommendationData} />);

      const card = container.querySelector('.border-purple-200');
      expect(card).toBeDefined();
    });
  });

  describe('Metrics 표시', () => {
    it('모든 메트릭이 표시된다', () => {
      render(<ResultCard data={mockData} />);

      expect(screen.getByText('CPU 사용률')).toBeDefined();
      expect(screen.getByText('45%')).toBeDefined();
      expect(screen.getByText('메모리')).toBeDefined();
      expect(screen.getByText('62%')).toBeDefined();
      expect(screen.getByText('디스크')).toBeDefined();
      expect(screen.getByText('73%')).toBeDefined();
    });

    it('good status는 녹색으로 표시된다', () => {
      render(<ResultCard data={mockData} />);

      const cpuMetric = screen.getByText('45%');
      expect(cpuMetric.className).toContain('text-green-600');
      expect(cpuMetric.className).toContain('bg-green-100');
    });

    it('warning status는 노란색으로 표시된다', () => {
      render(<ResultCard data={mockData} />);

      const memoryMetric = screen.getByText('62%');
      expect(memoryMetric.className).toContain('text-yellow-600');
      expect(memoryMetric.className).toContain('bg-yellow-100');
    });

    it('critical status는 빨간색으로 표시된다', () => {
      render(<ResultCard data={mockData} />);

      const diskMetric = screen.getByText('73%');
      expect(diskMetric.className).toContain('text-red-600');
      expect(diskMetric.className).toContain('bg-red-100');
    });

    it('metrics가 없을 때는 표시되지 않는다', () => {
      const dataWithoutMetrics = { ...mockData, metrics: undefined };
      render(<ResultCard data={dataWithoutMetrics} />);

      expect(screen.queryByText('CPU 사용률')).toBeNull();
    });
  });

  describe('Expand/Collapse 인터랙션', () => {
    it('expandable이 true일 때 펼치기 버튼이 표시된다', () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      expect(expandButton).toBeDefined();
    });

    it('펼치기 버튼 클릭 시 확장 내용이 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      // 확장 후 "분석 정보" 섹션이 표시됨
      expect(screen.getByText('분석 정보')).toBeDefined();
    });

    it('확장 후 접기 버튼이 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      const collapseButton = screen.getByTitle('접기');
      expect(collapseButton).toBeDefined();
    });

    it('접기 버튼 클릭 시 확장 내용이 숨겨진다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      expect(screen.getByText('분석 정보')).toBeDefined();

      const collapseButton = screen.getByTitle('접기');
      await user.click(collapseButton);

      expect(screen.queryByText('분석 정보')).toBeNull();
    });

    it('expandable이 false일 때 펼치기 버튼이 표시되지 않는다', () => {
      const dataNotExpandable = { ...mockData, expandable: false };
      render(<ResultCard data={dataNotExpandable} />);

      expect(screen.queryByTitle('펼치기')).toBeNull();
    });
  });

  describe('Remove 버튼', () => {
    it('onRemove가 제공되면 제거 버튼이 표시된다', () => {
      const mockOnRemove = vi.fn();
      render(<ResultCard data={mockData} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('카드 제거');
      expect(removeButton).toBeDefined();
    });

    it('제거 버튼 클릭 시 onRemove가 호출된다', async () => {
      const mockOnRemove = vi.fn();
      render(<ResultCard data={mockData} onRemove={mockOnRemove} />);

      const removeButton = screen.getByTitle('카드 제거');
      await user.click(removeButton);

      expect(mockOnRemove).toHaveBeenCalledTimes(1);
      expect(mockOnRemove).toHaveBeenCalledWith('test-card-1');
    });

    it('onRemove가 없으면 제거 버튼이 표시되지 않는다', () => {
      render(<ResultCard data={mockData} />);

      expect(screen.queryByTitle('카드 제거')).toBeNull();
    });
  });

  describe('Actions 버튼', () => {
    it('모든 액션 버튼이 표시된다', () => {
      render(<ResultCard data={mockData} />);

      expect(screen.getByText('상세 보기')).toBeDefined();
      expect(screen.getByText('무시')).toBeDefined();
    });

    it('primary variant는 indigo 색상을 사용한다', () => {
      render(<ResultCard data={mockData} />);

      const primaryButton = screen.getByText('상세 보기');
      expect(primaryButton.className).toContain('bg-indigo-600');
    });

    it('secondary variant는 gray 색상을 사용한다', () => {
      render(<ResultCard data={mockData} />);

      const secondaryButton = screen.getByText('무시');
      expect(secondaryButton.className).toContain('bg-gray-200');
    });

    it('danger variant는 red 색상을 사용한다', () => {
      const dataWithDangerAction = {
        ...mockData,
        actions: [
          { label: '삭제', action: vi.fn(), variant: 'danger' as const },
        ],
      };
      render(<ResultCard data={dataWithDangerAction} />);

      const dangerButton = screen.getByText('삭제');
      expect(dangerButton.className).toContain('bg-red-600');
    });

    it('액션 버튼 클릭 시 action 콜백이 호출된다', async () => {
      const mockAction = vi.fn();
      const dataWithMockAction = {
        ...mockData,
        actions: [
          { label: '테스트', action: mockAction, variant: 'primary' as const },
        ],
      };
      render(<ResultCard data={dataWithMockAction} />);

      const actionButton = screen.getByText('테스트');
      await user.click(actionButton);

      expect(mockAction).toHaveBeenCalledTimes(1);
    });

    it('actions가 없으면 버튼이 표시되지 않는다', () => {
      const dataWithoutActions = { ...mockData, actions: undefined };
      render(<ResultCard data={dataWithoutActions} />);

      expect(screen.queryByText('상세 보기')).toBeNull();
    });
  });

  describe('Metadata 표시', () => {
    it('확장 시 API 정보가 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      expect(screen.getByText('API:')).toBeDefined();
      expect(screen.getByText('optimized')).toBeDefined();
    });

    it('확장 시 신뢰도 정보가 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      expect(screen.getByText('신뢰도:')).toBeDefined();
      expect(screen.getByText('85%')).toBeDefined();
    });

    it('확장 시 방법 정보가 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      expect(screen.getByText('방법:')).toBeDefined();
      expect(screen.getByText('ML-based')).toBeDefined();
    });

    it('확장 시 패턴 정보가 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      expect(screen.getByText('매칭 패턴:')).toBeDefined();
      expect(screen.getByText('pattern1')).toBeDefined();
      expect(screen.getByText('pattern2')).toBeDefined();
    });

    it('신뢰도가 80% 이상일 때 녹색으로 표시된다', async () => {
      render(<ResultCard data={mockData} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      const confidenceElement = screen.getByText('85%');
      expect(confidenceElement.className).toContain('bg-green-100');
      expect(confidenceElement.className).toContain('text-green-700');
    });

    it('신뢰도가 50-80%일 때 노란색으로 표시된다', async () => {
      const dataWithMediumConfidence = {
        ...mockData,
        metadata: { ...mockData.metadata, confidence: 0.65 },
      };
      render(<ResultCard data={dataWithMediumConfidence} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      const confidenceElement = screen.getByText('65%');
      expect(confidenceElement.className).toContain('bg-yellow-100');
      expect(confidenceElement.className).toContain('text-yellow-700');
    });

    it('신뢰도가 50% 미만일 때 빨간색으로 표시된다', async () => {
      const dataWithLowConfidence = {
        ...mockData,
        metadata: { ...mockData.metadata, confidence: 0.35 },
      };
      render(<ResultCard data={dataWithLowConfidence} />);

      const expandButton = screen.getByTitle('펼치기');
      await user.click(expandButton);

      const confidenceElement = screen.getByText('35%');
      expect(confidenceElement.className).toContain('bg-red-100');
      expect(confidenceElement.className).toContain('text-red-700');
    });
  });
});
