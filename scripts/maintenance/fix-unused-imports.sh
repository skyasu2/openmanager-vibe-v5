#!/bin/bash
# ESLint Warning 빠른 개선 스크립트
# 미사용 import 제거

set -e

echo "🧹 미사용 import 제거 시작..."

# components/ui/pagination.tsx
sed -i 's/import ReactElement from "react";/\/\/ import ReactElement from "react";/' src/components/ui/pagination.tsx
sed -i 's/import ReactNode from "react";/\/\/ import ReactNode from "react";/' src/components/ui/pagination.tsx
sed -i 's/import HTMLAttributes from "react";/\/\/ import HTMLAttributes from "react";/' src/components/ui/pagination.tsx
sed -i 's/import ButtonHTMLAttributes from "react";/\/\/ import ButtonHTMLAttributes from "react";/' src/components/ui/pagination.tsx
sed -i 's/import ElementRef from "react";/\/\/ import ElementRef from "react";/' src/components/ui/pagination.tsx

# services/websocket/WebSocketManager.ts
sed -i "s/import { Observable } from 'rxjs';/\/\/ import { Observable } from 'rxjs';/" src/services/websocket/WebSocketManager.ts
sed -i "s/  debounceTime,/  \/\/ debounceTime,/" src/services/websocket/WebSocketManager.ts
sed -i "s/  map,/  \/\/ map,/" src/services/websocket/WebSocketManager.ts
sed -i "s/  takeUntil,/  \/\/ takeUntil,/" src/services/websocket/WebSocketManager.ts
sed -i "s/import { Socket } from 'socket.io-client';/\/\/ import { Socket } from 'socket.io-client';/" src/services/websocket/WebSocketManager.ts

# lib/testing/playwright-vitals-plugin.ts
sed -i "s/import { test, expect, Browser, BrowserContext } from '@playwright\/test';/import { test, Page } from '@playwright\/test';/" src/lib/testing/playwright-vitals-plugin.ts

# components/profile/hooks/useProfileAuth.ts
sed -i "s/  getCurrentUser,/  \/\/ getCurrentUser,/" src/components/profile/hooks/useProfileAuth.ts
sed -i "s/  isGitHubAuthenticated,/  \/\/ isGitHubAuthenticated,/" src/components/profile/hooks/useProfileAuth.ts
sed -i "s/  isGuestUser,/  \/\/ isGuestUser,/" src/components/profile/hooks/useProfileAuth.ts

# lib/testing/vitest-vitals-plugin.ts
sed -i "s/import { describe, it, beforeEach, afterEach, expect } from 'vitest';/import { describe, it, beforeEach, afterEach } from 'vitest';/" src/lib/testing/vitest-vitals-plugin.ts

# components/system/TimerDebugPanel.tsx
sed -i "s/import React from 'react';/\/\/ import React from 'react';/" src/components/system/TimerDebugPanel.tsx
sed -i "s/import { TimerStatus } from '@\/types\/timer-types';/\/\/ import { TimerStatus } from '@\/types\/timer-types';/" src/components/system/TimerDebugPanel.tsx

# components/time/TimeRotationDisplay.tsx
sed -i "s/  Clock,/  \/\/ Clock,/" src/components/time/TimeRotationDisplay.tsx

# components/time/UserSessionDisplay.tsx
sed -i "s/import dynamic from 'next\/dynamic';/\/\/ import dynamic from 'next\/dynamic';/" src/components/time/UserSessionDisplay.tsx

# lib/api-auth.ts
sed -i "s/import { headers } from 'next\/headers';/\/\/ import { headers } from 'next\/headers';/" src/lib/api-auth.ts

# lib/api-client.ts
sed -i "s/  getErrorMessage,/  \/\/ getErrorMessage,/" src/lib/api-client.ts

echo "✅ 미사용 import 제거 완료"
echo "📊 예상 개선: ~20개 warning"
