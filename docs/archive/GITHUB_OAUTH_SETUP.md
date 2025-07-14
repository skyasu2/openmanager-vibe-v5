# GitHub OAuth App 설정 가이드

## 1. GitHub OAuth App 생성

1. GitHub에 로그인 (skyasu@naver.com)
2. 다음 URL로 이동: https://github.com/settings/developers
3. "OAuth Apps" 클릭
4. "New OAuth App" 버튼 클릭
5. 다음 정보 입력:
   - **Application name**: OpenManager Vibe V5
   - **Homepage URL**: https://openmanager-vibe-v5.vercel.app
   - **Authorization callback URL**: https://openmanager-vibe-v5.vercel.app/api/auth/callback/github
6. "Register application" 클릭

## 2. Client ID와 Client Secret 획득

OAuth App 생성 후:
1. **Client ID**가 표시됩니다 (복사해두세요)
2. "Generate a new client secret" 버튼 클릭
3. 생성된 **Client Secret** 복사 (한 번만 표시되므로 반드시 저장)

## 3. Vercel 환경 변수 설정

1. Vercel 대시보드로 이동: https://vercel.com/dashboard
2. "openmanager-vibe-v5" 프로젝트 선택
3. "Settings" → "Environment Variables" 이동
4. 다음 환경 변수 추가:

```
NEXTAUTH_URL=https://openmanager-vibe-v5.vercel.app
NEXTAUTH_SECRET=9caaf42e78ea0758039f9dc44d371b23
GITHUB_CLIENT_ID=[위에서 복사한 Client ID]
GITHUB_CLIENT_SECRET=[위에서 복사한 Client Secret]
```

## 4. 배포

환경 변수 설정 후:
1. Vercel에서 "Redeploy" 클릭
2. "Use existing Build Cache" 체크 해제
3. "Redeploy" 확인

## 참고사항

- Personal Access Token은 API 호출용이며, OAuth 로그인에는 사용되지 않습니다
- OAuth App의 Client ID와 Client Secret이 필요합니다
- 환경 변수 설정 후 반드시 재배포해야 적용됩니다