/**
 * 🇰🇷 한국 표준시(KST) 유틸리티
 *
 * 브라우저 시간과 무관하게 한국 시간(UTC+9)으로 24시간 데이터 동기화
 */

/**
 * 현재 한국 시간 가져오기 (UTC+9)
 */
export function getCurrentKST(): Date {
  // 현재 UTC timestamp에 9시간(KST) 추가
  // getTime()은 이미 UTC이므로 getTimezoneOffset() 불필요
  const now = new Date();
  const kstTime = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kstTime;
}

/**
 * 한국 시간의 자정부터 경과한 분 계산 (0-1439)
 * @returns 0 (00:00) ~ 1439 (23:59)
 */
export function getKSTMinuteOfDay(): number {
  const kst = getCurrentKST();
  const hours = kst.getUTCHours();
  const minutes = kst.getUTCMinutes();
  return hours * 60 + minutes;
}

/**
 * 한국 시간의 현재 10분 슬롯 인덱스 (0-143)
 * @returns 0 (00:00-00:09) ~ 143 (23:50-23:59)
 */
export function getKST10MinSlotIndex(): number {
  const minuteOfDay = getKSTMinuteOfDay();
  return Math.floor(minuteOfDay / 10);
}

/**
 * 한국 시간의 현재 10분 슬롯 시작 분 (0, 10, 20, ..., 1430)
 */
export function getKST10MinSlotStart(): number {
  return getKST10MinSlotIndex() * 10;
}

/**
 * 분(minuteOfDay)을 HH:MM 형식으로 변환
 * @param minuteOfDay 0-1439
 * @returns "00:00" ~ "23:59"
 */
export function minuteOfDayToTime(minuteOfDay: number): string {
  const hours = Math.floor(minuteOfDay / 60);
  const minutes = minuteOfDay % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * 한국 시간의 현재 시각을 HH:MM 형식으로 반환
 */
export function getCurrentKSTTime(): string {
  const minuteOfDay = getKSTMinuteOfDay();
  return minuteOfDayToTime(minuteOfDay);
}

/**
 * 한국 시간의 현재 10분 슬롯 시간 범위 (예: "10:20-10:29")
 */
export function getCurrentKST10MinSlotRange(): string {
  const slotStart = getKST10MinSlotStart();
  const startTime = minuteOfDayToTime(slotStart);
  const endTime = minuteOfDayToTime(slotStart + 9);
  return `${startTime}-${endTime}`;
}

/**
 * 두 시간(분) 간의 차이 계산 (뫼비우스 띠 순환 고려)
 * @param from 시작 시간(분) 0-1439
 * @param to 종료 시간(분) 0-1439
 * @returns 차이(분), 항상 양수
 */
export function getMinuteDifference(from: number, to: number): number {
  // 직선 거리
  const straightDiff = Math.abs(to - from);

  // 24시간 순환 거리 (뫼비우스 띠)
  const wrapAroundDiff = 1440 - straightDiff;

  // 더 짧은 거리 반환
  return Math.min(straightDiff, wrapAroundDiff);
}

/**
 * 특정 시간(분)이 현재 한국 시간 기준 과거인지 미래인지 판단
 * @param minuteOfDay 확인할 시간(분)
 * @returns 'past' | 'current' | 'future'
 */
export function getTimeRelation(minuteOfDay: number): 'past' | 'current' | 'future' {
  const currentMinute = getKSTMinuteOfDay();
  const current10MinSlot = getKST10MinSlotStart();

  // 현재 10분 슬롯 내
  if (minuteOfDay >= current10MinSlot && minuteOfDay < current10MinSlot + 10) {
    return 'current';
  }

  // 순환 고려한 비교
  if (minuteOfDay < currentMinute) {
    // 오늘 자정 이후 ~ 현재 시간 이전
    return 'past';
  } else {
    // 현재 시간 이후 ~ 자정 이전
    return 'future';
  }
}

/**
 * N분 전의 minuteOfDay 계산 (뫼비우스 띠 순환)
 * @param minutes 몇 분 전인지
 * @returns 0-1439
 */
export function getMinutesAgo(minutes: number): number {
  const currentMinute = getKSTMinuteOfDay();
  let result = currentMinute - minutes;

  // 음수면 전날로 순환
  if (result < 0) {
    result = 1440 + result;
  }

  return result;
}

/**
 * N분 후의 minuteOfDay 계산 (뫼비우스 띠 순환)
 * @param minutes 몇 분 후인지
 * @returns 0-1439
 */
export function getMinutesLater(minutes: number): number {
  const currentMinute = getKSTMinuteOfDay();
  let result = currentMinute + minutes;

  // 1440 이상이면 다음날로 순환
  if (result >= 1440) {
    result = result - 1440;
  }

  return result;
}

/**
 * 디버깅용: 현재 KST 정보 출력
 */
export function logKSTInfo(): void {
  const kst = getCurrentKST();
  const minuteOfDay = getKSTMinuteOfDay();
  const slotIndex = getKST10MinSlotIndex();
  const slotRange = getCurrentKST10MinSlotRange();

  console.log('🇰🇷 KST Info:', {
    currentTime: kst.toISOString(),
    minuteOfDay,
    slotIndex,
    slotRange,
    formatted: getCurrentKSTTime(),
  });
}

/**
 * 테스트용: 특정 한국 시간(HH:MM)을 minuteOfDay로 변환
 * @param time "HH:MM" 형식
 * @returns 0-1439
 */
export function timeToMinuteOfDay(time: string): number {
  const parts = time.split(':').map(Number);
  const hours = parts[0] ?? 0;
  const minutes = parts[1] ?? 0;
  return hours * 60 + minutes;
}
