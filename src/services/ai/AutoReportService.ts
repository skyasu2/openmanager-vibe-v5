import {
  GoogleAIService,
  GoogleAIResponse,
} from '@/services/ai/GoogleAIService';
import { getAutoReportPrompt } from '@/modules/ai-agent/prompts/auto-report-prompt';
import { AIAnalysisDataset } from '@/types/ai-agent-input-schema';
import { createSafeError } from '@/lib/error-handler';

export class AutoReportService {
  private static instance: AutoReportService;
  private aiService: GoogleAIService;

  private constructor() {
    this.aiService = new GoogleAIService();
  }

  public static getInstance(): AutoReportService {
    if (!AutoReportService.instance) {
      AutoReportService.instance = new AutoReportService();
    }
    return AutoReportService.instance;
  }

  /**
   * 자동 장애 보고서를 생성합니다.
   * @param context AI 분석을 위한 데이터셋 (순수 데이터만 포함)
   * @returns 생성된 마크다운 형식의 보고서
   */
  async generateReport(context: AIAnalysisDataset): Promise<string> {
    try {
      if (!context || (!context.logs?.length && !context.metrics?.length)) {
        throw new Error(
          '보고서 생성을 위한 기본 데이터(로그 또는 메트릭)가 부족합니다.'
        );
      }

      const prompt = getAutoReportPrompt(context);

      const report: GoogleAIResponse =
        await this.aiService.generateContent(prompt);

      if (!report || !report.content) {
        throw new Error('AI 서비스로부터 보고서를 생성하지 못했습니다.');
      }

      return this.sanitizeReport(report.content);
    } catch (error) {
      const safeError = createSafeError(error);
      console.error('❌ 자동 장애 보고서 생성 실패:', safeError.message);
      throw new Error(`장애 보고서 생성 중 오류 발생: ${safeError.message}`);
    }
  }

  /**
   * AI가 생성한 보고서에서 불필요한 부분을 정리합니다.
   * @param report 원본 보고서
   * @returns 정리된 보고서
   */
  private sanitizeReport(report: string): string {
    // 마크다운 코드 블록이 깨끗하게 시작하고 끝나도록 보장
    return report.replace(/```markdown/g, '```').replace(/```\n\n```/g, '```');
  }
}

export const autoReportService = AutoReportService.getInstance();
