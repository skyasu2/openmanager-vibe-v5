---
id: api-schemas
title: API Schemas
keywords: [schema, types, validation, zod]
priority: high
ai_optimized: true
---

# API Schemas

## 🏗️ Core Schemas

```typescript
// Server Schema
export const ServerSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['web', 'api', 'database', 'cache']),
  status: z.enum(['healthy', 'warning', 'critical']),
  uptime: z.number(),
  lastCheck: z.string().datetime()
})

// Metrics Schema
export const MetricsSchema = z.object({
  serverId: z.string(),
  timestamp: z.string().datetime(),
  cpu: z.number().min(0).max(100),
  memory: z.number().min(0).max(100),
  disk: z.number().min(0).max(100),
  responseTime: z.number().positive()
})
```

## 🔄 Response Wrappers

```typescript
// Success Response
export const SuccessSchema = <T>(dataSchema: z.ZodType<T>) => 
  z.object({
    success: z.literal(true),
    data: dataSchema,
    timestamp: z.string().datetime()
  })

// Error Response
export const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  code: z.number().optional()
})
```

## 📝 Schema Usage

```typescript
// Validate API input
const result = ServerSchema.safeParse(input)
if (!result.success) {
  return { error: result.error.message }
}

// Type inference
type Server = z.infer<typeof ServerSchema>
type Metrics = z.infer<typeof MetricsSchema>
```

## 🎯 Quick Reference

```typescript
// Import schemas
import { ServerSchema, MetricsSchema } from '@/schemas'

// Common patterns
const servers = ServerSchema.array()
const paginated = z.object({
  data: servers,
  total: z.number(),
  page: z.number()
})
```