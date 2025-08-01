import { useCallback, useEffect, useState } from 'react';
import type {
  AIAssistantFilters,
  AIAssistantStats,
  ContextDocument,
  PatternSuggestion,
  ResponseLogData,
  SystemHealth,
} from '../types/ai-assistant';

interface UseAIAssistantDataReturn {
  // 데이터
  _responseLogs: ResponseLogData[];
  _patternSuggestions: PatternSuggestion[];
  contextDocuments: ContextDocument[];
  _systemHealth: SystemHealth | null;

  // 상태
  loading: boolean;
  error: string | null;

  // 필터링된 데이터
  filteredLogs: ResponseLogData[];
  stats: AIAssistantStats;

  // 액션
  loadAllData: () => Promise<void>;
  _handlePatternAction: (
    id: string,
    action: 'approve' | 'reject'
  ) => Promise<void>;

  // 필터
  filters: AIAssistantFilters;
  setFilters: React.Dispatch<React.SetStateAction<AIAssistantFilters>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

export function useAIAssistantData(): UseAIAssistantDataReturn {
  // 데이터 상태
  const [_responseLogs, setResponseLogs] = useState<ResponseLogData[]>([]);
  const [_patternSuggestions, setPatternSuggestions] = useState<
    PatternSuggestion[]
  >([]);
  const [contextDocuments, setContextDocuments] = useState<ContextDocument[]>(
    []
  );
  const [_systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);

  // UI 상태
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // 필터 상태
  const [filters, setFilters] = useState<AIAssistantFilters>({
    dateRange: '24h',
    status: 'all',
    confidence: 'all',
  });

  // 데이터 로드 함수들
  const loadResponseLogs = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/ai-assistant/admin/logs?action=interactions&limit=100'
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.interactions) {
          const convertedLogs = data.data.interactions.map((log: any) => ({
            id: log.id || `log-${Date.now()}-${Math.random()}`,
            timestamp: log.timestamp || new Date().toISOString(),
            question: log.query || log.question || '질문 정보 없음',
            response: log.response || log.answer || '응답 정보 없음',
            status: log.success
              ? 'success'
              : log.fallbackUsed
                ? 'fallback'
                : 'failed',
            confidence: log.confidence || 0.5,
            responseTime: log.responseTime || 1000,
            fallbackStage: log.fallbackUsed ? 'stage-1' : undefined,
            patternMatched: log.patternMatched || undefined,
            serverContext: log.serverContext || {},
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
  }, []);

  const loadPatternSuggestions = useCallback(async () => {
    try {
      const response = await fetch(
        '/api/ai-assistant/learning/analysis?action=latest-report'
      );
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data?.suggestions) {
          const convertedSuggestions = data.data.suggestions.map(
            (suggestion: any) => ({
              id: suggestion.id || `suggestion-${Date.now()}-${Math.random()}`,
              originalQuery:
                suggestion.originalQuery ||
                suggestion.query ||
                '원본 질문 없음',
              suggestedPattern:
                suggestion.suggestedPattern ||
                suggestion.pattern ||
                '제안 패턴 없음',
              confidence: suggestion.confidence || 0.5,
              category: suggestion.category || 'general',
              status: suggestion.status || 'pending',
              createdAt: suggestion.createdAt || new Date().toISOString(),
              examples: suggestion.examples || [],
            })
          );
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
  }, []);

  const loadContextDocuments = useCallback(async () => {
    try {
      setContextDocuments(generateMockContextDocuments());
    } catch (error) {
      console.warn('컨텍스트 문서 로드 실패, 폴백 데이터 사용:', error);
      setContextDocuments(generateMockContextDocuments());
    }
  }, []);

  const loadSystemHealth = useCallback(async () => {
    try {
      setSystemHealth(generateMockSystemHealth());
    } catch (error) {
      console.warn('시스템 상태 로드 실패, 폴백 데이터 사용:', error);
      setSystemHealth(generateMockSystemHealth());
    }
  }, []);

  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadResponseLogs(),
        loadPatternSuggestions(),
        loadContextDocuments(),
        loadSystemHealth(),
      ]);
    } catch (error) {
      console.error('데이터 로드 실패:', error);
      setError('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [
    loadResponseLogs,
    loadPatternSuggestions,
    loadContextDocuments,
    loadSystemHealth,
  ]);

  // 패턴 승인/거부 처리
  const _handlePatternAction = useCallback(
    async (id: string, action: 'approve' | 'reject') => {
      try {
        const apiAction =
          action === 'approve' ? 'approve-suggestion' : 'reject-suggestion';
        const response = await fetch('/api/ai-assistant/learning/analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: apiAction,
            data: {
              suggestionId: id,
              reason: action === 'reject' ? '관리자가 거부함' : undefined,
            },
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setPatternSuggestions((prev) =>
              prev.map((p) =>
                p.id === id
                  ? {
                      ...p,
                      status: action === 'approve' ? 'approved' : 'rejected',
                    }
                  : p
              )
            );
            console.log(
              `패턴 ${action === 'approve' ? '승인' : '거부'} 완료:`,
              result.message
            );
          } else {
            console.error('패턴 처리 실패:', result.error);
          }
        } else {
          console.error('API 요청 실패:', response.status);
        }
      } catch (error) {
        console.error('패턴 처리 실패:', error);
      }
    },
    []
  );

  // 필터링된 로그
  const filteredLogs = _responseLogs.filter((log) => {
    if (filters.status !== 'all' && log.status !== filters.status) return false;
    if (filters.confidence !== 'all') {
      const confThreshold = filters.confidence === 'high' ? 0.8 : 0.5;
      if (log.confidence < confThreshold) return false;
    }
    if (
      searchTerm &&
      !log.question.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // 통계 계산
  const stats: AIAssistantStats = {
    totalLogs: _responseLogs.length,
    successRate:
      _responseLogs.length > 0
        ? (_responseLogs.filter((l) => l.status === 'success').length /
            _responseLogs.length) *
          100
        : 0,
    _patternSuggestions: _patternSuggestions.length,
    pendingPatterns: _patternSuggestions.filter((p) => p.status === 'pending')
      .length,
    contextDocuments: contextDocuments.length,
    totalWords: Math.round(
      contextDocuments.reduce((sum, doc) => sum + doc.wordCount, 0) / 1000
    ),
    systemStatus:
      _systemHealth?.aiAssistant.status === 'online' ? '정상' : '오류',
  };

  // 초기 데이터 로드
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  return {
    // 데이터
    _responseLogs,
    _patternSuggestions,
    contextDocuments,
    _systemHealth,

    // 상태
    loading,
    error,

    // 필터링된 데이터
    filteredLogs,
    stats,

    // 액션
    loadAllData,
    _handlePatternAction,

    // 필터
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
  };
}

// Mock 데이터 생성 함수들
function generateMockResponseLogs(): ResponseLogData[] {
  return [
    {
      id: 'log-1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      question: 'CPU 사용률이 높은 서버를 찾아주세요',
      response:
        '현재 CPU 사용률이 80% 이상인 서버는 api-server-01, web-server-03입니다.',
      status: 'success',
      confidence: 0.92,
      responseTime: 1200,
      patternMatched: 'server-monitoring',
      serverContext: { serverCount: 15, alertLevel: 'warning' },
    },
    {
      id: 'log-2',
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      question: '네트워크 트래픽 분석 결과는?',
      response:
        '최근 1시간 동안 평균 트래픽은 2.3GB/s이며, 피크 시간대는 오후 2시였습니다.',
      status: 'success',
      confidence: 0.88,
      responseTime: 850,
      patternMatched: 'network-analysis',
      serverContext: { trafficPeak: '14:00', avgTraffic: '2.3GB/s' },
    },
    {
      id: 'log-3',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      question: '시스템 전체 상태를 요약해주세요',
      response:
        '전체 30개 서버 중 28개 정상, 2개 경고 상태입니다. 전반적으로 안정적입니다.',
      status: 'fallback',
      confidence: 0.65,
      responseTime: 2100,
      fallbackStage: 'stage-2',
      serverContext: { totalServers: 30, healthyServers: 28 },
    },
  ];
}

function generateMockPatternSuggestions(): PatternSuggestion[] {
  return [
    {
      id: 'pattern-1',
      originalQuery: '서버 상태 확인해줘',
      suggestedPattern: '서버 {서버명|전체} 상태 {확인|조회|분석}',
      confidence: 0.85,
      category: 'server-monitoring',
      status: 'pending',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      examples: ['서버 api-01 상태 확인', '전체 서버 상태 조회'],
    },
    {
      id: 'pattern-2',
      originalQuery: '메모리 사용량이 높은 곳은?',
      suggestedPattern: '{메모리|CPU|디스크} 사용량이 {높은|낮은} {서버|위치}',
      confidence: 0.78,
      category: 'resource-monitoring',
      status: 'pending',
      createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      examples: ['CPU 사용량이 높은 서버', '디스크 사용량이 낮은 위치'],
    },
  ];
}

function generateMockContextDocuments(): ContextDocument[] {
  return [
    {
      id: 'doc-1',
      filename: 'server-monitoring-guide.md',
      category: 'advanced',
      size: 15420,
      lastModified: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      wordCount: 2850,
      keywords: ['모니터링', '서버', '알림', 'CPU', '메모리'],
    },
    {
      id: 'doc-2',
      filename: 'ai-analysis-basics.md',
      category: 'basic',
      size: 8930,
      lastModified: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
      wordCount: 1650,
      keywords: ['AI', '분석', '기본', '가이드'],
    },
    {
      id: 'doc-3',
      filename: 'troubleshooting-common-issues.md',
      category: 'advanced',
      size: 22100,
      lastModified: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
      wordCount: 4200,
      keywords: ['문제해결', '트러블슈팅', '일반적', '이슈'],
    },
  ];
}

function generateMockSystemHealth(): SystemHealth {
  return {
    aiAssistant: {
      status: 'online',
      responseTime: Math.floor(Math.random() * 500 + 200),
      uptime: Math.floor(Math.random() * 30 + 1) * 24 * 60 * 60 * 1000,
      version: '2.1.0',
    },
    mcp: {
      status: 'connected',
      documentsLoaded: Math.floor(Math.random() * 50 + 20),
      lastSync: new Date(
        Date.now() - Math.random() * 60 * 60 * 1000
      ).toISOString(),
    },
    learningCycle: {
      lastRun: new Date(
        Date.now() - Math.random() * 24 * 60 * 60 * 1000
      ).toISOString(),
      nextRun: new Date(
        Date.now() + Math.random() * 24 * 60 * 60 * 1000
      ).toISOString(),
      status: 'idle',
    },
  };
}
