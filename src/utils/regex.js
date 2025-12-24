/**
 * Validate and normalize Telegram username
 * @param {string} username - Telegram username to validate
 * @returns {Object} - Validation result with valid flag and normalized username
 */
function checkTelegramUsername(username) {
	const raw = username.trim();

	// Regex: @ optional, 5-32 characters, letters/numbers/_ only
	const regex = /^(?!.*\s)[a-zA-Z0-9_]{5,32}$/;

	if (!regex.test(raw)) {
		return {
			valid: false,
			reason:
				'Invalid format. Telegram username must contain only letters, numbers, and "_", length 5-32 characters.',
		};
	}

	// Remove @ prefix if present and normalize
	const normalized = raw.startsWith("@") ? raw.slice(1) : raw;

	return { valid: true, normalized };
}

/**
 * Validate username format
 * @param {string} username - Username to validate
 * @returns {Object} - Validation result with valid flag and normalized username
 */
function checkUsername(username) {
	const regex = /^(?!.*\s)[a-z0-9]{4,32}$/;

	if (!regex.test(username)) {
		return {
			valid: false,
			reason:
				"Username must contain only lowercase letters and numbers, length 4-10 characters.",
		};
	}

	return { valid: true, normalized: username };
}

/**
 * Validate and normalize international phone numbers (any country)
 * @param {string|number} input - Phone number to validate
 * @returns {Object} - Validation result with valid flag and normalized number
 */
function checkInternationalPhone(input) {
	const digits = input.toString().replace(/\D/g, ""); // Remove non-digits

	// International phone numbers typically have:
	// - Country code: 1-3 digits
	// - National number: 7-15 digits
	// Total: 8-17 digits
	// Most common range: 10-15 digits

	if (digits.length >= 8 && digits.length <= 17) {
		// Valid international phone number format
		return { valid: true, normalized: digits };
	}

	return {
		valid: false,
		reason:
			"Invalid phone format. Expected international format with 8-17 digits.",
	};
}

/**
 * Validate birth date format and validity
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {boolean} - True if date is valid
 */
function isValidBirthdate(dateStr) {
	// Check YYYY-MM-DD format
	const regex = /^\d{4}-\d{2}-\d{2}$/;
	if (!regex.test(dateStr)) return false;

	const date = new Date(dateStr);
	const now = new Date();

	// Check if date is valid and not in the future
	return !isNaN(date.getTime()) && date <= now;
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {boolean} - True if password meets requirements
 */
function isValidPassword(password) {
	// At least 8 characters, one uppercase, one lowercase, one number
	const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;
	return regex.test(password);
}

export {
	checkTelegramUsername,
	checkInternationalPhone,
	checkUsername,
	isValidBirthdate,
	isValidPassword,
};
