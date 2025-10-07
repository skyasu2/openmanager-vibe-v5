# Multi-AI MCP 타임아웃 근본 원인 분석

**작성일**: 2025-10-07
**버전**: v3.5.1

---

## 🔍 문제 현상

### 관찰된 에러
```
Error: MCP error -32001: Request timed out
```

### 재현 환경
- Codex: ✅ 성공 (11.9초, 3,400 토큰)
- Gemini: ❌ 타임아웃 (300초 초과)
- Qwen: ❌ OOM (32초, JavaScript heap out of memory)

---

## 📊 표면적 원인

### 1. 하드코딩된 타임아웃
**위치**: `packages/multi-ai-mcp/src/config.ts`

```typescript
// Line 7: 문서 주석
MULTI_AI_TIMEOUT: default 300s (5분)

// Line 112, 119, 126: Codex
300000 → 600000 (300초 → 600초)

// Line 135, 142, 149: Gemini
300000 → 600000 (300초 → 600초)

// Line 164, 171, 178: Qwen
300000 → 600000 (300초 → 600초)

// Line 187: MCP requestTimeout
300000 → 600000 (300초 → 600초)
```

### 2. 모든 AI가 동일한 타임아웃 사용
- 구조상 simple/medium/complex가 구분되어 있음
- 하지만 모두 동일한 `MULTI_AI_TIMEOUT` 환경변수 사용
- AI별 특성을 고려하지 않음

---

## 🎯 근본 원인 분석

### Gemini 타임아웃 근본 원인

#### 1. API 응답 속도 차이
```
Codex:  11.9초 (빠름)
Gemini: 300초+ (느림, 25배 차이)
```

**원인**:
- Gemini 2.5 Pro: 고품질 분석 → 느린 응답
- 복잡한 아키텍처 분석 요청
- OAuth 무료 티어 제한 가능성

#### 2. 쿼리 복잡도
```typescript
// 현재 쿼리 (585자)
- 현재 상황 설명
- 개선 완료 내역
- 5개 질문 (SOLID/아키텍처)
```

**문제점**:
- 너무 많은 컨텍스트
- 다중 질문 (5개)
- 구조적 분석 요구

#### 3. 네트워크/인프라
- WSL 환경 DNS 문제 가능성
- OAuth 토큰 갱신 지연
- API rate limiting

### Qwen OOM 근본 원인

#### 1. Qwen CLI 메모리 관리 문제
```
FATAL ERROR: Reached heap limit Allocation failed
JavaScript heap out of memory
```

**스택 트레이스 분석**:
```
v8::String::NewFromUtf8 → node::StringDecoder::DecodeData
```

**근본 원인**:
- Qwen CLI가 응답을 전체 메모리에 버퍼링
- String decoding 중 힙 부족
- Multi-AI MCP의 512MB heap과 무관 (Qwen CLI 자체 프로세스)

#### 2. Qwen의 긴 응답
- Qwen은 상세한 분석 제공
- 코드 예시 포함
- 메모리에 전체 응답 적재 시도

---

## 🛠️ 해결 방안

### 1단계: 즉시 적용 (완료)

#### ✅ 타임아웃 600초로 증가
```typescript
// config.ts
300000 → 600000 (5분 → 10분)
```

**효과**:
- Gemini 분석 완료 가능
- Codex/Qwen에는 무영향 (더 짧은 시간에 완료)

**한계**:
- 근본적 해결 아님
- 여전히 복잡한 쿼리는 실패 가능

### 2단계: 쿼리 최적화 (권장)

#### Before (585자)
```
테스트 인증 전략 분석 - 아키텍처 관점

**현재 상황**:
... (긴 설명)

**개선 완료**:
... (4개 항목)

**질문** (SOLID/아키텍처):
1. SRP/OCP 원칙 관점 문제?
2. 설계 개선 방안?
3. 테스트 전략 Best Practice?
4. 보안 아키텍처 개선?
5. 최종 권장 구조?
```

#### After (200자, 66% 감소)
```
테스트 인증 전략: Dual-mode (Password + Bypass)

**핵심**:
- 로컬: Bypass (빠름)
- 프로덕션: Password (보안)

**질문**:
1. SRP 위반 여부?
2. 개선 방안?
```

**효과**:
- 응답 시간 50-70% 감소 예상
- 메모리 사용량 감소
- 더 명확한 답변

### 3단계: AI별 차등 전략

#### 권장 타임아웃
```typescript
// AI 특성별 최적값
Codex:  60초  (빠른 실무 분석)
Gemini: 600초 (깊은 아키텍처 분석)
Qwen:   120초 (중간, Plan Mode)
```

#### 구현 방안
```typescript
// 현재 (모두 동일)
codex.simple: MULTI_AI_TIMEOUT (600s)
gemini.simple: MULTI_AI_TIMEOUT (600s)
qwen.simple: MULTI_AI_TIMEOUT (600s)

// 개선 (AI별 환경변수)
codex.simple: MULTI_AI_CODEX_TIMEOUT || MULTI_AI_TIMEOUT (60s)
gemini.simple: MULTI_AI_GEMINI_TIMEOUT || MULTI_AI_TIMEOUT (600s)
qwen.simple: MULTI_AI_QWEN_TIMEOUT || MULTI_AI_TIMEOUT (120s)
```

### 4단계: Qwen 메모리 문제 우회

#### 옵션 A: Bash Wrapper 사용
```bash
# Qwen CLI를 별도 프로세스로 격리
./scripts/ai-subagents/qwen-wrapper.sh -p "쿼리"

# 효과:
- Multi-AI MCP와 메모리 격리
- 512MB heap 독립 사용
- OOM 시 MCP 영향 없음
```

#### 옵션 B: 더 짧은 쿼리
```typescript
// 200자 이하로 제한
query.length > 200 ? query.slice(0, 200) + "..." : query
```

#### 옵션 C: Streaming (장기)
```typescript
// Qwen CLI가 streaming 지원 시
// 전체 응답을 메모리에 적재하지 않음
// 점진적으로 처리
```

### 5단계: 장기 개선

#### 1. 쿼리 복잡도 자동 감지
```typescript
function detectComplexity(query: string): 'simple' | 'medium' | 'complex' {
  const length = query.length;
  const questions = (query.match(/\d+\./g) || []).length;

  if (length < 200 && questions <= 2) return 'simple';
  if (length < 500 && questions <= 5) return 'medium';
  return 'complex';
}
```

#### 2. Progressive Timeout
```typescript
// 시작은 짧게, 필요시 자동 증가
timeout = baseTimeout;
if (retry > 0) timeout *= 1.5;
if (complexity === 'complex') timeout *= 2;
```

#### 3. Streaming 지원
```typescript
// 큰 응답을 점진적으로 처리
// 메모리 압박 감소
// 부분 결과 즉시 반환
```

---

## 📈 기대 효과

### 즉시 효과 (1단계)
- ✅ Gemini 타임아웃 해결
- ✅ 복잡한 분석 완료 가능

### 단기 효과 (2-3단계)
- 🎯 쿼리 최적화: 응답 시간 50-70% 감소
- 🎯 AI별 최적화: 효율성 30-50% 향상
- 🎯 Qwen 안정성: OOM 회피

### 장기 효과 (4-5단계)
- 🚀 자동 최적화: 사용자 개입 불필요
- 🚀 리소스 효율: 메모리/시간 최적 사용
- 🚀 확장성: 더 많은 AI 추가 가능

---

## ✅ 적용 현황

### 완료
- [x] 타임아웃 600초 증가 (config.ts)
- [x] 문서화 (TIMEOUT_ANALYSIS.md)

### 권장
- [ ] 쿼리 최적화 (다음 교차검증 시)
- [ ] AI별 환경변수 추가 (장기)
- [ ] Qwen Bash wrapper 우선 사용

---

## 🔗 관련 이슈

- Multi-AI MCP v3.5.0: 메모리 512MB 증가 (완료)
- CLAUDE.md: 타임아웃 문서화 필요
- Multi-AI 전략: 쿼리 최적화 가이드 추가

---

**결론**: 타임아웃 증가는 **임시 해결책**입니다. 근본적으로는 **쿼리 최적화**와 **AI별 차등 전략**이 필요합니다.
