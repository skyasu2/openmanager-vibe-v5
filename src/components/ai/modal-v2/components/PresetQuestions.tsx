'use client';

import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Zap, 
  Brain, 
  AlertTriangle, 
  TrendingUp,
  Server,
  Cpu,
  HardDrive,
  Network,
  Activity,
  Shield,
  DollarSign,
  Target,
  BarChart3,
  Clock
} from 'lucide-react';

interface PresetQuestion {
  id: string;
  text: string;
  type: 'basic' | 'advanced';
  icon: React.ReactNode;
  category: string;
  description?: string;
}

interface PresetQuestionsProps {
  onQuestionSelect: (question: string) => void;
  currentServerData?: any;
}

const basicQuestions: PresetQuestion[] = [
  {
    id: 'status-summary',
    text: '📊 전체 서버 상태 요약',
    type: 'basic',
    icon: <Server className="w-4 h-4" />,
    category: '상태 확인',
    description: '현재 전체 서버 평균 성능을 요약합니다'
  },
  {
    id: 'service-response',
    text: '⚙️ 개별 서비스 응답속도 분석',
    type: 'basic',
    icon: <Activity className="w-4 h-4" />,
    category: '응답성 분석',
    description: '서비스별 응답속도 추이를 분석하고 병목 지점을 찾습니다'
  },
  {
    id: 'critical-detection',
    text: '🔥 심각 장애 탐지 여부',
    type: 'basic',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: '장애 탐지',
    description: '지금 장애가 발생한 서버가 있는지 즉시 확인합니다'
  },
  {
    id: 'ai-behavior-analysis',
    text: '🧠 AI 분석 요약 보기',
    type: 'basic',
    icon: <Brain className="w-4 h-4" />,
    category: 'AI 분석',
    description: '최근 10분간 이상 행동 패턴을 AI가 분석해 드립니다'
  },
  {
    id: 'cpu-performance',
    text: '💻 CPU 성능 이슈 진단',
    type: 'basic',
    icon: <Cpu className="w-4 h-4" />,
    category: 'CPU 진단',
    description: 'CPU 사용률이 높은 서버와 원인을 분석합니다'
  },
  {
    id: 'memory-optimization',
    text: '🧩 메모리 최적화 제안',
    type: 'basic',
    icon: <Activity className="w-4 h-4" />,
    category: '메모리 최적화',
    description: '메모리 부족 서버를 찾고 최적화 방안을 제시합니다'
  },
  {
    id: 'network-latency-analysis',
    text: '🌐 네트워크 지연 원인 분석',
    type: 'basic',
    icon: <Network className="w-4 h-4" />,
    category: '네트워크 진단',
    description: '네트워크 지연이 심한 서버와 개선 방법을 알려드립니다'
  },
  {
    id: 'disk-space-management',
    text: '💾 디스크 용량 관리 전략',
    type: 'basic',
    icon: <HardDrive className="w-4 h-4" />,
    category: '디스크 관리',
    description: '디스크 용량 부족 위험과 정리 방안을 제안합니다'
  },
  {
    id: 'recent-trend-analysis',
    text: '📈 최근 성능 트렌드 분석',
    type: 'basic',
    icon: <TrendingUp className="w-4 h-4" />,
    category: '트렌드 분석',
    description: '최근 1시간동안 급격한 변화가 있는 서버를 추적합니다'
  }
];

const advancedQuestions: PresetQuestion[] = [
  {
    id: 'comprehensive-analysis',
    text: '전체 인프라 상태를 종합 분석하고 잠재적 위험 요소와 개선 방안을 제시해줘',
    type: 'advanced',
    icon: <Brain className="w-4 h-4" />,
    category: '종합 분석',
    description: '전체 인프라 심층 분석 및 개선안'
  },
  {
    id: 'capacity-planning',
    text: '리소스 사용 패턴을 분석해서 용량 계획과 최적화 전략을 수립해줘',
    type: 'advanced',
    icon: <Target className="w-4 h-4" />,
    category: '용량 계획',
    description: '리소스 최적화 및 확장 계획'
  },
  {
    id: 'performance-optimization',
    text: '현재 성능 병목지점을 찾아내고 해결 우선순위와 구체적인 액션플랜을 만들어줘',
    type: 'advanced',
    icon: <Zap className="w-4 h-4" />,
    category: '성능 최적화',
    description: '병목 해결 및 성능 향상 전략'
  },
  {
    id: 'preventive-maintenance',
    text: '서버별 장애 위험도를 평가하고 예방적 유지보수 계획을 세워줘',
    type: 'advanced',
    icon: <Shield className="w-4 h-4" />,
    category: '예방 관리',
    description: '장애 예방 및 유지보수 계획'
  },
  {
    id: 'cost-optimization',
    text: '인프라 비용 최적화를 위한 서버 통합 및 리소스 재배치 전략을 제안해줘',
    type: 'advanced',
    icon: <DollarSign className="w-4 h-4" />,
    category: '비용 최적화',
    description: '비용 절감 및 효율성 향상'
  },
  {
    id: 'security-analysis',
    text: '보안 관점에서 취약점을 분석하고 강화 방안을 포함한 보안 로드맵을 만들어줘',
    type: 'advanced',
    icon: <Shield className="w-4 h-4" />,
    category: '보안 분석',
    description: '보안 취약점 분석 및 강화 방안'
  }
];

export default function PresetQuestions({ onQuestionSelect, currentServerData }: PresetQuestionsProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<PresetQuestion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lastRefreshTime, setLastRefreshTime] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);

  // 맥락적 질문 생성
  const generateContextualQuestions = (): PresetQuestion[] => {
    const contextual: PresetQuestion[] = [];
    
    if (currentServerData?.criticalServers > 0) {
      contextual.push({
        id: 'critical-urgent',
        text: `긴급! ${currentServerData.criticalServers}대 서버가 위험 상태야. 즉시 대응 방안 알려줘`,
        type: 'basic',
        icon: <AlertTriangle className="w-4 h-4" />,
        category: '긴급 대응',
        description: '즉시 조치 필요한 서버'
      });
    }

    if (currentServerData?.warningServers > 2) {
      contextual.push({
        id: 'warning-pattern',
        text: `${currentServerData.warningServers}대 서버에 경고가 있어. 패턴 분석해줘`,
        type: 'basic',
        icon: <TrendingUp className="w-4 h-4" />,
        category: '패턴 분석',
        description: '경고 패턴 및 원인 분석'
      });
    }

    return contextual;
  };

  // 프리셋 질문 조합 생성 (기본 3개 + 고급 1개) - 더 안정적인 랜덤
  const generatePresetQuestions = () => {
    const contextual = generateContextualQuestions();
    const availableBasic = [...basicQuestions, ...contextual];
    
    // 시드 기반 랜덤으로 더 안정적인 선택
    const seed = Math.floor(Date.now() / (5 * 60 * 1000)); // 5분마다 변경
    const seededRandom = (index: number) => {
      const x = Math.sin(seed + index) * 10000;
      return x - Math.floor(x);
    };
    
    // 기본 질문 3개 시드 랜덤 선택
    const shuffledBasic = availableBasic
      .map((item, index) => ({ item, sort: seededRandom(index) }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
    const selectedBasic = shuffledBasic.slice(0, 3);
    
    // 고급 질문 1개 시드 랜덤 선택
    const shuffledAdvanced = advancedQuestions
      .map((item, index) => ({ item, sort: seededRandom(index + 100) }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ item }) => item);
    const selectedAdvanced = shuffledAdvanced.slice(0, 1);
    
    return [...selectedBasic, ...selectedAdvanced];
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true);
    setLastRefreshTime(Date.now());
    
    // 300ms 애니메이션
    setTimeout(() => {
      setSelectedQuestions(generatePresetQuestions());
      setIsRefreshing(false);
    }, 300);
  };

  // 질문 선택 핸들러
  const handleQuestionClick = (question: PresetQuestion) => {
    onQuestionSelect(question.text);
  };

  // 좌우 스크롤 핸들러
  const handlePrevious = () => {
    setCurrentIndex(prev => Math.max(0, prev - 2));
  };

  const handleNext = () => {
    setCurrentIndex(prev => Math.min(selectedQuestions.length - 2, prev + 2));
  };

  // 초기 질문 생성 (한 번만)
  useEffect(() => {
    if (!isInitialized) {
      setSelectedQuestions(generatePresetQuestions());
      setLastRefreshTime(Date.now());
      setIsInitialized(true);
    }
  }, [isInitialized]);

  // 5분마다 자동 새로고침 (별도 useEffect)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastRefreshTime >= 300000) { // 300초 = 5분
        console.log('⏰ 추천 질문 자동 갱신 (5분 경과)');
        setSelectedQuestions(generatePresetQuestions());
        setLastRefreshTime(now);
      }
    }, 10000); // 10초마다 체크 (부하 감소)
    
    return () => clearInterval(interval);
  }, [lastRefreshTime]);

  // 서버 데이터 변경 시에만 갱신
  useEffect(() => {
    if (isInitialized && currentServerData?.criticalServers > 0) {
      console.log('🚨 긴급 서버 상황 감지 - 추천 질문 갱신');
      setSelectedQuestions(generatePresetQuestions());
      setLastRefreshTime(Date.now());
    }
  }, [currentServerData?.criticalServers, isInitialized]);

  const visibleQuestions = selectedQuestions.slice(currentIndex, currentIndex + 2);
  const canGoPrevious = currentIndex > 0;
  const canGoNext = currentIndex + 2 < selectedQuestions.length;

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3 mb-3 border border-blue-100">
      {/* 컴팩트 헤더 */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <h4 className="text-sm font-semibold text-gray-800">💡 추천 질문</h4>
          <span className="bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">
            5분마다 갱신
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          {/* 좌우 네비게이션 */}
          <button
            onClick={handlePrevious}
            disabled={!canGoPrevious}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-left text-xs"></i>
          </button>
          
          <span className="text-xs text-gray-500 px-2">
            {Math.floor(currentIndex / 2) + 1}/{Math.ceil(selectedQuestions.length / 2)}
          </span>
          
          <button
            onClick={handleNext}
            disabled={!canGoNext}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <i className="fas fa-chevron-right text-xs"></i>
          </button>
          
          <div className="w-px h-4 bg-gray-300 mx-1"></div>
          
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
            title="수동 새로고침"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 컴팩트 질문 그리드 (2칸) */}
      <div className="grid grid-cols-2 gap-2">
        {visibleQuestions.map((question) => (
          <div key={question.id} className="relative group">
            <button
              onClick={() => handleQuestionClick(question)}
              className={`
                w-full p-2 rounded-md border text-left transition-all duration-200 hover:shadow-md
                ${question.type === 'basic' 
                  ? 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300' 
                  : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100 hover:border-purple-300'
                }
                group-hover:transform group-hover:scale-[1.02]
              `}
            >
              <div className="flex items-start space-x-2">
                {/* 작은 아이콘 */}
                <div className={`
                  p-1 rounded flex-shrink-0
                  ${question.type === 'basic' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}
                `}>
                  <div className="w-3 h-3">
                    {question.icon}
                  </div>
                </div>
                
                {/* 내용 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className={`
                      text-xs px-1 py-0.5 rounded font-medium
                      ${question.type === 'basic' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-purple-100 text-purple-700'
                      }
                    `}>
                      {question.type === 'basic' ? '기본' : '고급'}
                    </span>
                    <span className="text-gray-400 text-xs">💡</span>
                  </div>
                  
                  <p className="text-xs font-medium text-gray-900 line-clamp-2 leading-tight">
                    {question.text}
                  </p>
                </div>
              </div>
            </button>
            
            {/* 툴팁 */}
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap max-w-xs">
              {question.description}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 