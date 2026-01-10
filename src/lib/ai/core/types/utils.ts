/**
 * Utility Types
 *
 * 범용 유틸리티 타입
 */

/**
 * Partial deep (재귀적 Partial)
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Required deep (재귀적 Required)
 */
export type DeepRequired<T> = {
  [P in keyof T]-?: T[P] extends object ? DeepRequired<T[P]> : T[P];
};

/**
 * Pick by value type
 */
export type PickByValue<T, ValueType> = Pick<
  T,
  { [K in keyof T]-?: T[K] extends ValueType ? K : never }[keyof T]
>;

/**
 * Omit by value type
 */
export type OmitByValue<T, ValueType> = Pick<
  T,
  { [K in keyof T]-?: T[K] extends ValueType ? never : K }[keyof T]
>;
