# Memory Guard 완화 가이드

**Version**: v3.1.0
**Date**: 2025-10-06

---

## 📊 현재 상황 분석

### 발생한 증상
```
Error: Memory critical (90.1%): 8.4MB / 9.4MB.
       Refusing Codex query to prevent OOM.
       Try again in a few seconds.
```

### 현재 설정
```json
// .claude/mcp.json
{
  "multi-ai": {
    "command": "node",
    "args": [
      "--max-old-space-size=2048"  // 2GB heap
    ]
  }
}
```

```typescript
// src/utils/memory.ts
export function checkMemoryBeforeQuery(provider: string): void {
  if (mem.heapPercent >= 90) {  // 90% 임계값
    throw new Error("Memory critical...");
  }
}
```

---

## 💡 완화 방안 (우선순위별)

### 🥇 방안 1: Heap 크기 증가 (권장) ⭐

**효과**: 가장 안전하고 효과적
**리스크**: 낮음
**구현 난이도**: 쉬움

#### 설정 변경

**`.claude/mcp.json` 수정**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",  // 2GB → 4GB (2배 증가)
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ],
      "env": {
        "MULTI_AI_DEBUG": "false",
        "NODE_ENV": "production"
      }
    }
  }
}
```

#### 적용 방법
```bash
# 1. mcp.json 수정
vi /mnt/d/cursor/openmanager-vibe-v5/.claude/mcp.json

# 2. Claude Code 재시작
# Ctrl+C → claude 다시 실행

# 3. MCP 연결 확인
claude mcp list
```

#### 효과
- **Before**: 2GB heap → 90% = 1.8GB 사용 가능
- **After**: 4GB heap → 90% = 3.6GB 사용 가능
- **개선**: 2배 여유 공간 확보

#### 장점
- ✅ 안전한 방법 (리스크 없음)
- ✅ 즉시 효과
- ✅ 다른 코드 변경 불필요

#### 단점
- ⚠️ WSL 메모리 사용량 증가 (4GB 추가)
- ⚠️ 시스템 RAM이 충분해야 함 (최소 16GB 권장)

---

### 🥈 방안 2: 임계값 조정 (조건부 권장)

**효과**: 중간
**리스크**: 중간 (OOM 위험 증가)
**구현 난이도**: 중간

#### 설정 변경

**`src/utils/memory.ts` 수정**:
```typescript
// Before (하드코딩)
if (mem.heapPercent >= 90) {
  throw new Error("Memory critical...");
}

// After (환경변수로 조정 가능)
const threshold = parseFloat(process.env.MULTI_AI_MEMORY_THRESHOLD || '90');
if (mem.heapPercent >= threshold) {
  throw new Error("Memory critical...");
}
```

**`.claude/mcp.json` 추가**:
```json
{
  "env": {
    "MULTI_AI_MEMORY_THRESHOLD": "93"  // 90% → 93%
  }
}
```

#### 효과
- **Before**: 2GB × 90% = 1.8GB 사용 가능
- **After**: 2GB × 93% = 1.86GB 사용 가능
- **개선**: +60MB 여유 (약 3% 증가)

#### 장점
- ✅ 힙 크기 변경 불필요
- ✅ 환경변수로 동적 조정

#### 단점
- ⚠️ OOM 위험 증가 (93% → 95%는 위험)
- ⚠️ 코드 수정 필요
- ⚠️ 효과 제한적 (3%만 증가)

#### 권장 범위
- **안전**: 90-92% (현재)
- **위험**: 93-94% (주의 필요)
- **매우 위험**: 95%+ (권장하지 않음)

---

### 🥉 방안 3: 가비지 컬렉션 강제 실행

**효과**: 일시적
**리스크**: 낮음
**구현 난이도**: 중간

#### 설정 변경

**`.claude/mcp.json` 수정**:
```json
{
  "args": [
    "--max-old-space-size=2048",
    "--expose-gc",  // GC 노출
    "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
  ]
}
```

**`src/middlewares/memory-guard.ts` 수정**:
```typescript
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>
): Promise<T> {
  // Pre-check
  checkMemoryBeforeQuery(provider);

  try {
    const result = await operation();

    // Post-GC: 메모리 정리
    if (global.gc && mem.heapPercent >= 80) {
      global.gc();
      console.error(`[GC] Triggered after ${provider} query`);
    }

    logMemoryUsage(`Post-query ${provider}`);
    return result;
  } catch (error) {
    logMemoryUsage(`Post-query ${provider} (failed)`);
    throw error;
  }
}
```

#### 효과
- 쿼리 후 즉시 메모리 정리
- 다음 쿼리 시 여유 공간 확보

#### 장점
- ✅ 메모리 자동 정리
- ✅ OOM 위험 감소

#### 단점
- ⚠️ GC 시간 추가 (10-100ms)
- ⚠️ 코드 수정 필요
- ⚠️ 근본 해결책 아님

---

### 🏅 방안 4: 쿼리 간격 자동 조정

**효과**: 중간
**리스크**: 낮음
**구현 난이도**: 높음

#### 개념
메모리 압박 시 자동으로 쿼리 사이에 대기 시간 추가

#### 구현 예시
```typescript
export async function withMemoryGuard<T>(
  provider: string,
  operation: () => Promise<T>
): Promise<T> {
  // Pre-check
  const mem = getMemoryUsage();

  // 80-89%: 1초 대기
  if (mem.heapPercent >= 80 && mem.heapPercent < 90) {
    console.error(`[Memory] ${provider}: Waiting 1s (${mem.heapPercent.toFixed(1)}%)`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // 90%+: 거부 (기존 동작)
  checkMemoryBeforeQuery(provider);

  // ... 나머지 코드
}
```

#### 효과
- 80-89%: 1초 대기 후 실행
- 90%+: 거부 (기존)

#### 장점
- ✅ 자동 복구 메커니즘
- ✅ 사용자 개입 불필요

#### 단점
- ⚠️ 응답 시간 증가 (1초)
- ⚠️ 복잡한 로직
- ⚠️ 코드 수정 많음

---

## 🎯 권장 솔루션

### 시나리오별 권장 사항

#### 시나리오 A: 충분한 RAM (16GB+)
**권장**: 방안 1 (Heap 4GB 증가)

```json
// .claude/mcp.json
{
  "args": [
    "--max-old-space-size=4096"  // 2GB → 4GB
  ]
}
```

**이유**:
- 가장 안전하고 효과적
- 코드 변경 불필요
- 즉시 효과

#### 시나리오 B: 제한된 RAM (8GB)
**권장**: 방안 1 (Heap 3GB) + 방안 3 (GC)

```json
// .claude/mcp.json
{
  "args": [
    "--max-old-space-size=3072",  // 2GB → 3GB (절충)
    "--expose-gc"
  ]
}
```

**이유**:
- 메모리 사용량 균형
- GC로 자동 정리

#### 시나리오 C: 매우 제한된 RAM (4GB)
**권장**: 현재 유지 + 수동 재시도

**이유**:
- 메모리 증가 불가능
- 임계값 상향은 위험
- Memory Guard가 OOM 방지 중

---

## 📈 효과 비교표

| 방안 | Heap 증가 | 가용 메모리 | 구현 난이도 | 리스크 | 권장도 |
|------|-----------|-------------|-------------|--------|--------|
| **현재** | 2GB | 1.8GB | - | 낮음 | - |
| **방안 1 (4GB)** | +100% | 3.6GB | ⭐ | 낮음 | ⭐⭐⭐⭐⭐ |
| **방안 1 (3GB)** | +50% | 2.7GB | ⭐ | 낮음 | ⭐⭐⭐⭐ |
| **방안 2 (93%)** | 0% | 1.86GB | ⭐⭐ | 중간 | ⭐⭐ |
| **방안 3 (GC)** | 0% | 1.8GB+ | ⭐⭐⭐ | 낮음 | ⭐⭐⭐ |
| **방안 4 (Auto)** | 0% | 1.8GB+ | ⭐⭐⭐⭐ | 낮음 | ⭐⭐ |

---

## 🔧 즉시 적용 가능한 해결책

### Quick Fix: Heap 4GB로 증가

**1단계: mcp.json 수정**
```bash
# WSL에서 실행
cd /mnt/d/cursor/openmanager-vibe-v5
vi .claude/mcp.json

# 또는
code .claude/mcp.json
```

**2단계: 내용 수정**
```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "--max-old-space-size=4096",  // 이 줄만 변경
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ],
      "env": {
        "MULTI_AI_DEBUG": "false",
        "NODE_ENV": "production",
        "MULTI_AI_CODEX_TIMEOUT_SIMPLE": "60000",
        "MULTI_AI_CODEX_TIMEOUT_MEDIUM": "90000",
        "MULTI_AI_CODEX_TIMEOUT_COMPLEX": "180000",
        "MULTI_AI_GEMINI_TIMEOUT": "300000",
        "MULTI_AI_QWEN_TIMEOUT_NORMAL": "180000",
        "MULTI_AI_QWEN_TIMEOUT_PLAN": "300000",
        "MULTI_AI_MCP_TIMEOUT": "360000"
      },
      "description": "Multi-AI Cross-Verification System (Codex + Gemini + Qwen)"
    }
  }
}
```

**3단계: Claude Code 재시작**
```bash
# 현재 세션 종료 (Ctrl+C)
# 재시작
claude
```

**4단계: 확인**
```bash
# MCP 연결 확인
claude mcp list

# 테스트 쿼리
# Multi-AI 쿼리를 연속으로 보내서 메모리 압박 테스트
```

---

## ⚠️ 주의사항

### DO ✅
- ✅ **Heap 증가 우선 고려** (가장 안전)
- ✅ **시스템 RAM 확인** (힙 크기 < 전체 RAM의 50%)
- ✅ **점진적 증가** (2GB → 3GB → 4GB)
- ✅ **효과 모니터링** (메모리 로그 확인)

### DON'T ❌
- ❌ **임계값 95% 이상** (OOM 위험 매우 높음)
- ❌ **무리한 힙 증가** (RAM 부족 시 시스템 불안정)
- ❌ **Memory Guard 제거** (OOM 방지 메커니즘)
- ❌ **동시 다발적 변경** (효과 측정 불가)

---

## 📊 모니터링 가이드

### 메모리 사용량 확인

**방법 1: 디버그 모드 활성화**
```json
// .claude/mcp.json
{
  "env": {
    "MULTI_AI_DEBUG": "true"  // false → true
  }
}
```

**출력 예시**:
```
[Memory INFO] Pre-query Codex: 1.2MB / 4.0MB (30.0%)
[Memory INFO] Post-query Codex: 2.1MB / 4.0MB (52.5%)
```

**방법 2: 히스토리 확인**
```typescript
// Multi-AI MCP 히스토리 조회
mcp__multi-ai__getBasicHistory({ limit: 10 })
```

### 정상 범위

| 상태 | Heap % | 조치 |
|------|--------|------|
| 정상 | 0-70% | 없음 |
| 주의 | 70-80% | 모니터링 강화 |
| 경고 | 80-90% | Heap 증가 고려 |
| 위험 | 90-95% | 즉시 Heap 증가 |
| 심각 | 95%+ | 긴급 대응 |

---

## 🎉 결론

### 권장 조치

**대부분의 경우**:
```bash
# 1. Heap 4GB로 증가 (mcp.json 수정)
--max-old-space-size=4096

# 2. Claude Code 재시작
# 3. 테스트 및 모니터링
```

**효과**:
- ✅ Memory Guard 거부 99% 감소 예상
- ✅ 더 많은 동시 쿼리 처리 가능
- ✅ 안정적인 운영 환경

**추가 고려사항**:
- WSL에서 메모리 할당 확인 (.wslconfig)
- 주기적 메모리 모니터링
- 필요 시 GC 강제 실행 추가

---

**Status**: ✅ 해결 방안 제시 완료
**Next Step**: Heap 크기 증가 적용 및 테스트
