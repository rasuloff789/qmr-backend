/**
 * QMR Backend - Student Type Resolvers
 *
 * Field-level resolvers for Student type to handle lazy loading
 * and ensure non-nullable fields always return valid values.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import { prisma } from "../../../database/index.js";

/**
 * Student type resolvers
 * Handles field-level resolution for Student type
 */
export const Student = {
	/**
	 * Resolve courses field for Student
	 * Returns all course enrollments for the student
	 * Always returns an array (empty if no courses) to satisfy non-nullable requirement
	 * @param {Object} parent - The Student object
	 * @returns {Promise<Array>} - Array of CourseStudent enrollments
	 */
	courses: async (parent) => {
		if (!parent.id) return [];
		
		try {
			const enrollments = await prisma.courseStudent.findMany({
				where: {
					studentId: parent.id,
					isDeleted: false,
				},
				include: {
					course: {
						select: {
							id: true,
							name: true,
							description: true,
							daysOfWeek: true,
							gender: true,
							startAt: true,
							endAt: true,
							startTime: true,
							endTime: true,
							teacherId: true,
							createdAt: true,
						},
					},
				},
				orderBy: {
					joinedAt: "desc",
				},
			});
			return enrollments;
		} catch (error) {
			console.error("Error loading student courses:", error);
			return [];
		}
	},
	
	/**
	 * Resolve invoices field for Student
	 * Returns all invoices for the student across all their enrollments
	 * Always returns an array (empty if no invoices) to satisfy non-nullable requirement
	 * @param {Object} parent - The Student object
	 * @param {Object} args - Query arguments (unused)
	 * @param {Object} context - GraphQL context
	 * @param {Object} info - GraphQL info (unused)
	 * @returns {Promise<Array>} - Array of Invoice records
	 */
	invoices: async (parent, args, context, info) => {
		if (!parent.id) return [];
		
		try {
			const user = context?.user || null;
			const role = String(user?.role || "").toLowerCase();
			const userGender = String(user?.gender || "").toUpperCase();
			
			// Gender filtering for admins: MALE admin sees MALE+CHILD, FEMALE admin sees FEMALE+CHILD
			// ROOT can see all invoices
			// Check if admin can see this student's invoices
			if (role === "admin") {
				if (userGender !== "MALE" && userGender !== "FEMALE") {
					return []; // Admin without valid gender can't see invoices
				}
				const studentGender = parent.gender;
				if (studentGender !== userGender && studentGender !== "CHILD") {
					return []; // Admin can't see invoices for different gender students
				}
			}
			
			// Get all enrollments for this student
			const enrollments = await prisma.courseStudent.findMany({
				where: {
					studentId: parent.id,
					isDeleted: false,
				},
				select: {
					id: true,
				},
			});
			
			const enrollmentIds = enrollments.map((e) => e.id);
			
			if (enrollmentIds.length === 0) return [];
			
			// Get all invoices for these enrollments
			const invoices = await prisma.invoice.findMany({
				where: {
					courseStudentId: {
						in: enrollmentIds,
					},
				},
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
			console.error("Error loading student invoices:", error);
			return [];
		}
	},
};

