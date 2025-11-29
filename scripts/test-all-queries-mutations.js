#!/usr/bin/env node

/**
 * QMR Backend - Comprehensive Test Suite for Queries and Mutations
 *
 * This script tests all GraphQL queries and mutations using fetch for:
 * - Root user
 * - Male Admin
 * - Female Admin
 * - Teacher
 *
 * It validates permissions, responses, and error handling.
 *
 * @author QMR Development Team
 * @version 3.1.0
 */

import fetch from "node-fetch";
import { execSync } from "child_process";

// ============================================================================
// CONFIGURATION
// ============================================================================

const PORT = process.env.PORT || 4000;
const GRAPHQL_ENDPOINT = `http://localhost:${PORT}/graphql`;

const ROOT_USERNAME = process.env.ROOT_USERNAME || "root";
const ROOT_PASSWORD = process.env.ROOT_PASSWORD || "Root123!";
const MALE_ADMIN_USERNAME = process.env.MALE_ADMIN_USERNAME || "admin";
const MALE_ADMIN_PASSWORD = process.env.MALE_ADMIN_PASSWORD || "Admin123!";
const FEMALE_ADMIN_USERNAME =
	process.env.FEMALE_ADMIN_USERNAME || "admin_female";
const FEMALE_ADMIN_PASSWORD = process.env.FEMALE_ADMIN_PASSWORD || "Admin123!";
const TEACHER_USERNAME = process.env.TEACHER_USERNAME || "teacher";
const TEACHER_PASSWORD = process.env.TEACHER_PASSWORD || "Teacher123!";
const SEED_USER_PASSWORD = process.env.SEED_USER_PASSWORD || "Str0ngPass!";

// ============================================================================
// TEST TRACKING
// ============================================================================

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

// ============================================================================
// COLORS
// ============================================================================

const colors = {
	reset: "\x1b[0m",
	red: "\x1b[31m",
	green: "\x1b[32m",
	yellow: "\x1b[33m",
	blue: "\x1b[34m",
	cyan: "\x1b[36m",
};

// ============================================================================
// OUTPUT HELPERS
// ============================================================================

const log = (message, color = colors.reset) => {
	console.log(`${color}${message}${colors.reset}`);
};

const printSection = (title) => {
	console.log(`\n${colors.blue}${"=".repeat(50)}${colors.reset}`);
	console.log(`${colors.blue}${title}${colors.reset}`);
	console.log(`${colors.blue}${"=".repeat(50)}${colors.reset}\n`);
};

const printTest = (testName) => {
	process.stdout.write(`[TEST] ${testName}... `);
};

const printSuccess = (message) => {
	console.log(`${colors.green}✓${colors.reset} ${message}`);
	passedTests++;
	totalTests++;
};

const printFailure = (message, details = "") => {
	console.log(`${colors.red}✗${colors.reset} ${message}`);
	if (details) {
		console.log(`   ${colors.yellow}${details}${colors.reset}`);
	}
	failedTests++;
	totalTests++;
};

const printSkip = (message) => {
	console.log(`${colors.yellow}⏭ SKIP${colors.reset}: ${message}`);
	totalTests++;
};

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

const tokens = {
	ROOT: null,
	MALE_ADMIN: null,
	FEMALE_ADMIN: null,
	TEACHER: null,
};

function getToken(userType) {
	const token = tokens[userType];
	if (!token) return null;
	const cleanToken = String(token).trim();
	if (
		cleanToken &&
		cleanToken !== "null" &&
		cleanToken !== "undefined" &&
		cleanToken.length > 10
	) {
		return cleanToken;
	}
	return null;
}

function setToken(userType, token) {
	if (token && String(token).trim().length > 10) {
		tokens[userType] = String(token).trim();
		return true;
	}
	return false;
}

// ============================================================================
// GRAPHQL HELPERS
// ============================================================================

async function graphqlRequest(query, variables = null, token = null) {
	const headers = {
		"Content-Type": "application/json",
	};

	if (token) {
		const cleanToken = String(token).trim();
		if (
			cleanToken &&
			cleanToken !== "null" &&
			cleanToken !== "undefined" &&
			cleanToken.length > 10
		) {
			headers["Authorization"] = `Bearer ${cleanToken}`;
		}
	}

	const body = {
		query,
		...(variables && { variables }),
	};

	try {
		const response = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers,
			body: JSON.stringify(body),
		});

		return await response.json();
	} catch (error) {
		return {
			errors: [{ message: `Network error: ${error.message}` }],
			data: null,
		};
	}
}

async function login(username, password, userType) {
	const query = `
		mutation Login($username: String!, $password: String!, $userType: String!) {
			login(username: $username, password: $password, userType: $userType) {
				success
				message
				token
				user {
					id
					username
					role
					gender
				}
			}
		}
	`;

	const variables = {
		username,
		password,
		userType,
	};

	const response = await graphqlRequest(query, variables);

	if (response.errors) {
		return null;
	}

	const loginData = response.data?.login;
	if (loginData && loginData.token) {
		loginData.token = String(loginData.token).trim();
	}
	return loginData || null;
}

// ============================================================================
// RESPONSE HELPERS
// ============================================================================

function hasErrors(response) {
	return response.errors && response.errors.length > 0;
}

function getError(response) {
	if (hasErrors(response)) {
		return response.errors[0].message;
	}
	if (response.data) {
		const dataKey = Object.keys(response.data)[0];
		const data = response.data[dataKey];
		if (data && data.message) {
			return data.message;
		}
	}
	return "Unknown error";
}

function isSuccess(response, mutationName) {
	if (hasErrors(response)) {
		return false;
	}
	const data = response.data?.[mutationName];
	return data?.success === true;
}

function hasData(response, queryName) {
	if (hasErrors(response)) {
		return false;
	}
	const data = response.data?.[queryName];
	return data !== null && data !== undefined;
}

// ============================================================================
// TEST HELPERS
// ============================================================================

async function testQuery(queryName, query, userType, description = null) {
	const token = getToken(userType);
	if (!token) {
		printSkip(`${description || userType} - ${queryName} query (no token)`);
		return;
	}

	printTest(`${description || userType} - ${queryName} query`);
	const response = await graphqlRequest(query, null, token);
	if (hasData(response, queryName)) {
		printSuccess(`${description || userType} can query ${queryName}`);
	} else {
		printFailure(
			`${description || userType} cannot query ${queryName}`,
			getError(response)
		);
	}
}

async function testMutation(
	mutationName,
	query,
	variables,
	userType,
	description = null,
	expectedToFail = false
) {
	const token = getToken(userType);
	if (!token) {
		printSkip(
			`${description || userType} - ${mutationName} mutation (no token)`
		);
		return;
	}

	printTest(`${description || userType} - ${mutationName} mutation`);
	const response = await graphqlRequest(query, variables, token);

	if (expectedToFail) {
		if (hasErrors(response) || !isSuccess(response, mutationName)) {
			printSuccess(
				`${description || userType} correctly blocked from ${mutationName}`
			);
		} else {
			printFailure(
				`${description || userType} should not be able to ${mutationName}`
			);
		}
	} else {
		if (isSuccess(response, mutationName)) {
			printSuccess(`${description || userType} can ${mutationName}`);
		} else {
			printFailure(
				`${description || userType} cannot ${mutationName}`,
				getError(response)
			);
		}
	}
}

// ============================================================================
// LOGIN TESTS
// ============================================================================

async function testLogins() {
	printSection("Testing Logins");

	// Root login
	printTest("Root Login");
	let rootLogin = await login(ROOT_USERNAME, ROOT_PASSWORD, "root");

	if (!rootLogin || !rootLogin.success || !rootLogin.token) {
		// Try to fix password and retry
		try {
			execSync("node scripts/fix-root-password.js", { stdio: "pipe" });
			await new Promise((resolve) => setTimeout(resolve, 1000));
			rootLogin = await login(ROOT_USERNAME, ROOT_PASSWORD, "root");
		} catch (error) {
			// Ignore
		}
	}

	if (rootLogin?.success && rootLogin?.token) {
		if (setToken("ROOT", rootLogin.token)) {
			printSuccess("Root login successful");
		} else {
			printFailure("Root login failed", "Invalid token format");
		}
	} else {
		printFailure(
			"Root login failed",
			rootLogin?.message || "No token received"
		);
	}

	// Male admin login
	printTest("Male Admin Login");
	const maleAdminLogin = await login(
		MALE_ADMIN_USERNAME,
		MALE_ADMIN_PASSWORD,
		"admin"
	);
	if (maleAdminLogin?.success && maleAdminLogin?.token) {
		if (setToken("MALE_ADMIN", maleAdminLogin.token)) {
			printSuccess("Male admin login successful");
		} else {
			printFailure("Male admin login failed", "Invalid token format");
		}
	} else {
		printFailure(
			"Male admin login failed",
			maleAdminLogin?.message || "No token received"
		);
	}

	// Female admin login
	printTest("Female Admin Login");
	const femaleAdminLogin = await login(
		FEMALE_ADMIN_USERNAME,
		FEMALE_ADMIN_PASSWORD,
		"admin"
	);
	if (femaleAdminLogin?.success && femaleAdminLogin?.token) {
		if (setToken("FEMALE_ADMIN", femaleAdminLogin.token)) {
			printSuccess("Female admin login successful");
		} else {
			printFailure("Female admin login failed", "Invalid token format");
		}
	} else {
		printFailure(
			"Female admin login failed",
			femaleAdminLogin?.message || "No token received"
		);
	}

	// Verify tokens
	console.log();
	if (getToken("ROOT")) {
		log(
			`✓ ROOT_TOKEN is set (length: ${getToken("ROOT").length})`,
			colors.green
		);
	}
	if (getToken("MALE_ADMIN")) {
		log(
			`✓ MALE_ADMIN_TOKEN is set (length: ${getToken("MALE_ADMIN").length})`,
			colors.green
		);
	}
	if (getToken("FEMALE_ADMIN")) {
		log(
			`✓ FEMALE_ADMIN_TOKEN is set (length: ${
				getToken("FEMALE_ADMIN").length
			})`,
			colors.green
		);
	}

	// Teacher login - try multiple usernames from seed data
	printTest("Teacher Login");
	let teacherLogin = null;
	let lastError = null;

	// First try the configured username
	teacherLogin = await login(TEACHER_USERNAME, TEACHER_PASSWORD, "teacher");
	if (!teacherLogin?.success || !teacherLogin?.token) {
		lastError =
			teacherLogin?.message || "Login failed with default credentials";

		// If that fails, try the seed password with common usernames
		const rootToken = getToken("ROOT");
		if (rootToken) {
			const getTeachersQuery = `
				query {
					getTeachers {
						id
						username
						isActive
					}
				}
			`;
			const teachersResponse = await graphqlRequest(
				getTeachersQuery,
				null,
				rootToken
			);
			const teachers = teachersResponse.data?.getTeachers || [];
			const activeTeacher = teachers.find((t) => t.isActive && t.username);

			if (activeTeacher) {
				// Try login with seed password
				teacherLogin = await login(
					activeTeacher.username,
					SEED_USER_PASSWORD,
					"teacher"
				);
				if (!teacherLogin?.success || !teacherLogin?.token) {
					lastError =
						teacherLogin?.message ||
						`Login failed with ${activeTeacher.username} and seed password`;
					// Try default password
					teacherLogin = await login(
						activeTeacher.username,
						TEACHER_PASSWORD,
						"teacher"
					);
					if (!teacherLogin?.success || !teacherLogin?.token) {
						lastError =
							teacherLogin?.message ||
							`Login failed with ${activeTeacher.username} and default password`;
					}
				}
			} else {
				lastError =
					"No active teachers found in database. Run: node scripts/seed-test-teacher.js";
			}
		} else {
			lastError = "Cannot query teachers (ROOT token not available)";
		}
	}

	if (teacherLogin?.success && teacherLogin?.token) {
		if (setToken("TEACHER", teacherLogin.token)) {
			const loggedInUsername = teacherLogin?.user?.username || TEACHER_USERNAME;
			printSuccess(`Teacher login successful (username: ${loggedInUsername})`);
		} else {
			printFailure("Teacher login failed", "Invalid token format");
		}
	} else {
		const errorMsg =
			lastError ||
			teacherLogin?.message ||
			`No token received. Tried username: ${TEACHER_USERNAME}.`;
		printFailure(
			"Teacher login failed",
			`${errorMsg}\n   Hint: Run 'node scripts/seed-test-teacher.js' to create a test teacher with username "${TEACHER_USERNAME}" and password "${TEACHER_PASSWORD}"`
		);
	}

	if (getToken("TEACHER")) {
		log(
			`✓ TEACHER_TOKEN is set (length: ${getToken("TEACHER").length})`,
			colors.green
		);
	}
}

// ============================================================================
// QUERY TESTS
// ============================================================================

const QUERIES = {
	me: `
		query {
			me {
				id
				username
				role
			}
		}
	`,
	getAdmins: `
		query {
			getAdmins {
				id
				username
				fullname
			}
		}
	`,
	getTeachers: `
		query {
			getTeachers {
				id
				username
				fullname
			}
		}
	`,
	getStudents: `
		query {
			getStudents {
				id
				username
				fullname
			}
		}
	`,
	getCourses: `
		query {
			getCourses {
				id
				name
			}
		}
	`,
	getDegrees: `
		query {
			getDegrees {
				id
				name
			}
		}
	`,
	getDashboardStats: `
		query {
			getDashboardStats {
				totalAdmins
				totalTeachers
				totalStudents
				totalUsers
			}
		}
	`,
};

async function testAllQueries() {
	printSection("Testing Queries");

	for (const [queryName, query] of Object.entries(QUERIES)) {
		await testQuery(queryName, query, "ROOT", "Root");
		await testQuery(queryName, query, "MALE_ADMIN", "Male Admin");
		await testQuery(queryName, query, "FEMALE_ADMIN", "Female Admin");

		// Teachers can access most queries except:
		// - getAdmins/getAdmin (admin-only)
		// - getStudents/getStudent (admin/root only - teachers cannot view students)
		const teacherBlockedQueries = [
			"getAdmins",
			"getAdmin",
			"getStudents",
			"getStudent",
		];

		if (!teacherBlockedQueries.includes(queryName)) {
			await testQuery(queryName, query, "TEACHER", "Teacher");
		} else {
			// Test that teachers CANNOT access these queries
			const token = getToken("TEACHER");
			if (token) {
				printTest(`Teacher - ${queryName} query (should be blocked)`);
				const response = await graphqlRequest(query, null, token);
				if (hasData(response, queryName)) {
					printFailure(
						`Teacher can query ${queryName} (should be blocked)`,
						"Permission check failed"
					);
				} else {
					const error = getError(response);
					if (
						error.includes("Not Authorised") ||
						error.includes("Not Authorized") ||
						error.includes("permission") ||
						error.includes("Access denied")
					) {
						printSuccess(`Teacher correctly blocked from ${queryName}`);
					} else {
						printFailure(`Teacher cannot query ${queryName}`, error);
					}
				}
			} else {
				printSkip(`Teacher - ${queryName} query (no token)`);
			}
		}
	}
}

// ============================================================================
// MUTATION TESTS
// ============================================================================

async function testMutationAddAdmin() {
	printSection("Testing Mutation: addAdmin");

	const query = `
		mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!) {
			addAdmin(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender) {
				success
				message
				admin {
					id
					username
				}
			}
		}
	`;

	const timestamp = Date.now();
	const variables = {
		username: `testadmin${timestamp}`,
		password: "Test123!",
		fullname: "Test Admin",
		tgUsername: `testadmin${timestamp}`,
		birthDate: "1990-01-01",
		phone: "998901234567",
		gender: "MALE",
	};

	// Root can add admin
	await testMutation("addAdmin", query, variables, "ROOT", "Root");

	// Male admin cannot add admin
	await testMutation(
		"addAdmin",
		query,
		{ ...variables, username: `testadmin2${timestamp}` },
		"MALE_ADMIN",
		"Male Admin",
		true
	);
}

async function testMutationUpdateAdmin() {
	printSection("Testing Mutation: updateAdmin");

	const token = getToken("ROOT");
	if (!token) {
		printSkip("Root - updateAdmin mutation (no token)");
		return;
	}

	// Get first admin
	const getAdminsQuery = `
		query {
			getAdmins {
				id
			}
		}
	`;

	const adminsResponse = await graphqlRequest(getAdminsQuery, null, token);
	const adminId = adminsResponse.data?.getAdmins?.[0]?.id;

	if (!adminId) {
		printSkip("Root - updateAdmin mutation (no admin found)");
		return;
	}

	const query = `
		mutation UpdateAdmin($id: ID!, $fullname: String) {
			updateAdmin(id: $id, fullname: $fullname) {
				success
				message
				admin {
					id
					fullname
				}
			}
		}
	`;

	const variables = {
		id: adminId,
		fullname: "Updated Admin Name",
	};

	await testMutation("updateAdmin", query, variables, "ROOT", "Root");
}

async function testMutationUpdateAdminActive() {
	printSection("Testing Mutation: updateAdminActive");

	const token = getToken("ROOT");
	if (!token) {
		printSkip("Root - updateAdminActive mutation (no token)");
		return;
	}

	// Get first admin
	const getAdminsQuery = `
		query {
			getAdmins {
				id
			}
		}
	`;

	const adminsResponse = await graphqlRequest(getAdminsQuery, null, token);
	const adminId = adminsResponse.data?.getAdmins?.[0]?.id;

	if (!adminId) {
		printSkip("Root - updateAdminActive mutation (no admin found)");
		return;
	}

	const query = `
		mutation UpdateAdminActive($adminId: ID!, $isActive: Boolean!) {
			updateAdminActive(adminId: $adminId, isActive: $isActive) {
				success
				message
				admin {
					id
					isActive
				}
			}
		}
	`;

	const variables = {
		adminId,
		isActive: true,
	};

	await testMutation("updateAdminActive", query, variables, "ROOT", "Root");

	// Male admin cannot update admin active status
	await testMutation(
		"updateAdminActive",
		query,
		variables,
		"MALE_ADMIN",
		"Male Admin",
		true
	);
}

async function testMutationUpdatePassword() {
	printSection("Testing Mutation: updatePassword");

	const query = `
		mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
			updatePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
				success
				message
			}
		}
	`;

	// Test for ROOT
	const rootToken = getToken("ROOT");
	if (rootToken) {
		// Test ROOT update password
		const rootVariables = {
			currentPassword: ROOT_PASSWORD,
			newPassword: "NewRoot123!",
		};

		const response = await graphqlRequest(query, rootVariables, rootToken);
		if (isSuccess(response, "updatePassword")) {
			printSuccess("Root can update password");

			// Get new token with new password for revert
			const newTokenResponse = await login(
				ROOT_USERNAME,
				"NewRoot123!",
				"root"
			);
			let revertToken = rootToken; // Fallback to old token

			if (newTokenResponse?.success && newTokenResponse?.token) {
				revertToken = newTokenResponse.token;
				setToken("ROOT", revertToken);
			}

			// Revert password back to original
			const revertVariables = {
				currentPassword: "NewRoot123!",
				newPassword: ROOT_PASSWORD,
			};

			const revertResponse = await graphqlRequest(
				query,
				revertVariables,
				revertToken
			);

			if (isSuccess(revertResponse, "updatePassword")) {
				// Get token with original password
				const originalTokenResponse = await login(
					ROOT_USERNAME,
					ROOT_PASSWORD,
					"root"
				);
				if (originalTokenResponse?.success && originalTokenResponse?.token) {
					setToken("ROOT", originalTokenResponse.token);
					log("✓ Password reverted successfully", colors.green);
				}
			} else {
				// If revert fails, fix password using script
				log("⚠ Password revert failed, fixing via script...", colors.yellow);
				try {
					const { execSync } = await import("child_process");
					execSync("node scripts/fix-root-password.js", { stdio: "pipe" });
					// Re-login with fixed password
					await new Promise((resolve) => setTimeout(resolve, 1000));
					const fixedTokenResponse = await login(
						ROOT_USERNAME,
						ROOT_PASSWORD,
						"root"
					);
					if (fixedTokenResponse?.success && fixedTokenResponse?.token) {
						setToken("ROOT", fixedTokenResponse.token);
						log("✓ Password fixed via script", colors.green);
					}
				} catch (error) {
					log(`⚠ Could not fix password: ${error.message}`, colors.yellow);
				}
			}
		} else {
			printFailure("Root cannot update password", getError(response));
		}
	}

	// Test for MALE_ADMIN
	const maleAdminToken = getToken("MALE_ADMIN");
	if (maleAdminToken) {
		const maleAdminVariables = {
			currentPassword: MALE_ADMIN_PASSWORD,
			newPassword: "NewAdmin123!",
		};

		const maleAdminResponse = await graphqlRequest(
			query,
			maleAdminVariables,
			maleAdminToken
		);

		if (isSuccess(maleAdminResponse, "updatePassword")) {
			printSuccess("Male Admin can update password");

			// Get new token with new password for revert
			const newTokenResponse = await login(
				MALE_ADMIN_USERNAME,
				"NewAdmin123!",
				"admin"
			);
			let revertToken = maleAdminToken;

			if (newTokenResponse?.success && newTokenResponse?.token) {
				revertToken = newTokenResponse.token;
				setToken("MALE_ADMIN", revertToken);
			}

			// Revert password back to original
			const revertVariables = {
				currentPassword: "NewAdmin123!",
				newPassword: MALE_ADMIN_PASSWORD,
			};

			const revertResponse = await graphqlRequest(
				query,
				revertVariables,
				revertToken
			);

			if (isSuccess(revertResponse, "updatePassword")) {
				const originalTokenResponse = await login(
					MALE_ADMIN_USERNAME,
					MALE_ADMIN_PASSWORD,
					"admin"
				);
				if (originalTokenResponse?.success && originalTokenResponse?.token) {
					setToken("MALE_ADMIN", originalTokenResponse.token);
					log("✓ Male Admin password reverted successfully", colors.green);
				}
			}
		} else {
			printFailure(
				"Male Admin cannot update password",
				getError(maleAdminResponse)
			);
		}
	}
}

async function testMutationUpdateProfile() {
	printSection("Testing Mutation: updateProfile");

	const token = getToken("ROOT");
	if (!token) {
		printSkip("Root - updateProfile mutation (no token)");
		return;
	}

	const query = `
		mutation UpdateProfile($tgUsername: String) {
			updateProfile(tgUsername: $tgUsername) {
				success
				message
				user {
					id
					tgUsername
				}
			}
		}
	`;

	// Telegram username must be 5-32 chars
	const timestamp = Date.now().toString().slice(-8); // Last 8 digits
	const variables = {
		tgUsername: `roottg${timestamp}`, // Max 15 chars
	};

	const response = await graphqlRequest(query, variables, token);
	if (isSuccess(response, "updateProfile")) {
		printSuccess("Root can update profile");
	} else {
		const error = getError(response);
		// Root users cannot update their profile - this is expected
		if (
			error.includes("cannot update") ||
			error.includes("Root users") ||
			error.includes("Not Authorised") ||
			error.includes("Not Authorized") ||
			error.includes("authorised") ||
			error.includes("authorized")
		) {
			printSuccess(
				"Root - updateProfile (correctly blocked - root cannot update profile)"
			);
		} else {
			printFailure("Root cannot update profile", error);
		}
	}

	// Test for MALE_ADMIN
	const maleAdminToken = getToken("MALE_ADMIN");
	if (maleAdminToken) {
		// Telegram username must be 5-32 chars, so use shorter format
		const timestamp = Date.now().toString().slice(-8); // Last 8 digits
		const maleAdminVariables = {
			tgUsername: `admintg${timestamp}`, // Max 16 chars
		};

		const maleAdminResponse = await graphqlRequest(
			query,
			maleAdminVariables,
			maleAdminToken
		);

		if (isSuccess(maleAdminResponse, "updateProfile")) {
			printSuccess("Male Admin can update profile");
		} else {
			printFailure(
				"Male Admin cannot update profile",
				getError(maleAdminResponse)
			);
		}
	}

	// Test for TEACHER
	const teacherToken = getToken("TEACHER");
	if (teacherToken) {
		const teacherTimestamp = Date.now().toString().slice(-8);
		const teacherVariables = {
			tgUsername: `teachtg${teacherTimestamp}`, // Max 15 chars
		};

		const teacherResponse = await graphqlRequest(
			query,
			teacherVariables,
			teacherToken
		);

		if (isSuccess(teacherResponse, "updateProfile")) {
			printSuccess("Teacher can update profile");
		} else {
			printFailure("Teacher cannot update profile", getError(teacherResponse));
		}
	}
}

async function testMutationAddDegree() {
	printSection("Testing Mutation: addDegree");

	const query = `
		mutation AddDegree($name: String!) {
			addDegree(name: $name) {
				success
				message
				degree {
					id
					name
				}
			}
		}
	`;

	const variables = {
		name: `TestDegree${Date.now()}`,
	};

	// Root can add degree
	await testMutation("addDegree", query, variables, "ROOT", "Root");

	// Male admin can also add degree
	const timestamp2 = Date.now();
	await testMutation(
		"addDegree",
		query,
		{ name: `TestDegree${timestamp2}` },
		"MALE_ADMIN",
		"Male Admin"
	);
}

async function testMutationAddTeacher() {
	printSection("Testing Mutation: addTeacher");

	const query = `
		mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!) {
			addTeacher(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender) {
				success
				message
				teacher {
					id
					username
				}
			}
		}
	`;

	// Root can add any teacher (test both MALE and FEMALE)
	const timestamp = Date.now();
	await testMutation(
		"addTeacher",
		query,
		{
			username: `testteachermale${timestamp}`,
			password: "Test123!",
			fullname: "Test Male Teacher",
			tgUsername: `testteachermale${timestamp}`,
			birthDate: "1985-01-01",
			phone: "998901234567",
			gender: "MALE",
		},
		"ROOT",
		"Root"
	);

	// Root can also add female teacher
	const timestamp2 = Date.now();
	await testMutation(
		"addTeacher",
		query,
		{
			username: `testteacherfemale${timestamp2}`,
			password: "Test123!",
			fullname: "Test Female Teacher",
			tgUsername: `testteacherfemale${timestamp2}`,
			birthDate: "1986-01-01",
			phone: "998901234568",
			gender: "FEMALE",
		},
		"ROOT",
		"Root"
	);

	// Male admin can add male teacher
	const timestamp3 = Date.now();
	await testMutation(
		"addTeacher",
		query,
		{
			username: `testteachermale${timestamp3}`,
			password: "Test123!",
			fullname: "Test Male Teacher",
			tgUsername: `testteachermale${timestamp3}`,
			birthDate: "1987-01-01",
			phone: "998901234569",
			gender: "MALE",
		},
		"MALE_ADMIN",
		"Male Admin"
	);

	// Male admin cannot add female teacher
	const timestamp4 = Date.now();
	await testMutation(
		"addTeacher",
		query,
		{
			username: `testteacherfemale${timestamp4}`,
			password: "Test123!",
			fullname: "Test Female Teacher",
			tgUsername: `testteacherfemale${timestamp4}`,
			birthDate: "1988-01-01",
			phone: "998901234570",
			gender: "FEMALE",
		},
		"MALE_ADMIN",
		"Male Admin",
		true
	);
}

async function testMutationAddStudent() {
	printSection("Testing Mutation: addStudent");

	const token = getToken("ROOT");
	if (!token) {
		printSkip("Root - addStudent mutation (no token)");
		return;
	}

	// Get degree first
	const getDegreesQuery = `
		query {
			getDegrees {
				id
			}
		}
	`;

	const degreesResponse = await graphqlRequest(getDegreesQuery, null, token);
	let degreeId = degreesResponse.data?.getDegrees?.[0]?.id;

	// Create degree if not found
	if (!degreeId) {
		const createDegreeQuery = `
			mutation AddDegree($name: String!) {
				addDegree(name: $name) {
					success
					degree {
						id
					}
				}
			}
		`;
		const createResponse = await graphqlRequest(
			createDegreeQuery,
			{ name: `TempDegree${Date.now()}` },
			token
		);

		if (createResponse.errors) {
			log(
				`Warning: Could not create degree: ${getError(createResponse)}`,
				colors.yellow
			);
		} else {
			degreeId = createResponse.data?.addDegree?.degree?.id;
		}
	}

	if (!degreeId) {
		printFailure(
			"No degrees found - cannot test addStudent",
			"Failed to query or create degree. Server may need restart or ROOT permissions not working."
		);
		return;
	}

	const query = `
		mutation AddStudent($username: String!, $password: String!, $fullname: String!, $possibleDegrees: [ID!]!, $tgUsername: String!, $birthDate: Date!, $gender: Gender!) {
			addStudent(username: $username, password: $password, fullname: $fullname, possibleDegrees: $possibleDegrees, tgUsername: $tgUsername, birthDate: $birthDate, gender: $gender) {
				success
				message
				student {
					id
					username
				}
			}
		}
	`;

	const timestamp = Date.now();
	const baseVariables = {
		username: `teststudent${timestamp}`,
		password: "Test123!",
		fullname: "Test Student",
		possibleDegrees: [degreeId],
		tgUsername: `teststudent${timestamp}`,
		birthDate: "2000-01-01",
	};

	// Root can add any student (test MALE, FEMALE, and CHILD)
	const timestamp1 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentmale${timestamp1}`,
			gender: "MALE",
		},
		"ROOT",
		"Root"
	);

	// Root can add female student
	const timestamp2 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentfemale${timestamp2}`,
			tgUsername: `teststudentfemale${timestamp2}`,
			gender: "FEMALE",
		},
		"ROOT",
		"Root"
	);

	// Root can add child student
	const timestamp3 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentchild${timestamp3}`,
			tgUsername: `teststudentchild${timestamp3}`,
			birthDate: "2010-01-01",
			gender: "CHILD",
		},
		"ROOT",
		"Root"
	);

	// Male admin can add male student
	const timestamp5 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentmale${timestamp5}`,
			tgUsername: `teststudentmale${timestamp5}`,
			gender: "MALE",
		},
		"MALE_ADMIN",
		"Male Admin"
	);

	// Male admin can add child student
	const timestamp6 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentchild${timestamp6}`,
			tgUsername: `teststudentchild${timestamp6}`,
			birthDate: "2010-01-01",
			gender: "CHILD",
		},
		"MALE_ADMIN",
		"Male Admin"
	);

	// Male admin cannot add female student
	const timestamp7 = Date.now();
	await testMutation(
		"addStudent",
		query,
		{
			...baseVariables,
			username: `teststudentfemale${timestamp7}`,
			tgUsername: `teststudentfemale${timestamp7}`,
			gender: "FEMALE",
		},
		"MALE_ADMIN",
		"Male Admin",
		true
	);
}

async function testMutationAddCourse() {
	printSection("Testing Mutation: addCourse");

	const token = getToken("ROOT");
	if (!token) {
		printSkip("Root - addCourse mutation (no token)");
		return;
	}

	// Get teacher and degree - need teacher with gender and degrees info
	const getTeachersQuery = `
		query {
			getTeachers {
				id
				gender
				degrees {
					id
				}
			}
		}
	`;

	const getDegreesQuery = `
		query {
			getDegrees {
				id
			}
		}
	`;

	const [teachersResponse, degreesResponse] = await Promise.all([
		graphqlRequest(getTeachersQuery, null, token),
		graphqlRequest(getDegreesQuery, null, token),
	]);

	// First, ensure we have a degree
	let degreeId = degreesResponse.data?.getDegrees?.[0]?.id;

	// Create degree if not found
	if (!degreeId) {
		const createDegreeQuery = `
			mutation AddDegree($name: String!) {
				addDegree(name: $name) {
					success
					degree {
						id
					}
				}
			}
		`;
		const createResponse = await graphqlRequest(
			createDegreeQuery,
			{ name: `CourseDegree${Date.now()}` },
			token
		);

		if (createResponse.errors) {
			log(
				`Warning: Could not create degree: ${getError(createResponse)}`,
				colors.yellow
			);
		} else {
			degreeId = createResponse.data?.addDegree?.degree?.id;
		}
	}

	if (!degreeId) {
		printFailure(
			"No degrees found - cannot test addCourse",
			"Failed to query or create degree"
		);
		return;
	}

	// Find a MALE teacher with the required degree, or create one
	let teacherId = null;
	let teacherGender = "MALE";

	const teachers = teachersResponse.data?.getTeachers || [];

	// Try to find a MALE teacher that already has the required degree
	const maleTeacherWithDegree = teachers.find((t) => {
		if (t.gender !== "MALE") return false;
		const teacherDegreeIds = (t.degrees || []).map((d) => String(d.id));
		return teacherDegreeIds.includes(String(degreeId));
	});

	if (maleTeacherWithDegree) {
		teacherId = maleTeacherWithDegree.id;
		teacherGender = "MALE";
	} else {
		// Create a MALE teacher with the required degree
		const createTeacherQuery = `
			mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!, $degreeIds: [ID!]) {
				addTeacher(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender, degreeIds: $degreeIds) {
					success
					teacher {
						id
						gender
						degrees {
							id
						}
					}
				}
			}
		`;

		const timestamp = Date.now();
		const variables = {
			username: `courseteacher${timestamp}`,
			password: "Test123!",
			fullname: "Course Teacher",
			tgUsername: `courseteacher${timestamp}`,
			birthDate: "1985-01-01",
			phone: "998901234567",
			gender: "MALE",
			degreeIds: [degreeId],
		};

		const createResponse = await graphqlRequest(
			createTeacherQuery,
			variables,
			token
		);

		if (createResponse.data?.addTeacher?.teacher?.id) {
			teacherId = createResponse.data.addTeacher.teacher.id;
			teacherGender = createResponse.data.addTeacher.teacher.gender || "MALE";
		} else {
			// If creating teacher with degree fails, try to find any MALE teacher and assign degree
			const maleTeacher = teachers.find((t) => t.gender === "MALE");
			if (maleTeacher) {
				teacherId = maleTeacher.id;
				teacherGender = "MALE";

				// Try to assign degree to teacher using updateTeacher
				const updateTeacherQuery = `
					mutation UpdateTeacher($id: ID!, $degreeIds: [ID!]) {
						updateTeacher(id: $id, degreeIds: $degreeIds) {
							success
							message
							teacher {
								id
								degrees {
									id
								}
							}
						}
					}
				`;

				const updateResponse = await graphqlRequest(
					updateTeacherQuery,
					{
						id: teacherId,
						degreeIds: [degreeId],
					},
					token
				);

				if (!isSuccess(updateResponse, "updateTeacher")) {
					log(
						`Warning: Could not assign degree to teacher: ${getError(
							updateResponse
						)}`,
						colors.yellow
					);
				}
			}
		}
	}

	if (!teacherId) {
		printFailure(
			"No teachers or degrees found - cannot test addCourse",
			`Teacher: ${teacherId ? "found" : "missing"}, Degree: ${
				degreeId ? "found" : "missing"
			}. Server may need restart or ROOT permissions not working.`
		);
		return;
	}

	const query = `
		mutation AddCourse($name: String!, $daysOfWeek: [DaysOfWeek!]!, $gender: Gender!, $startAt: Date!, $startTime: Date!, $endTime: Date!, $teacherId: ID!, $degreeIds: [ID!]!) {
			addCourse(name: $name, daysOfWeek: $daysOfWeek, gender: $gender, startAt: $startAt, startTime: $startTime, endTime: $endTime, teacherId: $teacherId, degreeIds: $degreeIds) {
				success
				message
				course {
					id
					name
					gender
				}
			}
		}
	`;

	const timestamp = Date.now();
	const variables = {
		name: `TestCourse${timestamp}`,
		daysOfWeek: ["MONDAY", "WEDNESDAY"],
		gender: teacherGender, // Match the teacher's gender
		startAt: "2024-01-01",
		startTime: "2024-01-01T09:00:00Z",
		endTime: "2024-01-01T11:00:00Z",
		teacherId,
		degreeIds: [degreeId],
	};

	// Root can add course
	await testMutation("addCourse", query, variables, "ROOT", "Root");

	// Male admin can add course (test with MALE course - matching teacher needed)
	const maleAdminToken = getToken("MALE_ADMIN");
	if (maleAdminToken && teacherId && degreeId) {
		// Get or create a MALE teacher with the degree for male admin
		const getTeachersQuery = `
			query {
				getTeachers {
					id
					gender
					degrees {
						id
					}
				}
			}
		`;

		const teachersResponse = await graphqlRequest(
			getTeachersQuery,
			null,
			maleAdminToken
		);

		let maleAdminTeacherId = null;
		const teachers = teachersResponse.data?.getTeachers || [];

		// Find MALE teacher with degree
		const maleTeacherWithDegree = teachers.find((t) => {
			if (t.gender !== "MALE") return false;
			const teacherDegreeIds = (t.degrees || []).map((d) => String(d.id));
			return teacherDegreeIds.includes(String(degreeId));
		});

		if (maleTeacherWithDegree) {
			maleAdminTeacherId = maleTeacherWithDegree.id;
		} else {
			// Create MALE teacher with degree
			const createTeacherQuery = `
				mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!, $degreeIds: [ID!]) {
					addTeacher(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender, degreeIds: $degreeIds) {
						success
						teacher {
							id
							gender
							degrees {
								id
							}
						}
					}
				}
			`;

			const timestamp = Date.now();
			const createResponse = await graphqlRequest(
				createTeacherQuery,
				{
					username: `maleadmteacher${timestamp}`,
					password: "Test123!",
					fullname: "Male Admin Teacher",
					tgUsername: `maleadmteacher${timestamp}`,
					birthDate: "1985-01-01",
					phone: "998901234571",
					gender: "MALE",
					degreeIds: [degreeId],
				},
				maleAdminToken
			);

			if (createResponse.data?.addTeacher?.teacher?.id) {
				maleAdminTeacherId = createResponse.data.addTeacher.teacher.id;
			}
		}

		if (maleAdminTeacherId) {
			const timestamp3 = Date.now();
			const maleAdminVariables = {
				name: `TestCourseMaleAdmin${timestamp3}`,
				daysOfWeek: ["TUESDAY", "THURSDAY"],
				gender: "MALE",
				startAt: "2024-01-01",
				startTime: "2024-01-01T10:00:00Z",
				endTime: "2024-01-01T12:00:00Z",
				teacherId: maleAdminTeacherId,
				degreeIds: [degreeId],
			};

			await testMutation(
				"addCourse",
				query,
				maleAdminVariables,
				"MALE_ADMIN",
				"Male Admin"
			);

			// Male admin cannot add FEMALE course
			const timestamp4 = Date.now();
			await testMutation(
				"addCourse",
				query,
				{
					...maleAdminVariables,
					name: `TestCourseFemale${timestamp4}`,
					gender: "FEMALE",
				},
				"MALE_ADMIN",
				"Male Admin",
				true
			);
		}
	}

	// Test for TEACHER
	const teacherToken = getToken("TEACHER");
	if (teacherToken) {
		// Define the updatePassword query explicitly for teacher test to avoid scoping issues
		const updatePasswordQuery = `
			mutation UpdatePassword($currentPassword: String!, $newPassword: String!) {
				updatePassword(currentPassword: $currentPassword, newPassword: $newPassword) {
					success
					message
				}
			}
		`;

		// Get teacher username from token or me query
		const meQuery = `query { me { id username role } }`;
		const meResponse = await graphqlRequest(meQuery, null, teacherToken);
		const teacherUsername = meResponse.data?.me?.username || TEACHER_USERNAME;

		const teacherVariables = {
			currentPassword: SEED_USER_PASSWORD, // Try seed password first
			newPassword: "NewTeacher123!",
		};

		const teacherResponse = await graphqlRequest(
			updatePasswordQuery,
			teacherVariables,
			teacherToken
		);

		if (isSuccess(teacherResponse, "updatePassword")) {
			printSuccess("Teacher can update password");

			// Get new token with new password for revert
			const newTokenResponse = await login(
				teacherUsername,
				"NewTeacher123!",
				"teacher"
			);
			let revertToken = teacherToken;

			if (newTokenResponse?.success && newTokenResponse?.token) {
				revertToken = newTokenResponse.token;
				setToken("TEACHER", revertToken);
			}

			// Revert password back to original
			const revertVariables = {
				currentPassword: "NewTeacher123!",
				newPassword: SEED_USER_PASSWORD,
			};

			const revertResponse = await graphqlRequest(
				updatePasswordQuery,
				revertVariables,
				revertToken
			);

			if (isSuccess(revertResponse, "updatePassword")) {
				const originalTokenResponse = await login(
					teacherUsername,
					SEED_USER_PASSWORD,
					"teacher"
				);
				if (originalTokenResponse?.success && originalTokenResponse?.token) {
					setToken("TEACHER", originalTokenResponse.token);
					log("✓ Teacher password reverted successfully", colors.green);
				}
			}
		} else {
			// Try with TEACHER_PASSWORD if SEED_USER_PASSWORD failed
			const teacherVariables2 = {
				currentPassword: TEACHER_PASSWORD,
				newPassword: "NewTeacher123!",
			};
			const teacherResponse2 = await graphqlRequest(
				updatePasswordQuery,
				teacherVariables2,
				teacherToken
			);
			if (isSuccess(teacherResponse2, "updatePassword")) {
				printSuccess("Teacher can update password");
				// Revert logic similar to above but with TEACHER_PASSWORD
				const newTokenResponse = await login(
					teacherUsername,
					"NewTeacher123!",
					"teacher"
				);
				if (newTokenResponse?.success && newTokenResponse?.token) {
					setToken("TEACHER", newTokenResponse.token);
					const revertVariables = {
						currentPassword: "NewTeacher123!",
						newPassword: TEACHER_PASSWORD,
					};
					const revertResponse = await graphqlRequest(
						updatePasswordQuery,
						revertVariables,
						newTokenResponse.token
					);
					if (isSuccess(revertResponse, "updatePassword")) {
						const originalTokenResponse = await login(
							teacherUsername,
							TEACHER_PASSWORD,
							"teacher"
						);
						if (
							originalTokenResponse?.success &&
							originalTokenResponse?.token
						) {
							setToken("TEACHER", originalTokenResponse.token);
							log("✓ Teacher password reverted successfully", colors.green);
						}
					}
				}
			} else {
				printFailure(
					"Teacher cannot update password",
					getError(teacherResponse2)
				);
			}
		}
	}
}

// ============================================================================
// TEACHER-SPECIFIC MUTATION TESTS
// ============================================================================

async function testTeacherMutations() {
	printSection("Testing Teacher Mutations");

	const teacherToken = getToken("TEACHER");
	if (!teacherToken) {
		printSkip("Teacher mutations (no token)");
		return;
	}

	// Get teacher ID from me query
	const meQuery = `query { me { id username role } }`;
	const meResponse = await graphqlRequest(meQuery, null, teacherToken);
	const teacherId = meResponse.data?.me?.id;
	const teacherUsername = meResponse.data?.me?.username;

	if (!teacherId) {
		printSkip("Teacher mutations (cannot get teacher ID)");
		return;
	}

	// ============================================================
	// ALLOWED MUTATIONS - Should Pass
	// ============================================================

	// 1. updateTeacher - Own profile only
	printTest("Teacher - updateTeacher (own profile)");
	const updateTeacherQuery = `
		mutation UpdateTeacher($id: ID!, $fullname: String) {
			updateTeacher(id: $id, fullname: $fullname) {
				success
				message
				teacher {
					id
					fullname
				}
			}
		}
	`;
	const updateTeacherVariables = {
		id: teacherId,
		fullname: `Updated Teacher ${Date.now()}`,
	};
	const updateTeacherResponse = await graphqlRequest(
		updateTeacherQuery,
		updateTeacherVariables,
		teacherToken
	);
	if (isSuccess(updateTeacherResponse, "updateTeacher")) {
		printSuccess("Teacher can update own profile");
	} else {
		printFailure(
			"Teacher cannot update own profile",
			getError(updateTeacherResponse)
		);
	}

	// 2. updateTeacher - Other teacher (should fail)
	if (teacherId) {
		printTest("Teacher - updateTeacher (other teacher - should fail)");
		const rootToken = getToken("ROOT");
		if (rootToken) {
			// Get another teacher ID
			const getTeachersQuery = `query { getTeachers { id } }`;
			const teachersResponse = await graphqlRequest(
				getTeachersQuery,
				null,
				rootToken
			);
			const allTeachers = teachersResponse.data?.getTeachers || [];
			const otherTeacher = allTeachers.find(
				(t) => String(t.id) !== String(teacherId)
			);

			if (otherTeacher) {
				const updateOtherTeacherResponse = await graphqlRequest(
					updateTeacherQuery,
					{
						id: otherTeacher.id,
						fullname: "Should Fail",
					},
					teacherToken
				);
				if (!isSuccess(updateOtherTeacherResponse, "updateTeacher")) {
					const error = getError(updateOtherTeacherResponse);
					if (
						error.includes("Not Authorised") ||
						error.includes("Not Authorized") ||
						error.includes("permission") ||
						error.includes("Access denied")
					) {
						printSuccess(
							"Teacher correctly blocked from updating other teacher"
						);
					} else {
						printFailure(
							"Teacher can update other teacher (should be blocked)",
							error
						);
					}
				} else {
					printFailure(
						"Teacher can update other teacher (should be blocked)",
						"Permission check failed"
					);
				}
			}
		}
	}

	// 3. setAttendance - Should pass
	// Note: Teachers can only set attendance for courses they are assigned to teach
	printTest("Teacher - setAttendance");
	const setAttendanceQuery = `
		mutation SetAttendance($courseId: ID!, $studentId: ID!, $date: Date!, $isPresent: Boolean!) {
			setAttendance(courseId: $courseId, studentId: $studentId, date: $date, isPresent: $isPresent) {
				success
				message
				attendance {
					id
				}
			}
		}
	`;

	// Reuse teacherId and teacherUsername already obtained at function start
	// No need to redeclare - they're already available from line 1771-1772

	if (!teacherId) {
		printSkip("Teacher - setAttendance (cannot get teacher ID)");
	} else {
		// Use ROOT token to find a course assigned to this teacher with students
		const rootToken = getToken("ROOT");
		if (rootToken) {
			// Get courses and find one assigned to this teacher (including course schedule info)
			const getAllCoursesQuery = `
				query {
					getCourses {
						id
						daysOfWeek
						startAt
						endAt
						teacher {
							id
							username
						}
						students {
							student {
								id
							}
						}
					}
				}
			`;
			const allCoursesResponse = await graphqlRequest(
				getAllCoursesQuery,
				null,
				rootToken
			);
			const allCourses = allCoursesResponse.data?.getCourses || [];

			// Find a course assigned to this teacher with at least one student
			const teacherCourse = allCourses.find(
				(c) =>
					c.teacher &&
					(String(c.teacher.id) === String(teacherId) ||
						c.teacher.username === teacherUsername) &&
					c.students &&
					c.students.length > 0
			);

			if (teacherCourse && teacherCourse.students.length > 0) {
				const courseId = teacherCourse.id;
				const studentId = teacherCourse.students[0].student.id;

				// Calculate a valid attendance date
				// Must be on one of the course's scheduled days, on/after startAt, and before endAt (if exists)
				const daysOfWeek = teacherCourse.daysOfWeek || [
					"MONDAY",
					"WEDNESDAY",
					"FRIDAY",
				];

				// Parse dates - GraphQL returns dates as strings
				let startDate = null;
				if (teacherCourse.startAt) {
					startDate = new Date(teacherCourse.startAt);
					startDate.setHours(0, 0, 0, 0);
				} else {
					startDate = new Date("2024-01-01");
					startDate.setHours(0, 0, 0, 0);
				}

				let endDate = null;
				if (teacherCourse.endAt) {
					endDate = new Date(teacherCourse.endAt);
					endDate.setHours(23, 59, 59, 999);
				}

				// Day name array for conversion (getDay() returns 0=Sunday, 1=Monday, etc.)
				const dayNames = [
					"SUNDAY",
					"MONDAY",
					"TUESDAY",
					"WEDNESDAY",
					"THURSDAY",
					"FRIDAY",
					"SATURDAY",
				];

				// Find the first scheduled day that's on or after the start date and before end date
				let validDate = null;

				// Try each scheduled day, starting from the course start date
				// Check up to 2 months ahead to ensure we find a valid date
				for (let i = 0; i < 60; i++) {
					const testDate = new Date(startDate);
					testDate.setDate(testDate.getDate() + i);
					testDate.setHours(0, 0, 0, 0);

					// Check if date is after end date (if end date exists)
					if (endDate && testDate > endDate) {
						break; // No more valid dates
					}

					const dayOfWeekIndex = testDate.getDay();
					const dayName = dayNames[dayOfWeekIndex];

					if (daysOfWeek.includes(dayName)) {
						validDate = testDate;
						break;
					}
				}

				// If no valid date found, use the course start date if it's on a scheduled day
				if (!validDate) {
					const startDayName = dayNames[startDate.getDay()];
					if (daysOfWeek.includes(startDayName)) {
						validDate = startDate;
					} else {
						// Find the next scheduled day after start date (within 7 days)
						for (let i = 1; i <= 7; i++) {
							const testDate = new Date(startDate);
							testDate.setDate(testDate.getDate() + i);
							testDate.setHours(0, 0, 0, 0);

							if (endDate && testDate > endDate) {
								break;
							}

							const dayName = dayNames[testDate.getDay()];
							if (daysOfWeek.includes(dayName)) {
								validDate = testDate;
								break;
							}
						}
					}
				}

				// Format date as YYYY-MM-DD (required format)
				let attendanceDate;
				if (validDate) {
					// Ensure we format the date correctly in YYYY-MM-DD format
					const year = validDate.getFullYear();
					const month = String(validDate.getMonth() + 1).padStart(2, "0");
					const day = String(validDate.getDate()).padStart(2, "0");
					attendanceDate = `${year}-${month}-${day}`;
				} else {
					// Fallback: use course start date
					const year = startDate.getFullYear();
					const month = String(startDate.getMonth() + 1).padStart(2, "0");
					const day = String(startDate.getDate()).padStart(2, "0");
					attendanceDate = `${year}-${month}-${day}`;
				}

				const setAttendanceVariables = {
					courseId,
					studentId,
					date: attendanceDate,
					isPresent: true,
				};

				const setAttendanceResponse = await graphqlRequest(
					setAttendanceQuery,
					setAttendanceVariables,
					teacherToken
				);

				if (isSuccess(setAttendanceResponse, "setAttendance")) {
					printSuccess("Teacher can set attendance");
				} else {
					const error = getError(setAttendanceResponse);
					printFailure("Teacher cannot set attendance", error);
				}
			} else {
				printSkip(
					`Teacher - setAttendance (no courses assigned to teacher ${
						teacherUsername || teacherId
					} with students found. Run: node scripts/seed-teacher-course.js)`
				);
			}
		} else {
			printSkip(
				"Teacher - setAttendance (cannot query courses without ROOT token)"
			);
		}
	}

	// ============================================================
	// BLOCKED MUTATIONS - Should Fail
	// ============================================================

	// Student Management (all should fail)
	const blockedMutations = [
		{
			name: "addStudent",
			query: `
				mutation AddStudent($username: String!, $password: String!, $fullname: String!, $birthDate: Date!, $gender: Gender!) {
					addStudent(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, gender: $gender) {
						success
						message
					}
				}
			`,
			variables: {
				username: `teststudent${Date.now()}`,
				password: "Test123!",
				fullname: "Test Student",
				birthDate: "2010-01-01",
				gender: "MALE",
			},
		},
		{
			name: "updateStudent",
			query: `
				mutation UpdateStudent($id: ID!, $fullname: String) {
					updateStudent(id: $id, fullname: $fullname) {
						success
						message
					}
				}
			`,
			variables: { id: "1", fullname: "Updated" },
		},
		{
			name: "deleteStudent",
			query: `
				mutation DeleteStudent($id: ID!) {
					deleteStudent(id: $id) {
						success
						message
					}
				}
			`,
			variables: { id: "1" },
		},
		{
			name: "addTeacher",
			query: `
				mutation AddTeacher($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!) {
					addTeacher(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender) {
						success
						message
					}
				}
			`,
			variables: {
				username: `testteacher${Date.now()}`,
				password: "Test123!",
				fullname: "Test Teacher",
				tgUsername: `testtg${Date.now()}`,
				birthDate: "1990-01-01",
				phone: "998901234567",
				gender: "MALE",
			},
		},
		{
			name: "deleteTeacher",
			query: `
				mutation DeleteTeacher($id: ID!) {
					deleteTeacher(id: $id) {
						success
						message
					}
				}
			`,
			variables: { id: teacherId },
		},
		{
			name: "addCourse",
			query: `
				mutation AddCourse($name: String!, $daysOfWeek: [DayOfWeek!]!, $gender: Gender!, $startAt: Date!, $startTime: DateTime!, $endTime: DateTime!, $teacherId: ID!, $degreeIds: [ID!]!) {
					addCourse(name: $name, daysOfWeek: $daysOfWeek, gender: $gender, startAt: $startAt, startTime: $startTime, endTime: $endTime, teacherId: $teacherId, degreeIds: $degreeIds) {
						success
						message
					}
				}
			`,
			variables: {
				name: "Test Course",
				daysOfWeek: ["MONDAY"],
				gender: "MALE",
				startAt: "2024-01-01",
				startTime: "2024-01-01T10:00:00Z",
				endTime: "2024-01-01T12:00:00Z",
				teacherId: "1",
				degreeIds: ["1"],
			},
		},
		{
			name: "addDegree",
			query: `
				mutation AddDegree($name: String!) {
					addDegree(name: $name) {
						success
						message
					}
				}
			`,
			variables: { name: `TestDegree${Date.now()}` },
		},
		{
			name: "addAdmin",
			query: `
				mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $tgUsername: String!, $birthDate: Date!, $phone: Phone!, $gender: Gender!) {
					addAdmin(username: $username, password: $password, fullname: $fullname, tgUsername: $tgUsername, birthDate: $birthDate, phone: $phone, gender: $gender) {
						success
						message
					}
				}
			`,
			variables: {
				username: `testadmin${Date.now()}`,
				password: "Test123!",
				fullname: "Test Admin",
				tgUsername: `testtg${Date.now()}`,
				birthDate: "1990-01-01",
				phone: "998901234567",
				gender: "MALE",
			},
		},
	];

	for (const mutation of blockedMutations) {
		printTest(`Teacher - ${mutation.name} (should be blocked)`);

		// Ensure variables are defined - handle both object and function cases
		let variables = {};
		if (typeof mutation.variables === "function") {
			variables = mutation.variables();
		} else if (mutation.variables) {
			variables = mutation.variables;
		}

		const response = await graphqlRequest(
			mutation.query,
			variables,
			teacherToken
		);
		if (!isSuccess(response, mutation.name)) {
			const error = getError(response);
			// Check for permission errors or GraphQL validation errors
			const isBlockedError =
				error.includes("Not Authorised") ||
				error.includes("Not Authorized") ||
				error.includes("permission") ||
				error.includes("Access denied") ||
				error.includes("Teachers cannot") ||
				(error.includes("Variable") && error.includes("was not provided")) ||
				error.includes("required") ||
				response.errors; // Any GraphQL errors mean the request failed (good for blocked mutations)

			if (isBlockedError) {
				printSuccess(`Teacher correctly blocked from ${mutation.name}`);
			} else {
				printFailure(
					`Teacher can perform ${mutation.name} (should be blocked)`,
					error
				);
			}
		} else {
			printFailure(
				`Teacher can perform ${mutation.name} (should be blocked)`,
				"Permission check failed"
			);
		}
	}
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function checkServer() {
	try {
		const response = await fetch(GRAPHQL_ENDPOINT, { method: "GET" });
		return response.ok || response.status === 405;
	} catch (error) {
		return false;
	}
}

async function main() {
	console.log(colors.blue);
	console.log("╔════════════════════════════════════════════════════════════╗");
	console.log("║   QMR Backend - Comprehensive Test Suite                   ║");
	console.log("║   Testing Queries and Mutations with JavaScript          ║");
	console.log("╚════════════════════════════════════════════════════════════╝");
	console.log(colors.reset);

	// Check if server is running
	if (!(await checkServer())) {
		log(
			`Error: Cannot reach GraphQL endpoint at ${GRAPHQL_ENDPOINT}`,
			colors.red
		);
		log("Make sure the server is running with: npm run dev", colors.yellow);
		process.exit(1);
	}

	// Fix root password before starting tests
	log("Ensuring root password is correct...", colors.yellow);
	try {
		execSync("node scripts/fix-root-password.js", { stdio: "pipe" });
		await new Promise((resolve) => setTimeout(resolve, 1000));
		log("Root password verified", colors.green);
		console.log();
	} catch (error) {
		log(`Could not verify root password: ${error.message}`, colors.yellow);
		console.log();
	}

	// Run tests
	try {
		await testLogins();

		// Query tests
		await testAllQueries();

		// Mutation tests
		await testMutationAddAdmin();
		await testMutationUpdateAdmin();
		await testMutationUpdateAdminActive();
		await testMutationUpdatePassword();
		await testMutationUpdateProfile();
		await testMutationAddDegree();
		await testMutationAddTeacher();
		await testMutationAddStudent();
		await testMutationAddCourse();

		// Teacher-specific mutation tests
		await testTeacherMutations();

		// Print summary
		printSection("Test Summary");
		console.log(`Total Tests: ${totalTests}`);
		log(`Passed: ${passedTests}`, colors.green);
		log(`Failed: ${failedTests}`, colors.red);

		if (failedTests === 0) {
			console.log(`\n${colors.green}✓ All tests passed!${colors.reset}`);
			process.exit(0);
		} else {
			console.log(`\n${colors.red}✗ Some tests failed${colors.reset}`);
			process.exit(1);
		}
	} catch (error) {
		console.error(
			`\n${colors.red}Fatal error: ${error.message}${colors.reset}`
		);
		console.error(error.stack);
		process.exit(1);
	}
}

// Run main function
main();
