import fs from 'fs';
import path from 'path';

/**
 * 🚨 베르셀 환경에서 파일 시스템 보호
 * 무료티어 최적화를 위한 파일 저장 기능 중앙 관리
 */

/**
 * 베르셀 환경 감지
 */
export const isVercelEnvironment = (): boolean => {
  return !!(process.env.VERCEL || process.env.NODE_ENV === 'production');
};

/**
 * 안전한 파일 쓰기 (베르셀 환경에서 무력화)
 */
export const safeWriteFile = (
  filePath: string,
  data: string | Buffer,
  operation: string = 'write'
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 파일 쓰기 차단됨: ${operation} (${filePath})`
    );
    return false;
  }

  try {
    fs.writeFileSync(filePath, data);
    return true;
  } catch (error) {
    console.error(`❌ 파일 쓰기 실패: ${operation} (${filePath})`, error);
    return false;
  }
};

/**
 * 안전한 파일 추가 (베르셀 환경에서 무력화)
 */
export const safeAppendFile = (
  filePath: string,
  data: string,
  operation: string = 'append'
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 파일 추가 차단됨: ${operation} (${filePath})`
    );
    return false;
  }

  try {
    fs.appendFileSync(filePath, data);
    return true;
  } catch (error) {
    console.error(`❌ 파일 추가 실패: ${operation} (${filePath})`, error);
    return false;
  }
};

/**
 * 안전한 디렉토리 생성 (베르셀 환경에서 무력화)
 */
export const safeMkdir = (
  dirPath: string,
  options: { recursive?: boolean } = { recursive: true }
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(`🚫 베르셀 환경에서 디렉토리 생성 차단됨: ${dirPath}`);
    return false;
  }

  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, options);
    }
    return true;
  } catch (error) {
    console.error(`❌ 디렉토리 생성 실패: ${dirPath}`, error);
    return false;
  }
};

/**
 * 안전한 파일 복사 (베르셀 환경에서 무력화)
 */
export const safeCopyFile = (
  srcPath: string,
  destPath: string,
  operation: string = 'copy'
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 파일 복사 차단됨: ${operation} (${srcPath} → ${destPath})`
    );
    return false;
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    return true;
  } catch (error) {
    console.error(
      `❌ 파일 복사 실패: ${operation} (${srcPath} → ${destPath})`,
      error
    );
    return false;
  }
};

/**
 * 안전한 로그 파일 쓰기 (베르셀 환경에서 무력화)
 */
export const safeLogWrite = (
  logType: string,
  message: string,
  logDir: string = 'logs'
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(`🚫 베르셀 환경에서 로그 파일 쓰기 차단됨: ${logType}`);
    return false;
  }

  try {
    const logPath = path.join(process.cwd(), logDir);
    safeMkdir(logPath);

    const logFile = path.join(logPath, `${logType}.log`);
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    return safeAppendFile(logFile, logEntry, `log-${logType}`);
  } catch (error) {
    console.error(`❌ 로그 쓰기 실패: ${logType}`, error);
    return false;
  }
};

/**
 * 파일 업로드 차단 (베르셀 환경에서 무력화)
 */
export const safeFileUpload = (
  uploadType: string,
  fileName: string,
  data: any
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 파일 업로드 차단됨: ${uploadType} (${fileName})`
    );
    return false;
  }

  // 실제 파일 업로드 로직은 개발 환경에서만 실행
  return true;
};

/**
 * 컨텍스트 번들 저장 차단 (베르셀 환경에서 무력화)
 */
export const safeContextBundleSave = (
  bundleType: string,
  bundleData: any,
  clientId?: string
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 컨텍스트 번들 저장 차단됨: ${bundleType}${clientId ? `-${clientId}` : ''}`
    );
    return false;
  }

  return true;
};

/**
 * 백업 파일 생성 차단 (베르셀 환경에서 무력화)
 */
export const safeBackupCreation = (
  backupType: string,
  sourcePath: string,
  backupPath: string
): boolean => {
  if (isVercelEnvironment()) {
    console.warn(
      `🚫 베르셀 환경에서 백업 생성 차단됨: ${backupType} (${sourcePath} → ${backupPath})`
    );
    return false;
  }

  try {
    if (fs.existsSync(sourcePath)) {
      fs.cpSync(sourcePath, backupPath, { recursive: true });
      return true;
    }
    return false;
  } catch (error) {
    console.error(`❌ 백업 생성 실패: ${backupType}`, error);
    return false;
  }
};

/**
 * 환경 변수 백업 차단 (베르셀 환경에서 무력화)
 */
export const safeEnvBackup = (backupData: any, backupPath: string): boolean => {
  if (isVercelEnvironment()) {
    console.warn(`🚫 베르셀 환경에서 환경 변수 백업 차단됨: ${backupPath}`);
    return false;
  }

  return safeWriteFile(
    backupPath,
    JSON.stringify(backupData, null, 2),
    'env-backup'
  );
};

/**
 * 개발 환경 전용 파일 작업 헬퍼
 */
export const isDevelopmentOnly = (): boolean => {
  return process.env.NODE_ENV === 'development' && !isVercelEnvironment();
};

/**
 * 파일 시스템 보호 상태 확인
 */
export const getFileSystemProtectionStatus = () => {
  return {
    isVercelEnvironment: isVercelEnvironment(),
    isFileWriteAllowed: !isVercelEnvironment(),
    isDevelopmentOnly: isDevelopmentOnly(),
    message: isVercelEnvironment()
      ? '🚫 베르셀 환경에서 파일 시스템 보호 활성화됨'
      : '✅ 파일 시스템 작업 허용됨',
  };
};
