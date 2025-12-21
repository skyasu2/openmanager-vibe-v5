# Code Style Rules

## TypeScript Strict Mode
- `any` 사용 절대 금지
- `TypeScript strict` 모드 준수
- 명시적 타입 선언 권장

## Code Quality
- 중복 코드 지양
- 단일 책임 원칙(SRP) 준수
- 함수/클래스는 한 가지 역할만 수행

## Naming Conventions
- 컴포넌트: PascalCase (`ServerCard.tsx`)
- 유틸리티: camelCase (`formatDate.ts`)
- 상수: UPPER_SNAKE_CASE (`MAX_RETRY_COUNT`)
- 타입/인터페이스: PascalCase with prefix (`IServerConfig`, `TMetricData`)

## Error Handling
- AI 엔진 장애 시에도 UI 정상 동작 (Graceful Degradation)
- Circuit Breaker 패턴 적용
- Failover 로직 유지 (Key/Model 레벨)
