#!/usr/bin/env tsx

/**
 * 🤝 AI Orchestrator v1.0 - Claude와 Gemini의 지능형 협업 도구
 * 
 * 주요 기능:
 * - 단계적 문제 분석 및 해결
 * - 컨텍스트 보존 및 누적
 * - 다각도 분석 (기술, 사용자, 비즈니스, 보안)
 * - 자동 리포트 생성
 * 
 * @author Claude Code
 * @version 1.0.0
 */

import { SmartGeminiWrapper } from './smart-gemini-wrapper.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 타입 정의
interface AnalysisContext {
  problem: string;
  projectPath?: string;
  additionalContext?: string;
  timestamp: string;
}

interface PerspectiveAnalysis {
  technical: string;
  user: string;
  business: string;
  security: string;
}

interface SolutionStep {
  step: number;
  description: string;
  implementation: string;
  risks?: string[];
  alternatives?: string[];
}

interface OrchestratorResult {
  context: AnalysisContext;
  claudeAnalysis: string;
  geminiPerspectives: PerspectiveAnalysis;
  synthesizedSolution: {
    summary: string;
    steps: SolutionStep[];
    estimatedTime?: string;
    dependencies?: string[];
  };
  recommendations: string[];
  reportPath?: string;
  timestamp: string;
}

/**
 * AI Orchestrator 클래스
 */
export class AIOrchestrator {
  private gemini: SmartGeminiWrapper;
  private reportDir: string;
  private debug: boolean;

  constructor(options: {
    debug?: boolean;
    reportDir?: string;
  } = {}) {
    this.debug = options.debug || process.env.AI_DEBUG === 'true';
    this.reportDir = options.reportDir || join(__dirname, '..', 'reports', 'ai-analysis');
    this.gemini = new SmartGeminiWrapper({ debug: this.debug });
    
    this.ensureReportDir();
  }

  /**
   * 리포트 디렉토리 생성
   */
  private async ensureReportDir(): Promise<void> {
    try {
      await fs.mkdir(this.reportDir, { recursive: true });
    } catch (error) {
      if (this.debug) {
        console.error('[Orchestrator] 리포트 디렉토리 생성 실패:', error);
      }
    }
  }

  /**
   * Claude 분석 시뮬레이션 (실제로는 Claude API 호출)
   * 현재는 프롬프트만 생성하여 반환
   */
  private async getClaudeAnalysis(context: AnalysisContext): Promise<string> {
    // 실제 구현에서는 Claude API를 호출하거나
    // 현재 Claude Code 세션의 분석을 받아옴
    const prompt = `
문제 상황을 분석하고 해결 방안을 제시해주세요:

문제: ${context.problem}
${context.projectPath ? `프로젝트 경로: ${context.projectPath}` : ''}
${context.additionalContext ? `추가 컨텍스트: ${context.additionalContext}` : ''}

다음 관점에서 분석해주세요:
1. 문제의 근본 원인
2. 현재 상황과 제약사항
3. 가능한 해결 방안들
4. 권장 접근 방법
    `;

    // 여기서는 프롬프트를 반환하지만, 실제로는 Claude의 응답을 받아야 함
    return `[Claude 분석 프롬프트]\n${prompt}`;
  }

  /**
   * 다각도 분석 수행
   */
  private async performMultiPerspectiveAnalysis(
    problem: string,
    claudeAnalysis: string
  ): Promise<PerspectiveAnalysis> {
    const perspectives = {
      technical: '',
      user: '',
      business: '',
      security: ''
    };

    // 기술적 관점
    const technicalPrompt = `
다음 문제를 기술적 관점에서 분석해주세요:

문제: ${problem}

Claude 초기 분석:
${claudeAnalysis}

고려사항:
- 코드 품질과 아키텍처
- 성능과 확장성
- 기술 부채와 유지보수성
- 사용할 기술 스택과 도구

구체적이고 실행 가능한 기술적 해결책을 제시해주세요.
    `;

    const technicalResult = await this.gemini.execute(technicalPrompt);
    perspectives.technical = technicalResult.output || '분석 실패';

    // 사용자 관점
    const userPrompt = `
다음 문제를 사용자 경험 관점에서 분석해주세요:

문제: ${problem}

고려사항:
- 사용성과 접근성
- 사용자 워크플로우 영향
- 학습 곡선
- 사용자 피드백 수집 방법

사용자 중심의 해결 방안을 제시해주세요.
    `;

    const userResult = await this.gemini.execute(userPrompt, { preferredModel: 'flash' });
    perspectives.user = userResult.output || '분석 실패';

    // 비즈니스 관점
    const businessPrompt = `
다음 문제를 비즈니스 관점에서 분석해주세요:

문제: ${problem}

고려사항:
- 비용과 리소스
- 개발 시간과 우선순위
- ROI와 비즈니스 가치
- 리스크와 기회

비즈니스 영향을 고려한 해결책을 제시해주세요.
    `;

    const businessResult = await this.gemini.execute(businessPrompt, { preferredModel: 'flash' });
    perspectives.business = businessResult.output || '분석 실패';

    // 보안 관점
    const securityPrompt = `
다음 문제를 보안 관점에서 분석해주세요:

문제: ${problem}

고려사항:
- 잠재적 보안 취약점
- 데이터 보호와 프라이버시
- 인증과 권한 관리
- 보안 모범 사례

보안을 강화하는 해결 방안을 제시해주세요.
    `;

    const securityResult = await this.gemini.execute(securityPrompt, { preferredModel: 'flash' });
    perspectives.security = securityResult.output || '분석 실패';

    return perspectives;
  }

  /**
   * 솔루션 통합 및 단계별 계획 수립
   */
  private async synthesizeSolution(
    problem: string,
    claudeAnalysis: string,
    perspectives: PerspectiveAnalysis
  ): Promise<{
    summary: string;
    steps: SolutionStep[];
    estimatedTime?: string;
    dependencies?: string[];
  }> {
    const synthesisPrompt = `
다음 분석들을 종합하여 실행 가능한 단계별 해결 방안을 제시해주세요:

문제: ${problem}

Claude 초기 분석:
${claudeAnalysis}

다각도 분석 결과:
- 기술적 관점: ${perspectives.technical.substring(0, 200)}...
- 사용자 관점: ${perspectives.user.substring(0, 200)}...
- 비즈니스 관점: ${perspectives.business.substring(0, 200)}...
- 보안 관점: ${perspectives.security.substring(0, 200)}...

다음 형식으로 구조화된 해결 방안을 제시해주세요:
1. 전체 요약 (2-3문장)
2. 단계별 실행 계획 (각 단계마다 구체적인 구현 방법 포함)
3. 예상 소요 시간
4. 필요한 의존성이나 도구
5. 각 단계의 잠재적 리스크와 대안

JSON 형식으로 응답해주세요.
    `;

    const synthesisResult = await this.gemini.execute(synthesisPrompt);
    
    // 여기서는 간단한 파싱을 시도
    try {
      const output = synthesisResult.output || '';
      // JSON 추출 시도 (실제로는 더 정교한 파싱 필요)
      const jsonMatch = output.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (error) {
      if (this.debug) {
        console.error('[Orchestrator] 솔루션 파싱 실패:', error);
      }
    }

    // 파싱 실패시 기본 구조 반환
    return {
      summary: '종합 분석 결과를 바탕으로 한 해결 방안',
      steps: [
        {
          step: 1,
          description: '문제 분석 및 요구사항 정의',
          implementation: '상세 분석 수행'
        },
        {
          step: 2,
          description: '솔루션 구현',
          implementation: '단계별 구현'
        },
        {
          step: 3,
          description: '테스트 및 검증',
          implementation: '품질 보증'
        }
      ]
    };
  }

  /**
   * 권장사항 생성
   */
  private async generateRecommendations(
    solution: any,
    perspectives: PerspectiveAnalysis
  ): Promise<string[]> {
    const recommendPrompt = `
다음 솔루션과 분석을 바탕으로 5-7개의 구체적인 권장사항을 제시해주세요:

솔루션 요약: ${solution.summary}

각 권장사항은 다음을 포함해야 합니다:
- 구체적인 행동 지침
- 우선순위
- 예상 효과

권장사항을 우선순위 순으로 나열해주세요.
    `;

    const recommendResult = await this.gemini.execute(recommendPrompt, { 
      preferredModel: 'flash' 
    });

    // 간단한 라인 파싱
    const recommendations = (recommendResult.output || '')
      .split('\n')
      .filter(line => line.trim().match(/^\d+\.|^-|^•/))
      .map(line => line.replace(/^\d+\.|^-|^•/, '').trim())
      .filter(line => line.length > 0);

    return recommendations.length > 0 
      ? recommendations 
      : ['문제 해결을 위한 단계적 접근', '지속적인 모니터링 및 개선'];
  }

  /**
   * 리포트 생성 및 저장
   */
  private async generateReport(result: OrchestratorResult): Promise<string> {
    const timestamp = new Date().toISOString();
    const fileName = `analysis_${timestamp.replace(/[:.]/g, '-')}.md`;
    const filePath = join(this.reportDir, fileName);

    const report = `# 🔧 AI 협업 분석 리포트

**생성일:** ${timestamp}
**문제:** ${result.context.problem}
${result.context.projectPath ? `**프로젝트:** ${result.context.projectPath}` : ''}

## 📋 목차
1. [문제 개요](#문제-개요)
2. [Claude 초기 분석](#claude-초기-분석)
3. [다각도 분석](#다각도-분석)
4. [통합 솔루션](#통합-솔루션)
5. [권장사항](#권장사항)

---

## 문제 개요

${result.context.problem}

${result.context.additionalContext ? `### 추가 컨텍스트\n${result.context.additionalContext}` : ''}

## Claude 초기 분석

${result.claudeAnalysis}

## 다각도 분석

### 🔧 기술적 관점
${result.geminiPerspectives.technical}

### 👥 사용자 관점
${result.geminiPerspectives.user}

### 💼 비즈니스 관점
${result.geminiPerspectives.business}

### 🔒 보안 관점
${result.geminiPerspectives.security}

## 통합 솔루션

### 요약
${result.synthesizedSolution.summary}

### 단계별 실행 계획

${result.synthesizedSolution.steps.map(step => `
#### ${step.step}단계: ${step.description}

**구현 방법:**
${step.implementation}

${step.risks ? `**잠재적 리스크:**\n${step.risks.map(r => `- ${r}`).join('\n')}` : ''}

${step.alternatives ? `**대안:**\n${step.alternatives.map(a => `- ${a}`).join('\n')}` : ''}
`).join('\n')}

${result.synthesizedSolution.estimatedTime ? `### 예상 소요 시간\n${result.synthesizedSolution.estimatedTime}` : ''}

${result.synthesizedSolution.dependencies ? `### 필요한 의존성\n${result.synthesizedSolution.dependencies.map(d => `- ${d}`).join('\n')}` : ''}

## 권장사항

${result.recommendations.map((rec, idx) => `${idx + 1}. ${rec}`).join('\n')}

---

*이 리포트는 Claude와 Gemini의 협업 분석으로 생성되었습니다.*
`;

    await fs.writeFile(filePath, report);
    return filePath;
  }

  /**
   * 메인 orchestration 메서드
   */
  async orchestrate(options: {
    problem: string;
    projectPath?: string;
    additionalContext?: string;
    claudeAnalysis?: string;
    saveReport?: boolean;
  }): Promise<OrchestratorResult> {
    console.log('🎯 AI Orchestrator 시작...\n');

    const context: AnalysisContext = {
      problem: options.problem,
      projectPath: options.projectPath,
      additionalContext: options.additionalContext,
      timestamp: new Date().toISOString()
    };

    // 1단계: Claude 분석 (제공되지 않았다면 프롬프트 생성)
    console.log('📝 1단계: 초기 분석...');
    const claudeAnalysis = options.claudeAnalysis || await this.getClaudeAnalysis(context);

    // 2단계: 다각도 분석
    console.log('🔍 2단계: 다각도 분석 수행...');
    const perspectives = await this.performMultiPerspectiveAnalysis(
      options.problem,
      claudeAnalysis
    );

    // 3단계: 솔루션 통합
    console.log('⚡ 3단계: 솔루션 통합...');
    const synthesizedSolution = await this.synthesizeSolution(
      options.problem,
      claudeAnalysis,
      perspectives
    );

    // 4단계: 권장사항 생성
    console.log('💡 4단계: 권장사항 생성...');
    const recommendations = await this.generateRecommendations(
      synthesizedSolution,
      perspectives
    );

    // 결과 구성
    const result: OrchestratorResult = {
      context,
      claudeAnalysis,
      geminiPerspectives: perspectives,
      synthesizedSolution,
      recommendations,
      timestamp: new Date().toISOString()
    };

    // 5단계: 리포트 저장
    if (options.saveReport !== false) {
      console.log('📄 5단계: 리포트 생성...');
      result.reportPath = await this.generateReport(result);
      console.log(`✅ 리포트 저장됨: ${result.reportPath}`);
    }

    return result;
  }

  /**
   * 빠른 문제 해결 (간소화된 버전)
   */
  async quickSolve(problem: string): Promise<string> {
    const result = await this.orchestrate({
      problem,
      saveReport: false
    });

    return `
## 🎯 빠른 해결 방안

**문제:** ${problem}

**해결책:** ${result.synthesizedSolution.summary}

**주요 단계:**
${result.synthesizedSolution.steps.map(s => `${s.step}. ${s.description}`).join('\n')}

**최우선 권장사항:**
- ${result.recommendations[0] || '단계적 접근 권장'}
    `;
  }
}

// CLI 인터페이스
if (import.meta.url === `file://${process.argv[1]}`) {
  const orchestrator = new AIOrchestrator({ debug: true });
  const command = process.argv[2];
  const args = process.argv.slice(3);

  async function runCLI() {
    try {
      switch (command) {
        case 'analyze':
          const problem = args.join(' ');
          if (!problem) {
            console.error('❌ 문제 설명을 입력해주세요');
            process.exit(1);
          }

          const result = await orchestrator.orchestrate({
            problem,
            saveReport: true
          });

          console.log('\n✅ 분석 완료!');
          console.log(`\n📊 통합 솔루션:\n${result.synthesizedSolution.summary}`);
          console.log(`\n📄 상세 리포트: ${result.reportPath}`);
          break;

        case 'quick':
          const quickProblem = args.join(' ');
          if (!quickProblem) {
            console.error('❌ 문제 설명을 입력해주세요');
            process.exit(1);
          }

          const solution = await orchestrator.quickSolve(quickProblem);
          console.log(solution);
          break;

        default:
          console.log(`
🤝 AI Orchestrator v1.0 사용법

기본 명령어:
  tsx tools/ai-orchestrator.ts analyze "문제 설명"    전체 분석 수행
  tsx tools/ai-orchestrator.ts quick "문제 설명"      빠른 해결책 제시

예시:
  tsx tools/ai-orchestrator.ts analyze "사용자 로그인이 간헐적으로 실패함"
  tsx tools/ai-orchestrator.ts quick "TypeScript 컴파일 에러 해결"

특징:
  - Claude와 Gemini의 협업 분석
  - 다각도 관점 (기술, 사용자, 비즈니스, 보안)
  - 단계별 실행 계획 수립
  - 자동 리포트 생성
          `);
      }
    } catch (error) {
      console.error('❌ 오류:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  }

  runCLI();
}

export default AIOrchestrator;