# 🔐 환경변수 보안 가이드

> **최종 업데이트**: 2025년 7월 16일  
> **중요도**: 🔴 필수 준수 사항

## 📋 환경변수 관리 원칙

### 1. 절대 하지 말아야 할 것 ❌

- API 키, 토큰, 비밀번호를 코드에 하드코딩
- `.env.local` 파일을 Git에 커밋
- 실제 환경변수 값을 문서에 포함
- 백업 파일에 실제 토큰 저장
- 팀원과 환경변수 파일 직접 공유

### 2. 항상 해야 할 것 ✅

- `.env.example` 템플릿 사용
- `.gitignore`에 환경변수 파일 포함
- 환경변수는 로컬에서만 관리
- 정기적인 토큰 로테이션
- 커밋 전 민감한 정보 검토

## 🛠️ 올바른 설정 방법

### Step 1: 환경변수 파일 생성

```bash
# 템플릿에서 로컬 파일 생성
cp .env.example .env.local

# 편집기로 열어서 실제 값 입력
code .env.local  # 또는 원하는 편집기 사용
```

### Step 2: Git 추적 제외 확인

```bash
# .gitignore에 포함되어 있는지 확인
grep ".env" .gitignore

# 이미 추적 중인 파일 제거
git rm --cached .env.local
git rm --cached .mcp.json
```

### Step 3: MCP 서버와 환경변수 연동

#### 방법 1: Claude Code 시작 시 환경변수 전달

```bash
# Windows PowerShell
$env:GITHUB_TOKEN="your_token"; $env:TAVILY_API_KEY="your_key"; claude

# macOS/Linux
GITHUB_TOKEN="your_token" TAVILY_API_KEY="your_key" claude
```

#### 방법 2: MCP 서버 개별 설정

```bash
# GitHub MCP
claude mcp add github -e GITHUB_TOKEN="$GITHUB_TOKEN" -- npx -y @modelcontextprotocol/server-github

# Tavily MCP
claude mcp add tavily -e TAVILY_API_KEY="$TAVILY_API_KEY" -- npx -y tavily-mcp

# Supabase MCP
claude mcp add supabase \
  -e SUPABASE_URL="$SUPABASE_URL" \
  -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
  -- npx -y @supabase/mcp-server-supabase
```

## 🔍 환경변수 로드 확인

### 환경변수 테스트 스크립트

```javascript
// scripts/check-env.js
const required = [
  'GITHUB_TOKEN',
  'TAVILY_API_KEY',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

const missing = required.filter((key) => !process.env[key]);

if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing);
  process.exit(1);
} else {
  console.log('✅ All required environment variables are set');
}
```

### 실행

```bash
node scripts/check-env.js
```

## 🔄 토큰 로테이션 가이드

### 정기 로테이션 일정

- **GitHub Token**: 90일마다
- **API Keys**: 6개월마다
- **OAuth Secrets**: 1년마다
- **Database Passwords**: 3개월마다

### 로테이션 프로세스

1. 새 토큰/키 생성
2. `.env.local` 업데이트
3. 애플리케이션 재시작
4. 정상 작동 확인
5. 이전 토큰 무효화

## 🚨 보안 사고 대응

### 토큰 노출 시 즉시 조치

1. **즉시 토큰 무효화**

   ```bash
   # GitHub: Settings → Developer settings → Revoke token
   # Supabase: Dashboard → API → Regenerate keys
   # Tavily: Dashboard → API Keys → Delete & Create new
   ```

2. **새 토큰 생성 및 적용**
3. **보안 감사 실행**
4. **팀원 알림**

## 📊 환경변수 관리 도구

### 1. dotenv-vault (팀 협업용)

```bash
# 설치
npm install -g dotenv-vault

# 초기화
dotenv-vault new

# 환경변수 암호화
dotenv-vault push

# 팀원이 받기
dotenv-vault pull
```

### 2. 1Password CLI (개인용)

```bash
# 환경변수를 1Password에 저장
op item create --category=password --title="OpenManager ENV" \
  --vault="Development" GITHUB_TOKEN="your_token"

# 사용 시 로드
eval $(op item get "OpenManager ENV" --format=json | jq -r '.fields[] | "export \(.label)=\(.value)"')
```

## 🔒 보안 모범 사례

### 1. 최소 권한 원칙

- 필요한 권한만 부여
- 읽기 전용 토큰 우선 사용
- 범위(scope) 제한

### 2. 환경별 분리

```
.env.local          # 로컬 개발
.env.staging        # 스테이징 환경
.env.production     # 프로덕션 (절대 커밋 금지)
```

### 3. 암호화 저장

```bash
# 민감한 값 암호화
openssl enc -aes-256-cbc -salt -in .env.local -out .env.local.enc

# 복호화
openssl enc -aes-256-cbc -d -in .env.local.enc -out .env.local
```

## 📝 체크리스트

### 프로젝트 시작 시

- [ ] `.env.example`에서 `.env.local` 생성
- [ ] 필요한 환경변수 값 입력
- [ ] `.gitignore` 확인
- [ ] 환경변수 로드 테스트

### 커밋 전

- [ ] `git status`로 환경변수 파일 확인
- [ ] 코드에 하드코딩된 값 검색
- [ ] PR에 민감한 정보 포함 여부 확인

### 정기 점검 (월 1회)

- [ ] 사용하지 않는 토큰 삭제
- [ ] 토큰 권한 검토
- [ ] 로테이션 일정 확인
- [ ] 보안 로그 검토

---

**관련 문서**:

- [보안 가이드라인](./security-guidelines.md)
- [MCP 설정 가이드](../MCP-GUIDE.md)
- [보안 전체 가이드](./security-complete-guide.md)
