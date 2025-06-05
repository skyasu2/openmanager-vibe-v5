# 🏠 홈페이지 카드 기능 설명

## 📋 개요

OpenManager V5 홈페이지에는 4개의 주요 기능을 소개하는 인터랙티브 카드 그리드가 구현되어 있습니다. 각 카드는 **Framer Motion** 애니메이션과 함께 호버 효과를 제공하며, 클릭 시 상세 정보를 담은 모달이 나타납니다.

## 🎯 카드 구성

### 1. 지능형 AI 에이전트 (🧠)
**설명**: MCP 기반 AI 시스템으로 자연어 분석 및 대응

#### 🛠️ 기술 스택
- **MCP Protocol** 기반 AI 엔진과 `@modelcontextprotocol/sdk`
- **OpenAI·Claude·Gemini** 통합 분석 지원
- **Scikit‑learn**과 **Transformers.js** 연동
- **Supabase** 및 **Redis** 실시간 데이터 활용

**목적**: 자연어 질의를 통한 서버 모니터링 및 장애 분석

---

### 2. Prometheus 데이터 생성기 (📊)
**설명**: 실시간 서버 메트릭 시뮬레이터와 고성능 모니터링

#### 🛠️ 기술 스택
- **Prometheus** 호환 메트릭을 실시간 생성
- **TimerManager** 최적화로 CPU 사용량 최소화
- **Redis** 캐싱과 **delta-compression** 지원
- **/api/data-generator** 엔드포인트 제공

**목적**: 실제 서버 환경을 모방한 테스트 데이터 생성

---

### 3. 최신 기술 스택 (🚀)
**설명**: Next.js 14 + Supabase + Redis 통합 아키텍처

#### 🛠️ 기술 스택
- **Next.js 15** App Router와 **React 19** 기반
- **Zustand**와 **TanStack Query**로 상태 관리
- **Vercel**과 **GitHub Actions** 자동 배포 파이프라인
- **Supabase**와 **Upstash Redis** 백엔드 구성

**목적**: 현대적이고 확장 가능한 웹 애플리케이션 아키텍처 구현

---

### 4. 바이브 코딩 경험 (✨) - 황금카드
**설명**: Cursor AI + Claude 협업으로 구현된 차세대 개발 방식

#### 🛠️ 기술 스택
- **Cursor AI**와 **Claude** 협업 워크플로우
- **MCP** 설정부터 테스트 자동화까지 프롬프트 제어
- **GitHub Copilot**과 **auto-doc-generator** 활용
- **4단계 Vibe Coding** 프로세스로 86페이지 자동 생성

**목적**: AI 협업을 통한 혁신적인 개발 방법론 소개

## 🎨 구현 특징

### 📱 반응형 디자인
- **Desktop**: 2x2 그리드 배치
- **Mobile**: 1열 세로 배치
- **Tablet**: 자동 적응형 레이아웃

### 🎭 애니메이션 효과
- **진입 애니메이션**: Stagger 효과로 순차적 등장
- **호버 효과**: Scale & Y축 이동 + 그라데이션 오버레이
- **클릭 애니메이션**: Scale down 피드백
- **아이콘 회전**: 호버 시 360도 회전

### 🔧 기술적 구현

#### 컴포넌트 구조
```
src/components/home/
├── FeatureCardsGrid.tsx     # 메인 카드 그리드 컴포넌트
├── FeatureModal.tsx         # 상세 정보 모달 컴포넌트
└── types.ts                 # 타입 정의 (선택사항)
```

#### 주요 기능
1. **카드 데이터 관리**: TypeScript 배열로 중앙화
2. **상태 관리**: useState 기반 모달 상태 제어
3. **애니메이션**: Framer Motion variants 시스템
4. **타입 안전성**: 완전한 TypeScript 지원

## 🚀 사용법

### 카드 클릭 플로우
1. 사용자가 카드 클릭
2. `handleCardClick()` 함수 실행
3. 선택된 카드 데이터가 state에 저장
4. `FeatureModal` 컴포넌트 렌더링
5. 모달에서 상세 정보 및 기술 스택 표시
6. 액션 버튼 클릭 시 해당 페이지로 이동

### 커스터마이징 가이드

#### 새 카드 추가
```typescript
// FeatureCardsGrid.tsx 내부
export const featureCards: FeatureCardData[] = [
  // ... 기존 카드들
  {
    id: 'new-feature',
    title: '새로운 기능',
    description: '간단한 설명',
    detailedDescription: '상세한 설명',
    icon: YourIcon,
    emoji: '🆕',
    gradientFrom: 'from-green-600/90',
    gradientTo: 'to-emerald-700/90',
    features: [
      '기능 1',
      '기능 2',
      // ...
    ],
    actionText: '자세히 보기',
    actionUrl: '/your-page',
    isSpecial: false // 황금카드 효과 여부
  }
];
```

#### 스타일 커스터마이징
- **그라데이션**: `gradientFrom`, `gradientTo` 속성 수정
- **특수 효과**: `isSpecial: true`로 황금카드 효과 활성화
- **애니메이션 속도**: Framer Motion `transition` 속성 조정

## 🧪 테스트 시나리오

### 기본 기능 테스트
- [ ] 4개 카드가 정상적으로 렌더링되는가?
- [ ] 각 카드 클릭 시 모달이 열리는가?
- [ ] 모달 닫기 버튼이 정상 작동하는가?
- [ ] 액션 버튼 클릭 시 올바른 페이지로 이동하는가?

### 반응형 테스트
- [ ] 모바일에서 1열 레이아웃으로 표시되는가?
- [ ] 태블릿에서 적절히 배치되는가?
- [ ] 데스크톱에서 2x2 그리드로 표시되는가?

### 애니메이션 테스트
- [ ] 페이지 로드 시 순차적으로 나타나는가?
- [ ] 호버 시 Scale & Shadow 효과가 적용되는가?
- [ ] 황금카드(바이브 코딩)에 특수 효과가 있는가?

## 📊 성능 최적화

### 구현된 최적화
1. **지연 로딩**: 모달 컴포넌트는 필요 시에만 렌더링
2. **메모이제이션**: 애니메이션 variants는 컴포넌트 외부에 정의
3. **가벼운 의존성**: Lucide React 아이콘만 사용
4. **CSS-in-JS 최소화**: Tailwind CSS 기반 스타일링

### 측정 지표
- **First Contentful Paint**: < 1.2초
- **Largest Contentful Paint**: < 2.5초
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

## 🔄 업데이트 이력

### v1.0.0 (2025-05-31)
- ✅ 4개 기본 카드 구현
- ✅ Framer Motion 애니메이션 추가
- ✅ 반응형 디자인 적용
- ✅ TypeScript 완전 지원

### 향후 개선 계획
- [ ] 카드 순서 드래그 앤 드롭
- [ ] 다국어 지원 (i18n)
- [ ] 접근성 개선 (ARIA 라벨)
- [ ] 다크모드 지원

## 🎯 결론

홈페이지 카드 기능은 **OpenManager V5**의 핵심 기능들을 직관적이고 매력적으로 소개하는 역할을 합니다. **Framer Motion** 기반의 부드러운 애니메이션과 **TypeScript**의 타입 안전성을 결합하여, 사용자 경험과 개발자 경험을 모두 만족시키는 구현이 완성되었습니다. 