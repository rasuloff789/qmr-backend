/**
 * QMR Backend - Test Remove Student From Course Mutation using Fetch
 *
 * This script tests the removeStudentFromCourse mutation using fetch API
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
 * Get a course with students
 */
async function getCourse(courseId, token) {
	const query = `
		query GetCourse($id: ID!) {
			getCourse(id: $id) {
				id
				name
				students {
					id
					student {
						id
						fullname
						username
					}
					isActive
				}
			}
		}
	`;

	const result = await graphqlRequest(query, { id: courseId }, token);

	// Check for GraphQL errors
	if (result.errors) {
		console.error("GraphQL errors:", result.errors);
		throw new Error(result.errors.map((e) => e.message).join(", "));
	}

	return result.data?.getCourse;
}

/**
 * Add a student to a course
 */
async function addStudentToCourse(courseId, studentId, monthlyPayment, token) {
	const query = `
		mutation AddStudentToCourse(
			$courseId: ID!
			$studentId: ID!
			$monthlyPayment: Int!
		) {
			addStudentToCourse(
				courseId: $courseId
				studentId: $studentId
				monthlyPayment: $monthlyPayment
			) {
				success
				message
				courseStudent {
					id
					student {
						id
						fullname
					}
				}
				errors
			}
		}
	`;

	const result = await graphqlRequest(
		query,
		{ courseId, studentId, monthlyPayment },
		token
	);
	return result.data?.addStudentToCourse;
}

/**
 * Remove a student from a course
 */
async function removeStudentFromCourse(courseId, studentId, token) {
	const query = `
		mutation RemoveStudentFromCourse(
			$courseId: ID!
			$studentId: ID!
		) {
			removeStudentFromCourse(
				courseId: $courseId
				studentId: $studentId
			) {
				success
				message
				errors
				timestamp
			}
		}
	`;

	const result = await graphqlRequest(query, { courseId, studentId }, token);
	return result.data?.removeStudentFromCourse;
}

/**
 * Get all students with degrees
 */
async function getStudents(token) {
	const query = `
		query GetStudents {
			getStudents {
				id
				fullname
				username
				gender
				isActive
				possibleDegrees {
					id
					name
				}
			}
		}
	`;

	const result = await graphqlRequest(query, {}, token);
	return result.data?.getStudents;
}

/**
 * Main test function
 */
async function main() {
	try {
		console.log(
			"🚀 Starting removeStudentFromCourse mutation test using fetch...\n"
		);

		// Step 1: Login as admin
		console.log("📝 Step 1: Logging in as root...");
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
			console.log("   - Root user exists in database");
			console.log("   - Credentials are correct\n");
			process.exitCode = 1;
			return;
		}

		// Step 2: Get a course
		console.log("📝 Step 2: Getting a course...");
		let courseId = process.env.TEST_COURSE_ID;

		// If no course ID provided, get all courses and use the first one
		if (!courseId) {
			const getCoursesQuery = `
				query GetCourses {
					getCourses {
						id
						name
					}
				}
			`;
			const coursesResult = await graphqlRequest(getCoursesQuery, {}, token);
			const courses = coursesResult.data?.getCourses || [];

			if (courses.length === 0) {
				console.error("❌ No courses found in database");
				console.log(
					"\n💡 Please create a course first using addCourse mutation\n"
				);
				process.exitCode = 1;
				return;
			}

			courseId = String(courses[0].id);
			console.log(
				`ℹ️  No course ID provided, using first available course: ${courses[0].name} (ID: ${courseId})\n`
			);
		}

		let course;
		try {
			course = await getCourse(courseId, token);
			if (!course) {
				console.error(`❌ Course with ID ${courseId} not found`);
				console.log(
					"\n💡 Please provide a valid course ID or create a course first\n"
				);
				process.exitCode = 1;
				return;
			}
			console.log(`✅ Found course: ${course.name} (ID: ${course.id})`);
			console.log(`   Students enrolled: ${course.students?.length || 0}\n`);
		} catch (error) {
			console.error("❌ Failed to get course:", error.message);
			console.error("   Full error:", error);
			process.exitCode = 1;
			return;
		}

		// Step 3: Get course details to find matching students
		console.log("📝 Step 3: Getting course details for matching...");
		const getCourseDetailsQuery = `
			query GetCourseDetails($id: ID!) {
				getCourse(id: $id) {
					id
					name
					gender
					degrees {
						id
						name
					}
				}
			}
		`;
		const courseDetailsResult = await graphqlRequest(
			getCourseDetailsQuery,
			{ id: courseId },
			token
		);
		const courseInfo = courseDetailsResult.data?.getCourse;
		const courseDegreeIds = courseInfo.degrees.map((d) => d.id);
		console.log(`   Course gender: ${courseInfo.gender}`);
		console.log(
			`   Course degrees: ${courseInfo.degrees.map((d) => d.name).join(", ")}\n`
		);

		// Step 4: Get students and find one with matching criteria
		console.log(
			"📝 Step 4: Finding a student with matching gender and degrees..."
		);
		let students;
		try {
			students = await getStudents(token);
			if (!students || students.length === 0) {
				console.error("❌ No students found in database");
				process.exitCode = 1;
				return;
			}
			const activeStudents = students.filter((s) => s.isActive);
			if (activeStudents.length === 0) {
				console.error("❌ No active students found");
				process.exitCode = 1;
				return;
			}

			// Find a student with matching gender and degrees
			const matchingStudents = activeStudents.filter((s) => {
				if (s.gender !== courseInfo.gender) return false;
				const studentDegreeIds = (s.possibleDegrees || []).map((d) => d.id);
				return studentDegreeIds.some((id) => courseDegreeIds.includes(id));
			});

			if (matchingStudents.length === 0) {
				console.error("❌ No students found with matching gender and degrees");
				console.log(
					`   Required: Gender ${
						courseInfo.gender
					}, Degrees: ${courseInfo.degrees.map((d) => d.name).join(", ")}`
				);
				process.exitCode = 1;
				return;
			}

			console.log(
				`✅ Found ${matchingStudents.length} students with matching criteria\n`
			);
		} catch (error) {
			console.error("❌ Failed to get students:", error.message);
			process.exitCode = 1;
			return;
		}

		// Step 5: Add a student to the course first
		const testStudent = students.find((s) => {
			if (!s.isActive) return false;
			if (s.gender !== courseInfo.gender) return false;
			const studentDegreeIds = (s.possibleDegrees || []).map((d) => d.id);
			return studentDegreeIds.some((id) => courseDegreeIds.includes(id));
		});
		console.log(
			`📝 Step 5: Adding student ${testStudent.fullname} (ID: ${testStudent.id}) to course...`
		);

		const addResult = await addStudentToCourse(
			courseId,
			testStudent.id,
			500000,
			token
		);

		if (!addResult.success) {
			// Check if student is already enrolled
			if (addResult.message.includes("already enrolled")) {
				console.log(
					`ℹ️  Student is already enrolled, continuing with removal test...\n`
				);
			} else {
				console.error("❌ Failed to add student to course:");
				console.error(`   Message: ${addResult.message}`);
				console.error(`   Errors: ${addResult.errors?.join(", ")}\n`);
				process.exitCode = 1;
				return;
			}
		} else {
			console.log(
				`✅ Student added successfully! Enrollment ID: ${addResult.courseStudent.id}\n`
			);
		}

		// Step 6: Remove the student from the course
		console.log(
			`📝 Step 6: Removing student ${testStudent.fullname} from course...`
		);
		const removeResult = await removeStudentFromCourse(
			courseId,
			testStudent.id,
			token
		);

		if (removeResult.success) {
			console.log("✅ Student removed successfully!");
			console.log(`   Message: ${removeResult.message}\n`);
		} else {
			console.error("❌ Failed to remove student:");
			console.error(`   Message: ${removeResult.message}`);
			console.error(`   Errors: ${removeResult.errors?.join(", ")}\n`);
		}

		// Step 7: Verify removal by checking course students
		console.log("📝 Step 6: Verifying removal...");
		const courseAfter = await getCourse(courseId, token);
		const enrollment = courseAfter.students.find(
			(e) => e.student.id === testStudent.id
		);

		if (!enrollment) {
			console.log(
				"✅ Verification successful - student enrollment not found (removed)\n"
			);
		} else if (!enrollment.isActive) {
			console.log(
				"✅ Verification successful - student enrollment is inactive (removed)\n"
			);
		} else {
			console.log(
				"⚠️  Warning - student enrollment still exists and is active\n"
			);
		}

		// Step 8: Test removing already removed student
		console.log("📝 Step 7: Testing removal of already removed student...");
		const removeResult2 = await removeStudentFromCourse(
			courseId,
			testStudent.id,
			token
		);

		if (!removeResult2.success) {
			console.log(
				"✅ Validation worked correctly - already removed student rejected!"
			);
			console.log(`   Message: ${removeResult2.message}\n`);
		} else {
			console.error(
				"❌ Validation failed - already removed student was accepted!\n"
			);
		}

		// Step 9: Test removing non-existent enrollment
		console.log("📝 Step 8: Testing removal of non-existent enrollment...");
		const fakeStudentId = "99999";
		const removeResult3 = await removeStudentFromCourse(
			courseId,
			fakeStudentId,
			token
		);

		if (!removeResult3.success) {
			console.log(
				"✅ Validation worked correctly - non-existent enrollment rejected!"
			);
			console.log(`   Message: ${removeResult3.message}\n`);
		} else {
			console.error(
				"❌ Validation failed - non-existent enrollment was accepted!\n"
			);
		}

		// Step 10: Test validation - missing parameters
		console.log("📝 Step 9: Testing validation (missing parameters)...");
		const removeResult4 = await removeStudentFromCourse(
			null,
			testStudent.id,
			token
		);

		if (removeResult4 && !removeResult4.success) {
			console.log(
				"✅ Validation worked correctly - missing courseId rejected!"
			);
			console.log(`   Message: ${removeResult4.message}\n`);
		} else if (removeResult4 && removeResult4.success) {
			console.error("❌ Validation failed - missing courseId was accepted!\n");
		} else {
			console.log(
				"✅ Validation worked correctly - missing courseId returned null/undefined\n"
			);
		}

		// Summary
		console.log("=".repeat(60));
		console.log("📊 TEST SUMMARY");
		console.log("=".repeat(60));
		console.log("✅ Login: Success");
		console.log("✅ Get Course: Success");
		console.log("✅ Get Students: Success");
		console.log(
			`${
				addResult.success || addResult.message.includes("already enrolled")
					? "✅"
					: "❌"
			} Add Student: ${
				addResult.success || addResult.message.includes("already enrolled")
					? "Success"
					: "Failed"
			}`
		);
		console.log(
			`${removeResult.success ? "✅" : "❌"} Remove Student: ${
				removeResult.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${!removeResult2.success ? "✅" : "❌"} Validation (Already Removed): ${
				!removeResult2.success ? "Success" : "Failed"
			}`
		);
		console.log(
			`${!removeResult3.success ? "✅" : "❌"} Validation (Non-existent): ${
				!removeResult3.success ? "Success" : "Failed"
			}`
		);
		const missingParamsSuccess =
			!removeResult4 || (removeResult4 && !removeResult4.success);
		console.log(
			`${missingParamsSuccess ? "✅" : "❌"} Validation (Missing Params): ${
				missingParamsSuccess ? "Success" : "Failed"
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
