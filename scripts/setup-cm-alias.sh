#!/bin/bash
# cm 명령어 alias 설정 스크립트

echo "🚀 cm 명령어 설정을 시작합니다..."

# 프로젝트 경로 찾기
PROJECT_DIR="/mnt/d/cursor/openmanager-vibe-v5"

# .bashrc 파일 경로
BASHRC="$HOME/.bashrc"

# alias 추가 함수
add_alias() {
    local alias_line="alias cm='cd $PROJECT_DIR && npm run cm'"
    
    # 이미 alias가 있는지 확인
    if grep -q "alias cm=" "$BASHRC"; then
        echo "⚠️  기존 cm alias를 업데이트합니다..."
        sed -i "/alias cm=/d" "$BASHRC"
    fi
    
    # alias 추가
    echo "" >> "$BASHRC"
    echo "# Claude Monitor 명령어 (Claude Code 사용량 모니터)" >> "$BASHRC"
    echo "$alias_line" >> "$BASHRC"
    echo "alias cm:once='cd $PROJECT_DIR && npm run cm:once'" >> "$BASHRC"
    echo "alias cm:compact='cd $PROJECT_DIR && npm run cm:compact'" >> "$BASHRC"
    echo "alias cm:live='cd $PROJECT_DIR && npm run cm:live'" >> "$BASHRC"
    echo "alias cm:pro='cd $PROJECT_DIR && npm run cm:pro'" >> "$BASHRC"
    echo "alias cm:max5='cd $PROJECT_DIR && npm run cm:max5'" >> "$BASHRC"
    
    echo "✅ alias가 ~/.bashrc에 추가되었습니다."
}

# alias 추가
add_alias

echo ""
echo "✨ 설정이 완료되었습니다!"
echo ""
echo "📌 다음 명령어를 실행하여 즉시 사용하세요:"
echo "   source ~/.bashrc"
echo ""
echo "또는 새 터미널을 열어서 사용하세요."
echo ""
echo "📚 사용 가능한 명령어:"
echo "   cm          - 사용 방법 안내 (현재 MAX20 플랜)"
echo "   cm:once     - 현재 사용량 확인 (한번만 실행)"
echo "   cm:live     - 실시간 모니터링 (Ctrl+C로 종료)"
echo "   cm:compact  - 간결 모드 (한번 실행)"
echo "   cm:pro      - Pro 플랜 모니터링"
echo "   cm:max5     - Max5 플랜 모니터링"