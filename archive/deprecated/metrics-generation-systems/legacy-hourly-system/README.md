# Legacy Hourly Metrics System

**Deprecated**: 2025-11-29
**Reason**: Incompatible folder structure, inefficient 24-file output

---

## Overview

This system generated **24 separate JSON files** (one per hour) with detailed server metrics and incident storytelling.

### Output Structure

```
public/server-scenarios/
├── servers-metadata.json (required, not archived)
└── hourly-metrics/
    ├── 00.json (midnight)
    ├── 01.json
    ...
    └── 23.json (11 PM)
```

### Features

✅ **Rich storytelling**: Each hour has a scenario description
✅ **Detailed incidents**: Specific failure types (memory_pressure, cpu_spike, etc.)
✅ **Severity levels**: critical, warning, normal
✅ **8 servers**: web-server-1, api-server-1, db-master-1, etc.

### Limitations

❌ **24 separate files**: Inefficient loading (24 HTTP requests)
❌ **Only 8 servers**: Current system needs 15 servers
❌ **Separate metadata**: Requires external `servers-metadata.json`
❌ **Not integrated**: Can't use with `useFixed24hMetrics` hook

---

## Scenario Timeline

| Hour | Scenario | Incidents |
|------|----------|-----------|
| 00-01 | Normal operation | None |
| 02 | Cache memory pressure | cache-server-1 (warning) |
| 03 | DB replication lag | cache-server-1, db-replica-1 (warning) |
| 08 | Web server CPU spike | web-server-1 (critical) |
| 13 | Storage disk critical | storage-server-1 (critical) |
| 20 | DB connection pool exhausted | db-master-1 (critical) |
| 21 | Web server 503 errors | web-server-1 (critical) |
| 22 | Emergency patching | web-server-1, api-server-1 (maintenance) |

---

## Why Deprecated?

### 1. Performance Issues

**24 HTTP requests** to load all hourly data:
```javascript
// ❌ Old: Load 24 files
for (let hour = 0; hour < 24; hour++) {
  await fetch(`/server-scenarios/hourly-metrics/${hour.toString().padStart(2, '0')}.json`);
}
```

**vs New: Single request**:
```typescript
// ✅ New: Load once
const data = await fetch('/data/server-metrics-24h.json');
```

### 2. Scalability Issues

**Only 8 servers** supported:
- web-server-1
- api-server-1
- db-master-1
- db-replica-1
- cache-server-1
- storage-server-1
- queue-server-1
- monitoring-server-1

**Current system**: 15 servers (web-1, web-2, web-3, api-1, api-2, api-3, ...)

### 3. Integration Issues

**No client hook support**:
```typescript
// ❌ Old: Can't use with useFixed24hMetrics
// Would need to manually load 24 files and merge data
```

---

## File Contents Example

**00.json** (midnight):
```json
{
  "hour": 0,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "scenario": "정상 운영",
  "trafficFactor": 1.0,
  "servers": {
    "web-server-1": {
      "id": "web-server-1",
      "status": "healthy",
      "cpu": 25,
      "memory": 40,
      "disk": 55,
      "network": 30,
      "alerts": 0,
      "incidents": []
    },
    // ... 7 more servers
  }
}
```

---

## Restoration Not Recommended

This system requires:
1. `servers-metadata.json` (not archived)
2. Completely different folder structure
3. Client code rewrite to load 24 files
4. Server count mismatch (8 vs 15)

**Recommended**: Use current Gemini implementation instead.
