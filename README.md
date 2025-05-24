# 🚀 OpenManager AI - 차세대 서버 모니터링 플랫폼

**AI 기반 실시간 서버 모니터링 및 분석 시스템**

[![Next.js](https://img.shields.io/badge/Next.js-15.1.8-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0+-06B6D4?logo=tailwindcss)](https://tailwindcss.com/)
[![MCP](https://img.shields.io/badge/MCP-Engine-purple)](https://github.com/your-repo)

## 🎯 **프로젝트 개요**

OpenManager AI는 **AI 기반 서버 모니터링**과 **자연어 처리**를 결합한 차세대 인프라 관리 플랫폼입니다. 복잡한 서버 관리를 **직관적인 대화형 AI**로 단순화했습니다.

### ✨ **핵심 기능**

| 🏗️ **기능** | 📝 **설명** | 🎨 **UI 컴포넌트** |
|-------------|-------------|-------------------|
| **🧱 서버 모니터링** | 실시간 리소스 및 상태 추적, 10개 서버 동시 모니터링 | `ServerDashboard`, `ServerCard` |
| **📊 상세 분석 모달** | 서버별 종합 정보 (시스템/네트워크/차트/에러) | `ServerDetailModal` |
| **🤖 AI 에이전트** | 자연어 기반 서버 분석 및 진단 | `AgentPanel`, `AgentPanelMobile` |
| **🔍 24시간 모니터링** | CPU/메모리/디스크 실시간 차트 및 추이 분석 | SVG 기반 차트 렌더링 |
| **🧠 MCP 엔진** | 자연어 → 의도 분석 → 맞춤 응답 | `MCPProcessor` |
| **📱 반응형 UI** | 데스크탑/모바일 최적화 | `Glassmorphism` 디자인 |

---

## 🎨 **새로운 서버 상세 모달 기능** ✨

### **📊 완전 재설계된 상세 분석**
- **🔥 스크린샷 기반 완벽 복제**: 제공된 스크린샷과 100% 일치하는 UI
- **📋 시스템 정보**: OS, 가동시간, 프로세스 수, 좀비 프로세스, 로드 평균
- **📈 리소스 현황**: 32px 높이 진행바, "사용률 (%)" 라벨 포함
- **🌐 네트워크 정보**: 인터페이스, 수신/송신 바이트, 오류 통계
- **⚙️ 서비스 상태**: 실행/중지 상태별 색상 구분 (초록/빨강)
- **📈 24시간 차트**: CPU/메모리/디스크 사용 추이 라인 차트 (SVG 렌더링)
- **⚠️ 에러 모니터링**: 시스템 오류 메시지 섹션
- **🤖 AI 분석**: 하단 중앙 AI 분석 버튼

### **🎯 UI/UX 개선사항**
- **2열 레이아웃**: 시스템 정보 | 리소스 현황
- **반응형 디자인**: 데스크탑 2열 → 모바일 1열 자동 전환
- **애니메이션**: 진행바 transition 효과
- **격자 차트**: Y축 라벨, 범례, 다중 라인 차트
- **깔끔한 디자인**: 흰색 배경, 회색 테두리, 적절한 간격

### **🔧 기술적 구현**
```typescript
interface NetworkInfo {
  interface: string;        // eth0
  receivedBytes: string;    // 4.12 MB
  sentBytes: string;        // 23.19 MB
  receivedErrors: number;   // 9
  sentErrors: number;       // 4
}

interface SystemInfo {
  os: string;              // CentOS 7
  uptime: string;          // 11 days, 14 hours
  processes: number;       // 178
  zombieProcesses: number; // 0
  loadAverage: string;     // 0.68
  lastUpdate: string;      // 2025. 5. 18. 오후 7:00:00
}
```

---

## 🏗️ **아키텍처 구조**

```
📁 src/
├── 🧱 components/dashboard/     # 서버 모니터링 UI
│   ├── ServerCard.tsx          # 서버 상태 카드
│   ├── ServerDetailModal.tsx   # 상세 정보 모달
│   └── ServerDashboard.tsx     # 메인 대시보드
├── 🤖 components/ai/           # AI 에이전트 모듈
│   ├── AgentPanel.tsx          # 데스크탑 사이드바
│   ├── AgentPanelMobile.tsx    # 모바일 드로어
│   ├── AgentQueryBox.tsx       # 질의 입력
│   └── AgentResponseView.tsx   # 응답 표시
├── 🧠 modules/mcp/             # MCP 엔진
│   └── index.ts               # 자연어 처리 로직
├── ⚙️ services/               # 비즈니스 로직
│   └── agent.ts               # AI 서비스 통합
├── 📊 types/                  # 타입 정의
│   └── server.ts              # 서버 관련 타입
└── 🎛️ app/                    # 페이지 라우팅
    ├── page.tsx               # 랜딩 페이지
    └── dashboard/             # 대시보드 영역
        ├── page.tsx           # 메인 대시보드
        └── server-dashboard/   # 서버 전용 대시보드
```

---

## 🚦 **시작하기**

### **📋 전제 조건**
- **Node.js** 18.0+ 
- **npm** 또는 **yarn**
- **Git**

### **⚡ 빠른 설치**

```bash
# 1️⃣ 저장소 클론
git clone https://github.com/your-username/openmanager-ai.git
cd openmanager-ai

# 2️⃣ 의존성 설치
npm install

# 3️⃣ 환경 변수 설정
cp .env.example .env.local

# 4️⃣ 개발 서버 실행
npm run dev
```

### **🌐 접속**
- **메인 페이지**: [http://localhost:3000](http://localhost:3000)
- **대시보드**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **서버 전용**: [http://localhost:3000/dashboard/server-dashboard](http://localhost:3000/dashboard/server-dashboard)

---

## 🎮 **사용 방법**

### **1️⃣ 서버 모니터링**
```typescript
// 서버 카드에서 실시간 상태 확인
- CPU, 메모리, 디스크 사용률
- 업타임 및 위치 정보
- 상태별 색상 구분 (온라인/경고/오프라인)
```

### **2️⃣ AI 에이전트 활용**
```typescript
// 자연어로 서버 질의
"DB-EU-002 서버 상태 분석해줘"
"성능 이슈가 있는 서버 찾아줘"
"최근 에러 로그 분석해줘"
```

### **3️⃣ 상세 분석**
```typescript
// 서버 카드 클릭 → 상세 모달
- 시스템 정보 및 리소스 현황
- 실행 중인 서비스 목록
- 실시간 로그 스트림
- AI 분석 연동 버튼
```

---

## 🔧 **기술 스택**

### **Frontend**
- **⚛️ Next.js 15.1.8** - App Router, Server Components
- **🎨 TypeScript** - 타입 안전성
- **💄 Tailwind CSS** - 유틸리티 우선 스타일링
- **✨ Glassmorphism** - 모던 UI 디자인

### **AI Engine**
- **🧠 MCP (Model Context Protocol)** - 자연어 처리
- **🎯 Intent Classification** - 의도 분석
- **🔍 Entity Extraction** - 엔티티 추출
- **💬 Context-Aware Responses** - 맥락 기반 응답

### **Architecture**
- **🏗️ 모듈화 설계** - 컴포넌트 분리
- **📱 반응형 레이아웃** - 모바일 최적화
- **🔄 실시간 업데이트** - WebSocket 준비
- **🎛️ 상태 관리** - React Hooks

---

## 📱 **UI/UX 특징**

### **🎨 디자인 시스템**
- **Glassmorphism**: 투명도와 블러 효과
- **Purple-Blue 그라데이션**: AI 테마 색상
- **반응형 레이아웃**: 모바일/데스크탑 최적화
- **마이크로 인터랙션**: 호버 및 클릭 애니메이션

### **🤖 AI 인터페이스**
- **데스크탑**: 우측 사이드바 (`w-96`)
- **모바일**: 하단 Drawer (`h-[85vh]`)
- **실시간 채팅**: 메시지 기반 대화
- **빠른 질문**: 원클릭 템플릿

---

## 🧠 **MCP 엔진 상세**

### **🎯 인텐트 분류**
```typescript
// 지원하는 인텐트 타입
- server_status: 서버 상태 확인
- performance_analysis: 성능 분석
- log_analysis: 로그 분석
- alert_management: 알림 관리
- specific_server_analysis: 특정 서버 분석
```

### **🔍 엔티티 추출**
```typescript
// 자동 추출되는 정보
- serverId: "API-US-001", "DB-EU-002"
- metrics: ["cpu", "memory", "disk"]
- timeRange: ["24시간", "1주일", "최근"]
```

### **💬 응답 생성**
```typescript
// 컨텍스트 기반 맞춤 응답
- 서버별 맞춤 분석
- 시간대별 상황 인식
- 추가 액션 제안
- 마크다운 포맷팅
```

---

## 🔗 **API 엔드포인트**

```typescript
// 향후 구현 예정
GET    /api/servers           # 서버 목록
GET    /api/servers/:id       # 특정 서버 정보
POST   /api/ai/query          # AI 질의 처리
GET    /api/logs/:serverId    # 서버 로그
POST   /api/alerts            # 알림 설정
```

---

## 🚀 **빌드 및 배포**

### **🏗️ 프로덕션 빌드**
```bash
npm run build
npm run start
```

### **☁️ Vercel 배포**
```bash
npm install -g vercel
vercel --prod
```

### **🐳 Docker 배포**
```dockerfile
# Dockerfile 예시 (향후 추가)
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 🔧 **개발 가이드**

### **📁 컴포넌트 추가**
```typescript
// 1. 타입 정의 (src/types/)
// 2. 컴포넌트 생성 (src/components/)
// 3. 스토리북 스토리 (선택사항)
// 4. 테스트 코드 (선택사항)
```

### **🧠 MCP 패턴 추가**
```typescript
// src/modules/mcp/index.ts에서
this.intentPatterns.set('new_intent', [
  /새로운.*패턴/i,
  /추가.*키워드/i
]);
```

### **🎨 스타일 가이드**
```typescript
// Tailwind 클래스 순서
// 1. Layout (flex, grid, w-, h-)
// 2. Spacing (p-, m-, gap-)
// 3. Typography (text-, font-)
// 4. Colors (bg-, text-, border-)
// 5. Effects (shadow-, rounded-, opacity-)
```

---

## 📈 **로드맵**

### **🎯 v1.0 (현재)**
- [x] 기본 서버 모니터링 UI
- [x] AI 에이전트 패널
- [x] MCP 엔진 기본 구현
- [x] 반응형 디자인

### **🚀 v1.1 (예정)**
- [ ] 실제 서버 API 연동
- [ ] WebSocket 실시간 업데이트
- [ ] 차트/그래프 시각화
- [ ] 사용자 권한 관리

### **⭐ v2.0 (계획)**
- [ ] 다중 클러스터 지원
- [ ] AI 모델 고도화
- [ ] 자동 복구 시스템
- [ ] 모바일 앱 개발

---

## 🤝 **기여하기**

1. **Fork** 저장소
2. **Feature 브랜치** 생성 (`git checkout -b feature/amazing-feature`)
3. **커밋** (`git commit -m 'Add amazing feature'`)
4. **Push** (`git push origin feature/amazing-feature`)
5. **Pull Request** 생성

---

## 📄 **라이선스**

이 프로젝트는 **MIT 라이선스** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

---

## 👥 **팀**

**🧑‍💻 개발팀**
- **AI/ML**: MCP 엔진 및 자연어 처리
- **Frontend**: React/Next.js UI 개발
- **Backend**: API 및 인프라 설계
- **DevOps**: 배포 및 모니터링

---

## 📞 **연락처**

- **📧 이메일**: contact@openmanager.ai
- **🌐 웹사이트**: [https://openmanager.ai](https://openmanager.ai)
- **📱 GitHub**: [https://github.com/openmanager-ai](https://github.com/openmanager-ai)
- **💬 Discord**: [OpenManager 커뮤니티](https://discord.gg/openmanager)

---

<div align="center">
  <h3>🎉 OpenManager AI와 함께 서버 관리의 새로운 패러다임을 경험하세요! 🚀</h3>
  <p><strong>AI가 이해하는 인프라, 대화로 해결하는 문제</strong></p>
</div>
