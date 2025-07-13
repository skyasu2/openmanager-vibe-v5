# Tavily MCP 사용 가이드

## 🔍 Tavily MCP란?

Tavily MCP는 RAG(Retrieval-Augmented Generation) 워크플로우에 특화된 실시간 웹 검색 및 페이지 추출 기능을 제공하는 Model Context Protocol 서버입니다.

### 주요 기능
- **🔎 웹 검색** (`tavily-search`): 실시간 웹 검색
- **📄 콘텐츠 추출** (`tavily-extract`): 웹 페이지에서 구조화된 데이터 추출
- **🗺️ 사이트 매핑** (`tavily-map`): 웹사이트 구조 매핑
- **🕷️ 웹 크롤링** (`tavily-crawl`): 체계적인 웹사이트 탐색

### 무료 한도
- 월 1,000회 조회 무료
- 일일 약 33회 사용 가능
- 초당 1회 요청 제한

## 🚀 설정 확인

현재 프로젝트에서 Tavily MCP가 올바르게 설정되었는지 확인하려면:

```bash
# 설정 검증 스크립트 실행
npm run tavily:test

# 또는 직접 실행
node scripts/test-tavily-setup.cjs
```

## 🔐 보안 설정

API 키는 평문으로 노출되지 않도록 암호화되어 저장됩니다:

1. **암호화된 저장**: `config/tavily-encrypted.json`에 AES로 암호화
2. **래퍼 스크립트**: `scripts/tavily-mcp-wrapper-simple.cjs`가 자동으로 복호화
3. **환경 격리**: MCP 서버만 API 키에 접근 가능

## 📝 사용 방법

Claude Code를 재시작한 후 다음과 같이 사용할 수 있습니다:

### 1. 웹 검색
```
"Next.js 15의 최신 기능에 대해 검색해주세요"
"2025년 AI 트렌드를 Tavily로 검색해주세요"
```

### 2. 페이지 콘텐츠 추출
```
"이 URL에서 주요 내용을 추출해주세요: https://example.com/article"
"Tavily extract를 사용해서 이 페이지의 핵심 정보를 가져와주세요"
```

### 3. 웹사이트 구조 매핑
```
"docs.example.com의 사이트맵을 만들어주세요"
"이 웹사이트의 전체 구조를 Tavily map으로 분석해주세요"
```

### 4. 웹 크롤링
```
"이 블로그의 모든 포스트를 크롤링해주세요"
"특정 키워드가 포함된 페이지들을 찾아주세요"
```

## 🛠️ 문제 해결

### Claude Code에서 Tavily가 보이지 않는 경우

1. Claude Code 완전히 종료
2. 설정 검증:
   ```bash
   npm run tavily:test
   ```
3. Claude Code 재시작
4. 사용 가능한 도구 확인

### API 키 관련 오류

1. 암호화된 키 확인:
   ```bash
   node scripts/tavily-key-loader.cjs
   ```

2. 새로운 API 키로 재설정:
   ```bash
   # 1. 새 API 키로 암호화 파일 재생성
   node scripts/encrypt-tavily-key.cjs
   
   # 2. 설정 검증
   npm run tavily:test
   ```

### 사용량 초과

- 일일 한도: 33회
- 월 한도: 1,000회
- 한도 초과시 다음 달까지 대기 필요

## 📊 사용량 모니터링

현재 Tavily API는 사용량 조회 엔드포인트를 제공하지 않으므로, 수동으로 사용 횟수를 추적해야 합니다:

1. 일일 사용량 기록
2. 중요한 검색에 우선 사용
3. 캐싱 가능한 정보는 로컬에 저장

## 🔗 추가 리소스

- [Tavily 공식 문서](https://docs.tavily.com)
- [Tavily API 대시보드](https://app.tavily.com/home)
- [MCP 프로토콜 문서](https://modelcontextprotocol.io)

## 📝 노트

- Tavily는 RAG 워크플로우에 최적화되어 있어 일반 검색보다 AI 컨텍스트에 더 적합한 결과 제공
- 검색 결과는 구조화되어 있어 Claude가 더 정확하게 이해하고 활용 가능
- 실시간 정보가 필요한 경우 특히 유용 (최신 뉴스, 문서, 트렌드 등)

---

*이 문서는 OpenManager VIBE v5 프로젝트의 Tavily MCP 통합을 위한 가이드입니다.*