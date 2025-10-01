# 공통 작업 워크플로우

## 빠른 시작
```bash
npm run dev:stable              # 안정화된 개발 서버
npm run validate:all            # 린트+타입+테스트
npm run test:vercel:e2e         # Vercel 환경 E2E 테스트
```

## 배포 워크플로우
1. 코드 변경 완료
2. 로컬 검증 (선택적)
3. Git commit & push
4. Vercel 자동 배포
5. E2E 테스트 실행

## 트러블슈팅
- TypeScript 에러: `npm run type-check`
- 테스트 실패: `npm run test:vercel`
- 배포 실패: Vercel 로그 확인

→ 상세 내용은 CLAUDE.md 참조
