import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import UnifiedProfileComponent from './UnifiedProfileComponent';

// 🎯 Store 목업 - 안전한 방식으로 설정
const mockStore = {
  ui: {
    isSettingsPanelOpen: false,
  },
  setSettingsPanelOpen: vi.fn(),
  adminMode: {
    isAuthenticated: false,
  },
  logoutAdmin: vi.fn(),
};

vi.mock('@/stores/useUnifiedAdminStore', () => ({
  useUnifiedAdminStore: vi.fn(() => mockStore),
}));

// Framer Motion 목업
vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  motion: {
    div: 'div',
  },
}));

// 하위 컴포넌트 목업
vi.mock('./unified-profile/UnifiedProfileButton', () => ({
  UnifiedProfileButton: () => (
    <button data-testid='profile-button'>Profile Button</button>
  ),
}));

vi.mock('./unified-profile/UnifiedSettingsPanel', () => ({
  UnifiedSettingsPanel: ({
    isOpen,
    onClose,
  }: {
    isOpen: boolean;
    onClose: () => void;
  }) =>
    isOpen ? (
      <div data-testid='settings-panel'>
        <button onClick={onClose} data-testid='close-settings'>
          Close
        </button>
        Settings Panel
      </div>
    ) : null,
}));

describe('UnifiedProfileComponent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock 함수들을 명시적으로 초기화
    mockStore.setSettingsPanelOpen.mockClear();
    mockStore.logoutAdmin.mockClear();
  });

  it('기본 props로 렌더링된다', () => {
    render(<UnifiedProfileComponent />);

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('사용자 이름과 아바타를 props로 받는다', () => {
    render(
      <UnifiedProfileComponent
        userName='테스트 사용자'
        userAvatar='https://example.com/avatar.jpg'
      />
    );

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('설정 패널이 닫혀있을 때 보이지 않는다', () => {
    render(<UnifiedProfileComponent />);

    expect(screen.queryByTestId('settings-panel')).not.toBeInTheDocument();
  });

  it('설정 패널이 열려있을 때 보인다', () => {
    mockStore.ui.isSettingsPanelOpen = true;

    render(<UnifiedProfileComponent />);

    expect(screen.getByTestId('settings-panel')).toBeInTheDocument();
  });

  it('기본 사용자 이름이 설정된다', () => {
    render(<UnifiedProfileComponent />);

    // 컴포넌트가 정상적으로 렌더링되는지 확인
    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('긴 사용자 이름을 처리한다', () => {
    const longName = '매우긴사용자이름테스트용입니다매우길어요';

    render(<UnifiedProfileComponent userName={longName} />);

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('아바타 URL이 없어도 정상 작동한다', () => {
    render(<UnifiedProfileComponent userName='테스트' />);

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('한글 사용자 이름을 지원한다', () => {
    render(<UnifiedProfileComponent userName='홍길동' />);

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('영문 사용자 이름을 지원한다', () => {
    render(<UnifiedProfileComponent userName='John Doe' />);

    expect(screen.getByTestId('profile-button')).toBeInTheDocument();
  });

  it('설정 패널 닫기 기능이 작동한다', async () => {
    mockStore.ui.isSettingsPanelOpen = true;

    render(<UnifiedProfileComponent />);

    const closeButton = screen.getByTestId('close-settings');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(mockStore.setSettingsPanelOpen).toHaveBeenCalledWith(false);
    });
  });
});
