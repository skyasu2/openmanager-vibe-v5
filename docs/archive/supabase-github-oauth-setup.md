# 🔐 Supabase GitHub OAuth 설정 가이드

## 📋 현재 프로젝트 정보
- **Supabase URL**: your_supabase_url_here
- **Project Ref**: your_supabase_project_id_here
- **GitHub Client ID**: your_github_client_id_here (이미 설정됨)

## 🚀 즉시 해결 방법

### 방법 1: Supabase Dashboard (권장)

1. **Supabase Dashboard 접속**
   ```
   https://supabase.com/dashboard/project/your_supabase_project_id_here
   ```

2. **Authentication 설정**
   - 좌측 메뉴: `Authentication` → `Providers`
   - `GitHub` 찾기
   - `Enable GitHub provider` 토글 ON

3. **GitHub OAuth 정보 입력**
   ```
   Client ID: your_github_client_id_here
   Client Secret: e696b1911a31d283d829aca73eb3fea8abbe7291
   ```

4. **Redirect URL 확인**
   ```
   your_supabase_url_here/auth/v1/callback
   ```

5. **저장 클릭**

### 방법 2: Management API (고급)

```bash
# Supabase Access Token이 필요함
curl -X PATCH "https://api.supabase.com/v1/projects/your_supabase_project_id_here/config/auth" \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "external_github_enabled": true,
    "external_github_client_id": "your_github_client_id_here",
    "external_github_secret": "e696b1911a31d283d829aca73eb3fea8abbe7291"
  }'
```

## 🔍 문제 해결

### GitHub OAuth App 설정 확인
1. **GitHub → Settings → Developer settings → OAuth Apps**
2. **Authorization callback URL 확인**:
   ```
   your_supabase_url_here/auth/v1/callback
   ```

### 테스트 방법
1. 설정 완료 후 로그인 페이지에서 "GitHub로 로그인" 클릭
2. GitHub 인증 페이지로 정상 이동 확인
3. 인증 완료 후 홈페이지로 리다이렉트 확인

## 📚 참고 문서
- [Supabase GitHub OAuth 공식 문서](https://supabase.com/docs/guides/auth/social-login/auth-github)
- [GitHub OAuth Apps 관리](https://github.com/settings/developers)

---
*설정 완료 시간: 약 2-3분*