# 📁 AI 교차검증 히스토리 저장소

**용도**: verification-recorder 서브에이전트의 검증 결과 자동 저장

## 📂 폴더 구조

```
ai-verifications/
├── README.md                         # 이 파일
├── verification-index.json           # 검색 인덱스 (자동 업데이트)
├── YYYY-MM-DD-HH-MM-description.md   # 개별 검증 리포트
└── monthly-summary/
    └── YYYY-MM-summary.md            # 월간 요약 (자동 생성)
```

## 🔍 검증 리포트 형식

### 파일명 규칙
```
2025-10-01-17-30-dashboard-refactor.md
└─ 날짜-시간-간단한설명.md
```

### 리포트 내용
```markdown
# AI 교차검증 리포트

**검증일**: 2025-10-01 17:30
**대상**: src/components/DashboardClient.tsx
**요청**: "대시보드 리팩토링 검증"

## 🤖 AI 검증 결과
- Gemini: 8.8/10 (아키텍처)
- Qwen: 9.2/10 (성능)
- Codex: 9.0/10 (실무)

## 🎯 Claude 최종 판단: 9.0/10
✅ 승인 (minor 개선 권장)

## 📈 히스토리 컨텍스트
- 이전: 7.5/10 → 현재: 9.0/10 (1.5점 개선)
```

## 📊 verification-index.json 구조

```json
{
  "metadata": {
    "created": "2025-10-01",
    "version": "1.0"
  },
  "verifications": [
    {
      "id": "2025-10-01-17-30-dashboard",
      "date": "2025-10-01T17:30:00Z",
      "file": "src/components/DashboardClient.tsx",
      "score": 9.0,
      "ai_scores": {
        "gemini": 8.8,
        "qwen": 9.2,
        "codex": 9.0
      },
      "decision": "approved",
      "tags": ["dashboard", "refactor", "performance"]
    }
  ]
}
```

## 🔎 검색 방법

### 🚀 스마트 검색 도구 (권장)
```bash
# 최근 3개 검증
./scripts/ai-verification/search-history.sh latest 3

# 특정 대상 검색
./scripts/ai-verification/search-history.sh target "dashboard"

# 점수 기준 검색 (90점 이상)
./scripts/ai-verification/search-history.sh score 90

# 태그 검색
./scripts/ai-verification/search-history.sh tag "refactor"

# 전체 통계
./scripts/ai-verification/search-history.sh stats

# 평균 점수 추이
./scripts/ai-verification/search-history.sh trend
```

### 📊 수동 검색 (참고용)
```bash
# 특정 파일 검증 히스토리
grep -r "DashboardClient.tsx" *.md

# 최근 7일 검증
find . -name "2025-10-*" -mtime -7

# 평균 점수 추이
jq '[.verifications[] | .score] | add / length' verification-index.json

# 특정 AI 평균 점수
jq '[.verifications[] | .ai_scores.gemini] | add / length' verification-index.json
```

## 📈 월간 요약 보고서

**자동 생성**: 매월 1일 또는 수동 요청 시

**내용**:
- 검증 횟수 및 평균 점수
- AI별 성과 통계
- 트렌드 분석 (개선률, 반복 문제)
- 비용 효율성 (Claude 한도, 무료 AI 활용)

## 💡 활용 팁

### 히스토리 기반 검증
```bash
# Claude에게 직접 요청 (방식 B)
"지난번 대시보드 검증 결과와 비교하여 이번 변경사항 AI 교차검증해줘"

# → Claude가 3-AI 병렬 호출 (codex, gemini, qwen)
# → verification-recorder가 자동으로 히스토리 저장
```

### 자동 저장 시스템

**✅ 방법 1: Task 도구 사용 (권장)**
```bash
# AI 교차검증 완료 후 Task 도구로 호출
Task verification-recorder '{
  "target": "파일 경로",
  "description": "간단한 설명",
  "codex_score": 82,
  "gemini_score": 91.3,
  "qwen_score": 88,
  "average_score": 87.1,
  "decision": "approved_with_improvements",
  "actions_taken": ["개선사항1", "개선사항2"],
  "key_findings": ["발견사항1", "발견사항2"],
  "commit": "커밋해시",
  "tags": ["tag1", "tag2"]
}'
```

**🔧 방법 2: Bash 직접 실행 (보조)**
```bash
bash scripts/ai-verification/verification-recorder.sh '{
  "target": "파일 경로",
  "description": "간단한 설명",
  ...
}'
```

**권장**: 웬만하면 방법 1 (Task 도구)을 사용하여 Claude Code 기능을 최대한 활용하세요.

### 특정 문제 추적
```bash
# 반복되는 문제 패턴 확인
grep -r "의존성 배열" *.md | wc -l

# 스마트 검색으로 태그 기반 추적
./scripts/ai-verification/search-history.sh tag "dependency-array"
```

## ⚠️ 주의사항

1. **Git 추적**: 이 폴더는 `.gitignore`에 등록되어 로컬 전용
2. **용량 관리**: 월 100개 검증 시 약 50MB (관리 가능)
3. **백업**: 중요 검증 결과는 별도 백업 권장

## 🎯 목표

**90% 완성 프로젝트의 마무리 단계 품질 보증**
- 모든 중요 변경사항 AI 교차검증
- 히스토리 축적으로 패턴 학습
- 지속적 개선 트렌드 추적

**Last Updated**: 2025-10-02 by Claude Code (v2.0.1)
