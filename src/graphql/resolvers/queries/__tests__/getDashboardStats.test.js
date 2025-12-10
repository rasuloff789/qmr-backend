/**
 * Jest Test Suite for getDashboardStats Query
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import getDashboardStats from "../getDashboardStats.js";
import {
	createTestDegree,
	createTestTeacher,
	createTestStudent,
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("getDashboardStats Query", () => {
	let testData = {
		degrees: [],
		teachers: [],
		students: [],
		admins: [],
	};

	beforeEach(async () => {
		const degree = await createTestDegree();
		testData.degrees.push(degree);

		// Bir nechta ma'lumotlar yaratish
		const teacher = await createTestTeacher({
			degreeIds: [degree.id],
		});
		testData.teachers.push(teacher);

		const student = await createTestStudent({
			degreeIds: [degree.id],
		});
		testData.students.push(student);

		const admin = await createTestAdmin();
		testData.admins.push(admin);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { degrees: [], teachers: [], students: [], admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("Dashboard statistikalarni qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await getDashboardStats(null, {}, context);

			expect(result).toBeTruthy();
			expect(result).toHaveProperty("totalStudents");
			expect(result).toHaveProperty("totalTeachers");
			expect(result).toHaveProperty("totalAdmins");
			expect(result).toHaveProperty("activeStudents");
			expect(result).toHaveProperty("activeTeachers");
			expect(result).toHaveProperty("activeAdmins");
		});
	});
});

