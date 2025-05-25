# 🖥️ OpenManager Vibe v5

기업 환경을 위한 **프로덕션 레디** 서버 모니터링 플랫폼

## 📊 주요 특징

- **🔄 실시간 모니터링**: 30개 서버 (K8s 10개, AWS 10개, 온프레미스 10개)
- **🎛️ 이중화 저장소**: Supabase + Redis 캐시 구조
- **🤖 AI 기반 분석**: MCP 프로토콜로 자연어 질의 지원
- **⚡ 더미/프로덕션 모드**: 환경변수 하나로 즉시 전환

## 🚀 빠른 시작

```bash
# 1. 프로젝트 클론
git clone https://github.com/your-org/openmanager-vibe-v5
cd openmanager-vibe-v5

# 2. 의존성 설치
npm install

# 3. 환경설정 (더미 모드)
cp .env.example .env.local

# 4. 개발 서버 실행
npm run dev
```

## 📚 문서

| 문서 | 설명 |
|------|------|
| [`docs/01-프로젝트가이드.md`](docs/01-프로젝트가이드.md) | 📖 제품 소개 및 사용법 |
| [`docs/02-개발가이드.md`](docs/02-개발가이드.md) | 🛠️ 개발 환경 구축 |
| [`docs/03-API문서.md`](docs/03-API문서.md) | 🔗 REST API 명세 |
| [`docs/04-배포가이드.md`](docs/04-배포가이드.md) | 🚀 프로덕션 배포 |
| [`docs/05-트러블슈팅.md`](docs/05-트러블슈팅.md) | 🔧 문제 해결 |
| [`docs/environment-setup.md`](docs/environment-setup.md) | ⚙️ 환경변수 설정 |

## 🎯 기술 스택

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Node.js, Redis, Supabase
- **Monitoring**: Prometheus, AWS CloudWatch, Custom APIs
- **Deployment**: Vercel, Docker, AWS EC2

## 📞 지원

- **🐛 버그 리포트**: [GitHub Issues](https://github.com/your-org/openmanager-vibe-v5/issues)
- **💡 기능 제안**: [GitHub Discussions](https://github.com/your-org/openmanager-vibe-v5/discussions)
- **📖 상세 가이드**: [`docs/`](docs/) 폴더 참조

---

> 💡 **처음 사용하시나요?** [`docs/01-프로젝트가이드.md`](docs/01-프로젝트가이드.md)부터 시작하세요!
Git 설정 테스트 완료

# OpenManager AI - 차세대 서버 모니터링 시스템

NPU와 MCP 엔진 기반 AI 에이전트로 서버 관리를 혁신하는 차세대 모니터링 솔루션입니다.

## 🚀 주요 특징

- **NPU 기반 경량 AI**: LLM 비용 없는 실시간 AI 추론
- **자연어 인터페이스**: 일상 대화로 서버 관리
- **지능형 분석**: 근본원인 분석 및 예측 알림
- **완전 절전 시스템**: 테스트/시연 안 할 때 사용량 최소화
- **실제 환경 지원**: 수정 없이 프로덕션 환경 적용 가능

## 🔋 3단계 절전 시스템

### 1. 완전 정지 모드 (stopped)
- 모든 데이터 수집 완전 중단
- AI 에이전트도 비활성화
- 완전 절전으로 사용량 0

### 2. AI 모니터링 모드 (ai-monitoring)
- 5분 간격으로 최소한의 헬스체크만 수행
- 중요한 변화 감지 시 자동으로 전체 시스템 활성화
- 30분 동안 데이터 변화가 없으면 자동 종료
- 최소한의 리소스 사용

### 3. 완전 활성화 모드 (active)
- 30초 간격 실시간 데이터 수집
- 모든 기능 활성화
- 20분 타이머 후 자동으로 AI 모니터링 모드로 전환

## 🏭 실제 서버 환경 적용

### 환경 자동 감지
시스템이 자동으로 환경을 감지하여 적절한 모드로 동작합니다:

- **프로덕션 환경**: 실제 메트릭 수집 (SSH, SNMP, Agent API)
- **개발/데모 환경**: 시뮬레이션 모드

### 지원하는 메트릭 수집 방법

#### 1. SSH 기반 수집
```bash
# Linux 서버에서 직접 명령어 실행
SSH_USERNAME=monitoring
SSH_PRIVATE_KEY_PATH=/path/to/private/key
SSH_PORT=22
```

#### 2. SNMP 기반 수집
```bash
# 네트워크 장비 및 서버 SNMP 모니터링
SNMP_COMMUNITY=public
SNMP_VERSION=2c
SNMP_PORT=161
```

#### 3. Agent API 기반 수집
```bash
# 커스텀 모니터링 에이전트 API
AGENT_API_ENDPOINT=http://monitoring-agent:8080/api
AGENT_API_KEY=your-api-key-here
```

#### 4. 클라우드 API 기반 수집
```bash
# AWS CloudWatch, Azure Monitor, GCP Monitoring
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
KUBECONFIG=/path/to/kubeconfig
```

### 프로덕션 환경 설정

1. **환경변수 설정**:
```bash
NODE_ENV=production
DEPLOY_MODE=production
PRIMARY_SOURCE=ssh  # 또는 snmp, agent, api
```

2. **SSH 키 설정** (SSH 방식 사용 시):
```bash
# 모니터링용 SSH 키 생성
ssh-keygen -t rsa -b 4096 -f /path/to/monitoring_key

# 대상 서버에 공개키 배포
ssh-copy-id -i /path/to/monitoring_key.pub monitoring@target-server
```

3. **SNMP 설정** (SNMP 방식 사용 시):
```bash
# 대상 서버에서 SNMP 활성화
sudo apt-get install snmpd
sudo systemctl enable snmpd
```

4. **데이터베이스 설정**:
```bash
# PostgreSQL + Redis 이중화 저장
DATABASE_URL=postgresql://user:password@localhost:5432/openmanager
REDIS_URL=redis://localhost:6379
```

## 🛠️ 설치 및 실행

### 개발/데모 환경
```bash
git clone https://github.com/skyasu2/openmanager-vibe-v5.git
cd openmanager-vibe-v5
npm install
npm run dev
```

### 프로덕션 환경
```bash
# 1. 환경변수 설정
cp .env.production.example .env.local
# .env.local 파일을 실제 환경에 맞게 수정

# 2. 빌드 및 실행
npm run build
npm start

# 또는 Docker 사용
docker build -t openmanager-ai .
docker run -d --env-file .env.local -p 3000:3000 openmanager-ai
```

## 🤖 AI 에이전트 자동 감지

AI가 다음 상황에서 자동으로 시스템을 활성화합니다:

- **CPU 20% 이상 급변**
- **Memory 15% 이상 급변**
- **Disk 10% 이상 급변**
- **CPU 90% 이상 임계값 초과**
- **Memory 95% 이상 임계값 초과**
- **네트워크 지연 100ms 이상 증가**

## 📊 지원하는 메트릭

- **시스템 메트릭**: CPU, Memory, Disk, Network
- **프로세스 정보**: 실행 중인 서비스, PID, 리소스 사용량
- **하드웨어 정보**: 온도, 전력 사용량, 로드 평균
- **네트워크 메트릭**: 대역폭, 지연시간, 연결 수
- **알림 및 이벤트**: 실시간 상태 변화 감지

## 🔧 기술 스택

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Node.js, Next.js API Routes
- **Database**: Supabase (PostgreSQL) + Redis
- **AI Engine**: NPU 시뮬레이션, MCP 프로토콜
- **Monitoring**: SSH, SNMP, Agent API, Cloud APIs
- **Deployment**: Vercel, Docker

## 📈 성능 최적화

- **절전 모드**: 평상시 사용량 0
- **AI 모니터링**: 5분 간격 최소 체크
- **이중화 저장**: PostgreSQL + Redis
- **캐싱 전략**: 메트릭 데이터 24시간 보존
- **압축 전송**: 네트워크 대역폭 최적화

## 🔒 보안 기능

- **SSH 키 인증**: 비밀번호 없는 안전한 접근
- **API 키 관리**: 토큰 기반 인증
- **데이터 암호화**: 전송 및 저장 데이터 보호
- **접근 제어**: 역할 기반 권한 관리
- **감사 로그**: 모든 활동 기록

## 📝 라이선스

Copyright(c) 저작자. All rights reserved.

---

**Vibe Coding으로 개발됨** - GPT/Claude + Cursor AI 협업 개발 방법론
