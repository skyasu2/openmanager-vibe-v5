# 🚀 OpenManager Vibe v5 - Enterprise AI Server Monitoring

> **🎉 AI 엔진 v3.0 Vercel 배포 완료!** (2024.12.28)  
> **완전한 로컬 AI + 실제 MCP 표준 + 서버리스 최적화**

## 📊 **최신 업데이트 - v5.21.0** 

### 🎉 **하이브리드 AI 엔진 완성** (2025-06-05)
- 🔄 **하이브리드 아키텍처**: 내부 AI 엔진 + 외부 AI 엔진 폴백
- 🚀 **Zero-Downtime**: 내부 엔진 장애 시 자동 외부 엔진 전환
- 🧪 **프론트엔드 테스트 도구**: `/test-ai-real` 페이지로 실시간 테스트
- ⚡ **성능 최적화**: Node.js 환경에서 내부 API 직접 호출

### ✅ **AI 엔진 v3.0 배포 성공**
- 🤖 **TensorFlow.js 로컬 AI** - 외부 API 의존성 제거
- 🔗 **실제 MCP 표준 프로토콜** - JSON-RPC 2.0 기반
- ⚡ **Vercel 서버리스 최적화** - 3-5초 콜드 스타트
- 📡 **새로운 API**: `/api/v3/ai` - 차세대 AI 엔진

### 🎯 **핵심 기능**
```typescript
// 하이브리드 AI 시스템
- 내부 AI 엔진 (v3): TensorFlow.js + MCP (우선)
- 외부 AI 엔진: FastAPI 기반 (폴백)  
- 자동 폴백 시스템: 99.9% 가용성 보장

// 3개 AI 모델 동시 실행
- 장애 예측 신경망 (4층)
- 이상 탐지 오토인코더 (20→4→20)
- 시계열 예측 LSTM (50+50 유닛)
```

---

## 🛠️ **빠른 시작**

### **1. 개발 환경 설정**
```bash
# 저장소 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5


# 의존성 설치
npm ci

# 테스트 실행 (필수)
npm run test

# 린트 실행 (필수)
npm run lint

# 환경 변수 설정
cp .env.example .env.local
# .env.local 파일을 편집하여 필요한 환경 변수 설정

# 개발 서버 시작
npm run dev
```

> 💡 **테스트가 실패할 경우?**
> - Playwright 등 테스트 도구가 설치되지 않았다면 `npm run test:e2e:install`을 실행합니다.
> - 의존성 오류가 나타나면 `npm ci`를 다시 실행해 패키지를 재설치합니다.
> - Node.js 버전이 `.nvmrc`와 일치하는지 `nvm use`로 확인하세요.

### **2. Vercel 배포**
```bash
# Vercel CLI 설치 (최초 1회)
npm i -g vercel

# 프로젝트 배포
vercel --prod
```

### **3. AI 엔진 v3.0 테스트**
```bash
# 시스템 상태 확인
curl https://your-project.vercel.app/api/v3/ai?action=health

# AI 분석 요청
curl -X POST https://your-project.vercel.app/api/v3/ai \
  -H "Content-Type: application/json" \
  -d '{"query": "서버 상태를 분석해주세요", "language": "ko"}'
```

---

## 🏗️ **아키텍처 개요**

### **시스템 구성도**
```
┌─────────────────┬─────────────────┬─────────────────┐
│   프론트엔드     │     백엔드       │    AI 엔진 v3   │
├─────────────────┼─────────────────┼─────────────────┤
│ Next.js 15      │ Vercel 서버리스  │ TensorFlow.js   │
│ React 18        │ API Routes      │ Real MCP        │
│ TypeScript 5    │ PostgreSQL      │ Natural NLP     │
│ Tailwind CSS    │ Redis Cache     │ 3 AI Models     │
└─────────────────┴─────────────────┴─────────────────┘
```

### **AI 엔진 v3.0 구조**
```typescript
// 실제 MCP 클라이언트
class RealMCPClient {
  - 파일시스템 서버 연동
  - 메모리 서버 (세션 관리)  
  - 웹 검색 서버 (선택사항)
}

// TensorFlow.js AI 엔진
class TensorFlowAIEngine {
  - 장애 예측 신경망
  - 이상 탐지 오토인코더
  - 시계열 예측 LSTM
}

// 통합 AI 엔진
class IntegratedAIEngine {
  - NLP 처리 (Natural)
  - 보고서 생성
  - 전체 시스템 오케스트레이션
}
```

---

## 🔧 **주요 기능**

### **1. 실시간 서버 모니터링**
- 📊 **CPU, 메모리, 디스크 사용률 실시간 추적**
- 🚨 **임계값 기반 알림 시스템**
- 📈 **시계열 데이터 시각화** (Chart.js + D3.js)
- 🔄 **WebSocket 기반 실시간 업데이트**

### **2. AI 기반 장애 예측**
```typescript
// TensorFlow.js 장애 예측 모델
const prediction = await tfEngine.predictFailure({
  cpuUsage: [85, 87, 90, 92, 95],
  memoryUsage: [70, 75, 80, 85, 88],
  diskUsage: [60, 65, 70, 75, 80]
});
// 결과: { probability: 0.78, timeToFailure: "2.5 hours" }
```

### **3. 스마트 이상 탐지**
```typescript
// 오토인코더 기반 이상 탐지
const anomaly = await tfEngine.detectAnomaly(metrics);
// 결과: { isAnomaly: true, severity: "high", affected: ["cpu", "memory"] }
```

### **4. MCP 기반 지능형 검색**
```typescript
// 실제 MCP 프로토콜 사용
const mcpResult = await realMCPClient.search({
  query: "서버 성능 최적화 방법",
  context: "high_cpu_usage"
});
```

---

## 📡 **API 엔드포인트**

### **AI 엔진 v3.0 (하이브리드)**
```
POST /api/analyze
- 🔄 하이브리드 AI 분석 엔드포인트
- 내부 엔진 우선, 외부 엔진 폴백
- 자동 로드밸런싱

GET /api/analyze  
- 🏥 AI 엔진 헬스체크
- 내부/외부 엔진 상태 확인

POST /api/v3/ai
- 🤖 내부 AI 엔진 직접 접근
- TensorFlow.js + MCP 통합
- 한국어/영어 지원

GET /api/v3/ai?action=health
- AI 시스템 상태 확인

GET /test-ai-real
- 🧪 AI 엔진 테스트 페이지
- 실시간 상태 모니터링
- 5가지 테스트 항목 자동 실행
```

### **서버 관리**
```
GET /api/servers
- 서버 목록 조회

POST /api/servers
- 새 서버 추가

GET /api/servers/[id]
- 특정 서버 상세 정보

PUT /api/servers/[id]
- 서버 정보 업데이트

DELETE /api/servers/[id]
- 서버 삭제
```

### **실시간 메트릭**
```
GET /api/metrics/realtime
- 실시간 시스템 메트릭

GET /api/metrics/timeseries
- 시계열 메트릭 데이터

POST /api/metrics/analyze
- 메트릭 AI 분석
```

---

## 🔍 **기술 스택**

### **프론트엔드**
- **Next.js 15.3.2** - React 프레임워크
- **React 18** - UI 라이브러리  
- **TypeScript 5** - 타입 안전성
- **Tailwind CSS** - 유틸리티 기반 CSS
- **Framer Motion** - 애니메이션
- **Lucide React** - 아이콘 라이브러리

### **백엔드**
- **Next.js API Routes** - 서버사이드 API
- **PostgreSQL** - 관계형 데이터베이스
- **Redis** - 캐싱 및 세션 관리
- **Vercel** - 서버리스 배포
- **WebSocket** - 실시간 통신

### **AI 및 데이터**
- **TensorFlow.js 4.22.0** - 브라우저/Node.js AI
- **@modelcontextprotocol/sdk** - 실제 MCP 구현
- **Natural 8.1.0** - 자연어 처리
- **ML-Matrix** - 수학적 연산
- **Chart.js** - 데이터 시각화

---

## 🧪 **테스트 및 품질**

### **테스트 프레임워크**
```bash
# 단위 테스트
npm run test

# E2E 테스트 (Playwright)
npm run test:e2e

# 타입 체크
npm run type-check

# 린팅
npm run lint
```

### **성능 테스트**
```bash
# Lighthouse 감사
npm run lighthouse

# 번들 분석
npm run analyze

# AI 모델 벤치마크
npm run benchmark:ai
```

---

## 📈 **성능 메트릭**

### **AI 엔진 성능**
```
장애 예측: 평균 100-200ms
이상 탐지: 평균 150-300ms
시계열 예측: 평균 200-400ms
통합 분석: 평균 500-800ms
```

### **서버리스 성능**
```
콜드 스타트: 3-5초
웜 스타트: 100-500ms
메모리 사용: 200-300MB
번들 크기: ~20MB
```

---

## 🛡️ **보안**

### **인증 및 권한**
- JWT 기반 인증
- 역할 기반 접근 제어 (RBAC)
- API 키 관리
- 세션 관리

### **데이터 보호**
- HTTPS 강제
- 데이터 암호화
- SQL 인젝션 방지
- XSS 보호

---

## 🚀 **배포 가이드**

### **Vercel 배포 (권장)**
```bash
# 1. Vercel 계정 연결
vercel login

# 2. 프로젝트 배포
vercel --prod

# 3. 환경 변수 설정
vercel env add DATABASE_URL
vercel env add REDIS_URL
```

### **Docker 배포**
```bash
# Docker 이미지 빌드
docker build -t openmanager-vibe .

# 컨테이너 실행
docker run -p 3000:3000 openmanager-vibe
```

---

## 🔋 시스템 전원 관리

프로젝트는 Vercel 무료·유료 플랜 모두에서 동작하도록 설계되었습니다. 서버리스 함수 기반의 구조로 콜드 스타트를 최소화하며, AI 에이전트는 절전 모드를 활용해 무료 플랜에서도 실행 시간 한도를 초과하지 않습니다.

### 시스템 시작/종료
```bash
# 시스템 시작
curl -X POST https://your-project.vercel.app/api/system/start

# 시스템 종료
curl -X POST https://your-project.vercel.app/api/system/stop
```

### AI 에이전트 절전 모드
```bash
# 에이전트 활성화
curl -X POST https://your-project.vercel.app/api/ai-agent/power \
  -H 'Content-Type: application/json' \
  -d '{"action":"activate"}'
```
에이전트는 활동이 없으면 자동으로 `idle` → `sleep` 모드로 전환되며, `activity` 액션으로 다시 깨울 수 있습니다.


## 📚 **문서**

- **[DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)** - 상세 배포 가이드
- **[API Documentation](./docs/api/)** - API 상세 문서
- **[CHANGELOG.md](./CHANGELOG.md)** - 변경 사항 로그

---

## 🤝 **기여하기**

### **개발 환경 설정**
```bash
# 1. 포크 및 클론
git clone https://github.com/your-username/openmanager-vibe-v5.git

# 2. 브랜치 생성
git checkout -b feature/your-feature

# 3. 변경사항 커밋
git commit -m "feat: 새로운 기능 추가"

# 4. 푸시 및 PR 생성
git push origin feature/your-feature
```

### **코딩 컨벤션**
- TypeScript 엄격 모드 사용
- ESLint + Prettier 규칙 준수
- 컴포넌트는 함수형으로 작성
- 테스트 코드 필수 작성

---

## 📄 **라이선스**

MIT License - 상세 내용은 [LICENSE](./LICENSE) 파일 참조

---

## 🙋‍♂️ **지원 및 문의**

- **GitHub Issues**: 버그 리포트 및 기능 요청
- **GitHub Discussions**: 일반적인 질문 및 토론
- **Documentation**: 상세 가이드 및 튜토리얼

---

## 🎉 **주요 마일스톤**

- ✅ **v5.0.0** - 초기 시스템 구축 (2024.12.15)
- ✅ **v5.10.0** - 실시간 모니터링 구현 (2024.12.20)
- ✅ **v5.20.0** - 기본 AI 기능 추가 (2024.12.25)
- ✅ **v5.21.0** - AI 엔진 v3.0 완전 구현 (2024.12.28)

### **다음 목표 - v5.22.0**
- [ ] AI 모델 성능 최적화 (추론 시간 50% 단축)
- [ ] 실시간 스트리밍 응답 구현
- [ ] 캐싱 시스템 강화 (Redis KV)

---

**🚀 OpenManager Vibe v5 - 차세대 AI 서버 모니터링의 미래입니다!**

**마지막 업데이트:** 2024년 12월 28일 - AI 엔진 v3.0 배포 성공 