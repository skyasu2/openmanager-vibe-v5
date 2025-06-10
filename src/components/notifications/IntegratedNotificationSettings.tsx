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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  BellOff,
  Smartphone,
  MessageSquare,
  Monitor,
  Moon,
  Clock,
  TestTube,
  Settings,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Plus,
  Trash2,
} from 'lucide-react';

import {
  useNotificationStore,
  useNotificationPreferences,
  useBrowserPermission,
  useSlackWebhooks,
  validateSlackWebhookUrl,
} from '@/stores/useNotificationStore';
import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
import { slackNotificationService } from '@/services/SlackNotificationService';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';
import { useToast } from '@/hooks/use-toast';

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
  const [activeTab, setActiveTab] = useState<
    'channels' | 'filters' | 'schedule' | 'slack' | 'test'
  >('channels');

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
   * 🔐 브라우저 알림 권한 요청
   */
  const handleRequestBrowserPermission = async () => {
    markPermissionRequested();
    const granted = await browserNotificationService.requestPermission();
    setBrowserPermission(Notification.permission);

    if (granted) {
      EnhancedToastSystem.showSuccess(
        '브라우저 알림 활성화',
        '브라우저 알림 권한이 허용되었습니다.'
      );
    } else {
      EnhancedToastSystem.showError(
        '브라우저 알림 실패',
        '브라우저 알림 권한이 거부되었습니다.'
      );
    }
  };

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
      info: { title: '정보 알림 테스트', desc: '일반적인 정보 알림입니다.' },
      warning: { title: '경고 알림 테스트', desc: '주의가 필요한 상황입니다.' },
      critical: { title: '심각 알림 테스트', desc: '즉시 조치가 필요합니다!' },
    };

    const { title, desc } = messages[severity];

    switch (severity) {
      case 'info':
        EnhancedToastSystem.showInfo(title, desc);
        break;
      case 'warning':
        EnhancedToastSystem.showWarning(title, desc);
        break;
      case 'critical':
        EnhancedToastSystem.showError(title, desc);
        break;
    }
  };

  /**
   * 📁 설정 내보내기
   */
  const handleExportSettings = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openmanager-notification-settings-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    EnhancedToastSystem.showSuccess(
      '설정 내보내기 완료',
      '알림 설정이 파일로 저장되었습니다.'
    );
  };

  /**
   * 📁 설정 가져오기
   */
  const handleImportSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;
      const success = importSettings(content);

      if (success) {
        EnhancedToastSystem.showSuccess(
          '설정 가져오기 완료',
          '알림 설정이 성공적으로 적용되었습니다.'
        );
      } else {
        EnhancedToastSystem.showError(
          '설정 가져오기 실패',
          '유효하지 않은 설정 파일입니다.'
        );
      }
    };
    reader.readAsText(file);

    // 파일 입력 초기화
    event.target.value = '';
  };

  // 슬랙 웹훅 관리
  const [newWebhookForm, setNewWebhookForm] = useState({
    name: '',
    url: '',
    channel: '',
    description: '',
  });
  const [showAddWebhook, setShowAddWebhook] = useState(false);

  // 웹훅 추가 핸들러
  const handleAddWebhook = () => {
    if (
      !newWebhookForm.name ||
      !newWebhookForm.url ||
      !newWebhookForm.channel
    ) {
      toast({
        title: '❌ 필수 정보 누락',
        description: '웹훅 이름, URL, 채널을 모두 입력해주세요.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateSlackWebhookUrl(newWebhookForm.url)) {
      toast({
        title: '❌ 잘못된 URL',
        description: '올바른 슬랙 웹훅 URL 형식이 아닙니다.',
        variant: 'destructive',
      });
      return;
    }

    slackHooks.addWebhook({
      name: newWebhookForm.name,
      url: newWebhookForm.url,
      channel: newWebhookForm.channel,
      description: newWebhookForm.description,
      isActive: true,
    });

    setNewWebhookForm({ name: '', url: '', channel: '', description: '' });
    setShowAddWebhook(false);

    toast({
      title: '✅ 웹훅 추가 완료',
      description: `${newWebhookForm.name} 웹훅이 추가되었습니다.`,
    });
  };

  return (
    <div className='w-full max-w-4xl mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-2xl font-bold flex items-center gap-2'>
            <Bell className='h-6 w-6' />
            통합 알림 설정
          </h1>
          <p className='text-muted-foreground mt-1'>
            브라우저, 슬랙, Toast 알림을 통합 관리합니다
          </p>
        </div>

        <div className='flex items-center gap-2'>
          <Button variant='outline' size='sm' onClick={handleExportSettings}>
            <Download className='h-4 w-4 mr-2' />
            내보내기
          </Button>
          <Button variant='outline' size='sm' asChild>
            <label htmlFor='import-settings' className='cursor-pointer'>
              <Upload className='h-4 w-4 mr-2' />
              가져오기
              <input
                aria-label='입력'
                id='import-settings'
                type='file'
                accept='.json'
                className='hidden'
                onChange={handleImportSettings}
              />
            </label>
          </Button>
          <Button variant='outline' size='sm' onClick={resetToDefaults}>
            <RotateCcw className='h-4 w-4 mr-2' />
            초기화
          </Button>
        </div>
      </div>

      <div className='flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6'>
        <button
          onClick={() => setActiveTab('channels')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'channels'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          📢 채널 설정
        </button>
        <button
          onClick={() => setActiveTab('filters')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'filters'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🔍 필터링
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'schedule'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          ⏰ 스케줄
        </button>
        <button
          onClick={() => setActiveTab('slack')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'slack'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          💬 슬랙 설정
        </button>
        <button
          onClick={() => setActiveTab('test')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'test'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          🧪 테스트
        </button>
      </div>

      <Tabs defaultValue='channels' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='channels'>알림 채널</TabsTrigger>
          <TabsTrigger value='filters'>필터 설정</TabsTrigger>
          <TabsTrigger value='schedule'>시간 설정</TabsTrigger>
          <TabsTrigger value='test'>테스트</TabsTrigger>
        </TabsList>

        {/* 알림 채널 설정 */}
        <TabsContent value='channels' className='space-y-4'>
          {/* 브라우저 알림 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Smartphone className='h-5 w-5' />
                브라우저 알림
                <Badge
                  variant={
                    browserPermission.status === 'granted'
                      ? 'default'
                      : 'secondary'
                  }
                >
                  {browserPermission.status === 'granted'
                    ? '활성화'
                    : '비활성화'}
                </Badge>
              </CardTitle>
              <CardDescription>
                데스크톱 브라우저에서 시스템 알림을 표시합니다
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='browser-enabled'>브라우저 알림 사용</Label>
                <Switch
                  id='browser-enabled'
                  checked={preferences.channels.browser}
                  onCheckedChange={checked =>
                    updateChannelSetting('browser', checked)
                  }
                  disabled={browserPermission.status !== 'granted'}
                />
              </div>

              {browserPermission.status !== 'granted' && (
                <div className='flex items-center gap-2 p-3 bg-yellow-50 rounded-lg'>
                  <AlertTriangle className='h-4 w-4 text-yellow-600' />
                  <span className='text-sm text-yellow-800'>
                    브라우저 알림을 사용하려면 권한을 허용해야 합니다.
                  </span>
                  <Button size='sm' onClick={handleRequestBrowserPermission}>
                    권한 요청
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 슬랙 알림 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MessageSquare className='h-5 w-5' />
                슬랙 알림
                <Badge variant={slackStatus?.enabled ? 'default' : 'secondary'}>
                  {slackStatus?.enabled ? '활성화' : '비활성화'}
                </Badge>
              </CardTitle>
              <CardDescription>
                슬랙 채널로 서버 알림을 전송합니다
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='slack-enabled'>슬랙 알림 사용</Label>
                <Switch
                  id='slack-enabled'
                  checked={preferences.channels.slack}
                  onCheckedChange={checked =>
                    updateChannelSetting('slack', checked)
                  }
                  disabled={!slackStatus?.enabled}
                />
              </div>

              {slackStatus && (
                <div className='grid grid-cols-2 gap-4 text-sm'>
                  <div>
                    <span className='font-medium'>채널:</span>
                    <code className='ml-2 px-2 py-1 bg-gray-100 rounded'>
                      {slackStatus.channel}
                    </code>
                  </div>
                  <div>
                    <span className='font-medium'>전송된 알림:</span>
                    <span className='ml-2'>{slackStatus.alertsSent}개</span>
                  </div>
                </div>
              )}

              {!slackStatus?.enabled && (
                <div className='flex items-center gap-2 p-3 bg-blue-50 rounded-lg'>
                  <Info className='h-4 w-4 text-blue-600' />
                  <span className='text-sm text-blue-800'>
                    슬랙 웹훅 URL을 환경변수에 설정해야 합니다.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Toast 알림 */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Monitor className='h-5 w-5' />
                Toast 알림
                <Badge variant='default'>항상 활성화</Badge>
              </CardTitle>
              <CardDescription>
                페이지 내에서 즉시 표시되는 알림입니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <Label htmlFor='toast-enabled'>Toast 알림 사용</Label>
                <Switch
                  id='toast-enabled'
                  checked={preferences.channels.toast}
                  onCheckedChange={checked =>
                    updateChannelSetting('toast', checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 필터 설정 */}
        <TabsContent value='filters' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>심각도 필터</CardTitle>
              <CardDescription>
                각 채널별로 표시할 알림의 심각도를 설정합니다
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label>브라우저 알림</Label>
                  <Select
                    value={preferences.severityFilter.browser}
                    onValueChange={(value: 'all' | 'warning' | 'critical') =>
                      updateSeverityFilter('browser', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>모든 알림</SelectItem>
                      <SelectItem value='warning'>경고 이상</SelectItem>
                      <SelectItem value='critical'>심각 알림만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>슬랙 알림</Label>
                  <Select
                    value={preferences.severityFilter.slack}
                    onValueChange={(value: 'all' | 'warning' | 'critical') =>
                      updateSeverityFilter('slack', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>모든 알림</SelectItem>
                      <SelectItem value='warning'>경고 이상</SelectItem>
                      <SelectItem value='critical'>심각 알림만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Toast 알림</Label>
                  <Select
                    value={preferences.severityFilter.toast}
                    onValueChange={(value: 'all' | 'warning' | 'critical') =>
                      updateSeverityFilter('toast', value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='all'>모든 알림</SelectItem>
                      <SelectItem value='warning'>경고 이상</SelectItem>
                      <SelectItem value='critical'>심각 알림만</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>쿨다운 설정</CardTitle>
              <CardDescription>
                같은 알림의 반복 전송을 방지합니다
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='cooldown-enabled'>쿨다운 사용</Label>
                <Switch
                  id='cooldown-enabled'
                  checked={preferences.cooldown.enabled}
                  onCheckedChange={checked =>
                    updateCooldown({ enabled: checked })
                  }
                />
              </div>

              {preferences.cooldown.enabled && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='cooldown-duration'>쿨다운 시간 (분)</Label>
                    <Input
                      id='cooldown-duration'
                      type='number'
                      min='1'
                      max='60'
                      value={preferences.cooldown.duration}
                      onChange={e =>
                        updateCooldown({
                          duration: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>

                  <div className='flex items-center space-x-2 pt-6'>
                    <Switch
                      id='per-alert-cooldown'
                      checked={preferences.cooldown.perAlert}
                      onCheckedChange={checked =>
                        updateCooldown({ perAlert: checked })
                      }
                    />
                    <Label htmlFor='per-alert-cooldown'>
                      알림별 개별 쿨다운
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 시간 설정 */}
        <TabsContent value='schedule' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Moon className='h-5 w-5' />
                조용한 시간
              </CardTitle>
              <CardDescription>
                지정된 시간에는 심각한 알림만 전송됩니다
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <Label htmlFor='quiet-hours-enabled'>조용한 시간 사용</Label>
                <Switch
                  id='quiet-hours-enabled'
                  checked={preferences.quietHours.enabled}
                  onCheckedChange={checked =>
                    updateQuietHours({ enabled: checked })
                  }
                />
              </div>

              {preferences.quietHours.enabled && (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='quiet-start'>시작 시간</Label>
                    <Input
                      id='quiet-start'
                      type='time'
                      value={preferences.quietHours.start}
                      onChange={e =>
                        updateQuietHours({ start: e.target.value })
                      }
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='quiet-end'>종료 시간</Label>
                    <Input
                      id='quiet-end'
                      type='time'
                      value={preferences.quietHours.end}
                      onChange={e => updateQuietHours({ end: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className='p-3 bg-blue-50 rounded-lg'>
                <p className='text-sm text-blue-800'>
                  <Clock className='h-4 w-4 inline mr-1' />
                  현재 시간: {new Date().toLocaleTimeString('ko-KR')}
                  {preferences.quietHours.enabled && (
                    <span className='ml-2'>
                      (조용한 시간: {preferences.quietHours.start} ~{' '}
                      {preferences.quietHours.end})
                    </span>
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 테스트 */}
        <TabsContent value='test' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <TestTube className='h-5 w-5' />
                알림 테스트
              </CardTitle>
              <CardDescription>
                각 알림 채널의 동작을 테스트해보세요
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* 브라우저 알림 테스트 */}
              <div className='space-y-2'>
                <Label>브라우저 알림 테스트</Label>
                <Button
                  onClick={handleTestBrowserNotification}
                  disabled={
                    isTestingBrowser || browserPermission.status !== 'granted'
                  }
                  className='w-full'
                >
                  {isTestingBrowser ? '테스트 중...' : '브라우저 알림 테스트'}
                </Button>
              </div>

              <Separator />

              {/* 슬랙 알림 테스트 */}
              <div className='space-y-2'>
                <Label>슬랙 알림 테스트</Label>
                <Button
                  onClick={handleTestSlackNotification}
                  disabled={isTestingSlack || !slackStatus?.enabled}
                  className='w-full'
                  variant='outline'
                >
                  {isTestingSlack ? '테스트 중...' : '슬랙 알림 테스트'}
                </Button>
              </div>

              <Separator />

              {/* Toast 알림 테스트 */}
              <div className='space-y-2'>
                <Label>Toast 알림 테스트</Label>
                <div className='grid grid-cols-3 gap-2'>
                  <Button
                    onClick={() => handleTestToastNotification('info')}
                    variant='outline'
                    size='sm'
                  >
                    <Info className='h-4 w-4 mr-1' />
                    정보
                  </Button>
                  <Button
                    onClick={() => handleTestToastNotification('warning')}
                    variant='outline'
                    size='sm'
                  >
                    <AlertTriangle className='h-4 w-4 mr-1' />
                    경고
                  </Button>
                  <Button
                    onClick={() => handleTestToastNotification('critical')}
                    variant='outline'
                    size='sm'
                  >
                    <XCircle className='h-4 w-4 mr-1' />
                    심각
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 슬랙 설정 탭 */}
        {activeTab === 'slack' && (
          <div className='space-y-6'>
            <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
              <h3 className='text-lg font-semibold text-blue-800 mb-2'>
                💬 슬랙 웹훅 관리
              </h3>
              <p className='text-blue-600 text-sm'>
                슬랙 웹훅 URL을 추가하고 관리하세요. 여러 채널에 알림을 보낼 수
                있습니다.
              </p>
            </div>

            {/* 기존 웹훅 목록 */}
            <div className='space-y-4'>
              <div className='flex items-center justify-between'>
                <h4 className='text-md font-medium text-gray-800'>
                  등록된 웹훅
                </h4>
                <Button
                  onClick={() => setShowAddWebhook(true)}
                  className='bg-blue-600 hover:bg-blue-700 text-white'
                  size='sm'
                >
                  <Plus className='w-4 h-4 mr-2' />
                  웹훅 추가
                </Button>
              </div>

              {slackHooks.webhooks.map(webhook => (
                <div
                  key={webhook.id}
                  className={`border rounded-lg p-4 transition-all ${
                    webhook.id === slackHooks.activeWebhookId
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex-1'>
                      <div className='flex items-center space-x-3'>
                        <h5 className='font-medium text-gray-800'>
                          {webhook.name}
                        </h5>
                        <span className='text-sm text-gray-500'>
                          {webhook.channel}
                        </span>
                        {webhook.id === slackHooks.activeWebhookId && (
                          <span className='bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded'>
                            활성
                          </span>
                        )}
                        {webhook.isActive && (
                          <span className='bg-green-100 text-green-800 text-xs px-2 py-1 rounded'>
                            사용 가능
                          </span>
                        )}
                      </div>

                      {webhook.description && (
                        <p className='text-sm text-gray-600 mt-1'>
                          {webhook.description}
                        </p>
                      )}

                      <div className='text-xs text-gray-500 mt-2 space-y-1'>
                        <div>URL: {webhook.url.substring(0, 50)}...</div>
                        <div className='flex space-x-4'>
                          <span>전송 횟수: {webhook.totalSent}</span>
                          {webhook.lastUsed && (
                            <span>
                              마지막 사용:{' '}
                              {new Date(webhook.lastUsed).toLocaleDateString(
                                'ko-KR'
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className='flex items-center space-x-2'>
                      {webhook.id !== slackHooks.activeWebhookId && (
                        <Button
                          onClick={() =>
                            slackHooks.setActiveWebhook(webhook.id)
                          }
                          variant='outline'
                          size='sm'
                        >
                          활성화
                        </Button>
                      )}

                      <Button
                        onClick={() => {
                          if (confirm('정말로 이 웹훅을 삭제하시겠습니까?')) {
                            slackHooks.deleteWebhook(webhook.id);
                            toast({
                              title: '✅ 웹훅 삭제',
                              description: `${webhook.name} 웹훅이 삭제되었습니다.`,
                            });
                          }
                        }}
                        variant='outline'
                        size='sm'
                        className='text-red-600 hover:text-red-800'
                      >
                        <Trash2 className='w-4 h-4' />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {slackHooks.webhooks.length === 0 && (
                <div className='text-center py-8 text-gray-500'>
                  <MessageSquare className='w-12 h-12 mx-auto mb-4 text-gray-300' />
                  <p>등록된 슬랙 웹훅이 없습니다.</p>
                  <p className='text-sm'>
                    웹훅을 추가하여 슬랙 알림을 받아보세요.
                  </p>
                </div>
              )}
            </div>

            {/* 웹훅 추가 폼 */}
            {showAddWebhook && (
              <div className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                <h5 className='font-medium text-gray-800 mb-4'>새 웹훅 추가</h5>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      웹훅 이름 *
                    </label>
                    <input
                      aria-label='입력'
                      type='text'
                      value={newWebhookForm.name}
                      onChange={e =>
                        setNewWebhookForm(prev => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      placeholder='예: 서버 알림'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      채널명 *
                    </label>
                    <input
                      aria-label='입력'
                      type='text'
                      value={newWebhookForm.channel}
                      onChange={e =>
                        setNewWebhookForm(prev => ({
                          ...prev,
                          channel: e.target.value,
                        }))
                      }
                      placeholder='예: #server-alerts'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      웹훅 URL *
                    </label>
                    <input
                      aria-label='입력'
                      type='url'
                      value={newWebhookForm.url}
                      onChange={e =>
                        setNewWebhookForm(prev => ({
                          ...prev,
                          url: e.target.value,
                        }))
                      }
                      placeholder='https://hooks.slack.com/services/...'
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>

                  <div className='md:col-span-2'>
                    <label className='block text-sm font-medium text-gray-700 mb-2'>
                      설명
                    </label>
                    <textarea
                      value={newWebhookForm.description}
                      onChange={e =>
                        setNewWebhookForm(prev => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      placeholder='웹훅에 대한 설명을 입력하세요'
                      rows={2}
                      className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                    />
                  </div>
                </div>

                <div className='flex justify-end space-x-3 mt-4'>
                  <Button
                    onClick={() => {
                      setShowAddWebhook(false);
                      setNewWebhookForm({
                        name: '',
                        url: '',
                        channel: '',
                        description: '',
                      });
                    }}
                    variant='outline'
                  >
                    취소
                  </Button>
                  <Button
                    onClick={handleAddWebhook}
                    className='bg-blue-600 hover:bg-blue-700 text-white'
                  >
                    추가
                  </Button>
                </div>
              </div>
            )}

            {/* 웹훅 설정 가이드 */}
            <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
              <h5 className='font-medium text-yellow-800 mb-2'>
                📋 웹훅 설정 가이드
              </h5>
              <div className='text-sm text-yellow-700 space-y-2'>
                <p>
                  1. 슬랙 워크스페이스에서 Incoming Webhooks 앱을 설치하세요.
                </p>
                <p>2. 원하는 채널을 선택하고 웹훅 URL을 복사하세요.</p>
                <p>3. 위 폼에 웹훅 정보를 입력하고 추가 버튼을 클릭하세요.</p>
                <p>
                  4. 여러 웹훅을 등록하고 상황에 따라 활성 웹훅을 변경할 수
                  있습니다.
                </p>
              </div>
            </div>
          </div>
        )}
      </Tabs>
    </div>
  );
};
