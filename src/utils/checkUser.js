import prisma from "../config/db.js"; // This imports the Prisma client

export default async function checkUser(user) {
	if (!user?.role || !user?.id) {
		return false;
	}
	const { role, id } = user;
	if (role === "root") {
		user = await prisma.root.findUnique({ where: { id } });
	} else if (role === "admin") {
		user = await prisma.admin.findUnique({ where: { id } });
	}

	return true;
}
