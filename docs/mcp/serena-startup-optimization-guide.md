# Serena MCP 시작 메시지 최적화 가이드

## 📊 현재 문제점 분석

### 1. 과도한 로그 출력

- **문제**: 시스템 프롬프트 전체(180+ 줄)가 INFO 레벨로 출력
- **영향**: 시작 시 화면이 불필요한 정보로 가득 참

### 2. 중복 정보

- 도구 목록이 여러 형태로 반복 출력
- 내부 함수명 노출로 사용자 친화적이지 않음

### 3. 유용한 정보 부족

- 다음 단계 안내 없음
- 연결 확인 방법 불명확

## ✨ 개선 방안

### 1. 로그 레벨 조정

```python
# serena_config.yml 수정
logging:
  level: INFO
  console_level: INFO
  file_level: DEBUG

  # 시스템 프롬프트는 파일에만 기록
  system_prompt_to_console: false

  # 간결한 시작 메시지
  startup_format: "concise"
```

### 2. 사용자 친화적 시작 메시지

```
╔═══════════════════════════════════════════════╗
║        Serena MCP Server v0.1.3              ║
║     Advanced Code Intelligence Platform       ║
╚═══════════════════════════════════════════════╝

✓ Configuration loaded from ~/.serena/serena_config.yml
✓ Project activated: openmanager-vibe-v5
✓ Web dashboard: http://127.0.0.1:24282/dashboard
✓ 25 tools ready (code analysis, editing, memory)

Ready for Claude Code connection!
```

### 3. 빠른 시작 가이드 추가

```bash
# 연결 확인
claude mcp list | grep serena

# 프로젝트 활성화 테스트
mcp__serena__activate_project({ "project": "openmanager-vibe-v5" })

# 기본 기능 테스트
mcp__serena__list_memories()
```

## 🚀 구현 방법

### 방법 1: Serena 설정 파일 수정

```yaml
# ~/.serena/serena_config.yml
agent:
  startup:
    show_system_prompt: false
    show_tool_details: false
    concise_mode: true

logging:
  console:
    level: INFO
    filter_system_prompt: true
  file:
    level: DEBUG
    include_all: true
```

### 방법 2: 환경 변수 설정

```bash
# ~/.bashrc 또는 ~/.zshrc에 추가
export SERENA_STARTUP_MODE="concise"
export SERENA_LOG_SYSTEM_PROMPT="false"
export SERENA_SHOW_QUICK_START="true"
```

### 방법 3: 커스텀 래퍼 스크립트

```bash
#!/bin/bash
# ~/bin/serena-start

# 간결한 모드로 Serena 시작
SERENA_STARTUP_MODE=concise \
SERENA_LOG_LEVEL=INFO \
serena mcp 2>&1 | grep -v "System prompt:" | \
sed 's/INFO.*serena.agent:create_system_prompt.*/✓ System configured/'
```

## 📋 체크리스트

- [ ] 시스템 프롬프트를 DEBUG 레벨로 변경
- [ ] 중복 도구 목록 제거
- [ ] 사용자 친화적 도구 이름 표시
- [ ] Quick Start 가이드 추가
- [ ] 연결 확인 방법 제공
- [ ] 웹 대시보드 링크 강조
- [ ] 프로세스 정보 간소화

## 🎯 기대 효과

1. **시작 시간 단축**: 불필요한 출력 제거로 5초 → 2초
2. **가독성 향상**: 핵심 정보만 표시
3. **사용성 개선**: 명확한 다음 단계 안내
4. **디버깅 유지**: 상세 로그는 파일에 보존

## 🔧 문제 해결

### 로그가 여전히 상세하게 나오는 경우

```bash
# Serena 캐시 정리
rm -rf ~/.serena/cache/*

# 설정 재로드
serena reload-config
```

### 커스텀 설정이 적용되지 않는 경우

```bash
# 설정 파일 유효성 검사
python -m yaml ~/.serena/serena_config.yml

# 기본 설정으로 리셋
serena reset-config
```

## 📚 참고 자료

- [Serena MCP 설정 가이드](/docs/serena-mcp-setup-guide-2025.md)
- [MCP 개발 가이드](/docs/mcp-development-guide-2025.md)
- [Claude Code MCP 문서](https://docs.anthropic.com/en/docs/claude-code/mcp)

---

_마지막 업데이트: 2025-08-11_
