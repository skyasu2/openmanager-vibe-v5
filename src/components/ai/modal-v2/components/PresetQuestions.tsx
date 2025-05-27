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
    text: '현재 서버 상태 요약해줘',
    type: 'basic',
    icon: <Server className="w-4 h-4" />,
    category: '상태 확인',
    description: '전체 서버 현황 한눈에 보기'
  },
  {
    id: 'high-cpu',
    text: 'CPU 사용률이 높은 서버 알려줘',
    type: 'basic',
    icon: <Cpu className="w-4 h-4" />,
    category: 'CPU 분석',
    description: 'CPU 부하가 높은 서버 찾기'
  },
  {
    id: 'memory-check',
    text: '메모리 부족한 서버가 있어?',
    type: 'basic',
    icon: <Activity className="w-4 h-4" />,
    category: '메모리 분석',
    description: '메모리 사용량 점검'
  },
  {
    id: 'offline-servers',
    text: '오프라인 서버 체크해줘',
    type: 'basic',
    icon: <AlertTriangle className="w-4 h-4" />,
    category: '장애 확인',
    description: '접속 불가 서버 확인'
  },
  {
    id: 'disk-space',
    text: '디스크 용량 부족한 곳 있어?',
    type: 'basic',
    icon: <HardDrive className="w-4 h-4" />,
    category: '디스크 분석',
    description: '저장공간 부족 서버 찾기'
  },
  {
    id: 'network-latency',
    text: '네트워크 지연이 심한 서버는?',
    type: 'basic',
    icon: <Network className="w-4 h-4" />,
    category: '네트워크 분석',
    description: '응답시간 지연 서버 확인'
  },
  {
    id: 'recent-changes',
    text: '최근 1시간동안 변화가 큰 서버는?',
    type: 'basic',
    icon: <TrendingUp className="w-4 h-4" />,
    category: '트렌드 분석',
    description: '급격한 변화 감지'
  },
  {
    id: 'average-performance',
    text: '전체 서버 평균 성능은 어때?',
    type: 'basic',
    icon: <BarChart3 className="w-4 h-4" />,
    category: '성능 분석',
    description: '전체 인프라 성능 지표'
  },
  {
    id: 'service-interruption',
    text: '서비스 중단된 곳이 있어?',
    type: 'basic',
    icon: <Clock className="w-4 h-4" />,
    category: '서비스 확인',
    description: '서비스 가용성 점검'
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

  // 프리셋 질문 조합 생성 (기본 3개 + 고급 1개)
  const generatePresetQuestions = () => {
    const contextual = generateContextualQuestions();
    const availableBasic = [...basicQuestions, ...contextual];
    
    // 기본 질문 3개 랜덤 선택
    const shuffledBasic = [...availableBasic].sort(() => Math.random() - 0.5);
    const selectedBasic = shuffledBasic.slice(0, 3);
    
    // 고급 질문 1개 랜덤 선택
    const shuffledAdvanced = [...advancedQuestions].sort(() => Math.random() - 0.5);
    const selectedAdvanced = shuffledAdvanced.slice(0, 1);
    
    return [...selectedBasic, ...selectedAdvanced];
  };

  // 새로고침 핸들러
  const handleRefresh = async () => {
    setIsRefreshing(true);
    
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

  // 초기 질문 생성
  useEffect(() => {
    setSelectedQuestions(generatePresetQuestions());
  }, [currentServerData]);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4 border border-blue-100">
      {/* 헤더 섹션 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h3 className="text-lg font-semibold text-gray-800">💡 추천 질문</h3>
          <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full">
            기본 3개 + 고급 1개
          </span>
        </div>
        
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="flex items-center space-x-1 px-3 py-1.5 bg-white border border-gray-200 rounded-md hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="text-sm font-medium">새로고침</span>
        </button>
      </div>

      {/* 도움말 */}
      <p className="text-xs text-gray-600 mb-4">
        질문을 클릭해도 새로운 추천이 계속 표시됩니다
      </p>

      {/* 질문 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {selectedQuestions.map((question) => (
          <button
            key={question.id}
            onClick={() => handleQuestionClick(question)}
            className={`
              p-4 rounded-lg border text-left transition-all duration-200 hover:shadow-md
              ${question.type === 'basic' 
                ? 'bg-white border-gray-200 hover:bg-gray-50' 
                : 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 hover:from-purple-100 hover:to-indigo-100'
              }
            `}
          >
            <div className="flex items-start space-x-3">
              {/* 아이콘 */}
              <div className={`
                p-2 rounded-md flex-shrink-0
                ${question.type === 'basic' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}
              `}>
                {question.icon}
              </div>
              
              {/* 내용 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className={`
                    text-xs px-2 py-0.5 rounded-full font-medium
                    ${question.type === 'basic' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-purple-100 text-purple-700'
                    }
                  `}>
                    {question.type === 'basic' ? '기본' : '고급'}
                  </span>
                  <span className="text-xs text-gray-500">{question.category}</span>
                </div>
                
                <p className="text-sm font-medium text-gray-900 mb-1 line-clamp-2">
                  {question.text}
                </p>
                
                {question.description && (
                  <p className="text-xs text-gray-600 line-clamp-1">
                    {question.description}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
} 