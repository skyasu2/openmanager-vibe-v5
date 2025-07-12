#!/usr/bin/env node

/**
 * Gemini CLI 개발도구 CLI 인터페이스
 * 
 * @description TypeScript 기반 모듈화된 Gemini CLI 개발도구 진입점
 * @note 로컬 개발 전용 - Vercel 배포 제외
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { GeminiCLIManager } from '../core/GeminiCLIManager.js';
import { CodeAnalyzer } from '../modules/CodeAnalyzer.js';
import { GitReviewer } from '../modules/GitReviewer.js';
import type { 
  CodeAnalysisOptions, 
  GitReviewOptions 
} from '../core/types.js';

const program = new Command();

// CLI 설정
program
  .name('gemini-dev')
  .description('🚀 Gemini CLI 개발도구 - TypeScript 기반 모듈화된 AI 개발 어시스턴트')
  .version('1.0.0');

// 환경 검증
if (process.env.NODE_ENV === 'production' || process.env.VERCEL || process.env.VERCEL_ENV) {
  console.error(chalk.red('🚫 이 도구는 로컬 개발 환경에서만 사용할 수 있습니다.'));
  process.exit(1);
}

/**
 * 코드 분석 명령어
 */
program
  .command('analyze')
  .description('📊 코드 분석 실행')
  .option('-p, --patterns <patterns...>', '분석할 파일 패턴', ['src/**/*.{ts,tsx,js,jsx}'])
  .option('-d, --depth <depth>', '분석 깊이', 'detailed')
  .option('-t, --types <types...>', '분석 유형', ['structure', 'quality', 'security'])
  .option('-f, --format <format>', '출력 형식', 'markdown')
  .option('-o, --output <file>', '출력 파일 경로')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 코드 분석을 시작합니다...'));
      console.log(chalk.gray(`패턴: ${options.patterns.join(', ')}`));
      console.log(chalk.gray(`깊이: ${options.depth}`));
      console.log('');

      const gemini = new GeminiCLIManager();
      const analyzer = new CodeAnalyzer(gemini);

      const analysisOptions: CodeAnalysisOptions = {
        filePatterns: options.patterns,
        depth: options.depth,
        analysisTypes: options.types,
        outputFormat: options.format
      };

      const result = await analyzer.analyze(analysisOptions);

      if (result.success) {
        console.log(chalk.green('✅ 코드 분석 완료!'));
        console.log('');
        
        // 결과 출력
        printAnalysisResult(result.data);
        
        // 통계 출력
        console.log(chalk.blue('📊 분석 통계:'));
        console.log(`• 실행 시간: ${result.metadata.executionTime}ms`);
        console.log(`• 처리된 파일: ${result.metadata.processedFiles}개`);
        console.log(`• Gemini 호출: ${result.metadata.geminiCalls}회`);
        
        // 파일 저장
        if (options.output) {
          await saveAnalysisResult(result.data, options.output, options.format);
          console.log(chalk.green(`💾 결과가 ${options.output}에 저장되었습니다.`));
        }
        
      } else {
        console.error(chalk.red('❌ 코드 분석 실패:'));
        if (result.errors) {
          result.errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  경고:'));
        result.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
      }

    } catch (error) {
      console.error(chalk.red('❌ 오류 발생:'), error);
      process.exit(1);
    }
  });

/**
 * Git 리뷰 명령어
 */
program
  .command('review')
  .description('🔍 Git 변경사항 리뷰')
  .option('-t, --target <target>', '리뷰할 브랜치/커밋')
  .option('-b, --base <base>', '베이스 브랜치', 'main')
  .option('-r, --type <type>', '리뷰 유형', 'changes')
  .option('-e, --exclude <patterns...>', '제외할 파일 패턴')
  .option('-o, --output <file>', '출력 파일 경로')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🔍 Git 변경사항 리뷰를 시작합니다...'));
      if (options.target) {
        console.log(chalk.gray(`타겟: ${options.target}`));
      }
      if (options.base) {
        console.log(chalk.gray(`베이스: ${options.base}`));
      }
      console.log('');

      const gemini = new GeminiCLIManager();
      const reviewer = new GitReviewer(gemini);

      const reviewOptions: GitReviewOptions = {
        target: options.target,
        base: options.base,
        reviewType: options.type,
        excludePatterns: options.exclude
      };

      const result = await reviewer.review(reviewOptions);

      if (result.success) {
        console.log(chalk.green('✅ Git 리뷰 완료!'));
        console.log('');
        
        // 결과 출력
        printReviewResult(result.data);
        
        // 통계 출력
        console.log(chalk.blue('📊 리뷰 통계:'));
        console.log(`• 실행 시간: ${result.metadata.executionTime}ms`);
        console.log(`• 처리된 파일: ${result.metadata.processedFiles}개`);
        console.log(`• Gemini 호출: ${result.metadata.geminiCalls}회`);
        
        // 파일 저장
        if (options.output) {
          await saveReviewResult(result.data, options.output);
          console.log(chalk.green(`💾 결과가 ${options.output}에 저장되었습니다.`));
        }
        
      } else {
        console.error(chalk.red('❌ Git 리뷰 실패:'));
        if (result.errors) {
          result.errors.forEach(error => console.error(chalk.red(`  • ${error}`)));
        }
      }

      if (result.warnings && result.warnings.length > 0) {
        console.log(chalk.yellow('⚠️  경고:'));
        result.warnings.forEach(warning => console.log(chalk.yellow(`  • ${warning}`)));
      }

    } catch (error) {
      console.error(chalk.red('❌ 오류 발생:'), error);
      process.exit(1);
    }
  });

/**
 * 상태 확인 명령어
 */
program
  .command('status')
  .description('📊 Gemini CLI 상태 확인')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Gemini CLI 개발도구 상태'));
      console.log('');

      const gemini = new GeminiCLIManager();
      
      // 헬스 체크
      console.log(chalk.gray('🔍 Gemini CLI 연결 확인 중...'));
      const isHealthy = await gemini.healthCheck();
      
      if (isHealthy) {
        console.log(chalk.green('✅ Gemini CLI 연결 정상'));
      } else {
        console.log(chalk.red('❌ Gemini CLI 연결 실패'));
      }

      // 통계 정보
      const stats = gemini.getStats();
      console.log('');
      console.log(chalk.blue('📈 사용 통계:'));
      console.log(`• 총 호출 수: ${stats.callCount}회`);
      console.log(`• 업타임: ${Math.floor(stats.uptime / 1000)}초`);
      console.log(`• 개발 모드: ${stats.isDevelopment ? '활성' : '비활성'}`);
      
      // 설정 정보
      console.log('');
      console.log(chalk.blue('⚙️  설정:'));
      console.log(`• 실행 경로: ${stats.config.executablePath}`);
      console.log(`• 타임아웃: ${stats.config.timeout}ms`);
      console.log(`• 최대 재시도: ${stats.config.maxRetries}회`);
      console.log(`• 로그 레벨: ${stats.config.logLevel}`);

    } catch (error) {
      console.error(chalk.red('❌ 상태 확인 실패:'), error);
      process.exit(1);
    }
  });

/**
 * 도움말 명령어
 */
program
  .command('help-extended')
  .description('📖 확장 도움말')
  .action(() => {
    console.log(chalk.blue('🚀 Gemini CLI 개발도구 확장 가이드'));
    console.log('');
    
    console.log(chalk.yellow('📊 코드 분석 예시:'));
    console.log('  gemini-dev analyze --patterns "src/**/*.ts" --depth comprehensive');
    console.log('  gemini-dev analyze --types quality security --output analysis.md');
    console.log('');
    
    console.log(chalk.yellow('🔍 Git 리뷰 예시:'));
    console.log('  gemini-dev review --target feature/new-feature --base main');
    console.log('  gemini-dev review --type security --exclude "*.test.ts"');
    console.log('');
    
    console.log(chalk.yellow('🔧 고급 사용법:'));
    console.log('  • 패턴 조합: --patterns "src/**/*.ts" "tests/**/*.test.ts"');
    console.log('  • 분석 유형: --types structure quality security performance');
    console.log('  • 출력 형식: --format markdown json text');
    console.log('');
    
    console.log(chalk.yellow('⚡ 팁:'));
    console.log('  • 대용량 프로젝트의 경우 패턴을 구체적으로 지정하세요');
    console.log('  • Git 리뷰는 작은 단위로 자주 실행하는 것이 효과적입니다');
    console.log('  • --output 옵션으로 결과를 파일로 저장할 수 있습니다');
  });

/**
 * 결과 출력 함수들
 */
function printAnalysisResult(data: any) {
  console.log(chalk.blue('📊 분석 결과 요약:'));
  console.log(`• 총 파일: ${data.summary.totalFiles}개`);
  console.log(`• 총 라인: ${data.summary.totalLines}줄`);
  console.log(`• 품질 점수: ${data.summary.qualityScore}/10`);
  console.log(`• 보안 이슈: ${data.summary.securityIssues}개`);
  console.log(`• 성능 이슈: ${data.summary.performanceIssues}개`);
  
  if (data.recommendations.length > 0) {
    console.log('');
    console.log(chalk.blue('💡 주요 추천사항:'));
    data.recommendations.slice(0, 3).forEach((rec: any) => {
      const priority = rec.priority === 'high' ? chalk.red('높음') : 
                      rec.priority === 'medium' ? chalk.yellow('중간') : chalk.green('낮음');
      console.log(`• [${priority}] ${rec.description}`);
    });
  }
}

function printReviewResult(data: any) {
  console.log(chalk.blue('🔍 리뷰 결과 요약:'));
  console.log(`• 변경된 파일: ${data.summary.changedFiles}개`);
  console.log(`• 추가된 라인: ${data.summary.addedLines}줄`);
  console.log(`• 삭제된 라인: ${data.summary.deletedLines}줄`);
  
  const riskColor = data.summary.riskLevel === 'high' ? chalk.red : 
                   data.summary.riskLevel === 'medium' ? chalk.yellow : chalk.green;
  console.log(`• 위험도: ${riskColor(data.summary.riskLevel)}`);
  console.log(`• 전체 점수: ${data.summary.overallScore}/10`);
  
  if (data.suggestedCommitMessage) {
    console.log('');
    console.log(chalk.blue('💬 제안 커밋 메시지:'));
    console.log(chalk.gray(`"${data.suggestedCommitMessage}"`));
  }
  
  if (data.feedback.recommendations.length > 0) {
    console.log('');
    console.log(chalk.blue('💡 주요 추천사항:'));
    data.feedback.recommendations.slice(0, 3).forEach((rec: string) => {
      console.log(`• ${rec}`);
    });
  }
}

async function saveAnalysisResult(data: any, filePath: string, format: string) {
  const { promises: fs } = await import('fs');
  
  let content: string;
  
  if (format === 'json') {
    content = JSON.stringify(data, null, 2);
  } else if (format === 'markdown') {
    content = generateMarkdownReport(data, 'analysis');
  } else {
    content = JSON.stringify(data, null, 2); // 기본값
  }
  
  await fs.writeFile(filePath, content, 'utf-8');
}

async function saveReviewResult(data: any, filePath: string) {
  const { promises: fs } = await import('fs');
  const content = generateMarkdownReport(data, 'review');
  await fs.writeFile(filePath, content, 'utf-8');
}

function generateMarkdownReport(data: any, type: 'analysis' | 'review'): string {
  if (type === 'analysis') {
    return `# 코드 분석 리포트

## 요약
- 총 파일: ${data.summary.totalFiles}개
- 총 라인: ${data.summary.totalLines}줄
- 품질 점수: ${data.summary.qualityScore}/10
- 보안 이슈: ${data.summary.securityIssues}개
- 성능 이슈: ${data.summary.performanceIssues}개

## 추천사항
${data.recommendations.map((rec: any) => `- **[${rec.priority}]** ${rec.description}: ${rec.impact}`).join('\n')}

---
생성일: ${new Date().toISOString()}
`;
  } else {
    return `# Git 리뷰 리포트

## 요약
- 변경된 파일: ${data.summary.changedFiles}개
- 추가된 라인: ${data.summary.addedLines}줄
- 삭제된 라인: ${data.summary.deletedLines}줄
- 위험도: ${data.summary.riskLevel}
- 전체 점수: ${data.summary.overallScore}/10

${data.suggestedCommitMessage ? `## 제안 커밋 메시지\n\`${data.suggestedCommitMessage}\`` : ''}

## 추천사항
${data.feedback.recommendations.map((rec: string) => `- ${rec}`).join('\n')}

---
생성일: ${new Date().toISOString()}
`;
  }
}

// CLI 실행
if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}