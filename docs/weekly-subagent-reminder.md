# 📅 주간 서브에이전트 체크리스트

**목적**: 서브에이전트 정기 활용으로 코드 품질 및 시스템 안정성 유지
**참조**: [서브에이전트 완전 가이드](ai/subagents-complete-guide.md)

---

## 🌅 월요일 - 주간 시작

### 개발 환경 점검

```bash
Task dev-environment-manager "AI CLI 도구 상태 확인 및 최신 버전 체크"
# Codex v0.58.0, Wrapper v2.5.0, OAuth 인증 상태 확인
```

### MCP 서버 상태 확인

```bash
claude mcp list  # 또는 ./scripts/mcp-health-check.sh
# 목표: 9/9 완벽 연결 유지
```

**체크포인트**:
- [ ] Codex CLI 도구 정상 작동
- [ ] MCP 서버 9/9 연결 확인
- [ ] Bash Wrapper 타임아웃 0건 확인

---

## 🔒 금요일 - 주간 마무리

### 보안 스캔

```bash
Task security-specialist "이번 주 커밋된 변경사항 보안 스캔"
# OWASP Top 10, 환경변수 노출, 인증/인가 로직, API 보안 검토
```

### 코드 품질 리포트

```bash
Task code-review-specialist "이번 주 커밋 품질 종합 리포트"
# TypeScript strict mode, any 타입, 코드 복잡도, 테스트 커버리지
```

**체크포인트**:
- [ ] 보안 취약점 0건 확인
- [ ] 코드 품질 점수 9.0/10 이상 유지
- [ ] TypeScript 에러 0개 유지

---

## 🚀 배포 전 - 필수 체크리스트

### 종합 테스트 진단

```bash
Task test-automation-specialist "배포 전 종합 테스트 진단"
# Unit 테스트 실행, E2E 테스트, 실패 원인 자동 분류, 보안/성능 스캔
```

### Vercel 배포 최적화

```bash
Task vercel-platform-specialist "배포 최적화 및 환경변수 검증"
# 환경변수, 빌드 설정, Edge Functions, 무료 티어 사용량 (30% 유지)
```

**체크포인트**:
- [ ] 테스트 통과율 88% 이상
- [ ] Vercel 빌드 성공
- [ ] 환경변수 검증 완료
- [ ] 무료 티어 한도 안전

---

## 🎯 상황별 즉시 호출 가이드

### 긴급 상황

| 상황 | 즉시 호출 명령어 | 예상 효과 |
|------|-----------------|----------|
| 🐛 **프로덕션 버그** | `Task debugger-specialist "근본 원인 분석"` | 정확한 진단 |
| 🚨 **보안 이슈** | `Task security-specialist "긴급 보안 스캔"` | 취약점 탐지 |
| 🧪 **테스트 대량 실패** | `Task test-automation-specialist "실패 원인 진단"` | 자동 분류 |

### 계획된 작업

| 작업 | 권장 서브에이전트 | 활용 시점 |
|------|-----------------|----------|
| 🏗️ **대규모 리팩토링** | structure-refactor-specialist | 대규모 수정 전 |
| 💾 **DB 스키마 변경** | database-administrator | 스키마 변경 시 |
| 🎨 **UI 개선** | ui-ux-specialist | 디자인 구축 시 |
| 📝 **문서화** | documentation-manager | 메모리 최적화 시 |
| ☁️ **GCP 배포** | gcp-cloud-functions-specialist | 설정 시 |

---

**💡 핵심**: 정기적 활용으로 "잊혀진 도구"가 아닌 "자연스럽게 사용되는 도구"로 전환
