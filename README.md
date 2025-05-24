# OpenManager AI 🚀

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1.8-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![Vibe Coding](https://img.shields.io/badge/Vibe_Coding-AI_Powered-gold)](https://github.com/skyasu2/openmanager-vibe-v5)

> 🎯 **AI 에이전트 기반 서버 관리** - MCP 엔진과 NPU로 구동되는 차세대 서버 모니터링 솔루션  
> 💻 **Vibe Coding**으로 제작된 100% AI 생성 애플리케이션

---

## 📖 프로젝트 개요

**OpenManager AI**는 **Vibe Coding** 방식으로 개발된 혁신적인 AI 에이전트 기반 서버 모니터링 솔루션입니다. MCP(Model Context Protocol) 엔진과 NPU(Neural Processing Unit)를 활용하여 LLM 비용 없이도 지능형 서버 관리를 제공합니다.

### 🤖 AI 에이전트 핵심 기능
- **자연어 AI 에이전트**: MCP 엔진 기반 패턴 매칭으로 자연어 질의 처리
- **지능형 분석 시스템**: 근본원인 분석기, 예측 알림, 솔루션 추천 엔진
- **자동 보고서 생성**: AI 기반 분석 보고서 자동 생성 및 권장사항 제공
- **경량화 AI**: LLM 없이도 NPU 기반으로 실시간 지능형 응답

### 🚀 Vibe Coding 개발 방식
- **100% AI 생성 코드**: Sonnet 3.7 + GPT-4o + Cursor AI 협업
- **AI 프롬프트 작성**: 프롬프트 자체도 AI로 생성하여 정확도 극대화
- **GitHub 자동 배포**: 코드 푸시 즉시 Vercel 자동 배포
- **완전 자동화 파이프라인**: 아이디어 → 코드 → 배포까지 AI 기반 워크플로우

---

## ✨ 주요 특징

🧠 **MCP 엔진 기반 AI** - Model Context Protocol로 경량화된 지능형 응답 시스템  
💬 **자연어 인터페이스** - "CPU 사용률이 높은 서버들 찾아줘" 같은 자연어 질의  
🔍 **근본원인 분석기** - AI 기반 자동 문제 진단 및 솔루션 추천  
📊 **예측 알림 시스템** - 과거 패턴 기반 장애 예측 및 사전 알림  
📋 **자동 보고서 생성** - 시간대별/서버별 맞춤형 AI 분석 리포트  
⚡ **NPU 활용 경량 AI** - LLM 비용 없는 실시간 AI 추론  
☁️ **확장 가능한 아키텍처** - 도메인 특화 AI 로직 추가 지원

---

## 🛠️ 기술 스택

### AI & Backend
- **AI 모델**: Sonnet 3.7, GPT-4o, Cursor AI
- **MCP 엔진**: 패턴 매칭 기반 의도 분류 및 엔티티 추출
- **NPU**: 경량화 AI 추론 (No LLM Cost)
- **Backend**: Next.js 15.1.8 API Routes

### Frontend
- **Framework**: Next.js 15.1.8 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS + CSS Modules
- **Icons**: Font Awesome 6 + Lucide React
- **Fonts**: Noto Sans KR (Korean Optimization)

### Development & Deployment
- **Development**: Cursor Editor + AI Prompt Engineering
- **Version Control**: Git + GitHub
- **Deployment**: Vercel (Auto Deploy)
- **CI/CD**: GitHub Actions + 자동 배포 파이프라인

---

## 🚀 빠른 시작

### 사전 요구사항
```bash
Node.js 18.0.0+
npm 9.0.0+
```

### 설치 및 실행
```bash
# 저장소 복제
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### 접속
- **✨ AI 에이전트 랜딩**: [http://localhost:3000](http://localhost:3000) - **OpenManager AI 메인 페이지**
- **🤖 AI 데모**: [http://localhost:3000/demo](http://localhost:3000/demo) - 실시간 AI 서버 모니터링 데모
- **📊 AI 대시보드**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) - 통합 AI 관리 대시보드

### ✅ API 엔드포인트
**AI 에이전트 기반 API 라우트:**

#### Core AI APIs
- **AI 쿼리**: [/api/mcp/enterprise-query](http://localhost:3000/api/mcp/enterprise-query) - MCP 엔진 기반 자연어 처리
- **서버 상태**: [/api/servers](http://localhost:3000/api/servers) - 실시간 서버 메트릭
- **AI 분석**: [/api/dashboard](http://localhost:3000/api/dashboard) - AI 기반 대시보드 데이터

#### System APIs
- **건강 상태**: [/api/health](http://localhost:3000/api/health) - 시스템 상태 체크
- **배포 상태**: [/api/deployment-status](http://localhost:3000/api/deployment-status) - 배포 상태 모니터링

---

## 🤖 AI 에이전트 데모

### ✨ OpenManager AI 랜딩 페이지
**URL**: `/` (메인 페이지)

#### AI 에이전트 주요 특징
- **🧠 NPU & MCP 엔진 메인 카드** - Neural Processing Unit과 Model Context Protocol 기반 AI 에이전트 소개
- **🤍 클린 화이트 디자인** - 흰색 배경의 전문적이고 깔끔한 카드 디자인
- **⚡ 인터랙티브 모달 시스템** - 메인 카드, AI 기능, Vibe Coding 상세 설명 모달
- **📱 완전 반응형** - 모바일부터 데스크톱까지 최적화
- **🎯 AI 중심 CTA** - "AI 대시보드 바로가기" 버튼

#### 클릭 가능한 인터랙티브 요소
- **메인 AI 에이전트 카드** - NPU/MCP 엔진 기술 상세 설명 모달
- **3개 핵심 기능 카드** - 자연어 AI, 지능형 분석, 자동 보고서 모달
- **Vibe Coding 뱃지** - 100% AI 생성 코드, 자동 배포 개발 과정 소개

### 🌟 AI 서버 모니터링 데모
**URL**: `/demo`

#### AI 기능
- **자연어 질의**: "CPU 사용률이 높은 서버들 찾아줘"
- **MCP 엔진 응답**: 패턴 매칭 기반 지능형 분석
- **실시간 AI 분석**: NPU 기반 경량 AI 추론
- **예측 알림**: 과거 패턴 기반 장애 예측

---

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── 📁 src/
│   ├── 📁 app/                  # Next.js App Router
│   │   ├── 📁 api/              # AI API 라우트
│   │   │   ├── 📁 mcp/          # 🆕 MCP 엔진 API
│   │   │   ├── 📁 dashboard/    # AI 대시보드 API
│   │   │   └── 📁 servers/      # 서버 상태 API
│   │   ├── 📁 demo/             # 🆕 AI 데모 페이지
│   │   ├── 📁 dashboard/        # AI 대시보드
│   │   ├── 📄 layout.tsx        # 루트 레이아웃
│   │   ├── 📄 page.tsx          # AI 에이전트 랜딩
│   │   └── 📄 globals.css       # 글로벌 스타일
│   ├── 📁 components/           # AI 컴포넌트
│   │   └── 📁 demo/             # 🆕 AI 데모 컴포넌트
│   ├── 📁 stores/               # 🆕 AI 상태 관리
│   ├── 📁 lib/                  # MCP 엔진 & NPU 유틸리티
│   └── 📁 types/                # AI 타입 정의
├── 📁 docs/                     # 📚 AI 프로젝트 문서
└── 📄 README.md                 # AI 에이전트 프로젝트 소개
```

---

## 🎨 AI 디자인 시스템

### AI 브랜드 컬러
```css
:root {
  --primary: #10b981;      /* AI Green */
  --secondary: #06b6d4;    /* MCP Blue */
  --accent: #3b82f6;       /* NPU Blue */
  --ai-gold: #ffd700;      /* Vibe Coding Gold */
}
```

### Clean White Cards & AI Theme
- **화이트 카드**: 흰색 배경 (`rgba(255, 255, 255, 0.95)`)의 전문적인 디자인
- **다크 텍스트**: 가독성이 뛰어난 다크 그레이 (`#1f2937`, `#6b7280`) 텍스트
- **그라데이션 배경**: 15초 순환 AI 테마 애니메이션 (green→blue→purple)
- **AI 중심 아이콘**: Brain, Microchip, Robot 등 (Primary Green 컬러)

---

## 🧠 AI 에이전트 아키텍처

### MCP 엔진 (Model Context Protocol)
```typescript
interface MCPEngine {
  patternMatching: (query: string) => Intent;
  entityExtraction: (text: string) => Entity[];
  contextualResponse: (intent: Intent, entities: Entity[]) => Response;
}
```

### NPU 기반 경량 AI
```typescript
interface NPUProcessor {
  lightweightInference: (input: ServerMetrics) => Prediction;
  realTimeAnalysis: (stream: MetricStream) => Analysis;
  noCostOperation: boolean; // LLM 비용 없음
}
```

---

## 📊 AI 기능 통계

### 개발 방식 (Vibe Coding)
- 🤖 **100% AI 생성 코드**: Sonnet 3.7 + GPT-4o + Cursor AI
- ⚡ **실시간 자동 배포**: GitHub → Vercel 자동 파이프라인  
- 🎯 **AI 프롬프트 정확도**: 프롬프트도 AI로 생성하여 극대화

### AI 에이전트 성능
- 🧠 **MCP 엔진**: 패턴 매칭 기반 의도 분류
- ⚡ **NPU 추론**: LLM 비용 없는 실시간 AI 처리
- 📊 **예측 정확도**: 과거 패턴 기반 장애 예측

---

## 🚀 Vibe Coding 개발 철학

### AI 협업 프로세스
1. **🧠 프롬프트 설계** - Claude/GPT로 구체적인 기능 명세서 작성
2. **🤖 Cursor AI 협업** - 실시간 코드 생성 및 리팩토링  
3. **🔄 반복 개선** - AI 피드백을 통한 지속적인 코드 최적화
4. **🚀 자동 배포** - GitHub Actions를 통한 완전 자동화

### 핵심 장점
- **MCP 활용 경량 AI**: LLM 없이도 지능형 응답
- **프롬프트도 AI 작성**: 정확도 극대화
- **GitHub 자동 배포**: 실시간 반영
- **완전 자동화**: 아이디어 → 코드 → 배포

---

## 🎯 미래 AI 로드맵

### 단기 목표 (Q1 2025)
- 🧠 **MCP 엔진 고도화**: 더 정교한 의도 분류
- 📊 **NPU 성능 최적화**: 실시간 추론 속도 향상
- 🔗 **API 확장**: 외부 모니터링 도구 연동

### 장기 비전 (2025)
- 🤖 **완전 자율 AI 관리**: 인간 개입 최소화
- 🌐 **멀티 클라우드 AI**: AWS, Azure, GCP 통합 AI 관리
- 📈 **AI 기반 용량 계획**: 예측 기반 자원 최적화

---

## 📄 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👨‍💻 제작자

**Vibe Coding**으로 AI와 협업하여 제작  
- 🧠 **AI 모델**: Sonnet 3.7, GPT-4o, Cursor AI
- 🎯 **개발 철학**: AI 기반 완전 자동화 개발
- 🚀 **프로젝트 비전**: 서버 관리의 AI 혁신

> "OpenManager AI의 AI 에이전트는 LLM 없이도 AI처럼 응답합니다.  
> 기존 서버 모니터링에 자연어 인터페이스, 예측, 분석 기능이 더해져  
> 운영자에게 '스마트한 두 번째 엔지니어'가 붙은 것과 같습니다."

**© 2025 OpenManager AI. Powered by Vibe Coding.**
