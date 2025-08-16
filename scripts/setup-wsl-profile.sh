#!/bin/bash
# WSL bash 프로필 설정 스크립트
# .env.local 파일의 한국어 주석 문제 해결

set -e

echo "=== WSL Bash 프로필 설정 ==="

# 프로젝트 루트 경로
PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"
BASHRC_FILE="$HOME/.bashrc"

# 백업 생성
if [ -f "$BASHRC_FILE" ]; then
    cp "$BASHRC_FILE" "$BASHRC_FILE.backup.$(date +%Y%m%d-%H%M%S)"
    echo "✅ 기존 .bashrc 백업 완료"
fi

# 프로젝트 관련 설정 추가
cat >> "$BASHRC_FILE" << 'EOF'

# ========================================
# OpenManager Vibe v5 프로젝트 설정
# ========================================

# 프로젝트 루트 경로
export PROJECT_ROOT="/mnt/d/cursor/openmanager-vibe-v5"

# 프로젝트로 이동하는 함수
proj() {
    cd "$PROJECT_ROOT"
    echo "📁 프로젝트 루트로 이동: $PROJECT_ROOT"
}

# 안전한 환경변수 로딩 함수
load-env() {
    if [ -f "$PROJECT_ROOT/scripts/load-env-wsl.sh" ]; then
        source "$PROJECT_ROOT/scripts/load-env-wsl.sh"
    else
        echo "❌ 환경변수 로딩 스크립트를 찾을 수 없습니다"
    fi
}

# 프로젝트 상태 확인 함수
proj-status() {
    echo "=== 프로젝트 상태 ==="
    echo "📁 현재 위치: $(pwd)"
    echo "🏠 프로젝트 루트: $PROJECT_ROOT"
    
    if [ -d "$PROJECT_ROOT" ]; then
        echo "✅ 프로젝트 루트 접근 가능"
        
        # Git 상태
        if [ -d "$PROJECT_ROOT/.git" ]; then
            cd "$PROJECT_ROOT"
            echo "🌿 Git 브랜치: $(git branch --show-current 2>/dev/null || echo '알 수 없음')"
        fi
        
        # Node.js 버전
        if command -v node >/dev/null 2>&1; then
            echo "🟢 Node.js: $(node --version)"
        fi
        
        # 환경변수 상태
        if [ ! -z "$SUPABASE_URL" ]; then
            echo "🔧 환경변수: 로드됨"
        else
            echo "⚠️  환경변수: 미로드 (load-env 실행 필요)"
        fi
    else
        echo "❌ 프로젝트 루트에 접근할 수 없습니다"
    fi
}

# 유용한 별칭
alias ll='ls -la'
alias la='ls -A'
alias l='ls -CF'
alias ..='cd ..'
alias ...='cd ../..'

# WSL 시작 시 프로젝트 루트로 이동 (선택사항)
# 주석을 해제하면 WSL 시작 시 자동으로 프로젝트 폴더로 이동
# if [ "$PWD" = "$HOME" ] && [ -d "$PROJECT_ROOT" ]; then
#     cd "$PROJECT_ROOT"
#     echo "🚀 프로젝트 루트로 자동 이동"
# fi

echo "🎉 OpenManager Vibe v5 프로젝트 환경 준비 완료!"
echo "💡 사용 가능한 명령어: proj, load-env, proj-status"

EOF

echo "✅ .bashrc 설정 완료"
echo ""
echo "🔄 설정 적용을 위해 다음 중 하나를 실행하세요:"
echo "   1. 새 터미널 열기"
echo "   2. source ~/.bashrc"
echo ""
echo "💡 사용 가능한 명령어:"
echo "   proj        - 프로젝트 루트로 이동"
echo "   load-env    - 환경변수 안전 로딩"
echo "   proj-status - 프로젝트 상태 확인"