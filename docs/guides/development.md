---
id: development-guide
title: Development Guide
keywords: [development, workflow, typescript, testing]
priority: high
ai_optimized: true
---

# Development Guide

## 🛠️ Development Workflow

```bash
# Setup development environment
npm install
npm run dev

# Development commands
npm run type-check     # TypeScript validation
npm run lint          # ESLint check
npm run test          # Run tests
npm run build         # Production build
```

## 📁 Project Structure

```
src/
├── app/              # Next.js 15 App Router
│   ├── api/         # API routes (76 endpoints)
│   ├── dashboard/   # Dashboard pages
│   └── globals.css  # Global styles
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── charts/      # Chart components  
│   └── features/    # Feature components
├── lib/             # Core utilities
│   ├── supabase.ts  # Database client
│   ├── utils.ts     # Helper functions
│   └── validation.ts # Zod schemas
├── hooks/           # Custom React hooks
├── services/        # Business logic
└── types/          # TypeScript definitions
```

## 🎯 Development Principles

```typescript
// 1. Type-First Development
interface Server {
  id: string
  name: string
  status: 'healthy' | 'warning' | 'critical'
}

// 2. Component-Driven Architecture  
const ServerCard = ({ server }: { server: Server }) => {
  return <Card>...</Card>
}

// 3. Hook-Based State Management
const useServerData = (serverId: string) => {
  const [data, setData] = useState<Server | null>(null)
  // Implementation...
  return { data, loading, error }
}
```

## 🧪 Testing Strategy

```typescript
// Unit Tests with Vitest
import { describe, it, expect } from 'vitest'

describe('formatBytes', () => {
  it('formats bytes correctly', () => {
    expect(formatBytes(1024)).toBe('1 KB')
    expect(formatBytes(1048576)).toBe('1 MB')
  })
})

// Component Tests  
import { render, screen } from '@testing-library/react'

test('renders server card', () => {
  render(<ServerCard server={mockServer} />)
  expect(screen.getByText('Server 1')).toBeInTheDocument()
})
```

## 🎨 Styling Guidelines

```typescript
// Tailwind CSS with shadcn/ui
const Button = ({ variant = "default", ...props }) => (
  <button
    className={cn(
      "inline-flex items-center justify-center rounded-md",
      variant === "default" && "bg-primary text-primary-foreground",
      variant === "outline" && "border border-input"
    )}
    {...props}
  />
)
```

## 📊 Code Quality

```bash
# Quality gates
npm run validate:all   # All checks combined
npm run lint:fix      # Auto-fix linting issues  
npm run format        # Prettier formatting

# Pre-commit hooks (Husky)
npm run prepare       # Setup Git hooks
```