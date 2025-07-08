import fs from 'fs';
import path from 'path';

/**
 * 디렉토리 버전 전환 유틸리티
 * - 압축 없이 디렉토리 단위 버전 관리
 * - Git 친화적 버전 전환
 * - 롤백 및 복원 기능
 */
export class VersionSwitcher {
  private static instance: VersionSwitcher;
  private documentsPath: string;
  private logsPath: string;

  private constructor() {
    this.documentsPath = path.join(process.cwd(), 'src', 'mcp', 'documents');
    this.logsPath = path.join(process.cwd(), 'logs');
  }

  public static getInstance(): VersionSwitcher {
    if (!VersionSwitcher.instance) {
      VersionSwitcher.instance = new VersionSwitcher();
    }
    return VersionSwitcher.instance;
  }

  /**
   * 현재 버전 백업 및 새 버전으로 전환
   */
  async switchToVersion(
    type: 'base' | 'advanced' | 'custom',
    targetVersion: string,
    clientId?: string,
    createBackup: boolean = true
  ): Promise<{
    success: boolean;
    message: string;
    backupVersion?: string;
  }> {
    try {
      console.log(
        `🔄 [VersionSwitcher] 버전 전환 시작: ${type} → v${targetVersion}`
      );

      const currentDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, clientId)
          : path.join(this.documentsPath, type);

      const targetDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, `${clientId}-v${targetVersion}`)
          : path.join(this.documentsPath, `${type}-v${targetVersion}`);

      // 1. 대상 버전 디렉토리 존재 확인
      if (!fs.existsSync(targetDir)) {
        return {
          success: false,
          message: `대상 버전 디렉토리가 존재하지 않습니다: ${targetDir}`,
        };
      }

      let backupVersion: string | undefined;

      // 2. 현재 버전 백업 (선택적)
      if (createBackup && fs.existsSync(currentDir)) {
        backupVersion = `backup-${Date.now()}`;
        const backupDir =
          clientId && type === 'custom'
            ? path.join(
                this.documentsPath,
                type,
                `${clientId}-${backupVersion}`
              )
            : path.join(this.documentsPath, `${type}-${backupVersion}`);

        await this.copyDirectory(currentDir, backupDir);
        console.log(`💾 [VersionSwitcher] 현재 버전 백업: ${backupDir}`);
      }

      // 3. 현재 디렉토리 삭제 (백업 후)
      if (fs.existsSync(currentDir)) {
        await this.removeDirectory(currentDir);
      }

      // 4. 대상 버전을 현재 디렉토리로 복사
      await this.copyDirectory(targetDir, currentDir);

      console.log(
        `✅ [VersionSwitcher] 버전 전환 완료: ${type} v${targetVersion}`
      );

      return {
        success: true,
        message: `${type} 버전이 v${targetVersion}으로 전환되었습니다.`,
        backupVersion,
      };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 버전 전환 실패:', error);
      return {
        success: false,
        message: `버전 전환 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 백업 버전으로 롤백
   */
  async rollbackToBackup(
    type: 'base' | 'advanced' | 'custom',
    backupVersion: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`⏪ [VersionSwitcher] 롤백 시작: ${type} ← ${backupVersion}`);

      const currentDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, clientId)
          : path.join(this.documentsPath, type);

      const backupDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, `${clientId}-${backupVersion}`)
          : path.join(this.documentsPath, `${type}-${backupVersion}`);

      // 백업 디렉토리 존재 확인
      if (!fs.existsSync(backupDir)) {
        return {
          success: false,
          message: `백업 버전이 존재하지 않습니다: ${backupDir}`,
        };
      }

      // 현재 디렉토리 삭제
      if (fs.existsSync(currentDir)) {
        await this.removeDirectory(currentDir);
      }

      // 백업을 현재 디렉토리로 복사
      await this.copyDirectory(backupDir, currentDir);

      console.log(`✅ [VersionSwitcher] 롤백 완료: ${type} ← ${backupVersion}`);

      return {
        success: true,
        message: `${type}이 ${backupVersion} 버전으로 롤백되었습니다.`,
      };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 롤백 실패:', error);
      return {
        success: false,
        message: `롤백 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 사용 가능한 모든 버전 조회
   */
  async getAvailableVersions(
    type: 'base' | 'advanced' | 'custom',
    clientId?: string
  ): Promise<{
    current: string | null;
    versions: Array<{
      version: string;
      type: 'release' | 'backup';
      createdAt: Date;
      fileCount: number;
      size: string;
    }>;
  }> {
    try {
      const parentDir = this.documentsPath;
      const prefix =
        clientId && type === 'custom' ? `${clientId}-` : `${type}-`;
      const currentDir =
        clientId && type === 'custom'
          ? path.join(parentDir, type, clientId)
          : path.join(parentDir, type);

      const versions: Array<{
        version: string;
        type: 'release' | 'backup';
        createdAt: Date;
        fileCount: number;
        size: string;
      }> = [];

      // 현재 버전 확인
      let current: string | null = null;
      if (fs.existsSync(currentDir)) {
        current = 'current';
      }

      // 버전 디렉토리들 스캔
      if (fs.existsSync(parentDir)) {
        const items = fs.readdirSync(parentDir);

        for (const item of items) {
          const itemPath = path.join(parentDir, item);

          if (fs.statSync(itemPath).isDirectory() && item.startsWith(prefix)) {
            const version = item.replace(prefix, '');
            const stats = fs.statSync(itemPath);

            // 파일 수 및 크기 계산
            const { fileCount, totalSize } =
              await this.getDirectoryStats(itemPath);

            versions.push({
              version,
              type: version.startsWith('backup-') ? 'backup' : 'release',
              createdAt: stats.mtime,
              fileCount,
              size: this.formatSize(totalSize),
            });
          }
        }

        // Custom 타입의 경우 하위 디렉토리도 확인
        if (type === 'custom') {
          const customDir = path.join(parentDir, 'custom');
          if (fs.existsSync(customDir)) {
            const customItems = fs.readdirSync(customDir);

            for (const item of customItems) {
              const itemPath = path.join(customDir, item);

              if (
                fs.statSync(itemPath).isDirectory() &&
                (clientId
                  ? item.startsWith(`${clientId}-`)
                  : !item.includes('-'))
              ) {
                const version = clientId
                  ? item.replace(`${clientId}-`, '')
                  : item;
                const stats = fs.statSync(itemPath);
                const { fileCount, totalSize } =
                  await this.getDirectoryStats(itemPath);

                versions.push({
                  version,
                  type: version.startsWith('backup-') ? 'backup' : 'release',
                  createdAt: stats.mtime,
                  fileCount,
                  size: this.formatSize(totalSize),
                });
              }
            }
          }
        }
      }

      // 버전 정렬 (최신 순)
      versions.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      return { current, versions };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 버전 목록 조회 실패:', error);
      return { current: null, versions: [] };
    }
  }

  /**
   * 릴리스 버전 생성 (수동 버전 관리)
   * 🚨 베르셀 환경에서 파일 저장 무력화 - 무료티어 최적화
   */
  async createReleaseVersion(
    type: 'base' | 'advanced' | 'custom',
    version: string,
    clientId?: string,
    description?: string
  ): Promise<{
    success: boolean;
    message: string;
    versionPath?: string;
  }> {
    try {
      console.log(`📦 [VersionSwitcher] 릴리스 버전 생성: ${type} v${version}`);

      // 🚨 베르셀 환경에서 파일 저장 건너뛰기
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        console.log('⚠️ [VersionSwitcher] 베르셀 환경에서 버전 생성 무력화');
        return {
          success: true,
          message: `베르셀 환경에서 버전 생성이 무력화되었습니다: v${version}`,
          versionPath: 'vercel-disabled',
        };
      }

      const currentDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, clientId)
          : path.join(this.documentsPath, type);

      // 현재 디렉토리 존재 확인
      if (!fs.existsSync(currentDir)) {
        return {
          success: false,
          message: `현재 버전이 존재하지 않습니다: ${currentDir}`,
        };
      }

      // 버전 디렉토리 생성
      const versionDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, `${clientId}-${version}`)
          : path.join(this.documentsPath, `${type}-${version}`);

      // 이미 존재하는 버전인지 확인
      if (fs.existsSync(versionDir)) {
        return {
          success: false,
          message: `이미 존재하는 버전입니다: ${version}`,
        };
      }

      // 현재 상태를 릴리스 버전으로 복사
      await this.copyDirectory(currentDir, versionDir);

      // 메타데이터 생성
      const metadataPath = path.join(versionDir, '.version-metadata.json');
      const metadata = {
        version,
        type: 'release',
        createdAt: new Date().toISOString(),
        description: description || `Release version ${version}`,
        sourceType: type,
        clientId: clientId || null,
      };

      fs.writeFileSync(
        metadataPath,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      console.log(`✅ [VersionSwitcher] 릴리스 버전 생성 완료: ${versionDir}`);

      return {
        success: true,
        message: `릴리스 버전 v${version}이 생성되었습니다.`,
        versionPath: versionDir,
      };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 릴리스 버전 생성 실패:', error);
      return {
        success: false,
        message: `릴리스 버전 생성 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 버전 삭제
   */
  async deleteVersion(
    type: 'base' | 'advanced' | 'custom',
    version: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      console.log(`🗑️ [VersionSwitcher] 버전 삭제: ${type} v${version}`);

      const versionDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, `${clientId}-${version}`)
          : path.join(this.documentsPath, `${type}-${version}`);

      // 버전 디렉토리 존재 확인
      if (!fs.existsSync(versionDir)) {
        return {
          success: false,
          message: `버전이 존재하지 않습니다: ${versionDir}`,
        };
      }

      // 현재 사용 중인 버전인지 확인 (안전장치)
      const currentDir =
        clientId && type === 'custom'
          ? path.join(this.documentsPath, type, clientId)
          : path.join(this.documentsPath, type);

      if (path.resolve(versionDir) === path.resolve(currentDir)) {
        return {
          success: false,
          message: '현재 사용 중인 버전은 삭제할 수 없습니다.',
        };
      }

      // 버전 디렉토리 삭제
      await this.removeDirectory(versionDir);

      console.log(`✅ [VersionSwitcher] 버전 삭제 완료: ${versionDir}`);

      return {
        success: true,
        message: `버전 ${version}이 삭제되었습니다.`,
      };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 버전 삭제 실패:', error);
      return {
        success: false,
        message: `버전 삭제 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  /**
   * 버전 비교
   */
  async compareVersions(
    type: 'base' | 'advanced' | 'custom',
    version1: string,
    version2: string,
    clientId?: string
  ): Promise<{
    success: boolean;
    comparison?: {
      version1: { path: string; files: string[] };
      version2: { path: string; files: string[] };
      differences: {
        added: string[];
        removed: string[];
        modified: string[];
      };
    };
    message: string;
  }> {
    try {
      console.log(`🔍 [VersionSwitcher] 버전 비교: ${version1} vs ${version2}`);

      const getVersionPath = (version: string) => {
        if (version === 'current') {
          return clientId && type === 'custom'
            ? path.join(this.documentsPath, type, clientId)
            : path.join(this.documentsPath, type);
        }
        return clientId && type === 'custom'
          ? path.join(this.documentsPath, type, `${clientId}-${version}`)
          : path.join(this.documentsPath, `${type}-${version}`);
      };

      const path1 = getVersionPath(version1);
      const path2 = getVersionPath(version2);

      // 두 버전 모두 존재하는지 확인
      if (!fs.existsSync(path1) || !fs.existsSync(path2)) {
        return {
          success: false,
          message: '비교할 버전 중 하나 이상이 존재하지 않습니다.',
        };
      }

      // 각 버전의 파일 목록 수집
      const files1 = await this.getFileList(path1);
      const files2 = await this.getFileList(path2);

      // 차이점 분석
      const added = files2.filter(file => !files1.includes(file));
      const removed = files1.filter(file => !files2.includes(file));
      const common = files1.filter(file => files2.includes(file));

      const modified: string[] = [];
      for (const file of common) {
        const content1 = fs.readFileSync(path.join(path1, file), 'utf-8');
        const content2 = fs.readFileSync(path.join(path2, file), 'utf-8');

        if (content1 !== content2) {
          modified.push(file);
        }
      }

      return {
        success: true,
        comparison: {
          version1: { path: path1, files: files1 },
          version2: { path: path2, files: files2 },
          differences: { added, removed, modified },
        },
        message: `버전 비교 완료: ${added.length}개 추가, ${removed.length}개 제거, ${modified.length}개 수정`,
      };
    } catch (error) {
      console.error('❌ [VersionSwitcher] 버전 비교 실패:', error);
      return {
        success: false,
        message: `버전 비교 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
      };
    }
  }

  // Private 헬퍼 메서드들
  private async copyDirectory(src: string, dest: string): Promise<void> {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);
    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      if (fs.statSync(srcPath).isDirectory()) {
        await this.copyDirectory(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  private async removeDirectory(dirPath: string): Promise<void> {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);

      if (fs.statSync(itemPath).isDirectory()) {
        await this.removeDirectory(itemPath);
      } else {
        fs.unlinkSync(itemPath);
      }
    }

    fs.rmdirSync(dirPath);
  }

  private async getDirectoryStats(dirPath: string): Promise<{
    fileCount: number;
    totalSize: number;
  }> {
    let fileCount = 0;
    let totalSize = 0;

    const processDirectory = (currentPath: string) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = fs.statSync(itemPath);

        if (stats.isDirectory()) {
          processDirectory(itemPath);
        } else {
          fileCount++;
          totalSize += stats.size;
        }
      }
    };

    if (fs.existsSync(dirPath)) {
      processDirectory(dirPath);
    }

    return { fileCount, totalSize };
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  private async getFileList(dirPath: string): Promise<string[]> {
    const files: string[] = [];

    const processDirectory = (
      currentPath: string,
      relativePath: string = ''
    ) => {
      const items = fs.readdirSync(currentPath);

      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const relativeItemPath = path.join(relativePath, item);

        if (fs.statSync(itemPath).isDirectory()) {
          processDirectory(itemPath, relativeItemPath);
        } else {
          files.push(relativeItemPath);
        }
      }
    };

    if (fs.existsSync(dirPath)) {
      processDirectory(dirPath);
    }

    return files.sort();
  }
}
