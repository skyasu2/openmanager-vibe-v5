#!/usr/bin/env node

/**
 * 📊 OpenManager V5 작업 로그 분석기
 * 
 * 기능:
 * - Git 커밋 히스토리 분석
 * - 파일 변경사항 추적
 * - 개발 진행도 리포트 생성
 * - Vibe Coding 개발 내역 통합
 * - 문서 자동 업데이트 제안
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class WorkLogAnalyzer {
  constructor() {
    this.projectRoot = process.cwd();
    this.reportDir = path.join(this.projectRoot, 'logs', 'analysis');
    this.ensureDirectoryExists(this.reportDir);
  }

  // Git 커밋 히스토리 분석
  async analyzeGitHistory(days = 30) {
    try {
      const sinceDate = new Date();
      sinceDate.setDate(sinceDate.getDate() - days);
      const since = sinceDate.toISOString().split('T')[0];
      
      // 커밋 로그 가져오기
      const gitLog = execSync(`git log --since="${since}" --pretty=format:"%h|%an|%ad|%s" --date=short`, {
        encoding: 'utf8'
      }).split('\n').filter(line => line.trim());
      
      // 파일 변경사항 분석
      const fileChanges = execSync(`git log --since="${since}" --name-status --pretty=format:"%h"`, {
        encoding: 'utf8'
      });
      
      const commits = gitLog.map(line => {
        const [hash, author, date, message] = line.split('|');
        return { hash, author, date, message };
      });
      
      // 분류별 분석
      const analysis = {
        totalCommits: commits.length,
        authors: this.analyzeAuthors(commits),
        categories: this.categorizeCommits(commits),
        fileChanges: this.analyzeFileChanges(fileChanges),
        vibecodingProgress: this.analyzeVibeCodingProgress(commits),
        timeline: this.createTimeline(commits)
      };
      
      return analysis;
    } catch (error) {
      console.error('Error analyzing git history:', error);
      return null;
    }
  }

  // 작성자별 분석
  analyzeAuthors(commits) {
    const authorStats = {};
    
    commits.forEach(commit => {
      if (!authorStats[commit.author]) {
        authorStats[commit.author] = {
          commits: 0,
          firstCommit: commit.date,
          lastCommit: commit.date
        };
      }
      
      authorStats[commit.author].commits++;
      
      if (commit.date < authorStats[commit.author].firstCommit) {
        authorStats[commit.author].firstCommit = commit.date;
      }
      
      if (commit.date > authorStats[commit.author].lastCommit) {
        authorStats[commit.author].lastCommit = commit.date;
      }
    });
    
    return authorStats;
  }

  // 커밋 분류
  categorizeCommits(commits) {
    const categories = {
      features: [],
      fixes: [],
      docs: [],
      refactor: [],
      tests: [],
      vibe_coding: [],
      mcp: [],
      ui_ux: [],
      performance: [],
      others: []
    };
    
    const keywords = {
      features: ['feat:', 'add:', 'implement', '추가', '구현', '기능'],
      fixes: ['fix:', 'bug:', 'patch:', '수정', '버그', '오류'],
      docs: ['docs:', 'doc:', '문서', 'README', 'documentation'],
      refactor: ['refactor:', 'clean:', '리팩터', '정리', '개선'],
      tests: ['test:', 'spec:', '테스트', 'testing'],
      vibe_coding: ['vibe', 'cursor', 'ai collaboration', 'claude', 'copilot'],
      mcp: ['mcp', 'model context protocol', 'ai agent'],
      ui_ux: ['ui:', 'ux:', 'style:', '디자인', 'framer', 'animation'],
      performance: ['perf:', 'optimize:', '최적화', '성능', 'performance']
    };
    
    commits.forEach(commit => {
      const message = commit.message.toLowerCase();
      let categorized = false;
      
      for (const [category, keywordList] of Object.entries(keywords)) {
        if (keywordList.some(keyword => message.includes(keyword))) {
          categories[category].push(commit);
          categorized = true;
          break;
        }
      }
      
      if (!categorized) {
        categories.others.push(commit);
      }
    });
    
    return categories;
  }

  // 파일 변경사항 분석
  analyzeFileChanges(fileChangesRaw) {
    const lines = fileChangesRaw.split('\n');
    const fileStats = {};
    let currentHash = null;
    
    lines.forEach(line => {
      if (line.match(/^[a-f0-9]+$/)) {
        currentHash = line;
      } else if (line.startsWith('A\t') || line.startsWith('M\t') || line.startsWith('D\t')) {
        const [status, file] = line.split('\t');
        
        if (!fileStats[file]) {
          fileStats[file] = {
            added: 0,
            modified: 0,
            deleted: 0,
            lastModified: currentHash
          };
        }
        
        if (status === 'A') fileStats[file].added++;
        else if (status === 'M') fileStats[file].modified++;
        else if (status === 'D') fileStats[file].deleted++;
      }
    });
    
    // 가장 활발히 변경된 파일들
    const mostChanged = Object.entries(fileStats)
      .map(([file, stats]) => ({
        file,
        totalChanges: stats.added + stats.modified + stats.deleted,
        ...stats
      }))
      .sort((a, b) => b.totalChanges - a.totalChanges)
      .slice(0, 20);
    
    return {
      totalFiles: Object.keys(fileStats).length,
      mostChanged,
      fileTypes: this.analyzeFileTypes(Object.keys(fileStats))
    };
  }

  // 파일 타입별 분석
  analyzeFileTypes(files) {
    const typeStats = {};
    
    files.forEach(file => {
      const ext = path.extname(file).toLowerCase() || 'no-extension';
      typeStats[ext] = (typeStats[ext] || 0) + 1;
    });
    
    return Object.entries(typeStats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  // Vibe Coding 진행도 분석
  analyzeVibeCodingProgress(commits) {
    const vibeCodingCommits = commits.filter(commit => 
      commit.message.toLowerCase().includes('vibe') ||
      commit.message.toLowerCase().includes('cursor') ||
      commit.message.toLowerCase().includes('ai') ||
      commit.message.toLowerCase().includes('claude')
    );
    
    const milestones = [
      {
        title: 'AI 협업 도구 설정',
        keywords: ['cursor', 'claude', 'setup', '설정'],
        completed: false,
        commits: []
      },
      {
        title: 'MCP 시스템 구현',
        keywords: ['mcp', 'model context', 'ai agent', 'orchestrator'],
        completed: false,
        commits: []
      },
      {
        title: 'Vibe Coding 페이지 개발',
        keywords: ['vibe coding', 'collaboration page', 'ai workflow'],
        completed: false,
        commits: []
      },
      {
        title: '개발 자동화 구축',
        keywords: ['automation', 'script', 'generator', '자동화'],
        completed: false,
        commits: []
      }
    ];
    
    // 마일스톤별 진행도 체크
    vibeCodingCommits.forEach(commit => {
      milestones.forEach(milestone => {
        if (milestone.keywords.some(keyword => 
          commit.message.toLowerCase().includes(keyword)
        )) {
          milestone.commits.push(commit);
          milestone.completed = true;
        }
      });
    });
    
    return {
      totalVibeCodingCommits: vibeCodingCommits.length,
      milestones,
      completionRate: (milestones.filter(m => m.completed).length / milestones.length) * 100
    };
  }

  // 타임라인 생성
  createTimeline(commits) {
    const timeline = {};
    
    commits.forEach(commit => {
      if (!timeline[commit.date]) {
        timeline[commit.date] = [];
      }
      timeline[commit.date].push(commit);
    });
    
    return Object.entries(timeline)
      .sort((a, b) => new Date(b[0]) - new Date(a[0]))
      .slice(0, 14); // 최근 2주
  }

  // 프로젝트 현황 분석
  analyzeProjectStatus() {
    try {
      // 파일 수 계산
      const srcFiles = this.countFiles('src', /\.(ts|tsx|js|jsx)$/);
      const testFiles = this.countFiles('tests', /\.(test|spec)\.(ts|tsx|js|jsx)$/);
      const docFiles = this.countFiles('docs', /\.md$/);
      
      // 코드 라인 수 계산 (근사치)
      const codeLines = this.estimateCodeLines();
      
      // 패키지 의존성 분석
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      return {
        files: {
          source: srcFiles,
          tests: testFiles,
          docs: docFiles
        },
        codeLines,
        dependencies: {
          production: Object.keys(packageJson.dependencies || {}).length,
          development: Object.keys(packageJson.devDependencies || {}).length
        },
        scripts: Object.keys(packageJson.scripts || {}).length
      };
    } catch (error) {
      console.error('Error analyzing project status:', error);
      return null;
    }
  }

  // 파일 수 계산
  countFiles(directory, pattern) {
    try {
      if (!fs.existsSync(directory)) return 0;
      
      let count = 0;
      
      const walkDir = (dir) => {
        const items = fs.readdirSync(dir);
        
        items.forEach(item => {
          const fullPath = path.join(dir, item);
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
            walkDir(fullPath);
          } else if (stat.isFile() && pattern.test(item)) {
            count++;
          }
        });
      };
      
      walkDir(directory);
      return count;
    } catch (error) {
      return 0;
    }
  }

  // 코드 라인 수 추정
  estimateCodeLines() {
    try {
      const result = execSync('find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" | xargs wc -l | tail -1', {
        encoding: 'utf8'
      });
      
      const match = result.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    } catch (error) {
      return 0;
    }
  }

  // 문서 업데이트 제안 생성
  generateDocumentationSuggestions(analysis) {
    const suggestions = [];
    
    // Vibe Coding 진행도 기반 제안
    if (analysis.vibecodingProgress.completionRate > 80) {
      suggestions.push({
        type: 'vibe_coding',
        priority: 'high',
        title: 'Vibe Coding 완성 문서 업데이트',
        description: 'Vibe Coding 마일스톤 달성률이 80% 이상입니다. 관련 문서를 업데이트해주세요.',
        targetFile: 'docs/4_AI_AGENT_GUIDE.md'
      });
    }
    
    // 새로운 기능 기반 제안
    if (analysis.categories.features.length > 5) {
      suggestions.push({
        type: 'features',
        priority: 'medium',
        title: '새 기능 문서화',
        description: `최근 ${analysis.categories.features.length}개의 새 기능이 추가되었습니다.`,
        targetFile: 'docs/1_SYSTEM_OVERVIEW.md'
      });
    }
    
    // API 변경 기반 제안
    const apiChanges = analysis.fileChanges.mostChanged.filter(f => 
      f.file.includes('/api/') || f.file.includes('route.ts')
    );
    
    if (apiChanges.length > 0) {
      suggestions.push({
        type: 'api',
        priority: 'high',
        title: 'API 문서 업데이트',
        description: `${apiChanges.length}개의 API 파일이 변경되었습니다.`,
        targetFile: 'docs/8_API_REFERENCE.md'
      });
    }
    
    return suggestions;
  }

  // 리포트 생성
  async generateReport(days = 30) {
    console.log(`📊 최근 ${days}일간 작업 로그 분석 중...`);
    
    const analysis = await this.analyzeGitHistory(days);
    const projectStatus = this.analyzeProjectStatus();
    const suggestions = this.generateDocumentationSuggestions(analysis);
    
    const report = {
      generatedAt: new Date().toISOString(),
      period: `최근 ${days}일`,
      analysis,
      projectStatus,
      suggestions,
      summary: this.generateSummary(analysis, projectStatus)
    };
    
    // 리포트 파일 저장
    const reportPath = path.join(this.reportDir, `work-log-report-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    // 마크다운 리포트 생성
    const markdownReport = this.generateMarkdownReport(report);
    const mdReportPath = path.join(this.reportDir, `work-log-report-${Date.now()}.md`);
    fs.writeFileSync(mdReportPath, markdownReport);
    
    console.log(`✅ 리포트 생성 완료:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   Markdown: ${mdReportPath}`);
    
    return report;
  }

  // 요약 생성
  generateSummary(analysis, projectStatus) {
    const activeAuthors = Object.keys(analysis.authors).length;
    const totalCommits = analysis.totalCommits;
    const vibeCodingProgress = analysis.vibecodingProgress.completionRate;
    
    return {
      productivity: totalCommits > 50 ? 'High' : totalCommits > 20 ? 'Medium' : 'Low',
      teamActivity: activeAuthors > 3 ? 'Very Active' : activeAuthors > 1 ? 'Active' : 'Solo',
      vibeCodingStatus: vibeCodingProgress > 75 ? 'Advanced' : vibeCodingProgress > 50 ? 'In Progress' : 'Starting',
      codebase: projectStatus.codeLines > 10000 ? 'Large' : projectStatus.codeLines > 5000 ? 'Medium' : 'Small'
    };
  }

  // 마크다운 리포트 생성
  generateMarkdownReport(report) {
    const { analysis, projectStatus, suggestions, summary } = report;
    
    return `# 📊 OpenManager V5 - 작업 로그 분석 리포트

**생성일**: ${new Date(report.generatedAt).toLocaleString()}  
**분석 기간**: ${report.period}

---

## 🎯 요약

- **생산성**: ${summary.productivity}
- **팀 활동**: ${summary.teamActivity}  
- **Vibe Coding 진행도**: ${summary.vibeCodingStatus} (${Math.round(analysis.vibecodingProgress.completionRate)}%)
- **코드베이스 규모**: ${summary.codebase} (${projectStatus.codeLines.toLocaleString()} 라인)

---

## 📈 개발 활동 통계

### 커밋 현황
- **총 커밋 수**: ${analysis.totalCommits}개
- **활성 개발자**: ${Object.keys(analysis.authors).length}명
- **변경된 파일**: ${analysis.fileChanges.totalFiles}개

### 카테고리별 분석
${Object.entries(analysis.categories)
  .filter(([_, commits]) => commits.length > 0)
  .map(([category, commits]) => `- **${category}**: ${commits.length}개`)
  .join('\n')}

---

## 🎨 Vibe Coding 진행도

**전체 완료율**: ${Math.round(analysis.vibecodingProgress.completionRate)}%

### 마일스톤 현황
${analysis.vibecodingProgress.milestones
  .map(milestone => `- ${milestone.completed ? '✅' : '⏳'} **${milestone.title}** (${milestone.commits.length}개 커밋)`)
  .join('\n')}

---

## 📁 프로젝트 현황

### 파일 구성
- **소스 파일**: ${projectStatus.files.source}개
- **테스트 파일**: ${projectStatus.files.tests}개  
- **문서 파일**: ${projectStatus.files.docs}개

### 의존성
- **프로덕션**: ${projectStatus.dependencies.production}개
- **개발**: ${projectStatus.dependencies.development}개
- **스크립트**: ${projectStatus.scripts}개

---

## 🔧 문서 업데이트 제안

${suggestions.length > 0 ? 
  suggestions.map(s => `### ${s.priority === 'high' ? '🔴' : '🟡'} ${s.title}

**대상 파일**: \`${s.targetFile}\`  
**설명**: ${s.description}
`).join('\n') : 
  '현재 문서 업데이트가 필요한 항목이 없습니다.'
}

---

## 📅 최근 활동 타임라인

${analysis.timeline.slice(0, 7)
  .map(([date, commits]) => `### ${date} (${commits.length}개 커밋)

${commits.slice(0, 3).map(c => `- \`${c.hash}\` ${c.message}`).join('\n')}
${commits.length > 3 ? `\n... 외 ${commits.length - 3}개` : ''}
`).join('\n')}

---

**자동 생성**: ${new Date().toLocaleString()}  
**분석 도구**: OpenManager V5 Work Log Analyzer`;
  }

  // 디렉토리 생성
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  // CLI 실행
  run() {
    const args = process.argv.slice(2);
    const days = parseInt(args.find(arg => arg.startsWith('--days='))?.split('=')[1]) || 30;
    
    if (args.includes('--help')) {
      console.log(`
📊 Work Log Analyzer

사용법:
  node .cursor/scripts/work-log-analyzer.js [options]

옵션:
  --days=<숫자>     분석할 일수 (기본: 30일)
  --help           이 도움말 표시

예제:
  node .cursor/scripts/work-log-analyzer.js --days=14
  node .cursor/scripts/work-log-analyzer.js
      `);
      return;
    }
    
    this.generateReport(days);
  }
}

// CLI 실행
if (require.main === module) {
  const analyzer = new WorkLogAnalyzer();
  analyzer.run();
}

module.exports = WorkLogAnalyzer; 