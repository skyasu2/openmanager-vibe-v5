'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Send,
  Loader2,
  Brain,
  X,
  ChevronLeft,
  ChevronRight,
  History,
  AlertCircle,
  Lightbulb,
  Server,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timerManager } from '../../utils/TimerManager';
import type { ServerStatusSummary } from '@/types/unified-server';

// 분리된 유틸 함수들
interface ChatMetrics {
  criticalServers?: number;
  warning?: number;
  total?: number;
}

const generateQuestions = (metrics: ChatMetrics | unknown): string[] => {
  const questions = [
    '현재 시스템 전체 상태를 요약해줘',
    'CPU 사용률이 높은 서버들을 분석해줘',
    '메모리 최적화 방안을 추천해줘',
    '서버 성능 트렌드를 분석해줘',
    '시스템 보안 상태를 점검해줘',
  ];

  // 서버 메트릭스에 따른 동적 질문 생성
  if (metrics && typeof metrics === 'object' && 'criticalServers' in metrics) {
    const m = metrics as ChatMetrics;
    if (m.criticalServers && m.criticalServers > 0) {
      questions.unshift('⚠️ 위험 상태 서버들을 즉시 점검해줘');
    }
    if (m.warning && m.warning > 2) {
      questions.unshift('📊 경고 상태 서버들의 패턴을 분석해줘');
    }
    if (m.total && m.total > 10) {
      questions.push('🔄 대규모 인프라 최적화 방안을 제안해줘');
    }
  }

  return questions.slice(0, 4); // 최대 4개까지
};

const getIconForQuestion = (question: string) => {
  if (question.includes('위험') || question.includes('⚠️'))
    return <AlertTriangle className="h-4 w-4 text-red-500" />;
  if (question.includes('서버') || question.includes('📊'))
    return <Server className="h-4 w-4 text-blue-500" />;
  if (question.includes('최적화') || question.includes('트렌드'))
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  return <Lightbulb className="h-4 w-4 text-purple-500" />;
};

const calculateSimilarity = (str1: string, str2: string): number => {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array(str2.length + 1)
    .fill(null)
    .map(() => Array(str1.length + 1).fill(null));

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

interface _Message {
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
  serverMetrics?: ServerStatusSummary;
  onClose: () => void;
}

// 레벤슈타인 거리 및 유사도 계산 함수들을 상단에 분리함

export default function ChatSection({
  serverMetrics,
  onClose,
}: ChatSectionProps) {
  const [qaPages, setQAPages] = useState<QAPage[]>([]);
  const [currentPageIndex, setCurrentPageIndex] = useState(-1); // -1: 초기 화면
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [presets, setPresets] = useState<string[]>([]);

  // 스크롤 관리를 위한 ref와 상태
  const contentEndRef = useRef<HTMLDivElement>(null);
  const contentContainerRef = useRef<HTMLDivElement>(null);
  const [isUserScrolled, setIsUserScrolled] = useState(false);

  // 자동 스크롤 함수
  const scrollToBottom = () => {
    contentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 스크롤 위치 확인 함수
  const isAtBottom = () => {
    if (!contentContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      contentContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 50; // 50px 여유값
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = () => {
    if (!contentContainerRef.current) return;

    const atBottom = isAtBottom();
    setIsUserScrolled(!atBottom);
  };

  // 페이지 변경 시 자동 스크롤
  useEffect(() => {
    if (!isUserScrolled) {
      scrollToBottom();
    }
  }, [currentPageIndex, qaPages, isUserScrolled]);

  // 동적 프리셋 질문 생성 (분리된 유틸 함수)
  const generateContextualQuestions = useCallback(
    (metrics: unknown): string[] => {
      return generateQuestions(metrics);
    },
    []
  );

  const getQuestionIcon = useCallback((question: string) => {
    return getIconForQuestion(question);
  }, []);

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
      priority: 'low',
      enabled: true,
    });

    return () => {
      timerManager.unregister('chat-section-presets-update');
    };
  }, [serverMetrics, generateContextualQuestions]);

  // 중복 질문 확인
  const checkDuplicateQuestion = (newQuestion: string): QAPage | null => {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000; // 1분 전

    for (const page of qaPages) {
      const isRecent = page.timestamp.getTime() > oneMinuteAgo;
      const similarity = calculateSimilarity(
        newQuestion.toLowerCase(),
        page.question.toLowerCase()
      );

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
      const similarity = Math.round(
        calculateSimilarity(
          question.toLowerCase(),
          duplicatePage.question.toLowerCase()
        ) * 100
      );
      setDuplicateAlert(
        `${similarity}% 유사한 질문을 1분 전에 하셨습니다. 기존 답변을 확인해주세요.`
      );
      setInput('');

      // 3초 후 알림 제거
      setTimeout(() => setDuplicateAlert(null), 3000);
      return;
    }

    setInput('');
    setIsProcessing(true);
    // 새 질문 시 자동 스크롤 모드로 전환
    setIsUserScrolled(false);

    try {
      // AI 응답 시뮬레이션
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const thinking: ThinkingProcess = {
        steps: [
          '질문 분석 및 컨텍스트 파악...',
          '서버 메트릭스 데이터 조회...',
          '패턴 분석 및 이상 징후 검토...',
          '최적화 방안 및 권장사항 도출...',
          '응답 생성 및 검증...',
        ],
        confidence: 0.85 + Math.random() * 0.1,
        duration: 1.8 + Math.random() * 0.4,
      };

      const newPage: QAPage = {
        id: Date.now().toString(),
        question,
        answer: `📊 **질문 분석 완료**\n\n"${question}"에 대한 상세 분석 결과를 말씀드리겠습니다.\n\n🔍 **현재 시스템 상태:**\n• 전체 서버: ${serverMetrics?.total || 12}대\n• 정상 서버: ${serverMetrics?.online || 10}대\n• 경고 서버: ${serverMetrics?.warning || 2}대\n• 오프라인: ${serverMetrics?.offline || 0}대\n\n⚡ **분석 결과:**\n이 질문은 시스템 모니터링과 관련된 중요한 사항입니다. 현재 시스템 상태를 기반으로 다음과 같이 분석됩니다:\n\n1. **즉시 조치가 필요한 사항:** 없음\n2. **모니터링 권장 사항:** CPU 및 메모리 사용률 지속 관찰\n3. **최적화 기회:** 캐시 설정 및 로드 밸런싱 개선\n\n💡 **권장사항:**\n추가 질문이나 구체적인 서버별 분석이 필요하시면 언제든 말씀해 주세요.`,
        thinking,
        timestamp: new Date(),
        confidence: thinking.confidence,
      };

      setQAPages((prev) => [...prev, newPage]);
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
    <div className="flex h-full flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          <h2 className="text-lg font-semibold">AI 어시스턴트</h2>
          {qaPages.length > 0 && (
            <span className="rounded bg-purple-100 px-2 py-1 text-xs text-purple-600">
              {qaPages.length}개 질문
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* 히스토리 버튼 */}
          {qaPages.length > 0 && (
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg transition-all ${
                showHistory
                  ? 'bg-purple-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <History className="h-4 w-4" />
            </button>
          )}

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white transition-all hover:scale-110 hover:bg-red-600"
          >
            <X className="h-4 w-4" />
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
            className="mx-4 mt-2 rounded-lg border border-orange-200 bg-orange-50 p-3"
          >
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-orange-500" />
              <div className="flex-1">
                <p className="text-sm text-orange-700">{duplicateAlert}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 메인 컨텐츠 */}
      <div
        ref={contentContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {showHistory ? (
            // 히스토리 뷰
            <motion.div
              key="history"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full overflow-y-auto p-4"
            >
              <div className="space-y-2">
                <h3 className="mb-3 font-semibold text-gray-800">
                  질문 히스토리
                </h3>
                {qaPages.map((page, index) => (
                  <motion.button
                    key={page.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => goToPage(index)}
                    className={`w-full rounded-lg border p-3 text-left transition-all ${
                      index === currentPageIndex
                        ? 'border-purple-200 bg-purple-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="line-clamp-2 text-sm font-medium text-gray-800">
                          {page.question}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {page.timestamp.toLocaleString()}
                        </p>
                      </div>
                      {page.confidence && (
                        <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs text-green-600">
                          {Math.round(page.confidence * 100)}%
                        </span>
                      )}
                    </div>
                  </motion.button>
                ))}
              </div>
              {/* 스크롤 타겟 */}
              <div ref={contentEndRef} />
            </motion.div>
          ) : currentPage ? (
            // 개별 Q&A 페이지
            <motion.div
              key={`page-${currentPageIndex}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex h-full flex-col"
            >
              {/* 네비게이션 */}
              <div className="flex items-center justify-between border-b bg-gray-50 px-4 py-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={goToHome}
                    className="rounded px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 hover:text-blue-800"
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
                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() =>
                      goToPage(
                        Math.min(qaPages.length - 1, currentPageIndex + 1)
                      )
                    }
                    disabled={currentPageIndex === qaPages.length - 1}
                    className="flex h-7 w-7 items-center justify-center rounded hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Q&A 컨텐츠 */}
              <div className="flex-1 space-y-4 overflow-y-auto p-4">
                {/* 질문 */}
                <div className="rounded-lg bg-purple-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500">
                      <span className="text-sm font-bold text-white">Q</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-gray-800">질문</h3>
                      <p className="text-gray-700">{currentPage.question}</p>
                      <p className="mt-2 text-xs text-gray-500">
                        {currentPage.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI 생각 과정 */}
                {currentPage.thinking && (
                  <div className="rounded-lg bg-blue-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <Brain className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-700">
                        AI 분석 과정
                      </h4>
                      <span className="rounded bg-blue-200 px-2 py-1 text-xs text-blue-700">
                        {Math.round(currentPage.thinking.confidence * 100)}%
                        신뢰도
                      </span>
                    </div>
                    <div className="space-y-1">
                      {currentPage.thinking.steps.map((step, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-2 text-xs text-gray-600"
                        >
                          <span className="text-blue-500">•</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      처리 시간: {currentPage.thinking.duration}초
                    </p>
                  </div>
                )}

                {/* 답변 */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                      <span className="text-sm font-bold text-white">A</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="mb-2 font-semibold text-gray-800">
                        AI 답변
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {currentPage.answer}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              {/* 스크롤 타겟 */}
              <div ref={contentEndRef} />
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
              <div className="space-y-3 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-4">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                  <p className="text-sm font-medium text-purple-700">
                    💡 상황별 추천 질문
                  </p>
                </div>

                <div className="space-y-2">
                  {presets.map((preset, index) => (
                    <motion.button
                      key={`${preset}-${index}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handlePresetSelect(preset)}
                      className="group w-full rounded-lg border bg-white px-3 py-3 text-left text-sm shadow-sm transition-all duration-200 hover:border-purple-200 hover:bg-purple-50 hover:shadow"
                    >
                      <div className="flex items-start gap-2">
                        {getQuestionIcon(preset)}
                        <span className="transition-colors group-hover:text-purple-700">
                          {preset}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>

                <div className="border-t border-purple-100 pt-2 text-center text-xs text-gray-500">
                  💡 질문이 15초마다 서버 상태에 맞춰 업데이트됩니다
                </div>
              </div>
              {/* 스크롤 타겟 */}
              <div ref={contentEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 입력 영역 */}
      {!showHistory && (
        <div className="border-t px-4 py-3">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              aria-label="입력 필드"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="질문을 입력하세요..."
              className="flex-1 rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isProcessing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isProcessing}
              className="rounded-lg bg-purple-500 px-4 py-2 text-white transition-colors hover:bg-purple-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
