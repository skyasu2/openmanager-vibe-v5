# MCP 및 서브에이전트 개선 전략 AI 교차검증 의사결정

**날짜**: 2025-10-15
**상황**: 3가지 분석 리포트(MCP 우선순위 준수도, 서브에이전트 활용도, 토큰 효율성)를 기반으로 개선 전략 평가. 목표는 토큰 82% 절약 달성 및 개발 속도 3-5배 향상.

---

## 🤖 AI 의견 요약

### 📊 Codex (실무 관점) - 74초, 13,497 토큰 사용

**핵심 주장**:
- Pre-commit Hook은 과도한 마찰 (false positive 위험)
- Cron Job은 WSL 환경에서 불안정 (유지보수 부담 > 효과)
- 토큰 로깅이 가장 실용적 (기존 wrapper 확장, high ROI)

**근거**:
- 1인 개발자에게 blocking hook은 네트워크 타임아웃, CLI 변경 시 커밋 차단 위험
- WSL cron은 distro 백그라운드 실행 필요, /mnt/d 경로 권한 문제
- AI wrapper는 이미 중앙화되어 토큰 로깅 추가가 contained work

**추천 사항**:
1. AI wrapper 스크립트 확장: 토큰 수/응답 크기 캡처, logs/ai-perf/*.log에 구조화 저장 (jq 분석 가능)
2. npm run audit:mcp-usage 추가: vercel CLI, Context7 누락 감지, pre-commit 대신 merge 전 수동 실행
3. 에이전트 템플릿 개선: documentation-manager, vercel-platform-specialist에 Context7/Vercel MCP 명시적 우선 사용

### 📐 Gemini (아키텍처 관점) - 92초, 실패 (파일 접근 불가)

**핵심 주장**: ❌ 분석 불가

**근거**: Gemini CLI가 작업 디렉토리 외부 파일(logs/analysis/*.md)에 접근 제한

**추천 사항**: 향후 교차검증 시 분석 컨텍스트를 쿼리에 직접 포함 필요

**제약 사항**: Gemini CLI의 파일 시스템 제약으로 아키텍처 평가 누락

### ⚡ Qwen (성능 관점) - 100초, 성공

**핵심 주장**:
- 71.1% MCP 준수율과 50% 토큰 효율이 개발 속도에 직접 영향
- Vercel CLI 89초 vs MCP 1초 (89배 차이), Context7 100% 정확 vs WebSearch 70% 부정확
- 측정 가능한 지표 기반 개선 필수

**근거**:
- Serena MCP 활용 시 80% 토큰 절약 (1,500 → 300 토큰)
- Context7 부재 시 부정확한 정보 위험 및 검색 파싱 토큰 낭비
- 토큰 로깅 시스템 부재로 정량적 측정 불가 → 82% 목표 달성 불확실

**추천 사항**:
1. Phase 1 (즉시): 토큰 로깅 시스템 구축, MCP 우선순위 자동 체크
2. Phase 2 (1주): Context7/Vercel MCP 활용도 80% 달성, A/B 테스트 (10개 샘플)
3. Phase 3 (1개월): 성능 대시보드 구축, 실시간 토큰 추적

---

## ⚖️ 합의점과 충돌점

### ✅ 합의 (2/3 AI 동의, Gemini 평가 부재)

1. **토큰 로깅 최우선** ⭐
   - Codex: "가장 실용적, high ROI"
   - Qwen: "Phase 1 즉시 실행, 측정 기반 개선의 기반"
   - 효과: 정량적 데이터 확보, 82% 목표 검증 가능

2. **MCP 활용도 증대 필요**
   - Codex: "에이전트 템플릿에 Context7/Vercel MCP 명시적 우선"
   - Qwen: "Context7, Vercel MCP 80% 달성"
   - 현재: Context7 20%, Vercel MCP 20% → 목표: 80%

3. **측정 기반 개선**
   - Codex: "spot-check 후 확인"
   - Qwen: "A/B 테스트 10개 샘플, 정량적 측정"
   - 방법: MCP vs 일반 도구 비교, 실제 절약률 측정

### ⚠️ 충돌

1. **Pre-commit Hook 자동 체크**
   - 리포트 권장: "자동 체크로 MCP 우선순위 강제"
   - Codex 반대: "false positive 위험, 1인 개발에 과도한 마찰"
   - → **대안 채택**: npm run audit 수동 실행 (Codex 제안)

2. **Cron Job 정기 스케줄링**
   - 리포트 권장: "정기 작업 스케줄링 (Tier 3 에이전트 활성화)"
   - Codex 반대: "WSL cron 불안정, 유지보수 부담 > 효과"
   - → **대안 채택**: npm 스크립트 + 필요 시 Windows Task Scheduler

3. **복잡한 아키텍처 개선 (UnifiedAIEngineRouter, Semantic Cache)**
   - 리포트 제안: "토큰 로깅 아키텍처, Semantic Cache 설계"
   - Gemini 평가 부재: 아키텍처 관점 검증 불가
   - → **보류**: Phase 3-4로 미루고 토큰 로깅 후 재평가

---

## 🎯 Claude Code 최종 평가

### 3-AI 답변 타당성 평가

**Codex 평가** (9.2/10):
- ✅ **실무 타당성 매우 높음**: 1인 개발 환경에서 blocking hook의 마찰 비용 정확히 지적
- ✅ **버그 위험 분석 우수**: WSL cron 불안정성, 네트워크 타임아웃, 로그 크기 제한 등 실제 문제점 예측
- ✅ **실행 가능한 대안**: npm run audit 스크립트, 에이전트 템플릿 개선 등 즉시 적용 가능
- ⚠️ **한계**: 장기적 아키텍처 개선안 부족

**Gemini 평가** (0/10 - 실패):
- ❌ **파일 접근 실패**: Gemini CLI의 파일 시스템 제약으로 분석 불가
- ⚠️ **개선 필요**: 향후 교차검증 시 분석 컨텍스트를 쿼리에 직접 포함

**Qwen 평가** (8.8/10):
- ✅ **정량적 지표 우수**: 89배 속도 차이, 80% 토큰 절약 등 측정 가능한 근거
- ✅ **병목점 명확**: Vercel CLI, Context7 미사용이 개발 속도에 미치는 영향 정확히 분석
- ✅ **로드맵 실행 가능성**: Phase 1-3 타임라인 구체적, ROI 명확
- ⚠️ **한계**: 실무 구현 세부사항 부족

### 프로젝트 컨텍스트 반영 (1인 개발, ROI 중심)

**ROI 분석**:
- **High ROI**: 토큰 로깅 (wrapper 확장만, 측정 기반 개선 가능)
- **Medium ROI**: audit 스크립트 (false positive 회피, 수동 제어)
- **Low ROI**: Pre-commit Hook (마찰 증가), Cron Job (WSL 불안정)

**1인 개발 환경 고려**:
- 자동화보다 수동 제어 선호 (유연성 확보)
- 유지보수 부담 최소화 (cron, complex architecture 회피)
- 즉시 효과 우선 (장기 아키텍처는 Phase 3-4로 보류)

### 최종 판단: 3단계 점진적 개선 전략 ⭐

**Phase 1 (즉시 - 1일 이내)**: 토큰 로깅 + 수동 감사
1. AI wrapper 토큰 로깅 확장 (logs/ai-perf/*.log, 구조화)
2. npm run audit:mcp-usage 스크립트 작성 (vercel CLI, Context7 감지)
3. 에이전트 템플릿에 Context7/Vercel MCP 우선 명시

**Phase 2 (1주 이내)**: 측정 기반 검증
1. A/B 테스트 (10개 샘플): MCP vs 일반 도구 비교
2. Context7, Vercel MCP 활용도 80% 달성
3. 실제 토큰 절약률 측정 (목표 82% 검증)

**Phase 3 (1개월 이내)**: 자동화 및 대시보드
1. 주간 토큰 효율성 리포트 자동화
2. 서브에이전트 활용 통계 추적 (subagent-stats.sh)
3. 최적화 제안 자동화

**선택 근거**:
- ✅ **ROI 중심**: 1인 개발 환경에서 즉시 효과, 낮은 유지보수 부담
- ✅ **실무 타당성**: Codex 검증 완료, 버그 위험 낮음
- ✅ **측정 가능**: Qwen 제안 반영, 정량적 검증 가능
- ✅ **점진적 개선**: 작은 단계로 시작, 효과 확인 후 확대

**기각된 의견**:
1. **Pre-commit Hook 자동 체크** (리포트 권장)
   - 기각 이유: Codex 지적대로 false positive 위험, 1인 개발에 과도한 마찰
   - 대안: npm run audit 수동 실행 (merge 전 체크)

2. **Cron Job 정기 스케줄링** (리포트 권장)
   - 기각 이유: WSL 환경 불안정, 유지보수 부담 > 효과
   - 대안: npm 스크립트 + 필요 시 Windows Task Scheduler

3. **UnifiedAIEngineRouter, Semantic Cache** (리포트 제안)
   - 기각 이유: Gemini 평가 부재, 1인 개발 환경에 과도한 엔지니어링
   - 판단: Phase 3-4로 보류, 토큰 로깅 후 재평가

---

## 📝 실행 내역

### 즉시 실행 (Phase 1 - 1일 이내)

**1. AI Wrapper 토큰 로깅 확장**:
- [ ] codex-wrapper.sh: 토큰 수 추출 및 logs/ai-perf/codex-perf-*.log 구조화 저장
- [ ] gemini-wrapper.sh: 토큰 수 추출 (가능하면)
- [ ] qwen-wrapper.sh: 토큰 수 추출 (가능하면)
- [ ] 로그 포맷: `{ "timestamp": "ISO8601", "model": "gpt-5-codex", "tokens": 13497, "duration_sec": 74 }`
- [ ] 로그 크기 제한: 1MB 초과 시 rotate

**2. npm run audit:mcp-usage 스크립트**:
- [ ] scripts/audit-mcp-usage.sh 작성
- [ ] 감지 대상: `vercel ls`, `vercel env`, WebSearch + Next.js/React
- [ ] 출력: 간단한 체크리스트 (merge 전 확인용)
- [ ] package.json에 npm 스크립트 추가

**3. 에이전트 템플릿 개선**:
- [ ] .claude/agents/documentation-manager.md: Context7 우선 명시
- [ ] .claude/agents/vercel-platform-specialist.md: Vercel MCP 우선 명시
- [ ] .claude/agents/code-review-specialist.md: Context7 에러 문서 조회 추가
- [ ] mcp-mapping.json 업데이트 (Context7, Vercel MCP 참조 증가)

### 향후 계획 (Phase 2 - 1주 이내)

**4. A/B 테스트 (10개 샘플)**:
- [ ] 샘플 선정: 코드 분석 5개, 문서 조회 3개, Vercel 조회 2개
- [ ] A그룹: MCP 도구 사용
- [ ] B그룹: 일반 도구 사용 (Read, WebSearch, CLI)
- [ ] 측정: 토큰 사용량 (ccusage), 응답 시간, 정확도
- [ ] 결과: 실제 토큰 절약률 측정 (목표 82% 검증)

**5. Context7, Vercel MCP 활용도 80% 달성**:
- [ ] 추가 에이전트에 Context7 통합 (목표 5개 이상)
- [ ] 추가 에이전트에 Vercel MCP 통합 (목표 5개 이상)
- [ ] audit 스크립트로 진행 상황 추적

### 장기 계획 (Phase 3 - 1개월 이내)

**6. 자동화 및 대시보드**:
- [ ] scripts/weekly-token-report.sh: 주간 리포트 자동 생성
- [ ] scripts/subagent-stats.sh: 서브에이전트 활용 통계 추적
- [ ] 토큰 효율성 대시보드 (선택사항): 실시간 모니터링

### 참고 사항

**Gemini CLI 제약 사항**:
- 현재 Gemini CLI는 작업 디렉토리 외부 파일 접근 불가
- 향후 교차검증 시 분석 컨텍스트를 쿼리에 직접 포함 필요
- 대안: Gemini API 직접 사용 또는 파일 내용 미리 추출

**성공 지표**:
- Phase 1 완료 후: 토큰 로깅 데이터 수집 시작
- Phase 2 완료 후: 실제 토큰 절약률 70-82% 달성 검증
- Phase 3 완료 후: MCP 활용도 80%+, 개발 속도 3배 향상 체감

**리스크 완화**:
- 토큰 로깅 오류가 AI 호출 차단하지 않도록 예외 처리
- audit 스크립트는 경고만 출력, 커밋 차단 안 함
- 에이전트 템플릿 개선은 기존 기능 유지하며 점진적 적용

---

**작성**: Claude Code
**검증**: 3-AI 교차검증 (Codex ✅ + Gemini ❌ + Qwen ✅)
**실행 시간**: 101초 (Codex 74초 + Gemini 92초 실패 + Qwen 100초)
**품질 점수**: 9.0/10 (Gemini 부재로 아키텍처 평가 누락)
