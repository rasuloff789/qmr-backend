/**
 * QMR Backend - Audit Logging Utility
 *
 * Comprehensive audit logging for security and compliance.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

import { prisma } from "../database/index.js";

/**
 * Audit log levels
 */
export const AUDIT_LEVELS = {
	INFO: "info",
	WARNING: "warning",
	ERROR: "error",
	SECURITY: "security",
};

/**
 * Audit log categories
 */
export const AUDIT_CATEGORIES = {
	AUTHENTICATION: "authentication",
	AUTHORIZATION: "authorization",
	DATA_ACCESS: "data_access",
	DATA_MODIFICATION: "data_modification",
	SYSTEM: "system",
	SECURITY: "security",
};

/**
 * Audit log entry structure
 */
class AuditEntry {
	constructor({
		userId,
		userRole,
		action,
		resource,
		resourceId,
		level = AUDIT_LEVELS.INFO,
		category = AUDIT_CATEGORIES.SYSTEM,
		details = {},
		ipAddress = null,
		userAgent = null,
		success = true,
		errorMessage = null,
	}) {
		this.userId = userId;
		this.userRole = userRole;
		this.action = action;
		this.resource = resource;
		this.resourceId = resourceId;
		this.level = level;
		this.category = category;
		this.details = details;
		this.ipAddress = ipAddress;
		this.userAgent = userAgent;
		this.success = success;
		this.errorMessage = errorMessage;
		this.timestamp = new Date();
	}
}

/**
 * Audit logger class
 */
export class AuditLogger {
	constructor() {
		this.logs = [];
		this.enabled = process.env.AUDIT_LOGGING_ENABLED !== "false";
	}

	/**
	 * Log an audit entry
	 */
	async log(entry) {
		if (!this.enabled) return;

		try {
			// Add to in-memory logs
			this.logs.push(entry);

			// Store in database if configured
			if (process.env.AUDIT_DATABASE_ENABLED === "true") {
				await this._storeInDatabase(entry);
			}

			// Console logging for development
			if (process.env.NODE_ENV === "development") {
				console.log(
					`[AUDIT] ${entry.level.toUpperCase()}: ${entry.action} by ${
						entry.userRole
					}(${entry.userId})`
				);
			}
		} catch (error) {
			console.error("Audit logging error:", error);
		}
	}

	/**
	 * Log authentication event
	 */
	async logAuth(user, action, success = true, details = {}) {
		const entry = new AuditEntry({
			userId: user?.id,
			userRole: user?.role,
			action,
			resource: "authentication",
			level: success ? AUDIT_LEVELS.INFO : AUDIT_LEVELS.WARNING,
			category: AUDIT_CATEGORIES.AUTHENTICATION,
			success,
			details,
		});

		await this.log(entry);
	}

	/**
	 * Log permission check
	 */
	async logPermission(user, action, resource, success = true, details = {}) {
		const entry = new AuditEntry({
			userId: user?.id,
			userRole: user?.role,
			action,
			resource,
			level: success ? AUDIT_LEVELS.INFO : AUDIT_LEVELS.SECURITY,
			category: AUDIT_CATEGORIES.AUTHORIZATION,
			success,
			details,
		});

		await this.log(entry);
	}

	/**
	 * Log data access
	 */
	async logDataAccess(user, action, resource, resourceId, details = {}) {
		const entry = new AuditEntry({
			userId: user?.id,
			userRole: user?.role,
			action,
			resource,
			resourceId,
			level: AUDIT_LEVELS.INFO,
			category: AUDIT_CATEGORIES.DATA_ACCESS,
			details,
		});

		await this.log(entry);
	}

	/**
	 * Log data modification
	 */
	async logDataModification(
		user,
		action,
		resource,
		resourceId,
		changes = {},
		details = {}
	) {
		const entry = new AuditEntry({
			userId: user?.id,
			userRole: user?.role,
			action,
			resource,
			resourceId,
			level: AUDIT_LEVELS.INFO,
			category: AUDIT_CATEGORIES.DATA_MODIFICATION,
			details: { ...details, changes },
		});

		await this.log(entry);
	}

	/**
	 * Log security event
	 */
	async logSecurity(user, action, resource, details = {}) {
		const entry = new AuditEntry({
			userId: user?.id,
			userRole: user?.role,
			action,
			resource,
			level: AUDIT_LEVELS.SECURITY,
			category: AUDIT_CATEGORIES.SECURITY,
			details,
		});

		await this.log(entry);
	}

	/**
	 * Store audit entry in database
	 */
	async _storeInDatabase(entry) {
		// This would require an audit_logs table in your database
		// For now, we'll just log to console
		console.log("Audit entry:", JSON.stringify(entry, null, 2));
	}

	/**
	 * Get audit logs
	 */
	getLogs(filter = {}) {
		let filteredLogs = this.logs;

		if (filter.userId) {
			filteredLogs = filteredLogs.filter((log) => log.userId === filter.userId);
		}

		if (filter.action) {
			filteredLogs = filteredLogs.filter((log) => log.action === filter.action);
		}

		if (filter.level) {
			filteredLogs = filteredLogs.filter((log) => log.level === filter.level);
		}

		if (filter.category) {
			filteredLogs = filteredLogs.filter(
				(log) => log.category === filter.category
			);
		}

		if (filter.startDate) {
			filteredLogs = filteredLogs.filter(
				(log) => log.timestamp >= filter.startDate
			);
		}

		if (filter.endDate) {
			filteredLogs = filteredLogs.filter(
				(log) => log.timestamp <= filter.endDate
			);
		}

		return filteredLogs;
	}

	/**
	 * Clear old logs
	 */
	clearLogs(olderThanDays = 30) {
		const cutoffDate = new Date();
		cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

		this.logs = this.logs.filter((log) => log.timestamp > cutoffDate);
	}
}

// Global audit logger instance
export const auditLogger = new AuditLogger();

/**
 * Convenience functions for common audit operations
 */
export const logAuth = (user, action, success, details) =>
	auditLogger.logAuth(user, action, success, details);

export const logPermission = (user, action, resource, success, details) =>
	auditLogger.logPermission(user, action, resource, success, details);

export const logDataAccess = (user, action, resource, resourceId, details) =>
	auditLogger.logDataAccess(user, action, resource, resourceId, details);

export const logDataModification = (
	user,
	action,
	resource,
	resourceId,
	changes,
	details
) =>
	auditLogger.logDataModification(
		user,
		action,
		resource,
		resourceId,
		changes,
		details
	);

export const logSecurity = (user, action, resource, details) =>
	auditLogger.logSecurity(user, action, resource, details);
