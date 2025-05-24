# 환경변수 설정 가이드

OpenManager Vibe v5는 더미 모드와 프로덕션 모드를 지원하여 개발부터 운영까지 원활한 전환을 제공합니다.

## 🎯 수집기 모드

### 더미 모드 (개발/테스트용)
```bash
COLLECTOR_MODE=dummy
```
- 시뮬레이션 데이터 생성
- 외부 의존성 없음
- 빠른 개발/테스트 가능

### 프로덕션 모드 (운영환경)
```bash
COLLECTOR_MODE=production
```
- 실제 서버에서 메트릭 수집
- Prometheus, CloudWatch, Custom API 연동
- 실시간 모니터링

## 🗄️ 필수 저장소 설정

### Supabase 설정
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Redis 설정
```bash
REDIS_URL=redis://localhost:6379
```

## 🔧 수집기별 설정

### 1. Prometheus (Kubernetes 모니터링)
```bash
PROMETHEUS_ENDPOINT=http://prometheus.kube-system:9090
PROMETHEUS_API_KEY=optional-bearer-token  # 선택사항
```

**설정 예제:**
- 로컬 Prometheus: `http://localhost:9090`
- Kubernetes 내부: `http://prometheus.monitoring.svc.cluster.local:9090`
- 외부 Prometheus: `https://prometheus.company.com`

### 2. AWS CloudWatch (EC2 모니터링)
```bash
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
```

**권한 요구사항:**
- `ec2:DescribeInstances`
- `ec2:DescribeVolumes`
- `cloudwatch:GetMetricStatistics`

### 3. Custom API (온프레미스 서버)
```bash
ONPREM_API_ENDPOINT=https://monitoring.company.local
ONPREM_API_KEY=your-api-key
ONPREM_API_SECRET=your-api-secret  # 선택사항
```

**API 엔드포인트 요구사항:**
- `GET /api/servers` - 서버 목록 조회
- `GET /api/servers/{id}/metrics` - 서버 메트릭 조회
- `GET /api/servers/{id}/status` - 서버 상태 확인

## 🚀 모드별 시작 가이드

### 더미 모드로 시작하기
```bash
# .env.local 파일 생성
echo "COLLECTOR_MODE=dummy" > .env.local
echo "NEXT_PUBLIC_SUPABASE_URL=dummy" >> .env.local
echo "NEXT_PUBLIC_SUPABASE_ANON_KEY=dummy" >> .env.local
echo "REDIS_URL=redis://localhost:6379" >> .env.local

# 개발 서버 시작
npm run dev
```

### 프로덕션 모드로 전환하기
```bash
# 1. 저장소 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
REDIS_URL=redis://production-redis:6379

# 2. 수집기 모드 변경
COLLECTOR_MODE=production

# 3. 원하는 수집기 설정 (최소 1개 필요)
# Prometheus OR CloudWatch OR Custom API

# 4. 애플리케이션 재시작
npm run build && npm start
```

## ⚡ 환경변수 검증

애플리케이션은 시작시 자동으로 환경변수를 검증합니다:

```typescript
// 검증 결과 확인
const validation = validateEnvironment();
console.log('환경 설정 유효성:', validation.valid);
console.log('오류 목록:', validation.errors);
```

## 🔍 문제 해결

### 수집기 초기화 실패
```bash
# 로그 확인
tail -f logs/collector.log

# 환경변수 확인
node -e "console.log(process.env)"

# 수집기 상태 확인
curl http://localhost:3000/api/status/collectors
```

### 연결 테스트
```bash
# Prometheus 연결 테스트
curl ${PROMETHEUS_ENDPOINT}/api/v1/query?query=up

# AWS 자격증명 테스트
aws sts get-caller-identity

# Custom API 연결 테스트
curl -H "Authorization: Bearer ${ONPREM_API_KEY}" ${ONPREM_API_ENDPOINT}/api/servers
```

## 📝 최소 환경 설정 예제

### 개발 환경
```bash
COLLECTOR_MODE=dummy
REDIS_URL=redis://localhost:6379
```

### 스테이징 환경
```bash
COLLECTOR_MODE=production
NEXT_PUBLIC_SUPABASE_URL=https://staging-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=staging-key
REDIS_URL=redis://staging-redis:6379
PROMETHEUS_ENDPOINT=http://prometheus-staging:9090
```

### 프로덕션 환경
```bash
COLLECTOR_MODE=production
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
REDIS_URL=redis://prod-redis:6379
PROMETHEUS_ENDPOINT=http://prometheus:9090
AWS_ACCESS_KEY_ID=prod-access-key
AWS_SECRET_ACCESS_KEY=prod-secret-key
AWS_REGION=us-east-1
ONPREM_API_ENDPOINT=https://monitoring.company.com
ONPREM_API_KEY=prod-api-key
``` 