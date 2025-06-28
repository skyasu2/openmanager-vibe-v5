/**
 * 🎯 Preset Question Manager
 *
 * ✅ 프리셋 질문 관리 전담 모듈
 * ✅ 단일 책임: 프리셋 질문 정의/네비게이션만 담당
 * ✅ SOLID 원칙 적용
 */

import {
  BarChart3,
  Brain,
  Cpu,
  Database,
  FileText,
  Globe,
  HardDrive,
  Search,
  Server,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import React from 'react';

// 🎯 프리셋 질문 인터페이스
export interface PresetQuestion {
  id: string;
  text: string;
  category: string;
  icon: React.ComponentType<any>;
  color: string;
}

// 🎯 아이콘 매핑 인터페이스
export interface IconMapping {
  [key: string]: React.ComponentType<any>;
}

// 🚀 프리셋 질문 목록 (서버 모니터링 특화)
const PRESET_QUESTIONS: PresetQuestion[] = [
  {
    id: '1',
    text: '현재 서버 상태는 어떤가요?',
    category: '상태 확인',
    icon: Cpu,
    color: 'bg-blue-500',
  },
  {
    id: '2',
    text: 'CPU 사용률이 높은 서버를 찾아주세요',
    category: '성능 분석',
    icon: Zap,
    color: 'bg-red-500',
  },
  {
    id: '3',
    text: '메모리 부족 경고가 있나요?',
    category: '리소스 모니터링',
    icon: Brain,
    color: 'bg-yellow-500',
  },
  {
    id: '4',
    text: '네트워크 지연이 발생하고 있나요?',
    category: '네트워크 진단',
    icon: Globe,
    color: 'bg-green-500',
  },
  {
    id: '5',
    text: '최근 에러 로그를 분석해주세요',
    category: '로그 분석',
    icon: FileText,
    color: 'bg-purple-500',
  },
  {
    id: '6',
    text: '시스템 최적화 방안을 제안해주세요',
    category: '최적화',
    icon: Sparkles,
    color: 'bg-pink-500',
  },
  {
    id: '7',
    text: '디스크 사용량이 임계치에 도달했나요?',
    category: '스토리지',
    icon: HardDrive,
    color: 'bg-indigo-500',
  },
  {
    id: '8',
    text: '데이터베이스 연결 상태를 확인해주세요',
    category: '데이터베이스',
    icon: Database,
    color: 'bg-teal-500',
  },
];

// 🎨 아이콘 매핑 (확장 가능)
const ICON_MAPPING: IconMapping = {
  Server,
  Search,
  BarChart3,
  Target,
  Cpu,
  Zap,
  Brain,
  Globe,
  FileText,
  Sparkles,
  HardDrive,
  Database,
};

export class PresetQuestionManager {
  private static instance: PresetQuestionManager | null = null;

  private currentIndex: number = 0;
  private readonly presetsPerPage: number = 4;

  private constructor() {}

  public static getInstance(): PresetQuestionManager {
    if (!this.instance) {
      this.instance = new PresetQuestionManager();
    }
    return this.instance;
  }

  /**
   * 🎯 전체 프리셋 질문 목록 반환
   */
  public getAllPresetQuestions(): PresetQuestion[] {
    return PRESET_QUESTIONS;
  }

  /**
   * 🎯 현재 페이지 프리셋 질문들 반환
   */
  public getCurrentPresets(): PresetQuestion[] {
    const startIndex = this.currentIndex;
    const endIndex = startIndex + this.presetsPerPage;
    return PRESET_QUESTIONS.slice(startIndex, endIndex);
  }

  /**
   * 🎯 이전 프리셋 질문 페이지로 이동
   */
  public goToPreviousPresets(): boolean {
    if (this.canGoPrevious()) {
      this.currentIndex = Math.max(0, this.currentIndex - this.presetsPerPage);
      return true;
    }
    return false;
  }

  /**
   * 🎯 다음 프리셋 질문 페이지로 이동
   */
  public goToNextPresets(): boolean {
    if (this.canGoNext()) {
      this.currentIndex = Math.min(
        PRESET_QUESTIONS.length - this.presetsPerPage,
        this.currentIndex + this.presetsPerPage
      );
      return true;
    }
    return false;
  }

  /**
   * 🎯 이전 페이지 이동 가능 여부
   */
  public canGoPrevious(): boolean {
    return this.currentIndex > 0;
  }

  /**
   * 🎯 다음 페이지 이동 가능 여부
   */
  public canGoNext(): boolean {
    return this.currentIndex + this.presetsPerPage < PRESET_QUESTIONS.length;
  }

  /**
   * 🎯 현재 인덱스 반환
   */
  public getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * 🎯 인덱스 직접 설정
   */
  public setCurrentIndex(index: number): void {
    if (index >= 0 && index < PRESET_QUESTIONS.length) {
      this.currentIndex = index;
    }
  }

  /**
   * 🎯 페이지당 프리셋 질문 수 반환
   */
  public getPresetsPerPage(): number {
    return this.presetsPerPage;
  }

  /**
   * 🎯 총 페이지 수 반환
   */
  public getTotalPages(): number {
    return Math.ceil(PRESET_QUESTIONS.length / this.presetsPerPage);
  }

  /**
   * 🎯 현재 페이지 번호 반환 (1부터 시작)
   */
  public getCurrentPage(): number {
    return Math.floor(this.currentIndex / this.presetsPerPage) + 1;
  }

  /**
   * 🎨 아이콘 이름으로 아이콘 컴포넌트 반환
   */
  public getIcon(iconName: string): React.ComponentType<any> {
    return ICON_MAPPING[iconName] || Server;
  }

  /**
   * 🎯 카테고리별 프리셋 질문 필터링
   */
  public getQuestionsByCategory(category: string): PresetQuestion[] {
    return PRESET_QUESTIONS.filter(q => q.category === category);
  }

  /**
   * 🎯 고유 카테고리 목록 반환
   */
  public getCategories(): string[] {
    const categories = PRESET_QUESTIONS.map(q => q.category);
    return [...new Set(categories)];
  }

  /**
   * 🎯 ID로 프리셋 질문 검색
   */
  public getQuestionById(id: string): PresetQuestion | undefined {
    return PRESET_QUESTIONS.find(q => q.id === id);
  }

  /**
   * 🎯 텍스트로 프리셋 질문 검색
   */
  public searchQuestions(searchTerm: string): PresetQuestion[] {
    const term = searchTerm.toLowerCase();
    return PRESET_QUESTIONS.filter(
      q =>
        q.text.toLowerCase().includes(term) ||
        q.category.toLowerCase().includes(term)
    );
  }

  /**
   * 🔄 네비게이션 상태 초기화
   */
  public reset(): void {
    this.currentIndex = 0;
  }

  /**
   * 🎯 네비게이션 상태 정보 반환
   */
  public getNavigationInfo() {
    return {
      currentIndex: this.currentIndex,
      currentPage: this.getCurrentPage(),
      totalPages: this.getTotalPages(),
      canGoPrevious: this.canGoPrevious(),
      canGoNext: this.canGoNext(),
      presetsPerPage: this.presetsPerPage,
      totalQuestions: PRESET_QUESTIONS.length,
    };
  }
}
