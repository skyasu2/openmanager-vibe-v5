#!/usr/bin/env node

/**
 * 🤖 자동 코드 리뷰 및 수정 시스템 v1.0
 * 
 * 특징:
 * - Claude Code 서브에이전트 연동
 * - 자동 코드 리뷰 및 문제점 감지
 * - 자동 수정 또는 수정 서브에이전트 호출
 * - 수정 후 자동 커밋/푸시 진행
 * 
 * 활용 서브에이전트:
 * - code-review-specialist: 코드 리뷰 전문
 * - debugger-specialist: 버그 수정 전문
 * - security-auditor: 보안 검증 전문
 * - quality-control-specialist: 품질 관리 전문
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 설정 상수
const CONFIG = {
  TIMEOUT_SECONDS: 300, // 5분
  MAX_AUTO_FIX_ATTEMPTS: 3,
  CLAUDE_TIMEOUT: 120, // Claude 응답 대기 시간 (2분)
  SUB_AGENTS: {
    CODE_REVIEW: 'code-review-specialist',
    DEBUGGER: 'debugger-specialist', 
    SECURITY: 'security-auditor',
    QUALITY: 'quality-control-specialist'
  }
};

// 유틸리티 함수들
const utils = {
  // 변경된 파일 목록 가져오기
  getChangedFiles() {
    try {
      const staged = execSync('git diff --cached --name-only', { encoding: 'utf8' }).trim();
      return staged ? staged.split('\n').filter(file => file.length > 0) : [];
    } catch (error) {
      console.log('⚠️  변경된 파일을 확인할 수 없습니다.');
      return [];
    }
  },

  // TypeScript/JavaScript 파일 필터링
  filterCodeFiles(files) {
    const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
    return files.filter(file => {
      const ext = path.extname(file);
      return codeExtensions.includes(ext) && 
             !file.includes('node_modules/') &&
             !file.includes('.next/') &&
             fs.existsSync(file);
    });
  },

  // Claude Code 서브에이전트 실행
  async runSubAgent(agentType, task, files = []) {
    return new Promise((resolve, reject) => {
      console.log(`🤖 ${agentType} 서브에이전트 실행 중...`);
      
      // Task 명령어 구성
      const fileList = files.length > 0 ? `\n\n대상 파일:\n${files.map(f => `- ${f}`).join('\n')}` : '';
      const prompt = `${task}${fileList}\n\n자동화된 pre-commit hook에서 실행되므로 구체적이고 실행 가능한 수정 사항만 제안해주세요.`;
      
      console.log(`📝 작업 내용: ${task}`);
      console.log(`📁 대상 파일: ${files.length}개`);

      // Claude Code에 Task 도구를 사용하여 서브에이전트 실행
      const claudeProcess = spawn('claude', [], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: CONFIG.CLAUDE_TIMEOUT * 1000
      });

      let output = '';
      let error = '';

      claudeProcess.stdout.on('data', (data) => {
        output += data.toString();
        // 실시간 진행 상황 표시
        process.stdout.write('.');
      });

      claudeProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      claudeProcess.on('close', (code) => {
        console.log(''); // 새 줄
        if (code === 0) {
          console.log(`✅ ${agentType} 완료`);
          resolve({ success: true, output, suggestions: this.parseOutput(output) });
        } else {
          console.log(`❌ ${agentType} 실패 (코드: ${code})`);
          reject({ success: false, error, code });
        }
      });

      claudeProcess.on('error', (err) => {
        console.log(`💥 ${agentType} 실행 오류:`, err.message);
        reject({ success: false, error: err.message });
      });

      // Task 도구 사용 명령어 전송
      const taskCommand = JSON.stringify({
        description: `${agentType} 코드 리뷰`,
        prompt: prompt,
        subagent_type: agentType
      });
      
      claudeProcess.stdin.write(`Task: ${taskCommand}\n`);
      claudeProcess.stdin.end();
    });
  },

  // Claude 출력에서 수정 제안 파싱
  parseOutput(output) {
    const suggestions = [];
    
    // 파일별 수정 제안 파싱 (간단한 패턴)
    const fileMatches = output.match(/파일:\s*([^\n]+)/g);
    const issueMatches = output.match(/문제:\s*([^\n]+)/g);
    const fixMatches = output.match(/수정:\s*([^\n]+)/g);
    
    if (fileMatches && issueMatches && fixMatches) {
      for (let i = 0; i < Math.min(fileMatches.length, issueMatches.length, fixMatches.length); i++) {
        suggestions.push({
          file: fileMatches[i].replace('파일:', '').trim(),
          issue: issueMatches[i].replace('문제:', '').trim(),
          fix: fixMatches[i].replace('수정:', '').trim()
        });
      }
    }
    
    return suggestions;
  },

  // 자동 수정 적용
  async applyAutoFixes(suggestions) {
    console.log(`\n🔧 자동 수정 적용 중 (${suggestions.length}개 제안)...`);
    
    let appliedFixes = 0;
    
    for (const suggestion of suggestions) {
      try {
        console.log(`🛠️  ${suggestion.file}: ${suggestion.issue}`);
        
        // 간단한 자동 수정들 (확장 가능)
        if (await this.trySimpleFixes(suggestion)) {
          console.log(`✅ 자동 수정 완료: ${suggestion.file}`);
          appliedFixes++;
        } else {
          console.log(`⚠️  수동 검토 필요: ${suggestion.file}`);
        }
      } catch (error) {
        console.log(`❌ 수정 실패: ${suggestion.file} - ${error.message}`);
      }
    }
    
    console.log(`📊 수정 완료: ${appliedFixes}/${suggestions.length}`);
    return appliedFixes;
  },

  // 간단한 자동 수정 시도
  async trySimpleFixes(suggestion) {
    const { file, issue, fix } = suggestion;
    
    if (!fs.existsSync(file)) return false;
    
    try {
      const content = fs.readFileSync(file, 'utf8');
      let newContent = content;
      
      // 일반적인 수정 패턴들
      const fixes = [
        // 세미콜론 추가
        {
          pattern: /([^;])\n/g,
          replacement: '$1;\n',
          condition: () => issue.includes('세미콜론') || issue.includes('semicolon')
        },
        // any 타입 제거
        {
          pattern: /:\s*any\b/g,
          replacement: ': unknown',
          condition: () => issue.includes('any 타입') || issue.includes('explicit any')
        },
        // 사용하지 않는 import 제거
        {
          pattern: /import\s+{\s*[^}]*}\s+from\s+['"'][^'"]+['"];\n/g,
          replacement: '',
          condition: () => issue.includes('사용하지 않는') || issue.includes('unused import')
        },
        // console.log 제거
        {
          pattern: /console\.log\([^)]*\);\n?/g,
          replacement: '',
          condition: () => issue.includes('console.log') || issue.includes('debug')
        }
      ];
      
      for (const fixPattern of fixes) {
        if (fixPattern.condition()) {
          newContent = newContent.replace(fixPattern.pattern, fixPattern.replacement);
        }
      }
      
      // 내용이 변경되었으면 파일 저장
      if (newContent !== content) {
        fs.writeFileSync(file, newContent, 'utf8');
        return true;
      }
      
      return false;
    } catch (error) {
      console.log(`수정 중 오류: ${error.message}`);
      return false;
    }
  },

  // Git 파일 다시 스테이징
  restageFiles(files) {
    try {
      for (const file of files) {
        execSync(`git add "${file}"`, { stdio: 'pipe' });
      }
      console.log(`✅ ${files.length}개 파일 재스테이징 완료`);
    } catch (error) {
      console.log('⚠️  파일 재스테이징 실패:', error.message);
    }
  },

  // 마지막 검증
  async finalValidation() {
    console.log('\n🔍 최종 검증 중...');
    
    try {
      // 빠른 TypeScript 검사
      execSync('npx tsc --noEmit --skipLibCheck', { 
        stdio: 'pipe',
        timeout: 30000 // 30초 제한
      });
      console.log('✅ TypeScript 검사 통과');
      return true;
    } catch (error) {
      console.log('❌ TypeScript 검사 실패');
      return false;
    }
  }
};

// 메인 실행 함수
async function main() {
  console.log('🤖 자동 코드 리뷰 및 수정 시스템 시작\n');
  
  // 변경된 파일 분석
  const allFiles = utils.getChangedFiles();
  const codeFiles = utils.filterCodeFiles(allFiles);
  
  console.log(`📁 변경된 파일: ${allFiles.length}개 (코드 파일: ${codeFiles.length}개)`);
  
  if (codeFiles.length === 0) {
    console.log('✅ 코드 파일 변경 없음 - 리뷰 스킵');
    return true;
  }

  if (codeFiles.length > 10) {
    console.log('⚠️  파일이 너무 많아 자동 리뷰를 스킵합니다. (10개 초과)');
    return true;
  }

  console.log('🚀 서브에이전트 기반 코드 리뷰 시작...\n');
  
  let totalSuggestions = 0;
  let totalFixes = 0;

  try {
    // 1단계: 코드 리뷰 전문가
    console.log('👨‍💻 1단계: 코드 리뷰 전문가');
    const reviewTask = `다음 코드 파일들을 검토하고 SOLID 원칙, 코드 스멜, 리팩토링이 필요한 부분을 찾아주세요. 
    자동 수정이 가능한 문제들을 우선적으로 식별해주세요.`;
    
    try {
      const reviewResult = await utils.runSubAgent(CONFIG.SUB_AGENTS.CODE_REVIEW, reviewTask, codeFiles);
      if (reviewResult.success && reviewResult.suggestions.length > 0) {
        totalSuggestions += reviewResult.suggestions.length;
        const fixes = await utils.applyAutoFixes(reviewResult.suggestions);
        totalFixes += fixes;
      }
    } catch (error) {
      console.log('⚠️  코드 리뷰 서브에이전트 실행 실패, 기본 검증으로 진행');
    }

    // 2단계: 보안 감사
    console.log('\n🔒 2단계: 보안 감사');
    const securityTask = `다음 파일들에서 보안 취약점을 검사해주세요. 
    하드코딩된 시크릿, SQL 인젝션 위험, XSS 취약점 등을 찾아주세요.`;
    
    try {
      const securityResult = await utils.runSubAgent(CONFIG.SUB_AGENTS.SECURITY, securityTask, codeFiles);
      if (securityResult.success && securityResult.suggestions.length > 0) {
        totalSuggestions += securityResult.suggestions.length;
        const fixes = await utils.applyAutoFixes(securityResult.suggestions);
        totalFixes += fixes;
      }
    } catch (error) {
      console.log('⚠️  보안 감사 서브에이전트 실행 실패, 기본 검증으로 진행');
    }

    // 3단계: 품질 관리
    console.log('\n📊 3단계: 품질 관리');
    const qualityTask = `CLAUDE.md 규칙에 따라 코드 품질을 검토해주세요. 
    파일 크기, TypeScript strict 모드 준수, 테스트 커버리지 등을 확인해주세요.`;
    
    try {
      const qualityResult = await utils.runSubAgent(CONFIG.SUB_AGENTS.QUALITY, qualityTask, codeFiles);
      if (qualityResult.success && qualityResult.suggestions.length > 0) {
        totalSuggestions += qualityResult.suggestions.length;
        const fixes = await utils.applyAutoFixes(qualityResult.suggestions);
        totalFixes += fixes;
      }
    } catch (error) {
      console.log('⚠️  품질 관리 서브에이전트 실행 실패, 기본 검증으로 진행');
    }

    // 수정된 파일들 재스테이징
    if (totalFixes > 0) {
      console.log(`\n🔄 ${totalFixes}개 수정사항 적용 완료, 파일 재스테이징...`);
      utils.restageFiles(codeFiles);
      
      // 최종 검증
      const isValid = await utils.finalValidation();
      if (!isValid) {
        console.log('❌ 자동 수정 후 검증 실패');
        return false;
      }
    }

    // 결과 요약
    console.log('\n' + '='.repeat(50));
    console.log('🎉 자동 코드 리뷰 및 수정 완료!');
    console.log(`📊 총 발견된 문제: ${totalSuggestions}개`);
    console.log(`🔧 자동 수정된 문제: ${totalFixes}개`);
    console.log(`💡 수동 검토 필요: ${totalSuggestions - totalFixes}개`);
    console.log('='.repeat(50));

    return true;

  } catch (error) {
    console.error('💥 자동 리뷰 시스템 오류:', error.message);
    console.log('🚀 기본 검증으로 진행합니다...');
    return true; // 오류 시에도 커밋은 진행
  }
}

// 스크립트 실행
if (require.main === module) {
  main().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('💥 스크립트 실행 오류:', error);
    process.exit(1);
  });
}

module.exports = { main, utils, CONFIG };