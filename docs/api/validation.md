---
id: api-validation
title: API Validation
keywords: [validation, middleware, error-handling]
priority: medium
ai_optimized: true
---

# API Validation

## 🛡️ Validation Middleware

```typescript
// src/lib/validation.ts
import { NextRequest } from 'next/server'
import { z } from 'zod'

export function validateRequest<T>(schema: z.ZodType<T>) {
  return async (req: NextRequest) => {
    try {
      const body = await req.json()
      const result = schema.parse(body)
      return { success: true, data: result }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof z.ZodError 
          ? error.errors 
          : 'Invalid request'
      }
    }
  }
}
```

## 🔍 Common Validations

```typescript
// Query parameters
const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.enum(['name', 'status', 'uptime']).default('name')
})

// Time range validation
const TimeRangeSchema = z.enum(['1h', '24h', '7d', '30d'])

// Server ID validation
const ServerIdSchema = z.string().min(1).max(100)
```

## ⚡ Usage in API Routes

```typescript
// pages/api/servers/route.ts
import { validateRequest } from '@/lib/validation'

export async function POST(request: NextRequest) {
  const validation = validateRequest(ServerCreateSchema)
  const result = await validation(request)
  
  if (!result.success) {
    return Response.json(
      { error: result.error }, 
      { status: 400 }
    )
  }
  
  // Process valid data
  const server = await createServer(result.data)
  return Response.json({ success: true, data: server })
}
```

## 🎯 Error Handling

```typescript
// Standardized error responses
export const ValidationError = (errors: z.ZodError) => 
  Response.json({
    success: false,
    error: 'Validation failed',
    details: errors.errors.map(e => ({
      path: e.path.join('.'),
      message: e.message
    }))
  }, { status: 400 })

export const NotFoundError = (resource: string) =>
  Response.json({
    success: false,
    error: `${resource} not found`
  }, { status: 404 })
```