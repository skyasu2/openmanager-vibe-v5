# 🎨 ShadCN UI MCP 도구 가이드

> **UI 컴포넌트 시스템 - 46개 컴포넌트 완전 활용**  
> 4개 도구 | React 컴포넌트 자동 생성, 디자인 시스템 통합, 블록 및 템플릿

## 🎯 ShadCN UI MCP 개요

ShadCN UI MCP는 OpenManager VIBE v5의 **UI 컴포넌트 생성 시스템**으로, 46개의 고품질 React 컴포넌트를 자동으로 생성하고 관리할 수 있습니다.

### 🏗️ 핵심 기능

- **46개 UI 컴포넌트**: Button, Card, Dialog, Form 등 완전한 디자인 시스템
- **자동 코드 생성**: TypeScript + Tailwind CSS 기반 
- **커스터마이징**: 프로젝트 요구사항에 맞춘 수정 가능
- **일관성 보장**: 통일된 디자인 언어와 접근성 기준

---

## 🛠️ 도구 목록

### 1. `mcp__shadcn__list_components`

**사용 가능한 모든 컴포넌트 목록 조회**

```typescript
await mcp__shadcn__list_components();

// 반환값 예시 (46개 컴포넌트)
{
  "components": [
    "accordion", "alert", "alert-dialog", "aspect-ratio",
    "avatar", "badge", "breadcrumb", "button", "calendar",
    "card", "carousel", "chart", "checkbox", "collapsible",
    "command", "context-menu", "data-table", "date-picker",
    "dialog", "drawer", "dropdown-menu", "form", "hover-card",
    "input", "input-otp", "label", "menubar", "navigation-menu",
    "pagination", "popover", "progress", "radio-group",
    "resizable", "scroll-area", "select", "separator",
    "sheet", "skeleton", "slider", "sonner", "switch",
    "table", "tabs", "textarea", "toast", "toggle",
    "toggle-group", "tooltip"
  ],
  "count": 46
}
```

**활용 시나리오**:
- 프로젝트 시작 시 사용 가능한 컴포넌트 파악
- 새로운 컴포넌트 이름 확인
- 디자인 시스템 계획 수립

### 2. `mcp__shadcn__get_component`

**특정 컴포넌트 코드 생성**

```typescript
await mcp__shadcn__get_component({
  name: string  // 컴포넌트 이름
});

// 실제 사용 예시 - Button 컴포넌트
await mcp__shadcn__get_component({
  name: "button"
});

// 반환값: 완전한 TypeScript + React 컴포넌트 코드
```

**생성되는 코드 특징**:
- TypeScript 완전 지원
- Tailwind CSS 기반 스타일링
- Radix UI 접근성 기준 준수
- Variant 시스템으로 다양한 스타일 지원

### 3. `mcp__shadcn__list_blocks`

**사용 가능한 블록 템플릿 목록 조회**

```typescript
await mcp__shadcn__list_blocks();

// 반환값 예시
{
  "blocks": [
    "authentication-01", "authentication-02", "authentication-03",
    "charts-01", "charts-02", "dashboard-01", "dashboard-02",
    "forms-01", "forms-02", "landing-01", "landing-02"
    // ... 더 많은 블록들
  ],
  "categories": [
    "authentication", "charts", "dashboard", "forms", "landing"
  ]
}
```

**블록 카테고리**:
- **Authentication**: 로그인, 회원가입 페이지
- **Dashboard**: 관리자 대시보드 레이아웃
- **Charts**: 다양한 차트 및 데이터 시각화
- **Forms**: 복잡한 폼 레이아웃
- **Landing**: 랜딩 페이지 섹션

### 4. `mcp__shadcn__get_block`

**특정 블록 템플릿 코드 생성**

```typescript
await mcp__shadcn__get_block({
  name: string  // 블록 이름
});

// 실제 사용 예시 - 대시보드 블록
await mcp__shadcn__get_block({
  name: "dashboard-01"
});

// 반환값: 완전한 페이지 레벨 컴포넌트 코드
```

---

## 🎯 실전 활용 패턴

### 패턴 1: 기본 컴포넌트 구성

```typescript
// 1. 프로젝트에 필요한 기본 컴포넌트들 확인
const components = await mcp__shadcn__list_components();

// 2. 핵심 컴포넌트들 생성
const buttonCode = await mcp__shadcn__get_component({ name: "button" });
const cardCode = await mcp__shadcn__get_component({ name: "card" });
const dialogCode = await mcp__shadcn__get_component({ name: "dialog" });

// 3. 프로젝트 컴포넌트 폴더에 저장
// components/ui/button.tsx
// components/ui/card.tsx  
// components/ui/dialog.tsx
```

### 패턴 2: 완전한 페이지 구성

```typescript
// 1. 적합한 블록 템플릿 찾기
const blocks = await mcp__shadcn__list_blocks();

// 2. 대시보드 페이지 생성
const dashboardCode = await mcp__shadcn__get_block({ 
  name: "dashboard-01" 
});

// 3. 인증 페이지 생성
const authCode = await mcp__shadcn__get_block({ 
  name: "authentication-01" 
});
```

### 패턴 3: 서버 모니터링 UI 구성

```typescript
// OpenManager VIBE v5에 특화된 컴포넌트 조합

// 1. 기본 UI 컴포넌트
const cardCode = await mcp__shadcn__get_component({ name: "card" });
const badgeCode = await mcp__shadcn__get_component({ name: "badge" });
const progressCode = await mcp__shadcn__get_component({ name: "progress" });

// 2. 차트 및 데이터 시각화
const chartCode = await mcp__shadcn__get_component({ name: "chart" });
const tableCode = await mcp__shadcn__get_component({ name: "table" });

// 3. 대시보드 레이아웃
const dashboardBlock = await mcp__shadcn__get_block({ name: "dashboard-01" });

// 결과: 서버 상태 카드, 메트릭 차트, 서버 목록 테이블 완성
```

---

## 🎨 컴포넌트 커스터마이징

### 기본 변형(Variant) 활용

```typescript
// Button 컴포넌트 variants
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>  
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>

// 크기 variants
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon">Icon Only</Button>
```

### 커스텀 스타일 적용

```typescript
// Tailwind CSS 클래스로 추가 커스터마이징
<Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
  Gradient Button
</Button>

// OpenManager VIBE v5 브랜딩
<Card className="bg-gradient-to-br from-emerald-50/80 via-white/90 to-emerald-50/60 backdrop-blur-sm">
  Server Status Card
</Card>
```

### 접근성 강화

```typescript
// ARIA 속성 활용
<Button 
  aria-label="서버 재시작"
  aria-describedby="restart-help"
>
  재시작
</Button>

// 키보드 네비게이션 지원
<Dialog>
  <DialogTrigger asChild>
    <Button>설정 열기</Button>
  </DialogTrigger>
  <DialogContent className="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>서버 설정</DialogTitle>
    </DialogHeader>
    {/* 포커스 트랩 자동 적용 */}
  </DialogContent>
</Dialog>
```

---

## 📊 성능 최적화

### 컴포넌트 지연 로딩

```typescript
// 큰 컴포넌트의 경우 지연 로딩 적용
const Chart = lazy(() => import('@/components/ui/chart'));
const DataTable = lazy(() => import('@/components/ui/data-table'));

// Suspense로 로딩 상태 관리
<Suspense fallback={<Skeleton className="h-64 w-full" />}>
  <Chart data={serverMetrics} />
</Suspense>
```

### Bundle 크기 최적화

```typescript
// 필요한 컴포넌트만 import
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

// 전체 import 지양
import * as UI from "@/components/ui"; // ❌
```

---

## 🏆 베스트 프랙티스

### 1. 일관된 디자인 시스템

```typescript
// Design tokens 정의 (tailwind.config.js)
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#22c55e',
          900: '#14532d',
        }
      }
    }
  }
}

// 컴포넌트에서 일관된 색상 사용
<Button variant="default" className="bg-primary-500 hover:bg-primary-600">
```

### 2. 타입 안전성

```typescript
// 컴포넌트 Props 타입 정의
interface ServerCardProps {
  server: {
    id: string;
    name: string;
    status: 'online' | 'warning' | 'critical';
    metrics: {
      cpu: number;
      memory: number;
    };
  };
}

const ServerCard: React.FC<ServerCardProps> = ({ server }) => {
  return (
    <Card>
      <CardHeader>
        <Badge variant={server.status === 'online' ? 'default' : 'destructive'}>
          {server.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <Progress value={server.metrics.cpu} className="mb-2" />
        <Progress value={server.metrics.memory} />
      </CardContent>
    </Card>
  );
};
```

### 3. 접근성 우선 설계

```typescript
// Screen reader 지원
<Card role="region" aria-label={`서버 ${server.name} 상태`}>
  <CardHeader>
    <h3 className="sr-only">서버 상태 정보</h3>
    <Badge aria-label={`상태: ${server.status}`}>
      {server.status}
    </Badge>
  </CardHeader>
</Card>
```

---

## 🔧 문제 해결

### 일반적인 오류

1. **컴포넌트 이름 오타**: `mcp__shadcn__list_components()`로 정확한 이름 확인
2. **스타일 충돌**: Tailwind CSS 설정 확인
3. **타입 오류**: @types/react 버전 호환성 점검

### 디버깅 팁

```typescript
// 컴포넌트 목록에서 이름 확인
const { components } = await mcp__shadcn__list_components();
console.log('사용 가능한 컴포넌트:', components);

// 특정 컴포넌트 코드 미리보기
const code = await mcp__shadcn__get_component({ name: "button" });
console.log('생성된 코드 미리보기:', code.substring(0, 200) + '...');
```

---

## 📚 참고 자료

- **[ShadCN UI 공식 문서](https://ui.shadcn.com/)**
- **[Radix UI 접근성 가이드](https://www.radix-ui.com/primitives)**
- **[Tailwind CSS 문서](https://tailwindcss.com/docs)**
- **[MCP 메인 가이드](../MCP-GUIDE.md)**

---

**💡 팁**: ShadCN UI 컴포넌트는 Copy & Paste 방식이므로 생성 후 프로젝트 요구사항에 맞게 자유롭게 수정할 수 있습니다. 일관성을 위해 Design System을 먼저 정의하는 것을 추천합니다.