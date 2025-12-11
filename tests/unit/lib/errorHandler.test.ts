/**
 * 🧪 error-handler.ts 유닛 테스트
 *
 * @description 시스템 핵심 에러 처리 로직 검증 (SafeError 변환, 분류, 자동 복구 판단)
 */

import { describe, expect, it } from 'vitest';
import {
  classifyErrorType,
  createSafeError,
  isAutoRecoverableError,
  isLoadingRelatedError,
  safeErrorMessage,
} from '../../../src/lib/error-handler';

describe('🛡️ Error Handler Utilities', () => {
  // 1. createSafeError (에러 객체 정규화)
  describe('createSafeError', () => {
    it('일반 Error 객체를 SafeError로 변환한다', () => {
      const error = new Error('Test error');
      const safeError = createSafeError(error);

      expect(safeError.message).toBe('Test error');
      expect(safeError.name).toBe('Error');
      expect(safeError.originalError).toBe(error);
    });

    it('문자열 에러를 SafeError로 변환한다', () => {
      const safeError = createSafeError('String error');

      expect(safeError.message).toBe('String error');
      expect(safeError.code).toBe('STRING_ERROR');
    });

    it('null/undefined를 안전하게 처리한다', () => {
      const safeErrorNull = createSafeError(null);
      const safeErrorUndefined = createSafeError(undefined);

      expect(safeErrorNull.code).toBe('NULL_ERROR');
      expect(safeErrorUndefined.code).toBe('NULL_ERROR');
    });

    it('객체형 에러(API 응답 등)를 처리한다', () => {
      const apiError = { message: 'API Failed', code: 'API_500' };
      const safeError = createSafeError(apiError);

      expect(safeError.message).toBe('API Failed');
      expect(safeError.code).toBe('API_500');
    });
  });

  // 2. classifyErrorType (에러 분류)
  describe('classifyErrorType', () => {
    it('네트워크 관련 에러를 분류한다', () => {
      const error = createSafeError(new Error('Network request failed'));
      expect(classifyErrorType(error)).toBe('NETWORK_ERROR');
    });

    it('인증(401) 에러를 분류한다', () => {
      const error = createSafeError(
        new Error('Request failed with status code 401')
      );
      expect(classifyErrorType(error)).toBe('AUTHENTICATION_ERROR');
    });

    it('권한(403) 에러를 분류한다', () => {
      const error = createSafeError(new Error('Forbidden access 403'));
      expect(classifyErrorType(error)).toBe('PERMISSION_ERROR');
    });

    it('서버(500) 에러를 분류한다', () => {
      const error = createSafeError(new Error('Internal Server Error 500'));
      expect(classifyErrorType(error)).toBe('SERVER_ERROR');
    });

    it('타임아웃 에러를 분류한다', () => {
      const error = createSafeError(new Error('Request timeout'));
      expect(classifyErrorType(error)).toBe('TIMEOUT_ERROR');
    });
  });

  // 3. isLoadingRelatedError (로딩 에러 감지)
  describe('isLoadingRelatedError', () => {
    it('로딩 관련 키워드가 포함된 에러를 감지한다', () => {
      expect(isLoadingRelatedError(new Error('Loading failed'))).toBe(true);
      expect(isLoadingRelatedError(new Error('System boot error'))).toBe(true);
      expect(
        isLoadingRelatedError(new Error('cannot read property of undefined'))
      ).toBe(true);
    });

    it('로딩과 무관한 에러는 false를 반환한다', () => {
      expect(isLoadingRelatedError(new Error('Invalid password'))).toBe(false);
    });
  });

  // 4. isAutoRecoverableError (복구 가능 여부)
  describe('isAutoRecoverableError', () => {
    it('네트워크 및 서버 에러는 복구 가능으로 판단한다', () => {
      expect(isAutoRecoverableError(new Error('Network error'))).toBe(true);
      expect(isAutoRecoverableError(new Error('503 Service Unavailable'))).toBe(
        true
      );
    });

    it('치명적인 로직 에러나 모르는 에러는 복구 불가능으로 판단할 수 있다', () => {
      // Note: Implementation specific, checking based on current logic
      // Currently generic errors are NOT recoverable unless type safety related
      expect(
        isAutoRecoverableError(new Error('Business logic validation failed'))
      ).toBe(false);
    });
  });

  // 5. safeErrorMessage (메시지 추출)
  describe('safeErrorMessage', () => {
    it('에러에서 메시지를 안전하게 추출한다', () => {
      expect(safeErrorMessage(new Error('My Msg'))).toBe('My Msg');
      expect(safeErrorMessage('String Msg')).toBe('String Msg');
      expect(safeErrorMessage(null, 'Fallback')).toBe('Fallback');
    });
  });
});
