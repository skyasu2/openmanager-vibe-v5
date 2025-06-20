import type { Meta, StoryObj } from '@storybook/nextjs';
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// 14개 AI 엔진 정의
const AI_ENGINES = [
  {
    id: 'google-ai',
    name: 'Google AI Studio',
    category: 'external',
    priority: 10,
    color: 'bg-blue-500',
  },
  {
    id: 'mcp',
    name: 'Model Context Protocol',
    category: 'infrastructure',
    priority: 8,
    color: 'bg-green-500',
  },
  {
    id: 'rag',
    name: 'Local Vector Database',
    category: 'infrastructure',
    priority: 7,
    color: 'bg-purple-500',
  },
  {
    id: 'custom-intent',
    name: '의도 분석 엔진',
    category: 'custom',
    priority: 6,
    color: 'bg-orange-500',
  },
  {
    id: 'custom-analysis',
    name: '분석 엔진',
    category: 'custom',
    priority: 6,
    color: 'bg-orange-400',
  },
  {
    id: 'custom-recommendation',
    name: '추천 시스템',
    category: 'custom',
    priority: 5,
    color: 'bg-orange-300',
  },
  {
    id: 'opensource-nlp',
    name: '자연어 처리',
    category: 'opensource',
    priority: 4,
    color: 'bg-cyan-500',
  },
  {
    id: 'opensource-sentiment',
    name: '감정 분석',
    category: 'opensource',
    priority: 4,
    color: 'bg-cyan-400',
  },
  {
    id: 'opensource-classification',
    name: '분류 시스템',
    category: 'opensource',
    priority: 3,
    color: 'bg-cyan-300',
  },
  {
    id: 'opensource-summarization',
    name: '요약 엔진',
    category: 'opensource',
    priority: 3,
    color: 'bg-cyan-200',
  },
  {
    id: 'opensource-qa',
    name: '질의응답',
    category: 'opensource',
    priority: 3,
    color: 'bg-cyan-100',
  },
  {
    id: 'anomaly',
    name: '이상 탐지',
    category: 'analytics',
    priority: 5,
    color: 'bg-red-500',
  },
  {
    id: 'prediction',
    name: '예측 분석',
    category: 'analytics',
    priority: 4,
    color: 'bg-red-400',
  },
  {
    id: 'correlation',
    name: '상관관계 분석',
    category: 'analytics',
    priority: 3,
    color: 'bg-red-300',
  },
];

// AI 엔진 상호작용 컴포넌트
const MultiAIEngineInteraction = ({ scenario }: { scenario: string }) => {
  const [activeEngines, setActiveEngines] = useState<string[]>([]);
  const [engineProgress, setEngineProgress] = useState<Record<string, number>>(
    {}
  );
  const [engineResults, setEngineResults] = useState<Record<string, any>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // 시나리오별 엔진 활성화
  const activateEnginesForScenario = (scenario: string) => {
    const scenarios = {
      'server-analysis': ['google-ai', 'mcp', 'rag', 'anomaly', 'prediction'],
      'user-query': [
        'google-ai',
        'rag',
        'custom-intent',
        'opensource-nlp',
        'opensource-qa',
      ],
      'system-optimization': [
        'mcp',
        'prediction',
        'correlation',
        'custom-analysis',
        'custom-recommendation',
      ],
      'emergency-response': [
        'google-ai',
        'mcp',
        'anomaly',
        'prediction',
        'custom-analysis',
      ],
      'content-processing': [
        'opensource-nlp',
        'opensource-sentiment',
        'opensource-classification',
        'opensource-summarization',
      ],
      'full-analysis': AI_ENGINES.map(e => e.id),
    };

    return scenarios[scenario] || [];
  };

  // AI 엔진 시뮬레이션
  const simulateAIProcessing = async () => {
    setIsProcessing(true);
    const engines = activateEnginesForScenario(scenario);
    setActiveEngines(engines);

    // 초기화
    const initialProgress = {};
    const initialResults = {};
    engines.forEach(engineId => {
      initialProgress[engineId] = 0;
      initialResults[engineId] = null;
    });
    setEngineProgress(initialProgress);
    setEngineResults(initialResults);

    // 각 엔진별 처리 시뮬레이션
    const enginePromises = engines.map(async (engineId, index) => {
      const engine = AI_ENGINES.find(e => e.id === engineId);
      const processingTime = 1000 + Math.random() * 3000; // 1-4초
      const steps = 20;

      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve =>
          setTimeout(resolve, processingTime / steps)
        );
        setEngineProgress(prev => ({
          ...prev,
          [engineId]: (i / steps) * 100,
        }));
      }

      // 결과 생성
      const result = generateEngineResult(engine, scenario);
      setEngineResults(prev => ({
        ...prev,
        [engineId]: result,
      }));
    });

    await Promise.all(enginePromises);
    setIsProcessing(false);
  };

  // 엔진별 결과 생성
  const generateEngineResult = (engine: any, scenario: string) => {
    const resultTemplates = {
      'google-ai': {
        confidence: 0.85 + Math.random() * 0.1,
        response: `Google AI 분석 완료: ${scenario}에 대한 종합적인 분석 결과를 제공합니다.`,
        insights: ['고급 패턴 인식', '컨텍스트 이해', '자연어 생성'],
      },
      mcp: {
        confidence: 0.9 + Math.random() * 0.05,
        response: `MCP 시스템 연결 완료: 실시간 컨텍스트 정보를 성공적으로 수집했습니다.`,
        insights: [
          '실시간 데이터 접근',
          '시스템 상태 모니터링',
          '컨텍스트 관리',
        ],
      },
      rag: {
        confidence: 0.8 + Math.random() * 0.15,
        response: `벡터 DB 검색 완료: 관련 문서 ${Math.floor(Math.random() * 50) + 10}개를 찾았습니다.`,
        insights: ['문서 유사도 매칭', '벡터 임베딩', '의미론적 검색'],
      },
      anomaly: {
        confidence: 0.75 + Math.random() * 0.2,
        response: `이상 탐지 완료: ${Math.floor(Math.random() * 5)}개의 잠재적 이상 패턴을 발견했습니다.`,
        insights: ['통계적 이상 탐지', '패턴 분석', '임계값 모니터링'],
      },
      prediction: {
        confidence: 0.7 + Math.random() * 0.25,
        response: `예측 분석 완료: 향후 24시간 내 ${Math.floor(Math.random() * 10) + 5}개 이벤트 예상됩니다.`,
        insights: ['시계열 분석', '트렌드 예측', '확률 모델링'],
      },
    };

    const template = resultTemplates[engine.id] || {
      confidence: 0.6 + Math.random() * 0.3,
      response: `${engine.name} 처리 완료: ${scenario} 분석이 완료되었습니다.`,
      insights: ['데이터 처리', '패턴 분석', '결과 생성'],
    };

    return {
      ...template,
      processingTime: Math.floor(Math.random() * 3000) + 500,
      timestamp: new Date().toISOString(),
    };
  };

  // 카테고리별 엔진 그룹화
  const enginesByCategory = AI_ENGINES.reduce(
    (acc, engine) => {
      if (!acc[engine.category]) acc[engine.category] = [];
      acc[engine.category].push(engine);
      return acc;
    },
    {} as Record<string, typeof AI_ENGINES>
  );

  return (
    <div className='w-full max-w-6xl mx-auto p-6 space-y-6'>
      <div className='text-center space-y-4'>
        <h1 className='text-3xl font-bold'>
          Multi-AI 엔진 상호작용 시뮬레이션
        </h1>
        <p className='text-gray-600'>
          14개 AI 엔진이 협력하여 복잡한 작업을 처리하는 과정을 시각화합니다
        </p>

        <div className='flex justify-center gap-4'>
          <Badge variant='outline' className='text-lg px-4 py-2'>
            시나리오: {scenario}
          </Badge>
          <Badge variant='outline' className='text-lg px-4 py-2'>
            활성 엔진: {activeEngines.length}개
          </Badge>
        </div>

        <Button
          onClick={simulateAIProcessing}
          disabled={isProcessing}
          className='px-8 py-3 text-lg'
        >
          {isProcessing ? '처리 중...' : 'AI 엔진 실행'}
        </Button>
      </div>

      <Tabs defaultValue='overview' className='w-full'>
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='overview'>전체 개요</TabsTrigger>
          <TabsTrigger value='categories'>카테고리별</TabsTrigger>
          <TabsTrigger value='processing'>처리 과정</TabsTrigger>
          <TabsTrigger value='results'>결과 분석</TabsTrigger>
        </TabsList>

        <TabsContent value='overview' className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {AI_ENGINES.map(engine => (
              <Card
                key={engine.id}
                className={`border-2 ${activeEngines.includes(engine.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
              >
                <CardHeader className='pb-2'>
                  <div className='flex items-center justify-between'>
                    <CardTitle className='text-sm'>{engine.name}</CardTitle>
                    <Badge
                      variant={
                        activeEngines.includes(engine.id)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {engine.category}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className='space-y-2'>
                    <div className='flex justify-between text-xs'>
                      <span>우선순위: {engine.priority}</span>
                      <span
                        className={`w-3 h-3 rounded-full ${engine.color}`}
                      ></span>
                    </div>

                    {activeEngines.includes(engine.id) && (
                      <>
                        <Progress
                          value={engineProgress[engine.id] || 0}
                          className='h-2'
                        />
                        <div className='text-xs text-gray-600'>
                          {Math.round(engineProgress[engine.id] || 0)}% 완료
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='categories' className='space-y-6'>
          {Object.entries(enginesByCategory).map(([category, engines]) => (
            <Card key={category}>
              <CardHeader>
                <CardTitle className='capitalize'>{category} 엔진들</CardTitle>
                <CardDescription>{engines.length}개 엔진</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {engines.map(engine => (
                    <div
                      key={engine.id}
                      className='flex items-center justify-between p-3 border rounded-lg'
                    >
                      <div className='flex items-center gap-3'>
                        <div
                          className={`w-4 h-4 rounded-full ${engine.color}`}
                        ></div>
                        <span className='font-medium'>{engine.name}</span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <Badge variant='outline'>P{engine.priority}</Badge>
                        {activeEngines.includes(engine.id) && (
                          <Badge variant='default'>활성</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value='processing' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle>실시간 처리 과정</CardTitle>
              <CardDescription>
                각 AI 엔진의 처리 진행 상황을 실시간으로 모니터링합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                {activeEngines.map(engineId => {
                  const engine = AI_ENGINES.find(e => e.id === engineId);
                  const progress = engineProgress[engineId] || 0;
                  const isComplete = progress >= 100;

                  return (
                    <div key={engineId} className='space-y-2'>
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-3'>
                          <div
                            className={`w-3 h-3 rounded-full ${engine?.color}`}
                          ></div>
                          <span className='font-medium'>{engine?.name}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-gray-600'>
                            {Math.round(progress)}%
                          </span>
                          {isComplete && <Badge variant='default'>완료</Badge>}
                        </div>
                      </div>
                      <Progress value={progress} className='h-2' />
                      {isComplete && engineResults[engineId] && (
                        <div className='text-xs text-gray-600 pl-6'>
                          신뢰도:{' '}
                          {Math.round(engineResults[engineId].confidence * 100)}
                          % | 처리시간: {engineResults[engineId].processingTime}
                          ms
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='results' className='space-y-4'>
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
            {Object.entries(engineResults).map(([engineId, result]) => {
              const engine = AI_ENGINES.find(e => e.id === engineId);
              if (!result) return null;

              return (
                <Card key={engineId}>
                  <CardHeader>
                    <div className='flex items-center justify-between'>
                      <CardTitle className='text-lg'>{engine?.name}</CardTitle>
                      <Badge variant='outline'>
                        {Math.round(result.confidence * 100)}% 신뢰도
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <p className='text-sm text-gray-700'>{result.response}</p>

                    <div className='space-y-2'>
                      <h4 className='font-medium text-sm'>주요 인사이트:</h4>
                      <div className='flex flex-wrap gap-2'>
                        {result.insights.map(
                          (insight: string, index: number) => (
                            <Badge
                              key={index}
                              variant='secondary'
                              className='text-xs'
                            >
                              {insight}
                            </Badge>
                          )
                        )}
                      </div>
                    </div>

                    <div className='text-xs text-gray-500'>
                      처리시간: {result.processingTime}ms | 완료시각:{' '}
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// 스토리북 메타데이터
const meta: Meta<typeof MultiAIEngineInteraction> = {
  title: 'AI Systems/Multi-AI Engine Interaction',
  component: MultiAIEngineInteraction,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
## Multi-AI 엔진 상호작용 시뮬레이션

OpenManager Vibe v5의 14개 AI 엔진이 어떻게 협력하여 복잡한 작업을 처리하는지 시각화합니다.

### 14개 AI 엔진 구성:

**External (1개):**
- Google AI Studio (베타)

**Infrastructure (2개):**
- Model Context Protocol (MCP)
- Local Vector Database (RAG)

**Custom (3개):**
- 의도 분석 엔진
- 분석 엔진  
- 추천 시스템

**Opensource (5개):**
- 자연어 처리
- 감정 분석
- 분류 시스템
- 요약 엔진
- 질의응답

**Analytics (3개):**
- 이상 탐지
- 예측 분석
- 상관관계 분석

### 주요 기능:
- 시나리오별 엔진 활성화
- 실시간 처리 진행 상황 모니터링
- 엔진별 결과 및 신뢰도 표시
- 카테고리별 엔진 관리
- 성능 메트릭 추적
        `,
      },
    },
  },
  argTypes: {
    scenario: {
      control: 'select',
      options: [
        'server-analysis',
        'user-query',
        'system-optimization',
        'emergency-response',
        'content-processing',
        'full-analysis',
      ],
      description: '실행할 AI 분석 시나리오를 선택합니다',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

// 스토리 정의
export const ServerAnalysis: Story = {
  args: {
    scenario: 'server-analysis',
  },
  parameters: {
    docs: {
      description: {
        story:
          '서버 상태 분석 시나리오: Google AI, MCP, RAG, 이상탐지, 예측분석 엔진이 협력하여 서버 상태를 종합 분석합니다.',
      },
    },
  },
};

export const UserQuery: Story = {
  args: {
    scenario: 'user-query',
  },
  parameters: {
    docs: {
      description: {
        story:
          '사용자 질의 처리 시나리오: Google AI, RAG, 의도분석, 자연어처리, 질의응답 엔진이 협력하여 사용자 질문에 답변합니다.',
      },
    },
  },
};

export const SystemOptimization: Story = {
  args: {
    scenario: 'system-optimization',
  },
  parameters: {
    docs: {
      description: {
        story:
          '시스템 최적화 시나리오: MCP, 예측분석, 상관관계분석, 분석엔진, 추천시스템이 협력하여 시스템 성능을 최적화합니다.',
      },
    },
  },
};

export const EmergencyResponse: Story = {
  args: {
    scenario: 'emergency-response',
  },
  parameters: {
    docs: {
      description: {
        story:
          '긴급 대응 시나리오: Google AI, MCP, 이상탐지, 예측분석, 분석엔진이 협력하여 긴급 상황에 신속하게 대응합니다.',
      },
    },
  },
};

export const ContentProcessing: Story = {
  args: {
    scenario: 'content-processing',
  },
  parameters: {
    docs: {
      description: {
        story:
          '콘텐츠 처리 시나리오: 자연어처리, 감정분석, 분류시스템, 요약엔진이 협력하여 텍스트 콘텐츠를 종합 분석합니다.',
      },
    },
  },
};

export const FullAnalysis: Story = {
  args: {
    scenario: 'full-analysis',
  },
  parameters: {
    docs: {
      description: {
        story:
          '전체 분석 시나리오: 14개 모든 AI 엔진이 협력하여 최대 성능으로 종합 분석을 수행합니다. 가장 복잡하고 포괄적인 분석 시나리오입니다.',
      },
    },
  },
};

export const EngineComparison: Story = {
  render: () => (
    <div className='space-y-8'>
      <div className='text-center space-y-4'>
        <h2 className='text-2xl font-bold'>AI 엔진 성능 비교</h2>
        <p className='text-gray-600'>
          다양한 시나리오에서 각 엔진의 성능과 특성을 비교합니다
        </p>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {[
          'server-analysis',
          'user-query',
          'system-optimization',
          'emergency-response',
          'content-processing',
          'full-analysis',
        ].map(scenario => (
          <Card key={scenario}>
            <CardHeader>
              <CardTitle className='capitalize'>
                {scenario.replace('-', ' ')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MultiAIEngineInteraction scenario={scenario} />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          '모든 시나리오를 한 번에 비교하여 각 AI 엔진의 활용도와 성능 특성을 분석할 수 있습니다.',
      },
    },
  },
};
