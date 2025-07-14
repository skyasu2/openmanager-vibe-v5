# Supabase MCP Server 사용 가이드

## 개요
`@supabase/mcp-server-supabase`는 Supabase 데이터베이스와 직접 상호작용할 수 있게 해주는 MCP 서버입니다.

## 주요 기능

### 1. 데이터베이스 쿼리
- SQL 쿼리 실행
- 테이블 데이터 조회
- 데이터 삽입, 업데이트, 삭제

### 2. 테이블 관리
- 테이블 생성 및 수정
- 인덱스 관리
- 관계 설정

### 3. 실시간 기능
- Realtime 구독
- 데이터베이스 변경 사항 모니터링

### 4. 인증 및 보안
- RLS (Row Level Security) 정책 관리
- 사용자 관리
- 권한 설정

## 사용 예시

### 테이블 조회
```sql
-- 모든 서버 목록 조회
SELECT * FROM servers;

-- 활성 서버만 조회
SELECT * FROM servers WHERE status = 'active';
```

### 데이터 분석
```sql
-- 서버별 평균 CPU 사용률
SELECT server_id, AVG(cpu_usage) as avg_cpu
FROM metrics
GROUP BY server_id;
```

### 실시간 모니터링
```sql
-- 최근 5분간 알림
SELECT * FROM alerts
WHERE created_at > NOW() - INTERVAL '5 minutes'
ORDER BY created_at DESC;
```

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수가 필요합니다:
- `SUPABASE_URL`: Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service Role Key (관리자 권한)

## 보안 주의사항

1. Service Role Key는 절대 클라이언트 코드에 노출하지 마세요
2. 프로덕션 환경에서는 RLS 정책을 반드시 설정하세요
3. 민감한 데이터 쿼리 시 주의하세요

## 통합 시나리오

### 1. 개발 중 데이터 확인
- 테스트 데이터 생성
- 데이터베이스 스키마 검증
- 쿼리 성능 테스트

### 2. 디버깅
- 실시간 로그 확인
- 데이터 무결성 검증
- 트랜잭션 추적

### 3. 데이터 마이그레이션
- 스키마 변경
- 데이터 백업 및 복원
- 일괄 데이터 처리

## 제한사항

- 대용량 쿼리는 타임아웃 될 수 있음
- DDL 작업은 주의해서 실행
- 프로덕션 데이터베이스 직접 수정은 권장하지 않음