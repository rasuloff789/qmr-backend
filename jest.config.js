/**
 * Jest Configuration for QMR Backend
 * 
 * Jest test framework sozlamalari
 */

export default {
	// Test muhiti
	testEnvironment: "node",
	
	// ES Modules qo'llab-quvvatlash
	// extensionsToTreatAsEsm kerak emas, chunki package.json da "type": "module" bor
	
	// Test fayllarni qidirish
	testMatch: [
		"**/__tests__/**/*.test.js",
		"**/?(*.)+(spec|test).js",
	],
	
	// Eski custom test fayllarni ignore qilish (Jest formatida emas)
	testPathIgnorePatterns: [
		"/node_modules/",
		"/src/graphql/resolvers/mutations/__tests__/deleteCourse.test.js",
		"/src/graphql/resolvers/mutations/__tests__/addStudentToCourse.test.js",
	],
	
	// Modullarni qanday transform qilish
	transform: {},
	
	// Module name mapper (agar kerak bo'lsa)
	moduleNameMapper: {
		"^(\\.{1,2}/.*)\\.js$": "$1",
	},
	
	// Test setup fayli
	setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
	
	// Coverage sozlamalari
	collectCoverageFrom: [
		"src/**/*.js",
		"!src/**/*.test.js",
		"!src/**/__tests__/**",
		"!src/index.js",
		"!src/app.js",
	],
	
	// Coverage papkasi
	coverageDirectory: "coverage",
	
	// Coverage report formats
	coverageReporters: ["text", "lcov", "html", "json"],
	
	// Test timeout (milliseconds)
	testTimeout: 30000,
	
	// Clear mocks har bir testdan keyin
	clearMocks: true,
	
	// Restore mocks har bir testdan keyin
	restoreMocks: true,
	
	// Verbose output
	verbose: true,
	
	// Max workers (parallel test execution)
	maxWorkers: "50%",
};

