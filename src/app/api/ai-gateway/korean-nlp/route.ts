/**
 * 🇰🇷 Korean NLP Gateway
 * GCP enhanced-korean-nlp Function 전용 엔드포인트
 */

import { NextRequest, NextResponse } from 'next/server';

const GCP_FUNCTION_URL = 'https://us-central1-openmanager-free-tier.cloudfunctions.net/enhanced-korean-nlp';

interface KoreanNLPRequest {
  text: string;
  features?: {
    morphology?: boolean;
    sentiment?: boolean;
    entities?: boolean;
    sentence_segmentation?: boolean;
  };
  options?: {
    engine?: 'mecab' | 'kiwi' | 'pororo';
  };
}

interface KoreanNLPResponse {
  success: boolean;
  morphemes?: Array<{
    surface: string;
    pos: string;
    reading: string;
  }>;
  sentiment?: {
    score: number;
    label: 'positive' | 'negative' | 'neutral';
  };
  entities?: Array<{
    text: string;
    label: string;
    start: number;
    end: number;
  }>;
  sentences?: string[];
  processing_time_ms: number;
  source: 'gcp' | 'fallback';
  engine_used?: string;
}

// Fallback 한국어 처리기
class KoreanNLPFallback {
  static processText(text: string, features: any = {}): KoreanNLPResponse {
    const result: KoreanNLPResponse = {
      success: true,
      processing_time_ms: 50,
      source: 'fallback',
      engine_used: 'simple-javascript'
    };

    if (features.morphology !== false) {
      result.morphemes = text.split(/\s+/).map(word => ({
        surface: word,
        pos: 'UNKNOWN',
        reading: word
      }));
    }

    if (features.sentiment !== false) {
      // 간단한 감정 분석
      const positiveWords = ['좋', '훌륭', '멋진', '완벽', '성공'];
      const negativeWords = ['나쁜', '문제', '실패', '에러', '위험'];
      
      const hasPositive = positiveWords.some(word => text.includes(word));
      const hasNegative = negativeWords.some(word => text.includes(word));
      
      let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
      let score = 0;
      
      if (hasPositive && !hasNegative) {
        sentiment = 'positive';
        score = 0.7;
      } else if (hasNegative && !hasPositive) {
        sentiment = 'negative';
        score = -0.7;
      }
      
      result.sentiment = { score, label: sentiment };
    }

    if (features.entities !== false) {
      // 간단한 개체명 인식
      const entities: Array<{text: string, label: string, start: number, end: number}> = [];
      const patterns = [
        { regex: /\d+%/, label: 'PERCENTAGE' },
        { regex: /\d+GB|MB|KB/, label: 'STORAGE' },
        { regex: /CPU|메모리|디스크/, label: 'HARDWARE' },
        { regex: /서버-?\d+/, label: 'SERVER_ID' }
      ];
      
      patterns.forEach(pattern => {
        const matches = text.matchAll(new RegExp(pattern.regex, 'g'));
        for (const match of matches) {
          entities.push({
            text: match[0],
            label: pattern.label,
            start: match.index || 0,
            end: (match.index || 0) + match[0].length
          });
        }
      });
      
      result.entities = entities;
    }

    if (features.sentence_segmentation !== false) {
      result.sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    }

    return result;
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now();
  
  try {
    const body: KoreanNLPRequest = await request.json();
    const { text, features = {}, options = {} } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Text is required',
        processing_time_ms: Date.now() - startTime,
        source: 'gateway'
      }, { status: 400 });
    }

    let result: KoreanNLPResponse;

    try {
      // GCP Function 호출
      const response = await fetch(GCP_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OpenManager-Korean-NLP-Gateway/1.0'
        },
        body: JSON.stringify({
          action: 'analyze',
          data: { text, features, options }
        }),
        signal: AbortSignal.timeout(15000) // 15초 타임아웃
      });

      if (response.ok) {
        const gcpResult = await response.json();
        result = {
          ...gcpResult,
          processing_time_ms: Date.now() - startTime,
          source: 'gcp'
        };
      } else {
        throw new Error(`GCP Function error: ${response.status}`);
      }
    } catch (error) {
      console.warn('Korean NLP GCP Function 실패, fallback 사용:', error);
      
      // Fallback 처리
      result = KoreanNLPFallback.processText(text, features);
      result.processing_time_ms = Date.now() - startTime;
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Korean NLP Gateway 에러:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      processing_time_ms: Date.now() - startTime,
      source: 'gateway'
    }, { status: 500 });
  }
}

export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'healthy',
    endpoint: 'korean-nlp',
    features: ['morphology', 'sentiment', 'entities', 'sentence_segmentation'],
    supported_engines: ['mecab', 'kiwi', 'pororo'],
    fallback_available: true
  });
}

export const runtime = 'edge';