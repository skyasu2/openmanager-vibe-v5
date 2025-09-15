#!/bin/bash
# Serena MCP 서버 상태 모니터링 스크립트

echo "🔍 Serena MCP 서버 상태 체크..."

# 1. 프로세스 상태 확인
echo "📊 프로세스 상태:"
if pgrep -f "serena-mcp-server" > /dev/null; then
    echo "✅ Serena 프로세스 실행 중"
    ps aux | grep serena-mcp-server | grep -v grep | head -2
else
    echo "❌ Serena 프로세스 없음"
fi

echo ""

# 2. Claude MCP 연결 상태 확인
echo "🔌 Claude MCP 연결 상태:"
claude mcp list | grep -A 1 -B 1 serena

echo ""

# 3. 포트 사용 확인
echo "🌐 네트워크 상태:"
netstat -tlnp 2>/dev/null | grep python || echo "Python 프로세스 포트 없음 (stdio 모드 정상)"

echo ""

# 4. 프로젝트 경로 접근 확인
echo "📁 프로젝트 경로 접근:"
if [ -d "/mnt/d/cursor/openmanager-vibe-v5" ]; then
    echo "✅ 프로젝트 경로 접근 가능"
    ls -la /mnt/d/cursor/openmanager-vibe-v5 | head -3
else
    echo "❌ 프로젝트 경로 접근 불가"
fi

echo ""
echo "🎯 권장사항:"
echo "- 문제 발생 시: claude mcp restart (미래 버전에서 지원 예정)"
echo "- 수동 재시작: 터미널 재시작 또는 WSL 재시작"
echo "- 로그 확인: ps aux | grep serena-mcp-server"