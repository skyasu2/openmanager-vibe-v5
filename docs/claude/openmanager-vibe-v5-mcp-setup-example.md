# OpenManager Vibe v5 - 실제 MCP 설정 예시

> **실제 운영 중인 풀스택 Next.js 프로젝트의 MCP 설정 사례**  
> **프로젝트**: OpenManager Vibe v5 (Next.js 15 + TypeScript + Supabase)  
> **환경**: Windows + WSL 2  
> **MCP 서버**: 12개 활성화

## 📋 현재 활성화된 MCP 서버 구성

### 🗂️ 1. Filesystem (파일 시스템 접근)
```bash
claude mcp add filesystem -- npx -y @modelcontextprotocol/server-filesystem /mnt/d/cursor/openmanager-vibe-v5
```
**용도**: 프로젝트 파일 읽기/쓰기, 코드 분석, 파일 구조 탐색

### 🧠 2. Memory (컨텍스트 관리)
```bash
claude mcp add memory -- npx -y @modelcontextprotocol/server-memory
```
**용도**: 대화 컨텍스트 영구 저장, 프로젝트 지식 축적

### 🐙 3. GitHub (저장소 관리)
```bash
claude mcp add github --env GITHUB_PERSONAL_ACCESS_TOKEN=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 -- npx -y @modelcontextprotocol/server-github
```
**용도**: 이슈 관리, PR 생성, 코드 리뷰, 저장소 분석

### 🗄️ 4. Supabase (데이터베이스)
```bash
claude mcp add supabase --env SUPABASE_ACCESS_TOKEN=sbp_90532bce7e5713a964686d52b254175e8c5c32b9 -- npx -y @supabase/mcp-server-supabase@latest --project-ref vnswjnltnhpsueosfhmw
```
**용도**: 데이터베이스 스키마 관리, 쿼리 최적화, 데이터 분석

### 🔍 5. Tavily (웹 검색)
```bash
claude mcp add tavily --env TAVILY_API_KEY=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 -- npx -y tavily-mcp
```
**용도**: 최신 기술 정보 검색, 라이브러리 문서 조회, 트러블슈팅

### 🎭 6. Playwright (브라우저 자동화)
```bash
claude mcp add playwright -- npx -y @executeautomation/playwright-mcp-server
```
**용도**: E2E 테스트 작성, UI 테스트 자동화, 브라우저 스크래핑

### ⏰ 7. Time (시간 관리)
```bash
claude mcp add time -- /home/skyasu/.local/bin/uvx mcp-server-time
```
**용도**: 시간대 변환, 일정 관리, 타임스탬프 처리

### 🤔 8. Sequential Thinking (복잡한 추론)
```bash
claude mcp add thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
```
**용도**: 복잡한 문제 단계별 해결, 아키텍처 설계, 디버깅

### 📚 9. Context7 (최신 문서)
```bash
claude mcp add context7 --env UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io --env UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA -- npx -y @upstash/context7-mcp
```
**용도**: 최신 라이브러리 문서, 코드 예제, API 레퍼런스

### 🎨 10. Shadcn/ui (UI 컴포넌트)
```bash
claude mcp add shadcn -- npx -y @magnusrodseth/shadcn-mcp-server
```
**용도**: UI 컴포넌트 생성, 디자인 시스템 관리, 스타일링

### ☁️ 11. GCP (Google Cloud Platform)
```bash
claude mcp add gcp --env GOOGLE_CLOUD_PROJECT=openmanager-free-tier -- node /home/skyasu/.nvm/versions/node/v22.18.0/lib/node_modules/google-cloud-mcp/dist/index.js
```
**용도**: VM 관리, Cloud Functions 배포, 리소스 모니터링

### 🔍 12. Serena (코드 분석, LSP 기반)
```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project /mnt/d/cursor/openmanager-vibe-v5
```
**용도**: 코드 심볼 탐색, 리팩토링, 코드 품질 분석

---

## 🎯 실제 사용 사례

### 1. 풀스택 개발 워크플로우
```
1. Filesystem → 프로젝트 구조 분석
2. Supabase → 데이터베이스 스키마 확인
3. GitHub → 관련 이슈 검토
4. Shadcn → UI 컴포넌트 생성
5. Playwright → E2E 테스트 작성
6. Memory → 작업 내용 저장
```

### 2. 버그 수정 프로세스
```
1. Serena → 코드 심볼 분석으로 문제 위치 파악
2. Tavily → 유사한 문제 해결 방법 검색
3. Sequential Thinking → 단계별 해결 계획 수립
4. Filesystem → 코드 수정
5. Playwright → 테스트로 수정 검증
6. GitHub → PR 생성 및 이슈 클로즈
```

### 3. 새 기능 개발
```
1. Context7 → 최신 라이브러리 문서 확인
2. Supabase → 필요한 데이터베이스 변경사항 적용
3. Shadcn → UI 컴포넌트 설계
4. Filesystem → 코드 구현
5. Time → 일정 관리 및 마일스톤 설정
6. Memory → 개발 과정 및 결정사항 기록
```

---

## ⚙️ 환경변수 관리

### .env.wsl (WSL 전용)
```bash
# GitHub
GITHUB_PERSONAL_ACCESS_TOKEN=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

# Supabase
SUPABASE_ACCESS_TOKEN=sbp_90532bce7e5713a964686d52b254175e8c5c32b9

# Tavily
TAVILY_API_KEY=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

# Upstash (Context7)
UPSTASH_REDIS_REST_URL=https://charming-condor-46598.upstash.io
UPSTASH_REDIS_REST_TOKEN=AbYGAAIjcDE5MjNmYjhiZDkwOGQ0RTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA

# GCP
GOOGLE_CLOUD_PROJECT=openmanager-free-tier
```

### 환경변수 로딩
```bash
# WSL에서 안전한 환경변수 로딩
source scripts/wsl-env.sh
```

---

## 📊 성능 및 사용 통계

### 서버별 응답 시간 (평균)
- **Filesystem**: ~50ms (로컬)
- **Memory**: ~30ms (로컬)
- **GitHub**: ~200ms (API)
- **Supabase**: ~150ms (API)
- **Tavily**: ~800ms (검색)
- **Context7**: ~300ms (캐시됨)
- **Serena**: ~100ms (LSP)

### 일일 사용 빈도
1. **Filesystem** (100%) - 모든 작업에 필수
2. **Memory** (90%) - 컨텍스트 관리
3. **Supabase** (80%) - 데이터베이스 작업
4. **GitHub** (70%) - 코드 관리
5. **Shadcn** (60%) - UI 개발
6. **Serena** (50%) - 코드 분석
7. **Playwright** (40%) - 테스트 작성
8. **Tavily** (30%) - 정보 검색
9. **Sequential Thinking** (25%) - 복잡한 문제 해결
10. **Context7** (20%) - 문서 참조
11. **Time** (15%) - 시간 관리
12. **GCP** (10%) - 인프라 관리

---

## 🔧 최적화 팁

### 1. 서버 시작 순서 최적화
```json
{
  "mcpServers": {
    "filesystem": { "priority": 1 },
    "memory": { "priority": 1 },
    "github": { "priority": 2 },
    "supabase": { "priority": 2 },
    "serena": { "priority": 3 }
  }
}
```

### 2. 환경변수 캐싱
```bash
# .bashrc에 추가
export MCP_ENV_LOADED=true
if [ "$MCP_ENV_LOADED" != "true" ]; then
    source /mnt/d/cursor/openmanager-vibe-v5/scripts/wsl-env.sh
fi
```

### 3. 서버별 타임아웃 설정
```json
{
  "mcpServers": {
    "tavily": {
      "timeout": 10000,
      "retries": 2
    },
    "gcp": {
      "timeout": 5000,
      "retries": 1
    }
  }
}
```

---

## 🚨 문제 해결 경험

### 1. WSL 경로 문제
**문제**: Windows 경로와 WSL 경로 불일치
**해결**: `/mnt/d/cursor/openmanager-vibe-v5` 형식으로 통일

### 2. 환경변수 로딩 실패
**문제**: bash export 에러로 환경변수 로딩 실패
**해결**: `.env.wsl` 파일 생성 및 안전한 로딩 스크립트 사용

### 3. Serena 서버 연결 불안정
**문제**: LSP 서버 연결이 간헐적으로 끊어짐
**해결**: `--context ide-assistant` 옵션 추가 및 프로젝트 사전 인덱싱

### 4. GCP 인증 문제
**문제**: GCP MCP 서버 인증 실패
**해결**: `GOOGLE_CLOUD_PROJECT` 환경변수 설정 및 gcloud 인증 확인

---

## 📈 향후 계획

### 추가 예정 MCP 서버
- **Linear**: 이슈 트래킹 자동화
- **Notion**: 문서 관리 통합
- **Slack**: 팀 커뮤니케이션 연동
- **Vercel**: 배포 자동화

### 최적화 계획
- 서버 시작 시간 단축 (현재 평균 3초 → 목표 1초)
- 메모리 사용량 최적화 (현재 500MB → 목표 300MB)
- 캐싱 전략 개선 (Context7, Tavily)

---

**💡 이 설정은 실제 운영 환경에서 검증된 구성입니다. 프로젝트 특성에 맞게 필요한 서버만 선택적으로 사용하시기 바랍니다.**