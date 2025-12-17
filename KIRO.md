<!--
Kiro CLI configuration reference for OpenManager VIBE v5
Maintained for active Kiro CLI usage in WSL2
-->

# 🤖 KIRO.md - Emergency Backup Tool

> **이 문서는 Kiro CLI의 비상용 활용 가이드입니다.**
> **Role**: Emergency Backup (Claude Rate Limit 도달 시 사용)
> **Last Updated**: 2025-12-17
> **Environment**: Windows 11 + WSL2 (Ubuntu)
> **Main Tool**: `CLAUDE.md` (평상시에는 Claude Code 사용 권장)

## 문서 목적

- **비상용 도구**: Claude Code의 주간 사용량(Quota)이 소진되었을 때, 개발을 지속하기 위한 대체재(Backup)로서의 Kiro CLI 활용법을 다룹니다.
- **제한적 사용**: 평상시에는 Claude Code를 메인으로 사용하며, Kiro는 보조/비상용으로만 활용합니다.

## 현재 환경 요약

| 항목 | 값 | 출처 |
| :--- | :--- | :--- |
| **Kiro CLI** | **v1.22.0** | `kiro-cli --version` |
| 프로젝트 버전 | 5.82.0 | `package.json` |

## 활용 시나리오 (Emergency Mode)

Claude Code가 "Rate limit exceeded" 메시지를 반환할 때 다음 작업을 Kiro에게 위임합니다:

1.  **단순 구현**: 이미 설계된 컴포넌트나 함수의 코딩
2.  **로그 분석**: 에러 로그 파싱 및 원인 추론
3.  **시스템 명령**: 파일 정리, 스크립트 실행 등 단순 반복 작업

## 사용법

```bash
# 기본 채팅
kiro-cli chat "Claude 사용량이 다 찼어. 이 에러 로그 좀 분석해줘"

# 컨텍스트 기반 작업
kiro-cli chat --context src/lib/utils.ts "이 파일에 date formatting 함수 추가해줘"
```

## 다른 도구와의 관계

| 도구 | 역할 | 비고 |
| :--- | :--- | :--- |
| **Claude Code** | **Main** | 모든 개발의 중심 |
| **Kiro CLI** | **Backup** | Claude 부재 시 빈자리 채움 |
| Codex/Gemini/Qwen | Reviewer | 코드 품질 검증 (항시 가동) |

