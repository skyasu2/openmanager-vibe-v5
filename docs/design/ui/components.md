---
id: ui-components
title: UI Components Guide
keywords: [components, shadcn, react, tailwind]
priority: high
ai_optimized: true
---

# UI Components Guide

## 🎨 Component System

```typescript
// Core component structure
src/components/
├── ui/           // shadcn/ui components
├── charts/       // Chart components
├── layout/       // Layout components
├── forms/        // Form components
└── features/     // Feature components
```

## 📊 Server Card Component

```typescript
// src/components/features/ServerCard.tsx
interface ServerCardProps {
  server: Server
  metrics: ServerMetrics[]
  onServerClick: (serverId: string) => void
}

export const ServerCard = ({ server, metrics, onServerClick }: ServerCardProps) => {
  const status = getServerStatus(server.cpu, server.memory)
  
  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-sm font-medium">{server.name}</CardTitle>
          <p className="text-xs text-muted-foreground">{server.type}</p>
        </div>
        <StatusBadge status={status} />
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <MetricItem label="CPU" value={server.cpu} />
          <MetricItem label="Memory" value={server.memory} />
        </div>
        
        <MiniChart data={metrics} />
      </CardContent>
    </Card>
  )
}
```

## 🎭 Status Badge System

```typescript
// Status color mapping
const statusConfig = {
  healthy: {
    color: 'bg-green-500',
    textColor: 'text-green-700',
    label: 'Healthy'
  },
  warning: {
    color: 'bg-yellow-500', 
    textColor: 'text-yellow-700',
    label: 'Warning'
  },
  critical: {
    color: 'bg-red-500',
    textColor: 'text-red-700',
    label: 'Critical'
  }
}

export const StatusBadge = ({ status }: { status: ServerStatus }) => {
  const config = statusConfig[status]
  return (
    <Badge className={`${config.color} ${config.textColor}`}>
      {config.label}
    </Badge>
  )
}
```

## 📈 Chart Components

```typescript
// Recharts wrapper
export const MiniChart = ({ data }: { data: MetricPoint[] }) => (
  <ResponsiveContainer width="100%" height={60}>
    <LineChart data={data}>
      <Line 
        type="monotone" 
        dataKey="cpu" 
        stroke="hsl(var(--primary))" 
        strokeWidth={2}
        dot={false}
      />
    </LineChart>
  </ResponsiveContainer>
)

// Chart color system
const chartColors = {
  cpu: 'hsl(var(--chart-1))',      // Blue
  memory: 'hsl(var(--chart-2))',   // Orange  
  disk: 'hsl(var(--chart-3))',     // Green
  network: 'hsl(var(--chart-4))'   // Purple
}
```

## 🎯 Design Tokens

```css
/* CSS Variables for consistency */
:root {
  --radius: 0.5rem;
  --chart-1: 220 70% 50%;
  --chart-2: 25 95% 53%;
  --chart-3: 142 76% 36%;
  --chart-4: 262 83% 58%;
}

/* Component sizing */
.server-card {
  @apply w-full max-w-sm p-6 rounded-lg border bg-card;
}

.metric-item {
  @apply flex items-center justify-between py-2;
}
```

## 🔄 Loading States

```typescript
// Skeleton components
export const ServerCardSkeleton = () => (
  <Card className="w-full max-w-sm">
    <CardHeader>
      <Skeleton className="h-4 w-[200px]" />
      <Skeleton className="h-3 w-[100px]" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
      <Skeleton className="h-[60px] w-full" />
    </CardContent>
  </Card>
)
```

## ♿ Accessibility Features

```typescript
// WCAG 2.1 compliance
export const AccessibleServerCard = ({ server }: ServerCardProps) => (
  <Card
    role="article"
    aria-labelledby={`server-${server.id}-title`}
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        onServerClick(server.id)
      }
    }}
  >
    <CardHeader>
      <CardTitle 
        id={`server-${server.id}-title`}
        aria-label={`Server ${server.name}, Type: ${server.type}`}
      >
        {server.name}
      </CardTitle>
    </CardHeader>
  </Card>
)
```