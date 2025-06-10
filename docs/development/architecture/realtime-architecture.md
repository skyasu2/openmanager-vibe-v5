# 🔄 실시간 아키텍처 - Server-Sent Events (SSE)

## 📋 개요

OpenManager Vibe v5는 Vercel 서버리스 환경의 WebSocket 제한을 극복하기 위해 **Server-Sent Events (SSE)**를 사용한 실시간 데이터 스트리밍을 구현했습니다.

## 🚫 Vercel WebSocket 제한사항

### 왜 WebSocket을 사용할 수 없나요?

```typescript
// ❌ Vercel에서 지원하지 않는 WebSocket 패턴
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // 서버리스 함수는 요청-응답 후 즉시 종료
  // 지속적 연결 불가능
  const wss = new WebSocketServer({ port: 8080 }); // 작동하지 않음
}
```

### 제한사항 요약

- ❌ 서버리스 함수의 요청-응답 후 종료 특성
- ❌ Edge Runtime에서 WebSocket 미지원
- ❌ 지속적 연결 유지 불가능
- ❌ 실시간 양방향 통신 제한

## ✅ SSE 솔루션 아키텍처

### 1️⃣ SSE 스트림 API 엔드포인트

```typescript
// src/app/api/stream/route.ts
export async function GET() {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    start(controller) {
      const sendEvent = (data: any) => {
        const formatted = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formatted));
      };

      // 3초마다 서버 데이터 업데이트
      const interval = setInterval(async () => {
        const serverData = await getRealtimeServerData();
        sendEvent({
          type: 'server_update',
          data: serverData,
          timestamp: Date.now(),
        });
      }, 3000);

      // 5분 후 Vercel 제한으로 자동 종료
      setTimeout(() => {
        clearInterval(interval);
        controller.close();
      }, 300000);
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
```

### 2️⃣ 클라이언트 SSE 연결 관리

```typescript
// src/hooks/api/useServerQueries.ts
export const useServerConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    'connecting' | 'connected' | 'disconnected' | 'error'
  >('disconnected');

  const connect = useCallback(() => {
    const eventSource = new EventSource('/api/stream');

    eventSource.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
    };

    eventSource.onmessage = event => {
      const parsed = JSON.parse(event.data);

      switch (parsed.type) {
        case 'server_update':
          // React Query 캐시 즉시 업데이트
          queryClient.setQueryData(serverKeys.lists(), parsed.data);
          break;
        case 'timeout':
          // 5분 제한 후 자동 재연결
          setTimeout(() => connect(), 1000);
          break;
      }
    };

    eventSource.onerror = () => {
      setIsConnected(false);
      setConnectionStatus('error');
      // 5초 후 재연결 시도
      setTimeout(() => connect(), 5000);
    };
  }, [queryClient]);

  return { isConnected, connectionStatus, connect, disconnect };
};
```

## 🔧 SSE vs WebSocket 비교

| 특징              | WebSocket      | Server-Sent Events          |
| ----------------- | -------------- | --------------------------- |
| **Vercel 지원**   | ❌ 미지원      | ✅ 완전 지원                |
| **양방향 통신**   | ✅ 지원        | ❌ 단방향 (서버→클라이언트) |
| **자동 재연결**   | 수동 구현 필요 | ✅ 브라우저 자동 지원       |
| **구현 복잡도**   | 높음           | 낮음                        |
| **HTTP 표준**     | 별도 프로토콜  | ✅ HTTP 표준                |
| **방화벽 친화성** | 제한적         | ✅ 우수                     |

## 📊 실시간 데이터 플로우

```mermaid
graph TD
    A[클라이언트] -->|EventSource 연결| B[/api/stream]
    B --> C[서버 메트릭 수집]
    C --> D[JSON 데이터 생성]
    D --> E[SSE 형식 변환]
    E -->|3초마다| F[클라이언트 스트림]
    F --> G[React Query 캐시 업데이트]
    G --> H[UI 자동 리렌더링]

    I[5분 타이머] --> J[연결 종료]
    J --> K[자동 재연결]
    K --> A
```

## 🎯 핵심 기능

### 1️⃣ 실시간 서버 메트릭

- **CPU, 메모리, 디스크 사용률** 3초마다 업데이트
- **서버 상태 변경** 즉시 반영
- **자동 상태 시뮬레이션** (개발 환경)

### 2️⃣ 자동 재연결 시스템

```typescript
// 페이지 가시성 기반 연결 관리
useEffect(() => {
  const handleVisibilityChange = () => {
    if (document.hidden) {
      disconnect(); // 페이지 숨김 시 연결 해제
    } else {
      connect(); // 페이지 표시 시 재연결
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
}, []);
```

### 3️⃣ React Query 통합

```typescript
// SSE 데이터를 React Query 캐시에 직접 업데이트
eventSource.onmessage = event => {
  const parsed = JSON.parse(event.data);

  if (parsed.type === 'server_update') {
    queryClient.setQueryData(serverKeys.lists(), parsed.data);
    // UI가 자동으로 리렌더링됨
  }
};
```

## ⚡ 성능 최적화

### 1️⃣ 효율적인 데이터 전송

- **JSON 압축**: 불필요한 데이터 제거
- **델타 업데이트**: 변경된 부분만 전송 (향후 구현)
- **버퍼링 방지**: `X-Accel-Buffering: no` 헤더

### 2️⃣ 메모리 관리

```typescript
// 5분 후 자동 정리 (Vercel 제한 준수)
setTimeout(() => {
  clearInterval(dataInterval);
  clearInterval(heartbeatInterval);
  controller.close();
}, 300000);
```

### 3️⃣ 클라이언트 최적화

- **조건부 연결**: 페이지 활성 상태에서만 연결
- **에러 핸들링**: 네트워크 오류 시 자동 복구
- **메모리 누수 방지**: 컴포넌트 언마운트 시 정리

## 🌟 장점

### ✅ Vercel 완벽 호환

- 서버리스 환경에서 안정적 동작
- Edge Functions 지원
- 추가 인프라 불필요

### ✅ 개발자 경험

- 브라우저 네이티브 API 사용
- 자동 재연결 지원
- 간단한 디버깅

### ✅ 안정성

- HTTP 표준 프로토콜
- 방화벽 친화적
- 프록시 서버 지원

## 🎯 향후 개선사항

### 1️⃣ 클라이언트→서버 통신

```typescript
// POST 요청을 통한 서버 제어
const controlServer = async (serverId: string, action: string) => {
  await fetch('/api/servers/control', {
    method: 'POST',
    body: JSON.stringify({ serverId, action }),
  });
  // SSE를 통해 결과가 자동으로 스트리밍됨
};
```

### 2️⃣ 델타 업데이트

- 전체 데이터 대신 변경사항만 전송
- 대역폭 사용량 최소화
- 더 빠른 UI 업데이트

### 3️⃣ 다중 스트림 지원

- 서버별 개별 스트림
- 사용자 맞춤 데이터 필터링
- 권한 기반 데이터 접근

## 📚 관련 문서

- [React Query 통합 가이드](../api/react-query-patterns.md)
- [실시간 모니터링 UI](../ui/realtime-components.md)
- [성능 최적화 가이드](../performance/optimization.md)
- [Vercel 배포 가이드](../deployment/vercel-setup.md)
