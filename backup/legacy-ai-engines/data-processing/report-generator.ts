/**
 * 📄 자동 보고서 생성기 v3.0
 * 
 * ✅ AI 기반 보고서 자동 생성
 * ✅ Markdown, JSON, HTML 형식 지원
 * ✅ 경영진/기술진/사고대응 템플릿
 * ✅ 차트 및 그래프 포함
 * ✅ 다국어 지원 (한국어/영어)
 * ✅ 예약 보고서 생성
 */

interface ReportData {
  timestamp: string;
  summary: string;
  failure_analysis: any;
  prediction_results: any;
  ai_insights: string[];
  recommendations: string[];
  metrics_data: any;
  charts: any[];
  system_status: any;
  time_range: {
    start: string;
    end: string;
    duration: string;
  };
}

interface ReportConfig {
  format: 'json' | 'markdown' | 'html';
  include_charts: boolean;
  include_raw_data: boolean;
  template: 'executive' | 'technical' | 'incident' | 'daily' | 'weekly';
  language: 'ko' | 'en';
  export_options?: {
    include_timestamps: boolean;
    include_debug_info: boolean;
    compress_data: boolean;
  };
}

interface ReportTemplate {
  sections: string[];
  style: string;
  max_pages: number;
  chart_types: string[];
  detail_level: 'high' | 'medium' | 'low';
}

interface ChartData {
  title: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'scatter';
  data: any[];
  options: any;
  description: string;
}

export class AutoReportGenerator {
  private templates: Map<string, ReportTemplate> = new Map();
  private chartGenerators: Map<string, (data: any) => ChartData> = new Map();
  private initialized = false;

  constructor() {
    this.initializeTemplates();
    this.initializeChartGenerators();
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('📄 자동 보고서 생성기 초기화 중...');
    
    try {
      this.initialized = true;
      console.log('✅ 보고서 생성기 초기화 완료');
      console.log(`📋 템플릿: ${this.templates.size}개`);
      console.log(`📊 차트 생성기: ${this.chartGenerators.size}개`);
      
    } catch (error: any) {
      console.error('❌ 보고서 생성기 초기화 실패:', error);
      this.initialized = true; // 폴백 모드
    }
  }

  private initializeTemplates(): void {
    // 경영진용 보고서 템플릿
    this.templates.set('executive', {
      sections: [
        'executive_summary',
        'key_metrics',
        'risk_assessment', 
        'business_impact',
        'strategic_recommendations'
      ],
      style: 'high_level',
      max_pages: 3,
      chart_types: ['pie', 'bar', 'line'],
      detail_level: 'low'
    });

    // 기술진용 보고서 템플릿
    this.templates.set('technical', {
      sections: [
        'system_overview',
        'detailed_analysis',
        'technical_metrics',
        'performance_analysis',
        'root_cause_analysis',
        'technical_recommendations',
        'appendix'
      ],
      style: 'detailed',
      max_pages: 10,
      chart_types: ['line', 'area', 'scatter', 'bar'],
      detail_level: 'high'
    });

    // 사고 대응 보고서 템플릿
    this.templates.set('incident', {
      sections: [
        'incident_timeline',
        'impact_assessment',
        'root_cause',
        'immediate_actions',
        'preventive_measures',
        'lessons_learned'
      ],
      style: 'incident_focused',
      max_pages: 5,
      chart_types: ['line', 'bar'],
      detail_level: 'medium'
    });

    // 일일 보고서 템플릿
    this.templates.set('daily', {
      sections: [
        'daily_summary',
        'system_health',
        'alerts_summary',
        'performance_highlights',
        'action_items'
      ],
      style: 'concise',
      max_pages: 2,
      chart_types: ['line', 'bar'],
      detail_level: 'medium'
    });

    // 주간 보고서 템플릿
    this.templates.set('weekly', {
      sections: [
        'weekly_overview',
        'trend_analysis',
        'capacity_planning',
        'security_summary',
        'upcoming_maintenance'
      ],
      style: 'comprehensive',
      max_pages: 6,
      chart_types: ['line', 'area', 'bar', 'pie'],
      detail_level: 'medium'
    });
  }

  private initializeChartGenerators(): void {
    // 시계열 차트 생성기
    this.chartGenerators.set('timeseries', (data: any) => ({
      title: data.title || '시계열 분석',
      type: 'line',
      data: data.series || [],
      options: {
        responsive: true,
        scales: {
          x: { type: 'time' },
          y: { beginAtZero: true }
        }
      },
      description: data.description || '시간에 따른 메트릭 변화'
    }));

    // 성능 분포 차트 생성기
    this.chartGenerators.set('performance_distribution', (data: any) => ({
      title: '성능 분포',
      type: 'bar',
      data: data.distribution || [],
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        }
      },
      description: '시스템 성능 메트릭 분포'
    }));

    // 장애 원인 분석 차트
    this.chartGenerators.set('failure_causes', (data: any) => ({
      title: '장애 원인 분석',
      type: 'pie',
      data: data.causes || [],
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'right' }
        }
      },
      description: '장애 발생 원인별 비율'
    }));
  }

  async generateFailureReport(
    data: ReportData, 
    config: ReportConfig = { 
      format: 'markdown', 
      include_charts: true, 
      include_raw_data: false, 
      template: 'technical',
      language: 'ko'
    }
  ): Promise<string> {
    
    await this.initialize();
    
    console.log(`📄 ${config.template} 보고서 생성 시작 (${config.format})`);
    
    const template = this.templates.get(config.template) || this.templates.get('technical')!;
    
    switch (config.format) {
      case 'markdown':
        return this.generateMarkdownReport(data, template, config);
      case 'html':
        return this.generateHTMLReport(data, template, config);
      case 'json':
        return JSON.stringify(this.generateJSONReport(data, template, config), null, 2);
      default:
        throw new Error(`지원하지 않는 형식: ${config.format}`);
    }
  }

  private generateMarkdownReport(data: ReportData, template: ReportTemplate, config: ReportConfig): string {
    const lang = config.language || 'ko';
    let report = '';

    // 헤더
    const title = lang === 'ko' ? '🚨 AI 기반 시스템 분석 보고서' : '🚨 AI-Powered System Analysis Report';
    report += `# ${title}\n\n`;
    report += `**${lang === 'ko' ? '생성 시간' : 'Generated'}**: ${data.timestamp}\n`;
    report += `**${lang === 'ko' ? '보고서 유형' : 'Report Type'}**: ${config.template}\n`;
    report += `**${lang === 'ko' ? '분석 기간' : 'Analysis Period'}**: ${data.time_range?.start} ~ ${data.time_range?.end}\n\n`;

    // 요약 (모든 템플릿에 포함)
    if (template.sections.includes('executive_summary') || template.sections.includes('daily_summary') || template.sections.includes('weekly_overview')) {
      const summaryTitle = lang === 'ko' ? '📋 요약' : '📋 Executive Summary';
      report += `## ${summaryTitle}\n\n`;
      report += `${data.summary}\n\n`;
    }

    // AI 인사이트
    if (data.ai_insights && data.ai_insights.length > 0) {
      const insightsTitle = lang === 'ko' ? '🧠 AI 분석 결과' : '🧠 AI Analysis Results';
      report += `## ${insightsTitle}\n\n`;
      data.ai_insights.forEach((insight, index) => {
        report += `${index + 1}. ${insight}\n`;
      });
      report += '\n';
    }

    // 상세 분석 (기술 보고서)
    if (template.sections.includes('detailed_analysis') && data.failure_analysis) {
      const analysisTitle = lang === 'ko' ? '🔍 상세 분석' : '🔍 Detailed Analysis';
      report += `## ${analysisTitle}\n\n`;
      
      if (data.failure_analysis.anomalies) {
        const anomalyTitle = lang === 'ko' ? '### 이상 탐지 결과' : '### Anomaly Detection Results';
        report += `${anomalyTitle}\n\n`;
        Object.entries(data.failure_analysis.anomalies).forEach(([metric, anomaly]: [string, any]) => {
          const status = anomaly.is_anomaly ? 
            (lang === 'ko' ? '이상 감지' : 'Anomaly Detected') :
            (lang === 'ko' ? '정상' : 'Normal');
          report += `- **${metric}**: ${status} `;
          report += `(${lang === 'ko' ? '점수' : 'Score'}: ${anomaly.anomaly_score?.toFixed(3)})\n`;
        });
        report += '\n';
      }

      if (data.prediction_results) {
        const predictionTitle = lang === 'ko' ? '### 장애 예측' : '### Failure Prediction';
        report += `${predictionTitle}\n\n`;
        Object.entries(data.prediction_results).forEach(([metric, prediction]: [string, any]) => {
          const probability = (prediction.prediction[0] * 100).toFixed(1);
          const failureProb = lang === 'ko' ? '장애 확률' : 'Failure Probability';
          report += `- **${metric}**: ${failureProb} ${probability}%\n`;
        });
        report += '\n';
      }
    }

    // 시스템 상태 (모니터링 관련)
    if (template.sections.includes('system_health') && data.system_status) {
      const systemTitle = lang === 'ko' ? '📊 시스템 상태' : '📊 System Health';
      report += `## ${systemTitle}\n\n`;
      
      if (data.metrics_data) {
        const metricsTitle = lang === 'ko' ? '### 주요 메트릭' : '### Key Metrics';
        report += `${metricsTitle}\n\n`;
        report += `| ${lang === 'ko' ? '메트릭' : 'Metric'} | ${lang === 'ko' ? '현재값' : 'Current'} | ${lang === 'ko' ? '상태' : 'Status'} | ${lang === 'ko' ? '임계값' : 'Threshold'} |\n`;
        report += '|--------|--------|------|--------|\n';
        
        Object.entries(data.metrics_data).forEach(([metric, values]: [string, any]) => {
          if (Array.isArray(values) && values.length > 0) {
            const current = values[values.length - 1];
            const status = this.getMetricStatus(metric, current, lang);
            const threshold = this.getMetricThreshold(metric);
            report += `| ${metric} | ${current.toFixed(2)} | ${status} | ${threshold} |\n`;
          }
        });
        report += '\n';
      }
    }

    // 사고 타임라인 (사고 보고서)
    if (template.sections.includes('incident_timeline') && data.failure_analysis?.timeline) {
      const timelineTitle = lang === 'ko' ? '⏰ 사고 타임라인' : '⏰ Incident Timeline';
      report += `## ${timelineTitle}\n\n`;
      data.failure_analysis.timeline.forEach((event: any) => {
        report += `- **${event.time}**: ${event.description}\n`;
      });
      report += '\n';
    }

    // 권장사항
    if (data.recommendations && data.recommendations.length > 0) {
      const recommendationsTitle = template.sections.includes('strategic_recommendations') ?
        (lang === 'ko' ? '💡 전략적 권장사항' : '💡 Strategic Recommendations') :
        (lang === 'ko' ? '💡 권장사항' : '💡 Recommendations');
      report += `## ${recommendationsTitle}\n\n`;
      data.recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec}\n`;
      });
      report += '\n';
    }

    // 차트 정보
    if (config.include_charts && data.charts && data.charts.length > 0) {
      const chartsTitle = lang === 'ko' ? '📈 차트 및 그래프' : '📈 Charts and Graphs';
      report += `## ${chartsTitle}\n\n`;
      data.charts.forEach((chart, index) => {
        report += `### ${chart.title || `${lang === 'ko' ? '차트' : 'Chart'} ${index + 1}`}\n\n`;
        report += `${lang === 'ko' ? '타입' : 'Type'}: ${chart.type}\n`;
        report += `${lang === 'ko' ? '설명' : 'Description'}: ${chart.description || 'N/A'}\n\n`;
      });
    }

    // 기술적 세부사항 (기술 보고서이고 원시 데이터 포함 옵션인 경우)
    if (config.template === 'technical' && config.include_raw_data && template.sections.includes('appendix')) {
      const appendixTitle = lang === 'ko' ? '🔧 기술적 세부사항' : '🔧 Technical Details';
      report += `## ${appendixTitle}\n\n`;
      const rawDataTitle = lang === 'ko' ? '### 원시 데이터' : '### Raw Data';
      report += `${rawDataTitle}\n\n`;
      report += '```json\n';
      report += JSON.stringify({
        metrics: data.metrics_data,
        analysis: data.failure_analysis,
        predictions: data.prediction_results
      }, null, 2);
      report += '\n```\n\n';
    }

    // 푸터
    report += `---\n\n`;
    const footerText = lang === 'ko' ? 
      '*이 보고서는 OpenManager V5 AI 시스템에 의해 자동 생성되었습니다.*' :
      '*This report was automatically generated by OpenManager V5 AI System.*';
    report += `${footerText}\n`;
    const generatedText = lang === 'ko' ? '생성 시간' : 'Generated at';
    report += `*${generatedText}: ${new Date().toISOString()}*\n`;

    return report;
  }

  private generateHTMLReport(data: ReportData, template: ReportTemplate, config: ReportConfig): string {
    const lang = config.language || 'ko';
    
    const title = lang === 'ko' ? 'AI 기반 시스템 분석 보고서' : 'AI-Powered System Analysis Report';
    
    let html = `
<!DOCTYPE html>
<html lang="${lang}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; line-height: 1.6; }
        .header { border-bottom: 3px solid #007acc; padding-bottom: 20px; margin-bottom: 30px; }
        .section { margin-bottom: 30px; }
        .metric-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .metric-table th, .metric-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        .metric-table th { background-color: #f2f2f2; }
        .status-normal { color: green; }
        .status-warning { color: orange; }
        .status-critical { color: red; }
        .ai-insights { background-color: #f8f9fa; padding: 20px; border-left: 4px solid #007acc; }
        .recommendations { background-color: #fff3cd; padding: 20px; border-left: 4px solid #ffc107; }
        .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 0.9em; color: #666; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🚨 ${title}</h1>
        <p><strong>${lang === 'ko' ? '생성 시간' : 'Generated'}:</strong> ${data.timestamp}</p>
        <p><strong>${lang === 'ko' ? '보고서 유형' : 'Report Type'}:</strong> ${config.template}</p>
    </div>
`;

    // AI 인사이트
    if (data.ai_insights && data.ai_insights.length > 0) {
      const insightsTitle = lang === 'ko' ? '🧠 AI 분석 결과' : '🧠 AI Analysis Results';
      html += `
    <div class="section ai-insights">
        <h2>${insightsTitle}</h2>
        <ul>
`;
      data.ai_insights.forEach(insight => {
        html += `            <li>${insight}</li>\n`;
      });
      html += `        </ul>
    </div>
`;
    }

    // 메트릭 테이블
    if (data.metrics_data) {
      const metricsTitle = lang === 'ko' ? '📊 주요 메트릭' : '📊 Key Metrics';
      html += `
    <div class="section">
        <h2>${metricsTitle}</h2>
        <table class="metric-table">
            <thead>
                <tr>
                    <th>${lang === 'ko' ? '메트릭' : 'Metric'}</th>
                    <th>${lang === 'ko' ? '현재값' : 'Current Value'}</th>
                    <th>${lang === 'ko' ? '상태' : 'Status'}</th>
                    <th>${lang === 'ko' ? '임계값' : 'Threshold'}</th>
                </tr>
            </thead>
            <tbody>
`;
      Object.entries(data.metrics_data).forEach(([metric, values]: [string, any]) => {
        if (Array.isArray(values) && values.length > 0) {
          const current = values[values.length - 1];
          const status = this.getMetricStatus(metric, current, lang);
          const threshold = this.getMetricThreshold(metric);
          const statusClass = this.getStatusClass(metric, current);
          html += `                <tr>
                    <td>${metric}</td>
                    <td>${current.toFixed(2)}</td>
                    <td class="${statusClass}">${status}</td>
                    <td>${threshold}</td>
                </tr>
`;
        }
      });
      html += `            </tbody>
        </table>
    </div>
`;
    }

    // 권장사항
    if (data.recommendations && data.recommendations.length > 0) {
      const recommendationsTitle = lang === 'ko' ? '💡 권장사항' : '💡 Recommendations';
      html += `
    <div class="section recommendations">
        <h2>${recommendationsTitle}</h2>
        <ol>
`;
      data.recommendations.forEach(rec => {
        html += `            <li>${rec}</li>\n`;
      });
      html += `        </ol>
    </div>
`;
    }

    // 푸터
    const footerText = lang === 'ko' ? 
      '이 보고서는 OpenManager V5 AI 시스템에 의해 자동 생성되었습니다.' :
      'This report was automatically generated by OpenManager V5 AI System.';
    html += `
    <div class="footer">
        <p>${footerText}</p>
        <p>${lang === 'ko' ? '생성 시간' : 'Generated at'}: ${new Date().toISOString()}</p>
    </div>
</body>
</html>
`;

    return html;
  }

  private generateJSONReport(data: ReportData, template: ReportTemplate, config: ReportConfig): any {
    return {
      metadata: {
        generated_at: new Date().toISOString(),
        template: config.template,
        format: config.format,
        language: config.language,
        version: '3.0.0',
        generator: 'OpenManager V5 AI Report Generator'
      },
      report: {
        summary: data.summary,
        ai_insights: data.ai_insights,
        failure_analysis: data.failure_analysis,
        prediction_results: data.prediction_results,
        recommendations: data.recommendations,
        system_status: data.system_status,
        time_range: data.time_range,
        metrics: config.include_raw_data ? data.metrics_data : undefined,
        charts: config.include_charts ? data.charts : undefined
      },
      template_info: {
        sections: template.sections,
        style: template.style,
        detail_level: template.detail_level
      }
    };
  }

  private getMetricStatus(metric: string, value: number, lang: 'ko' | 'en' = 'ko'): string {
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 },
      network: { warning: 75, critical: 90 }
    };

    const threshold = thresholds[metric.toLowerCase() as keyof typeof thresholds];
    if (!threshold) return lang === 'ko' ? '정상' : 'Normal';

    if (value >= threshold.critical) {
      return lang === 'ko' ? '🔴 위험' : '🔴 Critical';
    }
    if (value >= threshold.warning) {
      return lang === 'ko' ? '🟡 경고' : '🟡 Warning';
    }
    return lang === 'ko' ? '🟢 정상' : '🟢 Normal';
  }

  private getStatusClass(metric: string, value: number): string {
    const thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 },
      network: { warning: 75, critical: 90 }
    };

    const threshold = thresholds[metric.toLowerCase() as keyof typeof thresholds];
    if (!threshold) return 'status-normal';

    if (value >= threshold.critical) return 'status-critical';
    if (value >= threshold.warning) return 'status-warning';
    return 'status-normal';
  }

  private getMetricThreshold(metric: string): string {
    const thresholds = {
      cpu: '90%',
      memory: '95%',
      disk: '95%',
      network: '90%'
    };

    return thresholds[metric.toLowerCase() as keyof typeof thresholds] || 'N/A';
  }

  // 예약된 보고서 생성
  async generateScheduledReport(
    schedule: 'daily' | 'weekly' | 'monthly',
    language: 'ko' | 'en' = 'ko'
  ): Promise<string> {
    const reportData = await this.collectSystemData(schedule);
    
    const config: ReportConfig = {
      format: 'markdown',
      include_charts: true,
      include_raw_data: false,
      template: schedule === 'daily' ? 'daily' : schedule === 'weekly' ? 'weekly' : 'executive',
      language
    };

    return this.generateFailureReport(reportData, config);
  }

  // 차트 생성
  generateChart(type: string, data: any): ChartData | null {
    const generator = this.chartGenerators.get(type);
    return generator ? generator(data) : null;
  }

  private async collectSystemData(schedule: string): Promise<ReportData> {
    // 실제 구현에서는 메트릭 서비스에서 데이터를 가져옴
    const now = new Date();
    const start = new Date(now.getTime() - (schedule === 'daily' ? 24 : schedule === 'weekly' ? 168 : 720) * 60 * 60 * 1000);
    
    return {
      timestamp: now.toISOString(),
      summary: schedule === 'daily' ? 
        '오늘 시스템 전반적으로 정상 상태를 유지했습니다.' :
        '지난 주 시스템 성능이 양호했습니다.',
      failure_analysis: {},
      prediction_results: {},
      ai_insights: ['전체 시스템 성능이 양호합니다.'],
      recommendations: ['정기적인 모니터링을 계속하세요.'],
      metrics_data: {},
      charts: [],
      system_status: { overall: 'healthy' },
      time_range: {
        start: start.toISOString(),
        end: now.toISOString(),
        duration: schedule
      }
    };
  }

  async getGeneratorInfo(): Promise<any> {
    return {
      initialized: this.initialized,
      templates: Array.from(this.templates.keys()),
      supported_formats: ['markdown', 'html', 'json'],
      supported_languages: ['ko', 'en'],
      chart_generators: Array.from(this.chartGenerators.keys()),
      features: [
        '다중 형식 지원',
        '템플릿 기반 생성',
        '차트 포함',
        '다국어 지원',
        '예약 보고서',
        'AI 인사이트 통합'
      ]
    };
  }
}

// 싱글톤 인스턴스
export const autoReportGenerator = new AutoReportGenerator(); 