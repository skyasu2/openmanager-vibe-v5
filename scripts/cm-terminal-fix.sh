#!/bin/bash
# Claude Monitor 터미널 그래픽 수정 스크립트

# 환경 변수 설정
export TERM=xterm-256color
export COLORTERM=truecolor
export PYTHONIOENCODING=utf-8
export LANG=en_US.UTF-8

# Rich 라이브러리 강제 컬러 모드
export FORCE_COLOR=1
export COLUMNS=$(tput cols)
export LINES=$(tput lines)

# Python 실행
python3 ~/Claude-Code-Usage-Monitor/claude_monitor.py --plan max20 --timezone Asia/Seoul "$@"