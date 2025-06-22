'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertCircle,
  Brain,
  CheckCircle,
  Database,
  Globe,
  RefreshCw,
  XCircle,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface AIEngineStatus {
  mcp: {
    status: 'online' | 'offline' | 'error';
    latency?: number | null;
    tools?: number;
  };
  rag: {
    status: 'pgvector_ready' | 'offline' | 'error';
    confidence?: number;
    responseTime?: number;
  };
  google_ai: {
    status: 'ready' | 'offline' | 'error' | 'not_configured';
    model?: string;
    responseTime?: number;
  };
  redis?: {
    status: 'connected' | 'offline' | 'error';
    responseTime?: number;
  };
  supabase?: {
    status: 'connected' | 'offline' | 'error';
    responseTime?: number;
  };
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'critical';
}

export default function AIHealthStatus() {
  const [status, setStatus] = useState<AIEngineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchHealthStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai/health');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('AI 헬스 체크 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthStatus();

    // 90초마다 자동 업데이트 (30초 → 90초로 변경, 과도한 요청 방지)
    const interval = setInterval(fetchHealthStatus, 90000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (engineStatus: string) => {
    switch (engineStatus) {
      case 'online':
      case 'ready':
      case 'pgvector_ready':
      case 'connected':
        return <CheckCircle className='w-4 h-4 text-green-500' />;
      case 'offline':
      case 'not_configured':
        return <XCircle className='w-4 h-4 text-red-500' />;
      case 'error':
        return <AlertCircle className='w-4 h-4 text-yellow-500' />;
      default:
        return <AlertCircle className='w-4 h-4 text-gray-400' />;
    }
  };

  const getStatusColor = (engineStatus: string) => {
    switch (engineStatus) {
      case 'online':
      case 'ready':
      case 'pgvector_ready':
      case 'connected':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'offline':
      case 'not_configured':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'error':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOverallStatusColor = (overall: string) => {
    switch (overall) {
      case 'healthy':
        return 'text-green-600';
      case 'degraded':
        return 'text-yellow-600';
      case 'critical':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!status) {
    return (
      <Card className='mt-4 border-gray-200'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-center space-x-2'>
            <RefreshCw className='w-4 h-4 animate-spin' />
            <span className='text-sm text-gray-600'>
              AI 엔진 상태 확인 중...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mt-4 border-gray-200'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between mb-3'>
          <div className='flex items-center space-x-2'>
            <Zap className='w-4 h-4 text-blue-500' />
            <span className='text-sm font-medium'>AI 엔진 상태</span>
            <Badge
              variant='outline'
              className={`text-xs ${getOverallStatusColor(status.overall)}`}
            >
              {status.overall === 'healthy'
                ? '정상'
                : status.overall === 'degraded'
                  ? '제한적'
                  : '오류'}
            </Badge>
          </div>
          <Button
            variant='ghost'
            size='sm'
            onClick={fetchHealthStatus}
            disabled={loading}
            className='h-6 w-6 p-0'
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className='space-y-2'>
          {/* MCP 엔진 */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Brain className='w-3 h-3 text-purple-500' />
              <span className='text-xs text-gray-600'>MCP</span>
              {getStatusIcon(status.mcp.status)}
            </div>
            <div className='flex items-center space-x-1'>
              <Badge
                variant='outline'
                className={`text-xs ${getStatusColor(status.mcp.status)}`}
              >
                {status.mcp.status === 'online'
                  ? '온라인'
                  : status.mcp.status === 'offline'
                    ? '오프라인'
                    : '오류'}
              </Badge>
              {status.mcp.tools !== undefined && (
                <span className='text-xs text-gray-500'>
                  {status.mcp.tools}개 도구
                </span>
              )}
            </div>
          </div>

          {/* RAG 엔진 */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Database className='w-3 h-3 text-blue-500' />
              <span className='text-xs text-gray-600'>RAG</span>
              {getStatusIcon(status.rag.status)}
            </div>
            <div className='flex items-center space-x-1'>
              <Badge
                variant='outline'
                className={`text-xs ${getStatusColor(status.rag.status)}`}
              >
                {status.rag.status === 'pgvector_ready'
                  ? '벡터DB 준비'
                  : status.rag.status === 'offline'
                    ? '오프라인'
                    : '오류'}
              </Badge>
              {status.rag.responseTime && (
                <span className='text-xs text-gray-500'>
                  {status.rag.responseTime}ms
                </span>
              )}
            </div>
          </div>

          {/* Google AI 엔진 */}
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-2'>
              <Globe className='w-3 h-3 text-green-500' />
              <span className='text-xs text-gray-600'>Google AI</span>
              {getStatusIcon(status.google_ai.status)}
            </div>
            <div className='flex items-center space-x-1'>
              <Badge
                variant='outline'
                className={`text-xs ${getStatusColor(status.google_ai.status)}`}
              >
                {status.google_ai.status === 'ready'
                  ? '준비됨'
                  : status.google_ai.status === 'not_configured'
                    ? '미설정'
                    : status.google_ai.status === 'offline'
                      ? '오프라인'
                      : '오류'}
              </Badge>
              {status.google_ai.model && (
                <span className='text-xs text-gray-500'>
                  {status.google_ai.model}
                </span>
              )}
            </div>
          </div>

          {/* Redis (선택적) */}
          {status.redis && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <div className='w-3 h-3 bg-red-500 rounded-full' />
                <span className='text-xs text-gray-600'>Redis</span>
                {getStatusIcon(status.redis.status)}
              </div>
              <div className='flex items-center space-x-1'>
                <Badge
                  variant='outline'
                  className={`text-xs ${getStatusColor(status.redis.status)}`}
                >
                  {status.redis.status === 'connected'
                    ? '연결됨'
                    : status.redis.status === 'offline'
                      ? '오프라인'
                      : '오류'}
                </Badge>
                {status.redis.responseTime && (
                  <span className='text-xs text-gray-500'>
                    {status.redis.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Supabase (선택적) */}
          {status.supabase && (
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <div className='w-3 h-3 bg-green-600 rounded-full' />
                <span className='text-xs text-gray-600'>Supabase</span>
                {getStatusIcon(status.supabase.status)}
              </div>
              <div className='flex items-center space-x-1'>
                <Badge
                  variant='outline'
                  className={`text-xs ${getStatusColor(status.supabase.status)}`}
                >
                  {status.supabase.status === 'connected'
                    ? '연결됨'
                    : status.supabase.status === 'offline'
                      ? '오프라인'
                      : '오류'}
                </Badge>
                {status.supabase.responseTime && (
                  <span className='text-xs text-gray-500'>
                    {status.supabase.responseTime}ms
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {lastUpdate && (
          <div className='mt-3 pt-2 border-t border-gray-100'>
            <span className='text-xs text-gray-500'>
              마지막 업데이트: {lastUpdate.toLocaleTimeString('ko-KR')}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
