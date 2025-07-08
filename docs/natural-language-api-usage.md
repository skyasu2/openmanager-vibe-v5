# 🗣️ 자연어 질의 API 사용 가이드

## 개요

2가지 모드로 자연어 질의를 처리할 수 있는 API입니다:

- **LOCAL**: 로컬 AI 엔진들 (Korean AI + MCP + RAG)
- **GOOGLE_AI**: Google AI 우선 처리

각 모드별로 폴백 처리가 구현되어 있으며, 폴백 실패 시 상세한 에러 메시지를 반환합니다.

## API 엔드포인트

```
GET  /api/ai/natural-language
POST /api/ai/natural-language
```

## 사용법

### 1. 사용 가능한 모드 조회

```bash
curl -X GET "http://localhost:3000/api/ai/natural-language?action=modes"
```

**응답:**

```json
{
  "success": true,
  "availableModes": [
    {
      "mode": "LOCAL",
      "description": "로컬 AI 엔진들 (Korean AI + MCP + RAG)",
      "engines": ["korean-ai", "mcp", "rag"],
      "fallbackOrder": ["korean-ai", "mcp", "rag"]
    },
    {
      "mode": "GOOGLE_AI",
      "description": "Google AI 우선 처리",
      "engines": ["google-ai", "korean-ai"],
      "fallbackOrder": ["google-ai", "korean-ai"]
    }
  ]
}
```

### 2. 시스템 상태 확인

```bash
curl -X GET "http://localhost:3000/api/ai/natural-language?action=status"
```

**응답:**

```json
{
  "success": true,
  "status": {
    "naturalLanguageUnifier": true,
    "googleAI": {
      "available": true,
      "enabled": true
    },
    "unifiedRouter": true,
    "modes": {
      "LOCAL": {
        "engines": ["korean-ai", "mcp", "rag"],
        "fallbackOrder": ["korean-ai", "mcp", "rag"]
      },
      "GOOGLE_AI": {
        "engines": ["google-ai", "korean-ai"],
        "fallbackOrder": ["google-ai", "korean-ai"]
      }
    }
  },
  "timestamp": "2025-01-27T08:30:00.000Z"
}
```

### 3. 자연어 질의 처리

#### LOCAL 모드 사용

```bash
curl -X POST "http://localhost:3000/api/ai/natural-language" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "서버의 현재 상태는 어떻게 확인할 수 있나요?",
    "mode": "LOCAL",
    "options": {
      "enableFallback": true,
      "timeout": 10000
    }
  }'
```

**성공 응답:**

```json
{
  "success": true,
  "response": "[Korean AI] \"서버의 현재 상태는 어떻게 확인할 수 있나요?\"에 대한 한국어 AI 분석 결과입니다. 서버 상태 확인은 다음과 같은 방법들이 있습니다...",
  "mode": "LOCAL",
  "engine": "korean-ai",
  "confidence": 0.85,
  "processingTime": 1200,
  "fallbacksUsed": [],
  "metadata": {
    "originalMode": "LOCAL",
    "finalEngine": "korean-ai",
    "engineDetails": {
      "engine": "korean-ai",
      "suggestions": ["CPU 사용률 확인", "메모리 상태 점검", "디스크 용량 확인"]
    }
  }
}
```

**폴백 사용 응답:**

```json
{
  "success": true,
  "response": "[MCP] \"서버의 현재 상태는 어떻게 확인할 수 있나요?\"에 대한 시스템 컨텍스트 분석 결과입니다...",
  "mode": "LOCAL",
  "engine": "mcp",
  "confidence": 0.75,
  "processingTime": 2100,
  "fallbacksUsed": [],
  "metadata": {
    "originalMode": "LOCAL",
    "finalEngine": "mcp",
    "fallbackReason": "korean-ai-failed",
    "engineDetails": {
      "engine": "mcp",
      "enginePath": ["mcp-client"]
    }
  }
}
```

#### GOOGLE_AI 모드 사용

```bash
curl -X POST "http://localhost:3000/api/ai/natural-language" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "How can I optimize my server performance?",
    "mode": "GOOGLE_AI",
    "options": {
      "enableFallback": true,
      "timeout": 15000
    }
  }'
```

**성공 응답:**

```json
{
  "success": true,
  "response": "[Google AI] \"How can I optimize my server performance?\"에 대한 Google AI 분석 결과입니다. 서버 성능 최적화를 위한 주요 방법들은...",
  "mode": "GOOGLE_AI",
  "engine": "google-ai",
  "confidence": 0.9,
  "processingTime": 1800,
  "fallbacksUsed": [],
  "metadata": {
    "originalMode": "GOOGLE_AI",
    "finalEngine": "google-ai",
    "engineDetails": {
      "engine": "google-ai",
      "processingTime": 1650
    }
  }
}
```

### 4. 에러 처리 예제

#### 입력 검증 에러

```bash
curl -X POST "http://localhost:3000/api/ai/natural-language" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "",
    "mode": "LOCAL"
  }'
```

**에러 응답:**

```json
{
  "success": false,
  "response": "질문을 입력해주세요.",
  "mode": "LOCAL",
  "engine": "error",
  "confidence": 0,
  "processingTime": 5,
  "fallbacksUsed": [],
  "error": "query 파라미터가 필요합니다.",
  "errorInfo": {
    "code": "EMPTY_QUERY",
    "severity": "low",
    "suggestions": [
      "구체적인 질문을 입력하세요",
      "예: \"서버 상태는 어떻게 확인하나요?\"",
      "시스템 관련 질문을 해보세요"
    ],
    "retryable": true
  },
  "metadata": {
    "originalMode": "LOCAL",
    "finalEngine": "error",
    "fallbackReason": "빈 질의"
  }
}
```

#### 모든 엔진 실패 에러

```json
{
  "success": false,
  "response": "현재 모든 로컬 AI 엔진에 문제가 발생했습니다. 시스템 관리자에게 문의하세요.",
  "mode": "LOCAL",
  "engine": "error",
  "confidence": 0,
  "processingTime": 8500,
  "fallbacksUsed": [
    "korean-ai-error: Connection timeout",
    "mcp-error: Service unavailable",
    "rag-error: Index not found"
  ],
  "error": "모든 로컬 AI 엔진에서 처리 실패했습니다. 시스템 관리자에게 문의하세요.",
  "errorInfo": {
    "code": "ALL_FALLBACKS_FAILED",
    "severity": "critical",
    "suggestions": [
      "GOOGLE_AI 모드를 시도해보세요",
      "시스템 관리자에게 즉시 문의하세요",
      "나중에 다시 시도해주세요"
    ],
    "retryable": false
  },
  "metadata": {
    "originalMode": "LOCAL",
    "finalEngine": "error",
    "fallbackReason": "모든 폴백 엔진 실패"
  }
}
```

## 폴백 전략

### LOCAL 모드 폴백 순서

1. **Korean AI** (1차) - 한국어 자연어 처리 특화
2. **MCP** (2차) - 시스템 컨텍스트 기반 처리
3. **RAG** (3차) - 지식 베이스 검색 기반 처리
4. **에러** (최종) - 모든 엔진 실패 시

### GOOGLE_AI 모드 폴백 순서

1. **Google AI** (1차) - Google AI 서비스
2. **Korean AI** (2차) - 한국어 처리 폴백
3. **에러** (최종) - 모든 엔진 실패 시

## 에러 코드 참조

| 에러 코드                   | 심각도   | 설명                | 재시도 가능 |
| --------------------------- | -------- | ------------------- | ----------- |
| `EMPTY_QUERY`               | low      | 빈 질의             | ✅          |
| `INVALID_MODE`              | low      | 잘못된 모드         | ✅          |
| `KOREAN_AI_UNAVAILABLE`     | medium   | Korean AI 사용 불가 | ✅          |
| `MCP_CONNECTION_FAILED`     | medium   | MCP 연결 실패       | ✅          |
| `RAG_INDEX_ERROR`           | medium   | RAG 인덱스 오류     | ✅          |
| `GOOGLE_AI_QUOTA_EXCEEDED`  | high     | Google AI 쿼터 초과 | ❌          |
| `GOOGLE_AI_API_KEY_MISSING` | critical | API 키 누락         | ❌          |
| `ALL_FALLBACKS_FAILED`      | critical | 모든 폴백 실패      | ❌          |

## 사용 권장사항

1. **일반적인 질의**: `LOCAL` 모드 사용 (비용 효율적)
2. **복잡한 자연어 처리**: `GOOGLE_AI` 모드 사용 (높은 정확도)
3. **한국어 질의**: `LOCAL` 모드 우선 (Korean AI 특화)
4. **영어 질의**: `GOOGLE_AI` 모드 고려

## 개발 예제 (JavaScript)

```javascript
// 자연어 질의 처리 함수
async function processNaturalLanguage(query, mode = 'LOCAL') {
  try {
    const response = await fetch('/api/ai/natural-language', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        mode,
        options: {
          enableFallback: true,
          timeout: 10000,
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ 처리 완료 (${result.engine}):`, result.response);
      return result.response;
    } else {
      console.error(`❌ 처리 실패:`, result.errorInfo);

      // 재시도 가능한 경우
      if (result.errorInfo?.retryable) {
        console.log('💡 제안:', result.errorInfo.suggestions);
      }

      return null;
    }
  } catch (error) {
    console.error('네트워크 오류:', error);
    return null;
  }
}

// 사용 예제
processNaturalLanguage('서버 성능을 최적화하는 방법은?', 'LOCAL');
processNaturalLanguage('How to monitor system resources?', 'GOOGLE_AI');
```

## React 컴포넌트 예제

```jsx
import React, { useState } from 'react';

function NaturalLanguageQuery() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState('LOCAL');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/ai/natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, mode }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: '네트워크 오류가 발생했습니다.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='p-6 max-w-2xl mx-auto'>
      <h2 className='text-2xl font-bold mb-4'>🗣️ 자연어 질의</h2>

      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block text-sm font-medium mb-2'>
            질문을 입력하세요:
          </label>
          <textarea
            value={query}
            onChange={e => setQuery(e.target.value)}
            className='w-full p-3 border border-gray-300 rounded-md'
            rows='3'
            placeholder='예: 서버 상태는 어떻게 확인하나요?'
          />
        </div>

        <div>
          <label className='block text-sm font-medium mb-2'>처리 모드:</label>
          <select
            value={mode}
            onChange={e => setMode(e.target.value)}
            className='w-full p-2 border border-gray-300 rounded-md'
          >
            <option value='LOCAL'>LOCAL (로컬 AI)</option>
            <option value='GOOGLE_AI'>GOOGLE_AI (Google AI)</option>
          </select>
        </div>

        <button
          type='submit'
          disabled={loading || !query.trim()}
          className='w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50'
        >
          {loading ? '처리 중...' : '질의하기'}
        </button>
      </form>

      {result && (
        <div className='mt-6 p-4 border rounded-md'>
          {result.success ? (
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <span className='text-green-600'>✅ 성공</span>
                <span className='text-sm text-gray-600'>
                  {result.engine} | {result.processingTime}ms
                </span>
              </div>
              <p className='text-gray-800'>{result.response}</p>

              {result.fallbacksUsed.length > 0 && (
                <div className='mt-2 text-sm text-orange-600'>
                  폴백 사용됨: {result.fallbacksUsed.join(', ')}
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className='text-red-600 font-medium'>❌ 실패</div>
              <p className='text-gray-800 mt-1'>{result.response}</p>

              {result.errorInfo?.suggestions && (
                <div className='mt-2'>
                  <div className='text-sm font-medium text-gray-700'>제안:</div>
                  <ul className='text-sm text-gray-600 list-disc list-inside'>
                    {result.errorInfo.suggestions.map((suggestion, index) => (
                      <li key={index}>{suggestion}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NaturalLanguageQuery;
```

이제 2가지 모드 자연어 질의 시스템이 완전히 구현되었습니다! 🎉
