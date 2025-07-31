#!/bin/bash

# GitHub 토큰 읽기
TOKEN=$(grep "GITHUB_PERSONAL_ACCESS_TOKEN=" .env.local | head -1 | cut -d'=' -f2)

if [ -z "$TOKEN" ]; then
    echo "Error: GitHub token not found in .env.local"
    exit 1
fi

echo "Pushing to GitHub with force..."
git push https://skyasu2:${TOKEN}@github.com/skyasu2/openmanager-vibe-v5.git main --force

echo "Push completed!"