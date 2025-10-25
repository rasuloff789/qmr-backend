import { prisma } from "../../../database/index.js";

/**
 * Change the 'isActive' status of an admin user.
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string|number} args.adminId - ID of the admin to change
 * @param {boolean} args.isActive - New isActive status
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated admin object
 */
const changeAdminActive = async (_parent, { adminId, isActive }, context) => {
	try {
		// Validate input
		if (typeof isActive !== "boolean") {
			return {
				success: false,
				message: "The 'isActive' field must be a boolean.",
				admin: null,
				errors: ["The 'isActive' field must be a boolean."],
				timestamp: new Date().toISOString(),
			};
		}
		const id = parseInt(adminId);
		if (isNaN(id)) {
			return {
				success: false,
				message: "Invalid admin ID.",
				admin: null,
				errors: ["Invalid admin ID."],
				timestamp: new Date().toISOString(),
			};
		}
		// Check if admin exists
		const existingAdmin = await prisma.admin.findUnique({
			where: { id },
		});
		if (!existingAdmin) {
			return {
				success: false,
				message: "Admin not found.",
				admin: null,
				errors: ["Admin not found."],
				timestamp: new Date().toISOString(),
			};
		}
		// Update isActive
		const updatedAdmin = await prisma.admin.update({
			where: { id },
			data: { isActive },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				isActive: true,
				createdAt: true,
			},
		});
		return {
			success: true,
			message: "Admin status updated successfully",
			admin: updatedAdmin,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Change admin active error:", error);
		return {
			success: false,
			message: error.message || "Failed to update admin status",
			admin: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { changeAdminActive };
