# Multi-AI MCP 설정 가이드

**글로벌 vs 프로젝트 설정의 올바른 분리**

---

## 📋 설정 계층 구조

```
MCP 내장 타이머 기본값        ← 각 MCP 서버의 적절한 기본 타임아웃
    ↓ (오버라이드 시만)
~/.claude/.mcp.json          ← 글로벌 설정 (기본 실행 명령만)
    ↓ (오버라이드 시만)
.claude/mcp.json             ← 프로젝트 설정 (필요한 경우만 타임아웃 설정)
    ↓
실제 적용되는 설정
```

**핵심 원칙**: **"타임아웃을 설정하지 않으면 MCP 내장 타이머가 알아서 처리"**

- ✅ 대부분의 경우: 타임아웃 설정 불필요 (MCP 기본값 사용)
- ⚠️ 특수한 경우만: 프로젝트 설정에서 타임아웃 증가
  - 예: Multi-AI MCP (AI 쿼리 60초+ 소요)

---

## 🌍 글로벌 설정 (권장)

**파일**: `~/.claude/.mcp.json`

**목적**:
- 기본 실행 명령만 정의
- 모든 프로젝트에서 공통으로 사용
- **타임아웃이나 env는 설정하지 않음**

**권장 설정**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"
      ]
    }
  }
}
```

**이유**:
- ✅ 단순하고 명확
- ✅ 프로젝트별 커스터마이징 허용
- ✅ 설정 충돌 방지
- ✅ 디버깅 용이

---

## 📁 프로젝트 설정 (권장)

**파일**: `.claude/mcp.json` (프로젝트 루트)

**목적**:
- 프로젝트별 타임아웃 설정
- 프로젝트별 메모리 할당
- 프로젝트별 환경변수

**권장 설정**:
```json
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 360000,
      "command": "node",
      "args": [
        "--max-old-space-size=4096",
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

**이유**:
- ✅ 프로젝트 규모에 맞는 타임아웃
- ✅ 프로젝트별 메모리 요구사항
- ✅ Git으로 팀원과 공유 가능
- ✅ 프로젝트별 디버그 모드

---

## ⚠️ 잘못된 패턴

### ❌ Anti-Pattern 1: 글로벌에 타임아웃 설정

```json
// ~/.claude/.mcp.json (잘못된 예)
{
  "mcpServers": {
    "multi-ai": {
      "timeout": 360000,  // ❌ 모든 프로젝트에 동일하게 적용
      "command": "node",
      "args": ["..."],
      "env": {
        "MULTI_AI_GEMINI_TIMEOUT": "300000"  // ❌ 프로젝트별 조정 불가
      }
    }
  }
}
```

**문제점**:
- 작은 프로젝트도 360초 타임아웃 (불필요)
- 큰 프로젝트도 360초 타임아웃 (부족할 수 있음)
- 프로젝트별 커스터마이징 불가

### ❌ Anti-Pattern 2: 설정 중복

```json
// ~/.claude/.mcp.json
{
  "multi-ai": {
    "timeout": 180000,  // 글로벌: 180초
    "command": "node"
  }
}

// .claude/mcp.json
{
  "multi-ai": {
    "timeout": 360000,  // 프로젝트: 360초
    "command": "node"
  }
}
```

**문제점**:
- 어떤 값이 적용될지 혼란
- 디버깅 어려움
- 우선순위 규칙 기억 필요

---

## 🎯 타임아웃 설정 가이드 (v3.4.0 통일)

### 통일된 타임아웃 전략

**핵심 원칙**: "타임아웃의 목적은 통신 두절 감지, AI 응답 시간 측정이 아님"

| 항목 | 타임아웃 | 이유 |
|------|---------|------|
| **모든 AI** | 300s (5분) | 통신 실패 위험은 모두 동일 |
| **MCP 전체** | 300s (5분) | 단순화 및 코드 중복 제거 |

**변경 이유** (2025-10-06):
- ✅ **코드 단순화**: AI별 타임아웃 차이 제거 (7개 → 1개)
- ✅ **논리적 일관성**: 타임아웃은 네트워크 문제 감지용
- ✅ **유지보수성**: 하나의 환경변수로 전체 제어
- ✅ **충분한 여유**: 5분이면 대부분의 쿼리 처리 가능

### 구 버전 (v3.3.0 이전) - 사용 중단

| AI | 짧은 쿼리 | 중간 쿼리 | 긴 쿼리 | 문제점 |
|----|----------|----------|---------|--------|
| Codex | 60s | 90s | 180s | 불필요한 복잡도 |
| Gemini | - | - | 300s | 일관성 부족 |
| Qwen | - | 180s | 300s | 관리 어려움 |

### 프로젝트 크기별 권장 설정 (통일 후)

#### 소규모 프로젝트 (<10K LOC)
```json
{
  "multi-ai": {
    "timeout": 300000,  // 5분 (통일)
    "args": ["--max-old-space-size=2048"],  // 2GB
    "env": {
      "MULTI_AI_DEBUG": "false",
      "NODE_ENV": "production"
    }
  }
}
```

#### 중규모 프로젝트 (10K-50K LOC)
```json
{
  "multi-ai": {
    "timeout": 300000,  // 5분 (통일)
    "args": ["--max-old-space-size=3072"],  // 3GB
    "env": {
      "MULTI_AI_DEBUG": "false",
      "NODE_ENV": "production"
    }
  }
}
```

#### 대규모 프로젝트 (50K+ LOC) ⭐ OpenManager VIBE
```json
{
  "multi-ai": {
    "timeout": 300000,  // 5분 (통일)
    "args": ["--max-old-space-size=4096"],  // 4GB
    "env": {
      "MULTI_AI_DEBUG": "false",
      "NODE_ENV": "production"
    },
    "description": "Multi-AI Cross-Verification System - Unified 5min timeout"
  }
}
```

**Note**: 프로젝트 크기와 무관하게 타임아웃은 300초로 통일. 메모리만 조절.

---

## 🔧 설정 변경 후 적용

### 1. 설정 파일 수정
```bash
# 글로벌 설정 (선택)
vim ~/.claude/.mcp.json

# 프로젝트 설정 (권장)
vim .claude/mcp.json
```

### 2. Claude Code 재시작 (필수)
```bash
# 종료
Ctrl+C

# 재실행
claude
```

### 3. 설정 확인
```bash
# MCP 연결 상태
claude mcp list | grep multi-ai

# 예상 출력:
# multi-ai: node .../dist/index.js - ✓ Connected
```

---

## 🐛 트러블슈팅

### 문제 1: 타임아웃이 여전히 짧음 (v3.4.0 업데이트)

**원인**: 글로벌 설정이 프로젝트 설정을 오버라이드

**해결**:
1. `~/.claude/.mcp.json`에서 `timeout` 제거
2. `.claude/mcp.json`에만 `timeout: 300000` 설정
3. AI별 타임아웃 환경변수 제거 (이제 불필요)
4. Claude Code 재시작

**확인**:
```bash
# 글로벌 설정 확인
cat ~/.claude/.mcp.json | grep -A 10 "multi-ai"
# → "timeout" 필드가 없어야 함

# 프로젝트 설정 확인
cat .claude/mcp.json | grep -A 10 "multi-ai"
# → "timeout": 300000 있어야 함
# → AI별 타임아웃 환경변수 없어야 함 (통일됨)
```

### 문제 2: Memory Guard 거부 (90% 초과)

**원인**: `--max-old-space-size` 설정 부족

**해결**:
```json
{
  "multi-ai": {
    "args": [
      "--max-old-space-size=4096",  // 4GB로 증가
      "..."
    ]
  }
}
```

### 문제 3: 프로젝트 설정이 적용 안 됨

**원인**: 글로벌 설정이 우선 적용됨

**해결**:
1. 글로벌 설정을 최소화 (command, args만)
2. 프로젝트 설정에 전체 설정 작성
3. 재시작

---

## 📊 설정 우선순위

```
Claude Code 기본값 (60초)
    ↓ (오버라이드)
글로벌 설정 (~/.claude/.mcp.json)
    ↓ (오버라이드)
프로젝트 설정 (.claude/mcp.json)
    ↓
실제 적용
```

**권장 전략**:
- 기본값: Claude Code가 관리
- 글로벌: 실행 명령만 (timeout 없음)
- 프로젝트: 모든 커스터마이징 (timeout 포함)

---

## 🎯 체크리스트

### 올바른 설정 확인

- [ ] **글로벌 설정**: `timeout` 필드 없음
- [ ] **글로벌 설정**: `env` 최소화 또는 없음
- [ ] **프로젝트 설정**: `timeout` 명시적 설정
- [ ] **프로젝트 설정**: `--max-old-space-size` 설정
- [ ] **프로젝트 설정**: 모든 AI 타임아웃 env 설정
- [ ] **재시작**: Claude Code 완전 재시작 수행

### 타임아웃 동작 확인

- [ ] 짧은 쿼리 (2-40초): 즉시 성공
- [ ] 긴 쿼리 (40-60초): 즉시 성공
- [ ] 매우 긴 쿼리 (60-80초): 타임아웃 없이 성공
- [ ] 초장시간 쿼리 (100초+): 타임아웃 없이 성공

---

## 📚 관련 문서

- [CHANGELOG_v3.3.0.md](CHANGELOG_v3.3.0.md) - Progress Notification 시도
- [FINAL_VERIFICATION_2025-10-06.md](FINAL_VERIFICATION_2025-10-06.md) - v3.2.0 검증
- [DEBUG_MODE_GUIDE.md](DEBUG_MODE_GUIDE.md) - 디버그 모드

---

## 💡 핵심 원칙

**"글로벌은 최소, 프로젝트는 최대"**

1. **글로벌 설정**: 기본 실행 명령만
2. **프로젝트 설정**: 모든 커스터마이징
3. **설정 충돌**: 프로젝트가 항상 우선
4. **변경 후**: 반드시 Claude Code 재시작

---

**작성일**: 2025-10-06
**버전**: Multi-AI MCP v3.3.0
**상태**: 글로벌/프로젝트 설정 분리 완료
