# Multi-AI MCP 히스토리 관리 정책

**마지막 업데이트**: 2025-10-06

---

## 📋 로깅 정책

### ✅ Git 추적 대상

**문서화된 분석 리포트** (docs 경로):
- 위치: `docs/claude/history/ai-verifications/`
- 형식: Markdown (.md)
- 용도: 팀 공유, 장기 보관
- 예시:
  - `2025-10-02-ai-cross-verification.md`
  - `2025-10-05-multi-ai-mcp-v1.2.0-validation.md`

### ❌ Git 추적 제외

**로그 수준 JSON 파일** (자동 생성):
- 위치: `packages/multi-ai-mcp/history/`
- 형식: JSON
- 용도: 로컬 디버깅, 임시 분석
- 제외 이유:
  - 단순 로그 데이터 (구조화되지 않음)
  - 빠르게 누적되어 저장소 비대화
  - 필요 시 분석 후 문서화하여 docs에 저장
- .gitignore 규칙:
  ```
  packages/multi-ai-mcp/history/*.json
  packages/multi-ai-mcp/history/**/*.json
  ```

---

## 🔄 워크플로우

### 1. 자동 로깅 (MCP v1.2.0+)
```typescript
// Multi-AI MCP 서버가 자동으로 JSON 로그 생성
mcp__multi_ai__queryAllAIs({ query: "..." })
// → packages/multi-ai-mcp/history/2025-10-06T12-34-56-verification.json
```

### 2. 분석 및 문서화 (필요 시)
```bash
# 1. 로컬에서 JSON 로그 분석
cat packages/multi-ai-mcp/history/*.json

# 2. 중요한 인사이트 발견 시 Markdown으로 문서화
# → docs/claude/history/ai-verifications/2025-10-06-analysis.md

# 3. Git에 문서만 커밋
git add docs/claude/history/ai-verifications/
git commit -m "📝 docs: Multi-AI 검증 분석 결과 추가"
```

### 3. 정기 정리 (권장)
```bash
# 30일 이상 된 JSON 로그 삭제 (선택적)
find packages/multi-ai-mcp/history/ -name "*.json" -mtime +30 -delete
```

---

## 📂 디렉토리 구조

```
packages/multi-ai-mcp/history/
├── README.md                          # 이 파일 (Git 추적 ✅)
├── .gitkeep                          # 폴더 유지용 (Git 추적 ✅)
├── *.json                            # 자동 생성 로그 (Git 제외 ❌)
└── docs/                             # 월별 요약 (선택적)
    └── monthly-summary/

docs/claude/history/ai-verifications/
├── 2025-09-12-ai-cross-verification-complete.md
├── 2025-10-01-ai-verification-summary.md
├── 2025-10-02-ai-cross-verification.md
└── ... (분석 문서들, Git 추적 ✅)
```

---

## 🎯 히스토리 조회 방법

### MCP 도구 사용 (권장)
```typescript
// Claude Code 내에서
mcp__multi_ai__getHistory({ limit: 10 })        // 최근 10개
mcp__multi_ai__searchHistory({ pattern: "성능" }) // 패턴 검색
mcp__multi_ai__getHistoryStats()                 // 통계 분석
```

### 수동 조회
```bash
# 최근 5개 JSON 로그 확인
ls -lt packages/multi-ai-mcp/history/*.json | head -5

# 특정 날짜 로그 확인
cat packages/multi-ai-mcp/history/2025-10-06*.json
```

---

## 📊 예시

### JSON 로그 (자동 생성, Git 제외)
```json
{
  "timestamp": "2025-10-06T12:34:56Z",
  "query": "Multi-AI MCP 코드 품질 분석",
  "results": {
    "codex": { "score": 8, "response": "..." },
    "gemini": { "score": 10, "response": "..." },
    "qwen": { "score": 8, "response": "..." }
  },
  "synthesis": {
    "consensus": [...],
    "conflicts": [...]
  }
}
```

### Markdown 문서 (분석 후, Git 추적)
```markdown
# Multi-AI MCP v1.2.0 검증 결과

**날짜**: 2025-10-06
**분석자**: Claude Code + 3-AI

## 핵심 결과
- 전체 점수: 8.67/10
- 합의 항목: 5개
- 충돌 항목: 1개

## 상세 분석
...
```

---

## 🚀 다음 단계

- [ ] 월별 요약 자동화 스크립트 추가
- [ ] 히스토리 분석 대시보드 (선택적)
- [ ] 성능 추세 그래프 생성 (선택적)

---

**💡 핵심 원칙**: 로그는 로컬에서 분석, 중요한 인사이트만 docs에 문서화하여 팀 공유
