# 📚 MCP 서버 완전 가이드

**OpenManager VIBE v5** - 9개 MCP 서버 통합 시스템

## 🎯 개요

MCP(Model Context Protocol) 서버는 Claude Code의 기능을 확장하는 플러그인 시스템입니다.
OpenManager VIBE v5는 9개의 MCP 서버를 통합하여 강력한 개발 환경을 제공합니다.

## 📊 MCP 서버 현황 (2025-09-18)

| 서버 | 상태 | 주요 기능 | 설정 필요 |
|------|------|----------|----------|
| **Memory** | ✅ 완전 작동 | 엔티티/관계 그래프 관리 | 없음 |
| **Time** | ✅ 완전 작동 | 시간대 변환, 시간 계산 | 없음 |
| **Sequential-Thinking** | ✅ 완전 작동 | 연속적 사고 프로세스 | 없음 |
| **Vercel** | ✅ 완전 작동 | 프로젝트 배포 관리 | OAuth 자동 |
| **Context7** | ✅ 완전 작동 | 라이브러리 문서 조회 | API 키 설정됨 |
| **Shadcn-UI** | ✅ 완전 작동 | 46개 UI 컴포넌트 | 없음 |
| **Serena** | ✅ 완전 작동 | 코드베이스 분석 | 없음 |
| **Supabase** | ✅ 완전 작동 | PostgreSQL 데이터베이스 | 토큰 설정됨 |
| **Playwright** | ✅ 완전 작동 | 브라우저 자동화 | 브라우저 설치됨 |

## 🚀 빠른 시작

### 1. 환경변수 설정
```bash
# 환경변수 자동 로드
source /mnt/d/cursor/openmanager-vibe-v5/scripts/setup-mcp-env.sh
```

### 2. MCP 서버 상태 확인
```bash
# 모든 서버 상태 확인
claude mcp list

# 자동 테스트 스크립트 실행
./scripts/mcp-restart.sh
```

### 3. Claude Code 재시작
Windows PowerShell에서:
```powershell
# Claude Code 재시작 (또는 수동으로 재시작)
```

## 🔧 각 서버별 사용법

### 1. Memory 서버
**용도**: 프로젝트 정보를 그래프 형태로 저장/조회

```typescript
// 사용 예시 (Claude Code에서)
"Memory 서버를 사용하여 프로젝트 구조를 저장해줘"
"저장된 엔티티 관계를 보여줘"
```

### 2. Time 서버
**용도**: 시간대 변환, 날짜 계산

```typescript
// 사용 예시
"서울 시간 18:00를 뉴욕 시간으로 변환해줘"
"현재 UTC 시간을 알려줘"
```

### 3. Sequential-Thinking 서버
**용도**: 복잡한 문제를 단계별로 해결

```typescript
// 사용 예시
"Sequential-Thinking을 사용하여 이 알고리즘을 분석해줘"
```

### 4. Supabase 서버
**용도**: PostgreSQL 데이터베이스 관리

```typescript
// 사용 예시
"Supabase에서 users 테이블 구조를 보여줘"
"새로운 마이그레이션 파일 생성해줘"
```

**필요 설정** (.env.local):
```env
SUPABASE_ACCESS_TOKEN=sbp_...
SUPABASE_PROJECT_ID=vnswjnltnhpsueosfhmw
```

### 5. Vercel 서버
**용도**: 프로젝트 배포 및 관리

```typescript
// 사용 예시
"Vercel 프로젝트 목록을 보여줘"
"최근 배포 상태를 확인해줘"
```

### 6. Context7 서버
**용도**: 최신 라이브러리 문서 조회

```typescript
// 사용 예시
"React 최신 문서를 Context7에서 가져와줘"
"Next.js 14 App Router 문서를 보여줘"
```

**필요 설정** (.env.local):
```env
CONTEXT7_API_KEY=ctx7sk-...
```

### 7. Shadcn-UI 서버
**용도**: UI 컴포넌트 관리

```typescript
// 사용 예시
"shadcn-ui Button 컴포넌트 메타데이터를 보여줘"
"사용 가능한 모든 컴포넌트 목록을 보여줘"
```

### 8. Serena 서버
**용도**: 코드베이스 심층 분석

```typescript
// 사용 예시
"Serena로 src 폴더 구조를 분석해줘"
"Button 컴포넌트를 참조하는 모든 파일을 찾아줘"
```

### 9. Playwright 서버
**용도**: 브라우저 자동화 테스트

```typescript
// 사용 예시
"Playwright로 https://example.com 스크린샷을 찍어줘"
"로그인 폼 자동화 테스트를 만들어줘"
```

**브라우저 설치**:
```bash
npx playwright install chromium
```

## 🔒 보안 관리

### 토큰 보안
1. 모든 토큰은 `.env.local`에 저장
2. `.gitignore`에 포함되어 GitHub 노출 방지
3. MCP 설정 파일(`.mcp.json`)도 `.gitignore`에 포함

### 안전한 템플릿
```bash
# 토큰 없는 템플릿 사용
cp .mcp.json.template .mcp.json.example
```

## 🛠️ 트러블슈팅

### 문제: Supabase "Unauthorized" 오류
**해결**:
1. `.env.local`에 `SUPABASE_ACCESS_TOKEN` 확인
2. 환경변수 로드: `source scripts/setup-mcp-env.sh`
3. Claude Code 재시작

### 문제: Playwright 브라우저 오류
**해결**:
```bash
# 브라우저 및 종속성 설치
npx playwright install --with-deps chromium
```

### 문제: MCP 서버 연결 안됨
**해결**:
1. Claude Code 버전 확인: `claude --version` (v1.0.112+)
2. WSL 환경 확인
3. MCP 설정 파일 확인: `~/.claude/.mcp.json`

## 📈 성능 최적화

### 메모리 설정
```json
{
  "env": {
    "NODE_OPTIONS": "--max-old-space-size=2048"
  }
}
```

### 타임아웃 설정
```json
{
  "env": {
    "MCP_REQUEST_TIMEOUT": "60000"
  }
}
```

## 🔄 자동화 스크립트

### 환경 설정 자동화
```bash
# 모든 환경변수 자동 로드
./scripts/setup-mcp-env.sh
```

### MCP 서버 테스트
```bash
# 9개 서버 전체 테스트
./scripts/mcp-restart.sh
```

## 📚 추가 자료

- [Claude Code 공식 문서](https://docs.anthropic.com/en/docs/claude-code)
- [MCP 프로토콜 명세](https://modelcontextprotocol.io)
- [OpenManager VIBE v5 문서](/docs/README.md)

## 🤝 기여하기

MCP 서버 설정 개선 사항이 있다면:
1. `.mcp.json.template` 업데이트
2. 이 가이드 문서 업데이트
3. PR 제출

---

💡 **Tip**: Claude Code에서 `"MCP 서버 목록을 보여줘"`라고 요청하면 현재 연결된 모든 서버를 확인할 수 있습니다.