# OpenManager Vibe v5 - 개발 문서 💻

OpenManager Vibe v5 프로젝트의 개발자를 위한 종합 문서 모음입니다.

## 📁 문서 구조

### 🚀 시작하기

- [`setup/`](setup/) - 개발 환경 설정
  - [개발 환경 설정](setup/개발_환경_설정.md) - 필수 도구 설치 및 설정
  - [바이브 코딩 시작하기](setup/바이브_코딩_시작하기.md) - AI 협업 코딩 가이드

### 📖 개발 가이드

- [`guides/`](guides/) - 개발 가이드 및 튜토리얼
  - [AI 분석 사용법](guides/AI_분석_사용법.md) - AI 분석 도구 활용
  - [MCP 완전 가이드](guides/MCP_완전_가이드.md) - MCP 서버 구축 및 운영
  - [Google AI 통합 가이드](guides/GOOGLE_AI_BETA_INTEGRATION_GUIDE.md) - Google AI API 통합
  - [멀티모달 AI 가이드](guides/MULTIMODAL_AI_INTEGRATION_GUIDE.md) - 멀티모달 AI 구현

### 🏗️ 시스템 아키텍처

- [`architecture/`](architecture/) - 시스템 설계 및 구조
  - [시스템 아키텍처 완전 가이드](architecture/시스템_아키텍처_완전_가이드.md)
  - [데이터베이스 연결 가이드](architecture/DATABASE_CONNECTION_GUIDE.md)
  - [서버 데이터 생성기 가이드](architecture/SERVER_DATA_GENERATOR_v5_GUIDE.md)

### 🎯 프로젝트 관리

- [`project-management/`](project-management/) - 프로젝트 관리 및 계획
  - [프로젝트 현황 및 보고서](project-management/프로젝트_현황_및_보고서.md)
  - [향후 개발 계획](project-management/FUTURE_DEVELOPMENT_PLAN.md)
  - [문서 구조 가이드](project-management/문서_구조_가이드.md)

### 📊 보고서 및 분석

- [`reports/`](reports/) - 테스트 결과 및 분석 보고서
  - [테스트 결과 v5.41.0](reports/TEST_RESULTS_v5.41.0.md)
  - [모듈화 완료 보고서](reports/MODULARIZATION_COMPLETION_REPORT.md)

### 🔧 리팩토링

- [`refactoring/`](refactoring/) - 리팩토링 문서 및 도구
  - 리팩토링 의사결정 로그
  - 실행 보고서 및 분석 도구

### 📋 API 문서

- [`api/`](api/) - API 문서 (향후 확장용)

## 🚀 빠른 시작 가이드

### 1️⃣ 첫 번째 단계: 환경 설정

```bash
# 1. 저장소 클론
git clone https://github.com/your-org/openmanager-vibe-v5
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env.local
# Google AI API 키 설정 필요
```

### 2️⃣ 두 번째 단계: 개발 서버 실행

```bash
# 개발 서버 시작
npm run dev

# MCP 서버 시작 (별도 터미널)
npm run start:mcp

# 테스트 실행
npm run test:unit
```

### 3️⃣ 세 번째 단계: AI 기능 활용

1. [AI 분석 사용법](guides/AI_분석_사용법.md) 읽기
2. Google AI API 키 설정 ([보안 가이드](../security/))
3. 바이브 코딩 시작하기

## 🔧 개발 워크플로우

### 일일 개발 루틴

```bash
# 1. 최신 코드 동기화
git pull origin main

# 2. 개발 환경 검증
npm run validate:quick

# 3. 기능 개발
# - 테스트 먼저 작성 (TDD)
# - 작은 단위로 커밋
# - AI 도구 적극 활용

# 4. 커밋 전 검증
npm run type-check
npm run lint
npm run test:unit
npm run build

# 5. 커밋 및 푸시
git add .
git commit -m "기능: 새로운 기능 추가"
git push
```

### 코드 품질 기준

- **테스트 커버리지**: 80% 이상 유지
- **타입 안전성**: TypeScript strict 모드
- **코드 스타일**: ESLint + Prettier 자동 포맷팅
- **성능**: Lighthouse 점수 90점 이상

## 🤖 AI 협업 가이드

### 바이브 코딩 실습

1. **복잡한 작업**: AI에게 단계별로 요청
2. **에러 처리**: 에러 메시지와 컨텍스트 정확히 제공
3. **코드 리뷰**: AI를 활용한 코드 품질 검증
4. **문서 작성**: AI 도움으로 문서 자동 생성

### 권장 AI 도구

- **Cursor IDE**: 메인 개발 환경
- **GitHub Actions**: CI/CD 파이프라인 자동화
- **Google AI**: 분석 및 추론
- **MCP 시스템**: 컨텍스트 관리

## 📚 학습 리소스

### 필수 문서

1. [개발 환경 설정](setup/개발_환경_설정.md) ⭐
2. [바이브 코딩 시작하기](setup/바이브_코딩_시작하기.md) ⭐
3. [AI 분석 사용법](guides/AI_분석_사용법.md) ⭐

### 심화 학습

- [시스템 아키텍처](architecture/)
- [프로젝트 관리](project-management/)
- [성능 최적화 가이드](../../../infra/docs/monitoring/)

## 🔗 관련 링크

### 내부 리소스

- [인프라 문서](../../../infra/docs/) - 배포 및 운영
- [설정 파일](../config/) - 개발 도구 설정
- [스크립트](../scripts/) - 자동화 도구

### 외부 리소스

- [Next.js 15 문서](https://nextjs.org/docs)
- [TypeScript 핸드북](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)

## 🆘 도움이 필요하시나요?

### 자주 묻는 질문

- **Q**: 개발 서버가 시작되지 않아요
- **A**: [환경 설정 가이드](setup/개발_환경_설정.md) 확인

- **Q**: AI 분석이 작동하지 않아요
- **A**: Google AI API 키 설정 확인 ([보안 가이드](../security/))

- **Q**: 테스트가 실패해요
- **A**: `npm run test:unit -- --verbose` 로 상세 로그 확인

### 연락처

- 🐛 **버그 리포트**: GitHub Issues
- 💬 **질문 및 토론**: 팀 Slack #dev-support
- 📖 **문서 개선**: Pull Request 환영
- 🚀 **기능 제안**: GitHub Discussions

---

> 💡 **팁**: 이 문서는 계속 업데이트됩니다. 북마크해두고 정기적으로 확인해주세요!
