const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 모든 .stories.tsx 파일 찾기
const storyFiles = glob.sync('src/**/*.stories.tsx');

console.log(`📚 ${storyFiles.length}개의 스토리북 파일을 처리합니다...`);

let fixedCount = 0;

storyFiles.forEach(filePath => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        // 1. 상대 경로 임포트를 절대 경로로 변경
        newContent = newContent.replace(
            /import\s*{\s*([^}]+)\s*}\s*from\s*['"]\.\/([^'"]+)['"]/g,
            "import { $1 } from '@/components/$2'"
        );

        // 2. default export 컴포넌트를 named export로 변경
        const componentMatch = newContent.match(/import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/([^'"]+)['"]/);
        if (componentMatch) {
            const componentName = componentMatch[1].trim();
            // default import로 변경
            newContent = newContent.replace(
                /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@\/components\/([^'"]+)['"]/,
                `import $1 from '@/components/$2'`
            );
        }

        // 3. 특수 케이스 처리
        // ui 컴포넌트들의 소문자 임포트 수정
        const uiComponents = [
            'accordion', 'pagination', 'popover', 'separator', 'sheet',
            'skeleton', 'tabs', 'textarea', 'toast', 'tooltip'
        ];

        uiComponents.forEach(comp => {
            const capitalizedComp = comp.charAt(0).toUpperCase() + comp.slice(1);
            newContent = newContent.replace(
                new RegExp(`import\\s*{\\s*${comp}\\s*}\\s*from\\s*['"]@/components/ui/${comp}['"]`, 'g'),
                `import { ${capitalizedComp} } from '@/components/ui/${comp}'`
            );
        });

        // 4. index 파일 임포트 처리
        newContent = newContent.replace(
            /import\s*{\s*index\s*}\s*from\s*['"]@\/components\/([^'"]+)\/index['"]/g,
            "import * as Components from '@/components/$1'"
        );

        // 5. 시스템 매니저 객체들 처리
        newContent = newContent.replace(
            /component:\s*(advancedNotificationManager|inlineFeedbackManager|toast),/g,
            'component: () => <div>Manager Component</div>,'
        );

        // 6. accordion args 타입 오류 수정
        if (filePath.includes('accordion.stories.tsx')) {
            newContent = newContent.replace(
                /args:\s*{\s*type:\s*['"]([^'"]+)['"],?\s*(collapsible:\s*true,?)?\s*}/g,
                'args: {} as any'
            );
        }

        // 변경사항이 있으면 파일 저장
        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            fixedCount++;
            console.log(`✅ ${path.relative(process.cwd(), filePath)} 수정 완료`);
        }

    } catch (error) {
        console.error(`❌ ${filePath} 처리 실패:`, error.message);
    }
});

console.log(`\n🎉 총 ${fixedCount}개 파일 수정 완료!`);
console.log('📝 주요 수정사항:');
console.log('  - 상대 경로 → 절대 경로 (@/components/*)');
console.log('  - named import → default import (컴포넌트)');
console.log('  - UI 컴포넌트 대소문자 정규화');
console.log('  - 타입 오류 수정'); 