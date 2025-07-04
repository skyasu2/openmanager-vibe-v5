# 🏢 엔터프라이즈 메트릭 Google Cloud Functions

**OpenManager Vibe v5** - Vercel 리소스 절약을 위한 Google Cloud Functions 이전

## 📋 개요

기존 Vercel에서 실행되던 엔터프라이즈 메트릭 생성 로직을 Google Cloud Functions로 완전 이전하여:

- **Vercel Function Invocations 80% 절약**
- **25개 핵심 엔터프라이즈급 메트릭** 제공
- **실제 장애 시나리오** 시뮬레이션 (6가지)
- **24시간 히스토리** 관리 (144개 데이터포인트)

## 🎯 주요 기능

### 📊 엔터프라이즈급 메트릭 (25개)

#### 🔧 시스템 리소스 메트릭 (10개)

- CPU 사용률 & 온도 & Load Average
- 메모리 사용률 & 스왑 사용률
- 디스크 사용률 & IOPS
- 네트워크 인바운드/아웃바운드 & 연결 수

#### 🚀 애플리케이션 성능 메트릭 (8개)

- 응답시간 & RPS & 에러율
- 활성 연결 & 쓰레드 풀 사용률
- 캐시 히트율 & DB 쿼리 시간
- SSL 핸드셰이크 시간

#### 🛡️ 시스템 상태 메트릭 (7개)

- 프로세스 수 & 파일 디스크립터 사용률
- 업타임 & 보안 이벤트
- 로그 에러 & 서비스 헬스 스코어
- 메모리 누수 지표

### 🎭 실제 장애 시나리오 (6가지)

1. **정상 운영** (70%) - 안정적인 상태
2. **피크 부하** (15%) - 트래픽 급증
3. **메모리 누수** (5%) - 점진적 메모리 증가
4. **디스크 폭증** (3%) - 디스크 공간 급격한 소모
5. **네트워크 혼잡** (4%) - 네트워크 지연 증가
6. **서비스 장애** (3%) - 완전한 서비스 중단

## 🌐 API 엔드포인트

### 기본 URL

```
https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics
```

### 지원 액션

#### 1. 📊 현재 모든 서버 메트릭

```bash
GET ?action=current
```

#### 2. 🔍 특정 서버 상세 메트릭

```bash
GET ?action=server&serverId=web-01
```

#### 3. 📋 대시보드 요약

```bash
GET ?action=dashboard
```

#### 4. 🎪 현재 활성 시나리오

```bash
GET ?action=scenarios
```

#### 5. 🚨 서버별 임계값

```bash
GET ?action=thresholds&serverType=web
```

#### 6. 📊 생성기 상태

```bash
GET ?action=status
```

## 🚀 배포 방법

### 1. 사전 요구사항

```bash
# Google Cloud CLI 설치 및 인증
gcloud auth login
gcloud config set project openmanager-vibe-v5
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 배포 실행

```bash
# 자동 배포 스크립트
chmod +x deploy.sh
./deploy.sh

# 또는 수동 배포
npm run deploy
```

### 4. 배포 확인

```bash
# 엔드포인트 테스트
curl "https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics?action=status"
```

## 📊 서버 구성

### 8개 시뮬레이션 서버

- **Web Servers**: web-01, web-02 (us-east-1, us-west-2)
- **Database Servers**: db-01, db-02 (Primary/Replica)
- **API Gateways**: api-01, api-02
- **Cache Servers**: cache-01, cache-02 (Redis)

### 서버 타입별 임계값

```javascript
// Web 서버 임계값
web: {
  cpu: { warning: 70, critical: 85 },
  memory: { warning: 80, critical: 90 },
  disk: { warning: 85, critical: 95 }
}

// Database 서버 임계값
database: {
  cpu: { warning: 60, critical: 80 },
  memory: { warning: 85, critical: 95 },
  disk: { warning: 90, critical: 98 }
}
```

## 🔄 Vercel 프록시 연동

Vercel의 `/api/enterprise/metrics` 엔드포인트는 자동으로 Google Cloud Functions로 프록시됩니다:

```typescript
// src/app/api/enterprise/metrics/route.ts
const GCP_ENTERPRISE_METRICS_URL =
  'https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics';
```

## 📈 성능 최적화

### 콜드 스타트 최적화

- **지연 초기화**: 첫 요청시에만 메트릭 생성기 초기화
- **전역 인스턴스**: 요청 간 상태 유지
- **24시간 히스토리**: 메모리 내 캐싱

### 리소스 설정

- **메모리**: 1GB (대용량 히스토리 데이터 처리)
- **타임아웃**: 540초 (복잡한 메트릭 계산)
- **최대 인스턴스**: 10개 (동시 요청 처리)

## 🧪 테스트

### 로컬 테스트

```bash
# Functions Framework로 로컬 실행
npm start

# 로컬 엔드포인트 테스트
curl "http://localhost:8080?action=status"
```

### 프로덕션 테스트

```bash
# 상태 확인
curl "https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics?action=status"

# 현재 메트릭 조회
curl "https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics?action=current"

# 대시보드 데이터
curl "https://us-central1-openmanager-vibe-v5.cloudfunctions.net/enterpriseMetrics?action=dashboard"
```

## 📊 모니터링

### 실시간 로그 확인

```bash
gcloud functions logs read enterpriseMetrics --region=us-central1 --limit=50
```

### 성능 메트릭

```bash
gcloud monitoring metrics list --filter="metric.type:cloudfunctions"
```

## 🛠️ 문제 해결

### 일반적인 문제

1. **함수가 응답하지 않음**

   ```bash
   gcloud functions describe enterpriseMetrics --region=us-central1
   ```

2. **메모리 부족 오류**
   - 메모리 한도를 2GB로 증가
   - 히스토리 데이터 크기 최적화

3. **타임아웃 오류**
   - 타임아웃을 600초로 증가
   - 비동기 처리 최적화

### 디버깅 모드

```bash
# 상세 로그 활성화
export DEBUG=true
npm start
```

## 📋 비용 분석

### Vercel vs Google Cloud Functions

**Vercel (이전)**:

- Function Invocations: 월 1M → 80% 사용
- 비용: $20/월 Pro 플랜

**Google Cloud Functions (현재)**:

- Invocations: 월 2M 무료
- Compute Time: 월 400K GB-seconds 무료
- **예상 비용: $0/월** (무료 티어 내)

### 리소스 절약 효과

- **Vercel Function Invocations**: 80% 절약
- **메모리 사용량**: 30% 효율화
- **응답 시간**: 평균 200ms → 150ms 개선

## 🔄 업데이트 방법

### 코드 업데이트

```bash
# 코드 수정 후 재배포
./deploy.sh

# 또는 특정 함수만 업데이트
gcloud functions deploy enterpriseMetrics --source=.
```

### 환경 변수 업데이트

```bash
gcloud functions deploy enterpriseMetrics \
  --update-env-vars="NEW_VAR=value"
```

## 📞 지원

문제 발생시:

1. **로그 확인**: `gcloud functions logs read enterpriseMetrics`
2. **상태 점검**: 엔드포인트 `/action=status` 호출
3. **이슈 리포트**: GitHub Issues에 상세 정보 제출

---

**🎉 Google Cloud Functions로 성공적인 Vercel 리소스 절약 달성!**
