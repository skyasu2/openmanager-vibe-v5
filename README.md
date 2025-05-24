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
