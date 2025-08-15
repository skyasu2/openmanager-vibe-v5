# 🔧 MCP 서버 문제 해결 가이드

**최종 업데이트**: 2025-08-15 21:30  
**환경**: WSL 2 (Ubuntu 24.04 LTS) + Claude Code v1.0.81  
**기반**: 실제 테스트 결과 및 문제 해결 경험

---

## 📊 MCP 서버 상태 요약

### ✅ 정상 작동 서버 (4/11개)

- **github** ✅ - API 통합 완료
- **tavily** ✅ - 웹 검색 작동
- **time** ✅ - 시간대 변환 (Python/UVX)
- **serena** ✅ - 코드 분석 (Python/UVX)

### ❌ 문제 서버 (7/11개)

- **filesystem** ❌ - 패키지 실행 오류
- **memory** ❌ - stdin 처리 문제
- **supabase** ❌ - 설정 오류
- **playwright** ❌ - 브라우저 종속성
- **thinking** ❌ - 패키지 실행 문제
- **context7** ❌ - Redis 연결 오류
- **shadcn** ❌ - 환경 호환성 문제

---

## 🚨 개별 서버 문제 진단 및 해결

### 1. 🗂️ FileSystem MCP ❌

#### **문제 증상**

```bash
$ npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5 --help
Error accessing directory --help: Error: ENOENT: no such file or directory, stat '--help'
```

#### **원인 분석**

- 패키지가 `--help` 옵션을 디렉토리 경로로 인식
- 터미널 실행과 Claude Code 내부 실행 차이

#### **해결 시도**

```bash
# 1. 기본 실행 (경로만 전달)
npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5

# 2. 버전 확인
npx -y @modelcontextprotocol/server-filesystem --version

# 3. 패키지 재설치
npm cache clean --force
```

#### **대안책**

- Claude Code 내장 파일 시스템 도구 사용
- `ls`, `cat`, `find` 등 bash 명령어 직접 사용
- Read, Write, Glob 등 Claude 도구 활용

---

### 2. 🧠 Memory MCP ❌

#### **문제 증상**

```bash
$ echo 'test' | npx -y @modelcontextprotocol/server-memory
Knowledge Graph MCP Server running on stdio
# stdin 처리 후 응답 없음
```

#### **원인 분석**

- stdin 테스트 방식의 한계
- 실제 MCP 프로토콜과 직접 테스트의 차이
- 패키지는 정상이지만 테스트 방법 문제일 가능성

#### **해결 방법**

```bash
# 1. Claude Code에서 직접 테스트
# /mcp 명령으로 연결 상태 확인

# 2. 패키지 상태 확인
npx -y @modelcontextprotocol/server-memory --version

# 3. 다른 MCP 클라이언트로 테스트
```

#### **대안책**

- 프로젝트 지식은 외부 노트 앱 활용
- Claude 대화 내 메모 기능 사용

---

### 3. 🗄️ Supabase MCP ❌

#### **문제 증상**

```bash
$ npx -y @supabase/mcp-server-supabase@latest --help
# 실행되지만 연결 테스트 실패
```

#### **원인 분석**

- 환경변수 설정 문제
- 패키지 버전 호환성
- 프로젝트 ID 또는 토큰 오류

#### **해결 단계**

1. **환경변수 확인**

```bash
echo $SUPABASE_ACCESS_TOKEN
echo $SUPABASE_PROJECT_ID

# .env.local 확인
grep SUPABASE /mnt/d/cursor/openmanager-vibe-v5/.env.local
```

2. **패키지 버전 업데이트**

```bash
npm cache clean --force
npx -y @supabase/mcp-server-supabase@latest --version
```

3. **토큰 권한 확인**

```bash
# Supabase 대시보드에서 토큰 재생성
# 권한: 관리자 권한으로 생성
```

#### **대안책**

- Supabase 클라이언트 라이브러리 직접 사용
- REST API 직접 호출

---

### 4. 🎭 Playwright MCP ❌

#### **문제 증상**

```bash
$ npx -y @executeautomation/playwright-mcp-server --help
Error
```

#### **원인 분석**

- 브라우저 바이너리 미설치
- WSL 환경의 GUI 의존성 부족
- 시스템 라이브러리 부족

#### **해결 방법**

1. **브라우저 설치**

```bash
npx playwright install chromium
npx playwright install-deps
```

2. **WSL 시스템 의존성 설치**

```bash
sudo apt-get update
sudo apt-get install -y \
  libnspr4 \
  libnss3 \
  libasound2t64 \
  libxss1 \
  libgconf-2-4 \
  libxtst6 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk1.0-0 \
  libcairo-gobject2 \
  libgtk-3-0 \
  libgdk-pixbuf2.0-0
```

3. **Headless 모드 테스트**

```bash
# 테스트 페이지로 확인
npx playwright test --headed=false
```

#### **대안책**

- Puppeteer 직접 사용
- Selenium WebDriver 사용

---

### 5. 🤔 Thinking MCP ❌

#### **문제 증상**

```bash
$ npx -y @modelcontextprotocol/server-sequential-thinking --version
# 패키지 실행 문제
```

#### **원인 분석**

- 패키지 버전 문제
- 의존성 충돌
- 실행 방식 차이

#### **해결 방법**

```bash
# 1. 캐시 정리 후 재설치
npm cache clean --force

# 2. 최신 버전 확인
npm view @modelcontextprotocol/server-sequential-thinking

# 3. 다른 thinking 패키지 시도
npm search thinking-mcp
```

#### **대안책**

- 단계별 사고는 프롬프트 엔지니어링으로 해결
- 복잡한 문제는 여러 단계로 나누어 질문

---

### 6. 📚 Context7 MCP ❌

#### **문제 증상**

```bash
$ npx -y @upstash/context7-mcp
# Redis 연결 오류 예상
```

#### **원인 분석**

- Upstash Redis 설정 오류
- API 키 또는 URL 문제
- 네트워크 연결 문제

#### **해결 방법**

1. **Redis 연결 테스트**

```bash
curl -X GET ${UPSTASH_REDIS_REST_URL}/ping \
  -H "Authorization: Bearer ${UPSTASH_REDIS_REST_TOKEN}"
```

2. **환경변수 확인**

```bash
echo $UPSTASH_REDIS_REST_URL
echo $UPSTASH_REDIS_REST_TOKEN
```

3. **Upstash 대시보드 확인**

- 데이터베이스 상태 확인
- 토큰 재생성

#### **대안책**

- 라이브러리 문서는 공식 사이트 참조
- AI 도구로 코드 문서화 요청

---

### 7. 🎨 ShadCN MCP ❌

#### **문제 증상**

```bash
$ npx -y @magnusrodseth/shadcn-mcp-server --help
# 패키지 실행 또는 환경 오류
```

#### **원인 분석**

- React/Next.js 프로젝트 환경 필요
- 패키지 설정 문제
- 프로젝트 구조 인식 문제

#### **해결 방법**

1. **프로젝트 환경 확인**

```bash
# package.json에서 React/Next.js 확인
cat package.json | grep -E "(react|next)"

# tailwindcss 설정 확인
ls -la tailwind.config.*
```

2. **ShadCN CLI 직접 사용**

```bash
npx shadcn@latest add button
```

#### **대안책**

- ShadCN 공식 CLI 사용
- 컴포넌트 수동 복사/붙여넣기

---

## 🔬 일반적인 진단 도구

### MCP 서버 상태 확인

```bash
# 1. Claude Code 내부 확인
/mcp
/reload

# 2. 프로세스 확인
ps aux | grep mcp

# 3. 로그 확인
ls -la ~/.claude/logs/
```

### 환경변수 진단

```bash
# 전체 MCP 환경변수 확인
env | grep -E "(GITHUB|SUPABASE|TAVILY|UPSTASH)" | sort

# .env.local 로드 확인
source ~/.bashrc
env | grep MCP
```

### 네트워크 연결 테스트

```bash
# GitHub API 테스트
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" \
  https://api.github.com/user

# Supabase 연결 테스트
curl "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ACCESS_TOKEN}"

# Tavily API 테스트
curl -X POST "https://api.tavily.com/search" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${TAVILY_API_KEY}" \
  -d '{"api_key":"'${TAVILY_API_KEY}'","query":"test","max_results":1}'
```

---

## 💡 베스트 프랙티스

### 1. 단계적 접근

1. **정상 작동 서버 먼저 활용** (github, tavily, time, serena)
2. **필요한 기능만 문제 해결** (전체보다는 선택적)
3. **대안책 항상 준비** (MCP 실패 시 직접 도구 사용)

### 2. 효율적 디버깅

```bash
# 빠른 상태 확인
claude mcp list 2>/dev/null || echo "MCP 연결 문제"

# 환경변수 빠른 확인
env | grep -c "GITHUB\|SUPABASE\|TAVILY" | xargs echo "설정된 API 키 수:"

# 로그 확인
tail -f ~/.claude/logs/latest.log | grep -i error
```

### 3. 안전한 테스트

- 테스트용 별도 저장소 사용
- API 호출 제한 확인
- 민감한 데이터 테스트 금지

---

## 🎯 우선순위 해결 가이드

### High Priority (즉시 해결 권장)

1. **Supabase MCP** - 데이터베이스 관리 필수
2. **Playwright MCP** - E2E 테스트 중요

### Medium Priority (필요시 해결)

3. **FileSystem MCP** - 대안 도구 충분
4. **Memory MCP** - 외부 도구로 대체 가능

### Low Priority (선택적)

5. **기타 서버들** - 핵심 기능 아님

---

## 📞 추가 지원

### 공식 리소스

- [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [MCP 프로토콜 사양](https://modelcontextprotocol.io)

### 커뮤니티 리소스

- GitHub Issues 검색
- Discord/Slack 커뮤니티 질문

---

**작성자**: Claude Code + 실제 테스트 검증  
**테스트 환경**: WSL 2 (Ubuntu 24.04) + Node.js v22.18.0  
**마지막 검증**: 2025-08-15 21:30 KST
