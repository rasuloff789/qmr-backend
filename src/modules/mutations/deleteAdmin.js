import prisma from "../../config/db.js";

/**
 * "Delete" an admin user by setting isDeleted property to true.
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string|number} args.adminId - ID of the admin to update
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated admin object
 */
const deleteAdmin = async (_parent, { adminId }, context) => {
	const id = parseInt(adminId);
	if (isNaN(id)) {
		throw new Error("Invalid admin ID.");
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
	console.log(updatedAdmin);
	return updatedAdmin;
};

export { deleteAdmin };
