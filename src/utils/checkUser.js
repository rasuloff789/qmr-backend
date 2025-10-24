import prisma from "../config/db.js";

/**
 * Check if a user exists and is valid
 * @param {Object} user - The user object from JWT token
 * @returns {Promise<boolean>} - True if user is valid, false otherwise
 */
export default async function checkUser(user) {
	if (!user?.role || !user?.id) {
		return false;
	}

	const { role, id } = user;
	let userExists = false;

	try {
		if (role === "root") {
			const rootUser = await prisma.root.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true },
			});
			userExists = !!rootUser;
		} else if (role === "admin") {
			const adminUser = await prisma.admin.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true, isActive: true },
			});
			userExists = !!adminUser && adminUser.isActive;
		} else if (role === "teacher") {
			const teacherUser = await prisma.teacher.findUnique({
				where: { id: parseInt(id) },
				select: { id: true, username: true, fullname: true, isActive: true },
			});
			userExists = !!teacherUser && teacherUser.isActive;
		}
	} catch (error) {
		console.error("Error checking user:", error);
		return false;
	}

	return userExists;
}
