'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useHybridAI } from '@/hooks/useHybridAI';
import { getMockSystem } from '@/mock';
import { Loader2, Send, RefreshCw, Zap } from 'lucide-react';

/**
 * 🎭 Mock 데이터 AI 분석 데모
 *
 * Mock 시스템과 AI 어시스턴트 통합 테스트
 */
export default function MockAIDemo() {
  const [queryText, setQueryText] = useState('');
  const [response, setResponse] = useState('');
  const [mockInfo, setMockInfo] = useState<any>(null);

  const { query, isLoading, error } = useHybridAI();

  // Mock 시스템 정보 업데이트
  const updateMockInfo = () => {
    // 클라이언트 환경에서만 실행
    if (typeof window === 'undefined') return;

    try {
      const mockSystem = getMockSystem();
      const info = mockSystem.getSystemInfo();
      setMockInfo(info);
    } catch (error) {
      console.error('Mock 시스템 정보 업데이트 실패:', error);
    }
  };

  // 초기 로드
  useEffect(() => {
    updateMockInfo();
    const interval = setInterval(updateMockInfo, 30000); // 30초마다 업데이트
    return () => clearInterval(interval);
  }, []);

  // AI 쿼리 전송
  const handleQuery = async () => {
    if (!queryText.trim()) return;

    try {
      const result = await query(queryText, {
        priority: 'normal',
      });

      if (result.success) {
        setResponse(result.answer);
      } else {
        setResponse('쿼리 처리 중 오류가 발생했습니다.');
      }
    } catch (err) {
      console.error('AI 쿼리 실패:', err);
      setResponse('AI 응답을 받을 수 없습니다.');
    }
  };

  // 예시 쿼리
  const sampleQueries = [
    '현재 서버 상태를 요약해줘',
    'CPU 사용률이 높은 서버가 있나요?',
    '위험 상태의 서버를 확인해줘',
    '현재 상황을 분석해줘',
    '어떤 문제가 발생하고 있나요?',
  ];

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-3xl font-bold">🎭 Mock 데이터 AI 분석 데모</h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Mock 시스템 상태 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Mock 시스템 상태
              <Button size="sm" variant="outline" onClick={updateMockInfo}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {mockInfo ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    현재 시각
                  </span>
                  <Badge>
                    {mockInfo.rotatorStatus?.simulationTime || '00:00:00'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">
                    전체 서버
                  </span>
                  <span className="font-medium">{mockInfo.totalServers}대</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <div className="rounded bg-green-100 p-2 text-center dark:bg-green-900/20">
                    <div className="text-2xl font-bold text-green-600">
                      {mockInfo.healthyCount}
                    </div>
                    <div className="text-xs text-muted-foreground">정상</div>
                  </div>
                  <div className="rounded bg-yellow-100 p-2 text-center dark:bg-yellow-900/20">
                    <div className="text-2xl font-bold text-yellow-600">
                      {mockInfo.warningCount}
                    </div>
                    <div className="text-xs text-muted-foreground">경고</div>
                  </div>
                  <div className="rounded bg-red-100 p-2 text-center dark:bg-red-900/20">
                    <div className="text-2xl font-bold text-red-600">
                      {mockInfo.criticalCount}
                    </div>
                    <div className="text-xs text-muted-foreground">위험</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI 쿼리 인터페이스 */}
        <Card>
          <CardHeader>
            <CardTitle>AI 어시스턴트에게 질문하기</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium">
                예시 질문
              </label>
              <div className="flex flex-wrap gap-2">
                {sampleQueries.map((sample, idx) => (
                  <Button
                    key={idx}
                    size="sm"
                    variant="outline"
                    onClick={() => setQueryText(sample)}
                  >
                    {sample}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">
                질문 입력
              </label>
              <Textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Mock 서버 데이터에 대해 물어보세요..."
                className="min-h-[100px]"
              />
            </div>

            <Button
              onClick={handleQuery}
              disabled={isLoading || !queryText.trim()}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  질문하기
                </>
              )}
            </Button>

            {error && (
              <div className="rounded bg-red-100 p-3 text-sm text-red-600 dark:bg-red-900/20">
                {error}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI 응답 */}
      {response && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-500" />
              AI 응답
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose dark:prose-invert max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {response}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 사용 안내 */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>🎯 사용 안내</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Mock 시스템은 24시간 서버 데이터를 30초 간격으로 시뮬레이션합니다.
          </p>
          <p>
            • AI는 시나리오를 모르고 순수하게 데이터만 보고 상황을 분석합니다.
          </p>
          <p>• AI는 메트릭 패턴을 분석하여 현재 상황과 문제를 추론합니다.</p>
          <p>• 환경변수 USE_MOCK_DATA=true로 Mock 모드가 활성화됩니다.</p>
        </CardContent>
      </Card>
    </div>
  );
}
