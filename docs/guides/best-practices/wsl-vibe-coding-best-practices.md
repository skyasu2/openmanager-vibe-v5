# WSL Vibe Coding Best Practices 비교 분석 리포트

> **분석일**: 2025-12-19
> **프로젝트**: OpenManager VIBE v5.83.4
> **분석 범위**: WSL 개발환경, AI 협업 워크플로우, 테스트 인프라

---

## 📊 Executive Summary

| 영역 | 현재 상태 | 2025 Best Practice | 개선 우선순위 |
|------|----------|-------------------|--------------|
| WSL 파일 시스템 | ❌ `/mnt/d/` (Windows) | `~/` (Linux) | 🔴 **Critical** |
| CLAUDE.md 구조 | ⚠️ 기본 구조 | 확장 구조 + plan.md | 🟡 Medium |
| MCP 서버 활용 | ✅ 4개 통합 | 동일 | ✅ Good |
| 테스트 인프라 | ✅ Vitest + Playwright | 동일 | ✅ Excellent |
| Memory 활용 | ⚠️ 문서화 없음 | Memory 가이드라인 | 🟡 Medium |

---

## 1. 🔴 Critical: WSL 파일 시스템 위치

### 현재 상태
```
프로젝트 위치: /mnt/d/cursor/openmanager-vibe-v5
파일 시스템: Windows NTFS (through WSL bridge)
```

### 문제점
```
❌ /mnt/d/ (Windows) → 10-50배 느린 I/O 성능
   - npm install: ~3분 → 수십 초 가능
   - git operations: 현저히 느림
   - file watch: 불안정
   - build time: 증가
```

### 2025 Best Practice
```bash
# 권장 위치
~/projects/openmanager-vibe-v5

# 또는
/home/user/dev/openmanager-vibe-v5
```

### 개선 방안

#### Option A: 프로젝트 마이그레이션 (권장)
```bash
# 1. Linux 파일시스템으로 복사
cp -r /mnt/d/cursor/openmanager-vibe-v5 ~/projects/

# 2. Windows에서 WSL 경로 접근
# VS Code: code ~/projects/openmanager-vibe-v5
# Explorer: \\wsl$\Ubuntu\home\user\projects\

# 3. Git remote 재설정
cd ~/projects/openmanager-vibe-v5
git remote set-url origin https://github.com/skyasu2/openmanager-vibe-v5.git
```

#### Option B: 현재 위치 유지 (타협안)
```bash
# .wslconfig 최적화 (Windows 사용자 폴더에 생성)
# C:\Users\<username>\.wslconfig

[wsl2]
memory=8GB
processors=4
localhostForwarding=true

[experimental]
sparseVhd=true
autoMemoryReclaim=gradual
```

### 예상 성능 개선
| 작업 | 현재 (Windows) | 개선 후 (Linux) |
|------|---------------|----------------|
| npm install | ~180초 | ~30초 |
| next build | ~207초 | ~60초 |
| vitest run | ~3.4초 | ~0.5초 |
| git status | ~2초 | ~0.1초 |

---

## 2. 🟡 Medium: CLAUDE.md 구조 개선

### 현재 구조
```markdown
# CLAUDE.md (현재)
├── 프로젝트 개요
├── 워크플로우 (Quick Start)
├── 핵심 원칙
├── AI 협업 가이드
└── 주요 참조
```

### 2025 Best Practice 구조
```markdown
# CLAUDE.md (권장)
├── 프로젝트 개요
├── 🎯 Plan Mode 가이드          # NEW
│   ├── plan.md 작성법
│   └── 실행 전 확인사항
├── 워크플로우 (Quick Start)
├── 핵심 원칙
├── AI 협업 가이드
│   ├── MCP 서버 활용 (기존)
│   ├── CLI 도구 활용 (기존)
│   └── 🧠 Memory 가이드라인    # NEW
├── 🧪 테스트 Quick Reference   # NEW
└── 주요 참조
```

### 추가 권장 섹션

#### 2.1 Plan Mode 가이드
```markdown
## 🎯 Plan Mode 워크플로우

### 복잡한 기능 개발 시
1. `plan.md` 파일 먼저 작성
2. Claude Code에게 plan 검토 요청
3. 승인 후 단계별 실행

### plan.md 템플릿
```markdown
# Feature: [기능명]

## 목표
- [ ] 구체적 목표 1
- [ ] 구체적 목표 2

## 영향 범위
- 파일: src/...
- 테스트: tests/...

## 구현 단계
1. Step 1
2. Step 2
3. Step 3

## 리스크
- 주의사항 1
```
```

#### 2.2 Memory 가이드라인
```markdown
## 🧠 Memory 활용

### Memory 저장 대상
- 프로젝트별 컨벤션
- 반복되는 패턴/구조
- 에러 해결 히스토리
- 환경 설정 특이사항

### Memory 명령어
```bash
# Serena MCP를 통한 Memory
@serena write_memory "project-conventions"
@serena list_memories
@serena read_memory "project-conventions"
```
```

#### 2.3 테스트 Quick Reference
```markdown
## 🧪 테스트 Quick Reference

| 상황 | 명령어 | 시간 |
|------|-------|------|
| 커밋 전 빠른 검증 | `npm run test:quick` | 22ms |
| 전체 테스트 | `npm run test` | ~5분 |
| E2E Critical | `npm run test:e2e:critical` | ~1분 |
| 커버리지 | `npm run test:coverage` | ~2분 |
| Watch 모드 | `npm run test:watch` | 지속 |
```

---

## 3. ✅ Good: MCP 서버 활용 (현재 수준 유지)

### 현재 설정 (이미 Best Practice)
```yaml
# 활성화된 MCP 서버
- serena      # 코드/구조 파악
- context7    # 최신 문서 참조
- brave-search # 웹 검색
- tavily      # 심층 리서치
- supabase    # DB 관리
- vercel      # 배포 관리
- playwright  # E2E 자동화
- figma       # 디자인 연동
- github      # 코드 관리
```

### 활용 패턴 (이미 적용됨)
```bash
# 코드 탐색
@serena "find_symbol ServerCard"

# 문서 참조
@context7 "Next.js 16 App Router"

# 리서치
@brave-search "Vitest vmThreads performance"
```

---

## 4. ✅ Excellent: 테스트 인프라 (Best Practice 달성)

### 현재 강점
| 항목 | 현재 상태 | 평가 |
|------|----------|------|
| CI 속도 | 22ms (92 tests) | ⭐ Excellent |
| 설정 분리 | 3개 Vitest + 2개 Playwright | ⭐ Best Practice |
| 병렬 실행 | vmThreads, Workers 4-6 | ⭐ Optimized |
| API Mocking | MSW 2.12.3 | ⭐ Modern |
| E2E | Playwright (Chromium Only) | ⭐ Efficient |

### 유지 권장 사항
- minimal.ts의 vmThreads 설정 유지
- Chromium-only E2E 정책 유지
- CI/CD 파이프라인 3단계 구조 유지

---

## 5. 📋 개선 실행 계획

### Phase 1: 즉시 적용 가능 (1일)
```markdown
- [ ] CLAUDE.md에 테스트 Quick Reference 섹션 추가
- [ ] CLAUDE.md에 Memory 가이드라인 추가
- [ ] .wslconfig 최적화 (Windows 측)
```

### Phase 2: 단기 (1주)
```markdown
- [ ] plan.md 템플릿 생성 (docs/templates/)
- [ ] CLAUDE.md Plan Mode 섹션 추가
- [ ] Serena Memory에 프로젝트 컨벤션 저장
```

### Phase 3: 중기 (선택적)
```markdown
- [ ] 프로젝트 Linux 파일시스템 마이그레이션 검토
- [ ] Windows/Linux 듀얼 환경 설정 문서화
```

---

## 6. 🎯 Vibe Coding 2025 핵심 원칙 요약

### DO (권장)
```
✅ Plan 먼저, 실행은 나중
✅ 작은 단위로 커밋 (Small Diffs)
✅ 테스트와 코드 함께 작성
✅ Memory에 컨텍스트 저장
✅ MCP 서버 적극 활용
✅ 질문하고 옵션 제시받기
✅ CLAUDE.md 지속 업데이트
```

### DON'T (피해야 할 것)
```
❌ 한번에 큰 변경 시도
❌ 테스트 없이 배포
❌ 컨텍스트 잃어버리면 처음부터
❌ Windows 파일시스템에서 무거운 빌드
❌ 수동으로 반복 작업
```

---

## 7. 결론

### 현재 프로젝트 평가: **B+ (Good)**

| 영역 | 점수 | 비고 |
|------|------|------|
| 테스트 인프라 | A+ | 이미 Best Practice |
| MCP 통합 | A | 충분히 활용 중 |
| CLAUDE.md | B | 개선 여지 있음 |
| WSL 환경 | C | 성능 병목 존재 |
| Memory 활용 | C+ | 문서화 부족 |

### 우선순위 개선 권장
1. **WSL 성능**: `.wslconfig` 최적화 또는 마이그레이션
2. **CLAUDE.md**: Plan Mode + Memory 가이드 추가
3. **문서화**: 테스트 Quick Reference 추가

---

_Last Updated: 2025-12-19_
