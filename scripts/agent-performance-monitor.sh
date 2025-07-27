#!/bin/bash
# 에이전트 성능 모니터링 스크립트 (agent-evolution-manager 대체)
# 생성일: 2025-01-27

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정
REPORT_DIR="docs/agent-performance-reports"
ISSUES_DIR=".claude/issues"
LOGS_DIR=".claude/logs"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 디렉토리 생성
mkdir -p "$REPORT_DIR"

echo -e "${BLUE}🤖 에이전트 성능 모니터링 시작...${NC}"
echo "=========================="

# 1. 에이전트 사용 통계 수집
collect_usage_stats() {
    echo -e "\n${YELLOW}📊 에이전트 사용 통계 수집 중...${NC}"
    
    # 각 에이전트별 사용 횟수 계산
    declare -A agent_usage
    
    # Task 호출 패턴 검색
    if [ -d "$LOGS_DIR" ]; then
        while IFS= read -r line; do
            agent=$(echo "$line" | grep -oP 'subagent_type="?\K[^"]+')
            ((agent_usage[$agent]++))
        done < <(grep -r "Task.*subagent_type" "$LOGS_DIR" 2>/dev/null || true)
    fi
    
    # 결과 출력
    echo "### 에이전트별 사용 횟수 (최근 7일)"
    for agent in "${!agent_usage[@]}"; do
        echo "- $agent: ${agent_usage[$agent]}회"
    done
}

# 2. 성능 이슈 감지
detect_performance_issues() {
    echo -e "\n${YELLOW}🔍 성능 이슈 분석 중...${NC}"
    
    local issues_found=0
    
    # 에러 패턴 검색
    if [ -d "$ISSUES_DIR" ]; then
        error_count=$(grep -r "ERROR\|FAILED\|Exception" "$ISSUES_DIR" 2>/dev/null | wc -l || echo "0")
        if [ "$error_count" -gt 0 ]; then
            echo -e "${RED}⚠️  최근 에러 발생: $error_count건${NC}"
            ((issues_found++))
        fi
    fi
    
    # 느린 실행 감지 (로그가 있다면)
    if [ -d "$LOGS_DIR" ]; then
        slow_executions=$(grep -r "execution_time.*[5-9][0-9]\{2,\}\|execution_time.*[0-9]\{4,\}" "$LOGS_DIR" 2>/dev/null | wc -l || echo "0")
        if [ "$slow_executions" -gt 0 ]; then
            echo -e "${YELLOW}⏱️  느린 실행 감지: $slow_executions건 (500ms 이상)${NC}"
            ((issues_found++))
        fi
    fi
    
    if [ "$issues_found" -eq 0 ]; then
        echo -e "${GREEN}✅ 성능 이슈 없음${NC}"
    fi
}

# 3. 에이전트 상태 확인
check_agent_health() {
    echo -e "\n${YELLOW}🏥 에이전트 상태 확인 중...${NC}"
    
    # 현재 등록된 에이전트 목록
    agents=(
        "ai-systems-engineer"
        "code-review-specialist"
        "database-administrator"
        "doc-structure-guardian"
        "gemini-cli-collaborator"
        "issue-summary"
        "mcp-server-admin"
        "test-automation-specialist"
        "ux-performance-optimizer"
    )
    
    echo "### 에이전트 파일 상태"
    for agent in "${agents[@]}"; do
        if [ -f ".claude/agents/$agent.md" ]; then
            echo -e "✅ $agent: 정상"
        else
            echo -e "${RED}❌ $agent: 파일 없음${NC}"
        fi
    done
}

# 4. 개선 제안 생성
generate_recommendations() {
    echo -e "\n${YELLOW}💡 개선 제안 생성 중...${NC}"
    
    cat << EOF

### 권장 사항

1. **정기적 모니터링**
   - 주간 성능 리뷰 실시 (매주 월요일)
   - 월간 종합 분석 (매월 첫째 주)

2. **문서 관리**
   - doc-structure-guardian를 활용한 에이전트 문서 품질 관리
   - 사용 패턴 및 베스트 프랙티스 문서화

3. **이슈 추적**
   - issue-summary를 통한 에러 패턴 모니터링
   - 반복적인 문제 해결을 위한 가이드 작성

4. **성능 최적화**
   - 자주 사용되는 에이전트 우선 최적화
   - MCP 서버 매핑 재검토
EOF
}

# 5. 리포트 생성
generate_report() {
    local report_file="$REPORT_DIR/agent-performance-$DATE.md"
    
    echo -e "\n${YELLOW}📄 리포트 생성 중...${NC}"
    
    {
        echo "# 에이전트 성능 리포트"
        echo "**생성일**: $(date '+%Y-%m-%d %H:%M:%S')"
        echo ""
        echo "## 요약"
        echo "- 총 에이전트 수: 9개"
        echo "- 모니터링 기간: 최근 7일"
        echo ""
        
        # 각 섹션 실행 및 결과 저장
        echo "## 사용 통계"
        collect_usage_stats
        echo ""
        
        echo "## 성능 분석"
        detect_performance_issues
        echo ""
        
        echo "## 상태 확인"
        check_agent_health
        echo ""
        
        echo "## 개선 제안"
        generate_recommendations
        echo ""
        
        echo "---"
        echo "*이 리포트는 agent-evolution-manager 대체 스크립트에 의해 자동 생성되었습니다.*"
    } > "$report_file"
    
    echo -e "${GREEN}✅ 리포트 생성 완료: $report_file${NC}"
}

# 6. 선택적 액션
optional_actions() {
    echo -e "\n${YELLOW}🔧 추가 작업 옵션:${NC}"
    echo "1. 전체 에이전트 테스트 실행: bash .claude/test-all-agents.sh"
    echo "2. MCP 상태 확인: bash .claude/check-mcp-status.sh"
    echo "3. 문서 구조 점검: Task(subagent_type='doc-structure-guardian', prompt='문서 상태 점검')"
}

# 메인 실행
main() {
    echo -e "${BLUE}=== 에이전트 성능 모니터링 ===${NC}"
    echo "agent-evolution-manager 대체 스크립트"
    echo ""
    
    # 리포트 생성
    generate_report
    
    # 추가 옵션 표시
    optional_actions
    
    echo -e "\n${GREEN}✅ 모니터링 완료!${NC}"
}

# 스크립트 실행
main "$@"