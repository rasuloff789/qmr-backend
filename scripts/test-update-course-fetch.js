/**
 * QMR Backend - Test Update Course Mutation using Fetch
 *
 * This script tests the updateCourse mutation using fetch API
 * to make HTTP requests to the GraphQL endpoint.
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import fetch from "node-fetch";
import config from "../src/config/env.js";

const GRAPHQL_ENDPOINT = `http://localhost:${config.PORT}/graphql`;

/**
 * Make a GraphQL request using fetch
 */
async function graphqlRequest(query, variables = {}, token = null) {
	const headers = {
		"Content-Type": "application/json",
	};

	if (token) {
		headers["Authorization"] = `Bearer ${token}`;
	}

	const response = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers,
		body: JSON.stringify({
			query,
			variables,
		}),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	return await response.json();
}

/**
 * Login and get token
 */
async function login(username, password) {
	const query = `
		mutation Login($username: String!, $password: String!) {
			login(username: $username, password: $password, userType: "root") {
				success
				message
				token
				user {
					id
					username
					role
				}
			}
		}
	`;

	const result = await graphqlRequest(query, { username, password });

	if (result.data?.login?.success && result.data.login.token) {
		return result.data.login.token;
	}

	throw new Error(
		`Login failed: ${result.data?.login?.message || "Unknown error"}`
	);
}

/**
 * Get a course by ID
 */
async function getCourse(courseId, token) {
	const query = `
		query GetCourse($id: ID!) {
			getCourse(id: $id) {
				id
				name
				description
				daysOfWeek
				gender
				startAt
				endAt
				startTime
				endTime
				teacher {
					id
					fullname
				}
				degrees {
					id
					name
				}
			}
		}
	`;

	const result = await graphqlRequest(query, { id: courseId }, token);
	return result.data?.getCourse;
}

/**
 * Update a course
 */
async function updateCourse(courseId, updates, token) {
	const query = `
		mutation UpdateCourse(
			$courseId: ID!
			$name: String
			$description: String
			$daysOfWeek: [DaysOfWeek!]
			$gender: Gender
			$startAt: Date
			$endAt: Date
			$startTime: Date
			$endTime: Date
			$teacherId: ID
			$degreeIds: [ID!]
		) {
			updateCourse(
				courseId: $courseId
				name: $name
				description: $description
				daysOfWeek: $daysOfWeek
				gender: $gender
				startAt: $startAt
				endAt: $endAt
				startTime: $startTime
				endTime: $endTime
				teacherId: $teacherId
				degreeIds: $degreeIds
			) {
				success
				message
				course {
					id
					name
					description
					daysOfWeek
					gender
					startAt
					endAt
					startTime
					endTime
					teacher {
						id
						fullname
					}
					degrees {
						id
						name
					}
				}
				errors
				timestamp
			}
		}
	`;

	const variables = {
		courseId,
		...updates,
	};

	const result = await graphqlRequest(query, variables, token);
	return result.data?.updateCourse;
}

/**
 * Main test function
 */
async function main() {
	try {
		console.log("🚀 Starting updateCourse mutation test using fetch...\n");

		// Step 1: Login as admin
		console.log("📝 Step 1: Logging in as admin...");
		const username = process.env.TEST_ADMIN_USERNAME || "root";
		const password = process.env.TEST_ADMIN_PASSWORD || "Root123!";

		let token;
		try {
			token = await login(username, password);
			console.log(`✅ Login successful! Token: ${token.substring(0, 20)}...\n`);
		} catch (error) {
			console.error("❌ Login failed:", error.message);
			console.log("\n💡 Make sure:");
			console.log("   - Server is running (npm run dev)");
			console.log("   - Admin user exists in database");
			console.log("   - Credentials are correct\n");
			process.exitCode = 1;
			return;
		}

		// Step 2: Get a course to update
		console.log("📝 Step 2: Getting a course to update...");
		const courseId = process.env.TEST_COURSE_ID || "1";

		let course;
		try {
			course = await getCourse(courseId, token);
			if (!course) {
				console.error(`❌ Course with ID ${courseId} not found`);
				console.log("\n💡 Make sure:");
				console.log("   - A course exists in the database");
				console.log("   - The course ID is correct\n");
				process.exitCode = 1;
				return;
			}
			console.log(`✅ Found course: ${course.name} (ID: ${course.id})\n`);
			console.log("Current course data:");
			console.log(`   Name: ${course.name}`);
			console.log(`   Description: ${course.description || "None"}`);
			console.log(`   Days: ${course.daysOfWeek.join(", ")}`);
			console.log(`   Gender: ${course.gender}`);
			console.log(`   Teacher: ${course.teacher.fullname}\n`);
		} catch (error) {
			console.error("❌ Failed to get course:", error.message);
			process.exitCode = 1;
			return;
		}

		// Step 3: Update course name and description
		console.log("📝 Step 3: Updating course name and description...");
		const update1 = await updateCourse(
			courseId,
			{
				name: `${course.name} (Updated)`,
				description: "This course has been updated via fetch API test",
			},
			token
		);

		if (update1.success) {
			console.log("✅ Course updated successfully!");
			console.log(`   New name: ${update1.course.name}`);
			console.log(`   New description: ${update1.course.description}\n`);
		} else {
			console.error("❌ Failed to update course:");
			console.error(`   Message: ${update1.message}`);
			console.error(`   Errors: ${update1.errors?.join(", ")}\n`);
		}

		// Step 4: Update course days
		console.log("📝 Step 4: Updating course days of week...");
		const newDays = ["TUESDAY", "THURSDAY"];
		const update2 = await updateCourse(
			courseId,
			{
				daysOfWeek: newDays,
			},
			token
		);

		if (update2.success) {
			console.log("✅ Course days updated successfully!");
			console.log(`   New days: ${update2.course.daysOfWeek.join(", ")}\n`);
		} else {
			console.error("❌ Failed to update course days:");
			console.error(`   Message: ${update2.message}`);
			console.error(`   Errors: ${update2.errors?.join(", ")}\n`);
		}

		// Step 5: Revert name back
		console.log("📝 Step 5: Reverting course name back to original...");
		const update3 = await updateCourse(
			courseId,
			{
				name: course.name.replace(" (Updated)", ""),
			},
			token
		);

		if (update3.success) {
			console.log("✅ Course name reverted successfully!");
			console.log(`   Name: ${update3.course.name}\n`);
		} else {
			console.error("❌ Failed to revert course name:");
			console.error(`   Message: ${update3.message}`);
			console.error(`   Errors: ${update3.errors?.join(", ")}\n`);
		}

		// Step 6: Test validation - empty name
		console.log("📝 Step 6: Testing validation (empty name should fail)...");
		const update4 = await updateCourse(
			courseId,
			{
				name: "",
			},
			token
		);

		if (!update4.success) {
			console.log("✅ Validation worked correctly - empty name rejected!");
			console.log(`   Message: ${update4.message}\n`);
		} else {
			console.error("❌ Validation failed - empty name was accepted!\n");
		}

		// Step 7: Test validation - no fields provided
		console.log("📝 Step 7: Testing validation (no fields should fail)...");
		const update5 = await updateCourse(courseId, {}, token);

		if (!update5.success) {
			console.log("✅ Validation worked correctly - no fields rejected!");
			console.log(`   Message: ${update5.message}\n`);
		} else {
			console.error("❌ Validation failed - no fields were accepted!\n");
		}

		// Summary
		console.log("=".repeat(60));
		console.log("📊 TEST SUMMARY");
		console.log("=".repeat(60));
		console.log("✅ Login: Success");
		console.log("✅ Get Course: Success");
		console.log(
			`${update1.success ? "✅" : "❌"} Update Name/Description: ${
				update1.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${update2.success ? "✅" : "❌"} Update Days: ${
				update2.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${update3.success ? "✅" : "❌"} Revert Name: ${
				update3.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${!update4.success ? "✅" : "❌"} Validation (Empty Name): ${
				!update4.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${!update5.success ? "✅" : "❌"} Validation (No Fields): ${
				!update5.success ? "Success" : "Failed"
			}`
		);
		console.log("=".repeat(60));
	} catch (error) {
		console.error("❌ Test failed with error:", error);
		process.exitCode = 1;
	}
}

// Run the test
main();
