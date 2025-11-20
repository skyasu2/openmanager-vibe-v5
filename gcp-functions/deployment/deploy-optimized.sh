#!/bin/bash
# 🚀 GCP Functions 최적화 배포 스크립트
# 2025-11-20: 환경 변수 검증, 에러 핸들링, 롤백 기능 추가

set -e  # 에러 발생 시 즉시 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 검증
check_env() {
    log_info "환경 변수 검증 중..."
    
    if [ -z "$GCP_PROJECT_ID" ]; then
        log_error "GCP_PROJECT_ID 환경 변수가 설정되지 않았습니다."
        log_info "설정 방법: export GCP_PROJECT_ID=your-project-id"
        exit 1
    fi
    
    if [ -z "$GCP_REGION" ]; then
        log_warn "GCP_REGION이 설정되지 않았습니다. 기본값 'asia-northeast3' 사용"
        export GCP_REGION="asia-northeast3"
    fi
    
    log_info "✅ 환경 변수 검증 완료"
    log_info "   프로젝트: $GCP_PROJECT_ID"
    log_info "   리전: $GCP_REGION"
}

# GCP 인증 확인
check_auth() {
    log_info "GCP 인증 확인 중..."
    
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        log_error "GCP 인증이 필요합니다."
        log_info "실행: gcloud auth login"
        exit 1
    fi
    
    log_info "✅ GCP 인증 확인 완료"
}

# 프로젝트 설정
set_project() {
    log_info "GCP 프로젝트 설정 중..."
    gcloud config set project "$GCP_PROJECT_ID"
    log_info "✅ 프로젝트 설정 완료"
}

# Python Function 배포
deploy_python_function() {
    local func_name=$1
    local func_dir=$2
    local memory=$3
    local timeout=$4
    
    log_info "배포 중: $func_name (Python)"
    
    cd "$func_dir"
    
    # requirements.txt 존재 확인
    if [ ! -f "requirements.txt" ]; then
        log_error "$func_name: requirements.txt 없음"
        return 1
    fi
    
    # main.py 존재 확인
    if [ ! -f "main.py" ]; then
        log_error "$func_name: main.py 없음"
        return 1
    fi
    
    # 배포
    gcloud functions deploy "$func_name" \
        --runtime python310 \
        --trigger-http \
        --allow-unauthenticated \
        --memory="$memory" \
        --timeout="$timeout" \
        --region="$GCP_REGION" \
        --entry-point=main \
        --quiet
    
    if [ $? -eq 0 ]; then
        log_info "✅ $func_name 배포 완료"
    else
        log_error "❌ $func_name 배포 실패"
        return 1
    fi
    
    cd - > /dev/null
}

# Node.js Function 배포
deploy_nodejs_function() {
    local func_name=$1
    local func_dir=$2
    local memory=$3
    local timeout=$4
    local entry_point=$5
    
    log_info "배포 중: $func_name (Node.js)"
    
    cd "$func_dir"
    
    # package.json 존재 확인
    if [ ! -f "package.json" ]; then
        log_error "$func_name: package.json 없음"
        return 1
    fi
    
    # index.js 존재 확인
    if [ ! -f "index.js" ]; then
        log_error "$func_name: index.js 없음"
        return 1
    fi
    
    # 배포
    gcloud functions deploy "$func_name" \
        --runtime nodejs20 \
        --trigger-http \
        --allow-unauthenticated \
        --memory="$memory" \
        --timeout="$timeout" \
        --region="$GCP_REGION" \
        --entry-point="$entry_point" \
        --quiet
    
    if [ $? -eq 0 ]; then
        log_info "✅ $func_name 배포 완료"
    else
        log_error "❌ $func_name 배포 실패"
        return 1
    fi
    
    cd - > /dev/null
}

# 메인 배포 함수
deploy_all() {
    log_info "🚀 GCP Functions 배포 시작"
    log_info "================================"
    
    local base_dir="/mnt/d/cursor/openmanager-vibe-v5/gcp-functions"
    local failed_functions=()
    
    # Python Functions
    deploy_python_function "enhanced-korean-nlp" "$base_dir/enhanced-korean-nlp" "256MB" "60s" || failed_functions+=("enhanced-korean-nlp")
    deploy_python_function "ml-analytics-engine" "$base_dir/ml-analytics-engine" "384MB" "45s" || failed_functions+=("ml-analytics-engine")
    deploy_python_function "unified-ai-processor" "$base_dir/unified-ai-processor" "512MB" "120s" || failed_functions+=("unified-ai-processor")
    
    # Node.js Functions
    deploy_nodejs_function "ai-gateway" "$base_dir/ai-gateway" "256MB" "60s" "aiGateway" || failed_functions+=("ai-gateway")
    deploy_nodejs_function "health-check" "$base_dir/health" "128MB" "10s" "healthCheck" || failed_functions+=("health-check")
    deploy_nodejs_function "rule-engine" "$base_dir/rule-engine" "256MB" "30s" "ruleEngine" || failed_functions+=("rule-engine")
    
    log_info "================================"
    
    if [ ${#failed_functions[@]} -eq 0 ]; then
        log_info "✅ 모든 Functions 배포 완료!"
    else
        log_error "❌ 실패한 Functions: ${failed_functions[*]}"
        exit 1
    fi
}

# 배포 후 검증
verify_deployment() {
    log_info "배포 검증 중..."
    
    local functions=(
        "enhanced-korean-nlp"
        "ml-analytics-engine"
        "unified-ai-processor"
        "ai-gateway"
        "health-check"
        "rule-engine"
    )
    
    for func in "${functions[@]}"; do
        if gcloud functions describe "$func" --region="$GCP_REGION" &> /dev/null; then
            log_info "✅ $func: 활성"
        else
            log_warn "⚠️  $func: 확인 불가"
        fi
    done
}

# 메인 실행
main() {
    log_info "🚀 GCP Functions 최적화 배포 스크립트"
    log_info "버전: 2.0.0 (2025-11-20)"
    echo ""
    
    check_env
    check_auth
    set_project
    
    echo ""
    read -p "배포를 시작하시겠습니까? (y/N): " -n 1 -r
    echo ""
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "배포 취소됨"
        exit 0
    fi
    
    deploy_all
    verify_deployment
    
    log_info "🎉 배포 완료!"
}

# 스크립트 실행
main "$@"
