/**
 * KB 문서 시드 스크립트
 *
 * 사용법: npx tsx scripts/seed-knowledge-base.ts
 *
 * knowledge_base 테이블에 운영 지식 문서를 추가합니다.
 * 이미 동일 title이 존재하면 스킵합니다.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL ?? '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 환경변수 필요');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

interface KBDocument {
  title: string;
  content: string;
  category: string;
  tags: string[];
  severity: string;
  source: string;
  related_server_types: string[];
}

const SEED_DOCUMENTS: KBDocument[] = [
  // ─── 점진적 메모리 누수 ───
  {
    title: '점진적 메모리 누수 탐지 및 대응 가이드',
    content: `## 점진적 메모리 누수 (Gradual Memory Leak)

### 증상
- 메모리 사용량이 시간 경과에 따라 지속적으로 증가 (시간당 1-5% 상승)
- OOM 이벤트 없이 며칠에 걸쳐 서서히 악화
- GC 빈도 증가, GC 소요 시간 점진적 증가
- 응답 시간이 메모리 증가와 비례하여 느려짐

### OOM과의 차이점
| 구분 | OOM | 점진적 누수 |
|------|-----|------------|
| 속도 | 수분 내 급격한 상승 | 수시간~수일에 걸친 완만한 상승 |
| 감지 | critical alert 즉시 발생 | warning 구간에서 장기 체류 |
| 복구 | 즉시 재시작 필요 | 계획된 재시작 가능 |

### 탐지 방법
1. **24시간 트렌드 분석**: 메모리 사용량의 기울기(slope) 계산
   - 시간당 +2% 이상이면 누수 의심
   - 시간당 +5% 이상이면 누수 확정
2. **GC 메트릭 모니터링**: Full GC 후에도 해제되지 않는 메모리 비율 확인
3. **힙 프로파일링**: Node.js의 경우 --inspect 플래그로 힙 스냅샷 비교

### 대응 기준
- **경고 단계** (slope +2~5%/h): 모니터링 강화, 원인 조사 시작
- **위험 단계** (slope +5%/h 이상): 계획된 rolling restart 수행
- **긴급 단계** (memory >85%): 즉시 재시작, 트래픽 우회

### 일반적 원인
- 이벤트 리스너 미해제
- 캐시 크기 제한 미설정 (unbounded cache)
- 클로저에 의한 의도치 않은 참조 유지
- 전역 변수에 데이터 누적`,
    category: 'troubleshooting',
    tags: ['memory', 'leak', 'gradual', 'gc', 'heap', 'monitoring'],
    severity: 'warning',
    source: 'seed-script',
    related_server_types: ['web', 'api', 'backend'],
  },

  // ─── 연쇄 장애 ───
  {
    title: '연쇄 장애 (Cascading Failure) 패턴 및 차단 전략',
    content: `## 연쇄 장애 (Cascading Failure)

### 전파 패턴
가장 일반적인 연쇄 장애 경로:

\`\`\`
DB 과부하 → API 타임아웃 증가 → 커넥션 풀 고갈 → Web 502 응답 → 사용자 재시도 → 부하 증폭
\`\`\`

### 서버 타입별 전파 시나리오

1. **DB → API → Web 경로** (가장 흔함)
   - DB slow query → API 응답 지연 → Web 타임아웃
   - 징후: DB CPU 상승 → 10-30분 후 API memory 상승 → Web error rate 증가

2. **Cache → API → Web 경로**
   - Redis/Memcached 장애 → cache miss 폭증 → DB 직접 조회 급증 → DB 과부하
   - 징후: Cache 연결 실패 → DB CPU 급등 → API 응답 시간 10x 증가

3. **네트워크 → 전체 서버 경로**
   - 네트워크 지연 증가 → 모든 서비스 간 통신 지연 → 타임아웃 연쇄
   - 징후: 모든 서버의 network 메트릭 동시 상승

### 탐지 지표
- 2개 이상의 서버 타입에서 **10분 이내** 연속 warning/critical 발생
- DB 서버 alert 발생 후 15분 이내 API 서버 alert 발생
- error rate가 baseline 대비 5배 이상 증가

### 차단점 (Circuit Breaker)
1. **DB 레벨**: slow query 자동 kill (30초 이상), 커넥션 수 제한
2. **API 레벨**: 요청 큐 크기 제한, 타임아웃 축소 (30초→5초)
3. **Web 레벨**: rate limiting, 정적 fallback 페이지
4. **Cache 레벨**: local cache fallback, cache-aside 패턴

### 복구 순서
연쇄 장애 시 반드시 **역순**으로 복구:
1. Web 서버 트래픽 차단 (maintenance 모드)
2. API 서버 큐 비우기
3. DB 정상화 확인
4. Cache 워밍업
5. API 서버 정상화 확인
6. Web 트래픽 점진적 복원 (10% → 50% → 100%)`,
    category: 'incident',
    tags: ['cascading', 'failure', 'circuit-breaker', 'recovery', 'chain'],
    severity: 'critical',
    source: 'seed-script',
    related_server_types: ['web', 'api', 'database', 'cache'],
  },

  // ─── 서버 타입별 정상 범위 ───
  {
    title: '서버 타입별 정상 메트릭 범위 기준 (Baseline)',
    content: `## 서버 타입별 정상 범위 기준

각 서버 타입은 역할에 따라 "정상" 메트릭 범위가 다릅니다.
아래는 운영 환경 기준 baseline입니다.

### Web 서버 (Nginx, Apache, Next.js)
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 10-45% | >60% | 정적 파일은 낮고, SSR은 높음 |
| Memory | 30-55% | >70% | SSR 캐시에 따라 변동 |
| Disk | 10-30% | >60% | 로그 로테이션 필수 |
| Network | 20-50% | >65% | 트래픽에 비례 |

### API 서버 (Express, Fastify, Hono)
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 15-50% | >65% | JSON 직렬화/역직렬화 비용 |
| Memory | 35-60% | >75% | 요청 처리 중 일시적 상승 정상 |
| Disk | 5-20% | >50% | 로그만 기록 |
| Network | 25-55% | >70% | upstream/downstream 모두 |

### Database 서버 (PostgreSQL, MySQL)
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 20-55% | >70% | 복잡한 쿼리 시 스파이크 정상 |
| Memory | 50-75% | >85% | 버퍼 캐시 포함 (높은 게 정상) |
| Disk | 30-60% | >75% | WAL + 데이터 + 인덱스 |
| Network | 10-35% | >50% | 결과셋 크기에 비례 |

> **주의**: DB 서버는 Memory 50-75%가 정상입니다. 버퍼/캐시를 적극 활용하므로 메모리가 낮으면 오히려 비효율적입니다.

### Cache 서버 (Redis, Memcached)
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 5-25% | >40% | 단순 키-값이므로 낮아야 정상 |
| Memory | 40-70% | >80% | eviction 정책에 따라 상한 다름 |
| Disk | 5-15% | >30% | RDB/AOF 백업 시 일시 상승 |
| Network | 30-60% | >75% | 높은 처리량 = 높은 네트워크 |

### Load Balancer / Gateway
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 5-20% | >35% | L4/L7 프록시만 수행 |
| Memory | 15-35% | >50% | 연결 테이블 크기에 비례 |
| Disk | 5-10% | >20% | 액세스 로그만 |
| Network | 40-70% | >80% | 모든 트래픽 경유 |

### Storage 서버 (NFS, S3 Gateway)
| 메트릭 | 정상 범위 | 주의 | 비고 |
|--------|----------|------|------|
| CPU | 5-15% | >30% | I/O 위주 |
| Memory | 20-40% | >60% | 파일 시스템 캐시 |
| Disk | 40-75% | >85% | 핵심 메트릭, 용량 계획 필수 |
| Network | 20-50% | >65% | 대용량 파일 전송 시 스파이크 |

### 활용 방법
- 각 서버 타입의 baseline과 현재 메트릭을 비교하여 이상 여부 판단
- 글로벌 임계값(80%/90%) 외에 타입별 "주의" 기준 참고
- 시간대별 패턴 고려 (업무시간 vs 야간)`,
    category: 'best_practice',
    tags: ['baseline', 'normal-range', 'server-type', 'threshold', 'metrics'],
    severity: 'info',
    source: 'seed-script',
    related_server_types: ['web', 'api', 'database', 'cache', 'load_balancer', 'storage'],
  },
];

async function main() {
  console.log('🌱 KB 시드 시작...');

  let inserted = 0;
  let skipped = 0;

  for (const doc of SEED_DOCUMENTS) {
    // 중복 체크 (title 기준)
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('title', doc.title)
      .limit(1);

    if (existing && existing.length > 0) {
      console.log(`⏭️  이미 존재: ${doc.title}`);
      skipped++;
      continue;
    }

    const { error } = await supabase.from('knowledge_base').insert(doc);

    if (error) {
      console.error(`❌ 실패: ${doc.title}`, error.message);
    } else {
      console.log(`✅ 추가: ${doc.title}`);
      inserted++;
    }
  }

  // 최종 문서 수 확인
  const { count } = await supabase
    .from('knowledge_base')
    .select('id', { count: 'exact', head: true });

  console.log(`\n📊 결과: ${inserted}건 추가, ${skipped}건 스킵`);
  console.log(`📚 KB 총 문서 수: ${count ?? '확인 불가'}`);
}

main().catch(console.error);
