#!/bin/bash

# PostToolUse Hook: 보안 관련 파일 작성/수정 후 자동 보안 검사
# 기존 post-security-edit.sh와 post-security-write.sh 통합 버전
# 파일: hooks/post-security-hook.sh

set -euo pipefail

# 공통 함수 로드
source "$(dirname "$0")/shared-functions.sh"

# 인자 확인
if [ $# -lt 1 ]; then
    log_error "파일 경로가 제공되지 않았습니다."
    exit 1
fi

FILE_PATH="$1"
OPERATION="${2:-edit}"  # "edit" or "write"
HOOK_NAME="post-security"

log_info "보안 파일 $OPERATION 감지: $FILE_PATH"

# 보안 관련 파일 패턴 확인
if is_security_file "$FILE_PATH"; then
    log_warning "🔒 보안 중요 파일 $OPERATION 감지 - 자동 보안 검사 실행"
    
    # 작업 우선순위 결정
    PRIORITY="high"
    if [[ "$FILE_PATH" =~ (payment|admin) ]]; then
        PRIORITY="critical"
        log_error "💳 결제/관리자 관련 파일 - 최고 우선순위 보안 검사"
    fi
    
    # security-auditor 호출을 위한 프롬프트 생성
    SECURITY_PROMPT=$(create_subagent_prompt "security-auditor" \
        "보안 취약점 검사 및 자동 수정" \
        "$FILE_PATH" \
        "$(cat << EOF
작업 유형: $OPERATION
우선순위: $PRIORITY

다음 항목을 중점적으로 검사해주세요:
1. OWASP Top 10 취약점
2. 인증/인가 로직 검증
3. 입력값 검증 및 삭제
4. SQL Injection, XSS, CSRF 방어
5. 민감 정보 노출 여부
6. 암호화 및 해싱 적절성
7. 에러 처리 및 로깅

발견된 취약점은 즉시 수정하고, 
critical 이슈는 issue-summary에 보고해주세요.
EOF
)")
    
    # 이슈 파일 생성
    ISSUE_FILE=$(create_issue_file "security-audit-required" \
        "보안 검사 필요: $FILE_PATH" \
        "$SECURITY_PROMPT" \
        "$PRIORITY")
    
    # audit 로그 기록
    write_audit_log "$HOOK_NAME" "security-check-triggered" \
        "{\"file\": \"$FILE_PATH\", \"operation\": \"$OPERATION\", \"priority\": \"$PRIORITY\", \"issue_file\": \"$ISSUE_FILE\"}"
    
    # security-auditor로 자동 위임 (exit code 2)
    delegate_to_subagent "security-auditor" "보안 취약점 검사"
    
else
    log_info "일반 파일 - 보안 검사 불필요"
fi

# API 엔드포인트 파일인 경우 추가 검사
if [[ "$FILE_PATH" =~ (api/.*route\.ts|api/.*handler\.ts) ]]; then
    log_warning "API 엔드포인트 파일 감지 - 추가 보안 검사 권장"
    
    # API 보안 체크리스트
    cat << EOF > "$ISSUE_DIR/api-security-checklist-$(get_formatted_date).md"
# API 보안 체크리스트

**파일**: $FILE_PATH  
**작업**: $OPERATION  
**시간**: $(get_timestamp)  

## 확인 항목

- [ ] 인증 미들웨어 적용 여부
- [ ] Rate Limiting 설정
- [ ] CORS 정책 적절성
- [ ] 입력값 검증 (Zod 스키마 등)
- [ ] 에러 응답에 민감 정보 노출 금지
- [ ] API 키/토큰 안전한 관리
- [ ] 로깅 및 모니터링 설정

## 권장사항

security-auditor 에이전트를 통한 상세 검사를 권장합니다.

---
자동 생성됨 - $HOOK_NAME
EOF
    
    suggest_subagent "security-auditor" "API 엔드포인트 보안 검증"
fi

# 환경 변수 파일인 경우 경고
if [[ "$FILE_PATH" =~ (\.env|config.*\.(ts|js|json)) ]]; then
    log_error "⚠️ 환경 설정 파일 변경 - 민감 정보 노출 주의!"
    
    create_issue_file "env-file-changed" \
        "환경 설정 파일 변경 감지" \
        "파일: $FILE_PATH\n\n민감한 정보(API 키, 비밀번호 등)가 커밋되지 않도록 주의하세요." \
        "high"
fi

log_success "보안 훅 처리 완료"
exit $EXIT_SUCCESS