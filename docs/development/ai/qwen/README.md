---
category: qwen-cli
purpose: qwen_cli_documentation
last_updated: '2025-12-08'
---

# Qwen CLI

Alibaba Qwen CLI 관련 문서

## 현재 상태

- **버전**: v0.4.0
- **래퍼 버전**: v3.2.0
- **역할**: Fallback 코드 리뷰 (Primary 실패 시)

## 문서 목록

| 문서 | 설명 |
|------|------|
| [qwen-timeout-analysis-and-fix.md](./qwen-timeout-analysis-and-fix.md) | 타임아웃 문제 분석 및 해결 |

## 빠른 참조

```bash
# 코드 리뷰 실행
qwen -p "성능 분석해주세요"

# 타임아웃 설정 (기본 180초)
QWEN_TIMEOUT=300 qwen -p "대용량 파일 분석"
```

## 관련 문서

- [ai-wrappers-guide.md](../common/ai-wrappers-guide.md) - Qwen 래퍼 설정
- [ai-benchmarks.md](../common/ai-benchmarks.md) - 성능 비교

---

**관련**: [Codex](../codex/) | [Gemini](../gemini/) | [AI Registry](../../../../config/ai/registry-core.yaml)
