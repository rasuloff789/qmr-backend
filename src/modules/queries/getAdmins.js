import prisma from "../../config/db.js"; // This imports the Prisma client

export default async function (_) {
	const admins = await prisma.admin.findMany();

	const formattedAdmins = admins.map((admin) => ({
		...admin,
		birthDate: new Date(admin.birthDate).toLocaleDateString("en-GB"), // => "09/09/2008"
	}));

	return formattedAdmins;
}
