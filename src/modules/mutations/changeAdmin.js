import prisma from "../../config/db.js";
import { hashPassword, isPasswordSecure } from "../../utils/hashpswrd.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkUsername,
	checkTurkeyPhoneInt,
	isValidBirthdate,
} from "../../utils/regex.js";

/**
 * Change/Update admin user information
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.id - Admin ID to update
 * @param {string} args.username - New username (optional)
 * @param {string} args.fullname - New full name (optional)
 * @param {string} args.birthDate - New birth date (optional)
 * @param {string} args.phone - New phone number (optional)
 * @param {string} args.tgUsername - New Telegram username (optional)
 * @param {string} args.password - New password (optional)
 * @param {boolean} args.isActive - New active status (optional)
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated admin user
 */
const changeAdmin = async (
	_parent,
	{ id, username, fullname, birthDate, phone, tgUsername, password, isActive }
) => {
	console.log(
		id,
		username,
		fullname,
		birthDate,
		phone,
		tgUsername,
		password,
		isActive
	);
	try {
		// Check if admin exists
		const existingAdmin = await prisma.admin.findUnique({
			where: { id: parseInt(id) },
		});
		console.log(existingAdmin);

		if (!existingAdmin) {
			throw new Error("Admin not found");
		}

		// Prepare update data object
		const updateData = {};

		// Validate and add username if provided
		if (username !== undefined) {
			const usernameValidation = checkUsername(username);
			if (!usernameValidation.valid) {
				throw new Error(usernameValidation.reason);
			}

			// Check if username is already taken by another admin
			const usernameExists = await prisma.admin.findFirst({
				where: {
					username,
					id: { not: parseInt(id) },
				},
			});

			if (usernameExists) {
				throw new Error("Username already exists");
			}

			updateData.username = username;
		}

		// Add fullname if provided
		if (fullname !== undefined) {
			updateData.fullname = fullname;
		}

		// Validate and add birthDate if provided
		if (birthDate !== undefined) {
			if (!isValidBirthdate(birthDate)) {
				throw new Error("Invalid birth date format. Expected: YYYY-MM-DD");
			}
			updateData.birthDate = new Date(birthDate).toISOString();
		}

		// Validate and add phone if provided
		if (phone !== undefined) {
			const uzPhoneValidation = checkUzPhoneInt(phone);
			const trPhoneValidation = checkTurkeyPhoneInt(phone);
			if (!uzPhoneValidation.valid && !trPhoneValidation.valid) {
				throw new Error(
					"Invalid phone number format. Supported: Uzbekistan (998XXXXXXXXX) or Turkey (90XXXXXXXXXX)"
				);
			}

			// Normalize phone number
			const normalizedPhone = uzPhoneValidation.valid
				? uzPhoneValidation.normalized
				: trPhoneValidation.normalized;
			updateData.phone = normalizedPhone;
		}

		// Validate and add tgUsername if provided
		if (tgUsername !== undefined) {
			const tgValidation = checkTelegramUsername(tgUsername);
			if (!tgValidation.valid) {
				throw new Error(tgValidation.reason);
			}
			updateData.tgUsername = tgValidation.normalized;
		}

		// Validate and add password if provided
		if (password !== undefined) {
			if (!isPasswordSecure(password)) {
				throw new Error(
					"Password must be at least 8 characters with uppercase, lowercase, and number."
				);
			}
			updateData.password = await hashPassword(password);
		}

		// Add isActive if provided
		if (isActive !== undefined) {
			updateData.isActive = isActive;
		}

		// Check if there are any fields to update
		if (Object.keys(updateData).length === 0) {
			throw new Error("No fields provided to update");
		}

		console.log(updateData);

		// Update the admin
		const updatedAdmin = await prisma.admin.update({
			where: { id: parseInt(id) },
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

		return updatedAdmin;
	} catch (error) {
		console.error("Change admin error:", error);
		throw new Error(error.message || "Failed to update admin user");
	}
};

export { changeAdmin };
