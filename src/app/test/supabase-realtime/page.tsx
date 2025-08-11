/**
 * 🧪 Supabase Realtime 테스트 페이지
 * 
 * Redis → Supabase 마이그레이션 검증용
 */

'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Database, 
  Wifi, 
  WifiOff,
  Trash2,
  RefreshCw
} from 'lucide-react';

// Supabase 클라이언트
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface ThinkingStep {
  id: string;
  session_id: string;
  step: string;
  description: string | null;
  status: string;
  service: string | null;
  timestamp: number;
  duration: number | null;
  created_at: string;
}

export default function SupabaseRealtimeTestPage() {
  const [sessionId, setSessionId] = useState('');
  const [steps, setSteps] = useState<ThinkingStep[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 폼 상태
  const [stepText, setStepText] = useState('');
  const [description, setDescription] = useState('');
  const [service, setService] = useState('test-service');

  // 세션 ID 생성
  useEffect(() => {
    setSessionId(`test-${Date.now()}`);
  }, []);

  // Realtime 구독
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`test-thinking-steps:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thinking_steps',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          console.log('Realtime event:', payload);
          
          if (payload.eventType === 'INSERT') {
            setSteps(prev => [...prev, payload.new as ThinkingStep]);
          } else if (payload.eventType === 'UPDATE') {
            setSteps(prev => 
              prev.map(step => 
                step.id === payload.new.id 
                  ? { ...step, ...payload.new }
                  : step
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setSteps(prev => prev.filter(step => step.id !== payload.old.id));
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        setIsConnected(status === 'SUBSCRIBED');
      });

    // 기존 단계 로드
    loadExistingSteps();

    return () => {
      channel.unsubscribe();
      setIsConnected(false);
    };
  }, [sessionId]);

  // 기존 단계 로드
  const loadExistingSteps = async () => {
    try {
      const { data, error } = await supabase
        .from('thinking_steps')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setSteps(data || []);
    } catch (err) {
      console.error('Failed to load steps:', err);
      setError('단계 로드 실패');
    }
  };

  // 단계 추가
  const addStep = async () => {
    if (!stepText.trim()) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('thinking_steps')
        .insert({
          session_id: sessionId,
          step: stepText,
          description: description || null,
          status: 'processing',
          service: service || null,
          timestamp: Date.now(),
        });

      if (error) throw error;

      // 폼 초기화
      setStepText('');
      setDescription('');
      
      // 3초 후 자동 완료
      setTimeout(async () => {
        const latestStep = steps[steps.length - 1];
        if (latestStep && latestStep.status === 'processing') {
          await updateStepStatus(latestStep.id, 'completed');
        }
      }, 3000);
    } catch (err) {
      console.error('Failed to add step:', err);
      setError(err.message || '단계 추가 실패');
    } finally {
      setIsLoading(false);
    }
  };

  // 상태 업데이트
  const updateStepStatus = async (stepId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('thinking_steps')
        .update({ 
          status,
          duration: status === 'completed' ? 3000 : null
        })
        .eq('id', stepId);

      if (error) throw error;
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // 세션 초기화
  const clearSession = async () => {
    if (!confirm('정말로 모든 단계를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('thinking_steps')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      setSteps([]);
    } catch (err) {
      console.error('Failed to clear session:', err);
      setError('세션 초기화 실패');
    }
  };

  // API 테스트
  const testAPI = async () => {
    try {
      const response = await fetch('/api/ai/thinking/stream-v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          step: 'API 테스트 단계',
          description: 'POST 엔드포인트 테스트',
          status: 'processing',
        }),
      });

      if (!response.ok) throw new Error('API 요청 실패');
      
      const data = await response.json();
      console.log('API response:', data);
    } catch (err) {
      console.error('API test failed:', err);
      setError('API 테스트 실패: ' + err.message);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center gap-2">
            <Database className="w-6 h-6" />
            Supabase Realtime 테스트
          </CardTitle>
          <CardDescription>
            Redis → Supabase 마이그레이션 검증
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">세션 ID</div>
              <code className="text-sm">{sessionId}</code>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">연결 상태</div>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? (
                  <><Wifi className="w-3 h-3 mr-1" /> 연결됨</>
                ) : (
                  <><WifiOff className="w-3 h-3 mr-1" /> 연결 안됨</>
                )}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 단계 추가 폼 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>새 단계 추가</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">단계 제목</label>
              <Input
                value={stepText}
                onChange={(e) => setStepText(e.target.value)}
                placeholder="예: 데이터 검색 중..."
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">설명 (선택)</label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="상세 설명..."
                rows={2}
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="text-sm font-medium">서비스</label>
              <Input
                value={service}
                onChange={(e) => setService(e.target.value)}
                placeholder="예: supabase-rag"
                disabled={isLoading}
              />
            </div>
            
            {error && (
              <div className="text-sm text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <Button 
                onClick={addStep} 
                disabled={isLoading || !stepText.trim()}
              >
                {isLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 추가 중...</>
                ) : (
                  '단계 추가'
                )}
              </Button>
              <Button variant="outline" onClick={testAPI}>
                API 테스트
              </Button>
              <Button variant="outline" onClick={loadExistingSteps}>
                <RefreshCw className="w-4 h-4 mr-2" />
                새로고침
              </Button>
              <Button variant="destructive" onClick={clearSession}>
                <Trash2 className="w-4 h-4 mr-2" />
                초기화
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 실시간 단계 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>생각중 단계 ({steps.length}개)</CardTitle>
          <CardDescription>실시간으로 업데이트됩니다</CardDescription>
        </CardHeader>
        <CardContent>
          {steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              아직 단계가 없습니다. 위에서 추가해보세요.
            </div>
          ) : (
            <div className="space-y-3">
              {steps.map((step) => (
                <div 
                  key={step.id} 
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {step.status === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : step.status === 'failed' ? (
                        <AlertCircle className="w-5 h-5 text-red-500" />
                      ) : (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      )}
                      <span className="font-medium">{step.step}</span>
                    </div>
                    <Badge variant="outline">{step.status}</Badge>
                  </div>
                  
                  {step.description && (
                    <p className="text-sm text-muted-foreground pl-7">
                      {step.description}
                    </p>
                  )}
                  
                  <div className="flex gap-4 text-xs text-muted-foreground pl-7">
                    {step.service && (
                      <span>서비스: {step.service}</span>
                    )}
                    {step.duration && (
                      <span>소요시간: {step.duration}ms</span>
                    )}
                    <span>
                      생성: {new Date(step.created_at).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {step.status === 'processing' && (
                    <div className="pl-7">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStepStatus(step.id, 'completed')}
                      >
                        완료로 변경
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}