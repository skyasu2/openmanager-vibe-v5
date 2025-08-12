#!/usr/bin/env node

/**
 * 파일 크기 모니터링 및 자동 경고 시스템
 * 1000줄 이상 경고, 1500줄 이상 분리 필수
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 설정
const CONFIG = {
  warningThreshold: 900,
  criticalThreshold: 1500,
  srcPath: path.join(__dirname, '..', 'src'),
  excludePatterns: [
    /node_modules/,
    /\.test\./,
    /\.spec\./,
    /\.stories\./,
    /\.d\.ts$/,
    /dist/,
    /build/,
    /.next/
  ]
};

// 색상 코드
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

/**
 * 파일 라인 수 계산
 */
function countLines(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * 디렉토리 재귀 탐색
 */
function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    // 제외 패턴 체크
    if (CONFIG.excludePatterns.some(pattern => pattern.test(filePath))) {
      return;
    }

    if (stat.isDirectory()) {
      scanDirectory(filePath, results);
    } else if (stat.isFile() && /\.(ts|tsx|js|jsx)$/.test(file)) {
      const lines = countLines(filePath);
      if (lines >= CONFIG.warningThreshold) {
        results.push({
          path: path.relative(process.cwd(), filePath),
          lines,
          status: lines >= CONFIG.criticalThreshold ? 'critical' : 'warning'
        });
      }
    }
  });

  return results;
}

/**
 * 모듈화 제안 생성
 */
function generateRefactoringSuggestions(file) {
  const suggestions = [];
  const ext = path.extname(file.path);
  const baseName = path.basename(file.path, ext);
  const dirName = path.dirname(file.path);

  if (file.path.includes('components')) {
    suggestions.push({
      type: 'Component Split',
      files: [
        `${dirName}/${baseName}.container${ext}`,
        `${dirName}/${baseName}.presentation${ext}`,
        `${dirName}/${baseName}.hooks${ext}`,
        `${dirName}/${baseName}.types.ts`
      ]
    });
  }

  if (file.path.includes('services')) {
    suggestions.push({
      type: 'Service Split',
      files: [
        `${dirName}/${baseName}.core${ext}`,
        `${dirName}/${baseName}.api${ext}`,
        `${dirName}/${baseName}.utils${ext}`,
        `${dirName}/${baseName}.types.ts`
      ]
    });
  }

  if (file.path.includes('hooks')) {
    suggestions.push({
      type: 'Hook Split',
      files: [
        `${dirName}/${baseName}.state${ext}`,
        `${dirName}/${baseName}.effects${ext}`,
        `${dirName}/${baseName}.helpers${ext}`
      ]
    });
  }

  return suggestions;
}

/**
 * 자동 모듈화 스크립트 생성
 */
function generateRefactoringScript(file) {
  const ext = path.extname(file.path);
  const baseName = path.basename(file.path, ext);
  const dirName = path.dirname(file.path);

  return `
#!/bin/bash
# Auto-generated refactoring script for ${file.path}

echo "🔧 Refactoring ${baseName}${ext} (${file.lines} lines)"

# Create backup
cp "${file.path}" "${file.path}.backup"

# Create module directory
mkdir -p "${dirName}/${baseName}"

# TODO: Analyze and split the file
# This requires manual intervention based on the specific file structure

echo "📁 Module structure created at ${dirName}/${baseName}/"
echo "⚠️  Manual splitting required. Analyze the file and distribute code accordingly."
`;
}

/**
 * 메인 실행
 */
function main() {
  console.log(`\n${colors.bold}${colors.cyan}📊 File Size Monitor${colors.reset}`);
  console.log(`${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);

  // 디렉토리 스캔
  const largeFiles = scanDirectory(CONFIG.srcPath);

  if (largeFiles.length === 0) {
    console.log(`${colors.green}✅ All files are within size limits!${colors.reset}\n`);
    return;
  }

  // 결과 정렬 (크기 순)
  largeFiles.sort((a, b) => b.lines - a.lines);

  // 통계
  const criticalCount = largeFiles.filter(f => f.status === 'critical').length;
  const warningCount = largeFiles.filter(f => f.status === 'warning').length;

  console.log(`${colors.bold}📈 Summary:${colors.reset}`);
  console.log(`  ${colors.red}● Critical (≥${CONFIG.criticalThreshold} lines): ${criticalCount} files${colors.reset}`);
  console.log(`  ${colors.yellow}● Warning (≥${CONFIG.warningThreshold} lines): ${warningCount} files${colors.reset}`);
  console.log(`  ${colors.cyan}● Total: ${largeFiles.length} files need attention${colors.reset}\n`);

  // 상세 리스트
  console.log(`${colors.bold}📋 Files Requiring Action:${colors.reset}\n`);

  largeFiles.forEach((file, index) => {
    const statusColor = file.status === 'critical' ? colors.red : colors.yellow;
    const statusIcon = file.status === 'critical' ? '🔴' : '🟡';
    
    console.log(`${statusIcon} ${statusColor}${file.path}${colors.reset}`);
    console.log(`   Lines: ${colors.bold}${file.lines}${colors.reset}`);
    console.log(`   Status: ${statusColor}${file.status.toUpperCase()}${colors.reset}`);

    // 모듈화 제안
    const suggestions = generateRefactoringSuggestions(file);
    if (suggestions.length > 0) {
      console.log(`   ${colors.cyan}Suggested Refactoring:${colors.reset}`);
      suggestions.forEach(suggestion => {
        console.log(`     - ${suggestion.type}:`);
        suggestion.files.forEach(f => {
          console.log(`       • ${f}`);
        });
      });
    }
    console.log('');
  });

  // 리팩토링 스크립트 생성 옵션
  if (criticalCount > 0) {
    console.log(`${colors.bold}${colors.red}⚠️  Critical Action Required:${colors.reset}`);
    console.log(`${criticalCount} files exceed ${CONFIG.criticalThreshold} lines and must be split immediately.\n`);

    // 리팩토링 스크립트 생성
    const scriptsDir = path.join(__dirname, 'refactoring');
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    largeFiles
      .filter(f => f.status === 'critical')
      .forEach(file => {
        const scriptName = path.basename(file.path, path.extname(file.path)) + '-refactor.sh';
        const scriptPath = path.join(scriptsDir, scriptName);
        const script = generateRefactoringScript(file);
        
        fs.writeFileSync(scriptPath, script, 'utf-8');
        fs.chmodSync(scriptPath, '755');
        
        console.log(`  📝 Generated: ${path.relative(process.cwd(), scriptPath)}`);
      });
    
    console.log('');
  }

  // Git hook 통합
  console.log(`${colors.bold}${colors.cyan}🔗 Git Hook Integration:${colors.reset}`);
  console.log('Add to .husky/pre-commit:');
  console.log(`${colors.cyan}node scripts/file-size-monitor.js || true${colors.reset}\n`);

  // CI/CD 통합
  console.log(`${colors.bold}${colors.cyan}🚀 CI/CD Integration:${colors.reset}`);
  console.log('Add to GitHub Actions:');
  console.log(`${colors.cyan}- name: Check file sizes
  run: node scripts/file-size-monitor.js${colors.reset}\n`);

  // Exit code
  if (criticalCount > 0) {
    console.log(`${colors.red}❌ Build failed: ${criticalCount} files exceed critical threshold${colors.reset}`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`${colors.yellow}⚠️  Build warning: ${warningCount} files approaching size limit${colors.reset}`);
    process.exit(0);
  }
}

// 실행
if (require.main === module) {
  main();
}

module.exports = {
  scanDirectory,
  countLines,
  generateRefactoringSuggestions
};