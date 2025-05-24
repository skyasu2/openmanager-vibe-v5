# 🛡️ Vercel 오류 방지 가이드

OpenManager Vibe V5 프로젝트에서 Vercel 배포 시 발생할 수 있는 오류들을 사전에 방지하기 위한 종합적인 가이드입니다.

## 📋 주요 Vercel 오류 코드와 대응 방안

### 1. 애플리케이션 오류 (Application Errors)

#### 🔧 MIDDLEWARE_INVOCATION_FAILED (500)
**원인**: 미들웨어 실행 중 예외 발생
**예방 조치**:
- `try-catch` 블록으로 모든 미들웨어 로직 감싸기
- 타임아웃 설정 (5초 이내)
- 로깅을 통한 디버깅 정보 수집

```typescript
// middleware.ts
export function middleware(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // 미들웨어 로직
    return NextResponse.next();
  } catch (error) {
    console.error('[Middleware] Error:', error);
    return NextResponse.redirect(new URL('/index.html', request.url));
  } finally {
    const duration = Date.now() - startTime;
    if (duration > 100) {
      console.warn(`[Middleware] Slow processing: ${duration}ms`);
    }
  }
}
```

#### ⏱️ MIDDLEWARE_INVOCATION_TIMEOUT (504)
**원인**: 미들웨어 실행 시간 초과
**예방 조치**:
- 실행 시간 1초 이내로 제한
- 복잡한 로직 최소화
- 비동기 작업 피하기

#### 📦 FUNCTION_PAYLOAD_TOO_LARGE (413)
**원인**: API 함수 요청/응답 페이로드 크기 초과 (1MB 제한)
**예방 조치**:
- 페이로드 크기 검증 함수 사용
- 큰 데이터는 스트리밍 처리
- 압축 적용

```typescript
import { validatePayloadSize } from '../lib/error-prevention';

export async function POST(request: Request) {
  const data = await request.json();
  
  if (!validatePayloadSize(data)) {
    return NextResponse.json(
      { error: 'Payload too large' },
      { status: 413 }
    );
  }
  
  // 처리 로직
}
```

#### 🔄 INFINITE_LOOP_DETECTED (508)
**원인**: 리다이렉션 무한 루프
**예방 조치**:
- 리다이렉션 카운터 구현
- 순환 참조 방지
- 명확한 종료 조건 설정

### 2. 요청 오류 (Request Errors)

#### 📏 URL_TOO_LONG (414)
**원인**: URL 길이 2048자 초과
**예방 조치**:
- URL 길이 검증
- 긴 파라미터는 POST body로 전송
- URL 단축 서비스 활용

#### 📄 REQUEST_HEADER_TOO_LARGE (431)
**원인**: 요청 헤더 크기 8KB 초과
**예방 조치**:
- 불필요한 헤더 제거
- 헤더 크기 검증
- 큰 데이터는 body로 전송

## 🚀 구현된 오류 방지 시스템

### 1. Error Prevention Library
`src/lib/error-prevention.ts`에서 제공하는 핵심 기능:

- **withMiddlewareTimeout**: 미들웨어 타임아웃 보호
- **validatePayloadSize**: 페이로드 크기 검증
- **validateUrlLength**: URL 길이 검증
- **LoopPrevention**: 무한 루프 방지
- **getMemoryUsage**: 메모리 사용량 모니터링

### 2. 종합적인 오류 방지 래퍼

```typescript
import { withErrorPrevention } from '../lib/error-prevention';

export async function GET() {
  return withErrorPrevention(
    async () => {
      // API 로직
      return { data: 'success' };
    },
    {
      operationName: 'health-check',
      timeoutMs: 5000,
      preventLoop: 'health-check-operation'
    }
  );
}
```

## 📊 모니터링 및 알림

### 1. Health Check API
`/api/health` - 시스템 전반적인 상태 모니터링

### 2. Deployment Status API
`/api/deployment-status` - Vercel 배포 상태 및 오류 감지

### 3. Error Reporting API
`/api/error-report` - 클라이언트 오류 수집 및 분석

## 🔧 개발 워크플로우

### 1. 로컬 개발 시 확인사항
```bash
# 타입 체크
npm run type-check

# 린팅 검사
npm run lint

# 빌드 테스트
npm run build

# 헬스체크
npm run health-check
```

### 2. 배포 전 체크리스트
- [ ] 모든 테스트 통과
- [ ] TypeScript 오류 없음
- [ ] ESLint 경고 최소화
- [ ] 번들 크기 확인
- [ ] 성능 테스트 통과

### 3. CI/CD 파이프라인
GitHub Actions에서 자동화된 검증:
- 코드 품질 검사
- 보안 감사
- 성능 테스트
- 자동 배포
- 헬스체크
- 롤백 시스템

## 🚨 응급 상황 대응

### 1. 배포 실패 시
```bash
# 이전 버전으로 롤백
vercel rollback --token=$VERCEL_TOKEN

# 로그 확인
vercel logs --token=$VERCEL_TOKEN
```

### 2. API 오류 발생 시
1. `/api/health` 엔드포인트 확인
2. `/api/deployment-status` 상태 점검
3. Vercel 대시보드 Functions 탭 확인
4. 오류 로그 분석

### 3. 성능 문제 시
1. Lighthouse 성능 측정
2. 번들 크기 분석
3. 메모리 사용량 확인
4. 응답 시간 모니터링

## 📈 성능 최적화

### 1. 함수 최적화
- 실행 시간 10초 이내
- 메모리 사용량 80% 이하
- 페이로드 크기 1MB 이하

### 2. 미들웨어 최적화
- 실행 시간 1초 이내
- 최소한의 로직만 포함
- 캐싱 활용

### 3. 정적 자산 최적화
- 이미지 압축
- CSS/JS 번들링
- CDN 활용

## 🔍 디버깅 도구

### 1. Vercel 대시보드
- Functions 탭: 함수 로그 및 성능
- Analytics 탭: 사용량 통계
- Deployments 탭: 배포 이력

### 2. 브라우저 개발자 도구
- Network 탭: API 응답 시간
- Console 탭: 클라이언트 오류
- Performance 탭: 페이지 성능

### 3. 로깅 시스템
- 구조화된 로그 포맷
- 오류 레벨 분류
- 타임스탬프 포함

## 🎯 권장사항

1. **정기적인 모니터링**: 주간 성능 리포트 검토
2. **프로액티브 대응**: 임계값 도달 시 사전 최적화
3. **문서화**: 모든 오류 사례와 해결책 기록
4. **테스트 자동화**: CI/CD 파이프라인 지속 개선
5. **팀 교육**: Vercel 플랫폼 특성 이해

## 📞 지원 연락처

- Vercel 공식 지원: [https://vercel.com/help](https://vercel.com/help)
- 프로젝트 이슈: GitHub Issues 탭
- 긴급 상황: 팀 리더에게 즉시 연락

---

**마지막 업데이트**: 2024년 12월
**버전**: 1.0.0
**관리자**: OpenManager Vibe V5 Team 