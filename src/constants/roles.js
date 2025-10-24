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
	TEACHER: "teacher"
};

/**
 * Role Hierarchy (higher number = more permissions)
 */
export const ROLE_HIERARCHY = {
	[ROLES.ROOT]: 3,
	[ROLES.ADMIN]: 2,
	[ROLES.TEACHER]: 1
};

/**
 * Role Permissions
 */
export const PERMISSIONS = {
	[ROLES.ROOT]: [
		"create_admin",
		"create_teacher",
		"update_admin",
		"update_teacher",
		"delete_admin",
		"view_all_users",
		"manage_system"
	],
	[ROLES.ADMIN]: [
		"view_admins",
		"view_teachers",
		"update_own_profile"
	],
	[ROLES.TEACHER]: [
		"view_teachers",
		"update_own_profile"
	]
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