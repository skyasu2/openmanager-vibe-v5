---
id: claude-400-json-error
title: 'Claude Code 400 invalid_request_error (JSON) 해결'
description: "WSL에서 Claude Code 사용 시 'no low surrogate in string' 오류 원인과 해결"
keywords: ['claude', 'error', 'json', 'wsl', 'unicode', 'troubleshoot']
priority: medium
ai_optimized: true
related_docs: ['../wsl/README.md', 'common.md']
updated: '2025-09-16'
---

증상

- Claude Code 실행 중 다음과 같은 400 에러 발생:
  - API Error: 400 { "type":"invalid_request_error", "message":"The request body is not valid JSON: no low surrogate in string: line 1 column 64512 ..." }

주요 원인

- 요청 본문(JSON) 안의 문자열에 “짝이 맞지 않는 유니코드 서러게이트”가 포함됨.
  - 이모지(서러게이트 페어)가 잘린 상태로 포함되거나
  - 제어문자/손상된 바이트가 문자열에 섞여 들어옴
- WSL/Windows 혼합 환경에서 로케일/인코딩이 UTF-8로 일관되지 않을 때 발생 확률 증가.
- Claude Code가 대용량 컨텍스트를 구성하며 외부 파일/출력(예: MCP 툴 결과, 히스토리)을 그대로 포함하는 과정에서 깨진 문자열이 섞이는 경우.

빠른 해결 절차

1. UTF-8 로케일로 Claude 실행
   - 권장: 프로젝트 스크립트 사용
     - bash scripts/ai/launch-claude-wsl.sh
   - 위 스크립트는 LANG/LC_ALL=UTF-8로 강제하고, 실행 전 .claude/\*.json을 자동 정리합니다.

2. 로컬 .claude 설정/히스토리 정리
   - npm run claude:sanitize
   - .claude/.claude.json, .claude/settings.local.json 내의 비정상 유니코드를 정규화합니다.

3. 레포 내 텍스트 파일 점검(선택)
   - npm run scan:unicode
   - UTF-16/32 BOM, 잘못된 서러게이트, 제어문자를 보고서로 확인합니다.

추가 권장 설정(WSL)

- ~/.bashrc 또는 ~/.zshrc
  - export LANG=ko_KR.UTF-8
  - export LC_ALL=ko_KR.UTF-8
  - export LC_CTYPE=ko_KR.UTF-8
  - export PYTHONIOENCODING=UTF-8

문제 지속 시 체크리스트

- 최근에 Claude 대화에 붙여넣은 문자열/로그에 이모지나 특수문자가 과도하게 포함되었는지 확인.
- MCP 도구가 바이너리/비UTF-8 파일을 그대로 반환하지는 않는지 점검.
- 매우 큰 콘텐츠를 보낼 때(수만자 이상) 임시로 축소/요약해 전송해보기.

참고

- 이 오류는 서버 측 JSON 디코더가 \uD800~\uDFFF(서러게이트) 처리 중 짝이 맞지 않아나는 전형적인 케이스입니다. UTF-8 일관성 유지와 입력 정규화로 대부분 해결됩니다.
