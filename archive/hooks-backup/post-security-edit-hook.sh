#!/bin/bash

# 보안 관련 파일 수정 후 자동 보안 검사
# security-auditor 에이전트를 호출하여 보안 취약점 검사

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
AUDIT_LOG=".claude/audit/audit.log"
SECURITY_REPORT=".claude/issues/security-check-${TIMESTAMP}.md"

# 수정된 파일 경로 가져오기
FILE_PATH="$1"

# 로그 기록
echo "{\"timestamp\":\"$(date -Iseconds)\",\"event\":\"security_edit_hook\",\"file\":\"${FILE_PATH}\",\"action\":\"triggered\"}" >> "$AUDIT_LOG"

# 보안 관련 파일인지 확인
if [[ "$FILE_PATH" =~ (auth|admin|api|payment|session|token|password) ]]; then
    echo "🔐 보안 관련 파일이 수정되었습니다: $FILE_PATH"
    echo "🔍 security-auditor 에이전트를 통한 보안 검사가 권장됩니다."
    
    # 변경 내역 캡처 (가능한 경우)
    CHANGES=""
    if command -v git &> /dev/null && git rev-parse --is-inside-work-tree &> /dev/null; then
        CHANGES=$(git diff --cached "$FILE_PATH" 2>/dev/null || git diff "$FILE_PATH" 2>/dev/null || echo "변경 내역을 가져올 수 없습니다.")
    fi
    
    # 보안 검사 요청 파일 생성
    cat > "$SECURITY_REPORT" << EOF
# 🔐 보안 검사 필요

## 파일 정보
- **파일 경로**: $FILE_PATH
- **수정 시간**: $(date)
- **파일 타입**: 기존 파일 수정

## 변경 내역
\`\`\`diff
${CHANGES:0:1000}
\`\`\`

## 권장 조치
security-auditor 에이전트를 사용하여 다음 항목을 검사하세요:
- 새로운 보안 취약점 도입 여부
- 기존 보안 제어 약화 여부
- SQL Injection, XSS 등 일반적인 취약점
- 인증/인가 로직 변경 검증
- 민감한 데이터 노출 위험

## 실행 명령
\`\`\`
Task({
  subagent_type: 'security-auditor',
  prompt: '수정된 보안 관련 파일 $FILE_PATH 의 변경사항을 검토하여 새로운 취약점이나 보안 위험을 찾아주세요.'
})
\`\`\`
EOF

    echo "✅ 보안 검사 요청이 $SECURITY_REPORT 에 저장되었습니다."
fi

# 로그 완료
echo "{\"timestamp\":\"$(date -Iseconds)\",\"event\":\"security_edit_hook\",\"file\":\"${FILE_PATH}\",\"action\":\"completed\",\"report\":\"${SECURITY_REPORT}\"}" >> "$AUDIT_LOG"