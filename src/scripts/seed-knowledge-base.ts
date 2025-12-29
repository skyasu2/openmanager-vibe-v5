/**
 * Knowledge Base Seed Script
 * RAG 지식베이스 초기 데이터 시딩
 *
 * 무료 티어 준수:
 * - Gemini text-embedding-004 (1,500 RPM)
 * - 1회 실행용 (백그라운드 작업 아님)
 * - 예상 임베딩: ~30개 문서 × 1 API call = 30 calls
 *
 * 실행: npx tsx src/scripts/seed-knowledge-base.ts
 */

import { createClient } from '@supabase/supabase-js';
import { google } from '@ai-sdk/google';
import { embedMany } from 'ai';
import dotenv from 'dotenv';
import path from 'path';

// Load Env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// ============================================================================
// 1. 지식베이스 시드 데이터 정의
// ============================================================================

interface KnowledgeEntry {
  title: string;
  content: string;
  category: 'incident' | 'troubleshooting' | 'best_practice' | 'command' | 'architecture';
  tags: string[];
  severity: 'info' | 'warning' | 'critical';
  related_server_types: string[];
}

const KNOWLEDGE_ENTRIES: KnowledgeEntry[] = [
  // ============================================================================
  // 인시던트 가이드
  // ============================================================================
  {
    title: 'CPU 사용량 급증 대응 가이드',
    content: `CPU 사용량이 80% 이상 급증한 경우:
1. top/htop으로 CPU 소비 프로세스 확인
2. 비정상 프로세스 있으면 kill -15로 종료 시도
3. 애플리케이션 로그 확인 (무한루프, 메모리 누수 의심)
4. 필요시 서비스 재시작
5. 반복되면 스케일 아웃 또는 코드 최적화 검토`,
    category: 'incident',
    tags: ['cpu', 'performance', 'scale'],
    severity: 'warning',
    related_server_types: ['web', 'application'],
  },
  {
    title: '메모리 부족 장애 대응',
    content: `메모리 사용량 90% 이상 또는 OOM Killer 발생 시:
1. free -h로 메모리 상태 확인
2. ps aux --sort=-%mem으로 메모리 소비 프로세스 확인
3. 캐시 정리: echo 3 > /proc/sys/vm/drop_caches
4. 메모리 누수 의심 프로세스 재시작
5. 장기적으로 메모리 증설 또는 애플리케이션 최적화`,
    category: 'incident',
    tags: ['memory', 'oom', 'performance'],
    severity: 'critical',
    related_server_types: ['application', 'cache'],
  },
  {
    title: '디스크 용량 부족 대응',
    content: `디스크 사용량 85% 이상 경고 시:
1. df -h로 파티션별 사용량 확인
2. du -sh /*로 대용량 디렉토리 탐색
3. 로그 파일 정리: find /var/log -mtime +7 -delete
4. 임시 파일 정리: rm -rf /tmp/*
5. Docker 정리: docker system prune -a
6. 필요시 디스크 증설 또는 로그 로테이션 설정`,
    category: 'incident',
    tags: ['disk', 'storage', 'cleanup'],
    severity: 'warning',
    related_server_types: ['storage', 'database'],
  },
  {
    title: '네트워크 지연 장애 대응',
    content: `네트워크 지연 또는 패킷 손실 발생 시:
1. ping으로 기본 연결 확인
2. traceroute로 경로 추적
3. netstat -an으로 연결 상태 확인
4. 방화벽 규칙 점검
5. 네트워크 인터페이스 재시작: systemctl restart networking
6. ISP 또는 클라우드 프로바이더 상태 확인`,
    category: 'incident',
    tags: ['network', 'latency', 'connectivity'],
    severity: 'critical',
    related_server_types: ['web', 'loadbalancer'],
  },

  // ============================================================================
  // 트러블슈팅 가이드
  // ============================================================================
  {
    title: '웹 서버 502 에러 해결',
    content: `502 Bad Gateway 에러 발생 시 점검 사항:
1. 백엔드 서비스 실행 상태 확인
2. upstream 서버 연결 테스트
3. 프록시 타임아웃 설정 확인
4. 로드밸런서 헬스체크 상태 확인
5. 백엔드 애플리케이션 로그 분석`,
    category: 'troubleshooting',
    tags: ['http', '502', 'proxy', 'nginx'],
    severity: 'warning',
    related_server_types: ['web', 'loadbalancer'],
  },
  {
    title: '데이터베이스 연결 실패 해결',
    content: `DB 연결 실패 시 점검 사항:
1. DB 서비스 실행 상태: systemctl status postgresql
2. 네트워크 연결: telnet db-host 5432
3. 인증 정보 확인 (pg_hba.conf)
4. 연결 풀 상태 확인
5. 최대 연결 수 초과 여부: show max_connections;
6. 방화벽 규칙 확인`,
    category: 'troubleshooting',
    tags: ['database', 'connection', 'postgresql'],
    severity: 'critical',
    related_server_types: ['database', 'application'],
  },
  {
    title: '캐시 서버 성능 저하 해결',
    content: `Redis/Memcached 성능 저하 시:
1. 메모리 사용량 확인: INFO memory
2. 키 만료 정책 점검
3. 슬로우 로그 확인: SLOWLOG GET 10
4. 연결 수 확인: CLIENT LIST
5. 필요시 캐시 플러시: FLUSHDB (주의!)
6. 클러스터 모드에서 샤드 밸런싱 확인`,
    category: 'troubleshooting',
    tags: ['cache', 'redis', 'performance'],
    severity: 'warning',
    related_server_types: ['cache'],
  },
  // [REMOVED] 로드밸런서 헬스체크 실패 - Vercel/Cloud Run 자동 관리

  // ============================================================================
  // 베스트 프랙티스
  // ============================================================================
  {
    title: '서버 모니터링 베스트 프랙티스',
    content: `효과적인 서버 모니터링 가이드:
1. 핵심 메트릭: CPU, 메모리, 디스크, 네트워크
2. 임계값 설정: 경고 70%, 위험 85%
3. 로그 중앙화: ELK 또는 CloudWatch
4. 알림 설정: 슬랙, 이메일, PagerDuty
5. 대시보드 구성: Grafana 활용
6. 정기 리뷰: 주간 성능 리포트`,
    category: 'best_practice',
    tags: ['monitoring', 'metrics', 'alerting'],
    severity: 'info',
    related_server_types: ['web', 'application', 'database'],
  },
  {
    title: '보안 강화 체크리스트',
    content: `서버 보안 강화 필수 항목:
1. SSH 키 기반 인증 (비밀번호 비활성화)
2. 방화벽 설정 (필요한 포트만 오픈)
3. 정기 보안 패치 적용
4. 불필요한 서비스 비활성화
5. 로그 모니터링 및 침입 탐지
6. 정기 백업 및 복구 테스트`,
    category: 'best_practice',
    tags: ['security', 'hardening', 'compliance'],
    severity: 'info',
    related_server_types: ['web', 'application', 'database'],
  },
  {
    title: '백업 및 복구 전략',
    content: `데이터 보호를 위한 백업 전략:
1. 3-2-1 규칙: 3개 복사본, 2개 미디어, 1개 오프사이트
2. 자동화된 일일 백업
3. 주간 전체 백업, 일일 증분 백업
4. 정기 복구 테스트 (분기별)
5. 암호화된 백업 저장
6. 보존 정책: 일일 7일, 주간 4주, 월간 12개월`,
    category: 'best_practice',
    tags: ['backup', 'recovery', 'disaster-recovery'],
    severity: 'info',
    related_server_types: ['database', 'storage'],
  },

  // ============================================================================
  // CLI 명령어 가이드
  // ============================================================================
  {
    title: '시스템 상태 확인 명령어',
    content: `시스템 상태 점검 필수 명령어:
- uptime: 시스템 가동 시간 및 로드
- free -h: 메모리 사용량
- df -h: 디스크 사용량
- top/htop: 프로세스 모니터링
- netstat -tlnp: 열린 포트 확인
- systemctl status: 서비스 상태`,
    category: 'command',
    tags: ['linux', 'system', 'monitoring'],
    severity: 'info',
    related_server_types: ['web', 'application', 'database'],
  },
  {
    title: '로그 분석 명령어',
    content: `로그 분석을 위한 유용한 명령어:
- tail -f /var/log/syslog: 실시간 로그
- grep -i error /var/log/app.log: 에러 검색
- awk '/ERROR/{print $0}': 패턴 필터링
- journalctl -u nginx: systemd 로그
- zcat app.log.gz | grep error: 압축 로그 검색
- less +F: 대화형 로그 뷰어`,
    category: 'command',
    tags: ['log', 'debugging', 'linux'],
    severity: 'info',
    related_server_types: ['web', 'application'],
  },
  {
    title: '네트워크 진단 명령어',
    content: `네트워크 문제 진단 명령어:
- ping host: 연결 확인
- traceroute host: 경로 추적
- curl -v url: HTTP 요청 상세
- ss -tlnp: 소켓 통계
- iftop: 네트워크 트래픽 모니터링
- tcpdump: 패킷 캡처`,
    category: 'command',
    tags: ['network', 'debugging', 'linux'],
    severity: 'info',
    related_server_types: ['web', 'loadbalancer'],
  },

  // ============================================================================
  // 아키텍처 가이드
  // ============================================================================
  {
    title: '고가용성 아키텍처 설계',
    content: `시스템 고가용성 확보 전략:
1. 다중 가용 영역(AZ) 배포
2. 로드밸런서를 통한 트래픽 분산
3. 데이터베이스 복제 (Primary-Replica)
4. 자동 장애 조치(Failover) 구성
5. 상태 비저장(Stateless) 애플리케이션 설계
6. 정기 장애 대응 훈련`,
    category: 'architecture',
    tags: ['high-availability', 'failover', 'redundancy'],
    severity: 'info',
    related_server_types: ['web', 'database', 'loadbalancer'],
  },
  // [REMOVED] 마이크로서비스 통신 패턴 - 모놀리식 Next.js 구조 사용
  {
    title: 'Vercel/Cloud Run 캐시 전략',
    content: `프로젝트 캐시 전략 (Vercel + Cloud Run):
1. Vercel Edge Cache: stale-while-revalidate 패턴 적용
2. API Route 캐시: Cache-Control 헤더로 제어
3. Cloud Run 메모리 캐시: LRU 캐시 (분석 결과 임시 저장)
4. RAG 쿼리 캐시: 자주 검색되는 쿼리 결과 10분 TTL
5. Supabase 커넥션 풀: Supavisor 활용 (포트 6543)
6. 무효화: 배포 시 자동 또는 /api/cache/optimize 호출`,
    category: 'architecture',
    tags: ['cache', 'vercel', 'cloud-run', 'performance'],
    severity: 'info',
    related_server_types: ['web', 'application'],
  },
  // ============================================================================
  // 5. 모던 인프라 & 컨테이너 (New)
  // ============================================================================
  {
    title: 'Docker 컨테이너 트러블슈팅',
    content: `컨테이너 상태 이상 시 점검 가이드:
1. CrashLoopBackOff: 애플리케이션 시작 실패. docker logs로 에러 확인
2. OOMKilled: 메모리 제한 초과. 리소스 제한 상향 또는 메모리 누수 점검
3. ImagePullBackOff: 이미지 경로/인증 확인. docker pull 수동 테스트
4. 네트워크 연결 불가: 포트 바인딩(-p) 확인, 도커 네트워크 inspect
5. 좀비 프로세스: dumb-init 사용 또는 부모 프로세스 확인`,
    category: 'troubleshooting',
    tags: ['docker', 'container', 'kubernetes', 'debug'],
    severity: 'warning',
    related_server_types: ['application', 'web'],
  },
  // [REMOVED] Kubernetes 파드 상태 진단 - Cloud Run 서버리스 사용, K8s 미사용
  // ============================================================================
  // 6. 데이터베이스 심화 (New)
  // ============================================================================
  {
    title: 'PostgreSQL 교착 상태(Deadlock) 해결',
    content: `DB 락 경합 및 데드락 발생 시:
1. pg_stat_activity로 장기 실행 쿼리 및 락 대기 확인
2. 락 점유 프로세스 확인: SELECT pg_blocking_pids(pid)
3. 데드락 유발 쿼리 튜닝 (트랜잭션 순서 통일)
4. 응급 조치: pg_terminate_backend(pid)로 세션 강제 종료
5. 인덱스 누락으로 인한 테이블 락 방지`,
    category: 'troubleshooting',
    tags: ['postgresql', 'database', 'deadlock', 'performance'],
    severity: 'critical',
    related_server_types: ['database'],
  },
  {
    title: 'PostgreSQL 성능 최적화 가이드',
    content: `쿼리 성능 저하 시 최적화 포인트:
1. EXPLAIN ANALYZE로 실행 계획 확인 (Seq Scan 여부)
2. 인덱스 튜닝 (복합 인덱스, 부분 인덱스 활용)
3. 정기적인 VACUUM ANALYZE 실행 (통계 정보 갱신)
4. work_mem, shared_buffers 등 메모리 파라미터 튜닝
5. 커넥션 풀링(PgBouncer) 도입 검토`,
    category: 'best_practice',
    tags: ['postgresql', 'optimization', 'tuning', 'sql'],
    severity: 'info',
    related_server_types: ['database'],
  },
  // ============================================================================
  // 7. 클라우드 플랫폼 가이드 (New)
  // ============================================================================
  {
    title: 'Google Cloud Run 운영 가이드',
    content: `Cloud Run 무서버 환경 운영 팁:
1. Cold Start 대응: min-instances 설정 또는 CPU always allocated
2. 메모리 OOM: 서비스 탭에서 메모리 한도 상향 (최대 32GB)
3. 동시성(Concurrency) 설정: 요청 처리량에 맞춰 조정 (기본 80)
4. 배포 실패 시: 로컬 Docker run으로 에러 재현, 포트(8080) 확인
5. 비용 최적화: 유휴 상태 CPU 할당 해제 옵션 활용`,
    category: 'best_practice',
    tags: ['gcp', 'cloud-run', 'serverless', 'operations'],
    severity: 'info',
    related_server_types: ['application', 'web'],
  },
  {
    title: 'Supabase 스토리지 및 보안 관리',
    content: `Supabase 프로젝트 관리 가이드:
1. Disk IOPS 경고: Compute Add-on 업그레이드 또는 쿼리 최적화
2. RLS(Row Level Security) 정책 필수 적용 (service_role 제외)
3. API Gateway 차단: Kong 로그 확인
4. 백업 복구: Point-in-Time Recovery(PITR) 활성화 검토
5. 커넥션 풀러(Supavisor) 사용 (포트 6543/5432 구분)`,
    category: 'best_practice',
    tags: ['supabase', 'security', 'database', 'cloud'],
    severity: 'info',
    related_server_types: ['database'],
  },
  // ============================================================================
  // 8. 메트릭 해석 가이드 (New)
  // ============================================================================
  {
    title: 'Load Average 해석 가이드',
    content: `Load Average 수치의 의미:
1. 정의: 실행 중이거나 대기 중인 프로세스의 평균 개수
2. 기준: CPU 코어 수보다 높으면 과부하 의심 (1.0 = 1코어 100%)
3. Load > 코어 수: CPU 대기 발생 중
4. 높은 Load, 낮은 CPU 사용률: 디스크 I/O 병목 가능성 높음
5. 확인: uptime, top, vmstat`,
    category: 'best_practice',
    tags: ['metric', 'cpu', 'load-average', 'monitoring'],
    severity: 'info',
    related_server_types: ['all'],
  },
  {
    title: 'I/O Wait (wa) 메트릭 분석',
    content: `CPU wa(Wait I/O)가 높을 때의 의미:
1. 현상: CPU가 디스크 입출력 완료를 기다리는 시간
2. 원인: 느린 디스크, 과도한 로깅, 스왑(Swap) 사용, DB 풀 스캔
3. 진단: iotop으로 디스크 사용토 높은 프로세스 식별
4. 해결: 쿼리 튜닝, 로깅 레벨 조정, 디스크 증설(IOPS)
5. 오해: CPU 부하가 아님, I/O 시스템의 병목임`,
    category: 'best_practice',
    tags: ['metric', 'io', 'disk', 'performance'],
    severity: 'info',
    related_server_types: ['database', 'storage'],
  },
  // ============================================================================
  // 9. OpenManager VIBE 프로젝트 특화 가이드 (New - 2025-12-29)
  // ============================================================================
  {
    title: 'AI SDK 모델 폴백 처리',
    content: `AI SDK 모델 호출 실패 시 폴백 처리:
1. 우선순위: Groq → Cerebras → Mistral → Google AI
2. 429 Too Many Requests: Rate Limit 도달, 다음 모델로 즉시 폴백
3. 503 Service Unavailable: 30초 대기 후 재시도, 실패 시 폴백
4. 모든 모델 실패 시: 캐시된 응답 반환 또는 Fallback 메시지
5. 폴백 상태 확인: /api/ai/status 엔드포인트 조회
6. 로그 위치: Cloud Run 콘솔 또는 /api/ai/logging/stream`,
    category: 'troubleshooting',
    tags: ['ai-sdk', 'fallback', 'groq', 'cerebras', 'mistral'],
    severity: 'warning',
    related_server_types: ['application'],
  },
  {
    title: 'Vercel 빌드/배포 실패 대응',
    content: `Vercel 배포 실패 시 점검 사항:
1. 함수 크기 제한: Serverless 50MB, Edge 4MB 초과 확인
2. Edge Function 타임아웃: 25초 제한 (Pro: 300초)
3. 환경변수 누락: NEXT_PUBLIC_ 접두사 필수 (클라이언트용)
4. 빌드 메모리: 8GB 초과 시 OOM, 코드 스플리팅 필요
5. 롤백 방법: vercel rollback 또는 대시보드에서 이전 배포 선택
6. 프리뷰 실패: git push 후 Vercel 대시보드에서 로그 확인`,
    category: 'incident',
    tags: ['vercel', 'deployment', 'edge-function', 'build'],
    severity: 'warning',
    related_server_types: ['web'],
  },
  {
    title: 'RAG 검색 성능 저하 해결',
    content: `pgvector RAG 검색 지연 시 점검:
1. HNSW 인덱스 상태: SELECT * FROM pg_indexes WHERE indexname LIKE 'idx_%_hnsw'
2. 임베딩 차원 확인: 384 dim 표준 (text-embedding-004)
3. 유사도 임계값 조정: 0.3 → 0.4 (정밀도 우선) 또는 0.25 (재현율 우선)
4. Graph Hop 제한: maxHops 2 → 1 (속도 우선)
5. 벡터 수 확인: 10,000개 초과 시 파티셔닝 검토
6. 캐시 활용: 자주 검색되는 쿼리 결과 캐싱`,
    category: 'troubleshooting',
    tags: ['rag', 'pgvector', 'hnsw', 'supabase', 'performance'],
    severity: 'warning',
    related_server_types: ['database'],
  },
  {
    title: 'Cloud Run Cold Start 최소화',
    content: `AI Engine Cold Start 대응 전략:
1. min-instances: 1 설정 (월 ~$30 추가, 상시 대기)
2. CPU always-allocated: 유휴 시에도 CPU 할당 유지
3. 첫 요청 타임아웃: 클라이언트에서 60초로 설정
4. 웜업 스케줄링: Cloud Scheduler로 /health 주기적 호출
5. 컨테이너 최적화: 이미지 크기 축소, 불필요 의존성 제거
6. 동시성 설정: concurrency 80 (기본값) 유지 권장`,
    category: 'best_practice',
    tags: ['cloud-run', 'cold-start', 'gcp', 'performance'],
    severity: 'info',
    related_server_types: ['application'],
  },
  {
    title: '이상 탐지 결과 해석 가이드',
    content: `detectAnomalies 도구 결과 해석:
1. severity 레벨: critical(즉시조치), warning(모니터링), info(참고)
2. confidence > 0.8: 높은 신뢰도, 실제 이상일 가능성 높음
3. threshold 기준: 6시간 이동평균 기준 2σ(표준편차) 초과
4. 오탐 패턴: 정기 점검 시간대, 배포 직후 스파이크, 주말 트래픽 감소
5. isAnomaly: true + severity: critical → 즉시 알림 발송
6. 연속 이상: 3회 이상 연속 감지 시 인시던트 생성 권장`,
    category: 'best_practice',
    tags: ['anomaly-detection', 'monitoring', 'threshold', 'alert'],
    severity: 'info',
    related_server_types: ['all'],
  },
  {
    title: 'Multi-Agent Supervisor 라우팅 실패',
    content: `AI SDK Supervisor 라우팅 문제 해결:
1. Intent 분류 실패: 기본 에이전트(NLQ)로 폴백
2. Agent 응답 없음: 30초 타임아웃 후 다음 에이전트 시도
3. 토큰 제한 초과: maxTokens 4096 확인, 긴 컨텍스트 분할
4. 스트리밍 에러: JSON 파싱 실패 시 raw 텍스트 반환
5. 라우팅 로그: Cloud Run 로그에서 "[Supervisor]" 키워드 검색
6. 폴백 체인: NLQ → Analyst → Reporter (우선순위)`,
    category: 'troubleshooting',
    tags: ['ai-sdk', 'supervisor', 'multi-agent', 'routing'],
    severity: 'warning',
    related_server_types: ['application'],
  },
];

// ============================================================================
// 2. 임베딩 및 시딩 로직
// ============================================================================

async function seedKnowledgeBase() {
  console.log('🚀 Knowledge Base Seeding Started...\n');

  // 환경변수 확인
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const googleApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY_PRIMARY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }

  if (!googleApiKey) {
    console.error('❌ Missing Google AI API key (GOOGLE_AI_API_KEY or GEMINI_API_KEY_PRIMARY)');
    process.exit(1);
  }

  // 환경변수 설정 (AI SDK가 참조)
  process.env.GOOGLE_GENERATIVE_AI_API_KEY = googleApiKey;

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log(`📦 Preparing ${KNOWLEDGE_ENTRIES.length} knowledge entries...\n`);

  // 1. 임베딩 생성 (배치)
  console.log('🧠 Generating embeddings with Gemini text-embedding-004...');

  const texts = KNOWLEDGE_ENTRIES.map(e => `${e.title}\n\n${e.content}`);

  const model = google.textEmbedding('text-embedding-004');
  const { embeddings } = await embedMany({
    model,
    values: texts,
    experimental_telemetry: { isEnabled: false },
    providerOptions: {
      google: {
        outputDimensionality: 384, // 기존 command_vectors와 호환
        taskType: 'RETRIEVAL_DOCUMENT',
      },
    },
  });

  console.log(`✅ Generated ${embeddings.length} embeddings\n`);

  // 2. Supabase에 삽입
  console.log('📝 Inserting into knowledge_base table...');

  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < KNOWLEDGE_ENTRIES.length; i++) {
    const entry = KNOWLEDGE_ENTRIES[i]!;
    const embedding = embeddings[i]!;
    const vectorString = `[${embedding.join(',')}]`;

    // 중복 체크 (title 기준)
    const { data: existing } = await supabase
      .from('knowledge_base')
      .select('id')
      .eq('title', entry.title)
      .maybeSingle();

    if (existing) {
      skippedCount++;
      process.stdout.write(`\r⏳ Processing... ${i + 1}/${KNOWLEDGE_ENTRIES.length} (skipped: ${skippedCount})`);
      continue;
    }

    // 삽입
    const { error } = await supabase.from('knowledge_base').insert({
      title: entry.title,
      content: entry.content,
      embedding: vectorString,
      category: entry.category,
      tags: entry.tags,
      severity: entry.severity,
      related_server_types: entry.related_server_types,
      source: 'seed_script',
    });

    if (error) {
      console.error(`\n❌ Failed to insert "${entry.title}":`, error.message);
    } else {
      insertedCount++;
    }

    process.stdout.write(`\r⏳ Processing... ${i + 1}/${KNOWLEDGE_ENTRIES.length}`);
  }

  console.log('\n');
  console.log('═'.repeat(50));
  console.log(`✅ Seed Completed!`);
  console.log(`   - Inserted: ${insertedCount}`);
  console.log(`   - Skipped (duplicates): ${skippedCount}`);
  console.log(`   - Total entries: ${KNOWLEDGE_ENTRIES.length}`);
  console.log('═'.repeat(50));
}

// 실행
seedKnowledgeBase().catch(console.error);
