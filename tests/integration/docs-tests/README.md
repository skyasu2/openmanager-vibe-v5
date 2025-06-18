# 🧪 OpenManager Vibe v5 - 테스트 가이드

> **📅 최종 업데이트**: 2025년 1월 6일  
> **🎯 상태**: 테스트 파일 정리 완료  
> **📁 위치**: `/docs/testing/`

## 📋 테스트 파일 구조

### 🌐 HTML 테스트 파일 (`html-tests/`)

| 파일명                              | 용도                  | 설명                      |
| ----------------------------------- | --------------------- | ------------------------- |
| `test-vercel-ai-fix.html`           | Vercel AI 수정 테스트 | AI 기능 수정사항 검증     |
| `test-vercel-ai-status-check.html`  | Vercel AI 상태 확인   | AI 서비스 상태 모니터링   |
| `test-latest-deployment.html`       | 최신 배포 테스트      | 배포 상태 확인            |
| `test-new-deployment.html`          | 신규 배포 테스트      | 새로운 배포 검증          |
| `test-previous-url-check.html`      | 이전 URL 확인         | URL 접근성 테스트         |
| `test-api-debug.html`               | API 디버깅            | API 엔드포인트 디버깅     |
| `test-ai-engine-direct.html`        | AI 엔진 직접 테스트   | AI 엔진 직접 호출 테스트  |
| `test-dual-core-api.html`           | 듀얼 코어 API 테스트  | 이중 API 시스템 테스트    |
| `vercel-debug.html`                 | Vercel 디버깅         | Vercel 플랫폼 디버깅      |
| `test-ai-sidebar-error-fix.html`    | AI 사이드바 오류 수정 | 사이드바 오류 해결 테스트 |
| `test-vercel-deployment-debug.html` | Vercel 배포 디버깅    | 배포 과정 디버깅          |

### 🔧 JavaScript 테스트 파일 (`js-tests/`)

| 파일명                     | 용도                    | 설명                      |
| -------------------------- | ----------------------- | ------------------------- |
| `test-ai-sidebar-local.js` | AI 사이드바 로컬 테스트 | 로컬 환경 사이드바 테스트 |
| `test-ai-sidebar-api.js`   | AI 사이드바 API 테스트  | API 연동 사이드바 테스트  |

### 📜 스크립트 파일 (`scripts/`)

| 파일명               | 용도                | 설명                       |
| -------------------- | ------------------- | -------------------------- |
| `test-api-debug.ps1` | API 디버깅 스크립트 | PowerShell 기반 API 디버깅 |

## 🚀 최신 테스트 (Phase 3)

### 🎯 Intelligent Pipeline 테스트

**위치**: 루트 디렉토리  
**파일**: `test-intelligent-pipeline.html`

```html
<!-- 4단계 파이프라인 테스트 -->
<div class="pipeline-test">
  <h2>🧠 Intelligent Pipeline v3.0 테스트</h2>
  <input type="text" id="queryInput" placeholder="AI에게 질문하세요..." />
  <button onclick="testPipeline()">파이프라인 테스트</button>

  <div class="pipeline-stages">
    <div class="stage nlp">1. NLP Rule Processor</div>
    <div class="stage mcp">2. MCP API Engine</div>
    <div class="stage rag">3. RAG Search Engine</div>
    <div class="stage google">4. Google AI Fallback</div>
  </div>

  <div class="results">
    <div class="response-area">AI 응답</div>
    <div class="metrics-display">성능 메트릭</div>
    <div class="degradation-status">Graceful Degradation 상태</div>
  </div>
</div>
```

### 🔌 API 엔드포인트 테스트

**엔드포인트**: `/api/ai/pipeline`

```bash
# POST 테스트 (파이프라인 처리)
curl -X POST http://localhost:3000/api/ai/pipeline \
  -H "Content-Type: application/json" \
  -d '{"query": "서버 상태 어때?"}'

# GET 테스트 (상태 조회)
curl http://localhost:3000/api/ai/pipeline
```

**예상 응답**:

```json
{
  "response": "현재 서버 상태를 확인했습니다...",
  "stage": "nlp",
  "confidence": 0.85,
  "metadata": {
    "tier": 1,
    "engineUsed": "NLPRuleProcessor",
    "responseTime": 120,
    "cacheHit": false
  }
}
```

## 🧪 테스트 실행 가이드

### 1. HTML 테스트 실행

```bash
# 로컬 서버 실행
npm run dev

# 브라우저에서 테스트 파일 열기
# 예: http://localhost:3000/test-intelligent-pipeline.html
```

### 2. JavaScript 테스트 실행

```bash
# Node.js 환경에서 실행
node docs/testing/js-tests/test-ai-sidebar-local.js
```

### 3. PowerShell 스크립트 실행

```powershell
# Windows PowerShell에서 실행
.\docs\testing\scripts\test-api-debug.ps1
```

## 📊 테스트 결과 해석

### 성공 지표

- **응답 시간**: < 3초
- **정확도**: > 95%
- **파이프라인 성공률**: > 99%
- **Graceful Degradation**: 자동 복구

### 실패 시 대응

1. **1단계 실패**: NLP 엔진 재시작
2. **2단계 실패**: MCP 서버 상태 확인
3. **3단계 실패**: RAG 데이터베이스 연결 확인
4. **4단계 실패**: Google AI API 키 확인

## 🔄 지속적 테스트

### 자동화된 테스트

```bash
# 전체 테스트 스위트 실행
npm run test

# 파이프라인 특화 테스트
npm run test:pipeline

# 성능 테스트
npm run test:performance
```

### 모니터링

- **실시간 테스트**: 매 5분마다 자동 실행
- **성능 추적**: 응답 시간, 성공률 모니터링
- **알림**: 실패 시 즉시 Slack 알림

---

**📝 테스트 이력**

- 2025-01-06: Phase 3 Intelligent Pipeline 테스트 추가
- 2024-12-XX: 기존 테스트 파일 정리 및 분류 완료
