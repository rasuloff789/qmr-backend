/**
 * Jest Test Suite for addDegree Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addDegree } from "../addDegree.js";
import {
	createTestDegree,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("addDegree Mutation", () => {
	let testData = {
		degrees: [],
	};

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri name bilan degree yaratish kerak", async () => {
			const context = createMockContext();
			const args = {
				name: `Test Degree ${Date.now()}-${Math.random().toString(36).substring(7)}`,
			};

			const result = await addDegree(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.degree).toBeTruthy();
			expect(result.degree.name).toBe(args.name.trim());
			testData.degrees.push(result.degree);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Bo'sh name bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addDegree(null, { name: "" }, context);

			expect(result.success).toBe(false);
			expect(result.degree).toBeNull();
			expect(result.errors).toBeTruthy();
		});

		it("Faqat bo'shliqlardan iborat name bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addDegree(null, { name: "   " }, context);

			expect(result.success).toBe(false);
		});
	});

	describe("Duplicate xatolar", () => {
		it("Mavjud degree name bilan xato qaytarishi kerak", async () => {
			const existingDegree = await createTestDegree();
			testData.degrees.push(existingDegree);

			const context = createMockContext();
			const result = await addDegree(
				null,
				{ name: existingDegree.name },
				context
			);

			expect(result.success).toBe(false);
			expect(
				result.errors.some((e) => e.toLowerCase().includes("already exists"))
			).toBe(true);
		});
	});
});

