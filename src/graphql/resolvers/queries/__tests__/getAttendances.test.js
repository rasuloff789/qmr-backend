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

		// Attendance yaratish - agar table mavjud bo'lsa
		try {
			await prisma.attendance.create({
				data: {
					courseId: course.id,
					studentId: student.id,
					date: new Date(),
					isPresent: true,
				},
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
});

