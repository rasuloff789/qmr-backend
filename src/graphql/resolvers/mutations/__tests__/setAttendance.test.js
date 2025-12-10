/**
 * Jest Test Suite for setAttendance Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { setAttendance } from "../setAttendance.js";
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

describe("setAttendance Mutation", () => {
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
			daysOfWeek: ["MONDAY"],
		});
		testData.courses.push(course);

		const enrollment = await createTestEnrollment({
			courseId: course.id,
			studentId: student.id,
		});
		testData.enrollments.push(enrollment);
	});

	afterEach(async () => {
		// Attendancesni o'chirish - agar table mavjud bo'lsa
		try {
			await prisma.attendance.deleteMany({
				where: {
					courseId: { in: testData.courses.map((c) => c.id) },
					studentId: { in: testData.students.map((s) => s.id) },
				},
			});
		} catch (error) {
			// Ignore agar table mavjud bo'lmasa
		}

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
		it("Attendance yaratish kerak", async () => {
			const context = createMockContext({
				id: testData.teachers[0].id,
				role: "teacher",
			});

			// Monday sanani topish
			const courseStartDate = new Date(testData.courses[0].startAt);
			const monday = new Date(courseStartDate);
			
			while (monday.getDay() !== 1) monday.setDate(monday.getDate() + 1);

			const result = await setAttendance(
				null,
				{
					courseId: String(testData.courses[0].id),
					studentId: String(testData.students[0].id),
					date: monday.toISOString(),
					isPresent: true,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.attendance).toBeTruthy();
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Majburiy maydonlar bo'sh bo'lsa xato qaytarishi kerak", async () => {
			const context = createMockContext({
				id: testData.teachers[0].id,
				role: "teacher",
			});

			const result = await setAttendance(
				null,
				{
					courseId: null,
					studentId: String(testData.students[0].id),
					date: new Date().toISOString(),
					isPresent: true,
				},
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

