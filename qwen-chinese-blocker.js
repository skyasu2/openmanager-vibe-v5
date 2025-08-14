/**
 * 🤖 Qwen 모델용 중국어 차단 미들웨어
 * 
 * Qwen 모델 사용 시 중국어 입력/출력을 차단하는 시스템
 */

const ChineseDetectionSystem = require('./chinese-detection-system');

class QwenChineseBlocker {
  constructor(options = {}) {
    this.detector = new ChineseDetectionSystem();
    this.options = {
      blockInput: true,
      blockOutput: true,
      strictMode: false,
      logBlocked: true,
      ...options
    };
    
    this.blockedCount = 0;
    this.totalRequests = 0;
  }

  /**
   * 입력 텍스트 검증 및 차단
   */
  validateInput(input) {
    this.totalRequests++;
    
    if (!this.options.blockInput) {
      return { valid: true, input: input };
    }

    const detection = this.detector.isChineseText(input);
    
    if (detection.isChinese) {
      this.blockedCount++;
      
      if (this.options.logBlocked) {
        console.log(`🚫 [BLOCKED INPUT] Chinese detected (${detection.confidence}%): ${input.substring(0, 50)}...`);
      }

      return {
        valid: false,
        blocked: true,
        reason: "Chinese input blocked",
        confidence: detection.confidence,
        originalInput: input,
        message: "죄송합니다. 중국어 입력은 허용되지 않습니다. 한국어나 영어로 다시 입력해주세요."
      };
    }

    return { valid: true, input: input };
  }

  /**
   * Qwen 모델 출력 검증 및 차단
   */
  validateOutput(output) {
    if (!this.options.blockOutput) {
      return { valid: true, output: output };
    }

    const detection = this.detector.isChineseText(output);
    
    if (detection.isChinese) {
      this.blockedCount++;
      
      if (this.options.logBlocked) {
        console.log(`🚫 [BLOCKED OUTPUT] Chinese detected in Qwen response (${detection.confidence}%)`);
      }

      return {
        valid: false,
        blocked: true,
        reason: "Chinese output blocked",
        confidence: detection.confidence,
        originalOutput: output,
        filteredOutput: "I apologize, but I can only respond in Korean or English. Please ask your question in Korean or English."
      };
    }

    return { valid: true, output: output };
  }

  /**
   * Qwen API 호출 래퍼
   */
  async callQwenWithBlocking(qwenApiCall, input, options = {}) {
    // 입력 검증
    const inputValidation = this.validateInput(input);
    if (!inputValidation.valid) {
      return {
        success: false,
        blocked: true,
        type: 'input',
        message: inputValidation.message,
        details: inputValidation
      };
    }

    try {
      // Qwen API 호출
      const response = await qwenApiCall(input, options);
      
      // 출력 검증
      const outputValidation = this.validateOutput(response);
      if (!outputValidation.valid) {
        return {
          success: false,
          blocked: true,
          type: 'output',
          message: outputValidation.filteredOutput,
          details: outputValidation
        };
      }

      return {
        success: true,
        blocked: false,
        response: response
      };

    } catch (error) {
      console.error('Qwen API 호출 오류:', error);
      return {
        success: false,
        blocked: false,
        error: error.message
      };
    }
  }

  /**
   * 실시간 텍스트 스트림 필터링
   */
  createStreamFilter() {
    let buffer = '';
    
    return {
      filter: (chunk) => {
        buffer += chunk;
        
        // 버퍼가 충분히 쌓이면 검사
        if (buffer.length > 50) {
          const detection = this.detector.isChineseText(buffer);
          
          if (detection.isChinese) {
            if (this.options.logBlocked) {
              console.log(`🚫 [STREAM BLOCKED] Chinese detected in stream`);
            }
            
            buffer = '';
            return {
              blocked: true,
              reason: 'Chinese content in stream',
              replacement: '[Chinese content blocked]'
            };
          }
        }
        
        return { blocked: false, content: chunk };
      },
      
      flush: () => {
        buffer = '';
      }
    };
  }

  /**
   * 통계 정보
   */
  getStats() {
    return {
      totalRequests: this.totalRequests,
      blockedCount: this.blockedCount,
      blockRate: this.totalRequests > 0 ? (this.blockedCount / this.totalRequests * 100).toFixed(2) + '%' : '0%',
      options: this.options
    };
  }

  /**
   * 설정 업데이트
   */
  updateOptions(newOptions) {
    this.options = { ...this.options, ...newOptions };
  }

  /**
   * 차단 로그 리셋
   */
  resetStats() {
    this.blockedCount = 0;
    this.totalRequests = 0;
  }
}

// Express 미들웨어로 사용
function createQwenBlockingMiddleware(options = {}) {
  const blocker = new QwenChineseBlocker(options);
  
  return (req, res, next) => {
    // 요청 본문에서 텍스트 추출
    const inputText = req.body?.message || req.body?.prompt || req.body?.text || '';
    
    const validation = blocker.validateInput(inputText);
    
    if (!validation.valid) {
      return res.status(400).json({
        error: 'Chinese content blocked',
        message: validation.message,
        blocked: true,
        details: validation
      });
    }
    
    // 응답 후킹
    const originalSend = res.send;
    res.send = function(data) {
      if (typeof data === 'string') {
        const outputValidation = blocker.validateOutput(data);
        if (!outputValidation.valid) {
          data = JSON.stringify({
            error: 'Chinese content blocked in response',
            message: outputValidation.filteredOutput,
            blocked: true
          });
        }
      }
      
      originalSend.call(this, data);
    };
    
    req.chineseBlocker = blocker;
    next();
  };
}

module.exports = {
  QwenChineseBlocker,
  createQwenBlockingMiddleware
};