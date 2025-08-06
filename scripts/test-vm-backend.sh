#!/bin/bash

# 🧪 VM AI Backend 테스트 스크립트

set -e

echo "🧪 VM AI Backend 연결 테스트를 시작합니다..."

# 설정 변수
VM_NAME="${VM_NAME:-openmanager-ai-backend}"
ZONE="${GCP_ZONE:-asia-northeast3-a}"
PROJECT_ID="${GCP_PROJECT_ID:-openmanager-free-tier}"

echo "📋 테스트 설정:"
echo "  - Project ID: $PROJECT_ID"
echo "  - VM Name: $VM_NAME"
echo "  - Zone: $ZONE"

# VM 상태 확인
echo ""
echo "🖥️ VM 인스턴스 상태 확인..."
VM_STATUS=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(status)" 2>/dev/null || echo "NOT_FOUND")

if [ "$VM_STATUS" = "NOT_FOUND" ]; then
    echo "❌ VM 인스턴스가 존재하지 않습니다."
    echo "💡 다음 명령으로 VM을 생성하세요: bash scripts/gcp-vm-setup.sh"
    exit 1
fi

echo "✅ VM 상태: $VM_STATUS"

# 외부 IP 가져오기
VM_EXTERNAL_IP=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(networkInterfaces[0].accessConfigs[0].natIP)")
echo "🌐 External IP: $VM_EXTERNAL_IP"

# VM이 실행 중인지 확인
if [ "$VM_STATUS" != "RUNNING" ]; then
    echo "⚠️ VM이 실행 중이 아닙니다. 시작하는 중..."
    gcloud compute instances start $VM_NAME --zone=$ZONE
    
    echo "⏳ VM 부팅 대기 중... (30초)"
    sleep 30
    
    VM_STATUS=$(gcloud compute instances describe $VM_NAME --zone=$ZONE --format="get(status)")
    echo "✅ VM 상태: $VM_STATUS"
fi

# SSH 연결 테스트
echo ""
echo "🔗 SSH 연결 테스트..."
SSH_TEST=$(gcloud compute ssh $VM_NAME --zone=$ZONE --command="echo 'SSH OK'" --ssh-flag="-o ConnectTimeout=10" 2>/dev/null || echo "FAILED")

if [ "$SSH_TEST" = "FAILED" ]; then
    echo "❌ SSH 연결 실패"
    echo "💡 방화벽 규칙을 확인하세요"
    exit 1
fi

echo "✅ SSH 연결: OK"

# 포트 3001 열려있는지 확인
echo ""
echo "🔍 포트 3001 상태 확인..."
PORT_CHECK=$(gcloud compute ssh $VM_NAME --zone=$ZONE --command="sudo netstat -tuln | grep ':3001' || echo 'NOT_LISTENING'" --ssh-flag="-o ConnectTimeout=10" 2>/dev/null)

if [[ $PORT_CHECK == *"NOT_LISTENING"* ]]; then
    echo "⚠️ 포트 3001이 열려있지 않습니다."
    echo "💡 VM AI Backend가 아직 실행되지 않았거나 설정이 필요합니다."
    
    # 백엔드 상태 확인
    echo ""
    echo "🔧 VM AI Backend 상태 확인..."
    BACKEND_STATUS=$(gcloud compute ssh $VM_NAME --zone=$ZONE --command="pm2 list | grep vm-ai-backend || echo 'NOT_RUNNING'" --ssh-flag="-o ConnectTimeout=10" 2>/dev/null)
    
    if [[ $BACKEND_STATUS == *"NOT_RUNNING"* ]]; then
        echo "❌ VM AI Backend가 실행되지 않았습니다."
        echo "💡 다음 명령으로 배포하세요: bash scripts/deploy-vm-backend.sh"
        exit 1
    else
        echo "✅ PM2 상태:"
        echo "$BACKEND_STATUS"
    fi
else
    echo "✅ 포트 3001: 열림"
fi

# HTTP API 테스트
echo ""
echo "🌐 HTTP API 테스트..."
HTTP_TEST=$(curl -s --connect-timeout 10 "http://$VM_EXTERNAL_IP:3001/api/health" || echo "FAILED")

if [ "$HTTP_TEST" = "FAILED" ]; then
    echo "❌ HTTP API 연결 실패"
    
    # 방화벽 규칙 확인
    echo "🔥 방화벽 규칙 확인..."
    FIREWALL_RULE=$(gcloud compute firewall-rules list --filter="name=allow-ai-backend" --format="value(name)" 2>/dev/null)
    
    if [ -z "$FIREWALL_RULE" ]; then
        echo "❌ 방화벽 규칙이 없습니다. 생성하는 중..."
        gcloud compute firewall-rules create allow-ai-backend \
            --direction=INGRESS \
            --priority=1000 \
            --network=default \
            --action=ALLOW \
            --rules=tcp:3001 \
            --source-ranges=0.0.0.0/0 \
            --target-tags=ai-backend-server
        echo "✅ 방화벽 규칙 생성 완료"
    else
        echo "✅ 방화벽 규칙 존재: $FIREWALL_RULE"
    fi
    
    exit 1
else
    echo "✅ HTTP API 응답:"
    echo "$HTTP_TEST" | jq . 2>/dev/null || echo "$HTTP_TEST"
fi

# WebSocket 연결 테스트 (간단한 텔넷 체크)
echo ""
echo "🔌 WebSocket 포트 테스트..."
WS_TEST=$(timeout 5 bash -c "</dev/tcp/$VM_EXTERNAL_IP/3001" 2>/dev/null && echo "OK" || echo "FAILED")

if [ "$WS_TEST" = "FAILED" ]; then
    echo "❌ WebSocket 포트 연결 실패"
else
    echo "✅ WebSocket 포트: 열림"
fi

# 환경변수 템플릿 업데이트
echo ""
echo "📄 환경변수 파일 업데이트..."
if [ -f ".env.gcp.template" ]; then
    # IP 주소 자동 업데이트
    sed "s/YOUR_VM_EXTERNAL_IP_HERE/$VM_EXTERNAL_IP/g" .env.gcp.template > .env.vm.generated
    echo "✅ 환경변수 파일 생성: .env.vm.generated"
    echo ""
    echo "📋 .env.local에 추가할 내용:"
    echo "----------------------------------------"
    grep -E "^(WEBSOCKET_URL|VM_AI_BACKEND_URL|GCP_VM_EXTERNAL_IP)" .env.vm.generated
    echo "----------------------------------------"
else
    echo "⚠️ .env.gcp.template 파일이 없습니다."
fi

# 성능 테스트
echo ""
echo "⚡ 성능 테스트..."
if [ "$HTTP_TEST" != "FAILED" ]; then
    echo "🚀 응답 시간 측정..."
    for i in {1..3}; do
        RESPONSE_TIME=$(curl -s -w "%{time_total}" -o /dev/null "http://$VM_EXTERNAL_IP:3001/api/health" 2>/dev/null || echo "0.000")
        echo "  시도 $i: ${RESPONSE_TIME}s"
    done
fi

# 로그 확인
echo ""
echo "📄 VM AI Backend 로그 확인..."
RECENT_LOGS=$(gcloud compute ssh $VM_NAME --zone=$ZONE --command="pm2 logs vm-ai-backend --lines 5 --nostream || echo 'NO_LOGS'" --ssh-flag="-o ConnectTimeout=10" 2>/dev/null)

if [[ $RECENT_LOGS != *"NO_LOGS"* ]]; then
    echo "✅ 최근 로그:"
    echo "$RECENT_LOGS"
else
    echo "⚠️ 로그를 가져올 수 없습니다."
fi

echo ""
echo "🎉 VM AI Backend 테스트 완료!"
echo ""
echo "📋 결과 요약:"
echo "  🖥️ VM 상태: $VM_STATUS"
echo "  🌐 External IP: $VM_EXTERNAL_IP"
echo "  🔗 SSH: OK"
echo "  🌐 HTTP API: $([ "$HTTP_TEST" != "FAILED" ] && echo "OK" || echo "FAILED")"
echo "  🔌 WebSocket: $([ "$WS_TEST" != "FAILED" ] && echo "OK" || echo "FAILED")"
echo ""
echo "🚀 Next.js 앱에서 사용하려면:"
echo "  1. .env.vm.generated 내용을 .env.local에 복사"
echo "  2. npm run dev 재시작"
echo "  3. AI 사이드바에서 고급 기능 테스트"
echo ""

# 비용 정보
echo "💰 무료 티어 사용량:"
echo "  - e2-micro 인스턴스: 월 744시간 무료"
echo "  - 네트워크 송신: 월 1GB 무료 (중국/호주 제외)"
echo "  - 영구 디스크: 30GB 무료"
echo ""

# 관리 명령어
echo "🔧 유용한 관리 명령어:"
echo "  VM 중지: gcloud compute instances stop $VM_NAME --zone=$ZONE"
echo "  VM 시작: gcloud compute instances start $VM_NAME --zone=$ZONE"
echo "  SSH 접속: gcloud compute ssh $VM_NAME --zone=$ZONE"
echo "  로그 확인: gcloud compute ssh $VM_NAME --zone=$ZONE --command='pm2 logs vm-ai-backend'"
echo ""