/**
 * Jest Test Suite for login Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { login } from "../login.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { hashPassword } from "../../../../utils/auth/password.js";
import { prisma } from "../../../../database/index.js";

describe("login Mutation", () => {
	let testData = {
		admins: [],
	};

	beforeEach(async () => {
		// Admin yaratish va parolni bilamiz
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
		it("To'g'ri ma'lumotlar bilan login qilish kerak", async () => {
			const result = await login(null, {
				username: testData.admins[0].username,
				password: "Password123",
				userType: "admin",
			});

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.token).toBeTruthy();
			expect(result.user).toBeTruthy();
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Majburiy maydonlar bo'sh bo'lsa xato qaytarishi kerak", async () => {
			const result = await login(null, {
				username: null,
				password: "Password123",
				userType: "admin",
			});

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri parol bilan xato qaytarishi kerak", async () => {
			const result = await login(null, {
				username: testData.admins[0].username,
				password: "WrongPassword123",
				userType: "admin",
			});

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri userType bilan xato qaytarishi kerak", async () => {
			const result = await login(null, {
				username: testData.admins[0].username,
				password: "Password123",
				userType: "invalid",
			});

			expect(result.success).toBe(false);
		});
	});
});

