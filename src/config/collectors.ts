import { CollectorConfig } from '../types/collector';

/**
 * 수집기 설정 중앙 관리
 * 
 * 환경변수나 설정 파일에 따라 더미 모드와 실제 모드를 전환할 수 있습니다.
 */

const COLLECTOR_MODE = process.env.COLLECTOR_MODE || 'dummy'; // 'dummy' | 'production'

// 더미 모드 설정 (개발/테스트용)
const dummyConfigs: CollectorConfig[] = [
  {
    type: 'dummy',
    interval: 30,   // 30초마다 수집
    timeout: 10     // 10초 타임아웃
  }
];

// 프로덕션 모드 설정 (실제 서버 연동)
const productionConfigs: CollectorConfig[] = [
  // Kubernetes 클러스터 (Prometheus)
  {
    type: 'prometheus',
    endpoint: process.env.PROMETHEUS_ENDPOINT || 'http://prometheus.kube-system:9090',
    credentials: {
      apiKey: process.env.PROMETHEUS_API_KEY
    },
    interval: 60,   // 1분마다 수집
    timeout: 30     // 30초 타임아웃
  },
  
  // AWS EC2 인스턴스 (CloudWatch)
  {
    type: 'cloudwatch',
    credentials: {
      apiKey: process.env.AWS_ACCESS_KEY_ID || '',
      secretKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      region: process.env.AWS_REGION || 'us-east-1'
    },
    interval: 300,  // 5분마다 수집 (CloudWatch 기본 간격)
    timeout: 60     // 60초 타임아웃
  },
  
  // 온프레미스 서버 (Custom API)
  {
    type: 'custom',
    endpoint: process.env.ONPREM_API_ENDPOINT || 'https://monitoring.company.local',
    credentials: {
      apiKey: process.env.ONPREM_API_KEY || '',
      secretKey: process.env.ONPREM_API_SECRET || ''
    },
    interval: 120,  // 2분마다 수집
    timeout: 45     // 45초 타임아웃
  }
];

/**
 * 현재 모드에 따른 수집기 설정 반환
 */
export function getCollectorConfigs(): CollectorConfig[] {
  if (COLLECTOR_MODE === 'production') {
    console.log('🚀 프로덕션 모드: 실제 수집기 사용');
    return productionConfigs.filter(config => {
      // 필수 환경변수가 설정된 수집기만 활성화
      if (config.type === 'prometheus') {
        return !!process.env.PROMETHEUS_ENDPOINT;
      }
      if (config.type === 'cloudwatch') {
        return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
      }
      if (config.type === 'custom') {
        return !!(process.env.ONPREM_API_ENDPOINT && process.env.ONPREM_API_KEY);
      }
      return true;
    });
  }
  
  console.log('🧪 더미 모드: 시뮬레이션 데이터 사용');
  return dummyConfigs;
}

/**
 * 특정 타입의 수집기 설정 조회
 */
export function getCollectorConfig(type: string): CollectorConfig | undefined {
  const configs = getCollectorConfigs();
  return configs.find(config => config.type === type);
}

/**
 * 수집기 모드 확인
 */
export function isProductionMode(): boolean {
  return COLLECTOR_MODE === 'production';
}

/**
 * 환경변수 검증
 */
export function validateEnvironment(): { valid: boolean; errors: string[] } {
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