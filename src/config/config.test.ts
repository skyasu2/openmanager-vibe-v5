import { describe, it, expect } from 'vitest';
import path from 'path';
import fs from 'fs';

describe('프로젝트 설정 검증', () => {
  it('필수 설정 파일들이 존재해야 함', () => {
    const requiredConfigs = [
      'next.config.mjs',
      'tsconfig.json',
      'package.json',
      'config/testing/vitest.config.main.ts', // 이동된 위치
    ];

    requiredConfigs.forEach((config) => {
      const configPath = path.join(process.cwd(), config);
      expect(fs.existsSync(configPath), `${config} 파일이 없음`).toBe(true);
    });
  });

  it('TypeScript 설정이 올바르게 되어 있어야 함', () => {
    const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));

    // strict mode 확인
    expect(tsconfig.compilerOptions.strict).toBe(true);
    expect(tsconfig.compilerOptions.noImplicitAny).toBe(true);
  });

  it('Next.js 설정이 올바르게 되어 있어야 함', () => {
    const nextConfigPath = path.join(process.cwd(), 'next.config.mjs');
    expect(fs.existsSync(nextConfigPath)).toBe(true);
  });
});
