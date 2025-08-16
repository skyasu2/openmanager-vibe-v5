#!/bin/bash

# 🤖 서브에이전트 종합 테스트 스크립트
# Claude Code 서브에이전트들의 상태와 동작을 검증합니다

set -e

echo "🤖 서브에이전트 종합 테스트 시작 - $(date)"
echo "=========================================="

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 결과 저장 변수
TOTAL_AGENTS=0
WORKING_AGENTS=0
FAILED_AGENTS=0
TEST_RESULTS=()

# 로그 파일 설정
LOG_FILE="logs/sub-agents-test-$(date +%Y%m%d-%H%M%S).log"
mkdir -p logs

log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" | tee -a "$LOG_FILE"
}

print_status() {
    local agent=$1
    local status=$2
    local details=$3
    
    if [ "$status" = "SUCCESS" ]; then
        echo -e "  ${GREEN}✅ $agent${NC}: $details"
        WORKING_AGENTS=$((WORKING_AGENTS + 1))
    elif [ "$status" = "WARNING" ]; then
        echo -e "  ${YELLOW}⚠️  $agent${NC}: $details"
        WORKING_AGENTS=$((WORKING_AGENTS + 1))
    else
        echo -e "  ${RED}❌ $agent${NC}: $details"
        FAILED_AGENTS=$((FAILED_AGENTS + 1))
    fi
    
    TEST_RESULTS+=("$agent: $status - $details")
    log "$agent: $status - $details"
}

# 1. 에이전트 목록 확인
echo ""
echo "📋 1단계: 프로젝트 에이전트 목록 확인"
echo "--------------------------------"

AGENTS_DIR="/mnt/d/cursor/openmanager-vibe-v5/.claude/agents"

if [ ! -d "$AGENTS_DIR" ]; then
    echo -e "${RED}❌ 에이전트 디렉토리가 없습니다: $AGENTS_DIR${NC}"
    exit 1
fi

AGENT_FILES=($(ls "$AGENTS_DIR"/*.md 2>/dev/null | sort))
TOTAL_AGENTS=${#AGENT_FILES[@]}

echo "📊 발견된 프로젝트 에이전트: ${TOTAL_AGENTS}개"

for agent_file in "${AGENT_FILES[@]}"; do
    agent_name=$(basename "$agent_file" .md)
    echo "  - $agent_name"
done

# 2. 에이전트 파일 구조 검증
echo ""
echo "🔍 2단계: 에이전트 파일 구조 검증"
echo "------------------------------"

for agent_file in "${AGENT_FILES[@]}"; do
    agent_name=$(basename "$agent_file" .md)
    
    # YAML frontmatter 확인
    if head -10 "$agent_file" | grep -q "^---$"; then
        # name 필드 확인
        if grep -q "^name:" "$agent_file"; then
            # description 필드 확인
            if grep -q "^description:" "$agent_file"; then
                # tools 필드 확인
                if grep -q "^tools:" "$agent_file"; then
                    print_status "$agent_name" "SUCCESS" "구조 완전함"
                else
                    print_status "$agent_name" "WARNING" "tools 필드 누락"
                fi
            else
                print_status "$agent_name" "FAILED" "description 필드 누락"
            fi
        else
            print_status "$agent_name" "FAILED" "name 필드 누락"
        fi
    else
        print_status "$agent_name" "FAILED" "YAML frontmatter 누락"
    fi
done

# 3. Task 도구 보유 에이전트 확인
echo ""
echo "🔧 3단계: Task 도구 보유 에이전트 확인"
echo "--------------------------------"

TASK_AGENTS=()
for agent_file in "${AGENT_FILES[@]}"; do
    agent_name=$(basename "$agent_file" .md)
    
    if grep -q "Task" "$agent_file"; then
        TASK_AGENTS+=("$agent_name")
        print_status "$agent_name" "SUCCESS" "Task 도구 보유"
    else
        print_status "$agent_name" "WARNING" "Task 도구 미보유"
    fi
done

echo ""
echo "📊 Task 도구 보유 에이전트: ${#TASK_AGENTS[@]}개"
for agent in "${TASK_AGENTS[@]}"; do
    echo "  - $agent"
done

# 4. MCP 도구 접근 권한 확인
echo ""
echo "🔌 4단계: MCP 도구 접근 권한 확인"
echo "----------------------------"

MCP_AGENTS=()
for agent_file in "${AGENT_FILES[@]}"; do
    agent_name=$(basename "$agent_file" .md)
    
    # mcp__ 패턴 검색
    if grep -q "mcp__" "$agent_file"; then
        MCP_AGENTS+=("$agent_name")
        print_status "$agent_name" "SUCCESS" "MCP 도구 접근 가능"
    else
        print_status "$agent_name" "WARNING" "MCP 도구 접근 제한"
    fi
done

echo ""
echo "📊 MCP 도구 접근 에이전트: ${#MCP_AGENTS[@]}개"
for agent in "${MCP_AGENTS[@]}"; do
    echo "  - $agent"
done

# 5. 기본 제공 에이전트 확인
echo ""
echo "🏠 5단계: 기본 제공 에이전트 확인"
echo "----------------------------"

BUILTIN_AGENTS=("general-purpose" "statusline-setup" "output-style-setup")

echo "📋 기본 제공 에이전트 목록:"
for agent in "${BUILTIN_AGENTS[@]}"; do
    echo "  - $agent (Built-in)"
    print_status "$agent" "SUCCESS" "기본 제공 (항상 사용 가능)"
done

# 6. 역할별 분류 분석
echo ""
echo "🎯 6단계: 역할별 분류 분석"
echo "----------------------"

declare -A CATEGORIES

for agent_file in "${AGENT_FILES[@]}"; do
    agent_name=$(basename "$agent_file" .md)
    
    case "$agent_name" in
        *supervisor*)
            CATEGORIES["coordination"]+="$agent_name "
            ;;
        *-manager*|*-admin*|*-administrator*)
            CATEGORIES["management"]+="$agent_name "
            ;;
        *-specialist*|*-auditor*|*-checker*)
            CATEGORIES["specialist"]+="$agent_name "
            ;;
        *-cli*|*-collaborator*|*-agent*)
            CATEGORIES["ai_tools"]+="$agent_name "
            ;;
        *-engineer*)
            CATEGORIES["engineering"]+="$agent_name "
            ;;
        *)
            CATEGORIES["others"]+="$agent_name "
            ;;
    esac
done

echo "📊 역할별 분류:"
for category in "${!CATEGORIES[@]}"; do
    agents=(${CATEGORIES[$category]})
    echo "  $category (${#agents[@]}개): ${agents[*]}"
done

# 7. 종합 결과 리포트
echo ""
echo "📊 7단계: 종합 결과 리포트"
echo "======================"

echo ""
echo -e "${BLUE}🎯 요약 통계${NC}"
echo "  총 프로젝트 에이전트: $TOTAL_AGENTS개"
echo "  기본 제공 에이전트: ${#BUILTIN_AGENTS[@]}개"
echo "  총 에이전트: $((TOTAL_AGENTS + ${#BUILTIN_AGENTS[@]}))개"
echo ""
echo -e "${GREEN}✅ 정상 동작: $WORKING_AGENTS개${NC}"
echo -e "${RED}❌ 문제 발견: $FAILED_AGENTS개${NC}"
echo ""

# 성공률 계산
SUCCESS_RATE=$(( (WORKING_AGENTS * 100) / TOTAL_AGENTS ))
echo "📈 전체 성공률: ${SUCCESS_RATE}%"

# 8. 개선 권장사항
echo ""
echo -e "${YELLOW}🔧 개선 권장사항${NC}"
echo "--------------"

if [ ${#TASK_AGENTS[@]} -lt 5 ]; then
    echo "  1. Task 도구 추가 필요: ai-systems-specialist, git-cicd-specialist 등"
fi

if [ ${#MCP_AGENTS[@]} -lt 5 ]; then
    echo "  2. MCP 도구 접근 확대: database-administrator, gcp-vm-specialist 등"
fi

echo "  3. 기본 제공 에이전트 활용: statusline-setup, output-style-setup 실행"
echo "  4. AGENTS.md 문서 작성으로 사용법 정리"

# 9. 로그 파일 요약
echo ""
echo "📝 상세 로그: $LOG_FILE"

# 테스트 완료 시간
echo ""
echo "🏁 테스트 완료 - $(date)"
echo "총 소요 시간: $SECONDS초"

# 최종 종료 코드
if [ $FAILED_AGENTS -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_AGENTS개 에이전트에서 문제 발견${NC}"
    exit 1
fi