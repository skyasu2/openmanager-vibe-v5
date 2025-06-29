#!/bin/bash

# 베르셀 환경변수 설정 및 배포 스크립트
# 생성일: 2025. 6. 30. 오전 2:39:45 KST

echo "🔧 베르셀 환경변수 설정 시작..."

# Google AI 설정
vercel env add GOOGLE_AI_API_KEY production --value="AIzaSyABC2WATlHIG0Kd-Oj4JSL6wJoqMd3FhvM"
vercel env add GOOGLE_AI_ENABLED production --value="true"
vercel env add GOOGLE_AI_QUOTA_PROTECTION production --value="false"

# Supabase 설정
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value="https://vnswjnltnhpsueosfhmw.supabase.co"
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc5MjMzMjcsImV4cCI6MjA2MzQ5OTMyN30.09ApSnuXNv_yYVJWQWGpOFWw3tkLbxSA21k5sroChGU"
vercel env add SUPABASE_SERVICE_ROLE_KEY production --value="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZuc3dqbmx0bmhwc3Vlb3NmaG13Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NzkyMzMyNywiZXhwIjoyMDYzNDk5MzI3fQ.xk2DUcqBZnaF-iuO7sbeXS-H43h8D5gppIlsJYw7xi8"

# Redis 설정
vercel env add UPSTASH_REDIS_REST_URL production --value="https://charming-condor-46598.upstash.io"
vercel env add UPSTASH_REDIS_REST_TOKEN production --value="AbYGAAIjcDE5MjNmYjhiZDkwOGQ0MTUyOGFiZjUyMmQ0YTkyMzIwM3AxMA"

echo "✅ 환경변수 설정 완료"
echo "🚀 프로덕션 배포 시작..."

vercel --prod

echo "🎉 배포 완료!"
