# 🔐 인증 및 보안 설정 완전 가이드

> **통합 인증 & 보안 관리 시스템**  
> 최종 업데이트: 2025-08-16  
> 중요도: 🔴 필수 준수 사항

## 🎯 개요

OpenManager VIBE v5의 모든 인증 시스템(GitHub OAuth, Supabase Auth, SSH Keys)과 보안 설정(환경변수, API 키, 토큰 관리)을 통합적으로 관리하는 완전 가이드입니다.

## 📋 목차

1. [보안 원칙](#보안-원칙)
2. [환경변수 보안 관리](#환경변수-보안-관리)
3. [GitHub OAuth 설정](#github-oauth-설정)
4. [Supabase 인증 구성](#supabase-인증-구성)
5. [SSH 키 관리](#ssh-키-관리)
6. [Git 인증 설정](#git-인증-설정)
7. [MCP 서버 보안](#mcp-서버-보안)
8. [토큰 로테이션](#토큰-로테이션)
9. [보안 모니터링](#보안-모니터링)
10. [사고 대응](#사고-대응)

## 🔒 보안 원칙

### 절대 하지 말아야 할 것 ❌

- **API 키, 토큰, 비밀번호를 코드에 하드코딩**
- **`.env.local` 파일을 Git에 커밋**
- **실제 환경변수 값을 문서에 포함**
- **백업 파일에 실제 토큰 저장**
- **팀원과 환경변수 파일 직접 공유**
- **서비스 키를 클라이언트에 노출**
- **테스트 코드에 실제 API 키 사용**

### 항상 해야 할 것 ✅

- **`.env.example` 템플릿 사용**
- **`.gitignore`에 환경변수 파일 포함**
- **환경변수는 로컬에서만 관리**
- **정기적인 토큰 로테이션**
- **커밋 전 민감한 정보 검토**
- **최소 권한 원칙 적용**
- **환경별 설정 분리**

## 🔧 환경변수 보안 관리

### 1단계: 환경변수 파일 생성

```bash
# WSL 터미널에서 실행
cd /mnt/d/cursor/openmanager-vibe-v5

# 템플릿에서 로컬 파일 생성
cp .env.local.template .env.local

# 권한 설정 (읽기 전용)
chmod 600 .env.local

# WSL 전용 환경변수 추가
cat >> .env.local << 'EOF'

# WSL 개발 환경 전용
NODE_ENV=development
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# AI API 키들 (실제 값으로 교체)
CLAUDE_API_KEY=your-claude-api-key
GOOGLE_AI_API_KEY=your-google-ai-key
OPENAI_API_KEY=your-openai-api-key

# 보안 설정
SECURE_MODE=true
DEBUG_AUTH=false
EOF
```

### 2단계: Git 추적 제외 확인

```bash
# .gitignore 확인
grep -E "\.env|\.mcp\.json" .gitignore

# 이미 추적 중인 파일 제거
git rm --cached .env.local 2>/dev/null || true
git rm --cached .mcp.json 2>/dev/null || true

# 추가 보안 파일들 제외
echo "
# 추가 보안 파일들
.env.wsl
.env.backup
*.key
*.pem
credentials.json
" >> .gitignore
```

### 3단계: 환경변수 유효성 검증

```javascript
// scripts/security/check-env-security.js
const fs = require('fs');
const path = require('path');

const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
];

const optionalEnvVars = [
  'GOOGLE_AI_API_KEY',
  'CLAUDE_API_KEY',
  'OPENAI_API_KEY',
  'TAVILY_API_KEY',
];

function checkEnvironmentSecurity() {
  console.log('🔍 환경변수 보안 검사 시작...\n');

  // 필수 환경변수 확인
  const missingRequired = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingRequired.length > 0) {
    console.error('❌ 필수 환경변수 누락:', missingRequired);
    return false;
  }

  // 선택적 환경변수 확인
  const missingOptional = optionalEnvVars.filter((key) => !process.env[key]);

  if (missingOptional.length > 0) {
    console.warn('⚠️  선택적 환경변수 누락:', missingOptional);
  }

  // 보안 위험 검사
  const securityIssues = [];

  // 기본값 사용 검사
  if (process.env.GITHUB_CLIENT_SECRET === 'your-github-client-secret') {
    securityIssues.push('GitHub Client Secret이 기본값입니다');
  }

  // 키 길이 검사
  if (
    process.env.SUPABASE_SERVICE_ROLE_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY.length < 100
  ) {
    securityIssues.push('Supabase Service Role Key가 너무 짧습니다');
  }

  if (securityIssues.length > 0) {
    console.error('🚨 보안 위험 발견:');
    securityIssues.forEach((issue) => console.error(`  - ${issue}`));
    return false;
  }

  console.log('✅ 모든 환경변수 보안 검사 통과');
  return true;
}

module.exports = { checkEnvironmentSecurity };

if (require.main === module) {
  process.exit(checkEnvironmentSecurity() ? 0 : 1);
}
```

### 4단계: 환경별 설정 매트릭스

| 환경변수                  | 개발 (WSL)     | 테스트          | 프로덕션           | 보안 수준 |
| ------------------------- | -------------- | --------------- | ------------------ | --------- |
| NODE_ENV                  | development    | test            | production         | 공개      |
| NEXT_PUBLIC_SITE_URL      | localhost:3000 | test.vercel.app | vibe-v5.vercel.app | 공개      |
| SUPABASE_URL              | 실제 URL       | 실제 URL        | 실제 URL           | 공개      |
| SUPABASE_ANON_KEY         | 실제 키        | 실제 키         | 실제 키            | 공개      |
| SUPABASE_SERVICE_ROLE_KEY | 실제 키        | 실제 키         | 실제 키            | 🔴 기밀   |
| GITHUB_CLIENT_SECRET      | 실제 키        | 실제 키         | 실제 키            | 🔴 기밀   |
| AI API KEYS               | 개발용         | 테스트용        | 프로덕션용         | 🔴 기밀   |

## 🐙 GitHub OAuth 설정

### 1단계: GitHub OAuth App 생성

1. **GitHub 설정 접속**
   - https://github.com/settings/developers
   - "OAuth Apps" → "New OAuth App"

2. **애플리케이션 정보 입력**

   ```
   Application name: OpenManager VIBE v5
   Homepage URL: https://openmanager-vibe-v5.vercel.app
   Authorization callback URL: https://[PROJECT_REF].supabase.co/auth/v1/callback
   ```

3. **Client ID/Secret 복사**
   - Client ID → `GITHUB_CLIENT_ID`
   - Client Secret → `GITHUB_CLIENT_SECRET`

### 2단계: GitHub OAuth 환경변수 설정

```bash
# .env.local에 추가
cat >> .env.local << 'EOF'

# GitHub OAuth 설정
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# GitHub Personal Access Token (MCP 서버용)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-personal-access-token
EOF
```

### 3단계: GitHub OAuth 권한 범위 설정

```typescript
// src/lib/auth/github-config.ts
export const githubOAuthConfig = {
  scopes: [
    'read:user', // 사용자 기본 정보
    'user:email', // 이메일 주소
    'repo', // 공개/비공개 저장소 접근 (선택적)
  ],
  allowSignup: true, // 새 계정 생성 허용
  prompt: 'consent', // 명시적 동의 요청
};
```

## 🗃️ Supabase 인증 구성

### 1단계: Supabase 프로젝트 설정

```bash
# Supabase CLI 설치 (WSL)
sudo npm install -g supabase

# 프로젝트 초기화
supabase init

# 로컬 개발 환경 시작
supabase start
```

### 2단계: Supabase URL 구성

1. **Supabase 대시보드 접속**
   - https://app.supabase.com
   - 프로젝트 선택 → Settings → API

2. **Redirect URLs 설정**

   ```
   # Authentication → URL Configuration

   # 로컬 개발
   http://localhost:3000/auth/callback
   http://localhost:3000

   # Vercel 프리뷰
   https://*.vercel.app/auth/callback
   https://*.vercel.app

   # Vercel 프로덕션
   https://openmanager-vibe-v5.vercel.app/auth/callback
   https://openmanager-vibe-v5.vercel.app
   ```

3. **Site URL 설정**
   ```
   Site URL: https://openmanager-vibe-v5.vercel.app
   ```

### 3단계: Supabase 환경변수 설정

```bash
# .env.local에 Supabase 설정 추가
cat >> .env.local << 'EOF'

# Supabase 인증 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT 시크릿 (선택적, 고급 설정)
SUPABASE_JWT_SECRET=your-jwt-secret
EOF
```

### 4단계: Supabase 인증 헬퍼 설정

```typescript
// src/lib/auth/supabase-client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/database';

export const supabase = createClientComponentClient<Database>();

// 세션 상태 확인
export async function getSession() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// 로그아웃
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
```

## 🔑 SSH 키 관리

### 1단계: SSH 키 생성 (WSL 환경)

```bash
# WSL에서 SSH 키 생성
cd ~
ssh-keygen -t ed25519 -C "your.email@example.com" -f ~/.ssh/id_ed25519_github

# SSH 에이전트 시작
eval "$(ssh-agent -s)"

# 키 추가
ssh-add ~/.ssh/id_ed25519_github

# 공개 키 복사
cat ~/.ssh/id_ed25519_github.pub
```

### 2단계: GitHub SSH 키 등록

1. **GitHub 설정 접속**
   - https://github.com/settings/keys
   - "New SSH key" 클릭

2. **키 정보 입력**
   ```
   Title: WSL OpenManager Development
   Key: [공개 키 내용 붙여넣기]
   ```

### 3단계: SSH 구성 파일 설정

```bash
# SSH 구성 파일 생성
cat > ~/.ssh/config << 'EOF'
# GitHub 개발용
Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes

# GitHub 개발용 별칭
Host github-dev
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_ed25519_github
  IdentitiesOnly yes
EOF

# 권한 설정
chmod 600 ~/.ssh/config
chmod 600 ~/.ssh/id_ed25519_github
chmod 644 ~/.ssh/id_ed25519_github.pub
```

### 4단계: SSH 연결 테스트

```bash
# GitHub SSH 연결 테스트
ssh -T git@github.com

# 성공 메시지: "Hi username! You've successfully authenticated..."

# Git remote URL을 SSH로 변경
cd /mnt/d/cursor/openmanager-vibe-v5
git remote set-url origin git@github.com:skyasu2/openmanager-vibe-v5.git

# 연결 확인
git remote -v
```

## 🔐 Git 인증 설정

### 1단계: Git 사용자 정보 설정

```bash
# 전역 Git 설정
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# 프로젝트별 설정 (선택적)
cd /mnt/d/cursor/openmanager-vibe-v5
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

### 2단계: Git Credential 관리

```bash
# Credential Helper 설정 (HTTPS 사용 시)
git config --global credential.helper store

# 또는 Git Credential Manager (권장)
git config --global credential.helper manager-core

# WSL에서 Windows Credential Manager 사용
git config --global credential.helper "/mnt/c/Program\ Files/Git/mingw64/bin/git-credential-manager.exe"
```

### 3단계: Personal Access Token 설정

1. **GitHub Token 생성**
   - https://github.com/settings/tokens
   - "Generate new token (classic)"
   - 권한 선택: `repo`, `workflow`, `read:user`

2. **Token 사용 설정**
   ```bash
   # HTTPS 사용 시 (Token을 비밀번호로 사용)
   git push origin main
   # Username: your-github-username
   # Password: your-personal-access-token
   ```

### 4단계: Git Hooks 보안 설정

```bash
# Husky 훅에 보안 검사 추가
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 민감한 정보 검사
if grep -r "sk-.*" --exclude-dir=node_modules --exclude-dir=.git . ; then
  echo "❌ API 키가 발견되었습니다. 커밋을 중단합니다."
  exit 1
fi

# lint-staged 실행
npx lint-staged
EOF

chmod +x .husky/pre-commit
```

## 🔌 MCP 서버 보안

### 1단계: MCP 환경변수 보안 설정

```bash
# MCP 전용 환경변수 파일
cat > .env.mcp << 'EOF'
# MCP 서버 전용 환경변수 (Git 추적 제외)
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your-token
TAVILY_API_KEY=tvly-your-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GCP_SERVICE_ACCOUNT_KEY=your-gcp-key
EOF

chmod 600 .env.mcp
```

### 2단계: MCP 서버별 권한 설정

```json
// .mcp.json (보안 강화 버전)
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "@modelcontextprotocol/server-filesystem",
        "/mnt/d/cursor/openmanager-vibe-v5"
      ],
      "disabled": false
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_PERSONAL_ACCESS_TOKEN}"
      },
      "disabled": false
    },
    "supabase": {
      "command": "npx",
      "args": ["mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "${SUPABASE_URL}",
        "SUPABASE_SERVICE_ROLE_KEY": "${SUPABASE_SERVICE_ROLE_KEY}"
      },
      "disabled": false
    },
    "tavily": {
      "command": "npx",
      "args": ["tavily-mcp"],
      "env": {
        "TAVILY_API_KEY": "${TAVILY_API_KEY}"
      },
      "disabled": false
    }
  }
}
```

### 3단계: MCP 보안 검증 스크립트

```bash
# scripts/security/validate-mcp-security.sh
#!/bin/bash

echo "🔍 MCP 서버 보안 검증 시작..."

# 환경변수 로드 확인
if [ ! -f .env.mcp ]; then
    echo "❌ .env.mcp 파일이 없습니다."
    exit 1
fi

source .env.mcp

# 필수 토큰 확인
required_vars=("GITHUB_PERSONAL_ACCESS_TOKEN" "SUPABASE_SERVICE_ROLE_KEY")

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ $var 환경변수가 설정되지 않았습니다."
        exit 1
    fi
done

# 토큰 유효성 검사 (GitHub)
if ! curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
     https://api.github.com/user > /dev/null; then
    echo "❌ GitHub Personal Access Token이 유효하지 않습니다."
    exit 1
fi

echo "✅ MCP 서버 보안 검증 완료"
```

## 🔄 토큰 로테이션

### 정기 로테이션 일정

| 토큰 유형                    | 로테이션 주기 | 우선순위 | 영향도          |
| ---------------------------- | ------------- | -------- | --------------- |
| GitHub Personal Access Token | 90일          | 높음     | MCP 서버        |
| Supabase Service Role Key    | 6개월         | 중간     | 데이터베이스    |
| OAuth Client Secret          | 1년           | 낮음     | 사용자 인증     |
| AI API Keys                  | 6개월         | 중간     | AI 서비스       |
| GCP Service Account          | 1년           | 낮음     | 클라우드 인프라 |

### 자동 로테이션 스크립트

```bash
# scripts/security/rotate-tokens.sh
#!/bin/bash

echo "🔄 토큰 로테이션 프로세스 시작..."

# 현재 날짜
current_date=$(date +%Y-%m-%d)

# 백업 디렉토리 생성
backup_dir="backups/tokens/$current_date"
mkdir -p "$backup_dir"

# 현재 환경변수 백업
cp .env.local "$backup_dir/env.local.backup"
cp .env.mcp "$backup_dir/env.mcp.backup"

echo "✅ 현재 설정 백업 완료: $backup_dir"

# 새 토큰 생성 안내
echo "🔑 새 토큰 생성 가이드:"
echo "1. GitHub: https://github.com/settings/tokens"
echo "2. Supabase: https://app.supabase.com → API Settings"
echo "3. Google AI: https://aistudio.google.com/app/apikey"

# 토큰 교체 확인
read -p "새 토큰들을 생성하고 .env.local을 업데이트했습니까? (y/N): " confirm

if [[ $confirm == [yY] ]]; then
    echo "🧪 새 토큰 유효성 검사 중..."

    # 환경변수 보안 검사 실행
    if node scripts/security/check-env-security.js; then
        echo "✅ 토큰 로테이션 완료"

        # 이전 토큰 무효화 안내
        echo "⚠️  이전 토큰들을 무효화하는 것을 잊지 마세요!"
    else
        echo "❌ 새 토큰 유효성 검사 실패"
        echo "백업에서 복구하려면: cp $backup_dir/env.local.backup .env.local"
        exit 1
    fi
else
    echo "토큰 로테이션이 취소되었습니다."
fi
```

## 📊 보안 모니터링

### 1단계: 보안 감사 로그

```typescript
// src/lib/security/audit-logger.ts
export class SecurityAuditLogger {
  private static logFile = 'logs/security-audit.log';

  static logAuthEvent(event: string, userId?: string, metadata?: any) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      userId,
      metadata,
      ip: this.getClientIP(),
      userAgent: this.getUserAgent(),
    };

    // 로그 파일에 기록
    fs.appendFileSync(this.logFile, JSON.stringify(logEntry) + '\n');
  }

  static logSecurityAlert(level: 'low' | 'medium' | 'high', message: string) {
    this.logAuthEvent('SECURITY_ALERT', undefined, { level, message });

    if (level === 'high') {
      // 즉시 알림 발송
      this.sendSecurityAlert(message);
    }
  }

  private static sendSecurityAlert(message: string) {
    // Discord, Slack, 이메일 등으로 알림
    console.error(`🚨 보안 경고: ${message}`);
  }
}
```

### 2단계: 실시간 보안 모니터링

```bash
# scripts/security/monitor-security.sh
#!/bin/bash

echo "🔍 실시간 보안 모니터링 시작..."

# 로그 파일 모니터링
tail -f logs/security-audit.log | while read line; do
    # 의심스러운 활동 감지
    if echo "$line" | grep -q "FAILED_LOGIN\|SECURITY_ALERT"; then
        echo "⚠️  보안 이벤트 감지: $line"
    fi
done &

# Git 저장소 무결성 검사
git fsck --full

# 환경변수 파일 권한 검사
for file in .env.local .env.mcp; do
    if [ -f "$file" ]; then
        perm=$(stat -c %a "$file")
        if [ "$perm" != "600" ]; then
            echo "❌ $file 권한이 올바르지 않습니다: $perm (권장: 600)"
        fi
    fi
done

echo "✅ 보안 모니터링 설정 완료"
```

### 3단계: 보안 대시보드

```typescript
// src/components/security/SecurityDashboard.tsx
export function SecurityDashboard() {
  const [securityMetrics, setSecurityMetrics] = useState({
    lastTokenRotation: '',
    failedLoginAttempts: 0,
    activeTokens: 0,
    securityAlerts: [],
  });

  return (
    <div className="security-dashboard">
      <h2>🔐 보안 대시보드</h2>

      <div className="metrics-grid">
        <div className="metric">
          <h3>마지막 토큰 로테이션</h3>
          <p>{securityMetrics.lastTokenRotation}</p>
        </div>

        <div className="metric">
          <h3>실패한 로그인 시도</h3>
          <p className={securityMetrics.failedLoginAttempts > 10 ? 'alert' : ''}>
            {securityMetrics.failedLoginAttempts}
          </p>
        </div>

        <div className="metric">
          <h3>활성 토큰 수</h3>
          <p>{securityMetrics.activeTokens}</p>
        </div>
      </div>

      <div className="security-alerts">
        <h3>🚨 보안 알림</h3>
        {securityMetrics.securityAlerts.map((alert, index) => (
          <div key={index} className={`alert alert-${alert.level}`}>
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
}
```

## 🚨 사고 대응

### 즉시 대응 체크리스트

#### 토큰 노출 시 (긴급)

1. **즉시 토큰 무효화** (5분 이내)

   ```bash
   # GitHub Token
   # GitHub → Settings → Developer settings → Personal access tokens → Delete

   # Supabase Keys
   # Supabase Dashboard → Settings → API → Regenerate keys

   # Google AI Key
   # Google AI Studio → API Keys → Delete & Create new
   ```

2. **새 토큰 생성 및 적용** (10분 이내)

   ```bash
   # 새 토큰으로 환경변수 업데이트
   nano .env.local

   # 환경변수 보안 검사
   node scripts/security/check-env-security.js

   # 애플리케이션 재시작
   npm run dev
   ```

3. **보안 감사 실행** (30분 이내)

   ```bash
   # Git 히스토리 검사
   git log --all --grep="token\|key\|secret" -i

   # 코드베이스 스캔
   grep -r "sk-\|ghp_\|tvly-" --exclude-dir=node_modules .

   # 접근 로그 확인
   cat logs/security-audit.log | grep "$(date +%Y-%m-%d)"
   ```

#### 무단 접근 시도 감지

1. **접근 차단**

   ```bash
   # IP 차단 (클라우드플레어/Vercel 설정)
   # 의심스러운 세션 무효화
   ```

2. **로그 분석**

   ```bash
   # 접근 패턴 분석
   cat logs/security-audit.log | jq '.ip' | sort | uniq -c | sort -nr

   # 시간별 접근 분석
   cat logs/security-audit.log | jq '.timestamp' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
   ```

### 복구 프로세스

1. **백업에서 복구**

   ```bash
   # 최신 백업 확인
   ls -la backups/tokens/ | tail -5

   # 안전한 설정으로 복구
   cp backups/tokens/2025-08-15/env.local.backup .env.local
   ```

2. **시스템 재검증**

   ```bash
   # 전체 보안 검사
   bash scripts/security/validate-mcp-security.sh

   # 애플리케이션 테스트
   npm run test:security
   ```

## 📋 보안 체크리스트

### 초기 설정 시

- [ ] `.env.local` 파일 생성 및 권한 설정 (600)
- [ ] `.gitignore`에 환경변수 파일 포함 확인
- [ ] GitHub OAuth App 생성 및 설정
- [ ] Supabase 인증 구성 및 Redirect URL 설정
- [ ] SSH 키 생성 및 GitHub 등록
- [ ] Git 인증 방법 선택 및 설정
- [ ] MCP 서버 환경변수 보안 설정
- [ ] 환경변수 보안 검사 스크립트 실행

### 개발 과정 중

- [ ] 커밋 전 `git status`로 환경변수 파일 확인
- [ ] 코드에 하드코딩된 키/토큰 검색
- [ ] PR 생성 시 민감한 정보 포함 여부 확인
- [ ] 새 API 키 추가 시 보안 검사 실행
- [ ] 테스트 코드에 실제 키 사용 금지

### 정기 점검 (월 1회)

- [ ] 사용하지 않는 토큰 삭제
- [ ] 토큰 권한 및 만료일 검토
- [ ] 로테이션 일정 확인 및 실행
- [ ] 보안 로그 검토
- [ ] 접근 권한 감사
- [ ] 백업 파일 보안 상태 확인

### 배포 전

- [ ] Vercel 환경변수 설정 확인
- [ ] 프로덕션 환경 보안 설정 검증
- [ ] HTTPS 인증서 상태 확인
- [ ] 도메인 보안 설정 검토
- [ ] 배포 후 인증 플로우 테스트

## 📚 참고 문서 및 리소스

### 공식 문서

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [GitHub OAuth 문서](https://docs.github.com/en/developers/apps/oauth-apps)
- [Vercel 환경변수 가이드](https://vercel.com/docs/environment-variables)
- [Next.js 보안 가이드](https://nextjs.org/docs/advanced-features/security-headers)

### 보안 도구

- [git-secrets](https://github.com/awslabs/git-secrets) - Git 커밋 시 비밀 정보 탐지
- [truffleHog](https://github.com/trufflesecurity/trufflehog) - 저장소 내 비밀 정보 스캔
- [1Password CLI](https://developer.1password.com/docs/cli) - 보안 환경변수 관리

### 관련 프로젝트 문서

- **[MCP 종합 가이드](../MCP-GUIDE.md)**: MCP 서버 보안 설정
- **[개발 환경 가이드](./development-environment-complete.md)**: WSL 개발 환경 설정
- **[배포 가이드](./platform-deployment-setup.md)**: 프로덕션 보안 설정

---

💡 **핵심 원칙**: 제로 트러스트 보안 + 최소 권한 + 정기 로테이션 + 실시간 모니터링

🔐 **보안 철학**: 예방 > 탐지 > 대응 > 복구
