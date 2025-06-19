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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Upload,
  RotateCcw,
  TestTube,
  Settings,
  BarChart3,
  Bell,
  BellOff,
} from 'lucide-react';

import {
  useNotificationStore,
  useNotificationPreferences,
  useBrowserPermission,
} from '@/stores/useNotificationStore';
import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';
import { useToast } from '@/hooks/use-toast';

// 분리된 탭 컴포넌트들
import { BrowserNotificationTab } from './tabs/BrowserNotificationTab';
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

  const [isTestingBrowser, setIsTestingBrowser] = useState(false);

  // 컴포넌트 마운트 시 상태 확인
  useEffect(() => {
    // 브라우저 권한 상태 동기화
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
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
   * 🧪 Toast 알림 테스트
   */
  const handleTestToastNotification = (
    severity: 'info' | 'warning' | 'critical'
  ) => {
    const messages = {
      info: {
        title: '📘 정보 알림 테스트',
        message: '일반적인 정보 메시지입니다.',
      },
      warning: {
        title: '⚠️ 경고 알림 테스트',
        message: '주의가 필요한 상황입니다.',
      },
      critical: {
        title: '🚨 심각 알림 테스트',
        message: '즉시 조치가 필요합니다!',
      },
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
      const blob = new Blob([settings], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `openmanager-notification-settings-${
        new Date().toISOString().split('T')[0]
      }.json`;
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
        const settingsJson = e.target?.result as string;
        const success = importSettings(settingsJson);

        if (success) {
          toast({
            title: '✅ 설정 가져오기 완료',
            description: '알림 설정이 복원되었습니다.',
          });
        } else {
          toast({
            title: '❌ 가져오기 실패',
            description: '유효하지 않은 설정 파일입니다.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        toast({
          title: '❌ 가져오기 실패',
          description: '설정 파일을 읽는 중 오류가 발생했습니다.',
          variant: 'destructive',
        });
      }
    };
    reader.readAsText(file);

    // 파일 input 초기화
    event.target.value = '';
  };

  /**
   * 🔄 기본값으로 초기화
   */
  const handleResetToDefaults = () => {
    resetToDefaults();
    toast({
      title: '🔄 설정 초기화 완료',
      description: '모든 알림 설정이 기본값으로 복원되었습니다.',
    });
  };

  /**
   * 📊 통계 초기화
   */
  const handleResetStats = () => {
    resetStats();
    toast({
      title: '📊 통계 초기화 완료',
      description: '알림 통계가 초기화되었습니다.',
    });
  };

  return (
    <div className='space-y-6'>
      {/* 헤더 */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>알림 설정</h2>
          <p className='text-muted-foreground'>
            시스템 알림 및 채널별 설정을 관리합니다.
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <Badge variant='outline' className='flex items-center gap-1'>
            {preferences.channels.browser ? (
              <Bell className='h-3 w-3 text-green-500' />
            ) : (
              <BellOff className='h-3 w-3 text-red-500' />
            )}
            브라우저: {preferences.channels.browser ? '활성' : '비활성'}
          </Badge>
          <Badge variant='outline' className='flex items-center gap-1'>
            {preferences.channels.toast ? (
              <Bell className='h-3 w-3 text-green-500' />
            ) : (
              <BellOff className='h-3 w-3 text-red-500' />
            )}
            Toast: {preferences.channels.toast ? '활성' : '비활성'}
          </Badge>
        </div>
      </div>

      {/* 메인 설정 탭 */}
      <Tabs defaultValue='browser' className='space-y-4'>
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='browser' className='flex items-center gap-2'>
            <Bell className='h-4 w-4' />
            브라우저 알림
          </TabsTrigger>
          <TabsTrigger value='filters' className='flex items-center gap-2'>
            <Settings className='h-4 w-4' />
            필터 설정
          </TabsTrigger>
          <TabsTrigger value='test' className='flex items-center gap-2'>
            <TestTube className='h-4 w-4' />
            테스트
          </TabsTrigger>
        </TabsList>

        <TabsContent value='browser'>
          <BrowserNotificationTab
            onUpdateChannelSetting={updateChannelSetting}
            onSetBrowserPermission={setBrowserPermission}
            onMarkPermissionRequested={markPermissionRequested}
          />
        </TabsContent>

        <TabsContent value='filters'>
          <NotificationFiltersTab
            onUpdateSeverityFilter={(severity, enabled) => {
              updateSeverityFilter(
                'browser',
                enabled ? (severity as 'all' | 'warning' | 'critical') : 'all'
              );
            }}
            onUpdateCooldownSetting={(setting, value) => {
              updateCooldown({ enabled: true, duration: value });
            }}
            onUpdateQuietHours={(start, end) => {
              updateQuietHours({ enabled: true, start, end });
            }}
          />
        </TabsContent>

        <TabsContent value='test'>
          <NotificationTestTab
            onExportSettings={handleExportSettings}
            onImportSettings={handleImportSettings}
            onResetSettings={handleResetToDefaults}
          />
        </TabsContent>
      </Tabs>

      {/* 설정 관리 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <BarChart3 className='h-5 w-5' />
            설정 관리
          </CardTitle>
          <CardDescription>
            알림 설정을 백업하거나 복원할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-2'>
            <Button
              onClick={handleExportSettings}
              variant='outline'
              className='flex items-center gap-2'
            >
              <Download className='h-4 w-4' />
              설정 내보내기
            </Button>

            <Button
              onClick={() => document.getElementById('import-input')?.click()}
              variant='outline'
              className='flex items-center gap-2'
            >
              <Upload className='h-4 w-4' />
              설정 가져오기
            </Button>
            <input
              id='import-input'
              type='file'
              accept='.json'
              onChange={handleImportSettings}
              className='hidden'
              aria-label='설정 파일 선택'
            />

            <Button
              onClick={handleResetToDefaults}
              variant='outline'
              className='flex items-center gap-2'
            >
              <RotateCcw className='h-4 w-4' />
              기본값으로 초기화
            </Button>

            <Button
              onClick={handleResetStats}
              variant='outline'
              className='flex items-center gap-2'
            >
              <BarChart3 className='h-4 w-4' />
              통계 초기화
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
