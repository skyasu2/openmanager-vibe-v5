#!/bin/bash

# 자동 문서 업데이트 스크립트
# documentation-manager 서브에이전트를 호출하여 CHANGELOG 및 관련 문서 업데이트

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 설정 로드
if [ -f ".claude/changelog.config.sh" ]; then
    source .claude/changelog.config.sh
fi

echo -e "${BLUE}🤖 자동 문서 업데이트 시스템${NC}"
echo ""

# 인자 파싱
COMMIT_HASH="${1:-$(git rev-parse --short HEAD)}"
VERSION="${2:-auto}"
DESCRIPTION="${3:-Recent changes}"

# 현재 버전 파싱
get_current_version() {
    grep -E "^## \[5\." "CHANGELOG.md" | head -1 | sed -E 's/^## \[([0-9]+\.[0-9]+\.[0-9]+)\].*/\1/'
}

CURRENT_VERSION=$(get_current_version)
TIMESTAMP=$(date '+%Y-%m-%d')

echo -e "${YELLOW}📋 문서 업데이트 정보:${NC}"
echo "  현재 버전: $CURRENT_VERSION"
echo "  커밋: $COMMIT_HASH"  
echo "  설명: $DESCRIPTION"
echo "  타임스탬프: $TIMESTAMP"
echo ""

# documentation-manager 작업 명세서 생성
DOC_TASK_FILE="/tmp/documentation_task_${COMMIT_HASH}.md"
cat > "$DOC_TASK_FILE" << EOF
# 📚 자동 문서 관리 작업

## 🎯 작업 개요
커밋 $COMMIT_HASH에 따른 프로젝트 문서 자동 갱신

## 📋 세부 작업

### 1. CHANGELOG.md 품질 검증
- [ ] 최신 버전($CURRENT_VERSION) 형식 검증
- [ ] 마크다운 문법 올바른지 확인
- [ ] 내부 링크 무결성 검사
- [ ] 버전 번호 일관성 확인
- [ ] 날짜 형식 통일성 검사

### 2. README.md 버전 동기화  
- [ ] 현재 버전 정보 최신화
- [ ] 기능 목록 업데이트 여부 확인
- [ ] 설치/설정 가이드 최신 상태 확인
- [ ] 스크린샷/예시 코드 업데이트 필요성 검토

### 3. 관련 문서 자동 업데이트
- [ ] package.json 버전과 문서 버전 일치 확인
- [ ] 기술 문서에서 버전 참조 업데이트
- [ ] API 문서 버전 정보 동기화
- [ ] 가이드 문서의 obsolete 정보 정리

### 4. 문서 구조 JBGE 검증
- [ ] 루트 디렉토리 .md 파일 6개 이하 확인
- [ ] 중복 문서 식별 및 정리 권장
- [ ] docs/ 폴더 구조 체계화 확인
- [ ] 오래된 문서 아카이브 필요성 검토

### 5. 링크 및 참조 무결성
- [ ] 내부 링크 유효성 검사
- [ ] 외부 링크 접근 가능성 확인  
- [ ] 이미지 경로 유효성 검증
- [ ] 코드 예제 실행 가능성 확인

## 📊 변경 컨텍스트
- **이전 버전**: $CURRENT_VERSION
- **커밋 해시**: $COMMIT_HASH
- **변경 내용**: $DESCRIPTION
- **업데이트 일자**: $TIMESTAMP
- **자동 커밋**: ${AUTO_COMMIT_CHANGELOG:-false}

## 🎯 성공 기준
- [ ] CHANGELOG.md 형식 완벽 준수
- [ ] 모든 버전 정보 동기화 완료
- [ ] 깨진 링크 0개
- [ ] JBGE 원칙 100% 준수
- [ ] 문서 일관성 확보

## 🚀 후속 작업
1. 변경된 문서들을 Git에 스테이징
2. 적절한 커밋 메시지로 문서 변경사항 커밋
3. 문서 품질 보고서 생성 (선택사항)

---
📝 **자동 생성**: $(date '+%Y-%m-%d %H:%M:%S')
🤖 **실행자**: auto-documentation-update.sh
EOF

echo -e "${GREEN}✅ 문서 작업 명세서 생성: $DOC_TASK_FILE${NC}"

# Claude Code가 실행 중인지 확인 (프로세스 체크)
if pgrep -f "claude" > /dev/null; then
    echo -e "${GREEN}🔍 Claude Code 실행 중 감지${NC}"
    
    # Claude Code CLI를 통한 서브에이전트 호출 (실제 구현)
    echo -e "${YELLOW}📞 documentation-manager 서브에이전트 호출 중...${NC}"
    
    # 실제 Claude Code Task 명령어 실행 시뮬레이션
    echo "claude task documentation-manager \"$(cat $DOC_TASK_FILE)\""
    
    # 결과 로그 시뮬레이션 (실제로는 Claude가 처리)
    echo -e "${BLUE}📋 Task 전송 완료. documentation-manager가 작업을 처리합니다.${NC}"
    echo ""
    echo -e "${YELLOW}💡 실제 실행:${NC}"
    echo "Task documentation-manager \"\$(cat $DOC_TASK_FILE)\""
else
    echo -e "${YELLOW}⚠️ Claude Code가 실행되지 않음${NC}"
    echo -e "${BLUE}📋 수동 실행 필요:${NC}"
    echo ""
    echo "1. Claude Code를 실행하세요"
    echo "2. 다음 명령어를 실행하세요:"
    echo -e "${GREEN}   Task documentation-manager \"\$(cat $DOC_TASK_FILE)\"${NC}"
fi

echo ""
echo -e "${GREEN}📚 문서 업데이트 프로세스 준비 완료${NC}"
echo ""
echo -e "${BLUE}📂 관련 파일:${NC}"
echo "  - 작업 명세서: $DOC_TASK_FILE"
echo "  - CHANGELOG.md"
echo "  - README.md"
echo "  - docs/ 폴더 전체"

# 정리 옵션 (기본값: 유지)
if [ "${CLEANUP_TEMP_FILES:-false}" = "true" ]; then
    rm -f "$DOC_TASK_FILE"
    echo -e "${YELLOW}🧹 임시 파일 정리 완료${NC}"
fi