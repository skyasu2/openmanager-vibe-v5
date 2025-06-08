/**
 * 🔧 프로필 컴포넌트 타입 정의
 */

export interface UnifiedProfileComponentProps {
  userName?: string;
  userAvatar?: string;
}

export interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef?: React.RefObject<HTMLButtonElement | null>;
}

export interface DropdownPosition {
  top: number;
  right: number;
}

export interface SettingsData {
  metrics: {
    interval: number;
    realistic: boolean;
  };
  scenarios: {
    active: number;
    total: number;
  };
  thresholds: {
    cpu: number;
    memory: number;
    disk: number;
  };
  dashboard: {
    layout: string;
    widgets: number;
  };
  notifications: {
    slack: boolean;
    email: boolean;
    webhook: boolean;
  };
  backup: {
    lastBackup: string;
    autoBackup: boolean;
  };
  theme: string;
}

export type SettingsTab = 'ai' | 'generator' | 'monitor' | 'general';

export interface SettingsAPIResponse {
  success: boolean;
  message?: string;
  data?: any;
}

export interface SystemStatus {
  isRunning: boolean;
  isLocked: boolean;
  aiAgentEnabled: boolean;
  aiAgentAuthenticated: boolean;
}

export interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  position: DropdownPosition;
  userName: string;
  userAvatar?: string;
  onSettingsClick: () => void;
}

export interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  variant?: 'default' | 'warning' | 'danger';
  disabled?: boolean;
} 