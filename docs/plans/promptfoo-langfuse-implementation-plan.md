# Promptfoo + LangFuse 도입 작업 계획서

**작성일**: 2025-12-24
**버전**: 2.0
**상태**: ✅ 구현 완료 (2025-12-25)

---

## 📢 업데이트 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|----------|
| 2025-12-24 | 1.0 | 초기 계획 수립 |
| 2025-12-25 | 2.0 | LangFuse v4 마이그레이션, SDK 패키지명 변경 (`@langfuse/langchain`) |

---

## 1. 개요

### 1.1 목적
OpenManager VIBE v5 AI Engine에 QA 테스트(Promptfoo)와 프로덕션 모니터링(LangFuse)을 도입하여 AI 품질 관리 체계 구축

### 1.2 범위
| 구분 | 도구 | 대상 |
|------|------|------|
| QA/테스트 | Promptfoo | 프롬프트 품질, Red-team 테스트 |
| 모니터링 | LangFuse | Cloud Run AI Engine 트레이싱 |

### 1.3 기대 효과
- 프롬프트 변경 시 회귀 테스트 자동화
- 프로덕션 AI 호출 추적 및 디버깅
- 토큰 사용량 및 비용 모니터링
- 모델 성능 비교 (Gemini vs Groq)

---

## 2. 현재 상태 분석

### 2.1 AI Engine 아키텍처
```
cloud-run/ai-engine/
├── src/
│   ├── server.ts                    # Hono 서버
│   ├── agents/
│   │   ├── analyst-agent.ts         # 분석 에이전트
│   │   ├── nlq-agent.ts             # 자연어 쿼리 에이전트
│   │   ├── reporter-agent.ts        # 리포트 에이전트
│   │   └── verifier-agent.ts        # 검증 에이전트
│   ├── services/
│   │   └── langgraph/
│   │       └── multi-agent-supervisor.ts  # LangGraph Supervisor
│   └── lib/
│       ├── model-config.ts          # 모델 설정
│       └── checkpointer.ts          # Supabase 체크포인터
└── package.json
```

### 2.2 사용 중인 LLM
| Provider | Model | 용도 |
|----------|-------|------|
| Google | gemini-2.0-flash-exp | Primary |
| Groq | llama-3.3-70b-versatile | Fallback |

### 2.3 현재 모니터링 현황
- ❌ 프롬프트 테스트 없음
- ❌ AI 호출 트레이싱 없음
- ⚠️ 수동 로그 확인만 가능

---

## 3. 도입 계획

### Phase 1: Promptfoo 도입 (즉시)

#### 3.1.1 설치
```bash
# 전역 설치
npm install -g promptfoo

# 또는 프로젝트 devDependencies
npm install -D promptfoo
```

#### 3.1.2 설정 파일 생성
**위치**: `/cloud-run/ai-engine/promptfoo/`

```
cloud-run/ai-engine/promptfoo/
├── promptfooconfig.yaml      # 메인 설정
├── prompts/
│   ├── analyst.txt           # 분석 에이전트 프롬프트
│   ├── nlq.txt               # NLQ 에이전트 프롬프트
│   └── reporter.txt          # 리포터 에이전트 프롬프트
├── datasets/
│   ├── server-analysis.json  # 서버 분석 테스트 케이스
│   └── korean-nlq.json       # 한국어 NLQ 테스트 케이스
└── redteam/
    └── security-tests.yaml   # Red-team 테스트
```

#### 3.1.3 기본 설정 (promptfooconfig.yaml)
```yaml
# yaml-language-server: $schema=https://promptfoo.dev/config-schema.json
description: OpenManager VIBE AI Engine 프롬프트 평가

prompts:
  - file://prompts/analyst.txt
  - file://prompts/nlq.txt

providers:
  - id: google:gemini-2.0-flash-exp
    config:
      temperature: 0.7
  - id: groq:llama-3.3-70b-versatile
    config:
      temperature: 0.7

defaultTest:
  assert:
    - type: llm-rubric
      value: |
        응답이 한국어로 작성되어야 함
        서버 메트릭에 대한 구체적인 분석 포함
        전문 용어 사용 시 설명 제공

tests:
  - vars:
      query: "CPU 사용률이 95%입니다. 분석해주세요"
    assert:
      - type: contains
        value: "CPU"
      - type: not-contains
        value: "I don't know"
      - type: llm-rubric
        value: "높은 CPU 사용률에 대한 원인 분석과 조치 방안 제시"

  - vars:
      query: "메모리 누수가 의심됩니다"
    assert:
      - type: llm-rubric
        value: "메모리 누수 진단 방법과 해결책 제시"
```

#### 3.1.4 package.json 스크립트 추가
```json
{
  "scripts": {
    "prompt:eval": "promptfoo eval -c promptfoo/promptfooconfig.yaml",
    "prompt:view": "promptfoo view",
    "prompt:redteam": "promptfoo redteam -c promptfoo/redteam/security-tests.yaml"
  }
}
```

#### 3.1.5 CI/CD 통합 (GitHub Actions)
```yaml
# .github/workflows/prompt-eval.yml
name: Prompt Evaluation

on:
  pull_request:
    paths:
      - 'cloud-run/ai-engine/promptfoo/**'
      - 'cloud-run/ai-engine/src/agents/**'

jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g promptfoo
      - run: cd cloud-run/ai-engine && promptfoo eval
        env:
          GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
          GROQ_API_KEY: ${{ secrets.GROQ_API_KEY }}
```

---

### Phase 2: LangFuse 도입 (1주 내)

#### 3.2.1 LangFuse Cloud 설정
1. https://cloud.langfuse.com 가입
2. 프로젝트 생성: `openmanager-vibe-v5`
3. API 키 발급 (Public Key, Secret Key)

#### 3.2.2 SDK 설치 (v4 - 2025-12-25 업데이트)
```bash
cd cloud-run/ai-engine

# ✅ v4 scoped packages (권장)
npm install @langfuse/core @langfuse/langchain @opentelemetry/api

# ❌ DEPRECATED - 아래 패키지는 사용하지 않음
# npm install langfuse langfuse-langchain
```

> **⚠️ 주의**: `langfuse-langchain` (v3.x)는 deprecated되었습니다.
> `@langfuse/langchain` (v4.x)는 `@langchain/core >=0.3.0`을 네이티브 지원합니다.

#### 3.2.3 환경 변수 추가
```bash
# .env.local (Vercel)
LANGFUSE_PUBLIC_KEY=pk-lf-xxx
LANGFUSE_SECRET_KEY=sk-lf-xxx
LANGFUSE_BASE_URL=https://cloud.langfuse.com

# Cloud Run (GCP Secret Manager)
gcloud secrets create LANGFUSE_PUBLIC_KEY --data-file=-
gcloud secrets create LANGFUSE_SECRET_KEY --data-file=-
```

#### 3.2.4 콜백 핸들러 생성 (v4 - 구현 완료)
**파일**: `cloud-run/ai-engine/src/lib/langfuse-handler.ts`

```typescript
// ✅ v4: scoped package 사용
// import { CallbackHandler } from "langfuse-langchain";  // ❌ deprecated
import { CallbackHandler } from "@langfuse/langchain";    // ✅ v4

// Dynamic import로 optional dependency 처리
async function getCallbackHandlerClass() {
  try {
    const module = await import('@langfuse/langchain');
    return module.CallbackHandler;
  } catch {
    console.warn('⚠️ [LangFuse] @langfuse/langchain not installed');
    return null;
  }
}

export async function createSessionHandler(options: {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, unknown>;
}): Promise<LangFuseCallbackHandler | null> {
  const HandlerClass = await getCallbackHandlerClass();
  if (!HandlerClass) return null;

  return new HandlerClass({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
    secretKey: process.env.LANGFUSE_SECRET_KEY!,
    baseUrl: process.env.LANGFUSE_BASE_URL,
    sessionId: options.sessionId,
    userId: options.userId || 'anonymous',
    metadata: options.metadata,
  });
}
```

> **구현 상태**: ✅ 완료 (2025-12-25)
> 전체 코드는 `cloud-run/ai-engine/src/lib/langfuse-handler.ts` 참조

#### 3.2.5 Supervisor 통합
**파일**: `cloud-run/ai-engine/src/services/langgraph/multi-agent-supervisor.ts`

```typescript
// 기존 import에 추가
import { getLangfuseHandler } from "../../lib/langfuse-handler";

// invoke 호출 시 콜백 추가
const result = await graph.invoke(
  { messages },
  {
    configurable: { thread_id },
    callbacks: [getLangfuseHandler()]  // LangFuse 콜백 추가
  }
);
```

#### 3.2.6 트레이스 메타데이터
```typescript
// 세션별 추적을 위한 핸들러
const handler = createSessionHandler(
  `session-${Date.now()}`,
  userId || "anonymous"
);

// 추가 메타데이터
handler.trace({
  name: "server-analysis",
  metadata: {
    serverCount: servers.length,
    queryType: "analysis",
    model: "gemini-2.0-flash-exp"
  }
});
```

---

## 4. 파일 변경 목록

### 4.1 신규 생성 파일
| 파일 | 용도 |
|------|------|
| `cloud-run/ai-engine/promptfoo/promptfooconfig.yaml` | Promptfoo 메인 설정 |
| `cloud-run/ai-engine/promptfoo/prompts/*.txt` | 에이전트 프롬프트 |
| `cloud-run/ai-engine/promptfoo/datasets/*.json` | 테스트 데이터셋 |
| `cloud-run/ai-engine/src/lib/langfuse-handler.ts` | LangFuse 핸들러 |
| `.github/workflows/prompt-eval.yml` | CI/CD 워크플로우 |

### 4.2 수정 파일
| 파일 | 변경 내용 |
|------|----------|
| `cloud-run/ai-engine/package.json` | 의존성 및 스크립트 추가 |
| `cloud-run/ai-engine/src/services/langgraph/multi-agent-supervisor.ts` | LangFuse 콜백 통합 |
| `.env.local` | LangFuse 환경 변수 |

---

## 5. 검증 계획

### 5.1 Promptfoo 검증
```bash
# 로컬 테스트 실행
cd cloud-run/ai-engine
npm run prompt:eval

# 결과 확인
npm run prompt:view
```

**성공 기준**:
- [ ] 모든 테스트 케이스 통과
- [ ] Gemini vs Groq 비교 결과 확인
- [ ] Red-team 테스트 취약점 없음

### 5.2 LangFuse 검증
```bash
# Cloud Run 로컬 테스트
cd cloud-run/ai-engine
npm run dev

# API 호출 후 LangFuse 대시보드 확인
curl -X POST http://localhost:8080/api/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"테스트"}]}'
```

**성공 기준**:
- [ ] LangFuse 대시보드에서 트레이스 확인
- [ ] Agent 체인 시각화 정상
- [ ] 토큰 사용량 기록 확인

---

## 6. 롤백 계획

### 6.1 Promptfoo 롤백
```bash
# 설정 디렉토리 삭제
rm -rf cloud-run/ai-engine/promptfoo/

# package.json에서 스크립트 제거
```

### 6.2 LangFuse 롤백
```bash
# v4 의존성 제거
npm uninstall @langfuse/core @langfuse/langchain @opentelemetry/api

# 콜백 코드 제거 (multi-agent-supervisor.ts)
# callbacks: [langfuseHandler] 라인 삭제

# 환경 변수 제거 (Cloud Run)
gcloud run services update ai-engine --remove-env-vars LANGFUSE_PUBLIC_KEY,LANGFUSE_SECRET_KEY,LANGFUSE_BASE_URL
```

---

## 7. 일정

| Phase | 작업 | 예상 소요 |
|-------|------|----------|
| **Phase 1** | Promptfoo 설치 및 설정 | 30분 |
| | 프롬프트 테스트 케이스 작성 | 1시간 |
| | CI/CD 통합 | 30분 |
| **Phase 2** | LangFuse Cloud 설정 | 15분 |
| | SDK 설치 및 핸들러 작성 | 30분 |
| | Supervisor 통합 | 30분 |
| | 검증 및 테스트 | 30분 |
| **총계** | | **~4시간** |

---

## 8. 비용 분석

| 도구 | 무료 티어 | 예상 사용량 | 비용 |
|------|----------|------------|------|
| Promptfoo | 무제한 (OSS) | - | $0 |
| LangFuse Cloud | 50K events/월 | ~10K events/월 | $0 |
| **총 월 비용** | | | **$0** |

---

## 9. 승인

- [ ] 작업 계획 검토 완료
- [ ] Phase 1 (Promptfoo) 진행 승인
- [ ] Phase 2 (LangFuse) 진행 승인

---

**작성자**: Claude Code
**검토자**: (사용자)
