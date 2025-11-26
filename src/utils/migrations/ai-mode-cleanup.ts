/**
 * AI 모드 localStorage 마이그레이션 (v4.0)
 * 모든 비-UNIFIED 값을 UNIFIED로 자동 변환
 *
 * @since v4.0 - AI Mode 선택 UI 제거
 * @author Claude Code
 * @created 2025-11-26
 */

/**
 * AI 모드 localStorage 마이그레이션 함수
 *
 * 다음 작업을 수행:
 * 1. selected-ai-engine 키의 모든 비-UNIFIED 값을 UNIFIED로 변환
 * 2. ai-sidebar-storage (Zustand persist)에서 currentEngine 필드 제거
 * 3. 레거시 키 제거 (ai-mode, aiMode, selected-mode)
 *
 * @returns void
 */
export function migrateAIModeStorage(): void {
  // SSR 환경에서는 실행하지 않음
  if (typeof window === 'undefined') return;

  try {
    // 1. selected-ai-engine 마이그레이션
    const engineKey = 'selected-ai-engine';
    const savedEngine = localStorage.getItem(engineKey);

    if (savedEngine && savedEngine !== 'UNIFIED') {
      localStorage.setItem(engineKey, 'UNIFIED');
      console.info(`✅ AI 엔진 마이그레이션 완료: ${savedEngine} → UNIFIED`);
    }

    // 2. ai-sidebar-storage 정리 (Zustand persist)
    const sidebarKey = 'ai-sidebar-storage';
    const sidebarStorage = localStorage.getItem(sidebarKey);

    if (sidebarStorage) {
      try {
        const parsed = JSON.parse(sidebarStorage);

        // currentEngine 필드가 있으면 제거
        if (parsed.state?.currentEngine) {
          delete parsed.state.currentEngine;
          localStorage.setItem(sidebarKey, JSON.stringify(parsed));
          console.info('✅ ai-sidebar-storage 정리 완료 (currentEngine 제거)');
        }
      } catch (err) {
        console.warn('ai-sidebar-storage 파싱 실패:', err);
        // 파싱 실패 시 전체 제거하여 fresh start
        localStorage.removeItem(sidebarKey);
        console.info('✅ 손상된 ai-sidebar-storage 제거됨 (재생성 예정)');
      }
    }

    // 3. 레거시 키 제거
    const legacyKeys = ['ai-mode', 'aiMode', 'selected-mode'];
    let removedCount = 0;

    legacyKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.info(`✅ 레거시 키 ${removedCount}개 제거 완료`);
    }

    // 마이그레이션 완료 플래그 설정 (중복 실행 방지)
    const migrationKey = 'ai-mode-migration-v4';
    if (!localStorage.getItem(migrationKey)) {
      localStorage.setItem(migrationKey, new Date().toISOString());
      console.info('🔄 AI 모드 마이그레이션 v4.0 완료');
    }
  } catch (error) {
    console.error('❌ AI 모드 마이그레이션 실패:', error);
    // 실패해도 앱은 정상 작동 (기본값 UNIFIED 사용)
  }
}

/**
 * 마이그레이션이 이미 실행되었는지 확인
 *
 * @returns {boolean} 마이그레이션 실행 여부
 */
export function isMigrationCompleted(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('ai-mode-migration-v4') !== null;
}

/**
 * 마이그레이션 초기화 (테스트용)
 * ⚠️ 프로덕션에서는 사용하지 말 것
 *
 * @internal
 */
export function resetMigration(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('ai-mode-migration-v4');
  console.warn('⚠️ AI 모드 마이그레이션 플래그 제거됨 (테스트 목적)');
}
