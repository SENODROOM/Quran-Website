import '@testing-library/jest-dom';

// Silence console.error in test output for cleaner results
// (uncomment if you want to suppress noise)
// const originalError = console.error;
// beforeAll(() => { console.error = jest.fn(); });
// afterAll(() => { console.error = originalError; });

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock clipboard
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: jest.fn(() => Promise.resolve()) },
  writable: true,
});
