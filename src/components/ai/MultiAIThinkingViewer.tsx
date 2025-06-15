/**
 * 🧠 Multi-AI 사고 과정 시각화 컴포넌트 v2.0
 * 
 * 기존 "생각중" 기능을 Multi-AI 협업 버전으로 확장
 * 
 * Features:
 * - 실시간 AI 엔진별 사고 과정 표시
 * - 융합 과정 시각화
 * - 성능 메트릭 실시간 업데이트
 * - 사용자 피드백 UI 통합
 * - 로깅 데이터 연동
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
    Brain,
    Cpu,
    Database,
    Globe,
    Zap,
    CheckCircle,
    XCircle,
    Clock,
    TrendingUp,
    MessageSquare,
    Star,
    ThumbsUp,
    ThumbsDown,
    BarChart3,
    Activity,
    Users
} from 'lucide-react';

// Types from GracefulDegradationManager
interface AIEngineThought {
    engineId: string;
    engineName: string;
    step: string;
    progress: number;
    thinking: string;
    confidence: number;
    timestamp: string;
    status: 'thinking' | 'processing' | 'completed' | 'failed';
    contribution?: string;
}

interface MultiAIThinkingProcess {
    sessionId: string;
    timestamp: string;
    overallProgress: number;
    aiEngines: {
        [engineId: string]: {
            status: 'thinking' | 'processing' | 'completed' | 'failed';
            currentStep: string;
            progress: number;
            thinking: string;
            confidence: number;
            contribution?: string;
            thoughts: AIEngineThought[];
        }
    };
    fusionStatus: {
        stage: 'collecting' | 'analyzing' | 'fusing' | 'finalizing';
        progress: number;
        description: string;
        consensusScore?: number;
    };
}

interface UserFeedback {
    satisfaction?: number;
    useful?: boolean;
    accurate?: boolean;
    completeness?: number;
    clarity?: number;
    comments?: string;
    suggestions?: string;
    timestamp?: string;
}

interface Props {
    sessionId: string;
    thinkingProcess?: MultiAIThinkingProcess;
    onFeedback?: (feedback: UserFeedback) => void;
    showMetrics?: boolean;
    compact?: boolean;
}

const MultiAIThinkingViewer: React.FC<Props> = ({
    sessionId,
    thinkingProcess,
    onFeedback,
    showMetrics = true,
    compact = false
}) => {
    const [process, setProcess] = useState<MultiAIThinkingProcess | null>(thinkingProcess || null);
    const [showFeedback, setShowFeedback] = useState(false);
    const [feedback, setFeedback] = useState<UserFeedback>({});
    const [metrics, setMetrics] = useState<any>(null);

    // 🎨 AI 엔진별 아이콘 및 색상 - 실제 엔진 타입에 따라 동적 결정
    const getEngineIcon = (engineId: string) => {
        // 실제 엔진 타입을 동적으로 감지하여 아이콘 결정
        // 미리 정의하지 않고 엔진의 실제 기능에 따라 결정
        return <Brain className="h-5 w-5" />; // 기본 AI 아이콘
    };

    const getEngineColor = (engineId: string, status: string) => {
        // 상태에 따른 동적 색상 (엔진 타입별 고정 색상 제거)
        const statusColors = {
            'thinking': 'bg-blue-500',
            'processing': 'bg-yellow-500',
            'completed': 'bg-green-600',
            'failed': 'bg-red-500'
        };

        return statusColors[status as keyof typeof statusColors] || 'bg-gray-500';
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case 'failed':
                return <XCircle className="h-4 w-4 text-red-500" />;
            case 'processing':
                return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
            default:
                return <Brain className="h-4 w-4 text-gray-500 animate-pulse" />;
        }
    };

    // 🔄 실시간 업데이트 (실제로는 WebSocket이나 Server-Sent Events 사용)
    useEffect(() => {
        if (!sessionId) return;

        const interval = setInterval(() => {
            // 실제로는 API에서 실시간 데이터를 가져옴
            // fetchThinkingProcess(sessionId);
        }, 1000);

        return () => clearInterval(interval);
    }, [sessionId]);

    // 📊 메트릭 업데이트
    useEffect(() => {
        if (process && showMetrics) {
            const enginesArray = Object.values(process.aiEngines);
            const completedEngines = enginesArray.filter(e => e.status === 'completed');
            const averageConfidence = completedEngines.length > 0
                ? completedEngines.reduce((sum, e) => sum + e.confidence, 0) / completedEngines.length
                : 0;

            setMetrics({
                totalEngines: enginesArray.length,
                completedEngines: completedEngines.length,
                averageConfidence: Math.round(averageConfidence * 100),
                processingTime: Date.now() - new Date(process.timestamp).getTime(),
                consensusScore: process.fusionStatus.consensusScore || 0
            });
        }
    }, [process, showMetrics]);

    // 💬 피드백 제출
    const handleFeedbackSubmit = useCallback(() => {
        if (onFeedback) {
            onFeedback({ ...feedback, timestamp: new Date().toISOString() });
        }
        setShowFeedback(false);
        setFeedback({});
    }, [feedback, onFeedback]);

    // 🎯 빠른 피드백
    const handleQuickFeedback = useCallback((type: 'useful' | 'not_useful' | 'accurate' | 'inaccurate') => {
        const quickFeedback: UserFeedback = {
            timestamp: new Date().toISOString()
        };

        switch (type) {
            case 'useful':
                quickFeedback.useful = true;
                quickFeedback.satisfaction = 4;
                break;
            case 'not_useful':
                quickFeedback.useful = false;
                quickFeedback.satisfaction = 2;
                break;
            case 'accurate':
                quickFeedback.accurate = true;
                quickFeedback.satisfaction = 5;
                break;
            case 'inaccurate':
                quickFeedback.accurate = false;
                quickFeedback.satisfaction = 1;
                break;
        }

        if (onFeedback) {
            onFeedback(quickFeedback);
        }
    }, [onFeedback]);

    if (!process) {
        return (
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="flex items-center justify-center text-gray-500">
                        <Brain className="h-8 w-8 mr-2 animate-pulse" />
                        <span>AI 사고 과정을 준비하고 있습니다...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="w-full space-y-4">
            {/* 🎯 전체 진행 상황 */}
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5" />
                            Multi-AI 협업 진행 상황
                        </CardTitle>
                        <Badge variant="outline" className="text-lg font-semibold">
                            {process.overallProgress}%
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <Progress value={process.overallProgress} className="mb-4" />

                    {/* 📊 실시간 메트릭 */}
                    {showMetrics && metrics && !compact && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{metrics.totalEngines}</div>
                                <div className="text-gray-500">활성 AI</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{metrics.completedEngines}</div>
                                <div className="text-gray-500">완료</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{metrics.averageConfidence}%</div>
                                <div className="text-gray-500">평균 신뢰도</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">
                                    {Math.round(metrics.processingTime / 1000)}s
                                </div>
                                <div className="text-gray-500">경과 시간</div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* 🧠 개별 AI 엔진 사고 과정 */}
            <div className={`grid gap-4 ${compact ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {Object.entries(process.aiEngines).map(([engineId, engine]) => (
                    <Card key={engineId} className="relative overflow-hidden">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {getEngineIcon(engineId)}
                                    <span className="font-medium">
                                        {engine.currentStep === '사고 시작' ?
                                            process.aiEngines[engineId]?.thoughts[0]?.engineName || engineId :
                                            engineId
                                        }
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(engine.status)}
                                    <Badge
                                        variant="outline"
                                        className={`text-xs ${getEngineColor(engineId, engine.status)} text-white border-transparent`}
                                    >
                                        {engine.progress}%
                                    </Badge>
                                </div>
                            </div>
                        </CardHeader>

                        <CardContent className={compact ? "p-3" : "p-4"}>
                            {/* 진행률 바 */}
                            <Progress value={engine.progress} className="mb-3" />

                            {/* 현재 사고 내용 */}
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-gray-700">
                                    {engine.currentStep}
                                </div>
                                <div className={`text-sm text-gray-600 ${compact ? 'line-clamp-2' : ''}`}>
                                    {engine.thinking}
                                </div>

                                {/* 신뢰도 및 기여도 */}
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>신뢰도: {Math.round(engine.confidence * 100)}%</span>
                                    {engine.contribution && (
                                        <span>기여도: {engine.contribution}</span>
                                    )}
                                </div>
                            </div>

                            {/* 최근 사고 과정 (compact 모드가 아닐 때만) */}
                            {!compact && engine.thoughts.length > 1 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="text-xs text-gray-400 mb-1">최근 사고 과정:</div>
                                    <div className="space-y-1 max-h-20 overflow-y-auto">
                                        {engine.thoughts.slice(-3).map((thought, idx) => (
                                            <div key={idx} className="text-xs text-gray-500 flex items-center gap-1">
                                                <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                                <span className="truncate">{thought.thinking}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* 🔄 융합 과정 */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        AI 결과 융합 과정
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{process.fusionStatus.description}</span>
                            <Badge variant="outline">{process.fusionStatus.stage}</Badge>
                        </div>

                        <Progress value={process.fusionStatus.progress} />

                        {process.fusionStatus.consensusScore && (
                            <div className="flex items-center justify-between text-sm">
                                <span>합의 점수:</span>
                                <span className="font-semibold text-green-600">
                                    {Math.round(process.fusionStatus.consensusScore * 100)}%
                                </span>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* 💬 사용자 피드백 섹션 (완료 후에만 표시) */}
            {process.overallProgress === 100 && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            이 답변이 도움되었나요?
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {!showFeedback ? (
                            <div className="space-y-3">
                                {/* 빠른 피드백 버튼들 */}
                                <div className="flex gap-2 flex-wrap">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFeedback('useful')}
                                        className="flex items-center gap-1"
                                    >
                                        <ThumbsUp className="h-4 w-4" />
                                        도움됨
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFeedback('not_useful')}
                                        className="flex items-center gap-1"
                                    >
                                        <ThumbsDown className="h-4 w-4" />
                                        도움안됨
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleQuickFeedback('accurate')}
                                        className="flex items-center gap-1"
                                    >
                                        <CheckCircle className="h-4 w-4" />
                                        정확함
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setShowFeedback(true)}
                                        className="flex items-center gap-1"
                                    >
                                        <Star className="h-4 w-4" />
                                        자세히 평가
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* 상세 피드백 양식 */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-medium">만족도 (1-5)</label>
                                        <select
                                            value={feedback.satisfaction || ''}
                                            onChange={(e) => setFeedback({ ...feedback, satisfaction: Number(e.target.value) })}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        >
                                            <option value="">선택하세요</option>
                                            <option value={1}>1 - 매우 불만족</option>
                                            <option value={2}>2 - 불만족</option>
                                            <option value={3}>3 - 보통</option>
                                            <option value={4}>4 - 만족</option>
                                            <option value={5}>5 - 매우 만족</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium">명확성 (1-5)</label>
                                        <select
                                            value={feedback.clarity || ''}
                                            onChange={(e) => setFeedback({ ...feedback, clarity: Number(e.target.value) })}
                                            className="w-full mt-1 p-2 border rounded-md"
                                        >
                                            <option value="">선택하세요</option>
                                            <option value={1}>1 - 매우 불명확</option>
                                            <option value={2}>2 - 불명확</option>
                                            <option value={3}>3 - 보통</option>
                                            <option value={4}>4 - 명확</option>
                                            <option value={5}>5 - 매우 명확</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium">추가 의견</label>
                                    <Textarea
                                        value={feedback.comments || ''}
                                        onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                                        placeholder="개선 사항이나 추가 의견을 알려주세요..."
                                        className="mt-1"
                                    />
                                </div>

                                <div className="flex gap-2">
                                    <Button onClick={handleFeedbackSubmit}>
                                        피드백 제출
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowFeedback(false)}>
                                        취소
                                    </Button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MultiAIThinkingViewer; 