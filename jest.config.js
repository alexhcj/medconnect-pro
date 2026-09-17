const nextJest = require('next/jest');

const createJestConfig = nextJest({
	dir: './',
});

/** @type {import('jest').Config} */
const config = {
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
	testPathIgnorePatterns: ['/node_modules/', '/.next/'],
	moduleNameMapper: {
		'^@/(.*)$': '<rootDir>/src/$1',
		'^@docs/(.*)$': '<rootDir>/docs/$1',
	},
};

module.exports = createJestConfig(config);
