/**
 * QMR Backend - Application Messages
 * 
 * Clean, centralized message management for consistency.
 * 
 * @author QMR Development Team
 * @version 2.0.0
 */

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
	LOGIN_SUCCESS: "Successfully logged in",
	USER_CREATED: "User created successfully",
	USER_UPDATED: "User updated successfully",
	USER_DELETED: "User deleted successfully",
	PASSWORD_CHANGED: "Password changed successfully",
	PROFILE_UPDATED: "Profile updated successfully"
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
	// Authentication
	INVALID_CREDENTIALS: "Invalid username or password",
	INVALID_TOKEN: "Invalid or expired token",
	UNAUTHORIZED: "Not authorized to perform this action",
	FORBIDDEN: "Access forbidden",
	
	// User Management
	USER_NOT_FOUND: "User not found",
	USER_ALREADY_EXISTS: "User already exists",
	USER_INACTIVE: "User account is inactive",
	USER_DELETED: "User account has been deleted",
	
	// Validation
	INVALID_INPUT: "Invalid input provided",
	MISSING_REQUIRED_FIELD: "Required field is missing",
	INVALID_EMAIL: "Invalid email format",
	INVALID_PHONE: "Invalid phone number format",
	WEAK_PASSWORD: "Password does not meet security requirements",
	
	// System
	INTERNAL_ERROR: "Internal server error",
	DATABASE_ERROR: "Database operation failed",
	NETWORK_ERROR: "Network connection failed",
	VALIDATION_ERROR: "Input validation failed"
};

/**
 * Validation Messages
 */
export const VALIDATION_MESSAGES = {
	USERNAME_REQUIRED: "Username is required",
	PASSWORD_REQUIRED: "Password is required",
	FULLNAME_REQUIRED: "Full name is required",
	PHONE_REQUIRED: "Phone number is required",
	BIRTHDATE_REQUIRED: "Birth date is required",
	DEPARTMENT_REQUIRED: "Department is required",
	
	USERNAME_MIN_LENGTH: "Username must be at least 3 characters",
	PASSWORD_MIN_LENGTH: "Password must be at least 8 characters",
	PHONE_INVALID_FORMAT: "Phone number must be in valid format",
	BIRTHDATE_INVALID: "Birth date cannot be in the future"
};

/**
 * Get message by category and key
 */
export const getMessage = (category, key) => {
	const messages = {
		SUCCESS: SUCCESS_MESSAGES,
		ERROR: ERROR_MESSAGES,
		VALIDATION: VALIDATION_MESSAGES
	};
	
	return messages[category]?.[key] || "Unknown message";
};