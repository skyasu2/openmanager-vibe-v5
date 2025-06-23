import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// 시스템 상태 관리 통합 테스트

const originalEnv = process.env;

beforeEach(() => {
  vi.resetModules();
  process.env = { ...originalEnv };
});

afterEach(() => {
  process.env = originalEnv;
});

describe("System State Management Integration", () => {
  describe("System State Checker", () => {
    it("시스템이 OFF 상태일 때 작업을 차단해야 함", async () => {
      process.env.FORCE_SYSTEM_OFF = "true";
      
      const { checkSystemState } = await import("@/utils/systemStateChecker");
      const result = await checkSystemState();
      
      expect(result.isSystemActive).toBe(false);
      expect(result.reason).toContain("시스템 강제 비활성화");
    });

    it("정상 상태일 때 작업을 허용해야 함", async () => {
      delete process.env.FORCE_SYSTEM_OFF;
      delete process.env.SYSTEM_MAINTENANCE;
      delete process.env.DISABLE_CRON_JOBS;
      process.env.NODE_ENV = "development";
      
      const { checkSystemState } = await import("@/utils/systemStateChecker");
      const result = await checkSystemState();
      
      expect(result.isSystemActive).toBe(true);
      expect(result.reason).toContain("시스템 활성화");
    });
  });
});
