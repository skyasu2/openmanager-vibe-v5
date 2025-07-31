# 🔐 시크릿 관리 가이드

> 민감한 정보가 GitHub에 노출되지 않도록 관리하는 방법

## ⚠️ 시크릿 노출 방지 원칙

### 1. 절대 하드코딩 금지

```bash
# ❌ 잘못된 예
const API_KEY = "ghp_1234567890abcdefghij1234567890abcdef";

# ✅ 올바른 예
const API_KEY = process.env.GITHUB_TOKEN;
```

### 2. 환경변수 사용

```bash
# .env.local (절대 커밋하지 않음)
GITHUB_TOKEN=[실제 토큰 값]
TAVILY_API_KEY=[실제 토큰 값]
GOOGLE_AI_API_KEY=[실제 토큰 값]
```

### 3. 문서에서 시크릿 마스킹

```markdown
# ❌ 잘못된 예

GITHUB_TOKEN=ghp_1234567890abcdefghij1234567890abcdef

# ✅ 올바른 예

GITHUB_TOKEN=[환경변수에서 설정]
GITHUB_TOKEN=ghp_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

## 🛡️ 사전 방지 도구

### 1. Pre-commit Hook

```bash
# .husky/pre-commit
bash scripts/security/check-secrets-in-docs.sh
```

### 2. 시크릿 검사 스크립트

- `scripts/check-hardcoded-secrets.sh`: 소스 코드 검사
- `scripts/security/check-secrets-in-docs.sh`: 문서 파일 검사

### 3. .gitignore 활용

```gitignore
# 환경변수 파일
.env
.env.local
.env.*.local

# 백업 파일
*.backup
*.bak
*-backup/

# 민감한 설정
*-local.json
*-secret.json
```

## 🚨 실수했을 때 대처법

### 1. 즉시 커밋 취소

```bash
# 아직 푸시하지 않은 경우
git reset --soft HEAD~1
git rm --cached 문제파일
git commit -m "fix: 민감한 정보 제거"
```

### 2. 이미 푸시한 경우

```bash
# 1. 파일 수정 및 재커밋
git rm --cached 문제파일
echo "문제파일" >> .gitignore
git commit -m "fix: 민감한 정보 제거"

# 2. 히스토리 정리 (BFG 추천)
bfg --delete-files 문제파일 --no-blob-protection
git push --force

# 3. GitHub에서 시크릿 무효화
# - 노출된 토큰 즉시 폐기
# - 새 토큰 발급
```

## 📋 체크리스트

### 커밋 전 확인사항

- [ ] 환경변수 파일이 .gitignore에 포함되어 있는가?
- [ ] 소스 코드에 하드코딩된 시크릿이 없는가?
- [ ] 문서 파일에 실제 토큰이 포함되어 있지 않은가?
- [ ] 백업 파일이나 임시 파일이 포함되어 있지 않은가?

### 정기 점검사항

- [ ] 주 1회 시크릿 검사 스크립트 실행
- [ ] 분기별 GitHub Secret Scanning 결과 확인
- [ ] 연 2회 모든 API 토큰 갱신

## 🔍 검사 명령어

```bash
# 전체 프로젝트 시크릿 검사
bash scripts/check-hardcoded-secrets.sh
bash scripts/security/check-secrets-in-docs.sh

# 특정 파일 검사
grep -E "ghp_[A-Za-z0-9]{36}|AIza[A-Za-z0-9-_]{35}|tvly-[A-Za-z0-9-]{36}" 파일명

# Git 히스토리 검사
git log -p | grep -E "ghp_|AIza|tvly-|sbp_|sk-"
```

## 📚 참고 자료

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [GitHub Push Protection](https://docs.github.com/en/code-security/secret-scanning/push-protection)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [git-filter-repo](https://github.com/newren/git-filter-repo/)

---

⚡ **기억하세요**: 시크릿은 한 번 노출되면 되돌릴 수 없습니다. 사전 예방이 최선입니다!
