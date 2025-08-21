#!/bin/bash

# 🔄 AI 교차 검증 Hook
# 서로 다른 AI 시스템 간의 교차 검증을 자동으로 트리거
#
# 인자:
# $1: 수정된 파일 경로
# $2: 사용된 도구 (Edit/Write/MultiEdit)
# $3: 변경 내용 (선택적)

set -e

# === 설정 ===
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
CLAUDE_DIR="$PROJECT_ROOT/.claude"
CROSS_VERIFY_QUEUE="$CLAUDE_DIR/cross-verification-queue.txt"
SECURITY_QUEUE="$CLAUDE_DIR/security-review-queue.txt"
LOG_FILE="$CLAUDE_DIR/cross-verification.log"

# === 색상 코드 ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m'

# === 함수 정의 ===

# 로그 기록
log_message() {
    local message="$1"
    # 안전한 로그 파일 생성
    mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
    if echo "[$(date '+%Y-%m-%d %H:%M:%S')] $message" >> "$LOG_FILE" 2>/dev/null; then
        echo -e "$message"
    else
        # 로그 파일 쓰기 실패 시 콘솔에만 출력
        echo -e "[LOG ERROR] $message"
    fi
}

# 파일 크기 계산
get_file_size() {
    local file="$1"
    if [ -f "$file" ]; then
        wc -l "$file" | awk '{print $1}'
    else
        echo "0"
    fi
}

# 변경 크기 기반 검증 레벨 결정
determine_verification_level() {
    local file="$1"
    local size=$(get_file_size "$file")
    
    # 중요 파일은 무조건 Level 3 (교차 검증)
    if [[ "$file" =~ /(api|auth)/ ]] || \
       [[ "$file" =~ \.(config|env) ]] || \
       [[ "$file" =~ (middleware|route|schema|security) ]]; then
        echo "LEVEL_3_CRITICAL"
        return
    fi
    
    if [ "$size" -lt 50 ]; then
        echo "LEVEL_1"
    elif [ "$size" -lt 200 ]; then
        echo "LEVEL_2"
    else
        echo "LEVEL_3"
    fi
}

# AI 교차 검증 제안
suggest_cross_verification() {
    local level="$1"
    local file="$2"
    
    case "$level" in
        LEVEL_1)
            log_message "${GREEN}✅ Level 1: 단일 AI 검증 (라운드 로빈)${NC}"
            
            # 라운드 로빈 방식으로 AI 선택
            local selected_ai=""
            if [ -f "$CLAUDE_DIR/scripts/select-ai-round-robin.sh" ]; then
                selected_ai=$(bash "$CLAUDE_DIR/scripts/select-ai-round-robin.sh" "LEVEL_1")
                log_message "${BLUE}🎯 라운드 로빈 선택: $selected_ai${NC}"
            else
                # 폴백: 랜덤 선택
                local ai_pool=("gemini" "codex" "qwen")
                selected_ai=${ai_pool[$((RANDOM % 3))]}
                log_message "${YELLOW}⚠️ 라운드 로빈 스크립트 없음 - 랜덤 선택: $selected_ai${NC}"
            fi
            
            # AI별 제안 메시지
            case "$selected_ai" in
                gemini)
                    echo "💡 제안: Task unified-ai-wrapper \"gemini로 $file 아키텍처 검토\""
                    echo "   포커스: 설계 패턴, SOLID 원칙, 구조 분석"
                    ;;
                codex)
                    echo "💡 제안: Task unified-ai-wrapper \"codex로 $file 실무 검토\""
                    echo "   포커스: 엣지 케이스, 보안, 프로덕션 이슈"
                    ;;
                qwen)
                    echo "💡 제안: Task unified-ai-wrapper \"qwen으로 $file 알고리즘 검토\""
                    echo "   포커스: 성능 최적화, 복잡도 분석, 대안 제시"
                    ;;
            esac
            ;;
        LEVEL_2)
            log_message "${YELLOW}⚠️ Level 2: 2-AI 병렬 검증 권장${NC}"
            cat << EOF
💡 제안: 다음 명령어 실행
Task external-ai-orchestrator "Level 2 검증: $file (Claude + Gemini 병렬)"
또는
Task verification-specialist "$file 검증" &
Task unified-ai-wrapper "gemini로 $file 검토"
EOF
            ;;
        LEVEL_3|LEVEL_3_CRITICAL)
            log_message "${RED}🚨 Level 3: 4-AI 교차 검증 필수${NC}"
            cat << EOF
🔄 교차 검증 프로세스:
1. Task external-ai-orchestrator "4-AI 완전 교차 검증: $file
   - Claude: 초기 검증 (TypeScript strict, Next.js 15)
   - Gemini: 아키텍처 문제 찾기 (설계 패턴, SOLID 원칙)
   - Codex: 실무 관점 검증 (엣지 케이스, 보안)
   - Qwen: 알고리즘 검증 (성능, 복잡도)"
2. 자동 교차 발견사항 비교 및 종합 결과 제시
EOF
            if [[ "$level" == "LEVEL_3_CRITICAL" ]]; then
                echo -e "${RED}⚠️ 보안 중요 파일 - 배포 전 필수 검증${NC}"
            fi
            ;;
    esac
}

# === 메인 로직 ===

FILE_PATH="${1:-}"
TOOL_USED="${2:-}"
CHANGES="${3:-}"

if [ -z "$FILE_PATH" ]; then
    log_message "${YELLOW}⚠️ 파일 경로가 제공되지 않았습니다.${NC}"
    exit 0
fi

log_message "${PURPLE}🔄 AI 교차 검증 시스템 활성화${NC}"
log_message "${BLUE}📝 파일: $FILE_PATH (도구: $TOOL_USED)${NC}"

# 1. 검증 레벨 결정
VERIFY_LEVEL=$(determine_verification_level "$FILE_PATH")
log_message "📊 검증 레벨: $VERIFY_LEVEL"

# 2. 교차 검증 큐에 추가
TIMESTAMP=$(date '+%s')
echo "$FILE_PATH:$VERIFY_LEVEL:$TIMESTAMP:$TOOL_USED" >> "$CROSS_VERIFY_QUEUE"

# 3. 교차 검증 제안
suggest_cross_verification "$VERIFY_LEVEL" "$FILE_PATH"

# 4. 보안 패턴 검사 (모든 AI가 놓칠 수 있는 패턴)
SECURITY_PATTERNS=(
    "dangerouslySetInnerHTML"
    "eval("
    "innerHTML"
    "process.env"
    "sk_live_"  # Stripe 프로덕션 키
    "ghp_"      # GitHub 토큰
    "sbp_"      # Supabase 키
)

for pattern in "${SECURITY_PATTERNS[@]}"; do
    if grep -q "$pattern" "$FILE_PATH" 2>/dev/null; then
        log_message "${RED}🔐 보안 위험 패턴 감지: $pattern${NC}"
        echo "SECURITY_RISK:$FILE_PATH:$pattern" >> "$SECURITY_QUEUE"
        echo -e "${RED}⚠️ 모든 AI가 이 패턴을 검토해야 합니다!${NC}"
    fi
done

# 5. 교차 검증 통계
PENDING_COUNT=$(wc -l < "$CROSS_VERIFY_QUEUE" 2>/dev/null || echo "0")
SECURITY_COUNT=$(wc -l < "$SECURITY_QUEUE" 2>/dev/null || echo "0")

if [ "$PENDING_COUNT" -gt 0 ]; then
    log_message "${YELLOW}📋 교차 검증 대기: $PENDING_COUNT개 파일${NC}"
fi

if [ "$SECURITY_COUNT" -gt 0 ]; then
    log_message "${RED}🔐 보안 검토 필요: $SECURITY_COUNT개 이슈${NC}"
fi

# 6. 자동 트리거 조건 확인
if [[ "$VERIFY_LEVEL" == "LEVEL_3_CRITICAL" ]] || [ "$SECURITY_COUNT" -gt 0 ]; then
    log_message "${PURPLE}🚀 자동 교차 검증 트리거 권장${NC}"
    echo "💡 다음 명령어를 즉시 실행하세요:"
    echo "Task external-ai-orchestrator \"교차 검증 우선순위 high\""
fi

log_message "${GREEN}✅ 교차 검증 훅 완료${NC}"

# 7. 상태 대시보드 업데이트
UPDATE_SCRIPT="$CLAUDE_DIR/scripts/update-verification-status.sh"
if [ -f "$UPDATE_SCRIPT" ]; then
    bash "$UPDATE_SCRIPT" 2>/dev/null || true
fi

# 8. AI별 강점 리마인더
cat << EOF

🎯 AI별 전문 영역 (교차 검증 시 참고):
• Claude: TypeScript strict, Next.js 15, Vercel 최적화
• Gemini: 아키텍처 설계, SOLID 원칙, 대규모 패턴
• Codex: 실무 경험, 풀스택 솔루션, 즉각적 해결
• Qwen: 프로토타이핑, 알고리즘 검증, 다양한 접근

효과적인 교차 검증은 각 AI의 강점을 활용합니다!
EOF

exit 0