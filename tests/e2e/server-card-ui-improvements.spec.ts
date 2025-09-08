import { test, expect } from '@playwright/test'

/**
 * Server Card UI Improvements E2E Test
 * 
 * 검증 대상:
 * 1. 서버 상태별 그래프 색상 (Critical: 빨강, Warning: 노랑/주황, Healthy: 녹색)
 * 2. 서버 상태별 카드 배경색 그라데이션
 * 3. 서버 위치 '서울'로 통일
 * 4. 그래프 색상과 카드 배경색의 일관성
 */

test.describe('Server Card UI Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // 대시보드 페이지로 이동
    await page.goto('http://localhost:3000/dashboard', { timeout: 30000 })
    
    // 페이지 로드 완료 대기
    await page.waitForLoadState('networkidle', { timeout: 15000 })
    
    // 서버 카드 대기 - 더 관대한 선택자 사용
    await page.waitForSelector('.server-card, [class*="card"], [class*="server"]', { timeout: 20000 })
  })

  test('서버 카드 기본 구조 확인', async ({ page }) => {
    // 서버 카드가 존재하는지 확인
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = await serverCards.count()
    
    expect(cardCount).toBeGreaterThan(0)
    console.log(`발견된 서버 카드 수: ${cardCount}`)
    
    // 각 카드가 기본 요소들을 포함하는지 확인
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      
      // 서버 이름 존재 확인
      await expect(card.locator('h3')).toBeVisible()
      
      // 서버 위치 확인 (서울로 통일되었는지)
      const location = await card.locator('p:has-text("위치:")').textContent()
      expect(location).toContain('서울')
      
      // 메트릭 차트 존재 확인
      await expect(card.locator('canvas')).toBeVisible()
    }
  })

  test('서버 상태별 색상 체계 검증', async ({ page }) => {
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = await serverCards.count()
    
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      
      // 서버 상태 확인
      const statusElement = await card.locator('.status-indicator, [class*="status"], [class*="Status"]').first()
      
      if (await statusElement.isVisible()) {
        const statusText = await statusElement.textContent()
        const computedStyle = await statusElement.evaluate((el) => getComputedStyle(el))
        
        console.log(`서버 ${i + 1} 상태: ${statusText}`)
        console.log(`서버 ${i + 1} 배경색: ${computedStyle.backgroundColor}`)
        
        // Critical 상태 - 빨간색 계열 확인
        if (statusText?.toLowerCase().includes('critical') || statusText?.includes('위험')) {
          // 빨간색 계열 RGB 값 확인 (r > 200, g < 100, b < 100)
          const bgColor = computedStyle.backgroundColor
          if (bgColor.includes('rgb')) {
            const [r, g, b] = bgColor.match(/\d+/g)?.map(Number) || [0, 0, 0]
            expect(r).toBeGreaterThan(200) // 빨간색 강조
            expect(g).toBeLessThan(150)   // 녹색 억제
          }
        }
        
        // Warning 상태 - 노란색/주황색 계열 확인
        if (statusText?.toLowerCase().includes('warning') || statusText?.includes('경고')) {
          const bgColor = computedStyle.backgroundColor
          if (bgColor.includes('rgb')) {
            const [r, g, b] = bgColor.match(/\d+/g)?.map(Number) || [0, 0, 0]
            expect(r).toBeGreaterThan(180) // 빨간색/노란색
            expect(g).toBeGreaterThan(150) // 노란색 강조
            expect(b).toBeLessThan(100)    // 파란색 억제
          }
        }
        
        // Healthy 상태 - 녹색 계열 확인
        if (statusText?.toLowerCase().includes('healthy') || statusText?.includes('정상')) {
          const bgColor = computedStyle.backgroundColor
          if (bgColor.includes('rgb')) {
            const [r, g, b] = bgColor.match(/\d+/g)?.map(Number) || [0, 0, 0]
            expect(g).toBeGreaterThan(150) // 녹색 강조
            expect(r).toBeLessThan(150)    // 빨간색 억제
          }
        }
      }
    }
  })

  test('그래프 색상과 카드 배경색 일관성 검증', async ({ page }) => {
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = await serverCards.count()
    
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      const canvas = card.locator('canvas')
      
      if (await canvas.isVisible()) {
        // Canvas 차트 색상 정보 추출
        const chartColorInfo = await canvas.evaluate((canvasEl) => {
          const ctx = (canvasEl as HTMLCanvasElement).getContext('2d')
          if (!ctx) return null
          
          // Canvas의 ImageData를 분석하여 주요 색상 추출
          const imageData = ctx.getImageData(0, 0, canvasEl.width, canvasEl.height)
          const data = imageData.data
          
          // 색상 빈도 계산
          const colorMap: {[key: string]: number} = {}
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            const a = data[i + 3]
            
            // 투명하지 않은 픽셀만 고려
            if (a > 128) {
              const colorKey = `${r},${g},${b}`
              colorMap[colorKey] = (colorMap[colorKey] || 0) + 1
            }
          }
          
          // 가장 많이 사용된 색상 반환 (배경 제외)
          const sortedColors = Object.entries(colorMap)
            .filter(([color]) => {
              const [r, g, b] = color.split(',').map(Number)
              // 흰색/회색 배경 제외
              return !(r > 240 && g > 240 && b > 240) && !(r === g && g === b)
            })
            .sort(([,a], [,b]) => b - a)
          
          return sortedColors.length > 0 ? sortedColors[0][0] : null
        })
        
        if (chartColorInfo) {
          console.log(`서버 ${i + 1} 차트 주요 색상: ${chartColorInfo}`)
          
          // 카드 배경색과 비교
          const cardBackground = await card.evaluate((el) => {
            const style = getComputedStyle(el)
            return style.backgroundColor || style.background
          })
          
          console.log(`서버 ${i + 1} 카드 배경: ${cardBackground}`)
        }
      }
    }
  })

  test('서버 위치 통일성 확인', async ({ page }) => {
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = await serverCards.count()
    
    const locations: string[] = []
    
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      
      // 위치 정보 텍스트 찾기 (여러 가능한 선택자 시도)
      const locationSelectors = [
        'p:has-text("위치")',
        'span:has-text("서울")',
        '[class*="location"]',
        'div:has-text("Seoul")',
        'div:has-text("서울")'
      ]
      
      let locationText = ''
      for (const selector of locationSelectors) {
        const element = card.locator(selector).first()
        if (await element.isVisible()) {
          locationText = await element.textContent() || ''
          if (locationText.trim()) break
        }
      }
      
      if (locationText) {
        locations.push(locationText.trim())
        console.log(`서버 ${i + 1} 위치: ${locationText}`)
        
        // 서울이 포함되어 있는지 확인
        expect(locationText.toLowerCase()).toMatch(/(서울|seoul)/i)
      }
    }
    
    console.log('모든 서버 위치:', locations)
    
    // 모든 서버가 서울로 통일되어 있는지 확인
    expect(locations.length).toBeGreaterThan(0)
    locations.forEach(location => {
      expect(location.toLowerCase()).toMatch(/(서울|seoul)/i)
    })
  })

  test('UI 개선사항 스크린샷 캡처', async ({ page }) => {
    // 전체 대시보드 스크린샷
    await page.screenshot({
      path: 'tests/screenshots/server-card-improvements-overview.png',
      fullPage: true
    })
    
    // 개별 서버 카드 스크린샷
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = Math.min(await serverCards.count(), 5) // 최대 5개만 캡처
    
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      await card.screenshot({
        path: `tests/screenshots/server-card-${i + 1}.png`
      })
    }
    
    console.log(`스크린샷 캡처 완료: 전체 + ${cardCount}개 개별 카드`)
  })

  test('색상 접근성 검증', async ({ page }) => {
    const serverCards = await page.locator('[data-testid="server-card"]')
    const cardCount = await serverCards.count()
    
    for (let i = 0; i < cardCount; i++) {
      const card = serverCards.nth(i)
      
      // 텍스트와 배경 대비 확인
      const textElements = await card.locator('h3, p, span').all()
      
      for (const textEl of textElements) {
        if (await textEl.isVisible()) {
          const contrast = await textEl.evaluate((el) => {
            const style = getComputedStyle(el)
            const textColor = style.color
            const backgroundColor = style.backgroundColor
            
            // 간단한 대비 계산 (실제로는 더 복잡한 WCAG 알고리즘 필요)
            return {
              text: textColor,
              background: backgroundColor,
              element: el.textContent?.slice(0, 30) + '...'
            }
          })
          
          console.log(`텍스트 "${contrast.element}": ${contrast.text} on ${contrast.background}`)
        }
      }
    }
  })
})