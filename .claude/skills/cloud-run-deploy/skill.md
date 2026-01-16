---
name: cloud-run-deploy
version: v1.0.0
description: Cloud Run AI Engine deployment workflow with free tier optimization. Triggers when user requests Cloud Run deployment, AI engine deploy, or production release. Use for deploying AI Engine to Google Cloud Run.
---

# Cloud Run Deployment Skill

**Target Token Efficiency**: 65% (350 tokens -> 120 tokens)

## Purpose

Automate Cloud Run AI Engine deployment with free tier optimized configuration, without manual script explanation.

## Trigger Keywords

- "deploy cloud run"
- "cloud run deploy"
- "deploy ai engine"
- "ai engine deploy"
- "production deploy"
- "배포"
- "클라우드 런 배포"
- "AI 엔진 배포"
- "프로덕션 배포"
- "gcp deploy"

## Context

- **Project**: OpenManager VIBE v5.85.0
- **Region**: asia-northeast1 (Seoul)
- **Service**: ai-engine
- **Tier**: FREE TIER OPTIMIZED
- **Free Limits**: 180,000 vCPU-sec, 360,000 GB-sec, 2M requests/month

## Configuration (Free Tier)

| Resource | Value | Free Hours/Month |
|----------|-------|------------------|
| CPU | 1 vCPU | ~50 hours |
| Memory | 512Mi | ~200 hours |
| Max Instances | 3 | - |
| Concurrency | 80 | - |
| Timeout | 300s | - |

## Workflow

### 1. Pre-deployment Check

```bash
# Check current working directory
cd /mnt/d/cursor/openmanager-vibe-v5/cloud-run/ai-engine

# Verify GCP project
gcloud config get-value project

# Check for uncommitted changes
git status --short
```

**Expected**:
- Project: `openmanager-free-tier`
- Clean working tree (recommended)

### 2. TypeScript Build Check

```bash
# Verify TypeScript compiles
npm run build --prefix /mnt/d/cursor/openmanager-vibe-v5/cloud-run/ai-engine
```

**Expected**:
- No compilation errors
- `dist/` directory updated

### 3. Execute Deployment

```bash
# Run deployment script
cd /mnt/d/cursor/openmanager-vibe-v5/cloud-run/ai-engine && bash deploy.sh
```

**Deployment Steps** (automated by script):
1. Build container image (Cloud Build, ~2-3 min)
2. Deploy to Cloud Run (~1 min)
3. Health check
4. Cleanup old images/revisions (background)

### 4. Verify Deployment

```bash
# Health check
curl -s https://ai-engine-490817238363.asia-northeast1.run.app/health | jq

# Check monitoring endpoint
curl -s https://ai-engine-490817238363.asia-northeast1.run.app/monitoring | jq '.agents'
```

**Expected Health Response**:
```json
{
  "status": "healthy",
  "version": "5.84.x",
  "agents": {
    "active": 4,
    "available": ["NLQ", "Analyst", "Reporter", "Advisor"]
  }
}
```

## Report Summary Format

```
🚀 Cloud Run Deployment Results
├─ Service: ai-engine
├─ Region: asia-northeast1
├─ Version: {SHORT_SHA}
├─ URL: https://ai-engine-*.run.app
├─ Status: ✅ Success / ❌ Failed
│
├─ Resource Config (FREE TIER):
│   ├─ CPU: 1 vCPU (~50 hrs/month free)
│   ├─ Memory: 512Mi (~200 hrs/month free)
│   └─ Max Instances: 3
│
└─ Health Check: ✅ Pass / ❌ Fail
```

## Token Optimization Strategy

**Before (Manual)**:
```
User: "배포해줘"
Assistant: [reads Dockerfile, explains config, explains free tier, runs commands, checks logs]
Tokens: ~350
```

**After (Skill)**:
```
User: "deploy cloud run"
Skill: [executes workflow, reports summary]
Tokens: ~120 (65% reduction)
```

## Edge Cases

**Case 1: Build Failure**
- Check: Dockerfile syntax
- Check: npm dependencies
- Action: Review build logs in Cloud Console

**Case 2: Deployment Timeout**
- Default timeout: 600s for build
- Action: Check Cloud Build logs
- Verify: Image size < 500MB

**Case 3: Health Check Failure**
- May still be starting (cold start ~10-20s)
- Wait 30s and retry
- Check: `/health` endpoint logs

**Case 4: Permission Denied**
- Verify: `gcloud auth login`
- Verify: Project access rights
- Action: Re-authenticate

## Rollback

```bash
# List recent revisions
gcloud run revisions list --service ai-engine --region asia-northeast1

# Rollback to previous revision
gcloud run services update-traffic ai-engine \
  --region asia-northeast1 \
  --to-revisions REVISION_NAME=100
```

## Related Files

| File | Purpose |
|------|---------|
| `cloud-run/ai-engine/Dockerfile` | Multi-stage build config |
| `cloud-run/ai-engine/deploy.sh` | Deployment script |
| `cloud-run/ai-engine/cloudbuild.yaml` | CI/CD config (optional) |

## Success Criteria

- Build: Completed without errors
- Deploy: Service updated successfully
- Health: HTTP 200 from `/health`
- Agents: All 5 agents active

## Related Skills

- `lint-smoke` - Pre-deployment code quality check
- `validation-analysis` - Post-deployment validation

## Changelog

- 2026-01-06: v1.0.0 - Initial implementation
  - Free tier optimized configuration
  - 1 vCPU, 512Mi memory, 3 max instances
  - Integrated health check verification
  - 10 trigger keywords (Korean/English)
