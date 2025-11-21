#!/bin/bash

# Claude Code 터미널 스크롤 문제 해결 스크립트
# WSL 환경에서 발생하는 스크롤 점프 현상 완화

echo "🔧 Claude Code 터미널 스크롤 최적화 스크립트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. 터미널 환경 변수 최적화
setup_terminal_env() {
    echo "📋 1단계: 터미널 환경 변수 설정 중..."
    
    # ANSI 색상 처리 최적화
    export TERM=xterm-256color
    export WSL_UTF8=1
    export COLORTERM=truecolor
    
    # Node.js 메모리 및 출력 최적화
    export NODE_OPTIONS="--max-old-space-size=4096 --no-warnings"
    export NODE_NO_READLINE=1
    
    # 터미널 버퍼링 최적화
    export PYTHONUNBUFFERED=1
    export RUST_BACKTRACE=0
    
    echo "   ✅ 환경 변수 설정 완료"
}

# 2. TTY 설정 안정화
stabilize_tty() {
    echo "⚙️  2단계: TTY 설정 안정화 중..."
    
    # TTY 에코 제어 (스크롤 간섭 방지)
    stty -echo 2>/dev/null || echo "   ⚠️  TTY echo 제어 실패 (정상적일 수 있음)"
    
    # 터미널 상태 정상화
    stty sane 2>/dev/null || echo "   ⚠️  TTY sane 설정 실패 (정상적일 수 있음)"
    
    # 입력 버퍼 클리어
    read -t 0.01 -n 1000000 discard 2>/dev/null || true
    
    echo "   ✅ TTY 안정화 완료"
}

# 3. Windows Terminal 설정 확인
check_terminal_settings() {
    echo "🖥️  3단계: 터미널 환경 점검 중..."
    
    if [[ "$WSL_DISTRO_NAME" ]]; then
        echo "   📍 WSL 환경 감지: $WSL_DISTRO_NAME"
        echo "   📏 터미널 크기: $(tput cols)x$(tput lines)"
        
        # Windows Terminal 최적화 권장사항 출력
        cat << 'EOF'
   💡 Windows Terminal 최적화 권장사항:
      - Settings → Profiles → Defaults → Advanced
      - "Snap on input" 비활성화
      - "Scrollbar visibility" → Hidden
      - GPU 가속 활성화
EOF
    else
        echo "   📍 네이티브 Linux 환경"
    fi
    
    echo "   ✅ 환경 점검 완료"
}

# 4. Claude Code 래퍼 함수
run_claude_stable() {
    echo "🤖 4단계: Claude Code 안정 모드 실행 중..."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Claude Code 실행 (인수 전달)
    if command -v claude >/dev/null 2>&1; then
        claude "$@"
        local exit_code=$?
    else
        echo "❌ 오류: claude 명령을 찾을 수 없습니다."
        echo "   Claude Code가 설치되어 있는지 확인해주세요."
        return 1
    fi
    
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    return $exit_code
}

# 5. 실행 후 정리
cleanup_terminal() {
    echo "🧹 5단계: 터미널 상태 복구 중..."
    
    # TTY 상태 복구
    stty echo 2>/dev/null || true
    
    # 입력 버퍼 최종 클리어
    read -t 0.01 -n 1000000 discard 2>/dev/null || true
    
    echo "   ✅ 터미널 상태 복구 완료"
}

# 스크립트 실행 함수
main() {
    setup_terminal_env
    stabilize_tty  
    check_terminal_settings
    run_claude_stable "$@"
    local exit_code=$?
    cleanup_terminal
    
    echo "🎯 Claude Code 터미널 최적화 실행 완료 (종료 코드: $exit_code)"
    return $exit_code
}

# 스크립트가 직접 실행될 때만 main 함수 호출
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi