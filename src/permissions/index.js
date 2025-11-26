import { rule, shield, allow, deny } from "graphql-shield";
import { ROLES } from "../constants/roles.js";
import {
	checkPermission,
	checkResourceAccess,
	checkActionPermission,
	clearUserPermissionCache,
	clearPermissionCache,
	getCacheStats,
} from "../utils/permissions.js";
import { logPermission, logSecurity } from "../utils/audit.js";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Optimized permission checking utilities using cached functions
 */
const checkUserPermission = async (user, permission) => {
	const result = await checkPermission(user, permission);
	return result.allowed;
};

const checkUserRole = async (user, allowedRoles) => {
	if (!user) return false;
	return allowedRoles.includes(user.role);
};

const checkOwnership = async (user, resourceId, resourceType) => {
	if (!user) return false;

	// Root can access everything
	if (user.role === ROLES.ROOT) return true;

	// Check if user is accessing their own resource
	return parseInt(user.id) === parseInt(resourceId);
};

// ============================================================================
// BASIC AUTHENTICATION & ROLE RULES
// ============================================================================

/**
 * Check if user is authenticated
 */
const isAuth = rule()(async (_parent, _args, { user }) => {
	if (!user) return false;
	const result = await checkPermission(user, "view_own_profile");
	return result.allowed;
});

/**
 * Check if user is ROOT
 */
const isRoot = rule()(async (_parent, _args, { user }) => {
	return user?.role === ROLES.ROOT;
});

/**
 * Check if user is ADMIN or ROOT
 */
const isAdminOrRoot = rule()(async (_parent, _args, { user }) => {
	return [ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
});

/**
 * Check if user is TEACHER, ADMIN, or ROOT
 */
const isTeacherAdminOrRoot = rule()(async (_parent, _args, { user }) => {
	return [ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
});

// ============================================================================
// PERMISSION-BASED RULES (Using Permission System)
// ============================================================================

const canViewAdmins = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "view_admins");
});

const canViewTeachers = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "view_teachers");
});

const canViewStudents = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "view_students");
});

const canCreateAdmin = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "create_admin");
});

const canCreateTeacher = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "create_teacher");
});

const canCreateStudent = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "create_student");
});

const canUpdateAdmin = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "update_admin");
});

const canUpdateTeacher = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "update_teacher");
});

const canUpdateStudent = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "update_student");
});

const canDeleteAdmin = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "delete_admin");
});

const canUpdateOwnProfile = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "update_own_profile");
});

const canManageAdminStatus = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "manage_admin_status");
});

const canManageTeacherStatus = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "manage_teacher_status");
});

const canManageStudentStatus = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "manage_student_status");
});

const canViewAllUsers = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "view_all_users");
});

const canManageSystem = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "manage_system");
});

const canViewAuditLogs = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "view_audit_logs");
});

const canExportData = rule()(async (_parent, _args, { user }) => {
	return await checkUserPermission(user, "export_data");
});

// ============================================================================
// RESOURCE OWNERSHIP RULES
// ============================================================================

/**
 * Check if user can update their own admin profile
 * - ROOT can update any admin
 * - ADMIN can only update their own profile
 */
const canUpdateOwnAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (user.role === ROLES.ROOT) return true;
	if (user.role === ROLES.ADMIN) {
		return parseInt(user.id) === parseInt(args.id);
	}
	return false;
});

/**
 * Check if user can update their own teacher profile
 * - ROOT can update any teacher
 * - ADMIN can update any teacher
 * - TEACHER can only update their own profile
 */
const canUpdateOwnTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (user.role === ROLES.ROOT) return true;
	if (user.role === ROLES.ADMIN) return true;
	if (user.role === ROLES.TEACHER) {
		return parseInt(user.id) === parseInt(args.id);
	}
	return false;
});

/**
 * Check if user can update their own student profile
 * - ROOT can update any student
 * - ADMIN can update any student
 */
const canUpdateOwnStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (user.role === ROLES.ROOT) return true;
	if (user.role === ROLES.ADMIN) return true;
	return false;
});

// ============================================================================
// RESOURCE-SPECIFIC VIEW RULES
// ============================================================================

/**
 * Check if user can view a specific admin
 * - ROOT can view any admin
 * - ADMIN can view their own profile
 */
const canViewSpecificAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (user.role === ROLES.ROOT) return true;
	if (user.role === ROLES.ADMIN) {
		return parseInt(user.id) === parseInt(args.id);
	}
	return false;
});

/**
 * Check if user can view a specific teacher
 * - ROOT and ADMIN can view any teacher
 * - TEACHER can only view their own profile
 */
const canViewSpecificTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if ([ROLES.ROOT, ROLES.ADMIN].includes(user.role)) return true;
	if (user.role === ROLES.TEACHER) {
		return parseInt(user.id) === parseInt(args.id);
	}
	return false;
});

/**
 * Check if user can view a specific student
 * - ROOT, ADMIN, and TEACHER can view any student
 */
const canViewSpecificStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return [ROLES.ROOT, ROLES.ADMIN, ROLES.TEACHER].includes(user.role);
});

// ============================================================================
// STATUS CHANGE RULES
// ============================================================================

/**
 * Check if user can change admin status
 * - Only ROOT can change admin status
 */
const canChangeAdminStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return user.role === ROLES.ROOT;
});

/**
 * Check if user can change teacher status
 * - ROOT and ADMIN can change teacher status
 */
const canChangeTeacherStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
});

/**
 * Check if user can change student status
 * - ROOT and ADMIN can change student status
 */
const canChangeStudentStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
});

// ============================================================================
// ADVANCED PERMISSION RULES
// ============================================================================

const canAccessSensitiveData = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	if (user.role === ROLES.ROOT) return true;
	if (user.role === ROLES.ADMIN) {
		// Check if user has verified their identity recently
		// This would typically check a verification timestamp
		return true; // Simplified for example
	}
	return false;
});

const canPerformBulkOperations = rule()(async (_parent, args, { user }) => {
	if (!user) return false;
	// Only root can perform bulk operations
	return user.role === ROLES.ROOT;
});

// ============================================================================
// GRAPHQL SHIELD PERMISSIONS CONFIGURATION
// ============================================================================

export const permissions = shield(
	{
		// ====================================================================
		// QUERY PERMISSIONS
		// ====================================================================
		Query: {
			// User profile queries
			me: allow, // Allow me query without authentication

			// Admin queries
			getAdmins: canViewAdmins,
			getAdmin: canViewSpecificAdmin,

			// Teacher queries
			getTeachers: canViewTeachers,
			getTeacher: canViewSpecificTeacher,

			// Student queries
			getStudents: canViewStudents,
			getStudent: canViewSpecificStudent,

			// Degree queries - Any authenticated user can view
			getDegrees: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),
			getDegree: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),

			// Course queries - Any authenticated user can view
			getCourses: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),
			getCourse: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),

			// Dashboard queries - Any authenticated user can view
			getDashboardStats: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),
		},

		// ====================================================================
		// MUTATION PERMISSIONS
		// ====================================================================
		Mutation: {
			// Public mutations
			login: allow,

			// Profile management - Any authenticated user
			updateProfile: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),
			changePassword: rule()(async (_parent, _args, { user }) => {
				return !!user;
			}),

			// Admin management
			addAdmin: canCreateAdmin,
			changeAdmin: canUpdateOwnAdmin,
			changeAdminActive: canChangeAdminStatus,
			deleteAdmin: canDeleteAdmin,

			// Teacher management
			addTeacher: rule()(async (_parent, _args, { user }) => {
				return [ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
			}),
			changeTeacher: canUpdateOwnTeacher,
			changeTeacherActive: canChangeTeacherStatus,
			deleteTeacher: canDeleteAdmin, // Root and Admin can delete teachers

			// Student management
			addStudent: canCreateStudent,
			changeStudent: canUpdateOwnStudent,
			changeStudentActive: canChangeStudentStatus,
			deleteStudent: canDeleteAdmin, // Root and Admin can delete students

			// Degree management - Only ROOT and ADMIN
			addDegree: rule()(async (_parent, _args, { user }) => {
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),
			updateDegree: rule()(async (_parent, _args, { user }) => {
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),
			deleteDegree: rule()(async (_parent, _args, { user }) => {
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),

			// Course management - Only ROOT and ADMIN
			/**
			 * Add Course Mutation Permission
			 * Allowed roles: ROOT, ADMIN
			 * Teachers and other users cannot create courses
			 */
			addCourse: rule()(async (_parent, _args, { user }) => {
				if (!user) return false;
				return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
			}),

			/**
			 * Update Course Mutation Permission
			 * Allowed roles: ROOT, ADMIN
			 * Teachers and other users cannot update courses
			 */
			updateCourse: rule()(async (_parent, _args, { user }) => {
				if (!user) return false;
				return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
			}),

			/**
			 * Delete Course Mutation Permission
			 * Allowed roles: ROOT, ADMIN
			 * Teachers and other users cannot delete courses
			 */
			deleteCourse: rule()(async (_parent, _args, { user }) => {
				if (!user) return false;
				return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
			}),

			/**
			 * Add Student to Course Mutation Permission
			 * Allowed roles: ROOT, ADMIN
			 * Teachers and other users cannot enroll students
			 */
			addStudentToCourse: rule()(async (_parent, _args, { user }) => {
				if (!user) return false;
				return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
			}),

			/**
			 * Remove Student from Course Mutation Permission
			 * Allowed roles: ROOT, ADMIN
			 * Teachers and other users cannot remove students
			 */
			removeStudentFromCourse: rule()(async (_parent, _args, { user }) => {
				if (!user) return false;
				return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
			}),
		},

		// ====================================================================
		// FIELD-LEVEL PERMISSIONS
		// ====================================================================

		// User Types
		Admin: {
			id: allow,
			username: allow,
			fullname: allow,
			birthDate: allow,
			phone: allow,
			tgUsername: allow,
			isActive: allow,
			createdAt: allow,
		},

		Teacher: {
			id: allow,
			username: allow,
			fullname: allow,
			birthDate: allow,
			phone: allow,
			tgUsername: allow,
			gender: allow,
			profilePicture: allow,
			degrees: allow,
			isActive: allow,
			createdAt: allow,
		},

		Student: {
			id: allow,
			username: allow,
			fullname: allow,
			birthDate: allow,
			phone: allow,
			tgUsername: allow,
			gender: allow,
			possibleDegrees: allow,
			profilePicture: allow,
			isActive: allow,
			isDeleted: allow,
			createdAt: allow,
		},

		// Course Types
		Degree: {
			id: allow,
			name: allow,
			teachers: allow,
			courses: allow,
			createdAt: allow,
		},

		Course: {
			id: allow,
			name: allow,
			description: allow,
			daysOfWeek: allow,
			gender: allow,
			startAt: allow,
			endAt: allow,
			startTime: allow,
			endTime: allow,
			students: allow,
			teacher: allow,
			substituteTeachers: allow,
			degrees: allow,
			createdAt: allow,
		},

		CourseStudent: {
			id: allow,
			course: allow,
			student: allow,
			joinedAt: allow,
			monthlyPayment: allow,
			isActive: allow,
			createdAt: allow,
		},

		SubstituteTeacher: {
			id: allow,
			course: allow,
			teacher: allow,
			startDate: allow,
			endDate: allow,
			reason: allow,
			createdAt: allow,
		},

		// Dashboard Types
		DashboardStats: {
			totalStudents: allow,
			totalTeachers: allow,
			totalAdmins: allow,
			activeStudents: allow,
			activeTeachers: allow,
			activeAdmins: allow,
			totalUsers: allow,
			activeUsers: allow,
			averageStudentAge: allow,
			averageTeacherAge: allow,
			averageAdminAge: allow,
			studentGenderDistribution: allow,
			teacherGenderDistribution: allow,
		},

		GenderDistribution: {
			male: allow,
			female: allow,
			child: allow,
		},

		// Response Types - Course Mutations
		AddCourseResponse: {
			success: allow,
			message: allow,
			course: allow,
			errors: allow,
			timestamp: allow,
		},

		UpdateCourseResponse: {
			success: allow,
			message: allow,
			course: allow,
			errors: allow,
			timestamp: allow,
		},

		DeleteCourseResponse: {
			success: allow,
			message: allow,
			errors: allow,
			timestamp: allow,
		},

		AddStudentToCourseResponse: {
			success: allow,
			message: allow,
			courseStudent: allow,
			errors: allow,
			timestamp: allow,
		},

		RemoveStudentFromCourseResponse: {
			success: allow,
			message: allow,
			errors: allow,
			timestamp: allow,
		},

		// Response Types - Auth
		LoginResponse: {
			success: allow,
			message: allow,
			token: allow,
			user: allow,
		},

		UserData: {
			id: allow,
			username: allow,
			fullname: allow,
			role: allow,
			createdAt: allow,
			birthDate: allow,
			phone: allow,
			tgUsername: allow,
			isActive: allow,
			department: allow,
		},

		// Response Types - Admin Mutations
		AddAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},

		UpdateAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},

		DeleteAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},

		// Response Types - Teacher Mutations
		AddTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},

		UpdateTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},

		ChangeTeacherActiveResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},

		DeleteTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},

		// Response Types - Student Mutations
		AddStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},

		UpdateStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},

		ChangeStudentActiveResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},

		DeleteStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},

		// Response Types - Profile Mutations
		UpdateProfileResponse: {
			success: allow,
			message: allow,
			user: allow,
			errors: allow,
			timestamp: allow,
		},

		ChangePasswordResponse: {
			success: allow,
			message: allow,
			errors: allow,
			timestamp: allow,
		},

		// Response Types - Degree Mutations
		AddDegreeResponse: {
			success: allow,
			message: allow,
			degree: allow,
			errors: allow,
			timestamp: allow,
		},

		UpdateDegreeResponse: {
			success: allow,
			message: allow,
			degree: allow,
			errors: allow,
			timestamp: allow,
		},

		// Upload scalar - All authenticated users can upload files
		Upload: rule()(async (_parent, _args, { user }) => {
			// Any authenticated user can upload files
			return !!user;
		}),
	},
	{
		fallbackRule: deny, // Deny by default for security
		allowExternalErrors: true,
		debug: process.env.NODE_ENV === "development",
		graphqlErrorHandler: (err, parent, args, context, info) => {
			// Custom error handling for permission failures
			if (err.message.includes("permission")) {
				return new Error("Access denied: Insufficient permissions");
			}
			return err;
		},
	}
);

// ============================================================================
// CACHE MANAGEMENT UTILITIES
// ============================================================================

/**
 * Invalidate permission cache for a specific user
 */
export const invalidateUserCache = (userId) => {
	clearUserPermissionCache(userId);
};

/**
 * Invalidate all permission caches
 */
export const invalidateAllCache = () => {
	clearPermissionCache();
};

// ============================================================================
// PERFORMANCE MONITORING UTILITIES
// ============================================================================

/**
 * Get permission system statistics
 */
export const getPermissionStats = () => {
	return {
		cacheStats: getCacheStats(),
		timestamp: new Date().toISOString(),
	};
};
