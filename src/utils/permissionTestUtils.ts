/**
 * 🧪 Permission Test Utils
 * 
 * 권한 시스템 테스트를 위한 유틸리티 함수들
 * 개발 환경에서만 사용
 */

import { UserPermissions } from '@/types/permissions.types';

export interface PermissionTestScenario {
  name: string;
  description: string;
  userType: 'github' | 'guest' | 'loading';
  expectedPermissions: Partial<UserPermissions>;
}

/**
 * 권한 테스트 시나리오 정의
 */
export const PERMISSION_TEST_SCENARIOS: PermissionTestScenario[] = [
  {
    name: 'GitHub 인증 사용자 (관리자)',
    description: 'GitHub OAuth로 인증된 사용자는 모든 관리 기능에 접근 가능',
    userType: 'github',
    expectedPermissions: {
      canControlSystem: true,
      canAccessSettings: true,
      canToggleAdminMode: true,
      canLogout: true,
      isGeneralUser: false,
      isAdmin: true,
      isGitHubAuthenticated: true,
      canToggleAI: true,
    },
  },
  {
    name: '게스트 사용자 (일반 사용자)',
    description: '게스트 사용자는 AI 토글만 가능하고 관리 기능 접근 불가',
    userType: 'guest',
    expectedPermissions: {
      canControlSystem: false,
      canAccessSettings: false,
      canToggleAdminMode: false,
      canLogout: false,
      isGeneralUser: true,
      isAdmin: false,
      isGitHubAuthenticated: false,
      canToggleAI: true,
    },
  },
  {
    name: '로딩 상태',
    description: '인증 상태 확인 중일 때는 안전한 기본값 적용',
    userType: 'loading',
    expectedPermissions: {
      canControlSystem: false,
      canAccessSettings: false,
      canToggleAdminMode: false,
      canLogout: false,
      isGeneralUser: true,
      isAdmin: false,
      isGitHubAuthenticated: false,
      canToggleAI: true,
    },
  },
];

/**
 * 권한 테스트 실행
 */
export function testPermissions(
  actualPermissions: UserPermissions,
  expectedPermissions: Partial<UserPermissions>,
  scenarioName: string
): boolean {
  const results: Array<{ key: string; expected: any; actual: any; passed: boolean }> = [];
  let allPassed = true;

  // 각 권한 항목 테스트
  Object.entries(expectedPermissions).forEach(([key, expectedValue]) => {
    const actualValue = actualPermissions[key as keyof UserPermissions];
    const passed = actualValue === expectedValue;
    
    results.push({
      key,
      expected: expectedValue,
      actual: actualValue,
      passed,
    });

    if (!passed) {
      allPassed = false;
    }
  });

  // 테스트 결과 출력
  console.group(`🧪 [Permission Test] ${scenarioName}`);
  
  if (allPassed) {
    console.log('✅ 모든 권한 테스트 통과');
  } else {
    console.warn('❌ 일부 권한 테스트 실패');
  }

  results.forEach(({ key, expected, actual, passed }) => {
    const icon = passed ? '✅' : '❌';
    console.log(`${icon} ${key}: 예상=${expected}, 실제=${actual}`);
  });

  console.groupEnd();

  return allPassed;
}

/**
 * 메뉴 아이템 가시성 테스트
 */
export function testMenuItemVisibility(permissions: UserPermissions): void {
  console.group('🎯 [Menu Visibility Test]');
  
  const menuItems = [
    { name: 'AI 토글', visible: permissions.canToggleAI, expectedForAll: true },
    { name: '시스템 제어', visible: permissions.canControlSystem, expectedForAdmin: true },
    { name: '설정', visible: permissions.canAccessSettings, expectedForAdmin: true },
    { name: '관리자 모드', visible: permissions.canToggleAdminMode, expectedForAdmin: true },
    { name: '로그아웃', visible: permissions.canLogout, expectedForAdmin: true },
  ];

  menuItems.forEach(({ name, visible, expectedForAll, expectedForAdmin }) => {
    let shouldBeVisible = false;
    
    if (expectedForAll) {
      shouldBeVisible = true; // 모든 사용자에게 표시되어야 함
    } else if (expectedForAdmin) {
      shouldBeVisible = permissions.isAdmin; // 관리자에게만 표시되어야 함
    }

    const testPassed = visible === shouldBeVisible;
    const icon = testPassed ? '✅' : '❌';
    
    console.log(`${icon} ${name}: ${visible ? '표시됨' : '숨김'} (예상: ${shouldBeVisible ? '표시' : '숨김'})`);
  });

  console.groupEnd();
}

/**
 * 전체 권한 시스템 테스트 실행
 */
export function runFullPermissionTest(permissions: UserPermissions): void {
  if (process.env.NODE_ENV !== 'development') {
    return; // 개발 환경에서만 실행
  }

  console.group('🔐 [Full Permission System Test]');
  
  // 현재 사용자 유형 확인
  const currentScenario = PERMISSION_TEST_SCENARIOS.find(
    scenario => scenario.userType === permissions.userType
  );

  if (currentScenario) {
    // 권한 테스트 실행
    const permissionTestPassed = testPermissions(
      permissions,
      currentScenario.expectedPermissions,
      currentScenario.name
    );

    // 메뉴 가시성 테스트 실행
    testMenuItemVisibility(permissions);

    // 전체 결과
    if (permissionTestPassed) {
      console.log('🎉 전체 권한 시스템 테스트 통과!');
    } else {
      console.warn('⚠️ 권한 시스템에 문제가 있을 수 있습니다.');
    }
  } else {
    console.warn(`⚠️ 알 수 없는 사용자 유형: ${permissions.userType}`);
  }

  console.groupEnd();
}