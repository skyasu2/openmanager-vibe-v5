# 🐍 Python Analysis Engine Setup Guide

OpenManager AI v5의 Python 기반 오프라인 AI 분석 엔진 설치 및 사용 가이드입니다.

## 📋 목차

- [개요](#개요)
- [시스템 요구사항](#시스템-요구사항)
- [설치 방법](#설치-방법)
- [사용 방법](#사용-방법)
- [API 문서](#api-문서)
- [관리자 대시보드](#관리자-대시보드)
- [문제 해결](#문제-해결)

## 🎯 개요

Python Analysis Engine은 OpenManager AI v5에 통합된 오프라인 AI 분석 시스템으로, 다음 기능을 제공합니다:

### 🔮 **시계열 예측 (Time Series Forecasting)**
- **모델**: ARIMA, Prophet, Linear Regression
- **라이브러리**: Facebook Kats, scikit-learn
- **기능**: CPU/Memory 사용률 예측, 트렌드 분석, 신뢰구간 계산

### 🚨 **이상 탐지 (Anomaly Detection)**
- **모델**: Isolation Forest, AutoEncoder, LOF, KNN
- **라이브러리**: PyOD, scikit-learn
- **기능**: 시스템 메트릭 이상치 탐지, 통계 분석

### 🎲 **분류 분석 (Classification)**
- **모델**: Random Forest, Gradient Boosting, SVM
- **라이브러리**: scikit-learn
- **기능**: 서버 상태 분류, 성능 예측, 특성 중요도 분석

### 🎯 **클러스터링 (Clustering)**
- **모델**: K-means, DBSCAN, Hierarchical
- **라이브러리**: scikit-learn
- **기능**: 서버 그룹화, 패턴 발견, 최적 클러스터 수 자동 결정

### 🔗 **상관관계 분석 (Correlation Analysis)**
- **방법**: Pearson, Spearman, Kendall
- **라이브러리**: SciPy
- **기능**: 메트릭 간 관계 분석, 유의성 검정

## 🖥️ 시스템 요구사항

### 필수 요구사항
- **Python**: 3.8 이상
- **Node.js**: 18 이상
- **메모리**: 최소 2GB RAM
- **디스크**: 500MB 여유 공간

### 지원 운영체제
- ✅ Windows 10/11
- ✅ macOS 10.15+
- ✅ Ubuntu 18.04+
- ✅ CentOS 7+

## 🚀 설치 방법

### 1. Python 환경 확인

```bash
# Python 버전 확인
python --version
# 또는
python3 --version

# pip 업그레이드
python -m pip install --upgrade pip
```

### 2. Python 패키지 설치

```bash
# 자동 설치 (권장)
npm run python:install

# 수동 설치
pip install -r src/modules/ai-agent/python-engine/requirements.txt
```

### 3. 설치 확인

```bash
# 패키지 설치 확인
npm run test:python

# 분석 엔진 테스트
npm run test:python-analysis

# 상세 테스트 (verbose)
npm run test:python-analysis -- --verbose
```

### 4. 환경 변수 설정 (선택사항)

```bash
# .env.local 파일에 추가
PYTHON_PATH=python3  # Python 실행 파일 경로
PYTHON_ANALYSIS_ENABLED=true  # Python 분석 활성화
```

## 📖 사용 방법

### 1. 기본 사용법

```typescript
import { enhancedAIAgentEngine } from '@/modules/ai-agent/core/EnhancedAIAgentEngine';

// 서버 메트릭 데이터 준비
const serverData = {
  metrics: {
    cpu: {
      current: 65,
      history: [/* 시계열 데이터 */]
    },
    memory: {
      current: 78,
      history: [/* 시계열 데이터 */]
    }
  }
};

// Python 분석 실행
const analysisResult = await enhancedAIAgentEngine.executePythonAnalysis(serverData);

if (analysisResult) {
  console.log('분석 결과:', analysisResult);
  console.log('추천사항:', analysisResult.summary.recommendations);
}
```

### 2. 개별 분석 실행

```typescript
import { PythonAnalysisRunner } from '@/modules/ai-agent/core/PythonAnalysisRunner';

const pythonRunner = PythonAnalysisRunner.getInstance();

// 시계열 예측
const forecastResult = await pythonRunner.forecastTimeSeries({
  timestamps: ['2024-01-01T00:00:00Z', /* ... */],
  values: [50, 55, 60, /* ... */],
  horizon: 30,
  model: 'arima'
});

// 이상 탐지
const anomalyResult = await pythonRunner.detectAnomalies({
  features: [[50, 60, 30], [55, 65, 35], /* ... */],
  contamination: 0.05,
  algorithm: 'isolation_forest'
});

// 상관관계 분석
const correlationResult = await pythonRunner.analyzeCorrelations({
  variables: [
    { name: 'CPU', values: [50, 55, 60, /* ... */] },
    { name: 'Memory', values: [45, 50, 55, /* ... */] }
  ],
  method: 'pearson'
});
```

## 🌐 API 문서

### 엔드포인트: `/api/ai-agent/python-analysis`

#### GET - 엔진 상태 조회
```bash
curl -X GET http://localhost:3000/api/ai-agent/python-analysis
```

**응답 예시:**
```json
{
  "success": true,
  "data": {
    "engine": {
      "isInitialized": true,
      "currentMode": "advanced"
    },
    "python": {
      "enabled": true,
      "status": {
        "isInitialized": true,
        "activeProcesses": 2,
        "successRate": 94.2
      }
    },
    "capabilities": {
      "forecast": true,
      "anomaly_detection": true,
      "classification": true,
      "clustering": true,
      "correlation_analysis": true
    }
  }
}
```

#### POST - 분석 실행
```bash
curl -X POST http://localhost:3000/api/ai-agent/python-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "action": "analyze",
    "serverData": {
      "metrics": {
        "cpu": {
          "current": 65,
          "history": [{"timestamp": "2024-01-01T00:00:00Z", "value": 50}]
        }
      }
    }
  }'
```

### 지원 액션

| 액션 | 설명 | 데이터 형식 |
|------|------|-------------|
| `analyze` | 통합 분석 실행 | `{ serverData: object }` |
| `forecast` | 시계열 예측 | `{ data: ForecastRequest }` |
| `anomaly` | 이상 탐지 | `{ data: AnomalyRequest }` |
| `classification` | 분류 분석 | `{ data: ClassificationRequest }` |
| `clustering` | 클러스터링 | `{ data: ClusteringRequest }` |
| `correlation` | 상관관계 분석 | `{ data: CorrelationRequest }` |
| `status` | 엔진 상태 조회 | `{}` |

## 🎛️ 관리자 대시보드

### 접속 방법
```
http://localhost:3000/admin/ai-agent/python-analysis
```

### 주요 기능

#### 📊 **엔진 상태 모니터링**
- 실시간 프로세스 상태
- 성능 메트릭 (응답시간, 처리량, 오류율)
- 캐시 통계

#### 🧪 **테스트 분석 실행**
- 더미 데이터로 분석 테스트
- 실시간 결과 확인
- 분석 히스토리 추적

#### ⚙️ **설정 관리**
- 프로세스 풀 설정
- 캐시 설정
- 타임아웃 설정

#### 📈 **성능 분석**
- 응답시간 분포 (P95, P99)
- 처리량 통계
- 오류율 추적

## 🔧 문제 해결

### 일반적인 문제

#### 1. Python 패키지 설치 실패
```bash
# pip 업그레이드
python -m pip install --upgrade pip

# 개별 패키지 설치
pip install numpy pandas scipy scikit-learn

# 선택적 패키지 (고급 기능)
pip install kats pyod
```

#### 2. Python 실행 파일을 찾을 수 없음
```bash
# Windows
set PYTHON_PATH=python3

# macOS/Linux
export PYTHON_PATH=python3

# 또는 .env.local에 추가
echo "PYTHON_PATH=python3" >> .env.local
```

#### 3. 메모리 부족 오류
```typescript
// 프로세스 풀 크기 조정
const pythonRunner = PythonAnalysisRunner.getInstance({
  maxProcesses: 1,  // 기본값: 3
  maxMemoryMB: 256  // 기본값: 512
});
```

#### 4. 타임아웃 오류
```typescript
// 타임아웃 시간 증가
const pythonRunner = PythonAnalysisRunner.getInstance({
  processTimeout: 60000  // 60초 (기본값: 30초)
});
```

### 디버깅 방법

#### 1. 상세 로그 활성화
```bash
# 환경 변수 설정
DEBUG=python-analysis npm run dev

# 또는 테스트 시
npm run test:python-analysis -- --verbose
```

#### 2. Python 스크립트 직접 실행
```bash
# 엔진 러너 테스트
echo '{"method":"correlation","data":{"variables":[{"name":"test","values":[1,2,3]}]}}' | python src/modules/ai-agent/python-engine/engine_runner.py

# 개별 스크립트 테스트
python src/modules/ai-agent/python-engine/forecast.py
```

#### 3. 로그 파일 확인
```bash
# 애플리케이션 로그
tail -f logs/app.log

# Python 분석 로그
tail -f logs/python-analysis.log
```

### 성능 최적화

#### 1. 캐시 설정 최적화
```typescript
const pythonRunner = PythonAnalysisRunner.getInstance({
  enableCaching: true,
  cacheSize: 200,  // 기본값: 100
});
```

#### 2. 프로세스 풀 최적화
```typescript
// CPU 코어 수에 따라 조정
const cpuCount = require('os').cpus().length;
const pythonRunner = PythonAnalysisRunner.getInstance({
  maxProcesses: Math.min(cpuCount, 4)
});
```

#### 3. 데이터 크기 제한
```typescript
// 대용량 데이터 처리 시 청크 단위로 분할
const chunkSize = 1000;
const chunks = data.reduce((acc, item, index) => {
  const chunkIndex = Math.floor(index / chunkSize);
  if (!acc[chunkIndex]) acc[chunkIndex] = [];
  acc[chunkIndex].push(item);
  return acc;
}, []);
```

## 📚 추가 리소스

### 공식 문서
- [Facebook Kats](https://facebookresearch.github.io/Kats/)
- [PyOD](https://pyod.readthedocs.io/)
- [scikit-learn](https://scikit-learn.org/)
- [SciPy](https://scipy.org/)

### 예제 코드
- [시계열 예측 예제](./examples/forecast-example.md)
- [이상 탐지 예제](./examples/anomaly-example.md)
- [분류 분석 예제](./examples/classification-example.md)

### 커뮤니티
- [GitHub Issues](https://github.com/your-repo/issues)
- [Discord 채널](https://discord.gg/your-channel)

---

## 🤝 기여하기

Python Analysis Engine 개선에 기여하고 싶으시다면:

1. 이슈 리포트: 버그나 개선사항을 GitHub Issues에 등록
2. 풀 리퀘스트: 새로운 기능이나 버그 수정 제출
3. 문서 개선: 사용법이나 예제 추가

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

---

**🎉 Python Analysis Engine으로 더 스마트한 서버 모니터링을 경험해보세요!** 