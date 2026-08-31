import '@testing-library/jest-dom';

// Reset localStorage between tests
beforeEach(() => {
  localStorage.clear();
});

// Silence console.error in tests (noisy from React act() warnings)
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (typeof args[0] === 'string' && args[0].includes('act(')) return;
    originalError(...args);
  };
});
afterAll(() => { console.error = originalError; });
