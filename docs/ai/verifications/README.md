# AI 교차검증 히스토리

**Multi-AI MCP v3.0.0 고급 히스토리 저장소**

---

## 📁 디렉토리 구조

```
docs/ai-verifications/
├── README.md (이 파일)
├── TEMPLATE.md (검증 결과 템플릿)
└── YYYY-MM-DD-HHMMSS-verification.md (실제 검증 기록)
```

---

## 📝 파일 명명 규칙

**형식**: `YYYY-MM-DD-HHMMSS-verification.md`

**예시**:
- `2025-10-06-193045-verification.md` - 2025년 10월 6일 19:30:45 검증
- `2025-10-07-102315-verification.md` - 2025년 10월 7일 10:23:15 검증

---

## 🎯 사용 목적

### MCP vs 서브에이전트 역할 분리 (v3.0.0)

**MCP 기본 히스토리** (`~/.multi-ai-history/`):
- 메타데이터만 (타임스탬프, 성공/실패, 응답 시간)
- JSON 형식
- 자동 생성 (MCP가 직접 기록)

**서브에이전트 고급 히스토리** (이 디렉토리):
- 상세 분석 결과 (합의/충돌, 점수, 추천 사항)
- Markdown 형식
- 수동 생성 (서브에이전트가 Write 도구 사용)

---

## 📊 저장 내용

각 검증 파일에는 다음이 포함됩니다:

1. **메타데이터**:
   - 날짜/시간
   - 쿼리 내용
   - 복잡도 (simple/medium/complex)

2. **3-AI 응답 요약**:
   - Codex (실무 관점)
   - Gemini (아키텍처 관점)
   - Qwen (성능 관점)

3. **합의 항목** (2+ AI 동의):
   - 공통 발견 사항
   - 우선순위 권장 사항

4. **충돌 항목** (AI 간 의견 차이):
   - 트레이드오프 분석
   - Claude 최종 판단 필요

5. **성능 메트릭**:
   - 총 실행 시간
   - 병렬 효율성
   - 성공률

6. **Claude 최종 판단**:
   - 적용 여부 체크리스트
   - 충돌 해결 방법

---

## 🔍 검색 및 분석

### 최근 검증 조회

```bash
# 최근 10개 검증 파일
ls -lt docs/ai-verifications/*.md | head -10

# 특정 날짜 검증
ls docs/ai-verifications/2025-10-06-*.md
```

### 내용 검색

```bash
# "테스트" 관련 검증 찾기
grep -l "테스트" docs/ai-verifications/*.md

# "합의" 항목 추출
grep "✅" docs/ai-verifications/*.md
```

### 통계 분석

```bash
# 총 검증 횟수
ls docs/ai-verifications/*-verification.md | wc -l

# 월별 검증 통계
ls docs/ai-verifications/2025-10-*.md | wc -l
```

---

## 🚀 빠른 시작

### 1. 템플릿 사용

```bash
# 템플릿 복사
cp docs/ai-verifications/TEMPLATE.md docs/ai-verifications/$(date +%Y-%m-%d-%H%M%S)-verification.md
```

### 2. Multi-AI Verification Specialist 사용

서브에이전트가 자동으로 생성:

```
사용자: "LoginClient.tsx를 AI 교차검증해줘"
  ↓
서브에이전트 실행
  ↓
3-AI 병렬 실행
  ↓
결과 종합
  ↓
docs/ai-verifications/YYYY-MM-DD-HHMMSS-verification.md 저장
```

---

## 📈 유지 관리

### 주기적 정리 (권장)

- **일일**: 중복 검증 제거
- **주간**: 요약 리포트 생성
- **월간**: 트렌드 분석

### 보관 정책

- **3개월 이내**: 전체 보관
- **3-6개월**: 중요 검증만 보관
- **6개월 이상**: 아카이브 또는 삭제

---

## 🔗 관련 문서

- **서브에이전트**: `.claude/agents/multi-ai-verification-specialist.md`
- **MCP 서버**: `packages/multi-ai-mcp/`
- **AI 교차검증 아키텍처**: `docs/claude/architecture/ai-cross-verification.md`

---

**💡 핵심**:
- MCP: 기본 히스토리 (메타데이터만)
- 서브에이전트: 고급 히스토리 (상세 분석)
- Claude Code: 최종 판단 및 적용
