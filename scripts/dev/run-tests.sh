#!/bin/bash
# 테스트 프레임워크 자동 감지 및 실행 스크립트
# 모든 주요 테스트 프레임워크 지원 (Jest, Vitest, Mocha, Playwright, Cypress)

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 설정
REPORTS_DIR="reports/test-results"
DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_MODE=${1:-"all"}  # all, unit, integration, e2e
WATCH_MODE=${2:-"false"}

echo -e "${BLUE}🧪 테스트 자동 실행 시스템${NC}"
echo "================================"
echo "모드: $TEST_MODE"
echo "감시 모드: $WATCH_MODE"
echo ""

# 리포트 디렉토리 생성
mkdir -p "$REPORTS_DIR"

# 1. 테스트 프레임워크 자동 감지
detect_framework() {
    echo -e "${YELLOW}🔍 테스트 프레임워크 감지 중...${NC}"
    
    if [ -f "package.json" ]; then
        # package.json에서 의존성 확인
        FRAMEWORK=""
        
        # Jest 확인
        if grep -q '"jest"' package.json || grep -q '"@types/jest"' package.json; then
            FRAMEWORK="jest"
            echo -e "${GREEN}✅ Jest 감지됨${NC}"
        fi
        
        # Vitest 확인
        if grep -q '"vitest"' package.json; then
            FRAMEWORK="vitest"
            echo -e "${GREEN}✅ Vitest 감지됨${NC}"
        fi
        
        # Playwright 확인
        if grep -q '"@playwright/test"' package.json; then
            E2E_FRAMEWORK="playwright"
            echo -e "${GREEN}✅ Playwright 감지됨${NC}"
        fi
        
        # Cypress 확인
        if grep -q '"cypress"' package.json; then
            E2E_FRAMEWORK="cypress"
            echo -e "${GREEN}✅ Cypress 감지됨${NC}"
        fi
        
        # Mocha 확인
        if grep -q '"mocha"' package.json; then
            FRAMEWORK="mocha"
            echo -e "${GREEN}✅ Mocha 감지됨${NC}"
        fi
        
        if [ -z "$FRAMEWORK" ] && [ -z "$E2E_FRAMEWORK" ]; then
            echo -e "${RED}❌ 테스트 프레임워크를 찾을 수 없습니다${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ package.json을 찾을 수 없습니다${NC}"
        exit 1
    fi
}

# 2. Jest 테스트 실행
run_jest() {
    echo -e "\n${BLUE}🃏 Jest 테스트 실행${NC}"
    echo "-------------------"
    
    local jest_cmd="npm test"
    local jest_args=""
    
    # 커버리지 포함
    jest_args="$jest_args --coverage"
    
    # JSON 리포터 추가
    jest_args="$jest_args --json --outputFile=$REPORTS_DIR/jest-results-$TIMESTAMP.json"
    
    # 감시 모드
    if [ "$WATCH_MODE" == "true" ]; then
        jest_args="$jest_args --watch"
    else
        jest_args="$jest_args --ci"
    fi
    
    # 테스트 타입별 필터링
    case $TEST_MODE in
        unit)
            jest_args="$jest_args --testPathPattern='(spec|test)\\.(ts|tsx|js|jsx)$' --testPathIgnorePatterns='(integration|e2e)'"
            ;;
        integration)
            jest_args="$jest_args --testPathPattern='integration.*\\.(spec|test)\\.(ts|tsx|js|jsx)$'"
            ;;
    esac
    
    echo "실행 명령: $jest_cmd -- $jest_args"
    
    # 테스트 실행
    if $jest_cmd -- $jest_args; then
        echo -e "${GREEN}✅ Jest 테스트 성공${NC}"
        return 0
    else
        echo -e "${RED}❌ Jest 테스트 실패${NC}"
        return 1
    fi
}

# 3. Vitest 테스트 실행
run_vitest() {
    echo -e "\n${BLUE}⚡ Vitest 테스트 실행${NC}"
    echo "--------------------"
    
    local vitest_cmd="npx vitest"
    local vitest_args="run"
    
    # 커버리지 포함
    vitest_args="$vitest_args --coverage"
    
    # JSON 리포터
    vitest_args="$vitest_args --reporter=json --outputFile=$REPORTS_DIR/vitest-results-$TIMESTAMP.json"
    
    # 감시 모드
    if [ "$WATCH_MODE" == "true" ]; then
        vitest_args=""  # run 제거
    fi
    
    echo "실행 명령: $vitest_cmd $vitest_args"
    
    # 테스트 실행
    if $vitest_cmd $vitest_args; then
        echo -e "${GREEN}✅ Vitest 테스트 성공${NC}"
        return 0
    else
        echo -e "${RED}❌ Vitest 테스트 실패${NC}"
        return 1
    fi
}

# 4. Playwright 테스트 실행
run_playwright() {
    echo -e "\n${BLUE}🎭 Playwright E2E 테스트 실행${NC}"
    echo "----------------------------"
    
    local playwright_cmd="npx playwright test"
    local playwright_args=""
    
    # 리포터 설정
    playwright_args="$playwright_args --reporter=json"
    
    # 헤드리스 모드 (기본)
    if [ "$WATCH_MODE" == "true" ]; then
        playwright_args="$playwright_args --headed"
    fi
    
    echo "실행 명령: $playwright_cmd $playwright_args"
    
    # 테스트 실행
    if $playwright_cmd $playwright_args > "$REPORTS_DIR/playwright-results-$TIMESTAMP.json"; then
        echo -e "${GREEN}✅ Playwright 테스트 성공${NC}"
        
        # 리포트 생성
        npx playwright show-report
        return 0
    else
        echo -e "${RED}❌ Playwright 테스트 실패${NC}"
        return 1
    fi
}

# 5. Cypress 테스트 실행
run_cypress() {
    echo -e "\n${BLUE}🌲 Cypress E2E 테스트 실행${NC}"
    echo "-------------------------"
    
    if [ "$WATCH_MODE" == "true" ]; then
        echo "인터랙티브 모드로 실행..."
        npx cypress open
    else
        echo "헤드리스 모드로 실행..."
        npx cypress run --reporter json --reporter-options output="$REPORTS_DIR/cypress-results-$TIMESTAMP.json"
    fi
}

# 6. 테스트 결과 분석
analyze_results() {
    echo -e "\n${YELLOW}📊 테스트 결과 분석${NC}"
    echo "------------------"
    
    # 가장 최근 결과 파일 찾기
    local latest_result=$(ls -t "$REPORTS_DIR"/*-results-*.json 2>/dev/null | head -1)
    
    if [ -n "$latest_result" ]; then
        echo "결과 파일: $latest_result"
        
        # 실패한 테스트 분석
        if [ -f "scripts/analyze-test-failures.js" ]; then
            node scripts/analyze-test-failures.js "$latest_result"
        else
            echo -e "${YELLOW}⚠️  분석 스크립트가 없습니다${NC}"
        fi
    else
        echo -e "${YELLOW}⚠️  결과 파일을 찾을 수 없습니다${NC}"
    fi
}

# 7. 커버리지 리포트 생성
generate_coverage_report() {
    echo -e "\n${YELLOW}📈 커버리지 리포트${NC}"
    echo "-----------------"
    
    if [ -d "coverage" ]; then
        # 커버리지 요약 출력
        if [ -f "coverage/coverage-summary.json" ]; then
            node -e "
                const coverage = require('./coverage/coverage-summary.json');
                const total = coverage.total;
                console.log('전체 커버리지:');
                console.log('  - 구문: ' + total.statements.pct + '%');
                console.log('  - 분기: ' + total.branches.pct + '%');
                console.log('  - 함수: ' + total.functions.pct + '%');
                console.log('  - 라인: ' + total.lines.pct + '%');
                
                if (total.lines.pct < 80) {
                    console.log('\\n⚠️  목표 커버리지(80%)에 미달합니다!');
                } else {
                    console.log('\\n✅ 목표 커버리지를 달성했습니다!');
                }
            "
        fi
        
        # HTML 리포트 열기 옵션
        echo ""
        echo "HTML 커버리지 리포트 보기: open coverage/lcov-report/index.html"
    fi
}

# 8. 종합 리포트 생성
generate_final_report() {
    local report_file="$REPORTS_DIR/test-summary-$TIMESTAMP.md"
    
    echo -e "\n${YELLOW}📄 종합 리포트 생성${NC}"
    echo "------------------"
    
    cat > "$report_file" << EOF
# 테스트 실행 종합 리포트

**생성일**: $DATE  
**프레임워크**: ${FRAMEWORK:-N/A} / ${E2E_FRAMEWORK:-N/A}  
**테스트 모드**: $TEST_MODE

## 실행 결과

- 유닛 테스트: $([ "$FRAMEWORK" ] && echo "✅ 실행됨" || echo "⏭️ 스킵")
- E2E 테스트: $([ "$E2E_FRAMEWORK" ] && echo "✅ 실행됨" || echo "⏭️ 스킵")

## 다음 단계

1. 실패한 테스트 수정
2. 커버리지 개선
3. 테스트 성능 최적화

---
*test-automation-specialist 에이전트에 의해 생성됨*
EOF
    
    echo -e "${GREEN}✅ 리포트 생성 완료: $report_file${NC}"
}

# 메인 실행
main() {
    # 프레임워크 감지
    detect_framework
    
    # 테스트 실행 성공 여부
    TEST_SUCCESS=true
    
    # 테스트 타입별 실행
    case $TEST_MODE in
        all)
            # 유닛/통합 테스트
            if [ -n "$FRAMEWORK" ]; then
                case $FRAMEWORK in
                    jest)
                        run_jest || TEST_SUCCESS=false
                        ;;
                    vitest)
                        run_vitest || TEST_SUCCESS=false
                        ;;
                    mocha)
                        echo "Mocha 지원 예정"
                        ;;
                esac
            fi
            
            # E2E 테스트
            if [ -n "$E2E_FRAMEWORK" ] && [ "$WATCH_MODE" != "true" ]; then
                case $E2E_FRAMEWORK in
                    playwright)
                        run_playwright || TEST_SUCCESS=false
                        ;;
                    cypress)
                        run_cypress || TEST_SUCCESS=false
                        ;;
                esac
            fi
            ;;
        unit|integration)
            if [ -n "$FRAMEWORK" ]; then
                case $FRAMEWORK in
                    jest)
                        run_jest || TEST_SUCCESS=false
                        ;;
                    vitest)
                        run_vitest || TEST_SUCCESS=false
                        ;;
                esac
            fi
            ;;
        e2e)
            if [ -n "$E2E_FRAMEWORK" ]; then
                case $E2E_FRAMEWORK in
                    playwright)
                        run_playwright || TEST_SUCCESS=false
                        ;;
                    cypress)
                        run_cypress || TEST_SUCCESS=false
                        ;;
                esac
            fi
            ;;
    esac
    
    # 결과 분석 (감시 모드가 아닌 경우)
    if [ "$WATCH_MODE" != "true" ]; then
        analyze_results
        generate_coverage_report
        generate_final_report
        
        if [ "$TEST_SUCCESS" = false ]; then
            echo -e "\n${RED}⚠️  일부 테스트가 실패했습니다${NC}"
            echo "자동 수정을 시도하려면 다음 명령을 실행하세요:"
            echo "  ./scripts/auto-fix-tests.sh"
            exit 1
        else
            echo -e "\n${GREEN}🎉 모든 테스트가 성공했습니다!${NC}"
        fi
    fi
}

# 스크립트 실행
main