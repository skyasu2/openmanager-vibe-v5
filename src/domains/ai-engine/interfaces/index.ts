/**
 * 🔌 AI Engine Domain Interfaces
 *
 * 의존성 역전 원칙(DIP)을 적용한 인터페이스 정의
 * - 고수준 모듈이 저수준 모듈에 의존하지 않도록 추상화
 * - 테스트 가능성과 확장성 제공
 */

import {
  ConversationItem,
  ThinkingStep,
  SystemLogEntry,
  StreamEvent,
  AIResponse,
  ChatMessage,
  AIEngineStatus,
  AIEngineConfig,
  PredictionResult,
  AnomalyDetection,
  ReportData,
  NotificationSettings,
} from '../types';

// 🧠 AI 엔진 코어 인터페이스
export interface IAIEngineCore {
  /**
   * 자연어 질의 처리
   */
  processQuery(question: string): Promise<AIResponse>;

  /**
   * 스트리밍 응답 처리
   */
  processStreamingQuery(
    question: string,
    onEvent: (event: StreamEvent) => void
  ): Promise<ConversationItem>;

  /**
   * 사고 과정 시뮬레이션
   */
  simulateThinking(
    question: string,
    onStep: (step: ThinkingStep) => void
  ): Promise<ThinkingStep[]>;

  /**
   * 시스템 로그 생성
   */
  generateSystemLogs(question: string): SystemLogEntry[];

  /**
   * 질문 카테고리 결정
   */
  determineCategory(question: string): string;
}

// 📊 데이터 서비스 인터페이스
export interface IAIDataService {
  /**
   * 예측 데이터 조회
   */
  getPredictionData(): Promise<PredictionResult[]>;

  /**
   * 이상 징후 데이터 조회
   */
  getAnomalyData(): Promise<AnomalyDetection[]>;

  /**
   * 보고서 데이터 조회
   */
  getReportData(): Promise<ReportData[]>;

  /**
   * 로그 검색
   */
  searchLogs(query: string, filters?: any): Promise<SystemLogEntry[]>;
}

// 🔧 AI 설정 서비스 인터페이스
export interface IAIConfigService {
  /**
   * AI 엔진 상태 조회
   */
  getEngineStatus(): Promise<AIEngineStatus>;

  /**
   * AI 설정 조회
   */
  getConfig(): Promise<AIEngineConfig>;

  /**
   * AI 설정 업데이트
   */
  updateConfig(config: Partial<AIEngineConfig>): Promise<void>;

  /**
   * 엔진 재시작
   */
  restartEngine(engineId: string): Promise<void>;
}

// 🔔 알림 서비스 인터페이스
export interface INotificationService {
  /**
   * 알림 설정 조회
   */
  getSettings(): Promise<NotificationSettings>;

  /**
   * 알림 설정 업데이트
   */
  updateSettings(settings: Partial<NotificationSettings>): Promise<void>;

  /**
   * 브라우저 알림 권한 요청
   */
  requestPermission(): Promise<NotificationPermission>;

  /**
   * 알림 전송
   */
  sendNotification(
    title: string,
    message: string,
    options?: any
  ): Promise<void>;

  /**
   * 알림 테스트
   */
  testNotification(): Promise<void>;
}

// 💾 저장소 인터페이스
export interface IAIRepository {
  /**
   * 대화 히스토리 저장
   */
  saveConversation(conversation: ConversationItem): Promise<void>;

  /**
   * 대화 히스토리 조회
   */
  getConversations(limit?: number): Promise<ConversationItem[]>;

  /**
   * 대화 삭제
   */
  deleteConversation(id: string): Promise<void>;

  /**
   * 설정 저장
   */
  saveSettings(key: string, value: any): Promise<void>;

  /**
   * 설정 조회
   */
  getSettings(key: string): Promise<any>;
}

// 🎯 AI 엔진 팩토리 인터페이스
export interface IAIEngineFactory {
  /**
   * AI 엔진 생성
   */
  createEngine(type: string): IAIEngineCore;

  /**
   * 사용 가능한 엔진 목록
   */
  getAvailableEngines(): string[];

  /**
   * 기본 엔진 조회
   */
  getDefaultEngine(): IAIEngineCore;
}

// 🔄 이벤트 버스 인터페이스
export interface IAIEventBus {
  /**
   * 이벤트 발행
   */
  emit(event: string, data: any): void;

  /**
   * 이벤트 구독
   */
  on(event: string, handler: (data: any) => void): void;

  /**
   * 이벤트 구독 해제
   */
  off(event: string, handler: (data: any) => void): void;

  /**
   * 모든 구독 해제
   */
  removeAllListeners(event?: string): void;
}

// 🎮 AI 컨트롤러 인터페이스 (Facade Pattern)
export interface IAIController {
  /**
   * 질의 처리
   */
  handleQuery(question: string): Promise<ConversationItem>;

  /**
   * 탭 데이터 로드
   */
  loadTabData(tabId: string): Promise<any>;

  /**
   * 설정 관리
   */
  manageSettings(action: string, data?: any): Promise<any>;

  /**
   * 상태 조회
   */
  getStatus(): Promise<AIEngineStatus>;
}
