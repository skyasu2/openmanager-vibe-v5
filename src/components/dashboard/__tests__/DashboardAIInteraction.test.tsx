import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom';
import DashboardHeader from '../DashboardHeader';

// Mock Types
interface AIAssistantButtonMockProps {
  isOpen: boolean;
  isEnabled: boolean;
  onClick: () => void;
}

// Mock dependencies
vi.mock('@/stores/useAISidebarStore', () => ({
  useAISidebarStore: vi.fn(),
}));

vi.mock('@/stores/useUnifiedAdminStore', () => ({
  useUnifiedAdminStore: vi.fn(),
}));

vi.mock('@/hooks/useUserPermissions', () => ({
  useUserPermissions: vi.fn(),
}));

vi.mock('@/config/guestMode', () => ({
  isGuestFullAccessEnabled: vi.fn(),
}));

// Mock child components to avoid complex rendering
vi.mock('@/components/shared/UnifiedProfileHeader', () => ({
  default: () => <div data-testid="unified-profile-header">Profile Header</div>,
}));

vi.mock('../RealTimeDisplay', () => ({
  RealTimeDisplay: () => <div data-testid="real-time-display">Real Time</div>,
}));

vi.mock('../SystemStatusBadge', () => ({
  SystemStatusBadge: () => (
    <div data-testid="system-status-badge">System Status</div>
  ),
}));

// Mock AIAssistantButton to verify props and interaction
vi.mock('../AIAssistantButton', () => ({
  AIAssistantButton: ({
    isOpen,
    isEnabled,
    onClick,
  }: AIAssistantButtonMockProps) => (
    <button
      data-testid="ai-assistant-button"
      onClick={onClick}
      disabled={!isEnabled}
      data-is-open={isOpen}
    >
      AI Assistant
    </button>
  ),
}));

import { isGuestFullAccessEnabled } from '@/config/guestMode';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useAISidebarStore } from '@/stores/useAISidebarStore';
import { useUnifiedAdminStore } from '@/stores/useUnifiedAdminStore';

describe('DashboardHeader AI Interaction', () => {
  const mockSetOpen = vi.fn();
  const mockOnNavigateHome = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useAISidebarStore).mockReturnValue({
      isOpen: false,
      setOpen: mockSetOpen,
    });

    vi.mocked(useUnifiedAdminStore).mockReturnValue({
      aiAgent: { isEnabled: true },
    });

    vi.mocked(useUserPermissions).mockReturnValue({
      canToggleAI: true,
    });

    vi.mocked(isGuestFullAccessEnabled).mockReturnValue(false);
  });

  it('renders AI Assistant button when user has permission', () => {
    render(<DashboardHeader onNavigateHome={mockOnNavigateHome} />);

    expect(screen.getByTestId('ai-assistant-button')).toBeInTheDocument();
  });

  it('does not render AI Assistant button when user lacks permission', () => {
    vi.mocked(useUserPermissions).mockReturnValue({
      canToggleAI: false,
    });

    render(<DashboardHeader onNavigateHome={mockOnNavigateHome} />);

    expect(screen.queryByTestId('ai-assistant-button')).not.toBeInTheDocument();
  });

  it('renders AI Assistant button when guest full access is enabled even without permission', () => {
    vi.mocked(useUserPermissions).mockReturnValue({
      canToggleAI: false,
    });
    vi.mocked(isGuestFullAccessEnabled).mockReturnValue(true);

    render(<DashboardHeader onNavigateHome={mockOnNavigateHome} />);

    expect(screen.getByTestId('ai-assistant-button')).toBeInTheDocument();
  });

  it('toggles AI sidebar state when button is clicked', () => {
    // Initial state: closed
    vi.mocked(useAISidebarStore).mockReturnValue({
      isOpen: false,
      setOpen: mockSetOpen,
    });

    render(<DashboardHeader onNavigateHome={mockOnNavigateHome} />);

    const button = screen.getByTestId('ai-assistant-button');
    fireEvent.click(button);

    // Should call setOpen with true (inverse of false)
    expect(mockSetOpen).toHaveBeenCalledWith(true);
  });

  it('toggles AI sidebar state to closed when it is already open', () => {
    // Initial state: open
    vi.mocked(useAISidebarStore).mockReturnValue({
      isOpen: true,
      setOpen: mockSetOpen,
    });

    render(<DashboardHeader onNavigateHome={mockOnNavigateHome} />);

    const button = screen.getByTestId('ai-assistant-button');
    // Verify isOpen prop was passed correctly (via data attribute in mock)
    expect(button).toHaveAttribute('data-is-open', 'true');

    fireEvent.click(button);

    // Should call setOpen with false (inverse of true)
    expect(mockSetOpen).toHaveBeenCalledWith(false);
  });

  it('calls onToggleAgent callback if provided (backward compatibility)', () => {
    const mockOnToggleAgent = vi.fn();

    render(
      <DashboardHeader
        onNavigateHome={mockOnNavigateHome}
        onToggleAgent={mockOnToggleAgent}
      />
    );

    const button = screen.getByTestId('ai-assistant-button');
    fireEvent.click(button);

    expect(mockOnToggleAgent).toHaveBeenCalled();
  });
});
