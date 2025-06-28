export interface ServiceStatus {
  name: string;
  status: 'connected' | 'error' | 'unknown';
  responseTime: number;
  details: any;
  error?: string;
}

export interface ServicesStatusResponse {
  timestamp: string;
  environment: string;
  services: ServiceStatus[];
  summary: {
    total: number;
    connected: number;
    errors: number;
    averageResponseTime: number;
  };
}

export interface KeyManagerStatus {
  timestamp: string;
  environment: string;
  keyManager: string;
  summary: {
    total: number;
    valid: number;
    invalid: number;
    missing: number;
    successRate: number;
  };
  services?: Array<{
    service: string;
    status: 'active' | 'missing' | 'invalid';
    source: 'env' | 'default' | 'encrypted';
    preview: string;
    lastChecked: string;
  }>;
}

export interface AITestResult {
  success: boolean;
  engine: string;
  response: string;
  responseTime: number;
  error?: string;
  metadata?: any;
}

export interface AIEngineStatus {
  name: string;
  status: 'active' | 'inactive' | 'error';
  responseTime: number;
  requests: number;
  type: string;
  version: string;
  description: string;
}

export interface UpdateStats {
  totalPrevented: number;
  lastUpdate: string;
  preventionActive: boolean;
  details: any;
}
