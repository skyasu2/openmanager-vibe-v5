# 🏗️ Local Full Stack Setup Guide

이 가이드는 로컬 Docker 환경을 사용하여 전체 인프라를 실행하는 방법을 설명합니다. 현재 프로젝트의 Docker 환경은 다음 두 가지 주요 목적을 위해 설계되었습니다:

1.  **GCP Cloud Run 배포 시뮬레이션**: Python 기반의 Cloud Functions(Unified AI Processor 등)를 실제 GCP 환경과 동일하게 로컬에서 실행하고 테스트합니다.
2.  **클라우드 서비스 로컬 에뮬레이션**: Supabase(Postgres, Auth, Realtime 등)와 같은 관리형 클라우드 서비스를 로컬 Docker 컨테이너로 대체하여 개발 및 테스트 비용을 절감합니다.

## 🎯 Architecture

| Service | Cloud | Local Replacement | Port | Purpose |
|---------|-------|-------------------|------|---------|
| **Database** | Supabase (Cloud) | **Supabase** (Local Docker) | `54322`, `54321` | 클라우드 DB 등 전체 환경 에뮬레이션 |
| **AI Processing** | Google Cloud Run | **Unified AI Processor** | `8082` | Cloud Run 배포 전 로컬 시뮬레이션 |
| **GCP Functions** | Google Cloud Run | **Enhanced Korean NLP** | `8081` | NLP/ML 엔진 로컬 테스트 |
| **AI Intelligence** | Gemini API | **Mock AI** | `8083` | LLM API 비용 절감 및 시뮬레이션 |

---

## 🚀 1. Database Setup (Supabase)

### Start Local Supabase
This starts Postgres, Auth, Realtime, and Studio dashboard locally.

```bash
# Start local Supabase (Docker required)
npx supabase start -y
```

- **Dashboard**: `http://localhost:54323`
- **API URL**: `http://localhost:54321`
- **DB URL**: `postgresql://postgres:postgres@localhost:54322/postgres`

---

## 🤖 2. AI Services Setup

### Start Local AI Container (Mock Mode)
Use the `mock-ai` service for fast, free testing without needing an LLM key.

```bash
# 1. Update scripts/dev/run-docker-functions.sh first (if needed for new service)
# OR directly use docker-compose:
cd gcp-functions
docker-compose -f docker-compose.dev.yml up mock-ai
```

### Enable Mock Mode in App
Update `.env.local` to point to the Mock AI service instead of the real AI Processor (or configure Processor to use Mock).

**Scenario A: Direct Mock (Bypass Processor)**
```env
# .env.local
# ⚠️ Note: mock-ai requires /process path (unlike unified-processor which accepts both / and /process)
NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT="http://localhost:8083/process"
```

> 💡 **Endpoint 차이점**:
> - `unified-ai-processor` (8082): `http://localhost:8082` (Base URL 권장)
> - `mock-ai` (8083): `http://localhost:8083/process` (`/process` 필수)

**Scenario B: Processor -> Mock (Advanced)**
If you want to test the Processor logic but mock the LLM, you would need to configure the Unified Processor to call the Mock AI. (Currently configured for Scenario A).

---

## 🧹 Cleanup

```bash
# Stop AI Services
cd gcp-functions && docker-compose -f docker-compose.dev.yml down

# Stop Supabase
npx supabase stop
```
