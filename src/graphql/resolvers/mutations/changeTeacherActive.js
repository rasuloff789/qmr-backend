import { prisma } from "../../../database/index.js";

/**
 * Change Teacher Active Status Resolver
 * Toggles the isActive status of a teacher
 */
export const changeTeacherActive = async (parent, args, context) => {
	const { id, isActive } = args;
	const { user } = context;

	try {
		// Check if teacher exists
		const existingTeacher = await prisma.teacher.findUnique({
			where: { id: parseInt(id) },
			select: {
				id: true,
				username: true,
				fullname: true,
				isActive: true,
			},
		});

		if (!existingTeacher) {
			return {
				success: false,
				message: "Teacher not found",
				teacher: null,
				errors: ["Teacher with the provided ID does not exist"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if the status is already the same
		if (existingTeacher.isActive === isActive) {
			return {
				success: true,
				message: `Teacher is already ${isActive ? "active" : "inactive"}`,
				teacher: existingTeacher,
				errors: [],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the teacher's active status
		const updatedTeacher = await prisma.teacher.update({
			where: { id: parseInt(id) },
			data: { isActive },
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				profilePicture: true,
				isActive: true,
				createdAt: true,
				degrees: {
					select: {
						id: true,
						name: true,
						createdAt: true,
					},
				},
			},
		});

		return {
			success: true,
			message: `Teacher ${isActive ? "activated" : "deactivated"} successfully`,
			teacher: updatedTeacher,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Error changing teacher active status:", error);
		return {
			success: false,
			message: "Failed to change teacher active status",
			teacher: null,
			errors: ["Internal server error"],
			timestamp: new Date().toISOString(),
		};
	}
};
