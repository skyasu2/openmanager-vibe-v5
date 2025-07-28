#!/bin/bash

# 문서 재구성 자동화 스크립트
# 2025-01-28
# 이 스크립트는 OpenManager Vibe v5의 문서를 체계적으로 재구성합니다.

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
DOCS_DIR="$PROJECT_ROOT/docs"
BACKUP_DIR="$PROJECT_ROOT/docs-backup-$(date +%Y%m%d-%H%M%S)"

# 로그 함수
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# 백업 생성
create_backup() {
    log "Creating backup of current docs directory..."
    if [ -d "$DOCS_DIR" ]; then
        cp -r "$DOCS_DIR" "$BACKUP_DIR"
        log "Backup created at: $BACKUP_DIR"
    else
        error "Docs directory not found!"
        exit 1
    fi
}

# 새 디렉토리 구조 생성
create_new_structure() {
    log "Creating new directory structure..."
    
    # 새 디렉토리 생성
    mkdir -p "$DOCS_DIR/getting-started"
    mkdir -p "$DOCS_DIR/guides/development"
    mkdir -p "$DOCS_DIR/guides/ai"
    mkdir -p "$DOCS_DIR/guides/mcp"
    mkdir -p "$DOCS_DIR/guides/authentication"
    mkdir -p "$DOCS_DIR/guides/deployment"
    mkdir -p "$DOCS_DIR/api"
    mkdir -p "$DOCS_DIR/reference"
    mkdir -p "$DOCS_DIR/troubleshooting"
    mkdir -p "$DOCS_DIR/archive/2025-01"
    mkdir -p "$DOCS_DIR/archive/legacy"
    
    log "Directory structure created successfully"
}

# MCP 문서 통합
consolidate_mcp_docs() {
    log "Consolidating MCP documentation..."
    
    # MCP 설정 문서 통합
    cat > "$DOCS_DIR/guides/mcp/setup.md" << 'EOF'
# MCP (Model Control Protocol) 설정 가이드

*최종 업데이트: 2025-01-28*

이 문서는 다음 문서들을 통합한 것입니다:
- claude-code-mcp-setup-2025.md
- mcp-quick-guide.md
- mcp-optimization-guide-2025.md
- sentry-mcp-setup-guide.md
- vercel-mcp-setup-guide.md

## 목차

1. [MCP 소개](#mcp-소개)
2. [설치 및 설정](#설치-및-설정)
3. [서버 구성](#서버-구성)
4. [환경별 설정](#환경별-설정)
5. [문제 해결](#문제-해결)

EOF

    # 기존 MCP 설정 문서들 내용 추가
    for file in "$DOCS_DIR"/mcp-*setup*.md "$DOCS_DIR"/mcp-*guide*.md; do
        if [ -f "$file" ]; then
            echo -e "\n---\n" >> "$DOCS_DIR/guides/mcp/setup.md"
            echo "## From $(basename "$file")" >> "$DOCS_DIR/guides/mcp/setup.md"
            echo "" >> "$DOCS_DIR/guides/mcp/setup.md"
            cat "$file" >> "$DOCS_DIR/guides/mcp/setup.md"
            mv "$file" "$DOCS_DIR/archive/2025-01/"
        fi
    done
    
    # MCP 서버 상태 문서 통합
    cat > "$DOCS_DIR/guides/mcp/servers.md" << 'EOF'
# MCP 서버 상태 및 관리

*최종 업데이트: 2025-01-28*

이 문서는 다음 문서들을 통합한 것입니다:
- mcp-server-status*.md 시리즈
- mcp-status-check*.md 시리즈

## 현재 서버 상태

### 로컬 개발용 MCP 서버 (9개)
✅ 모두 정상 작동 중

1. **filesystem** - 파일 시스템 접근
2. **github** - GitHub 통합
3. **memory** - 지식 관리
4. **supabase** - 데이터베이스 작업
5. **context7** - 문서 검색
6. **tavily-mcp** - 웹 검색
7. **sequential-thinking** - 복잡한 추론
8. **playwright** - 브라우저 자동화
9. **serena** - 코드 분석

EOF

    # 기존 서버 상태 문서들 통합
    for file in "$DOCS_DIR"/mcp-server-status*.md "$DOCS_DIR"/mcp-status*.md; do
        if [ -f "$file" ]; then
            echo -e "\n---\n" >> "$DOCS_DIR/guides/mcp/servers.md"
            tail -n +2 "$file" >> "$DOCS_DIR/guides/mcp/servers.md"
            mv "$file" "$DOCS_DIR/archive/2025-01/"
        fi
    done
    
    log "MCP documentation consolidated"
}

# AI 문서 통합
consolidate_ai_docs() {
    log "Consolidating AI documentation..."
    
    # AI 아키텍처 문서 생성
    cat > "$DOCS_DIR/guides/ai/architecture.md" << 'EOF'
# AI 시스템 아키텍처

*최종 업데이트: 2025-01-28*

이 문서는 다음 문서들을 통합한 것입니다:
- ai-complete-guide.md
- ai-system-unified-guide.md
- ML-ENHANCEMENT-SUMMARY.md

## UnifiedAIEngineRouter

모든 AI 서비스를 중앙에서 관리하는 라우터 시스템입니다.

### 지원 엔진
1. Google AI (Gemini)
2. Supabase RAG
3. Korean NLP
4. MCP Context

EOF

    # 기존 AI 문서들 통합
    for file in "$DOCS_DIR"/ai-*.md "$DOCS_DIR"/ML-*.md; do
        if [ -f "$file" ]; then
            echo -e "\n---\n" >> "$DOCS_DIR/guides/ai/architecture.md"
            tail -n +2 "$file" >> "$DOCS_DIR/guides/ai/architecture.md"
            mv "$file" "$DOCS_DIR/archive/2025-01/"
        fi
    done
    
    log "AI documentation consolidated"
}

# 인증 문서 통합
consolidate_auth_docs() {
    log "Consolidating authentication documentation..."
    
    # OAuth 통합 가이드 생성
    cat > "$DOCS_DIR/guides/authentication/oauth-setup.md" << 'EOF'
# OAuth 통합 설정 가이드

*최종 업데이트: 2025-01-28*

이 문서는 다음 문서들을 통합한 것입니다:
- auth-*.md 시리즈
- oauth-*.md 시리즈
- github-oauth-*.md 시리즈

## 개요

OpenManager Vibe v5는 다음 OAuth 제공자를 지원합니다:
- GitHub OAuth
- Supabase Auth

EOF

    # 기존 인증 문서들 통합
    for file in "$DOCS_DIR"/auth-*.md "$DOCS_DIR"/oauth-*.md "$DOCS_DIR"/github-oauth-*.md; do
        if [ -f "$file" ]; then
            echo -e "\n---\n" >> "$DOCS_DIR/guides/authentication/oauth-setup.md"
            tail -n +2 "$file" >> "$DOCS_DIR/guides/authentication/oauth-setup.md"
            mv "$file" "$DOCS_DIR/archive/2025-01/"
        fi
    done
    
    log "Authentication documentation consolidated"
}

# README 인덱스 생성
create_main_readme() {
    log "Creating main documentation index..."
    
    cat > "$DOCS_DIR/README.md" << 'EOF'
# OpenManager Vibe v5 문서

*최종 업데이트: 2025-01-28*

## 빠른 시작

- [설치 가이드](./getting-started/installation.md)
- [기본 설정](./getting-started/configuration.md)
- [첫 단계](./getting-started/first-steps.md)

## 주요 가이드

### 개발
- [개발 환경 설정](./guides/development/setup.md)
- [코딩 표준](./guides/development/coding-standards.md)
- [테스트 가이드](./guides/development/testing.md)

### AI 시스템
- [AI 아키텍처](./guides/ai/architecture.md)
- [AI 엔진 가이드](./guides/ai/engines.md)
- [RAG 시스템](./guides/ai/rag-system.md)

### MCP (Model Control Protocol)
- [MCP 설정](./guides/mcp/setup.md)
- [서버 관리](./guides/mcp/servers.md)
- [문제 해결](./guides/mcp/troubleshooting.md)

### 인증
- [OAuth 설정](./guides/authentication/oauth-setup.md)
- [Supabase 인증](./guides/authentication/supabase-auth.md)

### 배포
- [Vercel 배포](./guides/deployment/vercel.md)
- [프로덕션 가이드](./guides/deployment/production.md)

## API 문서

- [REST API](./api/rest-api.md)
- [GraphQL API](./api/graphql.md)

## 참조

- [설정 옵션](./reference/configuration.md)
- [환경 변수](./reference/environment-variables.md)
- [에러 코드](./reference/error-codes.md)
- [용어집](./reference/glossary.md)

## 문제 해결

- [일반적인 문제](./troubleshooting/common-issues.md)
- [에러 참조](./troubleshooting/error-reference.md)
- [FAQ](./troubleshooting/faq.md)

---

## 문서 관리 정책

### 문서 위치
- **루트 디렉토리**: README.md, CHANGELOG.md, CLAUDE.md, GEMINI.md만 허용
- **기타 문서**: 이 docs 폴더 내 적절한 카테고리에 배치

### 업데이트 주기
- 주요 기능 변경 시 즉시 업데이트
- 월 1회 정기 검토
- 30일 이상 미사용 문서는 archive로 이동

### 기여 가이드
문서 개선에 기여하려면 [기여 가이드](../CONTRIBUTING.md)를 참조하세요.
EOF
    
    log "Main README created"
}

# 중복 제거 및 정리
remove_duplicates() {
    log "Removing duplicate documentation..."
    
    # 통합된 문서들을 아카이브로 이동
    local count=0
    
    # node_modules 내 README 파일 카운트 (삭제하지 않음)
    local node_modules_count=$(find "$PROJECT_ROOT" -path "*/node_modules/*" -name "README.md" | wc -l)
    warning "Found $node_modules_count README files in node_modules (will not be touched)"
    
    # 프로젝트 내 불필요한 README 정리 (node_modules 제외)
    while IFS= read -r file; do
        # 보존해야 할 README 파일들
        if [[ "$file" == "$PROJECT_ROOT/README.md" ]] || 
           [[ "$file" == "$PROJECT_ROOT/CLAUDE.md" ]] || 
           [[ "$file" == "$PROJECT_ROOT/GEMINI.md" ]] || 
           [[ "$file" == "$DOCS_DIR/README.md" ]] ||
           [[ "$file" == *"/node_modules/"* ]]; then
            continue
        fi
        
        # 나머지 README는 아카이브로 이동
        local rel_path="${file#$PROJECT_ROOT/}"
        local archive_path="$DOCS_DIR/archive/legacy/$rel_path"
        mkdir -p "$(dirname "$archive_path")"
        mv "$file" "$archive_path"
        ((count++))
        
        if [ $count -lt 10 ]; then
            info "Archived: $rel_path"
        fi
    done < <(find "$PROJECT_ROOT" -name "README.md" -type f)
    
    log "Archived $count duplicate README files (excluding node_modules)"
}

# 링크 검증 스크립트 생성
create_link_validator() {
    log "Creating link validation script..."
    
    cat > "$PROJECT_ROOT/scripts/docs/validate-links.sh" << 'EOF'
#!/bin/bash

# 문서 내 링크 검증 스크립트

DOCS_DIR="/mnt/d/cursor/openmanager-vibe-v5/docs"
BROKEN_LINKS=0

echo "Validating documentation links..."

# Markdown 파일에서 링크 추출 및 검증
find "$DOCS_DIR" -name "*.md" -type f | while read -r file; do
    grep -Eo '\[([^]]+)\]\(([^)]+)\)' "$file" | while read -r link; do
        url=$(echo "$link" | sed -E 's/\[([^]]+)\]\(([^)]+)\)/\2/')
        
        # 상대 경로 링크만 검증
        if [[ "$url" =~ ^\.\.?/ ]]; then
            target="$DOCS_DIR/$url"
            if [ ! -f "$target" ]; then
                echo "Broken link in $file: $url"
                ((BROKEN_LINKS++))
            fi
        fi
    done
done

echo "Found $BROKEN_LINKS broken links"
exit $BROKEN_LINKS
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/docs/validate-links.sh"
    log "Link validator created"
}

# 인덱스 생성 스크립트
create_index_generator() {
    log "Creating index generation script..."
    
    cat > "$PROJECT_ROOT/scripts/docs/generate-index.sh" << 'EOF'
#!/bin/bash

# 문서 인덱스 자동 생성 스크립트

DOCS_DIR="/mnt/d/cursor/openmanager-vibe-v5/docs"

echo "Generating documentation index..."

# 각 디렉토리에 README.md 생성
find "$DOCS_DIR" -type d -mindepth 1 | while read -r dir; do
    if [ ! -f "$dir/README.md" ]; then
        echo "# $(basename "$dir")" > "$dir/README.md"
        echo "" >> "$dir/README.md"
        echo "## 문서 목록" >> "$dir/README.md"
        echo "" >> "$dir/README.md"
        
        # 해당 디렉토리의 모든 .md 파일 나열
        find "$dir" -maxdepth 1 -name "*.md" -type f | while read -r file; do
            if [ "$(basename "$file")" != "README.md" ]; then
                echo "- [$(basename "$file" .md)](./$(basename "$file"))" >> "$dir/README.md"
            fi
        done
    fi
done

echo "Index generation completed"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/docs/generate-index.sh"
    log "Index generator created"
}

# 통계 출력
print_statistics() {
    log "Documentation reorganization statistics:"
    
    echo ""
    echo "=== Before ==="
    echo "Total markdown files: $(find "$BACKUP_DIR" -name "*.md" -type f | wc -l)"
    echo "MCP documents: $(find "$BACKUP_DIR" -name "*mcp*.md" -type f | wc -l)"
    echo "AI documents: $(find "$BACKUP_DIR" -name "*ai*.md" -type f | wc -l)"
    echo "Auth documents: $(find "$BACKUP_DIR" -name "*auth*.md" -o -name "*oauth*.md" | wc -l)"
    
    echo ""
    echo "=== After ==="
    echo "Total markdown files: $(find "$DOCS_DIR" -name "*.md" -type f | wc -l)"
    echo "Organized structure: $(find "$DOCS_DIR" -type d | wc -l) directories"
    echo "Archived files: $(find "$DOCS_DIR/archive" -name "*.md" -type f | wc -l)"
}

# 메인 실행 함수
main() {
    echo "=================================="
    echo "Documentation Reorganization Tool"
    echo "=================================="
    echo ""
    
    # 확인 프롬프트
    read -p "This will reorganize all documentation. Continue? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Operation cancelled."
        exit 0
    fi
    
    # 실행 단계
    create_backup
    create_new_structure
    consolidate_mcp_docs
    consolidate_ai_docs
    consolidate_auth_docs
    create_main_readme
    remove_duplicates
    create_link_validator
    create_index_generator
    
    # 인덱스 생성
    "$PROJECT_ROOT/scripts/docs/generate-index.sh"
    
    # 통계 출력
    print_statistics
    
    log "Documentation reorganization completed!"
    log "Backup saved at: $BACKUP_DIR"
    echo ""
    echo "Next steps:"
    echo "1. Review the new structure in $DOCS_DIR"
    echo "2. Run link validation: ./scripts/docs/validate-links.sh"
    echo "3. Update any external references to moved documents"
    echo "4. Commit changes with: git add -A && git commit -m '📚 docs: 문서 구조 재구성 및 중복 제거'"
}

# 스크립트 실행
main "$@"