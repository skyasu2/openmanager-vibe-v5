/**
 * 🚀 VM AI Backend Server
 * 
 * AI 어시스턴트의 고급 기능을 담당하는 VM 전용 백엔드
 * - 세션 관리
 * - 딥 분석
 * - 실시간 스트리밍
 * - 피드백 학습
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';

// 라우터 임포트
import { sessionRouter } from './routes/session';
import { deepAnalysisRouter } from './routes/deep-analysis';
import { feedbackRouter } from './routes/feedback';
import { healthRouter } from './routes/health';

// 서비스 임포트
import { SessionManager } from './services/session-manager';
import { DeepAnalyzer } from './services/deep-analyzer';
import { StreamProcessor } from './services/stream-processor';
import { FeedbackLearner } from './services/feedback-learner';
import { MemoryCache } from './services/memory-cache';

// 환경변수 로드
dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// 전역 서비스 인스턴스
export const sessionManager = new SessionManager();
export const deepAnalyzer = new DeepAnalyzer();
export const streamProcessor = new StreamProcessor(io);
export const feedbackLearner = new FeedbackLearner();
export const memoryCache = new MemoryCache();

// 미들웨어 설정
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API 라우트
app.use('/api/health', healthRouter);
app.use('/api/ai/session', sessionRouter);
app.use('/api/ai/deep-analysis', deepAnalysisRouter);
app.use('/api/ai/feedback', feedbackRouter);

// WebSocket 연결 처리
io.on('connection', (socket) => {
  console.log('🔌 Client connected:', socket.id);
  
  // AI 스트리밍 요청
  socket.on('ai:stream:start', async (data) => {
    await streamProcessor.startStream(socket, data);
  });
  
  // 스트리밍 중단
  socket.on('ai:stream:stop', () => {
    streamProcessor.stopStream(socket.id);
  });
  
  // 세션 구독
  socket.on('session:subscribe', (sessionId: string) => {
    socket.join(`session:${sessionId}`);
    console.log(`Socket ${socket.id} joined session ${sessionId}`);
  });
  
  // 연결 해제
  socket.on('disconnect', () => {
    console.log('🔌 Client disconnected:', socket.id);
    streamProcessor.stopStream(socket.id);
  });
});

// 에러 핸들러
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404 핸들러
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// 서버 시작
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     🚀 VM AI Backend Server Started Successfully! 🚀        ║
║                                                              ║
║     Port: ${PORT}                                           ║
║     Host: ${HOST}                                           ║
║     Environment: ${process.env.NODE_ENV || 'development'}   ║
║                                                              ║
║     Features:                                                ║
║     ✅ Session Management                                   ║
║     ✅ Deep Analysis Engine                                 ║
║     ✅ Real-time Streaming                                  ║
║     ✅ Feedback Learning                                    ║
║                                                              ║
║     WebSocket: ws://${HOST}:${PORT}                         ║
║     API Base: http://${HOST}:${PORT}/api                    ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
  
  // 시스템 상태 모니터링 시작
  startMonitoring();
});

// 시스템 모니터링
function startMonitoring() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    const memoryUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    
    if (memoryUsageMB > 800) {
      console.warn(`⚠️ High memory usage: ${memoryUsageMB}MB`);
      // 메모리 정리 로직
      memoryCache.cleanup();
      global.gc && global.gc();
    }
  }, 60000); // 1분마다 체크
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;