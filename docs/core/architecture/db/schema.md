# Database Schema

## 🗄️ Core Tables

```sql
-- Server Metrics (Main table)
CREATE TABLE server_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  server_id VARCHAR(100) NOT NULL,
  server_name VARCHAR(255),
  server_type VARCHAR(50) DEFAULT 'unknown',
  timestamp TIMESTAMPTZ NOT NULL,
  cpu NUMERIC(5,2) NOT NULL,
  memory NUMERIC(5,2) NOT NULL,
  disk NUMERIC(5,2) NOT NULL,
  network_in BIGINT DEFAULT 0,
  network_out BIGINT DEFAULT 0,
  response_time INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'unknown',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔐 RLS Policies

```sql
-- Enable RLS
ALTER TABLE server_metrics ENABLE ROW LEVEL SECURITY;

-- Public read access (for demo)
CREATE POLICY "Public read access" ON server_metrics
  FOR SELECT USING (true);

-- Authenticated insert/update
CREATE POLICY "Authenticated write" ON server_metrics
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
```

## 📊 Optimized Indexes

```sql
-- Performance indexes
CREATE INDEX idx_server_metrics_server_id
  ON server_metrics(server_id);

CREATE INDEX idx_server_metrics_timestamp
  ON server_metrics(timestamp DESC);

CREATE INDEX idx_server_metrics_server_timestamp
  ON server_metrics(server_id, timestamp DESC);

-- BRIN index for time-series data
CREATE INDEX idx_server_metrics_timestamp_brin
  ON server_metrics USING BRIN (timestamp)
  WITH (pages_per_range = 128);
```

## 📈 Materialized Views

```sql
-- Hourly summary for better performance
CREATE MATERIALIZED VIEW server_metrics_hourly AS
SELECT
  server_id,
  date_trunc('hour', timestamp) as hour,
  AVG(cpu) as avg_cpu,
  MAX(cpu) as max_cpu,
  AVG(memory) as avg_memory,
  COUNT(*) as sample_count
FROM server_metrics
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY server_id, date_trunc('hour', timestamp);

-- Auto-refresh every 5 minutes
SELECT cron.schedule(
  'refresh_metrics_summary',
  '*/5 * * * *',
  'REFRESH MATERIALIZED VIEW server_metrics_hourly'
);
```

## 🚀 Performance Optimizations

```sql
-- Query optimization functions
CREATE OR REPLACE FUNCTION get_server_metrics_optimized(
  p_server_id TEXT DEFAULT NULL,
  p_hours INTEGER DEFAULT 1
)
RETURNS TABLE (
  server_id TEXT,
  timestamp TIMESTAMPTZ,
  cpu NUMERIC,
  memory NUMERIC,
  status TEXT
) AS $$
BEGIN
  IF p_hours <= 24 THEN
    -- Use main table for recent data
    RETURN QUERY
    SELECT m.server_id, m.timestamp, m.cpu, m.memory, m.status
    FROM server_metrics m
    WHERE (p_server_id IS NULL OR m.server_id = p_server_id)
      AND m.timestamp > NOW() - (p_hours || ' hours')::INTERVAL
    ORDER BY m.timestamp DESC
    LIMIT 1000;
  ELSE
    -- Use materialized view for older data
    RETURN QUERY
    SELECT h.server_id, h.hour, h.avg_cpu, h.avg_memory, 'aggregated'
    FROM server_metrics_hourly h
    WHERE (p_server_id IS NULL OR h.server_id = p_server_id)
      AND h.hour > NOW() - (p_hours || ' hours')::INTERVAL
    ORDER BY h.hour DESC;
  END IF;
END;
$$ LANGUAGE plpgsql;
```
