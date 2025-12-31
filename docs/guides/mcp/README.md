# MCP Guide

> **최종 갱신**: 2025-12-31
> **문서 수**: 2개 (7개에서 통합)

---

## Quick Start

```bash
claude mcp list              # 서버 상태 확인
source .env.local            # 환경변수 로드
./scripts/mcp-health-check.sh # 종합 헬스체크
```

---

## 현재 상태 (2025-12-31)

| MCP 서버            | 연결 | 기능 테스트  | 주요 기능                  | 한도           |
| ------------------- | ---- | ------------ | -------------------------- | -------------- |
| **🎉 serena**       | ✅   | ✅ 완전 작동 | 코드 검색, 심볼 분석, 메모리 | 무제한         |
| **🎉 context7**     | ✅   | ✅ 완전 작동 | 라이브러리 공식 문서 검색  | 무제한         |
| **🎉 vercel**       | ✅   | ✅ 완전 작동 | 배포 관리, 환경변수        | 무제한         |
| **🎉 supabase**     | ✅   | ✅ 완전 작동 | PostgreSQL DB, RLS 관리    | 무제한         |
| **🎉 playwright**   | ✅   | ✅ 완전 작동 | WSL+윈도우 크롬 E2E 테스트 | 무제한         |
| **🎉 figma**        | ✅   | ✅ 완전 작동 | Design-to-Code 워크플로우  | **6회/월**     |
| **🎉 github**       | ✅   | ✅ 완전 작동 | 저장소, PR, Issues 관리    | 무제한         |
| **🎉 tavily**       | ✅   | ✅ 완전 작동 | 웹 검색 (심층 리서치)      | 1,000/월       |
| **🎉 brave-search** | ✅   | ✅ 완전 작동 | 웹 검색 (빠른 팩트체크)    | 2,000/월       |

**9개 서버 연결** | **CLI-only 방식** | **100% 완전 작동**

### 제거된 MCP 서버 (2025-12-11)

| 제거된 서버           | 제거 이유                          | 대안                              |
| --------------------- | ---------------------------------- | --------------------------------- |
| filesystem            | Claude Code 내장 도구와 100% 중복  | Read, Write, Glob                 |
| memory                | Serena memory로 대체               | `serena__write_memory/read_memory`|
| time                  | 사용 빈도 낮음                     | Bash `date` 명령                  |
| shadcn-ui             | Context7로 문서 조회 가능          | `context7__get_library_docs`      |
| sequential-thinking   | Claude 자체 추론으로 충분          | TodoWrite + 직접 분석             |

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

| 스크립트                   | 기능             | 실행 시간 |
| -------------------------- | ---------------- | --------- |
| `setup-mcp-env.sh`         | 토큰 관리 자동화 | 2-3분     |
| `mcp-health-check.sh`      | 상태 모니터링    | 30초      |
| `mcp-complete-recovery.sh` | 완전 복구        | 5-10분    |

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

## Document Index

| 문서 | 설명 |
|------|------|
| **[setup-guide.md](./setup-guide.md)** | CLI 설정, 환경변수, 트러블슈팅, 복구 |

---

## Archived Documents

통합된 문서들은 `docs/archive/mcp/`로 이동:

- `servers.md` → README로 통합
- `tools.md` → 아카이브 (상세 레퍼런스)
- `mcp-configuration.md` → setup-guide로 통합
- `advanced.md` → setup-guide로 통합
- `serena-tools-comprehensive-guide.md` → 아카이브

---

## Related

- [AI Tools Rules](../../../.claude/rules/ai-tools.md) - MCP 우선순위
- [SSOT](../../../config/ai/registry-core.yaml) - MCP 설정 SSOT

---

**연결 성공률**: 100% (9/9)
