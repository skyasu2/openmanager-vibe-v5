# TODO - OpenManager VIBE v5

<!-- Version: 5.80.0 | Author: Antigravity -->

---

## 🟡 MEDIUM - 주간 작업

### 1. 캐싱 전략 개선 (6시간)

- [ ] SWR 전략 적용
- [ ] TTL 계층화 (5분/30분/1시간)

### 2. AI Health Check 최적화 (2시간)

- [ ] SSE 모니터링 주기 5분으로 변경
- [ ] SystemInactivityService 통합 (시스템 종료 시 자동 중지)
- [ ] API Health 캐싱 구현 (60초 TTL)
- 📋 **상세 계획**: [implementation_plan.md](../../.gemini/antigravity/brain/e2bb801c-4702-481d-a5de-0f17bb920ded/implementation_plan.md)

---

## 🟢 LOW - 장기 계획

### 2. 기능 확장

| 기능 | 설명 | 난이도 |
|------|------|--------|
| 대화 컨텍스트 | 세션 기반 대화 히스토리 | 중간 |
| 멀티모달 | 이미지 업로드 + Gemini Vision | 높음 |
| 알림 시스템 | Supabase Realtime 기반 | 중간 |

---

## ⚡ Quick Wins

| 작업 | 시간 | 상태 |
|------|------|------|
| ~~resize debounce 적용~~ | 20분 | ✅ 완료 |
| ~~Dead Code 정리 (4개 파일)~~ | 30분 | ✅ 검증완료 (사용 중) |

---

## 📦 완료 아카이브

완료된 작업은 아래 문서로 이동:

| 작업 | 완료일 | 문서 |
|------|--------|------|
| unified-ai-processor v3.3.0 | 2025-12-10 | [링크](../archive/completed/2025-12-unified-ai-processor-v3.3.0-completed.md) |
| RAG 엔진 리팩토링 | 2025-12-10 | [링크](../archive/completed/2025-12-rag-refactoring-completed.md) |
| 이미지 최적화 | 2025-12-10 | [링크](../archive/completed/2025-12-image-optimization-completed.md) |
| Biome 경고 해결 | 2025-12-08 | [링크](../archive/completed/2025-biome-warnings-completed.md) |
| 메이저 버전 업그레이드 | 2025-12-08 | [링크](../archive/completed/2025-major-version-upgrade-completed.md) |

---

**최종 업데이트**: 2025-12-10
