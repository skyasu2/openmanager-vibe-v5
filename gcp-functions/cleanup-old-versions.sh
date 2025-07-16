#!/bin/bash

# 🧹 구버전 정리 스크립트
# Node.js 구버전 제거 및 Python 버전으로 완전 전환

set -e

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🧹 GCP Functions 구버전 정리 시작${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# 백업 디렉토리 생성
BACKUP_DIR="./backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}📦 구버전 파일 백업 중...${NC}"

# Node.js 구버전 백업
if [ -d "korean-nlp" ]; then
    echo -e "${YELLOW}  - korean-nlp (Node.js) 백업${NC}"
    cp -r korean-nlp $BACKUP_DIR/
fi

if [ -d "basic-ml" ]; then
    echo -e "${YELLOW}  - basic-ml (Node.js) 백업${NC}"
    cp -r basic-ml $BACKUP_DIR/
fi

echo -e "${GREEN}✅ 백업 완료: $BACKUP_DIR${NC}"

# 사용자 확인
echo ""
echo -e "${RED}⚠️  주의: 구버전 Node.js 함수를 삭제합니다!${NC}"
echo -e "${YELLOW}삭제될 디렉토리:${NC}"
echo -e "  - korean-nlp/ (Node.js 버전)"
echo -e "  - basic-ml/ (Node.js 버전)"
echo ""
echo -e "${GREEN}유지될 디렉토리:${NC}"
echo -e "  - korean-nlp-python/ (Python 버전)"
echo -e "  - basic-ml-python/ (Python 버전)"
echo -e "  - ai-gateway/ (유지)"
echo -e "  - rule-engine/ (유지)"
echo ""
read -p "계속하시겠습니까? (y/N): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}작업이 취소되었습니다.${NC}"
    exit 0
fi

# 구버전 삭제
echo ""
echo -e "${YELLOW}🗑️  구버전 삭제 중...${NC}"

if [ -d "korean-nlp" ]; then
    rm -rf korean-nlp
    echo -e "${GREEN}  ✅ korean-nlp (Node.js) 삭제 완료${NC}"
fi

if [ -d "basic-ml" ]; then
    rm -rf basic-ml
    echo -e "${GREEN}  ✅ basic-ml (Node.js) 삭제 완료${NC}"
fi

# GCP Functions 목록 확인
echo ""
echo -e "${YELLOW}🔍 GCP에 배포된 함수 목록 확인...${NC}"
if command -v gcloud &> /dev/null; then
    gcloud functions list --region=asia-northeast3 --format="table(name,runtime)" | grep -E "(korean-nlp|basic-ml)"
    
    echo ""
    echo -e "${YELLOW}💡 GCP에서 구버전 함수 삭제 명령어:${NC}"
    echo -e "  gcloud functions delete korean-nlp --region=asia-northeast3"
    echo -e "  gcloud functions delete basic-ml --region=asia-northeast3"
fi

# 현재 상태 확인
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}📊 정리 완료 상태${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}현재 디렉토리 구조:${NC}"
ls -la | grep -E "(korean-nlp|basic-ml|ai-gateway|rule-engine)" | awk '{print "  " $9}'

echo ""
echo -e "${GREEN}✅ 구버전 정리 완료!${NC}"
echo -e "${YELLOW}백업 위치: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Python 버전만 유지되었습니다.${NC}"