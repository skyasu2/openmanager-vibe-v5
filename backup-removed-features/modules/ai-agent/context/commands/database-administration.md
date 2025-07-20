# 🗃️ 데이터베이스 관리 명령어 가이드

> **분류**: 핵심 컨텍스트 (실무 필수)  
> **우선순위**: 높음  
> **역할**: 데이터베이스 운영, 성능 최적화, 트러블슈팅

## 🐘 MySQL 관리

### 성능 문제 진단

```sql
-- 현재 실행 중인 쿼리 확인
SHOW PROCESSLIST;

-- 슬로우 쿼리 확인
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- 쿼리 실행 계획 분석
EXPLAIN SELECT * FROM table_name WHERE condition;

-- 인덱스 사용 현황
SHOW INDEX FROM table_name;

-- 테이블 상태 확인
SHOW TABLE STATUS LIKE 'table_name';
```

### 연결 및 성능 관리

```sql
-- 현재 연결 수 확인
SHOW STATUS LIKE 'Threads_connected';

-- 최대 연결 수 확인
SHOW VARIABLES LIKE 'max_connections';

-- 연결 종료
KILL CONNECTION [connection_id];

-- 쿼리 종료
KILL QUERY [connection_id];

-- 서버 상태 확인
SHOW STATUS;
```

### 시스템 명령어

```bash
# MySQL 서비스 관리
systemctl status mysql
systemctl restart mysql
systemctl stop mysql

# 슬로우 쿼리 로그 분석
mysqldumpslow /var/log/mysql/mysql-slow.log

# 백업 생성
mysqldump -u root -p database_name > backup.sql

# 백업 복원
mysql -u root -p database_name < backup.sql
```

### ⚠️ 안전성 경고

- `KILL` 명령어 사용 시 트랜잭션 롤백 확인
- 슬로우 쿼리 로그 활성화 시 디스크 공간 주의
- 백업 중 테이블 잠금 가능성 고려

---

## 🐘 PostgreSQL 관리

### 성능 모니터링

```sql
-- 활성 쿼리 확인
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- 데이터베이스 통계
SELECT * FROM pg_stat_database;

-- 테이블 통계
SELECT * FROM pg_stat_user_tables;

-- 인덱스 사용 통계
SELECT * FROM pg_stat_user_indexes;

-- 쿼리 실행 계획
EXPLAIN ANALYZE SELECT * FROM table_name WHERE condition;
```

### 연결 관리

```sql
-- 현재 연결 수
SELECT count(*) FROM pg_stat_activity;

-- 최대 연결 수 확인
SHOW max_connections;

-- 연결 강제 종료
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = [pid];

-- 데이터베이스별 연결 수
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;
```

### 시스템 명령어

```bash
# PostgreSQL 서비스 관리
systemctl status postgresql
systemctl restart postgresql
pg_ctl status

# 데이터베이스 접속
psql -U username -d database_name

# 백업 생성
pg_dump -U username database_name > backup.sql

# 백업 복원
psql -U username database_name < backup.sql

# 연결 풀링 (pgbouncer)
pgbouncer -d /etc/pgbouncer/pgbouncer.ini
```

### ⚠️ 안전성 경고

- `pg_terminate_backend` 사용 시 연결 강제 종료
- `VACUUM` 작업 시 테이블 잠금 주의
- 백업 복원 시 기존 데이터 덮어쓰기 위험

---

## 🔴 Redis 관리

### 메모리 관리

```bash
# Redis 접속
redis-cli

# 메모리 사용량 확인
INFO memory

# 메모리 사용량 상세
MEMORY STATS

# 키별 메모리 사용량
MEMORY USAGE [key]

# 데이터베이스 정리
FLUSHDB

# 모든 데이터베이스 정리 (주의!)
FLUSHALL
```

### 성능 모니터링

```bash
# 실시간 통계
INFO stats

# 실시간 명령어 모니터링 (주의: 성능 영향)
MONITOR

# 슬로우 로그 확인
SLOWLOG GET 10

# 연결된 클라이언트 확인
CLIENT LIST

# 레이턴시 확인
LATENCY LATEST
```

### 설정 관리

```bash
# 현재 설정 확인
CONFIG GET *

# 메모리 제한 설정
CONFIG SET maxmemory 1gb

# 메모리 정책 설정
CONFIG SET maxmemory-policy allkeys-lru

# 설정 저장
CONFIG REWRITE

# 서비스 관리
systemctl status redis
systemctl restart redis
```

### ⚠️ 안전성 경고

- `FLUSHDB/FLUSHALL` 사용 시 데이터 완전 삭제
- `MONITOR` 명령어는 성능에 영향을 줄 수 있음
- 메모리 정책 변경 시 데이터 손실 가능

---

## 🍃 MongoDB 관리

### 성능 분석

```javascript
// 현재 실행 중인 작업
db.currentOp();

// 인덱스 확인
db.collection.getIndexes();

// 쿼리 실행 계획
db.collection.explain('executionStats').find({ query });

// 컬렉션 통계
db.collection.stats();

// 데이터베이스 통계
db.stats();
```

### 연결 및 성능 관리

```javascript
// 서버 상태
db.serverStatus();

// 연결 상태
db.serverStatus().connections;

// 연결 풀 통계
db.runCommand({ connPoolStats: 1 });

// 작업 종료
db.adminCommand('killOp', { op: [opid] });

// 프로파일링 활성화
db.setProfilingLevel(2);
```

### 시스템 명령어

```bash
# MongoDB 서비스 관리
systemctl status mongod
systemctl restart mongod

# 실시간 통계
mongostat

# 컬렉션별 사용 시간
mongotop

# 백업 생성
mongodump --db database_name

# 백업 복원
mongorestore --db database_name dump/

# MongoDB 접속
mongo --host localhost:27017
```

### ⚠️ 안전성 경고

- `killOp` 사용 시 진행 중인 작업 중단
- 인덱스 생성 시 컬렉션 크기에 따른 시간 소요
- 백업 중 데이터 일관성 확인

---

## 🔒 데이터베이스 보안

### MySQL 보안

```sql
-- 사용자 권한 확인
SHOW GRANTS FOR 'username'@'host';

-- 사용자 생성
CREATE USER 'username'@'host' IDENTIFIED BY 'password';

-- 권한 부여
GRANT SELECT, INSERT ON database.* TO 'username'@'host';

-- 권한 취소
REVOKE INSERT ON database.* FROM 'username'@'host';

-- 사용자 삭제
DROP USER 'username'@'host';
```

### PostgreSQL 보안

```sql
-- 사용자 목록
\du

-- 사용자 생성
CREATE USER username WITH PASSWORD 'password';

-- 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO username;

-- 데이터베이스 접근 권한
GRANT CONNECT ON DATABASE database_name TO username;
```

### Redis 보안

```bash
# 인증 설정 확인
CONFIG GET requirepass

# 패스워드 설정
CONFIG SET requirepass "password"

# 인증
AUTH password

# 위험한 명령어 비활성화
CONFIG SET rename-command FLUSHDB ""
```

### ⚠️ 안전성 경고

- 권한 변경 시 애플리케이션 접근 영향
- 패스워드 변경 시 연결 설정 업데이트 필요
- 최소 권한 원칙 적용

---

## 💾 백업 및 복구

### 자동화된 백업

```bash
# MySQL 자동 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p$PASSWORD database_name > backup_$DATE.sql

# PostgreSQL 자동 백업
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -U username database_name > backup_$DATE.sql

# Redis 백업
redis-cli --rdb dump_$DATE.rdb

# MongoDB 백업
mongodump --db database_name --out backup_$DATE/
```

### 복구 절차

```bash
# MySQL 복구
mysql -u root -p database_name < backup.sql

# PostgreSQL 복구
psql -U username database_name < backup.sql

# Redis 복구 (서비스 중단 필요)
systemctl stop redis
cp backup.rdb /var/lib/redis/dump.rdb
systemctl start redis

# MongoDB 복구
mongorestore --db database_name backup_directory/
```

### ⚠️ 안전성 경고

- 복구 전 기존 데이터 백업 필수
- 대용량 백업 시 디스크 공간 확인
- 복구 중 서비스 중단 시간 고려

---

## 🚨 응급 상황 대응

### 데이터베이스 응답 없음

1. **연결 확인**: `telnet localhost [port]`
2. **프로세스 확인**: `ps aux | grep [database]`
3. **로그 확인**: `tail -f /var/log/[database]/error.log`
4. **서비스 재시작**: `systemctl restart [database]`
5. **디스크 공간 확인**: `df -h`

### 슬로우 쿼리 급증

1. **실행 중인 쿼리 확인**: `SHOW PROCESSLIST` (MySQL)
2. **문제 쿼리 식별**: 실행 시간이 긴 쿼리 찾기
3. **쿼리 종료**: `KILL QUERY [id]`
4. **실행 계획 분석**: `EXPLAIN` 사용
5. **인덱스 최적화**: 필요한 인덱스 추가

### 메모리 부족 (Redis)

1. **메모리 사용량 확인**: `INFO memory`
2. **큰 키 식별**: `MEMORY USAGE [key]`
3. **불필요한 데이터 정리**: `DEL [key]`
4. **메모리 정책 조정**: `CONFIG SET maxmemory-policy`
5. **메모리 제한 증가**: `CONFIG SET maxmemory`

### 연결 수 한계 도달

1. **현재 연결 수 확인**: 각 DB별 연결 수 명령어 사용
2. **유휴 연결 종료**: 오래된 연결 식별 후 종료
3. **연결 풀 설정**: 애플리케이션 연결 풀 최적화
4. **최대 연결 수 증가**: 설정 파일 수정 후 재시작
5. **모니터링 강화**: 연결 수 추이 지속 관찰

---

**💡 핵심 원칙**

- 변경 전 반드시 백업 생성
- 프로덕션 환경에서는 점진적 변경
- 모니터링을 통한 사전 예방
- 복구 계획 사전 수립 및 테스트
