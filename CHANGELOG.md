# 변경 이력

이 문서는 OpenManager Vibe V5 프로젝트의 주요 변경 사항을 기록합니다.

## [미출시] - 개발 진행 중

### 추가됨 🚀- **완전한 OpenManager Vibe V5 랜딩 페이지**: Next.js App Router 기반 구현  - 🎨 그라데이션 애니메이션 배경 (15초 순환)  - 💎 글래스모피즘 디자인 카드  - ⚡ Fade-in-up 애니메이션 효과  - 📱 완전 반응형 디자인  - 🎯 SEO 최적화 및 성능 향상- **API 라우트 시스템 완전 구축**: App Router, Pages Router, Vercel Functions 3가지 방식 구현- **19개 AI 데모 서버**: 실시간 시뮬레이션 환경 구축- **AI 채팅 인터페이스**: 자연어 서버 질의 및 분석- **10단계 자동 데모 시나리오**: 인터랙티브 데모 스토리- **실시간 하이라이트**: AI 응답 연동 서버 강조 시스템- **포괄적인 에러 처리**: 전사적 에러 모니터링 및 대응- **성능 모니터링**: 실시간 성능 메트릭 추적- **CI/CD 파이프라인**: GitHub Actions 기반 자동 배포- Font Awesome 6.4.0 및 Noto Sans KR 폰트 통합- Vercel 자동 배포 파이프라인- 프로젝트 문서 한글화- 시스템 구조 및 기술 스택 정의

### 변경됨 🔄
- **프로젝트 구조 최적화**: src/ 디렉토리 기반 모듈화
- **Zustand 상태 관리**: 클라이언트 상태 중앙화
- **Framer Motion 11**: 고급 애니메이션 시스템 도입
- TypeScript `any` 타입을 `unknown`으로 대체
- 코드 스타일 가이드 적용
- 모든 문서를 한글로 통일

### 수정됨 🛠️- **Next.js 기본 템플릿 문제 완전 해결** (2024-12-15): `public/index.html` → `src/app/page.tsx` 마이그레이션  - ✅ 리다이렉션 문제 해결: HTML 파일 참조 → React 컴포넌트 구현  - ✅ OpenManager Vibe V5 완전한 랜딩 페이지 구현  - ✅ 번들 크기 최적화: 5.57 kB 메인 페이지, 111 kB First Load JS- **API 라우트 404 문제 완전 해결** (2024-12-15): `.vercelignore` 설정으로 루트 api/ 디렉토리 충돌 제거  - ✅ 47개 파일 정확히 무시됨 확인  - ✅ 3개 API 엔드포인트 서버리스 함수로 정상 생성  - ✅ 35초 빌드 완료, 배포 성공- **Vercel 배포 최적화**: 개인 계정용 설정으로 ORG_ID/PROJECT_ID 문제 해결- **GitHub Actions CI/CD**: 개인 Vercel 계정 맞춤 설정- **Next.js 15 호환성**: experimental.serverComponentsExternalPackages → serverExternalPackages 마이그레이션- **빌드 성공률 100%**: 모든 빌드 에러 제거- TypeScript ESLint 에러 해결

## [0.1.0] - 2024-12-15

### 추가됨
- 프로젝트 초기 설정
- Next.js 15 + TypeScript 조합
- 기본 디렉토리 구조 설정
- 초기 배포 환경 구성
- README 및 기본 문서 작성

## 향후 계획

### [0.2.0] - 예정
- Redis (Upstash) 연결 설정 완료
- Supabase 데이터베이스 통합
- 기본 API 엔드포인트 구현
- 사용자 인증 시스템 추가

### [0.3.0] - 예정
- MCP 자연어 처리 엔진 초기 버전
- 서버 모니터링 기본 기능
- 관리자 대시보드 UI 구현
- 알림 시스템 구현

### [1.0.0] - 예정
- 전체 기능 완성
- 성능 최적화
- 사용자 문서 완성
- 보안 검증 완료

## 커밋 컨벤션

본 프로젝트는 다음과 같은 커밋 메시지 컨벤션을 사용합니다:

- `feat:` 새로운 기능 추가
- `fix:` 버그 수정
- `docs:` 문서 변경
- `style:` 코드 포맷팅, 세미콜론 누락 등 (코드 변경 없음)
- `refactor:` 코드 리팩토링
- `perf:` 성능 개선
- `test:` 테스트 추가 또는 수정
- `chore:` 빌드 프로세스 또는 보조 도구 변경 