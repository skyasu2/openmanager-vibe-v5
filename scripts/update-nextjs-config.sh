#!/bin/bash

# 📝 Next.js 설정 업데이트 스크립트
# 선택한 무료 방법에 따라 데이터 소스 변경

echo "📝 Next.js VM 데이터 소스 설정 업데이트"
echo ""

# 사용자 선택 받기
echo "🎯 어떤 방법을 사용하시나요?"
echo "   1) Cloud Shell 내부 IP 접근"
echo "   2) GitHub Pages 외부 접근" 
echo "   3) VM 내부 웹서버"
echo ""
read -p "선택 (1-3): " choice

case $choice in
    1)
        echo "🌐 Cloud Shell 내부 IP 설정..."
        read -p "VM 내부 IP 주소 입력 (예: 10.128.0.2): " internal_ip
        
        # .env.local 업데이트
        echo "# GCP VM 내부 접근 설정" > .env.local.vm
        echo "GCP_VM_ENDPOINT=http://$internal_ip:8080" >> .env.local.vm
        echo "GCP_VM_MODE=internal" >> .env.local.vm
        echo "NEXT_PUBLIC_VM_DATA_SOURCE=gcp_internal" >> .env.local.vm
        
        echo "✅ Cloud Shell 내부 접근 설정 완료"
        echo "📁 파일: .env.local.vm"
        echo "🔄 적용: cp .env.local.vm .env.local"
        ;;
        
    2)
        echo "📄 GitHub Pages 외부 접근 설정..."
        read -p "GitHub 사용자명 입력: " github_user
        
        # .env.local 업데이트
        echo "# GitHub Pages 외부 접근 설정" > .env.local.vm
        echo "GCP_VM_ENDPOINT=https://$github_user.github.io/openmanager-vm-data/vm-data.json" >> .env.local.vm
        echo "GCP_VM_MODE=external" >> .env.local.vm  
        echo "NEXT_PUBLIC_VM_DATA_SOURCE=github_pages" >> .env.local.vm
        
        echo "✅ GitHub Pages 외부 접근 설정 완료"
        echo "📁 파일: .env.local.vm"  
        echo "🔄 적용: cp .env.local.vm .env.local"
        ;;
        
    3)
        echo "🖥️ VM 내부 웹서버 설정..."
        
        # .env.local 업데이트
        echo "# VM 내부 웹서버 설정" > .env.local.vm
        echo "GCP_VM_ENDPOINT=http://104.154.205.25:8000" >> .env.local.vm
        echo "GCP_VM_MODE=vm_internal" >> .env.local.vm
        echo "NEXT_PUBLIC_VM_DATA_SOURCE=vm_webserver" >> .env.local.vm
        
        echo "✅ VM 내부 웹서버 설정 완료"
        echo "📁 파일: .env.local.vm"
        echo "🔄 적용: cp .env.local.vm .env.local"
        ;;
        
    *)
        echo "❌ 잘못된 선택입니다."
        exit 1
        ;;
esac

echo ""
echo "🔄 serverConfig.ts 업데이트 중..."

# serverConfig.ts 백업
cp src/config/serverConfig.ts src/config/serverConfig.ts.backup

# 새 설정으로 업데이트
cat > src/config/serverConfig.ts.new << 'EOF'
// 🆓 무료 GCP VM 데이터 소스 설정
// 방화벽 설정 없이도 VM 데이터 활용 가능

const VM_DATA_SOURCE = process.env.NEXT_PUBLIC_VM_DATA_SOURCE || 'mock';
const GCP_VM_ENDPOINT = process.env.GCP_VM_ENDPOINT;

export const serverConfig = {
  // 데이터 소스 우선순위 (무료 방법들)
  dataSources: {
    primary: VM_DATA_SOURCE,
    fallback: 'mock'
  },
  
  // VM 엔드포인트 설정
  endpoints: {
    gcp_internal: GCP_VM_ENDPOINT, // Cloud Shell 내부 IP
    github_pages: GCP_VM_ENDPOINT, // GitHub Pages JSON
    vm_webserver: GCP_VM_ENDPOINT, // VM 웹서버
    mock: '/api/servers/all' // 기존 Mock 데이터 (fallback)
  },
  
  // 무료티어 보호 설정
  rateLimit: {
    enabled: true,
    maxRequests: 10, // 10분당 10회
    windowMs: 10 * 60 * 1000 // 10분
  },
  
  // 캐시 설정 (무료 리소스 보호)
  cache: {
    ttl: 5 * 60 * 1000, // 5분 캐시
    enabled: true
  }
};

// 현재 사용 중인 데이터 소스
export const getCurrentDataSource = () => {
  switch (VM_DATA_SOURCE) {
    case 'gcp_internal':
      return {
        name: 'GCP VM (내부)',
        endpoint: serverConfig.endpoints.gcp_internal,
        description: 'Cloud Shell을 통한 내부 네트워크 접근'
      };
    case 'github_pages':
      return {
        name: 'GitHub Pages',
        endpoint: serverConfig.endpoints.github_pages,
        description: 'GitHub Pages를 통한 외부 접근'
      };
    case 'vm_webserver':
      return {
        name: 'VM 웹서버',
        endpoint: serverConfig.endpoints.vm_webserver,
        description: 'VM 내부 Python 웹서버'
      };
    default:
      return {
        name: 'Mock 데이터',
        endpoint: serverConfig.endpoints.mock,
        description: 'fallback 모드 (개발/테스트용)'
      };
  }
};

export default serverConfig;
EOF

mv src/config/serverConfig.ts.new src/config/serverConfig.ts

echo "✅ serverConfig.ts 업데이트 완료"
echo ""
echo "🎯 최종 설정:"
echo "   데이터 소스: $(cat .env.local.vm | grep NEXT_PUBLIC_VM_DATA_SOURCE | cut -d'=' -f2)"
echo "   엔드포인트: $(cat .env.local.vm | grep GCP_VM_ENDPOINT | cut -d'=' -f2)"
echo ""  
echo "🚀 적용 방법:"
echo "   1. cp .env.local.vm .env.local"
echo "   2. npm run dev"
echo ""
echo "📋 테스트:"
echo "   대시보드에서 서버 카드가 VM 실제 데이터로 표시됨"