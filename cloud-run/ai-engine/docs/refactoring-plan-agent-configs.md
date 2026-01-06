# Agent Configuration 리팩토링 작업 계획서

**작성일**: 2026-01-06
**버전**: v1.0.0
**상태**: ✅ 완료 (2026-01-06)

---

## 1. 개요

### 1.1 목적
Multi-Agent 시스템의 설정 중복(DRY 위반)을 해결하고, 단일 진실 공급원(SSOT)을 구축하여 유지보수성을 개선한다.

### 1.2 현재 문제점

| 문제 | 심각도 | 설명 |
|------|--------|------|
| 설정 중복 | 높음 | 5개 agent 파일 + orchestrator.ts에 동일 설정 존재 |
| Instructions 불일치 | 높음 | 원본(상세) vs AGENT_CONFIGS(축약) 내용 불일치 |
| 타입 안전성 부족 | 중간 | `Record<string, unknown>` 사용 |
| 유지보수 부담 | 높음 | 수정 시 2곳 동시 변경 필요 |

### 1.3 기대 효과
- 설정 변경 시 1곳만 수정
- Instructions 일관성 보장
- 타입 안전성 강화
- 코드 가독성 향상

---

## 2. 작업 범위

### 2.1 변경 대상 파일

```
cloud-run/ai-engine/src/services/ai-sdk/agents/
├── config/
│   └── agent-configs.ts     [신규] SSOT 설정 파일
│   └── instructions/        [신규] Instructions 상수 파일들
│       ├── nlq.ts
│       ├── analyst.ts
│       ├── reporter.ts
│       ├── advisor.ts
│       └── summarizer.ts
│
├── nlq-agent.ts             [수정] config import 방식으로 변경
├── analyst-agent.ts         [수정] config import 방식으로 변경
├── reporter-agent.ts        [수정] config import 방식으로 변경
├── advisor-agent.ts         [수정] config import 방식으로 변경
├── summarizer-agent.ts      [수정] config import 방식으로 변경
│
└── orchestrator.ts          [수정] AGENT_CONFIGS 제거, import로 변경
```

### 2.2 변경하지 않는 파일
- `model-provider.ts` - 기존 유지
- `index.ts` - export 구조 유지
- Tools 파일들 - 기존 유지

---

## 3. 상세 작업 내용

### Phase 1: SSOT 인프라 구축 (신규 파일 생성)

#### Task 1.1: Instructions 상수 파일 생성
**목적**: 긴 Instructions 문자열을 별도 파일로 분리하여 가독성 향상

```typescript
// agents/config/instructions/nlq.ts
export const NLQ_INSTRUCTIONS = `당신은 서버 모니터링 시스템의 자연어 질의(NLQ) 전문가입니다.
...
`;
```

#### Task 1.2: agent-configs.ts 생성
**목적**: 모든 agent 설정의 SSOT

```typescript
// agents/config/agent-configs.ts
import type { LanguageModel } from 'ai';
import type { CoreTool } from 'ai';

export interface AgentConfig {
  name: string;
  description: string;  // handoffDescription용
  getModel: () => { model: LanguageModel; provider: string; modelId: string } | null;
  instructions: string;
  tools: Record<string, CoreTool>;
  matchPatterns: (string | RegExp)[];  // 라우팅 패턴
}

export const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'NLQ Agent': { ... },
  'Analyst Agent': { ... },
  // ...
};
```

### Phase 2: 개별 Agent 파일 수정

#### Task 2.1: nlq-agent.ts 리팩토링
**Before:**
```typescript
const NLQ_INSTRUCTIONS = `...긴 문자열...`;
const modelConfig = getNlqModel();
export const nlqAgent = modelConfig ? new Agent({ ... }) : null;
```

**After:**
```typescript
import { AGENT_CONFIGS } from './config/agent-configs';

const config = AGENT_CONFIGS['NLQ Agent'];
const modelResult = config.getModel();

export const nlqAgent = modelResult
  ? new Agent({
      name: config.name,
      model: modelResult.model,
      instructions: config.instructions,
      tools: config.tools,
      handoffDescription: config.description,
      matchOn: config.matchPatterns,
    })
  : null;
```

#### Task 2.2~2.5: 나머지 Agent 파일들 동일하게 수정
- analyst-agent.ts
- reporter-agent.ts
- advisor-agent.ts
- summarizer-agent.ts

### Phase 3: Orchestrator 정리

#### Task 3.1: AGENT_CONFIGS 중복 제거
**Before:**
```typescript
// orchestrator.ts 내부에 ~200줄의 AGENT_CONFIGS 정의
const AGENT_CONFIGS: Record<string, AgentConfig> = {
  'NLQ Agent': { ... },  // 중복!
  // ...
};
```

**After:**
```typescript
// orchestrator.ts
import { AGENT_CONFIGS } from './config/agent-configs';
// 직접 참조, 중복 제거
```

### Phase 4: 검증 및 테스트

#### Task 4.1: TypeScript 컴파일 확인
```bash
npx tsc --noEmit
```

#### Task 4.2: 기능 테스트
```bash
# Summarizer Agent 테스트
curl -X POST "/debug/multi-agent" -d '{"query": "서버 상태 요약해줘"}'

# NLQ Agent 테스트
curl -X POST "/debug/multi-agent" -d '{"query": "서버 상태 알려줘"}'

# Analyst Agent 테스트
curl -X POST "/debug/multi-agent" -d '{"query": "서버 이상 있어?"}'
```

#### Task 4.3: Cloud Run 배포 및 검증
```bash
gcloud builds submit --tag gcr.io/openmanager-free-tier/ai-engine:v5-refactor
gcloud run deploy ai-engine --image gcr.io/openmanager-free-tier/ai-engine:v5-refactor
```

---

## 4. 작업 체크리스트

### Phase 1: SSOT 인프라 (예상 소요: 15분) ✅
- [x] `agents/config/` 디렉토리 생성
- [x] `agents/config/instructions/nlq.ts` 생성
- [x] `agents/config/instructions/analyst.ts` 생성
- [x] `agents/config/instructions/reporter.ts` 생성
- [x] `agents/config/instructions/advisor.ts` 생성
- [x] `agents/config/instructions/summarizer.ts` 생성
- [x] `agents/config/agent-configs.ts` 생성

### Phase 2: Agent 파일 수정 (예상 소요: 10분) ✅
- [x] nlq-agent.ts 수정
- [x] analyst-agent.ts 수정
- [x] reporter-agent.ts 수정
- [x] advisor-agent.ts 수정
- [x] summarizer-agent.ts 수정

### Phase 3: Orchestrator 정리 (예상 소요: 5분) ✅
- [x] AGENT_CONFIGS 중복 코드 제거
- [x] import 문 추가

### Phase 4: 검증 (예상 소요: 10분) ✅
- [x] TypeScript 컴파일 성공
- [x] 로컬 테스트 통과 (Server starts with graceful degradation)
- [ ] Cloud Run 배포 성공 (pending)
- [ ] 프로덕션 테스트 통과 (pending)

---

## 5. 롤백 계획

### 5.1 롤백 트리거 조건
- TypeScript 컴파일 실패
- 기능 테스트 실패 (도구 호출 안됨)
- Cloud Run 배포 실패

### 5.2 롤백 방법
```bash
# 이전 이미지로 롤백
gcloud run deploy ai-engine --image gcr.io/openmanager-free-tier/ai-engine:v5-fix-tools

# Git 롤백
git checkout HEAD~1 -- src/services/ai-sdk/agents/
```

---

## 6. 리스크 분석

| 리스크 | 가능성 | 영향 | 대응 |
|--------|--------|------|------|
| Import 경로 오류 | 중간 | 낮음 | TypeScript 컴파일로 사전 검증 |
| 타입 불일치 | 낮음 | 중간 | 엄격한 타입 정의 |
| 기능 회귀 | 낮음 | 높음 | 단계별 테스트, 롤백 준비 |

---

## 7. 승인

- [ ] 작업 계획 검토 완료
- [ ] 리스크 분석 확인
- [ ] 롤백 계획 확인
- [ ] **승인하여 작업 진행**

---

## 8. 변경 이력

| 날짜 | 버전 | 내용 |
|------|------|------|
| 2026-01-06 | v1.0.0 | 초안 작성 |
| 2026-01-06 | v1.1.0 | 리팩토링 완료 (Phase 1-4) |

## 9. 구현 결과 요약

### 생성된 파일
- `agents/config/index.ts` - Config exports
- `agents/config/agent-configs.ts` - SSOT for all agent configurations
- `agents/config/instructions/index.ts` - Instructions exports
- `agents/config/instructions/nlq.ts` - NLQ Agent instructions
- `agents/config/instructions/analyst.ts` - Analyst Agent instructions
- `agents/config/instructions/reporter.ts` - Reporter Agent instructions
- `agents/config/instructions/advisor.ts` - Advisor Agent instructions
- `agents/config/instructions/summarizer.ts` - Summarizer Agent instructions

### 수정된 파일
- `agents/nlq-agent.ts` - Config import (209 → 51 lines, -75% 감소)
- `agents/analyst-agent.ts` - Config import (173 → 49 lines, -72% 감소)
- `agents/reporter-agent.ts` - Config import (196 → 49 lines, -75% 감소)
- `agents/advisor-agent.ts` - Config import (146 → 49 lines, -66% 감소)
- `agents/summarizer-agent.ts` - Config import (148 → 51 lines, -66% 감소)
- `agents/orchestrator.ts` - AGENT_CONFIGS 중복 제거 (~180 lines 감소)

### 효과
- **DRY 위반 해결**: 설정 중복 제거 완료
- **SSOT 구축**: agent-configs.ts가 모든 설정의 단일 진실 공급원
- **타입 안전성**: AgentConfig interface 정의
- **유지보수성**: 설정 변경 시 1곳만 수정
- **코드 가독성**: Agent 파일들이 50줄 이하로 간결해짐
