# 🏗️ Local Full Stack Setup Guide

This guide describes how to run the **entire infrastructure** locally using Docker, replacing Cloud services (GCP, Supabase) with local containers.

## 🎯 Architecture

| Service | Cloud | Local Replacement | Port |
|---------|-------|-------------------|------|
| **Database** | Supabase (Cloud) | **Supabase CLI** (Docker) | `54322`, `54321` |
| **AI Processing** | Google Cloud Run | **Unified AI Processor** (Local Docker) | `8082` |
| **AI Intelligence** | Gemini API | **Mock AI** (Local Docker) | `8083` |

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
