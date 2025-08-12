# Git 인증 가이드

최종 업데이트: 2025-07-31

## 🔐 Git Push 인증 문제 해결

### 문제 상황
```
fatal: could not read Username for 'https://github.com': No such device or address
```

### 해결 방법

#### 1. 자동 설정 스크립트 사용 (권장)
```bash
# 스크립트 실행
./scripts/git/setup-credentials.sh
```

#### 2. 수동 설정

##### 2.1 환경변수 확인
```bash
# .env.local에 GitHub Personal Access Token 설정
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

##### 2.2 Git Credential Helper 설정
```bash
# Credential helper 활성화
git config --global credential.helper store

# 인증 정보 저장
echo "https://skyasu2:${GITHUB_TOKEN}@github.com" > ~/.git-credentials
chmod 600 ~/.git-credentials
```

##### 2.3 Git 기본 설정
```bash
git config --global user.name "skyasu2"
git config --global user.email "skyasu2@gmail.com"
git config --global push.default current
```

### 🔑 GitHub Personal Access Token 관리

#### 토큰 생성 방법
1. GitHub.com > Settings > Developer settings > Personal access tokens
2. "Generate new token" 클릭
3. 필요한 권한 선택:
   - `repo` - 전체 저장소 접근
   - `workflow` - GitHub Actions 워크플로우
4. 토큰 복사 후 `.env.local`에 저장

#### 토큰 권한 최소화
- 포트폴리오 프로젝트: `repo`, `workflow` 권한만
- 프로덕션: 추가로 `admin:repo_hook`, `delete_repo` 제외

### 🛡️ 보안 모범 사례

#### 1. 환경변수 사용
```bash
# ❌ 하드코딩 금지
git remote set-url origin https://user:ghp_xxx@github.com/user/repo.git

# ✅ 환경변수 사용
git remote set-url origin https://github.com/user/repo.git
# 인증은 credential helper가 처리
```

#### 2. 토큰 로테이션
- 3개월마다 토큰 갱신
- 갱신 후 setup-credentials.sh 재실행

#### 3. .gitignore 확인
```
.env.local
.git-credentials
*.pem
*.key
```

### 🔧 문제 해결

#### Credential Helper가 작동하지 않을 때
```bash
# 캐시 초기화
git config --global --unset credential.helper
git config --global credential.helper store

# 저장된 인증 정보 확인
cat ~/.git-credentials
```

#### WSL 환경에서의 추가 설정
```bash
# Windows credential manager와 충돌 방지
git config --global credential.helper manager-core
git config --global credential.credentialStore plaintext
```

### 📝 CI/CD 파이프라인 설정

GitHub Actions에서는 별도 설정 불필요:
- `${{ secrets.GITHUB_TOKEN }}` 자동 제공
- 저장소 Settings > Secrets에서 추가 토큰 설정 가능

### 🚀 빠른 체크리스트

1. [ ] `.env.local`에 `GITHUB_TOKEN` 설정
2. [ ] `./scripts/git/setup-credentials.sh` 실행
3. [ ] `git push` 테스트
4. [ ] 성공 시 커밋 및 푸시

### 💡 추가 팁

- SSH 키 방식도 가능하지만 WSL 환경에서는 HTTPS + PAT 권장
- GitHub CLI (`gh`) 설치 시 자동 인증 관리 가능
- 여러 계정 사용 시 git config의 includeIf 활용