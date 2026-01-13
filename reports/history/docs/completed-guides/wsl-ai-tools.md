# WSL AI Development Tools Configuration

**Last Updated**: 2026-01-08
**Environment**: WSL 2 (Ubuntu 24.04)

AI CLI 도구들의 WSL 환경 설치 및 구성 현황 문서입니다.

> **Note**: Qwen 제거 (2026-01-07) - 평균 201초 응답, 13.3% 실패율로 2-AI 단순화

## 🛠 Installed AI CLI Tools

| Tool | Version | Package | Path |
|------|---------|---------|------|
| **Claude Code** | `v2.0.76` | `@anthropic-ai/claude-code` | `~/.npm-global/bin/claude` |
| **Codex CLI** | `v0.77.0` | `@openai/codex` | `~/.npm-global/bin/codex` |
| **Gemini CLI** | `v0.22.4` | `@google/gemini-cli` | `~/.npm-global/bin/gemini` |
| **Mermaid CLI** | `v11.x` | `@mermaid-js/mermaid-cli` | `~/.npm-global/bin/mmdc` |

## 💰 Authentication & Pricing

**중요**: 모든 AI 도구는 **계정 인증 (OAuth)** 방식으로 API 키가 아닌 구독/무료 서비스를 사용합니다.

| Tool | Auth Method | Plan | Monthly Cost |
|------|-------------|------|--------------|
| **Claude Code** | Anthropic OAuth | **Max 20** | $200 |
| **Codex CLI** | OpenAI OAuth | **Plus** | $20 |
| **Gemini CLI** | Google OAuth | **Free** | $0 |

### 월간 총 비용: **$220/월**

### 장점
- API 키 노출 위험 없음 (OAuth 토큰 사용)
- 종량제 과금 없음 (구독/무료 한도 내 사용)
- `.env` 파일에 API 키 설정 불필요

## 📂 Configuration Directory Structure

```bash
~/.claude/                    # Claude Code
├── .credentials.json         # Anthropic OAuth
├── config.json               # Settings
├── history.jsonl             # Conversation History (~800KB)
├── plugins/                  # Installed Plugins
├── todos/                    # Todo Management
└── projects/                 # Project-specific Configs

~/.codex/                     # Codex (OpenAI)
├── auth.json                 # OpenAI OAuth (Plus 계정)
├── config.toml               # TOML Config
├── history.jsonl             # History
└── rules/                    # Custom Rules

~/.gemini/                    # Gemini CLI
├── oauth_creds.json          # Google OAuth (무료)
├── settings.json             # Settings
└── google_accounts.json      # Account Info
```

## 🔄 AI Wrapper Rotation System (2-AI Code Review)

`scripts/ai-wrappers/` 폴더에 위치한 래퍼 스크립트들이 AI 도구 로테이션을 관리합니다.

| Script | Version | Purpose |
|--------|---------|---------|
| `codex-wrapper.sh` | v4.0.0 | Codex 래퍼 |
| `gemini-wrapper.sh` | v4.0.0 | Gemini 래퍼 |

**Rotation Logic**: `codex` ↔ `gemini` (1:1 순번 자동 로테이션)

## 🔧 Installation Method

모든 도구는 npm global로 설치되어 있습니다:

```bash
# npm global prefix 설정
npm config set prefix '~/.npm-global'

# PATH 설정 (~/.bashrc)
export PATH="$HOME/.npm-global/bin:$PATH"

# 설치 명령어
npm install -g @anthropic-ai/claude-code
npm install -g @openai/codex
npm install -g @google/gemini-cli
npm install -g @mermaid-js/mermaid-cli
```

## 🚀 Upgrade Instructions

```bash
# 전체 업데이트
npm update -g @anthropic-ai/claude-code @openai/codex @google/gemini-cli

# 개별 업데이트
npm install -g @openai/codex@latest      # Codex
npm install -g @google/gemini-cli@latest # Gemini
```

## 📊 Usage Limits (Codex Example)

```
Model:            gpt-5.2-codex
Context window:   272K tokens
5h limit:         Rate limited per session
Weekly limit:     Resets weekly
```

## 🔗 Related Documents

- [AI Tools Usage Rules](/.claude/rules/ai-tools.md)
- [AI Registry Core](config/ai/registry-core.yaml)
- [WSL Setup Guide](wsl/wsl-setup-guide.md)
