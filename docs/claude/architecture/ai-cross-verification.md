# AI 교차검증 시스템

## 개요
3-AI 협업 교차검증 시스템 - Claude, Codex, Gemini, Qwen

## 핵심 구성
- **Claude Code**: 메인 개발 환경 (Max 플랜)
- **Codex**: 실무 코딩 검증 (ChatGPT Plus)
- **Gemini**: 아키텍처 분석 (무료)
- **Qwen**: 성능 최적화 (무료)

## 사용 방법
```bash
# Claude가 자동으로 3-AI 병렬 호출 (방식 B)
"이 코드를 3개 AI로 교차검증해줘"

# → codex-specialist, gemini-specialist, qwen-specialist 동시 실행
# → 성과: 40% 속도 개선 (25초→15초), 31% 메모리 절약 (1.6GB→1.1GB)
```

→ 상세 내용은 CLAUDE.md AI 교차검증 섹션 참조
