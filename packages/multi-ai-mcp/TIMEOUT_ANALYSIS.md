# MCP 타임아웃 에러 현황 및 개선 경과

**최종 업데이트**: 2025-10-08  
**분석 대상**: Multi-AI MCP Server v3.8.0  
**이슈 코드**: `MCP error -32001: Request timed out` (Claude Code에서만 재현)

---

## 📌 Executive Summary

- **문제 요약**: Codex CLI가 80~110초 내로 정상 완료되더라도 Claude Code 클라이언트는 약 90초 부근에서 `-32001` 타임아웃을 반환한다. 서버에서는 성공 기록이 남으므로 클라이언트 단의 타임아웃 정책이 원인으로 추정된다.
- **현재 대응**  
  - v3.6.0~v3.8.0 동안 **Progress Notification**, **Early Response**, **동적 total 계산**, **재시도/메모리 가드** 등을 도입했으나 Claude 측 타임아웃은 해소되지 않았다.  
  - **Bash Wrapper**를 통한 직접 CLI 호출이 가장 안정적인 우회책(성공률 95% 이상).  
  - 문서/ADR(`docs/quality/analysis/MULTI_AI_ARCHITECTURE_DECISION.md`)에 따라 단기적으로 Wrapper 유지, 중장기적으로 Async Task Queue 연구 예정.
- **다음 행동**  
  1. Claude Code 팀에 progress notification과 client timeout 정책 문의  
  2. Async Task Queue PoC(v3.9.0) 준비  
  3. Wrapper 로그를 지속 수집해 재현 데이터를 확보

---

## 1. 재현 결과 (2025-10-07~10-08)

| 시나리오 | CLI 실제 시간 | MCP 서버 기록 | Claude Code 응답 | 비고 |
|---------|----------------|----------------|------------------|------|
| Codex – 중간 복잡도 | 107초 | `history/*-verification.json`에 성공 | `-32001` 타임아웃 | Progress log 10초 간격으로 송신 |
| Codex – 중간 복잡도 | 86초  | 성공 | `-32001` 타임아웃 | 동일 증상 |
| Gemini – 간단 쿼리 | 23초  | 성공 | 성공 | 짧은 쿼리는 문제 없음 |

**관찰**  
- `index.ts`에서 progress notification을 10초 간격으로 송신하고, Codex total을 240초로 설정했음에도 Claude에서 타임아웃 발생.  
- MCP 서버에서 stderr/stdout 모두 캡처되며, 서버 종료나 예외 없이 응답 완료.  
- `~/.claude/mcp.json`의 `timeout` 값(600초)을 증가시켜도 영향 없음.

---

## 2. 현재 구성 요약

```typescript
// packages/multi-ai-mcp/src/config.ts
codex: { timeout: 240_000 }
gemini: { timeout: 420_000 }
qwen: { timeout: 420_000 }
mcp: { requestTimeout: 600_000, enableProgress: true }
progress.interval: 10_000 // 기본값 (env로 조정 가능)
earlyResponse.enabled: false (기본)
```

```typescript
// packages/multi-ai-mcp/src/index.ts (발췌)
const totalSeconds =
  provider === 'codex'
    ? Math.floor(config.codex.timeout / 1000)
    : Math.floor(config.gemini.timeout / 1000);

server.notification({
  method: 'notifications/progress',
  params: { progressToken, progress: elapsedSeconds, total: totalSeconds },
});
```

```typescript
// packages/multi-ai-mcp/src/ai-clients/codex.ts (발췌)
const progressInterval = setInterval(() => {
  onProgress?.('codex', `Codex 작업 중... (${elapsed / 1000 | 0}초)`, elapsed);
}, config.progress.interval); // env로 5초~30초 조절 가능
```

---

## 3. 원인 분석 상태

| 가설 | 상태 | 근거 |
|------|------|------|
| Progress notification 미전송 | ❌ 반박 | 서버 로그에서 progress 토큰 정상 전송 확인, Gemini는 동일 경로로 성공 |
| MCP 서버 timeout 부족 | ❌ 반박 | Codex 107초 < Codex timeout(240s) < MCP timeout(600s) |
| Codex CLI 자체 문제 | ❌ 반박 | Bash Wrapper/직접 CLI 실행 시 정상, stdout/stderr 수집 완전 |
| Claude Code 내부 고정 timeout | ✅ 유력 | progress 무시하고 90초 부근에서 강제 종료되는 패턴, 공식 설정으로 조정 불가 |

---

## 4. 적용된 개선 (v3.6.0 ~ v3.8.0)

| 버전 | 개선 항목 | 효과 |
|------|-----------|------|
| v3.6.0 | Progress total을 AI별 timeout으로 동적 계산 | progress 표시 정확도 향상 |
| v3.7.0 | Qwen Plan Mode 강제, retry/backoff 정비 | OOM 제거, 실패율 감소 |
| v3.8.0 | `MULTI_AI_PROGRESS_INTERVAL`, `EARLY_RESPONSE`, `VERBOSE_PROGRESS` 환경변수 도입 | progress/로그 제어 유연성 확보 |
| v3.8.0 | stderr 전달, 메모리 가드 옵션(사후 검증+GC) 추가 | 디버깅 품질 향상, 실패 원인 노출 |

**문제는 여전히 Claude 클라이언트 타임아웃에 집중되어 있음.** 서버 측 개선만으로는 한계가 확인됨.

---

## 5. 권장 워크플로우 (임시)

1. **Bash Wrapper 우선 사용**  
   - `scripts/ai-subagents/codex-wrapper.sh` (적응형 타임아웃 + 재시도 + 로깅)  
   - MCP 장애 시에도 독립적으로 동작, ROI 최고

2. **MCP 사용 시 주의**  
   - progress interval을 5초 이하로 낮춰도 Claude 타임아웃이 해소되는지 반복 측정  
   - stderr 전체를 Claude로 전달하여, 타임아웃 원인이 명시되는지 확인

3. **장기 계획 (ROADMAP_v3.5.0.md, MULTI_AI_ARCHITECTURE_DECISION.md 참고)**  
   - Async Task Queue v3.9.0 연구  
   - Claude Code 팀과 타임아웃 정책 협의  
   - Wrapper 결과 자동 수집 후 MCP에 재전달하는 하이브리드 방식 검토

---

## 6. 로그/자료 레퍼런스

- `packages/multi-ai-mcp/history/*.json` – 실제 응답 시간/Progress 기록  
- `docs/quality/analysis/MULTI_AI_ARCHITECTURE_DECISION.md` – Wrapper/Async 비교 분석  
- `packages/multi-ai-mcp/TIMEOUT-IMPROVEMENTS.md` – 단계별 개선 계획  
- `scripts/ai-subagents/*-wrapper.sh` – CLI Wrapper 구현 및 성능 로그

---

## 7. 다음 액션 체크리스트

- [ ] progress interval을 5초 이하로 조정 후 Claude 타임아웃 재측정 (로그 확보)  
- [ ] Claude Code 지원 채널에 내부 timeout 공개/조정 요청  
- [ ] Async Task Queue PoC 착수 (v3.9.0 목표)  
- [ ] Wrapper 로그를 `logs/ai-perf/`에 누적하여 지표 관리

> 📎 **결론**: 서버 측 타임아웃은 충분히 확보되었으며, 실제 실패 지점은 Claude Code 클라이언트의 내부 타임아웃 정책이다. 우선은 Wrapper를 통한 직접 호출을 기본 전략으로 삼고, MCP 비동기화/클라이언트 협업으로 근본 해결을 모색한다.

