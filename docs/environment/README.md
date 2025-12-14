---
category: environment
purpose: local_development_environment_setup
ai_optimized: true
query_triggers:
  - '개발 환경 설정'
  - 'WSL 설정'
  - 'AI 도구 설정'
  - 'Cloud Run 설정'
related_docs:
  - 'docs/development/README.md'
  - 'docs/environment/wsl/wsl-optimization.md'
last_updated: '2025-12-14'
---

# 💻 Environment 문서 (개발 환경)

**로컬에서 개발하기 위한 환경 설정 및 도구 문서**

## 🎯 목적

이 디렉터리는 **개발자가 로컬에서 개발하기 위한 모든 설정**에 관한 문서를 포함합니다.

## 🏗️ 현재 아키텍처 (v5.80.0)

| 서비스 | 배포 환경 / 호스팅 | 역할 설명 |
|--------|-------------------|-----------|
| **Next.js App** | Vercel (Serverless) | 프론트엔드 + API Routes 제공 |
| **AI Backend** | Google Cloud Run (Container / Serverless) | LangGraph 기반 멀티 에이전트 백엔드 |
| **Supabase DB** | Supabase Cloud (Managed PostgreSQL + Auth) | PostgreSQL 데이터베이스 + 인증(Auth) 제공 |

### AI Services (Cloud Run)

```
cloud-run/ai-backend/
├── LangGraph Multi-Agent System
│   ├── Supervisor (Groq Llama-8b)
│   ├── NLQ Agent (Gemini Flash)
│   ├── Analyst Agent (Gemini Pro)
│   └── Reporter Agent (Llama 70b)
└── Hono Server (Port 8080)
```

### Database (Cloud Supabase)

- **Dashboard**: https://supabase.com/dashboard/project/vnswjnltnhpsueosfhmw
- **API URL**: https://vnswjnltnhpsueosfhmw.supabase.co

## 🛠️ 로컬 개발 설정

### 1. 환경 변수 설정

```bash
cp .env.local.template .env.local
# Cloud Supabase 키 설정
```

### 2. 개발 서버 실행

```bash
npm run dev:stable
```

### 3. Supabase 마이그레이션 (선택)

```bash
# Cloud Supabase에 마이그레이션 적용
npx supabase db push
```

## 💻 WSL 사용자 주의사항

1. **Node.js**: v22.21.1 (nvm 사용 권장)
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
