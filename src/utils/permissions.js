/**
 * QMR Backend - Optimized Permission Utilities
 *
 * High-performance permission checking with caching and audit logging.
 *
 * @author QMR Development Team
 * @version 3.0.0
 */

import { hasPermission, isHigherRole, ROLES } from "../constants/roles.js";
import checkUser from "./checkUser.js";

/**
 * Permission cache for performance optimization
 */
class PermissionCache {
	constructor(maxSize = 1000, ttl = 5 * 60 * 1000) {
		// 5 minutes TTL
		this.cache = new Map();
		this.maxSize = maxSize;
		this.ttl = ttl;
	}

	_getKey(userId, permission) {
		return `${userId}:${permission}`;
	}

	_get(userId, permission) {
		const key = this._getKey(userId, permission);
		const cached = this.cache.get(key);

		if (!cached) return null;

		// Check if expired
		if (Date.now() - cached.timestamp > this.ttl) {
			this.cache.delete(key);
			return null;
		}

		return cached.result;
	}

	_set(userId, permission, result) {
		// Clean cache if it's too large
		if (this.cache.size >= this.maxSize) {
			const firstKey = this.cache.keys().next().value;
			this.cache.delete(firstKey);
		}

		const key = this._getKey(userId, permission);
		this.cache.set(key, {
			result,
			timestamp: Date.now(),
		});
	}

	clear() {
		this.cache.clear();
	}

	// Clear cache for specific user
	clearUser(userId) {
		for (const [key] of this.cache) {
			if (key.startsWith(`${userId}:`)) {
				this.cache.delete(key);
			}
		}
	}
}

// Global permission cache instance
const permissionCache = new PermissionCache();

/**
 * Permission check result with audit information
 */
class PermissionResult {
	constructor(allowed, reason = "", metadata = {}) {
		this.allowed = allowed;
		this.reason = reason;
		this.metadata = metadata;
		this.timestamp = new Date().toISOString();
	}
}

/**
 * Optimized permission checking with caching and audit logging
 */
export class PermissionChecker {
	constructor(user, action, resource = null) {
		this.user = user;
		this.action = action;
		this.resource = resource;
		this.auditLog = [];
		this._userValidated = null; // Cache user validation
	}

	/**
	 * Check if user has specific permission with caching
	 */
	async hasPermission(permission) {
		// Check cache first
		if (this.user?.id) {
			const cached = permissionCache._get(this.user.id, permission);
			if (cached !== null) {
				return cached;
			}
		}

		const result = await this._checkPermission(permission);

		// Cache the result
		if (this.user?.id) {
			permissionCache._set(this.user.id, permission, result);
		}

		this._logAudit("permission_check", result);
		return result;
	}

	/**
	 * Check if user can access resource (own or higher role) with optimized validation
	 */
	async canAccessResource(resourceId, resourceOwnerRole) {
		if (!this.user) {
			return new PermissionResult(false, "No user provided");
		}

		// Use cached user validation if available
		if (this._userValidated === null) {
			this._userValidated = await checkUser(this.user);
		}

		if (!this._userValidated) {
			return new PermissionResult(false, "Invalid user");
		}

		// Root can access everything
		if (this.user.role === ROLES.ROOT) {
			return new PermissionResult(true, "Root access");
		}

		// Check if accessing own resource
		if (parseInt(this.user.id) === parseInt(resourceId)) {
			return new PermissionResult(true, "Own resource access");
		}

		// Check role hierarchy
		if (isHigherRole(this.user.role, resourceOwnerRole)) {
			return new PermissionResult(true, "Higher role access");
		}

		return new PermissionResult(false, "Insufficient permissions");
	}

	/**
	 * Check if user can perform action on resource
	 */
	async canPerformAction(action, resourceId = null, resourceOwnerRole = null) {
		// First check basic permission
		const permissionResult = await this.hasPermission(action);
		if (!permissionResult.allowed) {
			return permissionResult;
		}

		// If resource-specific, check resource access
		if (resourceId && resourceOwnerRole) {
			const resourceResult = await this.canAccessResource(
				resourceId,
				resourceOwnerRole
			);
			if (!resourceResult.allowed) {
				return resourceResult;
			}
		}

		return new PermissionResult(true, "Action allowed");
	}

	/**
	 * Optimized internal permission check with cached user validation
	 */
	async _checkPermission(permission) {
		if (!this.user) {
			return new PermissionResult(false, "No user provided");
		}

		// Use cached user validation if available
		if (this._userValidated === null) {
			this._userValidated = await checkUser(this.user);
		}

		if (!this._userValidated) {
			return new PermissionResult(false, "Invalid user");
		}

		const hasPerm = hasPermission(this.user.role, permission);
		return new PermissionResult(
			hasPerm,
			hasPerm ? "Permission granted" : "Permission denied"
		);
	}

	/**
	 * Log audit information
	 */
	_logAudit(type, result) {
		this.auditLog.push({
			type,
			user: this.user?.id,
			role: this.user?.role,
			action: this.action,
			resource: this.resource,
			result: result.allowed,
			reason: result.reason,
			timestamp: new Date().toISOString(),
		});
	}

	/**
	 * Get audit log
	 */
	getAuditLog() {
		return this.auditLog;
	}
}

/**
 * Optimized permission check functions with caching
 */
export const checkPermission = async (user, permission) => {
	// Check cache first for quick responses
	if (user?.id) {
		const cached = permissionCache._get(user.id, permission);
		if (cached !== null) {
			return cached;
		}
	}

	const checker = new PermissionChecker(user, permission);
	const result = await checker._checkPermission(permission);

	// Cache the result
	if (user?.id) {
		permissionCache._set(user.id, permission, result);
	}

	return result;
};

export const checkResourceAccess = async (
	user,
	resourceId,
	resourceOwnerRole
) => {
	const checker = new PermissionChecker(user, "resource_access", resourceId);
	return await checker.canAccessResource(resourceId, resourceOwnerRole);
};

export const checkActionPermission = async (
	user,
	action,
	resourceId = null,
	resourceOwnerRole = null
) => {
	const checker = new PermissionChecker(user, action, resourceId);
	return await checker.canPerformAction(action, resourceId, resourceOwnerRole);
};

/**
 * Cache management utilities
 */
export const clearPermissionCache = () => {
	permissionCache.clear();
};

export const clearUserPermissionCache = (userId) => {
	permissionCache.clearUser(userId);
};

export const getCacheStats = () => {
	return {
		size: permissionCache.cache.size,
		maxSize: permissionCache.maxSize,
		ttl: permissionCache.ttl,
	};
};

/**
 * Role-based permission helpers
 */
export const isRoot = (user) => user?.role === ROLES.ROOT;
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isTeacher = (user) => user?.role === ROLES.TEACHER;
export const isAdminOrRoot = (user) =>
	[ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
export const isTeacherOrHigher = (user) =>
	[ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT].includes(user?.role);

/**
 * Resource ownership helpers
 */
export const isOwnResource = (user, resourceId) => {
	return user && parseInt(user.id) === parseInt(resourceId);
};

export const canAccessOwnResource = (user, resourceId) => {
	return user && isOwnResource(user, resourceId);
};

export const canAccessAnyResource = (user) => {
	return user && isRoot(user);
};

/**
 * Optimized permission validation for GraphQL resolvers
 */
export const validatePermission = async (
	user,
	permission,
	resourceId = null,
	resourceOwnerRole = null
) => {
	const result = await checkActionPermission(
		user,
		permission,
		resourceId,
		resourceOwnerRole
	);

	if (!result.allowed) {
		throw new Error(`Permission denied: ${result.reason}`);
	}

	return true;
};

/**
 * Batch permission checking for multiple permissions
 */
export const checkMultiplePermissions = async (user, permissions) => {
	const results = {};

	// Check all permissions in parallel for better performance
	const promises = permissions.map(async (permission) => {
		const result = await checkPermission(user, permission);
		return { permission, result };
	});

	const resolved = await Promise.all(promises);

	resolved.forEach(({ permission, result }) => {
		results[permission] = result;
	});

	return results;
};
