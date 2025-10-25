import { prisma } from "../../../database/index.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkTurkeyPhoneInt,
} from "../../../utils/regex.js";

/**
 * Update user profile information (telegram username and phone)
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.tgUsername - New Telegram username (optional)
 * @param {string} args.phone - New phone number (optional)
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Object} - UpdateProfileResponse with success status and user data
 */
const updateProfile = async (_parent, { tgUsername, phone }, { user }) => {
	try {
		// Check if user is authenticated
		if (!user) {
			return {
				success: false,
				message: "Authentication required",
				user: null,
				errors: ["You must be logged in to update your profile"],
				timestamp: new Date().toISOString(),
			};
		}

		// Check role-specific field restrictions first
		if (user.role === "root") {
			// Root users cannot update tgUsername or phone
			if (tgUsername !== undefined || phone !== undefined) {
				return {
					success: false,
					message: "Root users cannot update telegram username or phone",
					user: null,
					errors: ["Root users can only update basic profile information"],
					timestamp: new Date().toISOString(),
				};
			}
		}

		// Prepare update data object
		const updateData = {};

		// Validate and add phone if provided (only for admin/teacher)
		if (phone !== undefined && user.role !== "root") {
			const uzPhoneValidation = checkUzPhoneInt(phone);
			const trPhoneValidation = checkTurkeyPhoneInt(phone);
			if (!uzPhoneValidation.valid && !trPhoneValidation.valid) {
				return {
					success: false,
					message: "Validation failed",
					user: null,
					errors: [
						"Invalid phone number format. Supported: Uzbekistan (998XXXXXXXXX) or Turkey (90XXXXXXXXXX)",
					],
					timestamp: new Date().toISOString(),
				};
			}

			// Normalize phone number
			const normalizedPhone = uzPhoneValidation.valid
				? uzPhoneValidation.normalized
				: trPhoneValidation.normalized;
			updateData.phone = normalizedPhone;
		}

		// Validate and add tgUsername if provided (only for admin/teacher)
		if (tgUsername !== undefined && user.role !== "root") {
			const tgValidation = checkTelegramUsername(tgUsername);
			if (!tgValidation.valid) {
				return {
					success: false,
					message: "Validation failed",
					user: null,
					errors: [tgValidation.reason],
					timestamp: new Date().toISOString(),
				};
			}
			updateData.tgUsername = tgValidation.normalized;
		}

		// Check if there are any fields to update
		if (Object.keys(updateData).length === 0) {
			return {
				success: false,
				message: "No fields provided to update",
				user: null,
				errors: ["At least one field must be provided for update"],
				timestamp: new Date().toISOString(),
			};
		}

		// Update user based on their role
		let updatedUser = null;
		const userId = parseInt(user.id);

		if (user.role === "root") {
			// Root users can only update basic profile info (no tgUsername or phone)
			// Since we already checked for tgUsername and phone above, we know they're not provided
			// Root users can only update fullname, but that's not in the current schema
			// For now, we'll return an error that root users can't update their profile
			return {
				success: false,
				message: "Root users cannot update their profile",
				user: null,
				errors: ["Root users have a fixed profile that cannot be updated"],
				timestamp: new Date().toISOString(),
			};
		} else if (user.role === "admin") {
			// Update admin user
			updatedUser = await prisma.admin.update({
				where: { id: userId },
				data: updateData,
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
		} else if (user.role === "teacher") {
			// Update teacher user
			updatedUser = await prisma.teacher.update({
				where: { id: userId },
				data: updateData,
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

		// Create user data object with role
		const userData = {
			id: updatedUser.id.toString(),
			username: updatedUser.username,
			fullname: updatedUser.fullname,
			role: user.role,
			createdAt: updatedUser.createdAt,
			...(user.role === "admin" && {
				birthDate: updatedUser.birthDate,
				phone: updatedUser.phone,
				tgUsername: updatedUser.tgUsername,
				isActive: updatedUser.isActive,
			}),
			...(user.role === "teacher" && {
				birthDate: updatedUser.birthDate,
				phone: updatedUser.phone,
				tgUsername: updatedUser.tgUsername,
				department: updatedUser.department,
				isActive: updatedUser.isActive,
			}),
		};

		return {
			success: true,
			message: "Profile updated successfully",
			user: userData,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Update profile error:", error);
		return {
			success: false,
			message: "Failed to update profile",
			user: null,
			errors: [error.message || "An unexpected error occurred"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { updateProfile };
