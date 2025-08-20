#!/usr/bin/env node
/**
 * 🔄 AI Collaboration Workflow v2.0
 * 
 * Claude Code 개발 결과 캡처 및 AI 검토 워크플로우 관리
 * - 자동 변경사항 감지
 * - 검토 프로세스 오케스트레이션
 * - 결과 적용 및 피드백
 * 
 * @author Claude Code + Multi-AI 협업
 * @created 2025-08-20
 */

import { promises as fs } from 'fs';
import { exec, spawn } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import chokidar from 'chokidar';
import { EventEmitter } from 'events';
import AIReviewSystem from './ai-review-system.mjs';
import AIReviewReporter from './ai-review-reporter.mjs';

const execAsync = promisify(exec);

// === 설정 상수 ===
const CONFIG = {
  PROJECT_ROOT: '/mnt/d/cursor/openmanager-vibe-v5',
  
  // 모니터링 설정
  WATCH_PATTERNS: [
    'src/**/*.{ts,tsx,js,jsx}',
    'app/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    'utils/**/*.{ts,tsx,js,jsx}',
    'api/**/*.{ts,tsx,js,jsx}'
  ],
  
  IGNORE_PATTERNS: [
    '**/node_modules/**',
    '**/.git/**',
    '**/dist/**',
    '**/build/**',
    '**/.next/**',
    '**/*.test.*',
    '**/*.spec.*'
  ],
  
  // 워크플로우 설정
  WORKFLOW: {
    DEBOUNCE_TIME: 5000,      // 5초 디바운스
    MIN_CHANGES: 10,           // 최소 10줄 변경 시 트리거
    AUTO_REVIEW_THRESHOLD: 50, // 50줄 이상 변경 시 자동 검토
    BATCH_SIZE: 10,            // 한 번에 처리할 파일 수
    REVIEW_TIMEOUT: 300000     // 5분 타임아웃
  },
  
  // 적용 정책
  APPLY_POLICY: {
    AUTO_ACCEPT_SCORE: 8.5,   // 8.5점 이상 자동 수용
    AUTO_REJECT_SCORE: 5.0,   // 5점 미만 자동 거절
    REQUIRE_CONSENSUS: true,   // 다수 AI 합의 필요
    APPLY_IMPROVEMENTS: true,  // 개선사항 자동 적용
    CREATE_BACKUP: true        // 변경 전 백업 생성
  }
};

export class AICollaborationWorkflow extends EventEmitter {
  constructor() {
    super();
    this.reviewSystem = new AIReviewSystem();
    this.reporter = null; // Lazy load
    this.watcher = null;
    this.pendingChanges = new Map();
    this.activeReviews = new Map();
    this.workflowHistory = [];
    this.debounceTimer = null;
    this.isProcessing = false;
    
    this.setupEventHandlers();
  }

  // === 이벤트 핸들러 설정 ===
  setupEventHandlers() {
    this.on('changes-detected', this.handleChangesDetected.bind(this));
    this.on('review-started', this.handleReviewStarted.bind(this));
    this.on('review-completed', this.handleReviewCompleted.bind(this));
    this.on('improvements-applied', this.handleImprovementsApplied.bind(this));
    this.on('error', this.handleError.bind(this));
  }

  // === 워크플로우 시작 ===
  async start(options = {}) {
    const { 
      watch = false, 
      files = null,
      commit = null,
      pr = null,
      autoMode = false 
    } = options;
    
    console.log('🚀 AI Collaboration Workflow 시작');
    console.log(`모드: ${autoMode ? '자동' : '수동'}`);
    
    // Reporter 초기화
    try {
      this.reporter = new AIReviewReporter();
    } catch (error) {
      console.warn('Reporter 초기화 실패, 기본 로깅 사용');
    }
    
    if (watch) {
      // 파일 감시 모드
      await this.startWatching();
    } else if (files) {
      // 특정 파일 검토
      await this.reviewFiles(files);
    } else if (commit) {
      // 커밋 검토
      await this.reviewCommit(commit);
    } else if (pr) {
      // PR 검토
      await this.reviewPullRequest(pr);
    } else {
      console.log('❌ 검토 대상을 지정해주세요');
      return;
    }
  }

  // === 파일 감시 시작 ===
  async startWatching() {
    console.log('👀 파일 변경 감시 시작...');
    
    this.watcher = chokidar.watch(CONFIG.WATCH_PATTERNS, {
      ignored: CONFIG.IGNORE_PATTERNS,
      persistent: true,
      cwd: CONFIG.PROJECT_ROOT,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 2000,
        pollInterval: 100
      }
    });
    
    this.watcher
      .on('change', (path) => this.onFileChanged(path))
      .on('add', (path) => this.onFileAdded(path))
      .on('unlink', (path) => this.onFileDeleted(path))
      .on('error', (error) => this.emit('error', error));
    
    console.log('✅ 파일 감시 활성화됨');
    console.log('감시 패턴:', CONFIG.WATCH_PATTERNS);
  }

  // === 파일 변경 처리 ===
  onFileChanged(filePath) {
    console.log(`📝 파일 변경 감지: ${filePath}`);
    this.pendingChanges.set(filePath, {
      type: 'modified',
      timestamp: Date.now()
    });
    
    this.scheduleBatchReview();
  }

  // === 파일 추가 처리 ===
  onFileAdded(filePath) {
    console.log(`➕ 파일 추가 감지: ${filePath}`);
    this.pendingChanges.set(filePath, {
      type: 'added',
      timestamp: Date.now()
    });
    
    this.scheduleBatchReview();
  }

  // === 파일 삭제 처리 ===
  onFileDeleted(filePath) {
    console.log(`➖ 파일 삭제 감지: ${filePath}`);
    this.pendingChanges.delete(filePath);
  }

  // === 배치 검토 스케줄링 ===
  scheduleBatchReview() {
    // 기존 타이머 취소
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // 새 타이머 설정
    this.debounceTimer = setTimeout(() => {
      this.processPendingChanges();
    }, CONFIG.WORKFLOW.DEBOUNCE_TIME);
  }

  // === 대기 중인 변경사항 처리 ===
  async processPendingChanges() {
    if (this.isProcessing || this.pendingChanges.size === 0) {
      return;
    }
    
    this.isProcessing = true;
    const files = Array.from(this.pendingChanges.keys());
    
    console.log(`\n🔄 ${files.length}개 파일 변경사항 처리 시작`);
    
    try {
      // 변경량 계산
      const changeStats = await this.calculateChangeStats(files);
      
      // 자동 검토 여부 결정
      if (changeStats.totalLines >= CONFIG.WORKFLOW.AUTO_REVIEW_THRESHOLD) {
        console.log(`📊 변경량: ${changeStats.totalLines}줄 → 자동 검토 실행`);
        await this.reviewFiles(files);
      } else if (changeStats.totalLines >= CONFIG.WORKFLOW.MIN_CHANGES) {
        console.log(`📊 변경량: ${changeStats.totalLines}줄 → 선택적 검토`);
        // 사용자에게 검토 여부 확인 (향후 구현)
      } else {
        console.log(`📊 변경량: ${changeStats.totalLines}줄 → 검토 생략`);
      }
      
      // 처리 완료 후 초기화
      this.pendingChanges.clear();
      
    } catch (error) {
      this.emit('error', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // === 변경량 계산 ===
  async calculateChangeStats(files) {
    let totalLines = 0;
    let addedLines = 0;
    let deletedLines = 0;
    
    for (const file of files) {
      try {
        const { stdout } = await execAsync(
          `cd ${CONFIG.PROJECT_ROOT} && git diff HEAD -- ${file} | wc -l`
        );
        const lines = parseInt(stdout.trim()) || 0;
        totalLines += lines;
        
        // 추가/삭제 라인 계산
        const { stdout: diffStat } = await execAsync(
          `cd ${CONFIG.PROJECT_ROOT} && git diff --stat HEAD -- ${file}`
        );
        const match = diffStat.match(/(\d+) insertion.*?(\d+) deletion/);
        if (match) {
          addedLines += parseInt(match[1]) || 0;
          deletedLines += parseInt(match[2]) || 0;
        }
      } catch (error) {
        // Git에 추가되지 않은 새 파일
        const fullPath = path.join(CONFIG.PROJECT_ROOT, file);
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const lines = content.split('\n').length;
          totalLines += lines;
          addedLines += lines;
        } catch (err) {
          // 파일 읽기 실패
        }
      }
    }
    
    return { totalLines, addedLines, deletedLines };
  }

  // === 파일 검토 실행 ===
  async reviewFiles(files) {
    const reviewId = `review_${Date.now()}`;
    const startTime = Date.now();
    
    this.emit('review-started', { reviewId, files });
    
    try {
      // 1. 작업 분석
      console.log('\n📊 작업 분석 중...');
      const analysis = await this.reviewSystem.analyzeTask(files);
      console.log(`  크기: ${analysis.size}`);
      console.log(`  중요도: ${analysis.importance}`);
      console.log(`  복잡도: ${analysis.complexity}`);
      console.log(`  검토 레벨: ${analysis.reviewLevel} (${analysis.recommendedAI.join(', ')})`);
      
      // 2. AI 검토 실행
      console.log('\n🤖 AI 검토 실행 중...');
      const reviews = await this.reviewSystem.executeReview(
        files,
        analysis.recommendedAI
      );
      
      // 3. 검토 결과 통합
      console.log('\n📈 검토 결과 통합 중...');
      const integration = this.reviewSystem.integrateReviews(reviews);
      
      // 4. 의사결정
      const decision = await this.makeDecision(integration, analysis);
      
      // 5. 보고서 생성
      if (this.reporter) {
        const reportPath = await this.reporter.generateReport({
          reviewId,
          analysis,
          reviews,
          integration,
          decision,
          duration: Date.now() - startTime
        });
        console.log(`\n📄 검토 보고서: ${reportPath}`);
      }
      
      // 6. 결과 적용
      if (decision.apply) {
        await this.applyDecision(decision, files);
      }
      
      // 7. 이력 저장
      this.workflowHistory.push({
        reviewId,
        timestamp: new Date().toISOString(),
        files,
        analysis,
        reviews: reviews.length,
        decision: decision.type,
        applied: decision.apply
      });
      
      this.emit('review-completed', {
        reviewId,
        decision,
        duration: Date.now() - startTime
      });
      
      return { reviewId, decision, integration };
      
    } catch (error) {
      this.emit('error', { reviewId, error });
      throw error;
    }
  }

  // === 커밋 검토 ===
  async reviewCommit(commit) {
    console.log(`\n🔍 커밋 검토: ${commit}`);
    
    try {
      // 커밋의 변경 파일 목록 가져오기
      const { stdout } = await execAsync(
        `cd ${CONFIG.PROJECT_ROOT} && git diff-tree --no-commit-id --name-only -r ${commit}`
      );
      
      const files = stdout.trim().split('\n').filter(f => f);
      
      if (files.length === 0) {
        console.log('변경된 파일이 없습니다');
        return;
      }
      
      console.log(`${files.length}개 파일 변경됨`);
      return await this.reviewFiles(files);
      
    } catch (error) {
      console.error('커밋 검토 실패:', error.message);
      throw error;
    }
  }

  // === PR 검토 ===
  async reviewPullRequest(prNumber) {
    console.log(`\n🔍 Pull Request #${prNumber} 검토`);
    
    try {
      // GitHub CLI를 사용하여 PR 정보 가져오기
      const { stdout } = await execAsync(
        `cd ${CONFIG.PROJECT_ROOT} && gh pr view ${prNumber} --json files`
      );
      
      const prData = JSON.parse(stdout);
      const files = prData.files.map(f => f.path);
      
      if (files.length === 0) {
        console.log('변경된 파일이 없습니다');
        return;
      }
      
      console.log(`${files.length}개 파일 변경됨`);
      const result = await this.reviewFiles(files);
      
      // PR에 코멘트 추가 (선택적)
      if (result && this.reporter) {
        const comment = await this.reporter.generatePRComment(result);
        await execAsync(
          `cd ${CONFIG.PROJECT_ROOT} && gh pr comment ${prNumber} --body "${comment}"`
        );
        console.log('✅ PR에 검토 결과 코멘트 추가됨');
      }
      
      return result;
      
    } catch (error) {
      console.error('PR 검토 실패:', error.message);
      throw error;
    }
  }

  // === 의사결정 ===
  async makeDecision(integration, analysis) {
    // integration이 없거나 skip 결정인 경우 처리
    if (!integration || integration.decision === 'skip') {
      console.log('⚠️ 검토 실패 → 수동 검토 필요');
      return {
        type: 'manual',
        apply: false,
        reason: integration?.reason || '검토 실패',
        actions: ['수동 검토 필요'],
        timestamp: new Date().toISOString()
      };
    }
    
    const { decision, avgScore, security = [], improvements = [], consensusLevel } = integration;
    
    let decisionType = 'manual';
    let apply = false;
    let actions = [];
    
    // 보안 이슈가 있으면 무조건 거절
    if (security && security.length > 0) {
      decisionType = 'reject';
      apply = false;
      actions.push('보안 이슈 수정 필요');
      console.log('🚨 보안 이슈 발견 → 자동 거절');
    }
    // 점수가 자동 수용 임계값 이상
    else if (parseFloat(avgScore) >= CONFIG.APPLY_POLICY.AUTO_ACCEPT_SCORE) {
      decisionType = 'accept';
      apply = true;
      actions.push('고품질 코드 → 자동 수용');
      console.log(`✅ 높은 점수 (${avgScore}) → 자동 수용`);
    }
    // 점수가 자동 거절 임계값 미만
    else if (parseFloat(avgScore) < CONFIG.APPLY_POLICY.AUTO_REJECT_SCORE) {
      decisionType = 'reject';
      apply = false;
      actions.push('품질 미달 → 재작업 필요');
      console.log(`❌ 낮은 점수 (${avgScore}) → 자동 거절`);
    }
    // 중간 점수 - 부분 수용
    else {
      decisionType = 'partial';
      apply = CONFIG.APPLY_POLICY.APPLY_IMPROVEMENTS;
      actions.push('개선사항 적용 후 수용');
      console.log(`⚠️ 중간 점수 (${avgScore}) → 부분 수용`);
      
      // 개선사항 우선순위 정리
      if (improvements.length > 0) {
        actions.push(...improvements.slice(0, 5).map(imp => `  - ${imp}`));
      }
    }
    
    // 합의 수준 체크
    if (CONFIG.APPLY_POLICY.REQUIRE_CONSENSUS && consensusLevel === 'very_low') {
      console.log('⚠️ AI 간 의견 불일치가 큼 → 수동 검토 권장');
      decisionType = 'manual';
      apply = false;
    }
    
    return {
      type: decisionType,
      apply,
      score: avgScore,
      actions,
      security,
      improvements: improvements.slice(0, 10),
      consensusLevel,
      timestamp: new Date().toISOString()
    };
  }

  // === 결정 적용 ===
  async applyDecision(decision, files) {
    if (!decision.apply) {
      console.log('📝 적용하지 않음 (수동 검토 필요)');
      return;
    }
    
    console.log('\n🔧 결정 적용 중...');
    
    // 백업 생성
    if (CONFIG.APPLY_POLICY.CREATE_BACKUP) {
      await this.createBackup(files);
    }
    
    const applied = [];
    const failed = [];
    
    for (const improvement of decision.improvements) {
      try {
        // 개선사항을 코드로 변환하여 적용
        // (실제 구현에서는 AI를 통해 코드 수정)
        console.log(`  적용 중: ${improvement}`);
        
        // TODO: 실제 코드 수정 로직
        // const result = await this.applyImprovement(improvement, files);
        // applied.push(improvement);
        
      } catch (error) {
        console.error(`  실패: ${improvement} - ${error.message}`);
        failed.push(improvement);
      }
    }
    
    if (applied.length > 0) {
      this.emit('improvements-applied', {
        applied,
        failed,
        files
      });
      
      console.log(`\n✅ ${applied.length}개 개선사항 적용됨`);
      if (failed.length > 0) {
        console.log(`⚠️ ${failed.length}개 개선사항 적용 실패`);
      }
    }
  }

  // === 백업 생성 ===
  async createBackup(files) {
    const backupDir = path.join(
      CONFIG.PROJECT_ROOT,
      '.backups',
      `backup_${Date.now()}`
    );
    
    await fs.mkdir(backupDir, { recursive: true });
    
    for (const file of files) {
      const src = path.join(CONFIG.PROJECT_ROOT, file);
      const dest = path.join(backupDir, file);
      
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(src, dest);
    }
    
    console.log(`💾 백업 생성됨: ${backupDir}`);
  }

  // === 이벤트 핸들러 ===
  handleChangesDetected(data) {
    console.log('📢 변경사항 감지:', data);
  }

  handleReviewStarted(data) {
    console.log('📢 검토 시작:', data.reviewId);
    this.activeReviews.set(data.reviewId, {
      startTime: Date.now(),
      files: data.files
    });
  }

  handleReviewCompleted(data) {
    console.log('📢 검토 완료:', data.reviewId);
    console.log(`  결정: ${data.decision.type}`);
    console.log(`  소요시간: ${(data.duration / 1000).toFixed(1)}초`);
    
    this.activeReviews.delete(data.reviewId);
  }

  handleImprovementsApplied(data) {
    console.log('📢 개선사항 적용됨:', data.applied.length);
  }

  handleError(error) {
    console.error('❌ 워크플로우 에러:', error);
  }

  // === 정리 ===
  async stop() {
    if (this.watcher) {
      await this.watcher.close();
      console.log('👋 파일 감시 중지됨');
    }
    
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    console.log('워크플로우 이력:', this.workflowHistory.length, '건');
  }
}

// === CLI 인터페이스 ===
if (import.meta.url === `file://${process.argv[1]}`) {
  const workflow = new AICollaborationWorkflow();
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🔄 AI Collaboration Workflow v2.0

사용법:
  node ai-collaboration-workflow.mjs <command> [options]

명령어:
  watch              파일 변경 감시 및 자동 검토
  review <files...>  특정 파일 검토
  commit <hash>      커밋 검토
  pr <number>        Pull Request 검토

옵션:
  --auto            자동 모드 (사용자 확인 없이 적용)
  --focus <type>    검토 초점 (security, performance, etc.)

예시:
  node ai-collaboration-workflow.mjs watch
  node ai-collaboration-workflow.mjs review src/app/api/*.ts
  node ai-collaboration-workflow.mjs commit HEAD
  node ai-collaboration-workflow.mjs pr 123
    `);
    process.exit(0);
  }
  
  const command = args[0];
  const options = {
    autoMode: args.includes('--auto'),
    focus: args.includes('--focus') ? 
      args[args.indexOf('--focus') + 1] : 'general'
  };
  
  // Ctrl+C 처리
  process.on('SIGINT', async () => {
    console.log('\n\n🛑 종료 중...');
    await workflow.stop();
    process.exit(0);
  });
  
  (async () => {
    try {
      switch (command) {
        case 'watch':
          await workflow.start({ watch: true, ...options });
          break;
          
        case 'review':
          const files = args.slice(1).filter(arg => !arg.startsWith('--'));
          await workflow.start({ files, ...options });
          await workflow.stop();
          break;
          
        case 'commit':
          await workflow.start({ commit: args[1] || 'HEAD', ...options });
          await workflow.stop();
          break;
          
        case 'pr':
          await workflow.start({ pr: args[1], ...options });
          await workflow.stop();
          break;
          
        default:
          console.error(`Unknown command: ${command}`);
          process.exit(1);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
      await workflow.stop();
      process.exit(1);
    }
  })();
}

export default AICollaborationWorkflow;