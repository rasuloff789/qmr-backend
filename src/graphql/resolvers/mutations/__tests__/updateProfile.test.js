/**
 * Jest Test Suite for updateProfile Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateProfile } from "../updateProfile.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateProfile Mutation", () => {
	let testData = {
		admins: [],
	};

	beforeEach(async () => {
		const admin = await createTestAdmin();
		testData.admins.push(admin);
	});

	afterEach(async () => {
		await cleanupTestData(testData);
		testData = { admins: [] };
	});

	describe("Muvaffaqiyatli testlar", () => {
		it("To'g'ri ma'lumotlar bilan profile yangilash kerak", async () => {
			const context = createMockContext({
				id: testData.admins[0].id,
				role: "admin",
			});

			const result = await updateProfile(
				null,
				{
					phone: "998901234567",
					tgUsername: `newusername${Date.now().toString().slice(-8)}`,
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.user).toBeTruthy();
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("User bo'lmasa xato qaytarishi kerak", async () => {
			const context = createMockContext(null);

			const result = await updateProfile(
				null,
				{
					phone: "998901234567",
				},
				context
			);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri phone format bilan xato qaytarishi kerak", async () => {
			const context = createMockContext({
				id: testData.admins[0].id,
				role: "admin",
			});

			const result = await updateProfile(
				null,
				{
					phone: "12345",
				},
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

