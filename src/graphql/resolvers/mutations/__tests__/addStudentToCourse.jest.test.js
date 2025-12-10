/**
 * Jest Test Suite for addStudentToCourse Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { addStudentToCourse } from "../addStudentToCourse.js";
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

describe("addStudentToCourse Mutation", () => {
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
		it("To'g'ri ma'lumotlar bilan studentni coursega qo'shish kerak", async () => {
			const context = createMockContext();
			const result = await addStudentToCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
					monthlyPayment: 500000,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.courseStudent).toBeTruthy();
			expect(result.courseStudent.courseId).toBe(testData.courses[0].id);
			expect(result.courseStudent.studentId).toBe(testData.students[0].id);
			testData.enrollments.push(result.courseStudent);
		});

		it("O'chirilgan enrollmentni qayta aktivlashtirish kerak", async () => {
			// Avval enrollment yaratish va o'chirish
			const enrollment = await createTestEnrollment({
				courseId: testData.courses[0].id,
				studentId: testData.students[0].id,
				isDeleted: true,
			});

			const context = createMockContext();
			const result = await addStudentToCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
					monthlyPayment: 600000,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.message).toContain("re-enrolled");
			testData.enrollments.push(result.courseStudent);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Majburiy maydonlar bo'sh bo'lsa xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addStudentToCourse(
				null,
				{
					courseId: null,
					studentId: String(testData.students[0].id),
					monthlyPayment: 500000,
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri monthlyPayment bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await addStudentToCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
					monthlyPayment: 0,
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Mavjud enrollment bilan xato qaytarishi kerak", async () => {
			// Avval enrollment yaratish
			const enrollment = await createTestEnrollment({
				courseId: testData.courses[0].id,
				studentId: testData.students[0].id,
			});
			testData.enrollments.push(enrollment);

			const context = createMockContext();
			const result = await addStudentToCourse(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
					monthlyPayment: 500000,
				},
				context
			);

			expect(result.success).toBe(false);
			expect(
				result.errors.some((e) =>
					e.toLowerCase().includes("already enrolled")
				)
			).toBe(true);
		});
	});
});

