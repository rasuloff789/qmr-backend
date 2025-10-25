/**
 * Debug permission checking for getTeachers
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function debugPermissions() {
	console.log("🔍 Debugging getTeachers permissions...\n");

	// First, let's see what users we can login with
	console.log("1️⃣ Testing available user logins...");

	const testUsers = [
		{ username: "admin", password: "admin123", userType: "admin" },
		{ username: "teacher", password: "teacher123", userType: "teacher" },
		{ username: "testadmin", password: "testpass123", userType: "admin" },
		{ username: "testteacher", password: "testpass123", userType: "teacher" },
	];

	let workingToken = null;
	let workingUser = null;

	for (const user of testUsers) {
		console.log(`   Testing ${user.username} (${user.userType})...`);

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
				variables: user,
			}),
		});

		const loginData = await loginResult.json();

		if (loginData.data?.login?.success) {
			console.log(`   ✅ ${user.username} login successful!`);
			workingToken = loginData.data.login.token;
			workingUser = loginData.data.login.user;
			break;
		} else {
			console.log(
				`   ❌ ${user.username} login failed: ${loginData.data?.login?.message}`
			);
		}
	}

	if (workingToken) {
		console.log(
			`\n🔑 Using token from ${workingUser.username} (${workingUser.role})`
		);
		console.log(`   Token: ${workingToken.substring(0, 20)}...`);

		// Test getTeachers with the working token
		console.log("\n2️⃣ Testing getTeachers with working token...");
		const getTeachersQuery = `
      query {
        getTeachers {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          department
          createdAt
        }
      }
    `;

		const getTeachersResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${workingToken}`,
			},
			body: JSON.stringify({ query: getTeachersQuery }),
		});

		const getTeachersData = await getTeachersResult.json();
		console.log(
			"Get teachers response:",
			JSON.stringify(getTeachersData, null, 2)
		);

		// Also test me query to see user details
		console.log("\n3️⃣ Testing me query to see user details...");
		const meQuery = `
      query {
        me {
          id
          username
          fullname
          role
          createdAt
        }
      }
    `;

		const meResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${workingToken}`,
			},
			body: JSON.stringify({ query: meQuery }),
		});

		const meData = await meResult.json();
		console.log("Me query response:", JSON.stringify(meData, null, 2));
	} else {
		console.log("\n❌ No working user found. Let me check what users exist...");

		// Try to get admins to see what users exist
		console.log("\n4️⃣ Checking existing admins...");
		const getAdminsQuery = `
      query {
        getAdmins {
          id
          username
          fullname
          isActive
          createdAt
        }
      }
    `;

		const getAdminsResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ query: getAdminsQuery }),
		});

		const getAdminsData = await getAdminsResult.json();
		console.log("Existing admins:", JSON.stringify(getAdminsData, null, 2));
	}
}

debugPermissions().catch(console.error);
