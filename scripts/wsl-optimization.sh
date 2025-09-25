#!/bin/bash
# WSL 개발 환경 최적화 스크립트
# 2025-09-25 개발 환경 관리자 최적화

echo "🐧 WSL 개발 환경 최적화 시작..."

# 1. 메모리 최적화
echo "📊 메모리 사용량 확인:"
free -h

# 2. 시스템 캐시 정리 (안전한 방법)
echo "🧹 시스템 캐시 정리 중..."
sync
echo 1 | sudo tee /proc/sys/vm/drop_caches > /dev/null

# 3. npm 캐시 정리
echo "📦 npm 캐시 정리 중..."
npm cache clean --force

# 4. MCP 서버 상태 확인
echo "🔌 MCP 서버 상태 확인:"
claude mcp list | grep -E "(connected|error)" || echo "MCP 상태 확인 불가"

# 5. AI CLI 도구 상태 확인
echo "🤖 AI CLI 도구 상태:"
echo "Claude: $(claude --version 2>/dev/null || echo 'N/A')"
echo "Gemini: $(timeout 3 gemini --version 2>/dev/null || echo 'N/A')"
echo "Qwen: $(which qwen >/dev/null && echo 'OK' || echo 'N/A')"
echo "Codex: $(which codex >/dev/null && echo 'OK' || echo 'N/A')"

# 6. 프로세스 정리 (필요시)
AI_PROCESSES=$(ps aux | grep -E "(claude|mcp|node)" | grep -v grep | wc -l)
echo "🔍 AI 관련 프로세스: $AI_PROCESSES개"

if [ $AI_PROCESSES -gt 50 ]; then
    echo "⚠️  프로세스 수가 많습니다. 일부 정리를 권장합니다."
fi

# 7. 디스크 공간 확인
echo "💾 디스크 사용량:"
df -h | grep -E "(/$|/mnt/d)"

# 8. 성능 지표 출력
echo "✅ 최적화 완료 - $(date)"
echo "📈 메모리 여유도: $(free | grep Mem | awk '{printf "%.1f%%", ($7/$2)*100}')"

echo "🎯 추천 next 명령어:"
echo "  npm run dev:stable  # 안정화된 개발 서버"
echo "  npm run test:ai     # AI 개발 테스트"
echo "  ./scripts/wsl-optimization.sh  # 이 스크립트 재실행"