# Multi-AI MCP 서버 설정 가이드

**버전**: v1.0.0
**날짜**: 2025-10-05

---

## 🚨 중요: Claude Code 설정 필수

**프로젝트 로컬 `.mcp.json`은 Claude Code에서 인식되지 않습니다!**

반드시 **글로벌 MCP 설정**에 추가해야 합니다.

---

## 📋 설정 방법

### 1단계: 빌드 완료 확인

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp

# 빌드 (이미 완료됨)
npm run build

# 빌드 파일 확인
ls -la dist/index.js
```

### 2단계: 글로벌 MCP 설정 추가

**파일**: `~/.claude/settings.json`

```json
{
  "mcpServers": {
    "multi-ai": {
      "command": "node",
      "args": ["/mnt/d/cursor/openmanager-vibe-v5/packages/multi-ai-mcp/dist/index.js"],
      "env": {}
    }
  }
}
```

**⚠️ 주의사항**:
- **절대 경로 사용 필수**: `/mnt/d/cursor/openmanager-vibe-v5/...`
- 프로젝트 이동 시 경로 업데이트 필요
- WSL 환경에서 경로 확인: `pwd`

### 3단계: Claude Code 재시작

```bash
# 현재 Claude Code 세션 종료 후 재시작
claude
```

### 4단계: MCP 연결 확인

Claude Code 내에서 테스트:

```
"Multi-AI MCP 서버가 연결되었나요?"
```

도구 사용 가능 확인:
- ✅ `mcp__multi_ai__queryAllAIs`
- ✅ `mcp__multi_ai__queryWithPriority`
- ✅ `mcp__multi_ai__getPerformanceStats`

---

## 🧪 테스트 쿼리

### 간단한 테스트

```
"Multi-AI MCP로 간단한 인사 테스트해줘"
```

### 코드 분석 테스트

```
"packages/multi-ai-mcp/src/synthesizer.ts 파일을 Multi-AI MCP로 분석해줘"
```

### 선택적 AI 테스트

```typescript
mcp__multi_ai__queryWithPriority({
  query: "TypeScript strict 모드 장점 3가지",
  includeCodex: true,
  includeGemini: true,
  includeQwen: false  // 성능 분석 제외
})
```

---

## 🔧 트러블슈팅

### 문제 1: 도구 인식 안 됨

**증상**: `No such tool available: mcp__multi_ai__queryAllAIs`

**해결**:
1. `~/.claude/settings.json` 경로 확인
2. 절대 경로 정확성 확인
3. Claude Code 재시작

### 문제 2: "Server error" 메시지

**증상**: MCP 서버 실행 중 에러

**해결**:
```bash
# dist/ 폴더 재생성
cd packages/multi-ai-mcp
rm -rf dist/
npm run build
```

### 문제 3: AI CLI 인증 실패

**증상**: Codex/Gemini/Qwen 실행 중 인증 에러

**해결**:
```bash
# AI CLI 인증 확인
codex --version
gemini --version
qwen --version

# 재인증
codex login
gemini login
qwen login
```

---

## 📊 성능 벤치마크

### 예상 성능

| 작업 | 시간 | 설명 |
|------|------|------|
| 3-AI 병렬 실행 | 15-30초 | 가장 느린 AI 기준 |
| Codex 단독 | 27초 | 평균 응답 시간 |
| Gemini 단독 | 5초 | 빠른 응답 |
| Qwen 단독 (Plan Mode) | 60초 | 안전한 계획 수립 |

### 실제 측정 (예시)

```json
{
  "totalTime": 28500,
  "successRate": 1.0,
  "breakdown": {
    "codex": 27000,
    "gemini": 4500,
    "qwen": 28000
  }
}
```

---

## 🎯 Best Practices

### 1. MCP 우선 사용

```
# ✅ 권장
"Multi-AI MCP로 교차검증"

# ❌ 비권장
"Bash CLI로 3-AI 병렬 실행"
```

### 2. 선택적 AI 활용

```typescript
// 성능 분석만 필요 시
mcp__multi_ai__queryWithPriority({
  query: "...",
  includeQwen: true,
  includeCodex: false,
  includeGemini: false
})
```

### 3. 타임아웃 고려

- 복잡한 쿼리: 60-90초 예상
- 간단한 쿼리: 15-30초 예상

---

## 📝 버전 히스토리

### v1.0.0 (2025-10-05)

**초기 릴리스**:
- ✅ 3-AI 병렬 실행 (Codex, Gemini, Qwen)
- ✅ 자동 합의 분석 (시맨틱 패턴 매칭)
- ✅ 충돌 감지 시스템
- ✅ 적응형 타임아웃 (30/90/120초)
- ✅ Command Injection 방지
- ✅ 100% 테스트 커버리지

**평가 점수**: 9.2/10 (프로덕션 준비 완료)

---

## 🔗 관련 문서

- [Multi-AI 사용 전략](../../CLAUDE.md#-multi-ai-사용-전략-2025-10-05-신규)
- [MCP 설정 가이드](../../docs/claude/environment/mcp/mcp-configuration.md)
- [README](./README.md)

---

**💡 문제 발생 시**: [GitHub Issues](https://github.com/skyasu2/openmanager-vibe-v5/issues)
