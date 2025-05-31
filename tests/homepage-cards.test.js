/**
 * 홈페이지 카드 기능 테스트
 * 
 * 테스트 대상:
 * - 4개 카드 렌더링
 * - 카드 클릭 → 모달 열림
 * - 모달 닫기 기능
 * - 액션 버튼 동작
 */

// 브라우저 환경에서 실행할 테스트 함수들
const HomepageCardTests = {
  
  // 기본 렌더링 테스트
  testCardRendering() {
    console.log('🧪 카드 렌더링 테스트 시작...');
    
    const cards = document.querySelectorAll('[data-testid="feature-card"]');
    
    if (cards.length === 4) {
      console.log('✅ 4개 카드가 정상적으로 렌더링됨');
      return true;
    } else {
      console.error(`❌ 카드 개수 오류: ${cards.length}개 (예상: 4개)`);
      return false;
    }
  },

  // 카드 클릭 테스트
  testCardClick() {
    console.log('🧪 카드 클릭 테스트 시작...');
    
    const firstCard = document.querySelector('[data-testid="feature-card"]');
    if (!firstCard) {
      console.error('❌ 첫 번째 카드를 찾을 수 없음');
      return false;
    }

    // 클릭 이벤트 시뮬레이션
    firstCard.click();
    
    // 모달이 나타나는지 확인 (약간의 지연 후)
    setTimeout(() => {
      const modal = document.querySelector('[data-testid="feature-modal"]');
      if (modal) {
        console.log('✅ 카드 클릭 시 모달이 정상적으로 열림');
        return true;
      } else {
        console.error('❌ 카드 클릭 후 모달이 열리지 않음');
        return false;
      }
    }, 100);
  },

  // 모달 닫기 테스트
  testModalClose() {
    console.log('🧪 모달 닫기 테스트 시작...');
    
    const closeButton = document.querySelector('[data-testid="modal-close"]');
    if (!closeButton) {
      console.error('❌ 모달 닫기 버튼을 찾을 수 없음');
      return false;
    }

    closeButton.click();
    
    setTimeout(() => {
      const modal = document.querySelector('[data-testid="feature-modal"]');
      if (!modal) {
        console.log('✅ 모달이 정상적으로 닫힘');
        return true;
      } else {
        console.error('❌ 모달이 닫히지 않음');
        return false;
      }
    }, 100);
  },

  // 반응형 테스트
  testResponsive() {
    console.log('🧪 반응형 디자인 테스트 시작...');
    
    const cardGrid = document.querySelector('[data-testid="cards-grid"]');
    if (!cardGrid) {
      console.error('❌ 카드 그리드를 찾을 수 없음');
      return false;
    }

    // 현재 화면 크기에 따른 레이아웃 확인
    const screenWidth = window.innerWidth;
    const gridColumns = window.getComputedStyle(cardGrid).gridTemplateColumns;
    
    if (screenWidth >= 768) {
      // 데스크톱: 2열 그리드 예상
      if (gridColumns.includes('1fr 1fr') || gridColumns.split(' ').length >= 2) {
        console.log('✅ 데스크톱 레이아웃 정상 (2열 그리드)');
        return true;
      }
    } else {
      // 모바일: 1열 그리드 예상
      if (gridColumns === '1fr' || gridColumns.split(' ').length === 1) {
        console.log('✅ 모바일 레이아웃 정상 (1열 그리드)');
        return true;
      }
    }
    
    console.error(`❌ 반응형 레이아웃 오류: ${gridColumns}`);
    return false;
  },

  // 애니메이션 테스트
  testAnimations() {
    console.log('🧪 애니메이션 테스트 시작...');
    
    const cards = document.querySelectorAll('[data-testid="feature-card"]');
    let animatedCards = 0;
    
    cards.forEach(card => {
      const style = window.getComputedStyle(card);
      if (style.transform !== 'none' || style.transition !== 'none') {
        animatedCards++;
      }
    });
    
    if (animatedCards > 0) {
      console.log(`✅ ${animatedCards}개 카드에 애니메이션 적용됨`);
      return true;
    } else {
      console.error('❌ 애니메이션이 적용되지 않음');
      return false;
    }
  },

  // 전체 테스트 실행
  runAllTests() {
    console.log('🚀 홈페이지 카드 기능 전체 테스트 시작');
    console.log('=' .repeat(50));
    
    const tests = [
      this.testCardRendering,
      this.testResponsive,
      this.testAnimations,
      this.testCardClick,
      this.testModalClose
    ];
    
    let passedTests = 0;
    
    tests.forEach((test, index) => {
      try {
        if (test.call(this)) {
          passedTests++;
        }
      } catch (error) {
        console.error(`❌ 테스트 ${index + 1} 실행 중 오류:`, error);
      }
    });
    
    console.log('=' .repeat(50));
    console.log(`📊 테스트 결과: ${passedTests}/${tests.length} 통과`);
    
    if (passedTests === tests.length) {
      console.log('🎉 모든 테스트 통과!');
    } else {
      console.log('⚠️ 일부 테스트 실패');
    }
    
    return passedTests === tests.length;
  }
};

// 브라우저 환경에서 사용할 수 있도록 전역 객체에 추가
if (typeof window !== 'undefined') {
  window.HomepageCardTests = HomepageCardTests;
  
  // 페이지 로드 후 자동 테스트 실행 (개발 환경에서만)
  if (window.location.hostname === 'localhost') {
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('🔧 개발 환경에서 자동 테스트 실행');
        HomepageCardTests.runAllTests();
      }, 2000); // 페이지 로딩 완료 후 2초 대기
    });
  }
}

// Node.js 환경에서 사용할 수 있도록 export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HomepageCardTests;
}

/**
 * 사용법:
 * 
 * 1. 브라우저 개발자 도구에서:
 *    HomepageCardTests.runAllTests()
 * 
 * 2. 개별 테스트 실행:
 *    HomepageCardTests.testCardRendering()
 * 
 * 3. 자동 테스트 (localhost에서 페이지 로드 시 자동 실행)
 */ 