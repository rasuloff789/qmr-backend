/**
 * QMR Backend - Get Invoices Query Resolver
 *
 * Fetch invoices with optional filters
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Get invoices with optional filters
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.courseStudentId - Filter by course enrollment ID
 * @param {string} args.courseId - Filter by course ID
 * @param {string} args.status - Filter by invoice status
 * @param {number} args.month - Filter by billing month (1-12)
 * @param {number} args.year - Filter by billing year
 * @param {Object} context - GraphQL context
 * @returns {Promise<Array>} - Array of invoice records
 */
export default async function (_, args, context) {
	try {
		const { courseStudentId, courseId, status, month, year } = args;
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const userGender = String(user?.gender || "").toUpperCase();
		
		const where = {};
		
		if (courseStudentId) {
			where.courseStudentId = parseInt(courseStudentId);
		}
		
		if (courseId) {
			where.courseStudent = {
				courseId: parseInt(courseId),
			};
		}
		
		if (status) {
			where.status = status;
		}
		
		if (month && year) {
			const monthStart = new Date(year, month - 1, 1);
			const monthEnd = new Date(year, month, 0);
			monthEnd.setHours(23, 59, 59, 999);
			
			where.billingPeriodStart = {
				lte: monthEnd,
			};
			where.billingPeriodEnd = {
				gte: monthStart,
			};
		}
		
		// Gender filtering for admins: MALE admin sees MALE+CHILD, FEMALE admin sees FEMALE+CHILD
		// ROOT can see all invoices
		if (role === "admin") {
			if (userGender !== "MALE" && userGender !== "FEMALE") {
				throw new Error("Admin gender is required to view invoices");
			}
			// Merge with existing courseStudent filter if it exists
			const existingCourseStudentFilter = where.courseStudent || {};
			where.courseStudent = {
				...existingCourseStudentFilter,
				student: {
					gender: {
						in: [userGender, "CHILD"],
					},
				},
			};
		}
		
		const invoices = await prisma.invoice.findMany({
			where,
			include: {
				courseStudent: {
					include: {
						course: true,
						student: true,
					},
				},
			},
			orderBy: {
				billingPeriodStart: "desc",
			},
		});
		
		return invoices;
	} catch (error) {
		console.error("Error fetching invoices:", error);
		throw new Error("Failed to fetch invoices");
	}
}

