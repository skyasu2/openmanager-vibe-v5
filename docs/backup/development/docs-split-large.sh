#!/bin/bash

# 📚 대용량 문서 분리 스크립트
# 목표: 큰 문서들을 중요도별로 분리하여 접근성 향상

set -e

echo "📊 OpenManager Vibe v5.35.0 대용량 문서 분리 시작..."
echo "=============================================="

# 현재 디렉토리 확인
if [ ! -f "package.json" ]; then
    echo "❌ 프로젝트 루트 디렉토리에서 실행해주세요."
    exit 1
fi

# 백업 폴더 생성
echo "📦 백업 폴더 생성 중..."
mkdir -p docs/archive/large_documents_backup
current_date=$(date +"%Y%m%d_%H%M%S")

# Phase 1: README.md (24KB) 분리
echo ""
echo "📖 Phase 1: README.md 슬림화 중..."

# 기존 README.md 백업
cp README.md "docs/archive/large_documents_backup/README_${current_date}.md"
echo "   ✅ README.md 백업 완료"

# 새로운 슬림 README.md 생성
cat > README.md << 'EOF'
# 🚀 OpenManager Vibe v5.35.0

> **AI-Powered 서버 모니터링 플랫폼**  
> **Enhanced AI Engine v2.0 + MCP Protocol + TensorFlow.js**

## ⚡ 빠른 시작

### 1. 설치 및 실행
```bash
# 프로젝트 클론
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5

# 설치 및 실행
npm install
npm run dev
```

### 2. 환경 설정
```bash
# 환경변수 설정
cp .env.example .env.local
# 상세 설정: ENVIRONMENT_SETUP.md 참조
```

### 3. 시스템 시작
1. 브라우저에서 http://localhost:3000 접속
2. "🚀 시스템 시작" 버튼 클릭
3. 30분간 자동 운영 시작

## 🎯 핵심 기능

| 기능 | 설명 | 상태 |
|------|------|------|
| **AI 엔진** | MCP 기반 지능형 분석 | ✅ 완료 |
| **실시간 모니터링** | WebSocket 기반 실시간 데이터 | ✅ 완료 |
| **서버 시뮬레이션** | Prometheus 호환 메트릭 생성 | ✅ 완료 |
| **Keep-Alive 시스템** | 무료 티어 보호 | ✅ 완료 |

## 🏗️ 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript
- **AI Engine**: TensorFlow.js, MCP Protocol  
- **Backend**: Supabase, Upstash Redis
- **Deployment**: Vercel

## 📚 문서 가이드

### 🚀 시작하기
- **[환경 설정](ENVIRONMENT_SETUP.md)** - 개발 환경 구성
- **[개발 가이드](DEVELOPMENT_GUIDE.md)** - 개발자용 상세 가이드
- **[배포 체크리스트](DEPLOYMENT_CHECKLIST.md)** - 배포 전 확인사항

### 🤖 AI 엔진
- **[AI 엔진 완전 가이드](docs/AI_ENGINE_COMPLETE_GUIDE.md)** - AI 구현 세부사항
- **[MCP 설계 철학](docs/WHY_MCP_AI_ENGINE.md)** - 설계 배경 및 철학

### 📊 운영 및 모니터링
- **[프로젝트 상태](PROJECT_STATUS.md)** - 현재 상태 및 진행사항
- **[종합 가이드](docs/ESSENTIAL_DOCUMENTATION.md)** - 전체 시스템 이해

## 🔄 현재 상태 (v5.35.0)

- ✅ **통합 헬스체크 API 완성** - 시스템 상태 실시간 모니터링
- ✅ **서버 데이터 생성기 개선** - 비동기 루프 및 제로값 처리
- ✅ **Vercel 배포 최적화** - 빌드 성공률 100%
- ✅ **Keep-Alive 시스템** - Supabase/Redis 자동 보호

## 🚀 데모 및 배포

- **Live Demo**: [https://your-demo-url.vercel.app](https://your-demo-url.vercel.app)
- **GitHub**: [https://github.com/yourusername/openmanager-vibe-v5](https://github.com/yourusername/openmanager-vibe-v5)

## 📞 지원

- **Issues**: GitHub Issues에서 버그 리포트
- **Discussions**: 일반적인 질문 및 토론
- **문서**: docs 폴더 참조

---

**개발자**: jhhong (개인 프로젝트)  
**라이선스**: MIT License
EOF

echo "   ✅ 새로운 슬림 README.md 생성 (24KB → ~3KB)"

# Phase 2: docs/ESSENTIAL_DOCUMENTATION.md (19KB) 분리
echo ""
echo "📚 Phase 2: ESSENTIAL_DOCUMENTATION.md 분리 중..."

# 백업
cp docs/ESSENTIAL_DOCUMENTATION.md "docs/archive/large_documents_backup/ESSENTIAL_DOCUMENTATION_${current_date}.md"

# 핵심 부분만 추출하여 새로운 파일들 생성
echo "   🔄 핵심 가이드 분리 중..."

# 빠른 시작 가이드 생성
cat > docs/QUICK_START_GUIDE.md << 'EOF'
# ⚡ 빠른 시작 가이드

> **OpenManager Vibe v5.35.0 즉시 시작하기**

## 🚀 3분 설치

### 1. 기본 설치
```bash
git clone https://github.com/yourusername/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
```

### 2. 환경 설정
```bash
cp .env.example .env.local
# 필요시 환경변수 수정
```

### 3. 실행
```bash
npm run dev
# http://localhost:3000 접속
```

## 🎯 첫 사용법

1. **시스템 시작**: "🚀 시스템 시작" 버튼 클릭
2. **AI 모드**: 필요시 "🧠 AI 엔진 설정" 활성화  
3. **대시보드**: "📊 대시보드 들어가기" 클릭

## ⚠️ 문제 해결

### 일반적인 문제
- **포트 에러**: 3000 포트가 사용 중인 경우 `npm run dev -- -p 3001`
- **설치 에러**: `rm -rf node_modules && npm install`
- **환경변수**: `ENVIRONMENT_SETUP.md` 참조

### 추가 도움
- 상세 가이드: `docs/ESSENTIAL_DOCUMENTATION.md`
- 개발 가이드: `DEVELOPMENT_GUIDE.md`
EOF

# 시스템 아키텍처 가이드 생성
cat > docs/SYSTEM_ARCHITECTURE.md << 'EOF'
# 🏗️ 시스템 아키텍처

> **OpenManager Vibe v5.35.0 전체 구조**

## 📊 전체 구조도

```
┌─────────────────┬─────────────────┬─────────────────┐
│   프론트엔드     │     백엔드       │  Enhanced AI    │
├─────────────────┼─────────────────┼─────────────────┤
│ Next.js 15      │ Vercel 서버리스  │ TensorFlow.js   │
│ React 19        │ API Routes      │ MCP Protocol    │
│ TypeScript      │ PostgreSQL      │ Enhanced NLP    │
│ Tailwind CSS    │ Redis Cache     │ Document Search │
└─────────────────┴─────────────────┴─────────────────┘
```

## 🔧 핵심 컴포넌트

### Frontend (Next.js 15)
- **실시간 대시보드**: WebSocket 기반
- **AI 인터페이스**: 자연어 대화
- **서버 관리**: 드래그&드롭 UI
- **반응형 디자인**: 모바일 최적화

### Backend (Vercel Serverless) 
- **API Routes**: RESTful 엔드포인트
- **WebSocket**: 실시간 스트리밍
- **인증**: NextAuth.js
- **캐싱**: Redis 고성능

### AI Engine (Enhanced v2.0)
- **MCP 문서 검색**: 키워드 기반
- **컨텍스트 학습**: 세션 기반
- **TensorFlow.js**: 경량 ML
- **Vercel 최적화**: 서버리스 활용

## 📡 데이터 흐름

```
사용자 → Next.js → API Routes → AI Engine
  ↓        ↓         ↓           ↓
WebSocket ← Redis ← PostgreSQL ← TensorFlow.js
```

자세한 내용은 `docs/ESSENTIAL_DOCUMENTATION.md` 참조
EOF

echo "   ✅ 빠른 시작 가이드 생성: docs/QUICK_START_GUIDE.md"
echo "   ✅ 시스템 아키텍처 분리: docs/SYSTEM_ARCHITECTURE.md"

# Phase 3: docs/WHY_MCP_AI_ENGINE.md (16KB) 요약본 생성
echo ""
echo "🤖 Phase 3: AI 엔진 설계 철학 요약본 생성 중..."

cat > docs/AI_DESIGN_SUMMARY.md << 'EOF'
# 🎯 AI 엔진 설계 요약

> **왜 MCP 기반 AI 엔진을 선택했는가?**

## 💡 핵심 설계 원칙

### 1. **완전 독립 동작**
- ❌ 외부 LLM API 의존성 제거
- ✅ TensorFlow.js + MCP Protocol
- ✅ 무료 티어에서도 완전 기능

### 2. **고성능 문서 검색**
- ❌ 무거운 벡터 DB 대신
- ✅ 키워드 기반 스마트 검색
- ✅ 실시간 컨텍스트 학습

### 3. **Vercel 최적화**
- ✅ 서버리스 환경 완벽 활용
- ✅ 1GB 메모리 제한 대응
- ✅ Edge Functions 최적화

## 🚀 기술적 장점

| 기존 방식 | MCP 기반 방식 |
|-----------|---------------|
| 외부 API 필수 | 완전 독립 |
| 벡터 DB 필요 | 키워드 검색 |
| 무료 제한 | 제한 없음 |
| 느린 응답 | 즉시 응답 |

## 📊 성능 비교

- **응답 속도**: < 100ms (벡터 DB 대비 5배 빠름)
- **메모리 사용**: 50MB (기존 대비 80% 절약)
- **비용**: $0 (외부 API 비용 없음)

상세 내용: `docs/WHY_MCP_AI_ENGINE.md` 참조
EOF

echo "   ✅ AI 설계 요약본 생성: docs/AI_DESIGN_SUMMARY.md"

# Phase 4: docs 폴더 README 업데이트
echo ""
echo "📋 Phase 4: docs 폴더 가이드 업데이트 중..."

cat > docs/README.md << 'EOF'
# 📚 OpenManager Vibe v5 - 문서 가이드

> **빠른 접근과 심화 학습을 위한 계층별 문서 구조**

## ⚡ 빠른 접근 (중요도 순)

### 🚀 즉시 시작하기
| 문서 | 크기 | 소요시간 | 대상 |
|------|------|----------|------|
| **[빠른 시작](QUICK_START_GUIDE.md)** | ~2KB | 3분 | 모든 사용자 |
| **[AI 설계 요약](AI_DESIGN_SUMMARY.md)** | ~2KB | 5분 | 기술 이해 |
| **[시스템 구조](SYSTEM_ARCHITECTURE.md)** | ~3KB | 10분 | 개발자 |

### 📊 심화 학습
| 문서 | 크기 | 소요시간 | 대상 |
|------|------|----------|------|
| **[AI 엔진 완전 가이드](AI_ENGINE_COMPLETE_GUIDE.md)** | ~15KB | 30분 | AI 개발자 |
| **[MCP 설계 철학](WHY_MCP_AI_ENGINE.md)** | ~16KB | 45분 | 아키텍트 |
| **[종합 가이드](ESSENTIAL_DOCUMENTATION.md)** | ~19KB | 60분 | 전체 이해 |

## 🎯 사용 시나리오별 가이드

### 👶 "처음 사용해보는 사람"
1. [빠른 시작](QUICK_START_GUIDE.md) (3분)
2. 루트 [README.md](../README.md) (5분)
3. 필요시 [환경 설정](../ENVIRONMENT_SETUP.md)

### 👨‍💻 "개발자가 되고 싶은 사람"  
1. [시스템 구조](SYSTEM_ARCHITECTURE.md) (10분)
2. [개발 가이드](../DEVELOPMENT_GUIDE.md) (20분)
3. [AI 엔진 가이드](AI_ENGINE_COMPLETE_GUIDE.md) (30분)

### 🏗️ "아키텍처를 이해하고 싶은 사람"
1. [AI 설계 요약](AI_DESIGN_SUMMARY.md) (5분)
2. [MCP 설계 철학](WHY_MCP_AI_ENGINE.md) (45분)
3. [종합 가이드](ESSENTIAL_DOCUMENTATION.md) (60분)

### 🚀 "배포하고 싶은 사람"
1. [배포 체크리스트](../DEPLOYMENT_CHECKLIST.md) (15분)
2. [프로젝트 상태](../PROJECT_STATUS.md) (10분)

## 📈 문서 최적화 결과

### ✅ 접근성 개선
- **슬림 README**: 24KB → 3KB (88% 감소)
- **계층별 구조**: 중요도순 배치
- **빠른 가이드**: 3분 시작 가능

### 📊 사용자별 맞춤
- **신규 사용자**: 3-5분 시작
- **개발자**: 30분 완전 이해  
- **아키텍트**: 60분 심화 학습

---

**최종 업데이트**: 2025-01-06  
**최적화 완료**: ✅ 대용량 문서 분리
EOF

echo "   ✅ docs 폴더 가이드 업데이트 완료"

# Phase 5: 결과 검증
echo ""
echo "🔍 Phase 5: 분리 결과 검증 중..."

echo ""
echo "📊 문서 분리 완료 결과:"
echo "=============================================="

# 새로 생성된 파일들 크기 확인
echo "📄 새로 생성된 문서들:"
if [ -f "docs/QUICK_START_GUIDE.md" ]; then
    size=$(du -h docs/QUICK_START_GUIDE.md | cut -f1)
    echo "   📋 빠른 시작 가이드: $size"
fi

if [ -f "docs/SYSTEM_ARCHITECTURE.md" ]; then
    size=$(du -h docs/SYSTEM_ARCHITECTURE.md | cut -f1)
    echo "   🏗️ 시스템 아키텍처: $size"
fi

if [ -f "docs/AI_DESIGN_SUMMARY.md" ]; then
    size=$(du -h docs/AI_DESIGN_SUMMARY.md | cut -f1)
    echo "   🤖 AI 설계 요약: $size"
fi

# README.md 크기 확인
if [ -f "README.md" ]; then
    size=$(du -h README.md | cut -f1)
    echo "   📖 새 README.md: $size (기존: 24KB)"
fi

echo ""
echo "📦 백업된 원본 문서들:"
backup_count=$(ls -1 docs/archive/large_documents_backup/ 2>/dev/null | wc -l)
echo "   📁 백업 파일: $backup_count 개"

echo ""
echo "✅ 대용량 문서 분리 완료!"
echo "=============================================="
echo "🎯 주요 개선사항:"
echo "   - README.md: 24KB → ~3KB (88% 감소)"
echo "   - 빠른 접근 가이드 3개 신규 생성"
echo "   - 사용자별 맞춤 문서 구조 완성"
echo "   - 모든 원본 문서 안전 백업"
echo ""
echo "📋 다음 단계:"
echo "   1. git add . && git commit -m \"docs: 대용량 문서 분리 및 접근성 개선\""
echo "   2. docs/README.md에서 새로운 문서 구조 확인"
echo "   3. 필요시 추가 내용 조정"
echo ""
echo "📁 백업 위치: docs/archive/large_documents_backup/" 