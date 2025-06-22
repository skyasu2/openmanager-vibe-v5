const fs = require('fs');
const path = require('path');

// 재귀적으로 디렉토리 탐색하여 .stories.tsx 파일 찾기
function findStoryFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        findStoryFiles(filePath, fileList);
      }
    } else if (file.endsWith('.stories.tsx')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const storyFiles = findStoryFiles('./src');
console.log(`��� ${storyFiles.length}개의 스토리북 파일을 처리합니다...`);

let fixedCount = 0;

storyFiles.forEach(filePath => {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    let newContent = content;
    
    // Named import를 default import로 변경
    // 예: import { ComponentName } from './ComponentName' → import ComponentName from './ComponentName'
    newContent = newContent.replace(
      /import\s*{\s*([A-Za-z][A-Za-z0-9_]*)\s*}\s*from\s*['"]\.\/([A-Za-z][A-Za-z0-9_]*)['"]/g,
      'import $1 from \'./$2\''
    );
    
    if (content !== newContent) {
      fs.writeFileSync(filePath, newContent, 'utf8');
      console.log(`✅ 수정됨: ${filePath}`);
      fixedCount++;
    }
  } catch (error) {
    console.error(`❌ 오류 (${filePath}):`, error.message);
  }
});

console.log(`\n��� 완료! ${fixedCount}개 파일이 수정되었습니다.`);
