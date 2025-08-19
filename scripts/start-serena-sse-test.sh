#!/bin/bash

# Serena SSE 모드 테스트 스크립트

echo "🚀 Serena SSE 모드 시작..."

# SSE 모드로 Serena 시작
/home/skyasu/.local/bin/uvx --from git+https://github.com/oraios/serena serena-mcp-server \
  --project /mnt/d/cursor/openmanager-vibe-v5 \
  --transport sse \
  --port 9121 \
  --host 127.0.0.1 &

SERENA_PID=$!
echo "Serena PID: $SERENA_PID"

sleep 5

echo "🔍 Serena 상태 확인..."
if curl -s http://127.0.0.1:9121/health >/dev/null 2>&1; then
    echo "✅ Serena SSE 서버 정상 실행 중"
    echo "📊 서버 정보:"
    curl -s http://127.0.0.1:9121/health | head -3
else
    echo "❌ Serena SSE 서버 연결 실패"
fi

echo ""
echo "🔧 5초 후 종료..."
sleep 5
kill $SERENA_PID 2>/dev/null || true
echo "✅ 테스트 완료"