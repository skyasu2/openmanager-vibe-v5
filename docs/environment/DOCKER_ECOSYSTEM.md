# 🐳 OpenManager V5 Docker Ecosystem

이 문서는 OpenManager V5의 로컬 개발 환경을 구성하는 모든 Docker 컨테이너와 그 역할을 정의합니다.

## 🏗️ 아키텍처 개요

로컬 환경은 크게 **AI Services** (Custom)와 **Supabase Services** (Managed) 두 그룹으로 나뉩니다.
모든 서비스는 WSL2 환경에서 실행되는 것을 권장합니다.

---

## 🧠 1. AI Services (Custom Managed)

우리가 직접 `docker-compose.dev.yml`로 관리하는 컨테이너들입니다.

| 서비스명 (Service) | 컨테이너 이름 | 포트 | 역할 및 설명 |
|-------------------|--------------|------|-------------|
| **unified-ai-processor** | `unified-ai-processor` | `8082` | **AI 오케스트레이터 (메인)**<br>- Next.js 앱의 AI 요청을 받아 처리<br>- NLP, Rule Engine, LLM 호출 등을 조율<br>- ⚠️ `http://localhost:8082` (Base URL 권장) |
| **mock-ai** | `mock-ai` | `8083` | **가짜 AI (Mock)**<br>- 비용 없는 빠른 테스트용<br>- 실제 LLM 대신 사전에 정의된 응답 반환<br>- ⚠️ `http://localhost:8083/process` (`/process` 필수) |

### 🚀 실행 방법 (WSL 권장)
```bash
# 전체 실행
npm run dev:docker:ai
# 또는
bash scripts/dev/run-docker-functions.sh
```

### ☁️ Dev/Prod Parity (개발/운영 일치)
`unified-ai-processor`는 **Google Cloud Run** 배포에 사용되는 `Dockerfile`을 그대로 로컬에서 사용합니다.
- **Local**: `docker-compose`가 오케스트레이션 담당.
- **Cloud**: Google Cloud Run이 오케스트레이션 담당.
-> 이를 통해 **"로컬에서 되면 클라우드에서도 된다"**를 보장합니다.

---

## ⚡ 2. Supabase Services (Supabase CLI Managed)

`npx supabase start` 명령어로 실행되는 컨테이너 그룹입니다. 클라우드 Supabase 환경을 로컬에 완벽하게 복제합니다.

| 서비스명 | 내부 포트 | 외부 포트 | 역할 및 설명 |
|---------|----------|----------|-------------|
| **supabase-db** | `5432` | `54322` | **PostgreSQL 데이터베이스**<br>- 메인 데이터 저장소 |
| **supabase-auth** | `9999` | - | **GoTrue (인증 서버)**<br>- 로그인, 회원가입, 세션 관리 |
| **supabase-rest** | `3000` | `54321` | **PostgREST (API)**<br>- DB를 REST API로 자동 변환 |
| **supabase-realtime** | `4000` | - | **Realtime**<br>- DB 변경사항을 웹소켓으로 실시간 전송 |
| **supabase-storage** | `5000` | - | **Storage API**<br>- 파일 업로드/다운로드 관리 |
| **supabase-studio** | `3000` | `54323` | **Studio (대시보드)**<br>- DB 관리 웹 UI (테이블 조회, 쿼리 실행) |
| **supabase-kong** | `8000` | `54321` | **Kong (API Gateway)**<br>- 모든 요청의 진입점 (포트 54321로 통합) |

### 🚀 실행 방법 (WSL 권장)
```bash
# 전체 실행
npx supabase start
# 중지
npx supabase stop
```

---

## 📡 3. 네트워크 통신 흐름

1.  **Next.js (Host/WSL)** -> 요청 -> **Kong (54321)** -> **Supabase Services**
2.  **Next.js (Host/WSL)** -> 요청 -> **Unified Processor (8082)** 또는 **Mock AI (8083)**

## 💻 WSL 사용자 주의사항

1.  **Docker Desktop 설정**:
    *   Settings -> Resources -> WSL Integration -> 사용 중인 배포판(Ubuntu 등) 체크 필수.
2.  **파일 권한**:
    *   Windows 파일 시스템(`/mnt/c/...`)보다 WSL 리눅스 파일 시스템(`~/...`)에서 프로젝트를 실행하는 것이 성능상 훨씬 유리합니다.
3.  **Localhost 접근**:
    *   WSL2에서는 `localhost`가 윈도우와 공유되므로, 브라우저에서 `localhost:54323` 등으로 바로 접속 가능합니다.
