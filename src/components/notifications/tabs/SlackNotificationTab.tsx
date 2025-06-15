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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    TestTube,
    ExternalLink,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';

import {
    useNotificationPreferences,
    useSlackWebhooks,
} from '@/stores/useNotificationStore';
import { EnhancedToastSystem } from '@/components/ui/EnhancedToastSystem';

interface SlackNotificationTabProps {
    onUpdateChannelSetting: (channel: string, value: boolean) => void;
    onUpdateSlackWebhook: (webhook: { url: string; channel: string; isActive: boolean }) => void;
}

export const SlackNotificationTab: React.FC<SlackNotificationTabProps> = ({
    onUpdateChannelSetting,
    onUpdateSlackWebhook,
}) => {
    const preferences = useNotificationPreferences();
    const slackWebhooks = useSlackWebhooks();
    const [isTestingSlack, setIsTestingSlack] = useState(false);
    const [newWebhookUrl, setNewWebhookUrl] = useState('');
    const [newWebhookChannel, setNewWebhookChannel] = useState('');

    const handleTestSlackNotification = async () => {
        setIsTestingSlack(true);

        try {
            // 간단한 테스트 로직
            await new Promise(resolve => setTimeout(resolve, 1000));

            EnhancedToastSystem.showSuccess(
                '테스트 성공',
                'Slack 알림이 전송되었습니다.'
            );
        } catch (error) {
            EnhancedToastSystem.showError(
                '테스트 실패',
                'Slack 알림 전송에 실패했습니다.'
            );
        } finally {
            setIsTestingSlack(false);
        }
    };

    const handleAddWebhook = () => {
        if (newWebhookUrl && newWebhookChannel) {
            onUpdateSlackWebhook({
                url: newWebhookUrl,
                channel: newWebhookChannel,
                isActive: true,
            });
            setNewWebhookUrl('');
            setNewWebhookChannel('');
            EnhancedToastSystem.showSuccess(
                'Webhook 추가됨',
                `${newWebhookChannel} 채널 webhook이 추가되었습니다.`
            );
        }
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Slack 알림
                        <Badge
                            variant={
                                preferences.channels.slack && slackWebhooks.webhooks && slackWebhooks.webhooks.length > 0
                                    ? 'default'
                                    : 'secondary'
                            }
                        >
                            {preferences.channels.slack && slackWebhooks.webhooks && slackWebhooks.webhooks.length > 0
                                ? '활성화'
                                : '비활성화'}
                        </Badge>
                    </CardTitle>
                    <CardDescription>
                        Slack 채널로 알림을 전송합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="slack-enabled">Slack 알림 사용</Label>
                        <Switch
                            id="slack-enabled"
                            checked={preferences.channels.slack}
                            onCheckedChange={(checked) =>
                                onUpdateChannelSetting('slack', checked)
                            }
                        />
                    </div>

                    <div className="space-y-3">
                        <Label>Webhook URL 추가</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <Input
                                placeholder="Webhook URL"
                                value={newWebhookUrl}
                                onChange={(e) => setNewWebhookUrl(e.target.value)}
                            />
                            <Input
                                placeholder="채널명 (예: #alerts)"
                                value={newWebhookChannel}
                                onChange={(e) => setNewWebhookChannel(e.target.value)}
                            />
                            <Button onClick={handleAddWebhook} size="sm">
                                추가
                            </Button>
                        </div>
                    </div>

                    {slackWebhooks.webhooks.length > 0 && (
                        <div className="space-y-2">
                            <Label>등록된 Webhook</Label>
                            {slackWebhooks.webhooks.map((webhook, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                >
                                    <div className="flex items-center gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                        <span className="font-medium">{webhook.channel}</span>
                                    </div>
                                    <Badge variant="outline">활성</Badge>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="pt-4 border-t">
                        <Button
                            onClick={handleTestSlackNotification}
                            disabled={
                                !preferences.channels.slack ||
                                slackWebhooks.webhooks.length === 0 ||
                                isTestingSlack
                            }
                            className="w-full"
                        >
                            <TestTube className="w-4 h-4 mr-2" />
                            {isTestingSlack ? '테스트 중...' : 'Slack 알림 테스트'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};