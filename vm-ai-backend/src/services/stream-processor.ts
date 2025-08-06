/**
 * 🔄 Real-time Stream Processor
 * 
 * AI 사고 과정을 실시간으로 스트리밍하는 서비스
 * WebSocket을 통해 단계별 처리 과정 전송
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

export interface StreamData {
  sessionId?: string;
  query: string;
  context?: any;
  model?: string;
  streamThoughts?: boolean;  // 사고 과정 스트리밍 여부
  streamChunks?: boolean;    // 텍스트 청크 스트리밍 여부
}

export interface StreamChunk {
  id: string;
  type: 'thought' | 'text' | 'code' | 'error' | 'complete';
  content: string;
  metadata?: {
    step?: number;
    totalSteps?: number;
    confidence?: number;
    reasoning?: string;
    timestamp: number;
  };
}

interface ActiveStream {
  id: string;
  socketId: string;
  sessionId?: string;
  startTime: Date;
  chunks: StreamChunk[];
  status: 'streaming' | 'paused' | 'completed' | 'failed';
  stats: {
    totalChunks: number;
    thoughtChunks: number;
    textChunks: number;
    averageLatency: number;
  };
}

export class StreamProcessor {
  private io: SocketIOServer;
  private activeStreams: Map<string, ActiveStream>;
  private readonly MAX_CHUNKS_PER_STREAM = 1000;
  private readonly CHUNK_DELAY_MS = 50; // 청크 간 지연 시간

  constructor(io: SocketIOServer) {
    this.io = io;
    this.activeStreams = new Map();
    
    // 주기적으로 오래된 스트림 정리
    setInterval(() => this.cleanupStaleStreams(), 5 * 60 * 1000); // 5분마다
  }

  /**
   * 스트리밍 시작
   */
  async startStream(socket: Socket, data: StreamData): Promise<void> {
    const streamId = uuidv4();
    
    // 이미 진행 중인 스트림이 있으면 중단
    this.stopStream(socket.id);
    
    const stream: ActiveStream = {
      id: streamId,
      socketId: socket.id,
      sessionId: data.sessionId,
      startTime: new Date(),
      chunks: [],
      status: 'streaming',
      stats: {
        totalChunks: 0,
        thoughtChunks: 0,
        textChunks: 0,
        averageLatency: 0
      }
    };
    
    this.activeStreams.set(socket.id, stream);
    
    console.log(`🔄 Stream started: ${streamId} for socket ${socket.id}`);
    
    // 스트리밍 시작 알림
    socket.emit('stream:started', {
      streamId,
      sessionId: data.sessionId,
      timestamp: Date.now()
    });
    
    // AI 처리 시뮬레이션 (실제로는 AI 모델 호출)
    await this.processAIStream(socket, stream, data);
  }

  /**
   * AI 스트리밍 처리
   */
  private async processAIStream(
    socket: Socket,
    stream: ActiveStream,
    data: StreamData
  ): Promise<void> {
    try {
      // 1단계: 사고 과정 스트리밍
      if (data.streamThoughts) {
        await this.streamThoughts(socket, stream, data.query);
      }
      
      // 2단계: 응답 생성 스트리밍
      await this.streamResponse(socket, stream, data.query);
      
      // 완료 처리
      stream.status = 'completed';
      this.sendChunk(socket, stream, {
        id: uuidv4(),
        type: 'complete',
        content: '',
        metadata: {
          timestamp: Date.now(),
          totalSteps: stream.chunks.length
        }
      });
      
      console.log(`✅ Stream completed: ${stream.id}`);
      
    } catch (error) {
      stream.status = 'failed';
      this.sendChunk(socket, stream, {
        id: uuidv4(),
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          timestamp: Date.now()
        }
      });
      
      console.error(`❌ Stream failed: ${stream.id}`, error);
    }
  }

  /**
   * 사고 과정 스트리밍
   */
  private async streamThoughts(
    socket: Socket,
    stream: ActiveStream,
    query: string
  ): Promise<void> {
    const thoughts = [
      { step: 1, content: "질문 분석 중...", reasoning: "사용자 의도 파악" },
      { step: 2, content: "관련 데이터 검색 중...", reasoning: "컨텍스트 수집" },
      { step: 3, content: "패턴 분석 중...", reasoning: "유사 사례 확인" },
      { step: 4, content: "최적 솔루션 도출 중...", reasoning: "해결책 생성" },
      { step: 5, content: "응답 구성 중...", reasoning: "최종 답변 준비" }
    ];
    
    for (const thought of thoughts) {
      if (stream.status !== 'streaming') break;
      
      const chunk: StreamChunk = {
        id: uuidv4(),
        type: 'thought',
        content: thought.content,
        metadata: {
          step: thought.step,
          totalSteps: thoughts.length,
          reasoning: thought.reasoning,
          confidence: 0.75 + Math.random() * 0.2,
          timestamp: Date.now()
        }
      };
      
      this.sendChunk(socket, stream, chunk);
      stream.stats.thoughtChunks++;
      
      // 청크 간 지연
      await this.delay(this.CHUNK_DELAY_MS * 2);
    }
  }

  /**
   * 응답 텍스트 스트리밍
   */
  private async streamResponse(
    socket: Socket,
    stream: ActiveStream,
    query: string
  ): Promise<void> {
    // 실제 응답 생성 (여기서는 시뮬레이션)
    const fullResponse = this.generateMockResponse(query);
    
    // 텍스트를 청크로 분할
    const words = fullResponse.split(' ');
    const chunkSize = 3; // 한 번에 보낼 단어 수
    
    for (let i = 0; i < words.length; i += chunkSize) {
      if (stream.status !== 'streaming') break;
      
      const chunkWords = words.slice(i, i + chunkSize);
      const isCode = chunkWords.some(w => w.includes('```'));
      
      const chunk: StreamChunk = {
        id: uuidv4(),
        type: isCode ? 'code' : 'text',
        content: chunkWords.join(' ') + ' ',
        metadata: {
          timestamp: Date.now()
        }
      };
      
      this.sendChunk(socket, stream, chunk);
      stream.stats.textChunks++;
      
      // 청크 간 지연 (타이핑 효과)
      await this.delay(this.CHUNK_DELAY_MS);
    }
  }

  /**
   * 청크 전송
   */
  private sendChunk(socket: Socket, stream: ActiveStream, chunk: StreamChunk): void {
    // 청크 저장
    stream.chunks.push(chunk);
    stream.stats.totalChunks++;
    
    // 최대 청크 수 제한
    if (stream.chunks.length > this.MAX_CHUNKS_PER_STREAM) {
      stream.chunks = stream.chunks.slice(-this.MAX_CHUNKS_PER_STREAM);
    }
    
    // 레이턴시 계산
    const latency = Date.now() - stream.startTime.getTime();
    stream.stats.averageLatency = 
      (stream.stats.averageLatency * (stream.stats.totalChunks - 1) + latency) / 
      stream.stats.totalChunks;
    
    // 소켓으로 전송
    socket.emit('stream:chunk', {
      streamId: stream.id,
      chunk,
      stats: {
        totalChunks: stream.stats.totalChunks,
        latency: Math.round(stream.stats.averageLatency)
      }
    });
    
    // 세션 룸에도 브로드캐스트 (협업 기능)
    if (stream.sessionId) {
      socket.to(`session:${stream.sessionId}`).emit('stream:chunk', {
        streamId: stream.id,
        chunk,
        isShared: true
      });
    }
  }

  /**
   * 스트리밍 중단
   */
  stopStream(socketId: string): void {
    const stream = this.activeStreams.get(socketId);
    if (!stream) return;
    
    stream.status = 'completed';
    
    // 소켓에 중단 알림
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('stream:stopped', {
        streamId: stream.id,
        stats: stream.stats,
        timestamp: Date.now()
      });
    }
    
    // 일정 시간 후 메모리에서 제거
    setTimeout(() => {
      this.activeStreams.delete(socketId);
    }, 60000); // 1분 후 제거
    
    console.log(`⏹️ Stream stopped: ${stream.id}`);
  }

  /**
   * 스트림 일시정지/재개
   */
  togglePause(socketId: string): boolean {
    const stream = this.activeStreams.get(socketId);
    if (!stream) return false;
    
    if (stream.status === 'streaming') {
      stream.status = 'paused';
      console.log(`⏸️ Stream paused: ${stream.id}`);
    } else if (stream.status === 'paused') {
      stream.status = 'streaming';
      console.log(`▶️ Stream resumed: ${stream.id}`);
    }
    
    return true;
  }

  /**
   * 스트림 상태 조회
   */
  getStreamStatus(socketId: string): any {
    const stream = this.activeStreams.get(socketId);
    if (!stream) return null;
    
    return {
      id: stream.id,
      status: stream.status,
      duration: Date.now() - stream.startTime.getTime(),
      stats: stream.stats,
      recentChunks: stream.chunks.slice(-5)
    };
  }

  /**
   * Mock 응답 생성 (실제로는 AI 모델 호출)
   */
  private generateMockResponse(query: string): string {
    const responses: Record<string, string> = {
      default: `안녕하세요! "${query}"에 대한 답변입니다. 
        
        현재 시스템 상태를 분석한 결과:
        - CPU 사용률: 45%
        - 메모리 사용률: 62%
        - 디스크 사용률: 38%
        
        모든 지표가 정상 범위 내에 있습니다. 
        추가로 궁금하신 점이 있으시면 말씀해 주세요.`,
      
      error: `서버 에러에 대한 분석 결과입니다:
        
        \`\`\`javascript
        // 에러 발생 코드
        const result = await fetchData();
        // TypeError: Cannot read property 'data' of undefined
        \`\`\`
        
        해결 방법:
        1. null 체크 추가
        2. try-catch 블록 사용
        3. 옵셔널 체이닝 적용`,
      
      optimization: `성능 최적화 분석 결과:
        
        주요 병목 지점:
        1. 데이터베이스 쿼리 (평균 250ms)
        2. 외부 API 호출 (평균 180ms)
        3. 이미지 처리 (평균 150ms)
        
        권장 최적화:
        - 쿼리 인덱싱
        - API 응답 캐싱
        - 이미지 사전 처리`
    };
    
    // 쿼리에 따른 응답 선택
    if (query.includes('에러') || query.includes('error')) {
      return responses.error;
    } else if (query.includes('최적화') || query.includes('성능')) {
      return responses.optimization;
    }
    
    return responses.default;
  }

  /**
   * 지연 유틸리티
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 오래된 스트림 정리
   */
  private cleanupStaleStreams(): void {
    const now = Date.now();
    const staleThreshold = 30 * 60 * 1000; // 30분
    let cleaned = 0;
    
    this.activeStreams.forEach((stream, socketId) => {
      const age = now - stream.startTime.getTime();
      if (age > staleThreshold && stream.status !== 'streaming') {
        this.activeStreams.delete(socketId);
        cleaned++;
      }
    });
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned ${cleaned} stale streams`);
    }
  }

  /**
   * 통계 정보
   */
  getStats(): any {
    const stats = {
      activeStreams: 0,
      totalChunks: 0,
      averageLatency: 0,
      streamsByStatus: {
        streaming: 0,
        paused: 0,
        completed: 0,
        failed: 0
      }
    };
    
    this.activeStreams.forEach(stream => {
      stats.activeStreams++;
      stats.totalChunks += stream.stats.totalChunks;
      stats.averageLatency += stream.stats.averageLatency;
      stats.streamsByStatus[stream.status]++;
    });
    
    if (stats.activeStreams > 0) {
      stats.averageLatency /= stats.activeStreams;
    }
    
    return stats;
  }
}