/**
 * 지능형 검증 파이프라인 - 리스크 스코어 계산 엔진
 * @description 변경된 파일의 위험도를 0-12 스케일로 계산
 * @created 2025-08-09
 */

const fs = require('fs');
const path = require('path');

/**
 * 파일 타입별 위험도 가중치 (0-3)
 */
const FILE_TYPE_RISKS = {
  // 고위험 (3점)
  '.ts': 3, '.tsx': 3, '.js': 3, '.jsx': 3,
  'next.config.js': 3, 'next.config.mjs': 3,
  'package.json': 3, 'tsconfig.json': 3,
  'tailwind.config.js': 3, 'postcss.config.js': 3,
  
  // 중위험 (2점)  
  '.json': 2, '.env': 2, '.env.local': 2,
  '.eslintrc.json': 2, '.prettierrc': 2,
  'vitest.config.ts': 2, 'playwright.config.ts': 2,
  
  // 저위험 (1점)
  '.css': 1, '.scss': 1, '.module.css': 1,
  '.test.ts': 1, '.test.tsx': 1, '.spec.ts': 1,
  
  // 무위험 (0점)
  '.md': 0, '.txt': 0, '.log': 0,
  '.png': 0, '.jpg': 0, '.svg': 0,
  '.gitignore': 0, '.gitkeep': 0
};

/**
 * 디렉토리별 위험도 가중치 (0-3)
 */
const DIRECTORY_RISKS = {
  // 고위험 (3점)
  'src/app': 3, 'src/pages': 3, 'src/api': 3,
  'src/services': 3, 'src/lib': 3, 'src/hooks': 3,
  'gcp-functions': 3, 'scripts': 3,
  
  // 중위험 (2점)
  'src/components': 2, 'src/adapters': 2,
  'src/schemas': 2, 'src/types': 2,
  'src/utils': 2, '.husky': 2,
  
  // 저위험 (1점)
  'src/styles': 1, 'public': 1,
  'tests': 1, 'docs': 1,
  
  // 무위험 (0점)
  '.next': 0, 'node_modules': 0,
  '.git': 0, 'reports': 0
};

/**
 * 파일 크기별 위험도 (0-2)
 */
function getFileSizeRisk(filePath) {
  try {
    const stats = fs.statSync(filePath);
    const sizeKB = stats.size / 1024;
    
    if (sizeKB > 500) return 2;      // 500KB+ 초대용량
    if (sizeKB > 100) return 1;      // 100-500KB 대용량
    return 0;                        // 100KB 미만 일반
  } catch (error) {
    return 0; // 파일을 읽을 수 없으면 위험도 0
  }
}

/**
 * 변경량별 위험도 (0-4)
 */
function getChangeVolumeRisk(gitDiff) {
  if (!gitDiff) return 0;
  
  const lines = gitDiff.split('\n');
  const additions = lines.filter(line => line.startsWith('+')).length;
  const deletions = lines.filter(line => line.startsWith('-')).length;
  const totalChanges = additions + deletions;
  
  if (totalChanges > 200) return 4;    // 200+ 라인 대규모 변경
  if (totalChanges > 100) return 3;    // 100-200 라인 중규모 변경
  if (totalChanges > 50) return 2;     // 50-100 라인 소규모 변경
  if (totalChanges > 10) return 1;     // 10-50 라인 미세 변경
  return 0;                            // 10 라인 미만 최소 변경
}

/**
 * 파일 타입 위험도 계산
 */
function getFileTypeRisk(filePath) {
  const fileName = path.basename(filePath);
  const ext = path.extname(filePath);
  
  // 특수 파일명 우선 확인
  if (FILE_TYPE_RISKS[fileName] !== undefined) {
    return FILE_TYPE_RISKS[fileName];
  }
  
  // 확장자별 확인
  return FILE_TYPE_RISKS[ext] || 1; // 기본값 1점
}

/**
 * 디렉토리 위험도 계산
 */
function getDirectoryRisk(filePath) {
  const normalizedPath = path.normalize(filePath).replace(/\\/g, '/');
  
  for (const [dirPattern, risk] of Object.entries(DIRECTORY_RISKS)) {
    if (normalizedPath.includes(dirPattern)) {
      return risk;
    }
  }
  
  return 1; // 기본값 1점
}

/**
 * 종합 리스크 스코어 계산 (0-12)
 */
function calculateRiskScore(filePath, gitDiff = '') {
  const fileTypeWeight = getFileTypeRisk(filePath);       // 0-3
  const directoryWeight = getDirectoryRisk(filePath);     // 0-3  
  const sizeWeight = getFileSizeRisk(filePath);           // 0-2
  const changeWeight = getChangeVolumeRisk(gitDiff);      // 0-4
  
  const totalScore = fileTypeWeight + directoryWeight + sizeWeight + changeWeight;
  
  return {
    filePath,
    totalScore,
    breakdown: {
      fileType: fileTypeWeight,
      directory: directoryWeight,
      fileSize: sizeWeight,
      changeVolume: changeWeight
    },
    riskLevel: getRiskLevel(totalScore)
  };
}

/**
 * 리스크 레벨 분류
 */
function getRiskLevel(score) {
  if (score >= 10) return 'CRITICAL';    // 10-12점
  if (score >= 7) return 'HIGH';         // 7-9점
  if (score >= 4) return 'MEDIUM';       // 4-6점
  if (score >= 2) return 'LOW';          // 2-3점
  return 'MINIMAL';                      // 0-1점
}

/**
 * 여러 파일의 리스크 스코어 계산
 */
function calculateBatchRiskScore(files, gitDiffs = {}) {
  return files.map(filePath => {
    const gitDiff = gitDiffs[filePath] || '';
    return calculateRiskScore(filePath, gitDiff);
  });
}

/**
 * 프로젝트 전체 리스크 분석
 */
function analyzeProjectRisk(riskScores) {
  const total = riskScores.length;
  const avgScore = riskScores.reduce((sum, r) => sum + r.totalScore, 0) / total;
  
  const distribution = {
    CRITICAL: riskScores.filter(r => r.riskLevel === 'CRITICAL').length,
    HIGH: riskScores.filter(r => r.riskLevel === 'HIGH').length,
    MEDIUM: riskScores.filter(r => r.riskLevel === 'MEDIUM').length,
    LOW: riskScores.filter(r => r.riskLevel === 'LOW').length,
    MINIMAL: riskScores.filter(r => r.riskLevel === 'MINIMAL').length
  };
  
  return {
    totalFiles: total,
    averageScore: Math.round(avgScore * 100) / 100,
    distribution,
    recommendation: getValidationRecommendation(avgScore, distribution)
  };
}

/**
 * 검증 전략 추천
 */
function getValidationRecommendation(avgScore, distribution) {
  const criticalFiles = distribution.CRITICAL;
  const highRiskFiles = distribution.HIGH;
  
  if (criticalFiles > 0) {
    return {
      strategy: 'STRICT',
      timeout: 180, // 3분
      skipTypes: [],
      message: `CRITICAL 파일 ${criticalFiles}개 감지 - 엄격한 검증 필요`
    };
  }
  
  if (highRiskFiles > 2 || avgScore > 6) {
    return {
      strategy: 'ENHANCED',
      timeout: 120, // 2분
      skipTypes: ['prettier'],
      message: `고위험 변경 감지 - 강화된 검증 실행`
    };
  }
  
  if (avgScore > 3) {
    return {
      strategy: 'STANDARD',
      timeout: 90, // 1.5분
      skipTypes: ['prettier', 'spell-check'],
      message: '표준 검증 실행'
    };
  }
  
  return {
    strategy: 'FAST',
    timeout: 60, // 1분
    skipTypes: ['prettier', 'spell-check', 'unused-imports'],
    message: '빠른 검증 모드'
  };
}

module.exports = {
  calculateRiskScore,
  calculateBatchRiskScore,
  analyzeProjectRisk,
  getValidationRecommendation,
  getRiskLevel,
  FILE_TYPE_RISKS,
  DIRECTORY_RISKS
};