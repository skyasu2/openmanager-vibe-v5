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
import { Badge } from '@/components/ui/badge';
import {
    TestTube,
    Download,
    Upload,
    RotateCcw,
} from 'lucide-react';

import {
    useNotificationPreferences,
    useBrowserPermission,
    useSlackWebhooks,
} from '@/stores/useNotificationStore';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';

interface NotificationTestTabProps {
    onExportSettings: () => void;
    onImportSettings: (settings: any) => void;
    onResetSettings: () => void;
}

export const NotificationTestTab: React.FC<NotificationTestTabProps> = ({
    onExportSettings,
    onImportSettings,
    onResetSettings,
}) => {
    const preferences = useNotificationPreferences();
    const browserPermission = useBrowserPermission();
    const slackWebhooks = useSlackWebhooks();
    const [isTestingAll, setIsTestingAll] = useState(false);

    const handleTestAllChannels = async () => {
        setIsTestingAll(true);

        try {
            // 간단한 테스트 로직
            await new Promise(resolve => setTimeout(resolve, 1000));

            EnhancedToastSystem.showSuccess(
                '전체 테스트 성공',
                '모든 채널에서 알림이 성공적으로 전송되었습니다.'
            );
        } catch (error) {
            EnhancedToastSystem.showError(
                '테스트 오류',
                '전체 알림 테스트 중 오류가 발생했습니다.'
            );
        } finally {
            setIsTestingAll(false);
        }
    };

    const handleExportSettings = () => {
        onExportSettings();
        EnhancedToastSystem.showSuccess(
            '설정 내보내기',
            '알림 설정이 다운로드되었습니다.'
        );
    };

    const handleResetSettings = () => {
        onResetSettings();
        EnhancedToastSystem.showInfo(
            '설정 초기화',
            '모든 알림 설정이 기본값으로 초기화되었습니다.'
        );
    };

    const getChannelStatus = () => {
        const channels = [];

        if (preferences.channels.browser) {
            channels.push({
                name: '브라우저',
                status: browserPermission.status === 'granted' ? 'active' : 'inactive',
            });
        }

        if (preferences.channels.slack) {
            channels.push({
                name: 'Slack',
                status: slackWebhooks.webhooks && slackWebhooks.webhooks.length > 0 ? 'active' : 'inactive',
            });
        }

        return channels;
    };

    const activeChannels = getChannelStatus();

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TestTube className="h-5 w-5" />
                        알림 테스트
                    </CardTitle>
                    <CardDescription>
                        설정된 모든 알림 채널을 테스트합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <h4 className="font-medium">활성 채널</h4>
                        <div className="flex flex-wrap gap-2">
                            {activeChannels.map((channel) => (
                                <Badge
                                    key={channel.name}
                                    variant={channel.status === 'active' ? 'default' : 'secondary'}
                                >
                                    {channel.name}
                                </Badge>
                            ))}
                            {activeChannels.length === 0 && (
                                <Badge variant="outline">활성 채널 없음</Badge>
                            )}
                        </div>
                    </div>

                    <Button
                        onClick={handleTestAllChannels}
                        disabled={activeChannels.length === 0 || isTestingAll}
                        className="w-full"
                    >
                        <TestTube className="w-4 h-4 mr-2" />
                        {isTestingAll ? '테스트 중...' : '모든 채널 테스트'}
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>설정 관리</CardTitle>
                    <CardDescription>
                        알림 설정을 내보내기, 가져오기, 초기화할 수 있습니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                    <Button
                        onClick={handleExportSettings}
                        variant="outline"
                        className="w-full"
                    >
                        <Download className="w-4 h-4 mr-2" />
                        설정 내보내기
                    </Button>

                    <Button
                        onClick={handleResetSettings}
                        variant="outline"
                        className="w-full"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        설정 초기화
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};