#!/bin/bash

# GCP Functions MCP 메트릭 처리기 배포 스크립트
# 무료 티어 최적화 설정 포함

set -e

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 함수 정보
FUNCTION_NAME="mcp-metrics-processor"
REGION="us-central1"
RUNTIME="python311"
ENTRY_POINT="main"
HEALTH_ENTRY_POINT="health"

# 무료 티어 최적화 설정
MEMORY="256MB"                    # 최소 메모리 (무료 티어)
TIMEOUT="60s"                     # 60초 타임아웃
MAX_INSTANCES="10"                # 최대 인스턴스 (무료 티어 보호)
MIN_INSTANCES="0"                 # 콜드 스타트 허용 (비용 절약)
CPU="1"                          # CPU 코어 수
CONCURRENCY="80"                  # 동시 요청 수 (메모리 고려)

# 환경 변수
ENV_VARS="NODE_ENV=production,FUNCTION_TIMEOUT=60,MEMORY_LIMIT=256,ENABLE_CACHE=true,CACHE_TTL=30"

# 프로젝트 ID 확인
PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -z "$PROJECT_ID" ]; then
    echo -e "${RED}Error: GCP Project ID not set${NC}"
    echo "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

echo -e "${BLUE}=== MCP 메트릭 처리기 배포 시작 ===${NC}"
echo -e "${BLUE}프로젝트: $PROJECT_ID${NC}"
echo -e "${BLUE}지역: $REGION${NC}"
echo -e "${BLUE}메모리: $MEMORY${NC}"
echo -e "${BLUE}타임아웃: $TIMEOUT${NC}"

# 현재 디렉토리 확인
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo -e "${YELLOW}현재 디렉토리: $(pwd)${NC}"

# 필수 파일 존재 확인
required_files=("main.py" "collector.py" "processor.py" "circuit_breaker.py" "requirements.txt")
for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}Error: Required file '$file' not found${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ 모든 필수 파일 확인 완료${NC}"

# Python 코드 기본 문법 검사
echo -e "${YELLOW}Python 코드 문법 검사 중...${NC}"
for py_file in *.py; do
    if ! python3 -m py_compile "$py_file"; then
        echo -e "${RED}Error: Syntax error in $py_file${NC}"
        exit 1
    fi
done
echo -e "${GREEN}✓ Python 코드 문법 검사 완료${NC}"

# 메인 함수 배포
echo -e "${YELLOW}메인 함수 배포 중...${NC}"
if gcloud functions deploy "$FUNCTION_NAME" \
    --gen2 \
    --runtime="$RUNTIME" \
    --region="$REGION" \
    --source=. \
    --entry-point="$ENTRY_POINT" \
    --trigger-http \
    --allow-unauthenticated \
    --memory="$MEMORY" \
    --timeout="$TIMEOUT" \
    --max-instances="$MAX_INSTANCES" \
    --min-instances="$MIN_INSTANCES" \
    --cpu="$CPU" \
    --concurrency="$CONCURRENCY" \
    --set-env-vars="$ENV_VARS" \
    --quiet; then
    echo -e "${GREEN}✓ 메인 함수 배포 성공${NC}"
else
    echo -e "${RED}✗ 메인 함수 배포 실패${NC}"
    exit 1
fi

# 헬스 체크 함수 배포 (별도 최적화)
HEALTH_FUNCTION_NAME="${FUNCTION_NAME}-health"
echo -e "${YELLOW}헬스 체크 함수 배포 중...${NC}"
if gcloud functions deploy "$HEALTH_FUNCTION_NAME" \
    --gen2 \
    --runtime="$RUNTIME" \
    --region="$REGION" \
    --source=. \
    --entry-point="$HEALTH_ENTRY_POINT" \
    --trigger-http \
    --allow-unauthenticated \
    --memory="128MB" \
    --timeout="10s" \
    --max-instances="5" \
    --min-instances="0" \
    --cpu="1" \
    --concurrency="100" \
    --set-env-vars="NODE_ENV=production" \
    --quiet; then
    echo -e "${GREEN}✓ 헬스 체크 함수 배포 성공${NC}"
else
    echo -e "${YELLOW}⚠ 헬스 체크 함수 배포 실패 (계속 진행)${NC}"
fi

# 배포 완료 후 함수 정보 확인
echo -e "${BLUE}=== 배포된 함수 정보 ===${NC}"
gcloud functions describe "$FUNCTION_NAME" --region="$REGION" --format="table(
    name:label=FUNCTION_NAME,
    state:label=STATE,
    url:label=URL,
    runtime:label=RUNTIME,
    availableMemoryMb:label=MEMORY,
    timeout:label=TIMEOUT
)" 2>/dev/null || echo -e "${YELLOW}함수 정보 조회 실패${NC}"

# 함수 URL 획득
FUNCTION_URL=$(gcloud functions describe "$FUNCTION_NAME" --region="$REGION" --format="value(url)" 2>/dev/null || echo "")
HEALTH_URL=$(gcloud functions describe "$HEALTH_FUNCTION_NAME" --region="$REGION" --format="value(url)" 2>/dev/null || echo "")

echo -e "${BLUE}=== 배포 완료 ===${NC}"
echo -e "${GREEN}메인 함수 URL: $FUNCTION_URL${NC}"
if [ -n "$HEALTH_URL" ]; then
    echo -e "${GREEN}헬스 체크 URL: $HEALTH_URL${NC}"
fi

# 배포 후 테스트
if [ -n "$FUNCTION_URL" ]; then
    echo -e "${YELLOW}배포된 함수 테스트 중...${NC}"
    
    # 헬스 체크 테스트
    if [ -n "$HEALTH_URL" ]; then
        echo -e "${YELLOW}헬스 체크 테스트...${NC}"
        if curl -s -f "$HEALTH_URL" > /dev/null; then
            echo -e "${GREEN}✓ 헬스 체크 통과${NC}"
        else
            echo -e "${YELLOW}⚠ 헬스 체크 실패 (함수가 아직 준비되지 않았을 수 있음)${NC}"
        fi
    fi
    
    # 기본 함수 테스트
    echo -e "${YELLOW}기본 함수 테스트...${NC}"
    if curl -s -f "$FUNCTION_URL?operation=health_check" > /dev/null; then
        echo -e "${GREEN}✓ 기본 함수 테스트 통과${NC}"
    else
        echo -e "${YELLOW}⚠ 기본 함수 테스트 실패 (함수가 아직 준비되지 않았을 수 있음)${NC}"
    fi
fi

# 사용량 모니터링 설정 안내
echo -e "${BLUE}=== 무료 티어 모니터링 설정 ===${NC}"
echo -e "${YELLOW}다음 명령어로 사용량을 모니터링하세요:${NC}"
echo "gcloud logging read 'resource.type=\"cloud_function\" AND resource.labels.function_name=\"$FUNCTION_NAME\"' --limit=50 --format=\"table(timestamp,severity,textPayload)\""
echo ""
echo -e "${YELLOW}월간 사용량 확인:${NC}"
echo "gcloud functions describe $FUNCTION_NAME --region=$REGION --format=\"value(eventTrigger.eventType,sourceArchiveUrl)\""

# 환경 변수 확인 안내
echo -e "${BLUE}=== 환경 변수 확인 ===${NC}"
echo -e "${YELLOW}다음 명령어로 환경 변수를 확인하세요:${NC}"
echo "gcloud functions describe $FUNCTION_NAME --region=$REGION --format=\"value(environmentVariables)\""

# 배포 스크립트 완료
echo -e "${GREEN}=== 배포 스크립트 완료 ===${NC}"
echo -e "${BLUE}함수명: $FUNCTION_NAME${NC}"
echo -e "${BLUE}지역: $REGION${NC}"
echo -e "${BLUE}메모리: $MEMORY${NC}"
echo -e "${BLUE}최대 인스턴스: $MAX_INSTANCES${NC}"

# 다음 단계 안내
echo -e "${YELLOW}=== 다음 단계 ===${NC}"
echo "1. 함수 테스트: curl '$FUNCTION_URL?operation=health_check'"
echo "2. 메트릭 수집: curl '$FUNCTION_URL?operation=collect_all'"
echo "3. 로그 확인: gcloud functions logs read $FUNCTION_NAME --region=$REGION"
echo "4. 사용량 모니터링: ../deployment/monitor-usage.sh"

exit 0