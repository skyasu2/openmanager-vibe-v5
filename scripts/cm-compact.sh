#!/bin/bash

# Claude Monitor - Compact Mode (Claude Code 접힘 방지)
cd "$(dirname "$0")/../claude-monitor-standalone"
python3 claude-monitor.py --plan max20 --timezone Asia/Seoul --once --no-clear --compact