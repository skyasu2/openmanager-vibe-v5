# Gemini CLI 로컬 개발 협업 도구

이 폴더는 로컬 개발 환경에서 Gemini CLI와 협업하기 위한 도구와 문서를 포함합니다.

## 🚨 중요 사항

- **로컬 개발 전용**: 이 폴더의 내용은 프로덕션 코드와 무관합니다
- **Gemini CLI**: 터미널에서 사용하는 개발 보조 도구입니다 (API 키 불필요)
- **Google AI API**: 프로덕션 AI 기능과는 완전히 별개입니다
- **인증 방식**: 로그인만 필요, API 사용 금지

## 📁 폴더 구조

```
development/gemini-local/
├── README.md                    # 이 파일
├── gemini-collaboration.md      # 상세 협업 가이드
├── examples/                    # 사용 예시
│   └── project-context.sh       # 프로젝트 컨텍스트 설정
└── templates/                   # 템플릿 파일들
    └── analysis-prompts.txt     # 분석용 프롬프트 템플릿
```

## 🚀 빠른 시작

1. Gemini CLI 설치 확인:
```bash
gemini --version
```

2. 로그인 (최초 1회):
```bash
gemini login
# 브라우저에서 Google 계정으로 로그인
```

3. 프로젝트 컨텍스트 설정:
```bash
# 프로젝트 정보를 Gemini 메모리에 저장
bash development/gemini-local/examples/project-context.sh
```

4. 효율적인 사용:
```bash
# 특정 파일 분석
cat src/app/page.tsx | gemini -p "인증 로직 분석"

# 간단한 질문
echo "로그인 문제" | gemini -p "해결책 3줄 요약"
```

## 📝 개발 노트

- 일일 1,000회 사용 제한 고려
- 토큰 절약을 위해 필요한 부분만 전달
- 중요 정보는 메모리에 저장

## 🔗 관련 문서

- [Gemini 협업 가이드](./gemini-collaboration.md)
- [프로젝트 CLAUDE.md](../../CLAUDE.md#gemini-cli-collaboration)