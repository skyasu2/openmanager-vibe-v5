# MCP 서버 유지보수 가이드

## 🔧 현재 설정된 MCP 서버

| 서버 | 상태 | 용도 | 주의사항 |
|------|------|------|----------|
| filesystem | ✅ | 파일 시스템 접근 | - |
| github | ✅ | GitHub API 통합 | GitHub 토큰 필요 |
| memory | ✅ | 컨텍스트 메모리 | - |
| supabase | ✅ | 데이터베이스 | Service Role Key 필요 |
| context7 | ✅ | 문서 검색 | - |
| gemini-cli | ✅ | Gemini CLI 브릿지 | 별도 로그인 필요 |
| tavily | ⚠️ | 웹 검색 | 연결 문제 해결 중 |

## 🚀 문제 해결 체크리스트

### Tavily MCP 연결 문제

1. **API 키 확인**
   ```bash
   node scripts/tavily-key-loader.cjs
   ```

2. **MCP 서버 직접 테스트**
   ```bash
   timeout 10 node scripts/tavily-mcp-wrapper-simple.cjs
   ```

3. **Claude Code 재시작**
   - 모든 창 닫기
   - 프로세스 종료 확인
   - 다시 시작

4. **설정 파일 확인**
   - `.claude/mcp.json` - MCP 서버 설정
   - `.claude/settings.local.json` - 활성화된 서버 목록

## 📅 정기 점검 항목

### 월간
- [ ] 모든 MCP 서버 연결 상태 확인
- [ ] API 키 만료일 확인
- [ ] 패키지 업데이트 확인

### 분기별
- [ ] 보안 취약점 스캔
- [ ] 사용하지 않는 MCP 서버 제거
- [ ] 문서 업데이트

## 🔐 보안 관리

1. **API 키 암호화**
   - 모든 API 키는 암호화하여 저장
   - 평문 키는 절대 커밋하지 않음

2. **환경 변수 관리**
   - `.env` 파일은 `.gitignore`에 추가
   - 프로덕션 키는 별도 관리

3. **권한 최소화**
   - 각 MCP 서버는 필요한 최소 권한만 부여
   - `settings.local.json`의 permissions 섹션 관리

## 🛠️ 트러블슈팅

### MCP 서버가 목록에 안 보일 때
1. `enabledMcpjsonServers` 배열 확인
2. 서버 이름 오타 확인 (대소문자 구분)
3. Claude Code 재시작

### 연결은 되지만 작동하지 않을 때
1. 환경 변수 확인
2. 로그 확인 (개발자 도구)
3. 패키지 버전 호환성 확인

## 📦 패키지 관리

### 업데이트 전 확인사항
```bash
# 현재 버전 확인
npm ls [패키지명]

# 업데이트 가능 버전 확인
npm outdated

# 신중하게 업데이트
npm update [패키지명]
```

### 롤백 절차
1. 이전 버전 확인 (`package-lock.json` 히스토리)
2. 특정 버전 설치: `npm install [패키지명]@[버전]`
3. 테스트 후 커밋

## 🔄 확장성 계획

### 새 MCP 서버 추가 절차
1. 패키지 설치 또는 개발
2. `.claude/mcp.json`에 설정 추가
3. `settings.local.json`에 권한 추가
4. 문서 업데이트
5. 팀원에게 공유

### 커스텀 MCP 서버 개발
- TypeScript/JavaScript 권장
- MCP SDK 사용
- 표준 인터페이스 준수
- 충분한 에러 핸들링

## 📞 지원 및 참고자료

- [MCP 공식 문서](https://modelcontextprotocol.io/docs)
- [Claude Code 문서](https://docs.anthropic.com/en/docs/claude-code)
- 프로젝트 이슈 트래커: GitHub Issues

---

최종 업데이트: 2025-07-13 (KST)