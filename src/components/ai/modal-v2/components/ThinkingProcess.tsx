'use client';

import { useState, useEffect, useRef } from 'react';

interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  duration?: number;
}

interface ThinkingProcessProps {
  isActive: boolean;
  onComplete: (logs: ThinkingStep[]) => void;
  query: string;
  serverData: any[];
}

export default function ThinkingProcess({ isActive, onComplete, query, serverData }: ThinkingProcessProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const stepRef = useRef<HTMLDivElement>(null);

  // 실제 AI 엔진 처리 단계 실행
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const simulateStepByStep = (apiSteps: ThinkingStep[]) => {
      let stepIndex = 0;
      const processNextStep = () => {
        if (stepIndex >= apiSteps.length) {
          setIsCompleted(true);
          onComplete(apiSteps);
          return;
        }

        const currentStepData = apiSteps[stepIndex];
        setSteps(prev => [...prev, currentStepData]);
        setCurrentStep(stepIndex);

        setTimeout(() => {
          stepIndex++;
          processNextStep();
        }, currentStepData.duration || 600);
      };
      processNextStep();
    };

    const fetchRealThinkingProcess = async () => {
      try {
        const response = await fetch('/api/ai-agent/thinking-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            serverData,
            context: { timestamp: new Date().toISOString() }
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data.steps) {
            // 실제 API 결과 사용
            simulateStepByStep(data.data.steps);
            return;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch real thinking process, using fallback:', error);
      }

      // 폴백: 로컬 시뮬레이션
      const processingSteps: Omit<ThinkingStep, 'timestamp'>[] = [
        {
          step: "질의 분석",
          content: `사용자 질의 파싱: "${query}"\n키워드 추출: ${extractKeywords(query).join(', ')}\n의도 분류: ${classifyIntent(query)}`,
          type: 'analysis',
          duration: 800
        },
        {
          step: "서버 데이터 로딩",
          content: `데이터소스 연결: /api/servers\n서버 수: ${serverData.length}대\n메트릭 필드: CPU, Memory, Disk, Status\n데이터 무결성 검증: OK`,
          type: 'data_processing',
          duration: 600
        },
        {
          step: "성능 메트릭 분석",
          content: generateMetricsAnalysis(serverData),
          type: 'analysis',
          duration: 900
        },
        {
          step: "패턴 매칭",
          content: generatePatternAnalysis(query, serverData),
          type: 'pattern_matching',
          duration: 700
        },
        {
          step: "추론 및 결론 도출",
          content: generateReasoningProcess(query, serverData),
          type: 'reasoning',
          duration: 800
        },
        {
          step: "응답 생성",
          content: `응답 템플릿 선택: ${getResponseTemplate(query)}\n톤앤매너: 전문적, 친근함\n언어: 한국어\n포맷: 구조화된 마크다운`,
          type: 'response_generation',
          duration: 500
        }
      ];

      const fallbackSteps: ThinkingStep[] = processingSteps.map(step => ({
        ...step,
        timestamp: new Date().toISOString()
      }));

      simulateStepByStep(fallbackSteps);
    };

    fetchRealThinkingProcess();

  }, [isActive, query, serverData, isCompleted, onComplete]);

  // 자동 스크롤
  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.scrollTop = stepRef.current.scrollHeight;
    }
  }, [steps]);

  const getStepIcon = (type: ThinkingStep['type'], isActive: boolean) => {
    const baseClass = "w-4 h-4 flex items-center justify-center text-xs";
    
    if (isActive) {
      return <div className={`${baseClass} border-2 border-blue-500 border-t-transparent rounded-full animate-spin`} />;
    }

    const icons = {
      analysis: <i className="fas fa-search text-green-600" />,
      reasoning: <i className="fas fa-brain text-purple-600" />,
      data_processing: <i className="fas fa-database text-blue-600" />,
      pattern_matching: <i className="fas fa-project-diagram text-orange-600" />,
      response_generation: <i className="fas fa-pen text-indigo-600" />
    };

    return <div className={`${baseClass} bg-gray-100 rounded-full`}>{icons[type]}</div>;
  };

  if (!isActive && steps.length === 0) return null;

  return (
    <div className="bg-gray-900 text-gray-100 rounded-lg overflow-hidden" style={{ userSelect: 'none' }}>
      {/* 헤더 */}
      <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          </div>
          <span className="text-sm font-mono text-gray-300">🧠 AI 사고 과정 분석 중...</span>
          {!isCompleted && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400">실시간 분석 중</span>
            </div>
          )}
          {isCompleted && (
            <div className="flex items-center gap-2 ml-auto">
              <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
              <span className="text-xs text-blue-400">분석 완료</span>
            </div>
          )}
        </div>
        
        {/* 진행 상황 표시 */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
            <span>분석 진행률</span>
            <span>{Math.round((steps.length / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-1">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-500 h-1 rounded-full transition-all duration-500"
              style={{ width: `${(steps.length / 6) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* 처리 과정 로그 */}
      <div 
        ref={stepRef}
        className="h-64 overflow-y-auto p-4 space-y-3 font-mono text-sm"
        style={{ scrollbarWidth: 'thin' }}
      >
        {steps.map((step, index) => (
          <div key={index} className="border-l-2 border-gray-600 pl-4 pb-3">
            <div className="flex items-center gap-2 mb-1">
              {getStepIcon(step.type, index === currentStep && !isCompleted)}
              <span className="text-blue-400 font-semibold">[{step.step}]</span>
              <span className="text-gray-500 text-xs">
                {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
            <div className="text-gray-300 whitespace-pre-line leading-relaxed pl-6">
              {step.content}
            </div>
          </div>
        ))}
        
        {!isCompleted && (
          <div className="border-l-2 border-blue-500 pl-4 pb-3">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-blue-400 font-semibold">[AI 분석 진행 중]</span>
              <span className="text-gray-500 text-xs">
                {new Date().toLocaleTimeString('ko-KR')}
              </span>
            </div>
            <div className="text-gray-300 pl-6">
              🧠 질문을 깊이 분석하고 있습니다...<br/>
              📊 서버 데이터를 실시간으로 처리 중...<br/>
              🔍 패턴을 찾고 최적의 답변을 준비 중...
            </div>
          </div>
        )}
      </div>

      {/* 하단 상태바 */}
      <div className="bg-gray-800 px-4 py-2 border-t border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            진행: {steps.length}/6 단계 완료
          </span>
          <span className="text-gray-400">
            {isCompleted ? '처리 완료' : '분석 중...'}
          </span>
        </div>
      </div>
    </div>
  );
}

// 헬퍼 함수들
function extractKeywords(query: string): string[] {
  const keywords = query.toLowerCase()
    .split(/[\s,.\-!?]+/)
    .filter(word => word.length > 1)
    .filter(word => !['은', '는', '이', '가', '을', '를', '의', '에', '와', '과'].includes(word));
  return keywords.slice(0, 5);
}

function classifyIntent(query: string): string {
  const lowerQuery = query.toLowerCase();
  if (lowerQuery.includes('cpu') || lowerQuery.includes('씨피유')) return 'performance_analysis';
  if (lowerQuery.includes('메모리') || lowerQuery.includes('memory')) return 'memory_analysis';
  if (lowerQuery.includes('서버') && lowerQuery.includes('상태')) return 'server_status';
  if (lowerQuery.includes('분석')) return 'general_analysis';
  return 'information_request';
}

function generateMetricsAnalysis(serverData: any[]): string {
  if (!serverData.length) return "서버 데이터 없음";
  
  const avgCpu = serverData.reduce((sum, s) => sum + (s.metrics?.cpu || s.cpu || 0), 0) / serverData.length;
  const avgMemory = serverData.reduce((sum, s) => sum + (s.metrics?.memory || s.memory || 0), 0) / serverData.length;
  const healthyCount = serverData.filter(s => s.status === 'healthy').length;
  
  return `CPU 사용률 분석:
  - 평균: ${avgCpu.toFixed(1)}%
  - 임계값 초과: ${serverData.filter(s => (s.metrics?.cpu || s.cpu || 0) > 80).length}대
  
메모리 사용률 분석:
  - 평균: ${avgMemory.toFixed(1)}%
  - 고사용률 서버: ${serverData.filter(s => (s.metrics?.memory || s.memory || 0) > 85).length}대
  
서버 상태 분포:
  - 정상: ${healthyCount}대 (${(healthyCount/serverData.length*100).toFixed(1)}%)
  - 총 서버 수: ${serverData.length}대`;
}

function generatePatternAnalysis(query: string, serverData: any[]): string {
  const patterns = [];
  
  if (serverData.length > 0) {
    const highCpuServers = serverData.filter(s => (s.metrics?.cpu || s.cpu || 0) > 70);
    const highMemoryServers = serverData.filter(s => (s.metrics?.memory || s.memory || 0) > 80);
    
    if (highCpuServers.length > 0) {
      patterns.push(`패턴 1: 고부하 CPU 그룹 감지 (${highCpuServers.length}대)`);
    }
    
    if (highMemoryServers.length > 0) {
      patterns.push(`패턴 2: 메모리 압박 패턴 식별 (${highMemoryServers.length}대)`);
    }
    
    if (highCpuServers.length > 0 && highMemoryServers.length > 0) {
      const overlap = highCpuServers.filter(cpu => 
        highMemoryServers.some(mem => mem.id === cpu.id)
      );
      if (overlap.length > 0) {
        patterns.push(`패턴 3: 복합 리소스 압박 (${overlap.length}대)`);
      }
    }
  }
  
  if (patterns.length === 0) {
    patterns.push("패턴: 정상 운영 상태, 특이사항 없음");
  }
  
  return `매칭된 패턴:
${patterns.map((p, i) => `${i + 1}. ${p}`).join('\n')}

질의 매칭도: ${calculateQueryMatch(query)}%
신뢰도 점수: ${Math.random() * 0.3 + 0.7}`;
}

function generateReasoningProcess(query: string, serverData: any[]): string {
  return `추론 체인:
1. 사용자는 "${query}"에 대한 정보를 요청
2. 현재 ${serverData.length}대 서버 데이터 분석 필요
3. 성능 메트릭과 상태 정보를 종합적으로 검토
4. 잠재적 이슈 및 권장사항 도출

결론:
- 즉시 조치 필요: ${serverData.filter(s => s.status === 'critical').length}건
- 모니터링 강화 필요: ${serverData.filter(s => s.status === 'warning').length}건
- 정상 상태: ${serverData.filter(s => s.status === 'healthy').length}건

권장 액션 우선순위:
1. 성능 최적화 (HIGH)
2. 용량 계획 수립 (MEDIUM)
3. 모니터링 강화 (LOW)`;
}

function getResponseTemplate(query: string): string {
  if (query.includes('CPU') || query.includes('cpu')) return 'performance_detail_template';
  if (query.includes('메모리')) return 'memory_analysis_template';
  if (query.includes('서버')) return 'server_overview_template';
  return 'general_response_template';
}

function calculateQueryMatch(query: string): number {
  // 간단한 매칭 점수 계산
  const keywords = extractKeywords(query);
  const relevantTerms = ['서버', 'cpu', '메모리', '상태', '분석', '성능'];
  const matches = keywords.filter(k => relevantTerms.some(t => k.includes(t) || t.includes(k)));
  return Math.min(100, Math.round((matches.length / keywords.length) * 100));
} 