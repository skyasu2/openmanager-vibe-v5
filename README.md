# 🤖 OpenManager Vibe v5 - AI-Powered Server Monitoring Platform

## 🚀 **프로젝트 개요**

OpenManager Vibe v5는 **AI 기반 실시간 서버 모니터링 플랫폼**으로, 4종의 AI 엔진을 통합하여 서버 장애를 예측하고 분석하는 차세대 관리 도구입니다.

### ✨ **핵심 기능**

#### **🧠 AI 엔진 통합 시스템 (v5.42.4)**

- **🌐 MCP (Model Context Protocol)**: Render 원격 + 로컬 자동 스위치
- **📚 RAG (Vector Search)**: 메모리 모드 + pgvector 지원
- **🔬 TensorFlow**: 동적 로더 + Vercel 호환
- **🤖 Google AI**: Gemini 모델 + 실시간 분석

#### **📊 실시간 모니터링**

- **30분 연속 장애 시뮬레이션**: 시작 즉시 장애 발생
- **12종 장애 유형**: 네트워크부터 보안까지 포괄
- **24시간 사전 데이터 연계**: 96가지 조합 패턴
- **자동 상태 분포**: Critical ~10%, Warning ~20%

#### **🎯 스마트 분석**

- **진정한 AI 추론**: 시나리오 사전 노출 없이 순수 분석
- **하이브리드 접근**: 다중 AI 엔진 협업
- **실시간 대화**: 자연어 질의응답 시스템
- **자동 보고서**: 장애 원인 분석 및 대응 가이드

---

## 🛠️ **기술 스택**

### **Frontend**

- **Next.js 15** (App Router)
- **TypeScript** + **Tailwind CSS**
- **Recharts** (데이터 시각화)
- **Storybook 8.6.14** (18개 컴포넌트 문서화)

### **Backend & AI**

- **4종 AI 엔진 통합**:
  - MCP (Render Remote + Local)
  - RAG (Memory + pgvector)
  - TensorFlow (동적 로더)
  - Google AI (Gemini)
- **Supabase** (PostgreSQL + pgvector)
- **Upstash Redis** (캐싱)
- **WebSocket** (실시간 통신)

### **DevOps & Deployment**

- **Vercel** (메인 배포)
- **Render** (MCP 서버)
- **GitHub Actions** (CI/CD)
- **Docker** (컨테이너화)

---

## 🚀 **빠른 시작**

### **1. 환경 설정**

```bash
# 저장소 클론
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 환경변수 설정
cp vercel.env.template .env.local
```

### **2. 환경변수 설정**

```bash
# .env.local
RAG_FORCE_MEMORY=true
MCP_REMOTE_URL=https://openmanager-vibe-v5.onrender.com
MCP_LOCAL_URL=http://localhost:3100
GOOGLE_AI_API_KEY=your_gemini_api_key
```

### **3. 개발 서버 실행**

```bash
# 개발 서버 (포트 3000)
npm run dev

# Storybook (포트 6006/6007)
npm run storybook:dev

# AI Health 체크
curl http://localhost:3000/api/ai/health
```

---

## 📊 **AI 엔진 상태 확인**

### **Health Endpoint**

```bash
GET /api/ai/health
```

### **예상 응답**

```json
{
  "mcp": { "status": "online", "latency": 155 },
  "rag": { "status": "memory_mode", "documents": 3 },
  "tensorflow": { "status": "loaded", "backend": "cpu" },
  "google_ai": { "status": "ready", "model": "gemini-pro" },
  "timestamp": "2025-06-11T15:30:00Z",
  "overall_status": "healthy"
}
```

---

## 🧪 **테스트 & 검증**

```bash
# 타입 체크
npm run type-check

# 단위 테스트 (34/35 통과)
npm run test:unit

# 통합 테스트
npm run test:integration

# 빌드 검증 (88개 정적 페이지)
npm run build

# 전체 검증 스크립트
npm run validate:quick
```

---

## 📚 **문서 & 스토리북**

- **[시스템 설계 문서](./SYSTEM_DESIGN.md)**: AI 엔진 아키텍처 상세
- **[변경 이력](./CHANGELOG.md)**: 버전별 개선사항
- **[리팩토링 가이드](./REFACTORING_GUIDE.md)**: 코드 품질 관리
- **[Storybook](http://localhost:6006)**: 18개 컴포넌트 문서화

---

## 🎯 **핵심 특징**

### **🧠 진정한 AI 분석**

- ✅ **연극이 아닌 실제**: AI가 시나리오를 모른 채 순수 분석
- ✅ **다중 엔진 협업**: MCP/RAG/TensorFlow/Google AI 통합
- ✅ **Graceful Degradation**: 개별 엔진 실패 시에도 안정성 보장

### **📊 고도화된 데이터 생성**

- ✅ **30분 연속 장애**: 복구 없는 지속적 문제 상황
- ✅ **12×8 조합 매트릭스**: 96가지 다양한 장애 패턴
- ✅ **자연스러운 분포**: Critical/Warning/Normal 비율 자동 조정

### **🛡️ 엔터프라이즈급 안정성**

- ✅ **환경별 최적화**: 로컬/Vercel/Render 자동 적응
- ✅ **모듈 선택적 로드**: 의존성 실패 시 graceful skip
- ✅ **실시간 헬스체크**: 4종 AI 엔진 통합 모니터링

---

## 🤝 **기여하기**

1. **Fork** 저장소
2. **Feature Branch** 생성 (`git checkout -b feature/amazing-feature`)
3. **변경사항 커밋** (`git commit -m 'Add amazing feature'`)
4. **Branch Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

---

## 📄 **라이선스**

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 👥 **개발팀**

**OpenManager Vibe v5 개발팀**  
📧 **연락처**: [openmanager@vibe.com](mailto:openmanager@vibe.com)  
🌐 **웹사이트**: [https://openmanager-vibe-v5.vercel.app](https://openmanager-vibe-v5.vercel.app)

---

_🚀 AI-Powered Server Monitoring의 새로운 표준을 제시합니다!_
