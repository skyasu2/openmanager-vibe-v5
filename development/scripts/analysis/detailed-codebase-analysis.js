#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 상세 코드베이스 분석 시작...\n');

// 1. 중복 가능성이 높은 컴포넌트 분석
function analyzeDuplicateComponents() {
  console.log('📋 중복 컴포넌트 상세 분석...\n');
  
  const duplicateAnalysis = [
    {
      name: 'AISidebar',
      files: [
        'src/components/ai/AISidebar.tsx',
        'src/modules/ai-sidebar/components/AISidebar.tsx'
      ]
    },
    {
      name: 'MessageBubble',
      files: [
        'src/components/ai/MessageBubble.tsx',
        'src/modules/ai-sidebar/components/MessageBubble.tsx'
      ]
    },
    {
      name: 'ServerCard',
      files: [
        'src/components/dashboard/ServerCard/ServerCard.tsx',
        'src/components/dashboard/ServerCard.tsx'
      ]
    },
    {
      name: 'ActionButtons',
      files: [
        'src/components/dashboard/ServerCard/ActionButtons.tsx',
        'src/modules/ai-sidebar/components/ActionButtons.tsx'
      ]
    },
    {
      name: 'ContextManager',
      files: [
        'src/modules/ai-agent/processors/ContextManager.ts',
        'src/services/ai-agent/ContextManager.ts'
      ]
    },
    {
      name: 'IntentClassifier',
      files: [
        'src/modules/ai-agent/processors/IntentClassifier.ts',
        'src/services/ai\IntentClassifier.ts'
      ]
    }
  ];

  duplicateAnalysis.forEach(({ name, files }) => {
    console.log(`🔍 ${name} 중복 분석:`);
    
    files.forEach((file, index) => {
      if (fs.existsSync(file)) {
        const stats = fs.statSync(file);
        const content = fs.readFileSync(file, 'utf8');
        const lines = content.split('\n').length;
        const hasDefaultExport = content.includes('export default');
        const hasNamedExport = /export\s+(?:const|function|class)\s+\w+/.test(content);
        const imports = (content.match(/^import.*from/gm) || []).length;
        
        console.log(`   ${index + 1}. ${file}`);
        console.log(`      📏 크기: ${(stats.size / 1024).toFixed(1)}KB`);
        console.log(`      📄 줄 수: ${lines}줄`);
        console.log(`      📦 Export: ${hasDefaultExport ? 'Default' : ''} ${hasNamedExport ? 'Named' : ''}`);
        console.log(`      📥 Imports: ${imports}개`);
      } else {
        console.log(`   ${index + 1}. ${file} ❌ 파일 없음`);
      }
    });
    console.log();
  });
}

// 2. 사용되지 않는 API 라우트 분석
function analyzeUnusedAPIRoutes() {
  console.log('🌐 API 라우트 사용 분석...\n');
  
  const apiDir = 'src/app/api';
  if (!fs.existsSync(apiDir)) {
    console.log('❌ API 디렉토리를 찾을 수 없습니다.');
    return;
  }
  
  const apiRoutes = [];
  
  function findAPIRoutes(dir, prefix = '') {
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        const route = item.startsWith('[') && item.endsWith(']') 
          ? `${prefix}/${item.slice(1, -1)}` 
          : `${prefix}/${item}`;
        findAPIRoutes(fullPath, route);
      } else if (item === 'route.ts' || item === 'route.js') {
        apiRoutes.push({
          path: `${prefix}`,
          file: fullPath,
          size: stat.size
        });
      }
    }
  }
  
  findAPIRoutes(apiDir);
  
  console.log(`📊 총 ${apiRoutes.length}개 API 라우트 발견\n`);
  
  // API 사용 여부 확인 (간단한 검색)
  const srcFiles = getAllFiles('src', ['.tsx', '.ts', '.js']);
  const usageCount = {};
  
  apiRoutes.forEach(route => {
    const apiPath = `/api${route.path}`;
    let usageFound = 0;
    
    srcFiles.forEach(file => {
      if (file.includes('/api/')) return; // API 파일 자체는 제외
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        const regex = new RegExp(`['"\`]${apiPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}['"\`]`, 'g');
        const matches = content.match(regex);
        if (matches) {
          usageFound += matches.length;
        }
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    });
    
    usageCount[apiPath] = usageFound;
  });
  
  // 사용되지 않는 API 라우트
  const unusedAPIs = apiRoutes.filter(route => usageCount[`/api${route.path}`] === 0);
  const lightlyUsedAPIs = apiRoutes.filter(route => {
    const usage = usageCount[`/api${route.path}`];
    return usage > 0 && usage <= 2;
  });
  
  console.log(`❌ 사용되지 않는 API (${unusedAPIs.length}개):`);
  unusedAPIs.forEach(route => {
    console.log(`   /api${route.path} (${(route.size / 1024).toFixed(1)}KB)`);
  });
  
  console.log(`\n⚠️ 거의 사용되지 않는 API (${lightlyUsedAPIs.length}개):`);
  lightlyUsedAPIs.forEach(route => {
    const usage = usageCount[`/api${route.path}`];
    console.log(`   /api${route.path} (사용: ${usage}회)`);
  });
  
  console.log();
}

// 3. 사용되지 않는 유틸리티/라이브러리 분석
function analyzeUnusedUtilities() {
  console.log('🛠️ 유틸리티 사용 분석...\n');
  
  const utilDirs = [
    'src/lib',
    'src/utils',
    'src/services',
    'src/hooks'
  ];
  
  utilDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    console.log(`📁 ${dir} 분석:`);
    
    const files = getAllFiles(dir, ['.ts', '.tsx', '.js']);
    const srcFiles = getAllFiles('src', ['.tsx', '.ts', '.js']);
    
    files.forEach(file => {
      const relativePath = path.relative('src', file);
      const basename = path.basename(file, path.extname(file));
      
      // import 문에서 이 파일을 참조하는지 확인
      let usageFound = 0;
      
      srcFiles.forEach(srcFile => {
        if (srcFile === file) return; // 자기 자신은 제외
        
        try {
          const content = fs.readFileSync(srcFile, 'utf8');
          
          // 상대 경로와 절대 경로 모두 확인
          const patterns = [
            new RegExp(`from\\s+['"\`].*${basename}['"\`]`, 'g'),
            new RegExp(`import\\s+.*from\\s+['"\`].*${relativePath.replace(/\\/g, '/')}`, 'g'),
            new RegExp(`import\\s+.*from\\s+['"\`]@/.*${basename}['"\`]`, 'g')
          ];
          
          patterns.forEach(pattern => {
            const matches = content.match(pattern);
            if (matches) {
              usageFound += matches.length;
            }
          });
        } catch (error) {
          // 파일 읽기 오류 무시
        }
      });
      
      const stats = fs.statSync(file);
      const isUnused = usageFound === 0;
      
      console.log(`   ${isUnused ? '❌' : '✅'} ${relativePath} (${(stats.size / 1024).toFixed(1)}KB, 사용: ${usageFound}회)`);
    });
    
    console.log();
  });
}

// 4. 불필요한 의존성 분석
function analyzeUnusedDependencies() {
  console.log('📦 package.json 의존성 분석...\n');
  
  if (!fs.existsSync('package.json')) {
    console.log('❌ package.json을 찾을 수 없습니다.');
    return;
  }
  
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const srcFiles = getAllFiles('src', ['.tsx', '.ts', '.js', '.json']);
  const configFiles = [
    'next.config.ts',
    'tailwind.config.ts',
    'postcss.config.mjs',
    'vitest.config.ts',
    'playwright.config.ts'
  ];
  
  const allFiles = [...srcFiles, ...configFiles.filter(f => fs.existsSync(f))];
  
  const usedDependencies = new Set();
  
  Object.keys(dependencies).forEach(dep => {
    let found = false;
    
    allFiles.forEach(file => {
      if (found) return;
      
      try {
        const content = fs.readFileSync(file, 'utf8');
        
        // import/require 문에서 확인
        const patterns = [
          new RegExp(`from\\s+['"\`]${dep}['"\`]`, 'g'),
          new RegExp(`require\\s*\\(\\s*['"\`]${dep}['"\`]\\s*\\)`, 'g'),
          new RegExp(`import\\s+['"\`]${dep}['"\`]`, 'g')
        ];
        
        patterns.forEach(pattern => {
          if (content.match(pattern)) {
            found = true;
            usedDependencies.add(dep);
          }
        });
      } catch (error) {
        // 파일 읽기 오류 무시
      }
    });
  });
  
  const unusedDeps = Object.keys(dependencies).filter(dep => !usedDependencies.has(dep));
  
  console.log(`✅ 사용되는 의존성: ${usedDependencies.size}개`);
  console.log(`❌ 사용되지 않는 의존성: ${unusedDeps.length}개`);
  
  if (unusedDeps.length > 0) {
    console.log('\n🗑️ 제거 가능한 의존성:');
    unusedDeps.forEach(dep => {
      console.log(`   - ${dep}`);
    });
  }
  
  console.log();
}

// 헬퍼 함수
function getAllFiles(dir, extensions) {
  const files = [];
  
  if (!fs.existsSync(dir)) return files;
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      if (!item.startsWith('.') && item !== 'node_modules') {
        files.push(...getAllFiles(fullPath, extensions));
      }
    } else if (extensions.some(ext => item.endsWith(ext))) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// 메인 실행
try {
  analyzeDuplicateComponents();
  analyzeUnusedAPIRoutes();
  analyzeUnusedUtilities();
  analyzeUnusedDependencies();
  
  console.log('✅ 상세 코드베이스 분석 완료!\n');
  console.log('📋 권장사항:');
  console.log('1. 중복 컴포넌트 통합 또는 제거');
  console.log('2. 사용되지 않는 API 라우트 제거');
  console.log('3. 미사용 유틸리티 정리');
  console.log('4. 불필요한 의존성 제거');
  
} catch (error) {
  console.error('❌ 분석 중 오류:', error.message);
  process.exit(1);
} 