# API 라우트 통합 계획서

**작성일**: 2026-01-08
**버전**: v5.84.1
**작성자**: Claude Code

---

## 1. 현황 분석

### 1.1 현재 상태
- **총 API 라우트**: 72개
- **중복/분산 라우트**: 약 18개
- **목표**: 55-57개로 축소 (약 20% 감소)

### 1.2 문제점
1. Health check 엔드포인트 3개 중복
2. Server 관련 라우트 7개 분산
3. 유사 기능 라우트 네이밍 불일치
4. action 파라미터 미활용으로 인한 라우트 증가

---

## 2. 통합 대상 및 우선순위

### Phase 1: CRITICAL (즉시 적용)

#### 1.1 Health Check 통합
| 현재 | 목표 | 변경사항 |
|------|------|----------|
| `/api/health` | `/api/health` (유지) | 메인 헬스체크 |
| `/api/ping` | `/api/health?simple=true` | 쿼리 파라미터로 전환 |
| `/api/ai/health` | `/api/health?service=ai` | 서비스별 체크 통합 |

**구현 방식**:
```typescript
// GET /api/health
// ?simple=true  → ping 응답 (200 OK)
// ?service=ai   → AI Engine 헬스체크
// (default)     → 전체 시스템 헬스체크
```

**삭제 대상**:
- `src/app/api/ping/route.ts` → 제거
- `src/app/api/ai/health/route.ts` → 제거

---

### Phase 2: HIGH (1일)

#### 2.1 Server Data 라우트 정리
현재 `/api/servers-unified`가 이미 통합 역할 수행 중.

| 현재 | 상태 | 조치 |
|------|------|------|
| `/api/servers` | redirect → all | 유지 (하위호환) |
| `/api/servers/all` | 사용중 | 유지 |
| `/api/servers/[id]` | 사용중 | 유지 |
| `/api/servers/[id]/processes` | 사용중 | 유지 |
| `/api/servers/mock` | 개발용 | `/api/servers?variant=mock` 전환 검토 |
| `/api/servers/realtime` | 사용중 | 유지 |
| `/api/servers-unified` | 통합 API | **주력 사용** |

**조치**:
- `servers/mock` → 쿼리 파라미터 전환 고려 (breaking change 최소화)
- 문서화 강화로 `/api/servers-unified` 사용 권장

---

### Phase 3: MEDIUM (2-3일)

#### 3.1 System Status 통합
| 현재 | 목표 | 변경사항 |
|------|------|----------|
| `/api/system/status` | `/api/system` | action 파라미터 추가 |
| `/api/system/initialize` | `/api/system?action=init` | 통합 |
| `/api/system/start` | `/api/system?action=start` | 통합 |
| `/api/system/unified` | 병합 또는 제거 | 검토 필요 |

**구현 방식**:
```typescript
// POST /api/system
// body.action: 'status' | 'init' | 'start' | 'stop' | 'optimize'
```

#### 3.2 Database 라우트 통합
| 현재 | 목표 |
|------|------|
| `/api/database/status` | `/api/database` (GET) |
| `/api/database/reset-pool` | `/api/database` (POST, action=reset) |
| `/api/database/readonly-mode` | `/api/database` (POST, action=readonly) |

#### 3.3 Cache 라우트 통합
| 현재 | 목표 |
|------|------|
| `/api/cache/stats` | `/api/cache` (GET) |
| `/api/cache/optimize` | `/api/cache` (POST, action=optimize) |

---

### Phase 4: LOW (선택적)

#### 4.1 Test/Debug 라우트 정리
| 현재 | 조치 |
|------|------|
| `/api/auth/test` | `/api/test/auth`로 이동 |
| `/api/auth/debug` | `/api/debug/auth`로 이동 |
| `/api/test/timezone` | 유지 |
| `/api/debug/env` | 유지 |

---

## 3. 구현 세부사항

### 3.1 Phase 1 구현 (Health Check)

#### 변경 파일
```
src/app/api/health/route.ts     # 수정 (통합 로직)
src/app/api/ping/route.ts       # 삭제
src/app/api/ai/health/route.ts  # 삭제
```

#### 수정 후 health/route.ts 구조
```typescript
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const simple = searchParams.get('simple') === 'true';
  const service = searchParams.get('service');

  // Simple ping
  if (simple) {
    return new Response('pong', { status: 200 });
  }

  // Service-specific health
  if (service === 'ai') {
    return checkAIHealth();
  }

  // Full system health
  return checkSystemHealth();
}
```

### 3.2 하위호환성 보장

#### Deprecation 패턴
```typescript
// 기존 /api/ping → /api/health?simple=true 리다이렉트
export async function GET() {
  console.warn('[DEPRECATED] /api/ping is deprecated. Use /api/health?simple=true');
  return NextResponse.redirect('/api/health?simple=true');
}
```

---

## 4. 검증 계획

### 4.1 각 Phase별 검증
| Phase | 검증 항목 |
|-------|----------|
| 1 | Health check 응답, AI Engine 연결 |
| 2 | 서버 목록/상세 API 정상 동작 |
| 3 | 시스템 상태, DB 연결, 캐시 통계 |
| 4 | 테스트 엔드포인트 동작 |

### 4.2 E2E 테스트
```bash
npm run test:vercel:e2e
```

### 4.3 수동 검증 체크리스트
- [ ] Dashboard 서버 목록 로딩
- [ ] AI 채팅 응답
- [ ] 시스템 상태 표시
- [ ] Vercel 배포 헬스체크

---

## 5. 예상 결과

### 5.1 정량적 효과
| 지표 | 현재 | 목표 | 개선율 |
|------|------|------|--------|
| API 라우트 수 | 72개 | 57개 | -21% |
| 중복 코드 | ~500줄 | 0줄 | -100% |
| 네이밍 일관성 | 중간 | 높음 | - |

### 5.2 정성적 효과
- 유지보수성 향상
- API 문서화 단순화
- 신규 개발자 온보딩 용이

---

## 6. 리스크 및 완화 전략

| 리스크 | 영향도 | 완화 전략 |
|--------|--------|----------|
| 기존 클라이언트 호환성 | 높음 | Deprecation 경고 + 리다이렉트 |
| AI Engine 연동 실패 | 중간 | 독립 헬스체크 유지 |
| 배포 중 다운타임 | 낮음 | Phase별 점진적 배포 |

---

## 7. 실행 순서

### Day 1: Phase 1 (Critical)
1. [ ] `/api/health` 통합 로직 구현
2. [ ] `/api/ping` deprecation 처리
3. [ ] `/api/ai/health` 통합
4. [ ] TypeScript 검증
5. [ ] 커밋

### Day 2: Phase 2-3 (High/Medium)
1. [ ] Server mock 라우트 검토
2. [ ] System 라우트 통합
3. [ ] Database/Cache 라우트 통합
4. [ ] 전체 테스트

### Day 3: Phase 4 + 문서화
1. [ ] Test/Debug 라우트 정리
2. [ ] API 문서 업데이트
3. [ ] 최종 검증 및 배포

---

## 8. 승인

- [ ] 계획 검토 완료
- [ ] Phase 1 진행 승인

**비고**: Phase 1만 먼저 진행하고, 결과에 따라 Phase 2-4 진행 여부 결정 가능

---

*Last Updated: 2026-01-08*
