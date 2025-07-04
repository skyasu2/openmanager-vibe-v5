#!/bin/bash
echo "🌐 Fetch MCP Server 시작 중..."
echo "포트: 3001"
echo "CORS: http://localhost:3000, https://openmanager-vibe-v5.vercel.app"
echo "종료하려면 Ctrl+C를 누르세요"
echo ""

# HTTP 모드로 시작
npm start -- --config config.json --http --port 3001
