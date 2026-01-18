# Common Issues & Solutions

> **통합 문서**: common.md + build.md + claude-400-invalid-json.md + github-actions-analysis.md
> **최종 갱신**: 2026-01-18

---

## Quick Reference

| 카테고리 | 빠른 링크 |
|----------|----------|
| TypeScript | [타입 에러](#typescript-errors) |
| API/Network | [API 문제](#api-issues) |
| 빌드 | [빌드 에러](#build-issues) |
| Vercel | [배포 문제](#vercel-deployment) |
| CI/CD | [GitHub Actions](#github-actions) |
| Claude API | [400 에러](#claude-400-error) |

---

## TypeScript Errors

### "Type 'unknown' is not assignable"

```typescript
// ❌ Problem
const data: unknown = await response.json();
const server = data.server; // Error

// ✅ Solution - Type guards
function isServer(data: unknown): data is Server {
  return typeof data === 'object' && data !== null && 'id' in data;
}

if (isServer(data)) {
  const server = data.server; // OK
}
```

### "Property does not exist on type"

```typescript
// ❌ Problem
const user = req.user.id; // Error if undefined

// ✅ Solution - Optional chaining
const userId = req.user?.id;
if (!userId) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
```

### Module Resolution Issues

```typescript
// ❌ Cannot find module '@/components/ui/button'

// ✅ Check tsconfig.json paths
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

---

## API Issues

### Supabase Connection Timeout

```typescript
// ✅ Add timeout handling
const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);

const { data, error } = await supabase
  .from('servers')
  .select('*')
  .abortSignal(controller.signal);
```

### CORS Issues in Development

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [{
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
      ],
    }];
  },
};
```

---

## Build Issues

### Vercel Build Failures

```bash
# 로컬에서 먼저 확인
npm run build
npm run type-check
npm run lint

# 일반적인 수정
npm run lint               # Biome 린트 검사
rm -rf .next && npm run build  # 캐시 삭제
npm install --legacy-peer-deps # 의존성 충돌 해결
```

### Environment Variables Not Loading

```bash
# 1. 파일 구조 확인
# .env.local (개발)
# .env (프로덕션)

# 2. 필수 변수 검증
node -e "
const required = ['SUPABASE_URL', 'SUPABASE_ANON_KEY'];
required.forEach(v => {
  if (!process.env[v]) console.error('Missing: ' + v);
});
"
```

### Function Timeout Errors

```typescript
// ✅ Vercel Function 최적화
export const maxDuration = 8; // 10초 제한 내
export const dynamic = 'force-dynamic';

const controller = new AbortController();
setTimeout(() => controller.abort(), 5000);
```

---

## Vercel Deployment

### 환경변수 확인

```bash
# Vercel 환경변수 목록
vercel env ls

# 환경변수 추가
vercel env add SUPABASE_URL production
vercel --prod
```

### Memory Limit Exceeded

```javascript
// vercel.json
{
  "functions": {
    "src/app/api/**/*.ts": {
      "memory": 128,
      "maxDuration": 8
    }
  }
}
```

---

## GitHub Actions

### 일반적인 실패 원인

| 원인 | 증상 | 해결책 |
|------|------|--------|
| 환경변수 누락 | API 호출 실패 | Secrets 확인 |
| Node.js 버전 | 로컬과 다른 동작 | .nvmrc와 일치시킴 |
| NPM 429 에러 | 의존성 설치 실패 | 캐싱 + 재시도 |

### 로컬에서 CI 재현

```bash
# CI 환경 시뮬레이션
NODE_ENV=test npm run test:ci:fast

# 타입 체크
npx tsc --noEmit
```

### 권장 워크플로우 설정

```yaml
# 캐싱 추가
- uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      node_modules
      .next/cache
    key: ${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

---

## Claude 400 Error

### 증상

```
API Error: 400 { "type":"invalid_request_error",
  "message":"no low surrogate in string..." }
```

### 원인

- JSON 문자열에 깨진 유니코드 서러게이트 포함
- WSL/Windows 혼합 환경에서 인코딩 불일치
- 대용량 컨텍스트 구성 중 손상된 문자열

### 해결 절차

```bash
# 1. UTF-8 로케일로 실행
bash scripts/ai/launch-claude-wsl.sh

# 2. 설정 정리
npm run claude:sanitize

# 3. 제어문자 검색 (선택)
grep -rP '[\x00-\x08\x0B\x0C\x0E-\x1F]' src/
```

### WSL 환경 설정

```bash
# ~/.bashrc 추가
export LANG=ko_KR.UTF-8
export LC_ALL=ko_KR.UTF-8
export PYTHONIOENCODING=UTF-8
```

---

## Performance Issues

### Slow Database Queries

```sql
-- 인덱스 추가
CREATE INDEX idx_server_metrics_server_timestamp
ON server_metrics(server_id, timestamp DESC);

-- 쿼리 성능 확인
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM server_metrics WHERE server_id = 'x' LIMIT 100;
```

### React Re-render Issues

```typescript
// ✅ useCallback으로 최적화
const handleClick = useCallback(
  () => onServerClick(server.id),
  [server.id, onServerClick]
);
```

### Memory Leaks

```typescript
// ✅ 정리 함수 추가
useEffect(() => {
  const interval = setInterval(fetchMetrics, 1000);
  return () => clearInterval(interval); // Cleanup
}, []);
```

---

## Hydration Mismatches

```typescript
// ✅ Client-only 렌더링
const [mounted, setMounted] = useState(false);

useEffect(() => setMounted(true), []);

if (!mounted) return null;
return <ClientOnlyComponent />;
```

---

## Debugging Commands

```bash
# 개발 디버깅
npm run dev -- --inspect
npm run analyze
npm run type-check -- --watch

# Vercel 디버깅
vercel logs --follow
vercel inspect
```

---

## 빠른 체크리스트

### 배포 전

```bash
✅ npm run type-check
✅ npm run lint
✅ npm run test
✅ npm run build
✅ npm run start (로컬 프로덕션 테스트)
```

### 문제 발생 시

1. 에러 메시지 확인
2. 이 문서에서 해당 섹션 검색
3. 로컬에서 재현 시도
4. 해결 안 되면 → [system-recovery-guide-2025.md](./system-recovery-guide-2025.md)

---

## Related Documents

- [System Recovery Guide](./system-recovery-guide-2025.md) - 긴급 복구
- [Test Strategy](../guides/testing/test-strategy.md) - 테스트 전략
- [Development Guide](../DEVELOPMENT.md) - 개발 가이드

---

**이전 문서** (archived):
- `common.md` → 이 문서로 통합
- `build.md` → 이 문서로 통합
- `claude-400-invalid-json.md` → 이 문서로 통합
- `github-actions-analysis.md` → 이 문서로 통합
