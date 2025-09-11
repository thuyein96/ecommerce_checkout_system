import "@testing-library/jest-dom";

// Mock console.log, console.warn, console.error to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
