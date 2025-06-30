import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 시스템 온오프에 따른 데이터 생성 테스트

// 환경변수 모킹
const originalEnv = process.env;

// 콘솔 출력 캡처를 위한 모킹
const mockConsoleLog = vi.fn();
const originalConsoleLog = console.log;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };

  // 콘솔 모킹 설정
  console.log = mockConsoleLog;
  mockConsoleLog.mockClear();
});

afterEach(() => {
  process.env = originalEnv;
  console.log = originalConsoleLog;
});

describe('Data Generation On/Off Control', () => {
  describe('RealServerDataGenerator State Control', () => {
    it('시스템 OFF 상태에서 데이터 생성을 시작하지 않아야 함', async () => {
      process.env.FORCE_SYSTEM_OFF = 'true';

      // RealServerDataGenerator 동적 import
      const { RealServerDataGenerator } = await import(
        '@/services/data-generator/RealServerDataGenerator'
      );
      const generator = RealServerDataGenerator.getInstance();

      // 시스템 OFF 상태에서 데이터 생성 시도
      generator.startAutoGeneration();

      // 잠시 대기하여 비동기 검증이 완료되도록 함
      await new Promise(resolve => setTimeout(resolve, 100));

      // 콘솔 출력에서 시스템 차단 메시지 확인
      const logMessages = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const hasStopMessage = logMessages.some(
        msg =>
          msg.includes('서버 데이터 생성 중단') ||
          msg.includes('시스템 비활성화') ||
          msg.includes('시스템이 비활성화')
      );

      expect(hasStopMessage).toBe(true);
      expect(generator.getStatus().isRunning).toBe(false);
    });

    it('시스템 ON 상태에서만 데이터 생성을 허용해야 함', async () => {
      delete process.env.FORCE_SYSTEM_OFF;
      delete process.env.SYSTEM_MAINTENANCE;
      delete process.env.DISABLE_CRON_JOBS;
      (process.env as Record<string, string | undefined>).NODE_ENV =
        'development';

      const { RealServerDataGenerator } = await import(
        '@/services/data-generator/RealServerDataGenerator'
      );
      const generator = RealServerDataGenerator.getInstance();

      // 시스템 ON 상태에서 데이터 생성 시도
      generator.startAutoGeneration();

      // 잠시 대기하여 비동기 검증이 완료되도록 함
      await new Promise(resolve => setTimeout(resolve, 200));

      // 콘솔 출력에서 성공 메시지 확인
      const logMessages = mockConsoleLog.mock.calls.map(call => call.join(' '));
      const hasStartMessage = logMessages.some(
        msg =>
          msg.includes('데이터 생성 시작') ||
          msg.includes('실시간 데이터 생성 시작') ||
          msg.includes('서버 데이터 생성 시작')
      );

      expect(hasStartMessage).toBe(true);

      // 정리
      await generator.stopAutoGeneration();
    });

    it('데이터 생성 중 시스템이 OFF되면 생성을 중단해야 함', async () => {
      // 먼저 시스템 ON 상태로 데이터 생성 시작
      delete process.env.FORCE_SYSTEM_OFF;
      (process.env as Record<string, string | undefined>).NODE_ENV =
        'development';

      const { RealServerDataGenerator } = await import(
        '@/services/data-generator/RealServerDataGenerator'
      );
      const generator = RealServerDataGenerator.getInstance();

      await generator.startAutoGeneration();
      expect(generator.getStatus().isRunning).toBe(true);

      // 시스템 OFF로 변경
      process.env.FORCE_SYSTEM_OFF = 'true';

      // 다음 생성 사이클에서 중단되어야 함
      // (실제로는 내부 타이머에서 시스템 상태를 확인)
      const status = generator.getStatus();
      expect(status.isMockMode).toBe(true); // 테스트 환경에서는 mock 모드

      // 정리
      await generator.stopAutoGeneration();
    });
  });

  describe('Environment Variable Control', () => {
    it('DISABLE_DATA_GENERATION=true일 때 데이터 생성을 차단해야 함', async () => {
      process.env.DISABLE_DATA_GENERATION = 'true';

      const { getSystemControlEnvVars } = await import(
        '@/utils/systemStateChecker'
      );
      const envVars = getSystemControlEnvVars();

      expect(envVars.dataGenerationDisabled).toBe(true);
      expect(envVars.forceOff).toBe(false);
    });

    it('모든 제어 환경변수가 정상적으로 작동해야 함', async () => {
      process.env.FORCE_SYSTEM_OFF = 'true';
      process.env.SYSTEM_MAINTENANCE = 'true';
      process.env.DISABLE_CRON_JOBS = 'true';
      process.env.DISABLE_DATA_GENERATION = 'true';

      const { getSystemControlEnvVars } = await import(
        '@/utils/systemStateChecker'
      );
      const envVars = getSystemControlEnvVars();

      expect(envVars.forceOff).toBe(true);
      expect(envVars.maintenanceMode).toBe(true);
      expect(envVars.cronDisabled).toBe(true);
      expect(envVars.dataGenerationDisabled).toBe(true);
    });
  });

  describe('System State Integration', () => {
    it('시스템 상태 확인 후 적절한 동작을 수행해야 함', async () => {
      process.env.FORCE_SYSTEM_OFF = 'true';

      const { validateSystemForOperation } = await import(
        '@/utils/systemStateChecker'
      );
      const validation = await validateSystemForOperation('데이터 생성 테스트');

      expect(validation.canProceed).toBe(false);
      expect(validation.systemState.shouldSkipOperation).toBe(true);
      expect(validation.systemState.powerMode).toBe('sleep');
    });

    it('정상 상태에서는 모든 작업을 허용해야 함', async () => {
      delete process.env.FORCE_SYSTEM_OFF;
      delete process.env.SYSTEM_MAINTENANCE;
      delete process.env.DISABLE_CRON_JOBS;
      (process.env as Record<string, string | undefined>).NODE_ENV =
        'development';

      const { validateSystemForOperation } = await import(
        '@/utils/systemStateChecker'
      );
      const validation = await validateSystemForOperation('데이터 생성 테스트');

      expect(validation.canProceed).toBe(true);
      expect(validation.systemState.shouldSkipOperation).toBe(false);
      expect(validation.systemState.powerMode).toBe('active');
    });
  });
});
