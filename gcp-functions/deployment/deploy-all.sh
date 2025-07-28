#!/bin/bash

# 🚀 OpenManager GCP Functions 전체 배포 스크립트
# 
# 베르셀 AI 엔진 기능을 GCP로 이전하는 배포 스크립트

set -e  # 오류 발생 시 스크립트 중단

# 스크립트 디렉토리 경로
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# 환경변수 로드
if [ -f "$PROJECT_ROOT/.env.local" ]; then
    set -a
    source "$PROJECT_ROOT/.env.local"
    set +a
fi

# 색상 코드
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# 프로젝트 설정
PROJECT_ID="openmanager-free-tier"
REGION="asia-northeast3"
FUNCTIONS=("ai-gateway" "enhanced-korean-nlp" "rule-engine" "ml-analytics-engine" "unified-ai-processor")

log "🚀 OpenManager GCP Functions 배포 시작"
log "프로젝트: $PROJECT_ID"
log "리전: $REGION"

# GCP 프로젝트 설정 확인
log "GCP 프로젝트 설정 확인..."
if ! gcloud config get-value project | grep -q "$PROJECT_ID"; then
    warning "GCP 프로젝트를 $PROJECT_ID로 설정합니다..."
    gcloud config set project $PROJECT_ID
fi

# Functions API 활성화 확인
log "Cloud Functions API 확인..."
if ! gcloud services list --enabled --filter="name:cloudfunctions.googleapis.com" --format="value(name)" | grep -q cloudfunctions; then
    log "Cloud Functions API를 활성화합니다..."
    gcloud services enable cloudfunctions.googleapis.com
    sleep 10  # API 활성화 대기
fi

# 배포 시작
deploy_function() {
    local func_name=$1
    local func_dir="$PROJECT_ROOT/gcp-functions/$func_name"
    
    if [ ! -d "$func_dir" ]; then
        error "디렉토리를 찾을 수 없습니다: $func_dir"
        return 1
    fi
    
    log "📦 $func_name Function 배포 중..."
    
    cd "$func_dir"
    
    # 런타임별 파일 체크 및 의존성 설치
    if [[ "$RUNTIME" == nodejs* ]]; then
        # Node.js 함수
        if [ ! -f "package.json" ]; then
            error "$func_name: package.json을 찾을 수 없습니다"
            cd - > /dev/null
            return 1
        fi
        
        if [ ! -f "index.js" ]; then
            error "$func_name: index.js를 찾을 수 없습니다"
            cd - > /dev/null
            return 1
        fi
        
        log "Node.js 의존성 설치 중..."
        npm install --silent
    elif [[ "$RUNTIME" == python* ]]; then
        # Python 함수
        if [ ! -f "requirements.txt" ]; then
            error "$func_name: requirements.txt를 찾을 수 없습니다"
            cd - > /dev/null
            return 1
        fi
        
        if [ ! -f "main.py" ]; then
            error "$func_name: main.py를 찾을 수 없습니다"
            cd - > /dev/null
            return 1
        fi
        
        log "Python 함수 준비 완료"
    fi
    
    # Function별 설정
    case $func_name in
        "ai-gateway")
            MEMORY="256MB"
            TIMEOUT="60s"
            RUNTIME="nodejs22"
            ENTRY_POINT="ai-gateway"
            ;;
        "enhanced-korean-nlp")
            MEMORY="512MB"
            TIMEOUT="180s"
            RUNTIME="python311"
            ENTRY_POINT="enhanced_korean_nlp"
            ;;
        "rule-engine")
            MEMORY="256MB"
            TIMEOUT="30s"
            RUNTIME="nodejs22"
            ENTRY_POINT="rule-engine"
            ;;
        "ml-analytics-engine")
            MEMORY="512MB"
            TIMEOUT="120s"
            RUNTIME="python311"
            ENTRY_POINT="ml_analytics_engine"
            ;;
        "unified-ai-processor")
            MEMORY="1GB"
            TIMEOUT="300s"
            RUNTIME="python311"
            ENTRY_POINT="unified_ai_processor"
            ;;
    esac
    
    # 배포 실행
    log "$func_name 배포 중... (런타임: $RUNTIME, 메모리: $MEMORY, 타임아웃: $TIMEOUT)"
    
    # 환경변수 설정
    ENV_VARS=""
    ENV_VARS="${ENV_VARS}GOOGLE_AI_API_KEY=${GOOGLE_AI_API_KEY},"
    ENV_VARS="${ENV_VARS}SUPABASE_URL=${SUPABASE_URL},"
    ENV_VARS="${ENV_VARS}SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY},"
    ENV_VARS="${ENV_VARS}SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY},"
    ENV_VARS="${ENV_VARS}UPSTASH_REDIS_REST_URL=${UPSTASH_REDIS_REST_URL},"
    ENV_VARS="${ENV_VARS}UPSTASH_REDIS_REST_TOKEN=${UPSTASH_REDIS_REST_TOKEN},"
    ENV_VARS="${ENV_VARS}GCP_PROJECT_ID=${GCP_PROJECT_ID}"
    
    if gcloud functions deploy $func_name \
        --gen2 \
        --runtime $RUNTIME \
        --entry-point $ENTRY_POINT \
        --trigger-http \
        --allow-unauthenticated \
        --memory $MEMORY \
        --timeout $TIMEOUT \
        --region $REGION \
        --set-env-vars="${ENV_VARS}" \
        --quiet; then
        
        success "$func_name Function 배포 완료!"
        
        # 헬스 체크 Function도 배포
        log "$func_name-health Function 배포 중..."
        if gcloud functions deploy "${func_name}-health" \
            --gen2 \
            --runtime nodejs22 \
            --entry-point "${func_name}-health" \
            --trigger-http \
            --allow-unauthenticated \
            --memory 128MB \
            --timeout 10s \
            --region $REGION \
            --set-env-vars="${ENV_VARS}" \
            --quiet; then
            
            success "$func_name-health Function 배포 완료!"
        else
            warning "$func_name-health Function 배포 실패 (헬스체크 제외하고 계속)"
        fi
        
    else
        error "$func_name Function 배포 실패!"
        cd - > /dev/null
        return 1
    fi
    
    cd - > /dev/null
    return 0
}

# 각 Function 배포
success_count=0
fail_count=0

for func in "${FUNCTIONS[@]}"; do
    if deploy_function "$func"; then
        ((success_count++))
    else
        ((fail_count++))
    fi
    echo ""  # 줄바꿈
done

# 배포 결과 요약
log "📊 배포 결과 요약"
success "성공: $success_count개 Functions"
if [ $fail_count -gt 0 ]; then
    error "실패: $fail_count개 Functions"
fi

# URL 정보 출력
log "🌐 배포된 Function URLs:"
for func in "${FUNCTIONS[@]}"; do
    URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/$func"
    echo "  • $func: $URL"
    echo "  • $func-health: $URL-health"
done

# 무료 티어 사용량 확인
log "💰 무료 티어 사용량 확인"
echo "예상 월간 사용량:"
echo "  • 호출: 90,000회 (무료 한도: 2,000,000회)"
echo "  • 컴퓨팅: 15,000 GB-초 (무료 한도: 400,000 GB-초)"
echo "  • 네트워크: 5GB (무료 한도: 25GB)"
echo ""
warning "실제 사용량은 GCP 콘솔에서 확인하세요!"

# 테스트 명령어 안내
log "🧪 테스트 명령어"
echo "개별 Function 테스트:"
for func in "${FUNCTIONS[@]}"; do
    URL="https://$REGION-$PROJECT_ID.cloudfunctions.net/$func"
    echo "curl -X POST $URL -H 'Content-Type: application/json' -d '{\"query\":\"서버 상태 확인\"}'"
done

if [ $fail_count -eq 0 ]; then
    success "🎉 모든 Functions가 성공적으로 배포되었습니다!"
    exit 0
else
    error "일부 Functions 배포에 실패했습니다. 로그를 확인해주세요."
    exit 1
fi 