/**
 * safeFormat 유틸리티 함수 간단 테스트
 * vitest 없이 직접 실행
 */

import {
  safeFormatUptime,
  extractDaysFromUptime,
  isValidString,
  safeIncludes,
  safeNumber,
  safePercentage,
} from '../src/utils/safeFormat';

// 간단한 assert 함수
function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`❌ Assertion failed: ${message}`);
  }
  console.log(`✅ ${message}`);
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`❌ ${message}: expected ${expected}, got ${actual}`);
  }
  console.log(`✅ ${message}`);
}

// 테스트 실행
console.log('🧪 Testing safeFormat utilities...\n');

// safeFormatUptime 테스트
console.log('📦 safeFormatUptime tests:');
assertEqual(safeFormatUptime(86400), '1일 0시간', 'Format 1 day');
assertEqual(safeFormatUptime(3600), '1시간 0분', 'Format 1 hour');
assertEqual(safeFormatUptime(60), '1분', 'Format 1 minute');
assertEqual(safeFormatUptime(0), '0일', 'Format 0 seconds');
assertEqual(safeFormatUptime(null), 'N/A', 'Handle null');
assertEqual(safeFormatUptime(undefined), 'N/A', 'Handle undefined');

// extractDaysFromUptime 테스트
console.log('\n📦 extractDaysFromUptime tests:');
assertEqual(extractDaysFromUptime('5 days'), 5, 'Extract 5 days');
assertEqual(extractDaysFromUptime('3일'), 3, 'Extract 3일 (Korean)');
assertEqual(extractDaysFromUptime(86400), 1, 'Extract 1 day from seconds');
assertEqual(extractDaysFromUptime(null), 0, 'Handle null');

// isValidString 테스트
console.log('\n📦 isValidString tests:');
assert(isValidString('hello') === true, 'Valid string');
assert(isValidString('') === false, 'Empty string');
assert(isValidString('   ') === false, 'Whitespace only');
assert(isValidString(null) === false, 'Null value');

// safeIncludes 테스트
console.log('\n📦 safeIncludes tests:');
assert(safeIncludes('hello world', 'world') === true, 'String includes');
assert(safeIncludes('hello world', 'xyz') === false, 'String not includes');
assert(safeIncludes(null, 'test') === false, 'Null string');

// safeNumber 테스트
console.log('\n📦 safeNumber tests:');
assertEqual(safeNumber(123), 123, 'Number input');
assertEqual(safeNumber('123'), 123, 'String number');
assertEqual(safeNumber('invalid', 50), 50, 'Invalid with fallback');
assertEqual(safeNumber(null), 0, 'Null with default');

// safePercentage 테스트
console.log('\n📦 safePercentage tests:');
assertEqual(safePercentage(75), '75%', 'Format percentage');
assertEqual(safePercentage(0.5, true), '50%', 'Format decimal as percentage');
assertEqual(safePercentage(null), '0%', 'Null percentage');

console.log('\n✅ All tests passed!');
