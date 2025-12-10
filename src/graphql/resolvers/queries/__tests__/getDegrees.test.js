/**
 * Jest Test Suite for getDegrees Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getDegrees } from "../getDegrees.js";
import {
	createTestDegree,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getDegrees Query", () => {
	let testData = {
		degrees: [],
	};

	beforeEach(async () => {
		for (let i = 0; i < 3; i++) {
			const degree = await createTestDegree();
			testData.degrees.push(degree);
		}
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Barcha degreesni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getDegrees(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(3);
		});

		it("Degree barcha kerakli maydonlar bilan qaytarilishi kerak", async () => {
			const context = createMockContext();
			const result = await getDegrees(null, {}, context);

			if (result.length > 0) {
				const degree = result[0];
				expect(degree).toHaveProperty("id");
				expect(degree).toHaveProperty("name");
				expect(degree).toHaveProperty("teachers");
				expect(degree).toHaveProperty("courses");
			}
		});
	});
});

