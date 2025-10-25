/**
 * Test with root user to check permissions
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function testWithRootUser() {
	console.log("🔍 Testing with root user...\n");

	// Login as root user
	console.log("1️⃣ Testing root login...");
	const rootLoginMutation = `
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

	const rootLoginResult = await fetch(GRAPHQL_ENDPOINT, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			query: rootLoginMutation,
			variables: {
				username: "root",
				password: "rootpass123",
				userType: "root",
			},
		}),
	});

	const rootLoginData = await rootLoginResult.json();
	console.log("Root login response:", JSON.stringify(rootLoginData, null, 2));

	if (rootLoginData.data?.login?.token) {
		const rootToken = rootLoginData.data.login.token;
		console.log(`\n🔑 Root token obtained: ${rootToken.substring(0, 20)}...`);

		// Test getTeachers with root token
		console.log("\n2️⃣ Testing getTeachers with root token...");
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
				Authorization: `Bearer ${rootToken}`,
			},
			body: JSON.stringify({ query: getTeachersQuery }),
		});

		const getTeachersData = await getTeachersResult.json();
		console.log(
			"Get teachers response:",
			JSON.stringify(getTeachersData, null, 2)
		);
	}
}

testWithRootUser().catch(console.error);
