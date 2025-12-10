/**
 * Jest Test Suite for updateTeacherActive Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateTeacherActive } from "../updateTeacherActive.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateTeacherActive Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const teacher = await createTestTeacher({
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Teacher isActive statusini yangilash kerak", async () => {
			const context = createMockContext();
			const result = await updateTeacherActive(
				null,
				{ id: String(testData.teachers[0].id), isActive: false },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.teacher.isActive).toBe(false);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateTeacherActive(
				null,
				{ id: "99999", isActive: true },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

