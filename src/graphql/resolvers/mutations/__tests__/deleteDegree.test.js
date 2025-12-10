/**
 * Jest Test Suite for deleteDegree Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteDegree } from "../addDegree.js";
import {
	createTestDegree,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("deleteDegree Mutation", () => {
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
		it("Degree o'chirish kerak", async () => {
			const degree = await createTestDegree();
			const context = createMockContext();
			const result = await deleteDegree(null, { id: String(degree.id) }, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			const deleted = await prisma.degree.findUnique({ where: { id: degree.id } });
			expect(deleted).toBeNull();
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteDegree(null, { id: "99999" }, context);

			expect(result.success).toBe(false);
		});
	});
});

