# 🎨 홈페이지 카드 UI 디자인 프롬프트 템플릿

## 🎯 목표
기존 웹사이트의 상단 구조를 유지하면서, 하단 콘텐츠 영역을 **모던한 카드 UI 시스템**으로 고도화

## ✅ 유지할 기존 요소
- 상단 로고/브랜딩 영역
- 우측 상단 사용자 메뉴/프로필
- 시스템 제어 버튼 (시작/종료 등)

## 🎨 구현할 카드 시스템

### 기본 레이아웃
```typescript
// 반응형 그리드 레이아웃
className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 lg:gap-8"
```

### 카드 컴포넌트 구조
```typescript
interface FeatureCardProps {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  emoji: string;
  gradientFrom: string;
  gradientTo: string;
  onClick: () => void;
  index: number;
  isSpecial?: boolean; // 특별한 카드 (황금카드 등)
}
```

### 애니메이션 패턴 (Framer Motion)
```typescript
// 진입 애니메이션
const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.8 },
  visible: { 
    opacity: 1, y: 0, scale: 1,
    transition: {
      duration: 0.6,
      delay: index * 0.15, // 순차 진입
      type: "spring"
    }
  }
};

// 호버 효과
const hoverVariants = {
  hover: {
    scale: 1.05,
    y: -8,
    rotateY: 5, // 3D 효과
    transition: { duration: 0.3, type: "spring" }
  }
};
```

### 색상 팔레트 예시
```css
/* 주요 기능 카드 */
.card-primary {
  background: from-cyan-500/80 to-blue-600/80;
}

/* 데이터/분석 카드 */
.card-data {
  background: from-blue-500/80 to-indigo-600/80;
}

/* 시스템/설정 카드 */
.card-system {
  background: from-slate-500/80 to-gray-700/80;
}

/* 특별 기능 카드 (황금) */
.card-special {
  background: from-yellow-400/80 to-orange-500/80;
  ring: 2px ring-yellow-400/50;
}
```

## 📱 반응형 디자인 가이드

### 브레이크포인트
- **모바일**: `grid-cols-1` (세로 나열)
- **태블릿**: `md:grid-cols-2` (2열)
- **데스크톱**: `xl:grid-cols-4` (4열)

### 카드 사이즈
- **높이**: 고정 `h-72` (288px)
- **패딩**: `p-8`
- **모서리**: `rounded-3xl`

### 모바일 최적화
```css
@media (max-width: 768px) {
  .card-title { font-size: 1.1rem; }
  .card-description { font-size: 0.8rem; }
  .card-padding { padding: 1.5rem; }
}
```

## 🎭 인터랙션 디자인

### 클릭 플로우
1. **카드 클릭** → 상세 모달 오픈
2. **모달 내용**: 상세 설명 + 주요 기능 목록
3. **액션 버튼**: 해당 페이지로 이동
4. **모달 닫기**: 백드롭 또는 X 버튼

### 모달 컴포넌트
```typescript
interface FeatureModalProps {
  feature: FeatureData;
  onClose: () => void;
  onAction: (url: string) => void;
}

// 모달 애니메이션
const modalVariants = {
  hidden: { opacity: 0, scale: 0.8, y: 100 },
  visible: { 
    opacity: 1, scale: 1, y: 0,
    transition: { type: "spring", duration: 0.5 }
  }
};
```

## 🌟 특수 효과 (황금카드)

### 반짝임 애니메이션
```typescript
// 배경 펄스 효과
<motion.div
  className="absolute inset-0 bg-gradient-to-r from-yellow-400/10"
  animate={{
    opacity: [0.3, 0.7, 0.3],
    scale: [1, 1.02, 1]
  }}
  transition={{
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }}
/>

// 글로우 포인트
<motion.div
  className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full"
  animate={{
    scale: [1, 1.2, 1],
    opacity: [0.7, 1, 0.7]
  }}
/>
```

## 📦 컴포넌트 파일 구조

```
src/components/home/
├── FeatureCard.tsx       # 개별 카드 컴포넌트
├── FeatureCardsGrid.tsx  # 카드 그리드 컨테이너
├── FeatureModal.tsx      # 상세 모달
└── index.ts              # export 파일
```

## 🔧 사용 예시

### 카드 데이터 정의
```typescript
const cardData = [
  {
    id: 'feature-1',
    title: '핵심 기능 이름',
    description: '간단한 한 줄 설명',
    detailedDescription: '모달에서 보여줄 상세 설명',
    icon: IconComponent,
    emoji: '🚀',
    gradientFrom: 'from-cyan-500/80',
    gradientTo: 'to-blue-600/80',
    features: [
      '주요 기능 1',
      '주요 기능 2',
      '주요 기능 3'
    ],
    actionText: '체험하기',
    actionUrl: '/feature-page'
  }
];
```

### 메인 페이지 통합
```typescript
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* 기존 헤더 유지 */}
      <header>...</header>
      
      {/* 타이틀 섹션 */}
      <motion.div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white">
          프로젝트명 <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">AI</span>
        </h1>
      </motion.div>
      
      {/* 카드 그리드 */}
      <FeatureCardsGrid />
    </div>
  );
}
```

## 🚀 성능 최적화 팁

1. **애니메이션**: `transform`과 `opacity`만 사용
2. **이미지**: WebP 포맷 + 적절한 사이즈
3. **모달**: 필요시에만 렌더링 (조건부 렌더링)
4. **아이콘**: 필요한 것만 import
5. **번들 크기**: 동적 import 활용

## 📋 체크리스트

### 개발 완료 확인
- [ ] 카드 컴포넌트 구현
- [ ] 모달 컴포넌트 구현
- [ ] 반응형 레이아웃 구현
- [ ] 애니메이션 적용
- [ ] 특수 효과 (있는 경우)

### 테스트 항목
- [ ] 모바일 (375px~767px)
- [ ] 태블릿 (768px~1279px)
- [ ] 데스크톱 (1280px+)
- [ ] 카드 호버 효과
- [ ] 모달 오픈/닫기
- [ ] 페이지 네비게이션

### 접근성 확인
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 호환
- [ ] 포커스 인디케이터
- [ ] 적절한 대비율

## 💡 확장 아이디어

### 고급 기능
- 카드 내 실시간 데이터 표시
- 드래그 앤 드롭으로 카드 순서 변경
- 다크/라이트 모드 토글
- 사용자 커스터마이징

### 특수 효과
- 3D 카드 뒤집기 효과
- 파티클 배경 애니메이션
- 마우스 팔로우 효과
- 마이크로 인터랙션

---

## 📝 구현 가이드

1. **기존 구조 파악**: 현재 홈페이지에서 유지할 요소 식별
2. **카드 데이터 정의**: 표시할 기능들을 카드 형태로 구조화
3. **컴포넌트 개발**: FeatureCard → FeatureModal → FeatureCardsGrid 순서
4. **애니메이션 적용**: Framer Motion으로 진입/호버/클릭 효과
5. **반응형 테스트**: 모든 디바이스에서 테스트
6. **성능 최적화**: 번들 크기와 렌더링 성능 최적화

이 템플릿을 사용하여 어떤 웹사이트든 **모던하고 인터랙티브한 카드 기반 홈페이지**로 업그레이드할 수 있습니다! 🚀 