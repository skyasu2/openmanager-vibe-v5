# 🐳 Docker Local Testing Guide

클라우드(GCP) 환경을 로컬 Docker 컨테이너로 대체하여 테스트하는 방법입니다.

## 🚀 Quick Start

### 1. Docker 실행
Docker Desktop이 실행 중인지 확인하세요.

### 2. AI Processor 실행 (로컬)
프로젝트 루트에서 다음 명령어를 실행합니다:

```bash
npm run dev:docker:ai
```

이 명령어는 다음 서비스들을 로컬 컨테이너로 띄웁니다:
- **Unified AI Processor**: `http://localhost:8082`
- **Machine Learning Engine**: `http://localhost:8080` (내부 통신용)

### 3. 환경 변수 연결
Next.js 앱이 로컬 Docker 서비스를 바라보도록 `.env.local`을 수정하세요:

```bash
# .env.local

# 클라우드 엔드포인트 (기존)
# NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT="https://...cloudfunctions.net/unified-ai-processor"

# 로컬 Docker 엔드포인트 (변경)
NEXT_PUBLIC_GCP_UNIFIED_PROCESSOR_ENDPOINT="http://localhost:8082/process"
```

---

## 🛠️ 상세 명령어

### 서비스 시작/중지
```bash
# 시작
bash scripts/dev/run-docker-functions.sh up

# 강제 재빌드 및 시작
bash scripts/dev/run-docker-functions.sh build

# 중지
bash scripts/dev/run-docker-functions.sh down
```

### 로그 확인
```bash
bash scripts/dev/run-docker-functions.sh logs
```

---

## ❓ FAQ

**Q: Supabase 데이터베이스는 어떻게 하나요?**
A: 기본적으로 로컬 AI Processor도 클라우드 Supabase에 연결됩니다. 완전한 로컬 격리가 필요하다면 `supabase start`를 사용하여 로컬 DB를 띄우고 Docker 컨테이너의 환경 변수를 수정해야 합니다. (현재 권장: Hybrid 방식 - 로컬 컴퓨팅 + 클라우드 데이터)

**Q: 포트 충돌이 발생합니다.**
A: 8080, 8081, 8082 포트가 사용 중인지 확인하세요. 충돌 시 `docker-compose.dev.yml`에서 포트 매핑을 수정하세요.
