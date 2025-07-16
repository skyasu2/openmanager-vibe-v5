# Requirements Document

## Introduction

일반 사용자와 관리자 사용자를 구분하여 프로필 드롭다운 메뉴에서 접근할 수 있는 기능을 제한하는 권한 관리 시스템을 구현합니다. 일반 사용자는 시스템 제어 기능에 접근할 수 없도록 하고, 기본적인 AI 기능과 개인 설정만 사용할 수 있도록 합니다.

## Requirements

### Requirement 1

**User Story:** As a general user, I want to see only relevant options in my profile dropdown, so that I'm not confused by administrative functions I cannot use.

#### Acceptance Criteria

1. WHEN a general user opens the profile dropdown THEN the system SHALL hide system start/stop buttons
2. WHEN a general user opens the profile dropdown THEN the system SHALL hide settings button
3. WHEN a general user opens the profile dropdown THEN the system SHALL hide logout button
4. WHEN a general user opens the profile dropdown THEN the system SHALL hide admin mode toggle
5. WHEN a general user opens the profile dropdown THEN the system SHALL show only AI activation/deactivation controls

### Requirement 2

**User Story:** As a general user, I want to see "AI 중지" instead of "AI 활성화" when AI is active, so that the button text accurately reflects the current state and available action.

#### Acceptance Criteria

1. WHEN AI is currently active AND user is a general user THEN the system SHALL display "AI 중지" button
2. WHEN AI is currently inactive AND user is a general user THEN the system SHALL display "AI 활성화" button
3. WHEN user clicks "AI 중지" THEN the system SHALL deactivate AI and change button text to "AI 활성화"
4. WHEN user clicks "AI 활성화" THEN the system SHALL activate AI and change button text to "AI 중지"

### Requirement 3

**User Story:** As an administrator, I want to retain full access to all profile dropdown options, so that I can continue to manage the system effectively.

#### Acceptance Criteria

1. WHEN an administrator opens the profile dropdown THEN the system SHALL show all available options including system controls
2. WHEN an administrator opens the profile dropdown THEN the system SHALL show settings button
3. WHEN an administrator opens the profile dropdown THEN the system SHALL show logout button
4. WHEN an administrator opens the profile dropdown THEN the system SHALL show admin mode toggle
5. WHEN an administrator opens the profile dropdown THEN the system SHALL show AI controls with appropriate state-based text

### Requirement 4

**User Story:** As a system, I need to determine user roles accurately, so that appropriate permissions can be applied to each user type.

#### Acceptance Criteria

1. WHEN determining user permissions THEN the system SHALL identify if user is GitHub authenticated
2. WHEN determining user permissions THEN the system SHALL identify if user has admin privileges
3. WHEN user role cannot be determined THEN the system SHALL default to general user permissions
4. WHEN user authentication changes THEN the system SHALL update profile dropdown options accordingly

### Requirement 5

**User Story:** As a developer, I want the permission system to be maintainable and extensible, so that new user roles and permissions can be easily added in the future.

#### Acceptance Criteria

1. WHEN implementing permission checks THEN the system SHALL use a centralized permission checking function
2. WHEN adding new menu items THEN the system SHALL support role-based visibility configuration
3. WHEN permission logic changes THEN the system SHALL require minimal code changes across components
4. WHEN testing permissions THEN the system SHALL provide clear debugging information about user roles and permissions