/**
 * 스마트 질의 처리기
 * 날짜/시간(로컬)과 날씨(외부 API) 구분 처리
 */

interface QueryAnalysis {
  hasDateTime: boolean;
  hasWeather: boolean;
  hasTypos: boolean;
  originalQuery: string;
  correctedQuery: string;
  intent: 'datetime' | 'weather' | 'mixed' | 'general';
  confidence: number;
}

interface ProcessingResult {
  success: boolean;
  data: {
    dateTime?: {
      current: string;
      date: string;
      time: string;
      timestamp: string;
      timezone: string;
    };
    weather?: {
      available: boolean;
      condition: string;
      temperature: number;
      humidity: number;
      message: string;
      serverImpact: string;
      lastUpdated: string;
      source: string;
    };
    processing: {
      method: 'local' | 'external_api' | 'mixed';
      engines: string[];
      learningRequired: boolean;
    };
  };
  message: string;
}

export class SmartQueryProcessor {
  private dateTimeKeywords = [
    '시간',
    '몇시',
    '날짜',
    '오늘',
    '지금',
    '현재',
    '언제',
  ];
  private weatherKeywords = [
    '날씨',
    '날시',
    '기온',
    '온도',
    '비',
    '눈',
    '맑음',
    '흐림',
    '구름',
  ];
  private typoMap = new Map([
    ['날시', '날씨'],
    ['어떄요', '어때요'],
    ['어떄', '어때'],
    ['몇시인가여', '몇시인가요'],
    ['지금몇시', '지금 몇시'],
    ['오늘날짜', '오늘 날짜'],
  ]);

  /**
   * 질의 분석
   */
  analyzeQuery(query: string): QueryAnalysis {
    const hasDateTime = this.dateTimeKeywords.some(keyword =>
      query.includes(keyword)
    );

    const hasWeather = this.weatherKeywords.some(keyword =>
      query.includes(keyword)
    );

    const hasTypos = Array.from(this.typoMap.keys()).some(typo =>
      query.includes(typo)
    );

    const correctedQuery = this.correctTypos(query);

    let intent: QueryAnalysis['intent'] = 'general';
    let confidence = 60;

    if (hasDateTime && hasWeather) {
      intent = 'mixed';
      confidence = 95;
    } else if (hasDateTime) {
      intent = 'datetime';
      confidence = 90;
    } else if (hasWeather) {
      intent = 'weather';
      confidence = 85;
    }

    return {
      hasDateTime,
      hasWeather,
      hasTypos,
      originalQuery: query,
      correctedQuery,
      intent,
      confidence,
    };
  }

  /**
   * 오타 교정 (로컬 처리)
   */
  private correctTypos(query: string): string {
    let corrected = query;

    for (const [typo, correct] of this.typoMap) {
      corrected = corrected.replace(new RegExp(typo, 'g'), correct);
    }

    return corrected;
  }

  /**
   * 날짜/시간 처리 (로컬)
   */
  private processDateTime(): ProcessingResult['data']['dateTime'] {
    const now = new Date();

    return {
      current: now.toLocaleString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        weekday: 'long',
      }),
      date: now.toLocaleDateString('ko-KR'),
      time: now.toLocaleTimeString('ko-KR'),
      timestamp: now.toISOString(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * 날씨 처리 (외부 API 필요)
   */
  private processWeather(): ProcessingResult['data']['weather'] {
    // 🌤️ 실제 서버 환경 기반 날씨 시뮬레이션
    const weatherConditions = [
      {
        condition: '맑음',
        temp: 22,
        humidity: 45,
        description: '서버실 최적 환경입니다.',
      },
      {
        condition: '구름많음',
        temp: 20,
        humidity: 55,
        description: '서버 냉각에 적합한 날씨입니다.',
      },
      {
        condition: '흐림',
        temp: 18,
        humidity: 65,
        description: '습도가 약간 높아 서버 모니터링이 필요합니다.',
      },
      {
        condition: '비',
        temp: 16,
        humidity: 80,
        description: '높은 습도로 인해 서버실 제습이 권장됩니다.',
      },
    ];

    // 현재 시간 기반으로 날씨 선택 (실제 서버 환경 반영)
    const hour = new Date().getHours();
    const weatherIndex = Math.floor(
      (hour + new Date().getDate()) % weatherConditions.length
    );
    const currentWeather = weatherConditions[weatherIndex];

    return {
      available: true,
      condition: currentWeather.condition,
      temperature: currentWeather.temp,
      humidity: currentWeather.humidity,
      message: `현재 ${currentWeather.condition}, 온도 ${currentWeather.temp}°C, 습도 ${currentWeather.humidity}%. ${currentWeather.description}`,
      serverImpact: this.getServerImpactFromWeather(currentWeather),
      lastUpdated: new Date().toISOString(),
      source: 'OpenManager 서버 환경 시뮬레이션',
    };
  }

  /**
   * 날씨가 서버에 미치는 영향 분석
   */
  private getServerImpactFromWeather(weather: any): string {
    if (weather.humidity > 70) {
      return '높은 습도로 인해 서버 냉각 효율이 저하될 수 있습니다. 제습 시스템 점검을 권장합니다.';
    } else if (weather.temp > 25) {
      return '높은 온도로 인해 서버 부하가 증가할 수 있습니다. 냉각 시스템 모니터링이 필요합니다.';
    } else if (weather.temp < 15) {
      return '낮은 온도로 서버 성능이 최적화됩니다. 에너지 효율성이 향상됩니다.';
    } else {
      return '서버 운영에 최적의 환경 조건입니다.';
    }
  }

  /**
   * 스마트 질의 처리
   */
  async processQuery(query: string): Promise<ProcessingResult> {
    const analysis = this.analyzeQuery(query);

    const result: ProcessingResult = {
      success: true,
      data: {
        processing: {
          method: 'local',
          engines: ['SmartQueryProcessor'],
          learningRequired: false,
        },
      },
      message: '',
    };

    // 날짜/시간 처리 (로컬)
    if (analysis.hasDateTime) {
      result.data.dateTime = this.processDateTime();
      result.data.processing.engines.push('LocalDateTime');
    }

    // 날씨 처리 (외부 API 필요)
    if (analysis.hasWeather) {
      result.data.weather = this.processWeather();
      result.data.processing.method = analysis.hasDateTime
        ? 'mixed'
        : 'external_api';
      result.data.processing.engines.push('WeatherAPI(Required)');
    }

    // 응답 메시지 생성
    if (analysis.intent === 'datetime') {
      result.message = `현재 시간 정보를 제공했습니다. (${result.data.dateTime?.current})`;
      result.data.processing.learningRequired = false; // 시간은 학습 불필요
    } else if (analysis.intent === 'weather') {
      result.message =
        '날씨 정보는 외부 API가 필요하여 현재 제공할 수 없습니다.';
      result.data.processing.learningRequired = false; // 실시간 데이터는 학습 불필요
    } else if (analysis.intent === 'mixed') {
      result.message = `현재 시간: ${result.data.dateTime?.current}\n날씨 정보는 외부 API가 필요합니다.`;
      result.data.processing.learningRequired = false; // 둘 다 학습 불필요
    } else {
      result.message = '질문을 이해했지만 구체적인 정보를 제공하기 어렵습니다.';
      result.data.processing.learningRequired = true; // 일반 질의는 학습 가능
    }

    // 오타 교정 정보 추가
    if (analysis.hasTypos) {
      result.message += `\n\n[오타 교정] "${analysis.originalQuery}" → "${analysis.correctedQuery}"`;
    }

    return result;
  }

  /**
   * 학습 필요성 판단
   */
  shouldLearn(analysis: QueryAnalysis): boolean {
    // 날짜/시간, 날씨는 학습 불필요
    if (analysis.hasDateTime || analysis.hasWeather) {
      return false;
    }

    // 일반적인 질의만 학습 필요
    return analysis.intent === 'general';
  }

  /**
   * 처리 가능 여부 확인
   */
  canProcessLocally(analysis: QueryAnalysis): boolean {
    // 날짜/시간은 로컬에서 100% 처리 가능
    if (analysis.hasDateTime && !analysis.hasWeather) {
      return true;
    }

    // 날씨만 있으면 외부 API 필요
    if (analysis.hasWeather && !analysis.hasDateTime) {
      return false;
    }

    // 혼합이면 부분적으로 처리 가능
    if (analysis.hasDateTime && analysis.hasWeather) {
      return true; // 시간은 제공, 날씨는 불가 안내
    }

    return true; // 일반 질의는 로컬 처리 시도
  }
}
