import { test, expect } from '@playwright/test'

/**
 * Simple Server Card UI Check
 * 
 * 간단한 서버 카드 UI 검증:
 * 1. 페이지 로드 확인
 * 2. 서버 카드 존재 확인
 * 3. 기본 UI 요소 확인
 * 4. 스크린샷 캡처
 */

test.describe('Server Card Simple Check', () => {
  test('대시보드 페이지 로드 및 서버 카드 확인', async ({ page }) => {
    console.log('🚀 대시보드 페이지로 이동')
    
    // 대시보드 페이지로 이동
    await page.goto('http://localhost:3000/dashboard', { timeout: 30000 })
    
    // 페이지 제목 확인
    const title = await page.title()
    console.log('📄 페이지 제목:', title)
    
    // 기본 DOM 요소 대기
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 })
    
    console.log('🔍 페이지 콘텐츠 분석 중...')
    
    // 페이지의 모든 요소 확인
    const bodyContent = await page.locator('body').innerHTML()
    console.log('📝 Body 콘텐츠 길이:', bodyContent.length)
    
    // 가능한 서버 카드 선택자들
    const cardSelectors = [
      '[data-testid="server-card"]',
      '.server-card',
      '[class*="server"]',
      '[class*="card"]',
      'div[class*="Card"]',
      'div[class*="Server"]'
    ]
    
    let foundCards = false
    let cardElements = null
    
    for (const selector of cardSelectors) {
      try {
        cardElements = page.locator(selector)
        const count = await cardElements.count()
        console.log(`🔍 ${selector}: ${count}개 발견`)
        
        if (count > 0) {
          foundCards = true
          console.log(`✅ 서버 카드 발견: ${selector}`)
          break
        }
      } catch (error) {
        console.log(`❌ ${selector} 검색 실패:`, error.message)
      }
    }
    
    // 전체 페이지 스크린샷
    console.log('📸 스크린샷 캡처 중...')
    await page.screenshot({
      path: 'tests/screenshots/dashboard-full-page.png',
      fullPage: true
    })
    
    console.log('📸 뷰포트 스크린샷 캡처 중...')
    await page.screenshot({
      path: 'tests/screenshots/dashboard-viewport.png',
      fullPage: false
    })
    
    // 주요 텍스트 확인
    const pageText = await page.locator('body').textContent()
    console.log('📝 페이지에서 "서버" 키워드 검색:', pageText?.includes('서버') ? '발견' : '없음')
    console.log('📝 페이지에서 "Server" 키워드 검색:', pageText?.includes('Server') ? '발견' : '없음')
    console.log('📝 페이지에서 "카드" 키워드 검색:', pageText?.includes('카드') ? '발견' : '없음')
    
    // 서버 카드가 발견되었는지 확인
    if (foundCards && cardElements) {
      const cardCount = await cardElements.count()
      console.log(`✅ ${cardCount}개의 서버 카드 발견됨`)
      
      // 첫 번째 카드의 내용 확인
      if (cardCount > 0) {
        const firstCard = cardElements.first()
        const cardText = await firstCard.textContent()
        console.log('📝 첫 번째 카드 텍스트:', cardText?.slice(0, 100) + '...')
        
        // 개별 카드 스크린샷
        try {
          await firstCard.screenshot({
            path: 'tests/screenshots/first-server-card.png'
          })
        } catch (error) {
          console.log('❌ 개별 카드 스크린샷 실패:', error.message)
        }
      }
    } else {
      console.log('❌ 서버 카드를 찾을 수 없음')
      
      // 페이지의 모든 div 요소 확인
      const divs = page.locator('div')
      const divCount = await divs.count()
      console.log(`🔍 총 ${divCount}개의 div 요소 발견`)
      
      // 클래스가 있는 div들 확인
      for (let i = 0; i < Math.min(divCount, 10); i++) {
        const div = divs.nth(i)
        const className = await div.getAttribute('class')
        if (className && className.length > 0) {
          console.log(`🔍 div[${i}] class: ${className}`)
        }
      }
    }
    
    console.log('✅ 테스트 완료')
  })
})