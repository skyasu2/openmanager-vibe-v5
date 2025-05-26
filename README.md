# 🚀 OpenManager AI v5 - 지능형 AI 기반 서버 모니터링

> **🎯 AI 에이전트 중심의 실제 제품** + 시연용 보조 도구  
> **🏆 경진대회 전략**: 실제 운영 가능한 AI 엔진 vs 데모 시뮬레이터 구분  

[![Next.js](https://img.shields.io/badge/Next.js-15.3.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![AI Engine](https://img.shields.io/badge/AI%20Engine-Enhanced-green)](./AI_AGENT_CORE_ARCHITECTURE.md)
[![Build](https://img.shields.io/badge/Build-Passing-brightgreen)](npm run build)

## 📋 **핵심 문서**

### 🔥 **[AI_AGENT_CORE_ARCHITECTURE.md](./AI_AGENT_CORE_ARCHITECTURE.md)**
**개발자용 상세 기술 문서** - 아키텍처, 체크리스트, 사용법, 금지사항 등 모든 개발 정보

---

## 🎯 **프로젝트 개요**

### **핵심 제품** 🔥
- **AI 에이전트 엔진**: 실시간 사고 과정, 스마트 모드 감지, 지능형 추론
- **AI 관리 시스템**: 엔터프라이즈급 모니터링 및 제어 도구

### **시연 도구** 🧪
- **서버 시뮬레이터**: 가상 서버 환경 및 모니터링 대시보드

## 🚀 **빠른 시작**

```bash
# 1. 설치 및 실행
npm install && npm run dev

# 2. 핵심 기능 확인
curl http://localhost:3000/api/ai-agent?action=status  # AI 상태 체크
open http://localhost:3000/admin/ai-agent             # 관리 페이지

# 3. 빌드 테스트
npm run build  # 반드시 성공!
```

## 💻 **사용법 예시**

```tsx
// 1. Provider 설정
import { AIAgentProvider } from '@/modules/ai-agent/infrastructure/AIAgentProvider';

<AIAgentProvider>
  <YourApp />
</AIAgentProvider>

// 2. Hook 사용
const { queryAI, state } = useAIAgent();
const response = await queryAI({ query: "서버 상태 분석", mode: "auto" });
```

## 🏆 **경진대회 전략**

| 구분 | 내용 | 어필 포인트 |
|------|------|-------------|
| **실제 제품** 🔥 | AI 에이전트 엔진 + 관리 시스템 | 즉시 배포 가능한 완성품 |
| **시연 도구** 🧪 | 서버 시뮬레이터 + 대시보드 | 안전한 데모 환경 |

## 📚 **상세 문서**

- 🔥 **[AI_AGENT_CORE_ARCHITECTURE.md](./AI_AGENT_CORE_ARCHITECTURE.md)** - 개발자 필수 기술 문서 + 관리자 시스템 가이드
- 🛠️ **[개발 가이드](docs/02-개발가이드.md)** - 프로젝트 세팅, 환경설정, 개발 방법
- 🚀 **[배포 및 운영 가이드](docs/03-배포-운영가이드.md)** - Vercel/Docker 배포 + 트러블슈팅
- 📊 **[API 문서](docs/03-API문서.md)** - RESTful API 및 WebSocket 엔드포인트
- 🧪 **[시뮬레이션 사용가이드](docs/시뮬레이션-사용가이드.md)** - 테스트 도구 사용법
- 📝 **[CHANGELOG.md](./CHANGELOG.md)** - 버전 변경 이력

---

**🎯 AI 에이전트 = 실제 제품 | 나머지 = 시연 도구**
