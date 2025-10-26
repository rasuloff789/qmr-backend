import { prisma } from "../../../database/index.js";
import { 
	generateVerificationCode, 
	storeVerificationCode, 
	sendTelegramPasswordResetMessage 
} from "../../../utils/telegram/bot.js";

/**
 * Telegram Reset Password - Send verification code via Telegram bot
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username to reset password for
 * @param {string} args.userType - User type (root, admin, teacher)
 * @returns {Object} - TelegramResetPasswordResponse with success status
 */
const telegramResetPassword = async (_parent, { username, userType }) => {
	try {
		// Validate user type
		if (!["root", "admin", "teacher"].includes(userType)) {
			return {
				success: false,
				message: "Invalid user type",
				errors: [`Invalid user type: ${userType}. Must be root, admin, or teacher`],
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
					tgUsername: true,
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
					tgUsername: true,
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

		// Get Telegram username
		let telegramUsername = null;
		if (userType === "root") {
			// Root users don't have tgUsername in the current schema
			return {
				success: false,
				message: "Telegram username not available",
				errors: ["Root users do not have Telegram usernames for password reset"],
				timestamp: new Date().toISOString(),
			};
		} else {
			telegramUsername = user.tgUsername;
		}

		if (!telegramUsername) {
			return {
				success: false,
				message: "Telegram username not found",
				errors: ["User does not have a Telegram username registered"],
				timestamp: new Date().toISOString(),
			};
		}

		// Generate verification code
		const code = generateVerificationCode();

		// Store verification code in database
		await storeVerificationCode(username, userType, code, telegramUsername);

		// Send Telegram message with password reset button
		const telegramResult = await sendTelegramPasswordResetMessage(
			telegramUsername,
			code,
			username,
			userType
		);

		if (telegramResult) {
			return {
				success: true,
				message: "Password reset code sent to your Telegram bot",
				errors: [],
				timestamp: new Date().toISOString(),
			};
		} else {
			return {
				success: false,
				message: "Failed to send Telegram message",
				errors: ["Unable to send message to Telegram bot"],
				timestamp: new Date().toISOString(),
			};
		}
	} catch (error) {
		console.error("Telegram reset password error:", error);
		return {
			success: false,
			message: "Failed to process password reset request",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { telegramResetPassword };
