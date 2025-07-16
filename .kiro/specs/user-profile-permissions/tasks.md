# Implementation Plan

- [x] 1. Create user permissions hook


  - Create `useUserPermissions` hook in `src/hooks/useUserPermissions.ts`
  - Implement user role detection logic using existing Supabase auth and guest auth systems
  - Define permission matrix for general users vs admin users (admin = GitHub authenticated users)
  - Add proper TypeScript interfaces for permissions
  - Integrate with existing `useSession` and `useAuth` hooks
  - _Requirements: 4.1, 4.2, 4.3_



- [ ] 2. Add AI toggle functionality to UnifiedProfileButton
  - Add AI toggle button to the existing UnifiedProfileButton dropdown menu
  - Implement AI state toggle logic using the existing `aiAgent` state from UnifiedAdminStore
  - Show "AI 중지" when AI is active, "AI 활성화" when AI is inactive
  - Position AI toggle button appropriately in the menu for general users


  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 3. Implement permission-based menu filtering in UnifiedProfileButton
  - Modify existing `UnifiedProfileButton.tsx` to use the new permissions hook
  - Add conditional rendering logic to hide system control buttons (start/stop/restart) for general users
  - Hide settings button for general users (keep for GitHub authenticated users)
  - Hide logout button for general users (keep for GitHub authenticated users)


  - Hide admin mode toggle for general users (keep for GitHub authenticated users)
  - Ensure AI toggle is visible for all users but other controls are admin-only
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.2, 3.3, 3.4_

- [ ] 4. Add error handling and fallback logic
  - Implement graceful degradation when user role cannot be determined


  - Add default to general user permissions when authentication fails
  - Add console logging for permission-related errors (no user-facing errors)
  - Ensure UI remains functional even when permission checks fail
  - Handle edge cases where auth state is loading or undefined
  - _Requirements: 4.3, 5.1, 5.2, 5.3_




- [ ] 5. Update component styling and UX for different user types
  - Adjust dropdown menu height and spacing for reduced menu items (general users)
  - Ensure consistent styling between general and admin user interfaces
  - Optimize dropdown positioning for different menu sizes
  - Test responsive behavior on different screen sizes
  - Ensure smooth transitions when menu items are hidden/shown
  - _Requirements: 1.1, 5.4_

- [ ] 6. Test permission system functionality
  - Create test scenarios for general user (guest) profile dropdown
  - Create test scenarios for admin user (GitHub authenticated) profile dropdown
  - Verify AI button text changes correctly based on state for all user types
  - Test permission hook with different authentication states (guest, GitHub, loading)
  - Verify hidden menu items are not accessible to general users
  - Test edge cases like auth state changes during dropdown interaction
  - _Requirements: 1.5, 2.4, 3.5, 4.4_