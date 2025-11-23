const fs = require('fs');
const path = require('path');

const replacements = [
  { from: /@\/lib\/utils'/g, to: "@/lib/utils/utils'" },
  { from: /@\/lib\/utils"/g, to: '@/lib/utils/utils"' },
  { from: /@\/lib\/time'/g, to: "@/lib/utils/time'" },
  { from: /@\/lib\/time"/g, to: '@/lib/utils/time"' },
  { from: /@\/lib\/type-converters'/g, to: "@/lib/utils/type-converters'" },
  { from: /@\/lib\/type-converters"/g, to: '@/lib/utils/type-converters"' },
  { from: /@\/lib\/icon-mapping'/g, to: "@/lib/utils/icon-mapping'" },
  { from: /@\/lib\/icon-mapping"/g, to: '@/lib/utils/icon-mapping"' },
  { from: /@\/lib\/project-meta'/g, to: "@/lib/utils/project-meta'" },
  { from: /@\/lib\/project-meta"/g, to: '@/lib/utils/project-meta"' },
  { from: /@\/lib\/mcp-handler'/g, to: "@/lib/utils/mcp-handler'" },
  { from: /@\/lib\/mcp-handler"/g, to: '@/lib/utils/mcp-handler"' },
  {
    from: /@\/lib\/bundle-optimization'/g,
    to: "@/lib/utils/bundle-optimization'",
  },
  {
    from: /@\/lib\/bundle-optimization"/g,
    to: '@/lib/utils/bundle-optimization"',
  },
];

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== 'dist') {
        walkDir(filePath, callback);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      callback(filePath);
    }
  });
}

let changedCount = 0;

walkDir('src', (file) => {
  let content = fs.readFileSync(file, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(file, content, 'utf8');
    changedCount++;
    console.log(`Updated: ${file}`);
  }
});

console.log(`\nTotal files updated: ${changedCount}`);
