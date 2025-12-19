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

		const courseMale = await createTestCourse({
			name: `Test Course MALE ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "MALE",
		});
		const courseFemale = await createTestCourse({
			name: `Test Course FEMALE ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "FEMALE",
		});
		const courseChild = await createTestCourse({
			name: `Test Course CHILD ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
			gender: "CHILD",
		});
		testData.courses.push(courseMale, courseFemale, courseChild);
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
			expect(result.length).toBeGreaterThanOrEqual(3);
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

		it("Teacher faqat o'z course'larini ko'rishi kerak", async () => {
			const degree = testData.degrees[0];

			const teacher2 = await createTestTeacher({
				gender: "MALE",
				degreeIds: [degree.id],
			});
			testData.teachers.push(teacher2);

			const course2 = await createTestCourse({
				name: `Test Course Other Teacher ${Date.now()}`,
				teacherId: teacher2.id,
				degreeIds: [degree.id],
			});
			testData.courses.push(course2);

			const contextTeacher1 = createMockContext({
				id: testData.teachers[0].id,
				role: "teacher",
			});
			const result = await getCourses(null, {}, contextTeacher1);

			const teacherIds = result.map((c) => c.teacher?.id);
			expect(teacherIds.every((id) => id === testData.teachers[0].id)).toBe(true);
		});

		it("ADMIN FEMALE faqat FEMALE va CHILD coursesni ko'rishi kerak", async () => {
			const contextAdminFemale = createMockContext({
				id: 1,
				role: "admin",
				gender: "FEMALE",
			});
			const result = await getCourses(null, {}, contextAdminFemale);

			expect(Array.isArray(result)).toBe(true);
			expect(result.every((c) => ["FEMALE", "CHILD"].includes(c.gender))).toBe(true);
			expect(result.some((c) => c.gender === "FEMALE")).toBe(true);
			expect(result.some((c) => c.gender === "CHILD")).toBe(true);
			expect(result.some((c) => c.gender === "MALE")).toBe(false);
		});

		it("ADMIN MALE faqat MALE va CHILD coursesni ko'rishi kerak", async () => {
			const contextAdminMale = createMockContext({
				id: 1,
				role: "admin",
				gender: "MALE",
			});
			const result = await getCourses(null, {}, contextAdminMale);

			expect(Array.isArray(result)).toBe(true);
			expect(result.every((c) => ["MALE", "CHILD"].includes(c.gender))).toBe(true);
			expect(result.some((c) => c.gender === "MALE")).toBe(true);
			expect(result.some((c) => c.gender === "CHILD")).toBe(true);
			expect(result.some((c) => c.gender === "FEMALE")).toBe(false);
		});

		it("ADMIN gender null bo'lsa courses bo'sh qaytishi kerak", async () => {
			const contextAdminNoGender = createMockContext({
				id: 1,
				role: "admin",
				gender: null,
			});
			const result = await getCourses(null, {}, contextAdminNoGender);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBe(0);
		});
	});
});

