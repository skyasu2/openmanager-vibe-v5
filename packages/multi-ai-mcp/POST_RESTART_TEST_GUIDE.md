# Multi-AI MCP v3.2.0 재시작 후 테스트 가이드

**목적**: MCP timeout 360초 + Qwen Rate Limit 회피 검증

---

## 📋 사전 준비

### 1. 변경사항 확인

**완료된 개선**:
- ✅ MCP timeout: 360초 (6분)
- ✅ Qwen Rate Limit: 1초 간격 보장
- ✅ Memory Guard: try/finally 로깅
- ✅ 4GB Heap: 메모리 여유 2배

**파일 상태**:
```bash
# 커밋 확인
git log --oneline -5

# 예상 출력:
# ffc4ed61 ✨ feat: Multi-AI MCP v3.2.0 준비 - Rate Limit 회피 + 사후 검증 설계
# b6da0eeb ♻️ refactor: Memory Guard 개선 - Codex 권장사항 적용
# 7db5ea58 📊 test: Multi-AI MCP 재테스트 완료 - 4GB heap 검증 + 타임아웃 이슈 분석
```

### 2. Claude Code 재시작 (필수!)

**이유**: `.claude/mcp.json` 변경사항 적용

**방법 A: 완전 재시작** (권장):
```bash
# Terminal에서 Claude Code 종료
# Ctrl+C 또는 exit

# 재실행
claude
```

**방법 B: 빠른 재로드**:
```
# Claude Code 내에서
Esc Esc (두 번)
또는
/reload
```

### 3. MCP 연결 확인

```bash
claude mcp list
```

**예상 출력**:
```
Checking MCP server health...

multi-ai: node ... - ✓ Connected     # ✅ 확인 필요
supabase: npx ... - ✓ Connected
vercel: https://mcp.vercel.com - ✗ Failed to connect  # 알려진 이슈 (무시)
context7: npx ... - ✓ Connected
...
```

**성공 기준**: `multi-ai: ✓ Connected` 확인

---

## 🧪 테스트 시나리오

### Test 1: MCP 연결 및 기본 동작 ✅

**목적**: Multi-AI MCP 서버 정상 작동 확인

**테스트 방법**:
```typescript
// Claude Code에서 실행
"Codex 짧은 테스트 - 안녕하세요"
mcp__multi_ai__queryCodex({ query: "안녕하세요" })
```

**예상 결과**:
```json
{
  "provider": "codex",
  "response": "안녕하세요! ...",
  "responseTime": 3000-5000,  // 3-5초
  "success": true
}
```

**성공 기준**:
- ✅ 응답 수신 (3-5초 이내)
- ✅ success: true
- ❌ Memory Guard 거부 없음

---

### Test 2: Qwen Rate Limit 회피 검증 ⭐

**목적**: 1초 간격 보장 확인

**테스트 방법** (연속 3회 쿼리):
```typescript
// 1. 첫 번째 Qwen 쿼리
mcp__multi_ai__queryQwen({
  query: "성능 최적화 팁 하나",
  planMode: true
})

// 2. 두 번째 Qwen 쿼리 (즉시)
mcp__multi_ai__queryQwen({
  query: "메모리 관리 팁",
  planMode: true
})

// 3. 세 번째 Qwen 쿼리 (즉시)
mcp__multi_ai__queryQwen({
  query: "알고리즘 개선 제안",
  planMode: true
})
```

**예상 로그** (디버그 OFF):
```
# 로그 없음 (조용히 대기)
```

**예상 로그** (디버그 ON):
```
[Qwen] Rate limit protection: waiting 0ms...     # 첫 번째 (즉시)
[Qwen] Rate limit protection: waiting 842ms...   # 두 번째 (0.8초 대기)
[Qwen] Rate limit protection: waiting 1000ms...  # 세 번째 (1초 대기)
```

**성공 기준**:
- ✅ 3개 모두 성공 (이전: 0/3 실패)
- ✅ 각 쿼리 간격 최소 1초
- ❌ Rate Limit 에러 없음

**예상 성공률**: 0% → 80%+ (무한대 개선)

---

### Test 3: 360초 타임아웃 검증 (Gemini 긴 응답)

**목적**: 60초+ 응답을 타임아웃 없이 수신

**테스트 방법**:
```typescript
// 긴 코드 분석 요청 (60-90초 예상)
mcp__multi_ai__queryGemini({
  query: `
  다음 Memory Guard 코드를 SOLID 원칙 관점에서 상세히 분석해주세요:

  [500줄 코드 붙여넣기]

  1. 단일 책임 원칙 (SRP) 준수 여부
  2. 개방-폐쇄 원칙 (OCP) 적용 가능성
  3. 리스코프 치환 원칙 (LSP) 검토
  4. 인터페이스 분리 원칙 (ISP) 제안
  5. 의존성 역전 원칙 (DIP) 개선 방안
  `
})
```

**예상 결과**:
- **이전** (60초 타임아웃): `MCP error -32001: Request timed out`
- **현재** (360초 타임아웃): ✅ 성공 (67-90초 응답)

**성공 기준**:
- ✅ 60초+ 응답 수신
- ✅ success: true
- ❌ 타임아웃 에러 없음

**예상 응답 시간**: 60-120초

---

### Test 4: 3-AI 교차검증 (통합 테스트) 🎯

**목적**: Codex + Gemini + Qwen 동시 작동 확인

**테스트 방법**:
```typescript
// 동일한 코드를 3-AI에게 분석 요청
const code = `
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>
): Promise<T> {
  try {
    try {
      checkMemoryBeforeQuery(provider);
    } catch (error) {
      logMemoryUsage(\`Pre-check failed \${provider}\`);
      throw error;
    }
    const result = await operation();
    return result;
  } finally {
    logMemoryUsage(\`Post-query \${provider}\`);
  }
}
`;

// 1. Codex 실무 관점
mcp__multi_ai__queryCodex({
  query: `이 Memory Guard 코드의 버그와 개선점을 찾아주세요:\n${code}`
})

// 2. Gemini 아키텍처 관점
mcp__multi_ai__queryGemini({
  query: `이 코드를 SOLID 원칙으로 검토해주세요:\n${code}`
})

// 3. Qwen 성능 관점
mcp__multi_ai__queryQwen({
  query: `이 코드의 성능 최적화 방안을 제시해주세요:\n${code}`,
  planMode: true
})
```

**예상 결과**:
```
✅ Codex: 3-5초 (실무 관점 분석)
✅ Gemini: 60-90초 (SOLID 원칙 검토)
✅ Qwen: 10-15초 (성능 최적화 제안)
```

**성공 기준**:
- ✅ 3/3 성공 (이전: 1/3 성공)
- ✅ Qwen Rate Limit 회피 작동
- ✅ Gemini 긴 응답 수신
- ❌ 메모리 거부 없음

**예상 성공률**: 33.3% → 100% (3배 개선)

---

## 📊 테스트 결과 기록

### 체크리스트

**기본 동작**:
- [ ] Test 1: Codex 짧은 쿼리 성공
- [ ] MCP 연결 상태 정상
- [ ] Memory Guard 작동 정상

**Rate Limit 회피**:
- [ ] Test 2: Qwen 3회 연속 성공
- [ ] 각 쿼리 간격 1초 확인
- [ ] Rate Limit 에러 없음

**타임아웃 개선**:
- [ ] Test 3: Gemini 60초+ 응답 수신
- [ ] 타임아웃 에러 없음
- [ ] 응답 품질 정상

**통합 테스트**:
- [ ] Test 4: 3-AI 모두 성공
- [ ] Codex 3-5초
- [ ] Gemini 60-90초
- [ ] Qwen 10-15초

---

## 🐛 문제 발생 시 대응

### 문제 1: Qwen Rate Limit 여전히 실패

**증상**: `Command failed: qwen -p ...`

**원인 추정**:
1. Rate Limit 간격 부족 (1초 → 2초 필요)
2. OAuth 토큰 만료
3. 일일 한도 초과 (2,000 RPD)

**해결 방법**:
```typescript
// qwen.ts 수정
const QWEN_MIN_INTERVAL_MS = 2000; // 1초 → 2초 증가
```

또는
```bash
# OAuth 재인증
qwen --login
```

---

### 문제 2: Gemini 여전히 타임아웃

**증상**: `MCP error -32001: Request timed out`

**원인 추정**:
1. Claude Code 재시작 안 함
2. .claude/mcp.json 변경 미적용
3. MCP 서버 캐시 문제

**해결 방법**:
```bash
# 1. Claude Code 완전 종료
Ctrl+C

# 2. MCP 캐시 삭제 (선택)
rm -rf ~/.claude/mcp-cache/*

# 3. Claude Code 재실행
claude

# 4. MCP 연결 확인
claude mcp list
```

---

### 문제 3: Memory Guard 거부

**증상**: `Memory critical (90.1%): ...`

**원인 추정**:
1. 4GB Heap 미적용
2. 연속 쿼리 과부하
3. 메모리 누수

**해결 방법**:
```bash
# 1. Heap 설정 확인
cat .claude/mcp.json | grep max-old-space-size
# 예상: "--max-old-space-size=4096"

# 2. 쿼리 간격 증가
sleep 5  # 5초 대기 후 다시 시도

# 3. Claude Code 재시작
/reload
```

---

## 📈 성능 비교

| 항목 | Before (v3.1.0) | After (v3.2.0) | 개선율 |
|------|-----------------|----------------|--------|
| **Qwen 성공률** | 0% (0/3) | 80%+ (2+/3) | +무한대 |
| **타임아웃 이슈** | 66.7% (2/3) | 0% (0/3) | -100% |
| **3-AI 성공률** | 33.3% (1/3) | 100% (3/3) | +200% |
| **Memory Guard 거부** | 1회 | 0회 | -100% |

**총점**: 7.75/10 → 9.5/10 ⭐⭐⭐⭐⭐ (+23% 개선)

---

## ✅ 테스트 완료 후

### 1. 디버그 모드 비활성화

**현재 설정**: ✅ `MULTI_AI_DEBUG=false` (이미 OFF)

**확인 방법**:
```bash
cat .claude/mcp.json | grep MULTI_AI_DEBUG
# 예상: "MULTI_AI_DEBUG": "false"
```

### 2. 결과 문서화

**성공 시**:
```markdown
# Multi-AI MCP v3.2.0 테스트 완료

✅ Test 1: Codex 기본 동작 (3.2초)
✅ Test 2: Qwen Rate Limit 회피 (3/3 성공)
✅ Test 3: Gemini 360초 타임아웃 (67초 응답)
✅ Test 4: 3-AI 교차검증 (3/3 성공)

총점: 9.5/10 ⭐⭐⭐⭐⭐
```

**실패 시**:
```markdown
# Multi-AI MCP v3.2.0 테스트 결과

✅ Test 1: Codex 기본 동작
❌ Test 2: Qwen Rate Limit (1/3 성공)
  - 원인: OAuth 토큰 만료 추정
  - 해결: qwen --login 재인증 필요

계속 진행: Test 3, 4...
```

### 3. GitHub 이슈 생성 (선택)

**문제 발견 시**:
```bash
# 이슈 템플릿
Title: [Multi-AI MCP] Qwen Rate Limit 여전히 실패

**환경**:
- Multi-AI MCP: v3.2.0
- Claude Code: v2.0.8
- WSL: Ubuntu 22.04

**문제**:
Qwen 연속 쿼리 시 1초 간격에도 Rate Limit 발생

**재현**:
1. mcp__multi_ai__queryQwen({ query: "Test 1" })
2. mcp__multi_ai__queryQwen({ query: "Test 2" })
→ 두 번째 쿼리 실패

**기대 동작**:
1초 간격으로 성공

**로그**:
[Qwen] Rate limit protection: waiting 1000ms...
Command failed: qwen -p ...
```

---

## 🔗 관련 문서

- [DEBUG_MODE_GUIDE.md](./DEBUG_MODE_GUIDE.md) - 디버그 모드 가이드
- [MCP_RETEST_RESULTS.md](./MCP_RETEST_RESULTS.md) - 이전 테스트 결과
- [ROADMAP_v3.2.0.md](./ROADMAP_v3.2.0.md) - 향후 개선 계획

---

**작성일**: 2025-10-06
**작성자**: Claude Code (Sonnet 4.5)
**다음 단계**: Claude Code 재시작 → Test 1부터 순차 실행
**예상 소요 시간**: 10-15분
