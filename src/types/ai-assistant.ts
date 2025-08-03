/**
 * AI 어시스턴트 관리 대시보드 타입 정의
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
  serverContext?: unknown;
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
  learningCycle: {
    lastRun: string;
    nextRun: string;
    status: 'idle' | 'running' | 'error';
  };
}

export interface AIAssistantFilters {
  dateRange: string;
  status: string;
  confidence: string;
}

export interface AIAssistantStats {
  totalLogs: number;
  successRate: number;
  _patternSuggestions: number;
  pendingPatterns: number;
  contextDocuments: number;
  totalWords: number;
  systemStatus: string;
}
