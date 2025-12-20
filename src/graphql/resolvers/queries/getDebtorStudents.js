/**
 * QMR Backend - Get Debtor Students Query Resolver
 *
 * Fetch students with outstanding debt (unpaid or partially paid invoices)
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Get students with outstanding debt
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {string} args.courseId - Filter by course ID
 * @param {number} args.minDebt - Minimum debt amount to include
 * @param {Object} context - GraphQL context
 * @returns {Promise<Array>} - Array of debtor student records
 */
export default async function (_, args, context) {
	try {
		const { courseId, minDebt } = args;
		const user = context?.user || null;
		const role = String(user?.role || "").toLowerCase();
		const userGender = String(user?.gender || "").toUpperCase();
		
		// Build where clause for invoices
		const invoiceWhere = {
			status: {
				in: ["PENDING", "PARTIALLY_PAID"],
			},
		};
		
		// Build courseStudent filter object
		const courseStudentFilter = {};
		
		// Gender filtering for admins: MALE admin sees MALE+CHILD, FEMALE admin sees FEMALE+CHILD
		// ROOT can see all invoices
		if (role === "admin") {
			if (userGender !== "MALE" && userGender !== "FEMALE") {
				throw new Error("Admin gender is required to view debtor students");
			}
			courseStudentFilter.student = {
				gender: {
					in: [userGender, "CHILD"],
				},
			};
		}
		
		if (courseId) {
			courseStudentFilter.courseId = parseInt(courseId);
		}
		
		// Only add courseStudent filter if we have any conditions
		if (Object.keys(courseStudentFilter).length > 0) {
			invoiceWhere.courseStudent = courseStudentFilter;
		}
		
		// Get all outstanding invoices
		const outstandingInvoices = await prisma.invoice.findMany({
			where: invoiceWhere,
			include: {
				courseStudent: {
					include: {
						student: true,
						course: true,
					},
				},
			},
			orderBy: {
				billingPeriodStart: "desc",
			},
		});
		
		// Group invoices by student
		const studentDebtMap = new Map();
		
		for (const invoice of outstandingInvoices) {
			const studentId = invoice.courseStudent.studentId;
			const remainingAmount = invoice.totalAmount - (invoice.paidAmount || 0);
			
			if (remainingAmount <= 0) continue; // Skip if fully paid
			
			if (!studentDebtMap.has(studentId)) {
				studentDebtMap.set(studentId, {
					student: invoice.courseStudent.student,
					invoices: [],
					totalDebt: 0,
				});
			}
			
			const studentDebt = studentDebtMap.get(studentId);
			studentDebt.invoices.push(invoice);
			studentDebt.totalDebt += remainingAmount;
		}
		
		// Convert to array and filter by minDebt if specified
		let debtors = Array.from(studentDebtMap.values()).map((debt) => ({
			student: debt.student,
			totalDebt: debt.totalDebt,
			invoiceCount: debt.invoices.length,
			invoices: debt.invoices,
		}));
		
		// Filter by minimum debt if specified
		if (minDebt !== undefined && minDebt !== null) {
			debtors = debtors.filter((debtor) => debtor.totalDebt >= minDebt);
		}
		
		// Sort by total debt (highest first)
		debtors.sort((a, b) => b.totalDebt - a.totalDebt);
		
		return debtors;
	} catch (error) {
		console.error("Error fetching debtor students:", error);
		throw new Error("Failed to fetch debtor students");
	}
}

