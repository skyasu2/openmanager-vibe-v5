#!/usr/bin/env node

/**
 * 스토리북 Import 오류 일괄 수정 스크립트
 * 
 * 자동 생성된 스토리 파일들의 import 구문을 올바르게 수정합니다.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// 수정이 필요한 import 패턴들
const IMPORT_FIXES = [
    // UI 컴포넌트들
    { from: "import { accordion } from './accordion';", to: "import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';" },
    { from: "import { button } from './button';", to: "import { Button } from './button';" },
    { from: "import { card } from './card';", to: "import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';" },
    { from: "import { dialog } from './dialog';", to: "import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';" },
    { from: "import { input } from './input';", to: "import { Input } from './input';" },
    { from: "import { label } from './label';", to: "import { Label } from './label';" },
    { from: "import { progress } from './progress';", to: "import { Progress } from './progress';" },
    { from: "import { select } from './select';", to: "import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';" },
    { from: "import { separator } from './separator';", to: "import { Separator } from './separator';" },
    { from: "import { sheet } from './sheet';", to: "import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './sheet';" },
    { from: "import { skeleton } from './skeleton';", to: "import { Skeleton } from './skeleton';" },
    { from: "import { table } from './table';", to: "import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';" },
    { from: "import { tabs } from './tabs';", to: "import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';" },
    { from: "import { textarea } from './textarea';", to: "import { Textarea } from './textarea';" },
    { from: "import { toast } from './toast';", to: "import { Toast, ToastAction, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from './toast';" },
    { from: "import { tooltip } from './tooltip';", to: "import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';" },

    // 대시보드 컴포넌트들 (default export)
    { from: "import { DashboardContent } from './DashboardContent';", to: "import DashboardContent from './DashboardContent';" },
    { from: "import { EnhancedServerCard } from './EnhancedServerCard';", to: "import EnhancedServerCard from './EnhancedServerCard';" },
    { from: "import { EnhancedServerModal } from './EnhancedServerModal';", to: "import EnhancedServerModal from './EnhancedServerModal';" },
    { from: "import { NetworkMonitoringCard } from './NetworkMonitoringCard';", to: "import NetworkMonitoringCard from './NetworkMonitoringCard';" },
    { from: "import { ServerCard } from './ServerCard';", to: "import ServerCard from './ServerCard';" },
    { from: "import { ServerDashboard } from './ServerDashboard';", to: "import ServerDashboard from './ServerDashboard';" },
    { from: "import { ServerDetailModal } from './ServerDetailModal';", to: "import ServerDetailModal from './ServerDetailModal';" },
    { from: "import { CircularGauge } from './CircularGauge';", to: "import CircularGauge from './CircularGauge';" },

    // AI 컴포넌트들 (default export)
    { from: "import { AISidebarV2 } from './AISidebarV2';", to: "import AISidebarV2 from './AISidebarV2';" },
    { from: "import { ChatArea } from './ChatArea';", to: "import ChatArea from './ChatArea';" },
    { from: "import { AIHealthStatus } from './AIHealthStatus';", to: "import AIHealthStatus from './AIHealthStatus';" },
    { from: "import { BasePanelLayout } from './BasePanelLayout';", to: "import BasePanelLayout from './BasePanelLayout';" },
    { from: "import { AgentThinkingPanel } from './AgentThinkingPanel';", to: "import AgentThinkingPanel from './AgentThinkingPanel';" },

    // 시스템 컴포넌트들 (default export)
    { from: "import { SystemBootSequence } from './SystemBootSequence';", to: "import SystemBootSequence from './SystemBootSequence';" },
    { from: "import { SystemChecklist } from './SystemChecklist';", to: "import SystemChecklist from './SystemChecklist';" },
    { from: "import { NotificationToast } from './NotificationToast';", to: "import NotificationToast from './NotificationToast';" },
];

// 컴포넌트 이름 수정 (소문자 → 대문자)
const COMPONENT_NAME_FIXES = [
    { from: 'typeof accordion', to: 'typeof Accordion' },
    { from: 'typeof button', to: 'typeof Button' },
    { from: 'typeof card', to: 'typeof Card' },
    { from: 'typeof dialog', to: 'typeof Dialog' },
    { from: 'typeof input', to: 'typeof Input' },
    { from: 'typeof label', to: 'typeof Label' },
    { from: 'typeof progress', to: 'typeof Progress' },
    { from: 'typeof select', to: 'typeof Select' },
    { from: 'typeof separator', to: 'typeof Separator' },
    { from: 'typeof sheet', to: 'typeof Sheet' },
    { from: 'typeof skeleton', to: 'typeof Skeleton' },
    { from: 'typeof table', to: 'typeof Table' },
    { from: 'typeof tabs', to: 'typeof Tabs' },
    { from: 'typeof textarea', to: 'typeof Textarea' },
    { from: 'typeof toast', to: 'typeof Toast' },
    { from: 'typeof tooltip', to: 'typeof Tooltip' },
];

// 타이틀 수정 (소문자 → 대문자)
const TITLE_FIXES = [
    { from: "'🎨 UI Components/accordion'", to: "'🎨 UI Components/Accordion'" },
    { from: "'🎨 UI Components/button'", to: "'🎨 UI Components/Button'" },
    { from: "'🎨 UI Components/card'", to: "'🎨 UI Components/Card'" },
    { from: "'🎨 UI Components/dialog'", to: "'🎨 UI Components/Dialog'" },
    { from: "'🎨 UI Components/input'", to: "'🎨 UI Components/Input'" },
    { from: "'🎨 UI Components/label'", to: "'🎨 UI Components/Label'" },
    { from: "'🎨 UI Components/progress'", to: "'🎨 UI Components/Progress'" },
    { from: "'🎨 UI Components/select'", to: "'🎨 UI Components/Select'" },
    { from: "'🎨 UI Components/separator'", to: "'🎨 UI Components/Separator'" },
    { from: "'🎨 UI Components/sheet'", to: "'🎨 UI Components/Sheet'" },
    { from: "'🎨 UI Components/skeleton'", to: "'🎨 UI Components/Skeleton'" },
    { from: "'🎨 UI Components/table'", to: "'🎨 UI Components/Table'" },
    { from: "'🎨 UI Components/tabs'", to: "'🎨 UI Components/Tabs'" },
    { from: "'🎨 UI Components/textarea'", to: "'🎨 UI Components/Textarea'" },
    { from: "'🎨 UI Components/toast'", to: "'🎨 UI Components/Toast'" },
    { from: "'🎨 UI Components/tooltip'", to: "'🎨 UI Components/Tooltip'" },
];

// 컴포넌트 참조 수정
const COMPONENT_REF_FIXES = [
    { from: 'component: accordion,', to: 'component: Accordion,' },
    { from: 'component: button,', to: 'component: Button,' },
    { from: 'component: card,', to: 'component: Card,' },
    { from: 'component: dialog,', to: 'component: Dialog,' },
    { from: 'component: input,', to: 'component: Input,' },
    { from: 'component: label,', to: 'component: Label,' },
    { from: 'component: progress,', to: 'component: Progress,' },
    { from: 'component: select,', to: 'component: Select,' },
    { from: 'component: separator,', to: 'component: Separator,' },
    { from: 'component: sheet,', to: 'component: Sheet,' },
    { from: 'component: skeleton,', to: 'component: Skeleton,' },
    { from: 'component: table,', to: 'component: Table,' },
    { from: 'component: tabs,', to: 'component: Tabs,' },
    { from: 'component: textarea,', to: 'component: Textarea,' },
    { from: 'component: toast,', to: 'component: Toast,' },
    { from: 'component: tooltip,', to: 'component: Tooltip,' },
];

function fixStoryFile(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // Import 구문 수정
        IMPORT_FIXES.forEach(fix => {
            if (content.includes(fix.from)) {
                content = content.replace(fix.from, fix.to);
                modified = true;
            }
        });

        // 컴포넌트 이름 수정
        COMPONENT_NAME_FIXES.forEach(fix => {
            if (content.includes(fix.from)) {
                content = content.replace(new RegExp(fix.from, 'g'), fix.to);
                modified = true;
            }
        });

        // 타이틀 수정
        TITLE_FIXES.forEach(fix => {
            if (content.includes(fix.from)) {
                content = content.replace(fix.from, fix.to);
                modified = true;
            }
        });

        // 컴포넌트 참조 수정
        COMPONENT_REF_FIXES.forEach(fix => {
            if (content.includes(fix.from)) {
                content = content.replace(fix.from, fix.to);
                modified = true;
            }
        });

        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ 수정 완료: ${filePath}`);
            return true;
        }

        return false;
    } catch (error) {
        console.error(`❌ 오류 발생 (${filePath}):`, error.message);
        return false;
    }
}

function main() {
    console.log('🔧 스토리북 Import 오류 일괄 수정 시작...\n');

    // 모든 .stories.tsx 파일 찾기
    const storyFiles = glob.sync('src/**/*.stories.tsx');

    let fixedCount = 0;
    let totalCount = storyFiles.length;

    storyFiles.forEach(filePath => {
        if (fixStoryFile(filePath)) {
            fixedCount++;
        }
    });

    console.log(`\n📊 수정 완료 통계:`);
    console.log(`- 전체 스토리 파일: ${totalCount}개`);
    console.log(`- 수정된 파일: ${fixedCount}개`);
    console.log(`- 수정 비율: ${((fixedCount / totalCount) * 100).toFixed(1)}%`);

    if (fixedCount > 0) {
        console.log('\n✨ 스토리북 Import 오류 수정이 완료되었습니다!');
        console.log('스토리북을 다시 시작하여 변경사항을 확인하세요.');
    } else {
        console.log('\n✅ 수정이 필요한 파일이 없습니다.');
    }
}

if (require.main === module) {
    main();
}

module.exports = { fixStoryFile, IMPORT_FIXES }; 