import { prisma } from "../../../database/index.js";
import { linkFirebaseUser } from "../../../utils/firebase/auth.js";

/**
 * Link Firebase user to our system user
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username to link
 * @param {string} args.userType - User type (root, admin, teacher)
 * @param {Object} context - GraphQL context
 * @param {Object} context.firebaseUser - Firebase user from middleware
 * @returns {Object} - LinkFirebaseUserResponse with success status
 */
const linkFirebaseUserMutation = async (_parent, { username, userType }, { firebaseUser }) => {
	try {
		// Check if Firebase user is authenticated
		if (!firebaseUser) {
			return {
				success: false,
				message: "Firebase authentication required",
				user: null,
				errors: ["You must be authenticated with Firebase to link your account"],
				timestamp: new Date().toISOString(),
			};
		}

		// Validate user type
		if (!["root", "admin", "teacher"].includes(userType)) {
			return {
				success: false,
				message: "Invalid user type",
				user: null,
				errors: [`Invalid user type: ${userType}. Must be root, admin, or teacher`],
				timestamp: new Date().toISOString(),
			};
		}

		// Find user in our system
		let systemUser = null;
		if (userType === "root") {
			systemUser = await prisma.root.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					createdAt: true,
				},
			});
		} else if (userType === "admin") {
			systemUser = await prisma.admin.findUnique({
				where: { username },
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
		} else if (userType === "teacher") {
			systemUser = await prisma.teacher.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					birthDate: true,
					phone: true,
					tgUsername: true,
					department: true,
					isActive: true,
					createdAt: true,
				},
			});
		}

		// Check if user exists in our system
		if (!systemUser) {
			return {
				success: false,
				message: "User not found",
				user: null,
				errors: [`User with username '${username}' not found in our system`],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if user is active (for admin and teacher)
		if (userType !== "root" && !systemUser.isActive) {
			return {
				success: false,
				message: "Account is deactivated",
				user: null,
				errors: ["Cannot link deactivated account"],
				timestamp: new Date().toISOString(),
			};
		}

		// Verify phone number matches (if user has phone)
		if (userType !== "root" && systemUser.phone) {
			const firebasePhone = firebaseUser.phone;
			const systemPhone = systemUser.phone;
			
			// Normalize phone numbers for comparison
			const normalizePhone = (phone) => phone.replace(/\D/g, '');
			const firebasePhoneNormalized = normalizePhone(firebasePhone || '');
			const systemPhoneNormalized = normalizePhone(systemPhone || '');
			
			if (firebasePhoneNormalized !== systemPhoneNormalized) {
				return {
					success: false,
					message: "Phone number mismatch",
					user: null,
					errors: ["Firebase phone number does not match system phone number"],
					timestamp: new Date().toISOString(),
				};
			}
		}

		// Link Firebase user to our system
		const linkResult = await linkFirebaseUser(firebaseUser.uid, username, userType);

		if (linkResult.success) {
			// Create UserData response
			const userData = {
				id: systemUser.id,
				username: systemUser.username,
				fullname: systemUser.fullname,
				role: userType,
				createdAt: systemUser.createdAt,
				...(userType === "admin" && {
					birthDate: systemUser.birthDate,
					phone: systemUser.phone,
					tgUsername: systemUser.tgUsername,
					isActive: systemUser.isActive,
				}),
				...(userType === "teacher" && {
					birthDate: systemUser.birthDate,
					phone: systemUser.phone,
					tgUsername: systemUser.tgUsername,
					department: systemUser.department,
					isActive: systemUser.isActive,
				}),
			};

			return {
				success: true,
				message: "Firebase user linked successfully",
				user: userData,
				errors: [],
				timestamp: new Date().toISOString(),
			};
		} else {
			return {
				success: false,
				message: "Failed to link Firebase user",
				user: null,
				errors: [linkResult.message || "Failed to link Firebase user"],
				timestamp: new Date().toISOString(),
			};
		}
	} catch (error) {
		console.error("Link Firebase user error:", error);
		return {
			success: false,
			message: "Failed to link Firebase user",
			user: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { linkFirebaseUserMutation as linkFirebaseUser };
