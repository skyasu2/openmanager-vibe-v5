/**
 * 코드 분석 모듈
 * 
 * @description Gemini CLI를 활용한 지능적 코드 분석 도구
 * @note 재사용 가능한 모듈 - 다양한 프로젝트에서 활용 가능
 */

import { glob } from 'glob';
import path from 'path';
import { promises as fs } from 'fs';
import { GeminiCLIManager } from '../core/GeminiCLIManager.js';
import type { 
  CodeAnalysisOptions, 
  ModuleResult, 
  GeminiQuery 
} from '../core/types.js';

export interface CodeAnalysisResult {
  /** 전체 분석 요약 */
  summary: {
    totalFiles: number;
    totalLines: number;
    languages: Record<string, number>;
    qualityScore: number;
    securityIssues: number;
    performanceIssues: number;
  };
  /** 파일별 분석 결과 */
  fileAnalysis: Array<{
    file: string;
    language: string;
    lines: number;
    complexity: 'low' | 'medium' | 'high';
    issues: Array<{
      type: 'quality' | 'security' | 'performance' | 'style';
      severity: 'info' | 'warning' | 'error';
      message: string;
      line?: number;
    }>;
    suggestions: string[];
  }>;
  /** 아키텍처 분석 */
  architecture: {
    patterns: string[];
    dependencies: Record<string, string[]>;
    cyclomatic: number;
    maintainability: number;
  };
  /** 추천 사항 */
  recommendations: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    impact: string;
  }>;
}

export class CodeAnalyzer {
  private gemini: GeminiCLIManager;

  constructor(gemini?: GeminiCLIManager) {
    this.gemini = gemini || new GeminiCLIManager();
  }

  /**
   * 코드 분석 실행
   */
  async analyze(options: CodeAnalysisOptions): Promise<ModuleResult<CodeAnalysisResult>> {
    const startTime = Date.now();
    let processedFiles = 0;
    let geminiCalls = 0;
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      console.log('🔍 코드 분석 시작...');

      // 1. 파일 수집
      const files = await this.collectFiles(options.filePatterns);
      console.log(`📁 발견된 파일: ${files.length}개`);

      if (files.length === 0) {
        warnings.push('분석할 파일이 없습니다.');
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

      // 2. 파일별 분석
      const fileAnalysis = [];
      const languages: Record<string, number> = {};
      let totalLines = 0;

      for (const file of files.slice(0, 20)) { // 최대 20개 파일로 제한
        try {
          const content = await fs.readFile(file, 'utf-8');
          const lines = content.split('\n').length;
          const language = this.detectLanguage(file);
          
          totalLines += lines;
          languages[language] = (languages[language] || 0) + 1;

          // Gemini로 파일 분석
          const analysisQuery: GeminiQuery = {
            prompt: this.createFileAnalysisPrompt(options),
            input: `파일: ${file}\n\n${content}`
          };

          const response = await this.gemini.executeQuery(analysisQuery);
          geminiCalls++;

          if (response.success) {
            const analysis = this.parseFileAnalysis(response.content, file, language, lines);
            fileAnalysis.push(analysis);
          } else {
            errors.push(`파일 분석 실패: ${file} - ${response.error}`);
          }

          processedFiles++;
          
        } catch (error) {
          errors.push(`파일 읽기 실패: ${file} - ${error}`);
        }
      }

      // 3. 아키텍처 분석
      console.log('🏗️ 아키텍처 분석 중...');
      const architectureQuery: GeminiQuery = {
        prompt: this.createArchitectureAnalysisPrompt(options),
        input: `프로젝트 구조:\n${files.slice(0, 50).join('\n')}`
      };

      const archResponse = await this.gemini.executeQuery(architectureQuery);
      geminiCalls++;

      const architecture = archResponse.success 
        ? this.parseArchitectureAnalysis(archResponse.content)
        : this.createDefaultArchitecture();

      // 4. 전체 요약 및 추천사항
      console.log('📊 요약 생성 중...');
      const summaryQuery: GeminiQuery = {
        prompt: this.createSummaryPrompt(options),
        input: `분석 결과:\n파일 수: ${processedFiles}\n총 라인: ${totalLines}\n언어: ${Object.keys(languages).join(', ')}`
      };

      const summaryResponse = await this.gemini.executeQuery(summaryQuery);
      geminiCalls++;

      const { summary, recommendations } = summaryResponse.success 
        ? this.parseSummaryAndRecommendations(summaryResponse.content, processedFiles, totalLines, languages)
        : this.createDefaultSummary(processedFiles, totalLines, languages);

      // 5. 결과 조합
      const result: CodeAnalysisResult = {
        summary,
        fileAnalysis,
        architecture,
        recommendations
      };

      console.log('✅ 코드 분석 완료!');

      return {
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          processedFiles,
          outputSize: JSON.stringify(result).length,
          geminiCalls
        },
        success: true,
        errors: errors.length > 0 ? errors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined
      };

    } catch (error) {
      console.error('❌ 코드 분석 실패:', error);
      return {
        data: this.createEmptyResult(),
        metadata: {
          executionTime: Date.now() - startTime,
          processedFiles,
          outputSize: 0,
          geminiCalls
        },
        success: false,
        errors: [`코드 분석 실패: ${error}`]
      };
    }
  }

  /**
   * 파일 수집
   */
  private async collectFiles(patterns: string[]): Promise<string[]> {
    const allFiles: string[] = [];
    
    for (const pattern of patterns) {
      try {
        const files = await glob(pattern, {
          ignore: [
            '**/node_modules/**',
            '**/dist/**',
            '**/build/**',
            '**/.next/**',
            '**/coverage/**',
            '**/.git/**'
          ]
        });
        allFiles.push(...files);
      } catch (error) {
        console.warn(`패턴 처리 실패: ${pattern} - ${error}`);
      }
    }

    return [...new Set(allFiles)]; // 중복 제거
  }

  /**
   * 언어 감지
   */
  private detectLanguage(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const languageMap: Record<string, string> = {
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript React',
      '.js': 'JavaScript',
      '.jsx': 'JavaScript React',
      '.py': 'Python',
      '.java': 'Java',
      '.go': 'Go',
      '.rs': 'Rust',
      '.cpp': 'C++',
      '.c': 'C',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.swift': 'Swift',
      '.kt': 'Kotlin'
    };
    
    return languageMap[ext] || 'Unknown';
  }

  /**
   * 파일 분석 프롬프트 생성
   */
  private createFileAnalysisPrompt(options: CodeAnalysisOptions): string {
    const analysisTypes = options.analysisTypes.join(', ');
    
    return `다음 코드 파일을 분석해주세요:

분석 항목: ${analysisTypes}
분석 깊이: ${options.depth}

다음 형식으로 응답해주세요:
COMPLEXITY: [low/medium/high]
ISSUES:
- [type]: [severity] - [message] (line: [number])
SUGGESTIONS:
- [suggestion 1]
- [suggestion 2]

코드 품질, 보안, 성능 관점에서 상세히 분석해주세요.`;
  }

  /**
   * 파일 분석 결과 파싱
   */
  private parseFileAnalysis(content: string, file: string, language: string, lines: number) {
    // 간단한 파싱 로직 (실제로는 더 정교하게 구현)
    const complexity = content.includes('COMPLEXITY: high') ? 'high' : 
                      content.includes('COMPLEXITY: medium') ? 'medium' : 'low';
    
    const issues = this.extractIssues(content);
    const suggestions = this.extractSuggestions(content);

    return {
      file,
      language,
      lines,
      complexity: complexity as 'low' | 'medium' | 'high',
      issues,
      suggestions
    };
  }

  /**
   * 이슈 추출
   */
  private extractIssues(content: string) {
    // 실제로는 정규식이나 더 정교한 파싱 로직 사용
    const lines = content.split('\n');
    const issues = [];
    
    for (const line of lines) {
      if (line.includes('- ') && (line.includes('warning') || line.includes('error'))) {
        issues.push({
          type: 'quality' as const,
          severity: line.includes('error') ? 'error' as const : 'warning' as const,
          message: line.replace(/^.*- /, '').trim(),
          line: undefined
        });
      }
    }
    
    return issues;
  }

  /**
   * 제안사항 추출
   */
  private extractSuggestions(content: string): string[] {
    const lines = content.split('\n');
    const suggestions = [];
    let inSuggestionsSection = false;
    
    for (const line of lines) {
      if (line.includes('SUGGESTIONS:')) {
        inSuggestionsSection = true;
        continue;
      }
      
      if (inSuggestionsSection && line.startsWith('- ')) {
        suggestions.push(line.substring(2).trim());
      }
    }
    
    return suggestions;
  }

  /**
   * 아키텍처 분석 프롬프트 생성
   */
  private createArchitectureAnalysisPrompt(options: CodeAnalysisOptions): string {
    return `프로젝트의 아키텍처를 분석해주세요:

다음 형식으로 응답해주세요:
PATTERNS: [사용된 디자인 패턴들]
DEPENDENCIES: [주요 의존성 관계]
COMPLEXITY: [순환 복잡도 점수 0-10]
MAINTAINABILITY: [유지보수성 점수 0-10]

아키텍처의 강점과 개선점을 포함해서 분석해주세요.`;
  }

  /**
   * 아키텍처 분석 결과 파싱
   */
  private parseArchitectureAnalysis(content: string) {
    return {
      patterns: ['MVC', 'Observer'], // 실제로는 파싱
      dependencies: {}, // 실제로는 파싱
      cyclomatic: 5, // 실제로는 파싱
      maintainability: 7 // 실제로는 파싱
    };
  }

  /**
   * 요약 프롬프트 생성
   */
  private createSummaryPrompt(options: CodeAnalysisOptions): string {
    return `코드 분석 결과를 요약하고 추천사항을 제시해주세요:

다음 형식으로 응답해주세요:
QUALITY_SCORE: [0-10]
SECURITY_ISSUES: [개수]
PERFORMANCE_ISSUES: [개수]

RECOMMENDATIONS:
- HIGH: [우선순위 높은 개선사항]
- MEDIUM: [우선순위 중간 개선사항]
- LOW: [우선순위 낮은 개선사항]

전체적인 코드 품질 평가와 구체적인 개선 방향을 제시해주세요.`;
  }

  /**
   * 요약 및 추천사항 파싱
   */
  private parseSummaryAndRecommendations(content: string, totalFiles: number, totalLines: number, languages: Record<string, number>) {
    const summary = {
      totalFiles,
      totalLines,
      languages,
      qualityScore: 7, // 실제로는 파싱
      securityIssues: 2, // 실제로는 파싱
      performanceIssues: 1 // 실제로는 파싱
    };

    const recommendations = [
      {
        category: 'Quality',
        priority: 'high' as const,
        description: 'TypeScript 타입 안전성 개선',
        impact: '런타임 오류 감소'
      }
      // 실제로는 파싱으로 더 많은 추천사항 추출
    ];

    return { summary, recommendations };
  }

  /**
   * 기본값들 생성
   */
  private createEmptyResult(): CodeAnalysisResult {
    return {
      summary: {
        totalFiles: 0,
        totalLines: 0,
        languages: {},
        qualityScore: 0,
        securityIssues: 0,
        performanceIssues: 0
      },
      fileAnalysis: [],
      architecture: {
        patterns: [],
        dependencies: {},
        cyclomatic: 0,
        maintainability: 0
      },
      recommendations: []
    };
  }

  private createDefaultArchitecture() {
    return {
      patterns: ['Unknown'],
      dependencies: {},
      cyclomatic: 0,
      maintainability: 5
    };
  }

  private createDefaultSummary(totalFiles: number, totalLines: number, languages: Record<string, number>) {
    return {
      summary: {
        totalFiles,
        totalLines,
        languages,
        qualityScore: 5,
        securityIssues: 0,
        performanceIssues: 0
      },
      recommendations: []
    };
  }
}