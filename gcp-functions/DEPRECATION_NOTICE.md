# GCP Functions Deprecation Notice

**Date**: 2025-12-09
**Version**: unified-ai-processor v3.1.0

---

## 📋 Summary

All functionality has been consolidated into a single **unified-ai-processor** Cloud Run service. The following services are now deprecated and should not be used.

---

## ❌ Deprecated Services

### Node.js Functions (Cloud Functions Gen2 - Failed)

These failed to deploy due to Cloud Functions Gen2 health check requirements:

| Service | Status | Migration Target |
|---------|--------|------------------|
| `ai-gateway/` | ❌ Deprecated | `unified-ai-processor/modules/gateway.py` |
| `rule-engine/` | ❌ Deprecated | `unified-ai-processor/modules/rule_engine.py` |
| `health/` | ❌ Deprecated | `unified-ai-processor/main.py` → `/health` endpoint |

### Python Services (Redundant)

These are redundant as their functionality is already in unified-ai-processor:

| Service | Status | Migration Target |
|---------|--------|------------------|
| `enhanced-korean-nlp/` | ❌ Deprecated | `unified-ai-processor/modules/nlp_engine.py` |
| `ml-analytics-engine/` | ❌ Deprecated | `unified-ai-processor/modules/ml_engine.py` |

---

## ✅ Active Service

### unified-ai-processor (Cloud Run)

**Location**: `gcp-functions/unified-ai-processor/`

**Endpoints**:
- `POST /process` - Main AI processing endpoint
- `GET /health` - Health check (migrated from health/)
- `POST /gateway` - Gateway routing (migrated from ai-gateway/)
- `POST /rules` - Rule engine (migrated from rule-engine/)
- `POST /smart` - Fast-path + intelligent routing

**Modules**:
- `modules/nlp_engine.py` - Korean + English NLP
- `modules/ml_engine.py` - ML Analytics
- `modules/gateway.py` - Intelligent routing
- `modules/rule_engine.py` - Rule-based pattern matching

---

## 🗑️ Cleanup Actions

### Safe to Delete

```bash
# Node.js functions (never successfully deployed)
rm -rf gcp-functions/ai-gateway/
rm -rf gcp-functions/rule-engine/
rm -rf gcp-functions/health/

# Redundant Python services
rm -rf gcp-functions/enhanced-korean-nlp/
rm -rf gcp-functions/ml-analytics-engine/
```

### Keep

```bash
# Active service
gcp-functions/unified-ai-processor/   # ✅ Keep - Main Cloud Run service
```

---

## 📊 Migration Details

### ai-gateway → gateway.py

| Original (Node.js) | New (Python) |
|--------------------|--------------|
| `is_korean()` | `is_korean()` |
| `detect_query_complexity()` | `detect_query_complexity()` |
| `needs_server_context()` | `needs_server_context()` |
| `GatewayRouter.determineRoute()` | `GatewayRouter.determine_route()` |

### rule-engine → rule_engine.py

| Original (Node.js) | New (Python) |
|--------------------|--------------|
| Pattern rules (server, monitoring, etc.) | `PATTERN_RULES` dict |
| Keyword rules | `KEYWORD_RULES` dict |
| Fuzzy matching | `_fuzzy_match()` |
| `RuleEngine.process()` | `RuleEngine.process()` |

### health → /health endpoint

| Original (Node.js) | New (Python) |
|--------------------|--------------|
| `GET /` → health check | `GET /health` in main.py |
| Basic status response | Full system status with modules |

---

## 🔄 Architecture Before/After

### Before (6 Services)
```
gcp-functions/
├── ai-gateway/           # Node.js - FAILED
├── health/               # Node.js - FAILED
├── rule-engine/          # Node.js - FAILED
├── enhanced-korean-nlp/  # Python - Redundant
├── ml-analytics-engine/  # Python - Redundant
└── unified-ai-processor/ # Python - Active
```

### After (1 Service)
```
gcp-functions/
└── unified-ai-processor/ # Python - All-in-one Cloud Run
    ├── main.py           # Flask app with all endpoints
    └── modules/
        ├── nlp_engine.py   # Korean + English NLP
        ├── ml_engine.py    # ML Analytics
        ├── gateway.py      # Intelligent routing
        └── rule_engine.py  # Rule-based responses
```

---

## 📝 Notes

1. **Cloud Functions Gen2 Issue**: Node.js functions failed due to strict health check requirements. Cloud Run is more flexible.

2. **Consolidation Benefits**:
   - Single deployment unit
   - Shared dependencies
   - Unified logging
   - Simpler maintenance

3. **No Breaking Changes**: API contracts remain compatible. Callers can use the same request/response format.

---

**Created**: 2025-12-09
**Author**: Claude Code (unified-ai-processor migration)
