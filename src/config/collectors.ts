import { CollectorConfig } from '@/types/collector';

/**
 * 수집기 설정 중앙 관리
 * 
 * 환경변수나 설정 파일에 따라 더미 모드와 실제 모드를 전환할 수 있습니다.
 */

// 프로덕션 전용 설정
const COLLECTOR_MODE = process.env.COLLECTOR_MODE || 'production'; // 'production' only

// 빌드 타임 체크 함수
function isBuildTime() {
  return process.env.NODE_ENV === undefined || process.env.npm_lifecycle_event === 'build'
}

/**
 * 프로덕션 Collector 설정들
 */
const productionConfigs: CollectorConfig[] = [
  {
    id: 'prometheus',
    type: 'prometheus',
    name: 'Prometheus Metrics',
    endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://localhost:9090',
    interval: 30000, // 30초
    timeout: 10000,
    retryAttempts: 3,
    enabled: true,
    tags: ['metrics', 'monitoring', 'performance'],
    authentication: {
      type: 'bearer',
      token: process.env.PROMETHEUS_TOKEN
    }
  },
  {
    id: 'grafana',
    type: 'custom',
    name: 'Grafana API',
    endpoint: process.env.GRAFANA_ENDPOINT || 'http://localhost:3000/api',
    interval: 60000, // 1분
    timeout: 15000,
    retryAttempts: 2,
    enabled: Boolean(process.env.GRAFANA_ENDPOINT),
    tags: ['visualization', 'dashboards'],
    authentication: {
      type: 'api-key',
      apiKey: process.env.GRAFANA_API_KEY
    }
  },
  {
    id: 'cloudwatch',
    type: 'cloudwatch',
    name: 'AWS CloudWatch',
    endpoint: process.env.AWS_CLOUDWATCH_ENDPOINT,
    interval: 120000, // 2분
    timeout: 20000,
    retryAttempts: 3,
    enabled: Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    tags: ['aws', 'cloud', 'metrics'],
    authentication: {
      type: 'aws',
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    }
  },
  {
    id: 'custom-webhook',
    type: 'custom',
    name: 'Custom Webhook Collector',
    endpoint: process.env.CUSTOM_WEBHOOK_ENDPOINT,
    interval: 45000, // 45초
    timeout: 12000,
    retryAttempts: 2,
    enabled: Boolean(process.env.CUSTOM_WEBHOOK_ENDPOINT),
    tags: ['webhook', 'custom', 'integration'],
    authentication: {
      type: 'bearer',
      token: process.env.CUSTOM_WEBHOOK_TOKEN
    }
  }
];

/**
 * 실제 환경변수 기반 Collector 설정 반환
 */
export function getCollectorConfigs(): CollectorConfig[] {
  console.log(`🔧 프로덕션 Collector 모드: ${COLLECTOR_MODE}`);
  return productionConfigs.filter(config => config.enabled);
}

/**
 * 특정 Collector 설정 가져오기
 */
export function getCollectorConfig(id: string): CollectorConfig | undefined {
  return productionConfigs.find(config => config.id === id);
}

/**
 * 활성화된 Collector 개수
 */
export function getActiveCollectorCount(): number {
  return productionConfigs.filter(config => config.enabled).length;
}

/**
 * 환경변수 검증
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
  // 빌드 타임에는 검증 건너뛰기
  if (isBuildTime()) {
    console.log('🔨 빌드 타임: Collector 환경변수 검증 건너뜀')
    return { valid: true, errors: [] }
  }

  const errors: string[] = [];
  
  if (COLLECTOR_MODE === 'production') {
    // Supabase 설정 검증
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      errors.push('NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다');
    }
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      errors.push('NEXT_PUBLIC_SUPABASE_ANON_KEY가 설정되지 않았습니다');
    }
    
    // Redis 설정 검증
    if (!process.env.REDIS_URL) {
      errors.push('REDIS_URL이 설정되지 않았습니다');
    }
    
    // 수집기별 필수 환경변수 검증
    const hasPrometheus = !!process.env.PROMETHEUS_ENDPOINT;
    const hasCloudWatch = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasCustomAPI = !!(process.env.ONPREM_API_ENDPOINT && process.env.ONPREM_API_KEY);
    
    if (!hasPrometheus && !hasCloudWatch && !hasCustomAPI) {
      errors.push('최소 하나의 수집기 설정이 필요합니다 (Prometheus, CloudWatch, 또는 Custom API)');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * 수집기 설정 요약 정보
 */
export function getCollectorSummary() {
  const configs = getCollectorConfigs();
  const mode = COLLECTOR_MODE;
  const validation = validateEnvironment();
  
  return {
    mode,
    totalCollectors: configs.length,
    collectors: configs.map(config => ({
      type: config.type,
      endpoint: config.endpoint,
      interval: config.interval
    })),
    isValid: validation.valid,
    validationErrors: validation.errors
  };
} 