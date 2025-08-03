/**
 * 📊 Vitest 메타데이터 리포터
 * 테스트 실행 결과를 메타데이터 시스템에 자동 기록
 */

import type { Reporter, Task, File } from 'vitest';
import { TestMetadataManager } from './test-metadata-manager';

export class MetadataReporter implements Reporter {
  private manager: TestMetadataManager;
  private startTimes: Map<string, number> = new Map();

  constructor() {
    this.manager = new TestMetadataManager();
  }

  onInit() {
    console.log('📊 메타데이터 리포터 활성화');
  }

  onTaskUpdate(packs: any[], _events?: any[]) {
    packs.forEach((pack: any) => {
      const task = Array.isArray(pack) ? pack[1] : pack;
      if (task && task.type === 'test' && task.result?.state) {
        this.recordTest(task);
      }
    });
  }

  onFinished(files?: File[]) {
    if (!files) return;

    // 파일별 통계 수집
    files.forEach(file => {
      if (file.filepath && file.result) {
        const runTime = file.result.duration || 0;
        const success = file.result.state === 'pass';

        this.manager.recordTestRun({
          filePath: file.filepath,
          success,
          runTime,
          error: file.result.errors?.[0]?.message,
        });

        // TDD 상태 감지
        this.detectTDDStatus(file);
      }
    });

    // 간단한 요약 출력
    const report = this.manager.generateReport();
    const lines = report.split('\n');
    console.log('\n' + lines.slice(0, 10).join('\n') + '\n...');
  }

  private recordTest(task: Task) {
    if (!task.file?.filepath) return;

    const runTime = task.result?.duration || 0;
    const success = task.result?.state === 'pass';

    // 개별 테스트는 파일 단위로 집계
    if (!this.startTimes.has(task.file.filepath)) {
      this.startTimes.set(task.file.filepath, 0);
    }

    const currentTime = this.startTimes.get(task.file.filepath)!;
    this.startTimes.set(task.file.filepath, currentTime + runTime);
  }

  private detectTDDStatus(file: File) {
    if (!file.filepath || !file.tasks) return;

    // 파일 내용에서 @tdd-red 태그 찾기
    const hasTDDRedTag = file.tasks.some(task => 
      task.name?.includes('@tdd-red') || 
      task.suite?.name?.includes('@tdd-red')
    );

    if (hasTDDRedTag) {
      const allPassed = file.tasks.every(task => 
        task.result?.state === 'pass' || task.result?.state === 'skip'
      );

      if (allPassed) {
        // TDD RED → GREEN 전환
        this.manager.updateTDDStatus(file.filepath, 'green');
        console.log(`✅ TDD 전환 감지: ${file.filepath} (RED → GREEN)`);
      } else {
        this.manager.updateTDDStatus(file.filepath, 'red');
      }
    }
  }
}

// Vitest 설정에서 사용할 수 있도록 export
export default MetadataReporter;