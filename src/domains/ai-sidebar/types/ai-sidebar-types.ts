/**
 * 🎯 AI 사이드바 관련 타입 정의
 */

export interface AIEngine {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  features: string[];
  usage?: {
    used: number;
    limit: number;
    resetTime?: string;
  };
  status: 'ready' | 'loading' | 'error' | 'disabled';
}

export interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  thinking?: ThinkingStep[];
  engine?: string;
  confidence?: number;
  processingTime?: number;
}

export interface ThinkingStep {
  id: string;
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration?: number;
}

export interface AutoReportTrigger {
  shouldGenerate: boolean;
  lastQuery?: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

export interface AISidebarV2Props {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}
