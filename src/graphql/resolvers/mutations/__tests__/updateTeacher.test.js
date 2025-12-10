/**
 * Jest Test Suite for updateTeacher Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateTeacher } from "../updateTeacher.js";
import {
	createTestDegree,
	createTestTeacher,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateTeacher Mutation", () => {
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
		it("To'g'ri ma'lumotlar bilan teacher yangilash kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random().toString(36).substring(2, 4)}`;
			const result = await updateTeacher(
				null,
				{
					id: String(testData.teachers[0].id),
					fullname: "Updated Teacher Name",
					username: `tch${uniqueId.slice(-7)}`,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.teacher.fullname).toBe("Updated Teacher Name");
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateTeacher(
				null,
				{ id: "99999", fullname: "New Name" },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

