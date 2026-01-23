/**
 * 시스템 상태 포맷터 테스트
 *
 * @description
 * - formatUptime: 초 → 사람이 읽기 쉬운 형태
 * - formatEnvironment: 환경 문자열 → 표시용
 * - getStatusStyle: 상태에 따른 CSS 클래스
 * - getStatusText: 상태에 따른 텍스트
 * - getServiceStatusStyle: 서비스 상태에 따른 CSS
 */

import { describe, expect, it } from 'vitest';
import {
  formatEnvironment,
  formatUptime,
  getServiceStatusStyle,
  getStatusStyle,
  getStatusText,
} from './system-status-formatters';

describe('formatUptime', () => {
  it('0초 → "0분"', () => {
    expect(formatUptime(0)).toBe('0분');
  });

  it('59초 → "0분"', () => {
    expect(formatUptime(59)).toBe('0분');
  });

  it('60초 → "1분"', () => {
    expect(formatUptime(60)).toBe('1분');
  });

  it('119초 → "1분"', () => {
    expect(formatUptime(119)).toBe('1분');
  });

  it('120초 → "2분"', () => {
    expect(formatUptime(120)).toBe('2분');
  });

  it('3600초 → "1시간 0분"', () => {
    expect(formatUptime(3600)).toBe('1시간 0분');
  });

  it('3661초 → "1시간 1분"', () => {
    expect(formatUptime(3661)).toBe('1시간 1분');
  });

  it('7200초 → "2시간 0분"', () => {
    expect(formatUptime(7200)).toBe('2시간 0분');
  });

  it('7260초 → "2시간 1분"', () => {
    expect(formatUptime(7260)).toBe('2시간 1분');
  });

  it('86400초 (하루) → "24시간 0분"', () => {
    // 함수가 일 단위를 지원하지 않으므로 시간으로 표시
    expect(formatUptime(86400)).toBe('24시간 0분');
  });

  it('3599초 → "59분"', () => {
    expect(formatUptime(3599)).toBe('59분');
  });
});

describe('formatEnvironment', () => {
  it('production → Production', () => {
    expect(formatEnvironment('production')).toBe('Production');
  });

  it('development → Development', () => {
    expect(formatEnvironment('development')).toBe('Development');
  });

  it('staging → Staging', () => {
    expect(formatEnvironment('staging')).toBe('Staging');
  });

  it('test → Test', () => {
    expect(formatEnvironment('test')).toBe('Test');
  });

  it('unknown → 원본 반환', () => {
    expect(formatEnvironment('unknown')).toBe('unknown');
  });

  it('custom-env → 원본 반환', () => {
    expect(formatEnvironment('custom-env')).toBe('custom-env');
  });

  it('빈 문자열 → 빈 문자열', () => {
    expect(formatEnvironment('')).toBe('');
  });
});

describe('getStatusStyle', () => {
  it('running=true, starting=false → green', () => {
    // When
    const style = getStatusStyle(true, false);

    // Then
    expect(style).toContain('text-green-500');
    expect(style).toContain('animate-pulse');
  });

  it('running=false → red', () => {
    // When
    const style = getStatusStyle(false, false);

    // Then
    expect(style).toContain('text-red-500');
    expect(style).not.toContain('animate-pulse');
  });

  it('starting=true → yellow (우선)', () => {
    // When - starting이 true면 running 상태와 무관하게 yellow
    const style1 = getStatusStyle(true, true);
    const style2 = getStatusStyle(false, true);

    // Then
    expect(style1).toContain('text-yellow-500');
    expect(style1).toContain('animate-pulse');
    expect(style2).toContain('text-yellow-500');
    expect(style2).toContain('animate-pulse');
  });

  it('starting 우선순위 확인 - running=true, starting=true', () => {
    // When
    const style = getStatusStyle(true, true);

    // Then - starting이 우선
    expect(style).toBe('text-yellow-500 animate-pulse');
  });
});

describe('getStatusText', () => {
  it('running=true, starting=false → "시스템 실행 중"', () => {
    expect(getStatusText(true, false)).toBe('시스템 실행 중');
  });

  it('running=false, starting=false → "시스템 중지됨"', () => {
    expect(getStatusText(false, false)).toBe('시스템 중지됨');
  });

  it('starting=true → "시스템 시작 중..." (우선)', () => {
    expect(getStatusText(true, true)).toBe('시스템 시작 중...');
    expect(getStatusText(false, true)).toBe('시스템 시작 중...');
  });
});

describe('getServiceStatusStyle', () => {
  it('isHealthy=true → green', () => {
    // When
    const style = getServiceStatusStyle(true);

    // Then
    expect(style).toBe('text-green-500');
  });

  it('isHealthy=false → red', () => {
    // When
    const style = getServiceStatusStyle(false);

    // Then
    expect(style).toBe('text-red-500');
  });
});
