'use client';

import { useState, useEffect, useRef } from 'react';
import { Send, Loader2, Brain, X, ChevronLeft, ChevronRight, History, AlertCircle, Lightbulb, Server, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../utils/TimerManager';

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'thinking';
  content: string;
  thinking?: ThinkingProcess;
  timestamp: Date;
}

interface ThinkingProcess {
  steps: string[];
  confidence: number;
  duration: number;
}

interface QAPage {
  id: string;
  question: string;
  answer: string;
  thinking?: ThinkingProcess;
  timestamp: Date;
  confidence?: number;
}

interface ChatSectionProps {
  serverMetrics?: any;
  onClose: () => void;
}

// 질문 유사도 계산 함수
const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

// 레벤슈타인 거리 계산
const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

export default function ChatSection({ serverMetrics, onClose }: ChatSectionProps) {
  const [qaPages, setQAPages] = useState<QAPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1: 초기 화면
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [presets, setPresets] = useState<string[]>([]);

  // 동적 프리셋 질문 생성
  const generateContextualQuestions = (metrics: any): string[] => {
    const questions = [
      "현재 시스템 전체 상태를 요약해줘",
      "CPU 사용률이 높은 서버들을 분석해줘", 
      "메모리 최적화 방안을 추천해줘",
      "서버 성능 트렌드를 분석해줘",
      "시스템 보안 상태를 점검해줘"
    ];

    // 서버 메트릭스에 따른 동적 질문 생성
    if (metrics) {
      if (metrics.criticalServers > 0) {
        questions.unshift("⚠️ 위험 상태 서버들을 즉시 점검해줘");
      }
      if (metrics.warning > 2) {
        questions.unshift("📊 경고 상태 서버들의 패턴을 분석해줘");
      }
      if (metrics.total > 10) {
        questions.push("🔄 대규모 인프라 최적화 방안을 제안해줘");
      }
    }

    return questions.slice(0, 4); // 최대 4개까지
  };

  const getQuestionIcon = (question: string) => {
    if (question.includes('위험') || question.includes('⚠️')) return <AlertTriangle className="w-4 h-4 text-red-500" />;
    if (question.includes('서버') || question.includes('📊')) return <Server className="w-4 h-4 text-blue-500" />;
    if (question.includes('최적화') || question.includes('트렌드')) return <TrendingUp className="w-4 h-4 text-green-500" />;
    return <Lightbulb className="w-4 h-4 text-purple-500" />;
  };

  // 프리셋 질문 업데이트
  useEffect(() => {
    const updatePresets = () => {
      const newPresets = generateContextualQuestions(serverMetrics);
      setPresets(newPresets);
    };

    updatePresets();
    
    // TimerManager를 사용한 프리셋 업데이트
    timerManager.register({
      id: 'chat-section-presets-update',
      callback: updatePresets,
      interval: 15000,
      priority: 'low'
    });
    
    return () => {
      timerManager.unregister('chat-section-presets-update');
    };
  }, [serverMetrics]);

  // 중복 질문 확인
  const checkDuplicateQuestion = (newQuestion: string): QAPage | null => {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1분 전
    
    for (const page of qaPages) {
      const isRecent = page.timestamp.getTime() > oneMinuteAgo;
      const similarity = calculateSimilarity(newQuestion.toLowerCase(), page.question.toLowerCase());
      
      if (isRecent && similarity >= 0.9) {
        return page;
      }
    }
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const question = input.trim();
    
    // 중복 질문 검사
    const duplicatePage = checkDuplicateQuestion(question);
    if (duplicatePage) {
      const similarity = Math.round(calculateSimilarity(question.toLowerCase(), duplicatePage.question.toLowerCase()) * 100);
      setDuplicateAlert(`${similarity}% 유사한 질문을 1분 전에 하셨습니다. 기존 답변을 확인해주세요.`);
      setInput('');
      
      // 3초 후 알림 제거
      setTimeout(() => setDuplicateAlert(null), 3000);
      return;
    }

    setInput('');
    setIsProcessing(true);

    try {
      // AI 응답 시뮬레이션
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const thinking: ThinkingProcess = {
        steps: [
          '질문 분석 및 컨텍스트 파악...',
          '서버 메트릭스 데이터 조회...',
          '패턴 분석 및 이상 징후 검토...',
          '최적화 방안 및 권장사항 도출...',
          '응답 생성 및 검증...'
        ],
        confidence: 0.85 + Math.random() * 0.1,
        duration: 1.8 + Math.random() * 0.4
      };

      const newPage: QAPage = {
        id: Date.now().toString(),
        question,
        answer: `📊 **질문 분석 완료**\n\n"${question}"에 대한 상세 분석 결과를 말씀드리겠습니다.\n\n🔍 **현재 시스템 상태:**\n• 전체 서버: ${serverMetrics?.total || 12}대\n• 정상 서버: ${serverMetrics?.online || 10}대\n• 경고 서버: ${serverMetrics?.warning || 2}대\n• 오프라인: ${serverMetrics?.offline || 0}대\n\n⚡ **분석 결과:**\n이 질문은 시스템 모니터링과 관련된 중요한 사항입니다. 현재 시스템 상태를 기반으로 다음과 같이 분석됩니다:\n\n1. **즉시 조치가 필요한 사항:** 없음\n2. **모니터링 권장 사항:** CPU 및 메모리 사용률 지속 관찰\n3. **최적화 기회:** 캐시 설정 및 로드 밸런싱 개선\n\n💡 **권장사항:**\n추가 질문이나 구체적인 서버별 분석이 필요하시면 언제든 말씀해 주세요.`,
        thinking,
        timestamp: new Date(),
        confidence: thinking.confidence
      };

      setQAPages(prev => [...prev, newPage]);
      setCurrentPageIndex(qaPages.length); // 새 페이지로 이동
    } catch (error) {
      console.error('AI 응답 오류:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePresetSelect = (preset: string) => {
    setInput(preset);
  };

  const goToPage = (index: number) => {
    setCurrentPageIndex(index);
    setShowHistory(false);
  };

  const goToHome = () => {
    setCurrentPageIndex(-1);
    setShowHistory(false);
  };

  // 현재 페이지 데이터
  const currentPage = currentPageIndex >= 0 ? qaPages[currentPageIndex] : null;

  return (
    <div className="flex flex-col h-full">
      {/* 헤더 */}
      <div className="px-4 py-3 border-b bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-purple-500" />
          <h2 className="text-lg font-semibold">AI 어시스턴트</h2>
          {qaPages.length > 0 && (
            <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">
              {qaPages.length}개 질문
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 히스토리 버튼 */}
          {qaPages.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                showHistory 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <History className="w-4 h-4" />
            </button>
          )}
          
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-500/90 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-all hover:scale-110"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 중복 질문 알림 */}
      <AnimatePresence>
        {duplicateAlert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-2 p-3 bg-orange-50 border border-orange-200 rounded-lg"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-orange-700">{duplicateAlert}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {showHistory ? (
            // 히스토리 뷰
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full p-4 overflow-y-auto"
            >
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800 mb-3">질문 히스토리</h3>
                {qaPages.map((page, index) => (
                  <motion.button
                    key={page.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => goToPage(index)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      index === currentPageIndex
                        ? 'bg-purple-50 border-purple-200'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2">
                          {page.question}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {page.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {page.confidence && (
                        <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded ml-2">
                          {Math.round(page.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : currentPage ? (
            // 개별 Q&A 페이지
            <motion.div
              key={`page-${currentPageIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col"
            >
              {/* 네비게이션 */}
              <div className="px-4 py-2 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToHome}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded"
                  >
                    홈으로
                  </button>
                  <span className="text-xs text-gray-500">
                    {currentPageIndex + 1} / {qaPages.length}
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => goToPage(Math.max(0, currentPageIndex - 1))}
                    disabled={currentPageIndex === 0}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => goToPage(Math.min(qaPages.length - 1, currentPageIndex + 1))}
                    disabled={currentPageIndex === qaPages.length - 1}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Q&A 컨텐츠 */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* 질문 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">Q</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">질문</h3>
                      <p className="text-gray-700">{currentPage.question}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {currentPage.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI 생각 과정 */}
                {currentPage.thinking && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-blue-700">AI 분석 과정</h4>
                      <span className="text-xs bg-blue-200 text-blue-700 px-2 py-1 rounded">
                        {Math.round(currentPage.thinking.confidence * 100)}% 신뢰도
                      </span>
                    </div>
                    <div className="space-y-1">
                      {currentPage.thinking.steps.map((step, index) => (
                        <div key={index} className="text-xs text-gray-600 flex items-start gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      처리 시간: {currentPage.thinking.duration}초
                    </p>
                  </div>
                )}

                {/* 답변 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-bold">A</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800 mb-2">AI 답변</h3>
                      <div className="text-gray-700 whitespace-pre-wrap">{currentPage.answer}</div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            // 홈 화면 - 동적 프리셋 질문
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto px-4 py-3"
            >
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-purple-600" />
                  <p className="text-sm font-medium text-purple-700">💡 상황별 추천 질문</p>
                </div>
                
                <div className="space-y-2">
                  {presets.map((preset, index) => (
                    <motion.button
                      key={`${preset}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handlePresetSelect(preset)}
                      className="w-full text-left text-sm px-3 py-3 bg-white rounded-lg border 
                               hover:bg-purple-50 hover:border-purple-200 transition-all duration-200 
                               shadow-sm hover:shadow group"
                    >
                      <div className="flex items-start gap-2">
                        {getQuestionIcon(preset)}
                        <span className="group-hover:text-purple-700 transition-colors">
                          {preset}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
                
                <div className="text-xs text-gray-500 text-center pt-2 border-t border-purple-100">
                  💡 질문이 15초마다 서버 상태에 맞춰 업데이트됩니다
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 입력 영역 */}
      {!showHistory && (
        <div className="border-t px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 
                       disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
} 