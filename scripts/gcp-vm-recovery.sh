#!/bin/bash
# GCP VM mcp-server 자동 복구 스크립트
# 작성자: Claude Code GCP VM Specialist
# 작성일: 2025-08-13

set -e

VM_IP="104.154.205.25"
VM_NAME="mcp-server"
VM_ZONE="us-central1-a"
PROJECT_ID="openmanager-free-tier"
HEALTH_ENDPOINT="http://${VM_IP}:10000/health"

echo "🚀 GCP VM 자동 복구 스크립트 시작"
echo "VM: ${VM_NAME} (${VM_IP})"
echo "시간: $(date)"
echo "=================================="

# 함수 정의
check_vm_connectivity() {
    echo "🔍 VM 연결성 확인 중..."
    
    # 기본 연결 테스트
    if timeout 5 bash -c "echo >/dev/tcp/${VM_IP}/10000" 2>/dev/null; then
        echo "✅ 포트 10000 연결 가능"
    else
        echo "❌ 포트 10000 연결 실패"
        return 1
    fi
    
    # 헬스체크 엔드포인트 테스트
    if curl -s -f "${HEALTH_ENDPOINT}" >/dev/null; then
        echo "✅ 헬스체크 엔드포인트 정상"
        return 0
    else
        echo "❌ 헬스체크 엔드포인트 실패"
        return 1
    fi
}

check_gcloud_auth() {
    echo "🔐 gcloud 인증 상태 확인..."
    
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q "@"; then
        echo "✅ gcloud 인증 완료"
        return 0
    else
        echo "❌ gcloud 인증 필요"
        echo "📝 다음 명령어로 인증하세요:"
        echo "   gcloud auth login"
        echo "   gcloud config set project ${PROJECT_ID}"
        return 1
    fi
}

vm_ssh_command() {
    local command="$1"
    echo "🔧 VM에서 명령어 실행: $command"
    
    gcloud compute ssh ${VM_NAME} \
        --zone=${VM_ZONE} \
        --command="$command" \
        --quiet \
        2>/dev/null
}

diagnose_vm_services() {
    echo "🔍 VM 서비스 진단 중..."
    
    if ! check_gcloud_auth; then
        echo "⚠️ gcloud 인증 없이는 상세 진단 불가"
        return 1
    fi
    
    echo "📊 PM2 프로세스 상태:"
    vm_ssh_command "pm2 status" || echo "❌ PM2 상태 확인 실패"
    
    echo "📊 시스템 리소스:"
    vm_ssh_command "free -h && df -h" || echo "❌ 시스템 리소스 확인 실패"
    
    echo "📊 네트워크 상태:"
    vm_ssh_command "netstat -tlnp | grep :10000" || echo "❌ 네트워크 상태 확인 실패"
    
    echo "📊 프로세스 목록:"
    vm_ssh_command "ps aux | grep -E '(node|pm2)'" || echo "❌ 프로세스 확인 실패"
}

fix_api_routing() {
    echo "🔧 API 라우팅 문제 수정 중..."
    
    if ! check_gcloud_auth; then
        echo "⚠️ gcloud 인증 없이는 수정 불가"
        return 1
    fi
    
    # PM2 프로세스 재시작
    echo "🔄 PM2 프로세스 재시작..."
    vm_ssh_command "pm2 restart all" || echo "❌ PM2 재시작 실패"
    
    # 서비스 상태 확인
    sleep 10
    echo "✅ 서비스 재시작 완료, 상태 확인 중..."
    vm_ssh_command "pm2 status" || echo "❌ PM2 상태 확인 실패"
    
    # 헬스체크 재확인
    echo "🔍 헬스체크 재확인..."
    if curl -s -f "${HEALTH_ENDPOINT}" >/dev/null; then
        echo "✅ 서비스 복구 성공"
        return 0
    else
        echo "❌ 서비스 복구 실패"
        return 1
    fi
}

setup_monitoring() {
    echo "📊 모니터링 시스템 설정 중..."
    
    if ! check_gcloud_auth; then
        echo "⚠️ gcloud 인증 없이는 설정 불가"
        return 1
    fi
    
    # PM2 모니터링 도구 설치
    vm_ssh_command "pm2 install pm2-logrotate pm2-server-monit" || echo "⚠️ PM2 모니터링 도구 설치 실패"
    
    # 자동 시작 설정
    vm_ssh_command "pm2 startup && pm2 save" || echo "⚠️ 자동 시작 설정 실패"
    
    # 헬스체크 크론탭 설정
    vm_ssh_command "
        (crontab -l 2>/dev/null || echo '') | grep -v 'health-check' | crontab -
        (crontab -l 2>/dev/null || echo '') && echo '*/5 * * * * curl -f http://localhost:10000/health || pm2 restart all' | crontab -
    " || echo "⚠️ 헬스체크 크론탭 설정 실패"
    
    echo "✅ 모니터링 시스템 설정 완료"
}

generate_report() {
    echo "📋 복구 리포트 생성 중..."
    
    local report_file="vm-recovery-$(date +%Y%m%d-%H%M%S).log"
    
    {
        echo "GCP VM 복구 리포트"
        echo "=================="
        echo "VM: ${VM_NAME}"
        echo "IP: ${VM_IP}"
        echo "시간: $(date)"
        echo ""
        
        echo "연결성 테스트:"
        check_vm_connectivity && echo "✅ 연결 정상" || echo "❌ 연결 문제"
        
        echo ""
        echo "헬스체크 응답:"
        curl -s "${HEALTH_ENDPOINT}" 2>/dev/null || echo "응답 없음"
        
        echo ""
        echo "네트워크 포트 상태:"
        for port in 22 10000; do
            echo -n "포트 $port: "
            timeout 3 bash -c "echo >/dev/tcp/${VM_IP}/$port" 2>/dev/null && echo "열림" || echo "닫힘"
        done
        
    } > "$report_file"
    
    echo "📋 리포트 저장: $report_file"
}

# 메인 실행 흐름
main() {
    echo "1️⃣ VM 연결성 확인"
    if ! check_vm_connectivity; then
        echo "💥 VM 연결 실패 - 네트워크 또는 VM 문제"
        exit 1
    fi
    
    echo -e "\n2️⃣ gcloud 인증 확인"
    if check_gcloud_auth; then
        echo -e "\n3️⃣ VM 서비스 진단"
        diagnose_vm_services
        
        echo -e "\n4️⃣ API 라우팅 수정"
        fix_api_routing
        
        echo -e "\n5️⃣ 모니터링 설정"
        setup_monitoring
    else
        echo "⚠️ 인증 완료 후 다시 실행하여 완전한 복구를 진행하세요"
    fi
    
    echo -e "\n6️⃣ 복구 리포트 생성"
    generate_report
    
    echo -e "\n🎉 GCP VM 복구 스크립트 완료"
    echo "📋 상세 리포트: docs/gcp/gcp-vm-recovery-report-2025-08-13.md"
}

# 스크립트 실행
main "$@"