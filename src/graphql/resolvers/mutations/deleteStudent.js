import { prisma } from "../../../database/index.js";
import { studentSelectFields } from "../helpers/studentSelect.js";

/**
 * "Delete" a student user by setting isDeleted property to true.
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string|number} args.id - ID of the student to update
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated student object
 */
const deleteStudent = async (_parent, { id }, context) => {
	try {
		const studentId = parseInt(id);
		if (isNaN(studentId)) {
			return {
				success: false,
				message: "Invalid student ID.",
				student: null,
				errors: ["Invalid student ID."],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if student exists
		const existingStudent = await prisma.student.findUnique({
			where: { id: studentId },
		});

		if (!existingStudent) {
			return {
				success: false,
				message: "Student not found.",
				student: null,
				errors: ["Student not found."],
				timestamp: new Date().toISOString(),
			};
		}

		// Update isDeleted to true
		const updatedStudent = await prisma.student.update({
			where: { id: studentId },
			data: { isDeleted: true },
			select: studentSelectFields,
		});

		return {
			success: true,
			message: "Student deleted successfully",
			student: updatedStudent,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Delete student error:", error);
		return {
			success: false,
			message: error.message || "Failed to delete student",
			student: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { deleteStudent };
