/**
 * 📝 Mock 로거
 *
 * Mock 서비스의 동작을 로깅
 */

export class MockLogger {
  private enabled: boolean;
  private prefix: string;

  constructor(name: string, enabled: boolean = true) {
    this.name = name;
    this.enabled = enabled;
    this.prefix = `🎭 [${name}]`;
  }

  /**
   * 정보 로그
   */
  info(message: string, data?: unknown): void {
    if (!this.enabled) return;

    const payload =
      data === undefined
        ? undefined
        : (() => {
            if (
              typeof data === 'string' ||
              typeof data === 'number' ||
              typeof data === 'boolean'
            ) {
              return data;
            }
            try {
              return JSON.stringify(data);
            } catch {
              return '[unserializable]';
            }
          })();

    if (payload !== undefined) {
      console.log(this.prefix, message, payload);
    } else {
      console.log(this.prefix, message);
    }
  }

  /**
   * 디버그 로그
   */
  debug(message: string, data?: unknown): void {
    if (!this.enabled || process.env.DEBUG !== 'true') return;

    const payload =
      data === undefined
        ? undefined
        : (() => {
            if (
              typeof data === 'string' ||
              typeof data === 'number' ||
              typeof data === 'boolean'
            ) {
              return data;
            }
            try {
              return JSON.stringify(data);
            } catch {
              return '[unserializable]';
            }
          })();

    if (payload !== undefined) {
      console.debug(this.prefix, '[DEBUG]', message, payload);
    } else {
      console.debug(this.prefix, '[DEBUG]', message);
    }
  }

  /**
   * 경고 로그
   */
  warn(message: string, data?: unknown): void {
    if (!this.enabled) return;

    const payload =
      data === undefined
        ? undefined
        : (() => {
            if (
              typeof data === 'string' ||
              typeof data === 'number' ||
              typeof data === 'boolean'
            ) {
              return data;
            }
            try {
              return JSON.stringify(data);
            } catch {
              return '[unserializable]';
            }
          })();

    if (payload !== undefined) {
      console.warn(this.prefix, '⚠️', message, payload);
    } else {
      console.warn(this.prefix, '⚠️', message);
    }
  }

  /**
   * 에러 로그
   */
  error(message: string, error?: unknown): void {
    if (!this.enabled) return;

    const errorMessage =
      error instanceof Error
        ? error.message
        : (() => {
            try {
              return JSON.stringify(error);
            } catch {
              return typeof error === 'string' ? error : '[unserializable]';
            }
          })();
    console.error(this.prefix, '❌', message, errorMessage);
  }

  /**
   * 로깅 활성화/비활성화
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * 로깅 상태
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}
