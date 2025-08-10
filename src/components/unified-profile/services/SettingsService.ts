/**
 * 🔧 Settings Service
 *
 * 통합 설정 관리를 위한 서비스 클래스
 * 모든 설정 관련 API 호출을 중앙 집중화
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import type {
  SettingsData,
  GeneratorConfig,
  ApiResponse,
  HealthCheckResponse,
} from '../types/ProfileTypes';

export class SettingsService {
  private static instance: SettingsService;

  public static getInstance(): SettingsService {
    if (!SettingsService.instance) {
      SettingsService.instance = new SettingsService();
    }
    return SettingsService.instance;
  }

  /**
   * 모든 설정을 병렬로 로드
   */
  async loadAllSettings(): Promise<SettingsData> {
    try {
      const [
        metricsRes,
        scenariosRes,
        thresholdsRes,
        dashboardRes,
        notificationRes,
        backupRes,
      ] = await Promise.allSettled([
        this.fetchMetricsConfig(),
        this.fetchScenariosConfig(),
        this.fetchThresholdsConfig(),
        this.fetchDashboardConfig(),
        this.fetchNotificationConfig(),
        this.fetchBackupStatus(),
      ]);

      return {
        metrics:
          metricsRes.status === 'fulfilled'
            ? metricsRes.value
            : { interval: 5, realistic: false },
        scenarios:
          scenariosRes.status === 'fulfilled'
            ? scenariosRes.value
            : { active: 0, total: 0 },
        thresholds:
          thresholdsRes.status === 'fulfilled'
            ? thresholdsRes.value
            : { cpu: 80, memory: 85, disk: 90 },
        dashboard:
          dashboardRes.status === 'fulfilled'
            ? dashboardRes.value
            : { layout: 'grid', widgets: 0 },
        notifications:
          notificationRes.status === 'fulfilled'
            ? notificationRes.value
            : { email: false, webhook: false },
        backup:
          backupRes.status === 'fulfilled'
            ? backupRes.value
            : { lastBackup: '없음', autoBackup: false },
        theme: this.getTheme(),
      };
    } catch (error) {
      console.error('설정 로드 실패:', error);
      return this.getDefaultSettings();
    }
  }

  /**
   * 메트릭 설정 조회
   */
  private async fetchMetricsConfig() {
    const response = await fetch('/api/admin/metrics-config');
    if (!response.ok) throw new Error('메트릭 설정 로드 실패');
    const data = await response.json();
    return {
      interval: data.interval || 5,
      realistic: data.realistic || false,
    };
  }

  /**
   * 시나리오 설정 조회
   */
  private async fetchScenariosConfig() {
    const response = await fetch('/api/admin/scenarios');
    if (!response.ok) throw new Error('시나리오 설정 로드 실패');
    const data = await response.json();
    return {
      active: data.active || 0,
      total: data.total || 0,
    };
  }

  /**
   * 임계값 설정 조회
   */
  private async fetchThresholdsConfig() {
    const response = await fetch('/api/admin/thresholds');
    if (!response.ok) throw new Error('임계값 설정 로드 실패');
    const data = await response.json();
    return {
      cpu: data.cpu || 80,
      memory: data.memory || 85,
      disk: data.disk || 90,
    };
  }

  /**
   * 대시보드 설정 조회
   */
  private async fetchDashboardConfig() {
    const response = await fetch('/api/admin/dashboard-config');
    if (!response.ok) throw new Error('대시보드 설정 로드 실패');
    const data = await response.json();
    return {
      layout: data.layout || 'grid',
      widgets: data.widgets || 0,
    };
  }

  /**
   * 알림 설정 조회 (Vercel 최적화)
   */
  private async fetchNotificationConfig() {
    // Vercel 환경에서는 콘솔 로깅만 지원
    if (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL === '1') {
      return { email: false, webhook: false };
    }

    return { email: false, webhook: false };
  }

  /**
   * 백업 상태 조회
   */
  private async fetchBackupStatus() {
    const response = await fetch('/api/admin/backup-status');
    if (!response.ok) throw new Error('백업 상태 로드 실패');
    const data = await response.json();
    return {
      lastBackup: data.lastBackup || '없음',
      autoBackup: data.autoBackup || false,
    };
  }

  /**
   * 제너레이터 설정 조회
   */
  async loadGeneratorConfig(): Promise<GeneratorConfig | null> {
    try {
      const response = await fetch('/api/admin/generator-config');
      if (!response.ok) throw new Error('제너레이터 설정 로드 실패');
      const data = await response.json();
      return {
        serverCount: data.serverCount || 0,
        architecture: data.architecture || 'unknown',
        isActive: data.isActive || false,
        lastUpdate: data.lastUpdate || new Date().toISOString(),
      };
    } catch (error) {
      console.error('제너레이터 설정 로드 실패:', error);
      return null;
    }
  }

  /**
   * 서버 개수 변경
   */
  async updateServerCount(newCount: number): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/admin/generator-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serverCount: newCount }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '서버 개수 변경 실패');
      }

      const data = await response.json();
      return { success: true, data, message: '서버 개수가 변경되었습니다.' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 아키텍처 변경
   */
  async updateArchitecture(newArch: string): Promise<ApiResponse> {
    try {
      const response = await fetch('/api/admin/generator-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ architecture: newArch }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '아키텍처 변경 실패');
      }

      const data = await response.json();
      return { success: true, data, message: '아키텍처가 변경되었습니다.' };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      };
    }
  }

  /**
   * 시스템 헬스체크
   */
  async checkSystemHealth(): Promise<HealthCheckResponse> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 제한

      const response = await fetch('/api/health', {
        signal: controller.signal,
        headers: { 'Cache-Control': 'no-cache' },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`헬스체크 실패: ${response.status}`);
      }

      const data = await response.json();
      return {
        status: data.status || 'unhealthy',
        services: data.services || { database: false, redis: false, ai: false },
        uptime: data.uptime || 0,
        version: data.version || 'unknown',
      };
    } catch (error) {
      console.error('헬스체크 실패:', error);
      return {
        status: 'unhealthy',
        services: { database: false, redis: false, ai: false },
        uptime: 0,
        version: 'unknown',
      };
    }
  }

  /**
   * 개별 설정 조회 메서드들
   */
  async getMetricsConfig() {
    const response = await fetch('/api/admin/metrics-config');
    return response.json();
  }

  async getScenariosConfig() {
    const response = await fetch('/api/admin/scenarios');
    return response.json();
  }

  async getThresholdsConfig() {
    const response = await fetch('/api/admin/thresholds');
    return response.json();
  }

  async getDashboardConfig() {
    const response = await fetch('/api/admin/dashboard-config');
    return response.json();
  }

  async getNotificationConfig() {
    const response = await fetch('/api/admin/notification-config');
    return response.json();
  }

  async getBackupStatus() {
    const response = await fetch('/api/admin/backup-status');
    return response.json();
  }

  /**
   * 테마 관련 유틸리티
   */
  getTheme(): string {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem('theme') || 'dark';
  }

  setTheme(theme: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
  }

  /**
   * 기본 설정값 반환
   */
  private getDefaultSettings(): SettingsData {
    return {
      metrics: { interval: 5, realistic: false },
      scenarios: { active: 0, total: 0 },
      thresholds: { cpu: 80, memory: 85, disk: 90 },
      dashboard: { layout: 'grid', widgets: 0 },
      notifications: { email: false, webhook: false },
      backup: { lastBackup: '없음', autoBackup: false },
      theme: 'dark',
    };
  }

  private getDefaultNotificationSettings() {
    // Vercel 환경에서는 콘솔 로깅만 지원
    if (process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL === '1') {
      return { email: false, webhook: false };
    }

    return { email: false, webhook: false };
  }
}
