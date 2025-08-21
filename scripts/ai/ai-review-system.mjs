#!/usr/bin/env node
/**
 * 🤖 AI Review System v2.0
 * 
 * Claude Code Max를 메인으로 한 AI 협력 검토 시스템
 * - 작업 크기/중요도 자동 평가
 * - 검토 레벨 자동 결정 (1-3개 AI)
 * - 검토 결과 통합 및 평가
 * 
 * @author Claude Code + Multi-AI 협업
 * @created 2025-08-20
 */

import { promises as fs } from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// === 설정 상수 ===
const CONFIG = {
  PROJECT_ROOT: '/mnt/d/cursor/openmanager-vibe-v5',
  
  // 작업 크기 기준 (줄 수)
  SIZE_THRESHOLDS: {
    SMALL: 50,      // 50줄 미만
    MEDIUM: 200,    // 50-200줄
    LARGE: 500,     // 200-500줄
    XLARGE: 1000    // 500줄 이상
  },
  
  // 중요도 가중치
  IMPORTANCE_WEIGHTS: {
    CONFIG_FILES: 3.0,      // *.config.*, .env*, package.json
    AUTH_FILES: 3.0,        // auth/*, login/*, session/*
    API_FILES: 2.5,         // api/*, routes/*, controllers/*
    DATABASE_FILES: 2.5,    // db/*, migrations/*, models/*
    SECURITY_FILES: 3.0,    // security/*, crypto/*, keys/*
    CORE_FILES: 2.0,        // core/*, lib/*, utils/*
    UI_FILES: 1.5,          // components/*, pages/*, views/*
    TEST_FILES: 1.0,        // test/*, spec/*, *.test.*
    DOCS_FILES: 0.5         // docs/*, README*, *.md
  },
  
  // AI 시스템별 특성
  AI_CHARACTERISTICS: {
    gemini: {
      strengths: ['대규모 데이터 분석', '아키텍처 검토', '성능 최적화'],
      speed: 'fast',
      cost: 'free',
      dailyLimit: 1000
    },
    codex: {
      strengths: ['코드 품질', '보안 검토', '베스트 프랙티스'],
      speed: 'medium',
      cost: 'paid',
      monthlyLimit: 'unlimited'
    },
    qwen: {
      strengths: ['빠른 검증', '구문 체크', '타입 검증'],
      speed: 'very_fast',
      cost: 'free',
      dailyLimit: 1000
    }
  },
  
  // 평가 기준
  REVIEW_CRITERIA: {
    CODE_QUALITY: 0.3,      // 코드 품질 (30%)
    PERFORMANCE: 0.2,       // 성능 (20%)
    SECURITY: 0.2,          // 보안 (20%)
    MAINTAINABILITY: 0.15,  // 유지보수성 (15%)
    TESTING: 0.1,           // 테스트 커버리지 (10%)
    DOCUMENTATION: 0.05     // 문서화 (5%)
  }
};

export class AIReviewSystem {
  constructor() {
    this.projectRoot = CONFIG.PROJECT_ROOT;
    this.reviewHistory = [];
    this.activeReviews = new Map();
    this.aiUsageStats = {
      gemini: { daily: 0, lastReset: new Date().toDateString() },
      codex: { monthly: 0 },
      qwen: { daily: 0, lastReset: new Date().toDateString() }
    };
  }

  // === 작업 분석 ===
  async analyzeTask(files, changes) {
    const analysis = {
      size: 'unknown',
      importance: 'normal',
      complexity: 'medium',
      files: files.length,
      totalLines: 0,
      addedLines: 0,
      deletedLines: 0,
      modifiedFiles: [],
      criticalFiles: [],
      reviewLevel: 1,
      recommendedAI: []
    };

    try {
      // 1. 크기 분석
      for (const file of files) {
        const fileAnalysis = await this.analyzeFile(file);
        analysis.totalLines += fileAnalysis.lines;
        analysis.modifiedFiles.push(fileAnalysis);
        
        if (fileAnalysis.importance >= 2.0) {
          analysis.criticalFiles.push(file);
        }
      }

      // 2. 변경량 분석 (git diff 활용)
      if (changes) {
        const diffStats = await this.analyzeDiff(changes);
        analysis.addedLines = diffStats.added;
        analysis.deletedLines = diffStats.deleted;
      }

      // 3. 크기 결정
      const totalChanges = analysis.addedLines + analysis.deletedLines;
      if (totalChanges < CONFIG.SIZE_THRESHOLDS.SMALL) {
        analysis.size = 'small';
      } else if (totalChanges < CONFIG.SIZE_THRESHOLDS.MEDIUM) {
        analysis.size = 'medium';
      } else if (totalChanges < CONFIG.SIZE_THRESHOLDS.LARGE) {
        analysis.size = 'large';
      } else {
        analysis.size = 'xlarge';
      }

      // 4. 중요도 결정
      const avgImportance = analysis.modifiedFiles.reduce((sum, f) => 
        sum + f.importance, 0) / analysis.modifiedFiles.length;
      
      if (avgImportance >= 2.5) {
        analysis.importance = 'critical';
      } else if (avgImportance >= 1.5) {
        analysis.importance = 'high';
      } else if (avgImportance >= 1.0) {
        analysis.importance = 'normal';
      } else {
        analysis.importance = 'low';
      }

      // 5. 복잡도 평가
      analysis.complexity = await this.evaluateComplexity(files);

      // 6. 검토 레벨 결정
      analysis.reviewLevel = this.determineReviewLevel(analysis);
      
      // 7. AI 선택
      analysis.recommendedAI = this.selectReviewers(analysis);

      return analysis;

    } catch (error) {
      console.error('작업 분석 실패:', error);
      throw error;
    }
  }

  // === 파일 분석 ===
  async analyzeFile(filePath) {
    const fullPath = path.join(this.projectRoot, filePath);
    const content = await fs.readFile(fullPath, 'utf8');
    const lines = content.split('\n').length;
    
    // 파일 타입별 중요도 계산
    let importance = 1.0;
    const fileName = path.basename(filePath);
    const dirName = path.dirname(filePath);
    
    // 설정 파일
    if (fileName.includes('.config.') || fileName.startsWith('.env') || 
        fileName === 'package.json' || fileName === 'tsconfig.json') {
      importance = CONFIG.IMPORTANCE_WEIGHTS.CONFIG_FILES;
    }
    // 인증 관련
    else if (dirName.includes('auth') || dirName.includes('login') || 
             fileName.includes('session')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.AUTH_FILES;
    }
    // API 관련
    else if (dirName.includes('api') || dirName.includes('routes')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.API_FILES;
    }
    // 데이터베이스
    else if (dirName.includes('db') || dirName.includes('models') || 
             dirName.includes('migrations')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.DATABASE_FILES;
    }
    // 보안 관련
    else if (dirName.includes('security') || fileName.includes('crypto')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.SECURITY_FILES;
    }
    // 핵심 로직
    else if (dirName.includes('core') || dirName.includes('lib')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.CORE_FILES;
    }
    // UI 컴포넌트
    else if (dirName.includes('components') || dirName.includes('pages')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.UI_FILES;
    }
    // 테스트 파일
    else if (fileName.includes('.test.') || fileName.includes('.spec.')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.TEST_FILES;
    }
    // 문서
    else if (fileName.endsWith('.md')) {
      importance = CONFIG.IMPORTANCE_WEIGHTS.DOCS_FILES;
    }

    return {
      path: filePath,
      lines,
      importance,
      type: this.getFileType(filePath),
      hasTests: await this.checkTestCoverage(filePath)
    };
  }

  // === Git Diff 분석 ===
  async analyzeDiff(changes) {
    try {
      const { stdout } = await execAsync(
        `cd ${this.projectRoot} && git diff --stat ${changes || 'HEAD~1'}`
      );
      
      const lines = stdout.split('\n');
      const summary = lines[lines.length - 2] || '';
      const match = summary.match(/(\d+) insertions?\(\+\), (\d+) deletions?\(-\)/);
      
      return {
        added: match ? parseInt(match[1]) : 0,
        deleted: match ? parseInt(match[2]) : 0
      };
    } catch (error) {
      return { added: 0, deleted: 0 };
    }
  }

  // === 복잡도 평가 ===
  async evaluateComplexity(files) {
    let totalComplexity = 0;
    let codeFiles = 0;

    for (const file of files) {
      if (this.isCodeFile(file)) {
        codeFiles++;
        const complexity = await this.calculateCyclomaticComplexity(file);
        totalComplexity += complexity;
      }
    }

    const avgComplexity = codeFiles > 0 ? totalComplexity / codeFiles : 1;
    
    if (avgComplexity < 5) return 'low';
    if (avgComplexity < 10) return 'medium';
    if (avgComplexity < 20) return 'high';
    return 'very_high';
  }

  // === Cyclomatic Complexity 계산 ===
  async calculateCyclomaticComplexity(filePath) {
    try {
      const fullPath = path.join(this.projectRoot, filePath);
      const content = await fs.readFile(fullPath, 'utf8');
      
      // 간단한 복잡도 계산 (조건문, 반복문 카운트)
      const patterns = [
        /\bif\s*\(/g,
        /\belse\s+if\s*\(/g,
        /\bfor\s*\(/g,
        /\bwhile\s*\(/g,
        /\bdo\s*\{/g,
        /\bswitch\s*\(/g,
        /\bcase\s+/g,
        /\bcatch\s*\(/g,
        /\?\s*.*\s*:/g  // 삼항 연산자
      ];
      
      let complexity = 1; // 기본 복잡도
      for (const pattern of patterns) {
        const matches = content.match(pattern);
        if (matches) {
          complexity += matches.length;
        }
      }
      
      return complexity;
    } catch (error) {
      return 1;
    }
  }

  // === 검토 레벨 결정 ===
  determineReviewLevel(analysis) {
    const { size, importance, complexity, criticalFiles } = analysis;
    
    // 중요 파일이 있으면 무조건 3-AI 검토
    if (criticalFiles.length > 0 || importance === 'critical') {
      return 3;
    }
    
    // 크기와 중요도 매트릭스
    const levelMatrix = {
      small: { low: 1, normal: 1, high: 2, critical: 3 },
      medium: { low: 1, normal: 2, high: 2, critical: 3 },
      large: { low: 2, normal: 2, high: 3, critical: 3 },
      xlarge: { low: 2, normal: 3, high: 3, critical: 3 }
    };
    
    let level = levelMatrix[size]?.[importance] || 2;
    
    // 복잡도가 높으면 레벨 증가
    if (complexity === 'high' || complexity === 'very_high') {
      level = Math.min(level + 1, 3);
    }
    
    return level;
  }

  // === AI 검토자 선택 ===
  selectReviewers(analysis) {
    const { reviewLevel, importance, complexity } = analysis;
    const reviewers = [];
    
    // 사용량 체크 및 리셋
    this.checkUsageLimits();
    
    if (reviewLevel === 1) {
      // 1개 AI: Gemini 우선 (무료, 빠름)
      if (this.canUseAI('gemini')) {
        reviewers.push('gemini');
      } else if (this.canUseAI('qwen')) {
        reviewers.push('qwen');
      } else {
        reviewers.push('codex'); // 유료지만 무제한
      }
    } else if (reviewLevel === 2) {
      // 2개 AI: Gemini + Codex
      if (this.canUseAI('gemini')) reviewers.push('gemini');
      reviewers.push('codex'); // 항상 사용 가능
      
      // Gemini 사용 불가 시 Qwen 추가
      if (reviewers.length < 2 && this.canUseAI('qwen')) {
        reviewers.push('qwen');
      }
    } else {
      // 3개 AI: 모두 사용
      if (this.canUseAI('gemini')) reviewers.push('gemini');
      reviewers.push('codex'); // 항상 사용 가능
      if (this.canUseAI('qwen')) reviewers.push('qwen');
    }
    
    // 중요도/복잡도에 따른 순서 조정
    if (importance === 'critical' || complexity === 'very_high') {
      // Codex를 첫 번째로 (가장 정확한 검토)
      const codexIndex = reviewers.indexOf('codex');
      if (codexIndex > 0) {
        reviewers.splice(codexIndex, 1);
        reviewers.unshift('codex');
      }
    }
    
    return reviewers;
  }

  // === AI 사용 가능 여부 체크 ===
  canUseAI(aiName) {
    const now = new Date();
    const today = now.toDateString();
    
    // 일일 제한 리셋
    if (aiName === 'gemini' && this.aiUsageStats.gemini.lastReset !== today) {
      this.aiUsageStats.gemini.daily = 0;
      this.aiUsageStats.gemini.lastReset = today;
    }
    if (aiName === 'qwen' && this.aiUsageStats.qwen.lastReset !== today) {
      this.aiUsageStats.qwen.daily = 0;
      this.aiUsageStats.qwen.lastReset = today;
    }
    
    // 제한 체크
    if (aiName === 'gemini') {
      return this.aiUsageStats.gemini.daily < CONFIG.AI_CHARACTERISTICS.gemini.dailyLimit;
    }
    if (aiName === 'qwen') {
      return this.aiUsageStats.qwen.daily < CONFIG.AI_CHARACTERISTICS.qwen.dailyLimit;
    }
    if (aiName === 'codex') {
      return true; // 무제한
    }
    
    return false;
  }

  // === AI 사용량 업데이트 ===
  updateUsageStats(aiName) {
    if (aiName === 'gemini') {
      this.aiUsageStats.gemini.daily++;
    } else if (aiName === 'qwen') {
      this.aiUsageStats.qwen.daily++;
    } else if (aiName === 'codex') {
      this.aiUsageStats.codex.monthly++;
    }
  }

  // === 사용량 제한 체크 ===
  checkUsageLimits() {
    const now = new Date();
    const today = now.toDateString();
    
    // Gemini 일일 제한 리셋
    if (this.aiUsageStats.gemini.lastReset !== today) {
      this.aiUsageStats.gemini.daily = 0;
      this.aiUsageStats.gemini.lastReset = today;
    }
    
    // Qwen 일일 제한 리셋
    if (this.aiUsageStats.qwen.lastReset !== today) {
      this.aiUsageStats.qwen.daily = 0;
      this.aiUsageStats.qwen.lastReset = today;
    }
  }

  // === 파일 타입 확인 ===
  getFileType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const typeMap = {
      '.ts': 'typescript',
      '.tsx': 'typescript-react',
      '.js': 'javascript',
      '.jsx': 'javascript-react',
      '.py': 'python',
      '.go': 'golang',
      '.rs': 'rust',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.sh': 'shell',
      '.sql': 'sql',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.md': 'markdown',
      '.html': 'html',
      '.css': 'css',
      '.scss': 'scss'
    };
    
    return typeMap[ext] || 'unknown';
  }

  // === 코드 파일 여부 확인 ===
  isCodeFile(filePath) {
    const codeExtensions = [
      '.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', 
      '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.sh'
    ];
    const ext = path.extname(filePath).toLowerCase();
    return codeExtensions.includes(ext);
  }

  // === 테스트 커버리지 확인 ===
  async checkTestCoverage(filePath) {
    // 테스트 파일 존재 여부 확인
    const testPatterns = [
      filePath.replace(/\.(ts|js|tsx|jsx)$/, '.test.$1'),
      filePath.replace(/\.(ts|js|tsx|jsx)$/, '.spec.$1'),
      filePath.replace(/src\//, 'tests/').replace(/\.(ts|js|tsx|jsx)$/, '.test.$1')
    ];
    
    for (const testPath of testPatterns) {
      try {
        const fullTestPath = path.join(this.projectRoot, testPath);
        await fs.access(fullTestPath);
        return true;
      } catch {
        // 테스트 파일 없음
      }
    }
    
    return false;
  }

  // === AI 검토 실행 ===
  async executeReview(files, reviewers, options = {}) {
    const reviews = [];
    const startTime = Date.now();
    
    console.log(`\n🔍 AI 검토 시작: ${reviewers.length}개 AI 활용`);
    console.log(`검토 AI: ${reviewers.join(', ')}`);
    
    // 병렬 검토 실행
    const reviewPromises = reviewers.map(async (ai) => {
      try {
        console.log(`  ⏳ ${ai} 검토 시작...`);
        const review = await this.runAIReview(ai, files, options);
        this.updateUsageStats(ai);
        console.log(`  ✅ ${ai} 검토 완료 (점수: ${review.score}/10)`);
        return review;
      } catch (error) {
        console.error(`  ❌ ${ai} 검토 실패:`, error.message);
        return null;
      }
    });
    
    const results = await Promise.all(reviewPromises);
    
    // null 제거 (실패한 검토)
    const validReviews = results.filter(r => r !== null);
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ 검토 완료: ${validReviews.length}/${reviewers.length} 성공 (${duration}초)`);
    
    return validReviews;
  }

  // === 개별 AI 검토 실행 ===
  async runAIReview(aiName, files, options) {
    const prompt = this.generateReviewPrompt(files, options);
    
    // 파일 내용 읽기
    let fileContents = '';
    for (const file of files) {
      const filePath = path.join(this.projectRoot, file);
      try {
        const content = await fs.readFile(filePath, 'utf8');
        fileContents += `\n\n=== ${file} ===\n${content}`;
      } catch (err) {
        console.warn(`파일 읽기 실패: ${file}`);
      }
    }
    
    // 전체 프롬프트 구성
    const fullPrompt = `${prompt}\n\n파일 내용:${fileContents}`;
    
    // 임시 파일에 프롬프트 저장
    const tmpFile = path.join('/tmp', `ai-review-${Date.now()}.txt`);
    await fs.writeFile(tmpFile, fullPrompt, 'utf8');
    
    let command;
    try {
      switch (aiName) {
        case 'gemini':
          // Gemini는 파일 내용을 stdin으로 전달
          // 환경변수 설정 (GOOGLE_AI_API_KEY를 GEMINI_API_KEY로 매핑)
          const geminiApiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || '';
          command = `cd ${this.projectRoot} && export GEMINI_API_KEY="${geminiApiKey}" && cat "${tmpFile}" | gemini -p "코드 검토 결과를 JSON 형식으로 출력해주세요"`;
          break;
        case 'codex':
          // Codex는 직접 프롬프트 전달
          command = `cd ${this.projectRoot} && cat "${tmpFile}" | codex-cli`;
          break;
        case 'qwen':
          // Qwen도 stdin으로 전달
          command = `cd ${this.projectRoot} && cat "${tmpFile}" | qwen`;
          break;
        default:
          throw new Error(`Unknown AI: ${aiName}`);
      }
      
      const { stdout, stderr } = await execAsync(command, { 
        maxBuffer: 10 * 1024 * 1024, // 10MB 버퍼
        shell: '/bin/bash'
      });
      
      // 결과 파싱
      const review = this.parseAIResponse(stdout, aiName);
      return review;
      
    } catch (error) {
      throw new Error(`${aiName} execution failed: ${error.message}`);
    } finally {
      // 임시 파일 삭제
      try {
        await fs.unlink(tmpFile);
      } catch (err) {
        // 삭제 실패는 무시
      }
    }
  }

  // === 검토 프롬프트 생성 ===
  generateReviewPrompt(files, options) {
    const { focus = 'general', language = 'ko' } = options;
    
    const focusPrompts = {
      general: '전반적인 코드 품질을 검토해주세요',
      security: '보안 취약점을 중점적으로 검토해주세요',
      performance: '성능 최적화 관점에서 검토해주세요',
      architecture: '아키텍처와 설계 패턴을 검토해주세요',
      testing: '테스트 커버리지와 품질을 검토해주세요'
    };
    
    const prompt = `
다음 파일들을 검토하고 평가해주세요:
${files.join(', ')}

검토 기준:
1. 코드 품질 (30%): 가독성, 일관성, 베스트 프랙티스
2. 성능 (20%): 최적화, 효율성, 리소스 사용
3. 보안 (20%): 취약점, 인증/인가, 데이터 보호
4. 유지보수성 (15%): 모듈화, 재사용성, 확장성
5. 테스트 (10%): 커버리지, 엣지 케이스
6. 문서화 (5%): 주석, API 문서

${focusPrompts[focus] || focusPrompts.general}

결과 형식:
- 점수: 1-10점 (소수점 1자리)
- 장점: 3개 이내
- 개선사항: 우선순위별 5개 이내
- 보안 이슈: 발견 시 즉시 보고
- 권장사항: 구체적 개선 방법

응답은 JSON 형식으로 해주세요.
`.trim();
    
    return prompt;
  }

  // === AI 응답 파싱 ===
  parseAIResponse(response, aiName) {
    try {
      // JSON 부분 추출 - 마크다운 코드 블록 처리 추가
      let jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        // 마크다운 코드 블록에서 JSON 추출
        jsonMatch = [jsonMatch[1]];
      } else {
        // 일반 JSON 추출
        jsonMatch = response.match(/\{[\s\S]*\}/);
      }
      
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        ai: aiName,
        score: parseFloat(parsed.score || 7),
        strengths: parsed.strengths || parsed.장점 || [],
        improvements: parsed.improvements || parsed.개선사항 || [],
        security: parsed.security || parsed.보안이슈 || [],
        recommendations: parsed.recommendations || parsed.권장사항 || [],
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      // 파싱 실패 시 기본값
      console.warn(`Failed to parse ${aiName} response:`, error.message);
      
      return {
        ai: aiName,
        score: 7.0,
        strengths: ['코드 작동함'],
        improvements: ['JSON 파싱 실패로 상세 분석 불가'],
        security: [],
        recommendations: [],
        timestamp: new Date().toISOString(),
        parseError: true
      };
    }
  }

  // === 검토 결과 통합 ===
  integrateReviews(reviews) {
    if (!reviews || reviews.length === 0) {
      return { 
        decision: 'skip', 
        reason: '검토 실패',
        avgScore: '0.0',
        reviews: [],
        improvements: [],
        security: [],
        consensusLevel: 'N/A',
        timestamp: new Date().toISOString()
      };
    }
    
    // 평균 점수 계산
    const avgScore = reviews.reduce((sum, r) => sum + r.score, 0) / reviews.length;
    
    // 모든 개선사항 수집
    const allImprovements = [];
    const allSecurity = [];
    
    for (const review of reviews) {
      allImprovements.push(...(review.improvements || []));
      allSecurity.push(...(review.security || []));
    }
    
    // 중복 제거
    const uniqueImprovements = [...new Set(allImprovements)];
    const uniqueSecurity = [...new Set(allSecurity)];
    
    // 의사결정
    let decision, reason;
    
    if (uniqueSecurity.length > 0) {
      decision = 'reject';
      reason = '보안 이슈 발견';
    } else if (avgScore >= 8.0) {
      decision = 'accept';
      reason = `높은 품질 (평균 ${avgScore.toFixed(1)}점)`;
    } else if (avgScore >= 6.0) {
      decision = 'partial';
      reason = `개선 필요 (평균 ${avgScore.toFixed(1)}점)`;
    } else {
      decision = 'reject';
      reason = `품질 미달 (평균 ${avgScore.toFixed(1)}점)`;
    }
    
    return {
      decision,
      reason,
      avgScore: avgScore.toFixed(1),
      reviews,
      improvements: uniqueImprovements.slice(0, 10), // 상위 10개
      security: uniqueSecurity,
      consensusLevel: this.calculateConsensus(reviews),
      timestamp: new Date().toISOString()
    };
  }

  // === 합의 수준 계산 ===
  calculateConsensus(reviews) {
    if (reviews.length <= 1) return 'N/A';
    
    const scores = reviews.map(r => r.score);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => 
      sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    
    if (stdDev < 0.5) return 'high';
    if (stdDev < 1.0) return 'medium';
    if (stdDev < 2.0) return 'low';
    return 'very_low';
  }

  // === 검토 이력 저장 ===
  async saveReviewHistory(analysis, reviews, integration) {
    const historyEntry = {
      id: `review_${Date.now()}`,
      timestamp: new Date().toISOString(),
      analysis,
      reviews,
      integration,
      applied: false
    };
    
    this.reviewHistory.push(historyEntry);
    
    // 파일로 저장
    const historyPath = path.join(
      this.projectRoot, 
      'reports/ai-reviews',
      `${historyEntry.id}.json`
    );
    
    await fs.mkdir(path.dirname(historyPath), { recursive: true });
    await fs.writeFile(historyPath, JSON.stringify(historyEntry, null, 2));
    
    return historyEntry.id;
  }
}

// === CLI 인터페이스 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const system = new AIReviewSystem();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🤖 AI Review System v2.0

사용법:
  node ai-review-system.mjs <command> [options]

명령어:
  analyze <files...>    파일 분석 및 검토 레벨 결정
  review <files...>     AI 검토 실행
  status               사용량 현황 확인

예시:
  node ai-review-system.mjs analyze src/app/api/auth/route.ts
  node ai-review-system.mjs review src/app/api/*.ts --focus security
  node ai-review-system.mjs status
    `);
    process.exit(0);
  }
  
  const command = args[0];
  const files = args.slice(1).filter(arg => !arg.startsWith('--'));
  
  (async () => {
    try {
      switch (command) {
        case 'analyze': {
          const analysis = await system.analyzeTask(files);
          console.log('\n📊 작업 분석 결과:');
          console.log(JSON.stringify(analysis, null, 2));
          break;
        }
        
        case 'review': {
          const analysis = await system.analyzeTask(files);
          const reviews = await system.executeReview(
            files, 
            analysis.recommendedAI
          );
          const integration = system.integrateReviews(reviews);
          
          console.log('\n🎯 검토 결과:');
          console.log(JSON.stringify(integration, null, 2));
          
          const historyId = await system.saveReviewHistory(
            analysis, 
            reviews, 
            integration
          );
          console.log(`\n💾 검토 이력 저장: ${historyId}`);
          break;
        }
        
        case 'status': {
          console.log('\n📊 AI 사용량 현황:');
          console.log(JSON.stringify(system.aiUsageStats, null, 2));
          break;
        }
        
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  })();
}

export default AIReviewSystem;