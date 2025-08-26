#!/usr/bin/env tsx
/**
 * Copilot Report Generator
 * 번호 증가식 디렉토리(`reports/copilot/000X-*`) 생성 + INDEX.json 업데이트
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';
import crypto from 'crypto';

interface IndexEntry { id: number; dir: string; category: string; date: string; title: string; source: string; tags: string[]; summary: string; }
interface IndexFile { schemaVersion: number; lastUpdated: string; reports: IndexEntry[]; }

const ROOT = path.resolve(process.cwd(), 'reports', 'copilot');
const INDEX_PATH = path.join(ROOT, 'INDEX.json');

function loadIndex(): IndexFile {
  if (!existsSync(INDEX_PATH)) {
    return { schemaVersion: 1, lastUpdated: new Date().toISOString(), reports: [] };
  }
  return JSON.parse(readFileSync(INDEX_PATH, 'utf-8')) as IndexFile;
}

function saveIndex(index: IndexFile) {
  index.lastUpdated = new Date().toISOString();
  writeFileSync(INDEX_PATH, JSON.stringify(index, null, 2));
}

function slugify(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
}

function nextId(index: IndexFile) {
  return index.reports.reduce((m, r) => Math.max(m, r.id), 0) + 1;
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.length === 0) {
    console.log('Usage: npm run copilot:report -- <title> [--category architecture] [--summary "..."] [--tags a,b,c]');
    process.exit(0);
  }
  const title = args[0];
  const category = (args.find(a => a.startsWith('--category='))?.split('=')[1]) || 'general';
  const summary = (args.find(a => a.startsWith('--summary='))?.split('=')[1]) || '요약 없음';
  const tags = (args.find(a => a.startsWith('--tags='))?.split('=')[1])?.split(',').filter(Boolean) || [];
  const date = new Date().toISOString().slice(0,10);

  const index = loadIndex();
  const id = nextId(index);
  const idStr = String(id).padStart(4, '0');
  const slug = slugify(title);
  const dirName = `${idStr}-${slug}`;
  const dirPath = path.join(ROOT, dirName);
  if (!existsSync(dirPath)) mkdirSync(dirPath, { recursive: true });

  const sourceFileName = `${slug}-${date}.md`;
  const contentPath = path.join(dirPath, 'README.md');

  const token = crypto.randomBytes(4).toString('hex');
  const header = `# ${idStr} - ${title} (${date})\n\nCategory: ${category}  \nTags: ${tags.join(', ') || 'none'}  \nRef: ${token}\n\n## Summary\n\n${summary}\n\n## Notes\n\n(내용 작성)\n`;
  writeFileSync(contentPath, header);

  const entry: IndexEntry = { id, dir: dirName, category, date, title, source: sourceFileName, tags, summary };
  index.reports.push(entry);
  saveIndex(index);
  console.log(`✅ Created Copilot report ${dirName}`);
}

main();
