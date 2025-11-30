/**
 * 📦 AI Sidebar Presentation Layer
 *
 * OptimizedDashboard.tsx를 위한 export
 * AISidebarV4로 업그레이드 (V3 archived)
 */

import type { FC } from 'react';
import AISidebarV4Component from '@/domains/ai-sidebar/components/AISidebarV4';
import type { AISidebarV3Props } from '@/domains/ai-sidebar/types/ai-sidebar-types';

// AISidebarV4를 AISidebar로 re-export with proper typing
export const AISidebar: FC<AISidebarV3Props> = AISidebarV4Component;
export { AISidebar as default };
