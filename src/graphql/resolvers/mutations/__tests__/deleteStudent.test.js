/**
 * Jest Test Suite for deleteStudent Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteStudent } from "../deleteStudent.js";
import {
	createTestDegree,
	createTestStudent,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("deleteStudent Mutation", () => {
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
		it("Student o'chirish kerak (isDeleted = true)", async () => {
			const context = createMockContext();
			const result = await deleteStudent(
				null,
				{ id: String(testData.students[0].id) },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			const deleted = await prisma.student.findUnique({
				where: { id: testData.students[0].id },
			});
			expect(deleted.isDeleted).toBe(true);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteStudent(null, { id: "99999" }, context);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri ID format bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteStudent(null, { id: "invalid" }, context);

			expect(result.success).toBe(false);
		});
	});
});

