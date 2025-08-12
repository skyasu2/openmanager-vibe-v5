# 🔧 npm-global Config Mismatch 해결 가이드

## 📋 개요

Claude Code `/status` 명령어에서 다음과 같은 경고가 표시되는 경우:

```
⚠️ Config mismatch: running npm-global but config says unknown
```

이 가이드는 WSL 환경에서 npm 전역 설정 문제를 진단하고 해결하는 방법을 제공합니다.

## ⚠️ 중요 참고사항 (Claude Code v1.0.72)

**이 경고는 Claude Code의 알려진 이슈입니다:**
- **영향**: 기능에 영향 없음 (cosmetic issue)
- **원인**: Claude Code가 npm-global 실행을 감지하지만 설정 불일치 경고 표시
- **버전**: v1.0.72에서 `installMethod` 설정 키가 존재하지 않음
- **GitHub Issues**: [#3915](https://github.com/anthropics/claude-code/issues/3915), [#4977](https://github.com/anthropics/claude-code/issues/4977)
- **상태**: 향후 버전에서 해결 예정

## 🔍 문제 원인

이 경고는 다음과 같은 상황에서 발생합니다:

1. **npm이 전역 설치 경로에서 실행**되고 있지만 Claude Code가 이를 제대로 인식하지 못함
2. **npm prefix 경로가 올바르게 설정되지 않음**
3. **PATH 환경변수가 npm 설치 위치를 제대로 가리키지 않음**
4. **WSL과 Windows의 Node.js가 혼용**되고 있음

## 🛠️ 진단 명령어

### 1. 현재 설정 확인

```bash
# npm 위치 및 버전 확인
which npm
npm --version
node --version

# npm prefix 확인 (전역 패키지 설치 위치)
npm config get prefix

# 전역 패키지 루트 확인
npm root -g

# PATH 확인
echo $PATH | tr ':' '\n' | grep -E "(npm|node)"

# nvm 또는 n 사용 여부 확인
command -v nvm
command -v n
echo $NVM_DIR
```

## ✅ 해결 방법

### 케이스 1: nvm 사용 중 (권장)

```bash
# 1. nvm이 제대로 로드되는지 확인
echo $NVM_DIR
# 출력: /home/사용자명/.nvm

# 2. ~/.bashrc에 nvm 설정 확인 및 추가
grep -q "NVM_DIR" ~/.bashrc || {
  echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
  echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
  echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
}

# 3. 셸 재로드
source ~/.bashrc

# 4. 기본 Node 버전 설정
nvm alias default node

# 5. 확인
which npm
npm config get prefix
```

### 케이스 2: 시스템 npm 사용

```bash
# 1. 사용자 전용 npm 전역 디렉토리 생성
mkdir -p ~/.npm-global

# 2. npm prefix 설정
npm config set prefix '~/.npm-global'

# 3. PATH에 추가
echo '' >> ~/.bashrc
echo '# npm global path' >> ~/.bashrc
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc

# 4. 셸 재로드
source ~/.bashrc

# 5. 확인
npm config get prefix
echo $PATH | grep npm-global
```

### 케이스 3: Windows Node.js 제거 (혼용 문제)

```bash
# 1. 현재 npm 경로 확인
which npm

# Windows 경로(/mnt/c/)를 사용 중이라면:
# 2. WSL 네이티브 Node.js 설치
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. npm prefix 설정
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc
source ~/.bashrc
```

## 🧪 검증 단계

```bash
# 1. npm config 확인
npm config get prefix
# 예상 출력: /home/사용자명/.npm-global 또는 /home/사용자명/.nvm/versions/node/버전

# 2. 전역 패키지 테스트 설치
npm install -g npm-check-updates
which ncu
# ncu가 npm prefix 경로에 설치되어야 함

# 3. Claude Code status 재실행
/status
# Config mismatch 경고가 사라져야 함

# 4. 새 셸에서 영속성 확인
exec bash
which npm
npm config get prefix
```

## ⚠️ 주의사항

### 부작용
- **기존 전역 패키지**: npm prefix 변경 시 기존 전역 패키지 재설치 필요
- **PATH 우선순위**: 여러 Node.js 설치가 있을 경우 PATH 순서 중요

### 백업
```bash
# 변경 전 현재 전역 패키지 목록 저장
npm list -g --depth=0 > ~/npm-global-packages-backup.txt
```

### WSL 특이사항
- **WSL2 권장**: WSL1보다 성능과 호환성 우수
- **Windows npm 피하기**: `/mnt/c/Program Files/nodejs` 경로 사용 지양
- **네이티브 경로 사용**: WSL 내부 경로가 Windows 경로보다 빠름

## 🚀 빠른 수정 (일반적인 경우)

```bash
# nvm이 설치되어 있는 경우
source ~/.bashrc && nvm alias default node && /status

# 시스템 npm 사용 시
npm config set prefix ~/.npm-global && \
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.bashrc && \
source ~/.bashrc && \
/status
```

## 📊 현재 프로젝트 설정 (검증됨)

이 프로젝트는 다음 설정으로 정상 작동 중:

- **Node.js**: v22.18.0 (nvm 관리)
- **npm**: 10.9.2
- **npm prefix**: `~/.nvm/versions/node/v22.18.0`
- **전역 패키지 경로**: `~/.nvm/versions/node/v22.18.0/lib/node_modules`

## 🎯 이해와 대응

### 1. 문제의 본질
- Claude Code v1.0.72의 알려진 버그
- 기능에는 전혀 영향 없음 (cosmetic issue)
- 향후 버전에서 해결 예정

### 2. 현재 상태 확인
```bash
# Claude Code 버전 확인
claude --version

# npm 설정 확인
npm config get prefix
which npm
which claude
```

### 3. npm 설정 최적화
```bash
# npm 캐시 정리로 일부 설정 문제 해결
npm cache clean --force

# nvm 사용 시 prefix 동기화
npm config set prefix ~/.nvm/versions/node/$(node -v)
```

## 🔗 관련 문서

- [WSL + Claude Code 가이드](./wsl-claude-code-guide.md)
- [개발 환경 설정](../README.md)
- [Node.js 공식 문서](https://nodejs.org/docs/)
- [nvm 공식 문서](https://github.com/nvm-sh/nvm)

---

최종 업데이트: 2025-08-12
작성자: Claude Code + skyasu