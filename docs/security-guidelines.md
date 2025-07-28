# 🔐 보안 가이드라인

프로젝트에서 민감한 정보 노출을 방지하기 위한 필수 가이드라인입니다.

## ⚠️ 중요: GitHub Secret Scanning 방지

### 🚨 절대 커밋하면 안 되는 정보

1. **API 키 및 토큰**
   - GitHub Personal Access Token (`ghp_*`)
   - Google AI API Key (`AIza*`)
   - Supabase Service Key (JWT 토큰)
   - Tavily API Key (`tvly-*`)
   - OpenAI API Key (`sk-*`)
   - 기타 모든 실제 API 키

2. **인증 정보**
   - 비밀번호
   - 프라이빗 키
   - 인증서
   - OAuth 시크릿

3. **서버 정보**
   - 실제 데이터베이스 URL (마스킹 필요)
   - 내부 서버 IP
   - 포트 번호 (공개되지 않은 경우)

## ✅ 안전한 사용 방법

### 1. 환경변수 사용

```bash
# ✅ 올바른 방법 - .env.local
GOOGLE_AI_API_KEY=your_actual_key_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_key_here
```

```javascript
// ✅ 코드에서 환경변수 사용
const apiKey = process.env.GOOGLE_AI_API_KEY || '[REDACTED]';
const supabaseUrl = process.env.SUPABASE_URL || 'https://*****.supabase.co';
```

### 2. 문서에서 마스킹 처리

```markdown
<!-- ✅ 올바른 방법 -->

GITHUB*TOKEN=ghp***\* ✅
SUPABASE_URL=https://\*\*\***.supabase.co ✅
TAVILY_API_KEY=tvly-\*\*\* ✅

<!-- ❌ 잘못된 방법 -->

GITHUB_TOKEN=ghp_actualTokenShouldNeverBeCommitted
```

### 3. 예시 코드에서 플레이스홀더 사용

```javascript
// ✅ 올바른 방법
const apiKey = 'YOUR_GOOGLE_AI_API_KEY_PLACEHOLDER';
const token = 'ghp_1234567890abcdef...';
const mockKey = 'MOCK_API_KEY_FOR_TESTING';

// ❌ 잘못된 방법
const apiKey = 'AIzaSyDrealApiKeyHere123456789';
```

## 🛡️ 자동 보안 검사

### Pre-commit 훅 활성화

```bash
# 보안 검사 실행
npm run security:secrets

# 전체 보안 검사
npm run security:check
npm run security:check-docs
npm run security:check-code
```

### 보안 검사 스크립트

- `security:secrets`: 모든 파일에서 실제 토큰 패턴 검사
- `security:check-docs`: 문서 파일의 시크릿 검사
- `security:check-code`: 소스 코드의 하드코딩된 시크릿 검사

## 🔧 .gitignore 설정

다음 패턴들이 자동으로 무시됩니다:

```gitignore
# 환경변수 파일
.env
.env.local
.env.*.local
.env.backup

# API 키 및 토큰 파일
**/secrets.*
**/api-keys.*
**/tokens.*
**/*secret*
**/*token*
**/*credential*

# 백업 파일
*.backup
*.bak
*.tmp
*_backup
*_bak
*.orig

# 개발자 개인 설정
.vscode/settings.json
.claude/personal/
.claude/private/
```

## 🚨 실수했을 때 대처 방법

### 1. 커밋 전 발견한 경우

```bash
# 파일에서 시크릿 제거
# 환경변수로 이동 또는 [REDACTED] 처리

# 다시 커밋
git add .
git commit -m "fix: remove hardcoded secrets"
```

### 2. 커밋 후 발견한 경우

```bash
# 즉시 API 키 교체 (GitHub, Google AI 등)
# 파일 수정 후 새 커밋
git add .
git commit -m "security: mask sensitive information in docs"
```

### 3. 푸시 후 GitHub에서 차단된 경우

1. GitHub 알림 링크에서 시크릿 허용 (임시)
2. 해당 API 키 즉시 재생성
3. 파일에서 시크릿 제거 후 새 커밋
4. 강제 푸시 필요시: `git push --force-with-lease`

## 📋 체크리스트

커밋 전 다음 사항을 확인하세요:

- [ ] 실제 API 키가 코드에 없는가?
- [ ] 문서에 실제 토큰이 노출되지 않았는가?
- [ ] 환경변수를 올바르게 사용했는가?
- [ ] `npm run security:secrets`가 통과하는가?
- [ ] .env.local 파일이 .gitignore에 포함되어 있는가?

## 🎯 권장사항

1. **개발 시작 전**: 환경변수 설정 완료
2. **코딩 중**: 절대 실제 키 하드코딩 금지
3. **커밋 전**: 보안 검사 스크립트 실행
4. **문서 작성 시**: 항상 마스킹 처리
5. **예시 코드**: 플레이스홀더 또는 MOCK 사용

---

💡 **기억하세요**: 한 번 GitHub에 푸시된 시크릿은 영구적으로 기록됩니다. 예방이 최선입니다!
