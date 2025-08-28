#!/bin/bash

# 🔄 VM JSON 데이터 생성기 (무료 대안)
# VM 내부에서 실행하여 JSON 파일을 생성하고 GitHub에 업로드

set -e

echo "🔄 VM JSON 데이터 생성 시작..."

# VM 시스템 정보 수집
VM_DATA=$(cat << 'EOF'
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "vm_info": {
    "hostname": "$(hostname)",
    "uptime": "$(uptime -p)",
    "load_avg": "$(cat /proc/loadavg | cut -d' ' -f1-3)",
    "memory": {
      "total": "$(free -m | awk 'NR==2{printf "%.0f", $2}')",
      "used": "$(free -m | awk 'NR==2{printf "%.0f", $3}')",
      "free": "$(free -m | awk 'NR==2{printf "%.0f", $4}')",
      "usage_percent": "$(free -m | awk 'NR==2{printf "%.1f", $3*100/$2}')"
    },
    "disk": {
      "total": "$(df -h / | awk 'NR==2{print $2}')",
      "used": "$(df -h / | awk 'NR==2{print $3}')",
      "free": "$(df -h / | awk 'NR==2{print $4}')",
      "usage_percent": "$(df -h / | awk 'NR==2{print $5}')"
    },
    "network": {
      "internal_ip": "$(hostname -I | cut -d' ' -f1)",
      "external_ip": "$(curl -s ifconfig.me 2>/dev/null || echo 'unknown')"
    }
  },
  "servers": [
EOF

# 서버 데이터 생성 (15개)
SERVERS_JSON='
    {
      "id": "vm-001",
      "name": "GCP e2-micro VM",
      "type": "compute",
      "status": "online",
      "metrics": {
        "cpu": '$((RANDOM % 30 + 10))',
        "memory": '$((RANDOM % 40 + 30))',
        "disk": '$((RANDOM % 50 + 20))',
        "network": '$((RANDOM % 20 + 5))'
      },
      "location": "us-central1-a",
      "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
  ]
}'

# 완전한 JSON 구성
COMPLETE_JSON="${VM_DATA}${SERVERS_JSON}"

# JSON 파일 생성
echo "$COMPLETE_JSON" > /tmp/vm-data.json

echo "✅ JSON 파일 생성 완료: /tmp/vm-data.json"

# GitHub Gist 업로드 (선택사항)
if command -v gh &> /dev/null; then
    echo "📤 GitHub Gist 업로드 중..."
    gh gist create /tmp/vm-data.json --public --filename "vm-data.json" --desc "GCP VM 데이터 $(date)"
else
    echo "💡 GitHub CLI가 없습니다. 수동으로 업로드하거나 다른 방법을 사용하세요."
fi

# 웹 서버로 서빙 (Python 사용)
echo "🌐 간단한 웹 서버 시작 (포트 8000)..."
echo "   내부 접근: http://$(hostname -I | cut -d' ' -f1):8000/vm-data.json"

cd /tmp
python3 -m http.server 8000 &
SERVER_PID=$!

echo "🔄 웹 서버 PID: $SERVER_PID"
echo "⏹️  중지하려면: kill $SERVER_PID"

# 주기적 업데이트 (10분마다)
echo "🔄 10분마다 자동 업데이트 설정..."
while true; do
    sleep 600  # 10분 대기
    
    # 새로운 데이터 생성
    NEW_DATA=$(cat << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "vm_info": {
    "hostname": "$(hostname)",
    "uptime": "$(uptime -p)",
    "load_avg": "$(cat /proc/loadavg | cut -d' ' -f1-3)",
    "memory": {
      "usage_percent": "$(free -m | awk 'NR==2{printf "%.1f", $3*100/$2}')"
    }
  },
  "servers": [
    {
      "id": "vm-001",
      "metrics": {
        "cpu": $((RANDOM % 30 + 10)),
        "memory": $((RANDOM % 40 + 30)),
        "disk": $((RANDOM % 50 + 20)),
        "network": $((RANDOM % 20 + 5))
      },
      "lastUpdated": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    }
  ]
}
EOF
)
    
    echo "$NEW_DATA" > /tmp/vm-data.json
    echo "🔄 $(date): 데이터 업데이트 완료"
done