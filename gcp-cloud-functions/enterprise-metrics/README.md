# 🏢 GCP Enterprise Metrics Functions

OpenManager Vibe v5의 엔터프라이즈급 서버 모니터링 메트릭 생성기 (GCP Functions 버전)

## 🎯 주요 기능

### 25개 핵심 메트릭 생성

- **시스템 리소스 (10개)**: CPU, 메모리, 디스크, 네트워크, 온도, Load Average, IOPS, 스왑 등
- **애플리케이션 성능 (8개)**: 응답시간, RPS, 에러율, 연결수, 쓰레드 풀, 캐시 히트율, 쿼리 시간, SSL 핸드셰이크
- **시스템 상태 (7개)**: 프로세스 수, 파일 디스크립터, 업타임, 보안 이벤트, 로그 에러, 헬스 스코어, 메모리 누수

### 6가지 실제 장애 시나리오

- **정상 운영 (70%)**: 안정적인 기준 상태
- **피크 부하 (15%)**: 트래픽 급증, CPU/메모리 증가
- **메모리 누수 (5%)**: 점진적 메모리 증가, 스왑 사용
- **디스크 포화 (3%)**: 디스크 사용량/IOPS 급증
- **네트워크 혼잡 (4%)**: 네트워크 지연, 연결 증가
- **서비스 장애 (3%)**: 에러율 급증, 성능 저하

## 🚀 배포 방법

### 1. 사전 요구사항

```bash
# Google Cloud CLI 설치 확인
gcloud --version

# 프로젝트 설정
gcloud config set project YOUR_PROJECT_ID

# 인증
gcloud auth login
```

### 2. 함수 배포

```bash
# 의존성 설치
npm ci

# 배포 스크립트 실행
chmod +x deploy.sh
./deploy.sh

# 또는 직접 배포
gcloud functions deploy enterprise-metrics \
  --gen2 \
  --runtime nodejs20 \
  --trigger-http \
  --allow-unauthenticated \
  --memory 256MB \
  --timeout 30s \
  --region us-central1 \
  --source . \
  --entry-point enterpriseMetrics
```

### 3. 배포 후 확인

```bash
# 함수 상태 확인
gcloud functions describe enterprise-metrics --gen2 --region us-central1

# 로그 확인
gcloud functions logs read enterprise-metrics --gen2 --region us-central1

# 테스트 호출
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics?action=status"
```

## 📋 API 엔드포인트

### GET 요청

#### 현재 메트릭 조회

```bash
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics?action=current"
```

#### 대시보드 요약

```bash
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics?action=dashboard"
```

#### 생성기 상태 확인

```bash
curl "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics?action=status"
```

### POST 요청

#### 생성기 활성화

```bash
curl -X POST "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics" \
  -H "Content-Type: application/json" \
  -d '{"action": "enable"}'
```

#### 생성기 비활성화

```bash
curl -X POST "https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/enterprise-metrics" \
  -H "Content-Type: application/json" \
  -d '{"action": "disable"}'
```

## 🏗️ 응답 구조

### 현재 메트릭 응답 예시

```json
{
  "success": true,
  "action": "current",
  "data": {
    "metrics": [
      {
        "serverId": "web-app-01",
        "serverName": "Web Server 01",
        "serverType": "web",
        "timestamp": "2025-01-27T10:30:00.000Z",
        "scenario": "normal",
        "systemResources": {
          "cpuUsage": 42.5,
          "memoryUsage": 65.2,
          "diskUsage": 75.8,
          "networkInbound": 180,
          "networkOutbound": 145,
          "networkConnections": 420,
          "diskIOPS": 850,
          "cpuTemperature": 58,
          "loadAverage": 1.3,
          "swapUsage": 5.2
        },
        "applicationPerformance": {
          "responseTime": 165,
          "requestsPerSecond": 125,
          "errorRate": 0.8,
          "activeConnections": 220,
          "threadPoolUsage": 62,
          "cacheHitRate": 89,
          "dbQueryTime": 28,
          "sslHandshakeTime": 48
        },
        "systemHealth": {
          "processCount": 185,
          "fileDescriptorUsage": 58,
          "uptime": 2592000,
          "securityEvents": 2,
          "logErrors": 8,
          "serviceHealthScore": 92,
          "memoryLeakIndicator": 1.8
        }
      }
    ],
    "servers": [...]
  },
  "timestamp": "2025-01-27T10:30:00.000Z",
  "metricsCount": 25,
  "serversCount": 8,
  "source": "gcp-functions"
}
```

## 💰 비용 최적화

### GCP 무료 티어 활용

- **호출 횟수**: 월 200만 건 무료
- **컴퓨팅 시간**: 월 40만 GB-초 무료
- **네트워크**: 월 5GB 무료

### 리소스 제한

- **메모리**: 256MB (최소 사양)
- **타임아웃**: 30초
- **최대 인스턴스**: 10개
- **지역**: us-central1 (무료 티어)

## 🔍 모니터링 및 디버깅

### 로그 확인

```bash
# 실시간 로그 스트리밍
gcloud functions logs tail enterprise-metrics --gen2 --region us-central1

# 최근 로그 조회
gcloud functions logs read enterprise-metrics --gen2 --region us-central1 --limit 50
```

### 성능 모니터링

```bash
# 함수 메트릭 확인
gcloud functions describe enterprise-metrics --gen2 --region us-central1

# 에러율 확인
gcloud logging read "resource.type=cloud_function AND resource.labels.function_name=enterprise-metrics"
```

## 🔧 구성 변경

### 서버 수정

`index.js`의 `initializeServers()` 함수에서 서버 정보 수정 가능:

```javascript
initializeServers() {
  return [
    { id: 'web-app-01', name: 'Web Server 01', type: 'web', cores: 16, ram: 64 },
    // 추가 서버 정의...
  ];
}
```

### 시나리오 비율 조정

`generateScenario()` 함수에서 시나리오 비율 조정:

```javascript
const scenarios = [
  { name: 'normal', weight: 70 }, // 정상 운영 70%
  { name: 'peak', weight: 15 }, // 피크 부하 15%
  { name: 'memory_leak', weight: 5 }, // 메모리 누수 5%
  // 기타 시나리오...
];
```

## 🚨 문제 해결

### 배포 실패 시

1. **권한 확인**: GCP IAM 역할 확인
2. **프로젝트 ID**: 올바른 프로젝트 ID 설정
3. **API 활성화**: Cloud Functions API 활성화
4. **빌링 계정**: 유효한 빌링 계정 연결

### 함수 실행 오류 시

1. **로그 확인**: 상세 에러 메시지 확인
2. **메모리 부족**: 메모리 할당량 증가
3. **타임아웃**: 실행 시간 증가
4. **코드 문법**: JavaScript 문법 오류 확인

## 📊 성능 벤치마크

### 응답 시간

- **평균**: 50-100ms
- **최대**: 200ms
- **Cold Start**: 1-2초

### 메모리 사용량

- **평균**: 80-120MB
- **최대**: 200MB
- **할당량**: 256MB

### 처리량

- **RPS**: 초당 50-100 요청
- **동시 실행**: 최대 10 인스턴스
- **일일 처리량**: 약 500만 요청

## 🔗 관련 문서

- [Google Cloud Functions 문서](https://cloud.google.com/functions/docs)
- [Firebase Functions v2 가이드](https://firebase.google.com/docs/functions/get-started)
- [OpenManager Vibe v5 메인 문서](../../docs/)
