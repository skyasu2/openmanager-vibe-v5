# WSL 터미널 최적화 가이드

## 문제점

WSL (Windows Subsystem for Linux) 터미널에서 서브에이전트 진행률 표시 시 화면이 위아래로 움직이는 문제 발생.

### 원인

1. **`console.clear()`**: 1초마다 전체 화면을 지우고 다시 그림
2. **잦은 업데이트**: 너무 빈번한 콘솔 출력
3. **WSL 터미널 특성**: Windows Terminal과 다른 버퍼 처리

## 해결 방법

### 1. 코드 수정 사항

#### agent-progress-tracker.ts

- `console.clear()` 제거
- 업데이트 주기를 1초 → 5초로 변경
- 전체 화면 대신 진행 중인 작업만 표시
- WSL 환경에서 중요 메시지만 출력

#### task-integration.ts

- 업데이트 주기를 2초 → 5초로 변경
- 진행률이 변경된 경우에만 출력

### 2. 환경 설정

```bash
# WSL 환경 자동 감지
export WSL_TERMINAL_OPTIMIZE=true

# 상세 출력 모드 (선택사항)
export VERBOSE=true

# 진행률 업데이트 주기 커스터마이징
export PROGRESS_UPDATE_INTERVAL=10000  # 10초
```

### 3. 사용 권장사항

#### 개발 중

```bash
# WSL에서는 간단한 출력 모드 사용
unset VERBOSE
```

#### 디버깅 시

```bash
# 필요시에만 상세 모드 활성화
export VERBOSE=true
```

## 추가 최적화

### 1. 터미널 설정

Windows Terminal에서:

- 버퍼 크기 증가: Settings → 프로필 → 고급 → 히스토리 크기
- GPU 가속 활성화: Settings → 렌더링

### 2. 대체 모니터링 방법

```typescript
// 파일로 진행률 기록
export PROGRESS_LOG_FILE=/tmp/agent-progress.log

// 웹 대시보드 사용 (개발 예정)
export PROGRESS_WEB_UI=true
```

## 호환성

- ✅ WSL2 Ubuntu
- ✅ Windows Terminal
- ✅ VS Code 통합 터미널
- ✅ ConEmu / cmder
- ⚠️ 기본 cmd/PowerShell (제한적)
