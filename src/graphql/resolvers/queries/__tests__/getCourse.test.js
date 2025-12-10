/**
 * Jest Test Suite for getCourse Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getCourse } from "../getCourses.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getCourse Query", () => {
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
		it("Mavjud course ID bilan course qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourse(
				null,
				{ id: String(testData.courses[0].id) },
				context
			);

			expect(result).toBeTruthy();
			expect(result.id).toBe(testData.courses[0].id);
			expect(result.name).toBe(testData.courses[0].name);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan null qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourse(null, { id: "99999" }, context);

			expect(result).toBeNull();
		});
	});
});

