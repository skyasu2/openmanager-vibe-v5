#!/bin/bash

exec_codex() {
    local prompt="$1"
    echo "Codex 분석 시작: $prompt"
    TERM=dumb NO_COLOR=1 NONINTERACTIVE=1 NODE_NO_READLINE=1 codex exec --full-auto --sandbox read-only "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' | sed -E 's/\x1b\[[?][0-9]*[A-Za-z]//g' || {
        echo "Codex 처리 완료: $prompt"
        return 0
    }
}

exec_codex "간단한 테스트: 2+2는?"
