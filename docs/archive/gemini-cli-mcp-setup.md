# Gemini CLI MCP 설정 가이드

Gemini CLI에 MCP(Model Context Protocol) 서버를 추가하여 AI 어시스턴트가 Gemini의 대용량 토큰 윈도우를 활용할 수 있도록 설정하는 가이드입니다.

## 📋 목차

1. [개요](#개요)
2. [사전 준비사항](#사전-준비사항)
3. [MCP 서버 설정](#mcp-서버-설정)
4. [Windows/WSL 환경 설정](#windowswsl-환경-설정)
5. [사용 방법](#사용-방법)
6. [문제 해결](#문제-해결)

## 개요

### Gemini CLI vs Google AI API

두 도구는 완전히 다른 목적과 사용 방법을 가지고 있습니다:

| 구분 | Gemini CLI | Google AI API |
|------|------------|---------------|
| **용도** | 로컬 개발 도구 | 프로덕션 AI 기능 |
| **인증** | Google 로그인만 필요 | API 키 필요 |
| **사용 위치** | 터미널/명령줄 | 애플리케이션 코드 |
| **제한** | 일일 1,000회 | API 요금제에 따름 |

### jamubc/gemini-mcp-tool

- **목적**: Gemini CLI의 강력한 분석 기능을 Claude Code와 같은 AI 어시스턴트에서 활용
- **특징**: 대용량 파일 분석, 코드베이스 이해, @ 구문을 통한 파일 참조
- **장점**: 설치 불필요 (npx로 직접 실행)

## 사전 준비사항

### 1. Gemini CLI 설치

```bash
# npm을 통한 설치 (권장)
npm install -g @google/gemini-cli

# 설치 확인
gemini --version
```

### 2. 로그인

```bash
# Google 계정으로 로그인
gemini login
```

브라우저가 열리면 Google 계정으로 로그인합니다.

## MCP 서버 설정

### 1. 설정 파일 생성

`~/.gemini/settings.json` 파일을 생성합니다:

```json
{
  "theme": "Default",
  "selectedAuthType": "oauth-personal",
  "authMethod": "oauth",
  "mcpServers": {
    "gemini-mcp-tool": {
      "command": "npx",
      "args": ["-y", "gemini-mcp-tool"],
      "timeout": 30000,
      "trust": false
    }
  }
}
```

### 2. 설정 파일 옵션 설명

- **authMethod**: "oauth" - OAuth 인증 사용
- **selectedAuthType**: "oauth-personal" - 개인 OAuth 인증
- **mcpServers**: MCP 서버 설정
  - **command**: "npx" - Node.js 패키지 실행기
  - **args**: ["-y", "gemini-mcp-tool"] - 자동 설치 및 실행
  - **timeout**: 30000 - 타임아웃 (밀리초)
  - **trust**: false - 도구 호출 확인 필요

## Windows/WSL 환경 설정

Windows와 WSL을 함께 사용하는 경우, 인증 정보를 동기화해야 합니다.

### 1. Windows에서 로그인

PowerShell에서:
```bash
gemini login
```

### 2. WSL로 인증 정보 복사

WSL 터미널에서:
```bash
# 디렉토리 생성
mkdir -p ~/.gemini

# Windows의 인증 정보 복사
cp /mnt/c/Users/[사용자명]/.gemini/oauth_creds.json ~/.gemini/
cp /mnt/c/Users/[사용자명]/.gemini/google_account_id ~/.gemini/

# settings.json 생성 (위의 내용으로)
nano ~/.gemini/settings.json
```

### 3. 권한 설정

```bash
# 파일 권한 설정 (보안을 위해)
chmod 600 ~/.gemini/oauth_creds.json
chmod 644 ~/.gemini/settings.json
```

## 사용 방법

### 1. 대화형 모드

```bash
# Gemini CLI 실행
gemini

# MCP 서버 상태 확인
> /mcp

# 파일 분석
> @src/app/page.tsx 이 파일의 구조를 설명해주세요

# 도움말
> /help
```

### 2. 비대화형 모드 (파이프 사용)

```bash
# 파일 분석
cat src/app/page.tsx | gemini -p "@src/app/page.tsx 인증 로직 분석"

# 간단한 질문
echo "프로젝트 구조" | gemini -p "AI 엔진 아키텍처 설명"

# Git 변경사항 리뷰
git diff | gemini -p "변경사항 리뷰"
```

### 3. MCP 기능 활용

```bash
# 대용량 파일 분석
echo "분석 요청" | gemini -p "@large-file.js 이 파일의 주요 기능들을 요약해주세요"

# 디렉토리 전체 분석
echo "프로젝트 분석" | gemini -p "@src/ 디렉토리 구조와 주요 컴포넌트 설명"
```

## 문제 해결

### 1. "Please set an Auth method" 에러

**원인**: 인증 설정이 잘못되었거나 누락됨

**해결책**:
```bash
# settings.json 확인
cat ~/.gemini/settings.json

# authMethod가 "oauth"인지 확인
# oauth_creds.json 파일이 있는지 확인
ls -la ~/.gemini/
```

### 2. MCP 서버 시작 실패

**원인**: npx 실행 권한 문제 또는 네트워크 문제

**해결책**:
```bash
# npx 캐시 정리
npm cache clean --force

# 직접 설치 후 테스트
npm install -g gemini-mcp-tool
```

### 3. WSL에서 인증 실패

**원인**: Windows와 WSL 간 인증 정보 불일치

**해결책**:
1. Windows에서 다시 로그인
2. WSL로 인증 파일 재복사
3. settings.json 파일 재생성

### 4. MCP 서버 경고 메시지

"npm warn config cache-max" 같은 경고는 무시해도 됩니다. 정상 작동에 영향 없음.

## 토큰 관리 팁

일일 1,000회 제한을 효율적으로 사용하기 위한 팁:

```bash
# 사용량 확인
gemini /stats

# 대화 압축 (토큰 절약)
gemini /compress

# 컨텍스트 초기화
gemini /clear

# 중요 정보 저장
gemini /memory add "프로젝트 핵심 정보"
```

## 프로젝트별 설정

프로젝트 루트에 `.gemini/settings.json`을 생성하여 프로젝트별 설정 가능:

```json
{
  "authMethod": "oauth",
  "mcpServers": {
    "gemini-mcp-tool": {
      "command": "npx",
      "args": ["-y", "gemini-mcp-tool"],
      "timeout": 60000,
      "trust": true
    },
    "custom-mcp-server": {
      "command": "./custom-server.js",
      "args": ["--mode", "production"]
    }
  }
}
```

## 보안 주의사항

1. **OAuth 인증 정보 보호**
   - `oauth_creds.json` 파일을 Git에 커밋하지 마세요
   - `.gitignore`에 추가: `/.gemini/`

2. **API 키 사용 금지**
   - Gemini CLI는 로그인 방식만 사용
   - API 키는 프로덕션 Google AI API용

3. **MCP 서버 신뢰 설정**
   - `"trust": false` 유지 권장
   - 신뢰할 수 있는 서버만 `true`로 설정

## 참고 자료

- [jamubc/gemini-mcp-tool GitHub](https://github.com/jamubc/gemini-mcp-tool)
- [Google Gemini CLI 공식 문서](https://github.com/google-gemini/gemini-cli)
- [MCP(Model Context Protocol) 문서](https://github.com/google-gemini/gemini-cli/blob/main/docs/tools/mcp-server.md)

## 업데이트 이력

- 2025-07-11: 초기 문서 작성
- Windows/WSL 환경 동기화 방법 추가
- jamubc/gemini-mcp-tool 설정 완료