---
id: react-hooks
title: React Hooks Collection
keywords: [hooks, react, typescript, custom-hooks]
priority: high
ai_optimized: true
---

# React Hooks Collection

## 🔄 Data Fetching Hooks

```typescript
// useServerMetrics - Server metrics with caching
export function useServerMetrics(serverId?: string, timeRange = '1h') {
  const [data, setData] = useState<ServerMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    
    const fetchMetrics = async () => {
      try {
        setLoading(true)
        const response = await fetch(
          `/api/servers/${serverId}/metrics?range=${timeRange}`
        )
        
        if (!mounted) return
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const result = await response.json()
        setData(result.data)
        setError(null)
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    fetchMetrics()
    return () => { mounted = false }
  }, [serverId, timeRange])

  return { data, loading, error, refetch: () => {} }
}
```

## ⚡ Real-time Hooks

```typescript
// useRealTimeMetrics - WebSocket connection
export function useRealTimeMetrics(serverId: string) {
  const [metrics, setMetrics] = useState<ServerMetric[]>([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    const ws = new WebSocket(`wss://api.example.com/metrics/${serverId}`)
    
    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const newMetric = JSON.parse(event.data)
      setMetrics(prev => [...prev.slice(-99), newMetric]) // Keep last 100
    }
    
    return () => {
      ws.close()
    }
  }, [serverId])

  return { metrics, connected }
}
```

## 🔔 Notification Hooks

```typescript
// useNotifications - Toast notifications
export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((
    message: string, 
    type: 'success' | 'error' | 'warning' = 'success'
  ) => {
    const id = Date.now().toString()
    const notification = { id, message, type, timestamp: Date.now() }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  return { notifications, addNotification, removeNotification }
}
```

## 💾 Storage Hooks

```typescript
// useLocalStorage - Persistent state
export function useLocalStorage<T>(
  key: string, 
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue
    
    try {
      const item = window.localStorage.getItem(key)
      return item ? JSON.parse(item) : defaultValue
    } catch {
      return defaultValue
    }
  })

  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.warn(`Failed to save to localStorage:`, error)
    }
  }, [key, value])

  return [value, setValue]
}
```

## 🎛️ Form Hooks

```typescript
// useForm - Form state management
export function useForm<T extends Record<string, any>>(
  initialValues: T,
  validate?: (values: T) => Record<string, string>
) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const validateForm = useCallback(() => {
    if (!validate) return true
    
    const newErrors = validate(values)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0
  }
}
```

## 🔍 Search Hook

```typescript
// useDebounceSearch - Debounced search
export function useDebounceSearch<T>(
  items: T[],
  searchFn: (item: T, query: string) => boolean,
  delay = 300
) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query)
    }, delay)

    return () => clearTimeout(timer)
  }, [query, delay])

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items
    return items.filter(item => searchFn(item, debouncedQuery))
  }, [items, debouncedQuery, searchFn])

  return {
    query,
    setQuery,
    filteredItems,
    isSearching: query !== debouncedQuery
  }
}
```

## 🎯 Performance Hooks

```typescript
// useThrottle - Throttled values
export function useThrottle<T>(value: T, delay: number): T {
  const [throttledValue, setThrottledValue] = useState(value)
  const lastRan = useRef(Date.now())

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= delay) {
        setThrottledValue(value)
        lastRan.current = Date.now()
      }
    }, delay - (Date.now() - lastRan.current))

    return () => clearTimeout(handler)
  }, [value, delay])

  return throttledValue
}
```