import { prisma } from "../../../database/index.js";

/**
 * "Delete" an admin user by setting isDeleted property to true.
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string|number} args.adminId - ID of the admin to update
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated admin object
 */
const deleteAdmin = async (_parent, { adminId }, context) => {
	try {
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

		// Update isDeleted to true
		const updatedAdmin = await prisma.admin.update({
			where: { id },
			data: { isDeleted: true },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				isActive: true,
				createdAt: true,
				// isDeleted is not exposed in the GraphQL type - omitted from returned object
			},
		});

		return {
			success: true,
			message: "Admin deleted successfully",
			admin: updatedAdmin,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Delete admin error:", error);
		return {
			success: false,
			message: error.message || "Failed to delete admin",
			admin: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { deleteAdmin };
