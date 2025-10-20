/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\.(less|css)$': 'identity-obj-proxy',
    '\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.js',
  },
  transform: {
    '^.+\.[tj]sx?$': 'ts-jest',
  },
  // Avoid using system Temp for Jest cache (some Windows environments lock Temp files).
  cacheDirectory: '<rootDir>/.jest-cache',
  transformIgnorePatterns: [
    '/node_modules/(?!color-convert)/',
  ],
  testMatch: ['<rootDir>/src/**/*.test.tsx', '<rootDir>/server/src/**/?(*.)+(test).[tj]s?(x)'],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.jest.json',
    },
  },
};
