import { prisma } from "../../../database/index.js";
import { sendVerificationCode } from "../../../utils/firebase/sms.js";

/**
 * Forgot Password - Send verification code to user's phone
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username to reset password for
 * @param {string} args.userType - User type (root, admin, teacher)
 * @returns {Object} - ForgotPasswordResponse with success status
 */
const forgotPassword = async (_parent, { username, userType }) => {
	try {
		// Validate user type
		if (!["root", "admin", "teacher"].includes(userType)) {
			return {
				success: false,
				message: "Invalid user type",
				errors: [
					`Invalid user type: ${userType}. Must be root, admin, or teacher`,
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Find user based on type
		let user = null;
		if (userType === "root") {
			user = await prisma.root.findUnique({
				where: { username },
				select: { id: true, username: true, fullname: true },
			});
		} else if (userType === "admin") {
			user = await prisma.admin.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					phone: true,
					isActive: true,
				},
			});
		} else if (userType === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { username },
				select: {
					id: true,
					username: true,
					fullname: true,
					phone: true,
					isActive: true,
				},
			});
		}

		// Check if user exists
		if (!user) {
			return {
				success: false,
				message: "User not found",
				errors: [`User with username '${username}' not found`],
				timestamp: new Date().toISOString(),
			};
		}

		// Check if user is active (for admin and teacher)
		if (userType !== "root" && !user.isActive) {
			return {
				success: false,
				message: "Account is deactivated",
				errors: ["Cannot reset password for deactivated account"],
				timestamp: new Date().toISOString(),
			};
		}

		// Get phone number for SMS
		let phone = null;
		if (userType === "root") {
			// Root users don't have phone numbers in the current schema
			// For now, we'll return an error, but in production you might want to add phone to root
			return {
				success: false,
				message: "Phone number not available",
				errors: ["Root users do not have phone numbers for password reset"],
				timestamp: new Date().toISOString(),
			};
		} else {
			phone = user.phone;
		}

		if (!phone) {
			return {
				success: false,
				message: "Phone number not found",
				errors: ["User does not have a phone number registered"],
				timestamp: new Date().toISOString(),
			};
		}

		// Send verification code
		const smsResult = await sendVerificationCode(username, userType, phone);

		if (smsResult.success) {
			return {
				success: true,
				message: "Verification code sent to your phone number",
				errors: [],
				timestamp: new Date().toISOString(),
			};
		} else {
			return {
				success: false,
				message: "Failed to send verification code",
				errors: [smsResult.error || "Unable to send SMS"],
				timestamp: new Date().toISOString(),
			};
		}
	} catch (error) {
		console.error("Forgot password error:", error);
		return {
			success: false,
			message: "Failed to process password reset request",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { forgotPassword };
