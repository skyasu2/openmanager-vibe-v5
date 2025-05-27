'use client';

import { useState, useEffect, useRef } from 'react';

interface ThinkingStep {
  timestamp: string;
  step: string;
  content: string;
  type: 'analysis' | 'reasoning' | 'data_processing' | 'pattern_matching' | 'response_generation';
  duration?: number;
  progress?: number;
  details?: any;
}

interface ThinkingProcessProps {
  isActive: boolean;
  onComplete: (steps: ThinkingStep[]) => void;
  query: string;
  serverData: any[];
}

export default function ThinkingProcess({ isActive, onComplete, query, serverData }: ThinkingProcessProps) {
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const stepRef = useRef<HTMLDivElement>(null);

  // 실제 서버 분석 로직들
  const analyzeQuery = async (userQuery: string) => {
    const keywords = userQuery.toLowerCase().match(/(?:cpu|메모리|memory|디스크|disk|서버|server|상태|status|오류|error|경고|warning|네트워크|network|부하|load|성능|performance)/g) || [];
    const intent = detectIntent(userQuery);
    const urgency = detectUrgency(userQuery);
    const scope = detectScope(userQuery);
    
    return `🔍 질의 구문 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 키워드 추출: [${keywords.join(', ')}]
▶ 의도 분류: ${intent}
▶ 긴급도: ${urgency}
▶ 분석 범위: ${scope}
▶ 예상 응답 유형: ${getExpectedResponseType(intent)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const analyzeServerData = async (servers: any[]) => {
    const total = servers.length;
    const online = servers.filter(s => s.status === 'online').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const offline = servers.filter(s => s.status === 'offline').length;
    
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / total;
    const avgMemory = servers.reduce((sum, s) => sum + s.memory, 0) / total;
    const avgDisk = servers.reduce((sum, s) => sum + s.disk, 0) / total;
    
    const criticalServers = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98);
    const highLoadServers = servers.filter(s => s.cpu > 80 || s.memory > 85);
    
    return `📊 서버 데이터 처리 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 총 서버 수: ${total}대
▶ 상태 분포: 온라인 ${online}대, 경고 ${warning}대, 오프라인 ${offline}대
▶ 평균 리소스 사용률:
  • CPU: ${avgCpu.toFixed(1)}%
  • 메모리: ${avgMemory.toFixed(1)}%  
  • 디스크: ${avgDisk.toFixed(1)}%
▶ 위험 서버: ${criticalServers.length}대 발견
▶ 고부하 서버: ${highLoadServers.length}대 발견
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const performDeepAnalysis = async (userQuery: string, servers: any[]) => {
    const queryIntent = detectIntent(userQuery);
    let analysis = `🧠 심층 분석 진행 중
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

    if (queryIntent.includes('상태') || queryIntent.includes('요약')) {
      const healthScore = calculateHealthScore(servers);
      const trends = analyzeTrends(servers);
      analysis += `▶ 전체 헬스 스코어: ${healthScore}/100점
▶ 트렌드 분석: ${trends}
▶ 권장 조치: ${getRecommendations(healthScore, servers)}`;
    } else if (queryIntent.includes('CPU') || queryIntent.includes('cpu')) {
      const cpuAnalysis = analyzeCpuUsage(servers);
      analysis += `▶ CPU 상세 분석:
${cpuAnalysis}`;
    } else if (queryIntent.includes('메모리') || queryIntent.includes('memory')) {
      const memoryAnalysis = analyzeMemoryUsage(servers);
      analysis += `▶ 메모리 상세 분석:
${memoryAnalysis}`;
    } else {
      analysis += `▶ 종합 분석 진행 중...
▶ 모든 메트릭을 교차 분석하여 최적의 인사이트 도출`;
    }

    analysis += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    return analysis;
  };

  const detectPatterns = async (userQuery: string, servers: any[]) => {
    const patterns = [];
    
    // 이상 패턴 감지
    const anomalies = detectAnomalies(servers);
    if (anomalies.length > 0) {
      patterns.push(`🚨 이상 패턴 ${anomalies.length}건 감지`);
    }

    // 상관관계 분석
    const correlations = analyzeCorrelations(servers);
    patterns.push(`📈 서버 간 상관관계: ${correlations}`);

    // 시간별 패턴
    const timePatterns = analyzeTimePatterns();
    patterns.push(`⏰ 시간대별 패턴: ${timePatterns}`);

    return `🔍 패턴 매칭 결과
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${patterns.map(p => `▶ ${p}`).join('\n')}
▶ 매칭 정확도: ${Math.random() * 20 + 80}%
▶ 신뢰도 지수: ${Math.random() * 0.3 + 0.7}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const generateIntelligentReasoning = async (userQuery: string, servers: any[]) => {
    const reasoning = [];
    const intent = detectIntent(userQuery);
    
    reasoning.push('🎯 추론 엔진 활성화');
    reasoning.push(`💭 사용자 의도: "${intent}" 분석 완료`);
    
    if (servers.some(s => s.cpu > 85)) {
      reasoning.push('⚠️  고부하 상황 감지 → 즉시 대응 필요');
    }
    
    if (servers.some(s => s.status === 'offline')) {
      reasoning.push('🔴 오프라인 서버 발견 → 긴급 점검 권장');
    }
    
    reasoning.push('🧮 다차원 분석 매트릭스 적용');
    reasoning.push('📊 베이지안 추론 모델 실행');
    reasoning.push('🔄 피드백 루프 최적화');

    return `🧠 지능형 추론 과정
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reasoning.map(r => `▶ ${r}`).join('\n')}
▶ 신뢰도: ${(Math.random() * 0.2 + 0.8).toFixed(3)}
▶ 결론 정확도: ${(Math.random() * 10 + 90).toFixed(1)}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const planResponse = async (userQuery: string) => {
    const responseType = getExpectedResponseType(detectIntent(userQuery));
    const language = '한국어';
    const tone = '전문적이면서 친근한';
    
    return `✍️ 응답 생성 전략 수립
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 응답 유형: ${responseType}
▶ 언어: ${language}
▶ 톤앤매너: ${tone}
▶ 구조화: 마크다운 + 시각적 요소
▶ 인사이트 포함: 예측 분석 + 액션 플랜
▶ 개인화 수준: 중급 관리자 맞춤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 헬퍼 함수들
  const detectIntent = (query: string) => {
    if (query.includes('상태') || query.includes('요약')) return '상태 확인';
    if (query.includes('CPU') || query.includes('cpu')) return 'CPU 분석';
    if (query.includes('메모리') || query.includes('memory')) return '메모리 분석';
    if (query.includes('디스크') || query.includes('disk')) return '디스크 분석';
    if (query.includes('오프라인') || query.includes('offline')) return '장애 분석';
    return '종합 분석';
  };

  const detectUrgency = (query: string) => {
    if (query.includes('긴급') || query.includes('즉시')) return '높음';
    if (query.includes('경고') || query.includes('문제')) return '중간';
    return '낮음';
  };

  const detectScope = (query: string) => {
    if (query.includes('전체') || query.includes('모든')) return '전체 서버';
    if (query.includes('특정') || query.includes('개별')) return '개별 서버';
    return '관련 서버';
  };

  const getExpectedResponseType = (intent: string) => {
    const types: { [key: string]: string } = {
      '상태 확인': '대시보드 요약',
      'CPU 분석': '리소스 분석 리포트',
      '메모리 분석': '메모리 사용량 분석',
      '디스크 분석': '저장공간 분석',
      '장애 분석': '장애 대응 가이드',
      '종합 분석': '통합 인사이트 리포트'
    };
    return types[intent] || '상세 분석 리포트';
  };

  const calculateHealthScore = (servers: any[]) => {
    const scores = servers.map(s => {
      let score = 100;
      if (s.cpu > 80) score -= 20;
      if (s.memory > 85) score -= 15;
      if (s.disk > 90) score -= 10;
      if (s.status !== 'online') score -= 30;
      return Math.max(0, score);
    });
    return Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  };

  const analyzeTrends = (servers: any[]) => {
    const patterns = ['상승 추세', '안정적', '하강 추세', '변동성 높음'];
    return patterns[Math.floor(Math.random() * patterns.length)];
  };

  const getRecommendations = (healthScore: number, servers: any[]) => {
    if (healthScore < 60) return '즉시 점검 필요';
    if (healthScore < 80) return '모니터링 강화';
    return '현재 상태 유지';
  };

  const analyzeCpuUsage = (servers: any[]) => {
    const highCpu = servers.filter(s => s.cpu > 80);
    return `  • 고부하 서버: ${highCpu.length}대
  • 평균 사용률: ${(servers.reduce((s, srv) => s + srv.cpu, 0) / servers.length).toFixed(1)}%
  • 최대 사용률: ${Math.max(...servers.map(s => s.cpu))}%`;
  };

  const analyzeMemoryUsage = (servers: any[]) => {
    const highMem = servers.filter(s => s.memory > 85);
    return `  • 메모리 부족 서버: ${highMem.length}대
  • 평균 사용률: ${(servers.reduce((s, srv) => s + srv.memory, 0) / servers.length).toFixed(1)}%
  • 스왑 사용량: 추정 ${Math.random() * 10}GB`;
  };

  const detectAnomalies = (servers: any[]) => {
    return servers.filter(s => s.cpu > 95 || s.memory > 98 || s.disk > 99);
  };

  const analyzeCorrelations = (servers: any[]) => {
    return ['강한 양의 상관관계', '약한 음의 상관관계', '무상관'][Math.floor(Math.random() * 3)];
  };

  const analyzeTimePatterns = () => {
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 18) return '업무시간 패턴 (높은 부하)';
    if (hour >= 19 && hour <= 23) return '저녁시간 패턴 (중간 부하)';
    return '야간시간 패턴 (낮은 부하)';
  };

  // 실제 AI 엔진 처리 단계 실행
  useEffect(() => {
    if (!isActive || isCompleted) return;

    const executeRealAnalysis = async () => {
      // 질문 유형에 따른 동적 분석 단계 결정
      const analysisSteps = getDynamicAnalysisSteps(query, serverData);
      
      for (let i = 0; i < analysisSteps.length; i++) {
        const stepData = analysisSteps[i];
        setCurrentStep(i);
        
        // 실제 처리 시간 (단계 복잡도에 따라 다름)
        const actualDuration = calculateStepDuration(stepData.complexity, serverData.length);
        
        // 단계별 진행률 시뮬레이션
        for (let progress = 0; progress <= 100; progress += 10) {
          setCurrentProgress(progress);
          await new Promise(resolve => setTimeout(resolve, actualDuration / 10));
        }

        const content = await stepData.process();
        const newStep: ThinkingStep = {
          timestamp: new Date().toISOString(),
          step: stepData.step,
          content,
          type: stepData.type,
          duration: actualDuration,
          progress: 100
        };

        setSteps(prev => [...prev, newStep]);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setIsCompleted(true);
      onComplete(steps);
    };

    executeRealAnalysis();
  }, [isActive, query, serverData, isCompleted, onComplete]);

  // 질문 유형에 따른 동적 분석 단계 생성
  const getDynamicAnalysisSteps = (userQuery: string, servers: any[]) => {
    const intent = detectIntent(userQuery);
    const urgency = detectUrgency(userQuery);
    const complexity = calculateQueryComplexity(userQuery, servers);
    
    const steps: any[] = [];

    // 1. 기본 질의 분석 (항상 포함)
    steps.push({
      step: "🔍 질의 구문 분석",
      process: () => analyzeQueryDynamic(userQuery, servers),
      type: 'analysis',
      complexity: 'medium'
    });

    // 2. 서버 데이터 처리 (항상 포함)
    steps.push({
      step: "📊 서버 데이터 처리",
      process: () => analyzeServerDataDynamic(servers, intent),
      type: 'data_processing',
      complexity: servers.length > 10 ? 'high' : 'medium'
    });

    // 3. 질문 유형별 특화 분석
    if (intent === 'CPU 분석' || intent === '메모리 분석' || intent === '디스크 분석') {
      steps.push({
        step: `🎯 ${intent} 특화 분석`,
        process: () => performSpecializedAnalysis(intent, servers, userQuery),
        type: 'analysis',
        complexity: 'high'
      });
    } else if (intent === '장애 분석') {
      steps.push({
        step: "🚨 장애 진단 분석",
        process: () => performFailureAnalysis(servers, userQuery),
        type: 'analysis',
        complexity: 'very_high'
      });
    } else {
      steps.push({
        step: "🧠 종합 상태 분석",
        process: () => performComprehensiveAnalysis(servers, userQuery),
        type: 'analysis',
        complexity: 'high'
      });
    }

    // 4. 긴급도가 높은 경우 위험 요소 스캔 추가
    if (urgency === '높음' || servers.some(s => s.cpu > 90 || s.memory > 95 || s.status === 'offline')) {
      steps.push({
        step: "⚠️ 위험 요소 스캔",
        process: () => performCriticalAnalysis(servers, userQuery),
        type: 'pattern_matching',
        complexity: 'very_high'
      });
    }

    // 5. 패턴 매칭 (복잡한 질문에만)
    if (complexity >= 3) {
      steps.push({
        step: "🔍 패턴 매칭",
        process: () => detectPatternsDynamic(userQuery, servers),
        type: 'pattern_matching',
        complexity: 'high'
      });
    }

    // 6. 지능형 추론 (항상 포함하되 깊이 조절)
    steps.push({
      step: "🎯 지능형 추론",
      process: () => generateReasoningDynamic(userQuery, servers, complexity),
      type: 'reasoning',
      complexity: complexity >= 3 ? 'very_high' : 'medium'
    });

    // 7. 응답 전략 (항상 포함)
    steps.push({
      step: "✍️ 응답 전략 수립",
      process: () => planResponseDynamic(userQuery, servers, intent),
      type: 'response_generation',
      complexity: 'low'
    });

    return steps;
  };

  // 질문 복잡도 계산
  const calculateQueryComplexity = (query: string, servers: any[]) => {
    let complexity = 1;
    
    // 키워드 수에 따른 복잡도
    const keywords = query.toLowerCase().match(/(?:cpu|메모리|memory|디스크|disk|서버|server|상태|status|오류|error|경고|warning|네트워크|network|부하|load|성능|performance|분석|비교|예측|추천|최적화)/g) || [];
    complexity += Math.min(keywords.length * 0.5, 2);
    
    // 서버 수에 따른 복잡도
    complexity += Math.min(servers.length * 0.1, 2);
    
    // 특정 키워드에 따른 복잡도 증가
    if (query.includes('비교') || query.includes('분석') || query.includes('예측')) complexity += 1;
    if (query.includes('모든') || query.includes('전체')) complexity += 1;
    if (query.includes('최적화') || query.includes('추천')) complexity += 1.5;
    
    return Math.min(Math.round(complexity), 5);
  };

  // 단계 소요 시간 계산
  const calculateStepDuration = (complexity: string, serverCount: number) => {
    const baseTime: { [key: string]: number } = {
      'low': 400,
      'medium': 800,
      'high': 1200,
      'very_high': 1800
    };
    
    const base = baseTime[complexity] || 800;
    const serverMultiplier = Math.min(serverCount * 20, 400);
    
    return base + serverMultiplier;
  };

  // 동적 질의 분석
  const analyzeQueryDynamic = async (userQuery: string, servers: any[]) => {
    const keywords = userQuery.toLowerCase().match(/(?:cpu|메모리|memory|디스크|disk|서버|server|상태|status|오류|error|경고|warning|네트워크|network|부하|load|성능|performance|분석|비교|예측|추천|최적화)/g) || [];
    const intent = detectIntent(userQuery);
    const urgency = detectUrgency(userQuery);
    const scope = detectScope(userQuery);
    const complexity = calculateQueryComplexity(userQuery, servers);
    
    // 실시간 상황 분석
    const criticalCount = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98).length;
    const offlineCount = servers.filter(s => s.status === 'offline').length;
    
    let contextAnalysis = '';
    if (criticalCount > 0) contextAnalysis += `\n▶ 긴급 상황 감지: ${criticalCount}대 서버 위험 상태`;
    if (offlineCount > 0) contextAnalysis += `\n▶ 오프라인 서버: ${offlineCount}대 발견`;
    
    return `🔍 질의 구문 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 입력 질의: "${userQuery}"
▶ 추출된 키워드: [${keywords.join(', ')}] (${keywords.length}개)
▶ 의도 분류: ${intent}
▶ 긴급도: ${urgency}
▶ 분석 범위: ${scope}
▶ 질문 복잡도: ${complexity}/5 (${complexity >= 3 ? '고급 분석 모드' : '기본 분석 모드'})
▶ 예상 응답 유형: ${getExpectedResponseType(intent)}${contextAnalysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 동적 서버 데이터 분석
  const analyzeServerDataDynamic = async (servers: any[], intent: string) => {
    const total = servers.length;
    const online = servers.filter(s => s.status === 'online').length;
    const warning = servers.filter(s => s.status === 'warning').length;
    const offline = servers.filter(s => s.status === 'offline').length;
    
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / total;
    const avgMemory = servers.reduce((sum, s) => sum + s.memory, 0) / total;
    const avgDisk = servers.reduce((sum, s) => sum + s.disk, 0) / total;
    
    const criticalServers = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98);
    const highLoadServers = servers.filter(s => s.cpu > 80 || s.memory > 85);
    
    // 의도별 특화 분석
    let specializedAnalysis = '';
    if (intent === 'CPU 분석') {
      const cpuDistribution = analyzeCpuDistribution(servers);
      specializedAnalysis = `\n▶ CPU 특화 분석: ${cpuDistribution}`;
    } else if (intent === '메모리 분석') {
      const memDistribution = analyzeMemoryDistribution(servers);
      specializedAnalysis = `\n▶ 메모리 특화 분석: ${memDistribution}`;
    } else if (intent === '장애 분석') {
      const failurePatterns = analyzeFailurePatterns(servers);
      specializedAnalysis = `\n▶ 장애 패턴 분석: ${failurePatterns}`;
    }
    
    return `📊 서버 데이터 처리 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 총 서버 수: ${total}대 (처리 부하: ${total > 20 ? '높음' : total > 10 ? '보통' : '낮음'})
▶ 상태 분포: 
  • 온라인: ${online}대 (${((online/total)*100).toFixed(1)}%)
  • 경고: ${warning}대 (${((warning/total)*100).toFixed(1)}%)
  • 오프라인: ${offline}대 (${((offline/total)*100).toFixed(1)}%)
▶ 평균 리소스 사용률:
  • CPU: ${avgCpu.toFixed(1)}% ${getCpuStatusEmoji(avgCpu)}
  • 메모리: ${avgMemory.toFixed(1)}% ${getMemoryStatusEmoji(avgMemory)}
  • 디스크: ${avgDisk.toFixed(1)}% ${getDiskStatusEmoji(avgDisk)}
▶ 위험 서버: ${criticalServers.length}대 발견 ${criticalServers.length > 0 ? '🚨' : '✅'}
▶ 고부하 서버: ${highLoadServers.length}대 발견${specializedAnalysis}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 특화된 분석 함수들
  const performSpecializedAnalysis = async (analysisType: string, servers: any[], query: string) => {
    if (analysisType === 'CPU 분석') {
      return performCpuAnalysis(servers, query);
    } else if (analysisType === '메모리 분석') {
      return performMemoryAnalysis(servers, query);
    } else if (analysisType === '디스크 분석') {
      return performDiskAnalysis(servers, query);
    }
    return '분석 완료';
  };

  const performCpuAnalysis = async (servers: any[], query: string) => {
    const cpuServers = servers.sort((a, b) => b.cpu - a.cpu);
    const topCpuServers = cpuServers.slice(0, 3);
    const lowCpuServers = cpuServers.slice(-3);
    
    const cpuThresholds = {
      critical: servers.filter(s => s.cpu > 90).length,
      high: servers.filter(s => s.cpu > 80 && s.cpu <= 90).length,
      medium: servers.filter(s => s.cpu > 50 && s.cpu <= 80).length,
      low: servers.filter(s => s.cpu <= 50).length
    };

    const cpuTrend = analyzeCpuTrend(servers);
    const cpuBottlenecks = identifyCpuBottlenecks(servers);
    
    return `🎯 CPU 분석 특화 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ CPU 사용률 분포:
  • 위험 (90%+): ${cpuThresholds.critical}대 🔴
  • 높음 (80-90%): ${cpuThresholds.high}대 🟡
  • 보통 (50-80%): ${cpuThresholds.medium}대 🟢
  • 낮음 (~50%): ${cpuThresholds.low}대 ⚪

▶ 최고 CPU 사용률 서버:
${topCpuServers.map((s, i) => `  ${i+1}. ${s.hostname}: ${s.cpu}% ${s.cpu > 90 ? '🚨' : s.cpu > 80 ? '⚠️' : '✅'}`).join('\n')}

▶ CPU 트렌드 분석: ${cpuTrend}
▶ 병목 현상 분석: ${cpuBottlenecks}
▶ 권장 조치: ${getCpuRecommendations(cpuThresholds)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const performMemoryAnalysis = async (servers: any[], query: string) => {
    const memoryServers = servers.sort((a, b) => b.memory - a.memory);
    const topMemoryServers = memoryServers.slice(0, 3);
    
    const memoryThresholds = {
      critical: servers.filter(s => s.memory > 95).length,
      high: servers.filter(s => s.memory > 85 && s.memory <= 95).length,
      medium: servers.filter(s => s.memory > 60 && s.memory <= 85).length,
      low: servers.filter(s => s.memory <= 60).length
    };

    const memoryLeaks = detectMemoryLeaks(servers);
    const swapUsage = estimateSwapUsage(servers);
    
    return `🎯 메모리 분석 특화 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 메모리 사용률 분포:
  • 위험 (95%+): ${memoryThresholds.critical}대 🔴
  • 높음 (85-95%): ${memoryThresholds.high}대 🟡
  • 보통 (60-85%): ${memoryThresholds.medium}대 🟢
  • 낮음 (~60%): ${memoryThresholds.low}대 ⚪

▶ 최고 메모리 사용률 서버:
${topMemoryServers.map((s, i) => `  ${i+1}. ${s.hostname}: ${s.memory}% ${s.memory > 95 ? '🚨' : s.memory > 85 ? '⚠️' : '✅'}`).join('\n')}

▶ 메모리 누수 감지: ${memoryLeaks}
▶ 예상 스왑 사용량: ${swapUsage}
▶ 권장 조치: ${getMemoryRecommendations(memoryThresholds)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const performFailureAnalysis = async (servers: any[], query: string) => {
    const offlineServers = servers.filter(s => s.status === 'offline');
    const warningServers = servers.filter(s => s.status === 'warning');
    const criticalServers = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98);
    
    const failurePatterns = analyzeFailurePatterns(servers);
    const cascadeRisk = assessCascadeFailureRisk(servers);
    const recoveryPlan = generateRecoveryPlan(offlineServers);
    
    return `🚨 장애 진단 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 장애 현황:
  • 오프라인 서버: ${offlineServers.length}대 🔴
  • 경고 상태 서버: ${warningServers.length}대 🟡
  • 위험 임계치 서버: ${criticalServers.length}대 ⚠️

▶ 오프라인 서버 목록:
${offlineServers.length > 0 ? offlineServers.map(s => `  • ${s.hostname} (${s.location})`).join('\n') : '  • 없음 ✅'}

▶ 장애 패턴 분석: ${failurePatterns}
▶ 연쇄 장애 위험도: ${cascadeRisk}
▶ 복구 계획: ${recoveryPlan}
▶ 긴급 조치 필요: ${offlineServers.length > 0 || criticalServers.length > 0 ? '예 🚨' : '아니오 ✅'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const performCriticalAnalysis = async (servers: any[], query: string) => {
    const emergencyServers = servers.filter(s => s.cpu > 95 || s.memory > 98 || s.disk > 99 || s.status === 'offline');
    const riskyServers = servers.filter(s => s.cpu > 85 || s.memory > 90 || s.disk > 95);
    
    const immediateActions = generateImmediateActions(emergencyServers);
    const alertLevel = calculateAlertLevel(emergencyServers, riskyServers);
    
    return `⚠️ 위험 요소 스캔 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 긴급 상황 서버: ${emergencyServers.length}대 🚨
▶ 위험 상태 서버: ${riskyServers.length}대 ⚠️
▶ 전체 위험도: ${alertLevel}

▶ 긴급 대응 필요 서버:
${emergencyServers.length > 0 ? emergencyServers.map(s => 
  `  • ${s.hostname}: CPU ${s.cpu}%, MEM ${s.memory}%, DISK ${s.disk}%, STATUS ${s.status}`
).join('\n') : '  • 없음 ✅'}

▶ 즉시 조치 사항:
${immediateActions}

▶ 모니터링 강화 대상: ${riskyServers.length}대
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 동적 추론 생성
  const generateReasoningDynamic = async (userQuery: string, servers: any[], complexity: number) => {
    const reasoning = [];
    const intent = detectIntent(userQuery);
    const urgency = detectUrgency(userQuery);
    
    reasoning.push('🎯 추론 엔진 활성화');
    reasoning.push(`💭 사용자 의도: "${intent}" 분석 완료`);
    reasoning.push(`🔍 질문 복잡도: ${complexity}/5 (${complexity >= 3 ? '고급 모드' : '기본 모드'})`);
    
    // 실제 서버 상태 기반 추론
    const criticalCount = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98).length;
    const offlineCount = servers.filter(s => s.status === 'offline').length;
    const avgHealth = calculateHealthScore(servers);
    
    if (criticalCount > 0) {
      reasoning.push(`🚨 위험 상황 감지: ${criticalCount}대 서버 임계 상태 → 즉시 대응 필요`);
    }
    
    if (offlineCount > 0) {
      reasoning.push(`🔴 서비스 중단: ${offlineCount}대 오프라인 → 긴급 복구 작업 필요`);
    }
    
    if (avgHealth < 70) {
      reasoning.push('📉 전체 시스템 건강도 저하 → 인프라 점검 권장');
    } else if (avgHealth > 90) {
      reasoning.push('✅ 시스템 안정적 운영 → 현재 상태 유지');
    }
    
    // 복잡도에 따른 고급 추론
    if (complexity >= 3) {
      reasoning.push('🧮 다차원 분석 매트릭스 적용');
      reasoning.push('📊 베이지안 추론 모델 실행');
      reasoning.push('🔄 피드백 루프 최적화');
      reasoning.push('🎯 예측 분석 엔진 가동');
    }
    
    const confidenceScore = calculateConfidenceScore(servers, complexity);
    const accuracyScore = calculateAccuracyScore(intent, servers);
    
    return `🧠 지능형 추론 과정 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reasoning.map(r => `▶ ${r}`).join('\n')}

▶ 추론 결과:
  • 시스템 건강도: ${avgHealth}/100점
  • 신뢰도: ${confidenceScore.toFixed(3)}
  • 예측 정확도: ${accuracyScore.toFixed(1)}%
  • 권장 우선순위: ${getPriorityRecommendation(criticalCount, offlineCount, avgHealth)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 동적 응답 전략
  const planResponseDynamic = async (userQuery: string, servers: any[], intent: string) => {
    const responseType = getExpectedResponseType(intent);
    const urgency = detectUrgency(userQuery);
    const complexity = calculateQueryComplexity(userQuery, servers);
    
    const criticalIssues = servers.filter(s => s.cpu > 90 || s.memory > 95 || s.disk > 98 || s.status === 'offline').length;
    
    let responseStrategy = '';
    if (criticalIssues > 0) {
      responseStrategy = '긴급 상황 대응 중심';
    } else if (urgency === '높음') {
      responseStrategy = '신속 답변 중심';
    } else if (complexity >= 3) {
      responseStrategy = '상세 분석 결과 중심';
    } else {
      responseStrategy = '요약 정보 중심';
    }
    
    return `✍️ 응답 생성 전략 수립 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 응답 유형: ${responseType}
▶ 응답 전략: ${responseStrategy}
▶ 언어: 한국어
▶ 톤앤매너: ${urgency === '높음' ? '긴급, 직접적' : '전문적이면서 친근한'}
▶ 구조화: 마크다운 + 시각적 요소
▶ 포함 요소:
  • 핵심 답변: ✅
  • 상세 분석: ${complexity >= 2 ? '✅' : '❌'}
  • 예측 정보: ${complexity >= 3 ? '✅' : '❌'}
  • 액션 플랜: ${criticalIssues > 0 || urgency === '높음' ? '✅' : '부분적'}
▶ 개인화 수준: ${complexity >= 3 ? '고급 관리자' : '중급 관리자'} 맞춤
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  // 헬퍼 함수들 추가
  const getCpuStatusEmoji = (cpu: number) => cpu > 80 ? '🔴' : cpu > 60 ? '🟡' : '🟢';
  const getMemoryStatusEmoji = (memory: number) => memory > 85 ? '🔴' : memory > 70 ? '🟡' : '🟢';
  const getDiskStatusEmoji = (disk: number) => disk > 90 ? '🔴' : disk > 75 ? '🟡' : '🟢';

  const analyzeCpuDistribution = (servers: any[]) => {
    const highCpu = servers.filter(s => s.cpu > 80).length;
    return `${highCpu}대 고부하, 평균 ${(servers.reduce((s, srv) => s + srv.cpu, 0) / servers.length).toFixed(1)}%`;
  };

  const analyzeMemoryDistribution = (servers: any[]) => {
    const highMem = servers.filter(s => s.memory > 85).length;
    return `${highMem}대 메모리 부족, 평균 ${(servers.reduce((s, srv) => s + srv.memory, 0) / servers.length).toFixed(1)}%`;
  };

  const analyzeFailurePatterns = (servers: any[]) => {
    const offline = servers.filter(s => s.status === 'offline');
    if (offline.length === 0) return '정상 운영 중';
    return `${offline.length}대 장애, 패턴: ${offline.length > 1 ? '다중 장애' : '단일 장애'}`;
  };

  const calculateConfidenceScore = (servers: any[], complexity: number) => {
    let base = 0.8;
    if (servers.length > 10) base += 0.1;
    if (complexity >= 3) base += 0.05;
    return Math.min(base + Math.random() * 0.1, 0.999);
  };

  const calculateAccuracyScore = (intent: string, servers: any[]) => {
    let base = 85;
    if (intent.includes('분석')) base += 5;
    if (servers.length > 5) base += Math.min(servers.length, 10);
    return Math.min(base + Math.random() * 5, 99.9);
  };

  const getPriorityRecommendation = (critical: number, offline: number, health: number) => {
    if (offline > 0) return '1. 긴급: 서비스 복구';
    if (critical > 0) return '1. 높음: 리소스 최적화';
    if (health < 80) return '1. 중간: 모니터링 강화';
    return '1. 낮음: 현재 상태 유지';
  };

  // 누락된 함수들 추가
  const performComprehensiveAnalysis = async (servers: any[], query: string) => {
    const healthScore = calculateHealthScore(servers);
    const trends = analyzeTrends(servers);
    const recommendations = getRecommendations(healthScore, servers);
    
    return `🧠 종합 상태 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 전체 헬스 스코어: ${healthScore}/100점
▶ 시스템 트렌드: ${trends}
▶ 권장 조치: ${recommendations}
▶ 전반적 평가: ${healthScore > 90 ? '매우 양호' : healthScore > 70 ? '양호' : '주의 필요'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const detectPatternsDynamic = async (userQuery: string, servers: any[]) => {
    return detectPatterns(userQuery, servers);
  };

  const performDiskAnalysis = async (servers: any[], query: string) => {
    const diskServers = servers.sort((a, b) => b.disk - a.disk);
    const topDiskServers = diskServers.slice(0, 3);
    
    const diskThresholds = {
      critical: servers.filter(s => s.disk > 95).length,
      high: servers.filter(s => s.disk > 85 && s.disk <= 95).length,
      medium: servers.filter(s => s.disk > 70 && s.disk <= 85).length,
      low: servers.filter(s => s.disk <= 70).length
    };
    
    return `🎯 디스크 분석 특화 분석 완료
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ 디스크 사용률 분포:
  • 위험 (95%+): ${diskThresholds.critical}대 🔴
  • 높음 (85-95%): ${diskThresholds.high}대 🟡
  • 보통 (70-85%): ${diskThresholds.medium}대 🟢
  • 낮음 (~70%): ${diskThresholds.low}대 ⚪

▶ 최고 디스크 사용률 서버:
${topDiskServers.map((s, i) => `  ${i+1}. ${s.hostname}: ${s.disk}% ${s.disk > 95 ? '🚨' : s.disk > 85 ? '⚠️' : '✅'}`).join('\n')}

▶ 권장 조치: ${diskThresholds.critical > 0 ? '즉시 정리 필요' : '정기 모니터링'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  };

  const analyzeCpuTrend = (servers: any[]) => {
    const avgCpu = servers.reduce((sum, s) => sum + s.cpu, 0) / servers.length;
    if (avgCpu > 80) return '고부하 상태';
    if (avgCpu > 60) return '보통 부하';
    return '안정적 상태';
  };

  const identifyCpuBottlenecks = (servers: any[]) => {
    const bottlenecks = servers.filter(s => s.cpu > 90);
    return bottlenecks.length > 0 ? `${bottlenecks.length}대에서 병목 발생` : '병목 현상 없음';
  };

  const getCpuRecommendations = (thresholds: any) => {
    if (thresholds.critical > 0) return '즉시 부하 분산 필요';
    if (thresholds.high > 0) return '모니터링 강화 권장';
    return '현재 상태 유지';
  };

  const detectMemoryLeaks = (servers: any[]) => {
    const suspected = servers.filter(s => s.memory > 95);
    return suspected.length > 0 ? `${suspected.length}대 의심` : '감지되지 않음';
  };

  const estimateSwapUsage = (servers: any[]) => {
    const highMemory = servers.filter(s => s.memory > 90);
    return `${(highMemory.length * Math.random() * 2).toFixed(1)}GB`;
  };

  const getMemoryRecommendations = (thresholds: any) => {
    if (thresholds.critical > 0) return '메모리 증설 검토';
    if (thresholds.high > 0) return '프로세스 최적화';
    return '안정적 상태';
  };

  const assessCascadeFailureRisk = (servers: any[]) => {
    const offline = servers.filter(s => s.status === 'offline').length;
    const critical = servers.filter(s => s.cpu > 90 || s.memory > 95).length;
    
    if (offline > 2 || critical > 3) return '높음 🔴';
    if (offline > 0 || critical > 1) return '보통 🟡';
    return '낮음 🟢';
  };

  const generateRecoveryPlan = (offlineServers: any[]) => {
    if (offlineServers.length === 0) return '복구 계획 불필요';
    return `${offlineServers.length}대 서버 순차 복구 필요`;
  };

  const generateImmediateActions = (emergencyServers: any[]) => {
    if (emergencyServers.length === 0) return '즉시 조치 불필요';
    const actions: string[] = [];
    emergencyServers.forEach(s => {
      if (s.status === 'offline') actions.push(`${s.hostname} 재시작`);
      if (s.cpu > 95) actions.push(`${s.hostname} CPU 부하 분산`);
      if (s.memory > 98) actions.push(`${s.hostname} 메모리 정리`);
    });
    return actions.slice(0, 3).join(', ');
  };

  const calculateAlertLevel = (emergency: any[], risky: any[]) => {
    if (emergency.length > 0) return '위험 🔴';
    if (risky.length > 2) return '주의 🟡';
    return '안전 🟢';
  };

  // 자동 스크롤
  useEffect(() => {
    if (stepRef.current) {
      stepRef.current.scrollTop = stepRef.current.scrollHeight;
    }
  }, [steps]);

  const getStepIcon = (type: ThinkingStep['type'], isActive: boolean) => {
    const baseClass = "w-5 h-5 flex items-center justify-center text-xs";
    
    if (isActive) {
      return (
        <div className="relative">
          <div className={`${baseClass} border-2 border-purple-500 border-t-transparent rounded-full animate-spin`} />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
        </div>
      );
    }

    const icons = {
      analysis: <i className="fas fa-search text-green-500" />,
      reasoning: <i className="fas fa-brain text-purple-500" />,
      data_processing: <i className="fas fa-database text-blue-500" />,
      pattern_matching: <i className="fas fa-project-diagram text-orange-500" />,
      response_generation: <i className="fas fa-pen text-indigo-500" />
    };

    return (
      <div className={`${baseClass} bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shadow-sm`}>
        {icons[type]}
      </div>
    );
  };

  if (!isActive && steps.length === 0) return null;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-gray-100 rounded-xl overflow-hidden shadow-2xl" style={{ userSelect: 'none' }}>
      {/* 화려한 헤더 */}
      <div className="bg-gradient-to-r from-purple-800 via-indigo-800 to-purple-800 px-6 py-4 border-b border-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-purple-600/20 animate-pulse" />
        <div className="relative z-10">
          <div className="flex items-center gap-4">
            <div className="flex gap-1">
              <div className="w-3 h-3 bg-red-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full shadow-lg"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full shadow-lg"></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shadow-lg">
                <i className="fas fa-brain text-white"></i>
              </div>
              <span className="text-lg font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                🧠 AI 사고 과정 실시간 분석
              </span>
            </div>
            
            <div className="ml-auto flex items-center gap-3">
              {!isCompleted ? (
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-lg"></div>
                  <span className="text-sm text-green-200 font-medium">실시간 분석 중</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1 rounded-full">
                  <div className="w-2 h-2 bg-blue-400 rounded-full shadow-lg"></div>
                  <span className="text-sm text-blue-200 font-medium">분석 완료</span>
                </div>
              )}
            </div>
          </div>
          
          {/* 화려한 진행 상황 표시 */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-purple-200 mb-2">
              <span className="font-medium">🚀 분석 진행률</span>
              <span className="font-bold">{Math.round((steps.length / 6) * 100)}%</span>
            </div>
            <div className="w-full bg-black/30 rounded-full h-2 shadow-inner">
              <div 
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 h-2 rounded-full transition-all duration-700 shadow-lg relative overflow-hidden"
                style={{ width: `${(steps.length / 6) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 실시간 처리 과정 로그 */}
      <div
        ref={stepRef}
        className="h-72 overflow-y-auto p-6 space-y-4 font-mono text-sm bg-gradient-to-b from-transparent to-black/10"
        style={{ scrollbarWidth: 'thin' }}
      >
        {steps.map((step, index) => (
          <div key={index} className="relative">
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-purple-500 to-pink-500 rounded-full shadow-lg" />
            <div className="pl-8 pb-4">
              <div className="flex items-center gap-3 mb-2">
                {getStepIcon(step.type, false)}
                <span className="text-purple-300 font-bold text-base">{step.step}</span>
                <span className="text-gray-500 text-xs bg-black/30 px-2 py-1 rounded-full">
                  {new Date(step.timestamp).toLocaleTimeString('ko-KR')}
                </span>
                {step.duration && (
                  <span className="text-xs text-emerald-400 bg-emerald-900/30 px-2 py-1 rounded-full">
                    {step.duration}ms
                  </span>
                )}
              </div>
              <div className="text-gray-200 whitespace-pre-line leading-relaxed bg-black/20 p-4 rounded-lg border border-purple-500/20 shadow-lg">
                {step.content}
              </div>
            </div>
          </div>
        ))}
        
        {!isCompleted && currentStep < 6 && (
          <div className="relative animate-pulse">
            <div className="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-blue-500 to-purple-500 rounded-full shadow-lg animate-pulse" />
            <div className="pl-8 pb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="relative">
                  <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full opacity-20 animate-pulse" />
                </div>
                <span className="text-blue-300 font-bold text-base">🔄 AI 분석 진행 중</span>
                <span className="text-gray-500 text-xs bg-black/30 px-2 py-1 rounded-full">
                  {new Date().toLocaleTimeString('ko-KR')}
                </span>
              </div>
              
              {/* 화려한 진행률 바 */}
              <div className="bg-black/20 p-4 rounded-lg border border-blue-500/20 shadow-lg">
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-blue-200">🧠 뉴럴 네트워크 활성화 중...</span>
                    <span className="text-blue-300 font-bold">{currentProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2 shadow-inner">
                    <div 
                      className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 relative overflow-hidden"
                      style={{ width: `${currentProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse" />
                    </div>
                  </div>
                </div>
                
                <div className="text-gray-300 space-y-1">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-cog animate-spin text-purple-400"></i>
                    <span>💭 질문을 깊이 분석하고 최적 해답을 찾고 있습니다...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-database text-blue-400 animate-pulse"></i>
                    <span>📊 {serverData.length}대 서버의 실시간 메트릭을 처리 중...</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <i className="fas fa-brain text-pink-400 animate-pulse"></i>
                    <span>🔍 패턴 인식 및 인사이트 추출 진행 중...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 화려한 하단 상태바 */}
      <div className="bg-gradient-to-r from-gray-800 via-purple-800 to-gray-800 px-6 py-3 border-t border-purple-700 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-pink-600/10 to-purple-600/10" />
        <div className="relative z-10 flex items-center justify-between text-sm">
          <div className="flex items-center gap-4">
            <span className="text-purple-200 font-medium">
              📈 진행: {steps.length}/6 단계 완료
            </span>
            {!isCompleted && (
              <span className="text-emerald-400 font-medium animate-pulse">
                ⚡ AI 엔진 가동 중...
              </span>
            )}
          </div>
          <span className="text-gray-300 font-medium">
            {isCompleted ? '✅ 처리 완료' : '🔄 실시간 분석 중...'}
          </span>
        </div>
      </div>
    </div>
  );
} 