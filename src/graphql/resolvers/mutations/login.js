import { prisma } from "../../../database/index.js";
import { signToken } from "../../../utils/auth/jwt.js";
import { verifyPassword } from "../../../utils/auth/password.js";

/**
 * User login mutation with enhanced error handling
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username
 * @param {string} args.password - Password
 * @param {string} args.userType - User type (root or admin)
 * @param {Object} context - GraphQL context
 * @returns {Object} - Login response with success status, message, token, and user
 */
const login = async (_parent, { username, password, userType }) => {
	// Input validation
	if (!username || !password || !userType) {
		const errorResponse = {
			success: false,
			message:
				"Missing required fields: username, password, and userType are required",
			token: null,
			user: null,
		};

		console.log("❌ LOGIN FAILED - Missing Required Fields:", {
			username: !!username,
			password: !!password,
			userType: !!userType,
			success: errorResponse.success,
			message: errorResponse.message,
		});

		return errorResponse;
	}

	// Log incoming login attempt
	console.log("🔐 LOGIN ATTEMPT:", {
		username,
		userType,
		timestamp: new Date().toISOString(),
	});
	const loginResponse = {
		success: false,
		message: `Incorrect username or password for ${userType} login`,
		token: null,
		user: null,
	};

	// Validate user type
	if (!["root", "admin", "teacher"].includes(userType)) {
		loginResponse.message = `Invalid user type: ${userType}`;

		// Console log invalid user type
		console.log("❌ LOGIN FAILED - Invalid User Type:", {
			userType,
			username,
			success: loginResponse.success,
			message: loginResponse.message,
		});

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
				where: { username, isActive: true, isDeleted: false },
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

				// Console log deactivated admin account
				console.log("❌ LOGIN FAILED - Admin Account Deactivated:", {
					userType,
					username,
					userId: user.id,
					success: loginResponse.success,
					message: loginResponse.message,
				});

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

				// Console log deactivated teacher account
				console.log("❌ LOGIN FAILED - Teacher Account Deactivated:", {
					userType,
					username,
					userId: user.id,
					success: loginResponse.success,
					message: loginResponse.message,
				});

				return loginResponse;
			}
		}

		if (!user) {
			// Console log user not found
			console.log("❌ LOGIN FAILED - User Not Found:", {
				userType,
				username,
				success: loginResponse.success,
				message: loginResponse.message,
			});

			return loginResponse;
		}

		// Verify password
		const isValid = await verifyPassword(password, user.password);
		if (!isValid) {
			// Console log invalid password
			console.log("❌ LOGIN FAILED - Invalid Password:", {
				userType,
				username,
				userId: user.id,
				success: loginResponse.success,
				message: loginResponse.message,
			});

			return loginResponse;
		}

		// Generate JWT token
		const token = signToken({
			id: user.id,
			role: userType,
			username: user.username,
			passwordHash: user.password,
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

		// Console log successful login response
		console.log("🔐 LOGIN SUCCESS:", {
			userType,
			username: user.username,
			userId: user.id,
			success: loginResponse.success,
			message: loginResponse.message,
			tokenGenerated: !!loginResponse.token,
			userData: {
				id: userData.id,
				username: userData.username,
				fullname: userData.fullname,
				role: userData.role,
				createdAt: userData.createdAt,
			},
		});

		return loginResponse;
	} catch (error) {
		console.error("❌ LOGIN ERROR - Server Error:", {
			userType,
			username,
			error: error.message,
			stack: error.stack,
			success: loginResponse.success,
			message: loginResponse.message,
		});

		loginResponse.message = "Login failed due to server error";
		return loginResponse;
	}
};

// Wrap the entire login function in a try-catch for additional safety
const safeLogin = async (parent, args, context) => {
	try {
		return await login(parent, args, context);
	} catch (error) {
		console.error("❌ LOGIN WRAPPER ERROR:", {
			error: error.message,
			stack: error.stack,
			args: { username: args?.username, userType: args?.userType },
			timestamp: new Date().toISOString(),
		});

		return {
			success: false,
			message: "Login failed due to unexpected server error",
			token: null,
			user: null,
		};
	}
};

export { safeLogin as login };
