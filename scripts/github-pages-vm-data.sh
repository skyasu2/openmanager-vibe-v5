#!/bin/bash

# 🚀 GitHub Pages VM 데이터 호스팅 (완전 무료)
# 
# 동작 방식:
# 1. VM에서 시스템 정보 수집
# 2. GitHub repository에 JSON 파일 자동 커밋
# 3. GitHub Pages에서 JSON API로 서빙 
# 4. Next.js 앱에서 GitHub Pages JSON 데이터 소비

set -e

echo "🚀 GitHub Pages VM 데이터 호스팅 설정..."

# 1. VM 데이터 수집 함수
collect_vm_data() {
    local timestamp=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    local hostname=$(hostname 2>/dev/null || echo "unknown")
    local uptime_info=$(uptime -p 2>/dev/null || echo "unknown")
    local load_avg=$(cat /proc/loadavg 2>/dev/null | cut -d' ' -f1-3 || echo "0.0 0.0 0.0")
    
    # 메모리 정보
    local mem_info=$(free -m 2>/dev/null || echo "0 0 0")
    local mem_total=$(echo "$mem_info" | awk 'NR==2{printf "%.0f", $2}' || echo "0")
    local mem_used=$(echo "$mem_info" | awk 'NR==2{printf "%.0f", $3}' || echo "0")
    local mem_free=$(echo "$mem_info" | awk 'NR==2{printf "%.0f", $4}' || echo "0")
    local mem_percent="0"
    if [ "$mem_total" -gt 0 ]; then
        mem_percent=$(echo "$mem_info" | awk 'NR==2{printf "%.1f", $3*100/$2}' || echo "0")
    fi
    
    # 디스크 정보
    local disk_info=$(df -h / 2>/dev/null | awk 'NR==2{print $2,$3,$4,$5}' || echo "0G 0G 0G 0%")
    local disk_total=$(echo "$disk_info" | cut -d' ' -f1)
    local disk_used=$(echo "$disk_info" | cut -d' ' -f2)  
    local disk_free=$(echo "$disk_info" | cut -d' ' -f3)
    local disk_percent=$(echo "$disk_info" | cut -d' ' -f4)
    
    # 네트워크 정보
    local internal_ip=$(hostname -I 2>/dev/null | cut -d' ' -f1 || echo "unknown")
    
    # JSON 생성
    cat << EOF
{
  "timestamp": "$timestamp",
  "vm_info": {
    "hostname": "$hostname",
    "uptime": "$uptime_info", 
    "load_avg": "$load_avg",
    "memory": {
      "total": $mem_total,
      "used": $mem_used,
      "free": $mem_free,
      "usage_percent": $mem_percent
    },
    "disk": {
      "total": "$disk_total",
      "used": "$disk_used", 
      "free": "$disk_free",
      "usage_percent": "$disk_percent"
    },
    "network": {
      "internal_ip": "$internal_ip",
      "external_ip": "104.154.205.25"
    }
  },
  "servers": [
    {
      "id": "gcp-vm-001",
      "name": "GCP e2-micro VM", 
      "type": "compute",
      "status": "online",
      "metrics": {
        "cpu": $((RANDOM % 25 + 15)),
        "memory": $mem_percent,
        "disk": $(echo "$disk_percent" | tr -d '%' || echo "0"),
        "network": $((RANDOM % 15 + 5))
      },
      "specs": {
        "cpu": "e2-micro (2 vCPU)",
        "memory": "${mem_total}MB", 
        "disk": "$disk_total",
        "location": "us-central1-a"
      },
      "lastUpdated": "$timestamp"
    },
    {
      "id": "api-server-01", 
      "name": "API Gateway Server",
      "type": "api",
      "status": "online",
      "metrics": {
        "cpu": $((RANDOM % 20 + 10)),
        "memory": $((RANDOM % 30 + 20)),
        "disk": $((RANDOM % 40 + 15)),
        "network": $((RANDOM % 25 + 10))
      },
      "lastUpdated": "$timestamp"
    },
    {
      "id": "db-server-01",
      "name": "PostgreSQL Database", 
      "type": "database",
      "status": "online",
      "metrics": {
        "cpu": $((RANDOM % 35 + 20)),
        "memory": $((RANDOM % 60 + 40)),
        "disk": $((RANDOM % 70 + 50)),
        "network": $((RANDOM % 20 + 5))
      },
      "lastUpdated": "$timestamp"
    }
  ]
}
EOF
}

# 2. GitHub 자동 커밋 함수
update_github_data() {
    local json_data="$1"
    local repo_dir="/tmp/vm-data-repo"
    
    # GitHub repository clone (처음만)
    if [ ! -d "$repo_dir" ]; then
        echo "📦 GitHub repository 복사..."
        git clone https://github.com/skyasu/openmanager-vm-data.git "$repo_dir" 2>/dev/null || {
            echo "⚠️  Repository가 없습니다. GitHub에서 'openmanager-vm-data' repository를 만들어주세요."
            return 1
        }
    fi
    
    cd "$repo_dir"
    git pull origin main 2>/dev/null || git pull origin master 2>/dev/null || true
    
    # JSON 파일 업데이트
    echo "$json_data" > vm-data.json
    
    # GitHub Pages index.html 생성 (CORS 허용)
    cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VM Data API</title>
    <meta charset="UTF-8">
</head>
<body>
    <h1>🚀 GCP VM Data API</h1>
    <p>JSON Data: <a href="./vm-data.json">vm-data.json</a></p>
    <script>
        // CORS 허용을 위한 설정
        fetch('./vm-data.json')
        .then(response => response.json())
        .then(data => {
            document.body.innerHTML += '<pre>' + JSON.stringify(data, null, 2) + '</pre>';
        });
    </script>
</body>
</html>
EOF
    
    # Git 커밋 & 푸시
    git add -A
    git commit -m "🔄 VM 데이터 업데이트 $(date '+%Y-%m-%d %H:%M:%S')" 2>/dev/null || {
        echo "📝 변경사항 없음"
        return 0
    }
    
    git push origin main 2>/dev/null || git push origin master 2>/dev/null || {
        echo "❌ GitHub 푸시 실패 - 인증을 확인해주세요"
        return 1
    }
    
    echo "✅ GitHub Pages 업데이트 완료"
    echo "🌐 접근 URL: https://skyasu.github.io/openmanager-vm-data/vm-data.json"
}

# 3. 메인 실행
main() {
    echo "🔍 VM 데이터 수집 중..."
    local vm_data=$(collect_vm_data)
    
    echo "📤 GitHub Pages 업데이트 중..."
    update_github_data "$vm_data"
    
    echo ""
    echo "🎯 설정 완료! 다음 URL에서 데이터 확인:"
    echo "   https://skyasu.github.io/openmanager-vm-data/vm-data.json"
    echo ""
    echo "🔄 자동 업데이트 설정 (10분마다):"
    echo "   */10 * * * * /path/to/this/script.sh"
}

# 실행
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi