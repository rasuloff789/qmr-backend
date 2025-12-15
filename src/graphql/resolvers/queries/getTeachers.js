import { prisma } from "../../../database/index.js";

/**
 * Get all teacher users
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Array} - Array of teacher users
 */
export default async function (_, args, context) {
	try {
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const userGender = String(user?.gender || "").toUpperCase();

		// Gender scoping for admins:
		// - MALE admin -> only MALE teachers
		// - FEMALE admin -> only FEMALE teachers
		// (CHILD teachers are excluded for admins by definition of "only male/female")
		let genderFilter = undefined;
		if (user && role === "admin") {
			if (userGender !== "MALE" && userGender !== "FEMALE") {
				throw new Error("Admin gender is required to view teachers");
			}
			genderFilter = { equals: userGender };
		}

		const teachers = await prisma.teacher.findMany({
			where: {
				isDeleted: false,
				...(genderFilter ? { gender: genderFilter } : {}),
			},
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
			orderBy: {
				createdAt: "desc",
			},
		});

		return teachers.map((t) => ({ ...t, degrees: t.degrees || [] }));
	} catch (error) {
		console.error("Error fetching teachers:", error);
		throw new Error("Failed to fetch teacher users");
	}
}
