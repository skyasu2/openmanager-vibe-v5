#!/bin/bash

# Load environment variables from .env.local for MCP servers
# This script safely loads required environment variables without exposing values

ENV_FILE="/mnt/d/cursor/openmanager-vibe-v5/.env.local"

if [ -f "$ENV_FILE" ]; then
    # Export only the required MCP environment variables
    export $(grep -E "^(SUPABASE_ACCESS_TOKEN|CONTEXT7_API_KEY)" "$ENV_FILE" | xargs)
    echo "✅ MCP environment variables loaded successfully"
else
    echo "❌ Error: .env.local file not found at $ENV_FILE"
    exit 1
fi