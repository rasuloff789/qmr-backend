/**
 * Jest Test Suite for deleteAdmin Mutation
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { deleteAdmin } from "../deleteAdmin.js";
import {
	createTestAdmin,
	createMockContext,
	cleanupTestData,
} from "../../../../../tests/helpers/testHelpers.js";
import { prisma } from "../../../../database/index.js";

describe("deleteAdmin Mutation", () => {
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
		it("Admin o'chirish kerak (isDeleted = true)", async () => {
			const admin = await createTestAdmin();
			const context = createMockContext();
			const result = await deleteAdmin(
				null,
				{ adminId: String(admin.id) },
				context
			);

			if (!result.success) {
				throw new Error(
					`Test muvaffaqiyatsiz: ${result.message}. Xatolar: ${JSON.stringify(result.errors)}`
				);
			}

			expect(result.success).toBe(true);
			const deleted = await prisma.admin.findUnique({ where: { id: admin.id } });
			expect(deleted.isDeleted).toBe(true);
		});
	});

	describe("Xato holatlar", () => {
		it("Mavjud bo'lmagan ID bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteAdmin(null, { adminId: "99999" }, context);

			expect(result.success).toBe(false);
		});

		it("Noto'g'ri ID format bilan xato qaytarishi kerak", async () => {
			const context = createMockContext();
			const result = await deleteAdmin(null, { adminId: "invalid" }, context);

			expect(result.success).toBe(false);
		});
	});
});

