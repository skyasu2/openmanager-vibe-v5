# 🔐 안전한 토큰 관리 가이드

## GitHub 토큰 설정 (평문 노출 방지)

### 1. 임시 설정 (권장)
현재 세션에서만 사용하는 가장 안전한 방법:

```bash
# 방법 1: 직접 export (터미널 히스토리에 남지 않음)
export GITHUB_TOKEN="your-token-here"

# 방법 2: 스크립트 사용 (입력 시 화면에 표시되지 않음)
source scripts/set-github-token.sh
```

### 2. MCP 서버 활성화 확인

```bash
# 환경변수 설정 확인 (토큰 값은 마스킹됨)
echo ${GITHUB_TOKEN:0:7}...${GITHUB_TOKEN: -4}

# Claude Code 재시작 후 MCP 서버 상태 확인
npm run mcp:status
```

### 3. 보안 주의사항

⚠️ **절대 하지 말아야 할 것들:**
- `.env.local`에 평문으로 저장 ❌
- Git에 커밋 ❌
- 로그나 출력에 포함 ❌
- 공유 가능한 파일에 저장 ❌

✅ **권장 사항:**
- 환경변수로만 사용
- 세션 종료 시 자동 삭제
- 필요시마다 입력
- 암호화하여 저장 (프로덕션)

### 4. 토큰 권한 설정

GitHub Personal Access Token 생성 시 필요한 최소 권한:
- `repo` - 저장소 접근
- `read:org` - 조직 정보 읽기
- `read:user` - 사용자 정보 읽기

### 5. 암호화 저장 (고급)

프로덕션 환경에서 사용할 경우:

```bash
# 암호화된 환경변수 설정
node scripts/unified-encrypt-env.mjs --password-file=.env.key

# 복호화하여 사용
node scripts/decrypt-env-vars.mjs
```

### 6. MCP 서버 테스트

토큰이 올바르게 설정되었는지 확인:

```bash
# Claude Code에서 테스트
# @github 명령으로 저장소 정보 조회
```

### 7. 문제 해결

토큰이 작동하지 않을 경우:
1. 환경변수 확인: `env | grep GITHUB`
2. 토큰 권한 확인
3. Claude Code 재시작
4. MCP 서버 로그 확인

---

이 가이드를 따르면 GitHub 토큰을 안전하게 관리하면서 MCP 기능을 사용할 수 있습니다.