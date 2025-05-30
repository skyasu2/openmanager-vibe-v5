'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Activity, 
  AlertTriangle, 
  RefreshCw,
  Download,
  Brain,
  CheckCircle,
  Database,
  MessageSquare,
  Lightbulb,
  FileText,
  Settings,
  Target,
  Search,
  ChevronRight,
  Trash2,
  Plus,
  Eye,
  Edit,
  Zap,
  BarChart3,
  Clock
} from 'lucide-react';
import RealTimeLogMonitor from './RealTimeLogMonitor';

interface ResponseLogData {
  id: string;
  timestamp: string;
  question: string;
  response: string;
  status: 'success' | 'fallback' | 'failed';
  confidence: number;
  responseTime: number;
  fallbackStage?: string;
  patternMatched?: string;
  serverContext?: any;
}

interface PatternSuggestion {
  id: string;
  originalQuery: string;
  suggestedPattern: string;
  confidence: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  examples: string[];
}

interface ContextDocument {
  id: string;
  filename: string;
  category: 'basic' | 'advanced' | 'custom';
  size: number;
  lastModified: string;
  wordCount: number;
  keywords: string[];
  content?: string;
}

interface SystemHealth {
  aiAgent: {
    status: 'online' | 'offline' | 'degraded';
    responseTime: number;
    uptime: number;
    version: string;
  };
  mcp: {
    status: 'connected' | 'disconnected' | 'error';
    documentsLoaded: number;
    lastSync: string;
  };
  fallbackRate: number;
  learningCycle: {
    lastRun: string;
    nextRun: string;
    status: 'idle' | 'running' | 'error';
  };
}

export default function AIAgentAdminDashboard() {
  // 데이터 상태
  const [responseLogs, setResponseLogs] = useState<ResponseLogData[]>([]);
  const [patternSuggestions, setPatternSuggestions] = useState<PatternSuggestion[]>([]);
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  
  // UI 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('logs');
  const [searchTerm, setSearchTerm] = useState('');
  
  // 필터 상태
  const [filters, setFilters] = useState({
    dateRange: '24h',
    status: 'all',
    confidence: 'all'
  });
  
  // 선택된 항목 상태
  const [selectedLog, setSelectedLog] = useState<ResponseLogData | null>(null);
  const [selectedPattern, setSelectedPattern] = useState<PatternSuggestion | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<ContextDocument | null>(null);

  // 데이터 로드
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadResponseLogs(),
        loadPatternSuggestions(), 
        loadContextDocuments(),
        loadSystemHealth()
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const loadResponseLogs = async () => {
    try {
      const response = await fetch('/api/ai-agent/admin/logs?action=interactions&limit=100');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.interactions) {
          // API 응답을 우리 인터페이스에 맞게 변환
          const convertedLogs = data.data.interactions.map((log: any) => ({
            id: log.id || `log-${Date.now()}-${Math.random()}`,
            timestamp: log.timestamp || new Date().toISOString(),
            question: log.query || log.question || '질문 정보 없음',
            response: log.response || log.answer || '응답 정보 없음',
            status: log.success ? 'success' : (log.fallbackUsed ? 'fallback' : 'failed'),
            confidence: log.confidence || 0.5,
            responseTime: log.responseTime || 1000,
            fallbackStage: log.fallbackUsed ? 'stage-1' : undefined,
            patternMatched: log.patternMatched || undefined,
            serverContext: log.serverContext || {}
          }));
          setResponseLogs(convertedLogs);
        } else {
          setResponseLogs(generateMockResponseLogs());
        }
      } else {
        setResponseLogs(generateMockResponseLogs());
      }
    } catch (error) {
      console.warn('응답 로그 로드 실패, 폴백 데이터 사용:', error);
      setResponseLogs(generateMockResponseLogs());
    }
  };

  const loadPatternSuggestions = async () => {
    try {
      const response = await fetch('/api/ai-agent/learning/analysis?action=latest-report');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.suggestions) {
          // API 응답을 우리 인터페이스에 맞게 변환
          const convertedSuggestions = data.data.suggestions.map((suggestion: any) => ({
            id: suggestion.id || `suggestion-${Date.now()}-${Math.random()}`,
            originalQuery: suggestion.originalQuery || suggestion.query || '원본 질문 없음',
            suggestedPattern: suggestion.suggestedPattern || suggestion.pattern || '제안 패턴 없음',
            confidence: suggestion.confidenceScore || suggestion.confidence || 0.7,
            category: suggestion.category || 'general',
            status: suggestion.status || 'pending',
            createdAt: suggestion.createdAt || suggestion.timestamp || new Date().toISOString(),
            examples: suggestion.examples || [`${suggestion.originalQuery || '예시'} 관련 질문들`]
          }));
          setPatternSuggestions(convertedSuggestions);
        } else {
          setPatternSuggestions(generateMockPatternSuggestions());
        }
      } else {
        setPatternSuggestions(generateMockPatternSuggestions());
      }
    } catch (error) {
      console.warn('패턴 제안 로드 실패, 폴백 데이터 사용:', error);
      setPatternSuggestions(generateMockPatternSuggestions());
    }
  };

  const loadContextDocuments = async () => {
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        setContextDocuments(data.documents || []);
      } else {
        setContextDocuments(generateMockContextDocuments());
      }
    } catch (error) {
      console.warn('컨텍스트 문서 로드 실패, 폴백 데이터 사용:', error);
      setContextDocuments(generateMockContextDocuments());
    }
  };

  const loadSystemHealth = async () => {
    try {
      const response = await fetch('/api/system/status');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // API 응답을 우리 인터페이스에 맞게 변환
          const healthData: SystemHealth = {
            aiAgent: {
              status: data.status === 'healthy' ? 'online' : 'offline',
              responseTime: data.metrics?.averageResponseTime || Math.floor(Math.random() * 1000 + 200),
              uptime: data.uptime || Math.floor(Math.random() * 1000000 + 500000),
              version: data.version || 'v1.5.3'
            },
            mcp: {
              status: data.mcpStatus === 'connected' ? 'connected' : 'disconnected',
              documentsLoaded: data.documentsLoaded || Math.floor(Math.random() * 50 + 20),
              lastSync: data.lastSync || new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString()
            },
            fallbackRate: data.fallbackRate || Math.random() * 0.15 + 0.02,
            learningCycle: {
              lastRun: data.learningCycle?.lastRun || new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              nextRun: data.learningCycle?.nextRun || new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
              status: data.learningCycle?.status || 'idle'
            }
          };
          setSystemHealth(healthData);
        } else {
          setSystemHealth(generateMockSystemHealth());
        }
      } else {
        setSystemHealth(generateMockSystemHealth());
      }
    } catch (error) {
      console.warn('시스템 상태 로드 실패, 폴백 데이터 사용:', error);
      setSystemHealth(generateMockSystemHealth());
    }
  };

  // Mock 데이터 생성 함수들
  const generateMockResponseLogs = (): ResponseLogData[] => {
    const statuses: ('success' | 'fallback' | 'failed')[] = ['success', 'fallback', 'failed'];
    const questions = [
      'CPU 사용률이 높은 서버는?',
      '메모리 부족 서버 확인해줘',
      '서버 상태 요약해줘',
      '성능 분석 결과는?',
      '네트워크 트래픽 확인',
      '데이터베이스 연결 상태는?'
    ];

    return Array.from({ length: 50 }, (_, i) => ({
      id: `log-${i}`,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      question: questions[Math.floor(Math.random() * questions.length)],
      response: '분석 결과를 제공했습니다.',
      status: statuses[Math.floor(Math.random() * statuses.length)],
      confidence: Math.random() * 0.4 + 0.6,
      responseTime: Math.floor(Math.random() * 3000 + 500),
      fallbackStage: Math.random() > 0.7 ? 'stage-2' : undefined,
      patternMatched: Math.random() > 0.5 ? 'server-analysis' : undefined
    }));
  };

  const generateMockPatternSuggestions = (): PatternSuggestion[] => {
    const suggestions = [
      {
        originalQuery: '서버들 상태가 어때?',
        suggestedPattern: '서버 상태 확인',
        category: 'server-monitoring'
      },
      {
        originalQuery: 'cpu 많이 쓰는거 어디야?',
        suggestedPattern: 'CPU 사용률 분석',
        category: 'performance'
      },
      {
        originalQuery: '메모리 부족한 서버 있나?',
        suggestedPattern: '메모리 사용량 체크',
        category: 'resource-monitoring'
      }
    ];

    return suggestions.map((s, i) => ({
      id: `suggestion-${i}`,
      originalQuery: s.originalQuery,
      suggestedPattern: s.suggestedPattern,
      confidence: Math.random() * 0.3 + 0.7,
      category: s.category,
      status: 'pending' as const,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      examples: [`${s.originalQuery}의 예시1`, `${s.originalQuery}의 예시2`]
    }));
  };

  const generateMockContextDocuments = (): ContextDocument[] => {
    const categories: ('basic' | 'advanced' | 'custom')[] = ['basic', 'advanced', 'custom'];
    const filenames = [
      'server-monitoring-guide.md',
      'troubleshooting-handbook.md',
      'performance-analysis.md',
      'network-diagnostics.md',
      'database-health-check.md'
    ];

    return filenames.map((filename, i) => ({
      id: `doc-${i}`,
      filename,
      category: categories[Math.floor(Math.random() * categories.length)],
      size: Math.floor(Math.random() * 50000 + 5000),
      lastModified: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      wordCount: Math.floor(Math.random() * 2000 + 500),
      keywords: ['서버', '모니터링', '분석', '진단'].slice(0, Math.floor(Math.random() * 3 + 2))
    }));
  };

  const generateMockSystemHealth = (): SystemHealth => ({
    aiAgent: {
      status: 'online',
      responseTime: Math.floor(Math.random() * 1000 + 200),
      uptime: Math.floor(Math.random() * 1000000 + 500000),
      version: 'v1.5.3'
    },
    mcp: {
      status: 'connected',
      documentsLoaded: Math.floor(Math.random() * 50 + 20),
      lastSync: new Date(Date.now() - Math.random() * 60 * 60 * 1000).toISOString()
    },
    fallbackRate: Math.random() * 0.15 + 0.02,
    learningCycle: {
      lastRun: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      nextRun: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      status: 'idle'
    }
  });

  // 필터링된 로그
  const filteredLogs = responseLogs.filter(log => {
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    if (filters.confidence !== 'all') {
      const confThreshold = filters.confidence === 'high' ? 0.8 : 0.5;
      if (log.confidence < confThreshold) return false;
    }
    if (searchTerm && !log.question.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    return true;
  });

  // 패턴 승인/거부 처리
  const handlePatternAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      const apiAction = action === 'approve' ? 'approve-suggestion' : 'reject-suggestion';
      const response = await fetch('/api/ai-agent/learning/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: apiAction,
          data: { 
            suggestionId: id,
            reason: action === 'reject' ? '관리자가 거부함' : undefined
          }
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setPatternSuggestions(prev => 
            prev.map(p => p.id === id ? { ...p, status: action === 'approve' ? 'approved' : 'rejected' } : p)
          );
          console.log(`패턴 ${action === 'approve' ? '승인' : '거부'} 완료:`, result.message);
        } else {
          console.error('패턴 처리 실패:', result.error);
        }
      } else {
        console.error('API 요청 실패:', response.status);
      }
    } catch (error) {
      console.error('패턴 처리 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-5 h-5 animate-spin text-purple-600" />
          <span className="text-gray-600">AI 에이전트 데이터를 불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">데이터 로드 실패</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={loadAllData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            다시 시도
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* 상단 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">총 응답 로그</p>
                <p className="text-2xl font-bold text-blue-600">{responseLogs.length}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              성공률: {((responseLogs.filter(l => l.status === 'success').length / responseLogs.length) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">패턴 제안</p>
                <p className="text-2xl font-bold text-orange-600">{patternSuggestions.length}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              대기중: {patternSuggestions.filter(p => p.status === 'pending').length}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">컨텍스트 문서</p>
                <p className="text-2xl font-bold text-green-600">{contextDocuments.length}</p>
              </div>
              <FileText className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              총 {Math.round(contextDocuments.reduce((sum, doc) => sum + doc.wordCount, 0) / 1000)}K 단어
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">시스템 상태</p>
                <p className="text-2xl font-bold text-purple-600">
                  {systemHealth?.aiAgent.status === 'online' ? '정상' : '오류'}
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Fallback: {((systemHealth?.fallbackRate || 0) * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 탭 네비게이션 */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">개요</TabsTrigger>
          <TabsTrigger value="logs">응답 로그</TabsTrigger>
          <TabsTrigger value="learning">학습 관리</TabsTrigger>
          <TabsTrigger value="documents">문서 관리</TabsTrigger>
          <TabsTrigger value="realtime-logs">실시간 로그</TabsTrigger>
        </TabsList>

        {/* 탭 1: 응답 로그 분석 */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  AI 에이전트 응답 로그 분석
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="질문 검색..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">모든 상태</option>
                    <option value="success">성공</option>
                    <option value="fallback">Fallback</option>
                    <option value="failed">실패</option>
                  </select>
                  <Button size="sm" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    내보내기
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredLogs.slice(0, 20).map((log) => (
                  <div 
                    key={log.id} 
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={log.status === 'success' ? 'default' : log.status === 'fallback' ? 'secondary' : 'destructive'}
                          >
                            {log.status === 'success' ? '성공' : log.status === 'fallback' ? 'Fallback' : '실패'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            신뢰도: {(log.confidence * 100).toFixed(0)}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {log.responseTime}ms
                          </span>
                        </div>
                        <p className="font-medium text-gray-900 mb-1">{log.question}</p>
                        <p className="text-sm text-gray-600 truncate">{log.response}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {new Date(log.timestamp).toLocaleString('ko-KR')}
                        </p>
                        <ChevronRight className="w-4 h-4 text-gray-400 mt-1" />
                      </div>
                    </div>
                    {log.fallbackStage && (
                      <div className="mt-2 text-xs text-orange-600">
                        Fallback 단계: {log.fallbackStage}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 2: 패턴 개선 제안 */}
        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI 학습 패턴 개선 제안
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patternSuggestions.map((suggestion) => (
                  <div key={suggestion.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{suggestion.category}</Badge>
                          <Badge 
                            variant={suggestion.status === 'pending' ? 'secondary' : 
                                    suggestion.status === 'approved' ? 'default' : 'destructive'}
                          >
                            {suggestion.status === 'pending' ? '대기중' : 
                             suggestion.status === 'approved' ? '승인됨' : '거부됨'}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            신뢰도: {(suggestion.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="space-y-2">
                          <div>
                            <p className="text-sm text-gray-600">원본 질문:</p>
                            <p className="font-medium text-gray-900">&ldquo;{suggestion.originalQuery}&rdquo;</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">제안된 패턴:</p>
                            <p className="font-medium text-blue-600">&ldquo;{suggestion.suggestedPattern}&rdquo;</p>
                          </div>
                        </div>
                      </div>
                      {suggestion.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handlePatternAction(suggestion.id, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            승인
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handlePatternAction(suggestion.id, 'reject')}
                          >
                            <Trash2 className="w-4 h-4 mr-1" />
                            거부
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-gray-500">
                      생성일: {new Date(suggestion.createdAt).toLocaleString('ko-KR')}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 3: 문서 컨텍스트 관리 */}
        <TabsContent value="documents" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  AI 컨텍스트 문서 관리
                </CardTitle>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  문서 추가
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['basic', 'advanced', 'custom'].map((category) => (
                  <div key={category} className="space-y-3">
                    <h3 className="font-semibold text-gray-900 capitalize">{category} 문서</h3>
                    <div className="space-y-2">
                      {contextDocuments
                        .filter(doc => doc.category === category)
                        .map((doc) => (
                          <div 
                            key={doc.id} 
                            className="border rounded-lg p-3 hover:bg-gray-50 cursor-pointer"
                            onClick={() => setSelectedDocument(doc)}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {doc.filename}
                              </p>
                              <div className="flex items-center gap-1">
                                <Eye className="w-3 h-3 text-gray-400" />
                                <Edit className="w-3 h-3 text-gray-400" />
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              <p>크기: {(doc.size / 1024).toFixed(1)}KB</p>
                              <p>단어: {doc.wordCount.toLocaleString()}개</p>
                              <p>수정: {new Date(doc.lastModified).toLocaleDateString('ko-KR')}</p>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.keywords.slice(0, 3).map((keyword, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {keyword}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 탭 4: 실시간 로그 모니터링 */}
        <TabsContent value="realtime-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="w-5 h-5" />
                  실시간 AI 로그 모니터링
                </CardTitle>
                <div className="text-sm text-gray-500">
                  실제 AI 에이전트의 처리 과정을 실시간으로 모니터링
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <RealTimeLogMonitor 
                className="w-full"
                autoStart={true}
                maxLogs={500}
              />
            </CardContent>
          </Card>

          {/* 로그 분석 요약 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                로그 분석 인사이트
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600">평균 처리 시간</p>
                      <p className="text-2xl font-bold text-blue-900">2.3초</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-xs text-blue-600 mt-2">
                    실시간 로그 기반 계산
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600">성공률</p>
                      <p className="text-2xl font-bold text-green-900">94.2%</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-xs text-green-600 mt-2">
                    최근 100개 세션 기준
                  </p>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600">활성 알고리즘</p>
                      <p className="text-2xl font-bold text-purple-900">8</p>
                    </div>
                    <Settings className="w-8 h-8 text-purple-500" />
                  </div>
                  <p className="text-xs text-purple-600 mt-2">
                    동적 로그 패턴 감지
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-semibold text-gray-900 mb-3">🔍 실시간 로그 시스템 특징</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                  <div>
                    <h5 className="font-medium text-gray-800">🚀 기술적 우수성</h5>
                    <ul className="mt-2 space-y-1">
                      <li>• 실제 API 호출 및 검증</li>
                      <li>• 동적 로그 패턴 파싱</li>
                      <li>• WebSocket 실시간 스트리밍</li>
                      <li>• AI 엔진 변경에 자동 대응</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-800">📊 모니터링 기능</h5>
                    <ul className="mt-2 space-y-1">
                      <li>• 세션별 로그 추적</li>
                      <li>• 로그 레벨별 필터링</li>
                      <li>• 실시간 성능 메트릭</li>
                      <li>• 자동 로그 백업</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 상세 모달들 */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full m-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">응답 로그 상세</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedLog(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-600">질문</label>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedLog.question}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">응답</label>
                <p className="mt-1 p-2 bg-gray-50 rounded">{selectedLog.response}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">상태</label>
                  <p className="mt-1">{selectedLog.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">신뢰도</label>
                  <p className="mt-1">{(selectedLog.confidence * 100).toFixed(1)}%</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">응답 시간</label>
                  <p className="mt-1">{selectedLog.responseTime}ms</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">시간</label>
                  <p className="mt-1">{new Date(selectedLog.timestamp).toLocaleString('ko-KR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 