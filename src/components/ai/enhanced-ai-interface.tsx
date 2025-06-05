'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Search, 
  FileText, 
  Cpu, 
  Zap, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  BarChart3,
  BookOpen,
  TrendingUp,
  Shield,
  Activity
} from 'lucide-react';

interface DocumentSource {
  path: string;
  relevanceScore: number;
  summary: string;
}

interface AIResult {
  answer: string;
  confidence: number;
  sources: DocumentSource[];
  reasoning: string[];
  mcpActions: string[];
  tensorflowPredictions?: any;
  renderStatus?: 'active' | 'sleeping' | 'error';
}

interface EnhancedAIResponse {
  success: boolean;
  mode: string;
  query: string;
  result: AIResult;
  performance: {
    aiProcessingTime: number;
    totalApiTime: number;
    efficiency: number;
  };
  metadata: {
    timestamp: string;
    documentsAnalyzed: number;
    intentDetected: string;
    mcpActionsUsed: number;
    aiEngineVersion: string;
  };
}

export default function EnhancedAIInterface() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<EnhancedAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 조절
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isProcessing) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/ai/enhanced', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query.trim(),
          sessionId,
          mode: 'smart'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setResult(data);
      } else {
        setError(data.error?.message || '알 수 없는 오류가 발생했습니다.');
      }

    } catch (err) {
      console.error('Enhanced AI API 오류:', err);
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderRenderStatus = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="flex items-center text-green-600"><Activity className="w-4 h-4 mr-1" />활성</span>;
      case 'sleeping':
        return <span className="flex items-center text-yellow-600"><Clock className="w-4 h-4 mr-1" />대기</span>;
      case 'error':
        return <span className="flex items-center text-red-600"><AlertCircle className="w-4 h-4 mr-1" />오류</span>;
      default:
        return <span className="flex items-center text-gray-500"><Clock className="w-4 h-4 mr-1" />확인중</span>;
    }
  };

  const renderIntentIcon = (intent: string) => {
    switch (intent.toLowerCase()) {
      case 'analysis':
        return <BarChart3 className="w-5 h-5 text-blue-500" />;
      case 'prediction':
        return <TrendingUp className="w-5 h-5 text-purple-500" />;
      case 'optimization':
        return <Zap className="w-5 h-5 text-yellow-500" />;
      case 'troubleshooting':
        return <Shield className="w-5 h-5 text-red-500" />;
      default:
        return <Search className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-3">
          <Brain className="w-8 h-8" />
          <div>
            <h1 className="text-2xl font-bold">Enhanced AI Engine v2.0</h1>
            <p className="text-blue-100">MCP 문서 활용 극대화 + TensorFlow.js 하이브리드</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <FileText className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">문서 검색</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <Cpu className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">AI 분석</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <Zap className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">실시간</div>
          </div>
          <div className="bg-white/10 rounded-lg p-3 text-center">
            <BookOpen className="w-5 h-5 mx-auto mb-1" />
            <div className="text-sm">컨텍스트</div>
          </div>
        </div>
      </div>

      {/* 쿼리 입력 */}
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex items-start space-x-4">
            <div className="flex-1">
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 mb-2">
                질문을 입력하세요
              </label>
              <textarea
                ref={textareaRef}
                id="query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="예: 시스템 성능 최적화 방법을 알려주세요
Shift + Enter로 줄바꿈, Enter로 전송"
                className="w-full min-h-[80px] max-h-[200px] px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                disabled={isProcessing}
              />
            </div>
            <button
              type="submit"
              disabled={isProcessing || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>분석중...</span>
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  <span>분석</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* 로딩 상태 */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-blue-50 border border-blue-200 rounded-lg p-6"
          >
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <div>
                <h3 className="font-medium text-blue-900">Enhanced AI 분석 진행중</h3>
                <p className="text-blue-700 text-sm">
                  MCP 문서 검색 → 의도 분석 → TensorFlow.js 예측 → 컨텍스트 답변 생성
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 오류 메시지 */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 결과 표시 */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* 메타데이터 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  {renderIntentIcon(result.metadata.intentDetected)}
                  <span className="font-medium">의도: {result.metadata.intentDetected}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-green-500" />
                  <span>문서: {result.metadata.documentsAnalyzed}개</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>Render: {renderRenderStatus(result.result.renderStatus)}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-purple-500" />
                  <span>{result.performance.aiProcessingTime}ms</span>
                </div>
              </div>
            </div>

            {/* AI 답변 */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>AI 분석 결과</span>
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                    신뢰도: {(result.result.confidence * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
              
              <div className="prose max-w-none">
                <div 
                  className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ 
                    __html: result.result.answer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      .replace(/## (.*?)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
                      .replace(/### (.*?)$/gm, '<h4 class="text-md font-medium mt-3 mb-1">$1</h4>')
                      .replace(/- (.*?)$/gm, '<li class="ml-4">$1</li>')
                  }}
                />
              </div>
            </div>

            {/* 사용된 문서 소스 */}
            {result.result.sources.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span>참조된 문서 ({result.result.sources.length}개)</span>
                </h3>
                
                <div className="space-y-3">
                  {result.result.sources.map((source, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{source.path}</h4>
                        <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                          관련도: {source.relevanceScore.toFixed(1)}
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm">{source.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 분석 과정 */}
            {result.result.reasoning.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-purple-500" />
                  <span>분석 과정</span>
                </h3>
                
                <div className="space-y-2">
                  {result.result.reasoning.map((step, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                        {index + 1}
                      </div>
                      <p className="text-gray-700">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TensorFlow.js 예측 결과 */}
            {result.result.tensorflowPredictions && Object.keys(result.result.tensorflowPredictions).length > 0 && (
              <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                  <Cpu className="w-5 h-5 text-orange-500" />
                  <span>TensorFlow.js 예측</span>
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <pre className="text-sm text-gray-700 overflow-x-auto">
                    {JSON.stringify(result.result.tensorflowPredictions, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            {/* 성능 메트릭 */}
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
                <Activity className="w-5 h-5 text-green-500" />
                <span>성능 메트릭</span>
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.performance.aiProcessingTime}ms</div>
                  <div className="text-blue-700 text-sm">AI 처리 시간</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{result.performance.totalApiTime}ms</div>
                  <div className="text-green-700 text-sm">총 응답 시간</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600">{(result.performance.efficiency * 100).toFixed(1)}%</div>
                  <div className="text-purple-700 text-sm">처리 효율성</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 