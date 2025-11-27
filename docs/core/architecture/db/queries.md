---
id: database-queries
title: Optimized Queries
keywords: [sql, performance, optimization, supabase]
priority: high
ai_optimized: true
---

# Optimized Database Queries

## 📊 Server Metrics Queries

```sql
-- Get latest metrics for all servers (optimized)
SELECT DISTINCT ON (server_id)
  server_id, timestamp, cpu, memory, disk, status
FROM server_metrics
WHERE timestamp > NOW() - INTERVAL '1 hour'
ORDER BY server_id, timestamp DESC;

-- Time-range aggregation (BRIN index optimized)
SELECT
  server_id,
  AVG(cpu) as avg_cpu,
  MAX(cpu) as max_cpu,
  AVG(memory) as avg_memory,
  COUNT(*) as sample_count
FROM server_metrics
WHERE timestamp BETWEEN $1 AND $2
  AND ($3::text IS NULL OR server_id = $3)
GROUP BY server_id
ORDER BY server_id;
```

## 🚀 Performance Query Patterns

```typescript
// TypeScript query helpers
export const getServerMetrics = async (
  serverId?: string,
  timeRange: string = '1h'
) => {
  const client = createClient();

  // Use materialized view for longer ranges
  if (['7d', '30d'].includes(timeRange)) {
    return client
      .from('server_metrics_hourly')
      .select('*')
      .gte('hour', getTimeRangeStart(timeRange))
      .eq('server_id', serverId)
      .order('hour', { ascending: false });
  }

  // Use main table for recent data
  return client
    .from('server_metrics')
    .select('server_id, timestamp, cpu, memory, disk, status')
    .gte('timestamp', getTimeRangeStart(timeRange))
    .eq('server_id', serverId)
    .order('timestamp', { ascending: false })
    .limit(1000);
};
```

## 📈 Aggregation Queries

```sql
-- Dashboard overview (single query)
WITH server_stats AS (
  SELECT
    COUNT(DISTINCT server_id) as total_servers,
    COUNT(CASE WHEN status = 'critical' THEN 1 END) as critical_servers,
    COUNT(CASE WHEN status = 'warning' THEN 1 END) as warning_servers,
    AVG(cpu) as avg_cpu,
    AVG(memory) as avg_memory
  FROM server_metrics
  WHERE timestamp > NOW() - INTERVAL '5 minutes'
),
recent_alerts AS (
  SELECT server_id, status, timestamp
  FROM server_metrics
  WHERE status IN ('warning', 'critical')
    AND timestamp > NOW() - INTERVAL '1 hour'
  ORDER BY timestamp DESC
  LIMIT 10
)
SELECT
  (SELECT row_to_json(server_stats.*) FROM server_stats) as overview,
  (SELECT array_to_json(array_agg(recent_alerts.*)) FROM recent_alerts) as alerts;
```

## 🔍 Search & Filter Queries

```sql
-- Flexible server search with full-text
CREATE INDEX idx_server_metrics_search
  ON server_metrics USING GIN (
    to_tsvector('english', server_name || ' ' || server_type)
  );

-- Search query
SELECT server_id, server_name, server_type, status
FROM server_metrics
WHERE to_tsvector('english', server_name || ' ' || server_type)
  @@ plainto_tsquery('english', $1)
  AND timestamp > NOW() - INTERVAL '1 hour'
ORDER BY timestamp DESC;
```

## 💾 Caching Strategies

```typescript
// Query result caching
export const getCachedMetrics = async (key: string, queryFn: Function) => {
  const cached = await redis.get(key);
  if (cached) {
    return JSON.parse(cached);
  }

  const result = await queryFn();
  await redis.set(key, JSON.stringify(result), 'EX', 300); // 5min TTL
  return result;
};

// Usage
const metrics = await getCachedMetrics(`metrics:${serverId}:${timeRange}`, () =>
  getServerMetrics(serverId, timeRange)
);
```

## 🎯 Query Performance Tips

```sql
-- Use EXPLAIN ANALYZE for optimization
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM server_metrics
WHERE server_id = 'server-001'
ORDER BY timestamp DESC
LIMIT 100;

-- Expected result: ~30ms with proper indexes
-- Index Scan using idx_server_metrics_server_timestamp
-- Planning Time: 0.123 ms
-- Execution Time: 28.456 ms
```
