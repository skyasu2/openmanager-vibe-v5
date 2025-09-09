# API 설계

```yaml
title: "API Architecture Design"
version: "v5.77"
updated: "2025-09-09"
type: "api-design"
ai_priority: "critical"
cache_hint: "frequently_accessed"
load_priority: "critical"
token_estimate: 690
read_time: "3분"
related_weight: 0.9
dependencies: ["security.md", "database.md"]
cache_ttl: 300
preload: true
```

## 🔌 API 구조 (76개 엔드포인트)

### 기능별 분산 아키텍처
```typescript
app/api/
├── ai/           # 30개 AI 관련 API
│   ├── analyze/
│   ├── chat/
│   └── suggestions/
├── servers/      # 25개 서버 모니터링 API
│   ├── metrics/
│   ├── status/
│   └── history/
├── auth/         # 10개 인증 API
│   ├── github/
│   ├── session/
│   └── logout/
├── system/       # 15개 시스템 API
│   ├── health/
│   ├── config/
│   └── logs/
└── misc/         # 10개 기타 API
```

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