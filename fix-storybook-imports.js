const fs = require('fs');
const path = require('path');

function findStorybookFiles(dir) {
    let results = [];
    const list = fs.readdirSync(dir);

    list.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat && stat.isDirectory()) {
            results = results.concat(findStorybookFiles(filePath));
        } else if (file.endsWith('.stories.tsx')) {
            results.push(filePath);
        }
    });

    return results;
}

function fixImports(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const updatedContent = content.replace(
            /from ['"]@storybook\/nextjs['"]/g,
            "from '@storybook/react'"
        );

        if (content !== updatedContent) {
            fs.writeFileSync(filePath, updatedContent, 'utf8');
            console.log(`✅ Fixed: ${filePath}`);
            return true;
        } else {
            console.log(`⏭️  Skip: ${filePath} (already correct)`);
            return false;
        }
    } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
        return false;
    }
}

// 메인 실행
console.log('🔧 Fixing Storybook imports...\n');

const srcDir = path.join(__dirname, 'src');
const storybookFiles = findStorybookFiles(srcDir);

console.log(`📁 Found ${storybookFiles.length} storybook files:\n`);

let fixedCount = 0;
storybookFiles.forEach(file => {
    if (fixImports(file)) {
        fixedCount++;
    }
});

console.log(`\n🎉 Completed! Fixed ${fixedCount} files out of ${storybookFiles.length} total files.`); 