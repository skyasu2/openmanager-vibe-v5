# OpenManager Vibe V5 🚀

> AI 기반 서버 모니터링과 관리를 통합한 차세대 서버 관리 솔루션

## ✨ 주요 특징

- **🤖 AI 기반 분석**: 머신러닝을 활용한 지능형 이상 탐지 및 예측 분석
- **📊 실시간 모니터링**: 서버 상태와 성능을 실시간으로 모니터링
- **💬 AI 채팅**: 자연어로 서버 상태를 조회하고 분석할 수 있는 AI 어시스턴트
- **🎭 실시간 데모**: 19개 서버를 활용한 풀 인터랙티브 데모 환경
- **🔔 스마트 알림**: 중요한 이벤트를 즉시 감지하고 다중 채널로 알림 전송
- **🛡️ 보안 강화**: 고급 보안 모니터링과 취약점 스캔
- **⚙️ 자동화**: 반복적인 관리 작업 자동화
- **☁️ 클라우드 통합**: AWS, Azure, GCP 등 주요 클라우드 플랫폼과 완벽 통합

## 🛠️ 기술 스택

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: CSS Modules + Tailwind CSS
- **Animation**: Framer Motion
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: Lucide React + Font Awesome 6
- **Fonts**: Noto Sans KR (Google Fonts)
- **Architecture**: App Router (Next.js 14)

## 🚀 빠른 시작

### 사전 요구사항

- Node.js 18.0.0 이상
- npm 또는 yarn 패키지 매니저

### 설치 및 실행

```bash
# 저장소 복제
git clone https://github.com/your-username/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 결과를 확인하세요.

## 🎮 데모 체험

🌟 **실시간 AI 데모**: [http://localhost:3000/demo](http://localhost:3000/demo)

### 데모 주요 기능
- **19개 실제 서버 시뮬레이션**: 다양한 상태와 메트릭을 가진 서버들
- **AI 채팅 인터페이스**: 서버 상태를 자연어로 질문하고 분석
- **자동 데모 시나리오**: 10단계 인터랙티브 자동 시나리오
- **실시간 하이라이트**: AI 응답에 따른 서버 하이라이트 효과
- **서버 상세 패널**: 개별 서버의 상세 메트릭 확인
- **실시간 메트릭 업데이트**: 8초 간격으로 서버 메트릭 변화

## 📁 프로젝트 구조

```
openmanager-vibe-v5/
├── src/
│   ├── app/                     # Next.js App Router
│   │   ├── demo/                # 🆕 AI 데모 페이지
│   │   │   └── page.tsx         # 통합 데모 인터페이스
│   │   ├── dashboard/           # 대시보드 페이지
│   │   ├── api/                 # API 라우트
│   │   ├── layout.tsx           # 루트 레이아웃
│   │   ├── page.tsx            # 메인 랜딩 페이지
│   │   └── globals.css         # 글로벌 스타일
│   ├── components/             # 재사용 가능한 컴포넌트
│   │   └── demo/               # 🆕 데모 전용 컴포넌트
│   │       ├── ServerCard.tsx  # 애니메이션 서버 카드
│   │       ├── AIChatPanel.tsx # AI 채팅 인터페이스
│   │       └── AutoDemoScenario.tsx # 자동 데모 시나리오
│   ├── stores/                 # 🆕 Zustand 상태 관리
│   │   └── demoStore.ts        # 데모 상태 관리
│   ├── styles/                 # CSS Modules
│   │   └── landing.module.css  # 랜딩 페이지 스타일
│   ├── types/                  # TypeScript 타입 정의
│   │   └── demo.ts            # 🆕 데모 타입 정의
│   ├── hooks/                  # 커스텀 훅
│   └── lib/                    # 유틸리티 함수
├── public/                     # 정적 파일
├── docs/                       # 프로젝트 문서
├── scripts/                    # 🆕 스크립트 파일
└── README.md
```

## 🎨 디자인 시스템

### 컬러 팔레트

```css
:root {
  --primary: #1a73e8;          /* 메인 블루 */
  --primary-light: #e8f0fe;    /* 라이트 블루 */
  --primary-dark: #0d47a1;     /* 다크 블루 */
  --secondary: #34a853;        /* 그린 */
  --accent: #ea4335;           /* 레드 */
  --warning: #fbbc04;          /* 옐로우 */
}
```

### 애니메이션 (Framer Motion)

- **fadeIn**: 부드러운 페이드인 효과
- **slideIn**: 슬라이드 인 애니메이션
- **pulse**: 서버 하이라이트 펄스 효과
- **scale**: 호버 시 스케일 효과
- **spring**: 자연스러운 스프링 애니메이션

### 반응형 디자인

- **데스크톱**: 1200px 이상 (데모 풀 레이아웃)
- **태블릿**: 768px - 1199px (적응형 그리드)
- **모바일**: 767px 이하 (스택 레이아웃)

## 🤖 AI 데모 기능

### 1. 자동 시나리오 (10단계)
1. **시스템 상태 개요** - 전체 서버 현황 소개
2. **사용자 질문** - "현재 시스템 전체 상태는 어때?"
3. **AI 분석 응답** - 시스템 분석 결과 및 차트 표시
4. **CPU 사용률 질문** - "CPU 사용률이 가장 높은 서버는?"
5. **서버 하이라이트** - 문제 서버 자동 하이라이트
6. **상세 정보 요청** - 특정 서버 상세 분석
7. **AI 진단 결과** - 문제점 분석 및 해결책 제안
8. **실시간 업데이트** - 메트릭 변화 시뮬레이션
9. **경고 서버 분석** - 경고 상태 서버들 분석
10. **종합 하이라이트** - 모든 문제 서버 표시

### 2. 인터랙티브 요소
- **서버 카드 클릭**: 개별 서버 상세 정보 표시
- **AI 채팅**: 실시간 질문 및 응답
- **빠른 질문 버튼**: 자주 사용하는 질문 바로가기
- **실시간 메트릭**: 8초 간격 자동 업데이트

### 3. 시각적 효과
- **펄스 애니메이션**: 선택된 서버 강조
- **그라데이션 배경**: 동적 배경 효과
- **글래스모피즘**: 현대적인 UI 디자인
- **스무스 트랜지션**: 모든 상태 변화에 애니메이션

## 📊 데모 데이터

### 서버 구성 (총 19개)
- **API 서버**: 6개 (다양한 지역)
- **Database 서버**: 4개 (고성능 구성)
- **Web 서버**: 5개 (로드밸런싱)
- **Cache 서버**: 4개 (Redis/Memcached)

### 상태 분포
- **정상 (Green)**: 15개 서버 (79%)
- **경고 (Yellow)**: 3개 서버 (16%)
- **심각 (Red)**: 1개 서버 (5%)

### 메트릭 종류
- **CPU 사용률**: 10-95% 범위
- **메모리 사용률**: 30-85% 범위
- **디스크 사용률**: 40-88% 범위
- **네트워크 사용률**: 10-40% 범위

## 🔧 개발 가이드

### Zustand 상태 관리

```typescript
import { useDemoStore } from '@/stores/demoStore';

function Component() {
  const { servers, addMessage, highlightServers } = useDemoStore();
  
  // 서버 하이라이트
  highlightServers(['server-001', 'server-002']);
  
  // AI 메시지 추가
  addMessage({
    type: 'ai',
    content: '분석 완료!',
    hasChart: true
  });
}
```

### Framer Motion 애니메이션

```tsx
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  콘텐츠
</motion.div>
```

### CSS Modules + Tailwind 조합

```tsx
import styles from '@/styles/landing.module.css';

<div className={`${styles.card} border rounded-lg p-4`}>
  하이브리드 스타일링
</div>
```

## 🎯 주요 페이지

### 1. 랜딩 페이지 (`/`)
- 그라데이션 배경 애니메이션
- 글래스모피즘 디자인
- 인터랙티브 기능 카드
- CTA 버튼 (데모 체험, 대시보드)

### 2. AI 데모 페이지 (`/demo`)
- **레이아웃**: 100vh 고정 (Header 80px + 좌측 AI 35% + 우측 서버 65% + Footer 60px)
- **좌측 패널**: AI 채팅 인터페이스
- **우측 패널**: 3x3 메인 서버 그리드 + 추가 서버들
- **자동 시나리오**: 3초 후 자동 시작
- **실시간 하이라이트**: AI 응답에 따른 서버 강조

### 3. 대시보드 (준비중)
- 실시간 서버 모니터링
- AI 기반 분석 도구
- 알림 및 경고 시스템

## 🔍 SEO 최적화

- **메타데이터**: 완벽한 Open Graph 및 Twitter Card 지원
- **시맨틱 HTML**: 접근성을 고려한 마크업
- **성능 최적화**: Next.js 14의 최신 최적화 기법 활용
- **다국어 지원**: 한국어 기본, 확장 가능한 구조

## 📊 성능 지표

- **Lighthouse Score**: 95+ (목표)
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **Interactive Elements**: 60fps 애니메이션

## 🤝 기여하기

1. 이 저장소를 Fork 하세요
2. 새로운 기능 브랜치를 만드세요 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋하세요 (`git commit -m 'Add some amazing feature'`)
4. 브랜치에 Push 하세요 (`git push origin feature/amazing-feature`)
5. Pull Request를 열어주세요

## 📜 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 🆘 지원

- **문서**: [OpenManager 문서](https://docs.openmanager.com)
- **이슈**: [GitHub Issues](https://github.com/your-username/openmanager-vibe-v5/issues)
- **커뮤니티**: [Discord 서버](https://discord.gg/openmanager)

## 🗺️ 로드맵

### v5.1 (다음 마이너 버전)
- [x] ✅ 실시간 AI 데모 구현
- [x] ✅ 자동 시나리오 시스템
- [x] ✅ 서버 하이라이트 및 상세 패널
- [ ] 🔄 실제 대시보드 구현
- [ ] 📝 사용자 인증 시스템
- [ ] 🔌 실제 서버 연결 기능

### v5.2 (향후 계획)
- [ ] 🧠 AI 분석 엔진 통합
- [ ] 🔔 실시간 알림 시스템
- [ ] 📱 모바일 앱 연동
- [ ] 📈 고급 차트 및 대시보드
- [ ] 🔐 엔터프라이즈 보안 기능

### v5.3 (장기 계획)
- [ ] 🌐 멀티 테넌트 지원
- [ ] 🔄 Auto-scaling 통합
- [ ] 🚀 Kubernetes 연동
- [ ] 💾 데이터 백업 및 복구

---

**OpenManager Vibe V5** - 서버 모니터링의 미래를 만들어갑니다! 🚀

### 🎬 스크린샷

#### 랜딩 페이지
- 🎨 그라데이션 애니메이션 배경
- 💎 글래스모피즘 카드 디자인
- 📊 실시간 통계 표시

#### AI 데모 페이지
- 💬 좌측: AI 채팅 인터페이스
- 🖥️ 우측: 실시간 서버 모니터링
- ⚡ 자동 시나리오 및 하이라이트

> **체험해보세요!** 로컬에서 `npm run dev` 실행 후 `/demo` 페이지를 방문하면 자동으로 AI 데모가 시작됩니다!
