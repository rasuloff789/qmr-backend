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
	return Math.round((sum / ages.length) * 100) / 100;
}

/**
 * Get date range helpers
 */
const getToday = () => {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	return today;
};

const getWeekStart = () => {
	const today = new Date();
	const day = today.getDay();
	const diff = today.getDate() - day + (day === 0 ? -6 : 1); // Monday
	const weekStart = new Date(today.setDate(diff));
	weekStart.setHours(0, 0, 0, 0);
	return weekStart;
};

const getMonthStart = () => {
	const today = new Date();
	const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
	monthStart.setHours(0, 0, 0, 0);
	return monthStart;
};

const getYearStart = () => {
	const today = new Date();
	const yearStart = new Date(today.getFullYear(), 0, 1);
	yearStart.setHours(0, 0, 0, 0);
	return yearStart;
};

/**
 * Calculate attendance summary for a date range
 */
const calculateAttendanceSummary = async (
	startDate,
	endDate,
	userGender = null
) => {
	const where = {
		date: {
			gte: startDate,
			lte: endDate,
		},
	};

	// Gender filtering for admins
	if (userGender && (userGender === "MALE" || userGender === "FEMALE")) {
		where.student = {
			gender: {
				in: [userGender, "CHILD"],
			},
		};
	}

	const [present, absent, total] = await Promise.all([
		prisma.attendance.count({
			where: { ...where, isPresent: true },
		}),
		prisma.attendance.count({
			where: { ...where, isPresent: false },
		}),
		prisma.attendance.count({ where }),
	]);

	const rate = total > 0 ? Math.round((present / total) * 10000) / 100 : 0;

	return { present, absent, total, rate };
};

/**
 * Get course statistics
 */
const getCourseStats = async (userGender = null) => {
	const now = new Date();
	const thirtyDaysFromNow = new Date(now);
	thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

	const courseWhere = {};
	if (userGender && (userGender === "MALE" || userGender === "FEMALE")) {
		courseWhere.gender = { in: [userGender, "CHILD"] };
	}

	const [
		totalCourses,
		activeCourses,
		upcomingCourses,
		completedCourses,
		enrollments,
		courses,
	] = await Promise.all([
		prisma.course.count({ where: courseWhere }),
		prisma.course.count({
			where: {
				...courseWhere,
				startAt: { lte: now },
				OR: [{ endAt: null }, { endAt: { gte: now } }],
			},
		}),
		prisma.course.count({
			where: {
				...courseWhere,
				startAt: { gte: now, lte: thirtyDaysFromNow },
			},
		}),
		prisma.course.count({
			where: {
				...courseWhere,
				endAt: { lt: now },
			},
		}),
		prisma.courseStudent.count({
			where: {
				isDeleted: false,
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
		prisma.course.findMany({
			where: courseWhere,
			include: {
				students: {
					where: { isDeleted: false },
					select: { id: true },
				},
			},
		}),
	]);

	const averageStudentsPerCourse =
		totalCourses > 0 ? Math.round((enrollments / totalCourses) * 100) / 100 : 0;

	// Get most popular courses (top 10 by enrollment)
	const coursesWithEnrollment = courses
		.map((course) => ({
			courseId: String(course.id),
			courseName: course.name,
			enrollmentCount: course.students.length,
		}))
		.sort((a, b) => b.enrollmentCount - a.enrollmentCount)
		.slice(0, 10);

	// Calculate average points and attendance rate for each course
	const mostPopularCourses = await Promise.all(
		coursesWithEnrollment.map(async (course) => {
			const courseId = parseInt(course.courseId);
			const [attendances, pointsData] = await Promise.all([
				prisma.attendance.findMany({
					where: { courseId },
					select: { isPresent: true, point: true },
				}),
				prisma.attendance.aggregate({
					where: {
						courseId,
						point: { not: null },
					},
					_avg: { point: true },
				}),
			]);

			const present = attendances.filter((a) => a.isPresent).length;
			const total = attendances.length;
			const attendanceRate =
				total > 0 ? Math.round((present / total) * 10000) / 100 : 0;
			const averagePoints = pointsData._avg.point
				? Math.round(pointsData._avg.point * 100) / 100
				: 0;

			return {
				...course,
				averagePoints,
				attendanceRate,
			};
		})
	);

	return {
		totalCourses,
		activeCourses,
		upcomingCourses,
		completedCourses,
		totalEnrollments: enrollments,
		averageStudentsPerCourse,
		mostPopularCourses,
	};
};

/**
 * Get attendance statistics
 */
const getAttendanceStats = async (userGender = null) => {
	const today = getToday();
	const weekStart = getWeekStart();
	const monthStart = getMonthStart();
	const now = new Date();
	now.setHours(23, 59, 59, 999);

	const [totalRecords, todayStats, weekStats, monthStats, allAttendances] =
		await Promise.all([
			prisma.attendance.count({
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							where: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			}),
			calculateAttendanceSummary(today, now, userGender),
			calculateAttendanceSummary(weekStart, now, userGender),
			calculateAttendanceSummary(monthStart, now, userGender),
			prisma.attendance.findMany({
				where: {
					...(userGender && (userGender === "MALE" || userGender === "FEMALE")
						? {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
						  }
						: {}),
				},
				select: {
					date: true,
					isPresent: true,
				},
			}),
		]);

	// Calculate overall attendance rate
	const overallPresent = allAttendances.filter((a) => a.isPresent).length;
	const overallTotal = allAttendances.length;
	const overallAttendanceRate =
		overallTotal > 0
			? Math.round((overallPresent / overallTotal) * 10000) / 100
			: 0;

	// Calculate average daily attendance
	const dailyAttendanceMap = new Map();
	allAttendances.forEach((att) => {
		const dateKey = att.date.toISOString().split("T")[0];
		if (!dailyAttendanceMap.has(dateKey)) {
			dailyAttendanceMap.set(dateKey, { present: 0, total: 0 });
		}
		const dayStats = dailyAttendanceMap.get(dateKey);
		dayStats.total++;
		if (att.isPresent) dayStats.present++;
	});

	const dailyAttendances = Array.from(dailyAttendanceMap.values());
	const averageDailyAttendance =
		dailyAttendances.length > 0
			? Math.round(
					(dailyAttendances.reduce((sum, day) => sum + day.present, 0) /
						dailyAttendances.length) *
						100
			  ) / 100
			: 0;

	// Attendance by day of week
	const dayOfWeekMap = {
		SUNDAY: { present: 0, absent: 0 },
		MONDAY: { present: 0, absent: 0 },
		TUESDAY: { present: 0, absent: 0 },
		WEDNESDAY: { present: 0, absent: 0 },
		THURSDAY: { present: 0, absent: 0 },
		FRIDAY: { present: 0, absent: 0 },
		SATURDAY: { present: 0, absent: 0 },
	};

	const dayNames = [
		"SUNDAY",
		"MONDAY",
		"TUESDAY",
		"WEDNESDAY",
		"THURSDAY",
		"FRIDAY",
		"SATURDAY",
	];

	allAttendances.forEach((att) => {
		const dayName = dayNames[att.date.getDay()];
		if (dayOfWeekMap[dayName]) {
			if (att.isPresent) {
				dayOfWeekMap[dayName].present++;
			} else {
				dayOfWeekMap[dayName].absent++;
			}
		}
	});

	const attendanceByDayOfWeek = Object.entries(dayOfWeekMap).map(
		([day, stats]) => {
			const total = stats.present + stats.absent;
			const rate =
				total > 0 ? Math.round((stats.present / total) * 10000) / 100 : 0;
			return { day, present: stats.present, absent: stats.absent, rate };
		}
	);

	// Attendance by month (last 12 months)
	const monthMap = new Map();
	const twelveMonthsAgo = new Date();
	twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

	allAttendances
		.filter((att) => att.date >= twelveMonthsAgo)
		.forEach((att) => {
			const monthKey = `${att.date.getFullYear()}-${String(
				att.date.getMonth() + 1
			).padStart(2, "0")}`;
			if (!monthMap.has(monthKey)) {
				monthMap.set(monthKey, { present: 0, absent: 0 });
			}
			const monthStats = monthMap.get(monthKey);
			if (att.isPresent) {
				monthStats.present++;
			} else {
				monthStats.absent++;
			}
		});

	const attendanceByMonth = Array.from(monthMap.entries())
		.map(([month, stats]) => {
			const total = stats.present + stats.absent;
			const rate =
				total > 0 ? Math.round((stats.present / total) * 10000) / 100 : 0;
			return { month, present: stats.present, absent: stats.absent, rate };
		})
		.sort((a, b) => a.month.localeCompare(b.month));

	return {
		totalAttendanceRecords: totalRecords,
		todayAttendance: todayStats,
		thisWeekAttendance: weekStats,
		thisMonthAttendance: monthStats,
		overallAttendanceRate,
		averageDailyAttendance,
		attendanceByDayOfWeek,
		attendanceByMonth,
	};
};

/**
 * Get performance/points statistics
 */
const getPerformanceStats = async (userGender = null) => {
	const studentWhere = {};
	if (userGender && (userGender === "MALE" || userGender === "FEMALE")) {
		studentWhere.gender = { in: [userGender, "CHILD"] };
	}

	const [pointsData, allAttendancesWithPoints, students] = await Promise.all([
		prisma.attendance.aggregate({
			where: {
				point: { not: null },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
			_sum: { point: true },
			_avg: { point: true },
			_count: { point: true },
		}),
		prisma.attendance.findMany({
			where: {
				point: { not: null },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
			select: {
				studentId: true,
				point: true,
			},
		}),
		prisma.student.findMany({
			where: {
				isDeleted: false,
				...studentWhere,
			},
			select: { id: true, fullname: true },
		}),
	]);

	const totalPointsAwarded = pointsData._sum.point || 0;
	const averagePointsPerAttendance = pointsData._avg.point
		? Math.round(pointsData._avg.point * 100) / 100
		: 0;

	// Calculate average points per student
	const studentPointsMap = new Map();
	allAttendancesWithPoints.forEach((att) => {
		const studentId = att.studentId;
		if (!studentPointsMap.has(studentId)) {
			studentPointsMap.set(studentId, { total: 0, count: 0 });
		}
		const stats = studentPointsMap.get(studentId);
		stats.total += att.point;
		stats.count++;
	});

	const studentAverages = Array.from(studentPointsMap.entries()).map(
		([studentId, stats]) => ({
			studentId: String(studentId),
			averagePoints: Math.round((stats.total / stats.count) * 100) / 100,
			totalPoints: stats.total,
			attendanceCount: stats.count,
		})
	);

	const averagePointsPerStudent =
		studentAverages.length > 0
			? Math.round(
					(studentAverages.reduce((sum, s) => sum + s.averagePoints, 0) /
						studentAverages.length) *
						100
			  ) / 100
			: 0;

	// Points distribution
	const distribution = {
		excellent: 0, // 9-10
		good: 0, // 7-8
		average: 0, // 5-6
		belowAverage: 0, // 1-4
	};

	studentAverages.forEach((student) => {
		const avg = student.averagePoints;
		if (avg >= 9) distribution.excellent++;
		else if (avg >= 7) distribution.good++;
		else if (avg >= 5) distribution.average++;
		else distribution.belowAverage++;
	});

	// Top performers (top 10)
	const topPerformers = studentAverages
		.sort((a, b) => b.averagePoints - a.averagePoints)
		.slice(0, 10)
		.map((perf) => {
			const student = students.find((s) => String(s.id) === perf.studentId);
			return {
				studentId: perf.studentId,
				studentName: student?.fullname || "Unknown",
				averagePoints: perf.averagePoints,
				totalPoints: perf.totalPoints,
				attendanceCount: perf.attendanceCount,
			};
		});

	// Performance by course
	const coursePerformanceMap = new Map();
	const courseAttendances = await prisma.attendance.findMany({
		where: {
			point: { not: null },
			...(userGender && (userGender === "MALE" || userGender === "FEMALE")
				? {
						student: {
							gender: { in: [userGender, "CHILD"] },
						},
				  }
				: {}),
		},
		select: {
			courseId: true,
			point: true,
		},
	});

	courseAttendances.forEach((att) => {
		const courseId = att.courseId;
		if (!coursePerformanceMap.has(courseId)) {
			coursePerformanceMap.set(courseId, { total: 0, count: 0 });
		}
		const stats = coursePerformanceMap.get(courseId);
		stats.total += att.point;
		stats.count++;
	});

	const courses = await prisma.course.findMany({
		where: {
			...(userGender && (userGender === "MALE" || userGender === "FEMALE")
				? { gender: { in: [userGender, "CHILD"] } }
				: {}),
		},
		select: { id: true, name: true },
	});

	const courseEnrollments = await prisma.courseStudent.groupBy({
		by: ["courseId"],
		where: {
			isDeleted: false,
			...(userGender && (userGender === "MALE" || userGender === "FEMALE")
				? {
						student: {
							gender: { in: [userGender, "CHILD"] },
						},
				  }
				: {}),
		},
		_count: { studentId: true },
	});

	const performanceByCourse = Array.from(coursePerformanceMap.entries())
		.map(([courseId, stats]) => {
			const course = courses.find((c) => c.id === courseId);
			const enrollment = courseEnrollments.find((e) => e.courseId === courseId);
			return {
				courseId: String(courseId),
				courseName: course?.name || "Unknown",
				averagePoints: Math.round((stats.total / stats.count) * 100) / 100,
				totalPoints: stats.total,
				studentCount: enrollment?._count.studentId || 0,
			};
		})
		.sort((a, b) => b.averagePoints - a.averagePoints);

	return {
		totalPointsAwarded,
		averagePointsPerStudent,
		averagePointsPerAttendance,
		pointsDistribution: distribution,
		topPerformers,
		performanceByCourse,
	};
};

/**
 * Get financial statistics
 */
const getFinancialStats = async (userGender = null) => {
	const monthStart = getMonthStart();
	const yearStart = getYearStart();
	const now = new Date();
	now.setHours(23, 59, 59, 999);

	const enrollmentWhere = {
		isDeleted: false,
		...(userGender && (userGender === "MALE" || userGender === "FEMALE")
			? {
					student: {
						gender: { in: [userGender, "CHILD"] },
					},
			  }
			: {}),
	};

	const [
		allInvoices,
		paidInvoices,
		pendingInvoices,
		overdueInvoices,
		monthlyInvoices,
	] = await Promise.all([
		prisma.invoice.findMany({
			where: {
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
			select: {
				totalAmount: true,
				paidAmount: true,
				status: true,
				billingPeriodEnd: true,
				billingPeriodStart: true,
			},
		}),
		prisma.invoice.count({
			where: {
				status: "PAID",
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
		}),
		prisma.invoice.count({
			where: {
				status: { in: ["PENDING", "PARTIALLY_PAID"] },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
		}),
		prisma.invoice.count({
			where: {
				status: { in: ["PENDING", "PARTIALLY_PAID"] },
				billingPeriodEnd: { lt: now },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
		}),
		prisma.invoice.findMany({
			where: {
				billingPeriodStart: { gte: monthStart, lte: now },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
			select: {
				totalAmount: true,
				paidAmount: true,
			},
		}),
	]);

	const totalRevenue = allInvoices
		.filter((inv) => inv.status === "PAID")
		.reduce((sum, inv) => sum + inv.paidAmount, 0);

	const monthlyRevenue = monthlyInvoices
		.filter((inv) => inv.status === "PAID")
		.reduce((sum, inv) => sum + inv.paidAmount, 0);

	const revenueThisYear = allInvoices
		.filter(
			(inv) =>
				inv.status === "PAID" &&
				inv.billingPeriodStart >= yearStart &&
				inv.billingPeriodStart <= now
		)
		.reduce((sum, inv) => sum + inv.paidAmount, 0);

	// Calculate average monthly revenue (last 12 months)
	const twelveMonthsAgo = new Date();
	twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
	const last12MonthsInvoices = allInvoices.filter(
		(inv) =>
			inv.status === "PAID" &&
			inv.billingPeriodStart >= twelveMonthsAgo &&
			inv.billingPeriodStart <= now
	);

	const monthlyRevenueMap = new Map();
	last12MonthsInvoices.forEach((inv) => {
		const monthKey = `${inv.billingPeriodStart.getFullYear()}-${String(
			inv.billingPeriodStart.getMonth() + 1
		).padStart(2, "0")}`;
		if (!monthlyRevenueMap.has(monthKey)) {
			monthlyRevenueMap.set(monthKey, { revenue: 0, count: 0 });
		}
		const monthStats = monthlyRevenueMap.get(monthKey);
		monthStats.revenue += inv.paidAmount;
		monthStats.count++;
	});

	const averageMonthlyRevenue =
		monthlyRevenueMap.size > 0
			? Math.round(
					(Array.from(monthlyRevenueMap.values()).reduce(
						(sum, m) => sum + m.revenue,
						0
					) /
						monthlyRevenueMap.size) *
						100
			  ) / 100
			: 0;

	const totalInvoices = allInvoices.length;
	const collectionRate =
		totalInvoices > 0
			? Math.round((paidInvoices / totalInvoices) * 10000) / 100
			: 0;

	const totalDebt = allInvoices
		.filter((inv) => inv.status !== "PAID")
		.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);

	// Count distinct debtors using groupBy
	const debtorGroups = await prisma.invoice.groupBy({
		by: ["courseStudentId"],
		where: {
			status: { in: ["PENDING", "PARTIALLY_PAID"] },
			...(userGender && (userGender === "MALE" || userGender === "FEMALE")
				? {
						courseStudent: {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
						},
				  }
				: {}),
		},
	});

	const numberOfDebtors = debtorGroups.length;

	const averageDebtPerStudent =
		numberOfDebtors > 0
			? Math.round((totalDebt / numberOfDebtors) * 100) / 100
			: 0;

	// Revenue by month (last 12 months)
	const revenueByMonth = Array.from(monthlyRevenueMap.entries())
		.map(([month, stats]) => ({
			month,
			revenue: Math.round(stats.revenue * 100) / 100,
			invoiceCount: stats.count,
		}))
		.sort((a, b) => a.month.localeCompare(b.month));

	return {
		totalRevenue: Math.round(totalRevenue * 100) / 100,
		monthlyRevenue: Math.round(monthlyRevenue * 100) / 100,
		revenueThisYear: Math.round(revenueThisYear * 100) / 100,
		averageMonthlyRevenue,
		totalInvoices,
		paidInvoices,
		pendingInvoices,
		overdueInvoices,
		collectionRate,
		totalDebt: Math.round(totalDebt * 100) / 100,
		numberOfDebtors,
		averageDebtPerStudent,
		revenueByMonth,
	};
};

/**
 * Get activity statistics
 */
const getActivityStats = async (userGender = null) => {
	const monthStart = getMonthStart();
	const today = getToday();
	const now = new Date();
	now.setHours(23, 59, 59, 999);

	const studentWhere = {
		createdAt: { gte: monthStart, lte: now },
		...(userGender && (userGender === "MALE" || userGender === "FEMALE")
			? { gender: { in: [userGender, "CHILD"] } }
			: {}),
	};

	const enrollmentWhere = {
		createdAt: { gte: monthStart, lte: now },
		isDeleted: false,
		...(userGender && (userGender === "MALE" || userGender === "FEMALE")
			? {
					student: {
						gender: { in: [userGender, "CHILD"] },
					},
			  }
			: {}),
	};

	const courseWhere = {
		createdAt: { gte: monthStart, lte: now },
		...(userGender && (userGender === "MALE" || userGender === "FEMALE")
			? { gender: { in: [userGender, "CHILD"] } }
			: {}),
	};

	const [
		newStudents,
		newEnrollments,
		newCourses,
		todayAttendances,
		todayPoints,
	] = await Promise.all([
		prisma.student.count({ where: studentWhere }),
		prisma.courseStudent.count({ where: enrollmentWhere }),
		prisma.course.count({ where: courseWhere }),
		prisma.attendance.count({
			where: {
				date: { gte: today, lte: now },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
		prisma.attendance.aggregate({
			where: {
				date: { gte: today, lte: now },
				point: { not: null },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
			_sum: { point: true },
		}),
	]);

	return {
		newStudentsThisMonth: newStudents,
		newEnrollmentsThisMonth: newEnrollments,
		newCoursesThisMonth: newCourses,
		attendanceRecordsToday: todayAttendances,
		pointsAwardedToday: todayPoints._sum.point || 0,
	};
};

/**
 * Calculate trend data
 */
const calculateTrend = (current, previous) => {
	if (previous === 0) {
		return {
			direction: current > 0 ? "up" : "stable",
			percentageChange: current > 0 ? 100 : 0,
			currentValue: current,
			previousValue: previous,
		};
	}

	const change = ((current - previous) / previous) * 100;
	const direction = change > 5 ? "up" : change < -5 ? "down" : "stable";

	return {
		direction,
		percentageChange: Math.round(change * 100) / 100,
		currentValue: current,
		previousValue: previous,
	};
};

/**
 * Get trend statistics
 */
const getTrendStats = async (userGender = null) => {
	const now = new Date();
	const currentMonthStart = getMonthStart();
	const lastMonthStart = new Date(currentMonthStart);
	lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
	const lastMonthEnd = new Date(currentMonthStart);
	lastMonthEnd.setDate(lastMonthEnd.getDate() - 1);
	lastMonthEnd.setHours(23, 59, 59, 999);

	// Attendance trend
	const [currentMonthAttendance, lastMonthAttendance] = await Promise.all([
		prisma.attendance.count({
			where: {
				date: { gte: currentMonthStart, lte: now },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
		prisma.attendance.count({
			where: {
				date: { gte: lastMonthStart, lte: lastMonthEnd },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
	]);

	// Revenue trend
	const [currentMonthRevenue, lastMonthRevenue] = await Promise.all([
		prisma.invoice.aggregate({
			where: {
				status: "PAID",
				billingPeriodStart: { gte: currentMonthStart, lte: now },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
			_sum: { paidAmount: true },
		}),
		prisma.invoice.aggregate({
			where: {
				status: "PAID",
				billingPeriodStart: { gte: lastMonthStart, lte: lastMonthEnd },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							courseStudent: {
								student: {
									gender: { in: [userGender, "CHILD"] },
								},
							},
					  }
					: {}),
			},
			_sum: { paidAmount: true },
		}),
	]);

	// Enrollment trend
	const [currentMonthEnrollments, lastMonthEnrollments] = await Promise.all([
		prisma.courseStudent.count({
			where: {
				createdAt: { gte: currentMonthStart, lte: now },
				isDeleted: false,
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
		prisma.courseStudent.count({
			where: {
				createdAt: { gte: lastMonthStart, lte: lastMonthEnd },
				isDeleted: false,
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
		}),
	]);

	// Performance trend (average points)
	const [currentMonthPoints, lastMonthPoints] = await Promise.all([
		prisma.attendance.aggregate({
			where: {
				date: { gte: currentMonthStart, lte: now },
				point: { not: null },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
			_avg: { point: true },
		}),
		prisma.attendance.aggregate({
			where: {
				date: { gte: lastMonthStart, lte: lastMonthEnd },
				point: { not: null },
				...(userGender && (userGender === "MALE" || userGender === "FEMALE")
					? {
							student: {
								gender: { in: [userGender, "CHILD"] },
							},
					  }
					: {}),
			},
			_avg: { point: true },
		}),
	]);

	return {
		attendanceTrend: calculateTrend(
			currentMonthAttendance,
			lastMonthAttendance
		),
		revenueTrend: calculateTrend(
			currentMonthRevenue._sum.paidAmount || 0,
			lastMonthRevenue._sum.paidAmount || 0
		),
		enrollmentTrend: calculateTrend(
			currentMonthEnrollments,
			lastMonthEnrollments
		),
		performanceTrend: calculateTrend(
			currentMonthPoints._avg.point || 0,
			lastMonthPoints._avg.point || 0
		),
	};
};

/**
 * Get dashboard statistics
 * @param {Object} _ - Parent object (unused)
 * @param {Object} args - Query arguments
 * @param {Object} context - GraphQL context
 * @returns {Object} - Dashboard statistics
 */
export default async function (_, args, context) {
	try {
		const user = context?.user || null;
		const userGender = user?.gender ? String(user.gender).toUpperCase() : null;
		const role = user?.role ? String(user.role).toLowerCase() : null;

		// Only apply gender filtering for admins (root sees all)
		const genderFilter = role === "admin" ? userGender : null;

		// Fetch all statistics in parallel for better performance
		const [
			userStats,
			courseStats,
			attendanceStats,
			performanceStats,
			financialStats,
			activityStats,
			trendStats,
		] = await Promise.all([
			// User statistics
			(async () => {
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
					prisma.student.count({
						where: {
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: { in: [genderFilter, "CHILD"] } }
								: {}),
						},
					}),
					prisma.teacher.count({
						where: {
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: genderFilter }
								: {}),
						},
					}),
					prisma.admin.count({ where: { isDeleted: false } }),
					prisma.student.count({
						where: {
							isActive: true,
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: { in: [genderFilter, "CHILD"] } }
								: {}),
						},
					}),
					prisma.teacher.count({
						where: {
							isActive: true,
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: genderFilter }
								: {}),
						},
					}),
					prisma.admin.count({ where: { isActive: true, isDeleted: false } }),
					prisma.student.findMany({
						where: {
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: { in: [genderFilter, "CHILD"] } }
								: {}),
						},
						select: { birthDate: true, gender: true },
					}),
					prisma.teacher.findMany({
						where: {
							isDeleted: false,
							...(genderFilter &&
							(genderFilter === "MALE" || genderFilter === "FEMALE")
								? { gender: genderFilter }
								: {}),
						},
						select: { birthDate: true, gender: true },
					}),
					prisma.admin.findMany({
						where: { isDeleted: false },
						select: { birthDate: true },
					}),
				]);

				const totalUsers = totalStudents + totalTeachers + totalAdmins;
				const activeUsers = activeStudents + activeTeachers + activeAdmins;

				const averageStudentAge = calculateAverageAge(
					allStudents.map((s) => s.birthDate)
				);
				const averageTeacherAge = calculateAverageAge(
					allTeachers.map((t) => t.birthDate)
				);
				const averageAdminAge = calculateAverageAge(
					allAdmins.map((a) => a.birthDate)
				);

				const studentGenderCounts = allStudents.reduce((acc, student) => {
					acc[student.gender] = (acc[student.gender] || 0) + 1;
					return acc;
				}, {});
				const studentGenderDistribution = {
					male: studentGenderCounts.MALE || 0,
					female: studentGenderCounts.FEMALE || 0,
					child: studentGenderCounts.CHILD || 0,
				};

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
			})(),
			getCourseStats(genderFilter),
			getAttendanceStats(genderFilter),
			getPerformanceStats(genderFilter),
			getFinancialStats(genderFilter),
			getActivityStats(genderFilter),
			getTrendStats(genderFilter),
		]);

		return {
			...userStats,
			...courseStats,
			...attendanceStats,
			...performanceStats,
			...financialStats,
			...activityStats,
			...trendStats,
		};
	} catch (error) {
		console.error("Error fetching dashboard stats:", error);
		throw new Error("Failed to fetch dashboard statistics");
	}
}
