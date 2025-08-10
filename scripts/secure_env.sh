#!/bin/bash

# 환경 변수 파일 암호화/복호화 스크립트
# 사용법:
#   암호화: ./secure_env.sh encrypt [비밀번호] [소스_파일] [암호화_파일]
#   복호화: ./secure_env.sh decrypt [비밀번호] [암호화_파일] [출력_파일]

set -e

if [ $# -lt 4 ]; then
  echo "사용법: $0 [encrypt|decrypt] [비밀번호] [입력_파일] [출력_파일]"
  exit 1
fi

MODE=$1
PASSWORD=$2
INPUT_FILE=$3
OUTPUT_FILE=$4

if [ "$MODE" = "encrypt" ]; then
  # 파일 암호화 (AES-256-CBC 사용)
  openssl enc -aes-256-cbc -salt -in "$INPUT_FILE" -out "$OUTPUT_FILE" -pass pass:"$PASSWORD"
  echo "✅ $INPUT_FILE 이(가) 암호화되어 $OUTPUT_FILE 로 저장되었습니다."
  
elif [ "$MODE" = "decrypt" ]; then
  # 파일 복호화
  if [ -f "$INPUT_FILE" ]; then
    openssl enc -d -aes-256-cbc -in "$INPUT_FILE" -out "$OUTPUT_FILE" -pass pass:"$PASSWORD" 2>/dev/null || {
      echo "❌ 복호화 실패: 잘못된 비밀번호이거나 파일이 손상되었습니다."
      rm -f "$OUTPUT_FILE"
      exit 1
    }
    echo "✅ $INPUT_FILE 이(가) 복호화되어 $OUTPUT_FILE 로 저장되었습니다."
  else
    echo "❌ 오류: $INPUT_FILE 을(를) 찾을 수 없습니다."
    exit 1
  fi
else
  echo "❌ 잘못된 모드입니다. 'encrypt' 또는 'decrypt'를 지정해주세요."
  exit 1
fi
