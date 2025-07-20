export interface EngineResult {
  success: boolean;
  answer: string;
  confidence: number;
  engine: string;
  processingTime: number;
  sources?: any[];
  metadata?: Record<string, any>;
}

export interface EngineAdapter {
  name: string;
  isAvailable(): Promise<boolean>;
  query(question: string, context?: any): Promise<EngineResult>;
}

export interface CombinedResponse {
  success: boolean;
  answer: string;
  confidence: number;
  engine: string;
  sources?: any[];
  internalResults: EngineResult[];
  externalResult?: EngineResult;
  processingTime: number;
} 