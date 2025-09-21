# 🔌 MCP 시스템 가이드

**OpenManager VIBE v5** - 9개 MCP 서버 통합 개발 환경

## 🎯 개요

MCP(Model Context Protocol)는 Claude Code의 기능을 확장하는 플러그인 시스템입니다.
현재 **CLI-only 방식**으로 9개 서버가 안정적으로 운영되고 있습니다.

## 📊 현재 상태 (2025-09-21)

| MCP 서버 | 연결 | 기능 테스트 | 주요 기능 |
|----------|------|-------------|----------|
| **🎉 context7** | ✅ | ✅ 완전 작동 | 라이브러리 문서 검색 |
| **🎉 supabase** | ✅ | ✅ 완전 작동 | PostgreSQL DB 관리 |
| **🎉 vercel** | ✅ | ✅ 완전 작동 | 프로젝트 배포 관리 |
| **memory** | ✅ | ⏳ 연결됨 | 지식 그래프 관리 |
| **time** | ✅ | ⏳ 연결됨 | 시간대 변환 |
| **sequential-thinking** | ✅ | ⏳ 연결됨 | 단계적 사고 프로세스 |
| **shadcn-ui** | ✅ | ⏳ 연결됨 | UI 컴포넌트 제공 |
| **serena** | ✅ | ⏳ 연결됨 | 코드베이스 분석 |
| **🎉 playwright** | ✅ | ✅ 완전 작동 | WSL+윈도우 크롬 E2E 테스트 |

**9개 서버 연결** | **CLI-only 방식** | **4개 완전 작동**

## 🚀 빠른 시작

### 1. MCP 서버 상태 확인
```bash
claude mcp list
```

### 2. 환경변수 로드
```bash
source ./scripts/setup-mcp-env.sh
```

### 3. 자동 건강 체크
```bash
./scripts/mcp-health-check.sh
```

### 4. 핵심 서버 테스트
```bash
# Context7 - 라이브러리 검색
mcp__context7__resolve-library-id "react"

# Supabase - 테이블 목록
mcp__supabase__list_tables

# Vercel - 팀 정보
mcp__vercel__list_teams
```

## 🔧 핵심 서버 활용법

### Context7 - 라이브러리 문서
```bash
# React 관련 문서 검색
mcp__context7__resolve-library-id "react"
```

### Supabase - 데이터베이스
```bash
# 테이블 목록 확인
mcp__supabase__list_tables
```

### Vercel - 배포 관리
```bash
# 팀 정보 확인
mcp__vercel__list_teams
```

## ⚡ 자동화 도구

| 스크립트 | 기능 | 실행 시간 |
|----------|------|----------|
| `setup-mcp-env.sh` | 토큰 관리 자동화 | 2-3분 |
| `mcp-health-check.sh` | 상태 모니터링 | 30초 |
| `mcp-complete-recovery.sh` | 완전 복구 | 5-10분 |

## 🎯 권장 설정 방식

**Claude Code v1.0.119 이후 권장: CLI-only 방식**

```bash
# 기본 서버 추가
claude mcp add SERVER_NAME -s local -- COMMAND

# 환경변수 포함 서버 추가
claude mcp add SERVER_NAME -s local -e VAR=value -- COMMAND
```

## 🛡️ 보안 관리

- 모든 API 키는 `.env.local`에서 관리
- 파일 권한: `chmod 600 .env.local`
- 정기적 보안 검사: `./scripts/setup-mcp-env.sh --security-check`

## 📚 추가 가이드

- **[설정 가이드](setup-guide.md)** - CLI 설정 및 환경변수 관리
- **[트러블슈팅](setup-guide.md#5%EF%B8%8F%E2%83%A3-mcp-%ED%8A%B8%EB%9F%AC%EB%B8%94%EC%8A%88%ED%8C%85-%EA%B0%80%EC%9D%B4%EB%93%9C)** - 문제 해결 가이드
- **[서버 레퍼런스](servers.md)** - 각 서버별 상세 기능

---

**📋 마지막 업데이트**: 2025-09-21 | **연결 성공률**: 100% (9/9)