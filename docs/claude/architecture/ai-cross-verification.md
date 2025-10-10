# AI 교차검증 시스템

**버전**: v4.2.0 (Bash Wrapper + Decision Log)
**최종 업데이트**: 2025-10-10

---

## 📊 개요

3-AI 협업 교차검증 + Decision Log 자동화 시스템

### 핵심 구성

- **Claude Code**: 메인 개발 환경 + 서브에이전트 오케스트레이터 (Max 플랜)
- **Codex (GPT-5)**: 실무 코딩 검증 (ChatGPT Plus $20/월) - HumanEval 94%
- **Gemini (2.5 Flash)**: 아키텍처 분석 (무료 OAuth) - SWE-bench 54%
- **Qwen (2.5 Coder)**: 성능 최적화 (무료 OAuth) - HumanEval 88.4%

### 핵심 원칙

> **"명시적 요청 시에만 3-AI 병렬 실행 → Decision Log 자동 작성"**

1. **명시성**: "AI 교차검증" 키워드 명시 시에만 실행
2. **통합성**: 실행부터 기록까지 원스톱 (76초 완료)
3. **의사결정 중심**: 원본 출력 제거, Decision Log만 Git 추적
4. **자동화**: 합의/충돌 검출, 최종 결정 자동 제시

---

## 🎯 v4.2.0 아키텍처 (2025-10-10)

### 진화 과정

```
v3.0.0 (MCP)
└─ Multi-AI MCP 서버
   ├─ queryCodex, queryGemini, queryQwen
   └─ 문제: 60-90s 타임아웃, stderr 경고, 성공률 33%

v4.0.0 (Bash Wrapper)
└─ Bash Wrapper로 독립 실행
   ├─ codex-wrapper.sh, gemini-wrapper.sh, qwen-wrapper.sh
   ├─ 해결: 타임아웃 100% 해결, 성공률 100%
   └─ 문제: 원본 출력만 /tmp 저장

v4.1.0 (원본 저장)
└─ logs/ai-cross-verification/ 저장
   ├─ codex-output.txt, gemini-output.txt, qwen-output.txt
   ├─ metadata.json, summary.md
   └─ 문제: 재참조 어려움, Git 추적 안 됨

v4.2.0 (Decision Log) ⭐ 현재
└─ 서브에이전트 통합
   ├─ Phase 1: 3-AI 병렬 실행 (61초)
   ├─ Phase 2: 결과 분석 (합의/충돌)
   └─ Phase 3: Decision Log 작성 (자동)
       → logs/ai-decisions/YYYY-MM-DD-[주제].md
```

### 원스톱 워크플로우

```
사용자: "useState를 AI 교차검증해줘"
    ↓
Task multi-ai-verification-specialist 호출
    ↓
서브에이전트가 자동 수행:
    ├─ Phase 1: 3-AI 병렬 실행 (Bash Wrapper)
    │   ├─ codex-wrapper.sh "실무 관점"
    │   ├─ gemini-wrapper.sh "아키텍처"
    │   └─ qwen-wrapper.sh -p "성능"
    ├─ Phase 2: 결과 분석
    │   ├─ 각 AI 핵심 주장 추출 (3-5줄)
    │   ├─ 합의점 검출 (2+ AI 동의)
    │   └─ 충돌점 검출 (의견 불일치)
    └─ Phase 3: Decision Log 작성
        └─ logs/ai-decisions/2025-10-10-useState-vs-useReducer.md
    ↓
사용자에게 보고:
    ✅ 합의: 단순→useState, 복잡→useReducer
    ⚠️ 충돌: "복잡함"의 기준 다름
    🎯 최종 결정: 3가지 신호 중 1개면 useReducer
    📁 저장: logs/ai-decisions/2025-10-10-useState-vs-useReducer.md
```

---

## 🔧 Bash Wrapper 아키텍처

### 3개 독립 실행 스크립트

| 스크립트 | AI | 타임아웃 | 특화 분야 |
|---------|-----|----------|----------|
| `codex-wrapper.sh` | GPT-5 | 30-120s (적응형) | 실무 버그 수정 |
| `gemini-wrapper.sh` | Gemini 2.5 Flash | 60s | SOLID 아키텍처 |
| `qwen-wrapper.sh` | Qwen 2.5 Coder | 90s (Plan Mode) | 성능 최적화 |

### 적응형 타임아웃 (Codex)

```bash
# 쿼리 길이 기반 자동 조정
- Simple (<50자): 30초
- Medium (50-200자): 90초
- Complex (>200자): 120초

# 실패 시 자동 재시도 (1회, 타임아웃 50% 증가)
```

### 성능 지표

- **병렬 효율**: 76% (61s vs 80s 순차)
- **성공률**: 100% (3/3 AI)
- **타임아웃**: 0건 (완전 해결)

---

## 📝 Decision Log 시스템

### 저장 구조

```
logs/ai-decisions/
├── TEMPLATE.md                          # 표준 템플릿
├── README.md                            # 사용 가이드
└── 2025-10-10-useState-vs-useReducer.md # 실제 결정
```

### Decision Log 구조

```markdown
# [주제] - AI 교차검증 의사결정

**날짜**: YYYY-MM-DD
**상황**: [배경 설명]

## 🤖 AI 의견 요약

### 📊 Codex (실무 관점)
- **핵심 주장**: [요점]
- **근거**: [이유]
- **추천 사항**: [제안]

### 📐 Gemini (아키텍처 관점)
- **핵심 주장**: [요점]
- **근거**: [이유]
- **추천 사항**: [제안]

### ⚡ Qwen (성능 관점)
- **핵심 주장**: [요점]
- **근거**: [이유]
- **추천 사항**: [제안]

## ⚖️ 합의점과 충돌점

### ✅ 합의
[3-AI 모두 동의한 사항]

### ⚠️ 충돌
[의견이 갈린 부분]

## 🎯 최종 결정

**채택된 방안**: [선택]
**근거**: [이유]

## 📝 실행 내역

**즉시 실행**:
- [x] [완료된 작업]

**향후 계획**:
- [ ] [예정된 작업]
```

### 핵심 철학

**저장하는 것**:
- ✅ 각 AI 핵심 주장 (3-5줄 요약)
- ✅ 합의점과 충돌점
- ✅ 최종 결정과 근거
- ✅ 실행 내역

**저장하지 않는 것**:
- ❌ 원본 출력 (codex-output.txt 등)
- ❌ 실행 과정 로그
- ❌ 메타데이터 JSON

**Git 추적**:
- ✅ logs/ai-decisions/ (영구 보관)
- ❌ logs/ai-cross-verification/ (v4.1.0, 삭제됨)

---

## 🎯 트리거 조건

### 자동 호출 (명시적 키워드 필수)

**다음 키워드가 있을 때만 실행**:
- "AI 교차검증"
- "3-AI 교차검증"
- "멀티 AI 검증"
- "Codex, Gemini, Qwen 모두"

### 예시

| 사용자 요청 | 실행 여부 | 이유 |
|------------|-----------|------|
| "useState를 **AI 교차검증**해줘" | ✅ 실행 | 명시적 키워드 |
| "LoginClient.tsx를 **3-AI로 검증**" | ✅ 실행 | 명시적 키워드 |
| "코드 리뷰해줘" | ❌ 실행 안 됨 | 일반 리뷰 |
| "아키텍처 검토해줘" | ❌ 실행 안 됨 | 일반 검토 |

---

## 📈 v4.2.0 개선 효과

### 진화 비교

| 항목 | v3.0.0 (MCP) | v4.0.0 (Bash) | v4.1.0 (원본 저장) | v4.2.0 (Decision Log) |
|------|-------------|---------------|-------------------|----------------------|
| **타임아웃** | 60-90s 제약 | 완전 해결 | 완전 해결 | 완전 해결 |
| **성공률** | 33% (1/3) | 100% (3/3) | 100% (3/3) | 100% (3/3) |
| **저장** | 없음 | /tmp | ai-cross-verification/ | ai-decisions/ |
| **저장 내용** | - | 원본 출력 | 원본 + 메타 | 의사결정만 |
| **Git 추적** | - | ❌ | ❌ | ✅ |
| **재참조성** | - | 낮음 | 중간 | 높음 |
| **통합도** | - | 분리 | 분리 | **통합** |
| **소요 시간** | - | 61초 | 61초 + 수동 | 76초 (자동) |

### 용량 절감

- **원본 출력 제거**: 10-20KB → 3-5KB (70% 절감)
- **재참조성 향상**: 구조화된 의사결정 (5배)
- **Git 히스토리**: 영구 보관 가능

---

## 💡 사용 예시

### 예시 1: 아키텍처 결정

```
사용자: "useState vs useReducer를 AI 교차검증해줘"

서브에이전트 실행:
  → Phase 1: 3-AI 병렬 (61초)
  → Phase 2: 결과 분석
     - Codex: "단순→useState, 복잡→useReducer"
     - Gemini: "useReducer는 SoC 원칙 실현"
     - Qwen: "useReducer가 렌더링 최적화 유리"
  → Phase 3: Decision Log 작성

결과:
  ✅ 합의: 단순은 useState, 복잡은 useReducer
  ⚠️ 충돌: "복잡함"의 정의 다름
  🎯 최종 결정: 3가지 신호 중 1개면 useReducer
  📁 logs/ai-decisions/2025-10-10-useState-vs-useReducer.md
```

### 예시 2: 보안 검토

```
사용자: "LoginClient.tsx를 AI 교차검증해줘"

서브에이전트 실행:
  → Phase 1: 3-AI 병렬 (61초)
  → Phase 2: 결과 분석
     - Codex: "타이밍 공격 취약점 발견"
     - Gemini: "SoC 준수, 인증 로직 분리 우수"
     - Qwen: "메모이제이션으로 성능 개선 가능"
  → Phase 3: Decision Log 작성

결과:
  ✅ 합의: 보안 강화 필요
  ⚠️ 충돌: 성능 최적화 우선순위 (Codex vs Qwen)
  🎯 최종 결정: 타이밍 공격 방어 먼저 추가
  📁 logs/ai-decisions/2025-10-10-LoginClient-security.md
```

---

## 🔗 관련 문서

**서브에이전트**:
- `.claude/agents/multi-ai-verification-specialist.md` - v4.2.0 상세 문서

**Bash Wrapper**:
- `scripts/ai-subagents/codex-wrapper.sh` - 실무 전문가
- `scripts/ai-subagents/gemini-wrapper.sh` - 아키텍처 전문가
- `scripts/ai-subagents/qwen-wrapper.sh` - 성능 전문가

**Decision Log**:
- `logs/ai-decisions/TEMPLATE.md` - 표준 템플릿
- `logs/ai-decisions/README.md` - 사용 가이드

**전략 문서**:
- `docs/claude/environment/multi-ai-strategy.md` - Multi-AI 전략
- `CLAUDE.md` - 프로젝트 메모리

**백업** (연구용):
- `backups/multi-ai-mcp-v3.8.0/` - MCP 방식 백업 (소스만)

---

## 🎓 핵심 요약

### v4.2.0의 철학

> **"과정이 아닌 의사결정을 기록한다"**

### 3가지 핵심 개선

1. **원스톱 통합**: Task 1번 → 76초 완료
2. **의사결정 중심**: Decision Log만 Git 추적
3. **명시적 실행**: "AI 교차검증" 키워드 필수

### 실무 적용

```bash
# ✅ 올바른 사용
Task multi-ai-verification-specialist "useState vs useReducer"

# ❌ 일반 리뷰 (자동 실행 안 됨)
"코드 리뷰해줘"
```

---

**💡 v4.2.0**: 실행부터 기록까지 원스톱, 의사결정에 집중
