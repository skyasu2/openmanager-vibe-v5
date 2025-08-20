# GitHub MCP 서버 문제 해결 가이드

## 문제: Bad credentials 오류

### 근본 원인
GitHub MCP 서버가 이전 토큰으로 실행 중이며, `.mcp.json` 변경이 즉시 반영되지 않음

### 진단 방법

1. **토큰 유효성 확인**
```bash
curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user
```

2. **실행 중인 MCP 서버 확인**
```bash
ps aux | grep mcp-server-github
```

3. **프로세스 환경변수 확인**
```bash
# PID를 찾아서 확인
cat /proc/PID/environ | tr '\0' '\n' | grep GITHUB
```

### 해결 방법

#### 즉시 해결
1. Claude Code 완전 재시작
```bash
# Claude Code 종료 후 재시작
claude
```

#### 안전한 설정 방법

1. **환경변수 방식 (권장)**
   - `.env.local`에 토큰 저장
   - `.mcp.json`에서 `${GITHUB_PERSONAL_ACCESS_TOKEN}` 참조
   - 단, Claude Code가 환경변수를 제대로 읽지 못할 수 있음

2. **하드코딩 방식 (임시)**
   - `.mcp.json`에 토큰 직접 입력
   - Git에 커밋하지 않도록 주의
   - 테스트 후 환경변수로 변경

### 예방 조치

1. **토큰 권한 확인**
   - `repo` (전체 권한)
   - `workflow`
   - `write:packages`

2. **토큰 관리**
   - 정기적으로 토큰 갱신
   - 여러 토큰 사용 시 명확한 구분

3. **MCP 서버 모니터링**
```bash
# MCP 서버 상태 확인 스크립트
#!/bin/bash
echo "=== MCP 서버 상태 ==="
ps aux | grep mcp-server | grep -v grep
echo ""
echo "=== GitHub 토큰 확인 ==="
curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/user | jq -r '.login'
```

## 주의사항

- Claude Code는 시작 시점에 MCP 서버를 초기화
- 설정 변경 후 반드시 Claude Code 재시작 필요
- 환경변수 `${VAR}` 형식이 항상 작동하지 않을 수 있음

## 참고 링크

- [GitHub Personal Access Tokens](https://github.com/settings/tokens)
- [MCP Protocol Documentation](https://modelcontextprotocol.io/)