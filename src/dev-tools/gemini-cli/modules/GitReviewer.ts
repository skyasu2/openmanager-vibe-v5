/**
 * Git 리뷰어 모듈
 * 
 * @description Gemini CLI를 활용한 지능적 Git 변경사항 리뷰 도구
 * @note 재사용 가능한 모듈 - Git 워크플로우 자동화
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { GeminiCLIManager } from '../core/GeminiCLIManager.js';
import type { 
  GitReviewOptions, 
  ModuleResult, 
  GeminiQuery 
} from '../core/types.js';

const execAsync = promisify(exec);

export interface GitReviewResult {
  /** 리뷰 요약 */
  summary: {
    changedFiles: number;
    addedLines: number;
    deletedLines: number;
    riskLevel: 'low' | 'medium' | 'high';
    overallScore: number;
  };
  /** 파일별 리뷰 */
  fileReviews: Array<{
    file: string;
    changeType: 'added' | 'modified' | 'deleted' | 'renamed';
    linesAdded: number;
    linesDeleted: number;
    risk: 'low' | 'medium' | 'high';
    issues: Array<{
      type: 'logic' | 'style' | 'security' | 'performance' | 'best-practice';
      severity: 'info' | 'warning' | 'error';
      line: number;
      message: string;
      suggestion?: string;
    }>;
    improvements: string[];
    approval: 'approved' | 'needs-changes' | 'rejected';
  }>;
  /** 전체 피드백 */
  feedback: {
    positives: string[];
    concerns: string[];
    recommendations: string[];
    nextSteps: string[];
  };
  /** 커밋 메시지 제안 */
  suggestedCommitMessage?: string;
}

export class GitReviewer {
  private gemini: GeminiCLIManager;

  constructor(gemini?: GeminiCLIManager) {
    this.gemini = gemini || new GeminiCLIManager();
  }

  /**
   * Git 변경사항 리뷰 실행
   */
  async review(options: GitReviewOptions): Promise<ModuleResult<GitReviewResult>> {
    const startTime = Date.now();
    let geminiCalls = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 Git 변경사항 리뷰 시작...');

      // 1. Git diff 정보 수집
      const diffData = await this.collectDiffData(options);
      
      if (!diffData.hasChanges) {
        warnings.push('변경사항이 없습니다.');
        return {
          data: this.createEmptyResult(),
          metadata: {
            executionTime: Date.now() - startTime,
            processedFiles: 0,
            outputSize: 0,
            geminiCalls: 0
          },
          success: true,
          warnings
        };
      }

      console.log(`📁 변경된 파일: ${diffData.files.length}개`);

      // 2. 전체 변경사항 요약 분석
      const summaryQuery: GeminiQuery = {
        prompt: this.createSummaryPrompt(options),
        input: diffData.rawDiff
      };

      const summaryResponse = await this.gemini.executeQuery(summaryQuery);
      geminiCalls++;

      const summary = summaryResponse.success 
        ? this.parseSummary(summaryResponse.content, diffData)
        : this.createDefaultSummary(diffData);

      // 3. 파일별 상세 리뷰
      const fileReviews = [];
      
      for (const file of diffData.files.slice(0, 10)) { // 최대 10개 파일
        console.log(`🔍 파일 리뷰 중: ${file.path}`);
        
        const fileQuery: GeminiQuery = {
          prompt: this.createFileReviewPrompt(options, file),
          input: file.diff
        };

        const fileResponse = await this.gemini.executeQuery(fileQuery);
        geminiCalls++;

        if (fileResponse.success) {
          const review = this.parseFileReview(fileResponse.content, file);
          fileReviews.push(review);
        } else {
          errors.push(`파일 리뷰 실패: ${file.path} - ${fileResponse.error}`);
        }
      }

      // 4. 전체 피드백 생성
      console.log('💬 전체 피드백 생성 중...');
      const feedbackQuery: GeminiQuery = {
        prompt: this.createFeedbackPrompt(options),
        input: `리뷰 결과:\n${JSON.stringify({ summary, fileReviews }, null, 2)}`
      };

      const feedbackResponse = await this.gemini.executeQuery(feedbackQuery);
      geminiCalls++;

      const feedback = feedbackResponse.success 
        ? this.parseFeedback(feedbackResponse.content)
        : this.createDefaultFeedback();

      // 5. 커밋 메시지 제안 (선택적)
      let suggestedCommitMessage;
      if (options.reviewType === 'changes') {
        const commitQuery: GeminiQuery = {
          prompt: this.createCommitMessagePrompt(),
          input: diffData.rawDiff
        };

        const commitResponse = await this.gemini.executeQuery(commitQuery);
        geminiCalls++;

        if (commitResponse.success) {
          suggestedCommitMessage = this.parseCommitMessage(commitResponse.content);
        }
      }

      // 6. 결과 조합
      const result: GitReviewResult = {
        summary,
        fileReviews,
        feedback,
        suggestedCommitMessage
      };

      console.log('✅ Git 리뷰 완료!');

      return {
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          processedFiles: diffData.files.length,
          outputSize: JSON.stringify(result).length,
          geminiCalls
        },
        success: true,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('❌ Git 리뷰 실패:', error);
      return {
        data: this.createEmptyResult(),
        metadata: {
          executionTime: Date.now() - startTime,
          processedFiles: 0,
          outputSize: 0,
          geminiCalls
        },
        success: false,
        errors: [`Git 리뷰 실패: ${error}`]
      };
    }
  }

  /**
   * Git diff 데이터 수집
   */
  private async collectDiffData(options: GitReviewOptions) {
    try {
      // Git diff 명령어 구성
      let diffCommand = 'git diff';
      
      if (options.base && options.target) {
        diffCommand += ` ${options.base}..${options.target}`;
      } else if (options.target) {
        diffCommand += ` ${options.target}`;
      }

      // 제외 패턴 적용
      if (options.excludePatterns) {
        for (const pattern of options.excludePatterns) {
          diffCommand += ` ":(exclude)${pattern}"`;
        }
      }

      // 전체 diff 가져오기
      const { stdout: rawDiff } = await execAsync(diffCommand);
      
      // 파일별 정보 가져오기
      const { stdout: statOutput } = await execAsync(`${diffCommand} --stat`);
      const { stdout: nameStatusOutput } = await execAsync(`${diffCommand} --name-status`);

      const files = this.parseFileChanges(rawDiff, statOutput, nameStatusOutput);

      return {
        rawDiff,
        hasChanges: rawDiff.trim().length > 0,
        files,
        totalLines: this.countTotalLines(statOutput)
      };

    } catch (error) {
      throw new Error(`Git diff 수집 실패: ${error}`);
    }
  }

  /**
   * 파일 변경사항 파싱
   */
  private parseFileChanges(rawDiff: string, statOutput: string, nameStatusOutput: string) {
    const files = [];
    const nameStatusLines = nameStatusOutput.split('\n').filter(line => line.trim());
    
    for (const line of nameStatusLines) {
      const [status, ...pathParts] = line.split('\t');
      const path = pathParts.join('\t');
      
      if (!path) continue;

      // 파일별 diff 추출
      const fileDiff = this.extractFileDiff(rawDiff, path);
      const { added, deleted } = this.countFileLines(statOutput, path);

      files.push({
        path,
        status,
        diff: fileDiff,
        linesAdded: added,
        linesDeleted: deleted
      });
    }

    return files;
  }

  /**
   * 파일별 diff 추출
   */
  private extractFileDiff(rawDiff: string, filePath: string): string {
    const lines = rawDiff.split('\n');
    const result = [];
    let inFile = false;
    
    for (const line of lines) {
      if (line.startsWith(`diff --git`) && line.includes(filePath)) {
        inFile = true;
      } else if (line.startsWith(`diff --git`) && inFile) {
        break;
      }
      
      if (inFile) {
        result.push(line);
      }
    }
    
    return result.join('\n');
  }

  /**
   * 라인 수 계산
   */
  private countFileLines(statOutput: string, filePath: string): { added: number; deleted: number } {
    const lines = statOutput.split('\n');
    for (const line of lines) {
      if (line.includes(filePath)) {
        const match = line.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
        if (match) {
          return { added: parseInt(match[1]), deleted: parseInt(match[2]) };
        }
      }
    }
    return { added: 0, deleted: 0 };
  }

  /**
   * 총 라인 수 계산
   */
  private countTotalLines(statOutput: string): { added: number; deleted: number } {
    const match = statOutput.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
    return match 
      ? { added: parseInt(match[1]), deleted: parseInt(match[2]) }
      : { added: 0, deleted: 0 };
  }

  /**
   * 요약 프롬프트 생성
   */
  private createSummaryPrompt(options: GitReviewOptions): string {
    return `다음 Git 변경사항을 리뷰해주세요:

리뷰 유형: ${options.reviewType}
리뷰 관점: 코드 품질, 보안, 성능, 베스트 프랙티스

다음 형식으로 응답해주세요:
RISK_LEVEL: [low/medium/high]
OVERALL_SCORE: [0-10]
CHANGED_FILES: [숫자]

전체적인 변경사항의 품질과 위험도를 평가해주세요.`;
  }

  /**
   * 파일 리뷰 프롬프트 생성
   */
  private createFileReviewPrompt(options: GitReviewOptions, file: any): string {
    return `파일 "${file.path}"의 변경사항을 상세히 리뷰해주세요:

변경 유형: ${file.status}
추가된 라인: ${file.linesAdded}
삭제된 라인: ${file.linesDeleted}

다음 형식으로 응답해주세요:
RISK: [low/medium/high]
APPROVAL: [approved/needs-changes/rejected]

ISSUES:
- [type]: [severity] - [message] (line: [number])

IMPROVEMENTS:
- [개선사항 1]
- [개선사항 2]

코드 품질, 보안, 성능 관점에서 상세히 분석해주세요.`;
  }

  /**
   * 피드백 프롬프트 생성
   */
  private createFeedbackPrompt(options: GitReviewOptions): string {
    return `전체 코드 리뷰 결과를 바탕으로 종합적인 피드백을 제공해주세요:

다음 형식으로 응답해주세요:
POSITIVES:
- [좋은 점 1]
- [좋은 점 2]

CONCERNS:
- [우려사항 1]
- [우려사항 2]

RECOMMENDATIONS:
- [추천사항 1]
- [추천사항 2]

NEXT_STEPS:
- [다음 단계 1]
- [다음 단계 2]

건설적이고 구체적인 피드백을 제공해주세요.`;
  }

  /**
   * 커밋 메시지 프롬프트 생성
   */
  private createCommitMessagePrompt(): string {
    return `변경사항을 바탕으로 적절한 커밋 메시지를 제안해주세요:

형식: [타입]: [간단한 설명]

타입 예시:
- feat: 새로운 기능
- fix: 버그 수정
- refactor: 리팩토링
- docs: 문서 수정
- style: 코드 스타일 변경
- test: 테스트 추가/수정

한국어로 명확하고 간결한 커밋 메시지를 제안해주세요.`;
  }

  /**
   * 파싱 메서드들 (실제로는 더 정교하게 구현)
   */
  private parseSummary(content: string, diffData: any) {
    return {
      changedFiles: diffData.files.length,
      addedLines: diffData.totalLines.added,
      deletedLines: diffData.totalLines.deleted,
      riskLevel: 'medium' as const, // 실제로는 파싱
      overallScore: 7 // 실제로는 파싱
    };
  }

  private parseFileReview(content: string, file: any) {
    return {
      file: file.path,
      changeType: 'modified' as const, // 실제로는 파싱
      linesAdded: file.linesAdded,
      linesDeleted: file.linesDeleted,
      risk: 'low' as const, // 실제로는 파싱
      issues: [], // 실제로는 파싱
      improvements: [], // 실제로는 파싱
      approval: 'approved' as const // 실제로는 파싱
    };
  }

  private parseFeedback(content: string) {
    return {
      positives: ['코드 구조가 개선되었습니다'], // 실제로는 파싱
      concerns: [], // 실제로는 파싱
      recommendations: [], // 실제로는 파싱
      nextSteps: [] // 실제로는 파싱
    };
  }

  private parseCommitMessage(content: string): string {
    return content.trim(); // 실제로는 더 정교한 파싱
  }

  /**
   * 기본값 생성 메서드들
   */
  private createEmptyResult(): GitReviewResult {
    return {
      summary: {
        changedFiles: 0,
        addedLines: 0,
        deletedLines: 0,
        riskLevel: 'low',
        overallScore: 0
      },
      fileReviews: [],
      feedback: {
        positives: [],
        concerns: [],
        recommendations: [],
        nextSteps: []
      }
    };
  }

  private createDefaultSummary(diffData: any) {
    return {
      changedFiles: diffData.files.length,
      addedLines: diffData.totalLines.added,
      deletedLines: diffData.totalLines.deleted,
      riskLevel: 'medium' as const,
      overallScore: 5
    };
  }

  private createDefaultFeedback() {
    return {
      positives: ['변경사항을 검토했습니다'],
      concerns: [],
      recommendations: ['추가 테스트를 고려해보세요'],
      nextSteps: ['코드 리뷰 후 병합하세요']
    };
  }
}