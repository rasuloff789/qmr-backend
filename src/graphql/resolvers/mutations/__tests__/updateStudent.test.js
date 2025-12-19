/**
 * Jest Test Suite for updateStudent Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateStudent } from "../updateStudent.js";
import {
	createTestDegree,
	createTestStudent,
	createTestTeacher,
	createTestCourse,
	createTestEnrollment,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateStudent Mutation", () => {
	let testData = {
		degrees: [],
		teachers: [],
		courses: [],
		students: [],
		enrollments: [],
	};

	beforeEach(async () => {
		const degree1 = await createTestDegree();
		const degree2 = await createTestDegree();
		testData.degrees.push(degree1, degree2);

		const student = await createTestStudent({
			gender: "MALE",
			degreeIds: [degree1.id, degree2.id],
		});
		testData.students.push(student);

		// Create an active course that requires degree1 and enroll student into it.
		const teacher = await createTestTeacher({
			gender: "MALE",
			degreeIds: [degree1.id],
		});
		testData.teachers.push(teacher);

		const course = await createTestCourse({
			teacherId: teacher.id,
			degreeIds: [degree1.id],
			gender: "MALE",
		});
		testData.courses.push(course);

		const enrollment = await createTestEnrollment({
			courseId: course.id,
			studentId: student.id,
			isActive: true,
			isDeleted: false,
		});
		testData.enrollments.push(enrollment);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], courses: [], students: [], enrollments: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri ma'lumotlar bilan student yangilash kerak", async () => {
			const context = createMockContext();
			const uniqueId = `${Date.now()}${Math.random()
				.toString(36)
				.substring(2, 4)}`;
			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					fullname: "Updated Student Name",
					username: `upd${uniqueId.slice(-7)}`,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(
						result.errors
					)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.student.fullname).toBe("Updated Student Name");
		});

		it("Student degree'larini yangilash kerak", async () => {
			const context = createMockContext();

			// Yangi degree yaratish
			const newDegree = await createTestDegree();
			testData.degrees.push(newDegree);

			// Student is actively enrolled in a course that requires testData.degrees[0],
			// so the updated degree list must still include that degree.
			const requiredDegree = testData.degrees[0];

			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					possibleDegrees: [String(requiredDegree.id), String(newDegree.id)],
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(
						result.errors
					)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.student.possibleDegrees.length).toBe(2);
			const ids = result.student.possibleDegrees.map((d) => d.id);
			expect(ids.includes(requiredDegree.id)).toBe(true);
			expect(ids.includes(newDegree.id)).toBe(true);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateStudent(
				null,
				{ id: "99999", fullname: "New Name" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Bo'sh possibleDegrees listi bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					possibleDegrees: [],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.errors).toContain("At least one degree must be provided");
		});

		it("Noto'g'ri degree ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					possibleDegrees: ["99999"],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.errors).toContain("One or more degree IDs are invalid");
		});

		it("Active enrollment course degree'larini yo'q qilib yuborsa xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const degreeRequiredByCourse = testData.degrees[0];
			const otherDegree = testData.degrees[1];

			// Course requires degreeRequiredByCourse; try removing it from student possibleDegrees
			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					possibleDegrees: [String(otherDegree.id)],
				},
				context
			);

			expect(result.success).toBe(false);
			expect(result.message.toLowerCase()).toContain("cannot update student degrees");
			expect(
				(result.errors || []).some((e) =>
					String(e).includes(String(degreeRequiredByCourse.id))
				)
			).toBe(true);
		});
	});
});
