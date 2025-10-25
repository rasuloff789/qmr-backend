import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	verifyPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";

/**
 * Change user password for all user types
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.currentPassword - Current password for verification
 * @param {string} args.newPassword - New password to set
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Object} - ChangePasswordResponse with success status
 */
const changePassword = async (
	_parent,
	{ currentPassword, newPassword },
	{ user }
) => {
	try {
		// Check if user is authenticated
		if (!user) {
			return {
				success: false,
				message: "Authentication required",
				errors: ["You must be logged in to change your password"],
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

		// Check if new password is different from current password
		if (currentPassword === newPassword) {
			return {
				success: false,
				message: "Validation failed",
				errors: ["New password must be different from current password"],
				timestamp: new Date().toISOString(),
			};
		}

		const userId = parseInt(user.id);

		// Get current user data to verify current password
		let currentUser = null;
		if (user.role === "root") {
			currentUser = await prisma.root.findUnique({
				where: { id: userId },
				select: { id: true, password: true, username: true },
			});
		} else if (user.role === "admin") {
			currentUser = await prisma.admin.findUnique({
				where: { id: userId },
				select: { id: true, password: true, username: true },
			});
		} else if (user.role === "teacher") {
			currentUser = await prisma.teacher.findUnique({
				where: { id: userId },
				select: { id: true, password: true, username: true },
			});
		}

		if (!currentUser) {
			return {
				success: false,
				message: "User not found",
				errors: ["User account not found"],
				timestamp: new Date().toISOString(),
			};
		}

		// Verify current password
		const isCurrentPasswordValid = await verifyPassword(
			currentPassword,
			currentUser.password
		);
		if (!isCurrentPasswordValid) {
			return {
				success: false,
				message: "Authentication failed",
				errors: ["Current password is incorrect"],
				timestamp: new Date().toISOString(),
			};
		}

		// Hash new password
		const hashedNewPassword = await hashPassword(newPassword);

		// Update password based on user role
		if (user.role === "root") {
			await prisma.root.update({
				where: { id: userId },
				data: { password: hashedNewPassword },
			});
		} else if (user.role === "admin") {
			await prisma.admin.update({
				where: { id: userId },
				data: { password: hashedNewPassword },
			});
		} else if (user.role === "teacher") {
			await prisma.teacher.update({
				where: { id: userId },
				data: { password: hashedNewPassword },
			});
		}

		return {
			success: true,
			message: "Password changed successfully",
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Change password error:", error);
		return {
			success: false,
			message: "Failed to change password",
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { changePassword };
