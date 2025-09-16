#!/bin/bash
# Node.js MCP 최적화 스크립트 (2025-09-17)

echo "🔧 Node.js MCP 최적화 적용 중..."

# 기존 과도한 메모리 할당 제거
unset NODE_OPTIONS

# MCP 최적화 Node.js 설정
export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=4096 --max-http-header-size=32768"

# MCP 타임아웃 환경변수
export MCP_TIMEOUT=60000
export MCP_TOOL_TIMEOUT=30000

# DNS 최적화
export UV_THREADPOOL_SIZE=8

# 환경변수를 영구 적용
echo '# MCP 최적화 설정 (2025-09-17)' >> ~/.bashrc
echo 'export NODE_OPTIONS="--dns-result-order=ipv4first --max-old-space-size=4096 --max-http-header-size=32768"' >> ~/.bashrc
echo 'export MCP_TIMEOUT=60000' >> ~/.bashrc
echo 'export MCP_TOOL_TIMEOUT=30000' >> ~/.bashrc
echo 'export UV_THREADPOOL_SIZE=8' >> ~/.bashrc

echo "✅ Node.js MCP 최적화 완료"
echo "🔄 다음 명령어로 적용: source ~/.bashrc"
echo ""
echo "📊 변경 사항:"
echo "- Node.js 힙 메모리: 8GB → 4GB"
echo "- MCP 타임아웃: 기본값 → 60초"
echo "- DNS 우선순위: IPv4 first"
echo "- HTTP 헤더 크기: 확장"