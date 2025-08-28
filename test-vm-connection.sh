#!/bin/bash

# 🔍 VM 연결 테스트 스크립트
# 방화벽 설정 후 실행하여 연결 상태 확인

# 환경변수에서 VM IP 읽기
VM_IP="${GCP_VM_EXTERNAL_IP:-35.202.122.78}"

echo "🔍 VM 연결 테스트 시작..."
echo "VM IP: $VM_IP"

# SSH 포트 테스트
echo ""
echo "1️⃣ SSH 포트 22 테스트..."
if timeout 3 bash -c "</dev/tcp/$VM_IP/22" 2>/dev/null; then
    echo "✅ SSH 포트 22 열림"
    SSH_OK=true
else
    echo "❌ SSH 포트 22 막힘"
    SSH_OK=false
fi

# HTTP 포트 10000 테스트
echo ""
echo "2️⃣ HTTP 포트 10000 테스트..."
if curl -m 3 -f http://$VM_IP:10000/health 2>/dev/null; then
    echo "✅ MCP 서버 응답 정상"
    SERVER_OK=true
else
    echo "❌ MCP 서버 응답 없음 (서버 미배포 또는 포트 막힘)"
    SERVER_OK=false
fi

echo ""
echo "📋 연결 상태 요약:"
echo "   SSH (포트 22): $($SSH_OK && echo "✅ 연결 가능" || echo "❌ 연결 불가")"
echo "   MCP 서버 (포트 10000): $($SERVER_OK && echo "✅ 서버 실행 중" || echo "❌ 서버 미실행")"

if $SSH_OK; then
    echo ""
    echo "🚀 다음 단계: 서버 배포"
    echo "   ./scripts/deploy-to-gcp-vm.sh"
    echo ""
    echo "💡 배포 후 테스트:"
    echo "   curl http://$VM_IP:10000/health"
    echo "   curl http://$VM_IP:10000/api/servers"
else
    echo ""
    echo "⚠️ 방화벽 설정을 확인해주세요:"
    echo "   1. 방화벽 규칙 생성됨?"
    echo "   2. VM에 mcp-server 태그 추가됨?"
    echo "   3. 규칙 적용까지 1-2분 대기 필요"
fi