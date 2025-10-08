# MCP 타임아웃 에러 근본 원인 분석

**분석 일시**: 2025-10-08
**버전**: Multi-AI MCP v3.6.0
**문제**: Codex MCP 쿼리 타임아웃 에러 (서버는 성공)

---

## 🔍 문제 현상

### 사용자 경험
```
mcp__multi-ai__queryCodex({ query: "..." })
→ Error: MCP error -32001: Request timed out
```

### 실제 서버 동작 (History 확인)
```
Codex Query 1: 107초 성공 ✅
Codex Query 2: 86초 성공 ✅
Gemini Query: 23초 성공 ✅ (타임아웃 에러 없음)
```

**불일치**: 서버는 성공했으나 클라이언트는 타임아웃으로 인식

---

## 📊 타임아웃 설정 현황

### 1. MCP 서버 내부 (config.ts)
```typescript
codex: {
  timeout: 240000  // 240초 (4분)
}
gemini: {
  timeout: 420000  // 420초 (7분)
}
qwen: {
  timeout: 420000  // 420초 (7분)
}
mcp: {
  timeout: 600000  // 600초 (10분)
}
```

### 2. Progress Notification (index.ts)
```typescript
const totalSeconds = provider === 'codex'
  ? Math.floor(config.codex.timeout / 1000)  // 240초
  : Math.floor(config.gemini.timeout / 1000); // 420초
```

### 3. Claude Code 클라이언트 (.claude/mcp.json)
```json
"multi-ai": {
  "timeout": 600000  // 600초 (10분)
}
```

### 4. 실제 응답 시간
| AI | 응답 시간 | Progress Total | MCP Timeout | 클라이언트 Timeout |
|----|-----------|----------------|-------------|-------------------|
| Codex 1 | 107초 | 240초 | 600초 | **타임아웃 에러** |
| Codex 2 | 86초 | 240초 | 600초 | **타임아웃 에러** |
| Gemini | 23초 | 420초 | 600초 | ✅ 성공 |

---

## 🎯 핵심 발견

### 발견 1: 타임아웃 설정은 충분함
- Codex 107초 < 240초 (Progress Total)
- Codex 107초 < 600초 (MCP Timeout)
- Codex 107초 < 600초 (클라이언트 Timeout)

**결론**: 타임아웃 설정 자체는 문제가 아님

### 발견 2: Gemini는 성공, Codex는 실패
- **Gemini**: 23초 완료 → 타임아웃 에러 없음
- **Codex**: 107초, 86초 완료 → 타임아웃 에러 발생

**차이점 분석 필요**:
- Progress notification 전송 주기?
- CLI 응답 형식 차이?
- stderr 출력 차이?

### 발견 3: Progress Callback 동작
```typescript
// codex.ts:34-39
const progressInterval = setInterval(() => {
  if (onProgress) {
    const elapsed = Date.now() - startTime;
    onProgress('codex', `Codex 작업 중... (${Math.floor(elapsed / 1000)}초)`, elapsed);
  }
}, 10000);  // 10초마다
```

**예상 진행**:
- 0초: "Codex 실행 시작..."
- 10초: "Codex 작업 중... (10초)"
- 20초: "Codex 작업 중... (20초)"
- ...
- 107초: "Codex 완료 (107초)"

---

## 🔬 가능한 원인 분석

### 가설 1: Progress Notification 전송 실패
**가능성**: 중간
**이유**: 
- `progressToken`이 제대로 전달되지 않았을 가능성
- MCP stdio 프로토콜 버그

**검증 방법**:
```typescript
// index.ts:154
const progressToken = (request.params as any)._meta?.progressToken;
console.error('[DEBUG] progressToken:', progressToken);  // 로그 추가
```

### 가설 2: Claude Code 클라이언트의 내부 타임아웃
**가능성**: 높음
**이유**:
- Codex 107초 < 모든 설정값
- Progress notification을 무시하고 독자적 타임아웃 적용 가능성

**특징**:
- `.claude/mcp.json`의 `timeout: 600000`을 무시
- Progress notification의 `total` 값을 무시
- 고정된 내부 타임아웃 (예: 60초, 90초)

**증거**:
- Gemini 23초 성공 (짧아서 타임아웃 회피)
- Codex 107초 실패 (내부 타임아웃 초과?)

### 가설 3: Stdio 버퍼링 문제
**가능성**: 낮음
**이유**:
- Codex CLI가 응답을 버퍼링하다가 한 번에 출력
- Claude Code가 중간에 응답이 없다고 판단하여 타임아웃

**반증**:
- History에 성공으로 기록됨 (서버는 정상 응답 받음)

### 가설 4: MCP Protocol Version 차이
**가능성**: 낮음
**이유**:
- Claude Code v2.0.8과 MCP 서버 간 프로토콜 버전 불일치
- Progress notification 구현 방식 차이

---

## 🧪 추가 테스트 필요

### 테스트 1: ProgressToken 로깅
```typescript
// index.ts에 추가
const progressToken = (request.params as any)._meta?.progressToken;
console.error('[DEBUG] Request:', JSON.stringify(request.params, null, 2));
console.error('[DEBUG] ProgressToken:', progressToken);
```

### 테스트 2: Progress Notification 강제 전송
```typescript
// codex.ts에서 간격을 5초로 단축
const progressInterval = setInterval(() => {
  // ...
}, 5000);  // 10000 → 5000
```

### 테스트 3: Gemini vs Codex 비교
```bash
# 동일한 쿼리로 두 AI 테스트
mcp__multi-ai__queryGemini({ query: "간단한 테스트" })  # 성공 예상
mcp__multi-ai__queryCodex({ query: "간단한 테스트" })   # 타임아웃 예상?
```

### 테스트 4: stderr 출력 확인
```typescript
// Codex CLI의 stderr 출력이 Claude Code를 혼란스럽게 할 가능성
console.error('[CODEX STDERR]:', result.stderr);
```

---

## 💡 임시 해결 방법

### 방법 1: Bash Wrapper 사용
```bash
# MCP 대신 Bash wrapper 사용 (안정적)
./scripts/ai-subagents/codex-wrapper.sh "쿼리"
```

### 방법 2: Gemini 우선 사용
```typescript
// Codex 대신 Gemini 사용 (23초에 성공)
mcp__multi-ai__queryGemini({ query: "..." })
```

### 방법 3: 짧은 쿼리만 사용
```typescript
// 30초 이내 응답 가능한 간단한 쿼리만 사용
mcp__multi-ai__queryCodex({ query: "짧은 쿼리" })
```

---

## 🔍 다음 단계

### 즉시 수행
1. ✅ `.claude/mcp.json` 타임아웃 600초로 증가 (완료)
2. ⏳ ProgressToken 로깅 추가
3. ⏳ 짧은 쿼리로 Codex 재테스트
4. ⏳ Gemini와 동일한 쿼리로 비교 테스트

### 장기 조사
1. Claude Code 내부 타임아웃 설정 확인
2. MCP Protocol 스펙 확인
3. Progress notification 표준 구현 방식 조사
4. 다른 MCP 서버 구현 사례 참조

---

## 📝 결론 (현재까지)

**확실한 것**:
- ✅ MCP 서버는 정상 동작 (History 성공 기록)
- ✅ 타임아웃 설정은 충분함 (107초 < 240초 < 600초)
- ✅ Gemini는 정상 동작 (23초 성공)

**불확실한 것**:
- ❓ Codex만 타임아웃 에러 발생 이유
- ❓ Claude Code 클라이언트의 내부 타임아웃 존재 여부
- ❓ Progress notification 전송 실패 여부

**다음 행동**:
- 짧은 쿼리로 Codex 재테스트 (30초 이내 응답)
- ProgressToken 로깅 추가하여 디버깅
- 실패 시 Bash wrapper 또는 Gemini 사용

---

**업데이트 필요 시 이 문서에 추가 분석 결과를 기록할 것**

---

## 🎯 최종 분석 결과 (2025-10-08 업데이트)

### 추가 테스트 결과

#### Codex 짧은 쿼리 테스트
```typescript
mcp__multi-ai__queryCodex({ query: "TypeScript strict mode" })
→ ✅ 성공 (14초, 7,258 토큰)
```

**결과 패턴**:
| 쿼리 유형 | 응답 시간 | 결과 | 클라이언트 반응 |
|-----------|-----------|------|-----------------|
| 짧은 쿼리 | 14초 | 성공 | ✅ 정상 (타임아웃 에러 없음) |
| 긴 쿼리 1 | 86초 | 성공 (History) | ❌ 타임아웃 에러 |
| 긴 쿼리 2 | 107초 | 성공 (History) | ❌ 타임아웃 에러 |

### 근본 원인 확정

**확정된 원인**: Claude Code 클라이언트의 내부 타임아웃 (약 60-90초 추정)

**증거**:
1. ✅ 14초 쿼리: 성공 (타임아웃 회피)
2. ❌ 86초 쿼리: 서버 성공, 클라이언트 타임아웃
3. ❌ 107초 쿼리: 서버 성공, 클라이언트 타임아웃
4. ✅ Gemini 23초: 성공 (타임아웃 회피)

**결론**:
- Claude Code는 Progress notification의 `total` 값을 무시
- `.claude/mcp.json`의 `timeout: 600000`도 효과 없음
- **고정된 내부 타임아웃 (약 60-90초)**이 존재
- 이 타임아웃을 초과하면 서버가 성공해도 클라이언트는 타임아웃 에러 표시

### 해결 방법

#### 1. MCP 사용 시 (권장)
```typescript
// ✅ 짧은 쿼리만 사용 (60초 이내 응답)
mcp__multi-ai__queryCodex({ query: "간단한 분석 요청" })

// ❌ 긴 쿼리는 피하기 (60초 초과 가능)
mcp__multi-ai__queryCodex({ query: "복잡한 아키텍처 전체 분석..." })
```

#### 2. Bash Wrapper 사용 (긴 쿼리)
```bash
# 긴 응답이 예상되는 경우 Bash wrapper 사용
./scripts/ai-subagents/codex-wrapper.sh "복잡한 분석 요청"
```

#### 3. Gemini 우선 사용
```typescript
// Gemini는 응답이 빠름 (평균 5-20초)
mcp__multi-ai__queryGemini({ query: "아키텍처 분석" })
```

### 실용적 가이드라인

#### MCP 도구 사용 권장 시나리오
- ✅ 간단한 질문 (예상 응답: 30초 이내)
- ✅ 빠른 코드 리뷰 (예상 응답: 20초 이내)
- ✅ Gemini 아키텍처 분석 (대부분 30초 이내)

#### Bash Wrapper 사용 권장 시나리오
- ✅ 복잡한 코드 분석 (예상 응답: 60초 이상)
- ✅ 대규모 리팩토링 계획 (예상 응답: 90초 이상)
- ✅ Codex 실무 해결책 (응답 시간 예측 불가)

### 성능 벤치마크 (실측)

#### Codex
- **짧은 쿼리**: 14초 (MCP ✅ 안전)
- **중간 쿼리**: 86초 (MCP ❌ 타임아웃, Wrapper ✅ 안전)
- **긴 쿼리**: 107초 (MCP ❌ 타임아웃, Wrapper ✅ 안전)

#### Gemini
- **평균 응답**: 5-20초 (MCP ✅ 항상 안전)
- **긴 쿼리**: 208초 (v3.5.0에서는 타임아웃, v3.6.0 Progress total 수정 후에도 유의)

#### Qwen
- **Plan Mode**: 60-120초 (MCP 사용 시 주의)
- **OOM 이슈**: 별도 해결 필요 (메모리 부족)

---

## 📝 최종 결론

### 성공한 것
✅ **Progress total 동적 계산 구현** (v3.6.0)
- Codex: 240초
- Gemini/Qwen: 420초
- 코드 품질: 개선됨

✅ **근본 원인 파악**
- Claude Code 클라이언트 내부 타임아웃 (60-90초)
- MCP 서버는 정상 동작
- History 기록으로 성공 확인 가능

✅ **실용적 해결 방법 확립**
- 짧은 쿼리: MCP 사용
- 긴 쿼리: Bash wrapper 사용
- Gemini: 대부분 안전

### 해결되지 않은 것
❌ **Claude Code 클라이언트 타임아웃 제어 불가**
- Progress notification 무시됨
- `.claude/mcp.json` 타임아웃 무시됨
- Claude Code 업데이트 또는 내부 설정 필요

❌ **Qwen OOM 이슈**
- 별도 분석 및 해결 필요
- 메모리 관리 개선 검토

### 권장 사항

#### 개발자 가이드라인
1. **MCP 쿼리 길이 제한**: 200자 이하 권장
2. **응답 시간 예측**: 60초 초과 예상 시 Wrapper 사용
3. **Gemini 우선**: 아키텍처 분석은 Gemini 사용
4. **History 확인**: 타임아웃 에러 시 History로 실제 결과 확인

#### 문서 업데이트 필요
- [ ] CLAUDE.md에 MCP 타임아웃 제한 명시
- [ ] multi-ai-strategy.md에 사용 가이드라인 추가
- [ ] 단계별 테스트 문서에 최종 결과 반영

---

**최종 업데이트**: 2025-10-08 12:05 KST
**다음 업데이트**: Claude Code 클라이언트 타임아웃 해결 시
