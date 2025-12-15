/**
 * Jest Test Suite for addCourse Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addCourse } from "../addCourse.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("addCourse Mutation", () => {
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
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri ma'lumotlar bilan course yaratish kerak", async () => {
			const context = createMockContext();
			const args = {
				name: `Test Course ${Date.now()}`,
				description: "Test description",
				daysOfWeek: ["MONDAY", "WEDNESDAY"],
				gender: "MALE",
				startAt: "2024-01-01T00:00:00Z",
				endAt: "2024-12-31T00:00:00Z",
				startTime: "2024-01-01T09:00:00Z",
				endTime: "2024-01-01T11:00:00Z",
				teacherId: testData.teachers[0].id,
				degreeIds: [String(testData.degrees[0].id)],
			};

			const result = await addCourse(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.course).toBeTruthy();
			expect(result.course.name).toBe(args.name.trim());
			testData.courses.push(result.course);
		});

		it("CHILD course uchun MALE teacher bilan course yaratish kerak", async () => {
			const context = createMockContext();
			const args = {
				name: `Test Child Course ${Date.now()}`,
				description: "Test description",
				daysOfWeek: ["MONDAY", "WEDNESDAY"],
				gender: "CHILD",
				startAt: "2024-01-01T00:00:00Z",
				endAt: "2024-12-31T00:00:00Z",
				startTime: "2024-01-01T09:00:00Z",
				endTime: "2024-01-01T11:00:00Z",
				teacherId: testData.teachers[0].id,
				degreeIds: [String(testData.degrees[0].id)],
			};

			const result = await addCourse(null, args, context);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.course).toBeTruthy();
			expect(result.course.gender).toBe("CHILD");
			testData.courses.push(result.course);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Bo'sh name bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addCourse(
				null,
				{
					name: "",
					daysOfWeek: ["MONDAY"],
					gender: "MALE",
					startAt: "2024-01-01T00:00:00Z",
					endAt: "2024-12-31T00:00:00Z",
					startTime: "2024-01-01T09:00:00Z",
					endTime: "2024-01-01T11:00:00Z",
					teacherId: testData.teachers[0].id,
					degreeIds: [String(testData.degrees[0].id)],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.course).toBeNull();
		});

		it("Bo'sh daysOfWeek bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addCourse(
				null,
				{
					name: "Test Course",
					daysOfWeek: [],
					gender: "MALE",
					startAt: "2024-01-01T00:00:00Z",
					endAt: "2024-12-31T00:00:00Z",
					startTime: "2024-01-01T09:00:00Z",
					endTime: "2024-01-01T11:00:00Z",
					teacherId: testData.teachers[0].id,
					degreeIds: [String(testData.degrees[0].id)],
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Mavjud bo'lmagan teacherId bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addCourse(
				null,
				{
					name: `Test Course ${Date.now()}`,
					daysOfWeek: ["MONDAY"],
					gender: "MALE",
					startAt: "2024-01-01T00:00:00Z",
					endAt: "2024-12-31T00:00:00Z",
					startTime: "2024-01-01T09:00:00Z",
					endTime: "2024-01-01T11:00:00Z",
					teacherId: 99999,
					degreeIds: [String(testData.degrees[0].id)],
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Duplicate course name bilan xato qaytarishi kerak", async () => {
			const course = await createTestCourse({
				name: `Duplicate Course ${Date.now()}`,
				teacherId: testData.teachers[0].id,
				degreeIds: [testData.degrees[0].id],
			});
			testData.courses.push(course);

			const context = createMockContext();
			const result = await addCourse(
				null,
				{
					name: course.name,
					daysOfWeek: ["MONDAY"],
					gender: "MALE",
					startAt: "2024-01-01T00:00:00Z",
					endAt: "2024-12-31T00:00:00Z",
					startTime: "2024-01-01T09:00:00Z",
					endTime: "2024-01-01T11:00:00Z",
					teacherId: testData.teachers[0].id,
					degreeIds: [String(testData.degrees[0].id)],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(
				result.errors.some((e) => e.toLowerCase().includes("already exists"))
			).toBe(true);
		});
	});
});

