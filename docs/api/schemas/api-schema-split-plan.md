# api.schema.ts 파일 분할 계획

## 📅 작성일: 2025-01-30

## 🎯 목표
1,837줄의 거대한 api.schema.ts 파일을 도메인별로 분할하여 유지보수성 향상

## 📊 현재 상태
- **파일 위치**: `/src/schemas/api.schema.ts`
- **총 라인 수**: 1,837줄
- **섹션 수**: 27개
- **문제점**: 권장 한계(1,500줄) 초과, 다양한 도메인 혼재

## 🏗️ 분할 구조

### 1. **server-schemas/** (275줄)
- `server-details.schema.ts` (150줄) - 서버 상세 정보
- `server-metrics.schema.ts` (35줄) - 서버 메트릭
- `server-pagination.schema.ts` (90줄) - 서버 페이지네이션

### 2. **ai-schemas/** (289줄)
- `ai-performance.schema.ts` (133줄) - AI 성능 모니터링
- `ai-log-streaming.schema.ts` (93줄) - AI 로그 스트리밍
- `google-ai.schema.ts` (63줄) - Google AI API

### 3. **dashboard-schemas/** (136줄)
- `dashboard.schema.ts` (76줄) - 기본 대시보드
- `dashboard-optimized.schema.ts` (60줄) - 최적화된 대시보드

### 4. **cache-schemas/** (162줄)
- `cache-stats.schema.ts` (55줄) - 캐시 통계
- `cache-optimization.schema.ts` (50줄) - 캐시 최적화
- `cached-server.schema.ts` (57줄) - 캐시된 서버 API

### 5. **mcp-schemas/** (158줄)
- `mcp-context-integration.schema.ts` (94줄) - MCP 컨텍스트 통합
- `mcp-context-sync.schema.ts` (64줄) - MCP 동기화
- `mcp-query.schema.ts` - MCP 쿼리

### 6. **system-schemas/** (404줄)
- `system-optimization.schema.ts` (112줄) - 시스템 최적화
- `memory cache-stats.schema.ts` (124줄) - Memory Cache 통계
- `database-pool.schema.ts` (72줄) - DB 풀 관리
- `dev-key-manager.schema.ts` (96줄) - 개발 키 관리

### 7. **notification-schemas/** (188줄)
- `browser-alerts.schema.ts` (94줄) - 브라우저 알림
- `alerts-stream.schema.ts` (94줄) - 알림 스트림

### 8. **common-schemas/** (225줄)
- `health-check.schema.ts` - 헬스체크
- `error-report.schema.ts` (59줄) - 에러 리포트
- `auth-test.schema.ts` (74줄) - 인증 테스트
- `api-wrapper.schema.ts` - API 응답 래퍼
- `batch-operations.schema.ts` - 배치 작업

### 9. **index.ts** - 모든 스키마 re-export

## 🚀 실행 단계

1. **디렉토리 구조 생성**
   ```
   src/schemas/
   ├── api.schema.ts (기존 파일 - 제거 예정)
   ├── index.ts (새로 생성)
   ├── server-schemas/
   ├── ai-schemas/
   ├── dashboard-schemas/
   ├── cache-schemas/
   ├── mcp-schemas/
   ├── system-schemas/
   ├── notification-schemas/
   └── common-schemas/
   ```

2. **각 도메인별 파일 생성 및 스키마 이동**
   - 관련 스키마와 타입 export를 각 파일로 이동
   - import 경로 업데이트

3. **index.ts에서 통합 export**
   - 모든 하위 스키마 파일에서 export
   - 기존 import 경로와의 호환성 유지

4. **기존 파일 제거 및 import 경로 업데이트**
   - api.schema.ts를 사용하는 모든 파일의 import 경로 수정
   - 점진적 마이그레이션 지원

## ✅ 예상 효과

- **가독성**: 도메인별 분리로 관련 스키마 찾기 용이
- **유지보수성**: 각 파일이 300줄 이하로 관리 용이
- **확장성**: 새로운 스키마 추가 시 적절한 디렉토리에 배치
- **성능**: 필요한 스키마만 import하여 번들 크기 최적화

## ⚠️ 주의사항

1. **import 경로 호환성**: 기존 코드가 깨지지 않도록 index.ts에서 전체 export
2. **순환 참조 방지**: 스키마 간 의존성 확인
3. **타입 안전성**: 모든 타입 export 유지
4. **점진적 마이그레이션**: 한 번에 모든 import 경로를 변경하지 않고 단계적 진행