/**
 * Jest Test Suite for updateStudentActive Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateStudentActive } from "../updateStudentActive.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("updateStudentActive Mutation", () => {
	let testData = {
		degrees: [],
		students: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const student = await createTestStudent({
			degreeIds: [degree.id],
		});
		testData.students.push(student);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], students: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Student isActive statusini yangilash kerak", async () => {
			const context = createMockContext();
			const result = await updateStudentActive(
				null,
				{ id: String(testData.students[0].id), isActive: false },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.student.isActive).toBe(false);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateStudentActive(
				null,
				{ id: "99999", isActive: true },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

