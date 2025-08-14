/**
 * AI 어시스턴트 데이터 훅
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import type { 
  ResponseLogData, 
  PatternSuggestion as SuggestionData, 
  ContextDocument, 
  SystemHealth 
} from '@/types/ai-assistant';

interface APIResponse {
  data: unknown;
  error?: string;
  message?: string;
}

interface SystemHealthData {
  aiAssistant: {
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
}

interface UseAIAssistantDataReturn {
  // 기존 속성들
  logs: ResponseLogData[];
  suggestions: SuggestionData[];
  documents: ContextDocument[];
  systemHealth: SystemHealth | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  clearError: () => void;
  addSuggestion: (suggestion: Partial<SuggestionData>) => Promise<void>;
  updateSuggestionStatus: (id: string, status: SuggestionData['status']) => Promise<void>;
  deleteSuggestion: (id: string) => Promise<void>;
  uploadDocument: (file: File, category: ContextDocument['category']) => Promise<void>;
  deleteDocument: (id: string) => Promise<void>;
  updateSystemHealth: (health: Partial<SystemHealthData>) => void;
  
  // 호환성을 위한 별칭 및 추가 속성
  _responseLogs: ResponseLogData[];
  _patternSuggestions: SuggestionData[];
  contextDocuments: ContextDocument[];
  _systemHealth: SystemHealth | null;
  loading: boolean;
  filteredLogs: ResponseLogData[];
  stats: {
    totalLogs: number;
    successRate: number;
    pendingSuggestions: number;
    totalDocuments: number;
  };
  loadAllData: () => Promise<void>;
  _handlePatternAction: (id: string, action: 'apply' | 'reject') => Promise<void>;
  filters: {
    status: string;
    dateRange: string;
  };
  setFilters: React.Dispatch<React.SetStateAction<{
    status: string;
    dateRange: string;
  }>>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

export function useAIAssistantData(): UseAIAssistantDataReturn {
  const [logs, setLogs] = useState<ResponseLogData[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionData[]>([]);
  const [documents, setDocuments] = useState<ContextDocument[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    dateRange: '7days',
  });

  // API 호출 헬퍼 함수
  const fetchAPI = useCallback(async (endpoint: string, options?: RequestInit): Promise<APIResponse> => {
    try {
      const response = await fetch(`/api/ai-assistant${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`API 호출 실패 (${endpoint}):`, err);
      throw err;
    }
  }, []);

  // 데이터 로딩
  const loadLogs = useCallback(async () => {
    try {
      const result = await fetchAPI('/logs');
      if (Array.isArray(result.data)) {
        setLogs(result.data);
      }
    } catch (err) {
      console.error('로그 로딩 실패:', err);
      setError('로그 데이터를 불러오는데 실패했습니다.');
    }
  }, [fetchAPI]);

  const loadSuggestions = useCallback(async () => {
    try {
      const result = await fetchAPI('/suggestions');
      if (Array.isArray(result.data)) {
        setSuggestions(
          result.data.map((suggestion: Partial<SuggestionData>) => ({
            id: suggestion.id || Math.random().toString(36).substr(2, 9),
            originalQuery: suggestion??.originalQuery || suggestion??.query || '쿼리 없음',
            suggestedPattern: 
              suggestion.suggestedPattern ||
              suggestion.pattern ||
              '제안 패턴 없음',
            confidence: suggestion.confidence || 0.5,
            category: suggestion.category || 'general',
            status: suggestion.status || 'pending',
            createdAt: suggestion.createdAt || new Date().toISOString(),
            examples: suggestion.examples || [],
          }))
        );
      }
    } catch (err) {
      console.error('제안 로딩 실패:', err);
      setError('제안 데이터를 불러오는데 실패했습니다.');
    }
  }, [fetchAPI]);

  const loadDocuments = useCallback(async () => {
    try {
      const result = await fetchAPI('/documents');
      if (Array.isArray(result.data)) {
        setDocuments(result.data);
      }
    } catch (err) {
      console.error('문서 로딩 실패:', err);
      setError('문서 데이터를 불러오는데 실패했습니다.');
    }
  }, [fetchAPI]);

  const loadSystemHealth = useCallback(async () => {
    try {
      const result = await fetchAPI('/health');
      if (result.data) {
        setSystemHealth(result.data as SystemHealth);
      }
    } catch (err) {
      console.error('시스템 상태 로딩 실패:', err);
      setError('시스템 상태를 불러오는데 실패했습니다.');
    }
  }, [fetchAPI]);

  // 전체 데이터 새로고침
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        loadLogs(),
        loadSuggestions(),
        loadDocuments(),
        loadSystemHealth(),
      ]);
    } catch (err) {
      console.error('데이터 새로고침 실패:', err);
      setError('데이터 새로고침에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [loadLogs, loadSuggestions, loadDocuments, loadSystemHealth]);

  // 제안 관리 함수들
  const addSuggestion = useCallback(async (suggestion: Partial<SuggestionData>) => {
    try {
      const result = await fetchAPI('/suggestions', {
        method: 'POST',
        body: JSON.stringify(suggestion),
      });

      if (result.data) {
        setSuggestions(prev => [...prev, result.data as SuggestionData]);
        toast.success('제안이 추가되었습니다.');
      }
    } catch (err) {
      console.error('제안 추가 실패:', err);
      toast.error('제안 추가에 실패했습니다.');
      throw err;
    }
  }, [fetchAPI]);

  const updateSuggestionStatus = useCallback(async (id: string, status: SuggestionData['status']) => {
    try {
      const result = await fetchAPI(`/suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });

      if (result.data) {
        setSuggestions(prev =>
          prev.map(s => (s.id === id ? { ...s, status } : s))
        );
        toast.success('제안 상태가 업데이트되었습니다.');
      }
    } catch (err) {
      console.error('제안 상태 업데이트 실패:', err);
      toast.error('제안 상태 업데이트에 실패했습니다.');
      throw err;
    }
  }, [fetchAPI]);

  const deleteSuggestion = useCallback(async (id: string) => {
    try {
      await fetchAPI(`/suggestions/${id}`, {
        method: 'DELETE',
      });

      setSuggestions(prev => prev.filter(s => s.id !== id));
      toast.success('제안이 삭제되었습니다.');
    } catch (err) {
      console.error('제안 삭제 실패:', err);
      toast.error('제안 삭제에 실패했습니다.');
      throw err;
    }
  }, [fetchAPI]);

  // 문서 관리 함수들
  const uploadDocument = useCallback(async (file: File, category: ContextDocument['category']) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('category', category);

      const response = await fetch('/api/ai-assistant/documents', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.data) {
        setDocuments(prev => [...prev, result.data as ContextDocument]);
        toast.success('문서가 업로드되었습니다.');
      }
    } catch (err) {
      console.error('문서 업로드 실패:', err);
      toast.error('문서 업로드에 실패했습니다.');
      throw err;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await fetchAPI(`/documents/${id}`, {
        method: 'DELETE',
      });

      setDocuments(prev => prev.filter(d => d.id !== id));
      toast.success('문서가 삭제되었습니다.');
    } catch (err) {
      console.error('문서 삭제 실패:', err);
      toast.error('문서 삭제에 실패했습니다.');
      throw err;
    }
  }, [fetchAPI]);

  // 시스템 상태 업데이트
  const updateSystemHealth = useCallback((health: Partial<SystemHealthData>) => {
    setSystemHealth(prev => prev ? { ...prev, ...health } : null);
  }, []);

  // 에러 클리어
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // 패턴 액션 처리
  const _handlePatternAction = useCallback(async (id: string, action: 'apply' | 'reject') => {
    const newStatus = action === 'apply' ? 'applied' : 'rejected';
    await updateSuggestionStatus(id, newStatus as SuggestionData['status']);
  }, [updateSuggestionStatus]);

  // 초기 데이터 로드
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // 로그 필터링 (메모이제이션)
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // 상태 필터
      if (filters.status !== 'all' && log.status !== filters.status) {
        return false;
      }
      
      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const queryMatch = log.query?.toLowerCase().includes(searchLower);
        const responseMatch = log.response?.toLowerCase().includes(searchLower);
        return queryMatch || responseMatch;
      }
      
      return true;
    });
  }, [logs, filters.status, searchTerm]);

  // 통계 데이터 계산 (메모이제이션)
  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const successLogs = logs.filter(log => log.status === 'success').length;
    const pendingSuggestions = suggestions.filter(s => s.status === 'pending').length;
    const totalDocuments = documents.length;

    return {
      totalLogs,
      successRate: totalLogs > 0 ? Math.round((successLogs / totalLogs) * 100) : 0,
      pendingSuggestions,
      totalDocuments,
    };
  }, [logs, suggestions, documents]);

  return {
    // 기존 속성들
    logs,
    suggestions,
    documents,
    systemHealth,
    isLoading,
    error,
    refreshData,
    clearError,
    addSuggestion,
    updateSuggestionStatus,
    deleteSuggestion,
    uploadDocument,
    deleteDocument,
    updateSystemHealth,
    
    // 호환성을 위한 별칭 및 추가 속성
    _responseLogs: logs,
    _patternSuggestions: suggestions,
    contextDocuments: documents,
    _systemHealth: systemHealth,
    loading: isLoading,
    filteredLogs,
    stats,
    loadAllData: refreshData,
    _handlePatternAction,
    filters,
    setFilters,
    searchTerm,
    setSearchTerm,
  };
}