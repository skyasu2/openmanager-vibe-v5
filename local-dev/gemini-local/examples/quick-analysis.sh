#!/bin/bash

# Gemini CLI 빠른 분석 스크립트
# 사용법: bash development/gemini-local/examples/quick-analysis.sh [타입]

TYPE=${1:-"help"}

case $TYPE in
  "auth")
    echo "🔐 인증 로직 분석 중..."
    find src -name "*.tsx" -o -name "*.ts" | grep -E "(auth|login)" | head -5 | while read file; do
      echo "📄 $file"
      cat "$file" | gemini -p "인증 관련 코드 요약 (1줄)"
    done
    ;;
    
  "performance")
    echo "⚡ 성능 최적화 분석 중..."
    echo "현재 번들 크기와 메모리 사용 패턴" | gemini -p "Vercel 무료 티어 최적화 팁 3가지"
    ;;
    
  "error")
    echo "🐛 최근 에러 분석 중..."
    if [ -f "typescript-errors.log" ]; then
      tail -50 typescript-errors.log | gemini -p "주요 에러 패턴과 해결 방법"
    else
      echo "에러 로그 파일이 없습니다."
    fi
    ;;
    
  "structure")
    echo "📁 프로젝트 구조 분석 중..."
    find src -type d -maxdepth 2 | sort | gemini -p "Next.js 프로젝트 구조 평가"
    ;;
    
  "help"|*)
    echo "📚 Gemini CLI 빠른 분석 도구"
    echo ""
    echo "사용법: bash development/gemini-local/examples/quick-analysis.sh [타입]"
    echo ""
    echo "타입:"
    echo "  auth        - 인증 관련 파일 분석"
    echo "  performance - 성능 최적화 분석"
    echo "  error       - 에러 로그 분석"
    echo "  structure   - 프로젝트 구조 분석"
    echo "  help        - 이 도움말 표시"
    echo ""
    echo "예시:"
    echo "  bash development/gemini-local/examples/quick-analysis.sh auth"
    ;;
esac

echo ""
echo "💡 Tip: 사용량 확인 → gemini /stats"