# Server Card Design Specification v1.0

> OpenManager VIBE v5 - 서버 카드 컴포넌트 디자인 스펙
> Figma 연동 또는 직접 구현용

## 1. 컴포넌트 개요

```
┌─────────────────────────────────────────────────────┐
│  [Icon]  Server Name            [Status Badge]      │
│          Type • Location        [Trend] [Network]   │
├─────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐│
│  │ CPU     │  │ MEM     │  │ DISK    │  │ NET     ││
│  │  ~~~    │  │  ~~~    │  │  ~~~    │  │  ~~~    ││
│  │  45%    │  │  72%    │  │  38%    │  │  56%    ││
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘│
└─────────────────────────────────────────────────────┘
```

## 2. 상태별 색상 시스템

### Light Mode (현재 적용)

| Status | Background Gradient | Border | Text | Chart Color |
|--------|---------------------|--------|------|-------------|
| **Normal** | `from-emerald-50 to-green-50` | `border-emerald-200` | `text-emerald-800` | `#10b981` |
| **Warning** | `from-amber-50 to-yellow-50` | `border-amber-200` | `text-amber-800` | `#f59e0b` |
| **Critical** | `from-rose-50 to-red-50` | `border-rose-200` | `text-rose-800` | `#ef4444` |
| **Offline** | `from-slate-50 to-gray-50` | `border-slate-200` | `text-slate-600` | `#64748b` |

### 통합 차트 색상 규칙 (구현됨)
```typescript
// 전체 메트릭 중 최대값 기준
if (maxMetric >= 90) return '#ef4444'; // Critical - Red
if (maxMetric >= 70) return '#f59e0b'; // Warning - Yellow
return '#10b981';                       // Normal - Green
```

## 3. 레이아웃 규격

### Card Container
```css
/* Base Card */
.server-card {
  padding: 24px;              /* p-6 */
  border-radius: 16px;        /* rounded-2xl */
  min-height: 240px;
  border-width: 2px;
  backdrop-filter: blur(12px);
  box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
}

/* Compact Card */
.server-card-compact {
  padding: 16px;              /* p-4 */
  min-height: 160px;
}
```

### Header Section
```
┌──────────────────────────────────────────────────┐
│ [48px Icon Area]  [Title + Subtitle]  [Badge]    │
│                                                   │
│ Icon: 40x40px, rounded-xl, status-bg             │
│ Title: text-lg (18px), font-bold                 │
│ Subtitle: text-xs (12px), text-gray-600          │
│ Badge: px-4 py-2, rounded-full                   │
└──────────────────────────────────────────────────┘
```

### Chart Grid
```
┌─────────────────────────────────────────────────┐
│  2x2 Grid Layout (gap: 12px)                    │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Icon + Label │  │ Icon + Label │            │
│  │ [SVG Chart]  │  │ [SVG Chart]  │            │
│  │   Value %    │  │   Value %    │            │
│  └──────────────┘  └──────────────┘            │
│                                                  │
│  Chart Size: 80x64px (w-20 h-16)               │
│  Compact: 100% width x 40px height             │
└─────────────────────────────────────────────────┘
```

## 4. 타이포그래피

| Element | Size | Weight | Color |
|---------|------|--------|-------|
| Server Name | 18px (text-lg) | 700 (bold) | `text-gray-900` |
| Server Type | 12px (text-xs) | 500 (medium) | `text-gray-600` |
| Metric Label | 12px (text-xs) | 600 (semibold) | `text-gray-700` |
| Metric Value | 14px (text-sm) | 700 (bold) | Status-based |
| Status Badge | 12px (text-xs) | 700 (bold) | Status-based |

## 5. 아이콘 시스템

### Server Type Icons (Lucide React)
```typescript
const SERVER_ICONS = {
  // Web Servers
  nginx: Server,
  apache: Server,
  web: Server,

  // App Servers
  nodejs: GitBranch,
  springboot: Settings,
  django: Code,

  // Databases
  mysql: Database,
  postgresql: Database,
  mongodb: FileText,

  // Infrastructure
  redis: Zap,
  kafka: Network,
  haproxy: Layers,

  // Default
  default: Cloud,
};
```

### Metric Icons
- CPU: `<Cpu className="w-3 h-3" />`
- Memory: `<Activity className="w-3 h-3" />`
- Disk: `<HardDrive className="w-3 h-3" />`
- Network: `<Network className="w-3 h-3" />`

## 6. 미니 차트 스펙

### SVG Structure
```xml
<svg viewBox="0 0 100 100" preserveAspectRatio="none">
  <!-- Background Grid (optional) -->
  <pattern id="grid" width="8" height="8">
    <path d="M 8 0 L 0 0 0 8" stroke="#e2e8f0" stroke-width="0.2"/>
  </pattern>

  <!-- Gradient Fill Area -->
  <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color={chartColor} stop-opacity="0.6"/>
    <stop offset="40%" stop-color={chartColor} stop-opacity="0.3"/>
    <stop offset="100%" stop-color={chartColor} stop-opacity="0.05"/>
  </linearGradient>

  <!-- Area Fill -->
  <polygon fill="url(#chartGradient)" points="0,100 ...data... 100,100"/>

  <!-- Line -->
  <polyline
    fill="none"
    stroke={chartColor}
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    points="...data..."
  />

  <!-- Current Value Point -->
  <circle cx="100" cy={y} r="3" fill={chartColor} stroke="white" stroke-width="2"/>
</svg>
```

### Compact Mode (40px height)
```xml
<svg viewBox="0 0 100 40" preserveAspectRatio="none">
  <!-- Simplified: gradient fill + line only -->
</svg>
```

## 7. 애니메이션

### Hover Effect
```css
.server-card:hover {
  transform: scale(1.025) translateY(-2px);
  transition: all 0.2s ease-out;
}
```

### Status Pulse (Critical)
```css
@keyframes pulse-critical {
  0%, 100% { opacity: 0.8; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.1); }
}

.critical-indicator {
  animation: pulse-critical 1.5s infinite;
}
```

### Value Badge Animation (≥90%)
```css
.value-badge-critical {
  animation: scale-pulse 2s infinite;
}

@keyframes scale-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}
```

## 8. 반응형 브레이크포인트

| Breakpoint | Cards/Row | Card Variant |
|------------|-----------|--------------|
| < 640px | 1 | Compact |
| 640-768px | 2 | Compact |
| 768-1024px | 3 | Default |
| 1024-1280px | 4 | Default |
| 1280-1536px | 5 | Default |
| > 1536px | 6 | Default/Detailed |

## 9. 접근성 (A11y)

```html
<article
  role="article"
  aria-label="${serverName} 서버 - 상태: ${status}, CPU: ${cpu}%, 메모리: ${memory}%"
  tabindex="0"
>
  <svg role="img" aria-label="${metric} 사용률 ${value}% 추이 차트">
    <title>${metric}: ${value}%</title>
  </svg>
</article>
```

## 10. Tailwind CSS 클래스 요약

### Card Container
```
relative p-6 min-h-[240px] rounded-2xl cursor-pointer
bg-gradient-to-br ${statusGradient}
border-2 ${statusBorder} hover:${statusHoverBorder}
shadow-lg hover:shadow-2xl
transition-all duration-300 ease-out
backdrop-blur-lg
group overflow-hidden
focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
```

### Chart Container
```
grid grid-cols-2 gap-3
bg-white/60 rounded-2xl p-5
backdrop-blur-sm border border-white/40
shadow-inner
```

### Value Badge
```
// Normal
bg-gray-100/80 text-gray-700

// Warning (70-89%)
bg-yellow-100/80 text-yellow-700

// Critical (≥90%)
bg-red-100/80 text-red-700
```

---

## 구현 체크리스트

- [x] 통합 차트 색상 시스템
- [x] 차트 높이 증가 (40px)
- [x] 서버 타입 라벨 함수
- [x] 헤더 간격 최적화
- [ ] 서버 타입 데이터 연동 (DB)
- [ ] 상세 모드 게이지 색상 통일
- [ ] 호버 시 추가 정보 패널

---

_Last Updated: 2026-01-02_
_Version: 1.0_
