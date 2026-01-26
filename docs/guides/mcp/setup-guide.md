# 🔧 MCP 설정 가이드

**OpenManager VIBE v5** - 현실적 구현(Pragmatic)과 모범 사례(Best Practice) 비교

---

## 🎯 개요: 현실 vs 이상

이 문서는 MCP(Model Context Protocol) 서버를 설정하는 두 가지 접근 방식을 설명합니다.
**현재 이 프로젝트는 개발 생산성과 관리 편의성을 위해 "현실적 구현(.mcp.json 직접 관리)" 방식을 채택하여 사용 중입니다.**

| 비교 항목 | 🏗️ 현실적 구현 (Current Project) | 🛡️ 모범 사례 (Best Practice) |
| :--- | :--- | :--- |
| **설정 방식** | `.mcp.json` 파일 직접 수정 | `claude mcp add` CLI 명령어 사용 |
| **토큰 관리** | 파일 내 **하드코딩** (간편함) | **환경변수** 사용 (보안성) |
| **보안 전략** | `.gitignore`로 파일 자체를 숨김 | 변수 분리를 통해 코드/설정 분리 |
| **경로 설정** | 절대 경로 하드코딩 (`/home/user/...`) | `$HOME` 변수 및 동적 경로 사용 |
| **장점** | 설정이 한눈에 보임, 즉시 적용 가능 | 보안이 강력함, 이식성이 높음 |
| **단점** | 파일 유출 시 보안 위험, 사용자 종속적 | 설정 과정이 복잡하고 번거로움 |

---

## 1️⃣ 현재 적용된 방식 (Implementation Detail)

### 📄 `.mcp.json` 구성 (Single Source of Truth)

현재 프로젝트는 루트 디렉토리의 `.mcp.json` 파일을 통해 모든 MCP 서버를 관리합니다.

**실제 설정 파일 예시:**

```json
{
  "mcpServers": {
    "vercel": {
      "command": "npx",
      "args": [
        "-y",
        "vercel-mcp",
        "VERCEL_API_KEY=ACTUAL_KEY_HERE" 
      ]
    },
    "serena": {
      "command": "/home/sky-note/.local/bin/uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena-mcp-server",
        "--enable-web-dashboard",
        "false",
        "--project",
        "/mnt/d/cursor/openmanager-vibe-v5" 
      ],
      "env": {
        "TERM": "dumb",
        "NO_COLOR": "1"
      }
    }
    // ... 기타 서버들
  }
}
```

### 💡 왜 이렇게 설정했는가? (Design Decisions)

1.  **관리의 직관성**:
    *   여러 파일 (`.env`, `global config` 등)을 오가며 설정하는 대신, `.mcp.json` 파일 하나만 열면 현재 연결된 모든 도구와 설정을 즉시 파악하고 수정할 수 있습니다.

2.  **WSL 환경의 특수성**:
    *   Windows/WSL 환경에서는 환경 변수가 쉘 세션 간에 제대로 전파되지 않거나, `npx` 실행 컨텍스트에서 누락되는 경우가 잦습니다.
    *   파일에 값을 명시함으로써 "환경 변수 누락"으로 인한 디버깅 시간을 제거했습니다.

3.  **성능과 호환성 (Serena MCP)**:
    *   `uvx`가 매번 가상환경을 생성하는 오버헤드를 줄이기 위해, 설치된 바이너리 경로를 직접 지정하거나 절대 경로를 사용합니다.
    *   `--project` 경로를 명시하여 WSL 파일 시스템 상의 정확한 위치를 타겟팅합니다.

### 🔒 보안 대책 (Security Mitigation)

이 방식의 가장 큰 약점은 보안(하드코딩된 토큰)입니다. 이를 보완하기 위해 다음과 같은 조치를 취합니다:

1.  **Git 추적 제외 (필수)**:
    *   `.gitignore`에 `.mcp.json`이 반드시 포함되어야 합니다.
    *   백업 파일 `*.mcp.json.backup` 등도 무시되도록 설정합니다.

2.  **개인화된 로컬 설정**:
    *   이 파일은 '공유되는 설정'이 아니라 개발자 개인의 '로컬 설정'으로 취급합니다.

---

## 2️⃣ 모범 사례 참조 (Reference: Best Practice)

> **참고**: 아래 방식은 보안과 이식성이 중요할 때 권장되는 이론적 표준(Best Practice)입니다.

### CLI 및 환경변수 기반 설정

표준 가이드에서는 보안을 위해 API 키를 소스 코드나 설정 파일에서 분리할 것을 권장합니다.

```bash
# 1. 환경변수로 키 설정
export VERCEL_API_KEY="my-secret-key"

# 2. CLI를 사용하여 서버 추가 (하드코딩 방지)
claude mcp add vercel -s local -- \
  npx -y vercel-mcp VERCEL_API_KEY=$VERCEL_API_KEY
```

### 이 방식의 장점
*   `.mcp.json` 파일을 실수로 Git에 올리더라도 비밀 키는 노출되지 않습니다.
*   다른 개발자(또는 다른 OS 사용자)가 자신의 환경 변수만 설정하면 동일한 명령어로 셋업할 수 있습니다.

---

## 3️⃣ 트러블슈팅 및 관리

### 주요 문제 해결

1.  **WSL 실행 오류 (`command not found`)**:
    *   원인: `.mcp.json` 내의 절대 경로(`/home/user...`)가 현재 사용자의 경로와 다름.
    *   해결: `.mcp.json`을 열어 `command` 경로를 자신의 환경(`$HOME`)에 맞게 수정합니다.

2.  **연결 끊김 (Timeout)**:
    *   대규모 코드베이스 분석 시 Serena 서버가 응답하지 않을 수 있습니다.
    *   해결: `.mcp.json`의 `args`에 `"--tool-timeout", "180"` 등을 추가하여 타임아웃을 늘립니다.

### 관리 스크립트

현재 프로젝트는 편의를 위해 상태를 점검하는 스크립트를 제공합니다:

```bash
# MCP 서버 연결 상태 및 메모리 확인
./scripts/mcp-health-check.sh
```

---

**결론**: 우리는 보안(Best Practice)과 편의성(Pragmatic) 사이에서 **편의성**을 선택했으며, `.gitignore`를 통한 철저한 파일 관리로 보안 리스크를 통제하고 있습니다.
