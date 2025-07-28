# Claude Code Git Push 가이드

## 문제 상황

Claude Code 터미널에서 git push 시 다음과 같은 문제가 발생합니다:

- Personal Access Token이 노출되면 GitHub이 자동으로 무효화
- 대화형 인증 프롬프트 지원 불가
- SSH 패스프레이즈 입력 불가

## 해결 방법

### 방법 1: 안전한 Push 스크립트 사용 (권장)

1. **새 토큰 생성**
   - https://github.com/settings/tokens 접속
   - "Generate new token (classic)" 클릭
   - `repo` 권한 선택
   - 토큰 복사

2. **인증 설정**

   ```bash
   # 터미널에서 직접 실행 (Claude Code 외부)
   ./scripts/setup-git-auth.sh
   # 토큰 입력 (화면에 표시되지 않음)
   ```

3. **Push 실행**
   ```bash
   # Claude Code에서 실행
   ./scripts/git-push-safe.sh
   ```

### 방법 2: GitHub CLI 사용

```bash
# 설치 (한 번만)
sudo apt update && sudo apt install gh

# 인증 (한 번만)
gh auth login

# Push
gh repo sync
```

### 방법 3: 수동 Push

1. **Claude Code 외부 터미널**에서:
   ```bash
   git push origin main
   # Username: skyasu2
   # Password: [새로 생성한 토큰]
   ```

## 보안 주의사항

1. **절대 하지 말아야 할 것**:
   - 토큰을 코드에 하드코딩
   - echo 명령으로 토큰 출력
   - .env 파일을 커밋

2. **권장 사항**:
   - 토큰에 최소 권한만 부여
   - 정기적으로 토큰 갱신
   - .gitignore에 민감한 파일 추가

## 문제 해결

### 토큰이 여전히 작동하지 않는 경우

1. 토큰 권한 확인 (repo 권한 필수)
2. 토큰 만료일 확인
3. 새 토큰으로 재생성

### Claude Code 제한사항

- 대화형 프롬프트 미지원
- SSH 에이전트 연동 불가
- 환경변수가 세션 간 유지되지 않을 수 있음

## 대안

1. **VS Code + Git Graph**: GUI로 편리하게 푸시
2. **GitHub Desktop**: 별도 인증 관리
3. **CI/CD**: GitHub Actions로 자동화

---

작성일: 2025-01-28
Claude Code 버전 호환성 확인됨
