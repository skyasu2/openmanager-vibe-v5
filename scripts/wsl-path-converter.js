#!/usr/bin/env node

/**
 * WSL 경로 변환 유틸리티
 * Windows <-> WSL 경로 변환을 처리합니다.
 */

const path = require('path');
const os = require('os');

class WSLPathConverter {
  /**
   * Windows 경로를 WSL 경로로 변환
   * @param {string} windowsPath - Windows 경로 (예: D:\cursor\project)
   * @returns {string} WSL 경로 (예: /mnt/d/cursor/project)
   */
  static windowsToWSL(windowsPath) {
    if (!windowsPath || typeof windowsPath !== 'string') {
      return windowsPath;
    }

    // 이미 WSL 경로인 경우
    if (windowsPath.startsWith('/mnt/')) {
      return windowsPath;
    }

    // Windows 경로 정규화
    let normalized = windowsPath.replace(/\\/g, '/');
    
    // 드라이브 문자 처리 (C: -> /mnt/c)
    const driveMatch = normalized.match(/^([A-Za-z]):/);
    if (driveMatch) {
      const driveLetter = driveMatch[1].toLowerCase();
      normalized = normalized.replace(/^[A-Za-z]:/, `/mnt/${driveLetter}`);
    }

    return normalized;
  }

  /**
   * WSL 경로를 Windows 경로로 변환
   * @param {string} wslPath - WSL 경로 (예: /mnt/d/cursor/project)
   * @returns {string} Windows 경로 (예: D:\cursor\project)
   */
  static wslToWindows(wslPath) {
    if (!wslPath || typeof wslPath !== 'string') {
      return wslPath;
    }

    // 이미 Windows 경로인 경우
    if (/^[A-Za-z]:/.test(wslPath)) {
      return wslPath;
    }

    // WSL 마운트 경로 처리
    if (wslPath.startsWith('/mnt/')) {
      const pathWithoutMount = wslPath.substring(5); // /mnt/ 제거
      const parts = pathWithoutMount.split('/');
      
      if (parts.length > 0 && parts[0].length === 1) {
        const driveLetter = parts[0].toUpperCase();
        const restPath = parts.slice(1).join('\\');
        return `${driveLetter}:${restPath ? '\\' + restPath : ''}`;
      }
    }

    return wslPath;
  }

  /**
   * 현재 환경에 맞는 경로로 변환
   * @param {string} inputPath - 입력 경로
   * @returns {string} 변환된 경로
   */
  static normalize(inputPath) {
    if (!inputPath) return inputPath;

    // WSL 환경인지 확인
    const isWSL = process.platform === 'linux' && 
                  process.env.WSL_DISTRO_NAME !== undefined;

    if (isWSL) {
      // WSL 환경에서는 Windows 경로를 WSL 경로로 변환
      return this.windowsToWSL(inputPath);
    } else {
      // Windows 환경에서는 WSL 경로를 Windows 경로로 변환
      return this.wslToWindows(inputPath);
    }
  }

  /**
   * 환경 정보 출력
   */
  static getEnvironmentInfo() {
    return {
      platform: process.platform,
      isWSL: process.platform === 'linux' && process.env.WSL_DISTRO_NAME !== undefined,
      wslDistro: process.env.WSL_DISTRO_NAME || null,
      cwd: process.cwd(),
      home: os.homedir(),
      user: os.userInfo().username,
    };
  }

  /**
   * 경로 변환 테스트
   */
  static test() {
    console.log('🧪 WSL 경로 변환 테스트\n');

    const testCases = [
      'D:\\cursor\\openmanager-vibe-v5',
      'C:\\Users\\user\\Documents',
      '/mnt/d/cursor/openmanager-vibe-v5',
      '/mnt/c/Users/user/Documents',
      './relative/path',
      '../parent/path',
      '/absolute/unix/path',
    ];

    testCases.forEach(testPath => {
      console.log(`입력: ${testPath}`);
      console.log(`  -> WSL:     ${this.windowsToWSL(testPath)}`);
      console.log(`  -> Windows: ${this.wslToWindows(testPath)}`);
      console.log(`  -> 정규화:   ${this.normalize(testPath)}`);
      console.log('');
    });

    console.log('🌍 환경 정보:');
    const envInfo = this.getEnvironmentInfo();
    Object.entries(envInfo).forEach(([key, value]) => {
      console.log(`  ${key}: ${value}`);
    });
  }
}

// CLI로 실행된 경우
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === '--test') {
    WSLPathConverter.test();
  } else if (args[0] === '--info') {
    console.log(JSON.stringify(WSLPathConverter.getEnvironmentInfo(), null, 2));
  } else {
    // 경로 변환
    const inputPath = args[0];
    const action = args[1] || 'normalize';

    let result;
    switch (action) {
      case 'to-wsl':
        result = WSLPathConverter.windowsToWSL(inputPath);
        break;
      case 'to-windows':
        result = WSLPathConverter.wslToWindows(inputPath);
        break;
      case 'normalize':
      default:
        result = WSLPathConverter.normalize(inputPath);
        break;
    }

    console.log(result);
  }
}

module.exports = WSLPathConverter;