import { prisma } from "../../../database/index.js";

/**
 * Get teachers eligible for a course by gender and required degrees.
 *
 * Rules:
 * - Exclude deleted teachers
 * - Return only active teachers
 * - Gender:
 *   - If gender is CHILD, return teachers with gender IN [MALE, FEMALE]
 *   - Otherwise, exact match
 * - Degrees:
 *   - ANY-match: teacher must have at least one of the provided degreeIds
 */
export default async function getTeachersForCourse(_parent, args) {
	try {
		const { gender, degreeIds } = args || {};

		const normalizedDegreeIds = Array.isArray(degreeIds)
			? degreeIds
					.map((id) => Number(id))
					.filter((id) => Number.isFinite(id) && id > 0)
			: [];

		const degreeFilter =
			normalizedDegreeIds.length > 0
				? {
						degrees: {
							some: { id: { in: normalizedDegreeIds } },
						},
					}
				: undefined;

		const teachers = await prisma.teacher.findMany({
			where: {
				isDeleted: false,
				isActive: true,
				gender:
					gender === "CHILD"
						? { in: ["MALE", "FEMALE"] }
						: { equals: gender },
				...(degreeFilter || {}),
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
		console.error("Error fetching teachers for course:", error);
		throw new Error("Failed to fetch teachers for course");
	}
}


