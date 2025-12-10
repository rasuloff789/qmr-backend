/**
 * Jest Test Suite for removeStudentFromCourse Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { removeStudentFromCourse } from "../removeStudentFromCourse.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestStudent,
	createTestCourse,
	createTestEnrollment,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("removeStudentFromCourse Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
		students: [],
		courses: [],
		enrollments: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const teacher = await createTestTeacher({
			gender: "MALE",
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);

		const student = await createTestStudent({
			gender: "MALE",
			degreeIds: [degree.id],
		});
		testData.students.push(student);

		const course = await createTestCourse({
			name: `Test Course ${Date.now()}`,
			teacherId: teacher.id,
			degreeIds: [degree.id],
		});
		testData.courses.push(course);

		const enrollment = await createTestEnrollment({
			courseId: course.id,
			studentId: student.id,
		});
		testData.enrollments.push(enrollment);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = {
			degrees: [],
			teachers: [],
			students: [],
			courses: [],
			enrollments: [],
		};
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Studentni coursedan o'chirish kerak", async () => {
			const context = createMockContext();
			const result = await removeStudentFromCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			const enrollment = await prisma.courseStudent.findUnique({
				where: {
					courseId_studentId: {
						courseId: testData.courses[0].id,
						studentId: testData.students[0].id,
					},
				},
			});
			expect(enrollment.isDeleted).toBe(true);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan enrollment bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await removeStudentFromCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: "99999",
				},
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

