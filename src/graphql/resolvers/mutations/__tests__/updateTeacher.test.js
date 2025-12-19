/**
 * Jest Test Suite for updateTeacher Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateTeacher } from "../updateTeacher.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateTeacher Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
		courses: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const degree2 = await createTestDegree();
		testData.degrees.push(degree2);

		const teacher = await createTestTeacher({
			degreeIds: [degree.id, degree2.id],
		});
		testData.teachers.push(teacher);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [] };
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

		it("Active course degree'ini olib tashlashga harakat qilsa xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const teacher = testData.teachers[0];
			const degreeInUse = testData.degrees[0];
			const otherDegree = testData.degrees[1];

			// Create an active course for this teacher that requires degreeInUse.
			// Make it active regardless of current date by setting endAt to null.
			const course = await createTestCourse({
				teacherId: teacher.id,
				degreeIds: [degreeInUse.id],
				startAt: new Date("2024-01-01"),
				endAt: null,
			});
			testData.courses.push(course);

			// Try to update teacher degrees removing degreeInUse
			const result = await updateTeacher(
				null,
				{
					id: String(teacher.id),
					degreeIds: [String(otherDegree.id)],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.message.toLowerCase()).toContain("cannot update teacher degrees");
			expect(
				(result.errors || []).some((e) => String(e).includes(String(degreeInUse.id)))
			).toBe(true);
		});
	});
});

