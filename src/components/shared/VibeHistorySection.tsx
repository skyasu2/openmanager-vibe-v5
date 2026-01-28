import type { VibeCodeData } from '@/data/tech-stacks.data';
import type { TechItem } from '@/types/feature-card.types';
import { TechCard } from './TechCard';

export type VibeHistorySectionProps = {
  historyStages: VibeCodeData['history'];
};

/**
 * 바이브 코딩 히스토리 섹션
 * 개발 환경 변화를 3단계로 시각화
 */
export function VibeHistorySection({ historyStages }: VibeHistorySectionProps) {
  if (!historyStages) return null;

  return (
    <div className="space-y-10">
      {/* 1단계: 초기 */}
      <div className="space-y-4">
        <div className="mb-6 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-emerald-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-sm font-bold text-emerald-300">
              1
            </div>
            초기 단계
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300">
              {historyStages.stage1?.length || 0}개 도구
            </span>
          </h4>
          <p className="mb-3 text-sm text-emerald-200/80">
            ChatGPT로 개별 페이지 생성 → GitHub 수동 업로드 → Netlify 배포 →
            데모용 목업 수준
          </p>
          <a
            href="https://openmanager-vibe-v2.netlify.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600/80 px-4 py-2 text-sm font-medium text-white transition-all duration-200 hover:scale-105 hover:bg-emerald-500"
          >
            <span>🔗</span>
            <span>v2 버전 확인하기</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {historyStages.stage1?.map((tech: TechItem) => (
            <TechCard key={tech.name} tech={tech} />
          )) || null}
        </div>
      </div>

      {/* 2단계: 중기 */}
      <div className="space-y-4">
        <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-amber-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-300">
              2
            </div>
            중기 단계
            <span className="rounded-full bg-amber-500/20 px-3 py-1 text-sm text-amber-300">
              {historyStages.stage2?.length || 0}개 도구
            </span>
          </h4>
          <p className="text-sm text-amber-200/80">
            Cursor 도입 → GitHub 연동 → Vercel 배포 → Supabase CRUD 웹앱 완성
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {historyStages.stage2?.map((tech: TechItem) => (
            <TechCard key={tech.name} tech={tech} />
          )) || null}
        </div>
      </div>

      {/* 3단계: 후기 */}
      <div className="space-y-4">
        <div className="mb-6 rounded-lg border border-purple-500/30 bg-purple-500/10 p-4">
          <h4 className="mb-2 flex items-center gap-2 text-xl font-bold text-purple-300">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-sm font-bold text-purple-300">
              3
            </div>
            후기 단계
            <span className="rounded-full bg-purple-500/20 px-3 py-1 text-sm text-purple-300">
              {historyStages.stage3?.length || 0}개 도구
            </span>
          </h4>
          <p className="text-sm text-purple-200/80">
            Claude Code 전환 → WSL 최적화 → 멀티 AI CLI 협업 → GCP Functions
            활용
          </p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {historyStages.stage3?.map((tech: TechItem) => (
            <TechCard key={tech.name} tech={tech} />
          )) || null}
        </div>
      </div>
    </div>
  );
}
