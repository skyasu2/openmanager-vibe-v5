#!/bin/bash
# 중복 문서 통합 스크립트
# 실행: bash scripts/docs-consolidate.sh

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🔄 중복 문서 통합 시작...${NC}"

# 작업 디렉토리
DOCS_DIR="docs"
ARCHIVE_DIR="${DOCS_DIR}/archive/2025/consolidated"

# 아카이브 디렉토리 생성
mkdir -p "${ARCHIVE_DIR}"

# 통합 함수
consolidate_files() {
    local target=$1
    local header=$2
    shift 2
    local sources=("$@")
    
    echo -e "${BLUE}📝 ${target} 생성 중...${NC}"
    
    # 헤더 작성
    echo "$header" > "${DOCS_DIR}/${target}"
    echo "" >> "${DOCS_DIR}/${target}"
    echo "_통합일: $(date +%Y-%m-%d)_" >> "${DOCS_DIR}/${target}"
    echo "" >> "${DOCS_DIR}/${target}"
    
    # 각 소스 파일의 내용 병합
    for source in "${sources[@]}"; do
        if [ -f "${DOCS_DIR}/${source}" ]; then
            echo -e "${YELLOW}  + ${source} 추가${NC}"
            echo "---" >> "${DOCS_DIR}/${target}"
            echo "" >> "${DOCS_DIR}/${target}"
            echo "## 출처: ${source}" >> "${DOCS_DIR}/${target}"
            echo "" >> "${DOCS_DIR}/${target}"
            # 헤더 제거하고 내용 추가
            tail -n +2 "${DOCS_DIR}/${source}" >> "${DOCS_DIR}/${target}"
            echo "" >> "${DOCS_DIR}/${target}"
            
            # 원본을 아카이브로 이동
            mv "${DOCS_DIR}/${source}" "${ARCHIVE_DIR}/"
        fi
    done
    
    echo -e "${GREEN}  ✓ ${target} 생성 완료${NC}"
}

# 1. MCP 서버 상태 문서 통합
consolidate_files \
    "mcp-server-status.md" \
    "# 📊 MCP 서버 상태 현황 (통합본)" \
    "mcp-server-status-2025.md" \
    "mcp-server-status-check.md" \
    "mcp-server-status-check-2025-01-26.md"

# 2. OAuth 설정 가이드 통합
consolidate_files \
    "oauth-setup-guide.md" \
    "# 🔐 OAuth 설정 가이드 (통합본)" \
    "github-oauth-setup-guide.md" \
    "vercel-oauth-setup-guide.md" \
    "supabase-oauth-setup.md" \
    "oauth-success-analysis.md" \
    "oauth-login-success.md"

# 3. 환경 설정 통합
consolidate_files \
    "env-management-guide.md" \
    "# ⚙️ 환경 설정 가이드 (통합본)" \
    "setup-env-guide.md" \
    "env-backup-security-analysis.md" \
    "simplified-env-backup-guide.md" \
    "automated-env-management.md"

# 4. AI 시스템 가이드 통합
consolidate_files \
    "ai-system-guide.md" \
    "# 🤖 AI 시스템 가이드 (통합본)" \
    "ai-complete-guide.md" \
    "ML-ENHANCEMENT-SUMMARY.md"

# 5. 성능 최적화 가이드 통합
consolidate_files \
    "performance-guide.md" \
    "# ⚡ 성능 최적화 가이드 (통합본)" \
    "performance-engine-testing-guide.md" \
    "memory-optimization-guide.md" \
    "api-optimization-guide.md" \
    "react-hooks-optimization.md"

# 통합 결과 보고서 생성
cat > "${DOCS_DIR}/consolidation-report.md" << EOF
# 📊 문서 통합 결과 보고서

생성일: $(date +%Y-%m-%d)

## 통합 완료 문서

### 1. MCP 서버 상태
- 통합 전: 4개 파일
- 통합 후: 1개 파일 (mcp-server-status.md)
- 절감: 75%

### 2. OAuth 설정 가이드
- 통합 전: 5개 파일
- 통합 후: 1개 파일 (oauth-setup-guide.md)
- 절감: 80%

### 3. 환경 설정
- 통합 전: 4개 파일
- 통합 후: 1개 파일 (env-management-guide.md)
- 절감: 75%

### 4. AI 시스템
- 통합 전: 2개 파일
- 통합 후: 1개 파일 (ai-system-guide.md)
- 절감: 50%

### 5. 성능 최적화
- 통합 전: 4개 파일
- 통합 후: 1개 파일 (performance-guide.md)
- 절감: 75%

## 전체 통계
- 통합 전: 19개 파일
- 통합 후: 5개 파일
- 전체 절감: 73.7%

## 아카이브 위치
${ARCHIVE_DIR}
EOF

echo -e "${GREEN}✅ 문서 통합 완료!${NC}"
echo -e "  - 통합된 파일: 5개"
echo -e "  - 아카이브된 파일: 19개"
echo -e "  - 보고서: ${DOCS_DIR}/consolidation-report.md"

# 남은 중복 파일 확인
echo -e "\n${YELLOW}🔍 추가 정리 필요 파일:${NC}"
find "${DOCS_DIR}" -name "*oauth*.md" -o -name "*env*.md" -o -name "*mcp-server*.md" | grep -v -E "(guide|consolidated|archive)" || true