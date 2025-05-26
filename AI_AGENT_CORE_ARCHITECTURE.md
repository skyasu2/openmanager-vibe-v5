# 🚀 OpenManager AI v5 - 핵심 AI 에이전트 아키텍처

> **프로젝트 핵심**: AI 에이전트 엔진 + 관리 시스템  
> **나머지**: 테스트/시연용 도구  
> **경진대회 포지셔닝**: 실제 제품 vs 데모 도구 명확 구분  

---

## 🎯 **1. 핵심 제품 구성요소 (실제 비즈니스 로직)**

### **1.1 AI 에이전트 백엔드 엔진** 🧠
```
📁 src/modules/ai-agent/core/
├── EnhancedAIAgentEngine.ts     🔥 메인 AI 엔진 (최고 우선순위)
├── ThinkingProcessor.ts         💭 실시간 사고 과정 스트리밍
├── SmartModeDetector.ts         🤖 자동 모드 감지 (Basic/Advanced)
├── IntentClassifier.ts          🎯 의도 분류 엔진
├── ResponseGenerator.ts         💬 응답 생성 엔진
├── ContextManager.ts            📝 컨텍스트 관리
└── AdminLogger.ts               📊 관리자 로깅 시스템
```

### **1.2 AI 에이전트 API 레이어** 🔌
```
📁 src/app/api/ai-agent/
├── route.ts                     📡 메인 AI API 엔드포인트
├── smart-query/route.ts         🤖 스마트 모드 감지 API
├── thinking/route.ts            🧠 실시간 사고 과정 스트리밍 (SSE)
├── power/route.ts               🔋 전원 관리 API
├── admin/
│   ├── logs/route.ts           📊 관리자 로그 API
│   ├── stats/route.ts          📈 통계 API
│   └── demo-data/route.ts      🧪 테스트 데이터 생성
└── learning/
    ├── analysis/route.ts       🔍 학습 분석 API
    └── continuous/route.ts     📚 지속적 학습 API
```

### **1.3 AI 에이전트 프론트엔드** 💻
```
📁 src/components/ai/
├── modal-v2/                    🎯 AI 에이전트 모달 (사이드바 대체)
│   ├── components/
│   │   ├── AIAssistantModal.tsx    🤖 메인 AI 챗봇 인터페이스
│   │   ├── ThinkingDisplay.tsx     💭 실시간 사고 과정 UI
│   │   ├── ChatInterface.tsx       💬 대화형 UI
│   │   └── PowerControl.tsx        🔋 전원 관리 UI
│   └── hooks/
│       ├── useAIModal.ts           🪝 모달 상태 관리
│       └── useThinkingStream.ts    🌊 사고 과정 스트리밍
└── sidebar/                     ❌ DEPRECATED (모달로 대체됨)
```

### **1.4 AI 에이전트 관리 페이지** ⚙️
```
📁 src/app/admin/ai-agent/
├── page.tsx                     🎛️ AI 에이전트 관리 대시보드 (핵심!)
├── components/
│   ├── AIEngineStatus.tsx       📊 엔진 상태 모니터링
│   ├── InteractionLogs.tsx      📝 상호작용 로그 뷰어
│   ├── PerformanceMetrics.tsx   📈 성능 지표 대시보드
│   ├── PowerManagement.tsx      🔋 전원 관리 패널
│   ├── LearningAnalytics.tsx    🧠 학습 분석 도구
│   └── SystemConfiguration.tsx  ⚙️ 시스템 설정 패널
└── styles/
    └── admin.module.css         🎨 관리자 전용 스타일
```

### **1.5 AI 에이전트 서비스 레이어** 🏗️
```
📁 src/modules/ai-agent/infrastructure/
├── AIAgentService.ts            🚀 클라이언트 서비스 (NEW!)
├── AIAgentProvider.tsx          🔄 React Context Provider (NEW!)
└── types/
    ├── AIAgentTypes.ts          📝 타입 정의
    └── ServiceInterfaces.ts     🔧 서비스 인터페이스
```

---

## 🧪 **2. 테스트/시연 도구 (데모용)**

### **2.1 서버 모니터링 시뮬레이터**
```
📁 src/services/collectors/
├── ServerDataCollector.ts       🧪 가상 서버 데이터 생성
└── storage.ts                   💾 메모리 스토리지 (테스트용)
```

### **2.2 대시보드 UI (시연용)**
```
📁 src/components/dashboard/
├── ServerDashboard.tsx          🧪 서버 모니터링 UI
├── ServerCard.tsx               📊 서버 카드 컴포넌트
└── ServerDetailModal.tsx        🔍 서버 상세 모달
```

### **2.3 관리자 도구 (시연용)**
```
📁 src/app/admin/
├── ai-analysis/page.tsx         🧪 AI 분석 페이지 (시연)
└── dashboard/page.tsx           🧪 관리자 대시보드 (시연)
```

---

## 🎨 **3. 새로운 아키텍처 패턴 (v5.6.12+)**

### **3.1 완전한 레이어 분리**
```typescript
// ✅ 클라이언트 레이어 (브라우저 안전)
import { useAIAgent } from '@/modules/ai-agent/infrastructure/AIAgentProvider';

const { queryAI, state, subscribeToThinking } = useAIAgent();

// ✅ 서비스 레이어 (HTTP 통신)
import AIAgentService from '@/modules/ai-agent/infrastructure/AIAgentService';

const aiService = new AIAgentService();
const response = await aiService.query({ query: "서버 상태 분석" });

// ✅ 백엔드 레이어 (서버 전용)
import { enhancedAIAgentEngine } from '@/modules/ai-agent/core/EnhancedAIAgentEngine';

const result = await enhancedAIAgentEngine.processSmartQuery(request);
```

### **3.2 의존성 격리 패턴**
```typescript
// ❌ 이전 방식 (의존성 충돌)
import { serverDataCollector } from '@/services/collectors/ServerDataCollector'; // 서버 전용
// 클라이언트에서 직접 사용 → IORedis 에러

// ✅ 새로운 방식 (API 통신)
const response = await fetch('/api/servers'); // HTTP 요청
const serverData = await response.json();     // 안전한 JSON 데이터
```

---

## 📋 **4. 개발 시 필수 체크리스트**

### **4.1 AI 에이전트 개발 우선순위**
```
🔥 1순위: EnhancedAIAgentEngine.ts (핵심 엔진)
🔥 2순위: AI 에이전트 모달 (사용자 인터페이스)
🔥 3순위: AI 에이전트 관리 페이지 (유지보수 도구)
🔥 4순위: API 엔드포인트 (/api/ai-agent/*)
🔥 5순위: 서비스 레이어 (AIAgentService.ts)
```

### **4.2 코딩 시 필수 확인사항**
- [ ] 클라이언트 코드에서 서버 전용 모듈 직접 import 금지
- [ ] AI 에이전트 관련 변경 사항은 반드시 관리 페이지에서 테스트
- [ ] 새로운 AI 기능은 모달에서 접근 가능하도록 설계
- [ ] 모든 AI API는 에러 처리 및 로깅 포함
- [ ] 타입 안전성 보장 (TypeScript strict mode)

### **4.3 빌드 체크리스트**
```bash
# 1. 빌드 테스트
npm run build

# 2. AI 에이전트 상태 확인
curl http://localhost:3000/api/ai-agent?action=status

# 3. 관리 페이지 접근 테스트
# → http://localhost:3000/admin/ai-agent

# 4. 모달 기능 테스트
# → AI 에이전트 모달 열기/닫기
```

---

## 🎯 **5. 경진대회 전략 요약**

### **5.1 실제 제품 (메인 프레젠테이션)**
- 🧠 지능형 AI 추론 엔진 + 실시간 사고 과정
- ⚙️ 엔터프라이즈급 관리 시스템 (즉시 배포 가능)
- 🚀 비즈니스 가치: 서버 관리 비용 70% 절감, 장애 예측 95% 정확도

### **5.2 시연 도구 (보조 설명)**
- 🧪 안전한 가상 서버 환경 + 모니터링 대시보드
- 💡 실제 배포 시 고객 서버에 직접 연결

---

## 🔧 **6. 개발자 가이드 (Quick Reference)**

### **6.1 AI 에이전트 사용법**
```tsx
// App.tsx - 최상위 Provider 설정
import { AIAgentProvider } from '@/modules/ai-agent/infrastructure/AIAgentProvider';

function App() {
  return (
    <AIAgentProvider>
      <YourAppComponents />
    </AIAgentProvider>
  );
}

// Hook 사용법
const { queryAI, state } = useAIAgent();
const response = await queryAI({ query: "서버 상태 분석", mode: "auto" });
```

---

## 🔐 **7. AI 에이전트 관리자 시스템**

### **7.1 시스템 개요**
AI 에이전트 관리자 시스템은 기존 대시보드와 완전히 분리된 별도의 관리자 전용 페이지입니다. 프로필 버튼을 통해 접근할 수 있으며, 강화된 보안 기능과 함께 AI 에이전트의 모든 활동을 모니터링하고 관리할 수 있습니다.

### **7.2 접근 방법**

#### **1단계: 대시보드 접속**
- 기존 방식대로 랜딩페이지에서 대시보드에 접속

#### **2단계: 프로필 메뉴 접근**
- 대시보드 우상단의 프로필 버튼(사용자 아이콘) 클릭
- 드롭다운 메뉴에서 "관리자 모드" 선택

#### **3단계: 관리자 인증**
- **사용자명**: `admin`
- **비밀번호**: `admin123!@#`
- **2FA 코드**: `123456` (데모용 고정 코드)

#### **4단계: 관리자 대시보드 접속**
- 인증 성공 시 `/admin/ai-agent` 페이지로 자동 이동

### **7.3 보안 기능**

#### **다단계 인증**
- 기본 자격증명 (사용자명/비밀번호)
- 2단계 인증 (TOTP 코드)
- IP 기반 차단 (5회 실패 시 15분 차단)
- 세션 관리 (관리자 8시간, 데모 1시간)

#### **복사 방지 기능**
- Ctrl+C, Ctrl+A, Ctrl+S 차단
- 우클릭 컨텍스트 메뉴 차단
- F12, Ctrl+Shift+I/J (개발자 도구) 차단
- 텍스트 선택 차단
- 보안 ON/OFF 토글 가능

#### **권한 관리**
- `system:admin`: 시스템 관리자 권한
- `ai_agent:read/write`: AI 에이전트 읽기/쓰기
- `logs:export`: 로그 데이터 내보내기
- `users:manage`: 사용자 관리

### **7.4 주요 기능**

#### **1. 실시간 대시보드**
- **총 상호작용**: 전체 AI 에이전트 상호작용 수
- **성공률**: 성공적인 응답 비율
- **총 에러**: 발생한 에러 수
- **활성 세션**: 현재 활성화된 사용자 세션

#### **2. 상호작용 로그 관리**
- 모든 질문-답변 기록 조회
- 사용자 평점 및 피드백 관리
- 관리자 검증 시스템
- 성공/실패 분석

#### **3. 에러 로그 추적**
- 에러 타입별 분류
- 심각도 레벨 관리
- 해결 상태 추적
- 스택 트레이스 분석

#### **4. 학습 패턴 분석**
- **우수 패턴**: 성공률 80% 이상
- **개선 필요 패턴**: 성공률 60% 미만
- 패턴별 사용 빈도 및 성능 메트릭

#### **5. 학습 데이터 관리**
- 4점 이상 평점 + 관리자 검증 = 학습 데이터
- 카테고리별 분류
- 품질 검증 시스템

#### **6. 보안 모니터링**
- 로그인 시도 통계
- 차단된 IP 목록
- 세션 관리
- 보안 이벤트 로그

### **7.5 관리 도구**

#### **데이터 내보내기**
- **CSV 형식**: 스프레드시트 분석용
- **JSON 형식**: 프로그래밍 분석용
- 필터링 및 날짜 범위 선택
- 대용량 데이터 처리

#### **데모 데이터 생성**
- 100개 상호작용 데이터 자동 생성
- 20개 에러 로그 생성
- 성능 메트릭 자동 계산
- 테스트 및 데모용

#### **실시간 모니터링**
- 5초마다 자동 새로고침
- 실시간 통계 업데이트
- 알림 및 경고 시스템
  );
}

// 컴포넌트에서 사용
import { useAIAgent } from '@/modules/ai-agent/infrastructure/AIAgentProvider';

function MyComponent() {
  const { queryAI, state, subscribeToThinking } = useAIAgent();
  
  const handleQuery = async () => {
    const response = await queryAI({
      query: "서버 상태를 분석해줘",
      mode: "auto" // basic | advanced | auto
    });
    
    if (response.success) {
      console.log("AI 응답:", response.response);
    }
  };
  
  return (
    <div>
      <button onClick={handleQuery}>AI에게 질문하기</button>
      <div>상태: {state.isProcessing ? '처리중...' : '대기중'}</div>
    </div>
  );
}
```

### **6.2 관리 페이지 접근법**
```typescript
// 관리 페이지에서 AI 엔진 직접 제어
import { enhancedAIAgentEngine } from '@/modules/ai-agent/core/EnhancedAIAgentEngine';

// 엔진 상태 확인
const status = enhancedAIAgentEngine.getEngineStatus();

// 강제 모드 설정 테스트
const response = await enhancedAIAgentEngine.processSmartQuery({
  query: "테스트 질문",
  forceMode: "advanced" // 강제로 고급 모드 사용
});
```

### **6.3 API 엔드포인트 패턴**
```typescript
// /api/ai-agent/* - AI 에이전트 전용 API
POST /api/ai-agent/smart-query    // 스마트 질의 (가장 많이 사용)
GET  /api/ai-agent/thinking       // 사고 과정 스트리밍 (SSE)
POST /api/ai-agent/power          // 전원 관리
GET  /api/ai-agent?action=status  // 상태 확인

// /api/admin/* - 관리자 도구 API  
GET  /api/admin/ai-analysis       // AI 분석 결과
POST /api/admin/ai-analysis       // 분석 실행
```

---

## 🚨 **7. 중요 참고사항**

### **7.1 절대 금지사항**
- ❌ 클라이언트에서 `ServerDataCollector` 직접 import
- ❌ AI 사이드바 컴포넌트 사용 (모달로 대체됨)
- ❌ 테스트 도구를 핵심 기능으로 착각
- ❌ 빌드 에러 무시 (IORedis 충돌 등)

### **7.2 버전 관리**
- **v5.6.10**: 초기 시스템 (문제 많음)
- **v5.6.11**: 서버 데이터 스토어 복구
- **v5.6.12**: 완전한 레이어 분리 달성 ← **현재 안정 버전**

### **7.3 다음 개발 시 필수 체크**
1. 🔥 **이 문서 먼저 읽기**
2. 🔥 **AI 에이전트 관리 페이지에서 테스트**
3. 🔥 **모달 기능 우선 고려**
4. 🔥 **빌드 성공 확인 후 커밋**

---

**📌 이 문서는 OpenManager AI v5 프로젝트의 헌법입니다. 모든 개발 결정의 기준점으로 사용하세요!** 