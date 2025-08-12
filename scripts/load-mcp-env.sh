#!/bin/bash
# MCP 환경변수 자동 로드 스크립트
# .env.local 파일에서 MCP 관련 환경변수를 읽어 export
#
# 사용법: source scripts/load-mcp-env.sh

# 스크립트 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/.env.local"

if [ -f "$ENV_FILE" ]; then
    echo "📋 Loading MCP environment variables from .env.local"
    echo "   Path: $ENV_FILE"
    echo ""
    
    # 로드할 변수 카운터
    loaded_count=0
    
    # .env.local 파일에서 MCP 관련 변수만 export
    while IFS='=' read -r key value; do
        # 주석과 빈 줄 건너뛰기
        if [[ $key =~ ^[[:space:]]*# ]] || [[ -z "$key" ]]; then
            continue
        fi
        
        # 따옴표 제거
        value="${value%\"}"
        value="${value#\"}"
        value="${value%\'}"
        value="${value#\'}"
        
        # MCP 관련 변수만 export
        case "$key" in
            TAVILY_API_KEY|SUPABASE_ACCESS_TOKEN|GITHUB_TOKEN|GOOGLE_AI_API_KEY|\
            SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|SUPABASE_PROJECT_REF|\
            NEXT_PUBLIC_SUPABASE_URL|NEXT_PUBLIC_SUPABASE_ANON_KEY|\
            SUPABASE_JWT_SECRET|SUPABASE_DB_PASSWORD)
                export "$key=$value"
                
                # 값 마스킹하여 표시
                if [ ${#value} -gt 10 ]; then
                    masked_value="${value:0:10}..."
                else
                    masked_value="***"
                fi
                
                echo "  ✅ $key configured ($masked_value)"
                ((loaded_count++))
                ;;
        esac
    done < "$ENV_FILE"
    
    echo ""
    echo "✨ Loaded $loaded_count MCP environment variables successfully!"
    
    # 중요 변수 확인
    echo ""
    echo "📊 MCP Server Status:"
    
    if [ ! -z "$TAVILY_API_KEY" ]; then
        echo "  ✅ Tavily MCP: Ready (Web Search enabled)"
    else
        echo "  ⚠️  Tavily MCP: API key not set"
    fi
    
    if [ ! -z "$SUPABASE_ACCESS_TOKEN" ]; then
        echo "  ✅ Supabase MCP: Ready (Database access enabled)"
    else
        echo "  ⚠️  Supabase MCP: Access token not set"
    fi
    
    if [ ! -z "$GITHUB_TOKEN" ]; then
        echo "  ✅ GitHub MCP: Ready (Repository access enabled)"
    else
        echo "  ℹ️  GitHub MCP: Token not set (optional)"
    fi
    
else
    echo "⚠️ .env.local file not found!"
    echo ""
    echo "Please create .env.local from .env.example:"
    echo "  1. cp .env.example .env.local"
    echo "  2. Edit .env.local and add your API keys"
    echo ""
    echo "Required API keys for MCP servers:"
    echo "  - TAVILY_API_KEY: Get from https://tavily.com"
    echo "  - SUPABASE_ACCESS_TOKEN: Get from Supabase dashboard > Account > Access Tokens"
    echo "  - GITHUB_TOKEN (optional): Get from GitHub Settings > Developer settings"
    
    return 1 2>/dev/null || exit 1
fi