#!/bin/bash

# Claude CLI 캐시 정리 스크립트
# WSL 환경에서 Claude CLI 캐시를 안전하게 정리합니다

echo "🧹 Claude CLI 캐시 정리 시작..."

# WSL 환경 확인
if [[ -n "$WSL_DISTRO_NAME" ]]; then
    echo "✅ WSL 환경 감지: $WSL_DISTRO_NAME"
else
    echo "⚠️  WSL 환경이 아닙니다. 스크립트를 종료합니다."
    exit 1
fi

# 캐시 디렉토리 경로
CACHE_DIR="$HOME/.cache/claude-cli-nodejs"

if [[ -d "$CACHE_DIR" ]]; then
    echo "📁 캐시 디렉토리 발견: $CACHE_DIR"
    
    # 캐시 크기 확인
    CACHE_SIZE=$(du -sh "$CACHE_DIR" 2>/dev/null | cut -f1)
    echo "📊 현재 캐시 크기: $CACHE_SIZE"
    
    # 사용자 확인
    read -p "🗑️  캐시를 정리하시겠습니까? (y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # 백업 생성 (선택사항)
        BACKUP_DIR="$HOME/.cache/claude-cli-nodejs-backup-$(date +%Y%m%d-%H%M%S)"
        echo "💾 백업 생성 중: $BACKUP_DIR"
        cp -r "$CACHE_DIR" "$BACKUP_DIR"
        
        # 캐시 정리
        rm -rf "$CACHE_DIR"
        echo "✅ 캐시 정리 완료!"
        echo "📦 백업 위치: $BACKUP_DIR"
        echo "💡 백업이 필요 없다면 다음 명령으로 삭제하세요:"
        echo "   rm -rf $BACKUP_DIR"
    else
        echo "❌ 캐시 정리를 취소했습니다."
    fi
else
    echo "ℹ️  Claude CLI 캐시 디렉토리가 없습니다."
fi

echo "🏁 스크립트 완료!"