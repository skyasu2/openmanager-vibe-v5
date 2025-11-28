#!/bin/bash
# WSL 재설치 시 패키지 복원을 위한 스냅샷 생성 스크립트
# 작성일: 2025-11-28

# 엄격 모드: 에러 발생 시 즉시 종료
set -euo pipefail

# 에러 발생 시 자동 처리
trap 'echo "❌ 스냅샷 생성 중 오류 발생 (라인: $LINENO)"; exit 1' ERR

# 타임스탬프 기반 백업 디렉토리 생성
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
OUTPUT_DIR="$HOME/wsl-restore-backup-$TIMESTAMP"
mkdir -p "$OUTPUT_DIR" || {
  echo "❌ 백업 디렉토리 생성 실패: $OUTPUT_DIR"
  exit 1
}

echo "📦 WSL 패키지 스냅샷 생성 중..."
echo "저장 위치: $OUTPUT_DIR"
echo ""

# 1. apt 패키지 목록
echo "1️⃣ apt 패키지 목록 저장..."
dpkg --get-selections > "$OUTPUT_DIR/apt-packages.txt"
echo "   ✅ apt-packages.txt ($(wc -l < "$OUTPUT_DIR/apt-packages.txt")개 패키지)"

# 2. npm 글로벌 패키지 목록
echo "2️⃣ npm 글로벌 패키지 목록 저장..."
npm list -g --depth=0 --json > "$OUTPUT_DIR/npm-global-packages.json" 2>/dev/null
npm list -g --depth=0 > "$OUTPUT_DIR/npm-global-packages.txt" 2>/dev/null
echo "   ✅ npm-global-packages.json"

# 3. nvm 버전 정보
echo "3️⃣ Node.js 버전 정보 저장..."
if command -v nvm &> /dev/null; then
    nvm ls > "$OUTPUT_DIR/nvm-versions.txt"
    node --version > "$OUTPUT_DIR/node-version.txt"
    npm --version > "$OUTPUT_DIR/npm-version.txt"
    echo "   ✅ Node.js $(cat "$OUTPUT_DIR/node-version.txt"), npm $(cat "$OUTPUT_DIR/npm-version.txt")"
fi

# 4. Rust/Cargo 패키지 목록
echo "4️⃣ Rust/Cargo 패키지 목록 저장..."
if command -v cargo &> /dev/null; then
    cargo install --list > "$OUTPUT_DIR/cargo-packages.txt"
    rustc --version > "$OUTPUT_DIR/rust-version.txt"
    echo "   ✅ Rust $(cat "$OUTPUT_DIR/rust-version.txt")"
fi

# 5. Python/uv 패키지 목록
echo "5️⃣ Python/uv 패키지 목록 저장..."
if command -v uv &> /dev/null; then
    uv --version > "$OUTPUT_DIR/uv-version.txt"
    echo "   ✅ uv $(cat "$OUTPUT_DIR/uv-version.txt")"
fi
if command -v python3 &> /dev/null; then
    python3 --version > "$OUTPUT_DIR/python-version.txt"
    pip3 list > "$OUTPUT_DIR/pip-packages.txt" 2>/dev/null
    echo "   ✅ Python $(cat "$OUTPUT_DIR/python-version.txt")"
fi

# 6. PM2 프로세스 목록
echo "6️⃣ PM2 프로세스 목록 저장..."
if command -v pm2 &> /dev/null; then
    pm2 list > "$OUTPUT_DIR/pm2-processes.txt" 2>/dev/null
    pm2 save --force 2>/dev/null
    cp ~/.pm2/dump.pm2 "$OUTPUT_DIR/pm2-dump.pm2" 2>/dev/null
    echo "   ✅ PM2 dump.pm2"
fi

# 7. 환경 변수 (.bashrc, .zshrc 백업)
echo "7️⃣ 환경 변수 및 설정 파일 백업..."
cp ~/.bashrc "$OUTPUT_DIR/bashrc.backup" 2>/dev/null
cp ~/.zshrc "$OUTPUT_DIR/zshrc.backup" 2>/dev/null
cp ~/.profile "$OUTPUT_DIR/profile.backup" 2>/dev/null
echo "   ✅ Shell 설정 파일 백업"

# 8. Git 설정
echo "8️⃣ Git 설정 백업..."
git config --global --list > "$OUTPUT_DIR/git-config.txt" 2>/dev/null
echo "   ✅ git-config.txt"

# 9. SSH 키 (경로만 기록, 실제 키는 안전한 곳에 별도 보관)
echo "9️⃣ SSH 키 경로 기록..."
if [ -d ~/.ssh ]; then
    ls -la ~/.ssh > "$OUTPUT_DIR/ssh-keys-list.txt"
    echo "   ⚠️  실제 SSH 키는 안전한 곳에 별도 백업하세요!"
fi

# 10. .wslconfig 파일 (Windows 측)
echo "🔟 .wslconfig 파일 복사..."
if [ -f /mnt/c/Users/$(whoami)/.wslconfig ]; then
    cp /mnt/c/Users/$(whoami)/.wslconfig "$OUTPUT_DIR/wslconfig.backup"
    echo "   ✅ .wslconfig 백업"
else
    echo "   ⚠️  .wslconfig 파일 없음"
fi

echo ""
echo "✅ 스냅샷 생성 완료!"
echo "📁 저장 위치: $OUTPUT_DIR"
echo ""
echo "📋 생성된 파일 목록:"
ls -lh "$OUTPUT_DIR"
echo ""
echo "💡 다음 단계:"
echo "   1. $OUTPUT_DIR 폴더를 안전한 곳에 백업하세요"
echo "   2. Windows 파일 시스템으로 복사: cp -r $OUTPUT_DIR /mnt/c/wsl-backup/"
echo "   3. SSH 키 (~/.ssh)는 별도로 안전하게 백업하세요"
