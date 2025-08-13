import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AIEngineSelector } from '@/domains/ai-sidebar/components/AIEngineSelector';

describe('AIEngineSelector', () => {
  const mockOnEngineChange = vi.fn();
  
  beforeEach(() => {
    mockOnEngineChange.mockClear();
  });

  it('renders all engine options', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    expect(screen.getByText(/통합 AI 엔진/)).toBeInTheDocument();
    expect(screen.getByText(/Google AI/)).toBeInTheDocument();
    expect(screen.getByText(/로컬 MCP/)).toBeInTheDocument();
  });

  it('shows current engine as selected', () => {
    render(
      <AIEngineSelector
        currentEngine="GOOGLE_ONLY"
        onEngineChange={mockOnEngineChange}
      />
    );

    const selectedButton = screen.getByRole('button', { pressed: true });
    expect(selectedButton).toHaveTextContent('Google AI Only');
  });

  it('calls onEngineChange when different engine is selected', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    const googleButton = screen.getByText('Google AI Only');
    fireEvent.click(googleButton);

    expect(mockOnEngineChange).toHaveBeenCalledWith('GOOGLE_ONLY');
  });

  it('shows engine descriptions on hover', async () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
      />
    );

    const unifiedButton = screen.getByText(/통합 AI 엔진/);
    fireEvent.mouseEnter(unifiedButton);

    expect(screen.getByText(/모든 AI 엔진 통합/)).toBeInTheDocument();
  });

  it('handles disabled state correctly', () => {
    render(
      <AIEngineSelector
        currentEngine="UNIFIED"
        onEngineChange={mockOnEngineChange}
        disabled={true}
      />
    );

    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });
});