# 📋 Changelog

모든 주요 변경사항이 이 파일에 기록됩니다.

## [1.2.0] - 2025-01-03

### 🚀 **메이저 기능 추가**
- **AI 에이전트 시스템 완전 구현**
  - `AgentPanel.tsx`: 데스크탑 우측 사이드바 (w-96)
  - `AgentPanelMobile.tsx`: 모바일 하단 Drawer (85vh)
  - `AgentQueryBox.tsx`: 자동 리사이징 텍스트 입력
  - `AgentResponseView.tsx`: 마크다운 포맷팅 응답 표시

- **서버 모니터링 UI 완전 구현**
  - `ServerDashboard.tsx`: 메인 대시보드 (6개 서버 그리드)
  - `ServerCard.tsx`: Glassmorphism 디자인 서버 카드
  - `ServerDetailModal.tsx`: 전체화면 상세 모달 (탭 구조)

- **MCP 엔진 및 AI 서비스**
  - `modules/mcp/index.ts`: 5가지 인텐트 분류 및 패턴 매칭
  - `services/agent.ts`: 통합 AI 서비스 (캐싱, 컨텍스트 강화)
  - `types/server.ts`: 완전한 TypeScript 타입 정의

### ✨ **UI/UX 개선**
- **반응형 디자인**: 데스크탑(사이드바) ↔ 모바일(드로어) 완벽 대응
- **AI 연동 흐름**: 서버 카드 → 상세 모달 → AI 분석 seamless 연결
- **플로팅 액션**: 모바일용 AI 빠른 접근 버튼
- **마이크로 인터랙션**: 호버 효과, 로딩 애니메이션, 그라데이션

### 🧠 **AI 기능**
- **자연어 처리**: "서버 상태", "성능 분석", "로그 분석" 등 다양한 질의 지원
- **컨텍스트 인식**: 서버 ID, 메트릭, 시간 범위 자동 추출
- **맞춤 응답**: 서버별, 시간대별 컨텍스트 기반 응답 생성
- **빠른 질문**: 원클릭 템플릿으로 즉시 AI 질의

### 🏗️ **아키텍처 개선**
- **모듈화 설계**: 컴포넌트 완전 분리 및 재사용성 극대화
- **타입 안전성**: 모든 인터페이스 TypeScript로 정의
- **상태 관리**: React Hooks 기반 효율적인 상태 관리
- **라우팅**: 메인 대시보드 + 서버 전용 대시보드 분리

### 🔧 **기술적 변경**
- **Font Awesome 6**: 아이콘 시스템 통합
- **Tailwind CSS**: 유틸리티 우선 스타일링
- **Next.js 15.1.8**: App Router 완전 활용
- **TypeScript 5**: 최신 타입 기능 활용

---

## [1.1.0] - 2025-01-02

### 🎨 **랜딩 페이지 개선**
- Glassmorphism 디자인 적용
- AI 에이전트 소개 섹션 추가
- 반응형 레이아웃 최적화

### 🔧 **개발 환경**
- ESLint 설정 업데이트
- TypeScript 구성 개선
- 빌드 최적화

---

## [1.0.0] - 2025-01-01

### 🚀 **초기 릴리스**
- Next.js 15.1.8 기반 프로젝트 초기 설정
- 기본 라우팅 구조 구현
- Tailwind CSS 설정

## [미출시] - 개발 진행 중

### 최근 업데이트 (2025-01-04)
- **모달 최적화**: 스크롤 제거, 컴팩트 디자인
- **브랜드 리뉴얼**: OpenManager Vibe V5 → OpenManager AI
- **UI/UX 개선**: 화이트 카드 디자인, NPU/MCP 메인 카드
- **문서 정리**: README 리뉴얼, 푸터 간소화

### 주요 기능
- **AI 랜딩 페이지**: Next.js App Router, 그라데이션 애니메이션
- **AI 데모 시스템**: 19개 서버, 자연어 채팅, 10단계 자동 시나리오
- **API 시스템**: App Router, Pages Router, Vercel Functions
- **CI/CD**: GitHub Actions, Vercel 자동 배포

### 기술 스택
- Next.js 15 + TypeScript
- Zustand 상태 관리
- Framer Motion 애니메이션
- Font Awesome + Noto Sans KR

## [0.1.0] - 2024-12-15
- 프로젝트 초기 설정
- Next.js 15 + TypeScript 조합
- Vercel 배포 환경 구성

## 향후 계획
- **[0.2.0]**: Redis, Supabase 통합, 사용자 인증
- **[0.3.0]**: MCP 엔진, 서버 모니터링, 관리자 대시보드
- **[1.0.0]**: 전체 기능 완성, 성능 최적화

## 커밋 컨벤션
- `feat:` 새로운 기능 | `fix:` 버그 수정 | `docs:` 문서 변경
- `style:` 포맷팅 | `refactor:` 리팩토링 | `perf:` 성능 개선 