import { prisma } from "../../../database/index.js";

/**
 * "Delete" a teacher user by setting isDeleted property to true.
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string|number} args.id - ID of the teacher to update
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated teacher object
 */
const deleteTeacher = async (_parent, { id }, context) => {
	try {
		const teacherId = parseInt(id);
		if (isNaN(teacherId)) {
			return {
				success: false,
				message: "Invalid teacher ID.",
				teacher: null,
				errors: ["Invalid teacher ID."],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if teacher exists
		const existingTeacher = await prisma.teacher.findUnique({
			where: { id: teacherId },
		});

		if (!existingTeacher) {
			return {
				success: false,
				message: "Teacher not found.",
				teacher: null,
				errors: ["Teacher not found."],
				timestamp: new Date().toISOString(),
			};
		}

		// Update isDeleted to true
		const updatedTeacher = await prisma.teacher.update({
			where: { id: teacherId },
			data: { isDeleted: true },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				profilePicture: true,
				degrees: {
					select: {
						id: true,
						name: true,
						createdAt: true,
					},
				},
				isActive: true,
				createdAt: true,
			},
		});

		return {
			success: true,
			message: "Teacher deleted successfully",
			teacher: updatedTeacher,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Delete teacher error:", error);
		return {
			success: false,
			message: error.message || "Failed to delete teacher",
			teacher: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { deleteTeacher };
