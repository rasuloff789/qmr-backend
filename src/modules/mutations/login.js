import prisma from "../../config/db.js"; // This imports the Prisma client
import { signToken } from "../../utils/jwt.js"; //Function to sign JWT tokens
import { verifyPassword, hashPassword } from "../../utils/hashpswrd.js";

// login is for login and get jwt

const login = async (_parent, { username, password, userType }) => {
	console.log(userType, username, password);

	const loginResponse = {
		success: false,
		message: `Incorrect username or password in ${userType} login`,
		token: null,
	};
	let user = null;
	if (userType === "root") {
		user = await prisma.root.findUnique({ where: { username } });
	} else if (userType === "admin") {
		user = await prisma.admin.findUnique({ where: { username } });
	} else {
		loginResponse.message = `There is not type of ${userType}`;
	}

	if (!user) {
		return loginResponse;
	} else {
		const isValid = await verifyPassword(password, user.password);
		if (!isValid) {
			return loginResponse;
		}
	}

	const verPswrd = await hashPassword(password);

	const token = signToken({
		id: user.id,
		role: userType,
		password: verPswrd,
	});

	loginResponse.success = true;
	loginResponse.message = `You have successfully logged in as ${userType}`;
	loginResponse.token = token;
	return loginResponse;
};

export { login };
