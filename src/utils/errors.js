/**
 * QMR Backend - Error Handling Utilities
 *
 * Centralized error handling for consistent API responses.
 * Provides structured error responses instead of throwing errors.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

/**
 * Create a standardized error response
 * @param {string} message - Error message
 * @param {string[]} errors - Optional array of specific errors
 * @param {Object} data - Optional additional data
 * @returns {Object} Standardized error response
 */
export const createErrorResponse = (message, errors = [], data = null) => {
	const response = {
		success: false,
		message,
		...(errors.length > 0 && { errors }),
		...(data && { data }),
		timestamp: new Date().toISOString(),
	};

	return response;
};

/**
 * Create a standardized success response
 * @param {string} message - Success message
 * @param {Object} data - Optional data to include
 * @returns {Object} Standardized success response
 */
export const createSuccessResponse = (message, data = null) => {
	const response = {
		success: true,
		message,
		...(data && { data }),
		timestamp: new Date().toISOString(),
	};

	return response;
};

/**
 * Handle validation errors
 * @param {string} field - Field name that failed validation
 * @param {string} reason - Reason for validation failure
 * @returns {Object} Validation error response
 */
export const createValidationError = (field, reason) => {
	return createErrorResponse(`Validation failed for ${field}`, [
		`${field}: ${reason}`,
	]);
};

/**
 * Handle authentication errors
 * @param {string} message - Authentication error message
 * @returns {Object} Authentication error response
 */
export const createAuthError = (message = "Authentication failed") => {
	return createErrorResponse(message, ["Authentication required"]);
};

/**
 * Handle permission errors
 * @param {string} message - Permission error message
 * @returns {Object} Permission error response
 */
export const createPermissionError = (message = "Insufficient permissions") => {
	return createErrorResponse(message, ["Permission denied"]);
};

/**
 * Handle database errors
 * @param {string} operation - Database operation that failed
 * @param {string} message - Error message
 * @returns {Object} Database error response
 */
export const createDatabaseError = (operation, message) => {
	return createErrorResponse(`Database operation failed: ${operation}`, [
		message,
	]);
};

/**
 * Handle not found errors
 * @param {string} resource - Resource type that was not found
 * @param {string} identifier - Identifier that was searched for
 * @returns {Object} Not found error response
 */
export const createNotFoundError = (resource, identifier) => {
	return createErrorResponse(`${resource} not found`, [
		`No ${resource.toLowerCase()} found with identifier: ${identifier}`,
	]);
};

/**
 * Handle conflict errors (e.g., duplicate entries)
 * @param {string} resource - Resource type that conflicts
 * @param {string} field - Field that caused the conflict
 * @param {string} value - Value that caused the conflict
 * @returns {Object} Conflict error response
 */
export const createConflictError = (resource, field, value) => {
	return createErrorResponse(`${resource} already exists`, [
		`${field} '${value}' is already in use`,
	]);
};

/**
 * Handle server errors
 * @param {string} operation - Operation that failed
 * @param {Error} error - Original error object
 * @returns {Object} Server error response
 */
export const createServerError = (operation, error) => {
	console.error(`❌ ${operation} Server Error:`, {
		message: error.message,
		stack: error.stack,
		timestamp: new Date().toISOString(),
	});

	return createErrorResponse(`Server error during ${operation}`, [
		error.message || "An unexpected error occurred",
	]);
};

/**
 * Wrap async operations with consistent error handling
 * @param {Function} operation - Async operation to wrap
 * @param {string} operationName - Name of the operation for error reporting
 * @returns {Function} Wrapped operation with error handling
 */
export const withErrorHandling = (operation, operationName) => {
	return async (...args) => {
		try {
			return await operation(...args);
		} catch (error) {
			return createServerError(operationName, error);
		}
	};
};

/**
 * Common error messages
 */
export const ERROR_MESSAGES = {
	VALIDATION: {
		REQUIRED_FIELD: (field) => `${field} is required`,
		INVALID_FORMAT: (field, format) =>
			`Invalid ${field} format. Expected: ${format}`,
		INVALID_LENGTH: (field, min, max) =>
			`${field} must be between ${min} and ${max} characters`,
		INVALID_CHARACTERS: (field) => `${field} contains invalid characters`,
	},
	AUTH: {
		INVALID_CREDENTIALS: "Invalid username or password",
		TOKEN_EXPIRED: "Authentication token has expired",
		TOKEN_INVALID: "Invalid authentication token",
		ACCESS_DENIED: "Access denied",
	},
	PERMISSIONS: {
		INSUFFICIENT_PERMISSIONS: "Insufficient permissions for this operation",
		ADMIN_REQUIRED: "Admin privileges required",
		ROOT_REQUIRED: "Root privileges required",
	},
	DATABASE: {
		CONNECTION_FAILED: "Database connection failed",
		QUERY_FAILED: "Database query failed",
		TRANSACTION_FAILED: "Database transaction failed",
	},
	RESOURCES: {
		NOT_FOUND: (resource) => `${resource} not found`,
		ALREADY_EXISTS: (resource) => `${resource} already exists`,
		DELETION_FAILED: (resource) => `Failed to delete ${resource}`,
		CREATION_FAILED: (resource) => `Failed to create ${resource}`,
		UPDATE_FAILED: (resource) => `Failed to update ${resource}`,
	},
};

/**
 * Error types for categorization
 */
export const ERROR_TYPES = {
	VALIDATION: "VALIDATION",
	AUTHENTICATION: "AUTHENTICATION",
	AUTHORIZATION: "AUTHORIZATION",
	NOT_FOUND: "NOT_FOUND",
	CONFLICT: "CONFLICT",
	SERVER: "SERVER",
	DATABASE: "DATABASE",
	NETWORK: "NETWORK",
};

/**
 * Create a typed error response
 * @param {string} type - Error type from ERROR_TYPES
 * @param {string} message - Error message
 * @param {string[]} details - Optional error details
 * @returns {Object} Typed error response
 */
export const createTypedError = (type, message, details = []) => {
	return {
		success: false,
		type,
		message,
		...(details.length > 0 && { details }),
		timestamp: new Date().toISOString(),
	};
};
