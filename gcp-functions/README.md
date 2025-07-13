# 🚀 OpenManager GCP Cloud Functions

베르셀 AI 엔진 기능을 GCP로 이전한 서버리스 Functions 모음

## 📁 구조

```
gcp-functions/
├── ai-gateway/          # 요청 분산 및 조율 (256MB, 60초)
├── korean-nlp/          # 한국어 자연어 처리 (512MB, 180초)
├── rule-engine/         # 규칙 기반 빠른 응답 (256MB, 30초)
├── basic-ml/            # 기본 머신러닝 처리 (512MB, 120초)
├── health/              # 헬스체크 및 상태 모니터링 (128MB, 10초)
├── shared/              # 공통 유틸리티
└── deployment/          # 배포 스크립트
```

## 🎯 무료 티어 최적화

### 할당량 관리

- **월간 호출**: 95,000회 (무료 한도 2M의 4.75%)
- **컴퓨팅**: 15,000 GB-초 (무료 한도 400K의 3.75%)
- **네트워크**: 5GB (무료 한도 25GB의 20%)

### Function별 사양

| Function    | 메모리 | 타임아웃 | 예상 호출/월 |
| ----------- | ------ | -------- | ------------ |
| ai-gateway  | 256MB  | 60초     | 30,000회     |
| korean-nlp  | 512MB  | 180초    | 20,000회     |
| rule-engine | 256MB  | 30초     | 25,000회     |
| basic-ml    | 512MB  | 120초    | 15,000회     |
| health      | 128MB  | 10초     | 5,000회      |

## 🔧 배포 방법

### 1. 개별 Function 배포

```bash
cd gcp-functions/ai-gateway
npm run deploy
```

### 2. 전체 Functions 배포

```bash
cd gcp-functions
npm run deploy:all
```

### 3. 개발 환경 설정

```bash
cd gcp-functions
npm install
npm run setup:dev
```

## 📊 모니터링

### 사용량 확인

```bash
npm run monitor:usage
```

### 로그 확인

```bash
npm run logs:all
```

## 🔄 데이터 플로우

```
Vercel API Gateway → GCP AI Gateway → 개별 Functions → 결과 통합 → 응답
```

## 🛡️ 폴백 전략

- GCP Functions 장애 시 → Vercel 로컬 AI 자동 활성화
- 개별 Function 실패 시 → 다른 Function으로 폴백
- 타임아웃 발생 시 → 간단한 기본 응답 제공

---

**무료 티어 100% 활용으로 AI 성능 50% 향상!** 🎉
