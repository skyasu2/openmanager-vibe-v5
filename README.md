# 🚀 OpenManager Vibe v5

> **AI 기반 서버 모니터링 플랫폼** with **3단계 독립 시스템**  
> MCP-RAG Hybrid Engine + 독립적 서버 데이터 생성기

[![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC)](https://tailwindcss.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Production-000000)](https://vercel.com/)

---

## 🎯 핵심 특징

### 🏗️ 3단계 독립 시스템 아키텍처
```
🧠 메인 AI 엔진: MCP → RAG → Basic (폴백 시스템)
🎰 서버 데이터 생성기: Local → Premium → Basic (독립적 운영)
🌍 환경 감지: 공용 모듈 (중복 제거, 캐시 최적화)
```

### ⚡ 환경별 자동 최적화
| 환경 | AI 엔진 | 데이터 생성기 | 서버 수 | 갱신 주기 | 특징 |
|------|---------|---------------|---------|-----------|------|
| **로컬 개발** | MCP 80% | LOCAL 모드 | 30개 | 2초 | GPU 메트릭, 성능 프로파일링 |
| **Vercel 유료** | MCP 60% | PREMIUM 모드 | 20개 | 5초 | 실시간 시뮬레이션 |
| **Vercel 무료** | RAG 40% | BASIC 모드 | 8개 | 10초 | 기본 메트릭 |
| **오프라인** | Vector DB | BASIC 모드 | 8개 | 10초 | 로컬 Vector 검색 |

### 🌟 주요 기능
- ✅ **실시간 서버 모니터링**: 30개 서버 동시 추적 (로컬 모드)
- ✅ **AI 기반 예측 분석**: MCP + RAG Hybrid 엔진
- ✅ **Vector DB 완전 구현**: 로컬 + Redis Vector Storage
- ✅ **환경 독립성**: 모든 플랫폼에서 일관된 경험
- ✅ **모바일 반응형**: PWA 지원 대시보드
- ✅ **다크/라이트 테마**: 사용자 설정 기반
- ✅ **실시간 알림**: WebSocket 기반 이벤트 시스템

---

## 🚀 빠른 시작

### 📋 시스템 요구사항
- **Node.js**: 20.x 이상
- **npm**: 10.x 이상  
- **메모리**: 최소 2GB (로컬 모드 권장 4GB)

### 🔧 설치 및 실행
```bash
# 1. 저장소 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 2. 종속성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경변수 설정

# 4. 개발 서버 실행
npm run dev
```

### 🌐 접속 주소
- **로컬**: http://localhost:3000
- **네트워크**: http://192.168.x.x:3000 (자동 감지)

---

## 🏗️ 시스템 아키텍처

### 🧠 AI 엔진 (3단계 폴백)
```typescript
// MCP (Model Context Protocol) - 1순위
export class MCPEngine {
  // 실시간 컨텍스트 기반 AI 분석
  // 평균 응답시간: 239ms
}

// RAG (Retrieval Augmented Generation) - 2순위  
export class RAGEngine {
  // Vector DB 기반 의미론적 검색
  // 10K 문서 지원, 384차원 임베딩
}

// Basic Fallback - 3순위
export class BasicEngine {
  // 키워드 기반 기본 검색
  // 오프라인 환경 지원
}
```

### 🎰 서버 데이터 생성기 (독립적 3단계)
```typescript
// 환경별 자동 감지 및 최적화
export class RealServerDataGenerator {
  modes: {
    local: { servers: 30, refresh: 2000ms, features: 6 },
    premium: { servers: 20, refresh: 5000ms, features: 4 },
    basic: { servers: 8, refresh: 10000ms, features: 1 }
  }
}
```

### 🌍 환경 감지 (공용 모듈)
```typescript
// 싱글톤 캐시로 성능 최적화
export function detectEnvironment(): Environment {
  if (cachedEnvironment) return cachedEnvironment;
  // 환경 감지 로직...
}
```

---

## 📊 성능 지표

### ⚡ 현재 로컬 환경 성능
- **시작 시간**: 2.5초
- **MCP 응답**: 239-242ms
- **데이터 갱신**: 2초 간격 (30개 서버)
- **환경 감지**: 캐시 기반 즉시 응답
- **메모리 사용**: ~200MB (BASE) + 30MB/서버

### 🎯 Vector DB 성능
- **검색 속도**: <100ms (로컬), <200ms (Redis)
- **임베딩 모델**: Transformers.js (384차원)
- **문서 용량**: 10K 문서 지원
- **언어 지원**: 한국어 + 영어

---

## 🎨 UI/UX 특징

### 📱 반응형 대시보드
- **데스크톱**: 그리드 기반 멀티 패널
- **태블릿**: 2-컬럼 적응형 레이아웃  
- **모바일**: 스와이프 기반 단일 패널

### 🌙 다크/라이트 테마
- **자동 감지**: 시스템 설정 기반
- **수동 토글**: 헤더 테마 스위치
- **색상 일관성**: Tailwind CSS 기반

### 📊 실시간 차트
- **Chart.js**: 부드러운 애니메이션
- **시계열 데이터**: 실시간 업데이트
- **상호작용**: 줌, 필터, 범례 토글

---

## 🚀 배포 가이드

### 🌐 Vercel 배포
```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 프로젝트 연결
vercel link

# 3. 환경변수 설정
vercel env add KV_URL
vercel env add REDIS_URL
# ... 기타 환경변수

# 4. 배포 실행
vercel --prod
```

### 🔧 환경변수 설정
```bash
# 필수 환경변수
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
REDIS_URL=redis://...

# 선택적 환경변수  
GITHUB_TOKEN=ghp_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
```

---

## 📚 개발 가이드

### 🔧 주요 npm 스크립트
```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드
npm run start        # 프로덕션 서버 실행
npm run type-check   # TypeScript 검증
npm run lint         # ESLint 검사
npm run test         # 단위 테스트 실행
```

### 📂 프로젝트 구조
```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API 라우트 (80+ 엔드포인트)
│   └── components/     # 페이지 컴포넌트
├── components/         # 재사용 가능한 UI 컴포넌트
├── services/           # 비즈니스 로직 서비스
│   ├── data-generator/ # 서버 데이터 생성기
│   └── mcp/           # MCP 엔진
├── utils/             # 유틸리티 함수
└── types/             # TypeScript 타입 정의
```

### 🧪 테스트 전략
```bash
# 빠른 검증
npm run validate:quick

# 전체 검증 (타입체크 + 린트 + 테스트 + 빌드)
npm run validate:all

# Git Hook 기반 자동 검증
git commit  # pre-commit hook 실행
git push    # pre-push hook 실행
```

---

## 🌟 고급 기능

### 🤖 AI 분석 엔진
- **이상 탐지**: 패턴 기반 이상 서버 감지
- **예측 분석**: TensorFlow.js 기반 리소스 예측
- **자연어 질의**: 한국어 질문으로 서버 상태 조회
- **자동 알림**: 임계값 기반 실시간 알림

### 📊 모니터링 기능
- **실시간 메트릭**: CPU, 메모리, 디스크, 네트워크
- **Prometheus 호환**: 표준 메트릭 포맷 지원
- **히스토리 추적**: 30일간 메트릭 히스토리
- **대시보드 커스터마이징**: 위젯 배치 자유 조정

### 🔐 보안 기능
- **API 키 인증**: 안전한 API 접근 제어
- **CORS 정책**: 원본 도메인 제한
- **Rate Limiting**: API 요청 속도 제한
- **데이터 암호화**: 민감 데이터 암호화 저장

---

## 🛠️ 기술 스택

### 🖥️ 프론트엔드
- **Framework**: Next.js 15.3.3 (App Router)
- **언어**: TypeScript 5.x
- **스타일링**: Tailwind CSS 3.x
- **상태 관리**: Zustand
- **차트**: Chart.js + React-Chartjs-2
- **애니메이션**: Framer Motion

### ⚙️ 백엔드 
- **Runtime**: Node.js 20.x
- **API**: Next.js API Routes (80+ 엔드포인트)
- **데이터베이스**: Supabase (PostgreSQL)
- **캐시**: Upstash Redis
- **Vector DB**: 로컬 + Redis Vector Storage

### 🧠 AI/ML
- **MCP**: Model Context Protocol
- **Vector 검색**: Transformers.js (384차원)
- **임베딩**: @xenova/transformers
- **NLP**: 한국어 자연어 처리
- **예측**: TensorFlow.js

### 🚀 배포/인프라
- **배포**: Vercel (자동 배포)
- **모니터링**: Prometheus + InfluxDB
- **CI/CD**: GitHub Actions
- **코드 품질**: ESLint + Prettier + Husky

---

## 📈 로드맵

### 🎯 단기 목표 (1개월)
- [ ] **pgvector 통합**: PostgreSQL Vector 확장 연결
- [ ] **엔터프라이즈 인증**: SSO 및 RBAC 구현
- [ ] **모바일 앱**: PWA를 네이티브 앱으로 확장

### 🚀 중기 목표 (3개월)
- [ ] **멀티 테넌트**: 조직별 독립 환경
- [ ] **고급 AI**: GPT 통합 자연어 분석
- [ ] **클러스터 모니터링**: Kubernetes 네이티브 지원

### 🌟 장기 목표 (6개월)
- [ ] **엣지 컴퓨팅**: CDN 기반 분산 모니터링
- [ ] **IoT 통합**: 하드웨어 센서 데이터 연동
- [ ] **국제화**: 다국어 지원 확장

---

## 🤝 기여하기

### 📝 기여 가이드
1. **Fork** 이 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **브랜치 푸시** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

### 🐛 버그 리포트
- [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)에서 버그 신고
- 상세한 재현 단계와 환경 정보 포함

### 💡 기능 제안
- [GitHub Discussions](https://github.com/your-username/openmanager-vibe-v5/discussions)에서 아이디어 공유
- 커뮤니티 피드백을 통한 우선순위 결정

---

## 📄 라이선스

이 프로젝트는 **MIT License** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 📞 지원 및 문의

### 🔗 유용한 링크
- **데모**: https://openmanager-vibe-v5.vercel.app
- **문서**: [프로젝트 위키](https://github.com/your-username/openmanager-vibe-v5/wiki)
- **API 문서**: [Swagger UI](https://openmanager-vibe-v5.vercel.app/api-docs)

### 💬 커뮤니티
- **Discord**: [개발자 커뮤니티](https://discord.gg/openmanager)
- **Twitter**: [@OpenManagerV5](https://twitter.com/OpenManagerV5)

---

**⭐ 이 프로젝트가 유용하다면 Star를 눌러주세요!**

**🎉 OpenManager Vibe v5 - 차세대 AI 서버 모니터링 플랫폼으로 더 똑똑한 인프라 관리를 경험하세요!**
