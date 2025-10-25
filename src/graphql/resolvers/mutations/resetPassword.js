import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import { verifyAndConsumeCode } from "../../../utils/firebase/sms.js";

/**
 * Reset Password - Reset password using verification code
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.username - Username to reset password for
 * @param {string} args.userType - User type (root, admin, teacher)
 * @param {string} args.verificationCode - Verification code from SMS
 * @param {string} args.newPassword - New password
 * @returns {Object} - ResetPasswordResponse with success status
 */
const resetPassword = async (
	_parent,
	{ username, userType, verificationCode, newPassword }
) => {
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

		// Validate new password strength
		if (!isPasswordSecure(newPassword)) {
			return {
				success: false,
				message: "Validation failed",
				errors: [
					"Password must be at least 8 characters with uppercase, lowercase, and number.",
				],
				timestamp: new Date().toISOString(),
			};
		}

		// Verify and consume verification code
		const verificationRecord = await verifyAndConsumeCode(
			username,
			userType,
			verificationCode
		);

		if (!verificationRecord) {
			return {
				success: false,
				message: "Invalid or expired verification code",
				errors: ["Verification code is invalid, expired, or already used"],
				timestamp: new Date().toISOString(),
			};
		}

		// Find user to update password
		let user = null;
		if (userType === "root") {
			user = await prisma.root.findUnique({
				where: { username },
				select: { id: true, username: true },
			});
		} else if (userType === "admin") {
			user = await prisma.admin.findUnique({
				where: { username },
				select: { id: true, username: true, isActive: true },
			});
		} else if (userType === "teacher") {
			user = await prisma.teacher.findUnique({
				where: { username },
				select: { id: true, username: true, isActive: true },
			});
		}

		// Check if user still exists and is active
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

		// Hash new password
		const hashedPassword = await hashPassword(newPassword);

		// Update password based on user type
		if (userType === "root") {
			await prisma.root.update({
				where: { id: user.id },
				data: { password: hashedPassword },
			});
		} else if (userType === "admin") {
			await prisma.admin.update({
				where: { id: user.id },
				data: { password: hashedPassword },
			});
		} else if (userType === "teacher") {
			await prisma.teacher.update({
				where: { id: user.id },
				data: { password: hashedPassword },
			});
		}

		// Clean up any remaining verification codes for this user
		await prisma.verificationCode.deleteMany({
			where: {
				username,
				userType,
			},
		});

		return {
			success: true,
			message: "Password reset successfully",
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Reset password error:", error);
		return {
			success: false,
			message: "Failed to reset password",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { resetPassword };
