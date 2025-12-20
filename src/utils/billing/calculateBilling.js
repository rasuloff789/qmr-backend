/**
 * QMR Backend - Billing Calculation Utilities
 *
 * Core billing logic for course enrollments including:
 * - Standard enrollment (full month)
 * - Late enrollment (prorated first month)
 * - Price changes during active months (split billing)
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

/**
 * Get number of days in a month
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {number} - Number of days in the month
 */
export function getDaysInMonth(year, month) {
	return new Date(year, month, 0).getDate();
}

/**
 * Calculate days attended in a given period
 * @param {Date} startDate - Start date (enrollment or course start)
 * @param {Date} endDate - End date (course end or period end)
 * @param {Date} periodStart - Period start date
 * @param {Date} periodEnd - Period end date
 * @returns {number} - Number of days attended in the period
 */
export function getDaysAttended(startDate, endDate, periodStart, periodEnd) {
	// Normalize dates to start of day for consistent calculation
	const normalizeToStartOfDay = (date) => {
		const d = new Date(date);
		d.setHours(0, 0, 0, 0);
		return d;
	};
	
	const actualStart = startDate > periodStart ? startDate : periodStart;
	const actualEnd = endDate && endDate < periodEnd ? endDate : periodEnd;
	
	// Normalize start to beginning of day
	const start = normalizeToStartOfDay(actualStart);
	
	// For end date: if it's at end of day (23:59:59.999), we want to include that full day
	// So we add 1 day to make it the next day at 00:00:00
	// Otherwise, normalize to start of day and add 1 day to include that day
	let end = new Date(actualEnd);
	const isEndOfDay = end.getHours() === 23 && end.getMinutes() === 59 && end.getSeconds() === 59;
	
	if (isEndOfDay) {
		// End is at 23:59:59.999, add 1 day to include the full last day
		end.setDate(end.getDate() + 1);
		end.setHours(0, 0, 0, 0);
	} else {
		// End is not at end of day, normalize and add 1 day to include the end day
		end = normalizeToStartOfDay(end);
		end.setDate(end.getDate() + 1);
	}
	
	// Calculate difference in days (inclusive count)
	const diffTime = end.getTime() - start.getTime();
	const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
	
	return Math.max(0, diffDays);
}

/**
 * Calculate prorated amount for partial month
 * @param {number} monthlyPrice - Monthly price
 * @param {number} daysInMonth - Total days in the month
 * @param {number} daysAttended - Days attended in the month
 * @returns {number} - Prorated amount (rounded to nearest integer)
 */
export function calculateProratedAmount(monthlyPrice, daysInMonth, daysAttended) {
	if (daysInMonth === 0 || daysAttended === 0) return 0;
	const dailyRate = monthlyPrice / daysInMonth;
	return Math.round(dailyRate * daysAttended);
}

/**
 * Calculate billing split when price changes during a month
 * @param {number} oldPrice - Old monthly price
 * @param {number} newPrice - New monthly price
 * @param {Date} changeDate - Date when price changed
 * @param {Date} monthStart - Start of billing month
 * @param {Date} monthEnd - End of billing month
 * @returns {Array} - Array of billing periods with { start, end, price, days, amount }
 */
export function calculatePriceChangeSplit(oldPrice, newPrice, changeDate, monthStart, monthEnd) {
	const daysInMonth = getDaysInMonth(monthStart.getFullYear(), monthStart.getMonth() + 1);
	const periods = [];
	
	// Period before price change
	if (changeDate > monthStart) {
		const periodStart = monthStart;
		const periodEnd = new Date(changeDate);
		periodEnd.setDate(periodEnd.getDate() - 1); // Day before change
		const days = getDaysAttended(periodStart, periodEnd, monthStart, monthEnd);
		
		if (days > 0) {
			periods.push({
				start: periodStart,
				end: periodEnd,
				price: oldPrice,
				days: days,
				amount: calculateProratedAmount(oldPrice, daysInMonth, days),
			});
		}
	}
	
	// Period after price change
	if (changeDate <= monthEnd) {
		const periodStart = changeDate;
		const periodEnd = monthEnd;
		const days = getDaysAttended(periodStart, periodEnd, monthStart, monthEnd);
		
		if (days > 0) {
			periods.push({
				start: periodStart,
				end: periodEnd,
				price: newPrice,
				days: days,
				amount: calculateProratedAmount(newPrice, daysInMonth, days),
			});
		}
	}
	
	return periods;
}

/**
 * Calculate monthly billing for a course enrollment
 * @param {Object} courseStudent - CourseStudent record with course and price history
 * @param {number} targetMonth - Target month (1-12)
 * @param {number} targetYear - Target year
 * @param {Array} priceChanges - Array of PriceChangeHistory records for the enrollment
 * @returns {Object} - Billing calculation result with periods, total, and metadata
 */
export function calculateMonthlyBilling(courseStudent, targetMonth, targetYear, priceChanges = []) {
	const course = courseStudent.course;
	const joinedAt = new Date(courseStudent.joinedAt);
	const courseStart = new Date(course.startAt);
	
	// Determine billing period start
	// If student joined before course start, use course start
	// If student joined after course start, use join date
	const billingStart = joinedAt > courseStart ? joinedAt : courseStart;
	
	// Create month boundaries
	const monthStart = new Date(targetYear, targetMonth - 1, 1);
	monthStart.setHours(0, 0, 0, 0);
	
	const monthEnd = new Date(targetYear, targetMonth, 0); // Last day of month
	monthEnd.setHours(23, 59, 59, 999); // End of the last day
	
	// Normalize billing start to start of day for comparison
	const normalizedBillingStart = new Date(billingStart);
	normalizedBillingStart.setHours(0, 0, 0, 0);
	
	// Adjust billing start to not be before month start
	const actualBillingStart = normalizedBillingStart > monthStart ? normalizedBillingStart : monthStart;
	
	// Normalize actualBillingStart for price change comparisons
	const normalizedActualBillingStart = new Date(actualBillingStart);
	normalizedActualBillingStart.setHours(0, 0, 0, 0);
	
	// Check if enrollment is active during this period
	if (actualBillingStart > monthEnd) {
		return {
			periods: [],
			totalAmount: 0,
			daysInPeriod: 0,
			dailyRate: 0,
			billingPeriodStart: monthStart,
			billingPeriodEnd: monthEnd,
		};
	}
	
	const daysInMonth = getDaysInMonth(targetYear, targetMonth);
	
	// Determine the price that was active at the start of the billing period
	// We need to look at ALL price changes (not just during this month) to find
	// what price was in effect at actualBillingStart
	let priceAtPeriodStart = courseStudent.monthlyPayment; // Default to current price
	
	// Find the most recent price change that occurred before or at the billing start
	const allPriceChanges = priceChanges.sort(
		(a, b) => new Date(a.changedAt) - new Date(b.changedAt)
	);
	
	for (let i = allPriceChanges.length - 1; i >= 0; i--) {
		const change = allPriceChanges[i];
		const changeDate = new Date(change.changedAt);
		changeDate.setHours(0, 0, 0, 0);
		
		// If this change happened BEFORE the billing start, use its newPrice
		// (because it was the active price at the start of the billing period)
		if (changeDate < normalizedActualBillingStart) {
			priceAtPeriodStart = change.newPrice;
			break;
		}
	}
	
	// Get price changes that occurred during this month (on or after billing start)
	const relevantPriceChanges = priceChanges.filter(
		(change) => {
			const changeDate = new Date(change.changedAt);
			changeDate.setHours(0, 0, 0, 0);
			return changeDate >= normalizedActualBillingStart && changeDate <= monthEnd;
		}
	).sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));
	
	// If no price changes during the month, calculate single period with the price at period start
	if (relevantPriceChanges.length === 0) {
		const daysAttended = getDaysAttended(actualBillingStart, monthEnd, monthStart, monthEnd);
		const amount = calculateProratedAmount(priceAtPeriodStart, daysInMonth, daysAttended);
		
		return {
			periods: [
				{
					start: actualBillingStart,
					end: monthEnd,
					price: priceAtPeriodStart,
					days: daysAttended,
					amount: amount,
				},
			],
			totalAmount: amount,
			daysInPeriod: daysAttended,
			dailyRate: daysAttended > 0 ? amount / daysAttended : 0,
			billingPeriodStart: actualBillingStart,
			billingPeriodEnd: monthEnd,
		};
	}
	
	// Handle price changes - split billing into multiple periods
	const periods = [];
	let currentPrice = priceAtPeriodStart; // Use the price that was active at period start
	let currentStart = actualBillingStart;
	
	// Process each price change
	for (const change of relevantPriceChanges) {
		const changeDate = new Date(change.changedAt);
		changeDate.setHours(0, 0, 0, 0); // Normalize to start of day
		
		// Period before this change - use the OLD price (the price before the change)
		if (currentStart < changeDate) {
			const periodEnd = new Date(changeDate);
			periodEnd.setDate(periodEnd.getDate() - 1); // Day before change
			periodEnd.setHours(0, 0, 0, 0); // Normalize to start of day
			
			if (periodEnd >= currentStart) {
				// Use the oldPrice from the change record for the period before the change
				const priceForPeriod = change.oldPrice;
				const days = getDaysAttended(currentStart, periodEnd, monthStart, monthEnd);
				if (days > 0) {
					periods.push({
						start: new Date(currentStart),
						end: periodEnd,
						price: priceForPeriod,
						days: days,
						amount: calculateProratedAmount(priceForPeriod, daysInMonth, days),
					});
				}
			}
			
			currentStart = changeDate;
		}
		
		// After the change, use the new price
		currentPrice = change.newPrice;
	}
	
	// Final period from last change to end of month
	if (currentStart <= monthEnd) {
		const days = getDaysAttended(currentStart, monthEnd, monthStart, monthEnd);
		if (days > 0) {
			periods.push({
				start: new Date(currentStart),
				end: monthEnd,
				price: currentPrice,
				days: days,
				amount: calculateProratedAmount(currentPrice, daysInMonth, days),
			});
		}
	}
	
	const totalAmount = periods.reduce((sum, period) => sum + period.amount, 0);
	const totalDays = periods.reduce((sum, period) => sum + period.days, 0);
	
	return {
		periods: periods,
		totalAmount: totalAmount,
		daysInPeriod: totalDays,
		dailyRate: totalDays > 0 ? totalAmount / totalDays : 0,
		billingPeriodStart: actualBillingStart,
		billingPeriodEnd: monthEnd,
	};
}

