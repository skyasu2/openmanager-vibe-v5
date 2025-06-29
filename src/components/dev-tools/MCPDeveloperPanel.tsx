'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Play,
  Server,
  Settings,
} from 'lucide-react';
import { useState } from 'react';

interface MCPTestResult {
  tool: string;
  success: boolean;
  data?: any;
  error?: string;
  responseTime: number;
  timestamp: string;
}

const MCPDeveloperPanel = () => {
  const [results, setResults] = useState<MCPTestResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [customTool, setCustomTool] = useState('');
  const [customParams, setCustomParams] = useState('{}');

  // 사전 정의된 MCP 도구들
  const predefinedTools = [
    {
      name: 'get_system_status',
      icon: <Server className='w-4 h-4' />,
      params: { detailed: true },
      description: '시스템 상태 및 성능 정보 조회',
    },
    {
      name: 'get_ai_engines_status',
      icon: <Activity className='w-4 h-4' />,
      params: {},
      description: 'AI 엔진 상태 및 메트릭 조회',
    },
    {
      name: 'get_server_metrics',
      icon: <Settings className='w-4 h-4' />,
      params: { serverId: 'dev-server' },
      description: '서버 리소스 사용량 조회',
    },
    {
      name: 'analyze_logs',
      icon: <FileText className='w-4 h-4' />,
      params: { level: 'all', limit: 10 },
      description: '로그 분석 및 필터링',
    },
  ];

  const callMCPTool = async (tool: string, params: any = {}) => {
    const startTime = Date.now();

    try {
      const response = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool, params }),
      });

      const data = await response.json();
      const responseTime = Date.now() - startTime;

      const result: MCPTestResult = {
        tool,
        success: data.success,
        data: data.success ? data.data : undefined,
        error: data.success ? undefined : data.error,
        responseTime,
        timestamp: new Date().toISOString(),
      };

      setResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const result: MCPTestResult = {
        tool,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        responseTime,
        timestamp: new Date().toISOString(),
      };

      setResults(prev => [result, ...prev.slice(0, 9)]);
      return result;
    }
  };

  const testAllTools = async () => {
    setIsLoading(true);
    setResults([]);

    for (const tool of predefinedTools) {
      await callMCPTool(tool.name, tool.params);
      await new Promise(resolve => setTimeout(resolve, 100)); // 0.1초 딜레이
    }

    setIsLoading(false);
  };

  const testCustomTool = async () => {
    if (!customTool.trim()) return;

    let params = {};
    try {
      params = JSON.parse(customParams);
    } catch (error) {
      alert('Invalid JSON in parameters');
      return;
    }

    setIsLoading(true);
    await callMCPTool(customTool, params);
    setIsLoading(false);
  };

  const downloadResults = () => {
    const dataStr = JSON.stringify(results, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mcp-test-results-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Server className='w-5 h-5' />
            MCP 개발 테스터
            <Badge variant='outline'>v1.0.0</Badge>
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Vercel 내장 MCP를 활용한 개발/테스트 도구
          </p>
        </CardHeader>
        <CardContent className='space-y-4'>
          {/* 빠른 테스트 버튼들 */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>⚡ 빠른 테스트</h3>
            <div className='grid grid-cols-2 gap-2'>
              {predefinedTools.map(tool => (
                <Button
                  key={tool.name}
                  variant='outline'
                  size='sm'
                  onClick={() => callMCPTool(tool.name, tool.params)}
                  disabled={isLoading}
                  className='flex items-center gap-2 justify-start'
                >
                  {tool.icon}
                  <span className='text-xs'>{tool.name}</span>
                </Button>
              ))}
            </div>
            <Button
              onClick={testAllTools}
              disabled={isLoading}
              className='w-full'
            >
              <Play className='w-4 h-4 mr-2' />
              모든 도구 테스트
            </Button>
          </div>

          {/* 커스텀 테스트 */}
          <div className='space-y-3'>
            <h3 className='text-sm font-medium'>🔧 커스텀 테스트</h3>
            <div className='grid grid-cols-2 gap-2'>
              <Input
                placeholder='도구 이름 (예: get_system_status)'
                value={customTool}
                onChange={e => setCustomTool(e.target.value)}
              />
              <Input
                placeholder='파라미터 JSON (예: {})'
                value={customParams}
                onChange={e => setCustomParams(e.target.value)}
              />
            </div>
            <Button
              onClick={testCustomTool}
              disabled={isLoading || !customTool.trim()}
              variant='secondary'
              className='w-full'
            >
              <Play className='w-4 h-4 mr-2' />
              커스텀 도구 테스트
            </Button>
          </div>

          {/* 결과 다운로드 */}
          {results.length > 0 && (
            <Button
              onClick={downloadResults}
              variant='outline'
              className='w-full'
            >
              <Download className='w-4 h-4 mr-2' />
              테스트 결과 다운로드 ({results.length}개)
            </Button>
          )}
        </CardContent>
      </Card>

      {/* 테스트 결과 */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Activity className='w-5 h-5' />
              테스트 결과
              <Badge variant='secondary'>{results.length}개</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className='space-y-3'>
            {results.map((result, index) => (
              <Alert
                key={index}
                className={
                  result.success ? 'border-green-200' : 'border-red-200'
                }
              >
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-2'>
                    {result.success ? (
                      <CheckCircle2 className='w-4 h-4 text-green-600' />
                    ) : (
                      <AlertCircle className='w-4 h-4 text-red-600' />
                    )}
                    <div>
                      <p className='font-medium text-sm'>{result.tool}</p>
                      <p className='text-xs text-muted-foreground'>
                        {result.responseTime}ms •{' '}
                        {new Date(result.timestamp).toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  </div>
                  <Badge variant={result.success ? 'default' : 'destructive'}>
                    {result.success ? '성공' : '실패'}
                  </Badge>
                </div>

                {result.error && (
                  <AlertDescription className='mt-2 text-sm'>
                    ❌ {result.error}
                  </AlertDescription>
                )}

                {result.data && (
                  <details className='mt-2'>
                    <summary className='text-xs cursor-pointer hover:underline'>
                      응답 데이터 보기
                    </summary>
                    <pre className='mt-1 text-xs bg-muted p-2 rounded overflow-x-auto'>
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      {/* 개발 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <FileText className='w-5 h-5' />
            개발 가이드
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          <div className='text-sm space-y-2'>
            <p>
              <strong>🔧 로컬 개발:</strong> http://localhost:3000/api/mcp
            </p>
            <p>
              <strong>🌐 프로덕션:</strong>{' '}
              https://openmanager-vibe-v5-p64aybo8u-skyasus-projects.vercel.app/api/mcp
            </p>
            <p>
              <strong>📋 사용 가능한 도구:</strong> get_system_status,
              get_ai_engines_status, get_server_metrics, analyze_logs
            </p>
            <p>
              <strong>🎯 용도:</strong> 개발/테스트 환경에서 MCP 통합 검증
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MCPDeveloperPanel;
