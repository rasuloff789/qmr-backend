import prisma from "../../config/db.js"; // This imports the Prisma client

export default async function (_) {
	const admins = await prisma.admin.findMany();
	return admins;
}
