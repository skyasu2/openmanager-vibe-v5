# 🚀 OpenManager Vibe v5

> **스마트 서버 모니터링 & AI 기반 관리 시스템**  
> 마지막 업데이트: 2025-06-10

## ⚡ 빠른 시작

### 1. 환경 설정

```bash
npm install
cp .env.example .env.local
# .env.local에 필요한 환경변수 설정
```

### 2. 개발 서버 실행

```bash
npm run dev
# 또는 검증 후 실행
npm run validate:quick && npm run dev
```

### 3. 주요 기능 확인

- 🖥️ **대시보드**: <http://localhost:3000>
- 🤖 **AI 분석**: <http://localhost:3000/admin/ai-analysis>
- ⚙️ **MCP 모니터링**: <http://localhost:3000/admin/mcp-monitoring>

## 🎯 핵심 기능

### 🧠 AI 기반 분석

- **Google AI (Gemini)**: 고급 서버 메트릭 분석
- **실시간 예측**: 시스템 리소스 사용량 예측
- **자동 최적화 제안**: AI 기반 성능 개선 권장사항

### 📊 스마트 모니터링

- **실시간 대시보드**: WebSocket 기반 실시간 업데이트
- **맞춤형 알림**: 임계값 기반 스마트 알림 시스템
- **성능 메트릭**: CPU, 메모리, 디스크, 네트워크 통합 모니터링

### 🔧 MCP 통합

- **Cursor AI 연동**: Model Context Protocol 지원
- **개발 가속화**: AI 페어 프로그래밍 최적화
- **실시간 컨텍스트**: 프로젝트 상태 기반 AI 지원

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── src/
│   ├── app/                 # Next.js 앱 라우터
│   ├── components/          # 재사용 가능한 컴포넌트
│   ├── services/           # 비즈니스 로직 & AI 엔진
│   └── utils/              # 유틸리티 함수
├── docs/                   # 사용자 문서
├── docs/archive/           # 상세 기술 문서
└── tests/                  # 테스트 파일
```

## 🛠️ 개발 명령어

```bash
# 개발 환경
npm run dev                 # 개발 서버 시작
npm run validate:quick      # 빠른 검증 (타입체크 + 린트)

# 품질 관리
npm run test:unit          # 단위 테스트
npm run test:e2e           # E2E 테스트
npm run lint               # 코드 스타일 검사
npm run type-check         # 타입 검사

# 빌드 & 배포
npm run build              # 프로덕션 빌드
npm run start              # 프로덕션 서버 시작
```

## 📚 상세 문서

### 🚀 시작하기

- [바이브 코딩 시작하기](바이브_코딩_시작하기.md) - 5분 빠른 설정
- [개발 환경 설정](개발_환경_설정.md) - 상세 설치 가이드

### 🧠 AI 시스템

- [AI 분석 사용법](AI_분석_사용법.md) - Google AI 활용
- [MCP 연동 가이드](MCP_연동_가이드.md) - Cursor AI 설정

### 📋 운영 가이드

- [배포 가이드](배포_가이드.md) - Vercel 배포 방법
- [모니터링 설정](모니터링_설정.md) - 시스템 모니터링

## 💡 주요 특징

### 🎨 **Modern Stack**

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, WebSocket
- **AI**: Google AI Studio (Gemini), OpenAI GPT-4
- **Database**: Supabase, Redis
- **Deployment**: Vercel, GitHub Actions

### ⚡ **성능 최적화**

- **번들 크기**: 지연 로딩으로 초기 로드 최적화
- **실시간 업데이트**: WebSocket 기반 효율적 통신
- **캐싱 전략**: Redis 기반 다층 캐싱
- **AI 응답**: 폴백 시스템으로 99.9% 가용성

### 🔒 **보안 & 품질**

- **타입 안전성**: 전체 프로젝트 TypeScript 적용
- **테스트 커버리지**: 80% 이상 유지
- **코드 품질**: ESLint, Prettier 자동화
- **보안**: 환경변수 기반 시크릿 관리

## 🤝 기여하기

### 개발 워크플로우

1. **브랜치 생성**: `git checkout -b feature/새기능명`
2. **테스트 작성**: TDD 접근으로 테스트 먼저 작성
3. **구현**: 작은 단위로 점진적 개발
4. **검증**: `npm run validate:quick` 실행
5. **커밋**: 설명적인 커밋 메시지 작성
6. **PR 생성**: 코드 리뷰 요청

### 코딩 스타일

- **SOLID 원칙** 준수
- **단일 책임** 원칙 적용
- **의존성 주입** 활용
- **800줄 이상 파일 분리** 필수

## 📞 지원

- **Issues**: [GitHub Issues](../../issues)
- **Discussions**: [GitHub Discussions](../../discussions)
- **문서**: `docs/archive/` 폴더 상세 가이드 참조

---

**🎯 AI와 함께하는 스마트한 서버 관리를 경험하세요!**

_마지막 업데이트: 2025-06-10_
