const fs = require('fs');
const path = require('path');

function analyzeDocsStructure() {
    const docsPath = path.join(process.cwd(), 'docs');
    
    // 전체 분석 결과
    const analysis = {
        totalFiles: 0,
        totalDirectories: 0,
        filesByDirectory: {},
        duplicateFilenames: {},
        fileSizes: {
            under1KB: 0,
            between1to10KB: 0,
            between10to50KB: 0,
            over50KB: 0
        },
        todoFiles: [],
        recentFiles: []
    };

    // 재귀적으로 디렉토리 스캔
    function scanDirectory(dirPath, relativePath = '') {
        if (!fs.existsSync(dirPath)) return;
        
        const items = fs.readdirSync(dirPath);
        const dirFiles = [];
        
        items.forEach(item => {
            const itemPath = path.join(dirPath, item);
            const relativeItemPath = path.join(relativePath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                analysis.totalDirectories++;
                scanDirectory(itemPath, relativeItemPath);
            } else if (item.endsWith('.md')) {
                analysis.totalFiles++;
                dirFiles.push(item);
                
                // 파일 크기 분석
                const sizeKB = stat.size / 1024;
                if (sizeKB < 1) analysis.fileSizes.under1KB++;
                else if (sizeKB < 10) analysis.fileSizes.between1to10KB++;
                else if (sizeKB < 50) analysis.fileSizes.between10to50KB++;
                else analysis.fileSizes.over50KB++;
                
                // 중복 파일명 체크
                const basename = path.basename(item);
                if (!analysis.duplicateFilenames[basename]) {
                    analysis.duplicateFilenames[basename] = [];
                }
                analysis.duplicateFilenames[basename].push({
                    path: relativeItemPath,
                    size: stat.size
                });
                
                // 최근 수정 파일
                analysis.recentFiles.push({
                    path: relativeItemPath,
                    mtime: stat.mtime,
                    size: stat.size
                });
                
                // TODO/FIXME 파일 체크
                try {
                    const content = fs.readFileSync(itemPath, 'utf-8');
                    if (/TODO|FIXME|업데이트|outdated|deprecated/i.test(content)) {
                        analysis.todoFiles.push(relativeItemPath);
                    }
                } catch (err) {
                    // 파일 읽기 실패 시 무시
                }
            }
        });
        
        if (dirFiles.length > 0) {
            analysis.filesByDirectory[relativePath || 'docs'] = dirFiles.length;
        }
    }
    
    scanDirectory(docsPath);
    
    // 중복 파일명에서 단일 파일 제거
    Object.keys(analysis.duplicateFilenames).forEach(filename => {
        if (analysis.duplicateFilenames[filename].length === 1) {
            delete analysis.duplicateFilenames[filename];
        }
    });
    
    // 최근 파일 정렬 (최신순)
    analysis.recentFiles.sort((a, b) => b.mtime - a.mtime);
    analysis.recentFiles = analysis.recentFiles.slice(0, 10);
    
    return analysis;
}

// 분석 실행
const analysis = analyzeDocsStructure();

console.log('=== docs 디렉토리 전체 구조 분석 ===\n');

console.log('📊 전체 통계:');
console.log(`- 총 파일 수: ${analysis.totalFiles}개`);
console.log(`- 총 디렉토리 수: ${analysis.totalDirectories}개\n`);

console.log('📁 디렉토리별 파일 수:');
Object.entries(analysis.filesByDirectory)
    .sort((a, b) => b[1] - a[1])
    .forEach(([dir, count]) => {
        console.log(`  ${dir}: ${count}개`);
    });
console.log();

console.log('🔍 중복 파일명:');
Object.entries(analysis.duplicateFilenames).forEach(([filename, files]) => {
    console.log(`  ${filename}:`);
    files.forEach(file => {
        console.log(`    - ${file.path} (${Math.round(file.size/1024)}KB)`);
    });
    console.log();
});

console.log('📊 파일 크기 분포:');
console.log(`  - 1KB 미만: ${analysis.fileSizes.under1KB}개`);
console.log(`  - 1-10KB: ${analysis.fileSizes.between1to10KB}개`);
console.log(`  - 10-50KB: ${analysis.fileSizes.between10to50KB}개`);
console.log(`  - 50KB 이상: ${analysis.fileSizes.over50KB}개\n`);

console.log('⚠️ 업데이트 필요 파일 (TODO/FIXME/업데이트 포함):');
analysis.todoFiles.slice(0, 10).forEach(file => {
    console.log(`  - ${file}`);
});
if (analysis.todoFiles.length > 10) {
    console.log(`  ... 총 ${analysis.todoFiles.length}개`);
}
console.log();

console.log('📅 최근 수정된 파일 (최신 10개):');
analysis.recentFiles.forEach(file => {
    const date = file.mtime.toISOString().slice(0, 16).replace('T', ' ');
    console.log(`  ${date} - ${file.path} (${Math.round(file.size/1024)}KB)`);
});