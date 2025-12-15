import { prisma } from "../../../database/index.js";
import { studentSelectFields } from "../helpers/studentSelect.js";

/**
 * Get all student users
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of student users
 */
export default async function (_, args, context) {
	try {
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const userGender = String(user?.gender || "").toUpperCase();

		// ROOT can see all students; non-root users are scoped by their gender + CHILD.
		// (male -> MALE+CHILD, female -> FEMALE+CHILD)
		let genderFilter = undefined;
		if (role !== "root") {
			if (userGender !== "MALE" && userGender !== "FEMALE") {
				// Should be prevented by permissions, but keep resolver safe.
				throw new Error("User gender is required to view students");
			}
			genderFilter = { in: [userGender, "CHILD"] };
		}

		const students = await prisma.student.findMany({
			where: {
				isDeleted: false,
				...(genderFilter ? { gender: genderFilter } : {}),
			},
			select: studentSelectFields,
			orderBy: {
				createdAt: "desc",
			},
		});

		return students;
	} catch (error) {
		console.error("Error fetching students:", error);
		throw new Error("Failed to fetch student users");
	}
}
