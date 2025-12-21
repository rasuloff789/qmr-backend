import { prisma } from "../../../database/index.js";

/**
 * Get audit logs with filtering, sorting, and pagination
 * Only accessible by root users
 * @param {Object} _parent - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} args.filter - Filter options
 * @param {Object} args.sort - Sort options
 * @param {number} args.page - Page number (1-based)
 * @param {number} args.pageSize - Number of items per page
 * @param {Object} context - GraphQL context
 * @param {Object} context.user - Authenticated user
 * @returns {Object} - GetAuditLogsResponse with logs and pagination info
 */
const getAuditLogs = async (
	_parent,
	{ filter = {}, sort = { field: "createdAt", direction: "desc" }, page = 1, pageSize = 50 },
	{ user }
) => {
	try {
		// Only root users can view audit logs
		if (!user || user.role !== "root") {
			throw new Error("Unauthorized: Only root users can view audit logs");
		}

		// Build where clause from filter
		const where = {};

		if (filter.userId) {
			where.userId = parseInt(filter.userId);
		}

		if (filter.userRole) {
			where.userRole = filter.userRole;
		}

		if (filter.action) {
			where.action = { contains: filter.action, mode: "insensitive" };
		}

		if (filter.resource) {
			where.resource = { contains: filter.resource, mode: "insensitive" };
		}

		if (filter.level) {
			where.level = filter.level;
		}

		if (filter.category) {
			where.category = filter.category;
		}

		if (filter.success !== undefined && filter.success !== null) {
			where.success = filter.success;
		}

		if (filter.startDate || filter.endDate) {
			where.createdAt = {};
			if (filter.startDate) {
				where.createdAt.gte = new Date(filter.startDate);
			}
			if (filter.endDate) {
				const endDate = new Date(filter.endDate);
				endDate.setHours(23, 59, 59, 999);
				where.createdAt.lte = endDate;
			}
		}

		// Search in username or fullname
		if (filter.search) {
			where.OR = [
				{ username: { contains: filter.search, mode: "insensitive" } },
				{ fullname: { contains: filter.search, mode: "insensitive" } },
			];
		}

		// Build orderBy from sort
		const orderBy = {};
		const sortField = sort.field || "createdAt";
		const sortDirection = sort.direction?.toLowerCase() === "asc" ? "asc" : "desc";

		// Map common sort fields
		const sortFieldMap = {
			createdAt: "createdAt",
			action: "action",
			resource: "resource",
			level: "level",
			category: "category",
			userRole: "userRole",
			username: "username",
		};

		orderBy[sortFieldMap[sortField] || "createdAt"] = sortDirection;

		// Calculate pagination
		const skip = (page - 1) * pageSize;
		const take = Math.min(pageSize, 100); // Max 100 items per page

		// Get total count and logs in parallel
		const [totalCount, logs] = await Promise.all([
			prisma.auditLog.count({ where }),
			prisma.auditLog.findMany({
				where,
				orderBy,
				skip,
				take,
			}),
		]);

		const totalPages = Math.ceil(totalCount / take);

		return {
			logs: logs.map((log) => ({
				id: String(log.id),
				userId: log.userId,
				userRole: log.userRole,
				username: log.username,
				fullname: log.fullname,
				action: log.action,
				resource: log.resource,
				resourceId: log.resourceId,
				level: log.level,
				category: log.category,
				success: log.success,
				errorMessage: log.errorMessage,
				details: log.details,
				ipAddress: log.ipAddress,
				userAgent: log.userAgent,
				createdAt: log.createdAt,
			})),
			totalCount,
			page,
			pageSize: take,
			totalPages,
		};
	} catch (error) {
		console.error("Error fetching audit logs:", error);
		throw new Error(error.message || "Failed to fetch audit logs");
	}
};

export default getAuditLogs;

