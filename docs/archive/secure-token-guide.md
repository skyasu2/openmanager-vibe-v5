# 🔐 MCP 토큰 보안 가이드

## 현재 상황

MCP 서버들이 다양한 API 토큰을 필요로 하며, 보안을 위해 환경 변수로 관리하는 것이 권장됩니다.

## 보안 문제점

1. **평문 저장**: `.bashrc`에 토큰이 평문으로 저장됨
2. **노출 위험**: 화면 공유나 스크린샷에서 노출 가능
3. **버전 관리**: 실수로 커밋될 위험

## 해결 방안

### 방법 1: 안전한 토큰 설정 스크립트 사용

```bash
# 토큰 설정 스크립트 실행
bash scripts/setup-github-token.sh
```

스크립트 기능:
- 토큰 입력 시 화면에 표시 안 됨
- GitHub API로 토큰 유효성 검증
- 3가지 저장 옵션 제공

### 방법 2: 보안 파일 사용

```bash
# 토큰을 별도 파일에 저장
echo "your-token-here" > ~/.github_token
chmod 600 ~/.github_token

# .bashrc에서 파일 읽기
echo 'export GITHUB_TOKEN=$(cat ~/.github_token 2>/dev/null)' >> ~/.bashrc
```

### 방법 3: 1Password CLI 연동 (고급)

```bash
# 1Password CLI 설치 후
export GITHUB_TOKEN=$(op read "op://Personal/GitHub PAT/token")
```

### 방법 4: WSL 자격 증명 관리자 사용

```bash
# Windows 자격 증명 관리자에 저장
cmdkey /generic:github_token /user:token /pass:your-token-here

# WSL에서 읽기
export GITHUB_TOKEN=$(powershell.exe -Command "
    \$cred = Get-StoredCredential -Target 'github_token' -AsCredentialObject
    \$cred.Password | ConvertFrom-SecureString -AsPlainText
")
```

## MCP 설정 개선

현재 `~/.claude/settings.json`:
```json
"github": {
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

이미 환경 변수를 참조하도록 설정되어 있어 좋습니다! 👍

## 추가 보안 권장사항

1. **토큰 권한 최소화**
   - 필요한 권한만 부여
   - 정기적으로 권한 검토

2. **토큰 만료 설정**
   - 90일 이하로 설정
   - 자동 갱신 스크립트 작성

3. **감사 로그**
   - GitHub 설정에서 감사 로그 확인
   - 비정상적인 활동 모니터링

4. **별도 토큰 사용**
   - MCP 전용 토큰 생성
   - 다른 용도와 분리

## 현재 토큰 제거

```bash
# .bashrc에서 토큰 라인 제거
sed -i '/export GITHUB_TOKEN=/d' ~/.bashrc

# 또는 수동으로 편집
nano ~/.bashrc
# GITHUB_TOKEN 라인 삭제
```

## Supabase Key 보안 설정

### 자동 설정 스크립트

```bash
# Supabase Key 설정 스크립트 실행
bash scripts/set-supabase-key.sh
```

스크립트 기능:
- JWT 형식 검증
- 3가지 저장 옵션 제공
- 자동으로 Claude 설정 업데이트 안내

### Claude settings.json 업데이트

```json
// 변경 전
"SUPABASE_SERVICE_ROLE_KEY": "eyJhbGci..."

// 변경 후
"SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_KEY}"
```

## 보안 체크리스트

- [x] GitHub Token: `${GITHUB_TOKEN}` 환경 변수 참조
- [x] Brave API Key: `${BRAVE_API_KEY}` 환경 변수 참조
- [x] Supabase Key: `${SUPABASE_KEY}` 환경 변수 참조
- [ ] 정기적인 토큰 갱신 스케줄 설정
- [ ] 토큰별 권한 최소화

## 결론

모든 MCP 서버의 민감한 정보가 환경 변수로 관리되도록 설정되었습니다. Claude Code 재시작 후 새 설정이 적용됩니다.