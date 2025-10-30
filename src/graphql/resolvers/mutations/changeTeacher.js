import { prisma } from "../../../database/index.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkUzPhoneInt,
	checkTelegramUsername,
	checkUsername,
	checkTurkeyPhoneInt,
	isValidBirthdate,
} from "../../../utils/regex.js";
import {
	processUploadedFile,
	deleteProfilePicture,
} from "../../../utils/fileUpload.js";

/**
 * Change/Update teacher user information
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Mutation arguments
 * @param {string} args.id - Teacher ID to update
 * @param {string} args.username - New username (optional)
 * @param {string} args.fullname - New full name (optional)
 * @param {string} args.birthDate - New birth date (optional)
 * @param {string} args.phone - New phone number (optional)
 * @param {string} args.tgUsername - New Telegram username (optional)
 * @param {string} args.password - New password (optional)
 * @param {boolean} args.isActive - New active status (optional)
 * @param {Object} context - GraphQL context
 * @returns {Object} - Updated teacher user
 */
const changeTeacher = async (
	_parent,
	{
		id,
		username,
		fullname,
		birthDate,
		phone,
		tgUsername,
		password,
		gender,
		profilePicture,
		degreeIds,
		isActive,
	}
) => {
    try {
		// Check if teacher exists
		const existingTeacher = await prisma.teacher.findUnique({
			where: { id: parseInt(id) },
		});

        if (!existingTeacher) {
            return {
                success: false,
                message: "Teacher not found",
                teacher: null,
                errors: ["Teacher not found"],
                timestamp: new Date().toISOString(),
            };
        }

		// Prepare update data object
		const updateData = {};

		// Validate and add username if provided
		if (username !== undefined) {
			const usernameValidation = checkUsername(username);
            if (!usernameValidation.valid) {
                return {
                    success: false,
                    message: "Validation failed",
                    teacher: null,
                    errors: [usernameValidation.reason],
                    timestamp: new Date().toISOString(),
                };
            }

			// Check if username is already taken by another teacher
			const usernameExists = await prisma.teacher.findFirst({
				where: {
					username,
					id: { not: parseInt(id) },
				},
			});

            if (usernameExists) {
                return {
                    success: false,
                    message: "Username already exists",
                    teacher: null,
                    errors: ["Username already exists"],
                    timestamp: new Date().toISOString(),
                };
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
                return {
                    success: false,
                    message: "Validation failed",
                    teacher: null,
                    errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
                    timestamp: new Date().toISOString(),
                };
            }
			updateData.birthDate = new Date(birthDate).toISOString();
		}

		// Validate and add phone if provided
		if (phone !== undefined) {
			const uzPhoneValidation = checkUzPhoneInt(phone);
			const trPhoneValidation = checkTurkeyPhoneInt(phone);
            if (!uzPhoneValidation.valid && !trPhoneValidation.valid) {
                return {
                    success: false,
                    message: "Validation failed",
                    teacher: null,
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

		// Validate and add tgUsername if provided
		if (tgUsername !== undefined) {
			const tgValidation = checkTelegramUsername(tgUsername);
            if (!tgValidation.valid) {
                return {
                    success: false,
                    message: "Validation failed",
                    teacher: null,
                    errors: [tgValidation.reason],
                    timestamp: new Date().toISOString(),
                };
            }
			updateData.tgUsername = tgValidation.normalized;
		}

		// Validate and add password if provided
		if (password !== undefined) {
            if (!isPasswordSecure(password)) {
                return {
                    success: false,
                    message: "Validation failed",
                    teacher: null,
                    errors: [
                        "Password must be at least 8 characters with uppercase, lowercase, and number.",
                    ],
                    timestamp: new Date().toISOString(),
                };
            }
			updateData.password = await hashPassword(password);
		}

		// Add gender if provided
		if (gender !== undefined) {
			updateData.gender = gender;
		}

		// Add profilePicture if provided
		if (profilePicture !== undefined) {
            if (profilePicture && profilePicture.createReadStream) {
                const uploadResult = await processUploadedFile(profilePicture);
				if (!uploadResult.success) {
                    return {
                        success: false,
                        message: "File upload failed",
                        teacher: null,
                        errors: [uploadResult.error],
                        timestamp: new Date().toISOString(),
                    };
				}

				// Delete old profile picture if it exists
				if (existingTeacher.profilePicture) {
					const oldFilename = existingTeacher.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}

				updateData.profilePicture = uploadResult.url;
			} else {
				// If profilePicture is explicitly set to null/empty, remove it
				if (existingTeacher.profilePicture) {
					const oldFilename = existingTeacher.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}
				updateData.profilePicture = null;
			}
		}

		// Add degrees if provided
		if (degreeIds !== undefined) {
			if (degreeIds.length > 0) {
				updateData.degrees = {
					set: degreeIds.map((id) => ({ id: parseInt(id) })),
				};
			} else {
				updateData.degrees = { set: [] };
			}
		}

		// Add isActive if provided
		if (isActive !== undefined) {
			updateData.isActive = isActive;
		}

		// Check if there are any fields to update
        if (Object.keys(updateData).length === 0) {
            return {
                success: false,
                message: "No fields provided to update",
                teacher: null,
                errors: ["No fields provided to update"],
                timestamp: new Date().toISOString(),
            };
        }

		// Update the teacher
        const updatedTeacher = await prisma.teacher.update({
			where: { id: parseInt(id) },
			data: updateData,
			select: {
				id: true,
				username: true,
				fullname: true,
				birthDate: true,
				phone: true,
				tgUsername: true,
				gender: true,
				profilePicture: true,
				degrees: {
					select: {
						id: true,
						name: true,
						createdAt: true,
					},
				},
				isActive: true,
				createdAt: true,
			},
		});

        return {
            success: true,
            message: "Teacher updated successfully",
            teacher: updatedTeacher,
            errors: [],
            timestamp: new Date().toISOString(),
        };
	} catch (error) {
        console.error("Change teacher error:", error);
        return {
            success: false,
            message: error.message || "Failed to update teacher",
            teacher: null,
            errors: [error.message || "Unexpected error"],
            timestamp: new Date().toISOString(),
        };
	}
};

export { changeTeacher };
