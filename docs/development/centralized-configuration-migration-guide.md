# 🔧 중앙집중식 설정 관리 마이그레이션 가이드

**목적**: 하드코딩된 값들을 체계적인 중앙집중식 설정 관리 시스템으로 전환
**작성일**: 2025-09-24
**대상**: 개발자, DevOps 엔지니어

## 🎯 개선 목표

### **Before (문제점)**
- 서버 수가 API마다 다름 (8개, 10개, 15개)
- 하드코딩된 설정 값들 곳곳에 분산
- 환경별 설정 관리 어려움
- 타입 안전성 부족

### **After (개선 후)**
- 단일 진실 소스 (Single Source of Truth)
- 환경변수 기반 동적 설정
- 타입 안전성 100% 보장
- 중앙집중식 설정 관리

## 🚀 새로운 시스템 아키텍처

### **1. 중앙집중식 설정 관리자**
```typescript
// src/config/SystemConfiguration.ts
import { SystemConfigurationManager } from '@/config/SystemConfiguration';

const config = SystemConfigurationManager.getInstance();
const totalServers = config.get('totalServers'); // 타입 안전
const mockConfig = config.get('mockSystem');
```

### **2. 통합 데이터 소스**
```typescript
// src/services/data/UnifiedServerDataSource.ts
import { UnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';

const dataSource = UnifiedServerDataSource.getInstance();
const servers = await dataSource.getServers(); // 항상 일관된 데이터
```

### **3. 환경변수 기반 설정**
```bash
# .env.local
TOTAL_SERVERS=15
MOCK_DATA_SOURCE=expanded
ENABLE_CACHE=true
```

## 📋 단계별 마이그레이션 프로세스

### **Step 1: 환경변수 설정**

1. **`.env.local` 파일 업데이트**
```bash
# 기존 설정들 유지하고 추가
TOTAL_SERVERS=15
MOCK_DATA_SOURCE=expanded
ENABLE_CACHE=true
CACHE_TTL_MS=300000
```

2. **환경별 설정 확인**
```bash
# 개발환경
NODE_ENV=development
ENABLE_DEBUG_LOGS=true

# 프로덕션
NODE_ENV=production
ENABLE_DEBUG_LOGS=false
```

### **Step 2: API 엔드포인트 마이그레이션**

#### **API 1: `/api/servers/all` 마이그레이션**

**Before (하드코딩)**:
```typescript
// ❌ 기존 방식
export async function GET(request: NextRequest) {
  // 하드코딩된 10개 서버 보장
  if (Object.keys(servers).length < 10) {
    const missingCount = 10 - Object.keys(servers).length;
    // ...하드코딩 로직
  }
}
```

**After (중앙집중식)**:
```typescript
// ✅ 새로운 방식
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';

export async function GET(request: NextRequest) {
  try {
    const dataSource = getUnifiedServerDataSource();
    const servers = await dataSource.getServers();

    // 페이지네이션도 설정에서 관리
    const config = getApiConfig();
    const page = parseInt(searchParams.get('page') ?? '1');
    const limit = Math.min(
      parseInt(searchParams.get('limit') ?? config.defaultPageSize.toString()),
      config.maxPageSize
    );

    const startIndex = (page - 1) * limit;
    const paginatedServers = servers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      success: true,
      data: paginatedServers,
      pagination: {
        page,
        limit,
        total: servers.length,
        totalPages: Math.ceil(servers.length / limit),
        hasNext: startIndex + limit < servers.length,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error('Server list API error:', error);
    return NextResponse.json(
      { success: false, error: 'Server list fetch failed' },
      { status: 500 }
    );
  }
}
```

#### **API 2: `/api/dashboard` 마이그레이션**

**Before (구버전 Mock)**:
```typescript
// ❌ 기존 방식
import { getMockSystem } from '@/mock';

export async function GET() {
  const mockSystem = getMockSystem(); // 8개 서버
  const servers = mockSystem.getServers();
  // ...
}
```

**After (통합 데이터 소스)**:
```typescript
// ✅ 새로운 방식
import { getServerMetricsFromUnifiedSource } from '@/services/data/UnifiedServerDataSource';
import { getSystemConfig } from '@/config/SystemConfiguration';

export async function GET() {
  try {
    const metrics = await getServerMetricsFromUnifiedSource();
    const config = getSystemConfig();

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalServers: metrics.totalServers,
          onlineServers: metrics.onlineServers,
          warningServers: metrics.warningServers,
          criticalServers: metrics.criticalServers,
        },
        metadata: {
          dataSource: metrics.dataSource,
          lastUpdated: metrics.lastUpdated,
          environment: config.environment.mode,
        },
      },
    });
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { success: false, error: 'Dashboard data fetch failed' },
      { status: 500 }
    );
  }
}
```

#### **API 3: `/api/metrics/current` 개선**

**Before (직접 import)**:
```typescript
// ❌ 기존 방식
import { mockServersExpanded } from '@/mock/mockServerConfigExpanded';

export async function GET() {
  return mockServersExpanded.map(serverInfo => {
    // ... 직접 처리
  });
}
```

**After (통합 시스템)**:
```typescript
// ✅ 새로운 방식
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';

export async function GET() {
  try {
    const dataSource = getUnifiedServerDataSource();
    const servers = await dataSource.getServers();

    // 통합 시스템에서 이미 처리된 완성된 데이터
    return NextResponse.json({
      success: true,
      servers: servers,
      metadata: {
        totalServers: servers.length,
        processingTime: 0, // 캐시 활용으로 빠른 응답
        dataConsistency: true,
        version: 'unified-v3.0',
      },
    });
  } catch (error) {
    console.error('Metrics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Metrics fetch failed' },
      { status: 500 }
    );
  }
}
```

### **Step 3: Mock 시스템 통합**

#### **기존 Mock 데이터 생성기 개선**

**Before**:
```typescript
// ❌ 여러 곳에 분산된 Mock 설정
import { mockServers } from './mockServerConfig'; // 8개
import { mockServersExpanded } from './mockServerConfigExpanded'; // 15개
// ... 각각 다른 설정
```

**After**:
```typescript
// ✅ 통합 Mock 관리
import { getSystemConfig } from '@/config/SystemConfiguration';
import { getUnifiedServerDataSource } from '@/services/data/UnifiedServerDataSource';

export function generateMockServerData() {
  const config = getSystemConfig();
  const dataSource = getUnifiedServerDataSource();

  // 설정에 따라 동적으로 생성
  return dataSource.getServers();
}
```

## 🔄 기존 코드 호환성 유지

### **점진적 마이그레이션 전략**

1. **새 시스템 도입 (호환 레이어)**
```typescript
// 기존 코드와의 호환성 유지
export function getMockSystem(config?: MockSystemConfig): MockSystem {
  // 새 시스템으로 위임하되 기존 인터페이스 유지
  const dataSource = getUnifiedServerDataSource();

  return {
    getServers: () => dataSource.getServers(),
    // ... 기존 인터페이스 구현
  };
}
```

2. **단계적 전환**
   - Week 1: 새 시스템 도입 (기존과 병행)
   - Week 2: 주요 API들 새 시스템으로 전환
   - Week 3: 기존 시스템 제거

### **롤백 계획**
```typescript
// 환경변수로 새 시스템 활성화/비활성화 제어
const USE_NEW_CONFIG_SYSTEM = process.env.USE_NEW_CONFIG_SYSTEM === 'true';

if (USE_NEW_CONFIG_SYSTEM) {
  // 새 시스템 사용
  const dataSource = getUnifiedServerDataSource();
  return dataSource.getServers();
} else {
  // 기존 시스템 사용 (롤백)
  const mockSystem = getMockSystem();
  return mockSystem.getServers();
}
```

## 📊 마이그레이션 체크리스트

### **Pre-Migration (사전 작업)**
- [ ] 환경변수 설정 완료 (`.env.local`)
- [ ] 새 시스템 타입 정의 확인
- [ ] 기존 API 동작 테스트 완료
- [ ] 백업 및 롤백 계획 수립

### **During Migration (마이그레이션 중)**
- [ ] API별 순차 전환 (하루 1-2개씩)
- [ ] 각 API 전환 후 기능 테스트
- [ ] 성능 지표 모니터링
- [ ] 에러 로그 모니터링

### **Post-Migration (마이그레이션 후)**
- [ ] 모든 API 데이터 일관성 검증
- [ ] 성능 테스트 수행
- [ ] 구버전 코드 정리
- [ ] 문서 업데이트

## 🎉 기대 효과

### **1. 데이터 일관성 100% 달성**
- 모든 API가 동일한 서버 수 반환
- 중복 설정 제거
- 설정 변경 시 한 곳만 수정

### **2. 개발 생산성 향상**
- 타입 안전성으로 런타임 오류 감소
- 환경별 설정 관리 간소화
- 디버깅 시간 50% 단축

### **3. 운영 효율성 증대**
- 환경변수로 실시간 설정 변경
- 캐시 시스템으로 성능 개선
- 중앙집중식 모니터링

### **4. 확장성 확보**
- 새로운 환경 추가 시 설정만 변경
- API 추가 시 일관된 패턴 적용
- 미래 요구사항에 유연한 대응

## 💡 추가 개선 방안

### **Phase 2: 고도화**
1. **실시간 설정 업데이트**: Redis/Database 기반
2. **A/B 테스트 지원**: 설정별 트래픽 분할
3. **자동 스케일링**: 부하에 따른 서버 수 자동 조정
4. **설정 히스토리**: 변경 이력 추적 및 롤백

### **Phase 3: 클라우드 네이티브**
1. **Kubernetes ConfigMap 통합**
2. **서비스 메시 설정 관리**
3. **다중 클러스터 설정 동기화**

---

**💡 핵심**: 하드코딩 제거 → 중앙집중식 설정 → 타입 안전성 → 운영 효율성