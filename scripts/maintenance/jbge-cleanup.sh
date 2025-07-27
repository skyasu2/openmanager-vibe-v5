#!/bin/bash
# JBGE 공격적 문서 정리 스크립트
# "Just Barely Good Enough" - 핵심 문서만 남기고 모두 정리

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
MAX_CORE_DOCS=6
DOCS_DIR="docs"
ARCHIVE_BASE="docs/archive"
REPORTS_DIR="docs/reports"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 옵션 파싱
AGGRESSIVE=false
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --aggressive)
            AGGRESSIVE=true
            shift
            ;;
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --max)
            MAX_CORE_DOCS=$2
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

echo -e "${RED}🚨 JBGE 공격적 문서 정리${NC}"
echo "=========================="
echo "모드: $([ "$AGGRESSIVE" = true ] && echo "공격적" || echo "표준")"
echo "최대 핵심 문서: ${MAX_CORE_DOCS}개"
echo "테스트 모드: $([ "$DRY_RUN" = true ] && echo "예" || echo "아니오")"
echo ""

if [ "$DRY_RUN" = false ] && [ "$AGGRESSIVE" = true ]; then
    echo -e "${YELLOW}⚠️  경고: 공격적 모드는 대부분의 문서를 아카이브합니다!${NC}"
    echo -n "계속하시겠습니까? (y/N): "
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "작업 취소됨."
        exit 0
    fi
fi

# 핵심 문서 정의
declare -a essential_docs=(
    "README.md"
    "CHANGELOG.md"
    "CLAUDE.md"
    "docs/project-overview.md"
    "docs/api-reference.md"
    "docs/setup-guide.md"
    "docs/troubleshooting.md"
    "docs/architecture.md"
)

# 1. 문서 평가 및 점수화
echo -e "\n${YELLOW}1️⃣ 문서 평가 중...${NC}"
echo "-------------------"

declare -A doc_scores
declare -A doc_info

# 모든 문서 평가
while IFS= read -r file; do
    if [ -f "$file" ]; then
        score=0
        
        # 최근 수정일 점수 (최대 30점)
        last_modified=$(stat -c %Y "$file" 2>/dev/null || stat -f %m "$file" 2>/dev/null)
        current_time=$(date +%s)
        days_old=$(( (current_time - last_modified) / 86400 ))
        
        if [ $days_old -le 7 ]; then
            ((score += 30))
        elif [ $days_old -le 14 ]; then
            ((score += 20))
        elif [ $days_old -le 30 ]; then
            ((score += 10))
        fi
        
        # 파일 크기 점수 (최대 20점) - 적당한 크기 선호
        size=$(stat -c %s "$file" 2>/dev/null || stat -f %z "$file" 2>/dev/null)
        if [ $size -ge 1000 ] && [ $size -le 10000 ]; then
            ((score += 20))
        elif [ $size -ge 500 ] && [ $size -le 20000 ]; then
            ((score += 10))
        fi
        
        # 참조 횟수 점수 (최대 30점) - 다른 문서에서 참조되는 횟수
        ref_count=$(grep -r "$(basename $file)" "$DOCS_DIR" 2>/dev/null | grep -v "$file:" | wc -l)
        ((score += ref_count * 5))
        [ $score -gt 30 ] && score=$((score > 50 ? 50 : score))
        
        # 핵심 문서 보너스 (20점)
        for essential in "${essential_docs[@]}"; do
            if [[ "$file" == "$essential" ]]; then
                ((score += 20))
                break
            fi
        done
        
        doc_scores["$file"]=$score
        doc_info["$file"]="${days_old}일 전, ${size}바이트, 참조 ${ref_count}회"
    fi
done < <(find . -name "*.md" -type f | grep -v "/archive/" | grep -v "/reports/" | grep -v "node_modules")

# 점수 기준 정렬
mapfile -t sorted_docs < <(
    for doc in "${!doc_scores[@]}"; do
        echo "${doc_scores[$doc]}:$doc"
    done | sort -rn | cut -d: -f2-
)

# 2. 핵심 문서 선별
echo -e "\n${YELLOW}2️⃣ 핵심 문서 선별${NC}"
echo "----------------"

keep_count=0
archive_list=()

for i in "${!sorted_docs[@]}"; do
    doc="${sorted_docs[$i]}"
    score="${doc_scores[$doc]}"
    info="${doc_info[$doc]}"
    
    if [ $keep_count -lt $MAX_CORE_DOCS ] || [ $score -ge 70 ]; then
        echo -e "${GREEN}[유지]${NC} $doc (점수: $score) - $info"
        ((keep_count++))
    else
        echo -e "${YELLOW}[아카이브 예정]${NC} $doc (점수: $score) - $info"
        archive_list+=("$doc")
    fi
done

# 3. 아카이브 실행
if [ ${#archive_list[@]} -gt 0 ]; then
    echo -e "\n${YELLOW}3️⃣ 아카이브 실행${NC}"
    echo "---------------"
    
    ARCHIVE_DIR="$ARCHIVE_BASE/jbge-cleanup-$TIMESTAMP"
    
    if [ "$DRY_RUN" = false ]; then
        mkdir -p "$ARCHIVE_DIR"
        
        for doc in "${archive_list[@]}"; do
            rel_dir=$(dirname "$doc")
            mkdir -p "$ARCHIVE_DIR/$rel_dir"
            mv "$doc" "$ARCHIVE_DIR/$doc"
            echo -e "  ${YELLOW}[이동]${NC} $doc → $ARCHIVE_DIR/"
        done
    else
        echo -e "${BLUE}[테스트 모드] 실제로 이동되지 않음${NC}"
        for doc in "${archive_list[@]}"; do
            echo -e "  ${YELLOW}[이동 예정]${NC} $doc"
        done
    fi
fi

# 4. 리포트 정리
echo -e "\n${YELLOW}4️⃣ 리포트 정리${NC}"
echo "-------------"

if [ "$AGGRESSIVE" = true ]; then
    # 공격적 모드: 7일 이상 모든 리포트 삭제
    if [ "$DRY_RUN" = false ]; then
        deleted=$(find "$REPORTS_DIR" -name "*.md" -type f -mtime +7 -delete -print 2>/dev/null | wc -l)
    else
        deleted=$(find "$REPORTS_DIR" -name "*.md" -type f -mtime +7 2>/dev/null | wc -l)
    fi
    echo -e "7일 이상 리포트 삭제: ${deleted}개"
else
    # 표준 모드: 30일 이상만 삭제
    if [ "$DRY_RUN" = false ]; then
        deleted=$(find "$REPORTS_DIR" -name "*.md" -type f -mtime +30 -delete -print 2>/dev/null | wc -l)
    else
        deleted=$(find "$REPORTS_DIR" -name "*.md" -type f -mtime +30 2>/dev/null | wc -l)
    fi
    echo -e "30일 이상 리포트 삭제: ${deleted}개"
fi

# 5. 빈 디렉토리 정리
echo -e "\n${YELLOW}5️⃣ 빈 디렉토리 정리${NC}"
echo "------------------"

if [ "$DRY_RUN" = false ]; then
    empty_dirs=$(find "$DOCS_DIR" -type d -empty -delete -print 2>/dev/null | wc -l)
else
    empty_dirs=$(find "$DOCS_DIR" -type d -empty 2>/dev/null | wc -l)
fi
echo -e "빈 디렉토리 제거: ${empty_dirs}개"

# 6. 최종 보고서
echo -e "\n${BLUE}📊 JBGE 정리 완료 요약${NC}"
echo "====================="
echo -e "유지된 문서: ${GREEN}${keep_count}개${NC}"
echo -e "아카이브된 문서: ${YELLOW}${#archive_list[@]}개${NC}"
echo -e "삭제된 리포트: ${deleted}개"
echo -e "제거된 빈 디렉토리: ${empty_dirs}개"

# 남은 문서 목록
echo -e "\n${GREEN}✅ 남은 핵심 문서:${NC}"
remaining_count=0
while IFS= read -r file; do
    if [ -f "$file" ]; then
        echo "  - $file"
        ((remaining_count++))
    fi
done < <(find . -name "*.md" -type f | grep -v "/archive/" | grep -v "/reports/" | grep -v "node_modules" | sort)

echo -e "\n최종 문서 수: ${remaining_count}개"

if [ $remaining_count -gt $MAX_CORE_DOCS ]; then
    echo -e "${YELLOW}⚠️  경고: 여전히 권장 개수(${MAX_CORE_DOCS})를 초과합니다!${NC}"
fi

echo -e "\n${GREEN}✅ JBGE 공격적 정리 완료!${NC}"
echo -e "${BLUE}\"딱 필요한 만큼만 문서화\" - Just Barely Good Enough${NC}"