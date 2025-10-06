# Multi-AI MCP 디버그 모드 가이드

**목적**: 문제 발생 시 상세 로그를 활성화하여 디버깅

---

## 📊 현재 설정

**기본값** (프로덕션):
```json
// .claude/mcp.json
{
  "mcpServers": {
    "multi-ai": {
      "env": {
        "MULTI_AI_DEBUG": "false",  // ✅ 평소에는 false
        "NODE_ENV": "production"
      }
    }
  }
}
```

**상태**: ✅ **디버그 모드 OFF** (정상)

---

## 🔍 디버그 모드 활성화 시나리오

### 언제 켜야 하는가?

#### ✅ 켜야 할 때
1. **AI 응답 실패 디버깅**
   - Qwen Rate Limit 원인 분석
   - Gemini 타임아웃 상세 로그
   - Codex 에러 메시지 추적

2. **메모리 문제 분석**
   - Memory Guard 작동 확인
   - 80%+ 메모리 경고 추적
   - GC 타이밍 분석

3. **성능 측정**
   - 각 단계별 응답 시간
   - 쿼리 복잡도 판단 로직
   - Rate Limit 대기 시간

4. **새 기능 테스트**
   - v3.2.0 사후 검증 기능
   - Rate Limit 회피 로직
   - 타임아웃 설정 검증

#### ❌ 켤 필요 없을 때
1. **정상 작동 중** - 불필요한 로그 출력
2. **프로덕션 사용** - 성능 오버헤드
3. **일상적 쿼리** - 로그 노이즈

---

## ⚙️ 디버그 모드 활성화 방법

### 1단계: 설정 변경

```bash
# .claude/mcp.json 수정
vi /mnt/d/cursor/openmanager-vibe-v5/.claude/mcp.json
```

```json
{
  "mcpServers": {
    "multi-ai": {
      "env": {
        "MULTI_AI_DEBUG": "true",  // false → true 변경
        "NODE_ENV": "development"   // production → development 변경 (선택)
      }
    }
  }
}
```

### 2단계: Claude Code 재시작

**방법 A: 완전 재시작** (권장)
```bash
# Terminal에서 Claude Code 종료 후 재실행
# 또는 Ctrl+C로 종료 후 claude 명령어 실행
```

**방법 B: MCP 서버만 재시작**
```bash
# Claude Code 내에서
/reload
```

### 3단계: 디버그 로그 확인

**로그 출력 위치**: stderr (Claude Code 콘솔)

**예시 로그**:
```bash
[Memory INFO] Pre-query Codex: 1.2GB / 4.0GB (30.0%)
[Qwen] Rate limit protection: waiting 842ms...
[Memory WARNING] Post-query Gemini: 3.2GB / 4.0GB (80.5%)
[Memory CRITICAL] Post-query Qwen: 3.8GB / 4.0GB (95.2%)
```

---

## 📝 디버그 모드에서만 보이는 정보

### A. 메모리 상세 로그

**디버그 OFF** (기본):
```
[Memory WARNING] Post-query Codex: 3.2GB / 4.0GB (80.0%)
[Memory CRITICAL] Pre-check failed Qwen: 3.6GB / 4.0GB (90.1%)
```

**디버그 ON**:
```
[Memory INFO] Pre-query Codex: 1.2GB / 4.0GB (30.0%)    // 호출 전
[Memory INFO] Post-query Codex: 1.5GB / 4.0GB (37.5%)   // 호출 후
[Memory WARNING] Pre-query Gemini: 3.2GB / 4.0GB (80.0%)
[Memory WARNING] Post-query Gemini: 3.4GB / 4.0GB (85.0%)
```

**차이**:
- DEBUG OFF: 80%+ 경고, 90%+ 에러만
- DEBUG ON: **모든 쿼리의 메모리 추적**

---

### B. Rate Limit 대기 로그

**디버그 OFF**: 로그 없음 (조용히 대기)

**디버그 ON**:
```
[Qwen] Rate limit protection: waiting 842ms...
[Qwen] Rate limit protection: waiting 1000ms...
[Qwen] Rate limit protection: waiting 523ms...
```

**용도**: Rate Limit 로직이 제대로 작동하는지 확인

---

### C. 재시도 로직 추적

**디버그 OFF**:
```
[Codex] Retry attempt 1: Command failed: codex exec ...
```

**디버그 ON**:
```
[Codex] Retry attempt 1: Command failed: codex exec ...
[Retry] Waiting 2000ms before retry (backoff)
[Retry] Attempt 2/3 starting...
[Codex] Retry attempt 2: timeout after 90000ms
[Retry] Waiting 4000ms before retry (backoff)
[Retry] Attempt 3/3 starting...
```

**용도**: 지수 백오프 타이밍 검증

---

## 🎯 테스트 시나리오별 활성화 가이드

### 시나리오 1: Qwen Rate Limit 테스트

**목적**: 1초 간격 보장 확인

**설정**:
```json
{
  "MULTI_AI_DEBUG": "true"
}
```

**테스트 방법**:
```typescript
// 3-AI 연속 쿼리
mcp__multi_ai__queryCodex({ query: "Test 1" });
mcp__multi_ai__queryGemini({ query: "Test 2" });
mcp__multi_ai__queryQwen({ query: "Test 3", planMode: true });
```

**예상 로그**:
```
[Qwen] Rate limit protection: waiting 0ms...     // 첫 번째 (대기 없음)
[Qwen] Rate limit protection: waiting 842ms...   // 두 번째 (842ms 대기)
[Qwen] Rate limit protection: waiting 1000ms...  // 세 번째 (1초 대기)
```

**성공 기준**: 각 Qwen 쿼리 사이 최소 1초 간격

---

### 시나리오 2: 타임아웃 개선 검증

**목적**: 360초 타임아웃으로 긴 응답 수신 확인

**설정**:
```json
{
  "MULTI_AI_DEBUG": "true",
  "timeout": 360000
}
```

**테스트 방법**:
```typescript
// 긴 코드 분석 (60초+ 예상)
mcp__multi_ai__queryGemini({
  query: "500줄 코드의 아키텍처 분석 및 SOLID 원칙 검토"
});
```

**예상 로그**:
```
[Gemini] Starting query...
[Memory INFO] Pre-query Gemini: 1.5GB / 4.0GB (37.5%)
... (60초 경과) ...
[Gemini] Query completed in 67329ms
[Memory INFO] Post-query Gemini: 2.1GB / 4.0GB (52.5%)
```

**성공 기준**: 60초+ 응답을 타임아웃 없이 수신

---

### 시나리오 3: Memory Guard 작동 확인

**목적**: 90% 임계값에서 거부 확인

**설정**:
```json
{
  "MULTI_AI_DEBUG": "true"
}
```

**테스트 방법**:
```typescript
// 메모리 부하 생성 (연속 쿼리)
for (let i = 0; i < 5; i++) {
  await mcp__multi_ai__queryCodex({ query: `Test ${i}` });
}
```

**예상 로그**:
```
[Memory INFO] Pre-query Codex: 1.5GB / 4.0GB (37.5%)
[Memory INFO] Post-query Codex: 2.0GB / 4.0GB (50.0%)
[Memory WARNING] Pre-query Codex: 3.2GB / 4.0GB (80.0%)
[Memory WARNING] Post-query Codex: 3.5GB / 4.0GB (87.5%)
[Memory CRITICAL] Pre-check failed Codex: 3.6GB / 4.0GB (90.1%)
Error: Memory critical (90.1%): 3.6GB / 4.0GB. Refusing Codex query...
```

**성공 기준**: 90%+ 도달 시 쿼리 거부

---

## 🔄 디버그 모드 비활성화

### 테스트 완료 후

```bash
# 1. .claude/mcp.json 수정
vi /mnt/d/cursor/openmanager-vibe-v5/.claude/mcp.json
```

```json
{
  "mcpServers": {
    "multi-ai": {
      "env": {
        "MULTI_AI_DEBUG": "false",  // true → false 변경
        "NODE_ENV": "production"    // development → production 변경
      }
    }
  }
}
```

```bash
# 2. Claude Code 재시작
/reload
```

---

## 📊 디버그 모드 성능 영향

| 항목 | DEBUG OFF | DEBUG ON | 차이 |
|------|-----------|----------|------|
| **로그 출력량** | 2-3줄/쿼리 | 10-15줄/쿼리 | +400% |
| **응답 시간** | 기준 | +1-2ms | +0.1% |
| **메모리 사용** | 기준 | +5MB | +0.1% |
| **가독성** | 높음 (경고만) | 낮음 (모든 정보) | -50% |

**결론**: 성능 영향은 미미하지만, 로그 노이즈가 증가하므로 **문제 발생 시에만 활성화**

---

## 🎓 모범 사례

### ✅ 권장 사용 패턴

```bash
# 1. 문제 발생 확인
"Qwen이 계속 실패합니다"

# 2. 디버그 모드 활성화
MULTI_AI_DEBUG=true

# 3. 문제 재현
mcp__multi_ai__queryQwen(...)

# 4. 로그 분석
[Qwen] Rate limit protection: waiting 523ms...
[Qwen] Query completed in 10234ms
✅ Rate Limit 로직 정상 작동

# 5. 디버그 모드 비활성화
MULTI_AI_DEBUG=false
```

### ❌ 잘못된 사용 패턴

```bash
# 1. 디버그 모드를 항상 켜둠
MULTI_AI_DEBUG=true (계속 유지)

# 2. 정상 작동 중에도 로그 확인
불필요한 로그 노이즈 발생

# 3. 프로덕션 환경에서 활성화
성능 오버헤드 및 로그 과부하
```

---

## 📋 체크리스트

### 디버그 모드 활성화 전

- [ ] 문제가 명확히 정의되어 있는가?
- [ ] 정상 작동 시 로그로 충분히 확인 가능한가?
- [ ] 디버그 로그로 무엇을 확인할 것인가?

### 디버그 모드 활성화 중

- [ ] .claude/mcp.json에서 MULTI_AI_DEBUG=true 설정
- [ ] Claude Code 재시작 완료
- [ ] 문제 재현 및 로그 수집
- [ ] 로그 분석 및 원인 파악

### 디버그 모드 비활성화 후

- [ ] MULTI_AI_DEBUG=false 복원
- [ ] NODE_ENV=production 복원
- [ ] Claude Code 재시작
- [ ] 정상 작동 확인

---

## 🔗 관련 문서

- [MCP_RETEST_RESULTS.md](./MCP_RETEST_RESULTS.md) - 타임아웃 이슈 분석
- [ROADMAP_v3.2.0.md](./ROADMAP_v3.2.0.md) - 사후 검증 설계
- [Memory Guard 구현](./src/middlewares/memory-guard.ts)

---

**작성일**: 2025-10-06
**작성자**: Claude Code (Sonnet 4.5)
**현재 설정**: ✅ MULTI_AI_DEBUG=false (프로덕션)
**권장 사용**: 문제 발생 시에만 활성화
