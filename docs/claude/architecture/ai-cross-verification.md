# AI 교차검증 시스템

## 개요
3-AI 협업 교차검증 시스템 - Claude, Codex, Gemini, Qwen

## 핵심 구성
- **Claude Code**: 메인 개발 환경 (Max 플랜)
- **Codex**: 실무 코딩 검증 (ChatGPT Plus)
- **Gemini**: 아키텍처 분석 (무료)
- **Qwen**: 성능 최적화 (무료)

## 사용 방법

### 기본 검증
```bash
# Claude가 자동으로 3-AI 병렬 호출 (방식 B)
"이 코드를 3개 AI로 교차검증해줘"

# → codex-specialist, gemini-specialist, qwen-specialist 동시 실행
# → 성과: 40% 속도 개선 (25초→15초), 31% 메모리 절약 (1.6GB→1.1GB)
```

### 히스토리 기반 검증 (2025-10-02 추가)
```bash
# 이전 검증 결과와 비교
"지난번 AI 검증과 비교해서 이번 변경사항 검증해줘"

# 개선 추세 확인
"최근 AI 검증 히스토리를 분석해서 개선 추세 보여줘"

# 반복 문제 식별
"AI 검증 히스토리에서 반복되는 문제 패턴 찾아줘"
```

## 히스토리 자동 저장

**위치**: `reports/quality/ai-verifications/`

**저장 내용**:
- 검증 일시 및 대상
- 3-AI 점수 (codex, gemini, qwen)
- Claude 최종 판단
- 적용된 개선 조치
- 개선 전후 비교

**파일 형식**:
- `YYYY-MM-DD-HH-MM-description.md` - 상세 리포트
- `verification-index.json` - 검색 인덱스

**활용**:
- 개선 추세 추적
- 반복 문제 식별
- 품질 향상 검증

→ 상세 내용은 CLAUDE.md AI 교차검증 섹션 참조
