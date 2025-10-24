import checkUser from "../../utils/checkUser.js";
import prisma from "../../config/db.js";

/**
 * Get current user information
 * @param {Object} _ - Parent object (unused)
 * @param {Object} par - Parameters (unused)
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Current user from JWT
 * @returns {Object|null} - User object or null if not authenticated
 */
export default async function (_, par, { user }) {
	if (!user) {
		return null;
	}

	const isValid = await checkUser(user);
	if (!isValid) {
		return null;
	}

	try {
		const { role, id } = user;
		let userData = null;

		if (role === "root") {
			userData = await prisma.root.findUnique({
				where: { id: parseInt(id) },
				select: {
					id: true,
					username: true,
					fullname: true,
					createdAt: true,
				},
			});
		} else if (role === "admin") {
			userData = await prisma.admin.findUnique({
				where: { id: parseInt(id) },
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
		}

		return userData;
	} catch (error) {
		console.error("Error fetching user:", error);
		return null;
	}
}
