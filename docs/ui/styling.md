---
id: ui-styling
title: Styling System
keywords: [tailwind, css, design-tokens, theming]
priority: medium
ai_optimized: true
---

# Styling System

## 🎨 Design System

```typescript
// Color palette
const colors = {
  // Status colors
  success: '#10b981',   // Green
  warning: '#f59e0b',   // Yellow  
  error: '#ef4444',     // Red
  info: '#3b82f6',      // Blue
  
  // Server status mapping
  healthy: 'text-green-600 bg-green-50',
  warning: 'text-yellow-600 bg-yellow-50', 
  critical: 'text-red-600 bg-red-50'
}
```

## 🌙 Dark Mode Support

```css
/* Automatic dark mode with system preference */
@media (prefers-color-scheme: dark) {
  :root {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --accent: 217.2 32.6% 17.5%;
  }
}

/* Component dark mode variants */
.server-card {
  @apply bg-background border-border;
}

.server-card[data-status="critical"] {
  @apply bg-red-950/50 border-red-900/50 dark:bg-red-950/30;
}
```

## 📱 Responsive Design

```css
/* Mobile-first breakpoints */
.dashboard-grid {
  @apply grid gap-4 grid-cols-1;
  @apply sm:grid-cols-2;
  @apply lg:grid-cols-3; 
  @apply xl:grid-cols-4;
  @apply 2xl:grid-cols-5;
}

/* Server card responsive sizing */
.server-card {
  @apply w-full max-w-sm mx-auto;
  @apply sm:max-w-none;
}
```

## 🎭 Animation System

```css
/* Smooth transitions */
.server-card {
  @apply transition-all duration-300 ease-in-out;
  @apply hover:shadow-lg hover:scale-105;
  @apply focus:ring-2 focus:ring-primary focus:ring-offset-2;
}

/* Status animations */
.status-pulse {
  @apply animate-pulse;
}

.status-bounce {
  animation: bounce 1s infinite;
}

/* Chart animations */
.chart-enter {
  animation: slideInUp 0.3s ease-out;
}

@keyframes slideInUp {
  from {
    transform: translateY(20px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
```

## 🎯 Component Variants

```typescript
// Tailwind variants for components
const serverCardVariants = cva(
  "rounded-lg border p-4 transition-all duration-300",
  {
    variants: {
      status: {
        healthy: "border-green-200 bg-green-50",
        warning: "border-yellow-200 bg-yellow-50", 
        critical: "border-red-200 bg-red-50"
      },
      size: {
        sm: "p-3 text-sm",
        md: "p-4", 
        lg: "p-6 text-lg"
      }
    },
    defaultVariants: {
      status: "healthy",
      size: "md"
    }
  }
)

// Usage
<div className={serverCardVariants({ status: "critical", size: "lg" })}>
  Server content
</div>
```

## 🔧 CSS Custom Properties

```css
/* Dynamic theming with CSS variables */
:root {
  /* Spacing scale */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 3rem;
  
  /* Typography scale */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  
  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
}
```

## 📊 Chart Styling

```css
/* Recharts customization */
.recharts-wrapper {
  @apply rounded-lg overflow-hidden;
}

.recharts-cartesian-axis-tick-value {
  @apply text-xs fill-muted-foreground;
}

.recharts-legend-wrapper {
  @apply text-sm;
}

/* Custom tooltip */
.recharts-default-tooltip {
  @apply rounded-lg border bg-background p-3 shadow-lg;
}
```