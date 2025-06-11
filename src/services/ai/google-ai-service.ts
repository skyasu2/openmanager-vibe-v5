/**
 * 🤖 Google AI Service Export Wrapper
 * 
 * GoogleAIService.ts의 export wrapper
 * UnifiedAIEngine에서 import하기 위한 경로 매핑
 */

import { GoogleAIService } from './GoogleAIService';
import { isGoogleAIAvailable } from '@/lib/google-ai-manager';

// Re-export 
export { GoogleAIService, isGoogleAIAvailable };

// 기본 export
export default GoogleAIService; 