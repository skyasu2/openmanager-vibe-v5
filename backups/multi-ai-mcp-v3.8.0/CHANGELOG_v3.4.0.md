# Multi-AI MCP v3.4.0 Changelog

**Release Date**: 2025-10-06
**Theme**: Unified Timeout Simplification

---

## 🎯 핵심 변경사항

### 타임아웃 통일 (300초)

**문제**:
- AI별 타임아웃 차이 (60s/90s/180s/300s/360s)
- 7개의 환경변수로 복잡한 관리
- 불필요한 코드 중복

**해결**:
```typescript
// Before (v3.3.0)
MULTI_AI_CODEX_TIMEOUT_SIMPLE: 60000
MULTI_AI_CODEX_TIMEOUT_MEDIUM: 90000
MULTI_AI_CODEX_TIMEOUT_COMPLEX: 180000
MULTI_AI_GEMINI_TIMEOUT: 300000
MULTI_AI_QWEN_TIMEOUT_NORMAL: 180000
MULTI_AI_QWEN_TIMEOUT_PLAN: 300000
MULTI_AI_MCP_TIMEOUT: 360000

// After (v3.4.0)
MULTI_AI_TIMEOUT: 300000  // 모든 AI 통일
```

**이유**:
- ✅ **논리적 일관성**: 타임아웃은 통신 두절 감지용이지 AI 응답 시간 측정이 아님
- ✅ **코드 단순화**: 7개 → 1개 환경변수
- ✅ **유지보수성**: 하나의 설정으로 전체 제어
- ✅ **충분한 여유**: 5분이면 대부분의 쿼리 처리 가능

---

## 📝 변경 내역

### 1. 설정 파일 간소화

#### `.claude/mcp.json`
```diff
{
  "multi-ai": {
-   "timeout": 360000,
+   "timeout": 300000,
    "env": {
      "MULTI_AI_DEBUG": "false",
      "NODE_ENV": "production",
-     "MULTI_AI_CODEX_TIMEOUT_SIMPLE": "60000",
-     "MULTI_AI_CODEX_TIMEOUT_MEDIUM": "90000",
-     "MULTI_AI_CODEX_TIMEOUT_COMPLEX": "180000",
-     "MULTI_AI_GEMINI_TIMEOUT": "300000",
-     "MULTI_AI_QWEN_TIMEOUT_NORMAL": "180000",
-     "MULTI_AI_QWEN_TIMEOUT_PLAN": "300000",
-     "MULTI_AI_MCP_TIMEOUT": "360000"
    }
  }
}
```

**효과**: 13줄 → 6줄 (46% 감소)

### 2. Config 단순화

#### `src/config.ts`
```diff
- MULTI_AI_CODEX_TIMEOUT_SIMPLE: 기본값 90000
- MULTI_AI_CODEX_TIMEOUT_MEDIUM: 기본값 180000
- MULTI_AI_CODEX_TIMEOUT_COMPLEX: 기본값 300000
- MULTI_AI_GEMINI_TIMEOUT: 기본값 240000
- MULTI_AI_QWEN_TIMEOUT_NORMAL: 기본값 150000
- MULTI_AI_QWEN_TIMEOUT_PLAN: 기본값 240000
- MULTI_AI_MCP_TIMEOUT: 기본값 480000
+ MULTI_AI_TIMEOUT: 기본값 300000 (모두 통일)
```

**효과**:
- 7개 환경변수 → 1개
- 코드 중복 제거
- 일관된 동작

### 3. 문서 업데이트

#### `MCP_CONFIG_GUIDE.md`
- 통일된 타임아웃 전략 섹션 추가
- 구 버전 설정 사용 중단 명시
- 프로젝트 크기별 설정 예시 업데이트
- 트러블슈팅 가이드 개선

---

## 🔄 마이그레이션 가이드

### 기존 사용자 (v3.3.0 → v3.4.0)

#### 1. 프로젝트 설정 업데이트

```bash
# .claude/mcp.json 수정
vim .claude/mcp.json
```

**수정 내용**:
```json
{
  "multi-ai": {
    "timeout": 300000,  // 360000 → 300000
    "env": {
      "MULTI_AI_DEBUG": "false",
      "NODE_ENV": "production"
      // AI별 타임아웃 환경변수 모두 제거
    }
  }
}
```

#### 2. 빌드 및 재시작

```bash
cd packages/multi-ai-mcp
npm run build
```

```bash
# Claude Code 재시작
Ctrl+C
claude
```

#### 3. 확인

```bash
# 설정 확인
cat .claude/mcp.json | grep -A 10 "multi-ai"
# → "timeout": 300000
# → AI별 환경변수 없음

# MCP 연결 확인
# Multi-AI MCP Server v3.4.0 running on stdio
# Unified timeout: 300s (5min) for all AIs
```

---

## 📊 성능 영향

### 코드 복잡도

| 항목 | v3.3.0 | v3.4.0 | 개선 |
|------|--------|--------|------|
| 환경변수 수 | 7개 | 1개 | 86% 감소 |
| 설정 줄 수 | 13줄 | 6줄 | 54% 감소 |
| 코드 중복 | 있음 | 없음 | 100% 제거 |

### 기능 영향

- ✅ **기능성**: 동일 (모든 AI 정상 작동)
- ✅ **안정성**: 향상 (단순한 코드)
- ✅ **유지보수**: 향상 (하나의 설정)

---

## 🐛 알려진 이슈

### Claude Code 클라이언트 타임아웃 (60초)

**현상**:
- 서버는 300초 타임아웃
- 클라이언트는 ~60초에 타임아웃 경고 표시
- 서버는 백그라운드에서 계속 실행

**상태**:
- 기능적으로는 정상 작동 (히스토리에 성공 기록)
- UX 개선 필요 (클라이언트 타임아웃 증가)

**해결책** (진행 중):
- Claude Code 클라이언트 설정 조사
- Progress notification 개선 방안 연구

---

## 💡 주요 개선사항

### 1. 코드 가독성
```typescript
// Before
const timeout = getAdaptiveTimeout(complexity, config.codex);
// complexity에 따라 60s, 90s, 180s 중 선택

// After
const timeout = getAdaptiveTimeout(complexity, config.codex);
// complexity와 무관하게 항상 300s
```

### 2. 유지보수성
```bash
# Before: 7개 환경변수 관리
MULTI_AI_CODEX_TIMEOUT_SIMPLE=60000
MULTI_AI_CODEX_TIMEOUT_MEDIUM=90000
MULTI_AI_CODEX_TIMEOUT_COMPLEX=180000
...

# After: 1개 환경변수만 관리
MULTI_AI_TIMEOUT=300000
```

### 3. 논리적 일관성
```
타임아웃의 목적: 통신 두절 감지
→ 모든 AI가 동일한 네트워크 위험에 노출
→ 동일한 타임아웃 사용이 논리적
```

---

## 🔗 관련 문서

- [MCP_CONFIG_GUIDE.md](MCP_CONFIG_GUIDE.md) - 상세 설정 가이드
- [FINAL_VERIFICATION_2025-10-06.md](FINAL_VERIFICATION_2025-10-06.md) - v3.2.0 검증
- [CHANGELOG_v3.3.0.md](CHANGELOG_v3.3.0.md) - Progress Notification 시도

---

## 🎯 다음 단계

### v3.5.0 (예정)
- Claude Code 클라이언트 타임아웃 해결
- Progress notification 개선
- 추가 성능 최적화

---

**작성일**: 2025-10-06
**버전**: Multi-AI MCP v3.4.0
**상태**: 타임아웃 통일 완료 ✅
