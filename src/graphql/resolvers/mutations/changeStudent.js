import { prisma } from "../../../database/index.js";
import { studentSelectFields } from "../helpers/studentSelect.js";
import {
	hashPassword,
	isPasswordSecure,
} from "../../../utils/auth/password.js";
import {
	checkInternationalPhone,
	checkTelegramUsername,
	checkUsername,
	isValidBirthdate,
} from "../../../utils/regex.js";
import {
	processUploadedFile,
	deleteProfilePicture,
} from "../../../utils/fileUpload.js";

/**
 * Change/Update student user information
 */
const changeStudent = async (
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
		isActive,
	}
) => {
	try {
		// Check if student exists
		const existingStudent = await prisma.student.findUnique({
			where: { id: parseInt(id) },
		});

		if (!existingStudent) {
			return {
				success: false,
				message: "Student not found",
				student: null,
				errors: ["Student not found"],
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
					student: null,
					errors: [usernameValidation.reason],
					timestamp: new Date().toISOString(),
				};
			}

			// Check if username is already taken by another student
			const usernameExists = await prisma.student.findFirst({
				where: {
					username,
					id: { not: parseInt(id) },
				},
			});

			if (usernameExists) {
				return {
					success: false,
					message: "Username already exists",
					student: null,
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
					student: null,
					errors: ["Invalid birth date format. Expected: YYYY-MM-DD"],
					timestamp: new Date().toISOString(),
				};
			}
			updateData.birthDate = new Date(birthDate).toISOString();
		}

		// Validate and add phone if provided
		if (phone !== undefined) {
			const phoneValidation = checkInternationalPhone(phone);
			if (!phoneValidation.valid) {
				return {
					success: false,
					message: "Validation failed",
					student: null,
					errors: [phoneValidation.reason],
					timestamp: new Date().toISOString(),
				};
			}

			// Normalize phone number
			updateData.phone = phoneValidation.normalized;
		}

		// Validate and add tgUsername if provided
		if (tgUsername !== undefined) {
			const tgValidation = checkTelegramUsername(tgUsername);
			if (!tgValidation.valid) {
				return {
					success: false,
					message: "Validation failed",
					student: null,
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
					student: null,
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
						student: null,
						errors: [uploadResult.error],
						timestamp: new Date().toISOString(),
					};
				}

				// Delete old profile picture if it exists
				if (existingStudent.profilePicture) {
					const oldFilename = existingStudent.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}

				updateData.profilePicture = uploadResult.url;
			} else {
				// If profilePicture is explicitly set to null/empty, remove it
				if (existingStudent.profilePicture) {
					const oldFilename = existingStudent.profilePicture.split("/").pop();
					deleteProfilePicture(oldFilename);
				}
				updateData.profilePicture = null;
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
				student: null,
				errors: ["No fields provided to update"],
				timestamp: new Date().toISOString(),
			};
		}

		// Update the student
		const updatedStudent = await prisma.student.update({
			where: { id: parseInt(id) },
			data: updateData,
			select: studentSelectFields,
		});

		return {
			success: true,
			message: "Student updated successfully",
			student: updatedStudent,
			errors: [],
			timestamp: new Date().toISOString(),
		};
	} catch (error) {
		console.error("Change student error:", error);
		return {
			success: false,
			message: error.message || "Failed to update student",
			student: null,
			errors: [error.message || "Unexpected error"],
			timestamp: new Date().toISOString(),
		};
	}
};

export { changeStudent };
