/**
 * 🎭 Mock 데이터 설정
 * 
 * 환경변수로 Mock/Real 모드 전환
 * - USE_MOCK_DATA: Mock 데이터 사용 여부
 * - MOCK_AUTO_ROTATE: 자동 회전 활성화
 * - MOCK_ROTATION_SPEED: 회전 속도 배수
 */

export interface MockConfig {
  enabled: boolean;
  autoRotate: boolean;
  rotationSpeed: number;
  rotationInterval: number;
  showIndicator: boolean;
}

/**
 * Mock 설정 가져오기
 */
export function getMockConfig(): MockConfig {
  // 환경변수 읽기
  const useMockData = process.env.USE_MOCK_DATA === 'true' || 
                      process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true';
  
  const autoRotate = process.env.MOCK_AUTO_ROTATE !== 'false';
  const rotationSpeed = parseFloat(process.env.MOCK_ROTATION_SPEED || '1');
  const rotationInterval = parseInt(process.env.MOCK_ROTATION_INTERVAL || '30000');
  
  // 개발 환경에서만 인디케이터 표시
  const showIndicator = process.env.NODE_ENV === 'development' && useMockData;
  
  return {
    enabled: useMockData,
    autoRotate,
    rotationSpeed,
    rotationInterval,
    showIndicator,
  };
}

/**
 * Mock 모드 확인
 */
export function isMockMode(): boolean {
  return getMockConfig().enabled;
}

/**
 * Mock 데이터 소스 헤더 생성
 */
export function getMockHeaders(): Record<string, string> {
  if (!isMockMode()) {
    return {};
  }
  
  return {
    'X-Data-Source': 'Mock-System-v2',
    'X-Mock-Mode': 'true',
    'X-Mock-Features': JSON.stringify({
      autoRotate: getMockConfig().autoRotate,
      speed: getMockConfig().rotationSpeed,
    }),
  };
}