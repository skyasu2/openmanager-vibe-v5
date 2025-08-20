# 🔐 MCP 환경변수 보안 가이드

> **최종 업데이트**: 2025-08-20  
> **보안 수준**: 높음  
> **적용 프로젝트**: OpenManager VIBE v5

## 📋 목차

1. [개요](#개요)
2. [환경변수 분리 전략](#환경변수-분리-전략)
3. [MCP 서버별 환경변수](#mcp-서버별-환경변수)
4. [보안 설정](#보안-설정)
5. [테스트 및 검증](#테스트-및-검증)

---

## 🎯 개요

MCP 서버의 토큰과 API 키를 안전하게 관리하기 위한 환경변수 보안 가이드입니다.

### ⚠️ 핵심 원칙

1. **절대 평문 저장 금지**: 토큰/키를 `.mcp.json`에 직접 저장하지 않음
2. **환경변수 참조**: 모든 민감한 정보는 `.env.local`에서 관리
3. **Git 제외**: `.env.local`은 반드시 `.gitignore`에 포함
4. **최소 권한**: 각 토큰은 필요한 최소 권한만 부여

---

## 🔧 환경변수 분리 전략

### 1. 파일 구조

```
openmanager-vibe-v5/
├── .env.local          # 실제 토큰/키 저장 (Git 제외)
├── .env.example        # 템플릿 파일 (Git 포함)
├── .mcp.json          # 환경변수 참조만 포함
└── .gitignore         # .env.local 제외 확인
```

### 2. .mcp.json 환경변수 참조

```json
{
  "mcpServers": {
    "github": {
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      }
    },
    "supabase": {
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    },
    "tavily": {
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      }
    },
    "context7": {
      "env": {
        "UPSTASH_REDIS_REST_URL": "${UPSTASH_REDIS_REST_URL}",
        "UPSTASH_REDIS_REST_TOKEN": "${UPSTASH_REDIS_REST_TOKEN}"
      }
    }
  }
}
```

---

## 🔑 MCP 서버별 환경변수

### 1. GitHub MCP

```bash
# .env.local
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx

# 필요 권한: repo, workflow, write:packages
# 생성: https://github.com/settings/tokens/new
```

### 2. Supabase MCP

```bash
# .env.local
SUPABASE_PROJECT_ID=vnswjnltnhpsueosfhmw
SUPABASE_ACCESS_TOKEN=sbp_xxxxxxxxxxxxxxxxxxxxx

# 생성: https://supabase.com/dashboard/account/tokens
```

### 3. Tavily MCP

```bash
# .env.local
TAVILY_API_KEY=tvly-xxxxxxxxxxxxxxxxxxxxx

# 무료 티어: 1,000 calls/month
# 생성: https://tavily.com/
```

### 4. Context7 (Upstash Redis) MCP

```bash
# .env.local
UPSTASH_REDIS_REST_URL=https://xxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxxxxxxxxxxx

# 무료 티어: 10MB
# 생성: https://console.upstash.com/redis
```

### 5. GCP MCP

```bash
# .env.local
GCP_PROJECT_ID=openmanager-free-tier
GOOGLE_CLOUD_PROJECT=openmanager-free-tier

# 인증 파일: ~/.config/gcloud/application_default_credentials.json
# 설정: gcloud auth application-default login
```

---

## 🛡️ 보안 설정

### 1. .gitignore 확인

```bash
# .gitignore에 포함되어야 할 항목들
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

### 2. 환경변수 로드 확인

```bash
# 테스트 스크립트 실행
./scripts/test-mcp-servers.sh

# 환경변수 확인 (값의 일부만 표시)
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sed 's/=.*/=***REDACTED***/'
```

### 3. 토큰 로테이션

- **GitHub**: 90일마다 토큰 갱신 권장
- **Supabase**: 프로젝트별 고유 토큰 사용
- **Tavily**: API 사용량 모니터링
- **Upstash**: 월간 사용량 확인

---

## 🧪 테스트 및 검증

### 1. MCP 서버 개별 테스트

```bash
# 스크립트 실행
./scripts/test-mcp-servers.sh

# 예상 결과 (2025-08-20)
# ✅ 성공: 7개 서버
# - github, supabase, tavily, context7, time, serena, shadcn
# ❌ 실패: 4개 서버  
# - filesystem, memory, playwright, thinking (설정 필요)
```

### 2. Claude Code 재시작

```bash
# Claude Code 재시작하여 환경변수 적용
claude api restart

# MCP 서버 상태 확인
claude mcp list
```

### 3. 연결 상태 확인

```bash
# Claude Code 내에서
/mcp

# 각 서버별 Connected 상태 확인
```

---

## 🔄 마이그레이션 체크리스트

- [x] `.env.local` 파일 생성 및 토큰 이동
- [x] `.mcp.json`에서 평문 제거 및 환경변수 참조로 변경
- [x] `.gitignore`에 `.env.local` 포함 확인
- [x] 각 MCP 서버 개별 테스트
- [x] Claude Code 재시작 및 연결 확인
- [ ] 팀원들에게 환경변수 설정 방법 공유

---

## 📚 참고 문서

- [MCP 완전 설치 가이드](../mcp/mcp-complete-installation-guide-2025.md)
- [환경변수 보안 가이드](./env-security-guide.md)
- [Claude Code MCP 공식 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)

---

## 🚨 보안 경고

**절대 하지 말아야 할 것들:**

1. ❌ 토큰을 코드에 직접 하드코딩
2. ❌ `.env.local` 파일을 Git에 커밋
3. ❌ 토큰을 로그에 출력
4. ❌ 프로덕션 토큰을 로컬에서 사용
5. ❌ 만료된 토큰 방치

**항상 해야 할 것들:**

1. ✅ 환경변수 참조 방식 사용
2. ✅ 정기적인 토큰 로테이션
3. ✅ 최소 권한 원칙 적용
4. ✅ 사용량 모니터링
5. ✅ 보안 감사 로그 확인