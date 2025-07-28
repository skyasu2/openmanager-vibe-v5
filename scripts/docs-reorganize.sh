#!/bin/bash
# 문서 재구성 스크립트
# 실행: bash scripts/docs-reorganize.sh

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}📁 문서 재구성 시작...${NC}"

# 기본 디렉토리
DOCS_DIR="docs"

# 새로운 디렉토리 구조 생성
echo -e "${YELLOW}📂 새 디렉토리 구조 생성 중...${NC}"

mkdir -p "${DOCS_DIR}/quick-start"
mkdir -p "${DOCS_DIR}/guides/development"
mkdir -p "${DOCS_DIR}/guides/deployment"
mkdir -p "${DOCS_DIR}/guides/mcp"
mkdir -p "${DOCS_DIR}/guides/ai-systems"
mkdir -p "${DOCS_DIR}/reference/api"
mkdir -p "${DOCS_DIR}/reference/database"
mkdir -p "${DOCS_DIR}/reference/security"
mkdir -p "${DOCS_DIR}/reference/performance"
mkdir -p "${DOCS_DIR}/troubleshooting"
mkdir -p "${DOCS_DIR}/reports/2025/01"

# 파일 이동 함수
move_file() {
    local source=$1
    local dest=$2
    
    if [ -f "${DOCS_DIR}/${source}" ]; then
        echo -e "${BLUE}  → ${source} -> ${dest}${NC}"
        mv "${DOCS_DIR}/${source}" "${DOCS_DIR}/${dest}"
    fi
}

echo -e "${YELLOW}📄 문서 재배치 중...${NC}"

# Quick Start
move_file "setup-env-guide.md" "quick-start/setup.md"
move_file "env-management-guide.md" "quick-start/env-config.md"

# Development Guides
move_file "development-guide.md" "guides/development/coding-standards.md"
move_file "testing-guide.md" "guides/development/testing.md"
move_file "effective-testing-guide.md" "guides/development/testing-best-practices.md"
move_file "development-tools.md" "guides/development/tools.md"
move_file "typescript-configuration-guide.md" "guides/development/typescript.md"

# Deployment Guides
move_file "deployment-complete-guide.md" "guides/deployment/complete-guide.md"
move_file "vercel-mcp-setup-guide.md" "guides/deployment/vercel.md"
move_file "gcp-complete-guide.md" "guides/deployment/gcp.md"
move_file "deployment-safety-checklist.md" "guides/deployment/safety-checklist.md"

# MCP Guides
move_file "claude-code-mcp-setup-2025.md" "guides/mcp/setup.md"
move_file "mcp-optimization-guide-2025.md" "guides/mcp/optimization.md"
move_file "mcp-troubleshooting-guide.md" "guides/mcp/troubleshooting.md"
move_file "mcp-security-audit-report.md" "guides/mcp/security.md"
move_file "mcp-best-practices-guide.md" "guides/mcp/best-practices.md"
move_file "mcp-unified-architecture-guide.md" "guides/mcp/architecture.md"

# AI Systems Guides
move_file "ai-system-guide.md" "guides/ai-systems/architecture.md"
move_file "sub-agents-mcp-mapping-guide.md" "guides/ai-systems/sub-agents.md"
move_file "sub-agent-collaboration-patterns.md" "guides/ai-systems/collaboration-patterns.md"
move_file "performance-guide.md" "guides/ai-systems/optimization.md"

# Reference - API
move_file "api-optimization-guide.md" "reference/api/optimization.md"
move_file "dynamic-template-system-guide.md" "reference/api/templates.md"

# Reference - Database
move_file "database-usage-analysis.md" "reference/database/usage-analysis.md"
move_file "pgvector-migration-guide.md" "reference/database/pgvector.md"
move_file "redis-configuration-guide.md" "reference/database/redis.md"

# Reference - Security
move_file "security-complete-guide.md" "reference/security/complete-guide.md"
move_file "env-security-guide.md" "reference/security/env-security.md"
move_file "security-guidelines.md" "reference/security/guidelines.md"

# Reference - Performance
move_file "performance-optimization-complete-guide.md" "reference/performance/optimization.md"
move_file "system-status-monitoring-guide.md" "reference/performance/monitoring.md"

# Troubleshooting
move_file "oauth-setup-guide.md" "troubleshooting/oauth.md"
move_file "mcp-server-status.md" "troubleshooting/mcp-status.md"
move_file "claude-code-stability-guide.md" "troubleshooting/claude-stability.md"
move_file "wsl-test-workaround.md" "troubleshooting/wsl-issues.md"

# Reports
move_file "comprehensive-work-summary-2025-01-27.md" "reports/2025/01/work-summary-27.md"
move_file "mcp-documentation-status-report-2025-01-28.md" "reports/2025/01/mcp-status-28.md"
move_file "documentation-cleanup-report-2025-01-28.md" "reports/2025/01/cleanup-report-28.md"

# 인덱스 파일 생성
cat > "${DOCS_DIR}/README.md" << 'EOF'
# 📚 OpenManager Vibe v5 문서 인덱스

## 🚀 빠른 시작
- [프로젝트 설정](quick-start/setup.md)
- [환경 설정](quick-start/env-config.md)
- [첫 단계](quick-start/first-steps.md)

## 📖 가이드

### 개발
- [코딩 표준](guides/development/coding-standards.md)
- [테스트](guides/development/testing.md)
- [디버깅](guides/development/tools.md)
- [TypeScript](guides/development/typescript.md)

### 배포
- [완전 가이드](guides/deployment/complete-guide.md)
- [Vercel 배포](guides/deployment/vercel.md)
- [GCP 배포](guides/deployment/gcp.md)
- [안전 체크리스트](guides/deployment/safety-checklist.md)

### MCP (Model Context Protocol)
- [설정](guides/mcp/setup.md)
- [최적화](guides/mcp/optimization.md)
- [문제 해결](guides/mcp/troubleshooting.md)
- [보안](guides/mcp/security.md)
- [모범 사례](guides/mcp/best-practices.md)
- [아키텍처](guides/mcp/architecture.md)

### AI 시스템
- [아키텍처](guides/ai-systems/architecture.md)
- [서브 에이전트](guides/ai-systems/sub-agents.md)
- [협업 패턴](guides/ai-systems/collaboration-patterns.md)
- [최적화](guides/ai-systems/optimization.md)

## 📚 참조

### API
- [최적화](reference/api/optimization.md)
- [템플릿 시스템](reference/api/templates.md)

### 데이터베이스
- [사용량 분석](reference/database/usage-analysis.md)
- [pgvector](reference/database/pgvector.md)
- [Redis](reference/database/redis.md)

### 보안
- [완전 가이드](reference/security/complete-guide.md)
- [환경 보안](reference/security/env-security.md)
- [가이드라인](reference/security/guidelines.md)

### 성능
- [최적화](reference/performance/optimization.md)
- [모니터링](reference/performance/monitoring.md)

## 🔧 문제 해결
- [OAuth 문제](troubleshooting/oauth.md)
- [MCP 상태](troubleshooting/mcp-status.md)
- [Claude 안정성](troubleshooting/claude-stability.md)
- [WSL 문제](troubleshooting/wsl-issues.md)

## 📊 보고서
- [최신 보고서](reports/2025/01/)

## 🗄️ 아카이브
- [이전 문서](archive/)

---

_마지막 업데이트: $(date +%Y-%m-%d)_
EOF

# 남은 파일 정리
echo -e "\n${YELLOW}🗂️  아카이브로 이동할 파일 확인 중...${NC}"

# 30일 이상 된 파일이나 특정 패턴의 파일을 아카이브로 이동
for file in "${DOCS_DIR}"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        # README.md와 방금 생성한 파일들은 제외
        if [[ ! "$filename" =~ ^(README|consolidation-report)\.md$ ]]; then
            echo -e "${BLUE}  → ${filename} -> archive/${NC}"
            mv "$file" "${DOCS_DIR}/archive/"
        fi
    fi
done

# 결과 요약
echo -e "\n${GREEN}✅ 문서 재구성 완료!${NC}"
echo -e "  - 새 구조로 이동된 파일: $(find "${DOCS_DIR}/guides" "${DOCS_DIR}/reference" "${DOCS_DIR}/troubleshooting" -name "*.md" | wc -l)개"
echo -e "  - 아카이브된 파일: $(find "${DOCS_DIR}/archive" -name "*.md" | wc -l)개"

# 디렉토리 트리 표시
echo -e "\n${YELLOW}📁 새로운 문서 구조:${NC}"
tree "${DOCS_DIR}" -d -L 3 2>/dev/null || find "${DOCS_DIR}" -type d | sort | sed 's|[^/]*/|- |g'