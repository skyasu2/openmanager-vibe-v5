#!/bin/bash

# MCP 서버 설정 스크립트

echo "🚀 MCP 서버 설정을 시작합니다..."

# MCP 서버 디렉토리로 이동
cd mcp-server

# 의존성 설치
echo "📦 MCP 서버 의존성을 설치합니다..."
npm install

# 서버 실행 권한 설정
chmod +x server.js

echo "✅ MCP 서버 설정이 완료되었습니다!"

# 개발 환경에서 테스트
if [ "$NODE_ENV" = "development" ]; then
    echo "🧪 개발 환경에서 MCP 서버를 테스트합니다..."
    timeout 5s node server.js || echo "MCP 서버 테스트 완료"
fi

echo "🔧 사용 가이드:"
echo "- Cursor IDE: mcp-cursor.json 파일 사용 (로컬 개발용)"
echo "- Render.com: mcp-render.json 파일 사용 (AI 엔진 배포용)"
echo "- 일반 개발: mcp.dev.json 파일 사용"
echo "- 일반 프로덕션: mcp.json 파일 사용"
echo "- 서버 실행: cd mcp-server && npm start"
echo ""
echo "📍 환경별 MCP 설정:"
echo "1. Cursor IDE (로컬 개발): mcp-cursor.json"
echo "2. Render.com AI 엔진: mcp-render.json (/opt/render/project 경로)"
echo "3. 기타 개발환경: mcp.dev.json"
echo "4. 기타 프로덕션: mcp.json" 