ARCHIVED

## 🎉 최종 해결 완료 (2025-08-14)

**문제**: Supabase MCP 서버가 "Failed to connect" 상태  
**원인**: Windows CMD에서 npm 패키지명의 특수문자 처리 문제  
**해결**: `command`를 단일 문자열에서 `command` + `args` 배열로 변경

## ✅ 성공적인 해결 방법

### 핵심 해결책: Claude MCP 설정 수정

**C:\Users\skyas\.claude.json** 파일에서 Supabase 설정:

```json
"supabase": {
  "type": "stdio",
  "command": "npx",
  "args": [
    "@supabase/mcp-server-supabase@latest",
    "--project-ref",
    "vnswjnltnhpsueosfhmw",
    "--access-token",
    "sbp_90532bce7e5713a964686d52b254175e8c5c32b9"
  ],
  "env": {}
}
```

### Windows 특수문자 문제 해결

❌ **실패했던 방법**:

```json
"command": "npx @supabase/mcp-server-supabase@latest --project-ref vnswjnltnhpsueosfhmw --access-token xxx"
```

**에러**: `npm error Invalid package name "@supabase\mcp-server-supabase"`

✅ **성공한 방법**:

```json
{
  "command": "npx",
  "args": [
    "@supabase/mcp-server-supabase@latest",
    "--project-ref",
    "vnswjnltnhpsueosfhmw",
    "--access-token",
    "xxx"
  ]
}
```

### 디버깅 과정

1. **디버그 모드 실행**:

   ```bash
   claude --debug mcp list
   ```

2. **핵심 에러 발견**:

   ```
   [ERROR] MCP server "supabase" Server stderr: npm error Invalid package name "@supabase\mcp-server-supabase"
   ```

3. **Windows CMD 백슬래시 문제 확인**:
   - `cmd /c` 환경에서 `@supabase/mcp-server-supabase` → `@supabase\mcp-server-supabase`로 변환됨
   - npm이 백슬래시를 잘못된 패키지명으로 해석

## 📊 최종 MCP 서버 상태 (성공!)

```bash
claude mcp list
```

**결과** - 11개 MCP 서버 모두 연결 성공:

```
✓ filesystem - Connected
✓ memory - Connected
✓ github - Connected
✓ sequential-thinking - Connected
✓ time - Connected
✓ context7 - Connected
✓ shadcn-ui - Connected
✓ serena - Connected
✓ tavily-mcp - Connected
✓ playwright - Connected
✓ supabase - Connected  ← 해결됨!
```

## 🎯 핵심 교훈

### Windows MCP 서버 설정 원칙

1. **`command` + `args` 배열 사용**:
   - 특수문자가 포함된 npm 패키지명에서 안전
   - Windows CMD의 문자 변환 문제 회피

2. **디버그 모드 활용**:
   - `claude --debug mcp list`로 정확한 에러 확인
   - MCP 서버별 stderr 로그 분석 필수

3. **Access Token 직접 지정**:
   - `--access-token` 플래그로 인증 토큰 전달
   - 환경변수보다 명시적 방법이 안정적

## 🔍 문제 해결

### 연결 실패 시

1. **환경변수 확인**:

   ```powershell
   echo $env:SUPABASE_ACCESS_TOKEN
   ```

2. **토큰 형식 확인**:
   - Supabase Personal Access Token은 `sbp_`로 시작해야 함
   - Service Role Key (`eyJ`로 시작)가 아님

3. **Claude Code 완전 재시작**:
   - 작업 관리자에서 모든 Claude 프로세스 종료
   - Claude Code 재시작

### 환경변수가 인식되지 않는 경우

```powershell
# 현재 사용자 환경변수 목록 확인
Get-ChildItem Env: | Where-Object {$_.Name -like "*SUPABASE*"}

# 환경변수 강제 새로고침
refreshenv
```

## 📚 관련 문서

- [Supabase MCP 공식 문서](https://github.com/supabase-community/supabase-mcp)
- [Personal Access Token 생성 방법](https://supabase.com/dashboard/account/tokens)
- [Claude Code MCP 가이드](https://docs.anthropic.com/en/docs/claude-code/mcp)

## 🛡️ 보안 참고사항

1. **절대 하드코딩하지 마세요**:
   - 설정 파일에 토큰 직접 입력 금지
   - Git 커밋에 토큰 포함 금지

2. **토큰 권한 최소화**:
   - 개발 프로젝트에만 액세스
   - 읽기 전용 권한 권장

3. **정기적 토큰 갱신**:
   - 3개월마다 토큰 재생성 권장
   - 유출 의심 시 즉시 재생성

---

_작성일: 2025-08-14_  
_버전: 1.0_  
_작성자: Claude Code_
