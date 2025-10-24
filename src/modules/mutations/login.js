import prisma from "../../config/db.js";
import { signToken } from "../../utils/auth/jwt.js";
import { verifyPassword } from "../../utils/auth/password.js";

/**
 * User login mutation
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username
 * @param {string} args.password - Password
 * @param {string} args.userType - User type (root or admin)
 * @param {Object} context - GraphQL context
 * @returns {Object} - Login response with success status, message, token, and user
 */
const login = async (_parent, { username, password, userType }) => {
	const loginResponse = {
		success: false,
		message: `Incorrect username or password for ${userType} login`,
		token: null,
		user: null,
	};

	// Validate user type
	if (!["root", "admin", "teacher"].includes(userType)) {
		loginResponse.message = `Invalid user type: ${userType}`;
		return loginResponse;
	}

	try {
		let user = null;

		// Find user based on type
		if (userType === "root") {
			user = await prisma.root.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					createdAt: true,
				},
			});
		} else if (userType === "admin") {
			user = await prisma.admin.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					isActive: true,
					createdAt: true,
				},
			});

			// Check if admin is active
			if (user && !user.isActive) {
				loginResponse.message = "Account is deactivated";
				return loginResponse;
			}
		} else if (userType === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					password: true,
					birthDate: true,
					phone: true,
					tgUsername: true,
					department: true,
					isActive: true,
					createdAt: true,
				},
			});

			// Check if teacher is active
			if (user && !user.isActive) {
				loginResponse.message = "Account is deactivated";
				return loginResponse;
			}
		}

		if (!user) {
			return loginResponse;
		}

		// Verify password
		const isValid = await verifyPassword(password, user.password);
		if (!isValid) {
			return loginResponse;
		}

		// Generate JWT token
		const token = signToken({
			id: user.id,
			role: userType,
			username: user.username,
		});

		// Create user data object with role
		const userData = {
			id: user.id,
			username: user.username,
			fullname: user.fullname,
			role: userType,
			createdAt: user.createdAt,
			...(userType === "admin" && {
				birthDate: user.birthDate,
				phone: user.phone,
				tgUsername: user.tgUsername,
				isActive: user.isActive,
			}),
			...(userType === "teacher" && {
				birthDate: user.birthDate,
				phone: user.phone,
				tgUsername: user.tgUsername,
				department: user.department,
				isActive: user.isActive,
			}),
		};

		loginResponse.success = true;
		loginResponse.message = `Successfully logged in as ${userType}`;
		loginResponse.token = token;
		loginResponse.user = userData;

		return loginResponse;
	} catch (error) {
		console.error("Login error:", error);
		loginResponse.message = "Login failed due to server error";
		return loginResponse;
	}
};

export { login };
