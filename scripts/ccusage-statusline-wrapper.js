#!/usr/bin/env node

/**
 * ccusage statusline wrapper
 * stdin 데이터 포맷을 변환하여 ccusage statusline과 호환되도록 처리
 */

const { spawn } = require('child_process');
const path = require('path');

let input = '';

// stdin 데이터 수집
process.stdin.on('data', (chunk) => {
  input += chunk;
});

process.stdin.on('end', () => {
  try {
    // Claude Code에서 전달된 데이터 파싱
    const claudeData = JSON.parse(input);
    
    // ccusage statusline이 요구하는 포맷으로 변환
    const projectPath = claudeData.project || process.cwd();
    const conversationId = claudeData.conversation_id || claudeData.session_id || 'unknown';
    
    // 프로젝트 폴더명 생성 (실제 Claude Code 형식과 동일하게)
    const projectFolderName = 'D--cursor-openmanager-vibe-v5';
    
    const statuslineData = {
      session_id: conversationId,
      transcript_path: claudeData.transcript_path || path.join(
        process.env.USERPROFILE || process.env.HOME,
        '.claude',
        'projects',
        projectFolderName,
        `${conversationId}.jsonl`
      ),
      cwd: projectPath,
      model: claudeData.model || {
        id: 'claude-opus-4-1-20250805',
        name: 'Opus 4.1',
        display_name: 'Claude Opus 4.1'
      },
      workspace: claudeData.workspace || {
        type: 'local',
        path: projectPath,
        current_dir: projectPath,
        project_dir: projectPath
      }
    };
    
    // ccusage statusline 실행
    const ccusage = spawn('npx', ['-y', 'ccusage', 'statusline'], {
      stdio: ['pipe', 'inherit', 'inherit'],
      shell: true
    });
    
    // 변환된 데이터 전달
    ccusage.stdin.write(JSON.stringify(statuslineData));
    ccusage.stdin.end();
    
    ccusage.on('exit', (code) => {
      process.exit(code || 0);
    });
    
  } catch (error) {
    // 파싱 실패 시 기본 ccusage 실행
    console.error('Wrapper error:', error.message);
    
    // 폴백: blocks --current 사용
    const fallback = spawn('npx', ['-y', 'ccusage', 'blocks', '--current'], {
      stdio: 'inherit',
      shell: true
    });
    
    fallback.on('exit', (code) => {
      process.exit(code || 0);
    });
  }
});

// stdin이 없는 경우 처리
setTimeout(() => {
  if (input === '') {
    // stdin 없이 ccusage 실행
    const ccusage = spawn('npx', ['-y', 'ccusage', 'statusline'], {
      stdio: 'inherit',
      shell: true
    });
    
    ccusage.on('exit', (code) => {
      process.exit(code || 0);
    });
  }
}, 100);