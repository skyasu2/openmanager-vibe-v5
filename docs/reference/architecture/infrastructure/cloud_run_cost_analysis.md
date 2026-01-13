# Google Cloud Run Cost Analysis: 5 Users/Day Scenario

## 📊 Summary
Based on the current architecture and usage patterns, **OpenManager Vibe v5** can run **completely free** on Google Cloud Run for the target audience.

- **Target Audience**: 5 active users/day
- **Estimated Cost**: **$0.00 / Month** (100% covered by Free Tier)
- **Scalability**: Can scale up to ~1,300 users/day before incurring costs.

---

## 🔧 Service Configuration
- **Service**: `ai-engine` (Vercel AI SDK Backend)
- **Resources**:
  - 1 vCPU
  - 1GB Memory
- **Concurrency**: 80 requests per instance
- **Average Latency**: ~0.5 seconds

---

## 💰 Free Tier Usage Calculation

| Resource | Monthly Free Limit | Estimated Monthly Usage (5 Users) | Utilization % | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Requests** | 2,000,000 | 1,500 | **0.075%** | ✅ Free |
| **vCPU Time** | 180,000 seconds | 750 seconds | **0.42%** | ✅ Free |
| **Memory Time** | 360,000 GiB-seconds | 750 GiB-seconds | **0.21%** | ✅ Free |
| **Bandwidth** | 1 GB | ~3 MB | **0.29%** | ✅ Free |

### 📝 Assumptions
- **Daily Traffic**: 5 users × 10 queries = 50 requests/day
- **Monthly Traffic**: 50 × 30 = 1,500 requests/month
- **Processing Time**: 0.5s avg per request (streaming)
- **Response Size**: ~2KB avg

---

## 📉 Cost Optimization Strategies implemented
1. **Cold Start Mitigation**:
   - We use a "Wake Up" mechanism (`/api/ai/wake-up`) from the UI instead of keeping `min-instances: 1` (which would cost ~$6/month).
   - This keeps the service at 0 instances when idle, maximizing free tier usage.
2. **Efficient Streaming**:
   - Responses are streamed, reducing memory holding time.
3. **Concurrency**:
   - Setting `concurrency: 80` allows a single container to handle all 5 concurrent users easily without spinning up extra instances.

## 🚀 Scalability Forecast
- **Max Free Users**: ~1,300 users/day
- **Max Free Requests**: ~1.33 million requests/month

## ❓ Architectural Decisions & FAQ

### Q1. Should we keep it "Always On" (`min-instances: 1`)?
**Recommendation: NO (Keep Scale-to-Zero)**

- **Reason**: The Free Tier provides **180,000 vCPU-seconds** per month.
- **Math**:
  - Always On: 60s *60m* 24h * 30d = **2,592,000 vCPU-seconds**
  - **Result**: You would exceed the free tier by **14x**, costing ~$25/month.
- **Best Practice**: Use `min-instances: 0` (Scale to Zero) and use the "Wake Up" button to mitigate cold starts only when needed.

### Q2. Is the Rust ML service still needed?
**Recommendation: NO (Removed)**

- **Status**: The Rust ML service was removed in v5.84.0.
- **Reason**: The AI agents (Analyst Agent) running on Node.js/Vercel AI SDK now handle anomaly detection and trend prediction efficiently using optimized TypeScript implementations (`SimpleAnomalyDetector.ts`, `TrendPredictor.ts`).
- **Benefit**: Simplifies deployment (single container) and reduces cold start times.

### Q3. Is the current architecture optimized?
**YES.**
- **Decoupled**: Services scale independently.
- **Cost-Efficient**: Fits 100% inside Free Tier.
- **Stable**: Vercel AI SDK handles streaming and timeouts robustly.
