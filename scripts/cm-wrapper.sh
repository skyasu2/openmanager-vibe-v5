#!/bin/bash
# cm 명령어 - Claude Monitor Korean 실행 스크립트
# WSL 환경에서 interactive/non-interactive 상관없이 동작하도록 하는 래퍼

# 기본 설정
PLAN="max20"
TIMEZONE="Asia/Seoul"
ARGS=""

# 명령행 인수 처리
while [[ $# -gt 0 ]]; do
    case $1 in
        --plan)
            PLAN="$2"
            shift 2
            ;;
        --once)
            ARGS="$ARGS --once"
            shift
            ;;
        --compact)
            ARGS="$ARGS --compact"
            shift
            ;;
        *)
            ARGS="$ARGS $1"
            shift
            ;;
    esac
done

# Claude Monitor 실행
cd ~/Claude-Code-Usage-Monitor && python3 claude_monitor_korean.py --plan "$PLAN" --timezone "$TIMEZONE" $ARGS