#!/usr/bin/env node

/**
 * 🔧 MCP 설정 충돌 해결 스크립트
 * OpenManager Vibe v5 - 프로젝트별 vs 글로벌 MCP 설정 정리
 */

import fs from 'fs';
import os from 'os';
import path from 'path';

console.log('🔍 MCP 설정 충돌 분석 및 해결 시작\n');

// 경로 정의
const globalMcpPath = path.join(os.homedir(), '.cursor', 'mcp.json');
const projectMcpPath = path.join(process.cwd(), '.cursor', 'mcp.json');

console.log('📍 설정 파일 위치:');
console.log(`  글로벌: ${globalMcpPath}`);
console.log(`  프로젝트: ${projectMcpPath}\n`);

// 현재 상태 분석
function analyzeCurrentState() {
  console.log('🔍 현재 상태 분석:');

  let globalExists = fs.existsSync(globalMcpPath);
  let projectExists = fs.existsSync(projectMcpPath);

  console.log(`  글로벌 설정: ${globalExists ? '✅ 존재' : '❌ 없음'}`);
  console.log(`  프로젝트 설정: ${projectExists ? '✅ 존재' : '❌ 없음'}`);

  if (globalExists && projectExists) {
    console.log('\n⚠️  충돌 상황: 동일한 서버 이름으로 2개 설정 존재');

    // 설정 내용 분석
    const globalConfig = JSON.parse(fs.readFileSync(globalMcpPath, 'utf8'));
    const projectConfig = JSON.parse(fs.readFileSync(projectMcpPath, 'utf8'));

    const globalServers = Object.keys(globalConfig.mcpServers || {});
    const projectServers = Object.keys(projectConfig.mcpServers || {});

    console.log(`  글로벌 서버: ${globalServers.join(', ')}`);
    console.log(`  프로젝트 서버: ${projectServers.join(', ')}`);

    // 중복 서버 찾기
    const duplicates = globalServers.filter(name =>
      projectServers.includes(name)
    );
    if (duplicates.length > 0) {
      console.log(`  🚨 중복 서버: ${duplicates.join(', ')}`);
      return { conflict: true, duplicates, globalConfig, projectConfig };
    }
  }

  return { conflict: false };
}

// 해결 방안 제시
function proposeSolutions(analysis) {
  console.log('\n💡 해결 방안:');

  if (!analysis.conflict) {
    console.log('  ✅ 충돌 없음 - 현재 상태 유지');
    return;
  }

  console.log('  📋 옵션 1: 글로벌만 사용 (권장)');
  console.log('    - 프로젝트별 설정 삭제');
  console.log('    - 모든 프로젝트에서 글로벌 설정 사용');
  console.log('    - 관리 최소화');

  console.log('\n  📋 옵션 2: 서버 이름 분리');
  console.log('    - 글로벌: "everything-global"');
  console.log('    - 프로젝트: "everything-dev"');
  console.log('    - 두 설정 모두 유지');

  console.log('\n  📋 옵션 3: 프로젝트별만 사용');
  console.log('    - 글로벌 설정 삭제');
  console.log('    - 프로젝트마다 개별 설정');
  console.log('    - 세밀한 제어 가능');
}

// 옵션 1 실행: 글로벌만 사용
function executeOption1() {
  console.log('\n🚀 옵션 1 실행: 글로벌 설정만 사용');

  if (fs.existsSync(projectMcpPath)) {
    const backupPath = `${projectMcpPath}.backup.${Date.now()}`;
    fs.copyFileSync(projectMcpPath, backupPath);
    fs.unlinkSync(projectMcpPath);
    console.log(`  💾 프로젝트 설정 백업: ${backupPath}`);
    console.log(`  🗑️  프로젝트 설정 삭제: ${projectMcpPath}`);
  }

  console.log('  ✅ 이제 글로벌 Everything MCP만 사용됩니다');
  console.log('  🔄 Cursor 재시작 필요');
}

// 옵션 2 실행: 서버 이름 분리
function executeOption2() {
  console.log('\n🚀 옵션 2 실행: 서버 이름 분리');

  // 글로벌 설정 수정
  if (fs.existsSync(globalMcpPath)) {
    const globalConfig = JSON.parse(fs.readFileSync(globalMcpPath, 'utf8'));
    if (globalConfig.mcpServers.everything) {
      globalConfig.mcpServers['everything-global'] =
        globalConfig.mcpServers.everything;
      delete globalConfig.mcpServers.everything;
      fs.writeFileSync(globalMcpPath, JSON.stringify(globalConfig, null, 2));
      console.log('  ✅ 글로벌 서버 이름: everything → everything-global');
    }
  }

  // 프로젝트 설정 수정
  if (fs.existsSync(projectMcpPath)) {
    const projectConfig = JSON.parse(fs.readFileSync(projectMcpPath, 'utf8'));
    if (projectConfig.mcpServers.everything) {
      projectConfig.mcpServers['everything-dev'] =
        projectConfig.mcpServers.everything;
      delete projectConfig.mcpServers.everything;
      fs.writeFileSync(projectMcpPath, JSON.stringify(projectConfig, null, 2));
      console.log('  ✅ 프로젝트 서버 이름: everything → everything-dev');
    }
  }

  console.log(
    '  🎯 이제 @everything-global, @everything-dev 로 구분 사용 가능'
  );
  console.log('  🔄 Cursor 재시작 필요');
}

// 메인 실행
function main() {
  const analysis = analyzeCurrentState();
  proposeSolutions(analysis);

  if (analysis.conflict) {
    console.log('\n❓ 어떤 옵션을 실행하시겠습니까?');
    console.log(
      '  node scripts/resolve-mcp-conflict.js --option1  (글로벌만 사용)'
    );
    console.log(
      '  node scripts/resolve-mcp-conflict.js --option2  (이름 분리)'
    );

    // 명령행 인수 처리
    const args = process.argv.slice(2);
    if (args.includes('--option1')) {
      executeOption1();
    } else if (args.includes('--option2')) {
      executeOption2();
    } else {
      console.log('\n💡 권장: 글로벌 설정만 사용 (--option1)');
    }
  }
}

// 실행
if (require.main === module) {
  main();
}
