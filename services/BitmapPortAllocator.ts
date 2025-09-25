/**
 * 🚀 O(1) Bitmap 포트 할당자
 *
 * Qwen AI 수학적 최적화 기반: 8KB 고정 메모리, O(1) 성능 보장
 * 하드웨어 레벨 최적화: BSF, De Bruijn 시퀀스, 비트 연산 특화
 */

export interface BitmapAllocatorConfig {
  /** 포트 범위 시작 (기본: 1024) */
  readonly startPort: number;
  /** 포트 범위 끝 (기본: 65535) */
  readonly endPort: number;
  /** 예약된 시스템 포트들 */
  readonly reservedPorts?: readonly number[];
}

/**
 * 하드웨어 최적화 상수들
 */
const HARDWARE_CONSTANTS = {
  /** De Bruijn 시퀀스 (32비트) */
  DE_BRUIJN_32: 0x077CB531,
  /** De Bruijn 테이블 (32비트) */
  DE_BRUIJN_TABLE: new Uint8Array([
    0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
    31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
  ]),
  /** 워드 크기 (32비트) */
  WORD_SIZE: 32,
  /** 전체 포트 수 (65536) */
  TOTAL_PORTS: 65536,
  /** Bitmap 크기 (2048 words = 8KB) */
  BITMAP_SIZE: 2048
} as const;

/**
 * O(1) Bitmap 포트 할당자
 *
 * 특징:
 * - 8KB 고정 메모리 사용 (Uint32Array[2048])
 * - O(1) 할당/해제 성능 보장
 * - 하드웨어 BSF 시뮬레이션
 * - 순환 할당으로 포트 분산
 */
export class BitmapPortAllocator {
  private readonly config: BitmapAllocatorConfig;
  private readonly bitmap: Uint32Array;
  private readonly portRange: number;
  private readonly startWordIndex: number;
  private readonly endWordIndex: number;
  private lastAllocatedWord: number = 0;

  constructor(config: Partial<BitmapAllocatorConfig> = {}) {
    this.config = {
      startPort: 1024,
      endPort: 65535,
      reservedPorts: [],
      ...config
    };

    // 포트 범위 검증
    if (this.config.startPort < 1 || this.config.endPort > 65535) {
      throw new Error('포트 범위는 1-65535 사이여야 합니다');
    }

    if (this.config.startPort >= this.config.endPort) {
      throw new Error('시작 포트는 끝 포트보다 작아야 합니다');
    }

    this.portRange = this.config.endPort - this.config.startPort + 1;
    this.startWordIndex = Math.floor(this.config.startPort / HARDWARE_CONSTANTS.WORD_SIZE);
    this.endWordIndex = Math.floor(this.config.endPort / HARDWARE_CONSTANTS.WORD_SIZE);

    // 8KB 고정 메모리 할당
    this.bitmap = new Uint32Array(HARDWARE_CONSTANTS.BITMAP_SIZE);

    // 예약된 포트들 미리 마킹
    this.initializeReservedPorts();

    // 범위 외 포트들을 사용됨으로 마킹
    this.markOutOfRangePorts();
  }

  /**
   * O(1) 포트 할당
   *
   * @returns 할당된 포트 번호, 실패 시 -1
   */
  allocatePort(): number {
    const startWord = this.lastAllocatedWord;
    const maxWords = this.endWordIndex - this.startWordIndex + 1;

    // 순환 탐색으로 포트 분산
    for (let i = 0; i < maxWords; i++) {
      const wordIndex = this.startWordIndex + ((startWord + i) % maxWords);
      const word = this.bitmap[wordIndex];

      // 사용 가능한 비트가 있는지 확인
      if (word !== 0xFFFFFFFF) {
        const bitIndex = this.findFirstZeroBit(word);

        if (bitIndex !== -1) {
          const port = wordIndex * HARDWARE_CONSTANTS.WORD_SIZE + bitIndex;

          // 포트 범위 내인지 확인
          if (port >= this.config.startPort && port <= this.config.endPort) {
            // 포트 할당 (비트 설정)
            this.bitmap[wordIndex] |= (1 << bitIndex);
            this.lastAllocatedWord = wordIndex - this.startWordIndex;
            return port;
          }
        }
      }
    }

    return -1; // 할당 실패
  }

  /**
   * O(1) 포트 해제
   *
   * @param port 해제할 포트 번호
   * @returns 성공 여부
   */
  deallocatePort(port: number): boolean {
    if (port < this.config.startPort || port > this.config.endPort) {
      return false;
    }

    const wordIndex = Math.floor(port / HARDWARE_CONSTANTS.WORD_SIZE);
    const bitIndex = port % HARDWARE_CONSTANTS.WORD_SIZE;

    // 포트 해제 (비트 클리어)
    this.bitmap[wordIndex] &= ~(1 << bitIndex);
    return true;
  }

  /**
   * 포트 할당 상태 확인
   *
   * @param port 확인할 포트 번호
   * @returns true: 할당됨, false: 사용 가능
   */
  isPortAllocated(port: number): boolean {
    if (port < this.config.startPort || port > this.config.endPort) {
      return true; // 범위 외는 사용됨으로 간주
    }

    const wordIndex = Math.floor(port / HARDWARE_CONSTANTS.WORD_SIZE);
    const bitIndex = port % HARDWARE_CONSTANTS.WORD_SIZE;

    return (this.bitmap[wordIndex] & (1 << bitIndex)) !== 0;
  }

  /**
   * 사용 가능한 포트 수 조회
   *
   * @returns 사용 가능한 포트 개수
   */
  getAvailablePortCount(): number {
    let count = 0;

    for (let wordIndex = this.startWordIndex; wordIndex <= this.endWordIndex; wordIndex++) {
      const word = this.bitmap[wordIndex];

      // 범위 내 비트들만 계산
      let mask = 0xFFFFFFFF;

      if (wordIndex === this.startWordIndex) {
        const startBit = this.config.startPort % HARDWARE_CONSTANTS.WORD_SIZE;
        mask = mask << startBit;
      }

      if (wordIndex === this.endWordIndex) {
        const endBit = this.config.endPort % HARDWARE_CONSTANTS.WORD_SIZE;
        mask = mask & ((1 << (endBit + 1)) - 1);
      }

      const maskedWord = word & mask;
      count += HARDWARE_CONSTANTS.WORD_SIZE - this.popCount(maskedWord);
    }

    return count;
  }

  /**
   * 할당률 조회 (백분율)
   *
   * @returns 0-100 사이의 할당률
   */
  getAllocationRatio(): number {
    const total = this.portRange;
    const available = this.getAvailablePortCount();
    return ((total - available) / total) * 100;
  }

  /**
   * 포트 할당 상태 리셋
   */
  reset(): void {
    this.bitmap.fill(0);
    this.initializeReservedPorts();
    this.markOutOfRangePorts();
    this.lastAllocatedWord = 0;
  }

  /**
   * 통계 정보 조회
   */
  getStats() {
    const totalPorts = this.portRange;
    const availablePorts = this.getAvailablePortCount();
    const allocatedPorts = totalPorts - availablePorts;

    return {
      totalPorts,
      availablePorts,
      allocatedPorts,
      allocationRatio: this.getAllocationRatio(),
      memoryUsage: this.bitmap.byteLength,
      portRange: {
        start: this.config.startPort,
        end: this.config.endPort
      }
    };
  }

  /**
   * 하드웨어 BSF (Bit Scan Forward) 시뮬레이션
   * De Bruijn 시퀀스를 이용한 O(1) 최하위 0비트 탐색
   *
   * @param word 32비트 워드
   * @returns 첫 번째 0비트 위치 (0-31), 없으면 -1
   */
  private findFirstZeroBit(word: number): number {
    // 비트 반전으로 0비트를 1비트로 변환
    const inverted = (~word) >>> 0;

    if (inverted === 0) {
      return -1; // 모든 비트가 1
    }

    // 최하위 1비트만 남기기 (Two's complement trick)
    const isolated = inverted & (-inverted);

    // De Bruijn 해싱으로 O(1) 위치 탐색
    const index = (isolated * HARDWARE_CONSTANTS.DE_BRUIJN_32) >>> 27;

    return HARDWARE_CONSTANTS.DE_BRUIJN_TABLE[index];
  }

  /**
   * Population Count (비트 개수 세기)
   * Brian Kernighan 알고리즘 사용
   *
   * @param word 32비트 워드
   * @returns 설정된 비트 개수
   */
  private popCount(word: number): number {
    let count = 0;
    let n = word >>> 0; // unsigned로 변환

    while (n) {
      n &= n - 1; // 최하위 1비트 제거
      count++;
    }

    return count;
  }

  /**
   * 예약된 포트들 초기화
   */
  private initializeReservedPorts(): void {
    if (!this.config.reservedPorts) return;

    for (const port of this.config.reservedPorts) {
      if (port >= this.config.startPort && port <= this.config.endPort) {
        const wordIndex = Math.floor(port / HARDWARE_CONSTANTS.WORD_SIZE);
        const bitIndex = port % HARDWARE_CONSTANTS.WORD_SIZE;
        this.bitmap[wordIndex] |= (1 << bitIndex);
      }
    }
  }

  /**
   * 포트 범위 외 영역을 사용됨으로 마킹
   */
  private markOutOfRangePorts(): void {
    // 시작 워드 이전 마스킹
    const startBit = this.config.startPort % HARDWARE_CONSTANTS.WORD_SIZE;
    if (startBit > 0) {
      const mask = (1 << startBit) - 1;
      this.bitmap[this.startWordIndex] |= mask;
    }

    // 끝 워드 이후 마스킹
    const endBit = this.config.endPort % HARDWARE_CONSTANTS.WORD_SIZE;
    if (endBit < HARDWARE_CONSTANTS.WORD_SIZE - 1) {
      const mask = ~((1 << (endBit + 1)) - 1);
      this.bitmap[this.endWordIndex] |= mask >>> 0;
    }

    // 범위 이전/이후 워드들을 모두 1로 설정
    for (let i = 0; i < this.startWordIndex; i++) {
      this.bitmap[i] = 0xFFFFFFFF;
    }

    for (let i = this.endWordIndex + 1; i < HARDWARE_CONSTANTS.BITMAP_SIZE; i++) {
      this.bitmap[i] = 0xFFFFFFFF;
    }
  }
}

/**
 * 전역 포트 할당자 팩토리
 */
export class PortAllocatorFactory {
  private static instances = new Map<string, BitmapPortAllocator>();

  /**
   * 포트 할당자 인스턴스 생성/조회
   */
  static getInstance(
    name: string = 'default',
    config?: Partial<BitmapAllocatorConfig>
  ): BitmapPortAllocator {
    if (!this.instances.has(name)) {
      this.instances.set(name, new BitmapPortAllocator(config));
    }
    return this.instances.get(name)!;
  }

  /**
   * 인스턴스 제거
   */
  static removeInstance(name: string): boolean {
    return this.instances.delete(name);
  }

  /**
   * 모든 인스턴스 제거
   */
  static clear(): void {
    this.instances.clear();
  }

  /**
   * 등록된 인스턴스 목록 조회
   */
  static getInstanceNames(): string[] {
    return Array.from(this.instances.keys());
  }
}

// 편의 함수들
export const createPortAllocator = (config?: Partial<BitmapAllocatorConfig>) =>
  new BitmapPortAllocator(config);

export const getDefaultAllocator = () =>
  PortAllocatorFactory.getInstance();

export default BitmapPortAllocator;