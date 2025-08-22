// Browser API polyfills for SSR in test mode
// 테스트 모드에서 SSR 시 브라우저 API를 mock

if (typeof global !== 'undefined') {
  // MutationObserver polyfill
  if (!global.MutationObserver) {
    global.MutationObserver = class MutationObserver {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {
        // No-op in SSR
      }
      
      disconnect() {
        // No-op in SSR  
      }
      
      takeRecords() {
        return [];
      }
    };
  }

  // ResizeObserver polyfill
  if (!global.ResizeObserver) {
    global.ResizeObserver = class ResizeObserver {
      constructor(callback) {
        this.callback = callback;
      }
      
      observe() {
        // No-op in SSR
      }
      
      unobserve() {
        // No-op in SSR
      }
      
      disconnect() {
        // No-op in SSR
      }
    };
  }

  // IntersectionObserver polyfill
  if (!global.IntersectionObserver) {
    global.IntersectionObserver = class IntersectionObserver {
      constructor(callback, options) {
        this.callback = callback;
        this.options = options;
      }
      
      observe() {
        // No-op in SSR
      }
      
      unobserve() {
        // No-op in SSR
      }
      
      disconnect() {
        // No-op in SSR
      }
    };
  }

  // Performance API polyfill
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByName: () => [],
      getEntriesByType: () => [],
    };
  }

  // matchMedia polyfill
  if (!global.matchMedia) {
    global.matchMedia = (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
    });
  }

  // requestAnimationFrame polyfill
  if (!global.requestAnimationFrame) {
    global.requestAnimationFrame = (callback) => {
      return setTimeout(callback, 16);
    };
  }

  if (!global.cancelAnimationFrame) {
    global.cancelAnimationFrame = (id) => {
      clearTimeout(id);
    };
  }

  // Element methods polyfill
  if (!global.Element) {
    global.Element = class Element {
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          width: 0,
          height: 0,
          x: 0,
          y: 0,
        };
      }

      querySelector() {
        return null;
      }

      querySelectorAll() {
        return [];
      }
    };
  }

  // Navigator polyfill
  if (!global.navigator) {
    global.navigator = {
      userAgent: 'Node.js/Test',
      platform: 'linux',
      onLine: true,
    };
  }

  // Location polyfill
  if (!global.location) {
    global.location = {
      href: 'http://localhost:3000/',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: '',
    };
  }

  // History polyfill
  if (!global.history) {
    global.history = {
      pushState: () => {},
      replaceState: () => {},
      back: () => {},
      forward: () => {},
      go: () => {},
      length: 1,
      state: null,
    };
  }
}

// Export for potential manual import
module.exports = {
  setupPolyfills: () => {
    console.log('Browser API polyfills loaded for SSR test mode');
  }
};