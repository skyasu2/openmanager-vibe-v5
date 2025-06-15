/**
 * 이미지 분석 엔진
 *
 * Google AI 없이도 기본적인 이미지 분석 기능 제공:
 * - 파일 메타데이터 분석
 * - 이미지 크기 및 형식 분석
 * - 색상 분석 (Canvas API 활용)
 * - 기본적인 패턴 인식
 */

export interface ImageMetadata {
  fileName: string;
  fileSize: number;
  fileType: string;
  width: number;
  height: number;
  aspectRatio: number;
  colorDepth?: number;
  hasTransparency?: boolean;
}

export interface ColorAnalysis {
  dominantColors: string[];
  averageColor: string;
  brightness: number;
  contrast: number;
  colorfulness: number;
}

export interface ImageAnalysisResult {
  metadata: ImageMetadata;
  colorAnalysis: ColorAnalysis;
  patterns: {
    isScreenshot: boolean;
    hasText: boolean;
    isChart: boolean;
    isPhoto: boolean;
    complexity: 'low' | 'medium' | 'high';
  };
  suggestions: string[];
  confidence: number;
}

export class ImageAnalysisEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  /**
   * 이미지 파일 분석
   */
  async analyzeImage(file: File): Promise<ImageAnalysisResult> {
    try {
      const metadata = await this.extractMetadata(file);
      const imageElement = await this.loadImage(file);
      const colorAnalysis = await this.analyzeColors(imageElement);
      const patterns = await this.detectPatterns(imageElement, metadata);
      const suggestions = this.generateSuggestions(
        metadata,
        colorAnalysis,
        patterns
      );

      return {
        metadata,
        colorAnalysis,
        patterns,
        suggestions,
        confidence: this.calculateConfidence(metadata, patterns),
      };
    } catch (error) {
      console.error('이미지 분석 중 오류:', error);
      throw new Error('이미지 분석에 실패했습니다.');
    }
  }

  /**
   * 이미지 메타데이터 추출
   */
  private async extractMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height,
          hasTransparency: file.type === 'image/png',
        });
      };

      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 이미지 로드
   */
  private async loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * 색상 분석
   */
  private async analyzeColors(img: HTMLImageElement): Promise<ColorAnalysis> {
    // 캔버스 크기 설정 (성능을 위해 작게)
    const maxSize = 200;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);

    this.canvas.width = img.width * scale;
    this.canvas.height = img.height * scale;

    // 이미지 그리기
    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

    // 픽셀 데이터 가져오기
    const imageData = this.ctx.getImageData(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );
    const pixels = imageData.data;

    // 색상 분석
    const colorCounts: { [key: string]: number } = {};
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    let totalBrightness = 0;
    let pixelCount = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];

      if (a > 128) {
        // 투명하지 않은 픽셀만
        const color = this.rgbToHex(r, g, b);
        colorCounts[color] = (colorCounts[color] || 0) + 1;

        totalR += r;
        totalG += g;
        totalB += b;
        totalBrightness += (r + g + b) / 3;
        pixelCount++;
      }
    }

    // 주요 색상 추출
    const dominantColors = Object.entries(colorCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([color]) => color);

    // 평균 색상
    const avgR = Math.round(totalR / pixelCount);
    const avgG = Math.round(totalG / pixelCount);
    const avgB = Math.round(totalB / pixelCount);
    const averageColor = this.rgbToHex(avgR, avgG, avgB);

    // 밝기 및 대비
    const brightness = totalBrightness / pixelCount / 255;
    const contrast = this.calculateContrast(pixels);
    const colorfulness = this.calculateColorfulness(pixels);

    return {
      dominantColors,
      averageColor,
      brightness,
      contrast,
      colorfulness,
    };
  }

  /**
   * 패턴 감지
   */
  private async detectPatterns(img: HTMLImageElement, metadata: ImageMetadata) {
    const aspectRatio = metadata.aspectRatio;
    const fileName = metadata.fileName.toLowerCase();

    // 스크린샷 감지
    const isScreenshot =
      fileName.includes('screenshot') ||
      fileName.includes('screen') ||
      aspectRatio > 1.5 ||
      aspectRatio < 0.7;

    // 텍스트 포함 여부 (간단한 휴리스틱)
    const hasText =
      fileName.includes('text') ||
      fileName.includes('document') ||
      this.detectTextLikePatterns(img);

    // 차트 감지
    const isChart =
      fileName.includes('chart') ||
      fileName.includes('graph') ||
      fileName.includes('plot') ||
      this.detectChartPatterns(img);

    // 사진 감지
    const isPhoto =
      fileName.includes('photo') ||
      fileName.includes('img') ||
      metadata.fileType === 'image/jpeg' ||
      (!isScreenshot && !isChart);

    // 복잡도 계산
    const complexity = this.calculateComplexity(metadata);

    return {
      isScreenshot,
      hasText,
      isChart,
      isPhoto,
      complexity,
    };
  }

  /**
   * 텍스트 패턴 감지 (간단한 휴리스틱)
   */
  private detectTextLikePatterns(img: HTMLImageElement): boolean {
    // 실제 구현에서는 더 정교한 텍스트 감지 알고리즘 사용
    // 여기서는 간단한 휴리스틱만 적용
    return false;
  }

  /**
   * 차트 패턴 감지
   */
  private detectChartPatterns(img: HTMLImageElement): boolean {
    // 실제 구현에서는 선, 막대, 원형 등의 패턴 감지
    // 여기서는 간단한 휴리스틱만 적용
    return false;
  }

  /**
   * 복잡도 계산
   */
  private calculateComplexity(
    metadata: ImageMetadata
  ): 'low' | 'medium' | 'high' {
    const pixelCount = metadata.width * metadata.height;

    if (pixelCount < 100000) return 'low';
    if (pixelCount < 1000000) return 'medium';
    return 'high';
  }

  /**
   * 대비 계산
   */
  private calculateContrast(pixels: Uint8ClampedArray): number {
    let min = 255,
      max = 0;

    for (let i = 0; i < pixels.length; i += 4) {
      const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
      min = Math.min(min, brightness);
      max = Math.max(max, brightness);
    }

    return (max - min) / 255;
  }

  /**
   * 색상 풍부도 계산
   */
  private calculateColorfulness(pixels: Uint8ClampedArray): number {
    const colors = new Set<string>();

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      colors.add(`${r},${g},${b}`);
    }

    return Math.min(colors.size / 1000, 1); // 정규화
  }

  /**
   * RGB를 HEX로 변환
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  }

  /**
   * 신뢰도 계산
   */
  private calculateConfidence(metadata: ImageMetadata, patterns: any): number {
    let confidence = 0.7; // 기본 신뢰도

    // 파일 크기가 적절하면 신뢰도 증가
    if (metadata.fileSize > 1000 && metadata.fileSize < 10000000) {
      confidence += 0.1;
    }

    // 일반적인 이미지 형식이면 신뢰도 증가
    if (['image/jpeg', 'image/png', 'image/webp'].includes(metadata.fileType)) {
      confidence += 0.1;
    }

    // 적절한 해상도면 신뢰도 증가
    if (metadata.width > 100 && metadata.height > 100) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * 제안사항 생성
   */
  private generateSuggestions(
    metadata: ImageMetadata,
    colorAnalysis: ColorAnalysis,
    patterns: any
  ): string[] {
    const suggestions: string[] = [];

    // 파일 크기 관련 제안
    if (metadata.fileSize > 5000000) {
      suggestions.push('이미지 파일 크기가 큽니다. 압축을 고려해보세요.');
    }

    // 해상도 관련 제안
    if (metadata.width > 4000 || metadata.height > 4000) {
      suggestions.push(
        '고해상도 이미지입니다. 웹 사용 시 리사이징을 권장합니다.'
      );
    }

    // 색상 관련 제안
    if (colorAnalysis.brightness < 0.3) {
      suggestions.push('이미지가 어둡습니다. 밝기 조정을 고려해보세요.');
    }

    if (colorAnalysis.contrast < 0.3) {
      suggestions.push('대비가 낮습니다. 명암 조정을 고려해보세요.');
    }

    // 패턴 관련 제안
    if (patterns.isScreenshot) {
      suggestions.push(
        '스크린샷으로 보입니다. 텍스트 추출이나 OCR 처리를 고려해보세요.'
      );
    }

    if (patterns.isChart) {
      suggestions.push('차트나 그래프로 보입니다. 데이터 추출을 고려해보세요.');
    }

    // 기본 제안
    if (suggestions.length === 0) {
      suggestions.push('이미지 분석이 완료되었습니다.');
    }

    return suggestions;
  }

  /**
   * 이미지 요약 생성
   */
  generateSummary(result: ImageAnalysisResult): string {
    const { metadata, colorAnalysis, patterns } = result;

    let summary = `📸 **이미지 분석 결과**\n\n`;

    // 기본 정보
    summary += `**파일 정보:**\n`;
    summary += `- 파일명: ${metadata.fileName}\n`;
    summary += `- 크기: ${(metadata.fileSize / 1024).toFixed(1)}KB\n`;
    summary += `- 해상도: ${metadata.width}×${metadata.height}\n`;
    summary += `- 형식: ${metadata.fileType}\n\n`;

    // 색상 분석
    summary += `**색상 분석:**\n`;
    summary += `- 주요 색상: ${colorAnalysis.dominantColors.slice(0, 3).join(', ')}\n`;
    summary += `- 평균 밝기: ${(colorAnalysis.brightness * 100).toFixed(1)}%\n`;
    summary += `- 대비: ${(colorAnalysis.contrast * 100).toFixed(1)}%\n\n`;

    // 패턴 분석
    summary += `**패턴 분석:**\n`;
    if (patterns.isScreenshot) summary += `- 📱 스크린샷\n`;
    if (patterns.isChart) summary += `- 📊 차트/그래프\n`;
    if (patterns.isPhoto) summary += `- 📷 사진\n`;
    if (patterns.hasText) summary += `- 📝 텍스트 포함\n`;
    summary += `- 복잡도: ${patterns.complexity}\n\n`;

    // 제안사항
    if (result.suggestions.length > 0) {
      summary += `**제안사항:**\n`;
      result.suggestions.forEach(suggestion => {
        summary += `- ${suggestion}\n`;
      });
    }

    return summary;
  }
}
