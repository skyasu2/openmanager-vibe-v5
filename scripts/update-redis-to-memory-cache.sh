#!/bin/bash

# Redis를 Memory Cache로 변경하는 스크립트
# 문서 파일들의 Redis 참조를 메모리 캐시로 업데이트

echo "🔄 Redis → Memory Cache 문서 업데이트 시작..."

# 변경할 파일들 찾기
files=$(find ./docs -name "*.md" -type f | xargs grep -l -i "redis\|upstash")

if [ -z "$files" ]; then
  echo "✅ Redis 참조가 있는 문서를 찾을 수 없습니다."
  exit 0
fi

echo "📄 다음 파일들을 업데이트합니다:"
echo "$files"
echo ""

# 각 파일에서 Redis 참조를 Memory Cache로 변경
for file in $files; do
  echo "📝 처리 중: $file"
  
  # 백업 생성
  cp "$file" "$file.bak"
  
  # Redis 관련 텍스트를 Memory Cache로 변경
  sed -i \
    -e 's/Redis/Memory Cache/g' \
    -e 's/redis/memory cache/g' \
    -e 's/REDIS/MEMORY_CACHE/g' \
    -e 's/Upstash Redis/Memory-based Cache/g' \
    -e 's/upstash redis/memory-based cache/g' \
    -e 's/Redis 클라이언트/메모리 캐시 클라이언트/g' \
    -e 's/Redis 서버/메모리 캐시 시스템/g' \
    -e 's/Redis 캐싱/메모리 기반 캐싱/g' \
    -e 's/Redis 의존성/메모리 캐시 구현/g' \
    -e 's/@redis/@memory-cache/g' \
    -e 's/ioredis/memory-cache/g' \
    -e 's/Redis Streams/메모리 스트림/g' \
    -e 's/Redis Pub\/Sub/메모리 이벤트 시스템/g' \
    -e 's/256MB Redis/메모리 캐시 (서버리스 최적화)/g' \
    "$file"
  
  # 특정 컨텍스트에서의 추가 변경
  sed -i \
    -e 's/외부 Redis 서비스/내장 메모리 캐시/g' \
    -e 's/Redis 연결/메모리 캐시 초기화/g' \
    -e 's/Redis 설정/메모리 캐시 설정/g' \
    -e 's/Redis 환경변수/메모리 캐시 환경변수/g' \
    "$file"
    
  # URL이나 패키지명은 보존
  sed -i \
    -e 's/https:\/\/memory-cache\.upstash\.io/메모리 기반 (외부 서비스 불필요)/g' \
    -e 's/"memory cache"/"@upstash\/memory cache" (제거됨)/g' \
    "$file"
    
  echo "✅ 완료: $file"
done

echo ""
echo "🎉 모든 문서 업데이트 완료!"
echo "💡 백업 파일들은 .bak 확장자로 저장되었습니다."
echo "🔍 변경사항을 검토하고 필요시 수정해주세요."