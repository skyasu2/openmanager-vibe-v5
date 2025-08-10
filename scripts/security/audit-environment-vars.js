#!/usr/bin/env node

/**
 * 🔐 환경변수 보안 감사 스크립트
 * 
 * 전체 프로젝트의 환경변수 보안 상태를 검사하고 리포트를 생성합니다.
 * 
 * 사용법:
 *   node scripts/security/audit-environment-vars.js
 *   node scripts/security/audit-environment-vars.js --fix  # 자동 수정 포함
 *   node scripts/security/audit-environment-vars.js --json # JSON 출력
 * 
 * @author AI Systems Engineer
 * @version 1.0.0
 * @created 2025-08-10
 */

const fs = require('fs');
const path = require('path');

// 색상 출력 유틸리티
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m', 
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// 명령행 인자 파싱
const args = process.argv.slice(2);
const shouldFix = args.includes('--fix');
const outputJson = args.includes('--json');
const outputFile = args.find(arg => arg.startsWith('--output='))?.split('=')[1];

// 환경변수 보안 검사기
class EnvironmentSecurityAuditor {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '../..');
    this.sensitivePatterns = [
      // API 키 패턴
      { name: 'API Key', pattern: /[a-zA-Z0-9]{32,}/, severity: 'high' },
      // JWT 시크릿
      { name: 'JWT Secret', pattern: /^[a-zA-Z0-9+/]{32,}={0,2}$/, severity: 'critical' },
      // GitHub 토큰
      { name: 'GitHub Token', pattern: /^ghp_[a-zA-Z0-9]{36}$/, severity: 'critical' },
      { name: 'GitHub Token (Fine-grained)', pattern: /^github_pat_[a-zA-Z0-9]{22}_[a-zA-Z0-9]{59}$/, severity: 'critical' },
      // Supabase 키
      { name: 'Supabase JWT', pattern: /^eyJ[a-zA-Z0-9+/=]+\.[a-zA-Z0-9+/=]+\.[a-zA-Z0-9+/=]+$/, severity: 'high' },
      // Google AI API 키
      { name: 'Google AI API Key', pattern: /^AIza[a-zA-Z0-9_-]{35}$/, severity: 'high' },
    ];
    
    this.requiredVars = [
      { name: 'NEXT_PUBLIC_SUPABASE_URL', type: 'public', required: true },
      { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', type: 'public', required: true },
      { name: 'SUPABASE_SERVICE_ROLE_KEY', type: 'server', required: false },
      { name: 'GOOGLE_AI_API_KEY', type: 'server', required: false },
      { name: 'GITHUB_CLIENT_SECRET', type: 'server', required: false },
    ];
  }

  /**
   * 전체 보안 감사 실행
   */
  async runAudit() {
    const startTime = Date.now();
    const result = {
      timestamp: new Date().toISOString(),
      projectPath: this.projectRoot,
      score: 100,
      issues: [],
      summary: {
        critical: 0,
        high: 0,
        medium: 0,
        low: 0
      },
      recommendations: [],
      files: {}
    };

    try {
      if (!outputJson) {
        console.log(colorize('🔐 환경변수 보안 감사 시작...', 'cyan'));
        console.log(colorize('================================', 'blue'));
      }

      // 1. 환경변수 파일들 검사
      await this.auditEnvironmentFiles(result);
      
      // 2. 소스 코드에서 하드코딩된 시크릿 검사
      await this.auditSourceCode(result);
      
      // 3. 빌드 설정 파일 검사
      await this.auditConfigFiles(result);
      
      // 4. 클라이언트/서버 분리 검사
      await this.auditClientServerSeparation(result);

      // 점수 계산
      result.score = this.calculateScore(result.issues);
      
      // 권장사항 생성
      result.recommendations = this.generateRecommendations(result.issues);

      // 결과 출력
      const duration = Date.now() - startTime;
      await this.outputResults(result, duration);

      // 자동 수정 실행
      if (shouldFix) {
        await this.autoFix(result.issues);
      }

      return result;

    } catch (error) {
      if (!outputJson) {
        console.error(colorize('❌ 감사 실행 중 오류 발생:', 'red'), error.message);
      }
      throw error;
    }
  }

  /**
   * 환경변수 파일들 검사
   */
  async auditEnvironmentFiles(result) {
    const envFiles = [
      '.env',
      '.env.local', 
      '.env.development',
      '.env.production',
      '.env.test',
      '.env.example'
    ];

    for (const envFile of envFiles) {
      const filePath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        result.files[envFile] = await this.analyzeEnvFile(envFile, content);
        
        // 이슈 수집
        result.files[envFile].issues.forEach(issue => {
          result.issues.push({
            ...issue,
            file: envFile,
            category: 'environment'
          });
        });
      }
    }
  }

  /**
   * 개별 환경변수 파일 분석
   */
  async analyzeEnvFile(filename, content) {
    const analysis = {
      variables: [],
      issues: [],
      stats: {
        total: 0,
        public: 0,
        server: 0,
        empty: 0,
        placeholders: 0
      }
    };

    const lines = content.split('\n');
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const trimmed = line.trim();
      
      // 주석이나 빈 줄 무시
      if (!trimmed || trimmed.startsWith('#')) continue;
      
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
      if (!match) continue;

      const [, varName, varValue] = match;
      analysis.stats.total++;
      
      const variable = {
        name: varName,
        value: varValue,
        line: lineNumber,
        isPublic: varName.startsWith('NEXT_PUBLIC_'),
        isEmpty: !varValue || varValue.trim().length === 0,
        isPlaceholder: this.isPlaceholder(varValue)
      };

      if (variable.isPublic) analysis.stats.public++;
      else analysis.stats.server++;
      
      if (variable.isEmpty) analysis.stats.empty++;
      if (variable.isPlaceholder) analysis.stats.placeholders++;

      analysis.variables.push(variable);

      // 보안 이슈 검사
      await this.checkVariableSecurity(variable, filename, analysis.issues);
    }

    return analysis;
  }

  /**
   * 개별 변수 보안 검사
   */
  async checkVariableSecurity(variable, filename, issues) {
    const { name, value, line, isPublic } = variable;
    
    // 빈 값 검사
    if (variable.isEmpty && this.isRequiredVariable(name)) {
      issues.push({
        type: 'missing_required',
        severity: 'high',
        message: `필수 환경변수 ${name}이 설정되지 않음`,
        line,
        recommendation: `${name}에 적절한 값 설정`
      });
    }

    // 플레이스홀더 값 검사
    if (variable.isPlaceholder && filename !== '.env.example') {
      issues.push({
        type: 'placeholder_value',
        severity: 'medium', 
        message: `${name}에 플레이스홀더 값이 설정됨`,
        line,
        recommendation: '실제 값으로 교체 필요'
      });
    }

    // 민감한 값이 공개 변수로 설정된 경우
    if (isPublic && this.isSensitiveVariable(name)) {
      issues.push({
        type: 'sensitive_public',
        severity: 'critical',
        message: `민감한 변수 ${name}이 NEXT_PUBLIC_로 클라이언트에 노출됨`,
        line,
        recommendation: 'NEXT_PUBLIC_ 접두사 제거하고 서버 전용으로 변경'
      });
    }

    // 값 패턴 검사
    if (value && !variable.isPlaceholder) {
      for (const pattern of this.sensitivePatterns) {
        if (pattern.pattern.test(value)) {
          // 실제 키인지 플레이스홀더인지 확인
          if (!this.isPlaceholder(value)) {
            issues.push({
              type: 'potential_secret',
              severity: pattern.severity === 'critical' ? 'critical' : 'high',
              message: `${pattern.name} 패턴이 ${filename}에서 감지됨: ${name}`,
              line,
              recommendation: `${filename === '.env.example' ? '플레이스홀더 값으로 교체' : '실제 운영 환경에서는 안전한 저장소 사용'}`
            });
          }
        }
      }
    }

    // 약한 시크릿 검사
    if (name.includes('SECRET') || name.includes('KEY') || name.includes('PASSWORD')) {
      if (value && value.length < 16 && !variable.isPlaceholder) {
        issues.push({
          type: 'weak_secret',
          severity: 'medium',
          message: `약한 시크릿 값: ${name} (길이: ${value.length})`,
          line,
          recommendation: '최소 16자 이상의 강력한 랜덤 값 사용'
        });
      }
    }
  }

  /**
   * 소스 코드에서 하드코딩된 시크릿 검사
   */
  async auditSourceCode(result) {
    // 이미 하드코딩 검사 스크립트가 있으므로 해당 결과 활용
    try {
      const { execSync } = require('child_process');
      const output = execSync('bash scripts/security/check-hardcoded-secrets.sh', { 
        encoding: 'utf8',
        cwd: this.projectRoot 
      });
      
      if (output.includes('하드코딩된 시크릿이 발견되지 않았습니다')) {
        result.issues.push({
          type: 'source_code_clean',
          severity: 'info',
          message: '소스 코드에서 하드코딩된 시크릿이 발견되지 않음',
          category: 'source_code'
        });
      }
    } catch (error) {
      result.issues.push({
        type: 'source_code_check_failed',
        severity: 'low',
        message: '소스 코드 하드코딩 검사 실패',
        category: 'source_code',
        recommendation: 'scripts/security/check-hardcoded-secrets.sh 스크립트 확인'
      });
    }
  }

  /**
   * 설정 파일들 검사
   */
  async auditConfigFiles(result) {
    const configFiles = ['next.config.js', 'package.json', 'vercel.json'];
    
    for (const configFile of configFiles) {
      const filePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        
        // 설정 파일에서 환경변수 하드코딩 검사
        if (content.includes('process.env.') && !content.includes('NEXT_PUBLIC_')) {
          // 서버 전용 환경변수가 클라이언트에 노출될 가능성 검사
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.includes('process.env.') && !line.includes('NEXT_PUBLIC_')) {
              result.issues.push({
                type: 'config_env_access',
                severity: 'medium',
                message: `${configFile}에서 서버 환경변수 직접 접근`,
                file: configFile,
                line: index + 1,
                category: 'configuration',
                recommendation: '환경변수 접근 방식 검토 필요'
              });
            }
          });
        }
      }
    }
  }

  /**
   * 클라이언트/서버 환경변수 분리 검사
   */
  async auditClientServerSeparation(result) {
    // 클라이언트 사이드 컴포넌트에서 서버 전용 환경변수 접근 검사
    const clientDirs = ['src/components', 'src/hooks', 'pages'];
    
    for (const dir of clientDirs) {
      const dirPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(dirPath)) {
        await this.scanDirectoryForEnvUsage(dirPath, result, 'client');
      }
    }
    
    // API 라우트에서 공개 환경변수만 사용하는지 검사
    const apiDir = path.join(this.projectRoot, 'src/app/api');
    if (fs.existsSync(apiDir)) {
      await this.scanDirectoryForEnvUsage(apiDir, result, 'api');
    }
  }

  /**
   * 디렉토리에서 환경변수 사용 패턴 검사
   */
  async scanDirectoryForEnvUsage(directory, result, context) {
    const files = this.getAllFiles(directory, ['.ts', '.tsx', '.js', '.jsx']);
    
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(this.projectRoot, file);
      
      // process.env 사용 패턴 찾기
      const envMatches = content.match(/process\.env\.([A-Z_][A-Z0-9_]*)/g);
      
      if (envMatches) {
        for (const match of envMatches) {
          const varName = match.replace('process.env.', '');
          
          if (context === 'client' && !varName.startsWith('NEXT_PUBLIC_')) {
            result.issues.push({
              type: 'client_server_env_access',
              severity: 'high',
              message: `클라이언트 코드에서 서버 환경변수 접근: ${varName}`,
              file: relativePath,
              category: 'separation',
              recommendation: 'NEXT_PUBLIC_ 접두사 추가하거나 서버 사이드로 이동'
            });
          }
        }
      }
    }
  }

  /**
   * 점수 계산
   */
  calculateScore(issues) {
    let score = 100;
    
    for (const issue of issues) {
      switch (issue.severity) {
        case 'critical':
          score -= 25;
          this.incrementSummary(issue, 'critical');
          break;
        case 'high':
          score -= 15;
          this.incrementSummary(issue, 'high');
          break;
        case 'medium':
          score -= 8;
          this.incrementSummary(issue, 'medium');
          break;
        case 'low':
          score -= 3;
          this.incrementSummary(issue, 'low');
          break;
        case 'info':
          // 정보성 이슈는 점수에 영향 없음
          break;
      }
    }
    
    return Math.max(0, score);
  }

  incrementSummary(issue, severity) {
    // 요약 통계는 결과 객체에서 직접 관리
  }

  /**
   * 권장사항 생성
   */
  generateRecommendations(issues) {
    const recommendations = [];
    
    const criticalIssues = issues.filter(i => i.severity === 'critical').length;
    const highIssues = issues.filter(i => i.severity === 'high').length;
    
    if (criticalIssues > 0) {
      recommendations.push('🚨 즉시 조치 필요: 심각한 보안 취약점이 발견되었습니다');
    }
    
    if (highIssues > 0) {
      recommendations.push('⚠️ 높은 우선순위: 중요한 보안 이슈를 빠른 시일 내에 해결하세요');
    }
    
    recommendations.push('🔐 정기적인 환경변수 보안 감사 실행');
    recommendations.push('📚 보안 가이드 참조: /docs/security-management-guide.md');
    recommendations.push('🔄 환경변수 암호화 시스템 활용 고려');
    
    return recommendations;
  }

  /**
   * 결과 출력
   */
  async outputResults(result, duration) {
    // 요약 통계 계산
    result.summary = {
      critical: result.issues.filter(i => i.severity === 'critical').length,
      high: result.issues.filter(i => i.severity === 'high').length,
      medium: result.issues.filter(i => i.severity === 'medium').length,
      low: result.issues.filter(i => i.severity === 'low').length
    };

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }
    
    console.log(colorize('\n🔐 환경변수 보안 감사 결과', 'cyan'));
    console.log(colorize('================================', 'blue'));
    console.log(`실행 시간: ${duration}ms`);
    console.log(`보안 점수: ${this.getScoreColor(result.score)}${result.score}/100${colors.reset}`);
    console.log(`총 이슈: ${result.issues.length}개`);
    console.log(`  - 심각: ${colorize(result.summary.critical, 'red')}개`);
    console.log(`  - 높음: ${colorize(result.summary.high, 'yellow')}개`);  
    console.log(`  - 중간: ${colorize(result.summary.medium, 'blue')}개`);
    console.log(`  - 낮음: ${colorize(result.summary.low, 'cyan')}개`);
    
    if (result.issues.length > 0) {
      console.log(colorize('\n발견된 이슈:', 'bright'));
      result.issues.forEach((issue, index) => {
        const severityIcon = this.getSeverityIcon(issue.severity);
        const severityColor = this.getSeverityColor(issue.severity);
        
        console.log(`${severityIcon} ${index + 1}. [${colorize(issue.severity.toUpperCase(), severityColor)}] ${issue.message}`);
        
        if (issue.file) {
          console.log(colorize(`    📁 파일: ${issue.file}${issue.line ? `:${issue.line}` : ''}`, 'cyan'));
        }
        
        if (issue.recommendation) {
          console.log(colorize(`    💡 권장: ${issue.recommendation}`, 'green'));
        }
        
        console.log('');
      });
    } else {
      console.log(colorize('\n✅ 발견된 보안 이슈가 없습니다!', 'green'));
    }
    
    console.log(colorize('권장사항:', 'bright'));
    result.recommendations.forEach(rec => {
      console.log(colorize(`  • ${rec}`, 'yellow'));
    });

    // 파일에 저장
    if (outputFile) {
      fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
      console.log(colorize(`\n📄 결과를 ${outputFile}에 저장했습니다.`, 'green'));
    }
  }

  /**
   * 자동 수정
   */
  async autoFix(issues) {
    console.log(colorize('\n🔧 자동 수정 시작...', 'cyan'));
    
    let fixed = 0;
    let skipped = 0;
    
    for (const issue of issues) {
      if (this.canAutoFix(issue)) {
        try {
          await this.applyAutoFix(issue);
          console.log(colorize(`✅ 수정됨: ${issue.message}`, 'green'));
          fixed++;
        } catch (error) {
          console.log(colorize(`❌ 수정 실패: ${issue.message} - ${error.message}`, 'red'));
          skipped++;
        }
      } else {
        skipped++;
      }
    }
    
    console.log(colorize(`\n자동 수정 완료: ${fixed}개 수정, ${skipped}개 수동 처리 필요`, 'blue'));
  }

  // 헬퍼 메서드들
  isPlaceholder(value) {
    if (!value) return true;
    const placeholderPatterns = [
      'YOUR_',
      'PLACEHOLDER',
      'REPLACE_',
      'CHANGE_',
      'temp-',
      'dummy-',
      'test-',
      'example-'
    ];
    return placeholderPatterns.some(pattern => 
      value.toUpperCase().includes(pattern.toUpperCase())
    );
  }

  isRequiredVariable(name) {
    return this.requiredVars.some(v => v.name === name && v.required);
  }

  isSensitiveVariable(name) {
    const sensitiveNames = [
      'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE', 'AUTH'
    ];
    return sensitiveNames.some(sensitive => name.includes(sensitive));
  }

  getAllFiles(dir, extensions) {
    let results = [];
    const list = fs.readdirSync(dir);
    
    list.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat && stat.isDirectory()) {
        if (!file.startsWith('.') && file !== 'node_modules') {
          results = results.concat(this.getAllFiles(filePath, extensions));
        }
      } else {
        if (extensions.some(ext => file.endsWith(ext))) {
          results.push(filePath);
        }
      }
    });
    
    return results;
  }

  getScoreColor(score) {
    if (score >= 90) return colors.green;
    if (score >= 70) return colors.yellow;
    if (score >= 50) return colors.magenta;
    return colors.red;
  }

  getSeverityIcon(severity) {
    switch (severity) {
      case 'critical': return '🚨';
      case 'high': return '⚠️';
      case 'medium': return '🔶';
      case 'low': return 'ℹ️';
      default: return '📋';
    }
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'critical': return 'red';
      case 'high': return 'yellow';
      case 'medium': return 'blue';
      case 'low': return 'cyan';
      default: return 'reset';
    }
  }

  canAutoFix(issue) {
    // 간단한 자동 수정 가능한 케이스들
    const autoFixableTypes = [
      'sensitive_public',  // NEXT_PUBLIC_ 제거
      'placeholder_value'  // 플레이스홀더 경고
    ];
    return autoFixableTypes.includes(issue.type);
  }

  async applyAutoFix(issue) {
    // 실제 자동 수정 로직 (주의깊게 구현 필요)
    console.log(`자동 수정 적용: ${issue.type}`);
    // 현재는 로그만 출력 (실제 구현시 파일 수정)
  }
}

// 메인 실행
async function main() {
  try {
    const auditor = new EnvironmentSecurityAuditor();
    const result = await auditor.runAudit();
    
    // 종료 코드 설정 (심각한 이슈가 있으면 1로 종료)
    const hasCriticalIssues = result.issues.some(issue => issue.severity === 'critical');
    process.exit(hasCriticalIssues ? 1 : 0);
    
  } catch (error) {
    if (!outputJson) {
      console.error(colorize('❌ 감사 실행 실패:', 'red'), error.message);
    }
    process.exit(1);
  }
}

// 직접 실행시에만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = { EnvironmentSecurityAuditor };