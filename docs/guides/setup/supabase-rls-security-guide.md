# 🟢 Supabase RLS 보안 가이드

**작성일**: 2025년 8월 3일  
**버전**: v1.0

## 📋 개요

Supabase Row Level Security (RLS)를 활용한 데이터 보안 구현 가이드입니다.

## 🔒 RLS 기본 설정

### 테이블 RLS 활성화 (필수)

```sql
-- 테이블에 RLS 활성화
ALTER TABLE servers ENABLE ROW LEVEL SECURITY;
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
```

## 🛡️ 보안 정책 패턴

### 1. 사용자별 데이터 격리

```sql
-- 개별 사용자 데이터 접근
CREATE POLICY "Users can only see own servers" ON servers
FOR ALL USING (auth.uid() = user_id);

-- 인덱스 최적화 (필수)
CREATE INDEX idx_servers_user_id ON servers(user_id);
```

### 2. 팀 기반 접근 제어

```sql
-- 팀 멤버십 확인
CREATE POLICY "Team members can access team servers" ON servers
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM team_members
    WHERE team_id = servers.team_id
    AND user_id = auth.uid()
  )
);

-- 성능 최적화 인덱스
CREATE INDEX idx_team_members_user_team ON team_members(user_id, team_id);
```

### 3. 역할 기반 권한

```sql
-- 관리자 권한 확인
CREATE POLICY "Admins can manage all data" ON servers
FOR ALL USING (
  (auth.jwt() ->> 'role') = 'admin'
);

-- 읽기 전용 사용자
CREATE POLICY "Read-only access for viewers" ON servers
FOR SELECT USING (
  (auth.jwt() ->> 'role') IN ('viewer', 'admin', 'editor')
);
```

## ⚠️ 중요 보안 원칙

### 1. JWT 데이터 검증

```sql
-- ❌ 위험: user_metadata 사용 금지
CREATE POLICY "Unsafe policy" ON servers
FOR ALL USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  -- user_metadata는 사용자가 수정 가능!
);

-- ✅ 안전: app_metadata 사용
CREATE POLICY "Safe policy" ON servers
FOR ALL USING (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
  -- app_metadata는 서버에서만 수정 가능
);
```

### 2. 성능 고려사항

```sql
-- RLS 정책에 사용되는 모든 컬럼에 인덱스 필수
CREATE INDEX idx_servers_user_id ON servers(user_id);
CREATE INDEX idx_servers_team_id ON servers(team_id);
CREATE INDEX idx_servers_created_at ON servers(created_at);

-- 복합 인덱스로 쿼리 최적화
CREATE INDEX idx_servers_user_team ON servers(user_id, team_id);
```

### 3. 테스트 자동화

```sql
-- pgTAP으로 RLS 정책 테스트
BEGIN;
SELECT plan(3);

-- 테스트 사용자 생성
SET LOCAL "request.jwt.claims" TO '{"sub": "test-user-id", "role": "user"}';

-- 권한 테스트
SELECT ok(
  (SELECT count(*) FROM servers) = 0,
  'User should not see any servers initially'
);

-- 데이터 삽입 테스트
INSERT INTO servers (name, user_id) VALUES ('test-server', 'test-user-id');
SELECT ok(
  (SELECT count(*) FROM servers) = 1,
  'User should see their own server'
);

-- 다른 사용자 데이터 접근 차단 테스트
SET LOCAL "request.jwt.claims" TO '{"sub": "other-user-id", "role": "user"}';
SELECT ok(
  (SELECT count(*) FROM servers) = 0,
  'Other user should not see first users servers'
);

SELECT * FROM finish();
ROLLBACK;
```

## 📦 Storage RLS 설정

```sql
-- 스토리지 버킷 RLS 활성화
CREATE POLICY "Users can upload own files" ON storage.objects
FOR INSERT WITH CHECK (auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view own files" ON storage.objects
FOR SELECT USING (auth.uid()::text = (storage.foldername(name))[1]);
```

## 💡 베스트 프랙티스

1. **항상 RLS 활성화**: 새 테이블 생성 시 즉시 RLS 활성화
2. **인덱스 최적화**: RLS 정책에 사용되는 모든 컬럼에 인덱스 생성
3. **app_metadata 사용**: 역할 기반 권한은 app_metadata에 저장
4. **정기 테스트**: pgTAP으로 RLS 정책 자동 테스트
5. **성능 모니터링**: EXPLAIN ANALYZE로 쿼리 성능 확인

## 🔗 관련 문서

- [Supabase RLS 공식 문서](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL RLS 가이드](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [pgTAP 테스트 프레임워크](https://pgtap.org/)
