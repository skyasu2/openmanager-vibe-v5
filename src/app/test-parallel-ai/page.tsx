'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ParallelAIThinkingViewer from '@/components/ai/ParallelAIThinkingViewer';

export default function TestParallelAIPage() {
  const [question, setQuestion] = useState('서버 상태는 어떤가요?');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!question.trim()) return;

    setIsProcessing(true);
    setResult(null);

    try {
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question,
          context: {
            sessionId: `test_${Date.now()}`,
            priority: 'medium',
          },
        }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      setResult({
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleThinkingComplete = (engines: any[]) => {
    console.log('Thinking process completed:', engines);
  };

  const sampleQuestions = [
    '서버 상태는 어떤가요?',
    'CPU 사용률이 높은 이유는 무엇인가요?',
    '메모리 누수 문제를 어떻게 해결하나요?',
    '네트워크 지연이 발생하고 있습니다',
    '데이터베이스 성능을 최적화하려면?',
    '시스템 모니터링 설정을 확인해주세요',
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 병렬 AI 엔진 테스트</CardTitle>
          <p className="text-gray-600">
            MCP, RAG, ML, SmartQuery 엔진이 동시에 처리하는 과정을 확인해보세요.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">질문 입력</label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="AI에게 질문을 입력하세요..."
              className="mb-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">샘플 질문</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {sampleQuestions.map((sample, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => setQuestion(sample)}
                  className="text-left justify-start h-auto py-2 px-3"
                >
                  {sample}
                </Button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !question.trim()}
            className="w-full"
          >
            {isProcessing ? '처리 중...' : 'AI 엔진 실행'}
          </Button>
        </CardContent>
      </Card>

      {(isProcessing || result) && (
        <ParallelAIThinkingViewer
          isProcessing={isProcessing}
          onComplete={handleThinkingComplete}
        />
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>📋 처리 결과</CardTitle>
          </CardHeader>
          <CardContent>
            {result.success ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">최종 답변</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p>{result.answer}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">처리 정보</h4>
                    <ul className="text-sm space-y-1">
                      <li>엔진: {result.engine}</li>
                      <li>신뢰도: {Math.round((result.confidence || 0) * 100)}%</li>
                      <li>처리 시간: {result.processingTime}ms</li>
                    </ul>
                  </div>

                  {result.sources && result.sources.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">참조 소스</h4>
                      <ul className="text-sm space-y-1">
                        {result.sources.map((source: string, index: number) => (
                          <li key={index}>• {source}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {result.internalResults && (
                  <div>
                    <h4 className="font-medium mb-2">내부 엔진 결과</h4>
                    <div className="space-y-2">
                      {result.internalResults.map((engineResult: any, index: number) => (
                        <div key={index} className="bg-gray-50 p-3 rounded">
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">{engineResult.engine}</span>
                            <span className={`text-sm ${
                              engineResult.success ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {engineResult.success ? '성공' : '실패'}
                            </span>
                          </div>
                          {engineResult.success && (
                            <div className="text-sm text-gray-600">
                              신뢰도: {Math.round((engineResult.confidence || 0) * 100)}% | 
                              시간: {engineResult.processingTime}ms
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.externalResult && (
                  <div>
                    <h4 className="font-medium mb-2">외부 AI 폴백 결과</h4>
                    <div className="bg-blue-50 p-3 rounded">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{result.externalResult.engine}</span>
                        <span className="text-sm text-blue-600">
                          신뢰도: {Math.round((result.externalResult.confidence || 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-red-600">
                <h3 className="font-medium mb-2">오류 발생</h3>
                <p>{result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>📊 아키텍처 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">내부 AI 엔진</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>MCP Engine - 컨텍스트 분석 (800ms)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>RAG Engine - 과거 사례 매칭 (500ms)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span>ML Engine - 통계적 예측 (300ms)</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span>SmartQuery - 실시간 처리 (200ms)</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium mb-2">처리 단계</h4>
              <ol className="space-y-2 text-sm">
                <li>1. 4개 엔진 병렬 실행</li>
                <li>2. 응답 품질 평가 (임계값: 70%)</li>
                <li>3. 충분하면 내부 응답 융합</li>
                <li>4. 부족하면 Google AI 폴백</li>
                <li>5. 최종 답변 생성</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 