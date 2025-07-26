# 🚨 MCP 보안 경고 - 즉시 조치 필요!

**작성일**: 2025-01-25  
**중요도**: **매우 높음**

## 🔴 긴급 조치 사항

다음 토큰들이 Git 히스토리에 노출되었습니다. **즉시 재생성**이 필요합니다:

1. **GitHub Personal Access Token**
   - 현재 노출된 토큰: `ghp_[REDACTED]`
   - 재생성 방법: https://github.com/settings/tokens

2. **Tavily API Key**
   - 현재 노출된 토큰: `tvly-[REDACTED]`
   - 재생성 방법: Tavily 대시보드에서 API 키 재생성

3. **Supabase Service Role Key**
   - 현재 노출된 토큰: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - 재생성 방법: Supabase 프로젝트 설정 > API 키

## 📋 수행된 보안 조치

1. ✅ `.mcp.json`을 `.gitignore`에 추가
2. ✅ 하드코딩된 토큰을 환경변수 참조로 변경
3. ✅ 보안 가이드 문서 작성

## 🔧 환경변수 설정 방법

`.env.local` 파일에 다음 환경변수들을 추가하세요:

```bash
# GitHub MCP
GITHUB_PERSONAL_ACCESS_TOKEN=your_new_github_token_here

# Tavily MCP
TAVILY_API_KEY=your_new_tavily_api_key_here

# Supabase MCP
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_new_supabase_service_role_key_here
```

## ⚠️ 추가 권장사항

1. **Git 히스토리 정리**: 노출된 토큰이 포함된 커밋을 제거

   ```bash
   # BFG Repo-Cleaner 사용 권장
   # https://rtyley.github.io/bfg-repo-cleaner/
   ```

2. **GitHub Secret Scanning**: GitHub 저장소 설정에서 Secret Scanning 활성화

3. **환경변수 백업**: `npm run env:backup` 명령 사용 (민감한 정보는 자동 암호화)

## 🛡️ 향후 예방 방법

1. **절대로** API 키나 토큰을 코드에 하드코딩하지 마세요
2. 항상 환경변수 참조 (`${VARIABLE_NAME}`) 사용
3. 커밋 전 민감한 정보 확인
4. `.gitignore` 설정 정기적 검토

## 📞 도움이 필요한 경우

- 보안 문서: `/docs/security-complete-guide.md`
- 환경변수 가이드: `/docs/environment-setup-guide.md`
