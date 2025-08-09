#!/bin/bash
# 10개 서브 에이전트 전수 조사 테스트 스크립트

echo "🧪 10개 서브 에이전트 전수 조사 테스트"
echo "========================================"
echo "시작 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 테스트 결과 저장을 위한 로그 파일
LOG_FILE="/mnt/d/cursor/openmanager-vibe-v5/.claude/agent-test-results-$(date +%Y%m%d_%H%M%S).log"

# 에이전트 목록
agents=(
    "ai-systems-engineer"
    "mcp-server-admin"
    "issue-summary"
    "database-administrator"
    "code-review-specialist"
    "documentation-manager"
    "ux-performance-optimizer"
    "gemini-cli-collaborator"
    "test-automation-specialist"
    "agent-evolution-manager"
)

# 테스트 시나리오
declare -A test_scenarios=(
    ["ai-systems-engineer"]="SimplifiedQueryEngine 성능 분석 요청"
    ["mcp-server-admin"]="MCP 서버 상태 점검 요청"
    ["issue-summary"]="시스템 모니터링 보고서 생성"
    ["database-administrator"]="Supabase 쿼리 최적화 분석"
    ["code-review-specialist"]="최근 변경사항 코드 리뷰"
    ["documentation-manager"]="문서 구조 검증 및 정리"
    ["ux-performance-optimizer"]="Core Web Vitals 분석"
    ["gemini-cli-collaborator"]="Gemini와 협업 작업 요청"
    ["test-automation-specialist"]="테스트 커버리지 분석"
    ["agent-evolution-manager"]="에이전트 성능 메트릭 분석"
)

# 테스트 결과 저장
declare -A test_results
total_tests=0
passed_tests=0

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 실행 함수
test_agent() {
    local agent=$1
    local scenario="${test_scenarios[$agent]}"
    
    echo -e "\n${YELLOW}[$((total_tests + 1))/10]${NC} 테스트 중: $agent"
    echo "시나리오: $scenario"
    echo "----------------------------------------"
    
    ((total_tests++))
    
    # 에이전트 파일 존재 확인
    agent_file="/mnt/d/cursor/openmanager-vibe-v5/.claude/agents/${agent}.md"
    if [ ! -f "$agent_file" ]; then
        echo -e "${RED}❌ 실패:${NC} 에이전트 파일이 없습니다"
        test_results[$agent]="❌ 파일 없음"
        return
    fi
    
    # 에이전트 메타데이터 확인
    if grep -q "name: $agent" "$agent_file" && \
       grep -q "description:" "$agent_file" && \
       grep -q "tools:" "$agent_file"; then
        echo -e "${GREEN}✅${NC} 메타데이터 확인 완료"
        
        # MCP 권장사항 확인
        if grep -q "recommended_mcp:" "$agent_file"; then
            echo -e "${GREEN}✅${NC} MCP 권장사항 존재"
            
            # MCP 강요 패턴 확인
            if grep -qE "MANDATORY|must actively use|필수적으로|강제|반드시 사용" "$agent_file"; then
                echo -e "${YELLOW}⚠️${NC} MCP 강요 패턴 발견"
                test_results[$agent]="⚠️ MCP 강요 패턴"
            else
                echo -e "${GREEN}✅${NC} MCP 선택적 사용 확인"
                
                # 프롬프트 구조 확인
                if grep -q "필요에 따라 이러한 MCP 서버의 기능을 활용" "$agent_file"; then
                    echo -e "${GREEN}✅${NC} 적절한 MCP 가이드 제공"
                    test_results[$agent]="✅ 정상"
                    ((passed_tests++))
                else
                    echo -e "${YELLOW}⚠️${NC} MCP 가이드 개선 가능"
                    test_results[$agent]="⚠️ MCP 가이드 개선 가능"
                fi
            fi
        else
            echo -e "${YELLOW}⚠️${NC} MCP 권장사항 없음"
            test_results[$agent]="⚠️ MCP 권장사항 없음"
        fi
    else
        echo -e "${RED}❌ 실패:${NC} 메타데이터 불완전"
        test_results[$agent]="❌ 메타데이터 불완전"
    fi
    
    # 로그 파일에 기록
    {
        echo "[$agent] $(date '+%Y-%m-%d %H:%M:%S')"
        echo "시나리오: $scenario"
        echo "결과: ${test_results[$agent]}"
        echo "---"
    } >> "$LOG_FILE"
}

# 모든 에이전트 테스트
for agent in "${agents[@]}"; do
    test_agent "$agent"
done

# 테스트 결과 요약
echo -e "\n\n========================================"
echo "📊 테스트 결과 요약"
echo "========================================"
echo "전체 에이전트: ${#agents[@]}개"
echo "테스트 완료: $total_tests개"
echo "정상: $passed_tests개"
echo "문제 발견: $((total_tests - passed_tests))개"
echo ""

# 상태별 분류
echo "✅ 정상 작동 에이전트:"
for agent in "${!test_results[@]}"; do
    if [[ ${test_results[$agent]} == *"✅ 정상"* ]]; then
        echo "  - $agent"
    fi
done | sort

if [ $passed_tests -lt $total_tests ]; then
    echo ""
    echo "⚠️  개선 필요 에이전트:"
    for agent in "${!test_results[@]}"; do
        if [[ ${test_results[$agent]} == *"⚠️"* ]]; then
            echo "  - $agent: ${test_results[$agent]}"
        fi
    done | sort
    
    echo ""
    echo "❌ 문제 있는 에이전트:"
    for agent in "${!test_results[@]}"; do
        if [[ ${test_results[$agent]} == *"❌"* ]]; then
            echo "  - $agent: ${test_results[$agent]}"
        fi
    done | sort
fi

# 성공률 계산
success_rate=$((passed_tests * 100 / total_tests))
echo ""
echo "🎯 전체 성공률: ${success_rate}%"

# 최종 평가
echo ""
if [ $success_rate -eq 100 ]; then
    echo "🎉 모든 에이전트가 MCP 선택적 사용 가이드를 따르고 있습니다!"
elif [ $success_rate -ge 80 ]; then
    echo "👍 대부분의 에이전트가 적절히 구성되어 있습니다."
elif [ $success_rate -ge 60 ]; then
    echo "⚠️  일부 에이전트에 개선이 필요합니다."
else
    echo "🚨 많은 에이전트에 개선이 필요합니다."
fi

echo ""
echo "📄 상세 로그: $LOG_FILE"
echo "완료 시간: $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# MCP 사용 패턴 분석
echo -e "\n\n📊 MCP 사용 패턴 분석"
echo "========================================"

# 각 MCP 서버별 사용 빈도
declare -A mcp_usage
for agent_file in /mnt/d/cursor/openmanager-vibe-v5/.claude/agents/*.md; do
    if grep -q "primary:" "$agent_file"; then
        # primary MCP 추출
        awk '/primary:/{flag=1; next} /secondary:/{flag=0} flag && /- / {print $2}' "$agent_file" | while read -r mcp; do
            ((mcp_usage[$mcp]++))
        done
    fi
done

echo "Primary MCP 사용 빈도:"
for mcp in filesystem supabase memory github context7 tavily-mcp sequential-thinking playwright serena; do
    count=${mcp_usage[$mcp]:-0}
    printf "%-20s : %d개 에이전트\n" "$mcp" "$count"
done

echo ""
echo "✅ 테스트 완료!"