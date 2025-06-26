# 🌐 Fetch MCP Server 통합 가이드

OpenManager Vibe v5에서 공식 Fetch MCP Server를 개발 도구로 활용하는 방법을 설명합니다.

## 📖 개요

공식 Fetch MCP Server는 웹 콘텐츠를 가져오는 표준 MCP 서버입니다:

- **fetch_html**: HTML 페이지 가져오기
- **fetch_json**: JSON 데이터 가져오기
- **fetch_txt**: 텍스트 파일 가져오기
- **fetch_markdown**: Markdown 파일 가져오기

## 🚀 설치 및 설정

### 1. 자동 설정 (권장)

```bash
# 설정 스크립트 실행
bash scripts/setup-fetch-mcp-server.sh

# 또는 CLI로 설정
node scripts/fetch-mcp-cli.js setup
```

### 2. 수동 설정

```bash
# 1. 디렉토리 생성 및 이동
mkdir -p fetch-mcp-server
cd fetch-mcp-server

# 2. 공식 저장소 복제
git clone https://github.com/fetch-mcp/fetch-mcp-server.git .

# 3. 의존성 설치 및 빌드
npm install
npm run build

# 4. 서버 시작
npm start -- --http --port 3001
```

## 🔧 사용법

### 1. 웹 인터페이스 (브라우저)

```
http://localhost:3000/fetch-mcp-tester.html
```

- 직관적인 GUI 인터페이스
- 실시간 결과 표시
- 배치 요청 지원
- 빠른 테스트 버튼

### 2. CLI 도구 (명령줄)

```bash
# 헬스 체크
node scripts/fetch-mcp-cli.js health

# HTML 페이지 가져오기
node scripts/fetch-mcp-cli.js fetch-html https://example.com

# JSON 데이터 가져오기
node scripts/fetch-mcp-cli.js fetch-json https://api.github.com

# 배치 요청
node scripts/fetch-mcp-cli.js batch urls.txt

# 기본 테스트 실행
node scripts/fetch-mcp-cli.js test
```

### 3. JavaScript API (코드)

```javascript
import { mcp } from '@/utils/dev-tools/fetch-mcp-client';

// 헬스 체크
const health = await mcp.fetch.health();

// HTML 가져오기
const html = await mcp.fetch.html('https://example.com');

// JSON 가져오기
const json = await mcp.fetch.json('https://api.github.com');

// 배치 요청
const results = await mcp.fetch.batch([
  { name: 'google', tool: 'fetch_html', url: 'https://google.com' },
  { name: 'github', tool: 'fetch_json', url: 'https://api.github.com' },
]);
```

## 📊 실사용 예시

### HTML 페이지 분석

```bash
# HTML 페이지 다운로드
node scripts/fetch-mcp-cli.js fetch-html https://news.ycombinator.com

# 결과에서 제목과 링크 추출 가능
```

### API 데이터 수집

```bash
# GitHub API 데이터
node scripts/fetch-mcp-cli.js fetch-json https://api.github.com/repos/microsoft/vscode

# 결과: 저장소 정보, 스타 수, 이슈 수 등
```

### 배치 URL 처리

```bash
# urls.txt 파일 생성
echo "https://httpbin.org/json
https://httpbin.org/html
https://github.com" > urls.txt

# 배치 실행
node scripts/fetch-mcp-cli.js batch urls.txt
```

### 커스텀 헤더 사용

```bash
# 인증 헤더와 함께 API 호출
node scripts/fetch-mcp-cli.js fetch-json https://api.github.com/user '{"Authorization": "token YOUR_TOKEN"}'
```

## 🔌 기존 프로젝트 통합

### 1. 환경 변수 설정

```env
# .env.local
MCP_URL=http://localhost:3000
FETCH_MCP_URL=http://localhost:3001
FETCH_TIMEOUT=30000
```

### 2. Next.js API 라우트 연동

```typescript
// pages/api/fetch-content.ts
import { mcp } from '@/utils/dev-tools/fetch-mcp-client';

export default async function handler(req, res) {
  const { url, type = 'html', headers = {} } = req.body;

  const result = await mcp.fetch[type](url, headers);

  res.json(result);
}
```

### 3. React 컴포넌트에서 사용

```tsx
// components/ContentFetcher.tsx
import { useState } from 'react';
import { mcp } from '@/utils/dev-tools/fetch-mcp-client';

export function ContentFetcher() {
  const [content, setContent] = useState('');

  const fetchContent = async (url: string) => {
    const result = await mcp.fetch.html(url);
    if (result.success) {
      setContent(result.data.content);
    }
  };

  return (
    <div>
      <input
        type='url'
        placeholder='URL을 입력하세요'
        onKeyPress={e => {
          if (e.key === 'Enter') {
            fetchContent(e.target.value);
          }
        }}
      />
      <pre>{content}</pre>
    </div>
  );
}
```

## 📈 고급 활용법

### 1. 콘텐츠 모니터링

```javascript
// 웹사이트 변경 감지
setInterval(async () => {
  const result = await mcp.fetch.html('https://example.com');
  const hash = generateHash(result.data.content);

  if (hash !== lastHash) {
    console.log('웹사이트가 변경되었습니다!');
    lastHash = hash;
  }
}, 60000); // 1분마다 체크
```

### 2. SEO 분석

```javascript
// 메타 태그 분석
const html = await mcp.fetch.html('https://example.com');
const parser = new DOMParser();
const doc = parser.parseFromString(html.data.content, 'text/html');

const title = doc.querySelector('title')?.textContent;
const description = doc.querySelector('meta[name="description"]')?.content;
const keywords = doc.querySelector('meta[name="keywords"]')?.content;

console.log({ title, description, keywords });
```

### 3. API 데이터 수집 파이프라인

```javascript
// 여러 API 동시 호출
const apiUrls = [
  'https://api.github.com/repos/microsoft/vscode',
  'https://api.github.com/repos/facebook/react',
  'https://api.github.com/repos/nodejs/node',
];

const results = await Promise.all(apiUrls.map(url => mcp.fetch.json(url)));

const stats = results.map(result => ({
  name: result.data.name,
  stars: result.data.stargazers_count,
  issues: result.data.open_issues_count,
}));
```

## 🛠️ 개발자 도구

### 서버 상태 모니터링

```bash
# 실시간 헬스 체크
watch -n 5 "node scripts/fetch-mcp-cli.js health"
```

### 로그 분석

```bash
# 서버 로그 확인
tail -f fetch-mcp-server/logs/server.log
```

### 성능 측정

```javascript
// 응답 시간 측정
const start = Date.now();
const result = await mcp.fetch.html('https://example.com');
const duration = Date.now() - start;

console.log(`응답 시간: ${duration}ms`);
console.log(`콘텐츠 크기: ${result.data.content.length} bytes`);
```

## 🔒 보안 고려사항

### 1. CORS 설정

```json
// fetch-mcp-server/config.json
{
  "server": {
    "cors": {
      "origin": ["http://localhost:3000", "https://your-domain.com"],
      "methods": ["GET", "POST", "OPTIONS"]
    }
  }
}
```

### 2. Rate Limiting

```json
{
  "fetch": {
    "rateLimit": {
      "windowMs": 60000,
      "maxRequests": 100
    }
  }
}
```

### 3. 도메인 제한

```json
{
  "fetch": {
    "allowedDomains": ["*.github.com", "httpbin.org"],
    "blockPrivateIPs": true
  }
}
```

## 🚨 문제 해결

### 서버 연결 실패

```bash
# 1. 서버가 실행 중인지 확인
curl http://localhost:3001/health

# 2. 포트 사용 확인
netstat -an | grep 3001

# 3. 방화벽 확인
sudo ufw status
```

### 메모리 부족

```bash
# Node.js 메모리 제한 증가
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

### 타임아웃 오류

```javascript
// 타임아웃 시간 증가
const client = new FetchMCPClient({
  timeout: 60000, // 60초
});
```

## 📚 참고 자료

- [공식 Fetch MCP Server GitHub](https://github.com/fetch-mcp/fetch-mcp-server)
- [MCP 표준 명세서](https://docs.cursor.com/mcp)
- [Cursor MCP 통합 가이드](https://docs.cursor.com/mcp/integration)

## 🤝 기여하기

이 통합 가이드를 개선하거나 새로운 기능을 추가하고 싶다면:

1. 이슈를 생성하여 제안 사항을 공유하세요
2. 풀 리퀘스트를 통해 개선 사항을 제출하세요
3. 문서화를 통해 다른 개발자들을 도와주세요

---

🌐 **Fetch MCP Server로 웹 콘텐츠 수집을 자동화하고 개발 생산성을 높여보세요!**
