#!/bin/bash
# AI 컨텍스트 자동 업데이트 스크립트

echo "🤖 AI 컨텍스트 업데이트 시작..."

# 프로젝트 구조 업데이트
echo "📁 프로젝트 구조 생성 중..."
tree -L 3 -I 'node_modules|.next|dist|logs|reports' > project-structure.txt

# 패키지 정보 업데이트
echo "📦 패키지 정보 업데이트 중..."
npm list --depth=0 > ai-context/dependencies.txt 2>/dev/null || true

# TypeScript 내보내기 목록 생성
echo "🔤 TypeScript 내보내기 목록 생성 중..."
grep -r "export " src/ --include="*.ts" --include="*.tsx" | head -100 > ai-context/exports.txt

# 중요 파일 크기 체크
echo "📏 파일 크기 체크 중..."
find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | sort -nr | head -20 > ai-context/large-files.txt

# AI 컨텍스트 메타데이터 업데이트
echo "📋 메타데이터 업데이트 중..."
cat > .vscode/ai-metadata.json << EOF
{
  "lastUpdated": "$(date -Iseconds)",
  "version": "$(node -p "require('./package.json').version")",
  "totalFiles": $(find src/ -name "*.ts" -o -name "*.tsx" | wc -l),
  "totalLines": $(find src/ -name "*.ts" -o -name "*.tsx" | xargs wc -l | tail -1 | awk '{print $1}'),
  "architecturePattern": "modular-8-component",
  "aiEngines": ["claude-code", "copilot", "gemini", "qwen"],
  "status": "production-ready"
}
EOF

echo "✅ AI 컨텍스트 업데이트 완료!"
echo "📍 주요 파일들:"
echo "   - AI-CONTEXT.md (메인 컨텍스트)"
echo "   - .vscode/ai-context.json (구조화된 설정)"
echo "   - project-structure.txt (최신 구조)"
