import { prisma } from "../../database/index.js";

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
	// Validate input
	if (typeof isActive !== "boolean") {
		throw new Error("The 'isActive' field must be a boolean.");
	}
	const id = parseInt(adminId);
	if (isNaN(id)) {
		throw new Error("Invalid admin ID.");
	}
	// Check if admin exists
	const existingAdmin = await prisma.admin.findUnique({
		where: { id },
	});
	if (!existingAdmin) {
		throw new Error("Admin not found.");
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
	return updatedAdmin;
};

export { changeAdminActive };
