import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// 🔮 MCP 쿼리 타입 정의
export interface MCPQuery {
  query: string;
  context?: Record<string, any>;
  sessionId?: string;
}

export interface MCPResponse {
  id: string;
  query: string;
  response: string;
  confidence: number;
  responseTime: number;
  timestamp: string;
  sources: string[];
  metadata: Record<string, any>;
  isThinking?: boolean;
  thinkingSteps?: {
    step: number;
    description: string;
    progress: number;
  }[];
}

export interface MCPQueryHistory {
  queries: MCPResponse[];
  totalCount: number;
  lastQuery?: string;
}

// 🔧 API 함수들
const sendMCPQuery = async (queryData: MCPQuery): Promise<MCPResponse> => {
  const response = await fetch('/api/mcp/query', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(queryData),
  });

  if (!response.ok) {
    throw new Error(`MCP 쿼리 실패: ${response.status}`);
  }

  return response.json();
};

const fetchMCPHistory = async (
  limit: number = 50
): Promise<MCPQueryHistory> => {
  const response = await fetch(`/api/mcp/query?limit=${limit}`);
  if (!response.ok) {
    throw new Error(`MCP 히스토리 조회 실패: ${response.status}`);
  }
  return response.json();
};

const fetchMCPStatus = async () => {
  const response = await fetch('/api/mcp/status');
  if (!response.ok) {
    throw new Error(`MCP 상태 조회 실패: ${response.status}`);
  }
  return response.json();
};

// 🎣 React Query 훅들

// MCP 쿼리 전송 Mutation
export const useMCPQuery = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: sendMCPQuery,
    onSuccess: () => {
      // 성공 시 히스토리 새로고침
      queryClient.invalidateQueries({ queryKey: ['mcp-history'] });
    },
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 5000),
  });
};

// MCP 쿼리 히스토리 조회
export const useMCPHistory = (limit: number = 50) => {
  return useQuery({
    queryKey: ['mcp-history', limit],
    queryFn: () => fetchMCPHistory(limit),
    refetchInterval: 60000, // 1분마다 자동 갱신
    staleTime: 30000, // 30초간 데이터 신선도 유지
  });
};

// MCP 상태 조회
export const useMCPStatus = () => {
  return useQuery({
    queryKey: ['mcp-status'],
    queryFn: fetchMCPStatus,
    refetchInterval: 120000, // 30초 → 120초로 변경 (과도한 요청 방지)
    staleTime: 60000, // 15초 → 60초로 증가
    retry: 2,
  });
};

// 🔄 히스토리 새로고침
export const useRefreshMCPHistory = () => {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['mcp-history'] });
  };
};

// 🎨 응답 신뢰도별 색상
export const getConfidenceColor = (confidence: number) => {
  if (confidence >= 0.8) return 'text-green-600 bg-green-50';
  if (confidence >= 0.6) return 'text-yellow-600 bg-yellow-50';
  return 'text-red-600 bg-red-50';
};

// ⏱️ 응답시간별 색상
export const getResponseTimeColor = (responseTime: number) => {
  if (responseTime <= 1000) return 'text-green-600'; // 1초 이하
  if (responseTime <= 3000) return 'text-yellow-600'; // 3초 이하
  return 'text-red-600'; // 3초 초과
};

// 📄 응답 텍스트 포맷팅
export const formatMCPResponse = (response: string): string => {
  // 마크다운 스타일 포맷팅
  return response
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br/>');
};

// 🕒 시간 포맷팅
export const formatQueryTime = (timestamp: string): string => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now.getTime() - time.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}시간 전`;
  return `${Math.floor(diffMins / 1440)}일 전`;
};
