#!/usr/bin/env node

/**
 * Husky 훅 헬퍼 스크립트
 * 훅을 임시로 비활성화하거나 활성화할 수 있습니다.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const huskyDir = path.join(process.cwd(), '.husky');

function disableHooks() {
  console.log('🔒 Husky 훅 비활성화 중...');

  const hooks = ['pre-commit', 'pre-push'];

  hooks.forEach(hook => {
    const hookPath = path.join(huskyDir, hook);
    const backupPath = path.join(huskyDir, `${hook}.backup`);

    if (fs.existsSync(hookPath)) {
      fs.renameSync(hookPath, backupPath);
      console.log(`✅ ${hook} 훅 비활성화됨`);
    }
  });
}

function enableHooks() {
  console.log('🔓 Husky 훅 활성화 중...');

  const hooks = ['pre-commit', 'pre-push'];

  hooks.forEach(hook => {
    const hookPath = path.join(huskyDir, hook);
    const backupPath = path.join(huskyDir, `${hook}.backup`);

    if (fs.existsSync(backupPath)) {
      fs.renameSync(backupPath, hookPath);
      console.log(`✅ ${hook} 훅 활성화됨`);
    }
  });
}

function showStatus() {
  console.log('📊 Husky 훅 상태:');

  const hooks = ['pre-commit', 'pre-push'];

  hooks.forEach(hook => {
    const hookPath = path.join(huskyDir, hook);
    const backupPath = path.join(huskyDir, `${hook}.backup`);

    if (fs.existsSync(hookPath)) {
      console.log(`✅ ${hook}: 활성화됨`);
    } else if (fs.existsSync(backupPath)) {
      console.log(`🔒 ${hook}: 비활성화됨`);
    } else {
      console.log(`❌ ${hook}: 없음`);
    }
  });
}

const command = process.argv[2];

switch (command) {
  case 'disable':
    disableHooks();
    break;
  case 'enable':
    enableHooks();
    break;
  case 'status':
    showStatus();
    break;
  default:
    console.log('사용법:');
    console.log('  node scripts/husky-helper.js disable  # 훅 비활성화');
    console.log('  node scripts/husky-helper.js enable   # 훅 활성화');
    console.log('  node scripts/husky-helper.js status   # 상태 확인');
    break;
}
