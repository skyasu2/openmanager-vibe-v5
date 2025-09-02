/**
 * 📦 AI Sidebar Presentation Layer
 *
 * OptimizedDashboard.tsx를 위한 export
 * f129a18fb 커밋 복구를 위한 호환성 레이어
 */

import type { FC } from 'react';
import type { AISidebarV3Props } from '@/domains/ai-sidebar/types/ai-sidebar-types';
import AISidebarV3Component from '@/domains/ai-sidebar/components/AISidebarV3';

// AISidebarV3를 AISidebar로 re-export with proper typing  
export const AISidebar: FC<AISidebarV3Props> = AISidebarV3Component;
export { AISidebar as default };
