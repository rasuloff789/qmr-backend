/**
 * Jest Test Suite for getAttendances Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getAttendances from "../getAttendances.js";
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

describe("getAttendances Query", () => {
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

		const femaleStudent = await createTestStudent({
			gender: "FEMALE",
			degreeIds: [degree.id],
		});
		testData.students.push(femaleStudent);

		const childStudent = await createTestStudent({
			gender: "CHILD",
			degreeIds: [degree.id],
		});
		testData.students.push(childStudent);

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

		const femaleEnrollment = await createTestEnrollment({
			courseId: course.id,
			studentId: femaleStudent.id,
		});
		testData.enrollments.push(femaleEnrollment);

		const childEnrollment = await createTestEnrollment({
			courseId: course.id,
			studentId: childStudent.id,
		});
		testData.enrollments.push(childEnrollment);

		// Attendance yaratish - agar table mavjud bo'lsa
		try {
			const today = new Date();
			await prisma.attendance.createMany({
				data: [
					{
						courseId: course.id,
						studentId: student.id,
						date: today,
						isPresent: true,
					},
					{
						courseId: course.id,
						studentId: femaleStudent.id,
						date: today,
						isPresent: true,
					},
					{
						courseId: course.id,
						studentId: childStudent.id,
						date: today,
						isPresent: true,
					},
				],
			});
		} catch (error) {
			// Agar table mavjud bo'lmasa, test skip qilinadi
			if (error.message.includes("does not exist")) {
				console.warn("⚠️ Attendance table mavjud emas - test skip qilinadi");
			}
		}
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
		it("Barcha attendancelarni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getAttendances(null, {}, context);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(1);
		});

		it("CourseId filter bilan qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getAttendances(
				null,
				{ courseId: String(testData.courses[0].id) },
				context
			);

			expect(Array.isArray(result)).toBe(true);
			result.forEach((att) => {
				expect(att.course.id).toBe(testData.courses[0].id);
			});
		});
	});

	describe("Role-based scoping (ADMIN/ROOT)", () => {
		it("ADMIN FEMALE faqat FEMALE va CHILD student attendancelarini ko'rishi kerak", async () => {
			const context = createMockContext({
				id: 1,
				role: "admin",
				gender: "FEMALE",
			});
			const result = await getAttendances(
				null,
				{ courseId: String(testData.courses[0].id) },
				context
			);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result.every((a) => ["FEMALE", "CHILD"].includes(a.student.gender))).toBe(
				true
			);
		});

		it("ADMIN MALE faqat MALE va CHILD student attendancelarini ko'rishi kerak", async () => {
			const context = createMockContext({
				id: 1,
				role: "admin",
				gender: "MALE",
			});
			const result = await getAttendances(
				null,
				{ courseId: String(testData.courses[0].id) },
				context
			);

			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThanOrEqual(1);
			expect(result.every((a) => ["MALE", "CHILD"].includes(a.student.gender))).toBe(
				true
			);
		});

		it("ROOT barcha student attendancelarini ko'rishi kerak", async () => {
			const context = createMockContext({
				id: 1,
				role: "root",
			});
			const result = await getAttendances(
				null,
				{ courseId: String(testData.courses[0].id) },
				context
			);

			expect(Array.isArray(result)).toBe(true);
			// We created MALE + FEMALE + CHILD attendance rows for this course/date.
			const genders = new Set(result.map((a) => a.student.gender));
			expect(genders.has("MALE")).toBe(true);
			expect(genders.has("FEMALE")).toBe(true);
			expect(genders.has("CHILD")).toBe(true);
		});
	});
});

