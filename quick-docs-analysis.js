const fs = require('fs');
const path = require('path');

function getFileSizeKB(filePath) {
    try {
        const stats = fs.statSync(filePath);
        return Math.round(stats.size / 1024);
    } catch (error) {
        return 0;
    }
}

function analyzeSpecificFiles() {
    const rootDir = process.cwd();
    
    // 중복 파일들 확인
    const duplicateFiles = [
        'docs/system-architecture.md',
        'docs/design/current/system-architecture.md', 
        'docs/design/product/current/system-architecture.md'
    ];
    
    console.log('🔍 중복 파일 분석:');
    console.log('system-architecture.md:');
    duplicateFiles.forEach(file => {
        const fullPath = path.join(rootDir, file);
        const size = getFileSizeKB(fullPath);
        console.log(`  - ${file} (${size}KB)`);
    });
    
    // 주요 디렉토리 파일 수 확인
    const directories = [
        'docs',
        'docs/guides',
        'docs/development', 
        'docs/mcp',
        'docs/ai-tools',
        'docs/deployment',
        'docs/design',
        'docs/archive'
    ];
    
    console.log('\n📁 디렉토리별 마크다운 파일 수:');
    directories.forEach(dir => {
        const fullPath = path.join(rootDir, dir);
        try {
            if (fs.existsSync(fullPath)) {
                const files = fs.readdirSync(fullPath);
                const mdFiles = files.filter(f => f.endsWith('.md'));
                console.log(`  ${dir}: ${mdFiles.length}개`);
            }
        } catch (error) {
            console.log(`  ${dir}: 접근 불가`);
        }
    });
    
    // 전체 docs 파일 수 계산
    function countMdFiles(dirPath) {
        let count = 0;
        try {
            if (fs.existsSync(dirPath)) {
                const items = fs.readdirSync(dirPath);
                items.forEach(item => {
                    const itemPath = path.join(dirPath, item);
                    const stat = fs.statSync(itemPath);
                    if (stat.isDirectory()) {
                        count += countMdFiles(itemPath);
                    } else if (item.endsWith('.md')) {
                        count++;
                    }
                });
            }
        } catch (error) {
            // 무시
        }
        return count;
    }
    
    const totalMdFiles = countMdFiles(path.join(rootDir, 'docs'));
    console.log(`\n📊 총 마크다운 파일 수: ${totalMdFiles}개`);
}

analyzeSpecificFiles();