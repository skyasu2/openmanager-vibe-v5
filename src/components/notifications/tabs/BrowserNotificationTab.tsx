'use client';

import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
    Smartphone,
    TestTube,
    AlertTriangle,
} from 'lucide-react';

import {
    useNotificationPreferences,
    useBrowserPermission,
} from '@/stores/useNotificationStore';
import { browserNotificationService } from '@/services/notifications/BrowserNotificationService';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';

interface BrowserNotificationTabProps {
    onUpdateChannelSetting: (channel: string, value: boolean) => void;
    onSetBrowserPermission: (permission: NotificationPermission) => void;
    onMarkPermissionRequested: () => void;
}

export const BrowserNotificationTab: React.FC<BrowserNotificationTabProps> = ({
    onUpdateChannelSetting,
    onSetBrowserPermission,
    onMarkPermissionRequested,
}) => {
    const preferences = useNotificationPreferences();
    const browserPermission = useBrowserPermission();
    const [isTestingBrowser, setIsTestingBrowser] = useState(false);

    const handleRequestBrowserPermission = async () => {
        onMarkPermissionRequested();
        const granted = await browserNotificationService.requestPermission();
        onSetBrowserPermission(Notification.permission);

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

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Smartphone className="h-5 w-5" />
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
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="browser-enabled">브라우저 알림 사용</Label>
                        <Switch
                            id="browser-enabled"
                            checked={preferences.channels.browser}
                            onCheckedChange={(checked) =>
                                onUpdateChannelSetting('browser', checked)
                            }
                            disabled={browserPermission.status !== 'granted'}
                        />
                    </div>

                    {browserPermission.status !== 'granted' && (
                        <div className="flex items-center gap-2 p-3 bg-yellow-50 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-yellow-600" />
                            <span className="text-sm text-yellow-800">
                                브라우저 알림을 사용하려면 권한을 허용해야 합니다.
                            </span>
                            <Button size="sm" onClick={handleRequestBrowserPermission}>
                                권한 요청
                            </Button>
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleTestBrowserNotification}
                            disabled={
                                !preferences.channels.browser ||
                                browserPermission.status !== 'granted' ||
                                isTestingBrowser
                            }
                            className="w-full"
                        >
                            <TestTube className="w-4 h-4 mr-2" />
                            {isTestingBrowser ? '테스트 중...' : '브라우저 알림 테스트'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};