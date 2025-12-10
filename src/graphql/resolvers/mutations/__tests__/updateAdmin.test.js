/**
 * Jest Test Suite for updateAdmin Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { updateAdmin } from "../updateAdmin.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";

describe("updateAdmin Mutation", () => {
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
		it("To'g'ri ma'lumotlar bilan admin yangilash kerak", async () => {
			const context = createMockContext();
			const result = await updateAdmin(
				null,
				{
					id: String(testData.admins[0].id),
					fullname: "Updated Admin Name",
				},
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			expect(result.admin).toBeTruthy();
			expect(result.admin.fullname).toBe("Updated Admin Name");
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await updateAdmin(
				null,
				{ id: "99999", fullname: "New Name" },
				context
			);

			expect(result.success).toBe(false);
			expect(result.admin).toBeNull();
			expect(result.errors).toBeTruthy();
		});
	});
});

