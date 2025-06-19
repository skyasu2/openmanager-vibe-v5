/**
 * 🎣 useSettingsData Hook
 *
 * 통합 설정 데이터 상태 관리 훅
 *
 * @created 2025-06-09
 * @author AI Assistant
 */

import { useState, useEffect, useCallback } from 'react';
import {
  SettingsData,
  GeneratorConfig,
  ApiResponse,
} from '../types/ProfileTypes';
import { SettingsService } from '../services/SettingsService';

interface UseSettingsDataReturn {
  // 설정 데이터 상태
  settingsData: SettingsData;
  isLoadingSettings: boolean;
  settingsError: string | null;

  // 제너레이터 상태
  generatorConfig: GeneratorConfig | null;
  isGeneratorLoading: boolean;
  generatorError: string | null;

  // 액션 함수들
  loadAllSettings: () => Promise<void>;
  loadGeneratorConfig: () => Promise<void>;
  updateServerCount: (count: number) => Promise<ApiResponse>;
  updateArchitecture: (arch: string) => Promise<ApiResponse>;
  checkSystemHealth: () => Promise<void>;
  refreshSettings: () => Promise<void>;
}

export function useSettingsData(): UseSettingsDataReturn {
  // 서비스 인스턴스
  const settingsService = SettingsService.getInstance();

  // 설정 데이터 상태
  const [settingsData, setSettingsData] = useState<SettingsData>({
    metrics: { interval: 5, realistic: false },
    scenarios: { active: 0, total: 0 },
    thresholds: { cpu: 80, memory: 85, disk: 90 },
    dashboard: { layout: 'grid', widgets: 0 },
    notifications: { email: false, webhook: false },
    backup: { lastBackup: '없음', autoBackup: false },
    theme: 'dark',
  });

  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [settingsError, setSettingsError] = useState<string | null>(null);

  // 제너레이터 상태
  const [generatorConfig, setGeneratorConfig] =
    useState<GeneratorConfig | null>(null);
  const [isGeneratorLoading, setIsGeneratorLoading] = useState(false);
  const [generatorError, setGeneratorError] = useState<string | null>(null);

  /**
   * 모든 설정 로드
   */
  const loadAllSettings = useCallback(async () => {
    setIsLoadingSettings(true);
    setSettingsError(null);

    try {
      const data = await settingsService.loadAllSettings();
      setSettingsData(data);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '설정 로드 실패';
      setSettingsError(errorMessage);
      console.error('설정 로드 오류:', error);
    } finally {
      setIsLoadingSettings(false);
    }
  }, [settingsService]);

  /**
   * 제너레이터 설정 로드
   */
  const loadGeneratorConfig = useCallback(async () => {
    setIsGeneratorLoading(true);
    setGeneratorError(null);

    try {
      const config = await settingsService.loadGeneratorConfig();
      setGeneratorConfig(config);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '제너레이터 설정 로드 실패';
      setGeneratorError(errorMessage);
      console.error('제너레이터 설정 로드 오류:', error);
    } finally {
      setIsGeneratorLoading(false);
    }
  }, [settingsService]);

  /**
   * 서버 개수 업데이트
   */
  const updateServerCount = useCallback(
    async (count: number): Promise<ApiResponse> => {
      setGeneratorError(null);

      try {
        const result = await settingsService.updateServerCount(count);

        if (result.success) {
          // 성공 시 제너레이터 설정 다시 로드
          await loadGeneratorConfig();
        } else {
          setGeneratorError(result.error || '서버 개수 변경 실패');
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '서버 개수 변경 중 오류';
        setGeneratorError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [settingsService, loadGeneratorConfig]
  );

  /**
   * 아키텍처 업데이트
   */
  const updateArchitecture = useCallback(
    async (arch: string): Promise<ApiResponse> => {
      setGeneratorError(null);

      try {
        const result = await settingsService.updateArchitecture(arch);

        if (result.success) {
          // 성공 시 제너레이터 설정 다시 로드
          await loadGeneratorConfig();
        } else {
          setGeneratorError(result.error || '아키텍처 변경 실패');
        }

        return result;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : '아키텍처 변경 중 오류';
        setGeneratorError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [settingsService, loadGeneratorConfig]
  );

  /**
   * 시스템 헬스체크
   */
  const checkSystemHealth = useCallback(async () => {
    try {
      const health = await settingsService.checkSystemHealth();
      console.log('시스템 상태:', health);
    } catch (error) {
      console.error('헬스체크 오류:', error);
    }
  }, [settingsService]);

  /**
   * 전체 설정 새로고침
   */
  const refreshSettings = useCallback(async () => {
    await Promise.all([loadAllSettings(), loadGeneratorConfig()]);
  }, [loadAllSettings, loadGeneratorConfig]);

  // 컴포넌트 마운트 시 초기 데이터 로드
  useEffect(() => {
    refreshSettings();
  }, [refreshSettings]);

  // 자동 새로고침 (5분마다)
  useEffect(() => {
    const interval = setInterval(
      () => {
        refreshSettings();
      },
      5 * 60 * 1000
    ); // 5분

    return () => clearInterval(interval);
  }, [refreshSettings]);

  return {
    // 설정 데이터 상태
    settingsData,
    isLoadingSettings,
    settingsError,

    // 제너레이터 상태
    generatorConfig,
    isGeneratorLoading,
    generatorError,

    // 액션 함수들
    loadAllSettings,
    loadGeneratorConfig,
    updateServerCount,
    updateArchitecture,
    checkSystemHealth,
    refreshSettings,
  };
}
