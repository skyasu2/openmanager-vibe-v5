#!/bin/bash

# 최소화된 보안 파일 체크 훅
# 권장사항만 제시, 차단하지 않음

FILE_PATH="${1:-}"

# 보안 관련 파일인 경우 권장사항만 제시
if [[ "$FILE_PATH" =~ (auth|payment|admin|secret|credential) ]]; then
    echo "🔐 보안 관련 파일이 수정되었습니다: $(basename "$FILE_PATH")"
    echo ""
    echo "💡 다음 사항을 확인하셨나요?"
    echo "  - 민감한 정보가 노출되지 않았는지"
    echo "  - 적절한 검증이 포함되었는지"
    echo ""
    echo "필요시: Task(subagent_type='security-auditor', ...) 사용 가능"
fi

# 항상 성공 (차단하지 않음)
exit 0