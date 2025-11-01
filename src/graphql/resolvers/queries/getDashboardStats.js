import { prisma } from "../../../database/index.js";

/**
 * Calculate age from birthDate
 * @param {Date} birthDate - Birth date
 * @returns {number} Age in years
 */
function calculateAge(birthDate) {
	const today = new Date();
	const birth = new Date(birthDate);
	let age = today.getFullYear() - birth.getFullYear();
	const monthDiff = today.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

/**
 * Calculate average age from array of birth dates
 * @param {Array} birthDates - Array of birth dates
 * @returns {number|null} Average age or null if no data
 */
function calculateAverageAge(birthDates) {
	if (birthDates.length === 0) return null;
	const ages = birthDates.map(calculateAge);
	const sum = ages.reduce((acc, age) => acc + age, 0);
	return Math.round((sum / ages.length) * 100) / 100; // Round to 2 decimal places
}

/**
 * Get dashboard statistics
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Object} - Dashboard statistics
 */
export default async function (_, args, context) {
	try {
		// Fetch all counts and basic data in parallel for better performance
		const [
			totalStudents,
			totalTeachers,
			totalAdmins,
			activeStudents,
			activeTeachers,
			activeAdmins,
			allStudents,
			allTeachers,
			allAdmins,
		] = await Promise.all([
			prisma.student.count(),
			prisma.teacher.count(),
			prisma.admin.count(),
			prisma.student.count({ where: { isActive: true } }),
			prisma.teacher.count({ where: { isActive: true } }),
			prisma.admin.count({ where: { isActive: true, isDeleted: false } }),
			prisma.student.findMany({ select: { birthDate: true, gender: true } }),
			prisma.teacher.findMany({ select: { birthDate: true, gender: true } }),
			prisma.admin.findMany({ select: { birthDate: true } }),
		]);

		const totalUsers = totalStudents + totalTeachers + totalAdmins;
		const activeUsers = activeStudents + activeTeachers + activeAdmins;

		// Calculate average ages
		const averageStudentAge = calculateAverageAge(
			allStudents.map((s) => s.birthDate)
		);
		const averageTeacherAge = calculateAverageAge(
			allTeachers.map((t) => t.birthDate)
		);
		const averageAdminAge = calculateAverageAge(
			allAdmins.map((a) => a.birthDate)
		);

		// Calculate gender distribution for students
		const studentGenderCounts = allStudents.reduce((acc, student) => {
			acc[student.gender] = (acc[student.gender] || 0) + 1;
			return acc;
		}, {});
		const studentGenderDistribution = {
			male: studentGenderCounts.MALE || 0,
			female: studentGenderCounts.FEMALE || 0,
			child: studentGenderCounts.CHILD || 0,
		};

		// Calculate gender distribution for teachers
		const teacherGenderCounts = allTeachers.reduce((acc, teacher) => {
			acc[teacher.gender] = (acc[teacher.gender] || 0) + 1;
			return acc;
		}, {});
		const teacherGenderDistribution = {
			male: teacherGenderCounts.MALE || 0,
			female: teacherGenderCounts.FEMALE || 0,
			child: teacherGenderCounts.CHILD || 0,
		};

		return {
			totalStudents,
			totalTeachers,
			totalAdmins,
			activeStudents,
			activeTeachers,
			activeAdmins,
			totalUsers,
			activeUsers,
			averageStudentAge,
			averageTeacherAge,
			averageAdminAge,
			studentGenderDistribution,
			teacherGenderDistribution,
		};
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		throw new Error("Failed to fetch dashboard statistics");
	}
}
