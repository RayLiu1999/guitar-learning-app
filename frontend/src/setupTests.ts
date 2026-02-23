import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// 每個測試後清理 DOM
afterEach(() => {
  cleanup();
});

// Polyfill jsdom 缺少的 CSS.supports
if (typeof window !== 'undefined' && typeof window.CSS === 'undefined') {
  Object.defineProperty(window, 'CSS', { value: {} });
}
if (typeof window !== 'undefined' && typeof window.CSS.supports === 'undefined') {
  window.CSS.supports = () => true;
}

// Polyfill jsdom 缺少的 window.matchMedia
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
