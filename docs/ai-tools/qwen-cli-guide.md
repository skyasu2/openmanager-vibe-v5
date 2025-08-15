# QWEN.md - OpenManager VIBE v5 프로젝트 설명서

> **⚠️ 중요 - 중국어 사용 절대 금지**:
>
> - 이 파일은 Qwen Code 모델을 위한 지시사항과 프로젝트 컨텍스트를 제공합니다
> - 모든 대화와 코드 작성은 **한국어 또는 영어**로만 진행됩니다
> - **중국어(한자/간체자) 사용 절대 금지** - 코드, 주석, 문서, 변수명, 메시지 등 모든 곳에서 금지
> - Qwen이 중국어를 생성하면 즉시 영어/한국어로 변환 필수

## 🎯 프로젝트 개요

**OpenManager VIBE v5**는 AI 기반 실시간 서버 모니터링 플랫폼으로, TypeScript, Next.js 14.2.4, React 18.2.0, Supabase, GCP Functions를 사용하여 구축된 포트폴리오 프로젝트입니다.

### 🏗️ 주요 기술 스택

- **Frontend**: Next.js 15, App Router, React 18.3.1, TypeScript, Tailwind CSS
- **Backend**: Edge Runtime, GCP Functions (Python 3.11), Supabase
- **Database**: PostgreSQL (Supabase) + pgVector, Memory-based Cache
- **AI/ML**: Google AI Studio (Gemini 2.0), Supabase RAG, Korean NLP
- **DevOps**: Vercel, GitHub Actions, GCP

### 🚀 핵심 기능

1. **실시간 서버 모니터링**: CPU, Memory, Disk, Network 메트릭을 15초 간격으로 업데이트
2. **AI 기반 분석**: 이상 징후 자동 감지, 성능 예측 및 추천
3. **엔터프라이즈 보안**: Supabase Auth (GitHub OAuth), Row Level Security
4. **무료 티어 최적화**: Vercel, GCP, Supabase 무료 플랜만으로 완전한 시스템 구현

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── src/              # 소스 코드
│   ├── app/          # Next.js App Router (페이지 및 API 라우트)
│   ├── components/   # React 컴포넌트
│   ├── services/     # 비즈니스 로직 및 서비스
│   ├── lib/          # 유틸리티 및 라이브러리
│   ├── stores/       # Zustand 상태 관리
│   ├── hooks/        # 커스텀 React 훅
│   ├── types/        # TypeScript 타입 정의
│   └── utils/        # 유틸리티 함수
├── public/           # 정적 파일
├── docs/             # 문서
├── scripts/          # 자동화 스크립트
├── gcp-functions/    # GCP Functions (Python)
├── supabase/         # Supabase 관련 파일
├── tests/            # 테스트 코드
└── package.json      # 프로젝트 의존성 및 스크립트
```

## 🧠 핵심 아키텍처

### 1. 모니터링 시스템

**UnifiedMetricsManager**가 핵심 모니터링 엔진으로, 서버 메트릭을 생성하고 관리합니다:

- **모듈화 아키텍처**: 7개의 전문화된 모듈로 구성
  - ServerFactory: 서버 생성 및 초기화
  - AIAnalyzer: AI 기반 분석
  - Autoscaler: 자동 스케일링
  - Scheduler: 타이머 및 스케줄링
  - MetricsUpdater: 메트릭 업데이트
  - PerformanceMonitor: 성능 모니터링

- **실시간 데이터 생성**: 15초 간격으로 서버 메트릭 생성
- **장애 시나리오**: 24시간 내내 번갈아가며 장애 발생 (최소 1개 심각, 2-3개 경고 유지)

### 2. 데이터 저장소

**Supabase PostgreSQL**에 24시간 고정 서버 상태 데이터 저장:

- **hourly_server_states 테이블**: 24시간 × 15서버 = 360개 레코드
- **시간 기반 조회**: 현재 시간에 해당하는 데이터만 조회
- **캐싱 시스템**: Memory-based 캐시로 네트워크 지연 제거

### 3. API 구조

```
/api/
├── servers/          # 서버 메트릭 API
│   ├── all/          # 모든 서버 데이터
│   └── [id]/         # 개별 서버 데이터
├── metrics/          # 메트릭 관련 API
├── ai/               # AI 분석 API
└── system/           # 시스템 관리 API
```

## 🚀 개발 및 실행

### 필수 조건

- Node.js v22.15.1 이상
- npm 10.x 이상
- Git

### 빠른 시작

```bash
# 저장소 클론
git clone <repository-url>
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 설정
cp env.local.template .env.local
# .env.local 파일을 열어 필요한 환경 변수 설정

# 개발 서버 실행
npm run dev
# http://localhost:3000 에서 확인
```

### 주요 개발 스크립트

```bash
npm run dev              # 개발 서버 실행
npm run build            # 프로덕션 빌드
npm run lint             # 코드 린트
npm run type-check       # TypeScript 타입 검사
npm test                 # 테스트 실행
```

## 🔧 핵심 서비스 및 컴포넌트

### 1. UnifiedMetricsManager (`src/services/UnifiedMetricsManager.ts`)

모니터링 시스템의 중심이 되는 클래스로, 다음 기능을 제공합니다:

- 서버 메트릭 생성 및 업데이트
- AI 분석 수행
- 자동 스케일링
- 성능 모니터링

### 2. 서버 대시보드 (`src/app/dashboard/`)

실시간 서버 모니터링을 위한 대시보드 페이지:

- 서버 상태 실시간 표시
- 메트릭 그래프 및 차트
- 알림 및 경고 시스템
- AI 어시스턴트 통합

### 3. API 엔드포인트 (`src/app/api/servers/all/route.ts`)

서버 메트릭을 제공하는 API:

- Supabase에서 시간 기반 데이터 조회
- 캐싱을 통한 성능 최적화
- 페이지네이션 및 필터링 지원

## 💾 데이터베이스 구조

### hourly_server_states 테이블

```sql
CREATE TABLE hourly_server_states (
  server_id TEXT,
  server_name TEXT,
  hostname TEXT,
  server_type TEXT,
  hour_of_day INTEGER,
  status TEXT,
  cpu_usage NUMERIC,
  memory_usage NUMERIC,
  disk_usage NUMERIC,
  network_usage NUMERIC,
  location TEXT,
  environment TEXT,
  uptime INTEGER,
  incident_type TEXT,
  incident_severity TEXT,
  affected_dependencies TEXT[]
);
```

## 🤖 AI 시스템

### 통합 AI 엔진

- **Google AI Studio (Gemini 2.0)**: 자연어 처리 및 분석
- **Supabase RAG**: 데이터 기반 검색 및 추천
- **Korean NLP**: 한국어 자연어 처리
- **AI 어시스턴트**: 대시보드 내부에 통합된 AI 챗봇

### AI 분석 기능

- 서버 상태 이상 징후 감지
- 성능 예측 및 최적화 추천
- 자연어 질의 처리
- 장애 원인 분석 및 해결 제안

## 🔒 보안 및 인증

### 인증 시스템

- **Supabase Auth**: GitHub OAuth 기반 인증
- **세션 관리**: JWT + Refresh Token
- **접근 제어**: Row Level Security (RLS)

### 보안 정책

- 모든 API 엔드포인트에 인증 요구
- 민감한 환경 변수는 서버 전용으로 관리
- HTTPS 통신 강제
- 입력 데이터 검증 및 sanitization

## 📊 성능 최적화

### 캐싱 전략

- **Memory-based 캐시**: 메모리 기반 캐싱으로 네트워크 지연 제거
- **TTL 관리**: 5분 간격 자동 만료 및 정리
- **LRU 알고리즘**: 1000개 아이템 제한, 자동 정리

### 서버리스 최적화

- **Vercel Edge Runtime**: 글로벌 CDN으로 빠른 응답
- **GCP Functions**: 서버리스 백엔드로 비용 최적화
- **Supabase**: 무료 티어 활용

## 🛠️ 개발 환경 설정

### 환경 변수

필수 환경 변수:

```bash
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google AI (선택)
GOOGLE_AI_API_KEY=your_google_ai_api_key

# GitHub OAuth (선택)
GITHUB_ID=your_github_oauth_id
GITHUB_SECRET=your_github_oauth_secret
```

### 개발 도구

- **ESLint**: 코드 품질 관리
- **Prettier**: 코드 포맷팅
- **TypeScript**: 타입 안전성
- **Vitest**: 유닛 테스트
- **Playwright**: E2E 테스트

## 📚 문서

상세한 기술 문서는 `docs/` 디렉토리에 위치:

- 시스템 아키텍처
- AI 시스템 완전 가이드
- GCP Functions 완전 가이드
- 개발 가이드
- 보안 완전 가이드
- 배포 완전 가이드

## ⚠️ 주의사항

1. **타입 안전성**: TypeScript strict mode를 사용하여 런타임 에러 최소화
2. **무료 티어 제한**: Vercel, GCP, Supabase 무료 플랜의 사용량 한계 고려
3. **보안**: 하드코딩된 시크릿 절대 금지, 환경변수 사용 필수
4. **테스트**: 코드 변경 시 관련 테스트 실행 필수

## 🤝 협업 지침

1. **Git 워크플로우**: feature 브랜치 → PR → 코드 리뷰 → merge
2. **커밋 메시지**: 명확하고 구체적으로 작성
3. **코드 리뷰**: SOLID 원칙, 타입 안전성, 성능 고려
4. **문서화**: 코드 변경 시 관련 문서도 업데이트

## ⛔ 절대 금지 사항

### 중국어 사용 완전 금지

- **모든 코드**: 변수명, 함수명, 클래스명 등 영어만 사용
- **모든 주석**: 영어 또는 한국어만 허용, 중국어 절대 불가
- **모든 문서**: README, 가이드, 리포트 등 중국어 사용 금지
- **커밋 메시지**: 영어 또는 한국어만, 중국어 금지
- **에러 메시지**: 중국어 출력 시 즉시 영어/한국어 변환
- **자동 검사**: 중국어 문자 감지 시 빌드 실패 처리
