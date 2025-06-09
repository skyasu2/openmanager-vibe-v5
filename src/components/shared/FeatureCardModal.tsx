'use client';

import React, { useEffect, useState } from 'react';
import {
    motion,
    AnimatePresence,
} from 'framer-motion';
import {
    X,
    Star,
    CheckCircle,
    Zap,
    TrendingUp,
} from 'lucide-react';

interface FeatureCard {
    id: string;
    title: string;
    description: string;
    icon: any;
    gradient: string;
    detailedContent: {
        overview: string;
        features: string[];
        technologies: string[];
    };
    requiresAI: boolean;
    isAICard?: boolean;
    isSpecial?: boolean;
    isVibeCard?: boolean;
}

interface FeatureCardModalProps {
    selectedCard: FeatureCard | null | undefined;
    onClose: () => void;
    renderTextWithAIGradient: (text: string) => React.ReactNode;
    modalRef: React.RefObject<HTMLDivElement | null>;
    variant?: 'home' | 'landing';
}

// 표준 카드 컴포넌트 인터페이스
interface StandardCardProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    tag: string;
    stats: {
        left: string;
        leftLabel: string;
        right: string;
        rightLabel: string;
    };
    accentColor: string;
}

// 표준 카드 컴포넌트
const StandardCard = React.memo(({ title, description, icon, tag, stats, accentColor }: StandardCardProps) => {
    const getTagStyle = (tagName: string) => {
        const tagStyles = {
            '프레임워크': 'bg-blue-100 text-blue-700 border border-blue-200',
            '언어': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
            '스타일링': 'bg-cyan-100 text-cyan-700 border border-cyan-200',
            '데이터베이스': 'bg-emerald-100 text-emerald-700 border border-emerald-200',
            '개발도구': 'bg-purple-100 text-purple-700 border border-purple-200',
            'AI 모델': 'bg-pink-100 text-pink-700 border border-pink-200',
            '자동화': 'bg-violet-100 text-violet-700 border border-violet-200',
            '배포': 'bg-fuchsia-100 text-fuchsia-700 border border-fuchsia-200',
            'AI 엔진': 'bg-green-100 text-green-700 border border-green-200',
            '프로토콜': 'bg-teal-100 text-teal-700 border border-teal-200',
            '백업': 'bg-lime-100 text-lime-700 border border-lime-200',
            '언어처리': 'bg-yellow-100 text-yellow-700 border border-yellow-200',
            '최적화': 'bg-orange-100 text-orange-700 border border-orange-200',
            '관리': 'bg-red-100 text-red-700 border border-red-200',
            '캐싱': 'bg-amber-100 text-amber-700 border border-amber-200',
            '시뮬레이션': 'bg-rose-100 text-rose-700 border border-rose-200',
        };
        return tagStyles[tagName as keyof typeof tagStyles] || 'bg-gray-100 text-gray-700 border border-gray-200';
    };

    const getAccentColorClass = (color: string) => {
        const colorMap = {
            'blue': 'text-blue-600',
            'purple': 'text-purple-600',
            'green': 'text-green-600',
            'orange': 'text-orange-600',
        };
        return colorMap[color as keyof typeof colorMap] || 'text-gray-600';
    };

    const getIconBgClass = (color: string) => {
        const colorMap = {
            'blue': 'bg-blue-100 text-blue-600',
            'purple': 'bg-purple-100 text-purple-600',
            'green': 'bg-green-100 text-green-600',
            'orange': 'bg-orange-100 text-orange-600',
        };
        return colorMap[color as keyof typeof colorMap] || 'bg-gray-100 text-gray-600';
    };

    return (
        <motion.div
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-200 ease-out"
            whileHover={{ scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            {/* 헤더 */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${getIconBgClass(accentColor)}`}>
                        {icon}
                    </div>
                    <h3 className="font-semibold text-lg text-gray-900">{title}</h3>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getTagStyle(tag)}`}>
                    {tag}
                </span>
            </div>

            {/* 설명 */}
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {description}
            </p>

            {/* 통계 */}
            <div className="flex justify-between pt-4 border-t border-gray-100">
                <div className="text-center">
                    <div className={`font-bold text-2xl ${getAccentColorClass(accentColor)}`}>
                        {stats.left}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {stats.leftLabel}
                    </div>
                </div>
                <div className="text-center">
                    <div className={`font-bold text-2xl ${getAccentColorClass(accentColor)}`}>
                        {stats.right}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                        {stats.rightLabel}
                    </div>
                </div>
            </div>
        </motion.div>
    );
});

StandardCard.displayName = 'StandardCard';

// 4개 카드별 데이터 구조
const cardConfigs = {
    "tech-stack": {
        title: "🛠️ 핵심 웹 기술",
        description: "현대적이고 안정적인 웹 기술 스택",
        data: [
            {
                title: "Next.js 15",
                description: "React 기반 풀스택 프레임워크로 SSR과 최적화된 성능을 제공합니다.",
                icon: <Zap className="w-5 h-5" />,
                tag: "프레임워크",
                stats: { left: "15.x", leftLabel: "Version", right: "100%", rightLabel: "SSR" },
                accentColor: "blue"
            },
            {
                title: "TypeScript",
                description: "타입 안전성을 제공하는 JavaScript로 런타임 오류를 방지합니다.",
                icon: <CheckCircle className="w-5 h-5" />,
                tag: "언어",
                stats: { left: "5.0+", leftLabel: "Version", right: "100%", rightLabel: "Type Safe" },
                accentColor: "blue"
            },
            {
                title: "TailwindCSS",
                description: "유틸리티 우선 CSS 프레임워크로 빠른 스타일링을 지원합니다.",
                icon: <Star className="w-5 h-5" />,
                tag: "스타일링",
                stats: { left: "3.4+", leftLabel: "Version", right: "95%", rightLabel: "Efficiency" },
                accentColor: "blue"
            },
            {
                title: "Supabase",
                description: "PostgreSQL 기반 백엔드 서비스로 실시간 데이터베이스를 제공합니다.",
                icon: <TrendingUp className="w-5 h-5" />,
                tag: "데이터베이스",
                stats: { left: "2.0", leftLabel: "Version", right: "99%", rightLabel: "Uptime" },
                accentColor: "blue"
            }
        ]
    },

    "vibe-coding": {
        title: "⚡ Vibe Coding 워크플로우",
        description: "AI 기반 개발 워크플로우와 자동화 시스템",
        data: [
            {
                title: "Cursor AI",
                description: "AI 기반 코드 생성 IDE로 개발 생산성을 대폭 향상시킵니다.",
                icon: <Zap className="w-5 h-5" />,
                tag: "개발도구",
                stats: { left: "+300%", leftLabel: "Productivity", right: "80%", rightLabel: "Automation" },
                accentColor: "purple"
            },
            {
                title: "Claude 4 Sonnet",
                description: "200K 컨텍스트 AI 모델로 대규모 코드베이스를 이해합니다.",
                icon: <Star className="w-5 h-5" />,
                tag: "AI 모델",
                stats: { left: "200K", leftLabel: "Context", right: "95%", rightLabel: "Accuracy" },
                accentColor: "purple"
            },
            {
                title: "MCP Tools",
                description: "파일시스템과 Git을 자동화하는 Model Context Protocol 도구입니다.",
                icon: <CheckCircle className="w-5 h-5" />,
                tag: "자동화",
                stats: { left: "4", leftLabel: "Tools", right: "90%", rightLabel: "Efficiency" },
                accentColor: "purple"
            },
            {
                title: "GitHub Actions",
                description: "자동 배포와 CI/CD 파이프라인으로 개발 워크플로우를 최적화합니다.",
                icon: <TrendingUp className="w-5 h-5" />,
                tag: "배포",
                stats: { left: "590+", leftLabel: "Deploys", right: "99%", rightLabel: "Success" },
                accentColor: "purple"
            }
        ]
    },

    "mcp-ai-engine": {
        title: "🧠 서버 모니터링 AI 엔진",
        description: "지능형 서버 모니터링 및 분석 시스템",
        data: [
            {
                title: "UnifiedAIEngine",
                description: "통합 AI 분석 엔진으로 모든 AI 기능을 중앙에서 관리합니다.",
                icon: <Zap className="w-5 h-5" />,
                tag: "AI 엔진",
                stats: { left: "99.9%", leftLabel: "Uptime", right: "150ms", rightLabel: "Response" },
                accentColor: "green"
            },
            {
                title: "MCP Protocol",
                description: "모델 컨텍스트 프로토콜로 AI 서비스 간 통신을 담당합니다.",
                icon: <CheckCircle className="w-5 h-5" />,
                tag: "프로토콜",
                stats: { left: "85%", leftLabel: "Success", right: "3", rightLabel: "Fallbacks" },
                accentColor: "green"
            },
            {
                title: "RAG Engine",
                description: "벡터 검색 백업 시스템으로 AI 분석의 안정성을 보장합니다.",
                icon: <Star className="w-5 h-5" />,
                tag: "백업",
                stats: { left: "90%", leftLabel: "Accuracy", right: "100ms", rightLabel: "Search" },
                accentColor: "green"
            },
            {
                title: "Korean NLP",
                description: "한국어 자연어 처리로 국내 환경에 최적화된 AI 분석을 제공합니다.",
                icon: <TrendingUp className="w-5 h-5" />,
                tag: "언어처리",
                stats: { left: "89%", leftLabel: "Accuracy", right: "한국어", rightLabel: "Support" },
                accentColor: "green"
            }
        ]
    },

    "data-generator": {
        title: "📊 데이터 생성기",
        description: "지능형 실시간 데이터 생성 및 관리 시스템",
        data: [
            {
                title: "OptimizedGenerator",
                description: "24시간 베이스라인과 델타 압축으로 현실적인 서버 데이터를 생성합니다.",
                icon: <TrendingUp className="w-5 h-5" />,
                tag: "최적화",
                stats: { left: "65%", leftLabel: "Compression", right: "507", rightLabel: "Lines" },
                accentColor: "orange"
            },
            {
                title: "TimerManager",
                description: "통합 타이머 관리 시스템으로 모든 시스템 타이머를 효율적으로 관리합니다.",
                icon: <Zap className="w-5 h-5" />,
                tag: "관리",
                stats: { left: "75%", leftLabel: "CPU Save", right: "4", rightLabel: "Timers" },
                accentColor: "orange"
            },
            {
                title: "SmartCache",
                description: "지능형 캐싱 시스템으로 데이터 접근 속도를 대폭 향상시킵니다.",
                icon: <Star className="w-5 h-5" />,
                tag: "캐싱",
                stats: { left: "85%", leftLabel: "Hit Rate", right: "50%", rightLabel: "Speed Up" },
                accentColor: "orange"
            },
            {
                title: "RealisticData",
                description: "현실적 서버 패턴 시뮬레이션으로 실제 환경과 유사한 데이터를 생성합니다.",
                icon: <CheckCircle className="w-5 h-5" />,
                tag: "시뮬레이션",
                stats: { left: "160", leftLabel: "Scenarios", right: "95%", rightLabel: "Realistic" },
                accentColor: "orange"
            }
        ]
    }
};

export default function FeatureCardModal({
    selectedCard,
    onClose,
    renderTextWithAIGradient,
    modalRef,
    variant = 'home',
}: FeatureCardModalProps) {
    const [hoveredCard, setHoveredCard] = useState<number | null>(null);

    // 키보드 네비게이션
    useEffect(() => {
        if (!selectedCard) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [selectedCard, onClose]);

    if (!selectedCard) return null;

    const currentConfig = cardConfigs[selectedCard.id as keyof typeof cardConfigs];
    if (!currentConfig) return null;

    // 모달 애니메이션
    const modalVariants = {
        hidden: {
            opacity: 0,
            scale: 0.95,
            y: 20,
        },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                damping: 25,
                stiffness: 300,
                duration: 0.4,
            },
        },
        exit: {
            opacity: 0,
            scale: 0.95,
            y: 20,
            transition: { duration: 0.2 },
        },
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.1,
            },
        },
    };

    return (
        <AnimatePresence mode='wait'>
            {/* 깔끔한 오버레이 */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className='fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm'
                onClick={onClose}
            >
                <motion.div
                    ref={modalRef}
                    variants={modalVariants}
                    initial='hidden'
                    animate='visible'
                    exit='exit'
                    onClick={(e) => e.stopPropagation()}
                    className="relative w-full max-w-6xl max-h-[80vh] bg-white rounded-2xl shadow-2xl overflow-hidden"
                >
                    {/* 헤더 */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 bg-gradient-to-br ${selectedCard.gradient} rounded-xl`}>
                                <selectedCard.icon className="w-8 h-8 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                    {currentConfig.title}
                                </h2>
                                <p className="text-gray-600">
                                    {currentConfig.description}
                                </p>
                            </div>
                        </div>

                        <motion.button
                            onClick={onClose}
                            className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            aria-label="모달 닫기"
                        >
                            <X className="w-5 h-5 text-gray-600" />
                        </motion.button>
                    </div>

                    {/* 콘텐츠 영역 - 2x2 그리드 */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {currentConfig.data.map((item, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onHoverStart={() => setHoveredCard(index)}
                                    onHoverEnd={() => setHoveredCard(null)}
                                >
                                    <StandardCard {...item} />
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
