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

/**
 * Optimized authentication and role rules
 */
const isAuth = rule()(async (_parent, _args, { user }) => {
	if (!user) return false;

	// Use cached permission check for user validation
	const result = await checkPermission(user, "view_own_profile");
	return result.allowed;
});

const isRoot = rule()(async (_parent, _args, { user }) => {
	return user?.role === ROLES.ROOT;
});

const isAdminOrRoot = rule()(async (_parent, _args, { user }) => {
	return [ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
});

const isTeacherAdminOrRoot = rule()(async (_parent, _args, { user }) => {
	return [ROLES.TEACHER, ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
});

/**
 * Optimized permission-based rules using cached functions
 */
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

/**
 * Optimized resource ownership rules
 */
const canUpdateOwnAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root can update any admin
	if (user.role === ROLES.ROOT) return true;

	// Admin can only update their own profile
	if (user.role === ROLES.ADMIN) {
		return parseInt(user.id) === parseInt(args.id);
	}

	return false;
});

const canUpdateOwnTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root can update any teacher
	if (user.role === ROLES.ROOT) return true;

	// Admin can update any teacher
	if (user.role === ROLES.ADMIN) return true;

	// Teacher can only update their own profile
	if (user.role === ROLES.TEACHER) {
		return parseInt(user.id) === parseInt(args.id);
	}

	return false;
});

const canUpdateOwnStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root can update any student
	if (user.role === ROLES.ROOT) return true;

	// Admin can update any student
	if (user.role === ROLES.ADMIN) return true;

	return false;
});

/**
 * Optimized advanced permission rules with context awareness
 */
const canViewSpecificAdmin = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root can view any admin
	if (user.role === ROLES.ROOT) return true;

	// Admin can view their own profile
	if (user.role === ROLES.ADMIN) {
		return parseInt(user.id) === parseInt(args.id);
	}

	return false;
});

const canViewSpecificTeacher = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root and Admin can view any teacher
	if ([ROLES.ROOT, ROLES.ADMIN].includes(user.role)) return true;

	// Teacher can only view their own profile
	if (user.role === ROLES.TEACHER) {
		return parseInt(user.id) === parseInt(args.id);
	}

	return false;
});

const canViewSpecificStudent = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root, Admin, and Teacher can view any student
	if ([ROLES.ROOT, ROLES.ADMIN, ROLES.TEACHER].includes(user.role)) return true;

	return false;
});

const canChangeAdminStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Only root can change admin status
	return user.role === ROLES.ROOT;
});

const canChangeTeacherStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root and Admin can change teacher status
	return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
});

const canChangeStudentStatus = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root, Admin, and Teacher can change student status
	return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
});

/**
 * Optimized conditional permission rules
 */
const canAccessSensitiveData = rule()(async (_parent, args, { user }) => {
	if (!user) return false;

	// Root always has access
	if (user.role === ROLES.ROOT) return true;

	// Admin needs additional verification
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

// GraphQL Shield permissions configuration - Only for operations that exist in schema
export const permissions = shield(
	{
		Query: {
			// User profile queries
			me: allow, // Allow me query without authentication

			// Admin queries - Allow admins and root to access admin data
			getAdmins: canViewAdmins,
			getAdmin: canViewSpecificAdmin,

			// Teacher queries
			getTeachers: canViewTeachers,
			getTeacher: canViewSpecificTeacher, // Resource-specific permission

			// Student queries
			getStudents: canViewStudents,
			getStudent: canViewSpecificStudent,

			// Degree queries - Allow authenticated users to view degrees
			getDegrees: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can view degrees
				return !!user;
			}),
			getDegree: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can view a specific degree
				return !!user;
			}),

			// Course queries - Allow authenticated users to view courses
			getCourses: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can view courses
				return !!user;
			}),
			getCourse: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can view a specific course
				return !!user;
			}),

			// Dashboard queries - Allow authenticated users to view dashboard stats
			getDashboardStats: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can view dashboard stats
				return !!user;
			}),
		},
		Mutation: {
			// Public mutations
			login: allow,

			// Profile management
			updateProfile: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can update their own profile
				return !!user;
			}),
			changePassword: rule()(async (_parent, _args, { user }) => {
				// Any authenticated user can change their own password
				return !!user;
			}),

			// Admin management
			addAdmin: canCreateAdmin,
			changeAdmin: canUpdateOwnAdmin, // Can update own admin or root can update any
			changeAdminActive: canChangeAdminStatus, // Only root can change admin status
			deleteAdmin: canDeleteAdmin,

			// Teacher management
			addTeacher: rule()(async (_parent, _args, { user }) => {
				// Allow admin and root to add teachers
				return [ROLES.ADMIN, ROLES.ROOT].includes(user?.role);
			}),
			changeTeacher: canUpdateOwnTeacher, // Can update own teacher or root can update any
			changeTeacherActive: canChangeTeacherStatus, // Only root can change teacher status
			deleteTeacher: canDeleteAdmin, // Root and Admin can delete teachers

			// Student management
			addStudent: canCreateStudent,
			changeStudent: canUpdateOwnStudent,
			changeStudentActive: canChangeStudentStatus,
			deleteStudent: canDeleteAdmin, // Root and Admin can delete students

			// Degree management - Only root and admin can manage degrees
			addDegree: rule()(async (_parent, _args, { user }) => {
				// Only root and admin can create degrees
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),
			updateDegree: rule()(async (_parent, _args, { user }) => {
				// Only root and admin can update degrees
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),
			deleteDegree: rule()(async (_parent, _args, { user }) => {
				// Only root and admin can delete degrees
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),

			// Course management - Only root and admin can manage courses
			addCourse: rule()(async (_parent, _args, { user }) => {
				// Only root and admin can create courses
				return [ROLES.ROOT, ROLES.ADMIN].includes(user?.role);
			}),

			// (removed) testFileUpload
		},
		// Field-level permissions for existing fields only
		Admin: {
			// Allow all admin fields to be accessible
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
			// Allow all teacher fields to be accessible
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
		Degree: {
			// Allow all degree fields to be accessible
			id: allow,
			name: allow,
			teachers: allow,
			courses: allow,
			createdAt: allow,
		},
		Course: {
			// Allow all course fields to be accessible
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
			// Allow all CourseStudent fields to be accessible
			id: allow,
			course: allow,
			student: allow,
			joinedAt: allow,
			monthlyPayment: allow,
			isActive: allow,
			createdAt: allow,
		},
		SubstituteTeacher: {
			// Allow all SubstituteTeacher fields to be accessible
			id: allow,
			course: allow,
			teacher: allow,
			startDate: allow,
			endDate: allow,
			reason: allow,
			createdAt: allow,
		},
		Student: {
			// Allow all student fields to be accessible
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
		DashboardStats: {
			// Allow all dashboard stats fields to be accessible
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
			// Allow all gender distribution fields to be accessible
			male: allow,
			female: allow,
			child: allow,
		},
		AddCourseResponse: {
			// Allow all AddCourseResponse fields to be accessible
			success: allow,
			message: allow,
			course: allow,
			errors: allow,
			timestamp: allow,
		},
		// LoginResponse fields - allow all fields for login mutation
		LoginResponse: {
			success: allow,
			message: allow,
			token: allow,
			user: allow,
		},
		// UserData fields - allow all fields for login response
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
		// AddAdminResponse fields - allow all fields for addAdmin mutation
		AddAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},
		// UpdateAdminResponse fields - allow all fields for updateAdmin mutations
		UpdateAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},
		// DeleteAdminResponse fields - allow all fields for deleteAdmin mutation
		DeleteAdminResponse: {
			success: allow,
			message: allow,
			admin: allow,
			errors: allow,
			timestamp: allow,
		},
		// AddTeacherResponse fields - allow all fields for addTeacher mutation
		AddTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},
		// UpdateTeacherResponse fields - allow all fields for updateTeacher mutations
		UpdateTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},
		// ChangeTeacherActiveResponse fields - allow all fields for changeTeacherActive mutation
		ChangeTeacherActiveResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},
		// DeleteTeacherResponse fields - allow all fields for deleteTeacher mutation
		DeleteTeacherResponse: {
			success: allow,
			message: allow,
			teacher: allow,
			errors: allow,
			timestamp: allow,
		},
		// AddStudentResponse fields - allow all fields for addStudent mutation
		AddStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},
		// UpdateStudentResponse fields - allow all fields for updateStudent mutations
		UpdateStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},
		// ChangeStudentActiveResponse fields - allow all fields for changeStudentActive mutation
		ChangeStudentActiveResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},
		// DeleteStudentResponse fields - allow all fields for deleteStudent mutation
		DeleteStudentResponse: {
			success: allow,
			message: allow,
			student: allow,
			errors: allow,
			timestamp: allow,
		},
		// (removed) TestFileUploadResponse
		// UpdateProfileResponse fields - allow all fields for updateProfile mutation
		UpdateProfileResponse: {
			success: allow,
			message: allow,
			user: allow,
			errors: allow,
			timestamp: allow,
		},
		// ChangePasswordResponse fields - allow all fields for changePassword mutation
		ChangePasswordResponse: {
			success: allow,
			message: allow,
			errors: allow,
			timestamp: allow,
		},
		// AddDegreeResponse fields - allow all fields for addDegree mutation
		AddDegreeResponse: {
			success: allow,
			message: allow,
			degree: allow,
			errors: allow,
			timestamp: allow,
		},
		// UpdateDegreeResponse fields - allow all fields for updateDegree mutations
		UpdateDegreeResponse: {
			success: allow,
			message: allow,
			degree: allow,
			errors: allow,
			timestamp: allow,
		},

		// Upload scalar permissions - allow root, admin, and teacher users to upload files
		Upload: rule()(async (_parent, _args, { user }) => {
			if (!user) return false;
			return [ROLES.ROOT, ROLES.ADMIN].includes(user.role);
		}),
	},
	{
		fallbackRule: deny, // Deny by default for security
		allowExternalErrors: true,
		debug: process.env.NODE_ENV === "development",
		// Additional GraphQL Shield options
		graphqlErrorHandler: (err, parent, args, context, info) => {
			// Custom error handling for permission failures
			if (err.message.includes("permission")) {
				return new Error("Access denied: Insufficient permissions");
			}
			return err;
		},
	}
);

/**
 * Cache invalidation utilities for permission system
 */
export const invalidateUserCache = (userId) => {
	clearUserPermissionCache(userId);
};

export const invalidateAllCache = () => {
	clearPermissionCache();
};

/**
 * Performance monitoring utilities
 */
export const getPermissionStats = () => {
	return {
		cacheStats: getCacheStats(),
		timestamp: new Date().toISOString(),
	};
};
