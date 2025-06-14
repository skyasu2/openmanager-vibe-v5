'use client';

import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
// import { Slider } from '@/components/ui/slider'; // Slider 컴포넌트 없음
import {
    Filter,
    Clock,
    Volume2,
} from 'lucide-react';

import {
    useNotificationPreferences,
} from '@/stores/useNotificationStore';

interface NotificationFiltersTabProps {
    onUpdateSeverityFilter: (severity: string, enabled: boolean) => void;
    onUpdateCooldownSetting: (setting: string, value: number) => void;
    onUpdateQuietHours: (start: string, end: string) => void;
}

export const NotificationFiltersTab: React.FC<NotificationFiltersTabProps> = ({
    onUpdateSeverityFilter,
    onUpdateCooldownSetting,
    onUpdateQuietHours,
}) => {
    const preferences = useNotificationPreferences();

    // 기본값 설정
    const cooldownSettings = {
        critical: 5,
        warning: 15,
    };

    const quietHours = {
        start: '22:00',
        end: '08:00',
    };

    const severityFilters = {
        critical: true,
        warning: true,
        info: false,
    };

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        심각도 필터
                    </CardTitle>
                    <CardDescription>
                        알림을 받을 심각도 수준을 선택하세요
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(severityFilters).map(([severity, enabled]) => (
                        <div key={severity} className="flex items-center justify-between">
                            <Label htmlFor={`severity-${severity}`} className="capitalize">
                                {severity === 'critical' && '🔴 Critical'}
                                {severity === 'warning' && '🟡 Warning'}
                                {severity === 'info' && '🔵 Info'}
                            </Label>
                            <Switch
                                id={`severity-${severity}`}
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                    onUpdateSeverityFilter(severity, checked)
                                }
                            />
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        쿨다운 설정
                    </CardTitle>
                    <CardDescription>
                        동일한 알림의 반복 전송을 제한합니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Critical 알림 쿨다운 (분)</Label>
                        <Input
                            type="number"
                            value={cooldownSettings.critical}
                            onChange={(e) =>
                                onUpdateCooldownSetting('critical', parseInt(e.target.value) || 5)
                            }
                            min={1}
                            max={60}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500">
                            현재: {cooldownSettings.critical}분
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Warning 알림 쿨다운 (분)</Label>
                        <Input
                            type="number"
                            value={cooldownSettings.warning}
                            onChange={(e) =>
                                onUpdateCooldownSetting('warning', parseInt(e.target.value) || 15)
                            }
                            min={5}
                            max={120}
                            className="w-full"
                        />
                        <div className="text-sm text-gray-500">
                            현재: {cooldownSettings.warning}분
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Volume2 className="h-5 w-5" />
                        조용한 시간
                    </CardTitle>
                    <CardDescription>
                        지정된 시간에는 알림을 받지 않습니다
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="quiet-start">시작 시간</Label>
                            <Input
                                id="quiet-start"
                                type="time"
                                value={quietHours.start}
                                onChange={(e) =>
                                    onUpdateQuietHours(e.target.value, quietHours.end)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="quiet-end">종료 시간</Label>
                            <Input
                                id="quiet-end"
                                type="time"
                                value={quietHours.end}
                                onChange={(e) =>
                                    onUpdateQuietHours(quietHours.start, e.target.value)
                                }
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};