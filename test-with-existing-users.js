/**
 * Test with existing users from the database
 */

import fetch from "node-fetch";

const GRAPHQL_ENDPOINT = "http://localhost:4000/graphql";

async function testWithExistingUsers() {
	console.log("🔍 Testing with existing users...\n");

	// Test with existing admin users
	const existingUsers = [
		{ username: "admin34", password: "admin123", userType: "admin" },
		{ username: "farruxiy", password: "admin123", userType: "admin" },
		{ username: "admin123", password: "admin123", userType: "admin" },
		{ username: "admin1", password: "admin123", userType: "admin" },
	];

	let workingToken = null;
	let workingUser = null;

	for (const user of existingUsers) {
		console.log(`1️⃣ Testing ${user.username} (${user.userType})...`);

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

	if (workingToken && workingUser) {
		console.log(
			`\n🔑 Successfully logged in as ${workingUser.username} (${workingUser.role})`
		);
		console.log(`   User ID: ${workingUser.id}`);
		console.log(`   Token: ${workingToken.substring(0, 20)}...`);

		// Test all operations with the working user
		console.log("\n2️⃣ Testing all operations with authenticated user...\n");

		// Test me query
		console.log("📋 Testing me query...");
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
		console.log(
			`   ${meData.data?.me ? "✅" : "❌"} Me query: ${
				meData.data?.me ? "PASSED" : "FAILED"
			}`
		);
		if (meData.errors) {
			console.log(`   Error: ${meData.errors[0].message}`);
		}

		// Test getTeachers
		console.log("\n📋 Testing getTeachers query...");
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
			`   ${getTeachersData.data?.getTeachers ? "✅" : "❌"} Get teachers: ${
				getTeachersData.data?.getTeachers ? "PASSED" : "FAILED"
			}`
		);
		if (getTeachersData.errors) {
			console.log(`   Error: ${getTeachersData.errors[0].message}`);
		} else if (getTeachersData.data?.getTeachers) {
			console.log(
				`   Found ${getTeachersData.data.getTeachers.length} teachers`
			);
		}

		// Test getAdmins
		console.log("\n📋 Testing getAdmins query...");
		const getAdminsQuery = `
      query {
        getAdmins {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          isActive
          createdAt
        }
      }
    `;

		const getAdminsResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${workingToken}`,
			},
			body: JSON.stringify({ query: getAdminsQuery }),
		});

		const getAdminsData = await getAdminsResult.json();
		console.log(
			`   ${getAdminsData.data?.getAdmins ? "✅" : "❌"} Get admins: ${
				getAdminsData.data?.getAdmins ? "PASSED" : "FAILED"
			}`
		);
		if (getAdminsData.errors) {
			console.log(`   Error: ${getAdminsData.errors[0].message}`);
		} else if (getAdminsData.data?.getAdmins) {
			console.log(`   Found ${getAdminsData.data.getAdmins.length} admins`);
		}

		// Test getAdmin (specific)
		console.log("\n📋 Testing getAdmin query...");
		const getAdminQuery = `
      query GetAdmin($id: ID!) {
        getAdmin(id: $id) {
          id
          username
          fullname
          birthDate
          phone
          tgUsername
          isActive
          createdAt
        }
      }
    `;

		const getAdminResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${workingToken}`,
			},
			body: JSON.stringify({
				query: getAdminQuery,
				variables: { id: workingUser.id },
			}),
		});

		const getAdminData = await getAdminResult.json();
		console.log(
			`   ${getAdminData.data?.getAdmin ? "✅" : "❌"} Get admin: ${
				getAdminData.data?.getAdmin ? "PASSED" : "FAILED"
			}`
		);
		if (getAdminData.errors) {
			console.log(`   Error: ${getAdminData.errors[0].message}`);
		}

		// Test addAdmin mutation
		console.log("\n🔄 Testing addAdmin mutation...");
		const addAdminMutation = `
      mutation AddAdmin($username: String!, $password: String!, $fullname: String!, $birthDate: String!, $phone: String!, $tgUsername: String!) {
        addAdmin(username: $username, password: $password, fullname: $fullname, birthDate: $birthDate, phone: $phone, tgUsername: $tgUsername) {
          success
          message
          admin {
            id
            username
            fullname
            birthDate
            phone
            tgUsername
            isActive
            createdAt
          }
        }
      }
    `;

		const addAdminResult = await fetch(GRAPHQL_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${workingToken}`,
			},
			body: JSON.stringify({
				query: addAdminMutation,
				variables: {
					username: "testadmin" + Date.now(),
					password: "testpass123",
					fullname: "Test Admin",
					birthDate: "1990-01-01",
					phone: "+1234567890",
					tgUsername: "@testadmin",
				},
			}),
		});

		const addAdminData = await addAdminResult.json();
		console.log(
			`   ${addAdminData.data?.addAdmin?.success ? "✅" : "❌"} Add admin: ${
				addAdminData.data?.addAdmin?.success ? "PASSED" : "FAILED"
			}`
		);
		if (addAdminData.errors) {
			console.log(`   Error: ${addAdminData.errors[0].message}`);
		} else if (addAdminData.data?.addAdmin) {
			console.log(`   Message: ${addAdminData.data.addAdmin.message}`);
		}

		console.log("\n🎉 All tests completed!");
	} else {
		console.log("\n❌ No working user found. Cannot proceed with tests.");
	}
}

testWithExistingUsers().catch(console.error);
