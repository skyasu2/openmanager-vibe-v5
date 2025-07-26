# 🔒 토큰 노출 방지 가이드

## 개요

GitHub 푸시 보호 기능은 실제 토큰이 커밋에 포함되는 것을 차단합니다. 이 문서는 토큰 노출을 방지하기 위한 완벽한 가이드입니다.

## 🚨 GitHub Push Protection 이해하기

### 왜 로컬 검사는 통과했는데 GitHub에서 차단되었나?

1. **검사 범위 차이**:
   - 로컬: 특정 파일 타입만 검사 (코드 파일 위주)
   - GitHub: 모든 파일과 전체 커밋 히스토리 검사

2. **패턴 인식 차이**:
   - 로컬: 단순 정규식 매칭
   - GitHub: AI 기반 고급 패턴 인식

3. **제외 파일 차이**:
   - 로컬: 문서 파일(.md) 제외했었음
   - GitHub: 모든 파일 검사

## 🛡️ 토큰 노출 방지 시스템

### 1. Pre-commit Hook 강화

`.husky/pre-commit` 파일이 다음을 수행합니다:

- 코드 파일 시크릿 검사
- 문서 파일 시크릿 검사
- 통합 보안 검사

### 2. 검사 스크립트

#### `scripts/check-hardcoded-secrets.sh`

- 소스 코드의 하드코딩된 시크릿 검사
- 환경변수 사용 권장

#### `scripts/check-secrets-in-docs.sh`

- 문서 파일의 실제 토큰 검사
- [REDACTED] 사용 확인

#### `scripts/check-all-secrets.sh`

- 모든 파일 통합 검사
- GitHub과 동일한 패턴 사용

### 3. 실행 방법

```bash
# 수동으로 전체 검사 실행
npm run security:check

# 또는 개별 스크립트 실행
bash scripts/check-all-secrets.sh
```

## 📝 안전한 코드 작성 규칙

### 1. 환경변수 사용

```typescript
// ❌ 절대 하지 마세요
const apiKey = 'AIzaSyA1234567890abcdef1234567890abcdef';

// ✅ 올바른 방법
const apiKey = process.env.GOOGLE_AI_API_KEY;
```

### 2. 문서 작성 시

```markdown
# ❌ 실제 토큰 노출

GITHUB_TOKEN=ghp_abcd1234efgh5678... (실제 40자 토큰)

# ✅ 안전한 예시

GITHUB*TOKEN=ghp*[REDACTED]

# 또는

GITHUB_TOKEN=YOUR_GITHUB_TOKEN_PLACEHOLDER
```

### 3. 테스트 코드

```typescript
// ❌ 실제처럼 보이는 토큰
const mockToken = 'ghp_1234567890abcdef...';

// ✅ 명확한 모의 값
const mockToken = 'MOCK_GITHUB_TOKEN_FOR_TESTING';
```

## 🔍 토큰이 노출되었을 때

### 즉시 해야 할 일

1. **토큰 무효화**:
   - GitHub: Settings → Developer settings → Personal access tokens
   - Google Cloud: Console → APIs & Services → Credentials
   - Supabase: Project Settings → API

2. **Git 히스토리 정리**:

   ```bash
   # 최근 커밋 수정
   git reset --soft HEAD~1
   git commit -m "fix: remove exposed token"

   # 또는 히스토리 재작성 (주의!)
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch path/to/file" \
     --prune-empty --tag-name-filter cat -- --all
   ```

3. **새 토큰 생성 및 업데이트**:
   ```bash
   # 환경변수 업데이트
   echo "GITHUB_TOKEN=ghp_newtoken" >> .env.local
   ```

## 🎯 Best Practices

### 1. 정기적인 검사

```json
// package.json에 추가
{
  "scripts": {
    "security:check": "bash scripts/check-all-secrets.sh",
    "precommit": "npm run security:check"
  }
}
```

### 2. 팀 교육

- 새 팀원에게 이 가이드 공유
- 정기적인 보안 리뷰
- 실수 사례 공유 및 학습

### 3. 자동화

- CI/CD 파이프라인에 보안 검사 추가
- GitHub Actions로 PR 검사
- 정기적인 저장소 스캔

## 📊 검사 패턴 목록

우리 시스템이 검사하는 토큰 패턴:

| 서비스     | 패턴                      | 예시              |
| ---------- | ------------------------- | ----------------- |
| GitHub PAT | `ghp_[A-Za-z0-9]{36}`     | ghp\_[REDACTED]   |
| Google AI  | `AIza[A-Za-z0-9-_]{35}`   | AIza[REDACTED]    |
| Supabase   | `sbp_[a-f0-9]{48}`        | sbp\_[REDACTED]   |
| OpenAI     | `sk-[A-Za-z0-9]{48}`      | sk-[REDACTED]     |
| Anthropic  | `sk-ant-[A-Za-z0-9-]{95}` | sk-ant-[REDACTED] |

## ✅ 체크리스트

커밋 전 확인사항:

- [ ] 환경변수 파일(.env.local)이 .gitignore에 포함되어 있는가?
- [ ] 코드에 하드코딩된 시크릿이 없는가?
- [ ] 문서에 실제 토큰이 포함되어 있지 않은가?
- [ ] 테스트 코드에 실제처럼 보이는 토큰이 없는가?
- [ ] `npm run security:check`가 통과하는가?

## 🚀 결론

토큰 노출은 심각한 보안 위협입니다. 이 가이드를 따라 안전한 개발 환경을 유지하세요.

**기억하세요**: 의심스러우면 [REDACTED] 사용!

---

_최종 업데이트: 2025년 7월 26일_
