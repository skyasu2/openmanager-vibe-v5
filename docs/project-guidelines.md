# OpenManager Vibe V5 - 프로젝트 종합 지침서

## 📋 프로젝트 개요

OpenManager Vibe V5는 AI 기반 서버 모니터링 및 분석 플랫폼으로, 자연어 처리를 통한 직관적인 서버 관리 시스템입니다.

### 🎯 핵심 목표
- **자연어 기반 서버 분석**: 관리자가 일상 언어로 서버 상태를 질문하고 자동 분석 결과를 받음
- **실시간 모니터링**: 서버 성능 지표의 실시간 추적 및 시각화
- **예측적 알림**: AI 기반 장애 예측 및 사전 알림 시스템
- **자동화된 보고서**: 문제 원인 분석 및 해결책 제안

## 🏗️ 시스템 아키텍처

### 프로덕션 스택
- **프레임워크**: Next.js 14 (App Router) + TypeScript
- **배포**: Vercel (자동 배포 파이프라인)
- **캐시**: Upstash Redis (Free tier - 10K requests/day)
- **데이터베이스**: Supabase (Free tier - 500MB)
- **스타일링**: Tailwind CSS + shadcn/ui
- **상태 관리**: Zustand

### MCP (Model Context Protocol) 기반 아키텍처
```
프론트엔드 (Next.js)
    ↓ API 호출
MCP Lite 서버 (Node.js/Express)
    ↓ 문서 기반 매칭
Context Documents (.txt/.md)
    ↓ 응답 생성
자연어 응답 → 사용자
```

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── .env.local.example          # 환경변수 템플릿
├── .env.local                  # 로컬 환경변수
├── next.config.js              # Next.js 설정
├── tailwind.config.js          # Tailwind 설정
├── package.json                # 의존성 및 스크립트
├── vercel.json                 # Vercel 배포 설정
│
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # 루트 레이아웃
│   │   ├── page.tsx            # 랜딩 페이지
│   │   ├── dashboard/          # 메인 대시보드
│   │   ├── chat/               # MCP 채팅 인터페이스
│   │   ├── reports/            # 보고서 뷰어
│   │   └── api/                # API 라우트 (Vercel Functions)
│   │       ├── health/         # 헬스체크
│   │       ├── mcp/            # MCP 쿼리 처리
│   │       ├── monitoring/     # 모니터링 API
│   │       └── reports/        # 보고서 생성
│   │
│   ├── components/             # React 컴포넌트
│   │   ├── ui/                 # shadcn/ui 컴포넌트
│   │   ├── dashboard/          # 대시보드 컴포넌트
│   │   ├── chat/              # 채팅 인터페이스
│   │   ├── monitoring/         # 모니터링 컴포넌트
│   │   └── shared/            # 공유 컴포넌트
│   │
│   ├── lib/                    # 유틸리티 및 설정
│   │   ├── redis.ts           # Upstash Redis 클라이언트
│   │   ├── supabase.ts        # Supabase 클라이언트
│   │   ├── utils.ts           # 공통 유틸리티
│   │   └── types.ts           # TypeScript 타입
│   │
│   ├── modules/                # 비즈니스 로직 모듈
│   │   ├── mcp/               # MCP 엔진
│   │   │   ├── core/          # 핵심 처리기
│   │   │   ├── npu/           # 경량 NPU
│   │   │   └── documents/     # 컨텍스트 문서
│   │   │
│   │   ├── monitoring/        # 서버 모니터링
│   │   │   ├── redis-monitor.ts    # Redis 사용량 추적
│   │   │   ├── supabase-monitor.ts # Supabase 스토리지 추적
│   │   │   ├── vercel-monitor.ts   # Vercel 함수 최적화
│   │   │   └── performance-logger.ts # 성능 로깅
│   │   │
│   │   ├── storage/           # 하이브리드 스토리지
│   │   │   ├── redis/         # Redis 캐시 서비스
│   │   │   ├── supabase/      # Supabase DB 서비스
│   │   │   └── hybrid/        # 스토리지 전략
│   │   │
│   │   └── ai-agent/          # AI 에이전트 기능
│   │       ├── root-cause-analyzer.ts
│   │       ├── predictive-alerts.ts
│   │       └── solution-recommender.ts
│   │
│   └── config/
│       ├── database.ts        # 데이터베이스 설정
│       ├── redis.ts          # Redis 설정
│       └── environment.ts     # 환경 관리
│
└── docs/
    ├── DEPLOYMENT.md          # 배포 가이드
    ├── API.md                # API 문서
    └── DEVELOPMENT.md        # 개발 가이드
```

## 🔧 개발 가이드라인

### ✅ UI/UX 보존 원칙 (최우선)
- **기존 인터페이스 90% 이상 유지**: `index.html` 및 사용자 인터페이스 컴포넌트는 현재 스타일을 철저히 보존
- **사용자 경험 흐름 보호**: 기존 네비게이션 및 상호작용 패턴 유지
- **부득이한 경우가 아니면 프론트엔드 디자인 수정 금지**

### ✅ 백엔드 개발 자유도
- **서버 측 기능 개선 및 확장 자유롭게 진행 가능**
- 데이터 처리 로직 개선
- API 엔드포인트 추가 및 최적화
- 성능 개선 및 확장성 강화

### ✅ Vibe Coding 방식
본 프로젝트는 AI 도구 기반 **Vibe Coding** 방식으로 개발:
1. **기획 단계**: GPT/Claude 기반 구조 설계
2. **구현 단계**: Cursor AI 코딩 지원
3. **고도화 단계**: AI 협업을 통한 패턴 확장

## 🎯 핵심 기능 구현

### 1. 성능 모니터링 시스템

#### Redis 사용량 모니터링
- **일일 한도**: 10,000 요청 추적
- **자동 정리**: 8,000 요청 도달 시 자동 캐시 정리
- **사용량 알림**: 90% 도달 시 경고 알림

#### Supabase 스토리지 모니터링
- **스토리지 한도**: 500MB 추적
- **자동 아카이빙**: 400MB 도달 시 자동 아카이브
- **테이블별 사용량**: 상세 스토리지 분석

#### Vercel 함수 최적화
- **응답 시간 추적**: 평균 응답 시간 모니터링
- **메모리 사용량**: 함수별 메모리 사용 추적
- **타임아웃 처리**: 10초 타임아웃 방지

### 2. MCP 자연어 처리

#### NPU (Neural Processing Unit) 경량화
```typescript
// 패턴 매칭 기반 의도 분류
class IntentClassifier {
  static classify(query: string): Intent {
    // 키워드 기반 패턴 매칭
    // 문맥 문서 기반 응답 생성
  }
}
```

#### 컨텍스트 문서 구조
```
mcp/documents/
├── server-issues.ts     # 서버 장애 패턴
├── troubleshooting.ts   # 문제 해결 가이드
└── performance.ts       # 성능 최적화 팁
```

### 3. 하이브리드 스토리지 전략

#### 캐시 우선순위
1. **Redis**: 빠른 액세스 (1차 캐시)
2. **Supabase**: 영구 저장 (2차 저장소)
3. **자동 동기화**: 이중 쓰기로 일관성 유지

```typescript
class StorageStrategy {
  static async get(key: string) {
    // 1. Redis 캐시 확인
    // 2. Supabase 폴백
    // 3. Redis에 결과 캐싱
  }
}
```

## 🚀 배포 및 운영

### 자동 배포 파이프라인
1. **GitHub Push** → `main` 브랜치
2. **Vercel 자동 빌드** → 프로덕션 배포
3. **환경변수 관리** → Vercel 대시보드
4. **헬스체크** → `/api/health` 엔드포인트

### 환경변수 설정
```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Application
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NODE_ENV=production
```

## 📊 모니터링 대시보드

### 실시간 메트릭
- **Redis 사용량**: 일일 요청 수 / 한도
- **Supabase 스토리지**: 사용량 / 500MB 한도
- **API 성능**: 평균 응답 시간, 성공률
- **에러 로그**: 최근 중요 이슈

### 알림 시스템
- **사용량 경고**: 90% 도달 시 알림
- **성능 저하**: 응답 시간 증가 시 알림
- **에러 급증**: 에러율 임계값 초과 시 알림

## 🔍 품질 보증

### 테스트 체크리스트
- [ ] Redis 사용량 추적 정상 작동
- [ ] Supabase 스토리지 모니터링 정확성
- [ ] 성능 메트릭 수집 정상
- [ ] 에러 로깅 기능 정상
- [ ] 자동 정리 임계값 도달 시 실행
- [ ] 모니터링 대시보드 데이터 표시 정상
- [ ] API 엔드포인트 타임아웃 한도 내 응답
- [ ] 높은 사용량 시 알림 트리거

### 성능 목표
- **응답 시간**: 평균 < 2초
- **가용성**: 99.9% 업타임
- **캐시 적중률**: > 80%
- **에러율**: < 1%

## 🎨 개발 우선순위

### Phase 1: 핵심 인프라
1. Next.js + TypeScript 기본 구조
2. Vercel + Supabase + Redis 연동
3. 기본 MCP 쿼리 처리
4. 헬스체크 API

### Phase 2: 모니터링 시스템
1. Redis/Supabase 사용량 추적
2. 성능 메트릭 수집
3. 자동 정리 시스템
4. 모니터링 대시보드

### Phase 3: AI 에이전트 고도화
1. 패턴 매칭 개선
2. 예측 알림 시스템
3. 자동 해결책 제안
4. 학습 기반 최적화

## 💡 향후 발전 방향

### 단기 목표 (1-3개월)
- 실제 LLM API 연동 (OpenAI/Claude)
- 실시간 서버 모니터링 (Prometheus/Grafana)
- 알림 시스템 강화 (Slack/이메일)

### 중기 목표 (3-6개월)
- 머신러닝 기반 예측 분석
- 멀티 테넌트 지원
- 모바일 앱 개발

### 장기 목표 (6개월+)
- 엔터프라이즈 기능 확장
- On-premise 배포 옵션
- 써드파티 통합 (AWS/GCP/Azure)

## 📚 참고 자료

### 기술 문서
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Upstash Redis Documentation](https://docs.upstash.com/redis)
- [Supabase Documentation](https://supabase.com/docs)

### 프로젝트 링크
- **프론트엔드**: [https://openvibe3.netlify.app](https://openvibe3.netlify.app)
- **백엔드 API**: [https://openmanager-vibe-v4.onrender.com](https://openmanager-vibe-v4.onrender.com)

---

> **중요**: 이 지침서는 AI 기반 Vibe Coding 방식으로 개발된 프로젝트의 종합 가이드입니다. UI/UX는 최대한 보존하되, 백엔드는 자유롭게 개선하여 프로덕션 레벨의 시스템을 구축하세요.