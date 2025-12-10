/**
 * Jest Test Suite for updateDegree Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateDegree } from "../addDegree.js";
import {
	createTestDegree,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateDegree Mutation", () => {
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
		it("To'g'ri name bilan degree yangilash kerak", async () => {
			const context = createMockContext();
			const newName = `Updated Degree ${Date.now()}-${Math.random().toString(36).substring(7)}`;
			const result = await updateDegree(
				null,
				{ id: String(testData.degrees[0].id), name: newName },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.degree.name).toBe(newName.trim());
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Bo'sh name bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateDegree(
				null,
				{ id: String(testData.degrees[0].id), name: "" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateDegree(
				null,
				{ id: "99999", name: "New Name" },
				context
			);

			expect(result.success).toBe(false);
		});
	});

	describe("Duplicate xatolar", () => {
		it("Mavjud degree name bilan xato qaytarishi kerak", async () => {
			const anotherDegree = await createTestDegree();
			testData.degrees.push(anotherDegree);

			const context = createMockContext();
			const result = await updateDegree(
				null,
				{ id: String(testData.degrees[0].id), name: anotherDegree.name },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

