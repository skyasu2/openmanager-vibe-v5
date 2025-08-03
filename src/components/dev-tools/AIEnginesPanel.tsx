'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Bot,
  Brain,
  MessageSquare,
  RefreshCw,
  Send,
  TestTube,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AITestResult {
  success: boolean;
  engine: string;
  response: string;
  responseTime: number;
  error?: string;
  metadata?: unknown;
}

interface AIEngineStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  responseTime: number;
  requests: number;
  type: string;
  version: string;
  description: string;
}

interface AIEnginesPanelProps {
  className?: string;
}

export function AIEnginesPanel({ className = '' }: AIEnginesPanelProps) {
  // AI 테스트 관련 상태
  const [aiTestQuery, setAiTestQuery] = useState('서버 상태 어떻다?');
  const [aiTestMode, setAiTestMode] = useState('LOCAL');
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);
  const [aiEnginesStatus, setAiEnginesStatus] = useState<
    AIEngineStatus[] | null
  >(null);
  const [aiEnginesLoading, setAiEnginesLoading] = useState(false);

  // 프리셋 질문들
  const presetQueries = [
    'CPU 사용률이 높은 서버를 찾아줘',
    '메모리 사용량이 80% 이상인 서버는?',
    '디스크 공간이 부족한 서버 분석해줘',
    '네트워크 트래픽이 많은 서버는?',
    '최근 에러가 발생한 서버를 확인해줘',
    '성능 최적화가 필요한 서버 추천해줘',
  ];

  const fetchAIEnginesStatus = async () => {
    setAiEnginesLoading(true);
    try {
      const response = await fetch('/api/ai-agent/status');
      if (response.ok) {
        const data = await response.json();
        setAiEnginesStatus(data.engines || []);
      }
    } catch (error) {
      console.error('AI 엔진 상태 확인 실패:', error);
    } finally {
      setAiEnginesLoading(false);
    }
  };

  const testAINaturalQuery = async () => {
    if (!aiTestQuery.trim()) return;

    setAiTestLoading(true);
    setAiTestResult(null);

    try {
      const response = await fetch('/api/ai/unified-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiTestQuery,
          mode: aiTestMode,
          sessionId: 'dev-tools-test',
          context: {
            source: 'dev-tools',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      setAiTestResult({
        success: data.success,
        engine: data.enginePath?.join(' → ') || 'Unknown',
        response: data.response || data.error || '응답 없음',
        responseTime: data.metadata?.responseTime || 0,
        error: data.success ? undefined : data.error,
        metadata: data.metadata,
      });
    } catch (error) {
      console.error('AI 테스트 실패:', error);
      setAiTestResult({
        success: false,
        engine: 'Error',
        response: `오류 발생: ${error instanceof Error ? error.message : String(error)}`,
        responseTime: 0,
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setAiTestLoading(false);
    }
  };

  const quickTest = async (query: string) => {
    setAiTestQuery(query);
    // 잠시 후 자동 실행을 위한 설정
    setTimeout(() => {
      setAiTestQuery(query);
      testAINaturalQuery();
    }, 100);
  };

  useEffect(() => {
    fetchAIEnginesStatus();
  }, []);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'error':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'error':
        return '🔴';
      default:
        return '🟡';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* AI 엔진 상태 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI 엔진 상태
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAIEnginesStatus}
              disabled={aiEnginesLoading}
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${aiEnginesLoading ? 'animate-spin' : ''}`}
              />
              새로고침
            </Button>
          </div>
          <CardDescription>
            통합 AI 엔진 라우터 및 개별 엔진 상태
          </CardDescription>
        </CardHeader>
        <CardContent>
          {aiEnginesStatus && aiEnginesStatus.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {aiEnginesStatus.map((engine, index) => (
                <Card key={index}>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="text-sm font-medium">{engine.name}</h4>
                      <Badge variant={getStatusBadgeVariant(engine.status)}>
                        {getStatusIcon(engine.status)} {engine.status}
                      </Badge>
                    </div>
                    <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">
                      {engine.description}
                    </p>
                    <div className="space-y-1 text-xs text-slate-500">
                      <div>타입: {engine.type}</div>
                      <div>버전: {engine.version}</div>
                      <div>요청 수: {engine.requests}</div>
                      <div>응답시간: {engine.responseTime}ms</div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Brain className="mx-auto mb-4 h-12 w-12 text-slate-400" />
              <p className="text-slate-600 dark:text-slate-400">
                AI 엔진 상태를 불러오는 중...
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI 자연어 쿼리 테스트 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            AI 자연어 쿼리 테스트
          </CardTitle>
          <CardDescription>
            실제 AI 엔진을 사용하여 자연어 질의를 테스트합니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 엔진 모드 선택 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              AI 엔진 모드:
            </label>
            <Select value={aiTestMode} onValueChange={setAiTestMode}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LOCAL">LOCAL (로컬)</SelectItem>
                <SelectItem value="GOOGLE_ONLY">GOOGLE_ONLY (고급)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 프리셋 질문들 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              빠른 테스트 질문:
            </label>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {presetQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => quickTest(query)}
                  className="h-auto justify-start p-3 text-left"
                  disabled={aiTestLoading}
                >
                  <TestTube className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="text-xs">{query}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* 사용자 정의 질문 */}
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
              사용자 정의 질문:
            </label>
            <div className="flex gap-2">
              <Textarea
                placeholder="예: CPU 사용률이 높은 서버를 찾아줘"
                value={aiTestQuery}
                onChange={(e) => setAiTestQuery(e.target.value)}
                className="flex-1"
                rows={2}
                disabled={aiTestLoading}
              />
              <Button
                onClick={testAINaturalQuery}
                disabled={aiTestLoading || !aiTestQuery.trim()}
                className="self-end"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* 테스트 결과 */}
          {aiTestLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="flex items-center gap-3">
                <Bot className="_animate-pulse h-6 w-6" />
                <span>AI가 분석 중입니다...</span>
              </div>
            </div>
          )}

          {aiTestResult && !aiTestLoading && (
            <Card
              className={
                aiTestResult.success ? 'border-green-200' : 'border-red-200'
              }
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {aiTestResult.success ? '✅ 성공' : '❌ 실패'}
                  </CardTitle>
                  <Badge
                    variant={aiTestResult.success ? 'default' : 'destructive'}
                  >
                    {aiTestResult.responseTime}ms
                  </Badge>
                </div>
                <CardDescription>엔진: {aiTestResult.engine}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                      응답:
                    </h4>
                    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                      <p className="whitespace-pre-wrap text-sm">
                        {aiTestResult.response}
                      </p>
                    </div>
                  </div>

                  {aiTestResult.error && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-red-700 dark:text-red-300">
                        오류:
                      </h4>
                      <div className="rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                        <p className="text-sm text-red-600 dark:text-red-400">
                          {aiTestResult.error}
                        </p>
                      </div>
                    </div>
                  )}

                  {aiTestResult.metadata && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                        메타데이터:
                      </h4>
                      <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
                        <pre className="overflow-x-auto text-xs text-slate-600 dark:text-slate-400">
                          {JSON.stringify(aiTestResult.metadata, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
