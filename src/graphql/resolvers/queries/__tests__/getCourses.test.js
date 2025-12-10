/**
 * Jest Test Suite for getCourses Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { getCourses } from "../getCourses.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getCourses Query", () => {
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

		for (let i = 0; i < 2; i++) {
			const course = await createTestCourse({
				name: `Test Course ${i} ${Date.now()}`,
				teacherId: teacher.id,
				degreeIds: [degree.id],
			});
			testData.courses.push(course);
		}
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Barcha coursesni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourses(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(2);
		});

		it("Course barcha kerakli maydonlar bilan qaytarilishi kerak", async () => {
			const context = createMockContext();
			const result = await getCourses(null, {}, context);

			if (result.length > 0) {
				const course = result[0];
				expect(course).toHaveProperty("id");
				expect(course).toHaveProperty("name");
				expect(course).toHaveProperty("teacher");
				expect(course).toHaveProperty("degrees");
			}
		});
	});
});

