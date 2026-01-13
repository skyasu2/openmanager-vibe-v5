# 🔌 API 설계

## 🔌 API 구조 (~57개 엔드포인트)

> **v5.85.0 업데이트**: API 라우트 통합으로 72개 → 57개로 축소 (-21%)

### 기능별 분산 아키텍처
```typescript
app/api/
├── ai/           # AI 관련 API
│   ├── supervisor/     # 메인 AI 엔드포인트
│   └── ...
├── servers/      # 서버 모니터링 API
│   ├── all/
│   ├── [id]/
│   └── realtime/
├── servers-unified/    # 통합 서버 API
├── auth/         # 인증 API
│   ├── github/
│   ├── session/
│   └── logout/
├── health/       # 🆕 통합 헬스체크 (ping, ai/health 통합)
├── system/       # 🆕 통합 시스템 API (status, initialize, optimize 등 통합)
├── database/     # 🆕 통합 DB API (status, reset-pool, readonly-mode 통합)
├── cache/        # 🆕 통합 캐시 API (stats, optimize 통합)
├── test/         # 테스트 API (auth/test → test/auth 이동)
└── debug/        # 디버그 API (auth/debug → debug/auth 이동)
```

### 통합 엔드포인트 (v5.85.0+)

| 엔드포인트 | 메서드 | 파라미터 | 설명 |
|-----------|--------|----------|------|
| `/api/health` | GET | `?simple=true`, `?service=ai` | 헬스체크 통합 |
| `/api/system` | GET | `?view=status\|metrics\|health\|processes\|memory` | 시스템 상태 |
| `/api/system` | POST | `action: start\|stop\|restart\|initialize\|optimize\|sync-data` | 시스템 제어 |
| `/api/database` | GET | `?view=status\|pool\|readonly` | DB 상태 |
| `/api/database` | POST | `action: reset\|readonly` | DB 제어 |
| `/api/cache` | GET | - | 캐시 통계 |
| `/api/cache` | POST | `action: optimize` | 캐시 최적화 |

### 핵심 API 패턴
```typescript
// 1. 표준 응답 구조
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// 2. 에러 처리 표준
export async function handleApiError(error: unknown) {
  return NextResponse.json({
    success: false,
    error: error instanceof Error ? error.message : 'Unknown error',
    timestamp: new Date().toISOString()
  }, { status: 500 });
}

// 3. 인증 미들웨어
const withAuth = (handler: Function) => {
  return async (req: NextRequest) => {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return handler(req);
  };
};
```

### 성능 최적화
- **응답시간**: 평균 152ms
- **캐시 전략**: API별 TTL 설정
- **Rate Limiting**: 사용자별 제한
- **압축**: Gzip 자동 적용

### API 설계 원칙
1. **RESTful 준수**: 표준 HTTP 메서드
2. **일관성**: 동일한 응답 구조
3. **보안**: 모든 API 인증 필수
4. **문서화**: TypeScript 타입 기반
