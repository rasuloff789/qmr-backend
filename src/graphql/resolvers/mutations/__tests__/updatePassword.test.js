/**
 * Jest Test Suite for updatePassword Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updatePassword } from "../updatePassword.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { hashPassword, verifyPassword } from "../../../../utils/auth/password.js";
import { prisma } from "../../../../database/index.js";

describe("updatePassword Mutation", () => {
	let testData = {
		admins: [],
	};

	beforeEach(async () => {
		// Admin yaratish va parolini bilamiz
		const admin = await createTestAdmin();
		// Parolni "Password123" ga o'rnatamiz
		await prisma.admin.update({
			where: { id: admin.id },
			data: { password: await hashPassword("Password123") },
		});
		testData.admins.push(admin);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri parol bilan password yangilash kerak", async () => {
			const context = createMockContext({
				id: testData.admins[0].id,
				role: "admin",
			});

			const result = await updatePassword(
				null,
				{
					currentPassword: "Password123",
					newPassword: "NewPassword123",
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);

			// Yangi parolni tekshirish
			const updatedAdmin = await prisma.admin.findUnique({
				where: { id: testData.admins[0].id },
			});
			const isPasswordCorrect = await verifyPassword(
				"NewPassword123",
				updatedAdmin.password
			);
			expect(isPasswordCorrect).toBe(true);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Noto'g'ri current password bilan xato qaytarishi kerak", async () => {
			const context = createMockContext({
				id: testData.admins[0].id,
				role: "admin",
			});

			const result = await updatePassword(
				null,
				{
					currentPassword: "WrongPassword123",
					newPassword: "NewPassword123",
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Kuchsiz new password bilan xato qaytarishi kerak", async () => {
			const context = createMockContext({
				id: testData.admins[0].id,
				role: "admin",
			});

			const result = await updatePassword(
				null,
				{
					currentPassword: "Password123",
					newPassword: "weak",
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("User bo'lmasa xato qaytarishi kerak", async () => {
			const context = createMockContext(null);

			const result = await updatePassword(
				null,
				{
					currentPassword: "Password123",
					newPassword: "NewPassword123",
				},
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

