#\!/bin/bash
# cu 명령어 WSL 설정 스크립트

# 색상 정의
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🎯 cu 명령어 WSL 설정${NC}"
echo "=================================="

# 현재 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo "프로젝트 루트: $PROJECT_ROOT"

# 1. cu-wrapper.py 실행 권한 부여
echo -e "\n${YELLOW}1. 실행 권한 설정 중...${NC}"
chmod +x "$PROJECT_ROOT/scripts/cu-wrapper.py"
echo -e "${GREEN}✅ 실행 권한 설정 완료${NC}"

# 2. alias 등록
echo -e "\n${YELLOW}2. cu 명령어 Alias 설정 중...${NC}"

# 기존 cu alias 제거
sed -i '/# cu 명령어 별칭/,/^$/d' ~/.bashrc 2>/dev/null || true

# 새로운 alias 추가
echo "" >> ~/.bashrc
echo "# cu 명령어 별칭" >> ~/.bashrc
echo "alias cu='python3 $PROJECT_ROOT/scripts/cu-wrapper.py'" >> ~/.bashrc
echo "alias cu-live='python3 $PROJECT_ROOT/scripts/cu-wrapper.py --live'" >> ~/.bashrc
echo "alias cu-usage='python3 $PROJECT_ROOT/scripts/cu-wrapper.py --usage'" >> ~/.bashrc
echo "alias cu-json='python3 $PROJECT_ROOT/scripts/cu-wrapper.py --json'" >> ~/.bashrc
echo -e "${GREEN}✅ cu 명령어 Alias 추가 완료${NC}"

# 3. Python 의존성 확인
echo -e "\n${YELLOW}3. Python 환경 확인 중...${NC}"
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✅ Python3 설치 확인됨${NC}"
else
    echo -e "${RED}❌ Python3가 설치되지 않았습니다${NC}"
    echo "sudo apt update && sudo apt install python3"
fi

# 4. npx/ccusage 확인
echo -e "\n${YELLOW}4. ccusage 환경 확인 중...${NC}"
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✅ npx 설치 확인됨${NC}"
else
    echo -e "${RED}❌ npx가 설치되지 않았습니다${NC}"
    echo "Node.js를 설치하세요: curl -fsSL https://deb.nodesource.com/setup_18.x  < /dev/null |  sudo -E bash - && sudo apt-get install -y nodejs"
fi

# 5. 설정 완료
echo -e "\n${GREEN}✅ 모든 설정이 완료되었습니다!${NC}"
echo ""
echo -e "${BLUE}사용 가능한 명령어:${NC}"
echo "  ${YELLOW}cu${NC}          - 한글 모니터 + ccusage 정보 + 명령어 목록"
echo "  ${YELLOW}cu-live${NC}     - 실시간 한글 모니터링"
echo "  ${YELLOW}cu-usage${NC}    - ccusage 블록 정보만 표시"
echo "  ${YELLOW}cu-json${NC}     - JSON 형태 데이터 표시"
echo ""
echo -e "${YELLOW}💡 설정을 적용하려면:${NC}"
echo "  source ~/.bashrc"
echo "  또는 새 터미널 세션을 시작하세요"
echo ""
echo -e "${BLUE}테스트:${NC}"
echo "  ${YELLOW}cu-usage${NC}   - 지금 바로 테스트해보기"
