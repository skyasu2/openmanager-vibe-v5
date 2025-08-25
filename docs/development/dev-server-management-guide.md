# 🚀 개발 서버 관리 가이드

**최신 업데이트**: 2025-08-25  
**목적**: 중복 실행 방지 및 안전한 개발 서버 관리

## 📋 개요

OpenManager VIBE v5는 중복 실행 방지와 안전한 서버 관리를 위한 전용 관리 스크립트를 제공합니다. 이 가이드는 개발 서버의 효율적인 관리 방법을 안내합니다.

## 🎯 주요 문제점

### 기존 문제점들
- ✅ **해결됨**: 다중 서버 동시 실행으로 인한 포트 충돌
- ✅ **해결됨**: 메모리 리소스 과다 사용 
- ✅ **해결됨**: 프로세스 좀비화 및 정리 어려움
- ✅ **해결됨**: 서버 상태 파악의 어려움

### 해결 방안
- 🛠️ **자동 중복 탐지**: 기존 서버 프로세스 자동 감지
- 🔒 **안전한 종료**: SIGTERM → SIGKILL 순차적 종료
- 📊 **상태 모니터링**: 포트 및 프로세스 상태 실시간 확인
- 🎮 **통합 명령어**: npm 스크립트로 간편한 관리

## 🛠️ 관리 스크립트

### 📁 파일 위치
```
scripts/dev-server-manager.sh
```

### 🎮 사용 가능한 명령어

#### 1. 상태 확인
```bash
# 직접 실행
./scripts/dev-server-manager.sh status

# npm 스크립트
npm run dev:check
```

**출력 예시:**
```
🚀 OpenManager 개발 서버 관리자
=================================

📊 개발 서버 상태:

ℹ️  현재 실행 중인 개발 서버 확인...
⚠️  발견된 개발 서버: npm 프로세스 2개, next-server 프로세스 1개

📋 실행 중인 프로세스 목록:
   skyasu     24115  npm run dev
   skyasu     24146  next-server (v15.5.0)

ℹ️  포트 3000-3010 사용 상황 확인...
⚠️  사용 중인 포트 발견:
   LISTEN *:3000 users:(("next-server",pid=24146,fd=22))
```

#### 2. 안전한 서버 시작
```bash
# 직접 실행 (권장)
./scripts/dev-server-manager.sh start

# npm 스크립트
npm run dev:safe
```

**동작 과정:**
1. 🔍 기존 서버 프로세스 체크
2. ❓ 중복 발견 시 사용자에게 확인 요청
3. 🛑 기존 서버 안전 종료
4. 🚀 새 서버 시작

#### 3. 서버 종료
```bash
# 직접 실행
./scripts/dev-server-manager.sh stop

# npm 스크립트  
npm run dev:stop
```

**종료 프로세스:**
1. 🔍 실행 중인 npm/next 프로세스 탐지
2. 🛑 SIGTERM 신호로 정상 종료 시도
3. ⏰ 3초 대기
4. ⚡ 남은 프로세스 SIGKILL로 강제 종료

#### 4. 서버 재시작
```bash
# 직접 실행
./scripts/dev-server-manager.sh restart

# npm 스크립트
npm run dev:restart
```

## 📊 npm 스크립트 통합

### 새로 추가된 스크립트들

| 명령어 | 기능 | 설명 |
|--------|------|------|
| `npm run dev:safe` | 안전한 서버 시작 | 중복 체크 후 시작 |
| `npm run dev:check` | 서버 상태 확인 | 프로세스 및 포트 상태 |
| `npm run dev:stop` | 서버 종료 | 모든 개발 서버 종료 |
| `npm run dev:restart` | 서버 재시작 | 종료 후 재시작 |

### 기존 스크립트와의 관계

```bash
# 기존 방식 (비권장 - 중복 위험)
npm run dev

# 권장 방식 (안전함)
npm run dev:safe
```

## 🔧 고급 사용법

### 1. 배치 모드 (사용자 확인 없이)
```bash
# 강제 재시작 (기존 서버 자동 종료)
./scripts/dev-server-manager.sh restart
```

### 2. 상태만 확인
```bash
# 프로세스만 확인 (포트 체크 생략)
./scripts/dev-server-manager.sh check
```

### 3. CI/CD 환경에서 사용
```bash
# 환경 변수로 자동화 모드 설정 (향후 지원 예정)
FORCE_RESTART=1 npm run dev:safe
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. 포트가 계속 사용 중인 경우
```bash
# 포트 3000을 사용하는 프로세스 강제 종료
sudo lsof -ti:3000 | xargs kill -9

# 또는 관리 스크립트 사용
npm run dev:stop
```

#### 2. 좀비 프로세스가 남아있는 경우
```bash
# 모든 관련 프로세스 확인
ps aux | grep -E "(npm|next)" | grep -v grep

# 관리 스크립트로 정리
npm run dev:stop
```

#### 3. 스크립트 실행 권한 오류
```bash
# 실행 권한 부여
chmod +x scripts/dev-server-manager.sh
```

### 로그 분석

#### 성공적인 시작
```
✅ 실행 중인 개발 서버 없음
✅ 포트 3000-3010 모두 사용 가능  
ℹ️  새로운 개발 서버 시작...
✅ npm run dev 시작...
```

#### 중복 탐지 및 해결
```
⚠️  발견된 개발 서버: npm 프로세스 1개, next-server 프로세스 1개
ℹ️  npm 프로세스 종료: PID 12345
ℹ️  next-server 프로세스 종료: PID 12346
✅ 모든 개발 서버 종료 완료
```

## 📈 성능 최적화

### 메모리 사용량 비교

| 상황 | 메모리 사용량 | 설명 |
|------|---------------|------|
| **단일 서버** | ~250MB | 정상 상태 |
| **중복 서버 (2개)** | ~500MB | 불필요한 리소스 낭비 |
| **중복 서버 (3개)** | ~750MB | 심각한 리소스 낭비 |

### 권장 사항
- ✅ **항상 `npm run dev:safe` 사용**: 중복 방지
- ✅ **정기적 상태 확인**: `npm run dev:check`로 모니터링
- ✅ **작업 종료 시**: `npm run dev:stop`로 정리
- ❌ **직접 `npm run dev` 사용 금지**: 중복 위험

## 🔮 향후 개선 계획

### Phase 1: 자동화 강화
- [ ] 시스템 시작 시 자동 서버 정리
- [ ] 배치 모드 환경변수 지원
- [ ] 로그 파일 자동 관리

### Phase 2: 모니터링 확장
- [ ] 실시간 리소스 사용량 모니터링
- [ ] 알림 시스템 (메모리/CPU 임계값)
- [ ] 웹 기반 서버 관리 패널

### Phase 3: 통합 개발 환경
- [ ] VSCode Extension 연동
- [ ] Claude Code 통합 관리
- [ ] 자동 재시작 조건 설정

## 📚 관련 문서

- [개발 환경 설정 가이드](./development-environment.md)
- [성능 최적화 가이드](../performance/performance-optimization-complete-guide.md)
- [AI 어시스턴트 테스트 리포트](../testing/ai-assistant-functionality-test-report-2025-08-25.md)

---

**문서 작성자**: Claude Code  
**최종 업데이트**: 2025-08-25  
**다음 검토 예정**: 2025-09-01