#!/bin/bash
# 🚀 Cloud Shell에서 SSH 키 등록 스크립트

echo "🔑 Cloud Shell에서 SSH 키 등록을 시작합니다..."

# 윈도우에서 생성한 SSH 공개 키
SSH_PUBLIC_KEY="ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC3NnxZMhIrSOBIGmPoCThOrLB3edUqMqqBvZAZFP28PkOKJIegvvfLVORMDObkOu5lxPPhl8iEQ9Tgsa2c2wOF0t9r3rXgZ+iF/nHi4LqbyputfMv2u7u0yHBJPAbKI2U9kAdTowOtwrWoKZSeF7/LkZrkeu1Euq5bXEgPoAe/22fGmuM6jBZu8Gl+WCe+/1T/oaM8/8eTUo1zcwt8GsI+SwOekKfQ5ZMpDUSgaa9wbf/rgioydTVBYrbUcIythy63LCGX/0zaL5vllpl27yJsAwpwKJ0onT/KoBZVfPIPMTdKW6B5hKejGE3hBR9HWh82jOC0TK4ePV87gGUZyhIr skyas@sky-note"

# 임시 파일에 SSH 키 저장
echo "skyasu2:$SSH_PUBLIC_KEY" > /tmp/ssh-keys.txt

echo "📝 SSH 키를 VM 메타데이터에 등록 중..."

# VM에 SSH 키 등록
gcloud compute instances add-metadata mcp-server \
    --zone=us-central1-a \
    --metadata-from-file ssh-keys=/tmp/ssh-keys.txt \
    --project=openmanager-free-tier

if [ $? -eq 0 ]; then
    echo "✅ SSH 키 등록 완료!"
    echo "🕐 VM 메타데이터 적용 대기 중... (30초)"
    sleep 30
    
    echo "🧪 SSH 연결 테스트..."
    gcloud compute ssh mcp-server --zone=us-central1-a --dry-run
    
    echo ""
    echo "🎉 설정 완료! 이제 다음 방법들을 사용할 수 있습니다:"
    echo ""
    echo "1️⃣ Cloud Shell에서 직접 접속:"
    echo "   gcloud compute ssh mcp-server --zone=us-central1-a"
    echo ""
    echo "2️⃣ 윈도우에서 VS Code 원격 개발:"
    echo "   ssh gcp-vm-dev"
    echo "   또는 VS Code에서 Ctrl+Shift+P → Remote-SSH: Connect to Host"
    echo ""
    echo "3️⃣ 포트 포워딩 (윈도우에서):"
    echo "   ./port-forward.ps1"
    echo ""
else
    echo "❌ SSH 키 등록 실패"
    echo "수동으로 등록해주세요:"
    echo "1. VM 인스턴스 페이지에서 mcp-server 선택"
    echo "2. 편집 → 보안 → SSH 키 → 항목 추가"
    echo "3. 다음 키 붙여넣기:"
    echo "$SSH_PUBLIC_KEY"
fi

# 임시 파일 정리
rm -f /tmp/ssh-keys.txt

echo ""
echo "🌐 VM 상태 확인:"
curl -s http://104.154.205.25:10000/health | jq '.' 2>/dev/null || curl -s http://104.154.205.25:10000/health