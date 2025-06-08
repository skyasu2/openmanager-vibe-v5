/**
 * 🔧 설정 서비스 - API 호출 관리
 */

import { SettingsData, SettingsAPIResponse } from '../types/ProfileTypes';

export class SettingsService {
  /**
   * 모든 설정 데이터를 병렬로 로드
   */
  static async loadAllSettings(): Promise<SettingsData> {
    const defaultSettings: SettingsData = {
      metrics: { interval: 5, realistic: false },
      scenarios: { active: 0, total: 0 },
      thresholds: { cpu: 80, memory: 85, disk: 90 },
      dashboard: { layout: 'grid', widgets: 0 },
      notifications: { slack: false, email: false, webhook: false },
      backup: { lastBackup: '없음', autoBackup: false },
      theme: 'dark',
    };

    try {
      // 모든 설정을 병렬로 로드
      const [
        metricsRes,
        scenariosRes,
        thresholdsRes,
        dashboardRes,
        notificationRes,
        backupRes,
      ] = await Promise.allSettled([
        fetch('/api/admin/metrics-config'),
        fetch('/api/admin/scenarios'),
        fetch('/api/admin/thresholds'),
        fetch('/api/admin/dashboard-config'),
        fetch('/api/admin/notification-config'),
        fetch('/api/admin/backup-status'),
      ]);

      const newSettings = { ...defaultSettings };

      // 각 응답 처리
      if (metricsRes.status === 'fulfilled' && metricsRes.value.ok) {
        const metrics = await metricsRes.value.json();
        newSettings.metrics = {
          interval: metrics.interval || 5,
          realistic: metrics.realistic || false,
        };
      }

      if (scenariosRes.status === 'fulfilled' && scenariosRes.value.ok) {
        const scenarios = await scenariosRes.value.json();
        newSettings.scenarios = {
          active: scenarios.active || 0,
          total: scenarios.total || 0,
        };
      }

      if (thresholdsRes.status === 'fulfilled' && thresholdsRes.value.ok) {
        const thresholds = await thresholdsRes.value.json();
        newSettings.thresholds = {
          cpu: thresholds.cpu || 80,
          memory: thresholds.memory || 85,
          disk: thresholds.disk || 90,
        };
      }

      if (dashboardRes.status === 'fulfilled' && dashboardRes.value.ok) {
        const dashboard = await dashboardRes.value.json();
        newSettings.dashboard = {
          layout: dashboard.layout || 'grid',
          widgets: dashboard.widgets || 0,
        };
      }

      if (notificationRes.status === 'fulfilled' && notificationRes.value.ok) {
        const notification = await notificationRes.value.json();
        newSettings.notifications = {
          slack: notification.slack || false,
          email: notification.email || false,
          webhook: notification.webhook || false,
        };
      }

      if (backupRes.status === 'fulfilled' && backupRes.value.ok) {
        const backup = await backupRes.value.json();
        newSettings.backup = {
          lastBackup: backup.lastBackup || '없음',
          autoBackup: backup.autoBackup || false,
        };
      }

      // 테마 정보는 localStorage에서 로드
      if (typeof window !== 'undefined') {
        newSettings.theme = localStorage.getItem('theme') || 'dark';
      }

      return newSettings;
    } catch (error) {
      console.warn('설정 로드 실패:', error);
      return defaultSettings;
    }
  }

  /**
   * 데이터 생성기 상태 확인
   */
  static async checkGeneratorStatus(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/data-generator/status');
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '상태 확인 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '데이터 생성기 상태 확인 실패'
      };
    }
  }

  /**
   * 모니터링 상태 확인
   */
  static async checkMonitorStatus(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/monitoring/status');
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '모니터링 상태 확인 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '모니터링 상태 확인 실패'
      };
    }
  }

  /**
   * 메트릭 설정
   */
  static async configureMetrics(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/metrics-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure' })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '메트릭 설정 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '메트릭 설정 실패'
      };
    }
  }

  /**
   * 시나리오 관리
   */
  static async manageScenarios(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/scenarios', {
        method: 'GET'
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '시나리오 관리 페이지 열림',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '시나리오 관리 실패'
      };
    }
  }

  /**
   * 임계값 설정
   */
  static async configureThresholds(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure' })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '임계값 설정 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '임계값 설정 실패'
      };
    }
  }

  /**
   * 대시보드 커스터마이징
   */
  static async customizeDashboard(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/dashboard-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'customize' })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '대시보드 커스터마이징 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '대시보드 커스터마이징 실패'
      };
    }
  }

  /**
   * 알림 설정
   */
  static async configureNotifications(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/notification-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure' })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '알림 설정 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '알림 설정 실패'
      };
    }
  }

  /**
   * 테마 설정
   */
  static async configureTheme(theme: string): Promise<SettingsAPIResponse> {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        
        // 테마 변경 이벤트 발생
        document.documentElement.setAttribute('data-theme', theme);
        window.dispatchEvent(new CustomEvent('themeChanged', { detail: theme }));
      }
      
      return {
        success: true,
        message: `테마가 ${theme}로 변경되었습니다`,
        data: { theme }
      };
    } catch (error) {
      return {
        success: false,
        message: '테마 설정 실패'
      };
    }
  }

  /**
   * 백업 설정
   */
  static async configureBackup(): Promise<SettingsAPIResponse> {
    try {
      const response = await fetch('/api/admin/backup-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'configure' })
      });
      
      const data = await response.json();
      
      return {
        success: response.ok,
        message: data.message || '백업 설정 완료',
        data
      };
    } catch (error) {
      return {
        success: false,
        message: '백업 설정 실패'
      };
    }
  }
} 