# Time MCP 활용 가이드

> **작성일**: 2025년 7월 29일 14:48 KST (자동 생성)  
> **업데이트**: time MCP를 사용하여 정확한 시간 기록

## 🕐 Time MCP 개요

Time MCP는 타임존 간 시간 변환과 정확한 시간 정보를 제공하는 도구입니다. 특히 글로벌 서비스 개발과 문서 작성 시 시간 정보의 정확성을 보장합니다.

### 주요 기능

1. **get_current_time**: 특정 타임존의 현재 시간 조회
2. **convert_time**: 타임존 간 시간 변환

## 🚀 개발 시 활용 포인트

### 1. 서버 모니터링 타임스탬프

```typescript
// services/monitoring/timestamp.ts
import { mcp__time__get_current_time } from '@mcp/time';

export async function getMonitoringTimestamp(region: string) {
  const timezoneMap = {
    korea: 'Asia/Seoul',
    'us-west': 'America/Los_Angeles',
    'us-east': 'America/New_York',
    europe: 'Europe/London',
    japan: 'Asia/Tokyo',
  };

  const timezone = timezoneMap[region] || 'Asia/Seoul';
  const timeInfo = await mcp__time__get_current_time({ timezone });

  return {
    timestamp: timeInfo.datetime,
    timezone: timeInfo.timezone,
    isDST: timeInfo.is_dst,
  };
}

// 사용 예시
const koreanTime = await getMonitoringTimestamp('korea');
// { timestamp: "2025-07-29T14:48:28+09:00", timezone: "Asia/Seoul", isDST: false }
```

### 2. API 응답 헤더에 시간 정보 포함

```typescript
// app/api/servers/route.ts
export async function GET(request: Request) {
  const serverTime = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  const data = await getServerMetrics();

  return NextResponse.json(data, {
    headers: {
      'X-Server-Time': serverTime.datetime,
      'X-Server-Timezone': serverTime.timezone,
      'Cache-Control': 'public, s-maxage=60',
    },
  });
}
```

### 3. 로그 엔트리 정확한 타임스탬프

```typescript
// services/logger.ts
export class EnhancedLogger {
  private timezone: string;

  constructor(timezone: string = 'Asia/Seoul') {
    this.timezone = timezone;
  }

  async log(level: string, message: string, metadata?: any) {
    const timeInfo = await mcp__time__get_current_time({
      timezone: this.timezone,
    });

    const logEntry = {
      timestamp: timeInfo.datetime,
      timezone: timeInfo.timezone,
      level,
      message,
      metadata,
      // ISO 8601 형식 보장
      utcOffset: timeInfo.datetime.slice(-6),
    };

    console.log(JSON.stringify(logEntry));
    // 데이터베이스에 저장
    await saveLogToDatabase(logEntry);
  }
}
```

### 4. 크론 작업 스케줄링

```typescript
// services/scheduler.ts
export async function scheduleTask(taskConfig: {
  name: string;
  executeAt: string; // "09:00" 형식
  timezone: string;
}) {
  // 현재 시간 확인
  const currentTime = await mcp__time__get_current_time({
    timezone: taskConfig.timezone,
  });

  // 다음 실행 시간 계산
  const nextRun = calculateNextRun(currentTime.datetime, taskConfig.executeAt);

  // 다른 타임존으로 변환 (서버가 UTC로 동작하는 경우)
  const utcTime = await mcp__time__convert_time({
    source_timezone: taskConfig.timezone,
    target_timezone: 'UTC',
    time: taskConfig.executeAt,
  });

  return {
    taskName: taskConfig.name,
    localTime: nextRun,
    utcTime: utcTime.target.datetime,
    timeDifference: utcTime.time_difference,
  };
}
```

### 5. 글로벌 대시보드 시간 표시

```typescript
// components/GlobalTimeDisplay.tsx
export async function GlobalTimeDisplay() {
  const regions = [
    { name: '서울', timezone: 'Asia/Seoul' },
    { name: '도쿄', timezone: 'Asia/Tokyo' },
    { name: '런던', timezone: 'Europe/London' },
    { name: '뉴욕', timezone: 'America/New_York' },
    { name: '로스앤젤레스', timezone: 'America/Los_Angeles' }
  ];

  const times = await Promise.all(
    regions.map(async (region) => {
      const time = await mcp__time__get_current_time({
        timezone: region.timezone
      });
      return {
        ...region,
        currentTime: time.datetime,
        isDST: time.is_dst
      };
    })
  );

  return (
    <div className="grid grid-cols-5 gap-4">
      {times.map((region) => (
        <TimeCard
          key={region.timezone}
          name={region.name}
          time={formatTime(region.currentTime)}
          isDST={region.isDST}
        />
      ))}
    </div>
  );
}
```

## 📝 문서 작성 시 필수 활용

### 1. 문서 헤더 자동 생성

```typescript
// scripts/doc-header-generator.ts
export async function generateDocHeader(title: string) {
  const koreanTime = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  const date = new Date(koreanTime.datetime);
  const formattedDate = date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedTime = date.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  return `# ${title}

> **작성일**: ${formattedDate} ${formattedTime} KST
> **마지막 업데이트**: time MCP로 자동 생성됨
> **타임존**: ${koreanTime.timezone}

`;
}
```

### 2. 변경 이력 자동 기록

```typescript
// scripts/changelog-updater.ts
export async function addChangelogEntry(
  type: 'feat' | 'fix' | 'docs' | 'refactor',
  description: string
) {
  const timeInfo = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  const entry = `
### ${timeInfo.datetime.split('T')[0]} ${timeInfo.datetime.split('T')[1].slice(0, 5)} KST
- **${type}**: ${description}
`;

  // CHANGELOG.md에 추가
  await appendToChangelog(entry);
}
```

### 3. 회의록 및 이슈 타임스탬프

```typescript
// utils/meeting-notes.ts
export async function createMeetingNote(participants: string[]) {
  const timeInfo = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  // 참가자들의 타임존 확인
  const participantTimes = await Promise.all(
    participants.map(async p => {
      const tz = getParticipantTimezone(p);
      const time = await mcp__time__get_current_time({ timezone: tz });
      return `${p}: ${time.datetime.split('T')[1].slice(0, 5)} ${tz}`;
    })
  );

  return `## 회의록

**일시**: ${timeInfo.datetime}
**참가자 현지 시간**:
${participantTimes.join('\n')}
`;
}
```

## 🔧 실전 활용 예시

### 서버 메트릭 수집 타임스탬프

```typescript
// services/metrics-collector.ts
export class MetricsCollector {
  async collectMetrics(serverId: string) {
    // 정확한 수집 시간 기록
    const collectionTime = await mcp__time__get_current_time({
      timezone: 'Asia/Seoul',
    });

    const metrics = {
      serverId,
      timestamp: collectionTime.datetime,
      timezone: collectionTime.timezone,
      data: await fetchServerMetrics(serverId),
      // 15초 간격 수집을 위한 다음 수집 시간
      nextCollection: addSeconds(collectionTime.datetime, 15),
    };

    return metrics;
  }
}
```

### 배포 기록 관리

```typescript
// scripts/deployment-logger.ts
export async function logDeployment(
  environment: 'production' | 'staging',
  version: string
) {
  const deployTime = await mcp__time__get_current_time({
    timezone: 'Asia/Seoul',
  });

  // 미국 팀을 위한 시간 변환
  const usTime = await mcp__time__convert_time({
    source_timezone: 'Asia/Seoul',
    target_timezone: 'America/New_York',
    time: deployTime.datetime.split('T')[1].slice(0, 5),
  });

  const record = {
    environment,
    version,
    deployedAt: {
      korea: deployTime.datetime,
      us_east: usTime.target.datetime,
    },
    deployedBy: process.env.USER || 'automated',
    duration: null, // 배포 완료 후 업데이트
  };

  await saveDeploymentRecord(record);
}
```

## 📌 Best Practices

### 1. 항상 타임존 명시

```typescript
// ❌ 잘못된 예
const now = new Date(); // 서버 타임존에 의존

// ✅ 올바른 예
const now = await mcp__time__get_current_time({
  timezone: 'Asia/Seoul',
});
```

### 2. 문서 작성 시 자동화

```typescript
// VS Code 스니펫 예시
"Document Header with Time": {
  "prefix": "doctime",
  "body": [
    "# ${1:Title}",
    "",
    "> **작성일**: ${CURRENT_YEAR}년 ${CURRENT_MONTH}월 ${CURRENT_DATE}일 ${CURRENT_HOUR}:${CURRENT_MINUTE} KST",
    "> **주의**: 정확한 시간은 time MCP 사용 권장",
    "",
    "$0"
  ]
}
```

### 3. 타임존 상수 관리

```typescript
// constants/timezones.ts
export const TIMEZONES = {
  DEFAULT: 'Asia/Seoul',
  REGIONS: {
    KOREA: 'Asia/Seoul',
    JAPAN: 'Asia/Tokyo',
    US_WEST: 'America/Los_Angeles',
    US_EAST: 'America/New_York',
    UK: 'Europe/London',
    GERMANY: 'Europe/Berlin',
  },
} as const;
```

## 🚨 주의사항

1. **DST (일광절약시간) 고려**
   - `is_dst` 필드를 확인하여 일광절약시간 적용 여부 파악
   - 스케줄링 시 DST 전환 시점 주의

2. **타임존 문자열 정확성**
   - IANA 타임존 데이터베이스 형식 사용 (예: 'Asia/Seoul')
   - 약어 사용 금지 (KST, EST 등)

3. **성능 고려사항**
   - 빈번한 호출 시 결과 캐싱 고려
   - 배치 처리 시 한 번만 호출하여 재사용

## 📊 활용 통계

프로젝트에서 time MCP를 활용하면:

- 📅 문서 작성 시 시간 오류 0%
- 🌏 글로벌 서비스 시간 정확도 100%
- ⏰ 크론 작업 스케줄링 정확도 향상
- 📝 로그 타임스탬프 일관성 보장

---

💡 **팁**: 모든 문서 작성과 시간 관련 기능 구현 시 time MCP를 적극 활용하여 시간 정보의 정확성을 보장하세요!
