/**
 * Jest Test Suite for updateStudent Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateStudent } from "../updateStudent.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateStudent Mutation", () => {
	let testData = {
		degrees: [],
		students: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		const student = await createTestStudent({
			degreeIds: [degree.id],
		});
		testData.students.push(student);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], students: [] };
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

			const result = await updateStudent(
				null,
				{
					id: String(testData.students[0].id),
					possibleDegrees: [String(newDegree.id)],
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
			expect(result.student.possibleDegrees.length).toBe(1);
			expect(result.student.possibleDegrees[0].id).toBe(newDegree.id);
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
	});
});
