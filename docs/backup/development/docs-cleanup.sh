#!/bin/bash

# 📚 OpenManager Vibe v5 문서 정리 스크립트
# 목표: 중복 제거, 버전 통일, 구조 최적화

set -e  # 에러 발생시 즉시 종료

echo "🚀 OpenManager Vibe v5.35.0 문서 정리 시작..."
echo "=============================================="

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# Phase 1: 백업 생성
echo ""
echo "📦 Phase 1: 백업 생성 중..."
mkdir -p docs/archive/removed_documents

# 백업할 파일들 확인 및 백업
if [ -f "docs/ENVIRONMENT_SETUP.md" ]; then
    cp docs/ENVIRONMENT_SETUP.md docs/archive/removed_documents/
    echo "   ✅ docs/ENVIRONMENT_SETUP.md 백업 완료"
fi

if [ -f "docs/ENVIRONMENT_SETUP_GUIDE.md" ]; then
    cp docs/ENVIRONMENT_SETUP_GUIDE.md docs/archive/removed_documents/
    echo "   ✅ docs/ENVIRONMENT_SETUP_GUIDE.md 백업 완료"
fi

if [ -f "docs/AI-ENGINE-ARCHITECTURE.md" ]; then
    cp docs/AI-ENGINE-ARCHITECTURE.md docs/archive/removed_documents/
    echo "   ✅ docs/AI-ENGINE-ARCHITECTURE.md 백업 완료"
fi

if [ -f "docs/AI_ARCHITECTURE_OPTIMIZATION.md" ]; then
    cp docs/AI_ARCHITECTURE_OPTIMIZATION.md docs/archive/removed_documents/
    echo "   ✅ docs/AI_ARCHITECTURE_OPTIMIZATION.md 백업 완료"
fi

# Phase 2: AI 문서 통합
echo ""
echo "🤖 Phase 2: AI 문서 통합 중..."

# AI 통합 가이드 헤더 생성
cat > docs/AI_ENGINE_COMPLETE_GUIDE.md << 'EOF'
# 🤖 AI 엔진 완전 가이드

> **OpenManager Vibe v5.35.0 AI 엔진 통합 문서**  
> **Enhanced AI Engine v2.0 + MCP Protocol + TensorFlow.js**

---

## 📋 목차

1. [🏗️ AI 엔진 아키텍처](#-ai-엔진-아키텍처)
2. [⚡ 성능 최적화](#-성능-최적화)
3. [🔧 구현 세부사항](#-구현-세부사항)
4. [📊 모니터링 및 메트릭](#-모니터링-및-메트릭)
5. [🚀 배포 및 운영](#-배포-및-운영)

---

EOF

# AI 관련 파일들 통합
if [ -f "docs/AI-ENGINE-ARCHITECTURE.md" ] && [ -f "docs/AI_ARCHITECTURE_OPTIMIZATION.md" ]; then
    echo "## 🏗️ AI 엔진 아키텍처" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    tail -n +2 docs/AI-ENGINE-ARCHITECTURE.md >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "---" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "## ⚡ 성능 최적화" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "" >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    tail -n +2 docs/AI_ARCHITECTURE_OPTIMIZATION.md >> docs/AI_ENGINE_COMPLETE_GUIDE.md
    echo "   ✅ AI 문서 통합 완료: docs/AI_ENGINE_COMPLETE_GUIDE.md"
fi

# Phase 3: 중복 문서 제거
echo ""
echo "🗑️ Phase 3: 중복 문서 제거 중..."

files_to_remove=(
    "docs/ENVIRONMENT_SETUP.md"
    "docs/ENVIRONMENT_SETUP_GUIDE.md"
    "docs/AI-ENGINE-ARCHITECTURE.md"
    "docs/AI_ARCHITECTURE_OPTIMIZATION.md"
)

for file in "${files_to_remove[@]}"; do
    if [ -f "$file" ]; then
        rm "$file"
        echo "   ✅ $file 제거 완료"
    fi
done

# Phase 4: 버전 정보 업데이트
echo ""
echo "📝 Phase 4: 버전 정보 업데이트 중..."

# README.md 버전 업데이트
if [ -f "README.md" ]; then
    # macOS와 Linux 호환성을 위한 sed 사용
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' 's/v5\.34\.0/v5.35.0/g' README.md
    else
        # Linux
        sed -i 's/v5\.34\.0/v5.35.0/g' README.md
    fi
    echo "   ✅ README.md 버전 정보 v5.35.0으로 업데이트"
fi

# Phase 5: 문서 업데이트 날짜 반영
echo ""
echo "📅 Phase 5: 문서 업데이트 날짜 반영 중..."

current_date=$(date +"%Y-%m-%d")

# PROJECT_STATUS.md 마지막 업데이트 날짜 수정
if [ -f "PROJECT_STATUS.md" ]; then
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/\*\*마지막 업데이트\*\*: [0-9-]*/\*\*마지막 업데이트\*\*: $current_date/" PROJECT_STATUS.md
    else
        sed -i "s/\*\*마지막 업데이트\*\*: [0-9-]*/\*\*마지막 업데이트\*\*: $current_date/" PROJECT_STATUS.md
    fi
    echo "   ✅ PROJECT_STATUS.md 업데이트 날짜 수정"
fi

# Phase 6: 최종 검증
echo ""
echo "🔍 Phase 6: 정리 결과 검증 중..."

echo ""
echo "📊 정리 완료 결과:"
echo "=============================================="

# 백업 파일 확인
backup_count=$(ls -1 docs/archive/removed_documents/ 2>/dev/null | wc -l)
echo "📦 백업된 파일: $backup_count 개"

# 현재 docs 폴더 파일 수
docs_count=$(ls -1 docs/*.md 2>/dev/null | wc -l)
echo "📚 docs 폴더 문서: $docs_count 개"

# README.md 파일 크기
if [ -f "README.md" ]; then
    readme_size=$(du -h README.md | cut -f1)
    echo "📖 README.md 크기: $readme_size"
fi

echo ""
echo "✅ 문서 정리 완료!"
echo "=============================================="
echo "🎯 주요 개선사항:"
echo "   - 중복 문서 4개 제거 및 백업"
echo "   - AI 문서 1개로 통합"
echo "   - 버전 정보 v5.35.0으로 통일"
echo "   - 백업 위치: docs/archive/removed_documents/"
echo ""
echo "📋 다음 단계 권장사항:"
echo "   1. git add . && git commit -m \"docs: 문서 구조 최적화 및 중복 제거\""
echo "   2. docs/AI_ENGINE_COMPLETE_GUIDE.md 내용 검토"
echo "   3. README.md 슬림화 고려 (현재 크기 확인 필요)"
echo ""
echo "🔗 상세 계획: docs/DOCUMENT_CLEANUP_PLAN.md 참조" 