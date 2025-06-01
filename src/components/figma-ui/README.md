# 🎨 Figma UI Components

OpenManager v5에 최적화된 현대적이고 재사용 가능한 UI 컴포넌트 라이브러리입니다.

## 📦 설치 및 설정

```bash
# 의존성이 이미 설치되어 있음 (Tailwind CSS, Framer Motion, ShadCN UI)
npm install framer-motion lucide-react
```

## 🚀 사용법

### 기본 Import

```typescript
import { 
  HeroSection, 
  FeatureCards, 
  SidebarNavigation, 
  ModalTemplate 
} from '@/components/figma-ui';
```

## 📱 컴포넌트 가이드

### 1. Hero Section

랜딩페이지용 히어로 섹션 컴포넌트

#### 기본 사용법

```tsx
<HeroSection
  title="차세대 서버 모니터링 플랫폼"
  subtitle="OpenManager v5"
  description="실시간 AI 분석과 예측적 모니터링으로 서버 인프라를 완벽하게 관리하세요."
  primaryCTA={{
    label: "무료로 시작하기",
    href: "/dashboard",
    onClick: () => router.push('/dashboard')
  }}
  secondaryCTA={{
    label: "데모 보기",
    href: "/demo"
  }}
  showStats={true}
  stats={{
    servers: 10000,
    uptime: "99.9%",
    response: "< 100ms"
  }}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | "차세대 서버 모니터링 플랫폼" | 메인 타이틀 |
| `subtitle` | `string` | "OpenManager v5" | 서브 타이틀 |
| `description` | `string` | 기본 설명 | 설명 텍스트 |
| `primaryCTA` | `{ label, href, onClick }` | 기본값 | 주요 버튼 |
| `secondaryCTA` | `{ label, href, onClick }` | 기본값 | 보조 버튼 |
| `features` | `string[]` | 기본 기능 목록 | 기능 리스트 |
| `backgroundGradient` | `string` | Tailwind 그라디언트 | 배경 스타일 |
| `showStats` | `boolean` | `true` | 통계 표시 여부 |
| `stats` | `{ servers, uptime, response }` | 기본 통계 | 통계 데이터 |

### 2. Feature Cards

기능 소개 카드 섹션

#### 기본 사용법

```tsx
<FeatureCards
  title="핵심 기능"
  subtitle="OpenManager v5의 강력한 기능들"
  layout="grid"
  showBenefits={true}
  backgroundStyle="gradient"
/>
```

#### 커스텀 카드 데이터

```tsx
const customCards = [
  {
    id: 'custom-feature',
    icon: Brain,
    title: '커스텀 기능',
    description: '사용자 정의 기능 설명',
    benefits: ['장점 1', '장점 2'],
    gradient: 'from-blue-500 to-purple-600',
    accentColor: 'blue'
  }
];

<FeatureCards cards={customCards} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `title` | `string` | "핵심 기능" | 섹션 타이틀 |
| `subtitle` | `string` | 기본 서브타이틀 | 섹션 서브타이틀 |
| `description` | `string` | 기본 설명 | 섹션 설명 |
| `cards` | `FeatureCardData[]` | 기본 카드 | 카드 데이터 배열 |
| `layout` | `'grid' \| 'carousel'` | `'grid'` | 레이아웃 타입 |
| `showBenefits` | `boolean` | `true` | 장점 표시 여부 |
| `backgroundStyle` | `'light' \| 'dark' \| 'gradient'` | `'light'` | 배경 스타일 |

### 3. Sidebar Navigation

사이드바 네비게이션 컴포넌트

#### 기본 사용법

```tsx
const [isOpen, setIsOpen] = useState(true);
const [isCollapsed, setIsCollapsed] = useState(false);

<SidebarNavigation
  isOpen={isOpen}
  isCollapsed={isCollapsed}
  onToggle={() => setIsOpen(!isOpen)}
  onCollapse={setIsCollapsed}
  onItemClick={(item) => router.push(item.href!)}
  currentPath="/dashboard"
  variant="glass"
  showSearch={true}
  showUserProfile={true}
  userProfile={{
    name: "김개발자",
    email: "dev@example.com",
    role: "관리자"
  }}
/>
```

#### 커스텀 네비게이션 아이템

```tsx
const customNavItems = [
  {
    id: 'dashboard',
    label: '대시보드',
    icon: Home,
    href: '/dashboard'
  },
  {
    id: 'monitoring',
    label: '모니터링',
    icon: Activity,
    href: '/monitoring',
    badge: '실시간',
    children: [
      { id: 'servers', label: '서버', icon: Database, href: '/monitoring/servers' }
    ]
  }
];

<SidebarNavigation items={customNavItems} />
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | `true` | 사이드바 열림 상태 |
| `isCollapsed` | `boolean` | `false` | 접힘 상태 |
| `onToggle` | `() => void` | - | 토글 핸들러 |
| `onCollapse` | `(collapsed: boolean) => void` | - | 접기 핸들러 |
| `onItemClick` | `(item: NavItem) => void` | - | 아이템 클릭 핸들러 |
| `items` | `NavItem[]` | 기본 아이템 | 네비게이션 아이템 |
| `currentPath` | `string` | `'/dashboard'` | 현재 경로 |
| `variant` | `'light' \| 'dark' \| 'glass'` | `'light'` | 테마 변형 |
| `showSearch` | `boolean` | `true` | 검색 표시 여부 |
| `showUserProfile` | `boolean` | `true` | 사용자 프로필 표시 여부 |

### 4. Modal Template

재사용 가능한 모달 템플릿

#### 기본 모달

```tsx
const [isOpen, setIsOpen] = useState(false);

<ModalTemplate
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="모달 제목"
  description="모달 설명"
  size="md"
  variant="default"
  actions={[
    {
      label: "취소",
      onClick: () => setIsOpen(false),
      variant: "ghost"
    },
    {
      label: "확인",
      onClick: handleConfirm,
      variant: "primary"
    }
  ]}
>
  <div>모달 콘텐츠</div>
</ModalTemplate>
```

#### 프리셋 모달

```tsx
// 확인 모달
<ConfirmModal
  isOpen={showConfirm}
  onClose={() => setShowConfirm(false)}
  onConfirm={handleDelete}
  title="삭제 확인"
  description="정말로 삭제하시겠습니까?"
  variant="error"
/>

// 정보 모달
<InfoModal
  isOpen={showInfo}
  onClose={() => setShowInfo(false)}
  title="안내"
  description="작업이 완료되었습니다."
>
  <div>추가 정보</div>
</InfoModal>

// 폼 모달
<FormModal
  isOpen={showForm}
  onClose={() => setShowForm(false)}
  title="데이터 입력"
  onSubmit={handleSubmit}
  size="lg"
>
  <form>폼 콘텐츠</form>
</FormModal>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `isOpen` | `boolean` | - | 모달 열림 상태 |
| `onClose` | `() => void` | - | 닫기 핸들러 |
| `title` | `string` | - | 모달 제목 |
| `description` | `string` | - | 모달 설명 |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | 모달 크기 |
| `variant` | `'default' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | 모달 변형 |
| `actions` | `ModalAction[]` | `[]` | 액션 버튼 |
| `animation` | `'scale' \| 'slide' \| 'fade'` | `'scale'` | 애니메이션 타입 |

## 🎨 디자인 토큰

```typescript
import { designTokens } from '@/components/figma-ui';

// 컬러 사용
const primaryColor = designTokens.colors.primary[500];

// 스페이싱 사용
const spacing = designTokens.spacing.lg;
```

## ✨ 애니메이션 프리셋

```typescript
import { animationPresets } from '@/components/figma-ui';

<motion.div {...animationPresets.slideUp}>
  애니메이션 적용된 컴포넌트
</motion.div>
```

## 🚀 Vercel 최적화

### Dynamic Import 사용

```typescript
import dynamic from 'next/dynamic';

const HeroSection = dynamic(() => import('@/components/figma-ui/HeroSection'), {
  ssr: false,
  loading: () => <div>Loading...</div>
});
```

### 코드 스플리팅

```typescript
import { FigmaUIKit } from '@/components/figma-ui';

const LazyHeroSection = await FigmaUIKit.HeroSection();
```

## 📱 반응형 지원

모든 컴포넌트는 Tailwind CSS 반응형 브레이크포인트를 지원합니다:

- `sm`: 640px+
- `md`: 768px+
- `lg`: 1024px+
- `xl`: 1280px+
- `2xl`: 1536px+

## 🔧 커스터마이징

### 테마 확장

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'figma-primary': '#3b82f6',
        'figma-secondary': '#64748b'
      }
    }
  }
}
```

### 컴포넌트 확장

```tsx
interface ExtendedHeroProps extends HeroSectionProps {
  customProp?: string;
}

const CustomHero: React.FC<ExtendedHeroProps> = (props) => {
  return <HeroSection {...props} />;
};
```

## 🧪 테스트

```typescript
import { render, screen } from '@testing-library/react';
import { HeroSection } from '@/components/figma-ui';

test('renders hero section', () => {
  render(<HeroSection title="Test Title" />);
  expect(screen.getByText('Test Title')).toBeInTheDocument();
});
```

## 📊 성능 지표

- **번들 크기**: ~45KB (gzipped)
- **로드 시간**: < 100ms
- **Tree-shaking 지원**: ✅
- **TypeScript 지원**: ✅
- **SSR 호환**: ✅

## 🤝 기여

1. 새로운 컴포넌트는 `src/components/figma-ui/` 에 추가
2. Props 인터페이스를 export
3. README 업데이트
4. 타입 검사 및 테스트 통과

## 📄 라이센스

MIT License - OpenManager v5 Project

---

**Made with ❤️ for OpenManager v5** 