# 🚀 Vercel 환경변수 설정 가이드

## 🔧 필수 환경변수 설정

### 1. **애플리케이션 URL**

```
NEXT_PUBLIC_APP_URL=https://your-project-name.vercel.app
```

### 2. **Supabase 환경변수**

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 3. **Memory Cache (Upstash) 환경변수**

```
UPSTASH_MEMORY_CACHE_REST_URL=https://your-memory cache-url.upstash.io
UPSTASH_MEMORY_CACHE_REST_TOKEN=your_memory cache_token_here
```

또는

```
KV_REST_API_URL=https://your-memory cache-url.upstash.io
KV_REST_API_TOKEN=your_memory cache_token_here
```

### 4. **Google AI 환경변수**

```
GOOGLE_AI_API_KEY=your_google_ai_api_key_here
GOOGLE_AI_ENABLED=true
```

## 🚨 주의사항

1. **절대 GitHub에 실제 키를 커밋하지 마세요**
2. **Vercel Dashboard에서 직접 환경변수 설정**
3. **각 환경(Preview, Production)별로 적절한 값 설정**

## 📝 설정 방법

1. Vercel Dashboard → 프로젝트 선택
2. Settings → Environment Variables
3. 위의 환경변수들을 각각 추가
4. 재배포 (Redeploy)
