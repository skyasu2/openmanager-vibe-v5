# 🚀 OpenManager Vibe v5 - AI-Powered Server Management Platform

<div align="center">

![Version](https://img.shields.io/badge/version-5.41.4-blue.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-brightgreen.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-Latest-blue.svg)
![AI](https://img.shields.io/badge/AI-100%25%20Active-purple.svg)

**🌐 [Live Demo](https://openmanager-vibe-v5.vercel.app)** | **📊 [Dashboard](https://openmanager-vibe-v5.vercel.app/dashboard)** | **🧠 [AI Admin](https://openmanager-vibe-v5.vercel.app/admin)**

</div>

## 🎉 **최신 업데이트 (2025.06.10)**

### 🏗️ **프로젝트 구조 정리 완료!**

- ✅ **심볼릭 링크 제거**: 실제 경로 기반 구조로 전환 완료
- 📁 **논리적 폴더 구조**: development/, infra/, docs/ 체계적 분리
- 🔧 **90개 스크립트 경로** 수정: `scripts/` → `development/scripts/`
- ✅ **크로스 플랫폼 호환성**: Windows/Linux/macOS 완전 지원
- 🧪 **전체 검증 완료**: TypeScript, ESLint, 테스트, 빌드 모두 성공

## 🌟 **주요 기능**

### 🧠 **AI-Powered Management**

- **7개 메뉴 AI 사이드바**: 전문화된 AI 기능별 메뉴 구성
  1. 💬 **자연어 질의**: 동적 질문 카드 + AI 채팅 시스템
  2. 📋 **장애 보고서**: 자동 생성 보고서 및 대응 가이드
  3. 🔍 **이상감지/예측**: AI 기반 시스템 모니터링 및 예측 분석
  4. 📝 **로그 검색**: 시스템 로그 검색 및 분석 도구
  5. 💬 **슬랙 알림**: 자동화된 알림 및 팀 협업 시스템
  6. ⚙️ **관리자/학습**: AI 학습 데이터 관리 및 시스템 설정
  7. 🤖 **AI 설정**: 멀티 AI 모델 설정 및 API 통합 관리

### 🔧 **실제 구현된 AI 엔진 시스템**

#### **1. UnifiedAIEngine (자체 개발 통합 AI 엔진)**

- **Google AI Studio (Gemini) 베타 버전**: 실제 연동 완료
- **RAG 엔진**: 로컬 벡터 DB 기반 백업 시스템
- **폴백 시스템**: Google AI → MCP → RAG → 직접분석 → 기본분석

#### **2. MCP 시스템 구분**

- **개발용 MCP**: Cursor IDE 환경에서 바이브 코딩용 (.cursor/mcp.json의 6개 서버)
- **서비스용 MCP**: UnifiedAIEngine 내부의 AI 추론용 MCP 시스템

#### **3. 동적 질문 시스템**

- 실시간 메트릭 분석으로 중요도별 질문 자동 생성
- 컴팩트 UI로 7개 메뉴 최적화 (p-2.5, gap-0.5)
- 30초 자동 갱신

### 📊 **Advanced Monitoring**

- **실시간 대시보드**: WebSocket 기반 실시간 업데이트
- **Vector Database**: 고급 데이터 분석 및 검색
- **패턴 분석**: 이상 징후 자동 탐지
- **예측 분석**: 미래 리소스 수요 예측

### 🔧 **Enterprise Features**

- **멀티 서버 관리**: 중앙집중식 서버 관리
- **자동화**: 스케일링 및 복구 자동화
- **보안**: 엔터프라이즈급 보안 기능
- **통합**: Prometheus, Redis, Supabase 통합

---

## 📈 **개발 성과 (2025.05.25 - 2025.06.10)**

### 🚀 **핵심 성과**

- **개발 기간**: 20일 (1인 개발)
- **구현 완료**: Google AI 베타, MCP 기반 AI 엔진, RAG 시스템
- **테스트 통과**: 18개 테스트 (11개 단위 + 7개 통합)
- **Next.js 빌드**: 132개 페이지 성공적 생성

### 🛠️ **기술 스택**

- **Frontend**: Next.js 15.3.3, TypeScript, Tailwind CSS
- **AI 엔진**: Google AI Studio (Gemini), RAG, MCP
- **백엔드**: Supabase, Redis, Prometheus
- **개발 도구**: Cursor IDE, MCP 서버 6개

---

## 📚 **문서 구조**

프로젝트 문서가 체계적으로 정리되어 있습니다:

### **📁 docs/ 디렉토리 구조**

```
docs/                    # 📚 통합 문서 허브
├── development/         # 개발 관련 문서 (심볼릭 링크 → development/docs/)
├── infra/              # 인프라 관련 문서 (심볼릭 링크 → infra/docs/)
└── archive.backup/     # 이전 문서 백업
```

---

## 🚀 **시작하기**

### **1. 개발 환경 설정**

```bash
# 저장소 클론
git clone https://github.com/your-repo/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env.local
# Google AI API 키 설정 필요

# 개발 서버 시작
npm run dev
```

### **2. 핵심 스크립트**

```bash
# 전체 검증
npm run validate:all

# AI 시스템 상태 확인
npm run mcp:status

# 메트릭 생성
npm run generate:metrics

# 테스트 실행
npm run test:unit
npm run test:integration
```

### **3. AI 기능 활성화**

- 🔓 원클릭 활성화: 비밀번호 없이 즉시 AI 모드 활성화
- Google AI Studio API 키 설정 후 전체 AI 기능 사용 가능

---

_최종 업데이트: 2025년 6월 10일_
