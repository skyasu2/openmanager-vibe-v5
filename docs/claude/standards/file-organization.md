# 파일 조직 및 구조

## 파일 크기 제한
- **권장**: 500줄 이하
- **최대**: 1500줄
- **초과 시**: 파일 분리 필수

## 폴더 구조
```
src/
├── components/     # React 컴포넌트
├── services/       # 비즈니스 로직
├── types/          # TypeScript 타입 정의
├── utils/          # 유틸리티 함수
└── app/            # Next.js App Router
```

## 네이밍 규칙
- **컴포넌트**: PascalCase (ServerCard.tsx)
- **유틸리티**: camelCase (formatDate.ts)
- **타입**: PascalCase (ServerData.ts)
- **폴더**: kebab-case (ai-engine/)

→ 상세 내용은 프로젝트 문서 참조
