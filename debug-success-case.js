/**
 * Debug success case to see what's happening
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

async function debugSuccessCase() {
	console.log("🔍 Debugging Success Case\n");

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

		// Test success case with detailed logging
		console.log("\n2️⃣ Testing success case with detailed logging...");
		const addAdminMutation = `
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

		const successResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({
				query: addAdminMutation,
				variables: {
					username: "test" + Math.floor(Math.random() * 1000),
					password: "TestPass123",
					fullname: "Debug Test Admin",
					birthDate: "1990-01-01",
					phone: "998901234567",
					tgUsername: "debugtest",
				},
			}),
		});

		const successData = await successResult.json();
		console.log("📊 Full Response:");
		console.log(JSON.stringify(successData, null, 2));

		if (successData.data?.addAdmin) {
			console.log("\n📋 AddAdmin Response:");
			console.log(`   Success: ${successData.data.addAdmin.success}`);
			console.log(`   Message: ${successData.data.addAdmin.message}`);
			console.log(
				`   Admin: ${successData.data.addAdmin.admin ? "Present" : "Null"}`
			);
			console.log(
				`   Errors: ${successData.data.addAdmin.errors?.length || 0} errors`
			);
			if (successData.data.addAdmin.errors?.length > 0) {
				console.log(
					`   Error Details: ${successData.data.addAdmin.errors.join(", ")}`
				);
			}
		}

		if (successData.errors) {
			console.log("\n❌ GraphQL Errors:");
			successData.errors.forEach((error, index) => {
				console.log(`   Error ${index + 1}: ${error.message}`);
				if (error.locations) {
					console.log(`   Locations: ${JSON.stringify(error.locations)}`);
				}
			});
		}
	} catch (error) {
		console.error("❌ Debug execution failed:", error);
	} finally {
		await prisma.$disconnect();
	}
}

debugSuccessCase().catch((error) => {
	console.error("❌ Debug execution failed:", error);
	process.exit(1);
});
