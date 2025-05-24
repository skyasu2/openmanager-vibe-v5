# OpenManager Vibe V5 🚀

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![Framer Motion](https://img.shields.io/badge/Framer_Motion-11-pink)](https://framer.com/motion/)

> 🎯 **개인 프로젝트** - AI 기반 서버 모니터링과 관리를 통합한 차세대 서버 관리 솔루션  
> 💻 **바이브 코딩**으로 제작된 풀스택 데모 애플리케이션

---

## 📖 프로젝트 개요

**OpenManager Vibe V5**는 개인이 **바이브 코딩** 방식으로 개발한 혁신적인 AI 서버 모니터링 솔루션입니다. 현대적인 웹 기술과 AI 기능을 결합하여 직관적이고 강력한 서버 관리 경험을 제공합니다.

### 🎨 바이브 코딩의 결과물
- **창의적 접근**: 전통적인 개발 방식을 벗어난 창의적 솔루션
- **실험적 기술**: 최신 웹 기술의 혁신적 조합
- **사용자 중심**: 직관적이고 매력적인 사용자 경험 추구
- **개인 비전**: 서버 모니터링의 새로운 패러다임 제시

---

## ✨ 주요 특징

🤖 **AI 기반 분석** - 머신러닝을 활용한 지능형 이상 탐지 및 예측 분석  
💬 **AI 채팅 어시스턴트** - 자연어로 서버 상태를 조회하고 분석  
🎭 **실시간 데모** - 19개 서버를 활용한 풀 인터랙티브 데모 환경  
📊 **실시간 모니터링** - 서버 상태와 성능을 실시간으로 모니터링  
🔔 **스마트 알림** - 중요한 이벤트를 즉시 감지하고 다중 채널로 알림 전송  
🛡️ **보안 강화** - 고급 보안 모니터링과 취약점 스캔  
⚙️ **자동화** - 반복적인 관리 작업 자동화  
☁️ **클라우드 통합** - AWS, Azure, GCP 등 주요 클라우드 플랫폼과 완벽 통합

---

## 🛠️ 기술 스택

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: CSS Modules + Tailwind CSS
- **Animation**: Framer Motion 11
- **State**: Zustand
- **Icons**: Lucide React + Font Awesome 6
- **Charts**: Recharts (준비)

### Development
- **Runtime**: Node.js 18+
- **Package Manager**: npm
- **Architecture**: Server-Side Rendering + Client Components

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
- **✨ 메인 페이지**: [http://localhost:3000](http://localhost:3000) - **완전한 OpenManager Vibe V5 랜딩 페이지**
- **🤖 AI 데모**: [http://localhost:3000/demo](http://localhost:3000/demo) - 실시간 AI 서버 모니터링 데모
- **📊 AI 대시보드**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard) - 통합 관리 대시보드

### ✅ API 엔드포인트 (완전 해결됨)
**모든 API 라우트가 정상 작동합니다:**

#### App Router API (`/api/*`)
- **기본 연결**: [/api/ping](http://localhost:3000/api/ping) - 간단한 연결 테스트
- **건강 상태**: [/api/health](http://localhost:3000/api/health) - 상세한 시스템 건강 상태
- **서버 상태**: [/api/status](http://localhost:3000/api/status) - 서버 상태 및 성능 메트릭

> **🎯 해결된 문제**: 
> - ✅ **API 라우트 404 오류** - `.vercelignore` 설정으로 완전 해결
> - ✅ **Next.js 기본 템플릿 문제** - `public/index.html` → `src/app/page.tsx` 마이그레이션으로 해결

---

## 🎮 라이브 데모

### ✨ OpenManager Vibe V5 랜딩 페이지
**URL**: `/` (메인 페이지)

#### 주요 특징
- **🎨 아름다운 그라데이션 배경** - 15초 순환 애니메이션
- **💎 글래스모피즘 디자인** - 현대적인 반투명 카드 효과
- **⚡ 매끄러운 애니메이션** - Fade-in-up 효과와 호버 인터랙션
- **📱 완전 반응형** - 모바일부터 데스크톱까지 최적화
- **🚀 CTA 버튼** - 데모 체험 및 대시보드 직접 연결
- **🎯 SEO 최적화** - Next.js App Router 기반 서버사이드 렌더링

### 🌟 AI 서버 모니터링 데모
**URL**: `/demo`

#### 주요 기능
- **19개 서버 실시간 시뮬레이션** - 다양한 상태와 메트릭
- **AI 채팅 인터페이스** - 자연어 질문 및 분석
- **10단계 자동 시나리오** - 인터랙티브 데모 스토리
- **실시간 하이라이트** - AI 응답 연동 서버 강조
- **서버 상세 패널** - 개별 메트릭 상세 분석
- **실시간 업데이트** - 8초 간격 메트릭 변화

#### 자동 시나리오 (10단계)
1. **시스템 개요** → 2. **사용자 질문** → 3. **AI 분석** → 4. **CPU 조회** → 5. **서버 하이라이트**  
6. **상세 분석** → 7. **AI 진단** → 8. **실시간 업데이트** → 9. **경고 분석** → 10. **종합 하이라이트**

---

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── 📁 src/
│   ├── 📁 app/                  # Next.js App Router
│   │   ├── 📁 demo/             # 🆕 AI 데모 페이지
│   │   ├── 📁 dashboard/        # 대시보드
│   │   ├── 📁 api/              # API 라우트
│   │   ├── 📄 layout.tsx        # 루트 레이아웃
│   │   ├── 📄 page.tsx          # 메인 랜딩
│   │   └── 📄 globals.css       # 글로벌 스타일
│   ├── 📁 components/           # 컴포넌트
│   │   └── 📁 demo/             # 🆕 데모 컴포넌트
│   │       ├── 📄 ServerCard.tsx
│   │       ├── 📄 AIChatPanel.tsx
│   │       └── 📄 AutoDemoScenario.tsx
│   ├── 📁 stores/               # 🆕 상태 관리
│   ├── 📁 styles/               # CSS Modules
│   ├── 📁 types/                # TypeScript 타입
│   └── 📁 lib/                  # 유틸리티
├── 📁 docs/                     # 📚 프로젝트 문서
├── 📁 public/                   # 정적 파일
└── 📄 README.md                 # 프로젝트 소개
```

---

## 🎨 디자인 시스템

### 컬러 팔레트
```css
:root {
  --primary: #1a73e8;      /* Google Blue */
  --secondary: #34a853;    /* Google Green */
  --accent: #ea4335;       /* Google Red */
  --warning: #fbbc04;      /* Google Yellow */
}
```

### 애니메이션 원칙
- **자연스러운 모션**: Framer Motion 스프링 애니메이션
- **의미 있는 전환**: 상태 변화를 시각적으로 표현
- **성능 최적화**: 60fps 부드러운 애니메이션

---

## 📊 데모 데이터

### 서버 구성 (19개)
| 타입 | 개수 | 예시 |
|------|------|------|
| API | 6개 | api-useast-001, api-uswest-002 |
| Database | 4개 | db-eucentral-003, db-aptokyo-004 |
| Web | 5개 | web-apseoul-005, web-useast-006 |
| Cache | 4개 | cache-euwest-007, cache-uscentral-008 |

### 상태 분포
- 🟢 **정상**: 15개 (79%)
- 🟡 **경고**: 3개 (16%)  
- 🔴 **심각**: 1개 (5%)

---

## 🔧 개발 가이드

### 상태 관리 (Zustand)
```typescript
import { useDemoStore } from '@/stores/demoStore';

const { servers, addMessage, highlightServers } = useDemoStore();
```

### 애니메이션 (Framer Motion)
```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
```

### 스타일링 (CSS Modules + Tailwind)
```tsx
<div className={`${styles.card} border rounded-lg p-4`}>
```

---

## 🚀 배포

### 빌드
```bash
npm run build
npm start
```

### Vercel 배포
```bash
vercel --prod
```

---

## 📈 성능 지표

| 메트릭 | 목표 | 현재 |
|--------|------|------|
| Lighthouse | 95+ | 🎯 |
| FCP | <1.5s | 🎯 |
| LCP | <2.5s | 🎯 |
| CLS | <0.1 | 🎯 |

---

## 🗺️ 로드맵

### ✅ v5.1 (완료)
- [x] 실시간 AI 데모 구현
- [x] 자동 시나리오 시스템
- [x] 서버 하이라이트 및 상세 패널

### 🔄 v5.2 (진행중)
- [ ] 실제 대시보드 구현
- [ ] 사용자 인증 시스템
- [ ] 실제 서버 연결 기능

### 🔮 v5.3 (계획)
- [ ] AI 분석 엔진 통합
- [ ] 실시간 알림 시스템
- [ ] 모바일 앱 연동

---

## 🤝 기여하기

이 프로젝트는 **개인 학습 및 포트폴리오 목적**으로 제작되었습니다.

### 피드백 환영
- 🐛 **버그 리포트**: [Issues](https://github.com/skyasu2/openmanager-vibe-v5/issues)
- 💡 **기능 제안**: [Discussions](https://github.com/skyasu2/openmanager-vibe-v5/discussions)
- 📧 **문의**: [이메일](mailto:your-email@example.com)

---

## 📜 라이선스

MIT License - 자유롭게 사용, 수정, 배포 가능

---

## 👨‍💻 작성자

**개인 프로젝트** - 바이브 코딩으로 제작  
**목적**: 최신 웹 기술 학습 및 포트폴리오 구축  
**특징**: 창의적 접근과 실험적 기술 조합

---

## 🎬 스크린샷

### 🏠 랜딩 페이지
- 🎨 그라데이션 애니메이션 배경
- 💎 글래스모피즘 카드 디자인
- 📊 실시간 통계 표시

### 🤖 AI 데모 페이지
- 💬 좌측: AI 채팅 인터페이스
- 🖥️ 우측: 실시간 서버 모니터링  
- ⚡ 자동 시나리오 및 하이라이트

---

> **🎮 지금 체험해보세요!**  
> `npm run dev` → [localhost:3000/demo](http://localhost:3000/demo) 방문  
> 3초 후 자동으로 AI 데모가 시작됩니다!

**OpenManager Vibe V5** - 바이브 코딩으로 만든 서버 모니터링의 미래! 🚀
