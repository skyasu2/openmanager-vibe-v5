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
  CheckCircle,
  MessageSquare,
  RefreshCw,
  Send,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { AITestResult } from './types';
import { presetQueries } from './utils';

interface AITestPanelProps {
  onTestComplete?: (result: AITestResult) => void;
}

export default function AITestPanel({ onTestComplete }: AITestPanelProps) {
  const [aiTestQuery, setAiTestQuery] = useState('서버 상태 어때?');
  const [aiTestMode, setAiTestMode] = useState('auto');
  const [aiTestResult, setAiTestResult] = useState<AITestResult | null>(null);
  const [aiTestLoading, setAiTestLoading] = useState(false);

  const testAINaturalQuery = async () => {
    if (!aiTestQuery.trim()) return;

    setAiTestLoading(true);
    setAiTestResult(null);

    try {
      const response = await fetch('/api/ai/test-simple-query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: aiTestQuery,
          mode: aiTestMode,
          source: 'dev-tools',
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setAiTestResult(result);
      onTestComplete?.(result);
    } catch (error) {
      const errorResult: AITestResult = {
        success: false,
        engine: 'unknown',
        response: '',
        responseTime: 0,
        error:
          error instanceof Error
            ? error.message
            : '네트워크 오류가 발생했습니다.',
      };
      setAiTestResult(errorResult);
      onTestComplete?.(errorResult);
    } finally {
      setAiTestLoading(false);
    }
  };

  const quickTest = async (query: string) => {
    setAiTestQuery(query);
    setTimeout(() => testAINaturalQuery(), 100);
  };

  return (
    <Card>
      <CardHeader>
        <div className='flex items-center space-x-2'>
          <Bot className='h-5 w-5' />
          <CardTitle>🤖 AI 자연어 테스트</CardTitle>
        </div>
        <CardDescription>
          통합 AI 엔진 자연어 질의 테스트 - 실제 응답 확인
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {/* 프리셋 질문들 */}
          <div>
            <p className='text-sm font-medium mb-2'>빠른 테스트 질문:</p>
            <div className='flex flex-wrap gap-2'>
              {presetQueries.map((query, index) => (
                <Button
                  key={index}
                  variant='outline'
                  size='sm'
                  onClick={() => quickTest(query)}
                  disabled={aiTestLoading}
                  className='text-xs'
                >
                  {query}
                </Button>
              ))}
            </div>
          </div>

          {/* AI 테스트 섹션 */}
          <div className='space-y-3'>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <div className='md:col-span-2'>
                <Textarea
                  placeholder='AI에게 질문을 입력하세요... (예: CPU 사용률이 높은 서버는?)'
                  value={aiTestQuery}
                  onChange={e => setAiTestQuery(e.target.value)}
                  rows={3}
                  disabled={aiTestLoading}
                />
              </div>
              <div className='space-y-2'>
                <Select value={aiTestMode} onValueChange={setAiTestMode}>
                  <SelectTrigger>
                    <SelectValue placeholder='AI 모드 선택' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='auto'>자동 (권장)</SelectItem>
                    <SelectItem value='google'>Google AI 우선</SelectItem>
                    <SelectItem value='local'>로컬 AI 우선</SelectItem>
                    <SelectItem value='mcp'>MCP 시스템</SelectItem>
                    <SelectItem value='hybrid'>하이브리드</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={testAINaturalQuery}
                  disabled={aiTestLoading || !aiTestQuery.trim()}
                  className='w-full'
                >
                  {aiTestLoading ? (
                    <>
                      <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                      처리 중...
                    </>
                  ) : (
                    <>
                      <Send className='w-4 h-4 mr-2' />
                      질의 실행
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* 테스트 결과 */}
            {aiTestResult && (
              <Card
                className={`mt-4 ${aiTestResult.success ? 'border-green-200' : 'border-red-200'}`}
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-2'>
                      {aiTestResult.success ? (
                        <CheckCircle className='h-5 w-5 text-green-500' />
                      ) : (
                        <XCircle className='h-5 w-5 text-red-500' />
                      )}
                      <CardTitle className='text-lg'>
                        {aiTestResult.success ? 'AI 응답 성공' : 'AI 응답 실패'}
                      </CardTitle>
                    </div>
                    <div className='flex items-center space-x-2'>
                      <Badge variant='outline'>{aiTestResult.engine}</Badge>
                      <Badge variant='secondary'>
                        {aiTestResult.responseTime}ms
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {aiTestResult.success ? (
                    <div className='space-y-3'>
                      <div>
                        <p className='text-sm font-medium mb-1'>AI 응답:</p>
                        <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                          <p className='text-sm'>{aiTestResult.response}</p>
                        </div>
                      </div>
                      {aiTestResult.metadata && (
                        <div>
                          <p className='text-sm font-medium mb-1'>
                            메타데이터:
                          </p>
                          <div className='bg-slate-50 dark:bg-slate-800 p-3 rounded-lg'>
                            <pre className='text-xs overflow-x-auto'>
                              {JSON.stringify(aiTestResult.metadata, null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className='bg-red-50 dark:bg-red-900/20 p-3 rounded-lg'>
                      <p className='text-sm text-red-700 dark:text-red-300 font-medium'>
                        오류:
                      </p>
                      <p className='text-sm text-red-600 dark:text-red-400'>
                        {aiTestResult.error}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* AI 테스트 안내 */}
          <div className='bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg'>
            <div className='flex items-start space-x-2'>
              <MessageSquare className='h-5 w-5 text-blue-600 mt-0.5' />
              <div className='text-sm text-blue-700 dark:text-blue-300'>
                <p className='font-medium mb-1'>💡 AI 테스트 팁:</p>
                <ul className='list-disc list-inside space-y-1 text-xs'>
                  <li>
                    구체적인 질문을 하면 더 정확한 답변을 받을 수 있습니다
                  </li>
                  <li>서버 상태, 성능 분석, 에러 진단 등을 질문해보세요</li>
                  <li>AI 모드를 바꿔가며 응답 품질을 비교해보세요</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
