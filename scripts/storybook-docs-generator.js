#!/usr/bin/env node

/**
 * 스토리북 문서 자동 생성기
 * 
 * 컴포넌트 파일을 스캔하여 자동으로 스토리 파일을 생성합니다.
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = path.join(__dirname, '../src/components');
const STORIES_TEMPLATE = `/**
 * {{COMPONENT_NAME}} Stories
 * 
 * {{COMPONENT_DESCRIPTION}}
 */

import type { Meta, StoryObj } from '@storybook/nextjs';
import { {{COMPONENT_NAME}} } from './{{COMPONENT_FILE}}';

const meta: Meta<typeof {{COMPONENT_NAME}}> = {
  title: '{{CATEGORY}}/{{COMPONENT_NAME}}',
  component: {{COMPONENT_NAME}},
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: \`
**{{COMPONENT_NAME}} Component**

{{COMPONENT_DESCRIPTION}}

### 주요 기능
- 기본 기능 설명
- 추가 기능 설명

### 사용 예시
\\\`\\\`\\\`tsx
<{{COMPONENT_NAME}} />
\\\`\\\`\\\`
        \`,
      },
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  name: '기본 상태',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '{{COMPONENT_NAME}}의 기본 상태입니다.',
      },
    },
  },
};

export const Interactive: Story = {
  name: '인터랙티브',
  args: {},
  parameters: {
    docs: {
      description: {
        story: '사용자 상호작용을 테스트할 수 있는 {{COMPONENT_NAME}}입니다.',
      },
    },
  },
};
`;

/**
 * 컴포넌트 파일에서 정보 추출
 */
function extractComponentInfo(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');

        // 컴포넌트 이름 추출
        const componentMatch = content.match(/export\s+(?:const|function)\s+(\w+)/);
        const componentName = componentMatch ? componentMatch[1] : path.basename(filePath, '.tsx');

        // JSDoc 주석에서 설명 추출
        const descriptionMatch = content.match(/\/\*\*\s*\n\s*\*\s*(.+?)\s*\n/);
        const description = descriptionMatch ? descriptionMatch[1] : `${componentName} 컴포넌트`;

        // 카테고리 결정
        const relativePath = path.relative(COMPONENTS_DIR, filePath);
        const pathParts = relativePath.split(path.sep);
        let category = 'Components';

        if (pathParts.includes('ui')) category = '🎨 UI Components';
        else if (pathParts.includes('ai')) category = '🤖 AI Components';
        else if (pathParts.includes('dashboard')) category = '📊 Dashboard';
        else if (pathParts.includes('system')) category = '⚙️ System';
        else if (pathParts.includes('shared')) category = '🔗 Shared';

        return {
            componentName,
            description,
            category,
            fileName: path.basename(filePath, '.tsx')
        };
    } catch (error) {
        console.error(`컴포넌트 정보 추출 실패: ${filePath}`, error.message);
        return null;
    }
}

/**
 * 스토리 파일 생성
 */
function generateStoryFile(componentPath, componentInfo) {
    const storyPath = componentPath.replace('.tsx', '.stories.tsx');

    // 이미 스토리 파일이 있으면 건너뛰기
    if (fs.existsSync(storyPath)) {
        console.log(`⏭️  스토리 파일 이미 존재: ${path.relative(process.cwd(), storyPath)}`);
        return false;
    }

    const storyContent = STORIES_TEMPLATE
        .replace(/{{COMPONENT_NAME}}/g, componentInfo.componentName)
        .replace(/{{COMPONENT_DESCRIPTION}}/g, componentInfo.description)
        .replace(/{{CATEGORY}}/g, componentInfo.category)
        .replace(/{{COMPONENT_FILE}}/g, componentInfo.fileName);

    try {
        fs.writeFileSync(storyPath, storyContent, 'utf8');
        console.log(`✅ 스토리 파일 생성: ${path.relative(process.cwd(), storyPath)}`);
        return true;
    } catch (error) {
        console.error(`❌ 스토리 파일 생성 실패: ${storyPath}`, error.message);
        return false;
    }
}

/**
 * 컴포넌트 파일 스캔
 */
function scanComponents(dir) {
    const results = [];

    try {
        const items = fs.readdirSync(dir);

        for (const item of items) {
            const fullPath = path.join(dir, item);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                // 재귀적으로 하위 디렉토리 스캔
                results.push(...scanComponents(fullPath));
            } else if (item.endsWith('.tsx') && !item.includes('.stories.') && !item.includes('.test.')) {
                // 컴포넌트 파일만 선택 (스토리, 테스트 파일 제외)
                results.push(fullPath);
            }
        }
    } catch (error) {
        console.error(`디렉토리 스캔 실패: ${dir}`, error.message);
    }

    return results;
}

/**
 * 메인 실행 함수
 */
function main() {
    console.log('🚀 스토리북 문서 자동 생성기 시작\n');

    // 컴포넌트 파일 스캔
    console.log('📂 컴포넌트 파일 스캔 중...');
    const componentFiles = scanComponents(COMPONENTS_DIR);
    console.log(`📁 총 ${componentFiles.length}개 컴포넌트 파일 발견\n`);

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // 각 컴포넌트에 대해 스토리 생성
    for (const componentPath of componentFiles) {
        const componentInfo = extractComponentInfo(componentPath);

        if (!componentInfo) {
            errorCount++;
            continue;
        }

        const created = generateStoryFile(componentPath, componentInfo);
        if (created) {
            createdCount++;
        } else {
            skippedCount++;
        }
    }

    // 결과 요약
    console.log('\n📊 생성 결과 요약:');
    console.log(`✅ 생성됨: ${createdCount}개`);
    console.log(`⏭️  건너뜀: ${skippedCount}개`);
    console.log(`❌ 오류: ${errorCount}개`);
    console.log(`📁 총 처리: ${componentFiles.length}개`);

    if (createdCount > 0) {
        console.log('\n🎉 스토리북 문서 생성 완료!');
        console.log('💡 다음 명령어로 스토리북을 실행하세요:');
        console.log('   npm run storybook');
    } else {
        console.log('\n✨ 모든 컴포넌트에 이미 스토리가 있습니다.');
    }
}

// 스크립트 실행
if (require.main === module) {
    main();
}

module.exports = {
    scanComponents,
    extractComponentInfo,
    generateStoryFile
}; 