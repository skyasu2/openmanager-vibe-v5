---
category: environment
purpose: local_development_environment_setup
ai_optimized: true
query_triggers:
  - '개발 환경 설정'
  - 'WSL 설정'
  - 'AI 도구 설정'
  - 'Docker 설정'
related_docs:
  - 'docs/development/README.md'
  - 'docs/environment/wsl/wsl-optimization.md'
last_updated: '2025-12-12'
---

# 💻 Environment 문서 (개발 환경)

**로컬에서 개발하기 위한 환경 설정 및 도구 문서**

## 🎯 목적

이 디렉터리는 **개발자가 로컬에서 개발하기 위한 모든 설정**에 관한 문서를 포함합니다.

## 🐳 Docker Ecosystem

로컬 환경은 **AI Services** (Custom)와 **Supabase Services** (Managed) 두 그룹으로 구성됩니다.

### AI Services (Custom Managed)

| 서비스명 | 컨테이너 이름 | 포트 | 역할 |
|---------|--------------|------|------|
| **unified-ai-processor** | `unified-ai-processor` | `8082` | AI 오케스트레이터 (메인) |
| **mock-ai** | `mock-ai` | `8083` | 가짜 AI (테스트용) |

```bash
# AI 서비스 실행
npm run dev:docker:ai
```

### Supabase Services (Supabase CLI Managed)

| 서비스명 | 외부 포트 | 역할 |
|---------|----------|------|
| **supabase-db** | `54322` | PostgreSQL 데이터베이스 |
| **supabase-rest** | `54321` | PostgREST API |
| **supabase-studio** | `54323` | 관리 대시보드 |

```bash
# Supabase 실행
npx supabase start
```

## 🏗️ Local Full Stack Setup

### 1. Database Setup
```bash
npx supabase start -y
```
- **Dashboard**: `http://localhost:54323`
- **API URL**: `http://localhost:54321`

### 2. AI Services Setup
```bash
cd gcp-functions
docker-compose -f docker-compose.dev.yml up mock-ai
```

### 3. Environment Configuration
```env
# .env.local
NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT="http://localhost:8083/process"
```

## 💻 WSL 사용자 주의사항

1. **Docker Desktop 설정**: WSL Integration 활성화 필수
2. **파일 권한**: WSL 리눅스 파일 시스템 사용 권장
3. **Localhost 접근**: WSL2에서 `localhost` 공유됨

## 📂 디렉터리 구조

```
environment/
├── wsl/                   # WSL 설정
├── tools/                 # 개발 도구 (Claude Code)
├── troubleshooting/       # 문제 해결
└── README.md              # 이 파일
```

## 📚 주요 문서

### WSL 환경 (wsl/)
- **[WSL Optimization](./wsl/wsl-optimization.md)**: WSL 최적화 가이드
- **[WSL Monitoring](./wsl/wsl-monitoring-guide.md)**: WSL 모니터링

### 개발 도구 (tools/)
- **[Claude Code](./tools/claude-code/claude-code-hooks-guide.md)**: Claude Code 가이드

### 문제 해결 (troubleshooting/)
- **[Common Issues](./troubleshooting/common.md)**: 일반적인 문제들
- **[Build Issues](./troubleshooting/build.md)**: 빌드 관련 문제

## 🧹 정리

```bash
# AI 서비스 중지
cd gcp-functions && docker-compose -f docker-compose.dev.yml down

# Supabase 중지
npx supabase stop
```
