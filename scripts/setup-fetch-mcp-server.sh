#!/bin/bash

# 🌐 공식 Fetch MCP Server 설정 스크립트
# GitHub: https://github.com/fetch-mcp/fetch-mcp-server

echo "🚀 공식 Fetch MCP Server 설치 시작..."

# 1. 프로젝트 루트로 이동
cd "$(dirname "$0")/.."

# 2. fetch-mcp-server 디렉토리 생성 및 이동
mkdir -p fetch-mcp-server
cd fetch-mcp-server

# 3. 공식 Fetch MCP Server 복제
echo "📁 공식 Fetch MCP Server 복제 중..."
if [ -d ".git" ]; then
    echo "기존 저장소가 있습니다. 업데이트 중..."
    git pull origin main
else
    git clone https://github.com/fetch-mcp/fetch-mcp-server.git .
fi

# 4. 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 5. 빌드
echo "🔨 빌드 중..."
npm run build

# 6. 설정 파일 생성
echo "⚙️ 설정 파일 생성 중..."
cat > config.json << EOF
{
  "server": {
    "host": "localhost",
    "port": 3001,
    "cors": {
      "origin": ["http://localhost:3000", "https://openmanager-vibe-v5.vercel.app"],
      "methods": ["GET", "POST", "OPTIONS"],
      "allowedHeaders": ["Content-Type", "Authorization"]
    }
  },
  "fetch": {
    "timeout": 30000,
    "maxRetries": 3,
    "userAgent": "OpenManager-Vibe-FetchMCP/1.0",
    "allowedDomains": ["*"],
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 100
    }
  },
  "security": {
    "validateSSL": true,
    "blockPrivateIPs": true,
    "maxContentLength": "10MB"
  }
}
EOF

# 7. 시작 스크립트 생성
echo "📝 시작 스크립트 생성 중..."
cat > start-server.sh << 'EOF'
#!/bin/bash
echo "🌐 Fetch MCP Server 시작 중..."
echo "포트: 3001"
echo "CORS: http://localhost:3000, https://openmanager-vibe-v5.vercel.app"
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

# HTTP 모드로 시작
npm start -- --config config.json --http --port 3001
EOF

chmod +x start-server.sh

# 8. 테스트 스크립트 생성
cat > test-server.sh << 'EOF'
#!/bin/bash
echo "🧪 Fetch MCP Server 테스트 중..."

# 서버 헬스 체크
echo "1. 헬스 체크..."
curl -s http://localhost:3001/health | jq '.' || echo "서버가 실행되지 않았습니다"

echo ""
echo "2. 사용 가능한 도구 확인..."
curl -s http://localhost:3001/tools | jq '.' || echo "도구 목록을 가져올 수 없습니다"

echo ""
echo "3. 샘플 fetch 테스트..."
curl -s -X POST http://localhost:3001/call-tool \
  -H "Content-Type: application/json" \
  -d '{
    "name": "fetch_html",
    "arguments": {
      "url": "https://httpbin.org/html"
    }
  }' | jq '.' || echo "fetch 테스트 실패"
EOF

chmod +x test-server.sh

# 9. 개발 환경 설정 파일 생성
cat > .env.development << EOF
# Fetch MCP Server 개발 환경
NODE_ENV=development
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=3001
FETCH_TIMEOUT=30000
FETCH_MAX_RETRIES=3
CORS_ORIGIN=http://localhost:3000,https://openmanager-vibe-v5.vercel.app
EOF

# 10. 패키지 정보 업데이트
echo "📋 패키지 정보 업데이트 중..."
if [ -f "package.json" ]; then
    # 스크립트 추가
    npm pkg set scripts.start:http="node dist/index.js --http --port 3001"
    npm pkg set scripts.start:stdio="node dist/index.js --stdio"
    npm pkg set scripts.dev="nodemon --exec 'npm run build && npm run start:http'"
    npm pkg set scripts.test:api="./test-server.sh"
fi

echo ""
echo "✅ 공식 Fetch MCP Server 설치 완료!"
echo ""
echo "📖 사용법:"
echo "  cd fetch-mcp-server"
echo "  ./start-server.sh     # 서버 시작"
echo "  ./test-server.sh      # 테스트 실행"
echo ""
echo "🌐 사용 가능한 도구:"
echo "  - fetch_html: HTML 페이지 가져오기"
echo "  - fetch_json: JSON 데이터 가져오기"
echo "  - fetch_txt: 텍스트 파일 가져오기"
echo "  - fetch_markdown: Markdown 파일 가져오기"
echo ""
echo "🔗 연결 정보:"
echo "  HTTP: http://localhost:3001"
echo "  CORS: 설정됨 (localhost:3000, vercel.app)"
echo "  설정 파일: config.json"
echo "" 