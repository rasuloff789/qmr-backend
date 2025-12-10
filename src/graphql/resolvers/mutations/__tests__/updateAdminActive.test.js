/**
 * Jest Test Suite for updateAdminActive Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateAdminActive } from "../updateAdminActive.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("updateAdminActive Mutation", () => {
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
		it("Admin isActive statusini yangilash kerak", async () => {
			const context = createMockContext();
			const result = await updateAdminActive(
				null,
				{ adminId: String(testData.admins[0].id), isActive: false },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.admin.isActive).toBe(false);
		});
	});

	describe("Validatsiya xatoliklari", () => {
		it("Noto'g'ri isActive type bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateAdminActive(
				null,
				{ adminId: String(testData.admins[0].id), isActive: "not-boolean" },
				context
			);

			expect(result.success).toBe(false);
		});

		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateAdminActive(
				null,
				{ adminId: "99999", isActive: true },
				context
			);

			expect(result.success).toBe(false);
		});
	});
});

