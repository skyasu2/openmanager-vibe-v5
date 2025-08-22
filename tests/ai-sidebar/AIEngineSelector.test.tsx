import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIEngineSelector } from '@/domains/ai-sidebar/components/AIEngineSelector';

describe('AIEngineSelector', () => {
  const mockOnEngineChange = vi.fn();
  
  beforeEach(() => {
    mockOnEngineChange.mockClear();
  });

  it('renders all engine options when dropdown is opened', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 먼저 드롭다운 버튼을 클릭하여 옵션들을 표시
    const dropdownButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(dropdownButton);

    // 드롭다운 내부의 엔진 옵션 버튼들이 표시되어야 함
    const engineButtons = screen.getAllByRole('button', { pressed: false });
    const pressedButtons = screen.getAllByRole('button', { pressed: true });
    
    // 현재 선택된 엔진(UNIFIED) + 다른 엔진들이 모두 표시되어야 함
    expect(engineButtons.length + pressedButtons.length).toBe(3); // 3개 엔진 모두
    
    // 드롭다운 헤더 확인
    expect(screen.getByText('AI 모델 선택')).toBeInTheDocument();
  });

  it('shows current engine in dropdown button', () => {
    render(
      <AIEngineSelector
        currentEngine="GOOGLE_ONLY"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 메인 버튼에 현재 선택된 엔진이 표시되어야 함
    expect(screen.getByText('Google AI Only')).toBeInTheDocument();
  });

  it('shows selected engine as pressed in dropdown', () => {
    render(
      <AIEngineSelector
        currentEngine="GOOGLE_ONLY"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 드롭다운 열기
    const dropdownButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(dropdownButton);

    // 선택된 엔진이 pressed 상태여야 함
    const selectedEngineButton = screen.getByRole('button', { pressed: true });
    expect(selectedEngineButton).toHaveTextContent('Google AI Only');
  });

  it('calls onEngineChange when different engine is selected', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 드롭다운 열기
    const dropdownButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(dropdownButton);

    // Google AI Only 엔진 선택 (드롭다운 내부의 버튼 중에서 pressed=false인 것)
    const engineButtons = screen.getAllByRole('button', { pressed: false });
    const googleButton = engineButtons.find(button => 
      button.textContent?.includes('Google AI Only')
    );
    
    expect(googleButton).toBeDefined();
    fireEvent.click(googleButton!);

    expect(mockOnEngineChange).toHaveBeenCalledWith('GOOGLE_ONLY');
  });

  it('shows engine descriptions in dropdown', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 드롭다운 열기
    const dropdownButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(dropdownButton);

    // 설명이 표시되어야 함 (각 엔진의 고유한 설명 텍스트로 확인)
    expect(screen.getByText(/모든 AI 엔진 통합 - 최적의 성능과 유연성 제공/)).toBeInTheDocument();
    expect(screen.getByText(/Google AI만 사용 - 고급 자연어 처리와 추론 능력/)).toBeInTheDocument();
    expect(screen.getByText(/로컬 MCP 서버 - 프라이버시 보장과 오프라인 동작/)).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
        disabled={true}
      />
    );

    // 메인 드롭다운 버튼이 비활성화되어야 함
    const dropdownButton = screen.getByRole('button');
    expect(dropdownButton).toBeDisabled();
  });

  it('closes dropdown when engine is selected', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    // 드롭다운 열기
    const dropdownButton = screen.getByRole('button', { expanded: false });
    fireEvent.click(dropdownButton);

    // 먼저 드롭다운이 열려있는지 확인
    expect(screen.getByText('AI 모델 선택')).toBeInTheDocument();

    // 엔진 선택 (드롭다운 내부의 버튼 중에서 pressed=false인 것)
    const engineButtons = screen.getAllByRole('button', { pressed: false });
    const googleButton = engineButtons.find(button => 
      button.textContent?.includes('Google AI Only')
    );
    
    expect(googleButton).toBeDefined();
    fireEvent.click(googleButton!);

    // 드롭다운이 닫혀야 함 (옵션들이 더 이상 보이지 않음)
    expect(screen.queryByText('AI 모델 선택')).not.toBeInTheDocument();
  });
});