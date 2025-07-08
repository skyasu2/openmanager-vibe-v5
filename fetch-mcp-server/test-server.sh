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
