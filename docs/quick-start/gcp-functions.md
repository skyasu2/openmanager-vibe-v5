# GCP Functions 배포 가이드

> Python 3.11 서버리스 | 무료 티어 최적화

## 🚀 빠른 시작

### 1. GCP 프로젝트 설정

```bash
# GCP CLI 설치 및 인증
gcloud auth login
gcloud config set project YOUR_PROJECT_ID

# Functions API 활성화
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

### 2. 함수 구조

```
gcp-functions/
├── enhanced-korean-nlp/
│   ├── main.py
│   └── requirements.txt
├── ml-analytics-engine/
│   ├── main.py
│   └── requirements.txt
└── unified-ai-processor/
    ├── main.py
    └── requirements.txt
```

### 3. 기본 함수 예제

```python
# gcp-functions/enhanced-korean-nlp/main.py
import functions_framework
from flask import jsonify
import json

@functions_framework.http
def korean_nlp(request):
    """한국어 자연어 처리 함수"""

    # CORS 처리
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # 요청 데이터 파싱
    request_json = request.get_json(silent=True)
    if not request_json or 'text' not in request_json:
        return jsonify({'error': 'text field is required'}), 400

    text = request_json['text']

    # 한국어 처리 로직
    result = process_korean_text(text)

    # CORS 헤더 포함하여 응답
    headers = {'Access-Control-Allow-Origin': '*'}
    return jsonify(result), 200, headers

def process_korean_text(text):
    """실제 한국어 처리 로직"""
    # 여기에 한국어 NLP 로직 구현
    return {
        'processed': text,
        'language': 'ko',
        'confidence': 0.95
    }
```

## ⚡ Cold Start 최적화

### min-instances 설정

```bash
# Cold Start 방지를 위한 최소 인스턴스 유지
gcloud functions deploy korean-nlp \
  --runtime python311 \
  --trigger-http \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 100 \
  --memory 1GB \
  --region asia-northeast3  # 서울 리전
```

### 함수 워밍업

```python
# main.py
import time

# 전역 변수로 모델 로드 (Cold Start 시 한 번만)
model = None

def load_model():
    global model
    if model is None:
        start_time = time.time()
        # 모델 로드 로직
        model = initialize_heavy_model()
        print(f"Model loaded in {time.time() - start_time:.2f}s")
    return model

@functions_framework.http
def ml_analytics(request):
    # 첫 요청 시에만 모델 로드
    model = load_model()

    # 이후 요청은 빠르게 처리
    result = model.predict(request.get_json())
    return jsonify(result)
```

## 🔧 메모리 및 타임아웃 설정

### 함수별 최적화

```yaml
# deploy-config.yaml
functions:
  - name: enhanced-korean-nlp
    memory: 512MB # 텍스트 처리는 적은 메모리
    timeout: 60s

  - name: ml-analytics-engine
    memory: 2GB # ML 모델은 많은 메모리
    timeout: 540s # 최대 9분

  - name: unified-ai-processor
    memory: 1GB
    timeout: 300s
```

### 배포 스크립트

```bash
#!/bin/bash
# scripts/deployment/deploy-all.sh

REGION="asia-northeast3"
PROJECT_ID="your-project-id"

# 함수별 배포
functions=(
  "enhanced-korean-nlp:512MB:60s"
  "ml-analytics-engine:2GB:540s"
  "unified-ai-processor:1GB:300s"
)

for func in "${functions[@]}"; do
  IFS=':' read -r name memory timeout <<< "$func"

  echo "Deploying $name..."

  gcloud functions deploy $name \
    --runtime python311 \
    --trigger-http \
    --allow-unauthenticated \
    --memory $memory \
    --timeout $timeout \
    --region $REGION \
    --project $PROJECT_ID \
    --source gcp-functions/$name \
    --min-instances 1 \
    --max-instances 100
done
```

## 🌐 CORS 설정

### Vercel Rewrites 통합

```json
// vercel.json
{
  "rewrites": [
    {
      "source": "/api/gcp/:function",
      "destination": "https://$REGION-$PROJECT_ID.cloudfunctions.net/:function"
    }
  ],
  "headers": [
    {
      "source": "/api/gcp/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET,POST,OPTIONS" }
      ]
    }
  ]
}
```

### 함수 내 CORS 처리

```python
# 재사용 가능한 CORS 데코레이터
def cors_enabled(func):
    def wrapper(request):
        # Preflight 요청 처리
        if request.method == 'OPTIONS':
            headers = {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '3600',
            }
            return ('', 204, headers)

        # 실제 요청 처리
        response = func(request)

        # 응답에 CORS 헤더 추가
        if isinstance(response, tuple):
            data, status, headers = response
            headers['Access-Control-Allow-Origin'] = '*'
            return (data, status, headers)
        else:
            return response, 200, {'Access-Control-Allow-Origin': '*'}

    return wrapper

@functions_framework.http
@cors_enabled
def api_handler(request):
    # 비즈니스 로직
    return jsonify({'status': 'success'})
```

## 📊 모니터링

### Cloud Logging

```bash
# 실시간 로그 확인
gcloud functions logs read enhanced-korean-nlp --limit 50

# 특정 시간 범위 로그
gcloud functions logs read ml-analytics-engine \
  --start-time="2025-07-29T00:00:00Z" \
  --end-time="2025-07-29T23:59:59Z"

# 에러만 필터링
gcloud functions logs read unified-ai-processor \
  --filter="severity>=ERROR"
```

### 성능 메트릭

```python
# 함수 실행 시간 측정
import time
from google.cloud import monitoring_v3

def track_performance(func_name):
    def decorator(func):
        def wrapper(request):
            start_time = time.time()

            try:
                result = func(request)
                status = 'success'
            except Exception as e:
                result = jsonify({'error': str(e)}), 500
                status = 'error'

            # 실행 시간 기록
            duration = time.time() - start_time

            # Cloud Monitoring에 메트릭 전송
            client = monitoring_v3.MetricServiceClient()
            project_name = f"projects/{PROJECT_ID}"

            # 커스텀 메트릭 전송 로직
            print(f"{func_name} executed in {duration:.2f}s - {status}")

            return result
        return wrapper
    return decorator

@functions_framework.http
@track_performance('korean-nlp')
def korean_nlp(request):
    # 함수 로직
    pass
```

## 💰 무료 티어 활용

### 무료 한도 (월)

- **2백만 호출**: 충분한 API 요청 처리
- **400,000 GB-초**: 메모리 사용 시간
- **200,000 GHz-초**: CPU 사용 시간
- **5GB 아웃바운드 네트워크**: 외부 API 호출

### 비용 최적화 전략

```python
# 1. 응답 압축
import gzip
import json

def compress_response(data):
    json_str = json.dumps(data)
    compressed = gzip.compress(json_str.encode())
    return compressed

# 2. 캐싱 활용
from functools import lru_cache

@lru_cache(maxsize=1000)
def expensive_operation(input_data):
    # 비용이 많이 드는 연산
    return result

# 3. 배치 처리
@functions_framework.http
def batch_processor(request):
    items = request.get_json().get('items', [])

    # 개별 처리 대신 배치로 처리
    results = process_batch(items)

    return jsonify({'results': results})
```

## 🔗 유용한 링크

- [GCP Functions 문서](https://cloud.google.com/docs)
- [Python 런타임 가이드](https://cloud.google.com/functions/docs/concepts/python-runtime)
- [가격 계산기](https://cloud.google.com/products/calculator)
- [무료 티어 정보](https://cloud.google.com/free)

## 💡 실무 팁

1. **서울 리전 사용**: `asia-northeast3`로 낮은 레이턴시
2. **환경 변수 활용**: 민감한 정보는 Secret Manager 사용
3. **비동기 처리**: Cloud Tasks와 연동하여 긴 작업 처리
4. **모니터링 필수**: Cloud Monitoring으로 사용량 추적

---

마지막 업데이트: 2025-07-28 | [전체 문서 보기](https://cloud.google.com/docs)
