/**
 * Jest Test Suite for getDegree Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getDegree } from "../getDegrees.js";
import {
	createTestDegree,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getDegree Query", () => {
	let testData = {
		degrees: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Mavjud degree ID bilan degree qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getDegree(
				null,
				{ id: String(testData.degrees[0].id) },
				context
			);

			expect(result).toBeTruthy();
			expect(result.id).toBe(testData.degrees[0].id);
			expect(result.name).toBe(testData.degrees[0].name);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getDegree(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});
	});
});

