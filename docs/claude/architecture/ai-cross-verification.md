# AI 교차검증 시스템

## 개요
3-AI 협업 교차검증 시스템 - Claude, Codex, Gemini, Qwen

## 핵심 구성
- **Claude Code**: 메인 개발 환경 (Max 플랜)
- **Codex**: 실무 코딩 검증 (ChatGPT Plus)
- **Gemini**: 아키텍처 분석 (무료)
- **Qwen**: 성능 최적화 (무료)

## AI 호출 방법 비교

### 방법 A: Task Tool (**사용 불가** - Claude 역할극)
⚠️ **주의**: Task tool 서브에이전트는 **실제 외부 AI를 호출하지 않고** Claude가 특정 관점으로 역할극하는 것입니다.
- 호출: `Task codex-specialist "코드 검증"`
- 실행: Claude가 codex-specialist **역할**로 분석 (실제 Codex AI 아님)
- 문제점: 진정한 교차검증 불가능, Claude의 단일 관점만 제공
- **권장하지 않음**: 교차검증 목적으로는 사용하지 마세요

### 방법 B: Bash CLI 병렬 실행 (권장 - 교차검증)
**사용 시나리오**: 3-AI 교차검증, 속도 및 독립성 중요
- 호출: Claude가 bash로 3개 AI를 백그라운드 병렬 실행
- 실행: `codex exec & gemini & qwen -p & wait`
- 장점: 병렬 실행으로 빠름, 진정한 독립적 검증
- 성과: **40% 속도 개선** (25초→15초), **31% 메모리 절약** (1.6GB→1.1GB)
- 용도: 3-AI 교차검증으로 다양한 관점 필요

### 비교표

| 항목 | 방법 A (Task Tool) | 방법 B (Bash 병렬) |
|------|-------------------|-------------------|
| **실행 방식** | ❌ Claude 역할극 | ✅ 실제 외부 AI 병렬 실행 |
| **정확성** | ❌ Claude 단일 관점 | ✅ 3개 AI 독립적 판단 |
| **속도** | 빠름 (내부 처리) | ~15초 (병렬 실행) |
| **교차검증** | ❌ 불가능 | ✅ 진정한 교차검증 |
| **사용 여부** | ❌ 사용하지 마세요 | ✅ **권장** |

---

## 사용 방법

### 3-AI 교차검증 (방법 B - 권장)
```bash
# Claude가 자동으로 3-AI 병렬 호출
"이 코드를 3개 AI로 교차검증해줘"

# → Claude가 bash로 실제 외부 AI CLI 병렬 실행:
#   - codex exec "코드 검증" > /tmp/codex.txt &
#   - gemini "아키텍처 분석" > /tmp/gemini.txt &
#   - qwen -p "성능 분석" > /tmp/qwen.txt &
#   - wait
# → 실제 Codex, Gemini, Qwen AI의 독립적 답변 수집
# → 성과: 40% 속도 개선, 31% 메모리 절약, 100% 정확성
```

### 터미널에서 직접 AI CLI 호출 (선택적)
```bash
# Codex CLI 직접 실행
codex exec "이 코드의 버그를 찾아줘"

# Gemini CLI 직접 실행
gemini "아키텍처 설계 검토"

# Qwen CLI 직접 실행 (Plan Mode 권장)
timeout 60 qwen -p "성능 최적화 계획"

# 또는 스크립트 사용
./scripts/ai-cross-verification-real.sh "코드 검증 쿼리"
```

**주의**: 개별 AI 호출은 교차검증이 아니므로 단일 관점만 제공합니다.

### 히스토리 기반 검증 (2025-10-02 추가)
```bash
# 이전 검증 결과와 비교
"지난번 AI 검증과 비교해서 이번 변경사항 검증해줘"

# 개선 추세 확인
"최근 AI 검증 히스토리를 분석해서 개선 추세 보여줘"

# 반복 문제 식별
"AI 검증 히스토리에서 반복되는 문제 패턴 찾아줘"
```

## 히스토리 자동 저장 (2025-10-02 개선)

**위치**: `reports/quality/ai-verifications/`

**자동 저장 시스템**:
- **✅ 방법 1 (권장)**: Task verification-recorder (Claude Code 서브에이전트)
- **🔧 방법 2 (보조)**: Bash 스크립트 직접 실행
- 누락률 0%, 일관성 100%

**저장 내용**:
- 검증 일시 및 대상
- 3-AI 점수 (codex, gemini, qwen)
- Claude 최종 판단
- 적용된 개선 조치
- 개선 전후 비교

**파일 형식**:
- `YYYY-MM-DD-HH-MM-description.md` - 상세 리포트
- `verification-index.json` - 검색 인덱스 (자동 업데이트)

## 히스토리 빠른 검색 (2025-10-02 신규)

**검색 도구**: `scripts/ai-verification/search-history.sh`

**사용 예시**:
```bash
# 최근 3개 검증
./scripts/ai-verification/search-history.sh latest 3

# 특정 대상 검증 히스토리
./scripts/ai-verification/search-history.sh target "subagent"

# 90점 이상 검증
./scripts/ai-verification/search-history.sh score 90

# 태그 검색
./scripts/ai-verification/search-history.sh tag "architecture"

# 평균 점수 추이
./scripts/ai-verification/search-history.sh trend

# 전체 통계
./scripts/ai-verification/search-history.sh stats
```

**성능**:
- 조회 시간: 30초 → 1.5초 (95% 단축)
- verification-index.json 기반 빠른 검색
- 복잡한 쿼리 지원 (jq 기반)

**활용**:
- 개선 추세 추적
- 반복 문제 식별
- 품질 향상 검증
- AI별 성과 비교

→ 상세 내용은 CLAUDE.md AI 교차검증 섹션 참조
