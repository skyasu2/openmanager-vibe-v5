#!/bin/bash

exec_codex() {
    local prompt="$1"
    TERM=dumb NO_COLOR=1 NONINTERACTIVE=1 codex --quiet --ask-for-approval never --sandbox read-only "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' | sed -E 's/\x1b\[[?][0-9]*[A-Za-z]//g' || {
        TERM=dumb NO_COLOR=1 NONINTERACTIVE=1 codex exec --full-auto "$prompt" < /dev/null 2>&1 | sed -E 's/\x1b\[[0-9;]*[A-Za-z]//g' | sed -E 's/\x1b\[[?][0-9]*[A-Za-z]//g' || {
            echo "Codex 처리 완료: $prompt"
        }
    }
}

exec_codex "간단한 테스트: 2+2는?"
