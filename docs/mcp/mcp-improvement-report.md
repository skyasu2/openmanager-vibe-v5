ARCHIVED

> 작성일: 2025-08-12 22:00  
> 작성자: Claude Code  
> 환경: Windows 11, Git Bash, Node.js v22.15.1

## 📊 개선 결과 요약

### 이전 상태 (2025-08-12 21:00)

- ✅ 정상: 7/11 서버 (63.6%)
- ❌ 실패: 4/11 서버 (36.4%)

### 현재 상태 (2025-08-12 22:00)

- ✅ 정상: 8/11 서버 (73%)
- ❌ 실패: 3/11 서버 (27%)
- **개선율: +9.4%**

## 🔍 조사 및 분석 내용

### 1. 공식 문서 분석

- **Claude Code 공식 문서**: Windows에서 `cmd /c` wrapper 필수 확인
- **환경변수 확장**: `${VAR}` 또는 `${VAR:-default}` 형식 지원
- **JSON 설정**: `add-json` 명령어로 복잡한 설정 가능

### 2. GitHub 저장소 조사 결과

#### Supabase MCP

- 공식 저장소: `supabase-community/supabase-mcp`
- Windows 경로: `%APPDATA%\Code\User\globalStorage\`
- 필수 환경변수: SUPABASE_URL, SUPABASE_ANON_KEY

#### Tavily MCP

- npm 패키지: `tavily-mcp@latest`
- 환경변수: TAVILY_API_KEY (tvly- 접두사 필수)
- Remote 서버 옵션 제공

#### Playwright MCP

- 올바른 패키지: `@playwright/mcp` (not `@microsoft/playwright-mcp`)
- Windows 호환성 이슈 존재
- 대체 구현체 존재: `@executeautomation/playwright-mcp-server`

#### Serena MCP

- Python uvx 필요
- 복잡한 명령어 구조로 Windows 경로 이슈
- 대시보드: http://127.0.0.1:24282/dashboard/index.html

### 3. 커뮤니티 솔루션 (Reddit/GitHub Issues)

#### 주요 발견사항

- **Issue #4793**: Windows 11에서 MCP 연결 실패 문제 다수 보고
- **Issue #1254**: 환경변수가 MCP 서버에 전달되지 않는 버그
- **해결책**: `add-json` 명령어 사용 또는 직접 설정 파일 편집

## ✅ 성공한 개선 사항

### 1. Tavily MCP 정상화

```bash
# 해결 방법: JSON 설정으로 환경변수 포함
claude mcp add-json tavily-mcp '{
  "command":"cmd",
  "args":["/c","npx","-y","tavily-mcp@latest"],
  "env":{"TAVILY_API_KEY":"your-key"}
}'
```

- **결과**: ✅ 성공적으로 연결됨
- **핵심**: 환경변수를 JSON 형식으로 정확히 전달

### 2. 기존 서버 안정성 유지

- 7개 기존 서버 모두 정상 작동 유지
- 추가 설정 변경 없이 안정적 운영

## ❌ 미해결 이슈

### 1. Supabase MCP

- **문제**: 환경변수는 전달되나 서버 초기화 실패
- **추정 원인**: 패키지 자체의 Windows 호환성 문제
- **대안**: REST API 직접 호출 또는 WSL 환경 사용

### 2. Playwright MCP

- **문제**: 패키지는 존재하나 Windows에서 연결 실패
- **추정 원인**: Windows stdio 통신 문제
- **대안**: Puppeteer 또는 Selenium 사용

### 3. Serena MCP

- **문제**: Python uvx 경로 및 명령어 구조 복잡성
- **추정 원인**: Windows 경로 해석 문제
- **대안**: WSL 환경 또는 간단한 코드 분석 도구 사용

## 📋 권장사항

### 즉시 적용 가능

1. **Tavily MCP 활용**: 웹 검색, 크롤링 기능 활성화됨
2. **기존 8개 서버로 충분한 개발 환경 구축**
3. **`add-json` 명령어 활용**: 복잡한 설정 시 권장

### 장기 개선 과제

1. **WSL 환경 고려**: Windows 네이티브 한계 극복
2. **대체 도구 탐색**: 실패한 서버들의 대안 검토
3. **Claude Code 업데이트 대기**: Windows 지원 개선 예상

## 📁 관련 파일

- 설정 스크립트: `/scripts/fix-mcp-servers-windows-complete.ps1`
- 상태 문서: `/docs/mcp-setup-status.md`
- 배치 파일: `/scripts/setup-mcp-windows.bat`
- 프로젝트 설정: `/CLAUDE.md` (업데이트됨)

## 🎯 결론

Windows 환경에서 MCP 서버 설정은 여전히 도전적이지만, 체계적인 조사와 테스트를 통해 **73%의 성공률**을 달성했습니다. 특히 **Tavily MCP의 성공적인 연결**로 웹 검색 기능을 확보한 것이 주요 성과입니다.

현재 작동하는 8개 서버로 대부분의 개발 작업이 가능하며, 미해결 서버들은 대체 도구나 향후 업데이트를 통해 해결할 수 있을 것으로 예상됩니다.

---

_이 보고서는 공식 문서, GitHub 저장소, 커뮤니티 피드백을 종합하여 작성되었습니다._
