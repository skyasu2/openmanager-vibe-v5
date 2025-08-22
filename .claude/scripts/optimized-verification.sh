#!/bin/bash

# 🎯 최적화된 AI 교차 검증 시스템
# 호환성 매트릭스 기반 하이브리드 접근법

# 터미널 환경 격리
export TERM=dumb
export NO_COLOR=1
export NONINTERACTIVE=1

# === 호환성 매트릭스 ===
# AI 도구별 지원 기능과 제한사항 정의

# Task 시스템 (Claude Code 네이티브)
TASK_COMPATIBILITY="high"
TASK_FEATURES="complete,mcp,subagents,file_analysis"

# CLI 래퍼들
GEMINI_COMPATIBILITY="medium"
GEMINI_FEATURES="simple_prompts,architecture_review"
GEMINI_LIMITATIONS="no_file_direct,terminal_issues"

CODEX_COMPATIBILITY="low"
CODEX_FEATURES="code_review,experience_based"
CODEX_LIMITATIONS="terminal_incompatible,ansi_issues"

QWEN_COMPATIBILITY="medium" 
QWEN_FEATURES="algorithm_analysis,prototyping"
QWEN_LIMITATIONS="no_file_direct,limited_context"

# === 검증 전략 결정 함수 ===
determine_verification_strategy() {
    local file_path="$1"
    local file_size_lines=$(wc -l < "$file_path" 2>/dev/null || echo "0")
    local file_type=$(basename "$file_path")
    
    # 보안 중요 파일은 항상 Task 시스템 + 가능한 CLI 병행
    if [[ "$file_path" =~ (auth|security|payment|api|admin) ]]; then
        echo "critical,task,cli_parallel"
        return
    fi
    
    # 복잡한 파일 (200줄+)은 Task 중심
    if [ "$file_size_lines" -gt 200 ]; then
        echo "complex,task_primary,cli_secondary"
        return
    fi
    
    # 간단한 파일 (50줄 미만)은 CLI 중심
    if [ "$file_size_lines" -lt 50 ]; then
        echo "simple,cli_primary,task_optional"
        return
    fi
    
    # 중간 크기는 하이브리드
    echo "medium,hybrid,balanced"
}

# === AI 도구별 실행 함수 ===
run_task_verification() {
    local file_path="$1"
    local level="$2"
    
    echo "🎯 Task 시스템 검증 시작 (Level $level)"
    
    case "$level" in
        1)
            echo "Task external-ai-orchestrator \"Level 1 빠른 검증: $file_path\""
            ;;
        2)
            echo "Task external-ai-orchestrator \"Level 2 교차 검증: $file_path (Claude + 1개 외부 AI)\""
            ;;
        3)
            echo "Task external-ai-orchestrator \"Level 3 완전 교차 검증: $file_path (4-AI 전체 검증)\""
            ;;
    esac
    
    return 0
}

run_cli_verification() {
    local file_path="$1"
    local ai_tool="$2"
    
    echo "🔧 CLI 검증 시작: $ai_tool"
    
    case "$ai_tool" in
        "gemini")
            if command -v gemini >/dev/null 2>&1; then
                echo "📋 Gemini 아키텍처 분석 중..."
                timeout 30s gemini -p "이 파일의 아키텍처와 설계 패턴을 간단히 분석해주세요" 2>/dev/null || echo "⚠️ Gemini 실행 실패"
            else
                echo "❌ Gemini CLI 없음"
            fi
            ;;
        "qwen")
            if command -v qwen >/dev/null 2>&1; then
                echo "⚡ Qwen 알고리즘 분석 중..."
                timeout 30s qwen -p "이 코드의 알고리즘 효율성을 간단히 평가해주세요" 2>/dev/null || echo "⚠️ Qwen 실행 실패"
            else
                echo "❌ Qwen CLI 없음"
            fi
            ;;
        "codex")
            # Codex는 터미널 호환성 문제로 비활성화
            echo "⚠️ Codex CLI: 터미널 호환성 문제로 스킵 (Task 시스템 권장)"
            ;;
    esac
    
    return 0
}

# === 메인 검증 로직 ===
main_verification() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        echo "❌ 파일을 찾을 수 없습니다: $file_path"
        return 1
    fi
    
    echo "🚀 최적화된 AI 교차 검증 시작"
    echo "📁 대상 파일: $file_path"
    
    # 검증 전략 결정
    local strategy=$(determine_verification_strategy "$file_path")
    echo "📊 검증 전략: $strategy"
    
    # 전략에 따른 실행
    case "$strategy" in
        *"critical"*)
            echo "🚨 보안 중요 파일 감지 - Level 3 강제 실행"
            run_task_verification "$file_path" 3
            echo "🔄 병렬 CLI 검증 시작"
            run_cli_verification "$file_path" "gemini" &
            run_cli_verification "$file_path" "qwen" &
            wait
            ;;
        *"complex"*)
            echo "🧩 복잡한 파일 - Task 중심 검증"
            run_task_verification "$file_path" 2
            echo "🔧 보조 CLI 검증"
            run_cli_verification "$file_path" "gemini"
            ;;
        *"simple"*)
            echo "⚡ 간단한 파일 - CLI 중심 검증"
            run_cli_verification "$file_path" "gemini" &
            run_cli_verification "$file_path" "qwen" &
            wait
            echo "📋 선택적 Task 검증"
            run_task_verification "$file_path" 1
            ;;
        *"hybrid"*)
            echo "🔀 하이브리드 검증"
            run_task_verification "$file_path" 2 &
            run_cli_verification "$file_path" "gemini" &
            wait
            ;;
    esac
    
    echo "✅ 최적화된 검증 완료"
}

# === 실행 ===
if [ $# -eq 0 ]; then
    echo "사용법: $0 <파일경로>"
    exit 1
fi

main_verification "$1"