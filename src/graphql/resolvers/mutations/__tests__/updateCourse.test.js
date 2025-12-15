/**
 * Jest Test Suite for updateCourse Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateCourse } from "../updateCourse.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateCourse Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
		courses: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const teacher = await createTestTeacher({
			gender: "MALE",
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);

		const course = await createTestCourse({
			name: `Test Course ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
		});
		testData.courses.push(course);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri ma'lumotlar bilan course yangilash kerak", async () => {
			const context = createMockContext();
			const result = await updateCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					name: `Updated Course ${Date.now()}`,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.course).toBeTruthy();
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateCourse(
				null,
				{ courseId: "99999", name: "New Name" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Bo'sh name bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateCourse(
				null,
				{ courseId: String(testData.courses[0].id), name: "" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Teacher gender course gender bilan mos kelmasa xato qaytarishi kerak", async () => {
			// Existing course gender comes from createTestCourse default: MALE
			const degree = testData.degrees[0];
			const femaleTeacher = await createTestTeacher({
				gender: "FEMALE",
				degreeIds: [degree.id],
			});
			testData.teachers.push(femaleTeacher);

			const context = createMockContext();
			const result = await updateCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					teacherId: String(femaleTeacher.id),
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.errors?.join(" ").toLowerCase()).toContain("gender");
		});

		it("Teacher degreeIds bilan mos kelmasa (hech bo'lmasa bittasi mos bo'lmasa) xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const otherDegree = await createTestDegree();
			testData.degrees.push(otherDegree);

			// Existing teacher has only the initial degree, so updating course degrees to otherDegree should fail
			const result = await updateCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					degreeIds: [String(otherDegree.id)],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.errors?.join(" ").toLowerCase()).toContain("degree");
		});
	});
});

