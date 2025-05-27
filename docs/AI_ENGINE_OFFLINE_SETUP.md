# MCP AI Engine 오프라인 설치 가이드

## 📋 개요

MCP AI Engine을 완전 오프라인 환경에서 설치하고 실행하는 방법을 안내합니다.

## 🎯 시스템 요구사항

### 최소 사양
- **OS**: Windows 10/11, Ubuntu 18.04+, macOS 10.15+
- **CPU**: 4코어 이상
- **RAM**: 8GB 이상
- **Storage**: 2GB 여유 공간
- **Python**: 3.8 이상
- **Node.js**: 16.0 이상

### 권장 사양
- **CPU**: 8코어 이상
- **RAM**: 16GB 이상
- **Storage**: 5GB 여유 공간

## 📦 오프라인 패키지 준비

### 1. Python 패키지 다운로드 (인터넷 연결된 환경에서)

```bash
# 패키지 다운로드 디렉터리 생성
mkdir python-packages
cd python-packages

# 필수 패키지 다운로드
pip download kats==0.3.1 --dest ./wheels
pip download pyod==2.1.0 --dest ./wheels
pip download scipy==1.15.0 --dest ./wheels
pip download scikit-learn==1.5.0 --dest ./wheels
pip download pandas==2.0.3 --dest ./wheels
pip download numpy==1.24.3 --dest ./wheels

# 의존성 패키지도 함께 다운로드
pip download -r requirements.txt --dest ./wheels
```

### 2. Node.js 패키지 다운로드

```bash
# npm 패키지 캐시
npm pack python-shell@2.0.3
```

## 🔧 오프라인 설치

### 1. Python 환경 설정

```bash
# 가상환경 생성 (권장)
python -m venv ai-engine-env

# 가상환경 활성화
# Windows
ai-engine-env\Scripts\activate
# Linux/macOS
source ai-engine-env/bin/activate

# 오프라인 패키지 설치
pip install --no-index --find-links=./python-packages/wheels kats pyod scipy scikit-learn pandas numpy
```

### 2. Node.js 패키지 설치

```bash
# 프로젝트 루트에서
npm install --offline ./python-shell-2.0.3.tgz
```

### 3. 디렉터리 구조 생성

```bash
# AI 엔진 캐시 디렉터리
mkdir -p .cache/ai-engine/models

# Python 스크립트 디렉터리
mkdir -p python-analysis

# 로그 디렉터리
mkdir -p logs/ai-engine
```

## ⚙️ 환경 변수 설정

### .env.local 파일 생성

```bash
# Python 경로 설정
PYTHON_PATH=python  # 또는 가상환경 경로
PYTHON_SCRIPTS_PATH=./python-analysis

# AI 엔진 설정
AI_ENGINE_CACHE_DIR=./.cache/ai-engine
AI_ENGINE_TIMEOUT=30000
AI_ENGINE_MAX_MEMORY_MB=500

# 기능 활성화/비활성화
ENABLE_PYTHON_ENGINE=true
ENABLE_CORRELATION_ENGINE=true
FALLBACK_TO_DUMMY=true
```

## 🐍 Python 스크립트 배포

### 필수 스크립트 복사

```bash
# 예측 스크립트
cp python-analysis/forecast.py ./python-analysis/
cp python-analysis/anomaly.py ./python-analysis/
cp python-analysis/correlation.py ./python-analysis/
cp python-analysis/clustering.py ./python-analysis/
cp python-analysis/classification.py ./python-analysis/

# 실행 권한 부여 (Linux/macOS)
chmod +x python-analysis/*.py
```

## 🧪 설치 검증

### 1. Python 환경 테스트

```bash
python -c "
import kats, pyod, scipy, sklearn, pandas, numpy
print('✅ All Python packages installed successfully')
"
```

### 2. AI 엔진 초기화 테스트

```bash
# Node.js 환경에서
npm run test:ai-engine
```

### 3. 통합 테스트

```bash
# 실제 분석 엔진 테스트
curl -X POST http://localhost:3000/api/ai-agent/smart-query \
  -H "Content-Type: application/json" \
  -d '{"query": "서버 상태 분석해줘", "context": "test"}'
```

## 🔍 문제 해결

### 일반적인 문제들

#### 1. Python 패키지 설치 실패

```bash
# 의존성 충돌 해결
pip install --no-deps --force-reinstall package_name

# 특정 버전 설치
pip install package_name==version --no-index --find-links=./wheels
```

#### 2. 메모리 부족 오류

```bash
# 환경 변수에서 메모리 제한 조정
AI_ENGINE_MAX_MEMORY_MB=1000
```

#### 3. 타임아웃 오류

```bash
# 타임아웃 시간 증가
AI_ENGINE_TIMEOUT=60000
```

### 로그 확인

```bash
# AI 엔진 로그
tail -f logs/ai-engine/engine.log

# Python 스크립트 로그
tail -f logs/ai-engine/python.log
```

## 📊 성능 최적화

### 1. 캐시 설정

```javascript
// 모델 캐시 크기 조정
const realAnalysisEngine = RealAnalysisEngine.getInstance({
  pythonConfig: {
    cacheSize: 200, // 캐시 항목 수
    enableDiskCache: true // 디스크 캐시 활성화
  }
});
```

### 2. 메모리 관리

```bash
# 가비지 컬렉션 최적화
export NODE_OPTIONS="--max-old-space-size=4096"
```

### 3. 병렬 처리

```javascript
// 동시 실행 모델 수 제한
const MAX_CONCURRENT_MODELS = 2;
```

## 🔄 업데이트 절차

### 1. 패키지 업데이트

```bash
# 새 버전 패키지 다운로드
pip download kats==0.3.2 --dest ./wheels-new

# 기존 패키지 백업
mv python-packages python-packages-backup

# 새 패키지 설치
pip install --no-index --find-links=./wheels-new kats
```

### 2. 스크립트 업데이트

```bash
# 스크립트 백업
cp -r python-analysis python-analysis-backup

# 새 스크립트 배포
cp new-scripts/* python-analysis/
```

## 📈 모니터링

### 시스템 상태 확인

```bash
# AI 엔진 상태 API
curl http://localhost:3000/api/ai-agent/status

# 메모리 사용량 확인
ps aux | grep python
ps aux | grep node
```

### 성능 메트릭

```javascript
// 분석 성능 측정
const startTime = Date.now();
const result = await realAnalysisEngine.analyzeWithMLModels(data);
const processingTime = Date.now() - startTime;
console.log(`Analysis completed in ${processingTime}ms`);
```

## 🚀 프로덕션 배포

### 1. 서비스 등록 (Linux)

```bash
# systemd 서비스 파일 생성
sudo nano /etc/systemd/system/mcp-ai-engine.service

[Unit]
Description=MCP AI Engine
After=network.target

[Service]
Type=simple
User=mcp
WorkingDirectory=/opt/mcp-ai-engine
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target

# 서비스 활성화
sudo systemctl enable mcp-ai-engine
sudo systemctl start mcp-ai-engine
```

### 2. 로그 로테이션

```bash
# logrotate 설정
sudo nano /etc/logrotate.d/mcp-ai-engine

/opt/mcp-ai-engine/logs/*.log {
    daily
    missingok
    rotate 7
    compress
    notifempty
    create 644 mcp mcp
}
```

## 📋 체크리스트

### 설치 완료 확인

- [ ] Python 3.8+ 설치됨
- [ ] 필수 Python 패키지 설치됨 (kats, pyod, scipy, sklearn)
- [ ] Node.js 16+ 설치됨
- [ ] python-shell 패키지 설치됨
- [ ] 환경 변수 설정됨
- [ ] Python 스크립트 배포됨
- [ ] 디렉터리 구조 생성됨
- [ ] 권한 설정됨
- [ ] 초기화 테스트 통과
- [ ] 통합 테스트 통과

### 운영 준비 확인

- [ ] 서비스 등록됨
- [ ] 로그 로테이션 설정됨
- [ ] 모니터링 설정됨
- [ ] 백업 절차 수립됨
- [ ] 장애 대응 절차 수립됨

## 🆘 지원

### 문제 신고

이슈가 발생하면 다음 정보와 함께 신고해주세요:

1. 운영체제 및 버전
2. Python 버전
3. Node.js 버전
4. 에러 메시지
5. 로그 파일
6. 재현 단계

### 연락처

- **이메일**: support@mcp-ai-engine.com
- **GitHub Issues**: https://github.com/mcp/ai-engine/issues
- **문서**: https://docs.mcp-ai-engine.com 