# 🚀 Vercel 환경변수 설정 가이드

## 중요: Vercel에서 GitHub 로그인이 작동하려면

Vercel 대시보드에서 다음 환경변수를 **반드시** 설정해야 합니다.

## 1단계: Vercel 대시보드 접속

1. https://vercel.com/dashboard 로그인
2. `openmanager-vibe-v5` 프로젝트 선택
3. Settings → Environment Variables 메뉴 이동

## 2단계: 필수 환경변수 추가

다음 환경변수를 **모두** 추가하세요:

### Supabase 설정 (필수)
```
NEXT_PUBLIC_SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8
```

### 추가 설정 (선택사항이지만 권장)
```
SUPABASE_URL=https://vnswjnltnhpsueosfhmw.supabase.co
```

## 3단계: 환경 선택

각 환경변수에 대해:
- ✅ Production
- ✅ Preview  
- ✅ Development

모두 체크하세요.

## 4단계: 저장 및 재배포

1. "Save" 버튼 클릭
2. 최신 커밋 재배포:
   - Deployments 탭 이동
   - 최신 배포의 "..." 메뉴 클릭
   - "Redeploy" 선택
   - "Use existing Build Cache" 체크 해제
   - "Redeploy" 클릭

## 5단계: 확인

배포 완료 후:
1. https://openmanager-vibe-v5.vercel.app 접속
2. 브라우저 콘솔(F12) 열기
3. GitHub 로그인 시도
4. 콘솔에 다음과 같은 메시지가 나타나면 성공:
   ```
   🌐 실제 Supabase 사용 중
   ```

## 문제 해결

### "Mock 모드로 작동합니다" 메시지가 나타나는 경우

1. 환경변수가 제대로 저장되었는지 확인
2. 재배포 시 캐시를 사용하지 않았는지 확인
3. Vercel 로그 확인:
   - Functions 탭 → Logs
   - 에러 메시지 확인

### GitHub OAuth 설정 확인

Supabase 대시보드에서:
1. Authentication → Providers → GitHub 활성화 확인
2. Redirect URL이 다음과 같은지 확인:
   ```
   https://vnswjnltnhpsueosfhmw.supabase.co/auth/v1/callback
   ```

## 중요 참고사항

- `NEXT_PUBLIC_` 접두사가 붙은 환경변수는 클라이언트 사이드에서 사용됩니다
- 빌드 시점에 환경변수가 주입되므로 변경 후 반드시 재배포가 필요합니다
- 환경변수 값에 따옴표를 넣지 마세요

## 보안 주의사항

- `SUPABASE_SERVICE_ROLE_KEY`는 서버 사이드에서만 사용됩니다
- 이 키를 클라이언트 코드에 노출하지 마세요
- GitHub 등 공개 저장소에 커밋하지 마세요