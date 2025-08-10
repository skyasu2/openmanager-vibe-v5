# Serena MCP 서버 설정 가이드 (2025년 8월 10일 완료)

## 🎉 설정 완료 상태

**모든 11개 MCP 서버가 정상 연결되었습니다!**

### ✅ 현재 활성 MCP 서버 (11개)

| 서버명 | 상태 | 용도 |
|--------|------|------|
| **filesystem** | ✅ Connected | 파일 시스템 작업 |
| **memory** | ✅ Connected | 지식 그래프 관리 |
| **github** | ✅ Connected | GitHub 저장소 관리 |
| **supabase** | ✅ Connected | PostgreSQL 데이터베이스 |
| **playwright** | ✅ Connected | 브라우저 자동화 |
| **sequential-thinking** | ✅ Connected | 복잡한 문제 해결 |
| **context7** | ✅ Connected | 라이브러리 문서 검색 |
| **shadcn-ui** | ✅ Connected | UI 컴포넌트 개발 |
| **time** | ✅ Connected | 시간대 변환 |
| **tavily-mcp** | ✅ Connected | 웹 검색 및 추출 |
| **serena** | ✅ Connected | 고급 코드 분석 (LSP) |

## 🔧 Serena MCP 설정 방법 (성공 케이스)

### 1. 사전 준비: UV 확인
```bash
# UV는 이미 설치되어 있음 (버전 0.8.8)
uvx --version
# 출력: uvx 0.8.8
```

### 2. Serena MCP 등록 (add-json 명령 사용)

**핵심: `claude mcp add-json` 명령으로 간단하게 등록**

```bash
claude mcp add-json "serena" \
'{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'
```

### 3. 설정 확인
```bash
# 개별 서버 확인
claude mcp get serena
# 출력: Status: ✓ Connected

# 전체 서버 목록 확인
claude mcp list
```

## 📝 기존 방법과의 차이점

### ❌ 실패했던 방법
```bash
# 복잡한 옵션들이 문제였음
claude mcp add serena uvx -- --from git+https://github.com/oraios/serena \
  serena-mcp-server --context ide-assistant --project /path/to/project
```

### ✅ 성공한 방법 (간단하고 명확)
```bash
# add-json 명령 사용, 최소한의 옵션만 지정
claude mcp add-json "serena" \
'{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'
```

## 🚀 주요 성공 요인

1. **`add-json` 명령 사용**: 더 명확하고 안정적인 설정 방법
2. **최소 옵션**: `--context`나 `--project` 같은 추가 옵션 제거
3. **JSON 형식**: 명령어와 인자를 JSON으로 정확하게 전달
4. **기본값 활용**: Serena가 자동으로 프로젝트를 감지하고 설정

## 📊 최종 결과

- **이전**: 10개 서버 연결 (Serena 실패)
- **현재**: 11개 서버 모두 연결 성공
- **개선점**: Serena의 고급 코드 분석 기능 활용 가능

## 💡 추가 팁

### Serena 사용 예시
```typescript
// 코드 구조 파악
mcp__serena__get_symbols_overview({
  relative_path: "src/services"
})

// 심볼 검색
mcp__serena__find_symbol({
  name_path: "SimplifiedQueryEngine",
  include_body: true
})

// 참조 추적
mcp__serena__find_referencing_symbols({
  name_path: "query",
  relative_path: "src/services/ai/SimplifiedQueryEngine.ts"
})
```

### 문제 발생 시
```bash
# 서버 제거 후 재등록
claude mcp remove serena -s local
claude mcp add-json "serena" '{"command":"uvx","args":["--from","git+https://github.com/oraios/serena","serena-mcp-server"]}'

# Claude API 재시작
claude api restart
```

## 📚 참고 자료

- [Serena GitHub Repository](https://github.com/oraios/serena)
- [Claude Code MCP Documentation](https://docs.anthropic.com/en/docs/claude-code/mcp)
- [UV Package Manager](https://docs.astral.sh/uv/)

---

*작성일: 2025년 8월 10일*
*작성자: Claude Code + 사용자 협업*