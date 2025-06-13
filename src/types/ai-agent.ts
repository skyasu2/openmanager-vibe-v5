/**
 * AI 에이전트 관리 대시보드 타입 정의
 */

export interface ResponseLogData {
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

export interface PatternSuggestion {
  id: string;
  originalQuery: string;
  suggestedPattern: string;
  confidence: number;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  examples: string[];
}

export interface ContextDocument {
  id: string;
  filename: string;
  category: 'basic' | 'advanced' | 'custom';
  size: number;
  lastModified: string;
  wordCount: number;
  keywords: string[];
  content?: string;
}

export interface SystemHealth {
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

export interface AIAgentFilters {
  dateRange: string;
  status: string;
  confidence: string;
}

export interface AIAgentStats {
  totalLogs: number;
  successRate: number;
  patternSuggestions: number;
  pendingPatterns: number;
  contextDocuments: number;
  totalWords: number;
  systemStatus: string;
  fallbackRate: number;
}
