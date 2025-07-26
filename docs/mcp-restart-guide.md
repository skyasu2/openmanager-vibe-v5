# 🔄 MCP 서버 재시작 가이드

**작성일**: 2025-07-26  
**상태**: MCP 프로세스 종료 완료

## 📊 현재 상황

### ✅ 완료된 작업

1. **환경변수 업데이트**
   - .env.local 파일에 모든 토큰 설정 완료
   - GitHub Personal Access Token 추가
   - Supabase Personal Access Token 추가

2. **.mcp.json 설정 수정**
   - `SUPABASE_ACCESS_TOKEN`이 `${SUPABASE_PAT}`를 참조하도록 변경

3. **MCP 프로세스 종료**
   - 모든 MCP 서버 프로세스가 종료됨
   - 현재 MCP 서버가 실행되지 않은 상태

## 🚨 필요한 조치

### Claude Code 재시작 필요

MCP 서버들은 Claude Code에 의해 관리되므로, **Claude Code를 재시작**해야 합니다.

#### Windows (PowerShell)에서 재시작 방법:

```powershell
# 1. 현재 Claude Code 종료
# Ctrl+C 또는 창 닫기

# 2. 환경변수 확인 (선택사항)
echo $env:GITHUB_PERSONAL_ACCESS_TOKEN
echo $env:SUPABASE_PAT

# 3. Claude Code 재시작
claude
```

#### WSL/Linux에서 재시작 방법:

```bash
# 1. 현재 Claude Code 종료
# Ctrl+C

# 2. 환경변수 확인 (선택사항)
env | grep -E "GITHUB_PERSONAL_ACCESS_TOKEN|SUPABASE_PAT"

# 3. Claude Code 재시작
claude
```

## 🧪 재시작 후 확인사항

Claude Code 재시작 후 다음을 확인하세요:

1. **MCP 서버 자동 시작 확인**

   ```bash
   ps aux | grep -E "mcp|modelcontextprotocol" | wc -l
   # 16개 이상의 프로세스가 표시되어야 함
   ```

2. **GitHub MCP 테스트**
   - 저장소 검색 기능 테스트
   - 인증 오류가 없어야 함

3. **Supabase MCP 테스트**
   - 프로젝트 목록 조회
   - Personal Access Token 인증 성공

## 📝 예상 결과

재시작 후:

- ✅ 모든 MCP 서버가 새로운 환경변수로 시작
- ✅ GitHub과 Supabase MCP가 정상 작동
- ✅ 수정된 .mcp.json 설정이 적용됨

## ⚠️ 주의사항

- Claude Code 재시작 시 현재 대화 컨텍스트는 유지됩니다
- 작업 중인 파일은 저장되었는지 확인하세요
- 환경변수가 올바르게 설정되었는지 재확인하세요

---

**다음 단계**: Claude Code 재시작 → MCP 서버 테스트 → 결과 확인
