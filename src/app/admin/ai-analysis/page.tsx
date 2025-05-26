'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// UI 컴포넌트들은 기본 HTML 요소로 대체
import { 
  Brain, 
  Search, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  FileText,
  Play,
  RotateCcw,
  Download,
  BarChart3
} from 'lucide-react';

interface AnalysisSession {
  id: string;
  timestamp: string;
  adminId: string;
  analysisType: string;
  status: 'pending' | 'ai_analyzed' | 'admin_reviewed' | 'implemented';
  logCount: number;
  focusArea?: string;
  hasAIResponse: boolean;
}

// AIAnalysisResponse interface removed as it's not used

export default function AdminAIAnalysisPage() {
  const [sessions, setSessions] = useState<AnalysisSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('sessions');

  // 새 분석 세션 폼 상태
  const [newSessionForm, setNewSessionForm] = useState({
    analysisType: 'pattern_discovery',
    timeRange: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    focusArea: '',
    maxTokens: 4000,
    model: 'gpt-4',
    logLimit: 500
  });

  // 로그 요약 정보
  const [logSummary, setLogSummary] = useState<any>(null);

  // 새로운 컨텍스트 관리 상태들
  const [contextVersions, setContextVersions] = useState<any>({ current: null, versions: [] });
  const [mergedContext, setMergedContext] = useState<any>(null);
  const [logStatistics, setLogStatistics] = useState<any>(null);
  const [versionComparison, setVersionComparison] = useState<any>(null);
  const [contextForm, setContextForm] = useState({
    type: 'base' as 'base' | 'advanced' | 'custom',
    clientId: '',
    filename: '',
    content: '',
    version: '',
    description: ''
  });

  // 새로운 상태 변수들
  // const [topFailures, setTopFailures] = useState<any[]>([]);
  // const [queryGroups, setQueryGroups] = useState<any[]>([]);
  // const [improvementHistory, setImprovementHistory] = useState<any[]>([]);
  // const [recentImprovements, setRecentImprovements] = useState<any>(null);
  // const [advancedAnalysis, setAdvancedAnalysis] = useState<any>(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const response = await fetch('/api/admin/ai-analysis?action=sessions');
      const result = await response.json();
      
      if (result.success) {
        setSessions(result.data.sessions);
      }
    } catch (error) {
      console.error('세션 로드 실패:', error);
    }
  };

  const loadLogSummary = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'log-summary',
        startDate: newSessionForm.timeRange.start,
        endDate: newSessionForm.timeRange.end,
        ...(newSessionForm.focusArea && { focusArea: newSessionForm.focusArea })
      });

      const response = await fetch(`/api/admin/ai-analysis?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setLogSummary(result.data);
      }
    } catch (error) {
      console.error('로그 요약 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysisSession = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start-session',
          adminId: 'admin_user', // 실제로는 로그인된 사용자 ID
          ...newSessionForm,
          timeRange: {
            start: new Date(newSessionForm.timeRange.start).toISOString(),
            end: new Date(newSessionForm.timeRange.end).toISOString()
          }
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSessions();
        setActiveTab('sessions');
        alert(`분석 세션이 시작되었습니다. (${result.data.logCount}개 로그)`);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('분석 세션 시작 실패:', error);
      alert('분석 세션 시작에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const executeAIAnalysis = async (sessionId: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute-analysis',
          sessionId
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSessions();
        await loadSessionDetail(sessionId);
        alert(`AI 분석이 완료되었습니다. (토큰 사용: ${result.data.tokensUsed})`);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('AI 분석 실행 실패:', error);
      alert('AI 분석 실행에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadSessionDetail = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/admin/ai-analysis?action=session-detail&sessionId=${sessionId}`);
      const result = await response.json();
      
      if (result.success) {
        setSelectedSession(result.data);
        setActiveTab('detail');
      }
    } catch (error) {
      console.error('세션 상세 로드 실패:', error);
    }
  };

  const completeReview = async (sessionId: string, adminNotes: string, approved: string[], rejected: string[]) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-review',
          sessionId,
          adminNotes,
          approvedSuggestions: approved,
          rejectedSuggestions: rejected
        })
      });

      const result = await response.json();
      
      if (result.success) {
        await loadSessions();
        await loadSessionDetail(sessionId);
        alert('관리자 검토가 완료되었습니다.');
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('검토 완료 실패:', error);
      alert('검토 완료에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 새로운 API 호출 함수들 - 사용하지 않는 함수들 제거됨

  // 새로운 컨텍스트 관리 API 호출 함수들
  const loadContextVersions = async (type: 'base' | 'advanced' | 'custom', clientId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'context-versions',
        type,
        ...(clientId && { clientId })
      });

      const response = await fetch(`/api/admin/ai-analysis?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setContextVersions(result.data);
      }
    } catch (error) {
      console.error('컨텍스트 버전 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMergedContext = async (clientId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'context-load',
        ...(clientId && { clientId })
      });

      const response = await fetch(`/api/admin/ai-analysis?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setMergedContext(result.data);
      }
    } catch (error) {
      console.error('통합 컨텍스트 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadLogStatistics = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/ai-analysis?action=log-statistics');
      const result = await response.json();
      
      if (result.success) {
        setLogStatistics(result.data);
      }
    } catch (error) {
      console.error('로그 통계 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const compareVersions = async (type: 'base' | 'advanced' | 'custom', version1: string, version2: string, clientId?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        action: 'version-compare',
        type,
        version1,
        version2,
        ...(clientId && { clientId })
      });

      const response = await fetch(`/api/admin/ai-analysis?${params}`);
      const result = await response.json();
      
      if (result.success) {
        setVersionComparison(result.data);
      }
    } catch (error) {
      console.error('버전 비교 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveContextDocument = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-context-document',
          type: contextForm.type,
          filename: contextForm.filename,
          content: contextForm.content,
          clientId: contextForm.clientId || undefined
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert('컨텍스트 문서가 저장되었습니다.');
        setContextForm({ ...contextForm, filename: '', content: '' });
        await loadContextVersions(contextForm.type, contextForm.clientId || undefined);
      } else {
        alert(`오류: ${result.error}`);
      }
    } catch (error) {
      console.error('컨텍스트 문서 저장 실패:', error);
      alert('컨텍스트 문서 저장에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const switchContextVersion = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'switch-context-version',
          type: contextForm.type,
          targetVersion: contextForm.version,
          clientId: contextForm.clientId || undefined,
          createBackup: true
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        await loadContextVersions(contextForm.type, contextForm.clientId || undefined);
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      console.error('버전 전환 실패:', error);
      alert('버전 전환에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const createReleaseVersion = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create-release-version',
          type: contextForm.type,
          version: contextForm.version,
          clientId: contextForm.clientId || undefined,
          description: contextForm.description
        })
      });

      const result = await response.json();
      
      if (result.success) {
        alert(result.message);
        setContextForm({ ...contextForm, version: '', description: '' });
        await loadContextVersions(contextForm.type, contextForm.clientId || undefined);
      } else {
        alert(`오류: ${result.message}`);
      }
    } catch (error) {
      console.error('릴리스 버전 생성 실패:', error);
      alert('릴리스 버전 생성에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', text: '대기중' },
      ai_analyzed: { color: 'bg-blue-100 text-blue-800', text: 'AI 분석완료' },
      admin_reviewed: { color: 'bg-green-100 text-green-800', text: '관리자 검토완료' },
      implemented: { color: 'bg-purple-100 text-purple-800', text: '구현완료' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: { color: 'bg-red-100 text-red-800', text: '높음' },
      medium: { color: 'bg-yellow-100 text-yellow-800', text: '보통' },
      low: { color: 'bg-green-100 text-green-800', text: '낮음' }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            AI 분석 관리
          </h1>
          <p className="text-gray-600 mt-2">
            사용자 로그를 AI로 분석하여 패턴 발견 및 개선사항을 도출합니다
          </p>
        </div>
        <Button onClick={loadSessions} variant="outline">
          <RotateCcw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="sessions">분석 세션</TabsTrigger>
          <TabsTrigger value="new-session">새 분석</TabsTrigger>
          <TabsTrigger value="context">컨텍스트 관리</TabsTrigger>
          <TabsTrigger value="logs">로그 관리</TabsTrigger>
          <TabsTrigger value="detail">세션 상세</TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                분석 세션 목록
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    분석 세션이 없습니다. 새 분석을 시작해보세요.
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{session.analysisType}</h3>
                            {getStatusBadge(session.status)}
                          </div>
                          <div className="text-sm text-gray-600">
                            <p>세션 ID: {session.id}</p>
                            <p>로그 수: {session.logCount}개</p>
                            <p>생성일: {new Date(session.timestamp).toLocaleString()}</p>
                            {session.focusArea && <p>포커스: {session.focusArea}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {session.status === 'pending' && (
                            <Button 
                              onClick={() => executeAIAnalysis(session.id)}
                              disabled={loading}
                              size="sm"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              AI 분석 실행
                            </Button>
                          )}
                          <Button 
                            onClick={() => loadSessionDetail(session.id)}
                            variant="outline"
                            size="sm"
                          >
                            상세보기
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-session" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                새 AI 분석 세션
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                             <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label htmlFor="analysisType" className="block text-sm font-medium mb-2">분석 타입</label>
                   <select 
                     value={newSessionForm.analysisType} 
                     onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewSessionForm(prev => ({ ...prev, analysisType: e.target.value }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   >
                     <option value="pattern_discovery">패턴 발견</option>
                     <option value="failure_analysis">실패 분석</option>
                     <option value="improvement_suggestion">개선 제안</option>
                     <option value="intent_classification">인텐트 분류</option>
                   </select>
                 </div>
 
                 <div>
                   <label htmlFor="focusArea" className="block text-sm font-medium mb-2">포커스 영역</label>
                   <select 
                     value={newSessionForm.focusArea} 
                     onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewSessionForm(prev => ({ ...prev, focusArea: e.target.value }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   >
                     <option value="">전체</option>
                     <option value="low_confidence">낮은 신뢰도</option>
                     <option value="negative_feedback">부정적 피드백</option>
                     <option value="slow_response">느린 응답</option>
                     <option value="unclassified">미분류</option>
                   </select>
                 </div>
 
                 <div>
                   <label htmlFor="startDate" className="block text-sm font-medium mb-2">시작일</label>
                   <input 
                     type="date" 
                     value={newSessionForm.timeRange.start}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionForm(prev => ({ 
                       ...prev, 
                       timeRange: { ...prev.timeRange, start: e.target.value }
                     }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   />
                 </div>
 
                 <div>
                   <label htmlFor="endDate" className="block text-sm font-medium mb-2">종료일</label>
                   <input 
                     type="date" 
                     value={newSessionForm.timeRange.end}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionForm(prev => ({ 
                       ...prev, 
                       timeRange: { ...prev.timeRange, end: e.target.value }
                     }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   />
                 </div>
 
                 <div>
                   <label htmlFor="logLimit" className="block text-sm font-medium mb-2">로그 제한</label>
                   <input 
                     type="number" 
                     value={newSessionForm.logLimit}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionForm(prev => ({ 
                       ...prev, 
                       logLimit: parseInt(e.target.value) || 500
                     }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   />
                 </div>
 
                 <div>
                   <label htmlFor="maxTokens" className="block text-sm font-medium mb-2">최대 토큰</label>
                   <input 
                     type="number" 
                     value={newSessionForm.maxTokens}
                     onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSessionForm(prev => ({ 
                       ...prev, 
                       maxTokens: parseInt(e.target.value) || 4000
                     }))}
                     className="w-full p-2 border border-gray-300 rounded-md"
                   />
                 </div>
               </div>

              <div className="flex gap-2">
                <Button onClick={loadLogSummary} variant="outline" disabled={loading}>
                  로그 미리보기
                </Button>
                <Button onClick={startAnalysisSession} disabled={loading}>
                  분석 세션 시작
                </Button>
              </div>

              {logSummary && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="text-lg">로그 요약</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <p><strong>로그 수:</strong> {logSummary.logCount}개</p>
                      <p><strong>예상 토큰:</strong> {logSummary.estimatedTokens}</p>
                      <div className="mt-4">
                        <strong>상세 요약:</strong>
                        <pre className="mt-2 p-3 bg-gray-100 rounded text-xs whitespace-pre-wrap">
                          {logSummary.summary}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                컨텍스트 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 컨텍스트 문서 저장 폼 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">📝 컨텍스트 문서 저장</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">타입</label>
                    <select 
                      value={contextForm.type} 
                      onChange={(e) => setContextForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="base">Base</option>
                      <option value="advanced">Advanced</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">클라이언트 ID (Custom용)</label>
                    <input 
                      type="text" 
                      value={contextForm.clientId}
                      onChange={(e) => setContextForm(prev => ({ ...prev, clientId: e.target.value }))}
                      placeholder="클라이언트 ID (선택사항)"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">파일명</label>
                    <input 
                      type="text" 
                      value={contextForm.filename}
                      onChange={(e) => setContextForm(prev => ({ ...prev, filename: e.target.value }))}
                      placeholder="파일명 (확장자 제외)"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">버전</label>
                    <input 
                      type="text" 
                      value={contextForm.version}
                      onChange={(e) => setContextForm(prev => ({ ...prev, version: e.target.value }))}
                      placeholder="버전 (예: 1.0.0)"
                      className="w-full p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">설명</label>
                  <input 
                    type="text" 
                    value={contextForm.description}
                    onChange={(e) => setContextForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="버전 설명"
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">내용</label>
                  <textarea 
                    value={contextForm.content}
                    onChange={(e) => setContextForm(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="마크다운 형식의 컨텍스트 내용을 입력하세요..."
                    className="w-full p-2 border border-gray-300 rounded-md h-32"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={saveContextDocument} disabled={loading}>
                    문서 저장
                  </Button>
                  <Button onClick={createReleaseVersion} disabled={loading} variant="outline">
                    릴리스 버전 생성
                  </Button>
                </div>
              </div>

              {/* 버전 관리 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">🔄 버전 관리</h3>
                <div className="flex gap-2 mb-4">
                  <Button 
                    onClick={() => loadContextVersions(contextForm.type, contextForm.clientId || undefined)} 
                    disabled={loading}
                  >
                    버전 목록 조회
                  </Button>
                  <Button onClick={switchContextVersion} disabled={loading} variant="outline">
                    버전 전환
                  </Button>
                  <Button onClick={() => loadMergedContext(contextForm.clientId || undefined)} disabled={loading} variant="outline">
                    통합 컨텍스트 로드
                  </Button>
                </div>

                {contextVersions.versions.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">사용 가능한 버전:</h4>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                      {contextVersions.versions.map((version: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex items-center gap-2">
                            <Badge className={version.type === 'release' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}>
                              {version.type}
                            </Badge>
                            <span className="font-medium">v{version.version}</span>
                            <span className="text-sm text-gray-600">{version.fileCount}개 파일</span>
                            <span className="text-sm text-gray-600">{version.size}</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(version.createdAt).toLocaleString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 통합 컨텍스트 미리보기 */}
              {mergedContext && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-4">📖 통합 컨텍스트 미리보기</h3>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="text-blue-800 font-semibold">소스 파일</div>
                      <div className="text-2xl font-bold text-blue-600">{mergedContext.metadata.sources.length}</div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <div className="text-green-800 font-semibold">지식베이스 크기</div>
                      <div className="text-lg font-bold text-green-600">{(mergedContext.knowledgeBase.length / 1024).toFixed(1)}KB</div>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <div className="text-purple-800 font-semibold">인텐트 패턴</div>
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.keys(mergedContext.patterns.intentPatterns || {}).length}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm">
                    <strong>소스 파일:</strong> {mergedContext.metadata.sources.join(', ')}
                  </div>
                  <div className="mt-2">
                    <strong>지식베이스 미리보기:</strong>
                    <pre className="mt-2 p-3 bg-gray-100 rounded text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                      {mergedContext.knowledgeBase.substring(0, 500)}...
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                로그 관리
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 로그 통계 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">📊 로그 통계</h3>
                <div className="flex gap-2 mb-4">
                  <Button onClick={loadLogStatistics} disabled={loading}>
                    통계 조회
                  </Button>
                </div>

                {logStatistics && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="text-blue-800 font-semibold">총 파일 수</div>
                        <div className="text-2xl font-bold text-blue-600">{logStatistics.totalFiles}</div>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-800 font-semibold">총 크기</div>
                        <div className="text-lg font-bold text-green-600">{logStatistics.totalSize}</div>
                      </div>
                      <div className="bg-purple-50 p-3 rounded-lg">
                        <div className="text-purple-800 font-semibold">기간</div>
                        <div className="text-sm font-bold text-purple-600">
                          {logStatistics.oldestLog} ~ {logStatistics.newestLog}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                                             {Object.entries(logStatistics.categories).map(([category, count]) => (
                         <div key={category} className="flex items-center justify-between p-2 border rounded">
                           <span className="font-medium capitalize">{category}</span>
                           <Badge variant="outline">{String(count)}개 파일</Badge>
                         </div>
                       ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 버전 비교 */}
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-4">🔍 버전 비교</h3>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">타입</label>
                    <select 
                      value={contextForm.type} 
                      onChange={(e) => setContextForm(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full p-2 border border-gray-300 rounded-md"
                    >
                      <option value="base">Base</option>
                      <option value="advanced">Advanced</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">버전 1</label>
                    <input 
                      type="text" 
                      placeholder="current 또는 v1.0.0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      id="version1-input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">버전 2</label>
                    <input 
                      type="text" 
                      placeholder="v1.1.0"
                      className="w-full p-2 border border-gray-300 rounded-md"
                      id="version2-input"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => {
                    const version1 = (document.getElementById('version1-input') as HTMLInputElement)?.value;
                    const version2 = (document.getElementById('version2-input') as HTMLInputElement)?.value;
                    if (version1 && version2) {
                      compareVersions(contextForm.type, version1, version2, contextForm.clientId || undefined);
                    }
                  }}
                  disabled={loading}
                >
                  버전 비교
                </Button>

                {versionComparison && versionComparison.comparison && (
                  <div className="mt-4 space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="text-green-800 font-semibold">추가된 파일</div>
                        <div className="text-2xl font-bold text-green-600">
                          {versionComparison.comparison.differences.added.length}
                        </div>
                      </div>
                      <div className="bg-red-50 p-3 rounded-lg">
                        <div className="text-red-800 font-semibold">삭제된 파일</div>
                        <div className="text-2xl font-bold text-red-600">
                          {versionComparison.comparison.differences.removed.length}
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-3 rounded-lg">
                        <div className="text-yellow-800 font-semibold">수정된 파일</div>
                        <div className="text-2xl font-bold text-yellow-600">
                          {versionComparison.comparison.differences.modified.length}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {versionComparison.comparison.differences.added.length > 0 && (
                        <div>
                          <strong className="text-green-600">추가된 파일:</strong>
                          <div className="text-sm text-gray-600">
                            {versionComparison.comparison.differences.added.join(', ')}
                          </div>
                        </div>
                      )}
                      {versionComparison.comparison.differences.removed.length > 0 && (
                        <div>
                          <strong className="text-red-600">삭제된 파일:</strong>
                          <div className="text-sm text-gray-600">
                            {versionComparison.comparison.differences.removed.join(', ')}
                          </div>
                        </div>
                      )}
                      {versionComparison.comparison.differences.modified.length > 0 && (
                        <div>
                          <strong className="text-yellow-600">수정된 파일:</strong>
                          <div className="text-sm text-gray-600">
                            {versionComparison.comparison.differences.modified.join(', ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detail" className="space-y-4">
          {selectedSession ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    세션 상세: {selectedSession.id}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p><strong>분석 타입:</strong> {selectedSession.analysisRequest.analysisType}</p>
                      <p><strong>상태:</strong> {getStatusBadge(selectedSession.status)}</p>
                      <p><strong>로그 수:</strong> {selectedSession.analysisRequest.logs.length}개</p>
                    </div>
                    <div>
                      <p><strong>생성일:</strong> {new Date(selectedSession.timestamp).toLocaleString()}</p>
                      <p><strong>관리자:</strong> {selectedSession.adminId}</p>
                      <p><strong>포커스:</strong> {selectedSession.analysisRequest.focusArea || '전체'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {selectedSession.aiResponse && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      AI 분석 결과
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold mb-2">요약</h4>
                      <p className="text-sm bg-blue-50 p-3 rounded">{selectedSession.aiResponse.summary}</p>
                    </div>

                    {selectedSession.aiResponse.findings.patterns.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">발견된 패턴</h4>
                        <div className="space-y-2">
                          {selectedSession.aiResponse.findings.patterns.map((pattern: any, index: number) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{pattern.pattern}</span>
                                <div className="flex gap-2">
                                  <Badge variant="outline">빈도: {pattern.frequency}</Badge>
                                  <Badge variant="outline">신뢰도: {(pattern.confidence * 100).toFixed(0)}%</Badge>
                                </div>
                              </div>
                              <div className="text-xs text-gray-600">
                                예시: {pattern.examples.join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {selectedSession.aiResponse.findings.improvements.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">개선 제안</h4>
                        <div className="space-y-2">
                          {selectedSession.aiResponse.findings.improvements.map((improvement: any, index: number) => (
                            <div key={index} className="border rounded p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{improvement.area}</span>
                                <div className="flex gap-2">
                                  {getPriorityBadge(improvement.priority)}
                                  <Badge variant="outline">영향도: {improvement.estimatedImpact}%</Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600">{improvement.suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">권장사항</h4>
                      <ul className="text-sm space-y-1">
                        {selectedSession.aiResponse.recommendations.map((rec: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">다음 단계</h4>
                      <ul className="text-sm space-y-1">
                        {selectedSession.aiResponse.nextSteps.map((step: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <Clock className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                            {step}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {selectedSession.status === 'ai_analyzed' && (
                                             <div className="border-t pt-4">
                         <h4 className="font-semibold mb-2">관리자 검토</h4>
                         <textarea 
                           placeholder="검토 노트를 입력하세요..."
                           className="w-full p-2 border border-gray-300 rounded-md mb-2 h-24"
                         />
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => completeReview(selectedSession.id, '검토 완료', [], [])}
                            disabled={loading}
                          >
                            검토 완료
                          </Button>
                          <Button variant="outline">
                            <Download className="h-4 w-4 mr-2" />
                            결과 내보내기
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8 text-gray-500">
                세션을 선택하여 상세 정보를 확인하세요.
              </CardContent>
            </Card>
          )}
        </TabsContent>


      </Tabs>
    </div>
  );
} 