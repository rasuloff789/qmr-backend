import { prisma } from "../../../database/index.js";
import { studentSelectFields } from "../helpers/studentSelect.js";

/**
 * Change Student Active Status Resolver
 * Toggles the isActive status of a student
 */
export const changeStudentActive = async (parent, args, context) => {
	const { id, isActive } = args;
	const { user } = context;

	try {
		// Check if student exists
		const existingStudent = await prisma.student.findUnique({
			where: { id: parseInt(id) },
			select: studentSelectFields,
		});

		if (!existingStudent) {
			return {
				success: false,
				message: "Student not found",
				student: null,
				errors: ["Student with the provided ID does not exist"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if the status is already the same
		if (existingStudent.isActive === isActive) {
			return {
				success: true,
				message: `Student is already ${isActive ? "active" : "inactive"}`,
				student: existingStudent,
				errors: [],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the student's active status
		const updatedStudent = await prisma.student.update({
			where: { id: parseInt(id) },
			data: { isActive },
			select: studentSelectFields,
		});

		return {
			success: true,
			message: `Student ${isActive ? "activated" : "deactivated"} successfully`,
			student: updatedStudent,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error changing student active status:", error);
		return {
			success: false,
			message: "Failed to change student active status",
			student: null,
			errors: ["Internal server error"],
			timestamp: new Date().toISOString(),
		};
	}
};
