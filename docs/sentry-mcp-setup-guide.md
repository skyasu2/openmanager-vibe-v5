# 🐛 Sentry MCP 서버 설정 가이드

## 📋 개요

Sentry MCP 서버는 Sentry.io의 에러 리포트, 스택트레이스, 디버깅 정보를 Model Context Protocol을 통해 접근할 수 있게 해주는 도구입니다.

## 🚀 설정 방법

### 1. Sentry 인증 토큰 생성

1. [Sentry.io](https://sentry.io) 로그인
2. Settings → Account → API → Auth Tokens
3. "Create New Token" 클릭
4. 필요한 권한 선택:
   - `project:read`
   - `org:read`
   - `issue:read`
   - `event:read`
5. 토큰 생성 후 안전하게 보관

### 2. 환경변수 설정

`.env.local` 파일에 토큰 추가:

```bash
# 🐛 Sentry 인증 토큰 (에러 모니터링)
SENTRY_AUTH_TOKEN=your_actual_sentry_auth_token_here
```

### 3. MCP 설정 확인

`.mcp.json` 파일에 다음 설정이 추가되었는지 확인:

```json
"sentry": {
  "type": "stdio",
  "command": "uvx",
  "args": [
    "mcp-server-sentry",
    "--auth-token",
    "${SENTRY_AUTH_TOKEN}"
  ],
  "env": {
    "SENTRY_AUTH_TOKEN": "${SENTRY_AUTH_TOKEN}"
  }
}
```

## 🛠️ 사용 방법

### Claude Code에서 Sentry MCP 사용

1. Claude Code 재시작
2. Sentry 관련 명령어 사용:
   - "Sentry에서 최근 에러 확인해줘"
   - "특정 이슈의 스택트레이스 분석해줘"
   - "에러 발생 패턴 분석해줘"

### 주요 기능

- **에러 리포트 조회**: 프로젝트의 에러 리포트 확인
- **스택트레이스 분석**: 상세한 스택트레이스 정보 분석
- **이슈 추적**: 특정 이슈의 발생 빈도 및 영향 분석
- **사용자 영향 분석**: 에러가 영향을 미친 사용자 수 확인

## 🔧 문제 해결

### uvx 명령어를 찾을 수 없는 경우

```bash
# uv 설치 (Python 패키지 관리자)
curl -LsSf https://astral.sh/uv/install.sh | sh
```

### 인증 오류 발생 시

1. 토큰이 올바른지 확인
2. 토큰에 필요한 권한이 있는지 확인
3. 환경변수가 제대로 설정되었는지 확인

## 📝 참고사항

- Sentry MCP 서버는 Python 기반으로 작성되어 `uvx` 명령어로 실행됩니다
- 개발 환경에서만 사용하며, 프로덕션 환경에서는 별도의 보안 설정이 필요합니다
- Sentry 무료 플랜의 경우 월별 이벤트 제한이 있으니 주의하세요

## 🔗 관련 링크

- [Sentry MCP 공식 문서](https://docs.sentry.io/product/sentry-mcp/)
- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Sentry.io](https://sentry.io)
