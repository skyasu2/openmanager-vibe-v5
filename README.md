# 🚀 OpenManager Vibe v5.35.0

> **AI-Powered 서버 모니터링 플랫폼**  
> **Enhanced AI Engine v2.0 + MCP Protocol + TensorFlow.js**

## ⚡ 빠른 시작

### 1. 설치 및 실행

```bash
# 프로젝트 클론
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 설치 및 실행
npm install
npm run dev
```

### 2. 환경 설정

```bash
# 환경변수 설정
cp .env.example .env.local
# 상세 설정: ENVIRONMENT_SETUP.md 참조
```

### 3. 시스템 시작

1. 브라우저에서 http://localhost:3000 접속
2. "🚀 시스템 시작" 버튼 클릭
3. 30분간 자동 운영 시작

## 🎯 핵심 기능

| 기능                  | 설명                         | 상태    |
| --------------------- | ---------------------------- | ------- |
| **AI 엔진**           | MCP 기반 지능형 분석         | ✅ 완료 |
| **실시간 모니터링**   | WebSocket 기반 실시간 데이터 | ✅ 완료 |
| **서버 시뮬레이션**   | Prometheus 호환 메트릭 생성  | ✅ 완료 |
| **Keep-Alive 시스템** | 무료 티어 보호               | ✅ 완료 |

## 🏗️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI Engine**: TensorFlow.js, MCP Protocol
- **Backend**: Supabase, Upstash Redis
- **Deployment**: Vercel

## 📚 문서 가이드

### 🚀 시작하기

- **[빠른 시작 가이드](docs/QUICK_START_GUIDE.md)** - 3분 완료 설치 및 실행
- **[환경 설정](ENVIRONMENT_SETUP.md)** - 개발 환경 구성
- **[개발 가이드](DEVELOPMENT_GUIDE.md)** - 개발자용 상세 가이드

### 🤖 AI 엔진

- **[AI 설계 요약](docs/AI_DESIGN_SUMMARY.md)** - 핵심 설계 원칙 (5분)
- **[AI 엔진 완전 가이드](docs/AI_ENGINE_COMPLETE_GUIDE.md)** - 구현 세부사항
- **[MCP 설계 철학](docs/WHY_MCP_AI_ENGINE.md)** - 설계 배경 및 철학

### 📊 운영 및 모니터링

- **[시스템 아키텍처](docs/SYSTEM_ARCHITECTURE.md)** - 전체 구조 이해
- **[프로젝트 상태](PROJECT_STATUS.md)** - 현재 상태 및 진행사항
- **[배포 체크리스트](DEPLOYMENT_CHECKLIST.md)** - 배포 전 확인사항

## 🔄 현재 상태 (v5.35.0)

- ✅ **통합 헬스체크 API 완성** - 시스템 상태 실시간 모니터링
- ✅ **서버 데이터 생성기 개선** - 비동기 루프 및 제로값 처리
- ✅ **Vercel 배포 최적화** - 빌드 성공률 100%
- ✅ **Keep-Alive 시스템** - Supabase/Redis 자동 보호

## 🚀 데모 및 배포

- **Live Demo**: [https://your-demo-url.vercel.app](https://your-demo-url.vercel.app)
- **GitHub**: [https://github.com/yourusername/openmanager-vibe-v5](https://github.com/yourusername/openmanager-vibe-v5)

## 📞 지원

- **Issues**: GitHub Issues에서 버그 리포트
- **Discussions**: 일반적인 질문 및 토론
- **문서**: [docs 폴더 가이드](docs/README.md) 참조

---

**개발자**: jhhong (개인 프로젝트)  
**라이선스**: MIT License
