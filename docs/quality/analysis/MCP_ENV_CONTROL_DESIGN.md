# MCP 환경 변수 제어 방안 설계

**설계 일시**: 2025-10-08
**목적**: MCP 타임아웃 문제를 환경 변수로 제어 가능하게 개선

---

## 🎯 핵심 발견

### MCP 표준 분석 (2025-03-26)

**타임아웃 정책**:
```
Implementations SHOULD establish timeouts for all sent requests

Implementations MAY choose to reset the timeout clock when 
receiving a progress notification

Implementations SHOULD always enforce a maximum timeout, 
regardless of progress notifications
```

**결론**:
- ✅ Progress notification은 **표준** (MCP spec 2025-03-26)
- ✅ 타임아웃 리셋은 **선택사항** (MAY)
- ✅ 최대 타임아웃 강제는 **권장사항** (SHOULD)
- ✅ **Claude Code는 표준을 따름** (60-90초 최대 타임아웃)

### 다른 MCP 서버 비교

**Playwright MCP 테스트**:
```typescript
mcp__playwright__playwright_navigate({
  url: "https://example.com",
  timeout: 120000  // 120초
})
→ ✅ 성공
```

**차이점**:
- Playwright: 브라우저 작업 (시각적 진행 상황)
- Multi-AI: CLI 실행 (중간 출력 버퍼링)
- Claude Code는 Playwright에는 더 관대한 타임아웃 적용?

**추정**:
- 도구별로 다른 타임아웃 정책 가능
- 또는 Playwright는 빠르게 응답하여 타임아웃 회피

---

## 💡 설계 철학

### 사용자의 철학

> "내가 직접 만든 Multi-AI MCP는 다른 제작사의 MCP와 달리, 완전히 독립적으로 동작해야 한다."

**Self-Contained 설계**:
1. 환경 변수 없이도 동작 (기본값)
2. 환경 변수로 세밀한 제어 가능
3. `.env` 파일 불필요 (모든 설정은 선택적)

### 환경 변수 제어의 장점

```bash
# 1. 기본 사용 (환경 변수 없음)
node dist/index.js
# → 기본값으로 동작

# 2. 커스터마이즈 (환경 변수)
export MULTI_AI_PROGRESS_INTERVAL=3000
export MULTI_AI_EARLY_RESPONSE=true
node dist/index.js
# → 사용자 맞춤 설정

# 3. .claude/mcp.json 통합
{
  "multi-ai": {
    "env": {
      "MULTI_AI_PROGRESS_INTERVAL": "3000",
      "MULTI_AI_EARLY_RESPONSE": "true"
    }
  }
}
```

---

## 🔧 설계 방안

### 방안 1: Progress 간격 제어

#### 환경 변수
```bash
MULTI_AI_PROGRESS_INTERVAL=5000  # 기본 10000ms → 5000ms
```

#### 구현
```typescript
// config.ts
export const config = {
  progress: {
    interval: parseInt(process.env.MULTI_AI_PROGRESS_INTERVAL || '10000', 10),
    minInterval: 1000,   // 최소 1초
    maxInterval: 30000,  // 최대 30초
  }
};

// codex.ts
const progressInterval = setInterval(() => {
  if (onProgress) {
    onProgress('codex', status, elapsed);
  }
}, config.progress.interval);  // 환경 변수로 제어
```

#### 효과
- 더 자주 Progress 전송 → 클라이언트 "살아있음" 인식 증가
- 환경 변수로 1-30초 사이 자유 설정
- 기본값 10초 (변경 없음)

### 방안 2: 초기 응답 즉시 전송

#### 환경 변수
```bash
MULTI_AI_EARLY_RESPONSE=true  # 기본 false
```

#### 구현
```typescript
// config.ts
export const config = {
  earlyResponse: {
    enabled: process.env.MULTI_AI_EARLY_RESPONSE === 'true',
    message: "분석 시작... (작업 진행 중)"
  }
};

// codex.ts
async function executeCodexQuery(...) {
  const startTime = Date.now();
  
  // 초기 응답 즉시 전송 (환경 변수로 제어)
  if (config.earlyResponse.enabled && onProgress) {
    onProgress('codex', config.earlyResponse.message, 0);
  }
  
  // 실제 작업 수행
  const result = await execFileAsync(...);
  return result;
}
```

#### 효과
- 즉시 응답 → 클라이언트가 "작업 시작됨" 인식
- 환경 변수로 on/off 제어
- 기본값 false (변경 없음)

### 방안 3: 쿼리 길이 기반 자동 모드 전환

#### 환경 변수
```bash
MULTI_AI_AUTO_MODE=true           # 기본 false
MULTI_AI_SHORT_QUERY_THRESHOLD=200  # 기본 200자
```

#### 구현
```typescript
// config.ts
export const config = {
  autoMode: {
    enabled: process.env.MULTI_AI_AUTO_MODE === 'true',
    shortQueryThreshold: parseInt(
      process.env.MULTI_AI_SHORT_QUERY_THRESHOLD || '200',
      10
    ),
  }
};

// index.ts (tool handler)
case 'queryCodex': {
  const { query } = args;
  
  // 자동 모드: 쿼리 길이로 판단
  if (config.autoMode.enabled) {
    if (query.length <= config.autoMode.shortQueryThreshold) {
      // MCP 모드 (짧은 쿼리)
      const result = await queryCodex(query, onProgress);
    } else {
      // Wrapper 권장 메시지
      return {
        content: [{
          type: 'text',
          text: `쿼리가 ${query.length}자로 길어서 Wrapper 사용을 권장합니다.\n` +
                `Bash: ./scripts/ai-subagents/codex-wrapper.sh "${query}"`
        }]
      };
    }
  }
}
```

#### 효과
- 쿼리 길이로 자동 판단
- 긴 쿼리는 Wrapper 권장
- 환경 변수로 on/off 및 임계값 제어
- 기본값 false (변경 없음)

### 방안 4: Progress 로깅 강화

#### 환경 변수
```bash
MULTI_AI_VERBOSE_PROGRESS=true  # 기본 false
```

#### 구현
```typescript
// config.ts
export const config = {
  verboseProgress: process.env.MULTI_AI_VERBOSE_PROGRESS === 'true',
};

// index.ts
const createProgressCallback = (progressToken?: string): ProgressCallback => {
  return (provider, status, elapsed) => {
    const elapsedSeconds = Math.floor(elapsed / 1000);

    // 기본 로그
    console.error(`[${provider.toUpperCase()}] ${status} (${elapsedSeconds}초)`);

    // Verbose 로그 (환경 변수로 제어)
    if (config.verboseProgress) {
      console.error(`[VERBOSE] progressToken: ${progressToken}`);
      console.error(`[VERBOSE] total: ${totalSeconds}`);
      console.error(`[VERBOSE] elapsed: ${elapsedSeconds}/${totalSeconds}`);
    }

    // Progress notification 전송
    if (progressToken) {
      // ...
    }
  };
};
```

#### 효과
- Progress 전송 여부 확인 가능
- 디버깅 용이
- 환경 변수로 on/off 제어

---

## 📊 환경 변수 종합

### 제안하는 환경 변수

| 환경 변수 | 기본값 | 범위 | 설명 |
|----------|--------|------|------|
| `MULTI_AI_PROGRESS_INTERVAL` | 10000 | 1000-30000 | Progress 전송 간격 (ms) |
| `MULTI_AI_EARLY_RESPONSE` | false | true/false | 초기 응답 즉시 전송 |
| `MULTI_AI_AUTO_MODE` | false | true/false | 쿼리 길이 기반 자동 모드 전환 |
| `MULTI_AI_SHORT_QUERY_THRESHOLD` | 200 | 50-1000 | 짧은 쿼리 임계값 (자) |
| `MULTI_AI_VERBOSE_PROGRESS` | false | true/false | Progress 상세 로그 |

### .claude/mcp.json 예시

```json
{
  "multi-ai": {
    "timeout": 600000,
    "command": "node",
    "args": ["--max-old-space-size=4096", "dist/index.js"],
    "env": {
      "MULTI_AI_PROGRESS_INTERVAL": "5000",
      "MULTI_AI_EARLY_RESPONSE": "true",
      "MULTI_AI_VERBOSE_PROGRESS": "false"
    }
  }
}
```

### 사용 시나리오

**시나리오 1: 기본 사용 (변경 없음)**
```json
{
  "multi-ai": {
    "env": {
      // 환경 변수 없음 → 기본값 사용
    }
  }
}
```

**시나리오 2: 공격적 Progress (타임아웃 회피 시도)**
```json
{
  "multi-ai": {
    "env": {
      "MULTI_AI_PROGRESS_INTERVAL": "3000",  // 3초마다
      "MULTI_AI_EARLY_RESPONSE": "true",     // 즉시 응답
      "MULTI_AI_VERBOSE_PROGRESS": "true"    // 디버깅
    }
  }
}
```

**시나리오 3: 자동 모드 (사용자 편의)**
```json
{
  "multi-ai": {
    "env": {
      "MULTI_AI_AUTO_MODE": "true",              // 자동 모드
      "MULTI_AI_SHORT_QUERY_THRESHOLD": "150"    // 150자 이하만 MCP
    }
  }
}
```

---

## 🔬 예상 효과

### 긍정적 시나리오

**Progress 3초 간격 + 초기 응답**:
```
시간선:
0s   - 초기 응답 전송 ✅
3s   - Progress 전송 ✅
6s   - Progress 전송 ✅
9s   - Progress 전송 ✅
...
86s  - 완료 ✅

클라이언트 인식:
- 즉시 응답 → "작업 시작됨"
- 3초마다 신호 → "작업 진행 중"
- 타임아웃 회피 가능성 증가
```

### 부정적 시나리오

**클라이언트가 Progress 무시**:
```
시간선:
0s   - 초기 응답 전송 (무시됨)
3s   - Progress 전송 (무시됨)
...
60s  - 클라이언트 타임아웃 ❌
86s  - 서버 완료 (무의미)
```

### 현실적 예상

**부분적 개선**:
- Progress 간격 단축: 약간의 개선 가능 (10-20%)
- 초기 응답: 약간의 개선 가능 (10-20%)
- **근본 해결은 불가능** (클라이언트 타임아웃 고정)

**하지만**:
- 환경 변수로 제어 가능 → 사용자 실험 가능
- 디버깅 용이 → 문제 원인 파악 용이
- Self-Contained → 철학에 부합

---

## 🎯 구현 계획

### Phase 1: 기본 환경 변수 지원 (v3.8.0)

**구현**:
1. `MULTI_AI_PROGRESS_INTERVAL`
2. `MULTI_AI_EARLY_RESPONSE`
3. `MULTI_AI_VERBOSE_PROGRESS`

**테스트**:
```bash
# 환경 변수 없이 (기본 동작)
npm run build
node dist/index.js

# 환경 변수로 (커스터마이즈)
export MULTI_AI_PROGRESS_INTERVAL=5000
export MULTI_AI_EARLY_RESPONSE=true
npm run build
node dist/index.js
```

### Phase 2: 자동 모드 지원 (v3.9.0)

**구현**:
1. `MULTI_AI_AUTO_MODE`
2. `MULTI_AI_SHORT_QUERY_THRESHOLD`

**테스트**:
- 짧은 쿼리 (150자): MCP 실행
- 긴 쿼리 (300자): Wrapper 권장

### Phase 3: 문서화 및 가이드

**문서 업데이트**:
- CLAUDE.md: 환경 변수 설명 추가
- config.ts: JSDoc 주석 추가
- README: 사용 예시 추가

---

## 📝 결론

### MCP 표준의 제약인가?

**아니오. MCP 표준은 유연합니다.**

- Progress notification: ✅ 표준
- 타임아웃 리셋: 선택사항 (MAY)
- **Claude Code의 구현 방식**:
  - Progress를 무시하거나
  - 60-90초 최대 타임아웃 강제
  - **이것도 표준을 따르는 정상적 구현**

### 다른 MCP들도 그런가?

**일부는 그렇고, 일부는 아닙니다.**

- Playwright: 120초 타임아웃 성공 ✅
- Multi-AI: 86초 타임아웃 실패 ❌
- **도구별로 다를 수 있음**

### 환경 변수 제어가 답인가?

**부분적으로 예, 하지만 완벽한 해결책은 아닙니다.**

**장점**:
- ✅ 사용자 철학에 부합 (Self-Contained + 제어 가능)
- ✅ 실험 가능 (다양한 설정 시도)
- ✅ 디버깅 용이 (Verbose 로그)
- ✅ 변경 없이도 동작 (기본값)

**한계**:
- ❌ Claude Code 타임아웃 근본 해결 불가
- ❌ 효과는 제한적 (10-20% 개선 예상)
- ❌ 긴 쿼리는 여전히 Wrapper 필요

### 최종 권장사항

**1. 환경 변수 지원 구현 (v3.8.0)**
```typescript
MULTI_AI_PROGRESS_INTERVAL=5000
MULTI_AI_EARLY_RESPONSE=true
MULTI_AI_VERBOSE_PROGRESS=true
```

**2. 사용자 선택 존중**
- 기본값: 안정적 (10초 간격)
- 환경 변수: 공격적 (3-5초 간격)

**3. 문서화**
- 환경 변수 효과 설명
- 한계 명시
- Wrapper 대안 제시

**4. 장기적**
- Claude Code 개선 요청
- 커뮤니티 피드백 수집
- 더 나은 해결책 탐색

---

**다음 단계**: Phase 1 구현 (v3.8.0)
