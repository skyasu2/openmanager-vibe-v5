'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Clock,
  ChevronDown,
  Play,
  CheckCircle,
  Loader,
  Eye
} from 'lucide-react';

interface PresetQuestion {
  id: string;
  title: string; // 짧은 제목
  fullText: string; // 전체 질문
  type: 'basic' | 'advanced';
  icon: React.ReactNode;
  category: string;
  color: string;
}

interface EngineLog {
  timestamp: string;
  step: string;
  duration: number;
  success: boolean;
  details?: string;
}

interface AnswerResponse {
  question: string;
  answer: string;
  engineLogs: EngineLog[];
  confidence: number;
  processingTime: number;
}

interface PresetQuestionsProps {
  onQuestionSelect: (question: string) => void;
  currentServerData?: any;
}

const compactQuestions: PresetQuestion[] = [
  {
    id: 'status-summary',
    title: '📊 서버 상태',
    fullText: '전체 서버 상태를 요약해서 알려줘',
    type: 'basic',
    icon: <Server className="w-3 h-3" />,
    category: '상태',
    color: 'bg-blue-500'
  },
  {
    id: 'critical-detection',
    title: '🔥 장애 탐지',
    fullText: '현재 심각한 장애가 발생한 서버가 있는지 확인해줘',
    type: 'basic',
    icon: <AlertTriangle className="w-3 h-3" />,
    category: '장애',
    color: 'bg-red-500'
  },
  {
    id: 'cpu-performance',
    title: '💻 CPU 진단',
    fullText: 'CPU 성능 이슈가 있는 서버를 진단해줘',
    type: 'basic',
    icon: <Cpu className="w-3 h-3" />,
    category: 'CPU',
    color: 'bg-orange-500'
  },
  {
    id: 'memory-optimization',
    title: '🧩 메모리 최적화',
    fullText: '메모리 사용량을 분석하고 최적화 방안을 제안해줘',
    type: 'basic',
    icon: <Activity className="w-3 h-3" />,
    category: '메모리',
    color: 'bg-green-500'
  },
  {
    id: 'network-analysis',
    title: '🌐 네트워크',
    fullText: '네트워크 지연 및 연결 상태를 분석해줘',
    type: 'basic',
    icon: <Network className="w-3 h-3" />,
    category: '네트워크',
    color: 'bg-purple-500'
  },
  {
    id: 'disk-management',
    title: '💾 디스크 관리',
    fullText: '디스크 용량과 I/O 성능을 확인하고 관리 방안을 알려줘',
    type: 'basic',
    icon: <HardDrive className="w-3 h-3" />,
    category: '디스크',
    color: 'bg-yellow-500'
  },
  {
    id: 'ai-analysis',
    title: '🧠 AI 분석',
    fullText: 'AI 엔진이 분석한 최근 패턴과 이상 징후를 요약해줘',
    type: 'advanced',
    icon: <Brain className="w-3 h-3" />,
    category: 'AI',
    color: 'bg-indigo-500'
  },
  {
    id: 'performance-trend',
    title: '📈 성능 트렌드',
    fullText: '최근 성능 변화 추이를 분석하고 예측해줘',
    type: 'advanced',
    icon: <TrendingUp className="w-3 h-3" />,
    category: '트렌드',
    color: 'bg-pink-500'
  }
];

export default function PresetQuestions({ onQuestionSelect, currentServerData }: PresetQuestionsProps) {
  const [selectedQuestions, setSelectedQuestions] = useState<PresetQuestion[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState<AnswerResponse | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showEngineDetails, setShowEngineDetails] = useState(false);

  useEffect(() => {
    generatePresetQuestions();
  }, [currentServerData]);

  const generatePresetQuestions = () => {
    // 상황에 따른 우선순위 질문 선택
    let priorityQuestions = [...compactQuestions];
    
    if (currentServerData?.criticalServers > 0) {
      // 긴급 상황 질문을 맨 앞으로
      priorityQuestions = priorityQuestions.filter(q => 
        ['critical-detection', 'status-summary', 'ai-analysis'].includes(q.id)
      );
    }
    
    setSelectedQuestions(priorityQuestions.slice(0, 6)); // 6개만 표시
  };

  const mockEngineProcess = async (question: string): Promise<AnswerResponse> => {
    const startTime = Date.now();
    
    // 엔진 로그 시뮬레이션
    const logs: EngineLog[] = [
      {
        timestamp: new Date().toISOString(),
        step: '컨텍스트 로드',
        duration: 12,
        success: true,
        details: '서버 메트릭 데이터 로드 완료'
      },
      {
        timestamp: new Date().toISOString(),
        step: '의도 분류',
        duration: 45,
        success: true,
        details: 'AI 추론을 통한 질문 의도 분석'
      },
      {
        timestamp: new Date().toISOString(),
        step: 'MCP 서버 분석',
        duration: 23,
        success: true,
        details: '실시간 서버 상태 데이터 수집'
      },
      {
        timestamp: new Date().toISOString(),
        step: 'AI 응답 생성',
        duration: 67,
        success: true,
        details: '딥러닝 모델을 통한 답변 생성'
      },
      {
        timestamp: new Date().toISOString(),
        step: '검증 및 후처리',
        duration: 18,
        success: true,
        details: '답변 정확성 검증 완료'
      }
    ];

    // 실제 답변 생성 (간단한 시뮬레이션)
    const answers: { [key: string]: string } = {
      '서버 상태': '현재 총 12대 서버 중 10대 정상, 2대 경고 상태입니다. web-01에서 CPU 사용률 85%, db-02에서 메모리 사용률 92% 확인됩니다.',
      '장애 탐지': '심각한 장애는 감지되지 않았습니다. 다만 api-server-03에서 응답 지연(평균 2.3초)이 발생하고 있어 모니터링이 필요합니다.',
      'CPU 진단': 'web-server-01에서 CPU 사용률이 지속적으로 80% 이상 유지되고 있습니다. 프로세스 분석 결과 PHP-FPM 워커 프로세스 증가가 원인으로 보입니다.',
      '메모리 최적화': 'db-server-02에서 메모리 사용률 92% 도달. Redis 캐시 정리 및 MySQL 버퍼 풀 크기 조정을 권장합니다.',
      '네트워크': '전체적으로 네트워크 상태는 양호합니다. 평균 지연시간 15ms, 패킷 손실 0.02%로 정상 범위입니다.',
      '디스크 관리': 'file-server-01의 디스크 사용률이 78%에 도달했습니다. 로그 파일 정리 및 백업 데이터 아카이빙을 권장합니다.',
      'AI 분석': '최근 24시간 동안 3회의 비정상 패턴이 감지되었습니다. 주로 오후 2-4시 사이 트래픽 급증으로 인한 것으로 분석됩니다.',
      '성능 트렌드': '전반적으로 성능이 개선되고 있습니다. 지난 주 대비 평균 응답시간 12% 단축, CPU 사용률 8% 감소했습니다.'
    };

    const answer = answers[question] || '해당 질문에 대한 분석을 진행했습니다. 자세한 내용은 관련 페이지에서 확인하실 수 있습니다.';

    return {
      question,
      answer,
      engineLogs: logs,
      confidence: Math.random() * 20 + 80, // 80-100%
      processingTime: Date.now() - startTime
    };
  };

  const handleQuestionClick = async (question: PresetQuestion) => {
    setIsProcessing(true);
    setCurrentAnswer(null);
    
    try {
      // 실제 질문 전송도 함께 실행
      onQuestionSelect(question.fullText);
      
      // 엔진 분석 수행
      const response = await mockEngineProcess(question.title);
      setCurrentAnswer(response);
    } catch (error) {
      console.error('답변 생성 실패:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      generatePresetQuestions();
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-4">
      {/* 컴팩트 프리셋 질문들 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700">빠른 질문</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {selectedQuestions.map((question, index) => (
            <motion.button
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleQuestionClick(question)}
              className={`
                ${question.color} text-white p-2 rounded-lg
                text-xs font-medium transition-all duration-200
                flex items-center gap-1.5 shadow-sm hover:shadow-md
                min-h-[40px] text-left
              `}
            >
              {question.icon}
              <span className="line-clamp-2">{question.title}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* 답변 영역 */}
      <AnimatePresence>
        {(isProcessing || currentAnswer) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border rounded-lg bg-gray-50 overflow-hidden"
          >
            {isProcessing ? (
              <div className="p-4 text-center">
                <Loader className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-500" />
                <p className="text-sm text-gray-600">AI 엔진이 분석 중입니다...</p>
              </div>
            ) : currentAnswer && (
              <div className="p-4 space-y-3">
                {/* 답변 헤더 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {currentAnswer.question}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{currentAnswer.processingTime}ms</span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
                      {currentAnswer.confidence.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* 답변 내용 */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-gray-700 bg-white p-3 rounded border"
                >
                  {currentAnswer.answer}
                </motion.div>

                {/* 엔진 로그 */}
                <div className="space-y-2">
                  <button
                    onClick={() => setShowEngineDetails(!showEngineDetails)}
                    className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="w-3 h-3" />
                    <span>엔진 처리 과정</span>
                    <ChevronDown className={`w-3 h-3 transition-transform ${showEngineDetails ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showEngineDetails && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-1"
                      >
                        {currentAnswer.engineLogs.map((log, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="flex items-center justify-between text-xs bg-white p-2 rounded border"
                          >
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${log.success ? 'bg-green-400' : 'bg-red-400'}`} />
                              <span className="font-medium">{log.step}</span>
                              {log.details && (
                                <span className="text-gray-500">- {log.details}</span>
                              )}
                            </div>
                            <span className="text-gray-400">{log.duration}ms</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 