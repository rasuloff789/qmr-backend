/**
 * QMR Backend - User Roles and Permissions
 *
 * Clean role-based access control with hierarchical permissions.
 *
 * @author QMR Development Team
 * @version 2.0.0
 */

/**
 * User Roles
 */
export const ROLES = {
	ROOT: "root",
	ADMIN: "admin",
	TEACHER: "teacher",
};

/**
 * Role Hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY = {
	[ROLES.ROOT]: 3,
	[ROLES.ADMIN]: 2,
	[ROLES.TEACHER]: 1,
};

/**
 * Role Permissions - Granular permission system
 */
export const PERMISSIONS = {
	[ROLES.ROOT]: [
		// User Management
		"create_admin",
		"create_teacher",
		"update_admin",
		"update_teacher",
		"delete_admin",
		"view_all_users",
		"view_admins",
		"view_teachers",
		"manage_admin_status",
		"manage_teacher_status",

		// System Management
		"manage_system",
		"view_audit_logs",
		"manage_permissions",
		"system_configuration",

		// Data Access
		"view_all_data",
		"export_data",
		"backup_system",

		// Profile Management
		"update_own_profile",
		"update_any_profile",
	],
	[ROLES.ADMIN]: [
		// User Management
		"create_teacher",
		"update_teacher",
		"manage_teacher_status",
		"view_admins",
		"view_teachers",
		"view_own_profile",

		// Data Access
		"view_teacher_data",
		"view_admin_data",

		// Profile Management
		"update_own_profile",
		"view_own_profile",

		// File Upload
		"upload_files",
		"upload_profile_pictures",
	],
	[ROLES.TEACHER]: [
		// User Management
		"view_teachers",
		"view_own_profile",

		// Data Access
		"view_own_data",

		// Profile Management
		"update_own_profile",
		"view_own_profile",
		
		// File Upload
		"upload_files",
		"upload_profile_pictures",
	],
};

/**
 * Check if role has permission
 */
export const hasPermission = (role, permission) => {
	return PERMISSIONS[role]?.includes(permission) || false;
};

/**
 * Check if role is higher than another
 */
export const isHigherRole = (role1, role2) => {
	return ROLE_HIERARCHY[role1] > ROLE_HIERARCHY[role2];
};

/**
 * Check if role is equal or higher than another
 */
export const isEqualOrHigherRole = (role1, role2) => {
	return ROLE_HIERARCHY[role1] >= ROLE_HIERARCHY[role2];
};

/**
 * Get all permissions for a role (including inherited permissions)
 */
export const getRolePermissions = (role) => {
	const directPermissions = PERMISSIONS[role] || [];

	// Add inherited permissions from lower roles
	const inheritedPermissions = [];
	Object.entries(ROLE_HIERARCHY).forEach(([otherRole, level]) => {
		if (level < ROLE_HIERARCHY[role]) {
			inheritedPermissions.push(...(PERMISSIONS[otherRole] || []));
		}
	});

	return [...new Set([...directPermissions, ...inheritedPermissions])];
};

/**
 * Check if user can perform action on resource
 */
export const canPerformAction = (userRole, action, targetRole = null) => {
	// Check if user has the permission
	if (!hasPermission(userRole, action)) {
		return false;
	}

	// If target role is specified, check hierarchy
	if (targetRole && !isEqualOrHigherRole(userRole, targetRole)) {
		return false;
	}

	return true;
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role) => {
	const displayNames = {
		[ROLES.ROOT]: "System Administrator",
		[ROLES.ADMIN]: "Administrator",
		[ROLES.TEACHER]: "Teacher",
	};

	return displayNames[role] || role;
};

/**
 * Get role description
 */
export const getRoleDescription = (role) => {
	const descriptions = {
		[ROLES.ROOT]: "Full system access with all permissions",
		[ROLES.ADMIN]:
			"Administrative access to manage teachers and view system data",
		[ROLES.TEACHER]: "Basic access to view and manage own profile",
	};

	return descriptions[role] || "No description available";
};
