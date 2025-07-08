/**
 * 🎨 UI 컴포넌트 데이터 바인딩 검증 스크립트 v1.0
 *
 * 서버 카드와 모달 컴포넌트의 데이터 바인딩 정합성 검증:
 * - ServerCard 컴포넌트 데이터 매핑 확인
 * - ServerDetailModal 데이터 표시 검증
 * - EnhancedServerModal 고급 데이터 검증
 * - 실시간 데이터 업데이트 동기화 확인
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

// 🎨 로그 스타일링
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function log(message, color = 'white') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

// 📁 컴포넌트 파일 경로
const COMPONENT_PATHS = {
  serverCard: 'src/components/dashboard/ServerCard/ServerCard.tsx',
  serverDetailModal: 'src/components/dashboard/ServerDetailModal.tsx',
  enhancedServerModal: 'src/components/dashboard/EnhancedServerModal.tsx',
  enhancedServerCard: 'src/components/dashboard/EnhancedServerCard.tsx',
  metricsDisplay: 'src/components/dashboard/ServerCard/MetricsDisplay.tsx',
  statusBadge: 'src/components/dashboard/ServerCard/StatusBadge.tsx',
};

// 🔍 파일 읽기 함수
function readComponentFile(filePath) {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`파일이 존재하지 않습니다: ${filePath}`);
    }
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    throw new Error(`파일 읽기 실패 [${filePath}]: ${error.message}`);
  }
}

// 🎯 데이터 필드 추출 함수
function extractDataFields(content) {
  const fields = {
    props: [],
    usedFields: [],
    requiredFields: [],
    optionalFields: [],
    calculations: [],
    conditionals: [],
  };

  // Props 인터페이스 추출
  const propsMatch = content.match(/interface\s+\w*Props\s*\{([^}]+)\}/s);
  if (propsMatch) {
    const propsContent = propsMatch[1];
    const propLines = propsContent.split('\n').filter(line => line.trim());

    propLines.forEach(line => {
      const propMatch = line.match(/(\w+)(\?)?\s*:\s*([^;]+)/);
      if (propMatch) {
        const [, name, optional, type] = propMatch;
        fields.props.push({
          name,
          type: type.trim(),
          optional: !!optional,
          required: !optional,
        });
      }
    });
  }

  // 서버 데이터 사용 패턴 추출
  const serverFieldPatterns = [
    /server\.(\w+)/g,
    /server\[['"](\w+)['"]\]/g,
    /\{(\w+)\}\s*=\s*server/g,
  ];

  serverFieldPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fieldName = match[1];
      if (fieldName && !fields.usedFields.includes(fieldName)) {
        fields.usedFields.push(fieldName);
      }
    }
  });

  // 조건부 렌더링 패턴 추출
  const conditionalPatterns = [
    /\{.*server\.(\w+).*\?\s*([^:]+)\s*:\s*([^}]+)\}/g,
    /server\.(\w+)\s*&&\s*([^}]+)/g,
    /if\s*\(.*server\.(\w+).*\)/g,
  ];

  conditionalPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fieldName = match[1];
      const condition = match[0];
      fields.conditionals.push({
        field: fieldName,
        condition: condition.trim(),
      });
    }
  });

  // 계산 및 변환 패턴 추출
  const calculationPatterns = [
    /(\w+)\s*=\s*.*server\.(\w+).*[+\-*/]/g,
    /Math\.\w+\(.*server\.(\w+).*\)/g,
    /server\.(\w+)\.toFixed\(/g,
    /parseFloat\(.*server\.(\w+).*\)/g,
  ];

  calculationPatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const fieldName = match[2] || match[1];
      const calculation = match[0];
      fields.calculations.push({
        field: fieldName,
        calculation: calculation.trim(),
      });
    }
  });

  // 필수/선택적 필드 분류
  fields.usedFields.forEach(field => {
    const prop = fields.props.find(p => p.name === 'server');
    if (prop) {
      // 조건부 사용 여부에 따라 분류
      const isConditional = fields.conditionals.some(c => c.field === field);
      if (isConditional) {
        fields.optionalFields.push(field);
      } else {
        fields.requiredFields.push(field);
      }
    }
  });

  return fields;
}

// 🔍 컴포넌트별 데이터 사용 분석
function analyzeComponent(componentName, filePath) {
  log(`\n🔍 ${componentName} 컴포넌트 분석 중...`, 'cyan');

  try {
    const content = readComponentFile(filePath);
    const fields = extractDataFields(content, componentName);

    log(`📊 ${componentName} 분석 결과:`, 'blue');
    log(`  - Props 정의: ${fields.props.length}개`);
    log(`  - 사용된 서버 필드: ${fields.usedFields.length}개`);
    log(`  - 필수 필드: ${fields.requiredFields.length}개`);
    log(`  - 선택적 필드: ${fields.optionalFields.length}개`);
    log(`  - 조건부 렌더링: ${fields.conditionals.length}개`);
    log(`  - 계산/변환: ${fields.calculations.length}개`);

    // 상세 필드 정보
    if (fields.usedFields.length > 0) {
      log(
        `  📋 사용된 필드: ${fields.usedFields.slice(0, 10).join(', ')}${fields.usedFields.length > 10 ? '...' : ''}`,
        'white'
      );
    }

    if (fields.requiredFields.length > 0) {
      log(`  🔴 필수 필드: ${fields.requiredFields.join(', ')}`, 'white');
    }

    if (fields.optionalFields.length > 0) {
      log(`  🟡 선택적 필드: ${fields.optionalFields.join(', ')}`, 'white');
    }

    return {
      componentName,
      filePath,
      fields,
      success: true,
    };
  } catch (error) {
    log(`❌ ${componentName} 분석 실패: ${error.message}`, 'red');
    return {
      componentName,
      filePath,
      error: error.message,
      success: false,
    };
  }
}

// 📊 데이터 호환성 검증
function validateDataCompatibility(analysisResults) {
  log('\n🔍 데이터 호환성 검증 시작...', 'magenta');

  const successfulResults = analysisResults.filter(r => r.success);
  const allUsedFields = new Set();
  const allRequiredFields = new Set();
  const componentFieldUsage = {};

  // 모든 컴포넌트에서 사용되는 필드 수집
  successfulResults.forEach(result => {
    result.fields.usedFields.forEach(field => allUsedFields.add(field));
    result.fields.requiredFields.forEach(field => allRequiredFields.add(field));
    componentFieldUsage[result.componentName] = result.fields.usedFields;
  });

  // 표준 서버 데이터 구조 (실제 API 응답 기준)
  const standardServerFields = [
    'id',
    'name',
    'hostname',
    'status',
    'cpu',
    'memory',
    'disk',
    'network',
    'uptime',
    'location',
    'environment',
    'type',
    'provider',
    'ip',
    'os',
    'alerts',
    'services',
    'specs',
    'lastUpdate',
  ];

  const results = {
    totalComponents: analysisResults.length,
    successfulComponents: successfulResults.length,
    totalUsedFields: allUsedFields.size,
    totalRequiredFields: allRequiredFields.size,
    standardFieldCoverage: 0,
    missingStandardFields: [],
    extraFields: [],
    componentConsistency: 0,
    recommendations: [],
  };

  // 표준 필드 커버리지 계산
  const coveredStandardFields = standardServerFields.filter(field =>
    allUsedFields.has(field)
  );
  results.standardFieldCoverage =
    coveredStandardFields.length / standardServerFields.length;
  results.missingStandardFields = standardServerFields.filter(
    field => !allUsedFields.has(field)
  );

  // 추가 필드 (표준에 없는 필드) 식별
  results.extraFields = [...allUsedFields].filter(
    field => !standardServerFields.includes(field)
  );

  // 컴포넌트 간 일관성 계산
  const commonFields = [...allUsedFields].filter(field => {
    const componentsUsingField = successfulResults.filter(r =>
      r.fields.usedFields.includes(field)
    );
    return componentsUsingField.length >= successfulResults.length * 0.5; // 50% 이상의 컴포넌트에서 사용
  });
  results.componentConsistency = commonFields.length / allUsedFields.size;

  // 권장사항 생성
  if (results.standardFieldCoverage < 0.8) {
    results.recommendations.push(
      '표준 서버 필드 커버리지 개선 필요 (현재 ' +
        (results.standardFieldCoverage * 100).toFixed(1) +
        '%)'
    );
  }

  if (results.missingStandardFields.length > 0) {
    results.recommendations.push(
      '누락된 표준 필드 추가 고려: ' +
        results.missingStandardFields.slice(0, 5).join(', ')
    );
  }

  if (results.componentConsistency < 0.6) {
    results.recommendations.push('컴포넌트 간 데이터 사용 일관성 개선 필요');
  }

  if (results.extraFields.length > 5) {
    results.recommendations.push(
      '비표준 필드 사용 검토 필요: ' +
        results.extraFields.slice(0, 3).join(', ')
    );
  }

  return results;
}

// 📋 결과 리포트 생성
function generateReport(analysisResults, compatibilityResults) {
  log('\n📋 UI 컴포넌트 데이터 바인딩 검증 리포트', 'bright');
  log('='.repeat(70), 'bright');

  // 전체 요약
  log(`\n🎯 전체 요약:`, 'blue');
  log(`  - 분석된 컴포넌트: ${compatibilityResults.totalComponents}개`);
  log(`  - 성공적 분석: ${compatibilityResults.successfulComponents}개`);
  log(`  - 사용된 총 필드: ${compatibilityResults.totalUsedFields}개`);
  log(`  - 필수 필드: ${compatibilityResults.totalRequiredFields}개`);

  // 표준 필드 커버리지
  log(`\n📊 표준 필드 커버리지:`, 'blue');
  log(
    `  - 커버리지: ${(compatibilityResults.standardFieldCoverage * 100).toFixed(1)}%`
  );

  const coverageColor =
    compatibilityResults.standardFieldCoverage >= 0.8
      ? 'green'
      : compatibilityResults.standardFieldCoverage >= 0.6
        ? 'yellow'
        : 'red';
  log(
    `  ${compatibilityResults.standardFieldCoverage >= 0.8 ? '✅' : compatibilityResults.standardFieldCoverage >= 0.6 ? '⚠️' : '❌'} 표준 필드 커버리지`,
    coverageColor
  );

  if (compatibilityResults.missingStandardFields.length > 0) {
    log(
      `  📋 누락된 표준 필드: ${compatibilityResults.missingStandardFields.join(', ')}`,
      'yellow'
    );
  }

  // 컴포넌트 간 일관성
  log(`\n🔄 컴포넌트 간 일관성:`, 'blue');
  log(
    `  - 일관성 점수: ${(compatibilityResults.componentConsistency * 100).toFixed(1)}%`
  );

  const consistencyColor =
    compatibilityResults.componentConsistency >= 0.7
      ? 'green'
      : compatibilityResults.componentConsistency >= 0.5
        ? 'yellow'
        : 'red';
  log(
    `  ${compatibilityResults.componentConsistency >= 0.7 ? '✅' : compatibilityResults.componentConsistency >= 0.5 ? '⚠️' : '❌'} 컴포넌트 일관성`,
    consistencyColor
  );

  // 컴포넌트별 상세 결과
  log(`\n📝 컴포넌트별 상세 결과:`, 'blue');
  analysisResults.forEach(result => {
    if (result.success) {
      const fieldCount = result.fields.usedFields.length;
      const requiredCount = result.fields.requiredFields.length;
      log(
        `  ✅ ${result.componentName}: ${fieldCount}개 필드 (필수: ${requiredCount}개)`,
        'green'
      );
    } else {
      log(`  ❌ ${result.componentName}: 분석 실패 - ${result.error}`, 'red');
    }
  });

  // 권장사항
  if (compatibilityResults.recommendations.length > 0) {
    log(`\n💡 권장사항:`, 'yellow');
    compatibilityResults.recommendations.forEach((rec, index) => {
      log(`  ${index + 1}. ${rec}`, 'white');
    });
  }

  // 결론
  const overallScore =
    (compatibilityResults.successfulComponents /
      compatibilityResults.totalComponents) *
      0.3 +
    compatibilityResults.standardFieldCoverage * 0.4 +
    compatibilityResults.componentConsistency * 0.3;

  log(
    `\n🎯 전체 점수: ${(overallScore * 100).toFixed(1)}%`,
    overallScore >= 0.8 ? 'green' : overallScore >= 0.6 ? 'yellow' : 'red'
  );

  if (overallScore >= 0.9) {
    log(`\n🎉 결론: UI 컴포넌트 데이터 바인딩이 우수합니다!`, 'green');
  } else if (overallScore >= 0.7) {
    log(`\n✅ 결론: UI 컴포넌트 데이터 바인딩이 양호합니다.`, 'green');
  } else if (overallScore >= 0.5) {
    log(`\n⚠️ 결론: UI 컴포넌트 데이터 바인딩에 개선이 필요합니다.`, 'yellow');
  } else {
    log(
      `\n❌ 결론: UI 컴포넌트 데이터 바인딩에 심각한 문제가 있습니다.`,
      'red'
    );
  }
}

// 🚀 메인 실행 함수
async function main() {
  log('🎨 UI 컴포넌트 데이터 바인딩 검증 시작', 'bright');
  log('━'.repeat(70), 'bright');
  log(`⏰ 시작 시간: ${new Date().toLocaleString()}\n`);

  const analysisResults = [];

  // 각 컴포넌트 분석
  for (const [componentName, filePath] of Object.entries(COMPONENT_PATHS)) {
    const result = analyzeComponent(componentName, filePath);
    analysisResults.push(result);
  }

  // 데이터 호환성 검증
  const compatibilityResults = validateDataCompatibility(analysisResults);

  // 결과 리포트 생성
  generateReport(analysisResults, compatibilityResults);

  log(`\n⏰ 완료 시간: ${new Date().toLocaleString()}`, 'bright');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  main,
  analyzeComponent,
  validateDataCompatibility,
  generateReport,
};
