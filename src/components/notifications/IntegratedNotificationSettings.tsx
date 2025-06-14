/**
 * 🔔 통합 알림 설정 UI v1.0
 *
 * 기존 AI 사이드바 "슬랙 알림" 메뉴 확장:
 * - 브라우저 알림 설정
 * - 슬랙 알림 설정
 * - Toast 알림 설정
 * - 조용한 시간 설정
 * - 실시간 테스트 기능
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import {
  useNotificationStore,
  useNotificationPreferences,
  useBrowserPermission,
  useSlackWebhooks,
} from '@/stores/useNotificationStore';
import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
import { slackNotificationService } from '@/services/SlackNotificationService';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';
import { useToast } from '@/hooks/use-toast';

// 분리된 탭 컴포넌트들
import { BrowserNotificationTab } from './tabs/BrowserNotificationTab';
import { SlackNotificationTab } from './tabs/SlackNotificationTab';
import { NotificationFiltersTab } from './tabs/NotificationFiltersTab';
import { NotificationTestTab } from './tabs/NotificationTestTab';

export const IntegratedNotificationSettings: React.FC = () => {
  const { toast } = useToast();
  const preferences = useNotificationPreferences();
  const browserPermission = useBrowserPermission();
  const {
    updateChannelSetting,
    updateSeverityFilter,
    updateQuietHours,
    updateCooldown,
    incrementChannelStat,
    resetStats,
    setBrowserPermission,
    markPermissionRequested,
    resetToDefaults,
    exportSettings,
    importSettings,
  } = useNotificationStore();

  // 슬랙 웹훅 관리
  const slackHooks = useSlackWebhooks();

  const [isTestingBrowser, setIsTestingBrowser] = useState(false);
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [slackStatus, setSlackStatus] = useState<any>(null);

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    // 브라우저 권한 상태 동기화
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }

    // 슬랙 상태 확인
    const checkSlackStatus = () => {
      const status = slackNotificationService.getStatus();
      setSlackStatus(status);
    };

    checkSlackStatus();
  }, [setBrowserPermission]);

  /**
   * 🧪 브라우저 알림 테스트
   */
  const handleTestBrowserNotification = async () => {
    setIsTestingBrowser(true);

    try {
      const success = await browserNotificationService.sendTestNotification();

      if (success) {
        EnhancedToastSystem.showSuccess(
          '테스트 성공',
          '브라우저 알림이 전송되었습니다.'
        );
      } else {
        EnhancedToastSystem.showError(
          '테스트 실패',
          '브라우저 알림 전송에 실패했습니다.'
        );
      }
    } catch (error) {
      EnhancedToastSystem.showError(
        '테스트 오류',
        '브라우저 알림 테스트 중 오류가 발생했습니다.'
      );
    } finally {
      setIsTestingBrowser(false);
    }
  };

  /**
   * 🧪 슬랙 알림 테스트
   */
  const handleTestSlackNotification = async () => {
    setIsTestingSlack(true);

    try {
      const success = await slackNotificationService.sendSystemNotification(
        '🧪 OpenManager 알림 테스트',
        'info'
      );

      if (success) {
        EnhancedToastSystem.showSuccess(
          '슬랙 테스트 성공',
          '슬랙 알림이 전송되었습니다.'
        );
      } else {
        EnhancedToastSystem.showError(
          '슬랙 테스트 실패',
          '슬랙 웹훅 설정을 확인하세요.'
        );
      }
    } catch (error) {
      EnhancedToastSystem.showError(
        '슬랙 테스트 오류',
        '슬랙 알림 테스트 중 오류가 발생했습니다.'
      );
    } finally {
      setIsTestingSlack(false);
    }
  };

  /**
   * 🧪 Toast 알림 테스트
   */
  const handleTestToastNotification = (
    severity: 'info' | 'warning' | 'critical'
  ) => {
    const messages = {
      info: { title: '📘 정보 알림 테스트', message: '일반적인 정보 메시지입니다.' },
      warning: { title: '⚠️ 경고 알림 테스트', message: '주의가 필요한 상황입니다.' },
      critical: { title: '🚨 심각 알림 테스트', message: '즉시 조치가 필요합니다!' },
    };

    const { title, message } = messages[severity];

    switch (severity) {
      case 'info':
        EnhancedToastSystem.showInfo(title, message);
        break;
      case 'warning':
        EnhancedToastSystem.showWarning(title, message);
        break;
      case 'critical':
        EnhancedToastSystem.showError(title, message);
        break;
    }
  };

  /**
   * 📤 설정 내보내기
   */
  const handleExportSettings = () => {
    try {
      const settings = exportSettings();
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openmanager-notification-settings-${new Date()
        .toISOString()
        .split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: '✅ 설정 내보내기 완료',
        description: '알림 설정이 파일로 저장되었습니다.',
      });
    } catch (error) {
      toast({
        title: '❌ 내보내기 실패',
        description: '설정 내보내기 중 오류가 발생했습니다.',
        variant: 'destructive',
      });
    }
  };

  /**
   * 📥 설정 가져오기
   */
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        importSettings(settings);

        toast({
          title: '✅ 설정 가져오기 완료',
          description: '알림 설정이 복원되었습니다.',
        });
      } catch (error) {
        toast({
          title: '❌ 가져오기 실패',
          description: '올바른 설정 파일을 선택해주세요.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    // 파일 입력 초기화
    event.target.value = '';
  };

  /**
   * 🔄 기본값으로 초기화
   */
  const handleResetToDefaults = () => {
    if (confirm('모든 설정을 기본값으로 초기화하시겠습니까?')) {
      resetToDefaults();
      toast({
        title: '✅ 초기화 완료',
        description: '모든 설정이 기본값으로 초기화되었습니다.',
      });
    }
  };

  /**
   * 📊 통계 초기화
   */
  const handleResetStats = () => {
    if (confirm('모든 통계를 초기화하시겠습니까?')) {
      resetStats();
      toast({
        title: '✅ 통계 초기화 완료',
        description: '모든 알림 통계가 초기화되었습니다.',
      });
    }
  };

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl font-bold text-gray-800'>
            🔔 통합 알림 설정
          </CardTitle>
          <CardDescription>
            브라우저, 슬랙, Toast 알림을 통합 관리하고 테스트할 수 있습니다.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue='channels' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='channels'>알림 채널</TabsTrigger>
          <TabsTrigger value='filters'>필터 설정</TabsTrigger>
          <TabsTrigger value='schedule'>시간 설정</TabsTrigger>
          <TabsTrigger value='test'>테스트</TabsTrigger>
        </TabsList>

        {/* 알림 채널 설정 */}
        <TabsContent value='channels' className='space-y-4'>
          <BrowserNotificationTab
            onUpdateChannelSetting={updateChannelSetting}
            onSetBrowserPermission={setBrowserPermission}
            onMarkPermissionRequested={markPermissionRequested}
          />

          <SlackNotificationTab
            onUpdateChannelSetting={updateChannelSetting}
            onUpdateSlackWebhook={(webhook) => {
              // Slack webhook 업데이트 로직 (필요시 구현)
              console.log('Slack webhook updated:', webhook);
            }}
          />
        </TabsContent>

        {/* 필터 설정 */}
        <TabsContent value='filters' className='space-y-4'>
          <NotificationFiltersTab
            onUpdateSeverityFilter={(severity, enabled) => {
              // 심각도 필터 업데이트 로직
              console.log('Severity filter updated:', severity, enabled);
            }}
            onUpdateCooldownSetting={(setting, value) => {
              // 쿨다운 설정 업데이트 로직
              console.log('Cooldown setting updated:', setting, value);
            }}
            onUpdateQuietHours={(start, end) => {
              // 조용한 시간 업데이트 로직
              console.log('Quiet hours updated:', start, end);
            }}
          />
        </TabsContent>

        {/* 시간 설정 */}
        <TabsContent value='schedule' className='space-y-4'>
          <NotificationFiltersTab
            onUpdateSeverityFilter={(severity, enabled) => {
              // 심각도 필터 업데이트 로직
              console.log('Severity filter updated:', severity, enabled);
            }}
            onUpdateCooldownSetting={(setting, value) => {
              // 쿨다운 설정 업데이트 로직
              console.log('Cooldown setting updated:', setting, value);
            }}
            onUpdateQuietHours={(start, end) => {
              // 조용한 시간 업데이트 로직
              console.log('Quiet hours updated:', start, end);
            }}
          />
        </TabsContent>

        {/* 테스트 */}
        <TabsContent value='test' className='space-y-4'>
          <NotificationTestTab
            onExportSettings={handleExportSettings}
            onImportSettings={(settings) => {
              // 설정 가져오기 로직
              console.log('Settings imported:', settings);
            }}
            onResetSettings={handleResetToDefaults}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};
