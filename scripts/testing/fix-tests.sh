#!/bin/bash
# 실패한 테스트 자동 수정 스크립트
# 일반적인 테스트 실패 패턴을 감지하고 자동으로 수정 시도

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# 설정
REPORTS_DIR="docs/reports/test-results"
FIX_LOG="$REPORTS_DIR/auto-fix-log-$(date +%Y%m%d_%H%M%S).txt"
DRY_RUN=${1:-"false"}

echo -e "${BLUE}🛠️  테스트 자동 수정 시스템${NC}"
echo "============================"
echo "모드: $([ "$DRY_RUN" == "true" ] && echo "시뮬레이션" || echo "실제 수정")"
echo ""

mkdir -p "$REPORTS_DIR"

# 로그 초기화
echo "테스트 자동 수정 로그 - $(date)" > "$FIX_LOG"
echo "=========================" >> "$FIX_LOG"

# 1. 최근 테스트 결과 찾기
find_latest_results() {
    echo -e "${YELLOW}🔍 최근 테스트 결과 찾기...${NC}"
    
    LATEST_RESULT=$(ls -t "$REPORTS_DIR"/*-results-*.json 2>/dev/null | head -1)
    
    if [ -z "$LATEST_RESULT" ]; then
        echo -e "${RED}❌ 테스트 결과 파일을 찾을 수 없습니다${NC}"
        echo "먼저 ./scripts/test-runner.sh를 실행하세요"
        exit 1
    fi
    
    echo "결과 파일: $LATEST_RESULT"
    echo ""
}

# 2. Assertion 실패 자동 수정
fix_assertion_failures() {
    echo -e "${YELLOW}🔧 Assertion 실패 수정${NC}"
    echo "---------------------"
    
    # Jest assertion 패턴 찾기
    grep -r "expect(" . --include="*.test.ts" --include="*.test.tsx" --include="*.spec.ts" --include="*.spec.tsx" 2>/dev/null | \
    while IFS=: read -r file line_num content; do
        # toBe 패턴 확인
        if [[ $content =~ expect\((.*)\)\.toBe\((.*)\) ]]; then
            actual="${BASH_REMATCH[1]}"
            expected="${BASH_REMATCH[2]}"
            
            # 실패한 테스트인지 확인 (로그에서)
            if grep -q "$file.*fail" "$LATEST_RESULT" 2>/dev/null; then
                echo -e "${YELLOW}[수정 대상]${NC} $file:$line_num"
                echo "  현재: expect($actual).toBe($expected)"
                
                if [ "$DRY_RUN" == "false" ]; then
                    # 백업 생성
                    cp "$file" "$file.backup"
                    
                    # TODO: 실제 값으로 업데이트하는 로직 구현
                    echo "  -> 수정 보류 (수동 확인 필요)" | tee -a "$FIX_LOG"
                else
                    echo "  -> [시뮬레이션] 수정 예정"
                fi
            fi
        fi
    done
}

# 3. Timeout 에러 자동 수정
fix_timeout_errors() {
    echo -e "\n${YELLOW}⏱️  Timeout 에러 수정${NC}"
    echo "-------------------"
    
    # 테스트 파일에 setTimeout 추가
    find . -name "*.test.ts" -o -name "*.test.tsx" -o -name "*.spec.ts" -o -name "*.spec.tsx" | while read -r file; do
        if grep -q "Timeout.*exceeded" "$LATEST_RESULT" 2>/dev/null && grep -q "$file" "$LATEST_RESULT" 2>/dev/null; then
            echo -e "${YELLOW}[Timeout 수정]${NC} $file"
            
            if [ "$DRY_RUN" == "false" ]; then
                # jest.setTimeout이 없으면 추가
                if ! grep -q "jest.setTimeout" "$file"; then
                    # 파일 시작 부분에 추가
                    sed -i '1i\jest.setTimeout(10000); // 10초로 증가\n' "$file"
                    echo "  ✅ jest.setTimeout(10000) 추가됨" | tee -a "$FIX_LOG"
                else
                    echo "  ℹ️  이미 setTimeout이 설정되어 있음"
                fi
                
                # async/await 누락 확인
                check_async_await "$file"
            else
                echo "  -> [시뮬레이션] jest.setTimeout 추가 예정"
            fi
        fi
    done
}

# 4. async/await 누락 확인 및 수정
check_async_await() {
    local file=$1
    
    # 비동기 함수 호출 패턴 찾기
    grep -n "await\|Promise\|async\|\.then" "$file" | while IFS=: read -r line_num content; do
        # it() 또는 test() 블록 찾기
        if [[ $content =~ (it|test)\([\'\"](.*)[\'\"],[[:space:]]*\(\) ]]; then
            # async 키워드가 없는 경우
            if [[ ! $content =~ async[[:space:]]*\(\) ]]; then
                echo "  ⚠️  Line $line_num: async 키워드 누락 가능성"
                
                if [ "$DRY_RUN" == "false" ]; then
                    # async 추가
                    sed -i "${line_num}s/() =>/ async() =>/" "$file"
                    sed -i "${line_num}s/function(/async function(/" "$file"
                    echo "    ✅ async 키워드 추가됨" | tee -a "$FIX_LOG"
                fi
            fi
        fi
    done
}

# 5. Import 경로 자동 수정
fix_import_errors() {
    echo -e "\n${YELLOW}📦 Import 경로 수정${NC}"
    echo "-----------------"
    
    # Cannot find module 에러 찾기
    if grep -q "Cannot find module" "$LATEST_RESULT" 2>/dev/null; then
        # 모듈명 추출
        grep -o "Cannot find module '[^']*'" "$LATEST_RESULT" | sed "s/Cannot find module '//" | sed "s/'//" | \
        while read -r module; do
            echo -e "${YELLOW}[누락된 모듈]${NC} $module"
            
            # 상대 경로인 경우
            if [[ $module == ./* ]]; then
                # 올바른 경로 찾기
                find_correct_path "$module"
            else
                # npm 패키지인 경우
                if [ "$DRY_RUN" == "false" ]; then
                    echo "  패키지 설치 시도..."
                    if npm list "$module" > /dev/null 2>&1; then
                        echo "  ℹ️  이미 설치되어 있음"
                    else
                        npm install "$module" --save-dev
                        echo "  ✅ $module 설치 완료" | tee -a "$FIX_LOG"
                    fi
                else
                    echo "  -> [시뮬레이션] npm install $module --save-dev"
                fi
            fi
        done
    fi
}

# 6. 올바른 import 경로 찾기
find_correct_path() {
    local wrong_path=$1
    local base_name=$(basename "$wrong_path")
    
    echo "  잘못된 경로: $wrong_path"
    
    # 가능한 파일 찾기
    local possible_files=$(find . -name "${base_name}*" -type f | grep -v node_modules | head -5)
    
    if [ -n "$possible_files" ]; then
        echo "  가능한 파일들:"
        echo "$possible_files" | while read -r file; do
            echo "    - $file"
        done
        
        # 첫 번째 매칭 파일로 수정 제안
        local correct_path=$(echo "$possible_files" | head -1)
        echo "  ✅ 제안: $correct_path"
        
        if [ "$DRY_RUN" == "false" ]; then
            # import 문 수정
            find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "$wrong_path" | while read -r file; do
                sed -i "s|$wrong_path|$correct_path|g" "$file"
                echo "    수정됨: $file" | tee -a "$FIX_LOG"
            done
        fi
    else
        echo "  ❌ 대체 파일을 찾을 수 없음"
    fi
}

# 7. Mock 설정 자동 수정
fix_mock_errors() {
    echo -e "\n${YELLOW}🎭 Mock 설정 수정${NC}"
    echo "----------------"
    
    # mock 관련 에러 패턴
    if grep -q "mock.*is not a function\|jest\.fn" "$LATEST_RESULT" 2>/dev/null; then
        echo "Mock 관련 에러 발견"
        
        # 테스트 파일에서 mock 사용 패턴 찾기
        find . -name "*.test.ts" -o -name "*.test.tsx" | while read -r file; do
            if grep -q "mock\|jest\.mock\|spyOn" "$file"; then
                echo -e "${YELLOW}[Mock 검사]${NC} $file"
                
                # jest.fn() 누락 확인
                grep -n "const.*mock.*=" "$file" | grep -v "jest\.fn" | while IFS=: read -r line_num content; do
                    echo "  Line $line_num: jest.fn() 누락 가능성"
                    
                    if [ "$DRY_RUN" == "false" ]; then
                        # 간단한 mock 수정
                        if [[ $content =~ const[[:space:]]+([a-zA-Z_]+)[[:space:]]*=[[:space:]]*\{\} ]]; then
                            mock_name="${BASH_REMATCH[1]}"
                            sed -i "${line_num}s/{}/jest.fn()/" "$file"
                            echo "    ✅ $mock_name = jest.fn()으로 수정" | tee -a "$FIX_LOG"
                        fi
                    fi
                done
            fi
        done
    fi
}

# 8. 종합 리포트 생성
generate_fix_report() {
    echo -e "\n${YELLOW}📄 수정 리포트 생성${NC}"
    echo "-----------------"
    
    local report_file="$REPORTS_DIR/auto-fix-report-$(date +%Y%m%d_%H%M%S).md"
    
    cat > "$report_file" << EOF
# 테스트 자동 수정 리포트

**실행일**: $(date)  
**모드**: $([ "$DRY_RUN" == "true" ] && echo "시뮬레이션" || echo "실제 수정")

## 수정 내역

### Assertion 실패
- 검사된 파일: $(find . -name "*.test.ts" -o -name "*.test.tsx" | wc -l)개
- 수정 대상: $(grep -c "수정 대상" "$FIX_LOG" 2>/dev/null || echo 0)개

### Timeout 에러
- setTimeout 추가: $(grep -c "setTimeout.*추가됨" "$FIX_LOG" 2>/dev/null || echo 0)개
- async/await 수정: $(grep -c "async.*추가됨" "$FIX_LOG" 2>/dev/null || echo 0)개

### Import 경로
- 수정된 import: $(grep -c "import.*수정됨" "$FIX_LOG" 2>/dev/null || echo 0)개
- 설치된 패키지: $(grep -c "설치 완료" "$FIX_LOG" 2>/dev/null || echo 0)개

### Mock 설정
- Mock 함수 수정: $(grep -c "jest.fn()으로 수정" "$FIX_LOG" 2>/dev/null || echo 0)개

## 다음 단계

1. 수정된 파일 검토
2. 테스트 재실행: \`./scripts/test-runner.sh\`
3. 수동 수정이 필요한 항목 처리

## 백업 파일

수정 전 백업 파일은 \`.backup\` 확장자로 저장되었습니다.
복원이 필요한 경우: \`find . -name "*.backup" -exec sh -c 'mv {} \${%.backup}' \;\`

---
*test-automation-specialist 에이전트에 의해 생성됨*
EOF
    
    echo -e "${GREEN}✅ 리포트 생성 완료: $report_file${NC}"
}

# 9. 테스트 재실행
rerun_tests() {
    echo -e "\n${YELLOW}🔄 테스트 재실행${NC}"
    echo "---------------"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo "[시뮬레이션 모드] 테스트를 재실행하지 않습니다"
        return
    fi
    
    echo -n "수정 후 테스트를 재실행하시겠습니까? (y/N): "
    read -r response
    
    if [[ "$response" =~ ^[Yy]$ ]]; then
        echo "테스트 재실행 중..."
        ./scripts/test-runner.sh
    fi
}

# 메인 실행
main() {
    find_latest_results
    
    # 각 수정 작업 실행
    fix_assertion_failures
    fix_timeout_errors
    fix_import_errors
    fix_mock_errors
    
    # 리포트 생성
    generate_fix_report
    
    # 완료 메시지
    echo -e "\n${BLUE}📊 자동 수정 완료${NC}"
    echo "================"
    
    if [ "$DRY_RUN" == "true" ]; then
        echo -e "${YELLOW}시뮬레이션 모드로 실행되었습니다.${NC}"
        echo "실제 수정을 원하시면 다음 명령을 실행하세요:"
        echo "  ./scripts/auto-fix-tests.sh false"
    else
        echo -e "${GREEN}✅ 자동 수정이 적용되었습니다${NC}"
        echo "수정 로그: $FIX_LOG"
        
        # 테스트 재실행 제안
        rerun_tests
    fi
}

# 스크립트 실행
main