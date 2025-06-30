#!/usr/bin/env node

/**
 * 📚 스토리북 헬스체크 스크립트
 * 2025-06-30 09:05:27 (KST) 기준 최신 업데이트
 */

import fs from 'fs';
import http from 'http';
import path from 'path';

const STORYBOOK_PORT = 6006;
const TIMEOUT = 5000;

class StorybookHealthCheck {
  constructor() {
    this.results = {
      server: false,
      stories: [],
      totalStories: 0,
      errors: [],
      timestamp: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
    };
  }

  // 스토리북 서버 상태 확인
  async checkServer() {
    return new Promise(resolve => {
      const req = http.get(`http://localhost:${STORYBOOK_PORT}`, res => {
        this.results.server = res.statusCode === 200;
        resolve(this.results.server);
      });

      req.on('error', err => {
        this.results.errors.push(`서버 연결 실패: ${err.message}`);
        resolve(false);
      });

      req.setTimeout(TIMEOUT, () => {
        req.destroy();
        this.results.errors.push('서버 응답 시간 초과');
        resolve(false);
      });
    });
  }

  // 스토리 파일들 검사
  async checkStories() {
    const storiesDir = path.join(process.cwd(), 'src');
    const storyFiles = this.findStoryFiles(storiesDir);

    this.results.totalStories = storyFiles.length;

    for (const file of storyFiles) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const isValid = this.validateStoryFile(content);

        this.results.stories.push({
          file: path.relative(process.cwd(), file),
          valid: isValid,
          hasTests: content.includes('test'),
          hasDocs: content.includes('autodocs') || content.includes('docs'),
          lastModified: fs.statSync(file).mtime,
        });
      } catch (error) {
        this.results.errors.push(
          `스토리 파일 검사 실패 ${file}: ${error.message}`
        );
      }
    }
  }

  // 스토리 파일 찾기
  findStoryFiles(dir, files = []) {
    const items = fs.readdirSync(dir);

    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);

      if (stat.isDirectory() && !item.startsWith('.')) {
        this.findStoryFiles(fullPath, files);
      } else if (item.match(/\.stories\.(ts|tsx|js|jsx)$/)) {
        files.push(fullPath);
      }
    }

    return files;
  }

  // 스토리 파일 유효성 검사
  validateStoryFile(content) {
    const checks = [
      content.includes('Meta'),
      content.includes('StoryObj'),
      content.includes('export default'),
      content.includes('export const'),
    ];

    return checks.every(check => check);
  }

  // 전체 헬스체크 실행
  async run() {
    console.log('🔍 스토리북 헬스체크 시작...');
    console.log(`⏰ 시간: ${this.results.timestamp}`);

    // 서버 상태 확인
    const serverOk = await this.checkServer();
    console.log(serverOk ? '✅ 스토리북 서버 정상' : '❌ 스토리북 서버 오류');

    // 스토리 파일 검사
    await this.checkStories();
    console.log(`📚 총 스토리 파일: ${this.results.totalStories}개`);

    // 결과 출력
    this.printResults();

    return this.results;
  }

  // 결과 출력
  printResults() {
    console.log('\n📊 스토리북 상태 요약:');
    console.log(`🖥️  서버: ${this.results.server ? '정상' : '오류'}`);
    console.log(`📖 총 스토리: ${this.results.totalStories}개`);

    const validStories = this.results.stories.filter(s => s.valid).length;
    const testStories = this.results.stories.filter(s => s.hasTests).length;
    const docStories = this.results.stories.filter(s => s.hasDocs).length;

    console.log(`✅ 유효한 스토리: ${validStories}개`);
    console.log(`🧪 테스트 포함: ${testStories}개`);
    console.log(`📋 문서 포함: ${docStories}개`);

    if (this.results.errors.length > 0) {
      console.log('\n❌ 오류 목록:');
      this.results.errors.forEach(error => console.log(`  - ${error}`));
    }

    // 개선 권장사항
    console.log('\n💡 개선 권장사항:');
    if (testStories < this.results.totalStories) {
      console.log(
        `  - ${this.results.totalStories - testStories}개 스토리에 테스트 태그 추가 권장`
      );
    }
    if (docStories < this.results.totalStories) {
      console.log(
        `  - ${this.results.totalStories - docStories}개 스토리에 문서화 추가 권장`
      );
    }
    if (validStories === this.results.totalStories && this.results.server) {
      console.log('  - 🎉 모든 스토리가 완벽한 상태입니다!');
    }
  }
}

// 스크립트 실행 (ES6 모듈용)
const healthCheck = new StorybookHealthCheck();
healthCheck
  .run()
  .then(results => {
    process.exit(results.server && results.errors.length === 0 ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ 헬스체크 실행 오류:', error);
    process.exit(1);
  });

export default StorybookHealthCheck;
