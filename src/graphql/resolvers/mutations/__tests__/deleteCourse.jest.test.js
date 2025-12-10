/**
 * Jest Test Suite for deleteCourse Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteCourse } from "../deleteCourse.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestCourse,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("deleteCourse Mutation", () => {
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
		it("Course to'liq o'chirilishi kerak (hard delete)", async () => {
			const course = await createTestCourse({
				name: `Delete Course ${Date.now()}`,
				teacherId: testData.teachers[0].id,
				degreeIds: [testData.degrees[0].id],
			});
			// testData.courses.push(course) qilmaymiz, chunki course o'chiriladi

			const context = createMockContext();
			const result = await deleteCourse(
				null,
				{ courseId: String(course.id) },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.message).toContain("deleted successfully");
			
			// Course to'liq o'chirilgan bo'lishi kerak (hard delete)
			const deleted = await prisma.course.findUnique({
				where: { id: course.id },
			});
			expect(deleted).toBeNull();
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Majburiy maydonlar bo'sh bo'lsa xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteCourse(
				null,
				{ courseId: null },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri courseId format bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteCourse(
				null,
				{ courseId: "invalid" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteCourse(
				null,
				{ courseId: "99999" },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

