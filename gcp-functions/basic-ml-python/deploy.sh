#!/bin/bash

# 🤖 Basic ML Python Function 배포 스크립트

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🤖 Basic ML Python Function 배포 시작${NC}"

# 환경 변수 설정
PROJECT_ID=${GCP_PROJECT_ID:-"your-project-id"}
REGION=${GCP_REGION:-"asia-northeast3"}  # 서울 리전
FUNCTION_NAME="basic-ml-python"
RUNTIME="python310"
MEMORY="512MB"
TIMEOUT="120s"
MAX_INSTANCES="10"  # 무료티어 최적화

# 테스트 실행
echo -e "${YELLOW}🧪 테스트 실행 중...${NC}"
python -m pytest test_basic_ml.py -v --cov=main --cov-report=term-missing

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ 테스트 실패! 배포를 중단합니다.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 테스트 통과!${NC}"

# Cloud Functions 배포
echo -e "${YELLOW}📦 Cloud Functions 배포 중...${NC}"

gcloud functions deploy ${FUNCTION_NAME} \
  --gen2 \
  --runtime=${RUNTIME} \
  --region=${REGION} \
  --source=. \
  --entry-point=basic_ml \
  --trigger-http \
  --allow-unauthenticated \
  --memory=${MEMORY} \
  --timeout=${TIMEOUT} \
  --max-instances=${MAX_INSTANCES} \
  --set-env-vars="PYTHONUNBUFFERED=1" \
  --no-user-output-enabled

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ 배포 성공!${NC}"
    
    # 함수 URL 가져오기
    FUNCTION_URL=$(gcloud functions describe ${FUNCTION_NAME} \
        --region=${REGION} \
        --format="value(serviceConfig.uri)")
    
    echo -e "${GREEN}🎯 Function URL: ${FUNCTION_URL}${NC}"
    
    # 헬스 체크
    echo -e "${YELLOW}🏥 헬스 체크 중...${NC}"
    curl -s "${FUNCTION_URL}-health" | jq .
    
else
    echo -e "${RED}❌ 배포 실패!${NC}"
    exit 1
fi

# 성능 비교 정보 출력
echo -e "${GREEN}📊 Node.js → Python 전환 완료${NC}"
echo -e "  - ML 라이브러리: scikit-learn (정확도 ↑)"
echo -e "  - 예측 모델: 선형회귀 + 계절성 탐지"
echo -e "  - 통계 분석: 향상된 이상치 탐지"
echo -e "  - 무료티어: 월 78만 호출 가능"