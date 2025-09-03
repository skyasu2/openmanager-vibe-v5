# ⏰ Time MCP 도구 가이드

> **시간 처리 시스템 - 글로벌 시간대 변환 & 현재 시간 관리**  
> 2개 도구 | 시간대 변환, 실시간 시간 조회, 날짜 형식 변환

## 🎯 Time MCP 개요

Time MCP는 OpenManager VIBE v5의 **시간 처리 시스템**으로, 글로벌 시간대 변환과 실시간 시간 조회를 제공합니다. 서버 모니터링에서 중요한 타임스탬프 관리를 담당합니다.

### 🌍 핵심 기능

- **글로벌 시간대 지원**: 전 세계 시간대 변환
- **실시간 조회**: 현재 시간 정확한 조회
- **형식 변환**: 다양한 날짜/시간 형식 지원
- **서버 동기화**: 서버 메트릭 타임스탬프 통일

---

## 🛠️ 도구 목록

### 1. `mcp__time__get_current_time`

**현재 시간 조회 (시간대별)**

```typescript
await mcp__time__get_current_time({
  timezone?: string  // 시간대 (선택사항, 기본값: UTC)
});

// 실제 사용 예시들
// 1. UTC 시간 (기본값)
await mcp__time__get_current_time();

// 2. 한국 시간
await mcp__time__get_current_time({
  timezone: "Asia/Seoul"
});

// 3. 미국 동부 시간
await mcp__time__get_current_time({
  timezone: "America/New_York"  
});

// 4. 일본 시간
await mcp__time__get_current_time({
  timezone: "Asia/Tokyo"
});

// 반환값 예시
{
  "current_time": "2025-09-03T14:30:45+09:00",
  "timezone": "Asia/Seoul",
  "unix_timestamp": 1725344245,
  "formatted": {
    "iso": "2025-09-03T14:30:45+09:00",
    "rfc2822": "Tue, 03 Sep 2025 14:30:45 +0900",
    "human": "2025년 9월 3일 오후 2시 30분",
    "date_only": "2025-09-03",
    "time_only": "14:30:45"
  }
}
```

**활용 시나리오**:
- 서버 메트릭 타임스탬프 생성
- 실시간 대시보드 시간 표시
- 로그 기록 시간 동기화
- 글로벌 서비스 시간 표시

### 2. `mcp__time__convert_time`

**시간대 간 변환**

```typescript
await mcp__time__convert_time({
  time: string,           // 변환할 시간 (ISO 8601 형식)
  from_timezone: string,  // 원본 시간대
  to_timezone: string     // 대상 시간대
});

// 실제 사용 예시들
// 1. UTC → 한국 시간 변환
await mcp__time__convert_time({
  time: "2025-09-03T05:30:45Z",
  from_timezone: "UTC", 
  to_timezone: "Asia/Seoul"
});

// 2. 서버 로그 시간 현지화
await mcp__time__convert_time({
  time: "2025-09-03T14:30:45+09:00",
  from_timezone: "Asia/Seoul",
  to_timezone: "America/New_York"
});

// 3. 유럽 시간 → 아시아 시간
await mcp__time__convert_time({
  time: "2025-09-03T08:30:45+02:00",
  from_timezone: "Europe/Berlin", 
  to_timezone: "Asia/Singapore"
});

// 반환값 예시
{
  "converted_time": "2025-09-03T14:30:45+09:00",
  "original": {
    "time": "2025-09-03T05:30:45Z",
    "timezone": "UTC"
  },
  "converted": {
    "time": "2025-09-03T14:30:45+09:00", 
    "timezone": "Asia/Seoul"
  },
  "time_difference": "+09:00",
  "formatted": {
    "iso": "2025-09-03T14:30:45+09:00",
    "human": "2025년 9월 3일 오후 2시 30분 (KST)"
  }
}
```

---

## 🎯 실전 활용 패턴

### 패턴 1: 서버 메트릭 타임스탬프 생성

```typescript
// OpenManager VIBE v5 서버 메트릭용 타임스탬프
async function generateServerMetricTimestamp() {
  // 1. 현재 한국 시간 조회
  const koreanTime = await mcp__time__get_current_time({
    timezone: "Asia/Seoul"
  });
  
  // 2. 서버 메트릭 데이터에 타임스탬프 추가
  const serverMetric = {
    id: "server-01",
    name: "Web Server",
    cpu: 65.4,
    memory: 78.2,
    timestamp: koreanTime.current_time,
    unix_timestamp: koreanTime.unix_timestamp,
    formatted_time: koreanTime.formatted.human
  };
  
  return serverMetric;
}

// 결과: 일관된 시간 형식으로 서버 데이터 관리
```

### 패턴 2: 글로벌 대시보드 시간 표시

```typescript
// 다중 지역 서버 시간 동기화
async function getGlobalServerTimes() {
  const regions = [
    { name: "Seoul", timezone: "Asia/Seoul" },
    { name: "Tokyo", timezone: "Asia/Tokyo" },  
    { name: "Singapore", timezone: "Asia/Singapore" },
    { name: "London", timezone: "Europe/London" },
    { name: "New York", timezone: "America/New_York" }
  ];
  
  const globalTimes = await Promise.all(
    regions.map(async region => {
      const time = await mcp__time__get_current_time({
        timezone: region.timezone
      });
      
      return {
        region: region.name,
        local_time: time.formatted.human,
        iso_time: time.current_time,
        unix_timestamp: time.unix_timestamp
      };
    })
  );
  
  return globalTimes;
}

// 결과: 글로벌 서버 현황 실시간 표시
```

### 패턴 3: 로그 시간 정규화

```typescript
// 다양한 소스의 로그를 한국 시간으로 통일
async function normalizeLogTimes(logs) {
  const normalizedLogs = await Promise.all(
    logs.map(async log => {
      // UTC 시간을 한국 시간으로 변환
      const koreanTime = await mcp__time__convert_time({
        time: log.timestamp,
        from_timezone: "UTC",
        to_timezone: "Asia/Seoul"
      });
      
      return {
        ...log,
        timestamp: koreanTime.converted_time,
        display_time: koreanTime.formatted.human,
        original_timestamp: log.timestamp
      };
    })
  );
  
  return normalizedLogs;
}
```

### 패턴 4: 성능 측정 및 지연시간 계산

```typescript
// 서버 응답시간 측정
async function measureServerResponseTime() {
  // 1. 요청 시작 시간
  const startTime = await mcp__time__get_current_time();
  
  // 2. 서버 작업 수행 (예시)
  await performServerOperation();
  
  // 3. 요청 완료 시간  
  const endTime = await mcp__time__get_current_time();
  
  // 4. 응답시간 계산 (밀리초)
  const responseTime = endTime.unix_timestamp - startTime.unix_timestamp;
  
  return {
    start_time: startTime.formatted.human,
    end_time: endTime.formatted.human,
    response_time_ms: responseTime * 1000,
    performance_status: responseTime < 0.5 ? 'excellent' : 
                       responseTime < 2.0 ? 'good' : 'needs_improvement'
  };
}
```

---

## 🌐 지원 시간대

### 주요 아시아 시간대
- `Asia/Seoul` (한국, UTC+9)
- `Asia/Tokyo` (일본, UTC+9)
- `Asia/Shanghai` (중국, UTC+8)
- `Asia/Singapore` (싱가포르, UTC+8)
- `Asia/Hong_Kong` (홍콩, UTC+8)
- `Asia/Kolkata` (인도, UTC+5:30)

### 주요 유럽 시간대  
- `Europe/London` (영국, UTC+0/+1)
- `Europe/Berlin` (독일, UTC+1/+2)
- `Europe/Paris` (프랑스, UTC+1/+2)
- `Europe/Amsterdam` (네덜란드, UTC+1/+2)

### 주요 아메리카 시간대
- `America/New_York` (미국 동부, UTC-5/-4)
- `America/Chicago` (미국 중부, UTC-6/-5) 
- `America/Los_Angeles` (미국 서부, UTC-8/-7)
- `America/Sao_Paulo` (브라질, UTC-3)

### 기타
- `UTC` (협정 세계시, UTC+0)
- `Australia/Sydney` (호주, UTC+10/+11)

---

## 📊 성능 최적화

### 시간 조회 캐싱

```typescript
// 시간 조회 결과 캐싱 (1분 TTL)
class TimeCache {
  private cache = new Map();
  private readonly TTL = 60 * 1000; // 1분
  
  async getCachedTime(timezone: string) {
    const key = timezone;
    const cached = this.cache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.TTL) {
      return cached.data;
    }
    
    const time = await mcp__time__get_current_time({ timezone });
    this.cache.set(key, {
      data: time,
      timestamp: Date.now()
    });
    
    return time;
  }
}
```

### 배치 시간 변환

```typescript
// 여러 시간을 동시에 변환
async function batchTimeConversion(times, fromTz, toTz) {
  return Promise.all(
    times.map(time => 
      mcp__time__convert_time({
        time,
        from_timezone: fromTz,
        to_timezone: toTz
      })
    )
  );
}
```

---

## 🔧 문제 해결

### 일반적인 오류

1. **잘못된 시간대 이름**: IANA 시간대 데이터베이스 기준으로 확인
2. **날짜 형식 오류**: ISO 8601 형식 사용 권장
3. **서머타임 처리**: 자동 처리되나 경계 시점 주의

### 디버깅 팁

```typescript
// 현재 지원되는 시간대 확인
const currentTime = await mcp__time__get_current_time({
  timezone: "Invalid/Timezone"  // 오류 발생으로 지원 목록 확인 가능
});

// 시간 변환 검증
const utcTime = await mcp__time__get_current_time();
const convertedTime = await mcp__time__convert_time({
  time: utcTime.current_time,
  from_timezone: "UTC",
  to_timezone: "Asia/Seoul"
});
console.log('변환 결과 검증:', convertedTime);
```

---

## 🏆 베스트 프랙티스

### 1. 일관된 시간대 사용

```typescript
// 프로젝트 전반에서 일관된 시간대 설정
const PROJECT_TIMEZONE = "Asia/Seoul";

export async function getProjectTime() {
  return mcp__time__get_current_time({
    timezone: PROJECT_TIMEZONE
  });
}
```

### 2. UTC 기준 저장, 로컬 표시

```typescript
// 데이터베이스에는 UTC로 저장
const utcTime = await mcp__time__get_current_time();
const dbRecord = {
  created_at: utcTime.current_time,  // UTC 시간 저장
  // ... 기타 데이터
};

// 사용자에게는 현지 시간으로 표시
const localTime = await mcp__time__convert_time({
  time: dbRecord.created_at,
  from_timezone: "UTC",
  to_timezone: "Asia/Seoul"
});
```

### 3. 타입 안전성

```typescript
// 시간 데이터 타입 정의
interface TimeData {
  current_time: string;
  timezone: string; 
  unix_timestamp: number;
  formatted: {
    iso: string;
    human: string;
    date_only: string;
    time_only: string;
  };
}

const getFormattedTime = async (timezone: string): Promise<TimeData> => {
  return await mcp__time__get_current_time({ timezone });
};
```

---

## 📚 참고 자료

- **[IANA 시간대 데이터베이스](https://www.iana.org/time-zones)**
- **[ISO 8601 날짜 형식](https://en.wikipedia.org/wiki/ISO_8601)**
- **[MCP 메인 가이드](../MCP-GUIDE.md)**

---

**💡 팁**: 글로벌 서비스를 운영할 때는 모든 시간을 UTC로 저장하고, 사용자 인터페이스에서만 현지 시간으로 변환하여 표시하는 것이 최선의 방법입니다.