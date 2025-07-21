# Gemini CLI Bridge v2.0 - 양방향 호환 가이드

## 🚀 개요

Gemini CLI Bridge v2.0은 Claude Code와 Gemini CLI 간의 양방향 호출 문제를 해결하는 적응적 MCP 서버입니다.

### ⚠️ 해결된 문제

기존 v1.0에서는 다음과 같은 순환 문제가 있었습니다:

```
Claude Code (WSL) → Gemini CLI Bridge → PowerShell → Gemini CLI ✅
Gemini CLI → Claude Code (역방향) → 경로 불일치 ❌
```

v2.0에서는 **컨텍스트 감지 시스템**으로 호출 방향을 자동 감지하여 최적화된 실행 전략을 선택합니다.

## 🧠 컨텍스트 감지 시스템

### 감지 요소들

1. **환경 변수 분석**
   - Claude Code: `CLAUDE_*`, `ANTHROPIC_*` 환경 변수
   - Gemini CLI: `GEMINI_*` 환경 변수
   - WSL: `WSL_*`, `/mnt/` 경로 포함

2. **파일 시스템 컨텍스트**
   - `.claude/claude_workspace.json` 존재 여부
   - `CLAUDE.md` 프로젝트 지표
   - MCP 서버 디렉토리 구조

3. **프로세스 컨텍스트**
   - 부모 프로세스 이름 (`claude`, `gemini`, `node`)
   - 프로세스 트리 분석
   - stdio 전송 방식 감지

4. **런타임 컨텍스트**
   - TTY vs stdio 모드
   - 플랫폼 및 아키텍처
   - Node.js 버전

### 실행 전략들

| 전략                  | 사용 조건                      | 설명                        |
| --------------------- | ------------------------------ | --------------------------- |
| `wsl-optimized`       | Claude Code → Gemini (WSL)     | WSL 환경 최적화된 bash 실행 |
| `powershell-direct`   | Claude Code → Gemini (Windows) | 직접 PowerShell 실행        |
| `reverse-compatible`  | Gemini → Claude                | 역방향 호환 모드            |
| `wsl-fallback`        | 불확실한 WSL 환경              | WSL 폴백 전략               |
| `powershell-fallback` | 불확실한 Windows 환경          | PowerShell 폴백 전략        |

## 🔧 설치 및 설정

### 1. MCP 서버 등록

`.claude/claude_workspace.json`에 새로운 서버 등록:

```json
{
  "mcpServers": {
    "gemini-cli-bridge": {
      "command": "node",
      "args": [
        "/mnt/d/cursor/openmanager-vibe-v5/mcp-servers/gemini-cli-bridge/src/index.js"
      ]
    }
  }
}
```

### 2. 환경 변수 설정 (선택사항)

```bash
# 디버그 모드 활성화
export GEMINI_DEBUG=true

# 타임아웃 설정 (기본: 30초)
export GEMINI_TIMEOUT=45000

# 재시도 횟수 (기본: 3회)
export GEMINI_MAX_RETRIES=2
```

## 📊 사용법

### MCP 도구들

1. **gemini_chat** - 기본 모델로 채팅
2. **gemini_chat_flash** - Flash 모델 (빠르고 효율적)
3. **gemini_chat_pro** - Pro 모델 (강력한 추론)
4. **gemini_stats** - 사용량 통계 확인
5. **gemini_clear** - 컨텍스트 초기화
6. **gemini_context_info** - 컨텍스트 정보 확인 (새로운 기능!)

### 컨텍스트 정보 확인

```javascript
// Claude Code에서 사용
const contextInfo = await mcp_gemini_cli_bridge_gemini_context_info();
```

출력 예시:

```
=== Gemini CLI Bridge 컨텍스트 정보 ===

🔍 호출 컨텍스트:
  - 호출자: claude-code
  - 대상: gemini
  - 확신도: 13
  - WSL 환경: 예

⚡ 실행 전략:
  - 전략: wsl-optimized
  - 권장사항: WSL 환경에서 Claude Code 감지됨 - 최적화된 PowerShell 브릿지 사용

🐛 디버그 점수:
  - 환경 점수: 10
  - 파일시스템 점수: 13
  - 프로세스 점수: 10
  - 런타임 점수: 5
```

## 🧪 테스트

### 독립 테스트 실행

```bash
cd /mnt/d/cursor/openmanager-vibe-v5
node scripts/test-adaptive-gemini.js
```

### MCP 서버 직접 테스트

```bash
cd /mnt/d/cursor/openmanager-vibe-v5/mcp-servers/gemini-cli-bridge
node src/index.js
```

## 🔧 트러블슈팅

### 일반적인 문제들

1. **타임아웃 오류**

   ```bash
   export GEMINI_TIMEOUT=60000  # 60초로 증가
   ```

2. **PowerShell 경로 문제**
   - v2.0에서는 자동으로 여러 경로를 시도합니다
   - 수동 설정이 필요 없습니다

3. **컨텍스트 감지 오류**

   ```bash
   export GEMINI_DEBUG=true  # 상세 로그 활성화
   ```

4. **WSL 환경 문제**
   - v2.0에서는 WSL과 PowerShell 간 자동 폴백을 제공합니다

### 디버그 모드

```bash
export GEMINI_DEBUG=true
node src/index.js
```

디버그 모드에서는 상세한 컨텍스트 감지 정보가 출력됩니다.

## 🎯 성능 최적화

### 각 전략별 최적화

1. **WSL Optimized**: bash 직접 실행, PATH 최적화
2. **PowerShell Direct**: 최적화된 PowerShell 경로, 윈도우 숨김
3. **Reverse Compatible**: 역방향 호출용 환경 변수 설정

### 폴백 체인

각 전략은 실패 시 자동으로 폴백 전략을 시도합니다:

- `wsl-optimized` → `powershell-direct` → `wsl-fallback`
- `powershell-direct` → `wsl-optimized` → `powershell-fallback`
- `reverse-compatible` → `wsl-fallback` → `powershell-fallback`

## 🚀 향후 계획

1. **Gemini → Claude 역호출 최적화** 추가 구현
2. **캐싱 시스템** 도입으로 성능 향상
3. **멀티플랫폼 지원** (macOS, Linux)
4. **자동 재시도 로직** 개선

## 📝 변경 로그

### v2.0.0

- ✅ 양방향 호출 컨텍스트 감지 시스템 구현
- ✅ 적응적 실행 전략 선택
- ✅ 자동 폴백 체인
- ✅ 새로운 `gemini_context_info` 도구 추가
- ✅ 향상된 오류 처리 및 로깅

### v1.0.0

- 기본 Claude → Gemini 단방향 호출 지원
- PowerShell 브릿지 구현
- 기본 MCP 도구들 제공

---

**💡 팁**: 문제가 발생하면 `gemini_context_info` 도구로 현재 컨텍스트 상태를 먼저 확인해보세요!
