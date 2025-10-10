# Qwen 타임아웃 근본 원인 분석 - Meta-Analysis Decision Log

**날짜**: 2025-10-10
**버전**: v2.1.0 → v2.2.0
**방법**: 3-AI 메타 분석 (Qwen 문제를 Qwen에게 직접 분석시킴)

---

## 🎯 요약

**문제**: Qwen CLI가 복잡한 쿼리에서 300초(5분) 타임아웃 발생
**근본 원인**: Normal Mode가 비대화형 터미널에서 승인 입력 대기 상태로 블로킹
**해결책**: Plan Mode 복원 (`--approval-mode plan`)

---

## 📋 메타 분석 실험 설계

### 가설
- v2.1.0에서 Normal Mode 기본값으로 변경했지만 복잡한 쿼리는 여전히 타임아웃
- 타임아웃을 늘리면(10분) 해결될 수 있는가?

### 실험 설계
```bash
# 쿼리: "Qwen CLI 타임아웃 문제: 간단한 쿼리는 7-26초 성공, 
#        복잡한 쿼리는 300초 타임아웃. Normal Mode로 변경했지만 
#        여전히 타임아웃. 해결 방안은?"

# 병렬 실행
timeout 300 codex-wrapper.sh "$QUERY"  # 5분
timeout 300 gemini-wrapper.sh "$QUERY" # 5분
timeout 600 qwen-wrapper.sh "$QUERY"   # 10분 (2배)
```

### 목적
1. 3-AI의 독립적 진단 수집
2. Qwen이 자신의 문제를 10분 안에 분석할 수 있는가?
3. 근본 원인 파악

---

## 📊 실험 결과

| AI | 타임아웃 | 실행 시간 | 출력 크기 | 상태 | 비고 |
|---|---|---|---|---|---|
| **Codex** | 300s | **1m40s** | 26KB | ✅ 완료 | **근본 원인 발견** |
| **Gemini** | 300s | **30s** | 629B | ⚠️ API 에러 | 불완전 분석 |
| **Qwen** | 600s | **10m55s** | 180B | ❌ Exit 124 | **타임아웃으로 종료** |

### Qwen 출력 내용 (전체)
```
ℹ️  🚀 Qwen Wrapper v2.1.0 시작
ℹ️  ⚡ Qwen Normal Mode 실행 중 (타임아웃 300초 = 5분)...

real	10m55.704s
user	0m0.007s
sys	0m0.010s
```

**결론**: 10분 55초 동안 **아무 실제 출력도 없음** - 완전 블로킹 상태 확인

---

## 🔍 Codex의 근본 원인 진단 (결정적 발견)

### 문제 분석

```
Normal Mode (`qwen -p`)는 승인 대기(default approval) 상태가 됩니다:
- 복잡한 작업에서 "Approve? [y/N]" 입력을 기다림
- 터미널이 비대화형이라 입력이 전달되지 않음
- 프로세스가 멈춘 채 timeout으로 종료
```

### 증거

1. **로그 패턴**:
   - `logs/ai-perf/qwen-perf-2025-10-10.log` 분석
   - Line 15:28:00 시작 로그만 존재, 종료 로그 없음
   - Line 15:57:49 시작 로그만 존재, 종료 로그 없음

2. **이번 메타 분석**:
   - 10분 55초 실행
   - 출력: 180 bytes (시작 메시지만)
   - Exit code 124 (timeout killed)

### 왜 간단한 쿼리는 성공하는가?

Codex의 설명:
```
간단한 쿼리는 승인 없이 바로 실행 가능
→ 7-26초 성공

복잡한 쿼리는 승인 프롬프트 표시
→ 입력 대기 → 블로킹 → 타임아웃
```

---

## 🎯 해결 방안

### Codex 권장 순위

#### 1. **Plan Mode 복원 (최우선 권장)** ✅
```bash
qwen --approval-mode plan "복잡한 쿼리"
```

**장점**:
- 분석만 수행, 승인 불필요
- 복잡한 쿼리도 즉시 응답
- AI 교차검증 용도에 완벽

**구현**:
```bash
# qwen-wrapper.sh v2.2.0
execute_qwen() {
    local query="$1"
    # 기본값: Plan Mode (승인 불필요)
    timeout $TIMEOUT_SECONDS qwen --approval-mode plan "$query"
}
```

#### 2. **Auto-Edit Mode (실험적)**
```bash
qwen --approval-mode auto-edit "쿼리"
```

**장점**: 승인 없이 자동 실행
**단점**: 예기치 않은 파일 수정 위험

#### 3. **YOLO Mode (비권장)**
```bash
qwen --yolo "쿼리"
```

**장점**: 모든 승인 자동 처리
**단점**: 위험한 작업도 자동 승인 (매우 위험)

---

## 📈 v2.1.0 vs v2.2.0 비교

### v2.1.0 (실패한 시도)

**변경 내용**:
- Normal Mode 기본값 (`qwen -p`)
- 타임아웃 300초

**성과**:
- ✅ 간단한 쿼리: 7-26초 성공 (3-5배 빠름)
- ❌ 복잡한 쿼리: 300초+ 타임아웃 (근본 문제 미해결)

**문제점**:
- Normal Mode는 승인 대기로 블로킹
- 타임아웃을 10분으로 늘려도 해결 안 됨 (실험으로 확인)

### v2.2.0 (Codex 권장 적용)

**변경 내용**:
- `--approval-mode plan` 명시적 사용
- 300초 타임아웃 유지

**기대 효과**:
- ✅ 간단한 쿼리: 즉시 응답
- ✅ 복잡한 쿼리: 승인 불필요, 즉시 응답
- ✅ AI 교차검증 용도: 완벽

---

## 🚀 구현 계획

### Phase 1: qwen-wrapper.sh v2.2.0 (즉시)

```bash
#!/bin/bash
# Qwen CLI Wrapper - Plan Mode 복원
# 버전: 2.2.0
# 날짜: 2025-10-10
# 변경: --approval-mode plan 명시적 사용 (승인 대기 블로킹 해결)

execute_qwen() {
    local query="$1"
    
    log_info "⚙️  Qwen Plan Mode 실행 중 (타임아웃 ${TIMEOUT_SECONDS}초)..."
    
    # Plan Mode 명시: 승인 불필요, 분석만 수행
    local output
    output=$(timeout "$TIMEOUT_SECONDS" qwen --approval-mode plan "$query" 2>&1)
    local exit_code=$?
    
    # 나머지 로직 동일...
}
```

### Phase 2: 문서 업데이트

- [x] Decision Log 작성 (이 문서)
- [ ] CLAUDE.md 업데이트 (v2.2.0 반영)
- [ ] QWEN.md 업데이트 (Plan Mode 복원 설명)
- [ ] multi-ai-strategy.md 업데이트

### Phase 3: 검증 (1일 내)

- [ ] 간단한 쿼리 테스트
- [ ] 복잡한 쿼리 테스트 (승인 대기 없이 성공 확인)
- [ ] 3-AI 교차검증 테스트

---

## 🎓 교훈

### 성공한 접근: 메타 분석

**방법**: AI 시스템의 문제를 AI 자신에게 분석시킴
**성과**: 
- Codex가 코드 레벨 분석으로 근본 원인 발견
- 10분 Qwen 실험으로 완벽한 증거 확보

### 실패한 가설

1. **"Normal Mode가 Plan Mode보다 빠르다"**
   - ✅ 간단한 쿼리: 맞음 (3-5배 빠름)
   - ❌ 복잡한 쿼리: 틀림 (무한 블로킹)

2. **"타임아웃을 늘리면 해결된다"**
   - ❌ 10분까지 늘려도 해결 안 됨
   - 근본 원인: 시간 부족이 아니라 승인 대기 블로킹

### 올바른 진단

**근본 원인**: Mode 선택이 아니라 `approval-mode` 설정
**해결책**: `--approval-mode plan` 명시적 사용

---

## 🔗 관련 이슈

- [2025-10-10 Multi-AI Role Redefinition](2025-10-10-multi-ai-role-redefinition.md)
- `logs/ai-perf/qwen-perf-2025-10-10.log` (성능 로그)
- `QWEN.md` (Qwen CLI 설정)

---

## ✅ 최종 결정

### v2.2.0 구현 (승인)

```bash
# qwen-wrapper.sh 핵심 변경
qwen --approval-mode plan "$query"
```

**근거**:
1. Codex의 코드 레벨 분석으로 근본 원인 확인
2. 10분 메타 분석 실험으로 블로킹 증명
3. Plan Mode는 AI 교차검증 용도에 완벽히 적합

**구현**: 즉시 진행 → 테스트 → 문서 업데이트

---

**작성자**: Claude Code (Meta-Analysis Orchestrator)
**검토**: Codex (Root Cause Analyst)
**검증**: 10분 실험 (Exit 124 확인)
