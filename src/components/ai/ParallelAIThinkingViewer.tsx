import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, Cpu, Database, Search, Zap, CheckCircle, XCircle, Clock } from 'lucide-react';

interface EngineStatus {
  name: string;
  status: 'waiting' | 'processing' | 'completed' | 'failed';
  progress: number;
  confidence?: number;
  processingTime?: number;
  result?: string;
  icon: React.ReactNode;
  color: string;
}

interface ParallelAIThinkingViewerProps {
  isProcessing: boolean;
  engines?: EngineStatus[];
  onComplete?: (results: any[]) => void;
}

const defaultEngines: EngineStatus[] = [
  {
    name: 'MCP Engine',
    status: 'waiting',
    progress: 0,
    icon: <Brain className="w-4 h-4" />,
    color: 'bg-blue-500',
  },
  {
    name: 'RAG Engine',
    status: 'waiting',
    progress: 0,
    icon: <Database className="w-4 h-4" />,
    color: 'bg-green-500',
  },
  {
    name: 'ML Engine',
    status: 'waiting',
    progress: 0,
    icon: <Cpu className="w-4 h-4" />,
    color: 'bg-purple-500',
  },
  {
    name: 'SmartQuery',
    status: 'waiting',
    progress: 0,
    icon: <Search className="w-4 h-4" />,
    color: 'bg-orange-500',
  },
];

export const ParallelAIThinkingViewer: React.FC<ParallelAIThinkingViewerProps> = ({
  isProcessing,
  engines = defaultEngines,
  onComplete,
}) => {
  const [currentEngines, setCurrentEngines] = useState<EngineStatus[]>(engines);
  const [phase, setPhase] = useState<'parallel' | 'evaluation' | 'fallback' | 'complete'>('parallel');

  useEffect(() => {
    if (isProcessing) {
      simulateParallelProcessing();
    }
  }, [isProcessing]);

  const simulateParallelProcessing = async () => {
    setPhase('parallel');
    
    // 1단계: 병렬 처리 시뮬레이션
    const processingPromises = currentEngines.map((engine, index) => 
      simulateEngineProcessing(engine, index)
    );

    await Promise.all(processingPromises);
    
    // 2단계: 품질 평가
    setPhase('evaluation');
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // 3단계: 완료
    setPhase('complete');
    
    if (onComplete) {
      onComplete(currentEngines);
    }
  };

  const simulateEngineProcessing = async (engine: EngineStatus, index: number) => {
    const delay = Math.random() * 1000 + 500; // 0.5-1.5초
    const steps = 20;
    const stepDelay = delay / steps;

    // 처리 시작
    updateEngine(index, { status: 'processing', progress: 0 });

    // 진행률 업데이트
    for (let i = 1; i <= steps; i++) {
      await new Promise(resolve => setTimeout(resolve, stepDelay));
      updateEngine(index, { progress: (i / steps) * 100 });
    }

    // 완료 (90% 확률로 성공)
    const success = Math.random() > 0.1;
    const confidence = success ? Math.random() * 0.3 + 0.7 : 0; // 0.7-1.0
    
    updateEngine(index, {
      status: success ? 'completed' : 'failed',
      progress: 100,
      confidence,
      processingTime: Math.round(delay),
      result: success ? `${engine.name} 분석 완료` : '처리 실패',
    });
  };

  const updateEngine = (index: number, updates: Partial<EngineStatus>) => {
    setCurrentEngines(prev => 
      prev.map((engine, i) => 
        i === index ? { ...engine, ...updates } : engine
      )
    );
  };

  const getStatusIcon = (status: EngineStatus['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'processing':
        return <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 'parallel':
        return '🔄 4개 AI 엔진 병렬 처리 중...';
      case 'evaluation':
        return '🧠 응답 품질 평가 중...';
      case 'fallback':
        return '🌐 외부 AI 폴백 처리 중...';
      case 'complete':
        return '✅ 지능적 응답 융합 완료';
      default:
        return '⏳ 대기 중...';
    }
  };

  const completedEngines = currentEngines.filter(e => e.status === 'completed').length;
  const overallProgress = (completedEngines / currentEngines.length) * 100;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          병렬 AI 엔진 처리 과정
        </CardTitle>
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>{getPhaseDescription()}</span>
            <span>{completedEngines}/{currentEngines.length} 완료</span>
          </div>
          <Progress value={overallProgress} className="w-full" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentEngines.map((engine, index) => (
            <Card key={engine.name} className="relative overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`p-1 rounded ${engine.color} text-white`}>
                      {engine.icon}
                    </div>
                    <span className="font-medium">{engine.name}</span>
                  </div>
                  {getStatusIcon(engine.status)}
                </div>
                
                <Progress value={engine.progress} className="mb-2" />
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <Badge variant={
                    engine.status === 'completed' ? 'default' :
                    engine.status === 'failed' ? 'destructive' :
                    engine.status === 'processing' ? 'secondary' : 'outline'
                  }>
                    {engine.status === 'waiting' && '대기'}
                    {engine.status === 'processing' && '처리중'}
                    {engine.status === 'completed' && '완료'}
                    {engine.status === 'failed' && '실패'}
                  </Badge>
                  
                  {engine.processingTime && (
                    <span>{engine.processingTime}ms</span>
                  )}
                </div>
                
                {engine.confidence !== undefined && (
                  <div className="mt-2 text-xs">
                    <span className="text-gray-500">신뢰도: </span>
                    <span className={`font-medium ${
                      engine.confidence > 0.8 ? 'text-green-600' :
                      engine.confidence > 0.6 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {Math.round(engine.confidence * 100)}%
                    </span>
                  </div>
                )}
                
                {engine.result && (
                  <div className="mt-2 text-xs text-gray-600 truncate">
                    {engine.result}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
        
        {phase === 'evaluation' && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Brain className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-800">품질 평가 진행 중</span>
              </div>
              <div className="text-sm text-blue-700">
                • 최소 2개 엔진 성공 여부 확인<br/>
                • 평균 신뢰도 계산 (목표: 70% 이상)<br/>
                • 응답 일관성 검증
              </div>
            </CardContent>
          </Card>
        )}
        
        {phase === 'complete' && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="font-medium text-green-800">처리 완료</span>
              </div>
              <div className="text-sm text-green-700">
                성공한 엔진들의 응답을 지능적으로 융합하여 최종 답변을 생성했습니다.
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};

export default ParallelAIThinkingViewer; 