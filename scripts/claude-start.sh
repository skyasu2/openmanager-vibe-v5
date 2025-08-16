#!/bin/bash

# Claude Code 완전 통합 시작 스크립트
# Serena 워밍업 + Claude Code 시작을 한 번에

echo "🤖 Claude Code + Serena MCP 통합 시작"

# 1. Serena 워밍업
./scripts/claude-serena-warmup.sh

echo ""
echo "🚀 3초 후 Claude Code 시작..."
sleep 3

# 2. Claude Code 시작
claude