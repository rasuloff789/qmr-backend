/**
 * QMR Backend - Error Handling Test
 *
 * Tests the new structured error handling approach
 *
 * @author QMR Development Team
 * @version 1.0.0
 */

import fetch from "node-fetch";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "./src/utils/auth/password.js";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";
const prisma = new PrismaClient();

async function ensureRootUser() {
	try {
		const existingRoot = await prisma.root.findFirst({
			where: { username: "root" },
		});

		if (existingRoot) {
			return existingRoot;
		}

		const rootUser = await prisma.root.create({
			data: {
				username: "root",
				password: await hashPassword("rootpass123"),
				fullname: "System Root User",
			},
		});

		return rootUser;
	} catch (error) {
		console.error("❌ Error with root user:", error);
		throw error;
	}
}

async function testErrorHandling() {
	console.log("🚀 Testing New Error Handling System\n");

	let results = {
		validation: {},
		conflict: {},
		success: {},
		errors: [],
	};

	try {
		// Ensure root user exists
		await ensureRootUser();

		// Login as root
		console.log("1️⃣ Logging in as root user...");
		const loginMutation = `
			mutation Login($username: String!, $password: String!, $userType: String!) {
				login(username: $username, password: $password, userType: $userType) {
					success
					message
					token
					user {
						id
						username
						fullname
						role
						createdAt
					}
				}
			}
		`;

		const loginResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				query: loginMutation,
				variables: {
					username: "root",
					password: "rootpass123",
					userType: "root",
				},
			}),
		});

		const loginData = await loginResult.json();
		let rootToken = null;

		if (loginData.data?.login?.success) {
			rootToken = loginData.data.login.token;
			console.log("   ✅ Root login successful");
		} else {
			console.log("   ❌ Root login failed:", loginData.data?.login?.message);
			return;
		}

		// Test 1: Validation Errors
		console.log("\n2️⃣ Testing validation errors...");

		// Test invalid username
		console.log("   📋 Testing invalid username...");
		const invalidUsernameMutation = `
			mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $birthDate: Date!, $phone: Phone!, $tgUsername: String!) {
				addAdmin(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername) {
					success
					message
					admin {
						id
						username
						fullname
					}
					errors
					timestamp
				}
			}
		`;

		const invalidUsernameResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "ab", // Too short
					password: "TestPass123",
					fullname: "Test Admin",
					birthDate: "1990-01-01",
					phone: "998901234567",
					tgUsername: "testadmin",
				},
			}),
		});

		const invalidUsernameData = await invalidUsernameResult.json();
		results.validation.invalidUsername = {
			success: !invalidUsernameData.data?.addAdmin?.success,
			response: invalidUsernameData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.validation.invalidUsername.success ? "✅" : "❌"
			} Invalid username: ${
				results.validation.invalidUsername.success ? "PASSED" : "FAILED"
			}`
		);
		if (invalidUsernameData.data?.addAdmin?.errors) {
			console.log(
				`   Errors: ${invalidUsernameData.data.addAdmin.errors.join(", ")}`
			);
		}

		// Test invalid password
		console.log("   📋 Testing invalid password...");
		const invalidPasswordResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "testadmin",
					password: "weak", // Too weak
					fullname: "Test Admin",
					birthDate: "1990-01-01",
					phone: "998901234567",
					tgUsername: "testadmin",
				},
			}),
		});

		const invalidPasswordData = await invalidPasswordResult.json();
		results.validation.invalidPassword = {
			success: !invalidPasswordData.data?.addAdmin?.success,
			response: invalidPasswordData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.validation.invalidPassword.success ? "✅" : "❌"
			} Invalid password: ${
				results.validation.invalidPassword.success ? "PASSED" : "FAILED"
			}`
		);
		if (invalidPasswordData.data?.addAdmin?.errors) {
			console.log(
				`   Errors: ${invalidPasswordData.data.addAdmin.errors.join(", ")}`
			);
		}

		// Test invalid phone
		console.log("   📋 Testing invalid phone...");
		const invalidPhoneResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "testadmin",
					password: "TestPass123",
					fullname: "Test Admin",
					birthDate: "1990-01-01",
					phone: "123", // Invalid format
					tgUsername: "testadmin",
				},
			}),
		});

		const invalidPhoneData = await invalidPhoneResult.json();
		results.validation.invalidPhone = {
			success: !invalidPhoneData.data?.addAdmin?.success,
			response: invalidPhoneData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.validation.invalidPhone.success ? "✅" : "❌"
			} Invalid phone: ${
				results.validation.invalidPhone.success ? "PASSED" : "FAILED"
			}`
		);
		if (invalidPhoneData.data?.addAdmin?.errors) {
			console.log(
				`   Errors: ${invalidPhoneData.data.addAdmin.errors.join(", ")}`
			);
		}

		// Test 2: Conflict Errors
		console.log("\n3️⃣ Testing conflict errors...");

		// Create a valid admin first
		console.log("   📋 Creating valid admin for conflict test...");
		const validAdminResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "conflict" + Math.floor(Math.random() * 1000),
					password: "TestPass123",
					fullname: "Conflict Test Admin",
					birthDate: "1990-01-01",
					phone: "998901234567",
					tgUsername: "conflicttest",
				},
			}),
		});

		const validAdminData = await validAdminResult.json();
		results.success.validAdmin = {
			success: !!validAdminData.data?.addAdmin?.success,
			response: validAdminData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.success.validAdmin.success ? "✅" : "❌"
			} Valid admin creation: ${
				results.success.validAdmin.success ? "PASSED" : "FAILED"
			}`
		);

		// Now try to create another admin with the same username
		console.log("   📋 Testing duplicate username conflict...");
		const conflictResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "conflicttest", // Same username
					password: "TestPass123",
					fullname: "Another Admin",
					birthDate: "1990-01-01",
					phone: "998901234568",
					tgUsername: "anothertest",
				},
			}),
		});

		const conflictData = await conflictResult.json();
		results.conflict.duplicateUsername = {
			success: !conflictData.data?.addAdmin?.success,
			response: conflictData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.conflict.duplicateUsername.success ? "✅" : "❌"
			} Duplicate username: ${
				results.conflict.duplicateUsername.success ? "PASSED" : "FAILED"
			}`
		);
		if (conflictData.data?.addAdmin?.errors) {
			console.log(`   Errors: ${conflictData.data.addAdmin.errors.join(", ")}`);
		}

		// Test 3: Success Case
		console.log("\n4️⃣ Testing success case...");
		const successResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: invalidUsernameMutation,
				variables: {
					username: "test" + Math.floor(Math.random() * 1000),
					password: "TestPass123",
					fullname: "Success Test Admin",
					birthDate: "1990-01-01",
					phone: "998901234569",
					tgUsername: "successtest",
				},
			}),
		});

		const successData = await successResult.json();
		results.success.validCreation = {
			success: !!successData.data?.addAdmin?.success,
			response: successData.data?.addAdmin,
		};
		console.log(
			`   ${
				results.success.validCreation.success ? "✅" : "❌"
			} Valid creation: ${
				results.success.validCreation.success ? "PASSED" : "FAILED"
			}`
		);
		if (successData.data?.addAdmin?.admin) {
			console.log(
				`   Created admin: ${successData.data.addAdmin.admin.username}`
			);
		}

		// Summary
		console.log("\n📊 Error Handling Test Summary:");
		console.log("================================");

		const validationTests = Object.keys(results.validation);
		const conflictTests = Object.keys(results.conflict);
		const successTests = Object.keys(results.success);

		let passedValidation = 0;
		let passedConflict = 0;
		let passedSuccess = 0;

		console.log("\n📋 Validation Error Tests:");
		validationTests.forEach((test) => {
			const result = results.validation[test];
			const status = result.success ? "✅ PASSED" : "❌ FAILED";
			console.log(`   ${test}: ${status}`);
			if (result.success) passedValidation++;
		});

		console.log("\n🔄 Conflict Error Tests:");
		conflictTests.forEach((test) => {
			const result = results.conflict[test];
			const status = result.success ? "✅ PASSED" : "❌ FAILED";
			console.log(`   ${test}: ${status}`);
			if (result.success) passedConflict++;
		});

		console.log("\n✅ Success Tests:");
		successTests.forEach((test) => {
			const result = results.success[test];
			const status = result.success ? "✅ PASSED" : "❌ FAILED";
			console.log(`   ${test}: ${status}`);
			if (result.success) passedSuccess++;
		});

		console.log(`\n📈 Overall Results:`);
		console.log(
			`   Validation Errors: ${passedValidation}/${validationTests.length} passed`
		);
		console.log(
			`   Conflict Errors: ${passedConflict}/${conflictTests.length} passed`
		);
		console.log(
			`   Success Cases: ${passedSuccess}/${successTests.length} passed`
		);
		console.log(
			`   Total: ${passedValidation + passedConflict + passedSuccess}/${
				validationTests.length + conflictTests.length + successTests.length
			} passed`
		);

		console.log("\n🎉 Error handling test completed!");
	} catch (error) {
		console.error("❌ Test execution failed:", error);
		results.errors.push(error.message);
	} finally {
		await prisma.$disconnect();
	}
}

testErrorHandling().catch((error) => {
	console.error("❌ Test execution failed:", error);
	process.exit(1);
});
