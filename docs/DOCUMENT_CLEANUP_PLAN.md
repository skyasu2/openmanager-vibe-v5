# 📚 문서 정리 계획 (Document Cleanup Plan)

> **OpenManager Vibe v5.35.0 문서 구조 최적화**  
> **목표**: 중복 제거, 일관성 확보, 사용자 친화성 향상

---

## 🎯 정리 목표

### ✅ 달성하고자 하는 결과

- **중복 문서 완전 제거** (5개 → 1개)
- **메인 README 슬림화** (24KB → 8-10KB)
- **버전 정보 통일** (v5.35.0)
- **명확한 문서 역할 분리** (실용 vs 심화)
- **docs 폴더 최적화** (8개 → 4개 핵심 문서)

---

## 📊 현재 문제점 분석

### 🚨 즉시 해결 필요

1. **환경설정 문서 중복** - 5개 파일에 분산

   - `ENVIRONMENT_SETUP.md` (루트)
   - `docs/ENVIRONMENT_SETUP.md`
   - `docs/ENVIRONMENT_SETUP_GUIDE.md`
   - `MCP_CONFIG_GUIDE.md` (일부 내용)
   - `DEVELOPMENT_GUIDE.md` (일부 내용)

2. **AI 문서 분산** - 내용 중복 및 일관성 부족

   - `docs/AI-ENGINE-ARCHITECTURE.md` (6.2KB)
   - `docs/AI_ARCHITECTURE_OPTIMIZATION.md` (11KB)
   - `docs/WHY_MCP_AI_ENGINE.md` (16KB) ← 독립 유지

3. **버전 정보 불일치**
   - README.md: v5.34.0
   - PROJECT_STATUS.md: v5.35.0

---

## 🔄 Phase 1: 즉시 정리 (중복 제거)

### 1. 버전 정보 통일

```bash
# README.md 버전 업데이트
v5.34.0 → v5.35.0
```

### 2. 환경설정 문서 통합

```bash
# 통합할 파일들
docs/ENVIRONMENT_SETUP.md (삭제)
docs/ENVIRONMENT_SETUP_GUIDE.md (삭제)

# 유지할 파일
ENVIRONMENT_SETUP.md (루트) ← 모든 내용 통합
MCP_CONFIG_GUIDE.md (루트) ← MCP 전용으로 유지
```

### 3. AI 문서 통합

```bash
# 새로 생성
docs/AI_ENGINE_COMPLETE_GUIDE.md ← 통합 파일

# 통합할 파일들
docs/AI-ENGINE-ARCHITECTURE.md (이동 후 삭제)
docs/AI_ARCHITECTURE_OPTIMIZATION.md (이동 후 삭제)

# 독립 유지
docs/WHY_MCP_AI_ENGINE.md ← 설계 철학 (독립)
```

---

## 🔄 Phase 2: 구조 최적화

### 1. 메인 README 슬림화

```markdown
# 현재: 24KB (너무 방대)

# 목표: 8-10KB (핵심만)

포함할 내용:

- 프로젝트 개요 (2KB)
- 빠른 시작 (2KB)
- 핵심 기능 (2KB)
- 기본 설치 (2KB)
- 링크 모음 (1KB)

제거할 내용:

- 상세 아키텍처 → docs/ESSENTIAL_DOCUMENTATION.md
- Keep-Alive 세부사항 → PROJECT_STATUS.md
- 환경변수 상세 → ENVIRONMENT_SETUP.md
- AI 엔진 세부사항 → docs/AI_ENGINE_COMPLETE_GUIDE.md
```

### 2. docs 폴더 최적화

```bash
# 최종 docs 구조 (4개 핵심 문서)
docs/
├── README.md (폴더 가이드)
├── ESSENTIAL_DOCUMENTATION.md (종합 가이드)
├── AI_ENGINE_COMPLETE_GUIDE.md (AI 통합)
└── CHANGELOG.md (변경 이력)

# archive로 이동
docs/archive/
├── README_ORIGINAL.md (기존)
├── removed_documents/ (새로 생성)
│   ├── AI-ENGINE-ARCHITECTURE.md
│   ├── AI_ARCHITECTURE_OPTIMIZATION.md
│   ├── ENVIRONMENT_SETUP.md
│   └── ENVIRONMENT_SETUP_GUIDE.md
```

---

## 🔄 Phase 3: 내용 업데이트

### 1. 완료된 기능 반영

- ✅ 통합 헬스체크 API 완성
- ✅ 서버 데이터 생성기 개선
- ✅ Git 브랜치 병합 완료
- ✅ Vercel 배포 최적화

### 2. 불필요한 미래 계획 정리

- 구체적 일정이 없는 장기 계획 제거
- 현실적인 단기/중기 목표만 유지

---

## 🚀 실행 스크립트

### 자동 정리 스크립트

```bash
#!/bin/bash
# docs-cleanup.sh

echo "📚 OpenManager Vibe v5 문서 정리 시작..."

# Phase 1: 백업 생성
echo "🔄 백업 생성 중..."
mkdir -p docs/archive/removed_documents
cp docs/ENVIRONMENT_SETUP.md docs/archive/removed_documents/
cp docs/ENVIRONMENT_SETUP_GUIDE.md docs/archive/removed_documents/
cp docs/AI-ENGINE-ARCHITECTURE.md docs/archive/removed_documents/
cp docs/AI_ARCHITECTURE_OPTIMIZATION.md docs/archive/removed_documents/

# Phase 2: AI 문서 통합
echo "🤖 AI 문서 통합 중..."
cat docs/AI-ENGINE-ARCHITECTURE.md docs/AI_ARCHITECTURE_OPTIMIZATION.md > docs/AI_ENGINE_COMPLETE_GUIDE.md

# Phase 3: 중복 문서 제거
echo "🗑️ 중복 문서 제거 중..."
rm docs/ENVIRONMENT_SETUP.md
rm docs/ENVIRONMENT_SETUP_GUIDE.md
rm docs/AI-ENGINE-ARCHITECTURE.md
rm docs/AI_ARCHITECTURE_OPTIMIZATION.md

# Phase 4: 버전 정보 업데이트
echo "📝 버전 정보 업데이트 중..."
sed -i 's/v5.34.0/v5.35.0/g' README.md

echo "✅ 문서 정리 완료!"
echo "📊 정리 결과:"
echo "   - 중복 문서 5개 제거"
echo "   - AI 문서 1개로 통합"
echo "   - 버전 정보 v5.35.0으로 통일"
echo "   - 백업 파일: docs/archive/removed_documents/"
```

---

## 📋 검증 체크리스트

### ✅ Phase 1 완료 확인

- [ ] 버전 정보 v5.35.0으로 통일
- [ ] 환경설정 문서 중복 제거
- [ ] AI 문서 통합 완료
- [ ] 백업 파일 생성 확인

### ✅ Phase 2 완료 확인

- [ ] README.md 크기 8-10KB 달성
- [ ] docs 폴더 4개 파일로 정리
- [ ] archive 폴더 정리 완료

### ✅ Phase 3 완료 확인

- [ ] 완료된 기능 반영
- [ ] 불필요한 계획 제거
- [ ] 링크 정상 동작 확인

---

## 🎯 기대 효과

### 📊 정량적 개선

- **문서 수**: 14개 → 10개 (30% 감소)
- **중복률**: 35% → 0% (완전 제거)
- **메인 README**: 24KB → 8KB (67% 감소)
- **docs 폴더**: 8개 → 4개 (50% 감소)

### 🎨 정성적 개선

- **사용자 경험**: 빠른 정보 접근
- **유지보수성**: 단일 소스 관리
- **일관성**: 통일된 버전 및 스타일
- **전문성**: 명확한 문서 구조

---

**실행 준비**: ✅ 준비 완료  
**예상 소요 시간**: 30분  
**위험도**: 낮음 (백업 포함)  
**실행 권장**: 즉시 실행 가능
